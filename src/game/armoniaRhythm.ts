import { beatTimeMs, nearestRhythmTarget } from "./rhythmEngine.ts";

export { beatTimeMs };

export const ARMONIA_BEAT_COUNT = 8;
export const ARMONIA_TARGET_COUNT = 3;
export const ARMONIA_ROUNDS = 3;
export const ARMONIA_COUNT_IN_BEATS = 4;
export const ARMONIA_DEFAULT_WINDOW_MS = 180;

export type ArmoniaMelody = {
  id: string;
  name: string;
  audio: { kind: "synth"; waveform: "sine" | "triangle"; notesHz: readonly number[] };
  targetBeatIndexes: readonly number[];
  compatibleBpms: readonly number[];
  windowMs: number;
};

export type ArmoniaRound = { melody: ArmoniaMelody; bpm: number };

export const armoniaMelodies: readonly ArmoniaMelody[] = [
  {
    id: "luciernagas",
    name: "Luciérnagas",
    audio: { kind: "synth", waveform: "triangle", notesHz: [523, 659, 587, 784, 698, 587, 880, 659] },
    targetBeatIndexes: [1, 4, 6], compatibleBpms: [86, 92, 98, 104, 110], windowMs: ARMONIA_DEFAULT_WINDOW_MS,
  },
  {
    id: "brisa",
    name: "Brisa de colores",
    audio: { kind: "synth", waveform: "sine", notesHz: [587, 698, 523, 659, 784, 659, 587, 880] },
    targetBeatIndexes: [0, 3, 6], compatibleBpms: [86, 92, 98, 104, 110], windowMs: ARMONIA_DEFAULT_WINDOW_MS,
  },
  {
    id: "caracol",
    name: "El caracol cantor",
    audio: { kind: "synth", waveform: "triangle", notesHz: [440, 523, 659, 587, 698, 784, 587, 880] },
    targetBeatIndexes: [2, 5, 7], compatibleBpms: [86, 92, 98, 104, 110], windowMs: ARMONIA_DEFAULT_WINDOW_MS,
  },
  {
    id: "hojas",
    name: "Hojas bailarinas",
    audio: { kind: "synth", waveform: "sine", notesHz: [494, 587, 659, 784, 587, 698, 880, 659] },
    targetBeatIndexes: [1, 3, 5], compatibleBpms: [86, 92, 98, 104, 110], windowMs: ARMONIA_DEFAULT_WINDOW_MS,
  },
];

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.max(0, Math.min(index, Math.floor(random() * (index + 1))));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function makeArmoniaChallenge(
  melodies: readonly ArmoniaMelody[] = armoniaMelodies,
  random: () => number = Math.random,
): ArmoniaRound[] {
  const orderedMelodies = shuffled(melodies, random);
  const chosen: ArmoniaRound[] = [];

  const search = (remaining: readonly ArmoniaMelody[], usedBpms: ReadonlySet<number>): boolean => {
    if (chosen.length === ARMONIA_ROUNDS) return true;
    for (const melody of remaining) {
      for (const bpm of shuffled(melody.compatibleBpms, random)) {
        if (usedBpms.has(bpm)) continue;
        chosen.push({ melody, bpm });
        if (search(remaining.filter((item) => item.id !== melody.id), new Set([...usedBpms, bpm]))) return true;
        chosen.pop();
      }
    }
    return false;
  };

  if (!search(orderedMelodies, new Set())) {
    throw new RangeError("Faltan melodías o tempos distintos para el reto de Armonía.");
  }
  return chosen;
}

export function findTargetWithinWindow(
  musicPositionMs: number,
  round: ArmoniaRound,
  alreadyHit: ReadonlySet<number>,
): number | null {
  const beatMs = 60_000 / round.bpm;
  const available = round.melody.targetBeatIndexes.filter((index) => !alreadyHit.has(index));
  return nearestRhythmTarget(available, musicPositionMs, round.melody.windowMs, (index) => index * beatMs);
}

export function adjustArmoniaScore(score: number, delta: 1 | -1) {
  return Math.max(0, Math.min(ARMONIA_TARGET_COUNT, score + delta));
}
