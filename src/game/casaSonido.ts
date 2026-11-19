/**
 * Sonido de la casa de los gatitos: maullidos con los samples de la fiesta (`miau-gatito-1/2`) en un tono distinto
 * para cada gatito, el ronroneo mientras se frota, el bote de la pelota y una canción corta, generada por código,
 * cuando un gatito canta (si cantan dos a la vez, suenan a coro). Respeta el silencio y el volumen de efectos.
 */
import type { SampleBank } from "./catPartySamples";

export type Maullido = "pide" | "gracias" | "ahoraNo";

/** Tono de cada gatito (velocidad de reproducción del maullido): Miel en medio, Bruma más grave y Pino más agudo. */
export const TONO_GATITO: Readonly<Record<number, number>> = { 1: 1, 2: 0.84, 3: 1.2 };
export const tonoDe = (mundo: number) => TONO_GATITO[mundo] ?? 1;

/** Cada maullido usa su sample y un ajuste de tono: «gracias» sube, «ahora no» baja. */
export const MAULLIDOS: Readonly<Record<Maullido, { sample: "miau-gatito-1" | "miau-gatito-2"; tono: number; volumen: number }>> = {
  pide: { sample: "miau-gatito-2", tono: 1, volumen: 0.5 },
  gracias: { sample: "miau-gatito-1", tono: 1.15, volumen: 0.55 },
  ahoraNo: { sample: "miau-gatito-2", tono: 0.8, volumen: 0.4 },
};

/** Un gatito que pide no vuelve a maullar hasta pasado este tiempo. */
export const PIDE_CADA_MS = 9000;

/** Canción de cuatro notas (en semitonos sobre la nota del gatito) y su duración en segundos. */
export const CANCION = [0, 4, 7, 4] as const;
export const NOTA_S = 0.22;
const NOTA_BASE_HZ = 523.25; // do5
export const notaHz = (mundo: number, semitonos: number) => NOTA_BASE_HZ * tonoDe(mundo) * 2 ** (semitonos / 12);

type Ajustes = { silencio: boolean; volumen: number };

/** Motor de sonido de la casa. Se crea una vez por visita; el contexto de audio arranca con el primer toque. */
export function crearSonidoCasa(ajustesIniciales: Ajustes) {
  let ajustes = ajustesIniciales;
  let contexto: AudioContext | null = null;
  let salida: GainNode | null = null;
  let samples: SampleBank | null = null;
  let ronroneo: { parar: () => void } | null = null;
  const ultimoPide = new Map<number, number>();

  const preparar = () => {
    if (contexto) return contexto;
    const Constructor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Constructor) return null;
    contexto = new Constructor();
    salida = contexto.createGain();
    salida.gain.value = ajustes.volumen;
    salida.connect(contexto.destination);
    // Se cargan al usarse por primera vez (así las pruebas pueden leer los tonos sin cargar audio).
    void import("./catPartySamples").then(({ loadPartySamples }) => loadPartySamples()).then((banco) => { samples = banco; });
    return contexto;
  };
  const listo = () => {
    if (ajustes.silencio || ajustes.volumen <= 0) return null;
    const ctx = preparar();
    if (!ctx || !salida) return null;
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  };

  const tocarSample = (id: "miau-gatito-1" | "miau-gatito-2" | "plop-ovillo", tono: number, volumen: number) => {
    const ctx = listo();
    const buffer = samples?.[id];
    if (!ctx || !salida) return;
    if (!buffer) {
      // Sin samples todavía: un maullido sencillo con un oscilador que baja.
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(700 * tono, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(420 * tono, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(volumen * 0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain).connect(salida);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
      return;
    }
    const fuente = ctx.createBufferSource();
    const gain = ctx.createGain();
    fuente.buffer = buffer;
    fuente.playbackRate.value = tono;
    gain.gain.value = volumen;
    fuente.connect(gain).connect(salida);
    fuente.start();
  };

  return {
    /** Llamar en el primer toque de la jugadora: el navegador solo deja sonar tras un gesto. */
    despertar: () => { listo(); },
    ajustar(nuevos: Ajustes) {
      ajustes = nuevos;
      if (salida) salida.gain.value = nuevos.volumen;
      if (nuevos.silencio) ronroneo?.parar();
    },
    maullar(mundo: number, tipo: Maullido, ahora = performance.now()) {
      if (tipo === "pide") {
        const ultimo = ultimoPide.get(mundo) ?? -Infinity;
        if (ahora - ultimo < PIDE_CADA_MS) return;
        ultimoPide.set(mundo, ahora);
      }
      const maullido = MAULLIDOS[tipo];
      tocarSample(maullido.sample, tonoDe(mundo) * maullido.tono, maullido.volumen);
    },
    bote() { tocarSample("plop-ovillo", 1, 0.5); },
    /** Canción corta del gatito que canta. */
    cantar(mundo: number) {
      const ctx = listo();
      if (!ctx || !salida) return;
      CANCION.forEach((semitonos, indice) => {
        const inicio = ctx.currentTime + indice * NOTA_S;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = notaHz(mundo, semitonos);
        gain.gain.setValueAtTime(0.0001, inicio);
        gain.gain.exponentialRampToValueAtTime(0.12, inicio + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, inicio + NOTA_S * 0.95);
        osc.connect(gain).connect(salida!);
        osc.start(inicio);
        osc.stop(inicio + NOTA_S);
      });
    },
    /** Ronroneo grave y ondulado mientras se frota; se para al soltar. */
    ronronear(activo: boolean) {
      if (!activo) { ronroneo?.parar(); ronroneo = null; return; }
      if (ronroneo) return;
      const ctx = listo();
      if (!ctx || !salida) return;
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const profundidad = ctx.createGain();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = 48;
      lfo.frequency.value = 22;
      profundidad.gain.value = 0.06;
      gain.gain.value = 0.06;
      lfo.connect(profundidad).connect(gain.gain);
      const filtro = ctx.createBiquadFilter();
      filtro.type = "lowpass";
      filtro.frequency.value = 260;
      osc.connect(filtro).connect(gain).connect(salida);
      osc.start();
      lfo.start();
      ronroneo = { parar: () => { gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05); osc.stop(ctx.currentTime + 0.2); lfo.stop(ctx.currentTime + 0.2); } };
    },
    cerrar() {
      ronroneo?.parar();
      ronroneo = null;
      void contexto?.close();
      contexto = null;
    },
  };
}
export type SonidoCasa = ReturnType<typeof crearSonidoCasa>;
