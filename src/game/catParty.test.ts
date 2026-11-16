import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  CAT_PARTY_LEVEL_ID, COUNT_PULSES, HIT_WINDOW_PULSES, ROLL_OFF_PULSES, audioPulse, autoHits, collectMisses, createRun, firstHitPulse,
  hitPulses, musicForEighth, outputLatencySeconds, partyScores, pieceVisible, pressAt, pushPulse, scoreLength, validateScore,
  type Score, type ScorePiece,
} from "./catParty.ts";
import { levels } from "./levels.ts";

const asset = (path: string) => existsSync(new URL(`../../public/assets/${path}`, import.meta.url));

test("la fiesta sigue al duelo del bosque y sus recursos existen", () => {
  const forestFinal = levels.find((level) => level.id === CAT_PARTY_LEVEL_ID);
  assert.equal(forestFinal?.world, 2);
  assert.equal(forestFinal?.boss, "mist-countess");
  assert.ok(asset("sprites/yarn-ball-v1.webp"), "el ovillo conserva su arte");
  for (const retired of ["sprites/gatitos-ramita.png", "sprites/gatitos-tronco.png", "music/gatitos-fiesta.mp3", "audio/gatitos-casi.wav"]) assert.equal(asset(retired), false, retired);
});

test("las tres partituras cumplen las reglas y la canción tiene la forma acordada", () => {
  for (const [mode, score] of Object.entries(partyScores)) assert.deepEqual(validateScore(score), [], mode);
  const song = partyScores.song;
  assert.equal(song.bars, 28);
  assert.equal(song.pieces.filter((item) => item.type !== "yarn").length, 40);
  const yarns = song.pieces.filter((item) => item.type === "yarn");
  assert.equal(yarns.length, 3);
  assert.ok(yarns.every((item) => item.bar >= 21));
  assert.deepEqual(song.pieces.slice(0, 3).map(firstHitPulse), [6, 10, 14], "la intro golpea en el pulso 3");
  assert.ok(song.pieces.every((item) => item.bar <= song.bars - song.closingBars), "el cierre no lleva piezas");
  const hits = song.pieces.flatMap(hitPulses).sort((a, b) => a - b);
  for (let index = 2; index < hits.length; index++) assert.ok(!(hits[index] - hits[index - 2] === 2), `tres golpes seguidos en ${hits[index]}`);
});

test("las reglas detectan cada incumplimiento", () => {
  const base: Omit<Score, "pieces"> = { bars: 8, closingBars: 0, yarnFromBar: 5, phases: [] };
  const errors = (pieces: ScorePiece[]) => validateScore({ ...base, pieces });
  assert.match(errors([{ type: "small", bar: 3, pulse: 1.5 }]).join(), /rejilla/);
  assert.match(errors([{ type: "small", bar: 3, pulse: 1 }, { type: "small", bar: 3, pulse: 1 }]).join(), /solape/);
  assert.match(errors([{ type: "medium", bar: 3, pulse: 1 }, { type: "small", bar: 3, pulse: 3 }]).join(), /pulso libre/);
  assert.match(errors([{ type: "yarn", bar: 3, pulse: 1 }]).join(), /ovillo/);
  assert.match(errors([{ type: "small", bar: 2, pulse: 1 }]).join(), /cuenta/);
  assert.equal(pushPulse({ type: "small", bar: 2, pulse: 3 }), COUNT_PULSES, "la primera pieza se empuja justo al acabar la cuenta");
});

test("el margen de ±300 ms incluye sus bordes y no cuenta dos veces el mismo golpe", () => {
  const first = createRun("practice").pieces[0].hits[0];
  assert.equal(pressAt(createRun("practice"), first - HIT_WINDOW_PULSES - 0.01).kind, "empty");
  assert.equal(pressAt(createRun("practice"), first - HIT_WINDOW_PULSES).kind, "hit");
  assert.equal(pressAt(createRun("practice"), first + HIT_WINDOW_PULSES).kind, "hit");
  assert.equal(pressAt(createRun("practice"), first + HIT_WINDOW_PULSES + 0.01).kind, "empty");
  const run = createRun("practice");
  assert.equal(pressAt(run, first).kind, "hit");
  assert.equal(pressAt(run, first + 0.1).kind, "empty");
  assert.equal(run.broken, 1);
});

test("la mediana pide dos golpes y, si falta uno, se va agrietada", () => {
  const full = createRun("practice");
  const medium = full.pieces.find((item) => item.type === "medium")!;
  const first = pressAt(full, medium.hits[0]);
  assert.equal(first.kind === "hit" && first.broke, false);
  const second = pressAt(full, medium.hits[1]);
  assert.equal(second.kind === "hit" && second.broke, true);
  assert.equal(medium.brokenAt, medium.hits[1]);

  const half = createRun("practice");
  const cracked = half.pieces.find((item) => item.type === "medium")!;
  for (const item of half.pieces) if (item.type === "small") for (const hit of item.hits) pressAt(half, hit);
  pressAt(half, cracked.hits[0]);
  assert.deepEqual(collectMisses(half, cracked.hits[1] + HIT_WINDOW_PULSES), []);
  const missed = collectMisses(half, cracked.hits[1] + HIT_WINDOW_PULSES + 0.01);
  assert.deepEqual(missed.map((item) => item.id), [cracked.id]);
  assert.equal(cracked.done.length, 1);
  assert.equal(pieceVisible(cracked, cracked.missedAt! + ROLL_OFF_PULSES), false, "termina de rodar fuera de la cinta");
});

test("el ovillo rebota sin penalizar y un golpe sin pieza no resta nada", () => {
  const run = createRun("practice");
  const yarn = run.pieces.find((item) => item.type === "yarn")!;
  assert.equal(pressAt(run, yarn.hits[0]).kind, "yarn");
  assert.notEqual(yarn.bouncedAt, null);
  assert.equal(pressAt(run, yarn.hits[0] + 0.05).kind, "empty", "un ovillo rebota una sola vez");
  assert.equal(pressAt(run, 9).kind, "empty");
  assert.equal(run.broken, 0);
  assert.deepEqual(collectMisses(run, scoreLength(run.score)).filter((item) => item.type === "yarn"), [], "dejar pasar el ovillo no es un fallo");
});

test("en la demostración Noa rompe sola cada tronco en su pulso", () => {
  const run = createRun("demo");
  for (let pulse = 0; pulse <= scoreLength(run.score); pulse += 0.25) autoHits(run, pulse);
  assert.equal(run.broken, run.pieces.filter((item) => item.type !== "yarn").length);
  assert.deepEqual(collectMisses(run, scoreLength(run.score)), []);
});

test("el reloj de audio descuenta la latencia y la limita", () => {
  const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);
  close(audioPulse(10.6, 10, 0), 1);
  close(audioPulse(10.66, 10, 0.06), 1);
  assert.equal(outputLatencySeconds({ outputLatency: 0.02, baseLatency: 0.01 }), 0.03);
  assert.equal(outputLatencySeconds({ outputLatency: 4 }), 0.25);
  assert.equal(outputLatencySeconds({ outputLatency: Number.NaN }), 0);
  assert.equal(outputLatencySeconds({}), 0);
});

test("la canción cuenta cuatro pulsos, maúlla en cada empuje y termina con la escala festiva", () => {
  const run = createRun("song");
  const countTones = [0, 2, 4, 6].map((eighth) => musicForEighth(run, eighth).filter((note) => note.bus === "cue").length);
  assert.deepEqual(countTones, [1, 1, 1, 1]);
  const medium = run.pieces.find((item) => item.type === "medium")!;
  const meowsAt = (pulse: number) => musicForEighth(run, pulse * 2).filter((note) => note.glideTo === 470).length;
  assert.ok(meowsAt(medium.push) >= 1, "maullido al empujar la mediana");
  assert.ok(meowsAt(medium.push + 1) >= 1, "el segundo gatito repite el maullido");
  const yarn = run.pieces.find((item) => item.type === "yarn")!;
  assert.ok(musicForEighth(run, yarn.push * 2).some((note) => note.glideTo === 820), "el ovillo suena distinto");
  const closingStart = (run.score.bars - run.score.closingBars) * 8;
  const scale = Array.from({ length: 8 }, (_, index) => musicForEighth(run, closingStart + index).find((note) => note.wave === "triangle")!.frequency);
  assert.deepEqual(scale, [...scale].sort((a, b) => a - b));
  assert.deepEqual(musicForEighth(run, scoreLength(run.score) * 2), []);
});
