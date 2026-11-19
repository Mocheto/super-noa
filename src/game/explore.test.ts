import assert from "node:assert/strict";
import test from "node:test";
import { levels } from "./levels.ts";
import { reachable } from "./levelBeats.ts";
import { GRAVITY, JUMP_SPEED } from "./gameplay.ts";
import {
  ARROW_AFTER, MEOW_EVERY, allFound, createExploreState, exploreCameraTarget, followerPositions, hintTarget, reachedGate, shortcutWalls, stepExplore,
} from "./explore.ts";
import { exploreTestLevel } from "./testScreens.ts";
import type { Level } from "./types";

const exploreLevels: Level[] = [...levels.filter((level) => level.orientation === "explore"), exploreTestLevel];
const noaAt = (x: number, bottom: number) => ({ x: x - 21, y: bottom - 58, width: 42, height: 58 });
const reachTo = (level: Level, x: number, y: number, ignoreShortcut = true) => reachable(
  { ...level, platforms: [...level.platforms, ...(ignoreShortcut ? [] : level.exploreShortcut ?? [])] },
  { to: x, toTop: y + 2 },
);

test("cada exploración tiene tres gatitos únicos, uno por tramo, y una puerta", () => {
  for (const level of exploreLevels) {
    const kittens = level.lostKittens ?? [];
    assert.equal(kittens.length, 3, level.id);
    assert.equal(new Set(kittens.map((k) => k.id)).size, 3);
    assert.deepEqual(kittens.map((k) => k.beat), ["presentation", "development", "twist"]);
    for (const kitten of kittens) assert.ok(kitten.cat >= 1 && kitten.cat <= 17);
    assert.ok(level.exploreGate, `${level.id}: falta la puerta`);
    assert.ok((level.height ?? 0) <= 1400 && level.width <= 6500, `${level.id}: tamaño`);
  }
});

test("cada gatito y la puerta se alcanzan saltando desde el inicio", () => {
  for (const level of exploreLevels) {
    for (const kitten of level.lostKittens!) {
      assert.ok(level.platforms.some((p) => p.y === kitten.y && p.x <= kitten.x && p.x + p.width >= kitten.x), `${level.id}: ${kitten.id} flota`);
      assert.ok(reachTo(level, kitten.x, kitten.y), `${level.id}: ${kitten.id} no se alcanza`);
    }
    const gate = level.exploreGate!;
    assert.ok(reachTo(level, gate.x + gate.width / 2, gate.y + gate.height), `${level.id}: la puerta no se alcanza`);
  }
});

test("los puntos seguros de una exploración descansan sobre una superficie", () => {
  for (const level of exploreLevels) {
    for (const point of level.verticalCheckpoints ?? []) {
      assert.ok(level.platforms.some((p) => p.y === point.y && p.x <= point.x && p.x + p.width >= point.x + 42), `${level.id}: (${point.x}, ${point.y})`);
    }
  }
});

test("los gatitos se encuentran al tocarlos, maúllan cerca y abren la puerta y el atajo con los tres", () => {
  const level = exploreTestLevel;
  const state = createExploreState();
  const [k1, k2, k3] = level.lostKittens!;
  assert.equal(shortcutWalls(level, state).length, 1);
  const meow = stepExplore(level, state, noaAt(k1.x - 300, k1.y), 3);
  assert.deepEqual(meow.map((e) => e.kind), ["meow"]);
  assert.deepEqual(stepExplore(level, state, noaAt(k1.x - 300, k1.y), MEOW_EVERY / 2).map((e) => e.kind), [], "no maúlla seguido");
  assert.deepEqual(stepExplore(level, state, noaAt(k1.x, k1.y), 1 / 60).map((e) => e.kind), ["found"]);
  assert.ok(!reachedGate(level, state, noaAt(level.exploreGate!.x + 60, 960)), "con uno la puerta sigue cerrada");
  stepExplore(level, state, noaAt(k2.x, k2.y), 1 / 60);
  assert.deepEqual(stepExplore(level, state, noaAt(k3.x, k3.y), 1 / 60).map((e) => e.kind), ["found", "open"]);
  assert.ok(allFound(level, state));
  assert.equal(shortcutWalls(level, state).length, 0);
  assert.ok(reachedGate(level, state, noaAt(level.exploreGate!.x + 60, 960)));
  assert.equal(followerPositions(state).length, 3);
});

test("la flecha aparece tras 20 s sin encontrar y con los tres señala la puerta", () => {
  const level = exploreTestLevel;
  const state = createExploreState();
  const far = noaAt(1900, 960);
  stepExplore(level, state, far, ARROW_AFTER - 1);
  assert.equal(hintTarget(level, state, far), null);
  stepExplore(level, state, far, 2);
  assert.ok(hintTarget(level, state, far));
  state.found = level.lostKittens!.map((k) => k.id);
  assert.deepEqual(hintTarget(level, state, far), { x: level.exploreGate!.x + level.exploreGate!.width / 2, y: level.exploreGate!.y });
});

test("la cámara sigue a Noa en los dos ejes sin salirse del mundo", () => {
  const level = exploreTestLevel;
  const view = { width: 960, height: 540 };
  const start = exploreCameraTarget(level, { ...noaAt(80, 960), facing: 1 }, view);
  assert.equal(start.x, 0);
  assert.ok(Math.abs(start.y - (931 - 540 * .58)) < .01, "Noa al 58 % de la altura");
  const top = exploreCameraTarget(level, { ...noaAt(260, 360), facing: -1 }, view);
  assert.equal(top.x, 0);
  assert.ok(top.y < 200);
  const corner = exploreCameraTarget(level, { ...noaAt(2900, 1140), facing: 1 }, view);
  assert.deepEqual(corner, { x: 2040, y: 660 });
});

test("en una exploración no hay trampas: desde cualquier sitio al que se llega se puede volver a la puerta", () => {
  for (const level of exploreLevels) {
    // Con la pared del atajo puesta (antes de encontrar a los tres) y sin ella (después).
    for (const conAtajo of [true, false]) {
      const nivel = { ...level, platforms: [...level.platforms, ...(conAtajo ? level.exploreShortcut ?? [] : [])] };
      const gate = level.exploreGate!;
      const puerta = { to: gate.x + gate.width / 2, toTop: gate.y + gate.height + 2 };
      for (const platform of level.platforms) {
        const x = platform.x + Math.min(platform.width / 2, 30);
        if (!reachable(nivel, { to: x, toTop: platform.y + 2 })) continue;
        assert.ok(reachable(nivel, { from: x, fromTop: platform.y, ...puerta }),
          `${level.id}: desde (${platform.x}, ${platform.y}) no se vuelve a la puerta${conAtajo ? " con el atajo cerrado" : ""}`);
      }
    }
  }
});

test("3-2: del túnel del tercer gatito se sale con saltos sencillos", () => {
  const level = levels.find((l) => l.id === "3-2")!;
  const saltoSencillo = JUMP_SPEED ** 2 / (2 * GRAVITY);
  const escalera = [820, 730, 640, 550, 456];
  escalera.slice(1).forEach((alto, i) => {
    assert.ok(level.platforms.some((p) => p.y === alto && p.x < 1560 && p.x + p.width >= 1400), `peldaño a ${alto}`);
    assert.ok(escalera[i] - alto < saltoSencillo, `${escalera[i]} → ${alto}`);
  });
});
