import { outputLatencySeconds } from "./rhythmEngine.ts";
import type { PerfilSintesis } from "./ritmoAudio.ts";
import { ajustesRitmo, anotarAcierto, anotarVacia, esRebote, nuevaRaya, type Raya } from "./pulsacionVacia.ts";
import { t } from "../textos/index.ts";

export { outputLatencySeconds };

// «La abeja ninja»: duelo rítmico de la Reina Melisa. Melisa lanza flores y Noa-abeja las corta
// con la varita-aguijón cuando llegan a su punta. Todo se mide en pulsos sobre una rejilla a tempo fijo.
export const BEE_NINJA_LEVEL_ID = "11-3";
export const BEE_BPM = 104;
export const PULSE_MS = 60_000 / BEE_BPM;
export const PULSES_PER_BAR = 4;
export const COUNT_PULSES = PULSES_PER_BAR;
export const FLIGHT_PULSES = 2;
export const HIT_WINDOW_PULSES = ajustesRitmo.margen; // medio pulso por defecto (±300 ms); ajustable con ?ritmoMargen=
export const WIN_AT = 21;
export const RESUME_COUNT_PULSES = 4;
export const FALL_PULSES = 0.9;

export type ItemType = "flower" | "duo" | "ladybug";
export type BeeMode = "demo" | "practice" | "song";
/** Cada elemento se escribe por tipo y por el compás y pulso de su (primer) corte. */
export type ScoreItem = { type: ItemType; bar: number; pulse: number };
export type Score = {
  bars: number;
  closingBars: number;
  ladybugFromBar: number;
  /** Carteles de fase: solo cuando llega una pieza nueva, con su sprite y hasta dos palabras. */
  phases: readonly { fromBar: number; name: string; piece: "flower" | "duo" | "ladybug" }[];
  items: readonly ScoreItem[];
};

const at = (bar: number, pulse: number, type: ItemType = "flower"): ScoreItem => ({ type, bar, pulse });
const busyBar = (bar: number, last: ItemType = "flower") => [at(bar, 1, "duo"), at(bar, 4, last)];
const pairBar = (bar: number) => [at(bar, 1), at(bar, 3)];

export const beeScores: Record<BeeMode, Score> = {
  song: {
    bars: 24,
    closingBars: 2,
    ladybugFromBar: 19,
    phases: [
      { fromBar: 2, name: t("minijuegos.abeja.fase.flor.rotulo"), piece: "flower" }, { fromBar: 11, name: t("minijuegos.abeja.fase.duo.rotulo"), piece: "duo" },
      { fromBar: 19, name: t("minijuegos.abeja.fase.mariquita.rotulo"), piece: "ladybug" },
    ],
    items: [
      at(2, 3),
      ...[3, 4, 5, 6].map((bar) => at(bar, 1)), ...[7, 8, 9, 10].flatMap(pairBar),
      ...[11, 13, 15, 17].flatMap((bar) => [...busyBar(bar), ...pairBar(bar + 1)]),
      ...[19, 21].flatMap((bar) => [...busyBar(bar, "ladybug"), ...pairBar(bar + 1)]),
    ],
  },
  practice: {
    bars: 6,
    closingBars: 0,
    ladybugFromBar: 2,
    phases: [],
    items: [at(2, 3), at(3, 3), at(4, 1, "duo"), at(5, 1, "ladybug")],
  },
  demo: {
    bars: 5,
    closingBars: 0,
    ladybugFromBar: 2,
    phases: [],
    items: [at(2, 3), at(3, 3, "duo"), at(4, 3, "ladybug")],
  },
};

export const firstCutPulse = ({ bar, pulse }: ScoreItem) => (bar - 1) * PULSES_PER_BAR + pulse - 1;
export const cutPulses = (item: ScoreItem) => item.type === "duo" ? [firstCutPulse(item), firstCutPulse(item) + 1] : [firstCutPulse(item)];
/** Pulsos en que Melisa lanza: dos pulsos antes de cada corte. La mariquita llega volando sola. */
export const throwPulses = (item: ScoreItem) => item.type === "ladybug" ? [] : cutPulses(item).map((cut) => cut - FLIGHT_PULSES);
export const barOfPulse = (pulse: number) => Math.floor(pulse / PULSES_PER_BAR) + 1;
export const scoreLength = (score: Score) => score.bars * PULSES_PER_BAR;
export const flowersIn = (score: Score) => score.items.reduce((total, item) => total + (item.type === "ladybug" ? 0 : cutPulses(item).length), 0);

/** Reglas que toda partitura debe cumplir. Devuelve una lista de incumplimientos legibles. */
export function validateScore(score: Score): string[] {
  const errors: string[] = [];
  const arrivals = new Set<number>();
  const throws = new Set<number>();
  const playableBars = score.bars - score.closingBars;
  for (const item of score.items) {
    const label = `${item.type} del compás ${item.bar}, pulso ${item.pulse}`;
    const cuts = cutPulses(item);
    if (!Number.isInteger(item.bar) || !Number.isInteger(item.pulse) || item.pulse < 1 || item.pulse > PULSES_PER_BAR || item.bar < 2
      || cuts.some((cut) => barOfPulse(cut) > playableBars)) errors.push(`corte fuera de la rejilla: ${label}`);
    for (const cut of cuts) {
      if (arrivals.has(cut)) errors.push(`dos llegadas en el mismo pulso: ${label}`);
      arrivals.add(cut);
    }
    for (const pulse of throwPulses(item)) {
      if (throws.has(pulse)) errors.push(`dos lanzamientos en el mismo pulso: ${label}`);
      throws.add(pulse);
    }
    if (cuts[0] - FLIGHT_PULSES < COUNT_PULSES) errors.push(`lanzamiento durante la cuenta: ${label}`);
    if (item.type === "ladybug" && item.bar < score.ladybugFromBar) errors.push(`mariquita antes de su fase: ${label}`);
  }
  for (const item of score.items) {
    if (item.type === "duo" && arrivals.has(firstCutPulse(item) + 2)) errors.push(`sin pulso libre tras el dúo del compás ${item.bar}, pulso ${item.pulse}`);
  }
  const sorted = [...arrivals].sort((a, b) => a - b);
  for (let index = 2; index < sorted.length; index++) {
    if (sorted[index] - sorted[index - 2] === 2) errors.push(`tres llegadas seguidas hasta el pulso ${sorted[index]}`);
  }
  return errors;
}

// ---------------------------------------------------------------- partida

export type Target = {
  id: number;
  kind: "flower" | "ladybug";
  cut: number;
  appear: number;
  duo: boolean;
  color: number;
  cutAt: number | null;
  fallenAt: number | null;
  greetedAt: number | null;
};

/** `cut` cuenta todas las flores cortadas; la raya dorada mira `cuenta.raya`, que bajan las pulsaciones vacías. */
export type BeeRun = { mode: BeeMode; score: Score; targets: Target[]; cut: number; fallen: number; noteIndex: number; cuenta: Raya };

export type PressResult =
  | { kind: "cut"; target: Target }
  | { kind: "ladybug"; target: Target; resta: boolean }
  | { kind: "empty"; resta: boolean }
  | { kind: "rebote" };

export function createRun(mode: BeeMode): BeeRun {
  const score = beeScores[mode];
  const targets: Target[] = [];
  let color = 0;
  for (const item of score.items) {
    for (const cut of cutPulses(item)) {
      const ladybug = item.type === "ladybug";
      targets.push({ id: targets.length, kind: ladybug ? "ladybug" : "flower", cut, appear: cut - FLIGHT_PULSES, duo: item.type === "duo", color: ladybug ? 0 : color++, cutAt: null, fallenAt: null, greetedAt: null });
    }
  }
  return { mode, score, targets, cut: 0, fallen: 0, noteIndex: 0, cuenta: nuevaRaya() };
}

const flying = (target: Target) => target.kind === "flower" && target.cutAt === null && target.fallenAt === null;

/**
 * Corte de la jugadora en el pulso dado. Corta la flor más cercana dentro del margen. Un corte fuera
 * del margen no hace nada a las flores: siguen volando y aún pueden cortarse a tiempo. Pero en la canción es una
 * pulsación vacía y baja una gota del tarro, igual que cortar la mariquita; el rebote tras un corte no cuenta.
 */
export function pressAt(run: BeeRun, pulse: number): PressResult {
  if (esRebote(run.cuenta, pulse)) return { kind: "rebote" };
  const cuesta = run.mode === "song";
  let best: Target | null = null;
  let bestDistance = Infinity;
  for (const target of run.targets) {
    const open = target.kind === "ladybug" ? target.greetedAt === null : flying(target);
    if (!open) continue;
    const distance = Math.abs(pulse - target.cut);
    if (distance <= HIT_WINDOW_PULSES && distance < bestDistance) { bestDistance = distance; best = target; }
  }
  if (!best) return { kind: "empty", resta: anotarVacia(run.cuenta, cuesta) };
  if (best.kind === "ladybug") { best.greetedAt = pulse; return { kind: "ladybug", target: best, resta: anotarVacia(run.cuenta, cuesta) }; }
  best.cutAt = pulse;
  run.cut += 1;
  anotarAcierto(run.cuenta, pulse);
  return { kind: "cut", target: best };
}

/** En la demostración, Noa-abeja corta sola cada flor en su pulso. */
export function autoCuts(run: BeeRun, pulse: number): PressResult[] {
  const results: PressResult[] = [];
  for (const target of run.targets) {
    if (flying(target) && pulse >= target.cut) {
      target.cutAt = target.cut;
      run.cut += 1;
      anotarAcierto(run.cuenta, target.cut);
      results.push({ kind: "cut", target });
    }
  }
  return results;
}

/** Marca como caídas las flores cuyo margen ya pasó. Devuelve las que acaban de caer. */
export function collectFalls(run: BeeRun, pulse: number): Target[] {
  const fallen: Target[] = [];
  for (const target of run.targets) {
    if (flying(target) && pulse > target.cut + HIT_WINDOW_PULSES) {
      target.fallenAt = pulse;
      run.fallen += 1;
      fallen.push(target);
    }
  }
  return fallen;
}

export function nextOpenCut(run: BeeRun, pulse: number) {
  let next = Infinity;
  for (const target of run.targets) if (flying(target) && target.cut >= pulse - HIT_WINDOW_PULSES) next = Math.min(next, target.cut);
  return next;
}

export type Outcome = { result: "casi" | "bien" | "perfecto"; won: boolean; challengeCompleted: boolean };

/** La victoria pide la raya dorada; el reto, que no caiga ninguna flor y ninguna pulsación vacía. */
export function outcomeOf(run: BeeRun): Outcome {
  const total = flowersIn(run.score);
  const perfect = run.cut === total && run.fallen === 0 && run.cuenta.vacias === 0;
  const won = run.cuenta.raya >= WIN_AT;
  return { result: perfect ? "perfecto" : won ? "bien" : "casi", won, challengeCompleted: perfect };
}

/** Nivel del tarro de miel (0–4). El nivel 2 es la raya dorada. */
export const jarLevel = (cut: number) => cut >= 41 ? 4 : cut >= 31 ? 3 : cut >= WIN_AT ? 2 : cut >= 8 ? 1 : 0;

/** «Practicar» se destaca la primera vez: Melisa aún no vencida, sin revancha y sin intentos en esta visita. */
export const practiceFirst = (levelCompleted: boolean, friendlyReplay: boolean, attempted: boolean) => !levelCompleted && !friendlyReplay && !attempted;

/** Una pulsación cuenta solo al bajar: mantener la tecla o el botón cuenta una vez. */
export const risingEdge = (previous: boolean, current: boolean) => current && !previous;

// ---------------------------------------------------------------- relojes

/** Pulso actual a partir del reloj de audio, descontando la latencia de salida. */
export const audioPulse = (currentTime: number, songStart: number, latencySeconds: number) =>
  (currentTime - songStart - latencySeconds) * 1000 / PULSE_MS;

/**
 * Al seguir tras una pausa, Melisa cuenta cuatro pulsos con la escena quieta. Devuelve el nuevo inicio de la
 * canción para que, al acabar la cuenta, el reloj de audio marque el mismo pulso en que se pausó.
 */
export const songStartAfterPause = (songStart: number, pausedAt: number, countStart: number) =>
  songStart + (countStart - pausedAt) + RESUME_COUNT_PULSES * PULSE_MS / 1000;

/** Reloj de fotogramas (sin audio): no avanza mientras dura la cuenta de reanudación. */
export function advanceFrameClock(clock: { frameMs: number; countMs: number }, deltaMs: number) {
  const step = Math.min(100, Math.max(0, deltaMs));
  if (clock.countMs > 0) {
    const used = Math.min(clock.countMs, step);
    return { frameMs: clock.frameMs + (step - used), countMs: clock.countMs - used };
  }
  return { frameMs: clock.frameMs + step, countMs: 0 };
}

// ---------------------------------------------------------------- escena (coordenadas de 960 × 540)

/**
 * Fotograma de `noa-abeja-v1.webp` (tira de 4 celdas mirando a la derecha) y punta del aguijón en la pose
 * «corta», en píxeles del archivo. Salen de `prototypes/tools/abeja-ninja-recorte.py`.
 */
export const HERO_FRAME = { width: 206, height: 372, tipX: 199.6, tipY: 216.1 };
/** Escala del archivo en escena: la pose de espera mide unos 190 píxeles, como la Reina Melisa de pie. */
export const HERO_SCALE = 0.6;
/** Noa-abeja en escena, reflejada para mirar a Melisa; los pies apoyan en la hierba (y = 455). */
export const HERO = { left: 679, top: 232, width: HERO_FRAME.width * HERO_SCALE, height: HERO_FRAME.height * HERO_SCALE };
/** Punta del aguijón en la pose «corta», reflejada: el punto de corte. */
export const CUT_POINT = {
  x: HERO.left + (HERO_FRAME.width - HERO_FRAME.tipX) * HERO.width / HERO_FRAME.width,
  y: HERO.top + HERO_FRAME.tipY * HERO.height / HERO_FRAME.height,
};
export const THROW_ORIGIN = { x: 200, y: 292 };
const ARC_PEAK = 170;

export type Placement = { x: number; y: number; rotation: number; opacity: number };

export function targetPlacement(target: Target, pulse: number, reduceMotion = false): Placement {
  const progress = (pulse - target.appear) / FLIGHT_PULSES;
  if (target.kind === "ladybug") {
    return { x: -40 + (CUT_POINT.x + 40) * progress, y: CUT_POINT.y - 6 + (reduceMotion ? 0 : Math.sin(progress * 12) * 6), rotation: 0, opacity: 1 };
  }
  if (target.fallenAt !== null) {
    const fall = Math.min(1, Math.max(0, (pulse - target.fallenAt) / FALL_PULSES));
    const from = targetPlacement({ ...target, fallenAt: null }, target.fallenAt, reduceMotion);
    return { x: from.x + 30 * fall, y: from.y + (470 - from.y) * fall * fall, rotation: reduceMotion ? 0 : from.rotation + 90 * fall, opacity: 1 - 0.6 * fall };
  }
  const q = Math.min(1.3, Math.max(0, progress));
  return {
    x: THROW_ORIGIN.x + (CUT_POINT.x - THROW_ORIGIN.x) * q,
    y: THROW_ORIGIN.y + (CUT_POINT.y - THROW_ORIGIN.y) * q - 4 * ARC_PEAK * q * (1 - q),
    rotation: reduceMotion ? 0 : q * 540,
    opacity: 1,
  };
}

export const targetVisible = (target: Target, pulse: number) => pulse >= target.appear - 0.02 && target.cutAt === null
  && !(target.fallenAt !== null && pulse - target.fallenAt >= FALL_PULSES)
  && !(target.kind === "ladybug" && pulse > target.cut + FLIGHT_PULSES);

// ---------------------------------------------------------------- música «jardín ninja» (original)

// Samples originales del «jardín ninja» (prototypes/tools/abeja-ninja-samples.py).
export type SampleId = "koto-re5" | "flauta-bambu-la5" | "taiko" | "bajo-re3" | "zumbido" | "zum" | "zum-zum" | "bzz-tin" | "shing" | "toque-sordo" | "plof" | "fanfarria";
export const SAMPLE_IDS: readonly SampleId[] = ["koto-re5", "flauta-bambu-la5", "taiko", "bajo-re3", "zumbido", "zum", "zum-zum", "bzz-tin", "shing", "toque-sordo", "plof", "fanfarria"];
export const sampleUrl = (id: SampleId) => `./assets/audio/abeja-ninja/${id}.wav`;
const SAMPLE_PITCH = { "koto-re5": 587.33, "flauta-bambu-la5": 880, "bajo-re3": 146.83, "zumbido": 170 } as const;
/** Un sample y su volumen. `rate` transporta los afinados. */
export type BeeSample = { id: SampleId; gain: number; rate?: number };
const sample = (id: SampleId, gain: number): BeeSample => ({ id, gain });
const pitched = (id: keyof typeof SAMPLE_PITCH, frequency: number, gain: number): BeeSample => ({ id, gain, rate: frequency / SAMPLE_PITCH[id] });

/**
 * Nota de la partitura. Los campos del oscilador son el sonido de respaldo (si los samples no han cargado);
 * `sample` es el sonido definitivo, y `null` indica que, con samples, esta nota no suena (otro la sustituye).
 */
export type BeeNote = {
  sample?: BeeSample | null;
  offset: number;
  frequency: number;
  duration: number;
  wave: OscillatorType;
  volume: number;
  bus: "music" | "cue";
  glideTo?: number;
  noise?: "high" | "low" | "band";
  vibrato?: boolean;
};

// Escala pentatónica yo sobre re: re, mi, sol, la, si.
const HZ = { G2: 98.0, A2: 110.0, B2: 123.47, D3: 146.83, E3: 164.81, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0, B4: 493.88, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0, B5: 987.77, D6: 1174.66 } as const;
type NoteName = keyof typeof HZ;
const BASS: readonly (readonly [number, number])[] = [[HZ.D3, HZ.A2], [HZ.G2, HZ.D3], [HZ.B2, HZ.E3], [HZ.A2, HZ.E3]];
export const LEAD_MELODY = (["A4", "B4", "D5", "E5", "D5", "B4", "A4", "G4", "A4", "D5", "E5", "G5", "E5", "D5", "B4", "A4", "B4", "D5", "E5", "A5", "G5", "E5", "D5", "E5"] as NoteName[]).map((name) => HZ[name]);
const FLUTE: readonly (readonly (NoteName | null)[])[] = [[null, "A5"], [null, null, "G5", "E5"], [null, "B5"], [null, null, "A5", "G5"]];
export const FANFARE = [HZ.D4, HZ.E4, HZ.G4, HZ.A4, HZ.B4, HZ.D5, HZ.E5, HZ.G5, HZ.A5, HZ.B5, HZ.D6];
const bassOfBar = (bar: number) => BASS[((bar - 2) % BASS.length + BASS.length) % BASS.length];

const koto = (frequency: number, volume = 0.11, bus: BeeNote["bus"] = "music"): BeeNote[] => [
  { offset: 0, frequency, duration: 0.55, wave: "triangle", volume, bus, glideTo: frequency * 0.995, sample: pitched("koto-re5", frequency, Math.min(0.6, volume * 3.2)) },
  { offset: 0, frequency: frequency * 2, duration: 0.12, wave: "sine", volume: volume * 0.35, bus, sample: null },
];
const taiko = (volume: number): BeeNote[] => [
  { offset: 0, frequency: 120, duration: 0.32, wave: "sine", volume, bus: "music", glideTo: 52, sample: sample("taiko", Math.min(0.6, volume * 2.4)) },
  { offset: 0, frequency: 0, duration: 0.05, wave: "sine", volume: volume * 0.25, bus: "music", noise: "low", sample: null },
];
const tap = (): BeeNote[] => [
  { offset: 0, frequency: 660, duration: 0.05, wave: "square", volume: 0.02, bus: "music" },
  { offset: 0, frequency: 0, duration: 0.04, wave: "sine", volume: 0.025, bus: "music", noise: "band" },
];
export const ZUM = (double: boolean): BeeNote[] => [
  { offset: 0, frequency: 260, duration: 0.16, wave: "sawtooth", volume: 0.05, bus: "cue", glideTo: 400, sample: sample(double ? "zum-zum" : "zum", 0.3) },
  ...(double ? [{ offset: 0.09, frequency: 300, duration: 0.14, wave: "sawtooth" as const, volume: 0.045, bus: "cue" as const, glideTo: 460, sample: null }] : []),
];
export const BZZ_TIN: BeeNote[] = [
  { offset: 0, frequency: 420, duration: 0.16, wave: "sawtooth", volume: 0.03, bus: "cue", glideTo: 380, sample: sample("bzz-tin", 0.32) },
  { offset: 0.12, frequency: 2093, duration: 0.25, wave: "sine", volume: 0.06, bus: "cue", sample: null },
];
/** Corte acertado: la siguiente nota de la melodía en koto y el «¡shing!» del aguijón. */
export const cutSound = (frequency: number): BeeNote[] => [
  ...koto(frequency, 0.16, "cue"),
  { offset: 0, frequency: 0, duration: 0.09, wave: "sine", volume: 0.09, bus: "cue", noise: "high", sample: sample("shing", 0.26) },
  { offset: 0, frequency: 2600, duration: 0.16, wave: "sine", volume: 0.04, bus: "cue", glideTo: 3300, sample: null },
];
/** «¡Uy!»: el toque sordo de un corte a destiempo, que no resta. */
export const UY_SOUND: BeeNote[] = [{ offset: 0, frequency: 110, duration: 0.16, wave: "sine", volume: 0.14, bus: "cue", glideTo: 80, sample: sample("toque-sordo", 0.4) }];
/** «plof»: una flor cae a la hierba. */
export const PLOF_SOUND: BeeNote[] = [{ offset: 0, frequency: 200, duration: 0.2, wave: "triangle", volume: 0.06, bus: "cue", glideTo: 90, sample: sample("plof", 0.32) }];
export const COUNT_TICK = (first: boolean): BeeNote[] => [{ offset: 0, frequency: first ? 1046.5 : 784, duration: 0.1, wave: "sine", volume: 0.09, bus: "cue" }];

/** Síntesis del «jardín ninja»: ruidos de 6000/900/3000 Hz y vibrato de 5,5 Hz para la flauta. */
export const PERFIL_ABEJA: PerfilSintesis = {
  ataque: 0.006, colaRuido: 0.02, segundosRuido: 0.25, conTramo: true,
  filtrosRuido: { high: { type: "highpass", frequency: 6000 }, low: { type: "lowpass", frequency: 900 }, band: { type: "bandpass", frequency: 3000 } },
  vibrato: { hz: 5.5, profundidad: 0.012, ataque: 0.06, cola: 0.05 },
};

/** Notas de una corchea (medio pulso) de la canción, según la partitura. */
export function musicForEighth(run: BeeRun, eighth: number): BeeNote[] {
  const { score } = run;
  if (eighth < 0 || eighth >= scoreLength(score) * 2) return [];
  const onPulse = eighth % 2 === 0;
  const pulse = eighth / 2;
  const bar = barOfPulse(Math.floor(pulse));
  const inBar = Math.floor(pulse) % PULSES_PER_BAR;
  const half = eighth % 8;
  const notes: BeeNote[] = [];
  if (bar === 1) {
    if (onPulse) notes.push(...COUNT_TICK(inBar === 0), ...tap());
    return notes;
  }
  if (bar > score.bars - score.closingBars) {
    const index = eighth - (score.bars - score.closingBars) * PULSES_PER_BAR * 2;
    if (index < FANFARE.length) notes.push(...koto(FANFARE[index]));
    if (index === FANFARE.length) {
      notes.push({ offset: 0, frequency: 0, duration: 0.1, wave: "sine", volume: 0, bus: "music", sample: sample("fanfarria", 0.5) });
      for (const frequency of [HZ.D5, HZ.A5, HZ.D6]) notes.push(...koto(frequency, 0.08).map((note) => ({ ...note, sample: null })));
      notes.push(...taiko(0.3).map((note) => ({ ...note, sample: null })));
    }
    if (index < FANFARE.length && onPulse) notes.push(...taiko(0.12));
    return notes;
  }
  const [root, fifth] = bassOfBar(bar);
  if (onPulse && (inBar === 0 || inBar === 2)) notes.push(...taiko(inBar === 0 ? 0.2 : 0.13));
  if (onPulse && (inBar === 1 || inBar === 3)) notes.push(...tap());
  if (half === 0 || half === 3 || half === 4 || half === 7) {
    const frequency = half === 3 || half === 7 ? fifth : root;
    notes.push({ offset: 0, frequency, duration: 0.24, wave: "triangle", volume: 0.1, bus: "music", sample: pitched("bajo-re3", frequency, 0.34) });
  }
  if (!onPulse) notes.push({ offset: 0, frequency: 0, duration: 0.03, wave: "sine", volume: 0.012, bus: "music", noise: "high" });
  if (half === 0 && bar % 2 === 0) notes.push({ offset: 0, frequency: 170, duration: 0.5, wave: "sawtooth", volume: 0.018, bus: "music", glideTo: 190, sample: sample("zumbido", 0.08) });
  const flute = FLUTE[(bar - 2) % FLUTE.length][Math.floor(half / 2)];
  if (flute && !onPulse && bar % 4 === 1) notes.push({ offset: 0, frequency: HZ[flute], duration: 0.4, wave: "sine", volume: 0.045, bus: "music", vibrato: true, sample: pitched("flauta-bambu-la5", HZ[flute], 0.16) });
  if (onPulse) {
    for (const item of score.items) {
      const throws = throwPulses(item);
      if (throws[0] === pulse) notes.push(...ZUM(item.type === "duo"));
      if (item.type === "ladybug" && firstCutPulse(item) - FLIGHT_PULSES === pulse) notes.push(...BZZ_TIN);
    }
  }
  return notes;
}

/** Cada corte acertado toca la siguiente nota de la melodía en koto. */
export const leadNote = (run: BeeRun) => LEAD_MELODY[run.noteIndex++ % LEAD_MELODY.length];
