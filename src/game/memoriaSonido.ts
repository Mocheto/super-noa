/**
 * Sonido de los duelos de memoria (issue 360): una nota por sitio (celesta para Aurora, marimba para la Reina) y una
 * canción suave en 4/4 a 90 pulsos que solo suena mientras la guardiana enseña. Todo generado por código, por el bus de
 * la zona, con el volumen de música (canción) y de efectos (notas).
 */
import { busDeZona, contextoAudio, despertarAudio, soltarBus } from "./audio";
import { MS_POR_PULSO, type Sitio } from "./memoriaDuelo";

export type Timbre = "celesta" | "marimba";
export type EstiloCancion = "cuna" | "calipso";
export type AjustesSonidoMemoria = { silencio: boolean; musica: number; efectos: number };

export const hzDeMidi = (nota: number) => 440 * 2 ** ((nota - 69) / 12);
/** Progresión de la canción, un acorde por compás (fundamental en MIDI). */
export const ACORDES = [60, 65, 67, 60] as const;
const TERCERA = 4, QUINTA = 7;

export function crearSonidoMemoria(opciones: { notas: readonly [number, number, number]; timbre: Timbre; estilo: EstiloCancion }, inicial: AjustesSonidoMemoria) {
  let ajustes = inicial;
  let contexto: AudioContext | null = null;
  let musica: GainNode | null = null;
  let efectos: GainNode | null = null;
  let temporizador = 0;
  let siguientePulso = 0;
  let siguienteTiempo = 0;
  const pulsoS = MS_POR_PULSO / 1000;

  const preparar = () => {
    if (contexto) return contexto;
    contexto = contextoAudio();
    if (!contexto) return null;
    musica = busDeZona(contexto, ajustes.silencio ? 0 : ajustes.musica * 0.35);
    efectos = busDeZona(contexto, ajustes.silencio ? 0 : ajustes.efectos);
    return contexto;
  };

  /** Una nota con envolvente de golpe suave: celesta (seno con armónico brillante) o marimba (triángulo corto). */
  const tocar = (destino: AudioNode, midi: number, cuando: number, duracion: number, volumen: number, timbre: Timbre | "bajo" | "pad") => {
    const ctx = contexto;
    if (!ctx) return;
    const gain = ctx.createGain();
    gain.connect(destino);
    const osc = ctx.createOscillator();
    osc.type = timbre === "marimba" ? "triangle" : timbre === "bajo" ? "sine" : "sine";
    osc.frequency.value = hzDeMidi(midi);
    osc.connect(gain);
    const ataque = timbre === "pad" ? 0.25 : 0.008;
    gain.gain.setValueAtTime(0.0001, cuando);
    gain.gain.exponentialRampToValueAtTime(volumen, cuando + ataque);
    gain.gain.exponentialRampToValueAtTime(0.0001, cuando + duracion);
    osc.start(cuando);
    osc.stop(cuando + duracion + 0.05);
    if (timbre === "celesta") {
      // Un armónico dos octavas arriba, que se apaga antes: el brillo de la celesta.
      const brillo = ctx.createOscillator();
      const gainBrillo = ctx.createGain();
      brillo.frequency.value = hzDeMidi(midi + 24);
      gainBrillo.gain.setValueAtTime(volumen * 0.25, cuando);
      gainBrillo.gain.exponentialRampToValueAtTime(0.0001, cuando + duracion * 0.4);
      brillo.connect(gainBrillo).connect(destino);
      brillo.start(cuando);
      brillo.stop(cuando + duracion);
    }
  };

  /** Un golpe de maracas: ruido corto filtrado (solo en el calipso). */
  const maraca = (cuando: number, volumen: number) => {
    const ctx = contexto;
    if (!ctx || !musica) return;
    const muestras = Math.floor(ctx.sampleRate * 0.05);
    const buffer = ctx.createBuffer(1, muestras, ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < muestras; i++) datos[i] = (Math.random() * 2 - 1) * (1 - i / muestras);
    const fuente = ctx.createBufferSource();
    fuente.buffer = buffer;
    const filtro = ctx.createBiquadFilter();
    filtro.type = "highpass"; filtro.frequency.value = 4000;
    const gain = ctx.createGain();
    gain.gain.value = volumen;
    fuente.connect(filtro).connect(gain).connect(musica);
    fuente.start(cuando);
  };

  const programar = () => {
    if (!contexto || !musica) return;
    const horizonte = contexto.currentTime + 0.3;
    while (siguienteTiempo < horizonte) {
      const compas = Math.floor(siguientePulso / 4) % ACORDES.length;
      const tiempo = siguientePulso % 4;
      const raiz = ACORDES[compas];
      if (tiempo === 0 || tiempo === 2) tocar(musica, raiz - 24 + (tiempo === 2 ? QUINTA : 0), siguienteTiempo, pulsoS * 1.6, 0.5, "bajo");
      if (tiempo === 0) for (const intervalo of [0, TERCERA, QUINTA]) tocar(musica, raiz + intervalo, siguienteTiempo, pulsoS * 3.8, 0.12, "pad");
      if (opciones.estilo === "calipso") {
        maraca(siguienteTiempo, 0.25);
        maraca(siguienteTiempo + pulsoS / 2, 0.15);
      } else if (tiempo === 1 || tiempo === 3) {
        // Canción de cuna: una campanita lejana en los tiempos débiles.
        tocar(musica, raiz + 12 + (tiempo === 1 ? TERCERA : QUINTA), siguienteTiempo, pulsoS, 0.08, "celesta");
      }
      siguientePulso += 1;
      siguienteTiempo += pulsoS;
    }
  };

  return {
    /** Tras un gesto de la jugadora: el navegador solo deja sonar después de uno. */
    despertar() {
      const ctx = preparar();
      if (ctx) void despertarAudio(ctx);
    },
    ajustar(nuevos: AjustesSonidoMemoria) {
      ajustes = nuevos;
      if (contexto && musica && efectos) {
        musica.gain.setTargetAtTime(nuevos.silencio ? 0 : nuevos.musica * 0.35, contexto.currentTime, 0.1);
        efectos.gain.setTargetAtTime(nuevos.silencio ? 0 : nuevos.efectos, contexto.currentTime, 0.1);
      }
    },
    /** La nota de un sitio, ahora mismo. */
    nota(sitio: Sitio) {
      const ctx = preparar();
      if (!ctx || !efectos) return;
      tocar(efectos, opciones.notas[sitio], ctx.currentTime + 0.01, opciones.timbre === "celesta" ? 1.4 : 0.6, 0.5, opciones.timbre);
    },
    /** Ronda ganada: las tres notas juntas, de abajo arriba. */
    ronda() {
      const ctx = preparar();
      if (!ctx || !efectos) return;
      [...opciones.notas].sort((a, b) => a - b).forEach((nota, i) => tocar(efectos!, nota + 12, ctx.currentTime + 0.02 + i * 0.12, 0.9, 0.35, opciones.timbre));
    },
    /** «CASI»: dos notas que bajan, bajito. */
    casi() {
      const ctx = preparar();
      if (!ctx || !efectos) return;
      tocar(efectos, opciones.notas[1] - 5, ctx.currentTime + 0.01, 0.5, 0.25, opciones.timbre);
      tocar(efectos, opciones.notas[1] - 8, ctx.currentTime + 0.25, 0.7, 0.22, opciones.timbre);
    },
    /** La canción suena solo mientras la guardiana enseña. */
    empezarCancion() {
      const ctx = preparar();
      if (!ctx || temporizador) return;
      siguientePulso = 0;
      siguienteTiempo = ctx.currentTime + 0.05;
      programar();
      temporizador = window.setInterval(programar, 80);
    },
    pararCancion() {
      window.clearInterval(temporizador);
      temporizador = 0;
    },
    cerrar() {
      window.clearInterval(temporizador);
      temporizador = 0;
      soltarBus(musica);
      soltarBus(efectos);
      contexto = null;
      musica = null;
      efectos = null;
    },
  };
}
export type SonidoMemoria = ReturnType<typeof crearSonidoMemoria>;
