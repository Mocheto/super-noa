import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { detourArtwork, detourCatalog, detourLevel, detourLevels } from "./detours.ts";
import { createDetourClock, advanceDetourClock, detourSupports } from "./detourMechanics.ts";
import { normalizeDetours, visitDetour } from "./detourProgress.ts";
import { emptyProgress, parseProgress, resetCampaignProgress, serializeProgress } from "./progress.ts";
import { campaignLevels } from "./routes.ts";
import { levels } from "./levels.ts";
import { findMapJourney, mapRouteState, shortcutRoutes } from "./worldMapData.ts";
import { rankingProgress } from "./ranking.ts";
import { mountEngine } from "./engineTestHarness.ts";
import type { Level } from "./types.ts";

function advance(engine: ReturnType<typeof mountEngine>, count: number, now = 1000) {
  for (let index = 0; index < count; index++) engine.tick(now += 1000 / 60 + .001);
  return now;
}

test("cinco desvíos declarativos separados de campaña, insignias y guardianes", () => {
  assert.equal(detourLevels.length, 5);
  assert.equal(campaignLevels.length, 30);
  assert.equal(new Set(detourLevels.map((level) => level.id)).size, 5);
  for (const entry of detourCatalog) {
    const level = detourLevel(entry.id);
    const source = levels.find((candidate) => candidate.id === entry.source)!;
    assert.equal(source.detourEntrance?.id, entry.id);
    const door = source.detourEntrance!;
    assert.ok(source.platforms.some((platform) => platform.y === door.y + door.height &&
      platform.x <= door.x && platform.x + platform.width >= door.x + door.width), `${source.id}: apoyo de entrada`);
    assert.ok(door.x > 960 && door.x < source.width * .65);
    assert.equal(level.boss, undefined);
    assert.ok(!level.items.some((item) => item.kind === "sticker"));
    assert.ok(!levels.includes(level));
    assert.ok(level.platforms.some((platform) => platform.x === 0 && platform.width === level.width && platform.y === 456), "suelo seguro de regreso");
    assert.ok(entry.x > 0 && entry.x < 100 && entry.y > 0 && entry.y < 100);
  }
  const art = readFileSync(new URL(`../../public/${detourArtwork.slice(2)}`, import.meta.url), "utf8");
  assert.match(art, /width="640" height="256"/);
  assert.doesNotMatch(art, /https?:\/\/(?!www.w3.org)/);
  for (const [path, width, height] of [
    ["atlases/detour-switches-v1.svg", 384, 96],
    ["worlds/detour-scenes-v1.svg", 2880, 540],
  ] as const) {
    const svg = readFileSync(new URL(`../../public/assets/${path}`, import.meta.url), "utf8");
    assert.ok(svg.includes(`width="${width}" height="${height}"`));
    assert.doesNotMatch(svg, /<image|<script|https?:\/\/(?!www.w3.org)/);
  }
});

test("guardados v2 y antiguos toleran desvíos ausentes, saneados y reiniciables", () => {
  for (const raw of [undefined, null, [], "yes", false]) assert.deepEqual(normalizeDetours(raw), {});
  assert.deepEqual(normalizeDetours({
    mill: { completed: true }, mine: { discovered: "true" }, garden: { discovered: true, completed: "true", revealed: true },
    unknown: { completed: true },
  }), {
    mill: { discovered: true, completed: true, revealed: false },
    garden: { discovered: true, completed: false, revealed: true },
  });
  const original = { ...emptyProgress, totalApples: 15, achievedAt: "2026-10-20T00:00:00.000Z" };
  let progress = visitDetour(original, "mill");
  assert.equal(visitDetour(progress, "mill"), progress);
  progress = visitDetour(progress, "mill", true);
  assert.deepEqual(parseProgress(serializeProgress(progress)), progress);
  assert.deepEqual(rankingProgress(progress), rankingProgress(original));
  assert.deepEqual(resetCampaignProgress(progress), original);
  for (const version of [undefined, 2]) assert.deepEqual(parseProgress(JSON.stringify({ version })).detours, {});
});

test("los atajos nunca desbloquean mundos ni saltan guardianes y se usan al viajar", () => {
  const progress = visitDetour({ ...emptyProgress }, "mine", true);
  const mine = shortcutRoutes.find((route) => route.detour === "mine")!;
  assert.equal(mapRouteState(mine, progress), "hidden");
  assert.equal(findMapJourney(2, 6, progress), null);
  const known = { ...progress, unlocked: 15 };
  assert.equal(mapRouteState(mine, known), "open");
  assert.equal(findMapJourney(2, 6, known)?.[0].route.detour, "mine");
  assert.equal(findMapJourney(6, 2, known)?.[0].reverse, true);
  assert.equal(mapRouteState(mine, visitDetour({ ...emptyProgress, unlocked: 15 }, "mine")), "hidden");
});

test("la vagoneta recorre los raíles sin teletransportarse ni superar sus extremos", () => {
  const level = detourLevel("mine"), clock = createDetourClock();
  let previous = detourSupports(level, clock)[0];
  for (let frame = 0; frame < 22 * 120; frame++) {
    advanceDetourClock(clock, level, 1 / 120, null);
    const support = detourSupports(level, clock)[0];
    assert.ok(support.x >= 430 && support.x <= 2170);
    assert.ok(Math.abs(support.x - previous.x) < 2.1);
    previous = support;
  }
});

test("la campana invierte el molino sin saltos de posición y mantiene los tablones horizontales", () => {
  const level = detourLevel("mill"), clock = createDetourClock();
  advanceDetourClock(clock, level, 2, null);
  const before = detourSupports(level, clock);
  clock.switches.add("bell");
  assert.deepEqual(detourSupports(level, clock), before);
  advanceDetourClock(clock, level, .01, null);
  assert.ok(Math.abs(detourSupports(level, clock)[0].x - before[0].x) < 1);
  assert.equal(before.length, 8);
  for (const support of before) assert.equal(support.height, 22);
});

test("los libros dependen de las patitas, las hojas del peso y la planta del riego", () => {
  const library = detourLevel("library"), clock = createDetourClock();
  assert.equal(detourSupports(library, clock).length, 0);
  clock.switches.add("books");
  assert.equal(detourSupports(library, clock).length, 4);
  const garden = detourLevel("garden"), gardenClock = createDetourClock();
  advanceDetourClock(gardenClock, garden, 2, "garden-leaf-1");
  assert.ok(detourSupports(garden, gardenClock)[0].y > 360);
  assert.equal(detourSupports(garden, gardenClock)[1].y, 255);
  advanceDetourClock(gardenClock, garden, 4, null);
  assert.equal(detourSupports(garden, gardenClock)[0].y, 300);
  gardenClock.switches.add("water");
  advanceDetourClock(gardenClock, garden, 3, null);
  assert.equal(detourSupports(garden, gardenClock)[2].y, 210);
});

test("entrar, salir y completar un desvío conserva exactamente la partida exterior", () => {
  const base: Level = { ...detourLevel("mill"), id: "exterior-test", detour: undefined, mechanisms: [], detourSwitches: [],
    start: { x: 100, y: 398 }, detourEntrance: { id: "mill", x: 100, y: 376, width: 80, height: 80 } };
  const engine = mountEngine(base);
  try {
    engine.tick(1000);
    let now = advance(engine, 2);
    const before = { ...engine.worldPlayerRect! };
    engine.input.enterQueued = true;
    engine.input.jumpQueued = true;
    engine.input.jump = true;
    now = advance(engine, 1, now);
    assert.equal(engine.detourProps?.level.detour, "mill");
    assert.deepEqual(engine.detourVisits, ["mill"]);
    assert.equal(engine.events.includes("jump"), false);
    assert.equal(engine.pending.size, 0);
    engine.detourProps!.onReturn();
    assert.equal(Boolean(engine.detourProps), false);
    engine.tick(now += 60_000);
    assert.deepEqual(engine.worldPlayerRect, before);
    engine.input.enterQueued = true;
    now = advance(engine, 1, now);
    const reentered = (() => engine.detourProps)();
    assert.ok(reentered);
    reentered.onComplete();
    assert.deepEqual(engine.detourWins, ["mill"]);
    assert.equal(Boolean(engine.detourProps), false);
  } finally { engine.unmount(); }
});

test("la vagoneta transporta a Noa sin pulsar movimiento y la pausa congela la mecánica", () => {
  const mine = detourLevel("mine");
  const engine = mountEngine({ ...mine, start: { x: 470, y: 314 } });
  try {
    engine.tick(1000);
    let now = advance(engine, 4);
    const before = { ...engine.worldPlayerRect! };
    now = advance(engine, 120, now);
    assert.ok(engine.worldPlayerRect!.x > before.x + 90);
    assert.ok(Math.abs(engine.worldPlayerRect!.y - 314) < 1);
    engine.setRunning(false);
    assert.equal(engine.pending.size, 0);
    engine.setRunning(true);
    const paused = { ...engine.worldPlayerRect! };
    engine.tick(now + 60_000);
    assert.deepEqual(engine.worldPlayerRect, paused);
  } finally { engine.unmount(); }
});

for (const level of detourLevels) {
  test(`${level.id} tiene salida alcanzable sin peligros y carga arte solo al usarlo`, () => {
    const engine = mountEngine(level);
    try {
      engine.tick(1000);
      let now = advance(engine, 2);
      engine.input.right = true;
      now = advance(engine, Math.ceil(level.width / 250 * 60), now);
      engine.input.right = false;
      advance(engine, 100, now);
      assert.equal(engine.events.includes("life"), false);
      assert.equal(engine.completed.length, 1);
      assert.ok(engine.requested.includes(detourArtwork));
    } finally { engine.unmount(); }
  });
}

for (const data of levels.filter((candidate) => candidate.detourEntrance)) {
  test(`${data.id}: el acceso secreto se alcanza con doble salto desde el suelo cercano`, () => {
    const door = data.detourEntrance!;
    const engine = mountEngine({ ...data, start: { x: door.x - 150, y: 398 } });
    try {
      engine.tick(1000);
      let now = advance(engine, 2);
      engine.input.right = true;
      let frames = 0;
      while (engine.worldPlayerRect!.x < door.x - 110 && frames++ < 120) now = advance(engine, 1, now);
      engine.input.jump = true;
      engine.input.jumpQueued = true;
      now = advance(engine, 18, now);
      engine.input.jumpQueued = true;
      frames = 0;
      while (engine.worldPlayerRect!.x < door.x - 20 && frames++ < 60) now = advance(engine, 1, now);
      engine.input.right = false;
      now = advance(engine, 18, now);
      engine.input.jump = false;
      now = advance(engine, 80, now);
      assert.ok(Math.abs(engine.worldPlayerRect!.y + 58 - door.y - door.height) < 6, JSON.stringify(engine.worldPlayerRect));
      engine.input.enterQueued = true;
      advance(engine, 1, now);
      assert.equal(engine.detourProps?.level.detour, door.id);
      assert.equal(engine.events.includes("life"), false);
    } finally { engine.unmount(); }
  });
}

for (const id of ["mill", "library", "garden"] as const) {
  test(`${id}: el mecanismo se activa con arriba, no dispara un salto y requiere estar junto a él`, () => {
    const level = detourLevel(id), toggle = level.detourSwitches![0];
    const engine = mountEngine({ ...level, start: { x: toggle.x + 10, y: toggle.y + toggle.height - 58 } });
    try {
      engine.tick(1000);
      let now = advance(engine, 3);
      engine.input.enterQueued = true;
      engine.input.jumpQueued = true;
      engine.input.jump = true;
      now = advance(engine, 1, now);
      assert.equal(engine.events.filter((event) => event === "block").length, 1);
      assert.equal(engine.events.includes("jump"), false);
      engine.input.enterQueued = true;
      now = advance(engine, 1, now);
      assert.equal(engine.events.filter((event) => event === "block").length, 2);
      engine.input.right = true;
      engine.input.jump = false;
      now = advance(engine, 90, now);
      engine.input.right = false;
      engine.input.enterQueued = true;
      advance(engine, 1, now);
      assert.equal(engine.events.filter((event) => event === "block").length, 2);
    } finally { engine.unmount(); }
  });
}

test("una hoja transporta a Noa al bajar, no la pierde por la gravedad y permite saltar fuera", () => {
  const level = detourLevel("garden");
  const engine = mountEngine({ ...level, start: { x: 640, y: 242 } });
  try {
    engine.tick(1000);
    let now = advance(engine, 4);
    const before = { ...engine.worldPlayerRect! };
    now = advance(engine, 120, now);
    assert.ok(engine.worldPlayerRect!.y > before.y + 60);
    assert.ok(engine.worldPlayerRect!.y < 342);
    engine.input.jump = true;
    engine.input.jumpQueued = true;
    advance(engine, 15, now);
    assert.ok(engine.worldPlayerRect!.y < before.y);
    assert.equal(engine.events.includes("jump"), true);
    assert.equal(engine.events.includes("life"), false);
  } finally { engine.unmount(); }
});
