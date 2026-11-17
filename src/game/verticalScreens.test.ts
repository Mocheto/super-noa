import assert from "node:assert/strict";
import test from "node:test";
import { GRAVITY, JUMP_SPEED } from "./gameplay.ts";
import { reachable } from "./levelBeats.ts";
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
