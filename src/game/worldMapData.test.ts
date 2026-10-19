import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { levels } from "./levels.ts";
import { emptyProgress } from "./progress.ts";
import { findMapJourney, mapRoutes, mapRouteState, worldAvailable, worldCatalog } from "./worldMapData.ts";

test("el mapa representa los doce mundos y todos sus caminos tienen destinos", () => {
  assert.equal(worldCatalog.length, 12);
  assert.equal(new Set(worldCatalog.map((world) => world.id)).size, 12);
  assert.ok(existsSync(new URL("../../public/assets/worlds/noa-adventure-map-v1.png", import.meta.url)));
  for (const world of worldCatalog) {
    assert.ok(levels.some((level) => level.world === world.id));
    assert.ok(world.x > 0 && world.x < 100 && world.y > 0 && world.y < 100);
  }
  for (const route of mapRoutes) {
    assert.ok(worldCatalog.some((world) => world.id === route.from));
    assert.ok(worldCatalog.some((world) => world.id === route.to));
    if (route.requiresCompletion) assert.ok(levels.some((level) => level.id === route.requiresCompletion));
  }
});

test("los caminos se iluminan con el progreso sin adelantar la salida de la laguna", () => {
  const orchard = mapRoutes.find((route) => route.from === 1 && route.to === 2)!;
  const lagoonEntry = mapRoutes.find((route) => route.from === 3 && route.to === 8)!;
  const lagoonExit = mapRoutes.find((route) => route.from === 8 && route.to === 4)!;
  const secret = mapRoutes.find((route) => route.to === 7)!;
  assert.equal(mapRouteState(orchard, emptyProgress), "available");
  assert.equal(mapRouteState(lagoonEntry, emptyProgress), "hidden");
  assert.equal(mapRouteState(secret, emptyProgress), "hidden");

  const atWolves = { ...emptyProgress, unlocked: 6 };
  assert.equal(worldAvailable(3, atWolves), true);
  assert.equal(mapRouteState(orchard, atWolves), "open");
  assert.equal(mapRouteState(lagoonEntry, atWolves), "available");

  const inLagoon = { ...atWolves, waterUnlocked: true, unlocked: 9 };
  assert.equal(mapRouteState(lagoonEntry, inLagoon), "open");
  assert.equal(mapRouteState(lagoonExit, inLagoon), "available");
  const lagoonFinished = { ...inLagoon, levelStats: { "A-3": { completed: true, bestApples: 0 } } };
  assert.equal(mapRouteState(lagoonExit, lagoonFinished), "open");
  assert.equal(mapRouteState(secret, { ...lagoonFinished, secretUnlocked: true }), "open");
});

test("Noa recorre solo caminos abiertos y puede volver por ellos", () => {
  assert.deepEqual(findMapJourney(1, 1, emptyProgress), []);
  assert.equal(findMapJourney(1, 2, emptyProgress), null);
  const inCastle = { ...emptyProgress, unlocked: 17, waterUnlocked: true, secretUnlocked: true };
  const backwards = findMapJourney(6, 1, inCastle);
  assert.deepEqual(backwards?.map(({ route, reverse }) => [route.from, route.to, reverse]), [
    [5, 6, true], [4, 5, true], [3, 4, true], [2, 3, true], [1, 2, true],
  ]);
  assert.deepEqual(findMapJourney(6, 8, inCastle)?.map(({ route, reverse }) => reverse ? route.from : route.to), [5, 4, 3, 8]);
  assert.equal(findMapJourney(1, 7, { ...emptyProgress, unlocked: 17 }), null);
  assert.deepEqual(findMapJourney(9, 6, { ...emptyProgress, unlocked: 20 })?.map(({ route, reverse }) => [route.from, route.to, reverse]), [[6, 9, true]]);
  assert.deepEqual(findMapJourney(12, 9, { ...emptyProgress, unlocked: 29 })?.map(({ route, reverse }) => [route.from, route.to, reverse]), [[11, 12, true], [10, 11, true], [9, 10, true]]);
});
