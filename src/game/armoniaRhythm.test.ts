import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import {
  ARMONIA_BEAT_COUNT, ARMONIA_ROUNDS, ARMONIA_TARGET_COUNT, adjustArmoniaScore,
  armoniaMelodies, beatTimeMs, findTargetWithinWindow, makeArmoniaChallenge,
} from "./armoniaRhythm.ts";

test("el catálogo declara tres objetivos dentro de ocho pulsos con audio original sintetizable", () => {
  assert.ok(armoniaMelodies.length >= ARMONIA_ROUNDS);
  for (const melody of armoniaMelodies) {
    assert.equal(melody.audio.kind, "synth");
    assert.equal(melody.audio.notesHz.length, ARMONIA_BEAT_COUNT);
    assert.equal(melody.targetBeatIndexes.length, ARMONIA_TARGET_COUNT);
    assert.ok(melody.targetBeatIndexes.every((beat) => beat >= 0 && beat < ARMONIA_BEAT_COUNT));
  }
});

test("los sprites y el fondo raster del minijuego existen", () => {
  assert.ok(existsSync(new URL("../../public/assets/atlases/armonia-rhythm-sprites-v1.png", import.meta.url)));
  assert.ok(existsSync(new URL("../../public/assets/worlds/armonia-rhythm-background-v1.png", import.meta.url)));
});

test("el sorteo crea tres melodías y tempos compatibles distintos", () => {
  const plan = makeArmoniaChallenge(armoniaMelodies, () => 0.37);
  assert.equal(plan.length, ARMONIA_ROUNDS);
  assert.equal(new Set(plan.map(({ melody }) => melody.id)).size, ARMONIA_ROUNDS);
  assert.equal(new Set(plan.map(({ bpm }) => bpm)).size, ARMONIA_ROUNDS);
  assert.ok(plan.every(({ melody, bpm }) => melody.compatibleBpms.includes(bpm)));
});

test("el reto se bloquea si no hay suficientes melodías o tempos distintos", () => {
  assert.throws(() => makeArmoniaChallenge(armoniaMelodies.slice(0, 2)), RangeError);
  const onlyOneTempo = armoniaMelodies.map((melody) => ({ ...melody, compatibleBpms: [90] }));
  assert.throws(() => makeArmoniaChallenge(onlyOneTempo), RangeError);
});

test("el reloj calcula los ocho pulsos y acepta el borde de ±180 ms una sola vez", () => {
  const round = { melody: armoniaMelodies[0], bpm: 100 };
  assert.equal(beatTimeMs(7, 100), 4200);
  assert.equal(findTargetWithinWindow(600 - 180, round, new Set()), 1);
  assert.equal(findTargetWithinWindow(600 + 180, round, new Set()), 1);
  assert.equal(findTargetWithinWindow(600 + 181, round, new Set()), null);
  assert.equal(findTargetWithinWindow(600, round, new Set([1])), null);
});

test("la puntuación no baja de cero ni supera las tres notas objetivo", () => {
  assert.equal(adjustArmoniaScore(0, -1), 0);
  assert.equal(adjustArmoniaScore(2, 1), 3);
  assert.equal(adjustArmoniaScore(3, 1), 3);
});
