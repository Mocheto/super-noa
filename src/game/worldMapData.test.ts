import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { detourCatalog } from "./detours.ts";
import { mapCenterAt, mapFrame, mapPointAt, mapPointIsVisible, mapZoomLimits } from "./mapCamera.ts";
import { levels } from "./levels.ts";
import { emptyProgress } from "./progress.ts";
import { findMapJourney, MAP_HEIGHT, MAP_WIDTH, mapLandscape, mapRoutes, mapRouteState, shortcutRoutes, worldAvailable, worldCatalog } from "./worldMapData.ts";

test("el mapa representa los diecisiete mundos y todos sus caminos tienen destinos", () => {
  assert.equal(worldCatalog.length, 17);
  assert.equal(new Set(worldCatalog.map((world) => world.id)).size, 17);
  assert.ok(existsSync(new URL(`../../public/${mapLandscape.slice(2)}`, import.meta.url)));
  for (const world of worldCatalog) {
    assert.ok(levels.some((level) => level.world === world.id));
    assert.ok(world.x > 0 && world.x < 100 && world.y > 0 && world.y < 100);
    assert.ok(existsSync(new URL(`../../public/${world.catAsset.slice(2)}`, import.meta.url)), `Falta el gatito de ${world.name}`);
  }
  for (const route of mapRoutes) {
    assert.ok(worldCatalog.some((world) => world.id === route.from));
    assert.ok(worldCatalog.some((world) => world.id === route.to));
    if (route.requiresCompletion) assert.ok(levels.some((level) => level.id === route.requiresCompletion));
  }
});

test("los cinco mundos nuevos tienen gatitos propios en finales y postales", () => {
  const newWorlds = worldCatalog.filter((world) => world.id >= 13 && world.id <= 17);
  assert.equal(newWorlds.length, 5);
  assert.equal(new Set(newWorlds.map((world) => world.catAsset)).size, 5);
  for (const world of newWorlds) assert.equal(world.catAsset, `./assets/sprites/world-cat-${world.id}-v1.png`);
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

test("las rutas de la S y sus ramales coinciden con sus marcadores", () => {
  const worlds = new Map(worldCatalog.map((world) => [world.id, world]));
  const coordinates = ({ x, y }: { x: number; y: number }) => [x * MAP_WIDTH / 100, y * MAP_HEIGHT / 100];
  const check = (path: string, from: { x: number; y: number }, to: { x: number; y: number }) => {
    const points = path.match(/\d+/g)!.map(Number);
    assert.deepEqual(points.slice(0, 2), coordinates(from));
    assert.deepEqual(points.slice(-2), coordinates(to));
  };
  for (const route of [...mapRoutes, ...shortcutRoutes]) check(route.path, worlds.get(route.from)!, worlds.get(route.to)!);
  for (const detour of detourCatalog) check(detour.path, worlds.get(detour.world)!, detour);

  const campaign = mapRoutes.filter((route) => !route.branch);
  const campaignIds = [campaign[0].from, ...campaign.map((route) => route.to)];
  const rows = [campaignIds.slice(0, 5), campaignIds.slice(5, 10), campaignIds.slice(10)];
  for (const [row, ids] of rows.entries()) {
    const positions = ids.map((id) => worlds.get(id)!);
    assert.equal(positions.length, 5);
    for (let index = 1; index < positions.length; index++) {
      assert.ok((positions[index].x - positions[index - 1].x) * (row === 1 ? -1 : 1) > 0);
    }
    const next = rows[row + 1];
    if (next) assert.ok(Math.min(...positions.map(({ y }) => y)) > Math.max(...next.map((id) => worlds.get(id)!.y)));
  }
});

test("la cámara encuadra el mapa entero, conserva un anclaje al ampliar y limita los bordes", () => {
  const viewport = { width: 360, height: 440 };
  const center = { x: 30, y: 78 };
  const fit = mapFrame(viewport, center, "all");
  assert.equal(fit.width, 360);
  assert.equal(fit.height, 240);
  assert.equal(fit.x, 0);
  assert.equal(fit.y, 100);
  const near = mapFrame(viewport, center, "near");
  assert.ok(mapPointIsVisible(viewport, near, center));
  const pivot = { x: 170, y: 210 };
  const anchor = mapPointAt(near, pivot);
  const zoomed = mapFrame(viewport, center, mapZoomLimits(viewport).max);
  const placed = mapFrame(viewport, mapCenterAt(viewport, zoomed, anchor, pivot), zoomed.width);
  const after = mapPointAt(placed, pivot);
  assert.ok(Math.abs(after.x - anchor.x) < 0.0001);
  assert.ok(Math.abs(after.y - anchor.y) < 0.0001);
  const edge = mapFrame(viewport, { x: 1000, y: -500 }, "near");
  assert.equal(edge.x, viewport.width - near.width);
  assert.equal(edge.y, 0);
});
