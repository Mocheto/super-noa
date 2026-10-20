import assert from "node:assert/strict";
import test from "node:test";
import { mountEngine } from "./engineTestHarness.ts";
import { levels } from "./levels.ts";
import { canEnterSecretShop, secretShopRewardSeconds } from "./secretShopRuntime.ts";
import type { Level, ShopMatchCount } from "./types";

const level = (overrides: Partial<Level> = {}): Level => ({
  id: "shop-test", world: 1, screen: 2, title: "Prueba", subtitle: "", theme: "orchard-day",
  width: 2200, start: { x: 100, y: 398 }, goalX: 2000,
  platforms: [{ x: 0, y: 456, width: 2200, height: 120, kind: "ground" }],
  secretShop: { id: "shop-test", x: 100, y: 376, width: 64, height: 80 },
  items: [], enemies: [], rewardBlocks: [], checkpoints: [],
  ...overrides,
});
function advance(engine: ReturnType<typeof mountEngine>, frames: number, start = 1000) {
  let now = start;
  for (let frame = 0; frame < frames; frame++) { now += 1000 / 60 + .001; engine.tick(now); }
  return now;
}
function enter(engine: ReturnType<typeof mountEngine>) {
  engine.tick(1000);
  let now = advance(engine, 2);
  engine.input.enterQueued = true;
  engine.input.jumpQueued = true;
  engine.input.jump = true;
  now = advance(engine, 1, now);
  assert.ok(engine.shopProps, "la puerta abre el rincón");
  return now;
}

test("solo se entra de pie en la puerta disponible y los premios son 12/5/0", () => {
  const shop = level().secretShop!;
  const player = { x: 100, y: 398, width: 42, height: 58, grounded: true };
  assert.equal(canEnterSecretShop(shop, player, false), true);
  assert.equal(canEnterSecretShop(shop, player, true), false);
  assert.equal(canEnterSecretShop(undefined, player, false), false);
  assert.equal(canEnterSecretShop(shop, { ...player, grounded: false }, false), false);
  assert.equal(canEnterSecretShop(shop, { ...player, x: 300 }, false), false);
  assert.equal(canEnterSecretShop(shop, { ...player, y: 300 }, false), false);
  assert.deepEqual([0, 1, 2, 3].map((count) => secretShopRewardSeconds(count as ShopMatchCount)), [0, 0, 5, 12]);
});

test("arriba entra sin saltar y la habitación congela posición, cámara, enemigos y recogidas", () => {
  const engine = mountEngine(level({
    start: { x: 800, y: 398 },
    secretShop: { id: "shop-test", x: 800, y: 376, width: 64, height: 80 },
    items: [{ id: "apple", kind: "apple", x: 800, y: 398 }],
    enemies: [{ id: "walker", kind: "snail", x: 1200, y: 420, width: 42, height: 36, speed: 30, minX: 1100, maxX: 1400 }],
  }));
  try {
    let now = enter(engine);
    const before = { ...engine.worldPlayerRect! };
    assert.deepEqual(engine.shopVisits, ["shop-test"]);
    assert.equal(engine.events.includes("jump"), false);
    assert.deepEqual(engine.applePickups, [1]);
    assert.equal(engine.pending.size, 0);
    assert.deepEqual(engine.worldPlayerRect, before);
    const room = engine.shopProps!;
    room.onResult(3);
    room.onResult(3);
    assert.deepEqual(engine.shopWins, ["shop-test"]);
    assert.equal(engine.snapshots.at(-1)?.starSeconds, undefined);
    room.onLeave();
    assert.equal(engine.shopProps, undefined);
    assert.equal(engine.snapshots.at(-1)?.starSeconds, 12);
    engine.tick(now += 120_000);
    assert.deepEqual(engine.worldPlayerRect, before);
    assert.deepEqual(engine.applePickups, [1]);
    advance(engine, 1, now);
    assert.ok(engine.drawnEnemies.some(({ enemy }) => enemy.x < 1202), "el enemigo no ha avanzado dos minutos");
  } finally { engine.unmount(); }
});

test("fuera de la puerta arriba sigue saltando y no abre por pasar con una pulsación mantenida", () => {
  const engine = mountEngine(level({ secretShop: { id: "shop-test", x: 220, y: 376, width: 64, height: 80 } }));
  try {
    engine.tick(1000);
    let now = advance(engine, 2);
    engine.input.jump = true;
    engine.input.jumpQueued = true;
    engine.input.enterQueued = true;
    now = advance(engine, 18, now);
    assert.ok(engine.events.includes("jump"));
    engine.input.right = true;
    now = advance(engine, 30, now);
    engine.input.right = false;
    advance(engine, 100, now);
    assert.equal(engine.shopProps, undefined);
    assert.deepEqual(engine.shopVisits, []);
  } finally { engine.unmount(); }
});

test("mantener arriba en el mando antes de llegar no entra; soltar y pulsar de nuevo sí", () => {
  const engine = mountEngine(level());
  try {
    engine.setPadConnected(true);
    engine.pad.buttons[12].pressed = true;
    engine.tick(1000);
    let now = advance(engine, 4);
    assert.equal(engine.shopProps, undefined);
    engine.pad.buttons[12].pressed = false;
    now = advance(engine, 1, now);
    engine.pad.axes[1] = -1;
    advance(engine, 1, now);
    assert.ok(engine.shopProps);
    assert.equal(engine.events.includes("jump"), false);
  } finally { engine.unmount(); }
});

test("la oportunidad no vuelve al salir ni al morir; reiniciar la pantalla sí la devuelve", () => {
  const data = level({ spikePits: [{ x: 230, y: 410, width: 90, height: 130 }] });
  const engine = mountEngine(data);
  try {
    let now = enter(engine);
    const room = engine.shopProps!;
    room.onLeave();
    assert.ok(engine.shopProps, "no se abandona antes de terminar");
    room.onResult(1);
    room.onLeave();
    engine.tick(now += 10_000);
    engine.input.enterQueued = true;
    now = advance(engine, 2, now);
    assert.equal(engine.shopProps, undefined);
    engine.input.right = true;
    now = advance(engine, 36, now);
    engine.input.right = false;
    now = advance(engine, 60, now);
    assert.ok(engine.events.includes("life"));
    engine.input.enterQueued = true;
    advance(engine, 2, now);
    assert.equal(engine.shopProps, undefined);
    assert.deepEqual(engine.shopVisits, ["shop-test"]);
  } finally { engine.unmount(); }
  const retry = mountEngine(data);
  try { enter(retry); assert.deepEqual(retry.shopVisits, ["shop-test"]); }
  finally { retry.unmount(); }
});

test("el escudo solo cuenta simulación activa y expira conservando el gato anterior", () => {
  const engine = mountEngine(level({ items: [{ id: "cat", kind: "cat", x: 100, y: 398 }] }));
  try {
    let now = enter(engine);
    engine.shopProps!.onResult(2);
    engine.shopProps!.onLeave();
    assert.equal(engine.snapshots.at(-1)?.starSeconds, 5);
    engine.tick(now += 60_000);
    now = advance(engine, 120, now);
    const remaining = engine.snapshots.at(-1)!.starSeconds!;
    assert.ok(remaining > 2.8 && remaining < 3.2);
    engine.setRunning(false);
    assert.equal(engine.pending.size, 0);
    engine.setRunning(true);
    engine.tick(now += 60_000);
    assert.equal(engine.snapshots.at(-1)!.starSeconds, remaining);
    advance(engine, 190, now);
    assert.equal(engine.snapshots.at(-1)?.starSeconds, undefined);
    assert.equal(engine.snapshots.at(-1)?.power, "cat");
  } finally { engine.unmount(); }
});

test("Noa Estelar protege del contacto enemigo, pero no de un foso mortal", () => {
  const engine = mountEngine(level({
    enemies: [{ id: "walker", kind: "snail", x: 220, y: 420, width: 42, height: 36, speed: 0, minX: 220, maxX: 220 }],
    spikePits: [{ x: 400, y: 410, width: 90, height: 130 }],
  }));
  try {
    let now = enter(engine);
    engine.shopProps!.onResult(3);
    engine.shopProps!.onLeave();
    engine.tick(now += 10_000);
    engine.input.right = true;
    now = advance(engine, 40, now);
    assert.equal(engine.events.includes("hurt"), false);
    assert.equal(engine.events.includes("life"), false);
    assert.ok(engine.snapshots.at(-1)!.starSeconds! > 11);
    now = advance(engine, 35, now);
    engine.input.right = false;
    advance(engine, 40, now);
    assert.ok(engine.events.includes("life"));
    assert.equal(engine.snapshots.at(-1)?.starSeconds, undefined);
  } finally { engine.unmount(); }
});

for (const data of levels.filter((candidate) => candidate.secretShop)) {
  test(`la puerta real ${data.id} se alcanza caminando y haciendo doble salto, sin perder vidas`, () => {
    const engine = mountEngine(data);
    const door = data.secretShop!;
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
      assert.ok(engine.shopProps);
      assert.deepEqual(engine.shopVisits, [door.id]);
      assert.equal(engine.events.includes("life"), false);
    } finally { engine.unmount(); }
  });
}
