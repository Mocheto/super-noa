import "../textos/zonas/minijuegos.tambor.ts";
import { outputLatencySeconds } from "./rhythmEngine.ts";
import { avanzarRelojFotogramas, flanco, inicioTrasPausa, practicaPrimero, pulsoDeAudio, type Tempo } from "./ritmoNucleo.ts";
import type { PerfilSintesis } from "./ritmoAudio.ts";
import { ajustesRitmo, anotarAcierto, anotarVacia, esRebote, nuevaRaya, type Raya } from "./pulsacionVacia.ts";
import { t } from "../textos/index.ts";

export { outputLatencySeconds };

// «El tambor de Armonía»: duelo rítmico de la Maestra Armonía. En cada pareja de compases Armonía toca un
// patrón en su tambor (llamada) y la jugadora lo repite en el tambor de Noa (respuesta). Todo se mide en
// pulsos sobre una rejilla a tempo fijo.
export const ARMONIA_DRUM_LEVEL_ID = "16-3";
export const DRUM_BPM = 100;
export const PULSE_MS = 60_000 / DRUM_BPM;
export const PULSES_PER_BAR = 4;
export const COUNT_PULSES = PULSES_PER_BAR;
export const HIT_WINDOW_PULSES = ajustesRitmo.margen; // medio pulso por defecto (±300 ms); ajustable con ?ritmoMargen=
export const WIN_AT = 12;
export const RESUME_COUNT_PULSES = 4;

export type DrumMode = "demo" | "practice" | "song";
export type Phase = 1 | 2 | 3;
/** Una pareja de llamada y respuesta: pulsos del compás (1–4) que llevan golpe. */
export type CallPair = { phase: Phase; hits: readonly number[] };
export type DrumScore = { pairs: readonly CallPair[]; closingBars: number; auto: boolean };

/** Cartel de fase: solo cuando cambia la forma de los golpes (la primera fase no lleva cartel). */
export const PHASE_NAMES: Record<Phase, string | null> = { 1: null, 2: t("minijuegos.tambor.fase.seguidos.rotulo"), 3: t("minijuegos.tambor.fase.cuatro.rotulo") };

const pair = (phase: Phase, ...hits: number[]): CallPair => ({ phase, hits });

export const drumScores: Record<DrumMode, DrumScore> = {
  song: {
    closingBars: 2,
    auto: false,
    pairs: [
      pair(1, 1), pair(1, 1, 3), pair(1, 1, 3),
      pair(2, 1, 2), pair(2, 2, 3), pair(2, 1, 2, 3), pair(2, 1, 3),
      pair(3, 1, 3, 4), pair(3, 1, 2, 4), pair(3, 1, 2, 3, 4),
    ],
  },
  demo: { closingBars: 1, auto: true, pairs: [pair(1, 1, 3), pair(2, 1, 2, 3)] },
  practice: { closingBars: 1, auto: false, pairs: [pair(1, 1), pair(1, 1, 3), pair(2, 1, 2, 3)] },
};

export const barsOf = (score: DrumScore) => 1 + score.pairs.length * 2 + score.closingBars;
export const scoreLength = (score: DrumScore) => barsOf(score) * PULSES_PER_BAR;
export const hitsIn = (score: DrumScore) => score.pairs.reduce((total, item) => total + item.hits.length, 0);
export const callStart = (index: number) => COUNT_PULSES + index * 2 * PULSES_PER_BAR;
export const responseStart = (index: number) => callStart(index) + PULSES_PER_BAR;

export type Part =
  | { kind: "count"; beat: number }
  | { kind: "end"; beat: number }
  | { kind: "call" | "response"; pair: number; beat: number };

/** Parte de la canción en un pulso entero: cuenta, llamada, respuesta o cierre. `beat` va de 0 a 3. */
export function partAt(score: DrumScore, pulse: number): Part {
  const whole = Math.floor(pulse);
  const beat = ((whole % PULSES_PER_BAR) + PULSES_PER_BAR) % PULSES_PER_BAR;
  if (whole < COUNT_PULSES) return { kind: "count", beat };
  const index = Math.floor((whole - COUNT_PULSES) / (2 * PULSES_PER_BAR));
  if (index >= score.pairs.length) return { kind: "end", beat };
  return { kind: whole < responseStart(index) ? "call" : "response", pair: index, beat };
}

/** Reglas que toda partitura debe cumplir. Devuelve una lista de incumplimientos legibles. */
export function validateScore(score: DrumScore): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(score.closingBars) || score.closingBars < 0) errors.push("cierre sin compases enteros");
  score.pairs.forEach((item, index) => {
    const label = `pareja ${index + 1}`;
    if (item.hits.length === 0) errors.push(`${label} sin golpes`);
    if (item.hits.some((hit) => !Number.isInteger(hit) || hit < 1 || hit > PULSES_PER_BAR)) errors.push(`${label} con un golpe fuera de la rejilla`);
    if (item.hits.some((hit, at) => at > 0 && hit <= item.hits[at - 1])) errors.push(`${label} con golpes repetidos o desordenados`);
    if (item.phase < 3 && item.hits.includes(PULSES_PER_BAR)) errors.push(`${label}: el pulso 4 queda libre para el aviso de turno`);
    if (index > 0 && item.phase < score.pairs[index - 1].phase) errors.push(`${label}: la fase va hacia atrás`);
  });
  return errors;
}

// ---------------------------------------------------------------- partida

export type DrumTarget = { pair: number; beat: number; pulse: number; hitAt: number | null };
/** `got` cuenta todos los golpes acertados; el atril y la raya dorada miran `cuenta.raya`, que bajan los «¡Uy!» de la canción. */
export type DrumRun = { mode: DrumMode; score: DrumScore; targets: DrumTarget[]; got: number; uy: number; cuenta: Raya };
export type PressResult =
  | { kind: "hit"; target: DrumTarget; note: number }
  | { kind: "soft" }
  | { kind: "uy"; resta: boolean }
  | { kind: "rebote" };

export function createRun(mode: DrumMode): DrumRun {
  const score = drumScores[mode];
  const targets = score.pairs.flatMap((item, index) => item.hits.map((beat) => ({ pair: index, beat, pulse: responseStart(index) + beat - 1, hitAt: null })));
  return { mode, score, targets, got: 0, uy: 0, cuenta: nuevaRaya() };
}

/** Posición del golpe dentro de su patrón: elige la nota de xilófono que cierra la frase. */
const noteIndexOf = (run: DrumRun, target: DrumTarget) => run.score.pairs[target.pair].hits.indexOf(target.beat);

/**
 * Golpe de la jugadora en el pulso dado. En la respuesta, un golpe a menos de medio pulso de una huella aún
 * libre la acierta; un golpe a destiempo, en un silencio o repetido es un «¡Uy!»: una pulsación vacía que en la
 * canción baja una nota del atril (en la práctica no resta). Un rebote justo después de un acierto no cuenta. Fuera
 * de la respuesta (cuenta, llamada o cierre) el golpe suena flojito y no cuenta.
 */
export function pressAt(run: DrumRun, pulse: number): PressResult {
  const nearest = Math.round(pulse);
  const part = partAt(run.score, nearest);
  if (pulse < 0 || part.kind !== "response") return { kind: "soft" };
  if (esRebote(run.cuenta, pulse)) return { kind: "rebote" };
  const target = run.targets.find((item) => item.pulse === nearest);
  if (!target || target.hitAt !== null || Math.abs(pulse - nearest) > HIT_WINDOW_PULSES) {
    run.uy += 1;
    return { kind: "uy", resta: anotarVacia(run.cuenta, run.mode === "song") };
  }
  target.hitAt = pulse;
  run.got += 1;
  anotarAcierto(run.cuenta, pulse);
  return { kind: "hit", target, note: noteIndexOf(run, target) };
}

/** En la demostración, Noa responde sola cada golpe en su pulso. */
export function autoHits(run: DrumRun, pulse: number): PressResult[] {
  const results: PressResult[] = [];
  for (const target of run.targets) {
    if (target.hitAt === null && pulse >= target.pulse) {
      target.hitAt = target.pulse;
      run.got += 1;
      anotarAcierto(run.cuenta, target.pulse);
      results.push({ kind: "hit", target, note: noteIndexOf(run, target) });
    }
  }
  return results;
}

export type PrintState = "silence" | "beat" | "ok" | "gone";
export type PrintsView = { drum: "armonia" | "noa"; prints: PrintState[]; lit: number; current: number } | null;

/**
 * Huellas del pulso actual. En la llamada, el patrón completo está en el parche de Armonía y se enciende cada
 * huella que toca; en la respuesta pasa al parche de Noa, con las acertadas en verde y las que ya se escaparon
 * apagadas. Fuera de las parejas no hay huellas.
 */
export function printsAt(run: DrumRun, pulse: number): PrintsView {
  const part = partAt(run.score, pulse);
  if (pulse < 0 || (part.kind !== "call" && part.kind !== "response")) return null;
  const { hits } = run.score.pairs[part.pair];
  const beat = part.beat + 1;
  if (part.kind === "call") {
    const lit = hits.includes(beat) && pulse - Math.floor(pulse) < 0.45 ? beat : 0;
    return { drum: "armonia", prints: [1, 2, 3, 4].map((at) => hits.includes(at) ? "beat" : "silence"), lit, current: beat };
  }
  const prints = [1, 2, 3, 4].map((at): PrintState => {
    if (!hits.includes(at)) return "silence";
    const target = run.targets.find((item) => item.pair === part.pair && item.beat === at)!;
    if (target.hitAt !== null) return "ok";
    return pulse > target.pulse + HIT_WINDOW_PULSES ? "gone" : "beat";
  });
  return { drum: "noa", prints, lit: 0, current: Math.round(pulse) - responseStart(part.pair) + 1 };
}

export type Outcome = { result: "casi" | "bien" | "perfecto"; won: boolean; challengeCompleted: boolean };

/** La victoria pide la raya dorada del atril; el reto, que no se escape ningún golpe y no haya ningún «¡Uy!». */
export function outcomeOf(run: DrumRun): Outcome {
  const perfect = run.got === hitsIn(run.score) && run.cuenta.vacias === 0;
  const won = run.cuenta.raya >= WIN_AT;
  return { result: perfect ? "perfecto" : won ? "bien" : "casi", won, challengeCompleted: perfect };
}

// Relojes y cuenta al seguir: los comunes de los duelos rítmicos, ligados al tempo de este juego.
const TEMPO: Tempo = { pulsoMs: PULSE_MS, pulsosCuenta: RESUME_COUNT_PULSES };
export { practicaPrimero as practiceFirst, flanco as risingEdge, avanzarRelojFotogramas as advanceFrameClock };
export const audioPulse = (currentTime: number, songStart: number, latencySeconds: number) => pulsoDeAudio(TEMPO, currentTime, songStart, latencySeconds);
export const songStartAfterPause = (songStart: number, pausedAt: number, countStart: number) => inicioTrasPausa(TEMPO, songStart, pausedAt, countStart);

// ---------------------------------------------------------------- música «marcha de teatro» (original)

export type DrumNote = {
  offset: number;
  frequency: number;
  duration: number;
  wave: OscillatorType;
  volume: number;
  bus: "music" | "cue";
  glideTo?: number;
  noise?: "high" | "low" | "band" | "brush" | "clap";
};

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
// Do mayor: do · fa · sol · do, un acorde por compás.
const CHORDS: readonly (readonly number[])[] = [[48, 52, 55], [53, 57, 60], [55, 59, 62], [48, 52, 55]];
// Armonía deja la frase abierta (sube hacia sol) y Noa la cierra (baja hacia do), según cuántos golpes tenga.
const CALL_NOTES: Record<number, readonly number[]> = { 1: [55], 2: [52, 55], 3: [48, 52, 55], 4: [48, 52, 55, 59] };
const RESPONSE_NOTES: Record<number, readonly number[]> = { 1: [84], 2: [79, 84], 3: [79, 76, 72], 4: [81, 79, 76, 72] };
const FANFARE = [60, 64, 67, 72, 76, 79, 84];

const tuba = (midi: number, volume = 0.13): DrumNote[] => [
  { offset: 0, frequency: hz(midi), duration: PULSE_MS * 0.00045, wave: "triangle", volume, bus: "music" },
  { offset: 0, frequency: hz(midi) * 2, duration: PULSE_MS * 0.0002, wave: "sine", volume: volume * 0.25, bus: "music" },
];
const glock = (midi: number, volume: number, bus: DrumNote["bus"] = "music"): DrumNote[] => [
  { offset: 0, frequency: hz(midi), duration: 0.6, wave: "sine", volume, bus },
  { offset: 0, frequency: hz(midi) * 4, duration: 0.12, wave: "sine", volume: volume * 0.3, bus },
];
export const xylophone = (midi: number, volume = 0.16, bus: DrumNote["bus"] = "cue"): DrumNote[] => [
  { offset: 0, frequency: hz(midi), duration: 0.28, wave: "triangle", volume, bus },
  { offset: 0, frequency: hz(midi) * 3, duration: 0.06, wave: "sine", volume: volume * 0.4, bus },
];
const brush = (volume: number): DrumNote[] => [{ offset: 0, frequency: 0, duration: 0.12, wave: "sine", volume, bus: "music", noise: "brush" }];
const clap = (volume: number): DrumNote[] => [
  { offset: 0, frequency: 0, duration: 0.04, wave: "sine", volume, bus: "music", noise: "clap" },
  { offset: 0.015, frequency: 0, duration: 0.06, wave: "sine", volume: volume * 0.8, bus: "music", noise: "clap" },
];
const cymbal = (volume: number): DrumNote[] => [{ offset: 0, frequency: 0, duration: 1.1, wave: "sine", volume, bus: "music", noise: "high" }];
/** «¡tin!»: campanilla del aviso de turno en el cuarto pulso de cada llamada. */
export const TIN: DrumNote[] = [
  { offset: 0, frequency: 2637, duration: 0.5, wave: "sine", volume: 0.08, bus: "cue" },
  { offset: 0, frequency: 3951, duration: 0.3, wave: "sine", volume: 0.04, bus: "cue" },
];
/** Timbal de Armonía: grave, redondo y afinado en la nota de su frase. */
const timbal = (midi: number): DrumNote[] => [
  { offset: 0, frequency: hz(midi), duration: 0.55, wave: "sine", volume: 0.42, bus: "music", glideTo: hz(midi) * 0.92 },
  { offset: 0, frequency: 0, duration: 0.05, wave: "sine", volume: 0.05, bus: "music", noise: "low" },
];
/** Tambor de banda de Noa: seco y brillante. Flojito cuando el golpe no cuenta. */
export const snare = (soft: boolean, bus: DrumNote["bus"] = "cue"): DrumNote[] => [
  { offset: 0, frequency: 240, duration: 0.16, wave: "triangle", volume: soft ? 0.12 : 0.32, bus, glideTo: 150 },
  { offset: 0, frequency: 0, duration: 0.12, wave: "sine", volume: soft ? 0.04 : 0.12, bus, noise: "band" },
];
export const BATON = (first: boolean): DrumNote[] => [{ offset: 0, frequency: first ? 1568 : 1175, duration: 0.08, wave: "square", volume: 0.04, bus: "cue" }];

/** Nota de xilófono que suena con un golpe acertado: cierra la frase abierta por Armonía. */
export const responseNote = (run: DrumRun, target: DrumTarget) => {
  const { hits } = run.score.pairs[target.pair];
  return RESPONSE_NOTES[hits.length][hits.indexOf(target.beat)];
};

/** Notas de una corchea (medio pulso) de la canción, según la partitura. */
export function musicForEighth(run: DrumRun, eighth: number): DrumNote[] {
  const { score } = run;
  if (eighth < 0 || eighth >= scoreLength(score) * 2) return [];
  const onPulse = eighth % 2 === 0;
  const pulse = Math.floor(eighth / 2);
  const part = partAt(score, pulse);
  const chord = CHORDS[Math.floor(pulse / PULSES_PER_BAR) % CHORDS.length];
  const notes: DrumNote[] = [];
  if (part.kind === "count") {
    if (onPulse) notes.push(...BATON(part.beat === 0), ...brush(0.03));
    return notes;
  }
  if (part.kind === "end") { // fanfarria con platillos
    const index = eighth - (barsOf(score) - score.closingBars) * PULSES_PER_BAR * 2;
    if (index < FANFARE.length) notes.push(...glock(FANFARE[index], 0.08));
    if (index === 0 || index === 8) notes.push(...cymbal(0.09));
    if (onPulse && index < 8) notes.push(...tuba(chord[0] - 12, 0.14));
    if (index === 8) { for (const midi of [72, 76, 79, 84]) notes.push(...xylophone(midi, 0.09, "music")); notes.push(...tuba(36, 0.2)); }
    return notes;
  }
  // Acompañamiento: tuba saltarina en 1 y 3, escobillas en 2 y 4, palmas en la respuesta.
  if (onPulse && (part.beat === 0 || part.beat === 2)) notes.push(...tuba(chord[0] - 12 + (part.beat === 2 ? 7 : 0)));
  if (onPulse && (part.beat === 1 || part.beat === 3)) notes.push(...brush(part.kind === "call" ? 0.035 : 0.05));
  if (!onPulse) notes.push({ offset: 0, frequency: 0, duration: 0.025, wave: "sine", volume: 0.012, bus: "music", noise: "high" });
  if (part.kind === "response" && !onPulse && (part.beat === 1 || part.beat === 3)) notes.push(...clap(0.03));
  if (part.kind === "response" && onPulse && part.beat === 0) for (const midi of chord) notes.push(...glock(midi + 12, 0.018));
  const { hits } = score.pairs[part.pair];
  if (part.kind === "call" && onPulse) {
    const index = hits.indexOf(part.beat + 1);
    if (index >= 0) notes.push(...timbal(CALL_NOTES[hits.length][index]));
    if (part.beat === 3) notes.push(...TIN);
  }
  if (part.kind === "response" && onPulse && score.auto) {
    const index = hits.indexOf(part.beat + 1);
    if (index >= 0) notes.push(...snare(false, "music"), ...xylophone(RESPONSE_NOTES[hits.length][index], 0.14, "music"));
  }
  return notes;
}

// ---------------------------------------------------------------- escena (coordenadas de 960 × 540)

export const ARMONIA_DRUM = { left: 240, top: 330, width: 180, height: 130 };
export const NOA_DRUM = { left: 540, top: 340, width: 180, height: 130 };
export const NOA = { left: 596, top: 150, width: 300, height: 300 };
/** Las huellas se apoyan en la franja del parche de cada tambor. */
export const printsOrigin = (drum: typeof ARMONIA_DRUM) => ({ x: drum.left + drum.width / 2, y: drum.top + drum.height * 12 / 46 });

/** Filtro de cada ruido: platillos y charles agudos, golpe grave, caja, palmas y escobillas. */
export const NOISE_FILTERS: Record<NonNullable<DrumNote["noise"]>, { type: BiquadFilterType; frequency: number }> = {
  high: { type: "highpass", frequency: 5500 },
  low: { type: "lowpass", frequency: 900 },
  band: { type: "bandpass", frequency: 3200 },
  clap: { type: "bandpass", frequency: 1400 },
  brush: { type: "bandpass", frequency: 2500 },
};

/** Síntesis de la «marcha de teatro»: solo osciladores y los ruidos de `NOISE_FILTERS`. */
export const PERFIL_TAMBOR: PerfilSintesis = { ataque: 0.006, colaRuido: 0.02, segundosRuido: 1.2, conTramo: true, filtrosRuido: NOISE_FILTERS };
