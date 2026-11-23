/**
 * Sonido de la casa de los gatitos: maullidos con los samples de la fiesta (`miau-gatito-1/2`) en un tono distinto
 * para cada gatito, el ronroneo mientras se frota, el bote de la pelota y una canción corta, generada por código,
 * cuando un gatito canta (si cantan dos a la vez, suenan a coro). Respeta el silencio y el volumen de efectos.
 */
import type { SampleBank } from "./catPartySamples";
import { busDeZona, contextoAudio, soltarBus } from "./audio.ts";

export type Maullido = "pide" | "gracias" | "ahoraNo";

/**
 * Tono de cada gatito (velocidad de reproducción del maullido): Miel en medio, Bruma más grave y Pino más agudo; los
 * demás, repartidos entre 0,8 y 1,26 para que no haya dos iguales.
 */
export const TONO_GATITO: Readonly<Record<number, number>> = {
  1: 1, 2: 0.84, 3: 1.2, 4: 1.06, 5: 0.88, 6: 0.92, 7: 1.14, 8: 1.1, 9: 1.03, 10: 0.96,
  11: 1.08, 12: 1.24, 13: 0.9, 14: 1.12, 15: 0.8, 16: 1.17, 17: 1.26,
};
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

/** Sonidos del baño (mapa «El baño de la casa de los gatitos»). */
export type BucleBano = "agua" | "secador";
export type GolpeBano = "burbuja" | "cepillo" | "campanita";
export type EventoBano = "nada" | "avanza" | "frotando" | "todaviaNo" | "pasoHecho" | "terminado";
export type UtensilioSonido = "alcachofa" | "jabon" | "secador" | "peine";
/** Un golpe corto como mucho cada este tiempo, para que frotar no suene a ametralladora. */
export const GOLPE_BANO_CADA_MS = 160;

/**
 * Qué suena en el baño con cada aviso de la pantalla: un sonido continuo mientras se frota (agua con la alcachofa,
 * aire con el secador), golpes cortos (burbujas con el jabón, cepillo con el peine, campanita al acabar un paso) y
 * maullidos («ahora no» con el utensilio equivocado, «gracias» y canción al terminar). `bucle: undefined` deja el que haya.
 */
export function sonidoDelBano(evento: EventoBano, utensilio: UtensilioSonido | null): { bucle?: BucleBano | null; golpe?: GolpeBano; maullido?: "ahoraNo" | "gracias"; cantar?: boolean } {
  if (evento === "nada") return { bucle: null };
  if (evento === "todaviaNo") return { bucle: null, maullido: "ahoraNo" };
  if (evento === "pasoHecho") return { bucle: null, golpe: "campanita" };
  if (evento === "terminado") return { bucle: null, maullido: "gracias", cantar: true };
  if (utensilio === "alcachofa") return { bucle: "agua" };
  if (utensilio === "secador") return { bucle: "secador" };
  if (utensilio === "jabon") return { golpe: "burbuja" };
  if (utensilio === "peine") return { golpe: "cepillo" };
  return {};
}

/** Motor de sonido de la casa. Se crea una vez por visita; el contexto de audio arranca con el primer toque. */
export function crearSonidoCasa(ajustesIniciales: Ajustes) {
  let ajustes = ajustesIniciales;
  let contexto: AudioContext | null = null;
  let salida: GainNode | null = null;
  let samples: SampleBank | null = null;
  let ronroneo: { parar: () => void } | null = null;
  let bucle: { tipo: BucleBano; parar: () => void } | null = null;
  let ultimoGolpe = -Infinity;
  const ultimoPide = new Map<number, number>();

  const preparar = () => {
    if (contexto) return contexto;
    contexto = contextoAudio();
    if (!contexto) return null;
    salida = busDeZona(contexto, ajustes.volumen);
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
    /** «Fiu» de la pluma al moverla deprisa: un silbido corto que sube. */
    fiu() {
      const ctx = listo();
      if (!ctx || !salida) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.connect(gain).connect(salida);
      osc.start();
      osc.stop(ctx.currentTime + 0.17);
    },
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
    /** Sonido continuo del baño (agua o secador); `null` lo para. */
    bucleBano(tipo: BucleBano | null) {
      if (bucle?.tipo === tipo) return;
      bucle?.parar();
      bucle = null;
      const ctx = tipo ? listo() : null;
      if (!tipo || !ctx || !salida) return;
      const ruido = ctx.createBufferSource();
      const muestras = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const datos = muestras.getChannelData(0);
      for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
      ruido.buffer = muestras;
      ruido.loop = true;
      const filtro = ctx.createBiquadFilter();
      filtro.type = tipo === "agua" ? "highpass" : "bandpass";
      filtro.frequency.value = tipo === "agua" ? 1800 : 700;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(tipo === "agua" ? 0.08 : 0.06, ctx.currentTime, 0.05);
      ruido.connect(filtro).connect(gain).connect(salida);
      ruido.start();
      bucle = { tipo, parar: () => { gain.gain.setTargetAtTime(0, ctx.currentTime, 0.06); ruido.stop(ctx.currentTime + 0.3); } };
    },
    /** Golpe corto del baño: burbuja, cepillo o campanita (como mucho uno cada `GOLPE_BANO_CADA_MS`). */
    golpeBano(tipo: GolpeBano, ahora = performance.now()) {
      if (tipo !== "campanita" && ahora - ultimoGolpe < GOLPE_BANO_CADA_MS) return;
      ultimoGolpe = ahora;
      const ctx = listo();
      if (!ctx || !salida) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const inicio = ctx.currentTime;
      if (tipo === "burbuja") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(380 + Math.random() * 240, inicio);
        osc.frequency.exponentialRampToValueAtTime(900 + Math.random() * 300, inicio + 0.08);
        gain.gain.setValueAtTime(0.08, inicio);
        gain.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.1);
      } else if (tipo === "cepillo") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(1600, inicio);
        gain.gain.setValueAtTime(0.025, inicio);
        gain.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.05);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(1318.5, inicio);
        osc.frequency.setValueAtTime(1760, inicio + 0.09);
        gain.gain.setValueAtTime(0.1, inicio);
        gain.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.35);
      }
      osc.connect(gain).connect(salida);
      osc.start(inicio);
      osc.stop(inicio + 0.4);
    },
    /** «Toc, toc» en la puerta: dos golpes graves de madera. */
    toc() {
      const ctx = listo();
      if (!ctx || !salida) return;
      [0, 0.22].forEach((retraso) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const inicio = ctx.currentTime + retraso;
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, inicio);
        osc.frequency.exponentialRampToValueAtTime(110, inicio + 0.08);
        gain.gain.setValueAtTime(0.35, inicio);
        gain.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.12);
        osc.connect(gain).connect(salida!);
        osc.start(inicio);
        osc.stop(inicio + 0.14);
      });
    },
    /** El «clic» de la cámara: dos chasquidos cortos. */
    clic() {
      const ctx = listo();
      if (!ctx || !salida) return;
      [0, 0.07].forEach((retraso, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const inicio = ctx.currentTime + retraso;
        osc.type = "square";
        osc.frequency.setValueAtTime(i ? 1300 : 2100, inicio);
        gain.gain.setValueAtTime(0.06, inicio);
        gain.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.04);
        osc.connect(gain).connect(salida!);
        osc.start(inicio);
        osc.stop(inicio + 0.05);
      });
    },
    cerrar() {
      ronroneo?.parar();
      ronroneo = null;
      bucle?.parar();
      bucle = null;
      soltarBus(salida);
      salida = null;
      contexto = null;
    },
  };
}
export type SonidoCasa = ReturnType<typeof crearSonidoCasa>;
