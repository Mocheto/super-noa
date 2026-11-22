import { busDeZona, contextoAudio, soltarBus } from "./audio.ts";
/**
 * Música de fondo de la casa de los gatitos (mapa «La casa viva»): una nana original y tranquila en 3/4, generada por
 * código con un sonido de caja de música y un bajo suave. Suena en bucle, más lenta y más bajita de noche (21–8 h),
 * con el volumen de música del juego, y no pisa los maullidos ni la canción de los gatitos (va por debajo).
 */

/** Ocho compases de tres negras: la melodía (nota MIDI o `null` si se alarga la anterior) y el bajo de cada compás. */
export const NANA_MELODIA: readonly (readonly (number | null)[])[] = [
  [64, 67, 72], [71, 67, 64], [65, 69, 74], [72, null, null],
  [64, 67, 71], [69, 65, 62], [64, 62, 59], [60, null, null],
];
export const NANA_BAJO: readonly number[] = [48, 43, 41, 48, 40, 41, 43, 48];
export const PULSOS_POR_COMPAS = 3;
export const NANA_BPM = { dia: 84, noche: 63 } as const;
/** Volumen de la nana respecto al volumen de música del juego: va por debajo de maullidos y canciones. */
export const NANA_VOLUMEN = { dia: 0.22, noche: 0.13 } as const;

export const hzDeMidi = (nota: number) => 440 * 2 ** ((nota - 69) / 12);
export const segundosPorPulso = (noche: boolean) => 60 / (noche ? NANA_BPM.noche : NANA_BPM.dia);
export const pulsosNana = () => NANA_MELODIA.length * PULSOS_POR_COMPAS;

/** Notas que empiezan en el pulso `pulso` (en bucle): melodía (con su duración en pulsos) y, al principio del compás, el bajo. */
export function notasDelPulso(pulso: number): { nota: number; pulsos: number; bajo: boolean }[] {
  const total = pulsosNana();
  const p = ((pulso % total) + total) % total;
  const compas = Math.floor(p / PULSOS_POR_COMPAS);
  const dentro = p % PULSOS_POR_COMPAS;
  const notas: { nota: number; pulsos: number; bajo: boolean }[] = [];
  const nota = NANA_MELODIA[compas][dentro];
  if (nota !== null) {
    let pulsos = 1;
    while (dentro + pulsos < PULSOS_POR_COMPAS && NANA_MELODIA[compas][dentro + pulsos] === null) pulsos += 1;
    notas.push({ nota, pulsos, bajo: false });
  }
  if (dentro === 0) notas.push({ nota: NANA_BAJO[compas], pulsos: PULSOS_POR_COMPAS, bajo: true });
  return notas;
}

type Ajustes = { silencio: boolean; volumen: number; noche: boolean };

/** Reproductor de la nana: programa las notas con antelación sobre el reloj de audio. */
export function crearNana(inicial: Ajustes) {
  let ajustes = inicial;
  let contexto: AudioContext | null = null;
  let salida: GainNode | null = null;
  let temporizador = 0;
  let siguientePulso = 0;
  let siguienteTiempo = 0;

  const volumen = () => ajustes.silencio ? 0 : ajustes.volumen * (ajustes.noche ? NANA_VOLUMEN.noche : NANA_VOLUMEN.dia);

  const tocar = (ctx: AudioContext, destino: AudioNode, nota: number, inicio: number, duracion: number, bajo: boolean) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = bajo ? "sine" : "triangle";
    osc.frequency.value = hzDeMidi(nota);
    const pico = bajo ? 0.35 : 0.5;
    gain.gain.setValueAtTime(0.0001, inicio);
    gain.gain.exponentialRampToValueAtTime(pico, inicio + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, inicio + Math.max(0.3, duracion * 0.95));
    osc.connect(gain).connect(destino);
    osc.start(inicio);
    osc.stop(inicio + duracion);
  };

  const programar = () => {
    if (!contexto || !salida) return;
    const horizonte = contexto.currentTime + 0.4;
    while (siguienteTiempo < horizonte) {
      const pulso = segundosPorPulso(ajustes.noche);
      for (const { nota, pulsos, bajo } of notasDelPulso(siguientePulso)) tocar(contexto, salida, nota, siguienteTiempo, pulso * pulsos, bajo);
      siguientePulso += 1;
      siguienteTiempo += pulso;
    }
  };

  return {
    /** Empieza (o retoma) la nana; llamar tras un gesto de la jugadora para que el navegador deje sonar. */
    empezar() {
      if (!contexto) {
        contexto = contextoAudio();
        if (!contexto) return;
        salida = busDeZona(contexto, volumen());
        siguienteTiempo = contexto.currentTime + 0.1;
        temporizador = window.setInterval(programar, 100);
      }
      if (contexto.state === "suspended") void contexto.resume();
    },
    ajustar(nuevos: Ajustes) {
      ajustes = nuevos;
      if (contexto && salida) salida.gain.setTargetAtTime(volumen(), contexto.currentTime, 0.3);
    },
    cerrar() {
      window.clearInterval(temporizador);
      soltarBus(salida);
      contexto = null;
      salida = null;
    },
  };
}
export type Nana = ReturnType<typeof crearNana>;
