import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  ARMONIA_DRUM_LEVEL_ID, COUNT_PULSES, DRUM_BPM, HIT_WINDOW_PULSES, PULSE_MS, RESUME_COUNT_PULSES, TIN, WIN_AT, advanceFrameClock, audioPulse,
  autoHits, barsOf, callStart, createRun, drumScores, hitsIn, musicForEighth, outcomeOf, partAt, practiceFirst, pressAt, printsAt,
  responseStart, risingEdge, scoreLength, songStartAfterPause, validateScore, type DrumScore,
} from "./armoniaDrum.ts";
import { bossCatalog } from "./bosses.ts";
import { guardianGames, isGuardianGameId } from "./guardianGames.ts";
import { levels } from "./levels.ts";
import { parseProgress, serializeProgress } from "./progress.ts";

const asset = (path: string) => existsSync(new URL(`../../public/assets/${path}`, import.meta.url));
const source = (path: string) => existsSync(new URL(path, import.meta.url));
/** Acierta todos los golpes de la canción salvo los `skip` primeros. */
const playSong = (skip = 0) => {
  const run = createRun("song");
  run.targets.forEach((target, index) => { if (index >= skip) pressAt(run, target.pulse); });
  return run;
};

test("el tambor de Armonía es el duelo de la Maestra Armonía y sus recursos existen", () => {
  const final = levels.find((level) => level.id === ARMONIA_DRUM_LEVEL_ID);
  assert.equal(final?.world, 16);
  assert.equal(final?.boss, "maestra-armonia");
  for (const path of ["sprites/noa-tambor-v0.png", "sprites/tambor-armonia-v0.png", "sprites/tambor-noa-v0.png", "sprites/atril-armonia-v0.png", "worlds/teatro-armonia-v0.png", "atlases/music-characters-v1.png"]) assert.ok(asset(path), path);
  const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
  assert.match(app, /activeLevel\.boss === "maestra-armonia" \? <ArmoniaDrumGame/);
  assert.match(app, /armoniaDrumDuel/, "la música del mundo se silencia durante el duelo");
});

test("el duelo de polillas y El eco musical se retiran y el reto pide no dejar escapar ningún golpe", () => {
  assert.equal(isGuardianGameId("maestra-armonia"), false);
  assert.equal("maestra-armonia" in guardianGames, false);
  for (const path of ["./ArmoniaRhythmGame.tsx", "./armoniaRhythm.ts"]) assert.equal(source(path), false, path);
  for (const path of ["worlds/armonia-rhythm-background-v1.png", "atlases/armonia-rhythm-sprites-v1.png"]) assert.equal(asset(path), false, path);
  const armonia = bossCatalog["maestra-armonia"];
  assert.equal(armonia.challenge.id, "perfect-game");
  assert.equal(armonia.challenge.label, "Repite todos los golpes de Armonía sin que se escape ninguno para conseguir su marco de notas.");
});

test("un guardado con el marco de notas lo conserva sin migración", () => {
  const saved = JSON.stringify({ version: 2, unlocked: 48, levelStats: { "16-3": { completed: true, bestApples: 3 } }, stickers: [], bossChallenges: { "maestra-armonia": true } });
  const progress = parseProgress(saved);
  assert.equal(progress.bossChallenges["maestra-armonia"], true);
  assert.equal(parseProgress(serializeProgress(progress)).bossChallenges["maestra-armonia"], true);
});

test("la canción tiene 24 golpes en tres fases, con el pulso 4 libre hasta la última", () => {
  for (const [mode, score] of Object.entries(drumScores)) assert.deepEqual(validateScore(score), [], mode);
  const song = drumScores.song;
  assert.equal(DRUM_BPM, 100);
  assert.equal(barsOf(song), 23, "cuenta, diez parejas y dos de cierre");
  assert.equal(hitsIn(song), 24);
  assert.deepEqual(song.pairs.map((item) => item.hits.join(" ")), ["1", "1 3", "1 3", "1 2", "2 3", "1 2 3", "1 3", "1 3 4", "1 2 4", "1 2 3 4"]);
  assert.deepEqual(song.pairs.map((item) => item.phase), [1, 1, 1, 2, 2, 2, 2, 3, 3, 3]);
  assert.ok(song.pairs.filter((item) => item.phase < 3).every((item) => !item.hits.includes(4)));
  assert.equal(hitsIn(drumScores.demo), 5);
  assert.deepEqual(drumScores.practice.pairs.map((item) => item.hits.join(" ")), ["1", "1 3", "1 2 3"]);
  assert.equal(drumScores.demo.auto, true);
  assert.equal(drumScores.practice.auto, false);
});

test("la alternancia es estricta: un compás de llamada y uno de respuesta", () => {
  const song = drumScores.song;
  assert.deepEqual([0, 3].map((pulse) => partAt(song, pulse).kind), ["count", "count"]);
  assert.equal(callStart(0), COUNT_PULSES);
  assert.equal(responseStart(0), COUNT_PULSES + 4);
  assert.deepEqual(partAt(song, callStart(2) + 3), { kind: "call", pair: 2, beat: 3 });
  assert.deepEqual(partAt(song, responseStart(2)), { kind: "response", pair: 2, beat: 0 });
  assert.deepEqual(partAt(song, callStart(3)), { kind: "call", pair: 3, beat: 0 });
  assert.equal(partAt(song, scoreLength(song) - 1).kind, "end");
});

test("las reglas detectan cada incumplimiento", () => {
  const errors = (pairs: DrumScore["pairs"]) => validateScore({ pairs, closingBars: 1, auto: false }).join(" | ");
  assert.match(errors([{ phase: 1, hits: [] }]), /sin golpes/);
  assert.match(errors([{ phase: 1, hits: [1.5] }]), /rejilla/);
  assert.match(errors([{ phase: 1, hits: [5] }]), /rejilla/);
  assert.match(errors([{ phase: 1, hits: [3, 1] }]), /desordenados/);
  assert.match(errors([{ phase: 2, hits: [1, 4] }]), /aviso de turno/);
  assert.match(errors([{ phase: 2, hits: [1] }, { phase: 1, hits: [1] }]), /hacia atrás/);
});

test("el margen es de medio pulso y los golpes de más no restan", () => {
  assert.ok(Math.abs(HIT_WINDOW_PULSES * PULSE_MS - 300) < 1e-9, "±300 ms");
  const first = createRun("practice").targets[0];
  assert.equal(pressAt(createRun("practice"), first.pulse - HIT_WINDOW_PULSES).kind, "hit", "borde adelantado");
  assert.equal(pressAt(createRun("practice"), first.pulse + HIT_WINDOW_PULSES - 0.01).kind, "hit", "borde atrasado");

  const run = createRun("practice");
  const target = run.targets[0];
  assert.equal(pressAt(run, target.pulse + 1).kind, "uy", "un silencio");
  assert.equal(pressAt(run, target.pulse).kind, "hit");
  assert.equal(pressAt(run, target.pulse + 0.1).kind, "uy", "la misma huella no suma dos veces");
  assert.deepEqual([run.got, run.uy], [1, 2]);
  assert.equal(outcomeOf(run).result, "casi");
});

test("los golpes en la cuenta, la llamada o el cierre suenan flojito y no cuentan", () => {
  const run = createRun("song");
  for (const pulse of [-0.3, 1, callStart(0), callStart(0) + 2, scoreLength(run.score) - 2]) assert.equal(pressAt(run, pulse).kind, "soft", String(pulse));
  assert.deepEqual([run.got, run.uy], [0, 0]);
});

test("mantener pulsado cuenta una sola vez", () => {
  assert.equal(risingEdge(false, true), true);
  assert.equal(risingEdge(true, true), false);
  assert.equal(risingEdge(true, false), false);
});

test("se gana con 12 golpes y el reto solo con los 24", () => {
  assert.equal(WIN_AT, 12);
  assert.deepEqual(outcomeOf(playSong(13)), { result: "casi", won: false, challengeCompleted: false }, "11 golpes");
  assert.deepEqual(outcomeOf(playSong(12)), { result: "bien", won: true, challengeCompleted: false }, "12 golpes");
  const all = playSong();
  pressAt(all, all.targets[0].pulse + 1);
  assert.equal(all.got, 24);
  assert.deepEqual(outcomeOf(all), { result: "perfecto", won: true, challengeCompleted: true }, "los «¡Uy!» no quitan el reto");
});

test("Practicar se destaca solo la primera vez", () => {
  assert.equal(practiceFirst(false, false, false), true);
  assert.equal(practiceFirst(true, false, false), false, "Armonía ya vencida");
  assert.equal(practiceFirst(false, true, false), false, "revancha amistosa");
  assert.equal(practiceFirst(false, false, true), false, "tras el primer intento");
});

test("en la demostración Noa responde sola cada golpe en su pulso", () => {
  const run = createRun("demo");
  for (let pulse = 0; pulse <= scoreLength(run.score); pulse += 0.25) autoHits(run, pulse);
  assert.equal(run.got, hitsIn(run.score));
  assert.ok(run.targets.every((target) => target.hitAt === target.pulse));
});

test("las huellas muestran el patrón en el tambor de quien toca", () => {
  const run = createRun("song");
  const pairIndex = 4; // «2 3»
  const call = printsAt(run, callStart(pairIndex) + 1.1)!;
  assert.equal(call.drum, "armonia");
  assert.deepEqual(call.prints, ["silence", "beat", "beat", "silence"]);
  assert.equal(call.lit, 2);
  const target = run.targets.find((item) => item.pair === pairIndex && item.beat === 2)!;
  pressAt(run, target.pulse);
  const response = printsAt(run, responseStart(pairIndex) + 2.6)!;
  assert.equal(response.drum, "noa");
  assert.deepEqual(response.prints, ["silence", "ok", "gone", "silence"]);
  assert.equal(printsAt(run, 1), null, "en la cuenta no hay huellas");
});

test("la pausa con cuenta de cuatro retoma el reloj de audio en el mismo pulso", () => {
  const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);
  const songStart = 10, pausedAt = 25, latency = 0.04;
  const frozen = audioPulse(pausedAt, songStart, latency);
  const countStart = pausedAt + 0.05;
  const nextStart = songStartAfterPause(songStart, pausedAt, countStart);
  close(audioPulse(countStart + RESUME_COUNT_PULSES * PULSE_MS / 1000, nextStart, latency), frozen);
  close(audioPulse(10 + PULSE_MS / 1000, 10, 0), 1);
});

test("el reloj de fotogramas avanza sin audio y se detiene durante la cuenta", () => {
  let clock = { frameMs: 0, countMs: 0 };
  for (let frame = 0; frame < 60; frame++) clock = advanceFrameClock(clock, 1000 / 60);
  assert.ok(Math.abs(clock.frameMs - 1000) < 1e-6);
  assert.equal(advanceFrameClock({ frameMs: 1000, countMs: 4 * PULSE_MS }, 50).frameMs, 1000);
  assert.deepEqual(advanceFrameClock({ frameMs: 1000, countMs: 30 }, 50), { frameMs: 1020, countMs: 0 });
  assert.equal(advanceFrameClock({ frameMs: 0, countMs: 0 }, 5000).frameMs, 100, "un salto largo no adelanta la canción");
});

test("la canción suena con cuenta, timbal en la llamada, «¡tin!» en el cuarto pulso y fanfarria final", () => {
  const run = createRun("song");
  const timbalAt = (pulse: number) => musicForEighth(run, pulse * 2).filter((note) => note.wave === "sine" && note.volume === 0.42).length;
  assert.deepEqual([0, 1, 2, 3].map((pulse) => musicForEighth(run, pulse * 2).filter((note) => note.wave === "square").length), [1, 1, 1, 1], "batuta");
  assert.deepEqual([0, 1, 2, 3].map((beat) => timbalAt(callStart(1) + beat)), [1, 0, 1, 0], "«1 3»");
  assert.deepEqual([0, 1, 2, 3].map((beat) => timbalAt(responseStart(1) + beat)), [0, 0, 0, 0], "Armonía calla en la respuesta");
  for (let index = 0; index < run.score.pairs.length; index++) {
    assert.ok(musicForEighth(run, (callStart(index) + 3) * 2).some((note) => note.frequency === TIN[0].frequency), `«¡tin!» en la pareja ${index + 1}`);
  }
  const closing = (barsOf(run.score) - run.score.closingBars) * 8;
  assert.ok(musicForEighth(run, closing).some((note) => note.noise === "high" && note.duration > 1), "platillos");
  assert.deepEqual(musicForEighth(run, scoreLength(run.score) * 2), []);
});
