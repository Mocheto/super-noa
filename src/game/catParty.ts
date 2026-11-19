import { outputLatencySeconds } from "./rhythmEngine.ts";
import { ajustesRitmo, anotarAcierto, anotarVacia, esRebote, nuevaRaya, type Raya } from "./pulsacionVacia.ts";
import { t } from "../textos/index.ts";

export { outputLatencySeconds };

// «La fiesta de los gatitos»: los gatitos empujan piezas por la cinta y Noa, la leñadora,
// las golpea en el tajo al compás. Todo se mide en pulsos sobre una rejilla a tempo fijo.
export const CAT_PARTY_LEVEL_ID = "2-3";
export const PARTY_BPM = 100;
export const PULSE_MS = 60_000 / PARTY_BPM;
export const PULSES_PER_BAR = 4;
export const COUNT_PULSES = PULSES_PER_BAR;
export const TRAVEL_PULSES = 2;
export const HIT_WINDOW_PULSES = ajustesRitmo.margen; // medio pulso por defecto (±300 ms); ajustable con ?ritmoMargen=
export const ROLL_OFF_PULSES = 0.9;

export type PieceType = "small" | "medium" | "yarn";
export type PartyMode = "demo" | "practice" | "song";
export type ScorePiece = { type: PieceType; bar: number; pulse: number };
export type Score = {
  bars: number;
  closingBars: number;
  yarnFromBar: number;
  /** Carteles de fase: solo cuando llega una pieza nueva, con su sprite y hasta dos palabras. */
  phases: readonly { fromBar: number; name: string; piece: "small" | "medium" | "yarn" }[];
  pieces: readonly ScorePiece[];
};

const piece = (bar: number, pulse: number, type: PieceType = "small"): ScorePiece => ({ type, bar, pulse });
const mediumBar = (bar: number, last: PieceType = "small") => [piece(bar, 1, "medium"), piece(bar, 4, last)];
const pairBar = (bar: number) => [piece(bar, 1), piece(bar, 3)];

export const partyScores: Record<PartyMode, Score> = {
  song: {
    bars: 28,
    closingBars: 2,
    yarnFromBar: 21,
    phases: [
      { fromBar: 2, name: t("minijuegos.gatitos.fase.troncos.rotulo"), piece: "small" }, { fromBar: 13, name: t("minijuegos.gatitos.fase.dos.rotulo"), piece: "medium" },
      { fromBar: 21, name: t("minijuegos.gatitos.fase.ovillo.rotulo"), piece: "yarn" },
    ],
    pieces: [
      piece(2, 3), piece(3, 3), piece(4, 3),
      ...[5, 6, 7, 8].map((bar) => piece(bar, 1)), ...[9, 10, 11, 12].flatMap(pairBar),
      ...[13, 15, 17, 19].flatMap((bar) => [...mediumBar(bar), ...pairBar(bar + 1)]),
      ...[21, 23, 25].flatMap((bar) => [...mediumBar(bar, "yarn"), ...pairBar(bar + 1)]),
    ],
  },
  practice: {
    bars: 6,
    closingBars: 0,
    yarnFromBar: 2,
    phases: [],
    pieces: [piece(2, 3), piece(3, 3), piece(4, 1, "medium"), piece(5, 1, "yarn")],
  },
  demo: {
    bars: 5,
    closingBars: 0,
    yarnFromBar: 2,
    phases: [],
    pieces: [piece(2, 3), piece(3, 3, "medium"), piece(4, 3, "yarn")],
  },
};

export const firstHitPulse = ({ bar, pulse }: ScorePiece) => (bar - 1) * PULSES_PER_BAR + pulse - 1;
export const hitPulses = (item: ScorePiece) => item.type === "medium" ? [firstHitPulse(item), firstHitPulse(item) + 1] : [firstHitPulse(item)];
export const pushPulse = (item: ScorePiece) => firstHitPulse(item) - TRAVEL_PULSES;
export const barOfPulse = (pulse: number) => Math.floor(pulse / PULSES_PER_BAR) + 1;
export const scoreLength = (score: Score) => score.bars * PULSES_PER_BAR;

/** Reglas que toda partitura debe cumplir. Devuelve una lista de incumplimientos legibles. */
export function validateScore(score: Score): string[] {
  const errors: string[] = [];
  const busy = new Set<number>();
  const playableBars = score.bars - score.closingBars;
  for (const item of score.pieces) {
    const label = `${item.type} del compás ${item.bar}, pulso ${item.pulse}`;
    if (!Number.isInteger(item.bar) || !Number.isInteger(item.pulse) || item.pulse < 1 || item.pulse > PULSES_PER_BAR || item.bar < 2 || item.bar > playableBars) {
      errors.push(`golpe fuera de la rejilla: ${label}`);
    }
    for (const hit of hitPulses(item)) {
      if (busy.has(hit)) errors.push(`solape en el tajo: ${label}`);
      busy.add(hit);
    }
    if (item.type === "yarn" && item.bar < score.yarnFromBar) errors.push(`ovillo antes de su fase: ${label}`);
    if (pushPulse(item) < COUNT_PULSES) errors.push(`empuje durante la cuenta: ${label}`);
  }
  for (const item of score.pieces) {
    if (item.type === "medium" && busy.has(firstHitPulse(item) + 2)) errors.push(`sin pulso libre tras la mediana del compás ${item.bar}, pulso ${item.pulse}`);
  }
  return errors;
}

// ---------------------------------------------------------------- partida

export type LivePiece = {
  id: number;
  type: PieceType;
  push: number;
  hits: readonly number[];
  done: number[];
  missedAt: number | null;
  bouncedAt: number | null;
  brokenAt: number | null;
};

/** `broken` cuenta las piezas partidas; el montón de leña y su raya dorada miran `cuenta.raya`: un golpe acertado suma un leño y una pulsación vacía de la canción lo quita. */
export type PartyRun = { mode: PartyMode; score: Score; pieces: LivePiece[]; broken: number; noteIndex: number; cuenta: Raya };

export type PressResult =
  | { kind: "hit"; piece: LivePiece; broke: boolean }
  | { kind: "yarn"; piece: LivePiece; resta: boolean }
  | { kind: "empty"; resta: boolean }
  | { kind: "rebote" };

export function createRun(mode: PartyMode): PartyRun {
  const score = partyScores[mode];
  return {
    mode, score, broken: 0, noteIndex: 0, cuenta: nuevaRaya(),
    pieces: score.pieces.map((item, id) => ({ id, type: item.type, push: pushPulse(item), hits: hitPulses(item), done: [], missedAt: null, bouncedAt: null, brokenAt: null })),
  };
}

const pending = (item: LivePiece) => item.type !== "yarn" && item.brokenAt === null && item.missedAt === null;

function land(run: PartyRun, item: LivePiece, hit: number, pulse: number): PressResult {
  item.done.push(hit);
  anotarAcierto(run.cuenta, pulse);
  const broke = item.done.length === item.hits.length;
  if (broke) { item.brokenAt = pulse; run.broken += 1; }
  return { kind: "hit", piece: item, broke };
}

/**
 * Golpe de la jugadora en el pulso dado: acierta la pieza más cercana dentro del margen. Golpear sin pieza o golpear
 * un ovillo es una pulsación vacía: en la canción, pasada la cuenta, quita un leño del montón. El rebote no cuenta.
 */
export function pressAt(run: PartyRun, pulse: number): PressResult {
  if (esRebote(run.cuenta, pulse)) return { kind: "rebote" };
  const cuesta = run.mode === "song" && pulse >= COUNT_PULSES;
  let best: { item: LivePiece; hit: number } | null = null;
  let bestDistance = Infinity;
  for (const item of run.pieces) {
    const open = item.type === "yarn" ? item.bouncedAt === null : pending(item);
    if (!open) continue;
    for (const hit of item.hits) {
      if (item.done.includes(hit)) continue;
      const distance = Math.abs(pulse - hit);
      if (distance <= HIT_WINDOW_PULSES && distance < bestDistance) { bestDistance = distance; best = { item, hit }; }
    }
  }
  if (!best) return { kind: "empty", resta: anotarVacia(run.cuenta, cuesta) };
  if (best.item.type === "yarn") { best.item.bouncedAt = pulse; return { kind: "yarn", piece: best.item, resta: anotarVacia(run.cuenta, cuesta) }; }
  return land(run, best.item, best.hit, pulse);
}

/** En la demostración, Noa golpea sola cada pieza en su pulso. */
export function autoHits(run: PartyRun, pulse: number): PressResult[] {
  const results: PressResult[] = [];
  for (const item of run.pieces) {
    if (!pending(item)) continue;
    for (const hit of item.hits) if (pulse >= hit && !item.done.includes(hit)) results.push(land(run, item, hit, pulse));
  }
  return results;
}

/** Marca como perdidas las piezas cuyo margen ya pasó. Devuelve las que se acaban de perder. */
export function collectMisses(run: PartyRun, pulse: number): LivePiece[] {
  const missed: LivePiece[] = [];
  for (const item of run.pieces) {
    if (pending(item) && item.hits.some((hit) => !item.done.includes(hit) && pulse > hit + HIT_WINDOW_PULSES)) {
      item.missedAt = pulse;
      missed.push(item);
    }
  }
  return missed;
}

export const hitsIn = (score: Score) => score.pieces.reduce((total, item) => total + (item.type === "yarn" ? 0 : hitPulses(item).length), 0);
/** Raya dorada del montón de leña: la mitad de los golpes de la canción. */
export const goalOf = (score: Score) => Math.ceil(hitsIn(score) / 2);

export type Outcome = { result: "casi" | "bien" | "perfecto"; won: boolean };

/** La hoguera se enciende si el montón pasa la raya dorada; «perfecto» pide todos los golpes y ninguna pulsación vacía. */
export function outcomeOf(run: PartyRun): Outcome {
  const golpes = run.pieces.reduce((total, item) => total + (item.type === "yarn" ? 0 : item.done.length), 0);
  const perfect = golpes === hitsIn(run.score) && run.cuenta.vacias === 0;
  const won = run.cuenta.raya >= goalOf(run.score);
  return { result: perfect ? "perfecto" : won ? "bien" : "casi", won };
}

export function nextOpenHit(run: PartyRun, pulse: number) {
  let next = Infinity;
  for (const item of run.pieces) if (pending(item)) for (const hit of item.hits) if (!item.done.includes(hit) && hit >= pulse - HIT_WINDOW_PULSES) next = Math.min(next, hit);
  return next;
}

// ---------------------------------------------------------------- escena (coordenadas de 960 × 540)

export const BELT_FROM_X = 860;
export const STUMP_X = 318;
export const BELT_Y = 404;

export function piecePlacement(item: LivePiece, pulse: number, reduceMotion = false) {
  const travel = (pulse - item.push) / TRAVEL_PULSES;
  if (travel <= 1) {
    return { x: BELT_FROM_X + (STUMP_X - BELT_FROM_X) * Math.max(0, travel), y: BELT_Y, rotation: item.type === "yarn" && !reduceMotion ? travel * -540 : 0, opacity: 1 };
  }
  const leaving = item.type === "yarn" ? item.hits[0] : item.missedAt;
  if (leaving === null) return { x: STUMP_X, y: BELT_Y, rotation: 0, opacity: 1 };
  const roll = Math.min(1, Math.max(0, (pulse - leaving) / ROLL_OFF_PULSES));
  const hop = item.bouncedAt !== null ? Math.sin(Math.min(1, roll * 1.4) * Math.PI) * 70 : 0;
  return { x: STUMP_X - 280 * roll, y: BELT_Y + 60 * roll * roll - hop, rotation: reduceMotion ? 0 : -roll * 360, opacity: 1 - roll };
}

export const pieceVisible = (item: LivePiece, pulse: number) =>
  pulse >= item.push - 0.05 && item.brokenAt === null && !((item.type === "yarn" || item.missedAt !== null) && pulse - (item.type === "yarn" ? item.hits[0] : item.missedAt!) >= ROLL_OFF_PULSES);

// ---------------------------------------------------------------- música

export type SampleId = "marimba-do5" | "flauta-sol5" | "pizzicato-do3" | "cascabeles" | "madera" | "hachazo" | "golpe-sordo" | "plop-ovillo" | "miau-gatito-1" | "miau-gatito-2";
export const SAMPLE_IDS: readonly SampleId[] = ["marimba-do5", "flauta-sol5", "pizzicato-do3", "cascabeles", "madera", "hachazo", "golpe-sordo", "plop-ovillo", "miau-gatito-1", "miau-gatito-2"];
export const sampleUrl = (id: SampleId) => `./assets/audio/gatitos/${id}.wav`;
/** Nota en la que se grabó cada instrumento afinado; el juego los transporta cambiando la velocidad de reproducción. */
const SAMPLE_PITCH = { "marimba-do5": 523.25, "flauta-sol5": 783.99, "pizzicato-do3": 130.81 } as const;
/** Un sample y su volumen. `rate` transporta los afinados. */
export type PartySample = { id: SampleId; gain: number; rate?: number };
const sample = (id: SampleId, gain: number): PartySample => ({ id, gain });
const pitched = (id: keyof typeof SAMPLE_PITCH, frequency: number, gain: number): PartySample => ({ id, gain, rate: frequency / SAMPLE_PITCH[id] });

/**
 * Nota de la partitura. Los campos del oscilador son el sonido de respaldo; `sample` es el sonido definitivo:
 * si está cargado se toca él, y `null` significa que otro sample ya sustituye a esta nota. Una nota con
 * volumen 0 solo suena como sample.
 */
export type PartyNote = { offset: number; frequency: number; duration: number; wave: OscillatorType; volume: number; bus: "music" | "cue"; glideTo?: number; noise?: boolean; sample?: PartySample | null };

const CHORDS = [
  { root: 130.81, tones: [523.25, 659.25, 783.99] }, // Do
  { root: 98.0, tones: [493.88, 587.33, 783.99] },   // Sol
  { root: 110.0, tones: [440.0, 523.25, 659.25] },   // La menor
  { root: 87.31, tones: [440.0, 523.25, 698.46] },   // Fa
] as const;
const CLOSING_SCALE = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
const chordOfBar = (bar: number) => CHORDS[((bar - 2) % CHORDS.length + CHORDS.length) % CHORDS.length];

/** Notas de una corchea (medio pulso) de la canción, según la partitura. */
export function musicForEighth(run: PartyRun, eighth: number): PartyNote[] {
  const { score } = run;
  if (eighth < 0 || eighth >= scoreLength(score) * 2) return [];
  const onPulse = eighth % 2 === 0;
  const pulse = eighth / 2;
  const bar = barOfPulse(Math.floor(pulse));
  const inBar = Math.floor(pulse) % PULSES_PER_BAR;
  const notes: PartyNote[] = [];
  if (bar === 1) {
    if (onPulse) notes.push({ offset: 0, frequency: inBar === 0 ? 880 : 660, duration: 0.12, wave: "sine", volume: 0.08, bus: "cue" });
    return notes;
  }
  if (bar > score.bars - score.closingBars) {
    const index = eighth - (score.bars - score.closingBars) * PULSES_PER_BAR * 2;
    if (index < CLOSING_SCALE.length) notes.push({ offset: 0, frequency: CLOSING_SCALE[index], duration: 0.25, wave: "triangle", volume: 0.09, bus: "music", sample: pitched("marimba-do5", CLOSING_SCALE[index], 0.4) });
    if (index === CLOSING_SCALE.length) for (const frequency of [523.25, 659.25, 783.99, 1046.5]) notes.push({ offset: 0, frequency, duration: 1.4, wave: "triangle", volume: 0.05, bus: "music", sample: pitched("flauta-sol5", frequency, 0.14) });
    if (onPulse) notes.push({ offset: 0, frequency: 0, duration: 0.07, wave: "sine", volume: 0.04, bus: "music", noise: true, sample: sample("cascabeles", 0.12) });
    return notes;
  }
  const chord = chordOfBar(bar);
  if (onPulse && (inBar === 0 || inBar === 2)) notes.push({ offset: 0, frequency: chord.root, duration: 0.32, wave: "triangle", volume: 0.11, bus: "music", sample: pitched("pizzicato-do3", chord.root, 0.5) });
  if (onPulse && (inBar === 1 || inBar === 3)) {
    notes.push({ offset: 0, frequency: 1450, duration: 0.05, wave: "square", volume: 0.02, bus: "music", sample: sample("madera", 0.27) });
    notes.push({ offset: 0, frequency: 720, duration: 0.06, wave: "sine", volume: 0.04, bus: "music", sample: null });
  }
  if (!onPulse) notes.push({ offset: 0, frequency: chord.tones[(eighth >> 1) % 3] / 2, duration: 0.14, wave: "triangle", volume: 0.035, bus: "music", sample: sample("cascabeles", 0.12) });
  notes.push({ offset: 0, frequency: 0, duration: 0.07, wave: "sine", volume: onPulse ? 0.018 : 0.012, bus: "music", noise: true, sample: null });
  if (onPulse && inBar === 0 && bar % 2 === 0) notes.push({ offset: 0, frequency: 0, duration: 0.4, wave: "sine", volume: 0, bus: "music", sample: pitched("flauta-sol5", chord.tones[2], 0.22) });
  if (onPulse) for (const item of run.pieces) {
    if (item.push === pulse) notes.push(item.type === "yarn"
      ? { offset: 0, frequency: 1250, duration: 0.14, wave: "sine", volume: 0.07, bus: "cue", glideTo: 820, sample: sample("plop-ovillo", 0.3) }
      : { offset: 0, frequency: 780, duration: 0.2, wave: "sine", volume: 0.07, bus: "cue", glideTo: 470, sample: sample("miau-gatito-1", 0.32) });
    if (item.type === "medium" && item.push + 1 === pulse) notes.push({ offset: 0.01, frequency: 780, duration: 0.2, wave: "sine", volume: 0.07, bus: "cue", glideTo: 470, sample: sample("miau-gatito-2", 0.32) });
  }
  return notes;
}

/** Sonidos del golpe de la jugadora. Con samples: hachazo y marimba en la nota del acorde. */
export const hitSamples = (frequency: number): PartySample[] => [sample("hachazo", 0.36), pitched("marimba-do5", frequency, 0.4)];
export const MISS_SAMPLE: PartySample = sample("golpe-sordo", 0.3);
export const ROLL_SAMPLE: PartySample = sample("golpe-sordo", 0.15);

/** Cada acierto toca la siguiente nota del acorde del compás en curso. */
export function leadNote(run: PartyRun, pulse: number) {
  const chord = chordOfBar(Math.max(2, barOfPulse(Math.round(pulse))));
  return chord.tones[run.noteIndex++ % chord.tones.length];
}

/** Pulso actual a partir del reloj de audio, descontando la latencia de salida. */
export const audioPulse = (currentTime: number, songStart: number, latencySeconds: number) =>
  (currentTime - songStart - latencySeconds) * 1000 / PULSE_MS;
