import assert from "node:assert/strict";
import test from "node:test";
import { statSync } from "node:fs";
import { mountEngine } from "./engineTestHarness.ts";
import type { Level } from "./types";

const level = (overrides: Partial<Level> = {}): Level => ({
  id: "motor-test", world: 1, screen: 2, title: "Prueba", subtitle: "", theme: "orchard-day",
  width: 2000, start: { x: 450, y: 398 }, goalX: 500,
  platforms: [{ x: 0, y: 456, width: 2000, height: 84, kind: "ground" }],
  items: [
    { id: "apple", kind: "apple", x: 499, y: 398 },
    { id: "sticker", kind: "sticker", x: 499, y: 398 },
    { id: "cat", kind: "cat", x: 499, y: 398 },
  ],
  enemies: [], rewardBlocks: [], checkpoints: [455], ...overrides,
});

for (const boss of [undefined, "bramble-king"] as const) {
  test(`recogida y meta en el mismo paso comunican estado atómico ${boss ?? "normal"}`, () => {
    const engine = mountEngine(level({ boss }));
    try {
      engine.tick(1000);
      engine.tick(1017);
      assert.equal(engine.snapshots.at(-1)!.apples, 0);
      engine.input.right = true;
      engine.tick(1034);
      engine.tick(1051);
      const final = engine.snapshots.at(-1)!;
      assert.equal(final.apples, 1);
      assert.deepEqual(Array.from(final.stickers), ["sticker"]);
      assert.equal(final.power, "cat");
      assert.equal(final.checkpoint, 1);
      assert.equal(final.paused, false);
      engine.setRunning(false);
      assert.equal(engine.pending.size, 0, "la transición también detiene sus frames");
      assert.equal(engine.completed.length + engine.bosses.length, 0);
      engine.setRunning(true);
      engine.tick(20_000);
      assert.equal(engine.completed.length + engine.bosses.length, 0, "no recupera tiempo de pausa");
      for (let now = 20_100; now <= 22_000; now += 100) engine.tick(now);
      assert.equal((boss ? engine.bosses : engine.completed).length, 1);
      assert.equal((boss ? engine.bosses : engine.completed)[0], final, "el callback recibe el snapshot emitido, no estado React");
      assert.equal(engine.snapshots.filter((snapshot) => snapshot.apples === 1).length, 1);
    } finally {
      engine.unmount();
    }
  });
}

test("salida acuática recoge y comunica objetos del mismo paso antes de pausar", () => {
  const engine = mountEngine(level({ goalX: 1800, waterEntrance: { x: 499, y: 398, width: 100, height: 58 } }));
  try {
    engine.tick(1000);
    engine.tick(1017);
    engine.input.right = true;
    engine.tick(1034);
    engine.tick(1051);
    assert.equal(engine.snapshots.at(-1)!.apples, 1);
    engine.setRunning(false);
    assert.equal(engine.events.includes("water"), false);
    engine.setRunning(true);
    engine.tick(10_000);
    for (let now = 10_100; now <= 10_400; now += 100) engine.tick(now);
    assert.equal(engine.events.includes("water"), false);
    engine.tick(10_500);
    assert.equal(engine.events.filter((event) => event === "water").length, 1);
  } finally {
    engine.unmount();
  }
});

test("desmontar cancela una finalización pendiente", () => {
  const engine = mountEngine(level({ goalX: 450 }));
  engine.tick(1000);
  engine.tick(1017);
  engine.unmount();
  assert.equal(engine.pending.size, 0);
  assert.equal(engine.completed.length, 0);
});

test("el canvas recupera foco sin desplazar solo al iniciar y reanudar", () => {
  const engine = mountEngine(level());
  try {
    assert.equal(engine.focusCalls.length, 1);
    assert.equal(engine.focusCalls[0].preventScroll, true);
    engine.tick(1000);
    engine.tick(1017);
    engine.setRunning(true);
    assert.equal(engine.focusCalls.length, 1, "no roba foco en cada render ni frame");
    engine.setRunning(false);
    assert.equal(engine.focusCalls.length, 1, "no roba foco a modales durante la pausa");
    engine.setRunning(true);
    assert.equal(engine.focusCalls.length, 2);
    assert.equal(engine.focusCalls[1].preventScroll, true);
  } finally {
    engine.unmount();
  }
});

test("la enredadera emite snapshot final y su transición espera al reanudar", () => {
  const engine = mountEngine(level({
    start: { x: 100, y: 348 }, goalX: 1800, checkpoints: [], items: [],
    platforms: [{ x: 0, y: 406, width: 2000, height: 134, kind: "ground" }],
    rewardBlocks: [{ id: "vine", x: 100, y: 300, reward: "secret-vine" }],
  }));
  try {
    engine.tick(1000);
    engine.tick(1017);
    engine.input.jump = true;
    engine.input.jumpQueued = true;
    engine.tick(1034);
    engine.input.jump = false;
    let now = 1034;
    while (engine.events.filter((event) => event === "checkpoint").length === 0 && now < 3000) {
      now += 17;
      engine.tick(now);
    }
    assert.ok(now < 3000, "se golpea el bloque y se toca la enredadera real");
    assert.equal(engine.events.at(-1), "snapshot");
    const count = engine.snapshots.length;
    engine.setRunning(false);
    assert.equal(engine.events.includes("secret"), false);
    engine.setRunning(true);
    now += 10_000;
    engine.tick(now);
    assert.equal(engine.events.includes("secret"), false);
    for (let tick = 0; tick < 8; tick += 1) { now += 100; engine.tick(now); }
    assert.equal(engine.events.filter((event) => event === "secret").length, 1);
    assert.equal(engine.snapshots.length, count);
  } finally {
    engine.unmount();
  }
});

test("el primer frame difiere poses y gráficos no utilizados y reduce la descarga inicial", () => {
  const engine = mountEngine(level({ checkpoints: [1500] }));
  try {
    assert.equal(engine.requested.length, 0, "montar no descarga todas las poses ni todo el catálogo");
    engine.tick(1000);
    assert.ok(engine.requested.some((src) => src.endsWith("noa-jump-v2.webp")));
    assert.ok(!engine.requested.some((src) => /noa-cat|gold-armor|yarn-ball|world-8|checkpoint/.test(src)));
    const bytes = engine.requested.reduce((sum, src) => sum + statSync(new URL(`../../public/${src.slice(2)}`, import.meta.url)).size, 0);
    assert.ok(bytes < 16_084_617 / 2, `descarga inicial ${bytes} debe reducir más del 50% frente a 16.084.617 bytes`);
  } finally {
    engine.unmount();
  }
});
