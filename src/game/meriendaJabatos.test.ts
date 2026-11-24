import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  COUNT_PULSES, HIT_WINDOW_PULSES, JABATOS, MERIENDA_BPM, MERIENDA_LEVEL_ID, PULSE_MS, RESUME_COUNT_PULSES, activeJabato, advanceFrameClock,
  audioPulse, autoFeeds, barsOf, biteNote, bitePulses, bitesIn, branchSlot, callPulse, createRun, dotsFor, goalOf, jabatoPose, meriendaScores,
  missesAt, musicForEighth, outcomeOf, partAt, practiceFirst, pressAt, risingEdge, scoreLength, songStartAfterPause, validateScore,
  type MeriendaScore,
} from "./meriendaJabatos.ts";
import { bossCatalog } from "./bosses.ts";
import { guardianGames, isGuardianGameId } from "./guardianGames.ts";
import { levels } from "./levels.ts";
import { parseProgress, serializeProgress } from "./progress.ts";
import { musicaDePantalla } from "./musicaDePantalla.ts";

const asset = (path: string) => existsSync(new URL(`../../public/assets/${path}`, import.meta.url));
const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
/** Da de comer a todos los bocados de la canción en su pulso exacto, salvo los `skip` primeros. */
const playSong = (skip = 0) => {
  const run = createRun("song");
  run.bites.forEach((bite, index) => { if (index >= skip) pressAt(run, bite.pulse); });
  missesAt(run, scoreLength(run.score));
  return run;
};

test("la merienda de los jabatos es el duelo del Gran Jabalí en la 4-3 y sus recursos existen", () => {
  const final = levels.find((level) => level.id === MERIENDA_LEVEL_ID);
  assert.equal(final?.world, 4);
  assert.equal(final?.boss, "great-boar");
  for (const path of [
    "sprites/noa-guarda-v1.webp", "sprites/jabato-pequeno-v1.webp", "sprites/jabato-grande-v1.webp", "sprites/bellota-v1.webp", "sprites/castana-v1.webp",
    "sprites/cesta-v1.webp", "sprites/arbusto-merienda-v1.webp", "sprites/roca-merienda-v1.webp", "sprites/rama-bellotas-vacia-v1.webp", "worlds/world-4-hd-v1.webp",
    ...[0, 1, 2, 3, 4].map((pose) => `sprites/boss-gran-jabali-${pose}.webp`),
  ]) assert.ok(asset(path), path);
  const component = read("./MeriendaJabatosGame.tsx") + read("./meriendaJabatos.css");
  for (const match of component.matchAll(/\.\/assets\/([\w/.-]+\.(?:webp|png))/g)) assert.ok(asset(match[1]), match[1]);
  assert.doesNotMatch(component, /public\/assets/, "las rutas del arte son relativas al sitio publicado");
  assert.match(read("./DueloDelGuardian.tsx"), /level\.boss === "great-boar" \? <MeriendaJabatosGame/);
  assert.equal(musicaDePantalla("boss", { world: 1, boss: "great-boar" }, { shopActive: false, paused: false, muted: false, musicVolume: 100, starActive: false }).mundo.playing, false, "la música del mundo se silencia durante el duelo");
});

test("«Esquiva la carrera» se retira y el reto pide que ningún jabato se quede con hambre", () => {
  assert.equal(isGuardianGameId("great-boar"), false);
  assert.equal("great-boar" in guardianGames, false);
  assert.doesNotMatch(read("./guardianGames.ts"), /dodgeOptions|choiceAnswer|Esquiva la carrera/);
  assert.doesNotMatch(read("./GuardianMiniGame.tsx"), /great-boar|choiceAnswer/);
  assert.ok(asset("sprites/guardian-game-icons-v1.webp"), "se conserva el atlas de iconos");
  const boar = bossCatalog["great-boar"];
  assert.equal(boar.challenge.id, "perfect-game");
  assert.equal(boar.challenge.label, "Dale de comer a todos los jabatos sin que ninguno se quede con hambre para conseguir su marco de bellotas.");
});

test("un guardado con el marco de bellotas lo conserva sin migración", () => {
  const saved = JSON.stringify({ version: 2, unlocked: 12, levelStats: { "4-3": { completed: true, bestApples: 3 } }, stickers: [], bossChallenges: { "great-boar": true } });
  const progress = parseProgress(saved);
  assert.equal(progress.bossChallenges["great-boar"], true);
  assert.equal(parseProgress(serializeProgress(progress)).bossChallenges["great-boar"], true);
});

test("la canción tiene 23 bocados en tres fases y 23 compases", () => {
  for (const [mode, score] of Object.entries(meriendaScores)) assert.deepEqual(validateScore(score), [], mode);
  const song = meriendaScores.song;
  assert.equal(MERIENDA_BPM, 100);
  assert.equal(barsOf(song), 23, "cuenta, veinte de merienda y dos de cierre");
  assert.equal(bitesIn(song), 23);
  assert.equal(goalOf(song), 12);
  assert.deepEqual([1, 2, 3].map((phase) => song.calls.filter((item) => item.phase === phase).length), [6, 7, 7]);
  assert.ok(song.calls.filter((item) => item.phase === 1).every((item) => item.kind === "pequeno"));
  assert.ok(song.calls.filter((item) => item.kind === "gloton").every((item) => item.phase === 3));
  assert.ok(song.calls.filter((item) => item.kind === "grande").every((item) => item.phase >= 2));
  assert.deepEqual(JABATOS.pequeno.bites, [2]);
  assert.deepEqual(JABATOS.grande.bites, [4]);
  assert.deepEqual(JABATOS.gloton.bites, [2, 3]);
  assert.equal(JABATOS.grande.food, "castana");
  assert.equal(meriendaScores.demo.auto, true);
  assert.equal(meriendaScores.practice.auto, false);
  assert.equal(Math.round(scoreLength(song) * PULSE_MS / 1000), 55);
  assert.equal(partAt(song, 0).kind, "count");
  assert.deepEqual(partAt(song, COUNT_PULSES), { kind: "merienda", beat: 0, phase: 1 });
  assert.equal(partAt(song, callPulse(song.calls[13])).phase, 3);
  assert.equal(partAt(song, scoreLength(song) - 1).kind, "end");
});

test("las reglas detectan cada incumplimiento", () => {
  const errors = (calls: MeriendaScore["calls"], bars = 4) => validateScore({ calls, bars, closingBars: 1, auto: false }).join(" | ");
  assert.match(errors([{ phase: 1, at: 0, kind: "pequeno" }, { phase: 1, at: 2, kind: "pequeno" }]), /solapa/);
  assert.match(errors([{ phase: 2, at: 0, kind: "gloton" }]), /gloton sale desde la fase 3/);
  assert.match(errors([{ phase: 1, at: 0, kind: "grande" }]), /grande sale desde la fase 2/);
  assert.match(errors([{ phase: 2, at: 0, kind: "pequeno" }, { phase: 1, at: 4, kind: "pequeno" }]), /hacia atrás/);
  assert.match(errors([{ phase: 1, at: 14, kind: "pequeno" }]), /después de la merienda/);
  assert.match(errors([{ phase: 1, at: 0.5, kind: "pequeno" }]), /rejilla/);
});

test("el juicio da medio pulso de margen y pulsar de más hace «fsss» y tira una bellota", () => {
  const run = createRun("song");
  const first = run.bites[0];
  assert.equal(first.pulse, COUNT_PULSES + 2);
  assert.equal(pressAt(run, first.pulse - HIT_WINDOW_PULSES - 0.01).kind, "fsss", "demasiado pronto");
  assert.equal(pressAt(run, first.pulse - HIT_WINDOW_PULSES).kind, "fed", "en el borde del margen");
  assert.equal(pressAt(run, first.pulse).kind, "fsss", "un bocado no se come dos veces");
  const second = run.bites[1];
  assert.equal(pressAt(run, second.pulse + HIT_WINDOW_PULSES).kind, "fed");
  assert.equal(pressAt(run, second.pulse + HIT_WINDOW_PULSES + 0.01).kind, "rebote", "un rebote justo tras el bocado no cuenta");
  assert.equal(pressAt(run, second.pulse + HIT_WINDOW_PULSES + 0.2).kind, "fsss");
  assert.equal(run.got, 2);
  assert.equal(run.extra, 3);
  assert.equal(run.cuenta.raya, 0, "cada «fsss» tira la bellota que se acababa de ganar");
  assert.equal(outcomeOf(run).won, false);
});

test("el bocado que se escapa no se puede recuperar", () => {
  const run = createRun("song");
  const first = run.bites[0];
  assert.deepEqual(missesAt(run, first.pulse + HIT_WINDOW_PULSES), []);
  assert.deepEqual(missesAt(run, first.pulse + HIT_WINDOW_PULSES + 0.01), [first]);
  assert.equal(pressAt(run, first.pulse + 0.4).kind, "fsss");
  assert.equal(jabatoPose(run.jabatos[0], first.pulse + 0.6), 4, "el jabato se pone triste");
});

test("el glotón come dos bellotas en pulsos seguidos y cada pulsación da una", () => {
  const run = createRun("song");
  const gloton = run.jabatos.find((item) => item.kind === "gloton")!;
  assert.deepEqual(gloton.bites.map((bite) => bite.pulse - gloton.call), [2, 3]);
  const [a, b] = gloton.bites;
  assert.equal(pressAt(run, a.pulse + 0.45).kind, "fed");
  assert.equal(a.fedAt, a.pulse + 0.45, "la pulsación entre los dos bocados da de comer al más cercano");
  assert.equal(pressAt(run, b.pulse).kind, "fed");
  assert.equal(pressAt(run, b.pulse + 0.1).kind, "rebote", "un rebote del dedo no cuenta");
  assert.equal(pressAt(run, b.pulse + 0.2).kind, "fsss");
});

test("mantener pulsado cuenta una sola vez", () => {
  assert.equal(risingEdge(false, true), true);
  assert.equal(risingEdge(true, true), false);
  assert.equal(risingEdge(true, false), false);
});

test("la victoria pide 12 bocados y el reto los 23", () => {
  assert.deepEqual(outcomeOf(playSong()), { result: "perfecto", won: true, challengeCompleted: true });
  assert.deepEqual(outcomeOf(playSong(1)), { result: "bien", won: true, challengeCompleted: false });
  assert.equal(playSong(11).got, 12);
  assert.equal(outcomeOf(playSong(11)).won, true);
  assert.equal(playSong(12).got, 11);
  assert.deepEqual(outcomeOf(playSong(12)), { result: "casi", won: false, challengeCompleted: false });
});

test("la demostración da de comer sola y practicar se destaca solo la primera vez", () => {
  const run = createRun("demo");
  assert.equal(autoFeeds(run, scoreLength(run.score)).length, bitesIn(run.score));
  assert.deepEqual(missesAt(run, scoreLength(run.score)), []);
  assert.equal(practiceFirst(false, false, false), true);
  assert.equal(practiceFirst(true, false, false), false);
  assert.equal(practiceFirst(false, true, false), false);
  assert.equal(practiceFirst(false, false, true), false);
});

test("el jabato asoma con la llamada y abre la boca al compás", () => {
  const run = createRun("song");
  const jabato = run.jabatos[0];
  const bite = jabato.bites[0];
  assert.equal(activeJabato(run, jabato.call - 0.2), null);
  assert.equal(activeJabato(run, jabato.call), jabato);
  assert.equal(jabatoPose(jabato, jabato.call + 0.2), 0);
  assert.equal(jabatoPose(jabato, bite.pulse - 0.9), 1);
  assert.equal(jabatoPose(jabato, bite.pulse), 2);
  assert.deepEqual(dotsFor(jabato, bite.pulse).map((dot) => [dot.bite, dot.state]), [[false, "on"], [true, "on"]]);
  pressAt(run, bite.pulse);
  assert.equal(jabatoPose(jabato, bite.pulse + 0.1), 3, "mastica");
  assert.equal(dotsFor(jabato, bite.pulse + 0.1)[1].state, "ok");
  const grande = run.jabatos.find((item) => item.kind === "grande")!;
  assert.equal(dotsFor(grande, grande.call).length, 4);
  assert.equal(dotsFor(grande, grande.call).at(-1)!.big, true);
});

test("la música marca la cuenta, los gruñidos, los «tic» y la fanfarria", () => {
  const run = createRun("song");
  assert.ok(musicForEighth(run, 0).length > 0, "pezuña de la cuenta");
  const call = callPulse(run.score.calls[0]);
  assert.ok(musicForEighth(run, call * 2).some((note) => note.wave === "sawtooth"), "gruñido en la llamada");
  assert.ok(musicForEighth(run, (call + 1) * 2).some((note) => note.frequency === 2100), "«tic» de la cuenta atrás");
  assert.ok(!musicForEighth(run, (call + 2) * 2).some((note) => note.frequency === 2100), "sin «tic» en el bocado");
  assert.ok(musicForEighth(run, (scoreLength(run.score) - 8) * 2).some((note) => note.breath), "flauta de la fanfarria");
  assert.deepEqual(musicForEighth(run, scoreLength(run.score) * 2), []);
  const demo = createRun("demo");
  assert.ok(musicForEighth(demo, demo.bites[0].pulse * 2).some((note) => note.noise && note.filter?.type === "bandpass"), "la demostración trae sus «ñam»");
  assert.ok(biteNote(run, run.bites[0]) > 60);
  assert.ok(bitePulses(run.score.calls[0]).every((pulse) => Number.isInteger(pulse)));
});

test("relojes, pausa y rama", () => {
  assert.ok(Math.abs(audioPulse(10.6, 10, 0) - 1) < 1e-9);
  assert.equal(songStartAfterPause(5, 8, 9), 5 + 1 + RESUME_COUNT_PULSES * PULSE_MS / 1000);
  assert.deepEqual(advanceFrameClock({ frameMs: 0, countMs: 50 }, 80), { frameMs: 30, countMs: 0 });
  assert.deepEqual(advanceFrameClock({ frameMs: 0, countMs: 0 }, 500), { frameMs: 100, countMs: 0 });
  const slots = Array.from({ length: 23 }, (_, index) => branchSlot(index, 23));
  assert.ok(slots.every((slot, index) => slot > 0 && slot < 100 && (index === 0 || slot > slots[index - 1])));
});
