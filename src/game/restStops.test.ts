import assert from "node:assert/strict";
import test from "node:test";
import { levels } from "./levels.ts";
import { reachable } from "./levelBeats.ts";
import { emptyProgress, parseProgress, serializeProgress } from "./progress.ts";
import { greetFriend, normalizeRestStops, visitRestStop } from "./restStopProgress.ts";
import { REST_STOP_WIDTH, guardianOf, restStopCatalog, restStopUnlocked } from "./restStops.ts";
import { restStopLevels } from "./restStopNiveles.ts";

test("hay un paseo por cada mundo de campaña del 1 al 16", () => {
  assert.deepEqual(restStopCatalog.map((stop) => stop.world), [1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14, 15, 16]);
});

test("cada paseo es de un mundo de campaña con guardián y saluda a sus propios animales", () => {
  assert.equal(new Set(restStopCatalog.map((stop) => stop.world)).size, restStopCatalog.length);
  for (const stop of restStopCatalog) {
    assert.ok(stop.world >= 1 && stop.world <= 16 && stop.world !== 7 && stop.world !== 8, `mundo ${stop.world}`);
    assert.ok(guardianOf(stop.world), `mundo ${stop.world}: sin guardián que se despida`);
    assert.ok(stop.friends.length >= 2 && stop.friends.length <= 5);
    const kinds = new Set(levels.filter((level) => level.world === stop.world).flatMap((level) => level.enemies.map((enemy) => enemy.kind)));
    for (const friend of stop.friends) {
      assert.ok(kinds.has(friend.kind), `mundo ${stop.world}: ${friend.kind} no vive en este mundo`);
      assert.ok(friend.line.length >= 1 && friend.line.length <= 40);
    }
    assert.equal(new Set(stop.friends.map((friend) => friend.kind)).size, stop.friends.length, "un amigo de cada tipo");
    assert.ok(stop.farewell.length >= 1 && stop.farewell.length <= 40);
  }
});

test("el paseo es corto, de suelo continuo, sin peligros ni recompensas, y se completa andando", () => {
  for (const level of restStopLevels) {
    assert.ok(level.id.startsWith("P-") && level.restStop);
    assert.equal(level.width, REST_STOP_WIDTH);
    assert.ok((level.goalX - level.start.x) / 250 >= 8 && (level.goalX - level.start.x) / 250 <= 40, "entre 20 y 40 s paseando y saludando");
    assert.deepEqual(level.platforms.map((p) => [p.x, p.y, p.width]), [[0, 456, REST_STOP_WIDTH]]);
    for (const hazard of ["deadlyWater", "spikePits", "lavaJets", "waterJumpers", "chainGuardians", "cannons", "windZones"] as const) {
      assert.equal(level[hazard], undefined, `${level.id}: ${hazard}`);
    }
    assert.deepEqual([level.items.length, level.rewardBlocks.length, level.checkpoints.length], [0, 0, 0], "sin manzanas, pegatinas ni contador");
    assert.equal(level.boss, undefined);
    assert.ok(reachable(level));
    for (const friend of level.enemies) assert.ok(friend.x > level.start.x + 300 && friend.x < level.goalX - 200);
  }
});

test("el paseo se abre al completar la pantalla 3 y guarda visitas y saludos sin cambiar la versión", () => {
  assert.equal(restStopUnlocked(1, {}), false);
  assert.equal(restStopUnlocked(1, { "1-3": { completed: true } }), true);
  assert.equal(restStopUnlocked(7, { "7-3": { completed: true } }), false);
  let progress = greetFriend({ ...emptyProgress }, 1, "slime");
  progress = greetFriend(progress, 1, "slime");
  progress = visitRestStop(progress, 1);
  assert.deepEqual(progress.restStops, { 1: { visited: true, greeted: ["slime"] } });
  const parsed = parseProgress(serializeProgress(progress));
  assert.deepEqual(parsed.restStops, { 1: { visited: true, greeted: ["slime"] } });
  assert.deepEqual(parseProgress(JSON.stringify({ version: 2, unlocked: 3, levelStats: {} })).restStops, {});
  assert.deepEqual(normalizeRestStops({ 1: { visited: "sí", greeted: ["slime", 4, ""] }, 99: { visited: true }, x: 1 }), { 1: { visited: false, greeted: ["slime"] } });
});
