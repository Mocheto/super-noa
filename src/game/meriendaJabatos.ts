import { outputLatencySeconds } from "./rhythmEngine.ts";
import { t } from "../textos/index.ts";

export { outputLatencySeconds };

// «La merienda de los jabatos»: duelo rítmico del Gran Jabalí. El Gran Jabalí gruñe para llamar a un jabato,
// el jabato asoma tras el arbusto y abre la boca al compás, y Noa le da su bocado justo cuando la boca está
// abierta del todo. Todo se mide en pulsos sobre una rejilla a tempo fijo.
export const MERIENDA_LEVEL_ID = "4-3";
export const MERIENDA_BPM = 100;
export const PULSE_MS = 60_000 / MERIENDA_BPM;
export const PULSES_PER_BAR = 4;
export const COUNT_PULSES = PULSES_PER_BAR;
export const HIT_WINDOW_PULSES = 0.5; // medio pulso: ±300 ms a 100 pulsos por minuto
export const RESUME_COUNT_PULSES = 4;

export type MeriendaMode = "demo" | "practice" | "song";
export type Phase = 1 | 2 | 3;
export type JabatoKind = "pequeno" | "grande" | "gloton";
export type Food = "bellota" | "castana";

/** Cada jabato: a cuántos pulsos de la llamada come, qué come, cómo lo llama el Gran Jabalí y desde qué fase sale. */
export const JABATOS: Record<JabatoKind, { bites: readonly number[]; food: Food; call: string; fromPhase: Phase }> = {
  pequeno: { bites: [2], food: "bellota", call: t("minijuegos.merienda.gru.rotulo"), fromPhase: 1 },
  grande: { bites: [4], food: "castana", call: t("minijuegos.merienda.gruuuu.rotulo"), fromPhase: 2 },
  gloton: { bites: [2, 3], food: "bellota", call: "¡Gru-gru!", fromPhase: 3 },
};

export const PHASE_NAMES: Record<Phase, string> = { 1: t("minijuegos.merienda.bellotas-tranquilas.rotulo"), 2: t("minijuegos.merienda.llega-el-grande.rotulo"), 3: t("minijuegos.merienda.merienda-glotona.rotulo") };

/** Una llamada del Gran Jabalí: pulso contado desde el primer pulso de la merienda (tras la cuenta). */
export type Call = { phase: Phase; at: number; kind: JabatoKind };
/** `bars`: compases de merienda (sin la cuenta); `closingBars`: compases de fanfarria al final. */
export type MeriendaScore = { calls: readonly Call[]; bars: number; closingBars: number; auto: boolean };

const call = (phase: Phase, at: number, kind: JabatoKind): Call => ({ phase, at, kind });

export const meriendaScores: Record<MeriendaMode, MeriendaScore> = {
  song: {
    bars: 20,
    closingBars: 2,
    auto: false,
    calls: [
      call(1, 0, "pequeno"), call(1, 4, "pequeno"), call(1, 8, "pequeno"), call(1, 12, "pequeno"), call(1, 16, "pequeno"), call(1, 20, "pequeno"),
      call(2, 24, "pequeno"), call(2, 28, "grande"), call(2, 34, "pequeno"), call(2, 38, "pequeno"), call(2, 42, "grande"), call(2, 47, "pequeno"), call(2, 50, "pequeno"),
      call(3, 53, "pequeno"), call(3, 56, "gloton"), call(3, 60, "grande"), call(3, 65, "pequeno"), call(3, 68, "gloton"), call(3, 72, "pequeno"), call(3, 75, "gloton"),
    ],
  },
  demo: { bars: 3, closingBars: 1, auto: true, calls: [call(1, 0, "pequeno"), call(2, 4, "grande")] },
  practice: { bars: 4, closingBars: 1, auto: false, calls: [call(1, 0, "pequeno"), call(1, 4, "pequeno"), call(2, 8, "grande")] },
};

export const barsOf = (score: MeriendaScore) => 1 + score.bars + score.closingBars;
export const scoreLength = (score: MeriendaScore) => barsOf(score) * PULSES_PER_BAR;
export const bitesIn = (score: MeriendaScore) => score.calls.reduce((total, item) => total + JABATOS[item.kind].bites.length, 0);
/** La raya dorada de la rama: la mitad de los bocados, redondeando hacia arriba. */
export const goalOf = (score: MeriendaScore) => Math.ceil(bitesIn(score) / 2);
export const callPulse = (item: Call) => COUNT_PULSES + item.at;
export const bitePulses = (item: Call) => JABATOS[item.kind].bites.map((delay) => callPulse(item) + delay);
const meriendaEnd = (score: MeriendaScore) => COUNT_PULSES + score.bars * PULSES_PER_BAR;

/** Reglas que toda partitura debe cumplir. Devuelve una lista de incumplimientos legibles. */
export function validateScore(score: MeriendaScore): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(score.bars) || score.bars < 1) errors.push("merienda sin compases enteros");
  if (!Number.isInteger(score.closingBars) || score.closingBars < 0) errors.push("cierre sin compases enteros");
  let lastBite = -1;
  score.calls.forEach((item, index) => {
    const label = `jabato ${index + 1}`;
    if (!Number.isInteger(item.at) || item.at < 0) errors.push(`${label} fuera de la rejilla`);
    if (callPulse(item) <= lastBite) errors.push(`${label} se solapa con el anterior`);
    if (item.phase < JABATOS[item.kind].fromPhase) errors.push(`${label}: el ${item.kind} sale desde la fase ${JABATOS[item.kind].fromPhase}`);
    if (index > 0 && item.phase < score.calls[index - 1].phase) errors.push(`${label}: la fase va hacia atrás`);
    if (bitePulses(item).at(-1)! >= meriendaEnd(score)) errors.push(`${label} come después de la merienda`);
    lastBite = bitePulses(item).at(-1)!;
  });
  return errors;
}

export type Part = { kind: "count" | "merienda" | "end"; beat: number; phase: Phase | null };

/** Parte de la canción en un pulso: cuenta, merienda (con su fase) o fanfarria. `beat` va de 0 a 3. */
export function partAt(score: MeriendaScore, pulse: number): Part {
  const whole = Math.floor(pulse);
  const beat = ((whole % PULSES_PER_BAR) + PULSES_PER_BAR) % PULSES_PER_BAR;
  if (whole < COUNT_PULSES) return { kind: "count", beat, phase: null };
  if (whole >= meriendaEnd(score)) return { kind: "end", beat, phase: null };
  const phase = score.calls.filter((item) => callPulse(item) <= whole).at(-1)?.phase ?? score.calls[0]?.phase ?? 1;
  return { kind: "merienda", beat, phase };
}

// ---------------------------------------------------------------- partida

export type Bite = { jabato: number; order: number; pulse: number; fedAt: number | null; missed: boolean };
export type Jabato = { index: number; kind: JabatoKind; phase: Phase; call: number; bites: Bite[] };
export type MeriendaRun = { mode: MeriendaMode; score: MeriendaScore; jabatos: Jabato[]; bites: Bite[]; got: number; extra: number };
export type PressResult = { kind: "fed"; bite: Bite; jabato: Jabato } | { kind: "fsss" };

export function createRun(mode: MeriendaMode): MeriendaRun {
  const score = meriendaScores[mode];
  let order = 0;
  const jabatos = score.calls.map((item, index): Jabato => ({
    index, kind: item.kind, phase: item.phase, call: callPulse(item),
    bites: bitePulses(item).map((pulse) => ({ jabato: index, order: order++, pulse, fedAt: null, missed: false })),
  }));
  return { mode, score, jabatos, bites: jabatos.flatMap((item) => item.bites), got: 0, extra: 0 };
}

const open = (bite: Bite) => bite.fedAt === null && !bite.missed;

/**
 * Pulsación de la jugadora. Da de comer al bocado libre más cercano a menos de medio pulso; si no hay ninguno
 * (antes de tiempo, en un silencio o repetido), Noa hace «fsss» con la mano vacía y no se resta nada.
 */
export function pressAt(run: MeriendaRun, pulse: number): PressResult {
  let best: Bite | null = null;
  for (const bite of run.bites) {
    if (!open(bite) || Math.abs(pulse - bite.pulse) > HIT_WINDOW_PULSES) continue;
    if (!best || Math.abs(pulse - bite.pulse) < Math.abs(pulse - best.pulse)) best = bite;
  }
  if (!best) { run.extra += 1; return { kind: "fsss" }; }
  best.fedAt = pulse;
  run.got += 1;
  return { kind: "fed", bite: best, jabato: run.jabatos[best.jabato] };
}

/** Bocados que se acaban de escapar: ya pasó su medio pulso de margen sin que Noa les diera de comer. */
export function missesAt(run: MeriendaRun, pulse: number): Bite[] {
  if (run.score.auto) return [];
  const missed = run.bites.filter((bite) => open(bite) && pulse > bite.pulse + HIT_WINDOW_PULSES);
  for (const bite of missed) bite.missed = true;
  return missed;
}

/** En la demostración, Noa da de comer sola en cada bocado. */
export function autoFeeds(run: MeriendaRun, pulse: number): PressResult[] {
  const results: PressResult[] = [];
  for (const bite of run.bites) {
    if (open(bite) && pulse >= bite.pulse) {
      bite.fedAt = bite.pulse;
      run.got += 1;
      results.push({ kind: "fed", bite, jabato: run.jabatos[bite.jabato] });
    }
  }
  return results;
}

/** Jabato que asoma ahora: sube con la llamada y se esconde poco después de su último bocado. */
export const activeJabato = (run: MeriendaRun, pulse: number) =>
  run.jabatos.find((item) => pulse >= item.call - 0.05 && pulse < item.bites.at(-1)!.pulse + 0.85) ?? null;

/** Poses de las tiras de jabatos: boca cerrada, entreabierta, abierta, masticando y triste. */
export type JabatoPose = 0 | 1 | 2 | 3 | 4;

/**
 * La boca se entreabre el pulso anterior al bocado y se abre del todo en el pulso del bocado. Tras comer,
 * mastica un momento; si se le escapó el último bocado, se pone triste.
 */
export function jabatoPose(jabato: Jabato, pulse: number): JabatoPose {
  const whole = Math.floor(pulse + 0.001);
  const munching = jabato.bites.some((bite) => bite.fedAt !== null && pulse >= bite.fedAt && pulse - bite.fedAt < 0.35);
  if (munching) return 3;
  const next = jabato.bites.find(open);
  if (!next) return jabato.bites.some((bite) => bite.missed) ? 4 : 0;
  if (whole >= next.pulse) return 2;
  return whole >= next.pulse - 1 && whole > jabato.call ? 1 : 0;
}

export type DotState = "off" | "on" | "ok" | "gone";
export type Dot = { pulse: number; bite: boolean; big: boolean; state: DotState };

/** Cuenta atrás del jabato: un punto por pulso desde la llamada hasta su último bocado; los de bocado son bellotas. */
export function dotsFor(jabato: Jabato, pulse: number): Dot[] {
  const whole = Math.floor(pulse + 0.001);
  const dots: Dot[] = [];
  for (let at = jabato.call + 1; at <= jabato.bites.at(-1)!.pulse; at++) {
    const bite = jabato.bites.find((item) => item.pulse === at);
    const state: DotState = bite?.fedAt != null ? "ok" : bite?.missed ? "gone" : whole >= at ? "on" : "off";
    dots.push({ pulse: at, bite: Boolean(bite), big: Boolean(bite) && jabato.kind === "grande", state });
  }
  return dots;
}

export type Outcome = { result: "casi" | "bien" | "perfecto"; won: boolean; challengeCompleted: boolean };

/** La victoria pide la raya dorada de la rama; el reto, que ningún jabato se quede con hambre. «Fsss» no cuenta. */
export function outcomeOf(run: MeriendaRun): Outcome {
  const perfect = run.got === bitesIn(run.score);
  const won = run.got >= goalOf(run.score);
  return { result: perfect ? "perfecto" : won ? "bien" : "casi", won, challengeCompleted: perfect };
}

/** «Practicar» se destaca la primera vez: Gran Jabalí aún no vencido, sin revancha y sin intentos en esta visita. */
export const practiceFirst = (levelCompleted: boolean, friendlyReplay: boolean, attempted: boolean) => !levelCompleted && !friendlyReplay && !attempted;

/** Una pulsación cuenta solo al bajar: mantener la tecla o el botón cuenta una vez. */
export const risingEdge = (previous: boolean, current: boolean) => current && !previous;

// ---------------------------------------------------------------- relojes

/** Pulso actual a partir del reloj de audio, descontando la latencia de salida. */
export const audioPulse = (currentTime: number, songStart: number, latencySeconds: number) =>
  (currentTime - songStart - latencySeconds) * 1000 / PULSE_MS;

/**
 * Al seguir tras una pausa, el Gran Jabalí cuenta cuatro pulsos con la escena quieta. Devuelve el nuevo inicio
 * de la canción para que, al acabar la cuenta, el reloj de audio marque el mismo pulso en que se pausó.
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

// ---------------------------------------------------------------- música «merendero del bosque» (original)

export type MeriendaNote = {
  offset: number;
  frequency: number;
  duration: number;
  wave: OscillatorType;
  volume: number;
  bus: "music" | "cue";
  glideTo?: number;
  attack?: number;
  /** Vibrato suave y nota sostenida (ocarina y flauta). */
  breath?: boolean;
  /** Ruido blanco en lugar de oscilador. */
  noise?: boolean;
  filter?: { type: BiquadFilterType; frequency: number };
};

const BEAT_S = PULSE_MS / 1000;
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
// Fa mayor: Fa · Si♭ · Do · Fa, un acorde por compás.
const CHORDS: readonly (readonly number[])[] = [[53, 57, 60], [58, 62, 65], [60, 64, 67], [53, 57, 60]];
// Ocarina en frases de dos compases: [nota, corchea dentro de la frase, corcheas que dura].
const OCARINA: readonly (readonly [number, number, number])[] = [[72, 0, 2], [69, 2, 2], [70, 4, 3], [74, 8, 2], [72, 10, 2], [67, 12, 3]];
const FANFARE = [65, 69, 72, 77, 81, 84];

const noise = (duration: number, volume: number, type: BiquadFilterType, frequency: number, bus: MeriendaNote["bus"] = "music", offset = 0): MeriendaNote =>
  ({ offset, frequency: 0, duration, wave: "sine", volume, bus, noise: true, filter: { type, frequency } });
const bass = (midi: number): MeriendaNote[] => [
  { offset: 0, frequency: hz(midi), duration: BEAT_S * 0.7, wave: "triangle", volume: 0.18, bus: "music" },
  { offset: 0, frequency: hz(midi) * 2, duration: 0.08, wave: "sine", volume: 0.04, bus: "music" },
];
const pluck = (midi: number, volume = 0.045): MeriendaNote[] => [
  { offset: 0, frequency: hz(midi), duration: 0.22, wave: "triangle", volume, bus: "music", attack: 0.002 },
  { offset: 0, frequency: hz(midi) * 2, duration: 0.06, wave: "square", volume: volume * 0.15, bus: "music", attack: 0.002 },
];
const wood = (volume = 0.07): MeriendaNote[] => [
  { offset: 0, frequency: 1250, duration: 0.05, wave: "sine", volume, bus: "music" },
  noise(0.02, volume * 0.5, "bandpass", 2500),
];
const ocarina = (midi: number, duration: number, volume = 0.05): MeriendaNote => ({ offset: 0, frequency: hz(midi), duration, wave: "sine", volume, bus: "music", breath: true, attack: 0.07 });
export const kalimba = (midi: number, volume = 0.16, bus: MeriendaNote["bus"] = "cue"): MeriendaNote[] => [
  { offset: 0, frequency: hz(midi), duration: 0.7, wave: "sine", volume, bus, attack: 0.002 },
  { offset: 0, frequency: hz(midi) * 5.4, duration: 0.08, wave: "sine", volume: volume * 0.25, bus, attack: 0.002 },
];
const bells = (volume = 0.05): MeriendaNote[] => [2740, 3620, 4980].map((frequency, index) => ({ offset: index * 0.02, frequency, duration: 0.3, wave: "sine", volume: volume * (1 - index * 0.2), bus: "music" }));
/** Gruñido del Gran Jabalí: sierra filtrada que cae de tono, con un resoplido grave. */
export const grunt = (big: boolean, offset = 0, bus: MeriendaNote["bus"] = "music"): MeriendaNote[] => [
  { offset, frequency: big ? 110 : 165, glideTo: big ? 72 : 120, duration: big ? 0.5 : 0.18, wave: "sawtooth", volume: 0.22, bus, attack: 0.02, filter: { type: "lowpass", frequency: big ? 700 : 1000 } },
  noise(big ? 0.35 : 0.2, 0.06, "lowpass", 500, bus, offset),
];
/** Frufrú del arbusto cuando asoma el jabato. */
const rustle = (): MeriendaNote[] => [noise(0.18, 0.05, "bandpass", 3500, "music", 0.05), noise(0.14, 0.04, "bandpass", 2800, "music", 0.11)];
/** «tic»: cada punto de la cuenta atrás del jabato. */
const TIC: MeriendaNote[] = [{ offset: 0, frequency: 2100, duration: 0.04, wave: "sine", volume: 0.05, bus: "music" }];
/** «ñam»: dos mordiscos, más graves en el jabato grande. */
export const munch = (big: boolean, bus: MeriendaNote["bus"] = "cue"): MeriendaNote[] => [
  noise(0.05, big ? 0.32 : 0.22, "bandpass", big ? 1200 : 1800, bus),
  noise(0.05, big ? 0.26 : 0.18, "bandpass", big ? 1000 : 1500, bus, 0.09),
];
/** «toc» de la bellota que rebota en el suelo y el gruñidito triste del jabato. */
export const MISS: MeriendaNote[] = [
  { offset: 0, frequency: 880, duration: 0.06, wave: "sine", volume: 0.08, bus: "cue" },
  { offset: 0.12, frequency: 620, duration: 0.06, wave: "sine", volume: 0.06, bus: "cue" },
  { offset: 0.08, frequency: 190, glideTo: 140, duration: 0.25, wave: "triangle", volume: 0.07, bus: "cue" },
];
/** «fsss»: la mano de Noa pasa vacía. */
export const FSSS: MeriendaNote[] = [noise(0.12, 0.05, "highpass", 4000, "cue")];
/** Pezuña del Gran Jabalí en la cuenta: más aguda en el primer pulso. */
export const hoof = (first: boolean): MeriendaNote[] => [
  { offset: 0, frequency: first ? 300 : 220, duration: 0.07, wave: "triangle", volume: 0.12, bus: "cue" },
  noise(0.03, 0.05, "lowpass", 800, "cue"),
];

/** Nota de kalimba de un bocado: completa la melodía con una nota del acorde de su compás; el grande, más grave. */
export function biteNote(run: MeriendaRun, bite: Bite) {
  const chord = CHORDS[Math.floor(bite.pulse / PULSES_PER_BAR) % CHORDS.length];
  const midi = [chord[2] + 12, chord[1] + 12, chord[0] + 24][bite.order % 3];
  return run.jabatos[bite.jabato].kind === "grande" ? midi - 12 : midi;
}

/** Sonido de un bocado acertado: «ñam» y su nota de kalimba. */
export const biteSound = (run: MeriendaRun, bite: Bite, bus: MeriendaNote["bus"] = "cue") =>
  [...munch(run.jabatos[bite.jabato].kind === "grande", bus), ...kalimba(biteNote(run, bite), bus === "cue" ? 0.16 : 0.15, bus)];

/** Notas de una corchea (medio pulso) de la canción, según la partitura. */
export function musicForEighth(run: MeriendaRun, eighth: number): MeriendaNote[] {
  const { score } = run;
  if (eighth < 0 || eighth >= scoreLength(score) * 2) return [];
  const onPulse = eighth % 2 === 0;
  const pulse = Math.floor(eighth / 2);
  const beat = pulse % PULSES_PER_BAR;
  const bar = Math.floor(pulse / PULSES_PER_BAR);
  const chord = CHORDS[bar % CHORDS.length];
  const part = partAt(score, pulse);
  const notes: MeriendaNote[] = [];
  if (part.kind === "count") {
    if (onPulse) notes.push(...hoof(beat === 0).map((note) => ({ ...note, bus: "music" as const })));
    return notes;
  }
  if (part.kind === "end") { // fanfarria de flauta y cascabeles
    const index = eighth - meriendaEnd(score) * 2;
    if (index < FANFARE.length) notes.push({ ...ocarina(FANFARE[index], 0.25, 0.07) });
    if (index === 0 || index === 8) notes.push(...bells(0.06));
    if (onPulse && index < 8) notes.push(...bass(chord[0] - 12));
    if (index === 8) { for (const midi of [77, 81, 84]) notes.push(...kalimba(midi, 0.08, "music")); notes.push(...bass(41)); }
    return notes;
  }
  // Acompañamiento: contrabajo en 1 y 3, madera en 2 y 4, punteo en los «y» y ocarina dos compases sí y dos no.
  if (onPulse && (beat === 0 || beat === 2)) notes.push(...bass(chord[0] - 12 + (beat === 2 ? 7 : 0)));
  if (onPulse && (beat === 1 || beat === 3)) notes.push(...wood());
  if (!onPulse) notes.push(...pluck(chord[(eighth >> 1) % 3]));
  if (Math.floor((bar - 1) / 2) % 2 === 0) {
    const inPhrase = eighth - (bar - ((bar - 1) % 2)) * PULSES_PER_BAR * 2;
    for (const [midi, at, length] of OCARINA) if (at === inPhrase) notes.push(ocarina(midi, length * BEAT_S / 2 * 0.95));
  }
  if (!onPulse) return notes;
  // Llamadas con frufrú, «tic» de la cuenta atrás y, en la demostración, los bocados de Noa.
  for (const jabato of run.jabatos) {
    if (jabato.call === pulse) {
      notes.push(...grunt(jabato.kind === "grande"), ...rustle());
      if (jabato.kind === "gloton") notes.push(...grunt(false, BEAT_S / 2));
    }
    if (pulse > jabato.call && pulse < jabato.bites[0].pulse) notes.push(...TIC);
    if (score.auto) for (const bite of jabato.bites) if (bite.pulse === pulse) notes.push(...biteSound(run, bite, "music"));
  }
  return notes;
}

// ---------------------------------------------------------------- escena (coordenadas de 960 × 540)

/** Huecos de las 23 bellotas sobre la rama (en % de su ancho): 12 sobre las cazoletas y 11 entre ellas. */
export const branchSlot = (index: number, total: number) => {
  const first = 34 / 460, last = 374 / 460;
  return total <= 1 ? 50 : (first + (last - first) * index / (total - 1)) * 100;
};
