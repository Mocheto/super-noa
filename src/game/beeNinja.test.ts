import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  BEE_BPM, BEE_NINJA_LEVEL_ID, COUNT_PULSES, CUT_POINT, FLIGHT_PULSES, HERO, HERO_FRAME, HERO_SCALE, HIT_WINDOW_PULSES, PLOF_SOUND, PULSE_MS, RESUME_COUNT_PULSES,
  SAMPLE_IDS, UY_SOUND, WIN_AT, cutSound, sampleUrl,
  advanceFrameClock, audioPulse, autoCuts, beeScores, collectFalls, createRun, cutPulses, firstCutPulse, flowersIn, jarLevel,
  musicForEighth, nextOpenCut, outcomeOf, practiceFirst, pressAt, risingEdge, scoreLength, songStartAfterPause, targetPlacement,
  targetVisible, throwPulses, validateScore, type Score, type ScoreItem,
} from "./beeNinja.ts";
import { bossCatalog } from "./bosses.ts";
import { guardianGames, isGuardianGameId } from "./guardianGames.ts";
import { levels } from "./levels.ts";
import { parseProgress, serializeProgress } from "./progress.ts";

const asset = (path: string) => existsSync(new URL(`../../public/assets/${path}`, import.meta.url));
const cutAll = (mode: "song" | "practice", except = 0) => {
  const run = createRun(mode);
  let skipped = 0;
  for (const target of run.targets) {
    if (target.kind !== "flower") continue;
    if (skipped < except) { skipped++; continue; }
    pressAt(run, target.cut);
  }
  collectFalls(run, scoreLength(run.score));
  return run;
};

test("la abeja ninja es el duelo de la Reina Melisa y sus recursos existen", () => {
  const final = levels.find((level) => level.id === BEE_NINJA_LEVEL_ID);
  assert.equal(final?.world, 11);
  assert.equal(final?.boss, "queen-bee");
  for (const path of ["sprites/noa-abeja-v1.webp", "sprites/tarro-miel-v1.webp", "sprites/flores-abeja-v1.webp", "sprites/mariquita-v1.webp", "atlases/giant-valley-characters-v1.png", "worlds/world-11.webp"]) assert.ok(asset(path), path);
  const component = readFileSync(new URL("./BeeNinjaGame.tsx", import.meta.url), "utf8") + readFileSync(new URL("./beeNinja.css", import.meta.url), "utf8");
  for (const match of component.matchAll(/\.\/assets\/([\w/.-]+\.(?:webp|png))/g)) assert.ok(asset(match[1]), match[1]);
  assert.doesNotMatch(component, /-v0\.png|<svg/, "el arte provisional se ha sustituido");
});

test("el punto de corte es la punta del aguijón de Noa-abeja, reflejada para mirar a Melisa", () => {
  assert.ok(Math.abs(HERO.width - HERO_FRAME.width * HERO_SCALE) < 1e-9);
  assert.ok(Math.abs(HERO.height - HERO_FRAME.height * HERO_SCALE) < 1e-9);
  assert.ok(Math.abs(CUT_POINT.x - (HERO.left + (HERO_FRAME.width - HERO_FRAME.tipX) * HERO_SCALE)) < 1e-9);
  assert.ok(Math.abs(CUT_POINT.y - (HERO.top + HERO_FRAME.tipY * HERO_SCALE)) < 1e-9);
  assert.ok(CUT_POINT.x > HERO.left && CUT_POINT.x < HERO.left + 20, "la punta queda por delante de Noa, mirando a la izquierda");
  assert.ok(Math.abs(HERO.top + HERO.height - 455) < 1, "los pies apoyan en la hierba");
});

const wav = (id: string) => readFileSync(new URL(`../../public/assets/audio/abeja-ninja/${id}.wav`, import.meta.url));

test("cada sample del jardín ninja existe como WAV mono de 16 bits a 32 kHz y la ruta es relativa", () => {
  assert.equal(SAMPLE_IDS.length, 12);
  for (const id of SAMPLE_IDS) {
    const bytes = wav(id);
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF", id);
    assert.deepEqual([bytes.readUInt16LE(20), bytes.readUInt16LE(22), bytes.readUInt32LE(24), bytes.readUInt16LE(34)], [1, 1, 32000, 16], id);
    assert.match(sampleUrl(id), /^\.\/assets\/audio\/abeja-ninja\/[a-z0-9-]+\.wav$/);
  }
});

test("la canción y los efectos usan todos los samples y conservan el sonido de respaldo", () => {
  const run = createRun("song");
  const notes = [
    ...Array.from({ length: scoreLength(run.score) * 2 }, (_, eighth) => musicForEighth(run, eighth)).flat(),
    ...cutSound(587.33), ...UY_SOUND, ...PLOF_SOUND,
  ];
  const used = new Set<string>();
  for (const note of notes) {
    if (note.sample) {
      used.add(note.sample.id);
      assert.ok(note.sample.gain > 0 && note.sample.gain <= 0.6, `volumen ${note.sample.gain}`);
      const rate = note.sample.rate ?? 1;
      assert.ok(rate >= 0.49 && rate <= 2.1, `velocidad ${rate}`);
    } else if (note.sample === undefined) assert.ok(note.volume > 0, "una nota sin sample necesita su oscilador");
  }
  assert.deepEqual([...used].sort(), [...SAMPLE_IDS].sort());
  for (const note of cutSound(587.33)) if (note.sample !== null) assert.ok(note.volume > 0, "el corte suena también sin samples");
});

test("Flores para la colmena se retira y el reto pide no dejar caer ninguna flor", () => {
  assert.equal(isGuardianGameId("queen-bee"), false);
  assert.equal("queen-bee" in guardianGames, false);
  const melisa = bossCatalog["queen-bee"];
  assert.equal(melisa.challenge.id, "perfect-game");
  assert.match(melisa.challenge.label, /sin dejar caer ninguna/);
  const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
  assert.match(app, /activeLevel\.boss === "queen-bee" \? <BeeNinjaGame/);
  assert.match(app, /beeNinjaDuel/, "la música del mundo se silencia durante el duelo");
});

test("un guardado con el marco de flores lo conserva sin migración", () => {
  const saved = JSON.stringify({ version: 2, unlocked: 33, levelStats: { "11-3": { completed: true, bestApples: 3 } }, stickers: [], bossChallenges: { "queen-bee": true } });
  const progress = parseProgress(saved);
  assert.equal(progress.bossChallenges["queen-bee"], true);
  assert.equal(parseProgress(serializeProgress(progress)).bossChallenges["queen-bee"], true);
});

test("las tres partituras cumplen las reglas y la canción tiene la forma acordada", () => {
  for (const [mode, score] of Object.entries(beeScores)) assert.deepEqual(validateScore(score), [], mode);
  const song = beeScores.song;
  assert.equal(BEE_BPM, 104);
  assert.equal(song.bars, 24);
  assert.equal(flowersIn(song), 41);
  const ladybugs = song.items.filter((item) => item.type === "ladybug");
  assert.equal(ladybugs.length, 2);
  assert.ok(ladybugs.every((item) => item.bar >= 19));
  assert.equal(firstCutPulse(song.items[0]), 6, "la flor de muestra se corta en el pulso 3 del compás 2");
  assert.equal(throwPulses(song.items[0])[0], COUNT_PULSES, "el primer lanzamiento llega justo al acabar la cuenta");
  assert.deepEqual(cutPulses({ type: "duo", bar: 11, pulse: 1 }), [40, 41]);
  assert.deepEqual(throwPulses({ type: "duo", bar: 11, pulse: 1 }), [38, 39]);
  assert.ok(song.items.every((item) => item.bar <= song.bars - song.closingBars), "el cierre no lleva flores");
});

test("las reglas detectan cada incumplimiento", () => {
  const base: Omit<Score, "items"> = { bars: 8, closingBars: 1, ladybugFromBar: 5, phases: [] };
  const errors = (items: ScoreItem[]) => validateScore({ ...base, items }).join(" | ");
  assert.match(errors([{ type: "flower", bar: 3, pulse: 1.5 }]), /rejilla/);
  assert.match(errors([{ type: "flower", bar: 8, pulse: 1 }]), /rejilla/, "nada en el cierre");
  assert.match(errors([{ type: "flower", bar: 3, pulse: 1 }, { type: "flower", bar: 3, pulse: 1 }]), /dos llegadas/);
  assert.match(errors([{ type: "duo", bar: 3, pulse: 1 }, { type: "flower", bar: 3, pulse: 3 }]), /pulso libre/);
  assert.match(errors([{ type: "flower", bar: 3, pulse: 1 }, { type: "flower", bar: 3, pulse: 2 }, { type: "flower", bar: 3, pulse: 3 }]), /tres llegadas/);
  assert.match(errors([{ type: "ladybug", bar: 3, pulse: 1 }]), /mariquita/);
  assert.match(errors([{ type: "flower", bar: 2, pulse: 1 }]), /cuenta/);
});

test("el margen de medio pulso incluye sus bordes y un corte adelantado no pierde la flor", () => {
  const first = () => createRun("practice").targets[0];
  const edge = (offset: number) => { const run = createRun("practice"); return pressAt(run, first().cut + offset).kind; };
  assert.equal(edge(-HIT_WINDOW_PULSES - 0.01), "empty");
  assert.equal(edge(-HIT_WINDOW_PULSES), "cut");
  assert.equal(edge(HIT_WINDOW_PULSES), "cut");
  assert.equal(edge(HIT_WINDOW_PULSES + 0.01), "empty");
  assert.ok(Math.abs(HIT_WINDOW_PULSES * PULSE_MS - 288) < 1, "unos ±288 ms");

  const run = createRun("practice");
  const flower = run.targets[0];
  assert.equal(pressAt(run, flower.cut - 0.8).kind, "empty", "¡Uy!: demasiado pronto");
  assert.equal(flower.cutAt, null, "la flor sigue volando");
  assert.equal(pressAt(run, flower.cut).kind, "cut");
  assert.equal(pressAt(run, flower.cut + 0.1).kind, "empty", "una flor solo se corta una vez");
  assert.equal(run.cut, 1);
});

test("el dúo pide dos cortes seguidos y una flor sin cortar cae", () => {
  const run = createRun("practice");
  const duo = run.targets.filter((target) => target.duo);
  assert.equal(duo.length, 2);
  assert.equal(duo[1].cut - duo[0].cut, 1);
  assert.equal(pressAt(run, duo[0].cut).kind, "cut");
  assert.deepEqual(collectFalls(run, duo[1].cut + HIT_WINDOW_PULSES), run.targets.filter((target) => target.kind === "flower" && target.cut < duo[0].cut));
  const fallen = collectFalls(run, duo[1].cut + HIT_WINDOW_PULSES + 0.01);
  assert.deepEqual(fallen.map((target) => target.id), [duo[1].id]);
  assert.equal(targetVisible(duo[1], duo[1].fallenAt! + 1), false, "termina de caer");
});

test("pulsar con la mariquita no suma ni resta y dejarla pasar no es un fallo", () => {
  const run = createRun("practice");
  const ladybug = run.targets.find((target) => target.kind === "ladybug")!;
  assert.equal(pressAt(run, ladybug.cut).kind, "ladybug");
  assert.notEqual(ladybug.greetedAt, null);
  assert.equal(pressAt(run, ladybug.cut + 0.05).kind, "empty", "saluda una sola vez");
  assert.equal(run.cut, 0);
  assert.equal(collectFalls(run, scoreLength(run.score)).some((target) => target.kind === "ladybug"), false);
});

test("mantener pulsado cuenta una sola vez", () => {
  assert.equal(risingEdge(false, true), true);
  assert.equal(risingEdge(true, true), false);
  assert.equal(risingEdge(true, false), false);
});

test("se gana con 21 flores y el reto solo sin dejar caer ninguna", () => {
  assert.equal(WIN_AT, 21);
  const twenty = cutAll("song", 21);
  assert.equal(twenty.cut, 20);
  assert.deepEqual(outcomeOf(twenty), { result: "casi", won: false, challengeCompleted: false });
  const twentyOne = cutAll("song", 20);
  assert.deepEqual(outcomeOf(twentyOne), { result: "bien", won: true, challengeCompleted: false });
  const all = cutAll("song");
  assert.equal(all.cut, 41);
  assert.deepEqual(outcomeOf(all), { result: "perfecto", won: true, challengeCompleted: true });
  assert.deepEqual([0, 7, 8, 20, 21, 30, 31, 41].map(jarLevel), [0, 0, 1, 1, 2, 2, 3, 4]);
});

test("Practicar se destaca solo la primera vez", () => {
  assert.equal(practiceFirst(false, false, false), true);
  assert.equal(practiceFirst(true, false, false), false, "Melisa ya vencida");
  assert.equal(practiceFirst(false, true, false), false, "revancha amistosa");
  assert.equal(practiceFirst(false, false, true), false, "tras el primer intento");
});

test("en la demostración Noa-abeja corta sola cada flor en su pulso", () => {
  const run = createRun("demo");
  for (let pulse = 0; pulse <= scoreLength(run.score); pulse += 0.25) autoCuts(run, pulse);
  assert.equal(run.cut, flowersIn(run.score));
  assert.deepEqual(collectFalls(run, scoreLength(run.score)), []);
});

test("la pausa con cuenta de cuatro retoma el reloj de audio en el mismo pulso", () => {
  const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);
  const songStart = 10, pausedAt = 25, latency = 0.04;
  const frozen = audioPulse(pausedAt, songStart, latency);
  const countStart = pausedAt + 0.05;
  const nextStart = songStartAfterPause(songStart, pausedAt, countStart);
  close(audioPulse(countStart + RESUME_COUNT_PULSES * PULSE_MS / 1000, nextStart, latency), frozen);
  close(audioPulse(10.0 + PULSE_MS / 1000, 10, 0), 1);
});

test("el reloj de fotogramas avanza sin audio y se detiene durante la cuenta", () => {
  let clock = { frameMs: 0, countMs: 0 };
  for (let frame = 0; frame < 60; frame++) clock = advanceFrameClock(clock, 1000 / 60);
  assert.ok(Math.abs(clock.frameMs - 1000) < 1e-6);
  clock = advanceFrameClock({ frameMs: 1000, countMs: 4 * PULSE_MS }, 50);
  assert.equal(clock.frameMs, 1000);
  clock = { frameMs: 1000, countMs: 30 };
  clock = advanceFrameClock(clock, 50);
  assert.deepEqual(clock, { frameMs: 1020, countMs: 0 });
  assert.equal(advanceFrameClock({ frameMs: 0, countMs: 0 }, 5000).frameMs, 100, "un salto largo no adelanta la canción");
});

test("las flores vuelan dos pulsos en arco hasta la punta de la varita", () => {
  const run = createRun("practice");
  const flower = run.targets[0];
  const landing = targetPlacement(flower, flower.cut);
  assert.ok(Math.abs(landing.x - CUT_POINT.x) < 1e-9 && Math.abs(landing.y - CUT_POINT.y) < 1e-9);
  assert.equal(flower.cut - flower.appear, FLIGHT_PULSES);
  assert.ok(targetPlacement(flower, flower.appear + 1).y < CUT_POINT.y - 100, "sube en arco");
  const ladybug = run.targets.find((target) => target.kind === "ladybug")!;
  assert.ok(Math.abs(targetPlacement(ladybug, ladybug.cut, true).x - CUT_POINT.x) < 1e-9);
  assert.equal(nextOpenCut(run, 0), flower.cut);
});

test("la canción cuenta cuatro pulsos, suena el zum de cada lanzamiento y termina con fanfarria", () => {
  const run = createRun("song");
  assert.deepEqual([0, 2, 4, 6].map((eighth) => musicForEighth(run, eighth).filter((note) => note.bus === "cue").length), [1, 1, 1, 1]);
  const zumAt = (pulse: number) => musicForEighth(run, pulse * 2).filter((note) => note.wave === "sawtooth" && note.bus === "cue");
  const duo = run.score.items.find((item) => item.type === "duo")!;
  assert.equal(zumAt(throwPulses(duo)[0]).length, 2, "¡zum-zum!");
  const flower = run.score.items[0];
  assert.equal(zumAt(throwPulses(flower)[0]).length, 1, "¡zum!");
  const ladybug = run.score.items.find((item) => item.type === "ladybug")!;
  assert.ok(musicForEighth(run, (firstCutPulse(ladybug) - FLIGHT_PULSES) * 2).some((note) => note.frequency === 2093), "¡bzz-tin!");
  const closingStart = (run.score.bars - run.score.closingBars) * 8;
  const fanfare = Array.from({ length: 11 }, (_, index) => musicForEighth(run, closingStart + index).find((note) => note.wave === "triangle")!.frequency);
  assert.deepEqual(fanfare, [...fanfare].sort((a, b) => a - b));
  assert.deepEqual(musicForEighth(run, scoreLength(run.score) * 2), []);
});
