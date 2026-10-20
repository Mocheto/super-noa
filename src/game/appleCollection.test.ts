import assert from "node:assert/strict";
import test from "node:test";
import { mountEngine } from "./engineTestHarness.ts";
import type { Level } from "./types";

const level = (overrides: Partial<Level> = {}): Level => ({
  id: "apples-test", world: 1, screen: 2, title: "Prueba", subtitle: "", theme: "orchard-day",
  width: 2000, start: { x: 100, y: 398 }, goalX: 1800,
  platforms: [{ x: 0, y: 456, width: 2000, height: 120, kind: "ground" }],
  items: [{ id: "apple", kind: "apple", x: 100, y: 398 }], enemies: [], rewardBlocks: [], checkpoints: [],
  ...overrides,
});
function advance(engine: ReturnType<typeof mountEngine>, frames: number, start = 1000) {
  let now = start;
  for (let frame = 0; frame < frames; frame++) { now += 1000 / 60 + .001; engine.tick(now); }
  return now;
}

test("cada manzana avisa una sola vez; muerte, pausa y snapshots no vuelven a contarla", () => {
  const data = level({ spikePits: [{ x: 180, y: 410, width: 80, height: 130 }] });
  for (let retry = 0; retry < 2; retry++) {
    const engine = mountEngine(data);
    try {
      engine.tick(1000);
      let now = advance(engine, 2);
      assert.deepEqual(engine.applePickups, [1]);
      engine.setRunning(false);
      engine.setRunning(true);
      engine.tick(now + 10_000);
      assert.deepEqual(engine.applePickups, [1]);
      engine.input.right = true;
      now = advance(engine, 30, now + 10_000);
      engine.input.right = false;
      advance(engine, 40, now);
      assert.ok(engine.events.includes("life"));
      assert.deepEqual(engine.applePickups, [1]);
      assert.ok(engine.snapshots.length > 1);
    } finally { engine.unmount(); }
  }
});

test("la manzana de una caja cuenta al recogerla, no al golpear el bloque", () => {
  const engine = mountEngine(level({ items: [], rewardBlocks: [{ id: "box", reward: "apple", x: 100, y: 340 }] }));
  try {
    engine.tick(1000);
    let now = advance(engine, 1);
    engine.input.jump = true;
    engine.input.jumpQueued = true;
    now = advance(engine, 10, now);
    assert.ok(engine.events.includes("block"));
    assert.deepEqual(engine.applePickups, []);
    engine.input.jump = false;
    now = advance(engine, 38, now);
    engine.input.right = true;
    now = advance(engine, 10, now);
    engine.input.right = false;
    advance(engine, 150, now);
    assert.deepEqual(engine.applePickups, [1]);
  } finally { engine.unmount(); }
});
