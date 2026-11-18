import assert from "node:assert/strict";
import test from "node:test";
import { GRAVITY, JUMP_SPEED } from "./gameplay.ts";
import { DOUBLE_JUMP_REACH, DOUBLE_JUMP_RISE, reachable } from "./levelBeats.ts";
import { levels } from "./levels.ts";
import { verticalTestLevel } from "./testScreens.ts";
import type { Level } from "./types";

const PLAYER_HEIGHT = 58;
const climbs: Level[] = [...levels.filter((level) => level.orientation === "vertical" && level.world !== 17), verticalTestLevel];
const goalReachable = (level: Level) => reachable(level, { to: level.goalX, toTop: (level.goalY ?? 0) + PLAYER_HEIGHT });

test("cada subida se completa saltando de repisa en repisa hasta la meta", () => {
  for (const level of climbs) assert.ok(goalReachable(level), `${level.id}: la meta no se alcanza`);
});

test("los puntos seguros de una subida descansan sobre una repisa", () => {
  for (const level of climbs) {
    for (const checkpoint of level.verticalCheckpoints ?? []) {
      assert.ok(level.platforms.some((p) => p.y === checkpoint.y && p.x <= checkpoint.x && p.x + p.width >= checkpoint.x + 42),
        `${level.id}: el punto seguro (${checkpoint.x}, ${checkpoint.y}) flota`);
    }
  }
});

test("las cajas de una subida flotan con espacio para golpearlas desde su repisa", () => {
  const maxRise = JUMP_SPEED ** 2 / (2 * GRAVITY);
  for (const level of climbs) {
    for (const block of level.rewardBlocks) {
      const support = level.platforms
        .filter((p) => p.x <= block.x && p.x + p.width >= block.x + 48 && p.y > block.y + 48)
        .sort((a, b) => a.y - b.y)[0];
      assert.ok(support, `${level.id}: ${block.id} sin apoyo`);
      const gap = support.y - PLAYER_HEIGHT - (block.y + 48);
      assert.ok(gap >= 30 && gap < maxRise, `${level.id}: ${block.id} a ${gap} px de la cabeza de Noa`);
    }
  }
});

test("el cielo también se completa con saltos de nube en nube", () => {
  for (const level of levels.filter((entry) => entry.world === 17)) assert.ok(goalReachable(level), level.id);
});

const skyLevels = levels.filter((entry) => entry.world === 17);
const clouds = (level: Level) => level.platforms.filter((platform) => platform.kind === "sky-cloud");

/** Pares de nubes en los que la de arriba solo se alcanza saliendo por un borde y entrando por el otro. */
const edgeCrossings = (level: Level) => {
  let count = 0;
  for (const low of clouds(level)) for (const high of clouds(level)) {
    if (low.y - high.y <= 0 || low.y - high.y > DOUBLE_JUMP_RISE) continue;
    const direct = Math.max(0, high.x - (low.x + low.width), low.x - (high.x + high.width));
    const wrapped = Math.min(Math.max(0, low.x + level.width - (high.x + high.width)), Math.max(0, high.x + level.width - (low.x + low.width)));
    if (direct > DOUBLE_JUMP_REACH && wrapped <= DOUBLE_JUMP_REACH) count += 1;
  }
  return count;
};

test("en el cielo hay que cruzar los bordes de la pantalla para llegar a la meta", () => {
  for (const level of skyLevels) {
    const goal = { to: level.goalX, toTop: (level.goalY ?? 0) + PLAYER_HEIGHT };
    assert.ok(reachable(level, goal), `${level.id}: la meta no se alcanza ni cruzando los bordes`);
    assert.ok(!reachable(level, { ...goal, wrap: false }), `${level.id}: se puede llegar a la meta sin cruzar nunca los bordes`);
  }
});

test("el cielo pide cada vez más cruces de bordes: 17-1 menos que 17-2 y este menos que 17-3", () => {
  const crossings = skyLevels.map(edgeCrossings);
  assert.deepEqual(crossings, [2, 3, 4]);
});

test("las nubes de cruce son anchas y a cada lado de la pantalla", () => {
  for (const level of skyLevels) {
    const edge = clouds(level).filter((cloud) => cloud.x === 0 || cloud.x + cloud.width === level.width);
    assert.ok(edge.length >= 2 * edgeCrossings(level), `${level.id}: faltan nubes pegadas a los bordes`);
    for (const cloud of edge) assert.ok(cloud.width >= 220, `${level.id}: una nube de borde mide ${cloud.width} px`);
  }
});

test("en el cielo los puntos seguros y los objetos descansan sobre una nube", () => {
  for (const level of skyLevels) {
    for (const checkpoint of level.verticalCheckpoints ?? []) {
      assert.ok(level.platforms.some((p) => p.y === checkpoint.y && p.x <= checkpoint.x && p.x + p.width >= checkpoint.x + 42), `${level.id}: el punto seguro (${checkpoint.x}, ${checkpoint.y}) flota`);
    }
    for (const item of level.items) {
      assert.ok(level.platforms.some((p) => p.x <= item.x && p.x + p.width >= item.x && Math.abs(p.y - (item.y + 48)) <= 6), `${level.id}: ${item.id} flota`);
    }
  }
});
