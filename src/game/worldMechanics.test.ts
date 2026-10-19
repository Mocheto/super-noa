import assert from "node:assert/strict";
import test from "node:test";
import { bloomBridgeState, getMechanicPlatforms, mechanicRespawn, updraftVelocity, wolfSleepState } from "./worldMechanics.ts";
import { engineModules, mountEngine } from "./engineTestHarness.ts";
import type { BloomBridge, Enemy, Level, Updraft } from "./types";
import type { RasterAssets } from "./assets";
import type { LiveEnemy } from "./gameState";

const cycle = { interval: 4, delay: 0, sleepDuration: 1, warningDuration: 1 };
const wolf: Enemy = {
  id: "sleepy", kind: "wolf", x: 100, y: 398, width: 64, height: 58,
  minX: 50, maxX: 300, speed: 40, sleepCycle: cycle,
};
const flower: BloomBridge = {
  id: "petals", x: 70, y: 350, width: 180, height: 18,
  interval: 4, delay: 0, openDuration: 1, warningDuration: 1,
};
const current: Updraft = {
  id: "air", x: 50, y: 150, width: 220, height: 310, strength: 2050, maxRiseSpeed: 130,
};
const level = (overrides: Partial<Level> = {}): Level => ({
  id: "mechanic-test", world: 1, screen: 2, title: "Prueba", subtitle: "", theme: "orchard-day",
  width: 2000, start: { x: 100, y: 398 }, goalX: 1800,
  platforms: [{ x: 0, y: 456, width: 2000, height: 84, kind: "ground" }],
  enemies: [], items: [], rewardBlocks: [], checkpoints: [], ...overrides,
});

function advance(engine: ReturnType<typeof mountEngine>, count: number, start = 1000) {
  let now = start;
  for (let frame = 0; frame < count; frame += 1) {
    now += 1000 / 60 + .001;
    engine.tick(now);
  }
  return now;
}

test("el lobo duerme, avisa sin daño y despierta siguiendo su ciclo declarativo", () => {
  assert.equal(wolfSleepState(wolf, 0), "sleeping");
  assert.equal(wolfSleepState(wolf, .999), "sleeping");
  assert.equal(wolfSleepState(wolf, 1), "warning");
  assert.equal(wolfSleepState(wolf, 1.999), "warning");
  assert.equal(wolfSleepState(wolf, 2), "awake");
  assert.equal(wolfSleepState(wolf, 4), "sleeping");
  assert.equal(wolfSleepState({ ...wolf, sleepCycle: { ...cycle, delay: 2 } }, 1), "sleeping");
  assert.equal(wolfSleepState({ ...wolf, sleepCycle: undefined }, 0), "awake");
  assert.equal(wolfSleepState({ ...wolf, kind: "boar" }, 0), "awake");
});

test("las señales de despertar, pétalos y corriente se dibujan también sin leer textos", () => {
  const { drawEnemy, drawBloomBridge, drawUpdraft } = engineModules()("./rendering") as typeof import("./rendering");
  const pendingImage = { complete: false, naturalWidth: 0 } as HTMLImageElement;
  const raster = { sleepingWolf: pendingImage, bloomFlower: pendingImage, bloomBridge: pendingImage, updraft: pendingImage } as RasterAssets;
  const rectangles: { color: unknown; width: number; height: number }[] = [];
  const lines: unknown[][] = [];
  const circles: unknown[][] = [];
  const context = new Proxy<Record<string, unknown>>({}, {
    get: (target, key: string) => {
      if (key === "fillRect") return (_x: number, _y: number, width: number, height: number) => rectangles.push({ color: target.fillStyle, width, height });
      if (key === "lineTo") return (...args: unknown[]) => lines.push(args);
      if (key === "arc") return (...args: unknown[]) => circles.push(args);
      return target[key] ?? (() => undefined);
    },
    set: (target, key: string, value) => { target[key] = value; return true; },
  }) as unknown as CanvasRenderingContext2D;
  drawEnemy(context, { ...wolf, vx: 40, active: true, phase: 0 } as LiveEnemy, 0, true, raster, "warning");
  assert.ok(rectangles.some((rect) => rect.width === 4 && rect.height === 11), "trazo del signo de admiración");
  assert.ok(rectangles.some((rect) => rect.width === 4 && rect.height === 4), "punto del signo de admiración");
  rectangles.length = 0;
  drawBloomBridge(context, flower, 0, 0, raster);
  assert.ok(rectangles.some((rect) => rect.width === flower.width && rect.height === 4));
  rectangles.length = 0;
  drawBloomBridge(context, flower, 0, 1.1, raster);
  assert.ok(rectangles.some((rect) => rect.width === flower.width && rect.height === 4), "el aviso no oculta el soporte");
  const stripeColor = rectangles.find((rect) => rect.width === flower.width && rect.height === 4)!.color;
  const initialBar = rectangles.find((rect) => rect.color === "#ffce66" && rect.height === 6)!.width;
  rectangles.length = 0;
  drawBloomBridge(context, flower, 0, 1.8, raster);
  assert.equal(rectangles.find((rect) => rect.width === flower.width && rect.height === 4)!.color, stripeColor, "el aviso no parpadea");
  assert.ok(rectangles.find((rect) => rect.color === "#ffce66" && rect.height === 6)!.width < initialBar, "la barra se vacía suavemente");
  rectangles.length = 0;
  drawBloomBridge(context, flower, 0, 2.1, raster);
  assert.ok(!rectangles.some((rect) => rect.width === flower.width && rect.height === 4), "cerrado no parece un suelo");
  drawUpdraft(context, current, 0, .5, raster);
  assert.ok(lines.length > 0, "flechas ascendentes");
  assert.ok(circles.length > 0, "burbujas de aire");
});

test("el lobo real no patrulla ni daña dormido o avisando; pausa y reintento reinician correctamente", () => {
  const data = level({ world: 3, theme: "wolf-pines", enemies: [wolf] });
  const engine = mountEngine(data);
  try {
    engine.tick(1000);
    let now = advance(engine, 40);
    assert.equal(engine.drawnEnemies[0].enemy.x, 100);
    assert.equal(engine.drawnEnemies[0].sleepPhase, "sleeping");
    assert.ok(engine.drawnText.includes("ZZZ"));
    assert.equal(engine.events.includes("hurt"), false);
    engine.setRunning(false);
    engine.setRunning(true);
    engine.tick(now + 10_000);
    assert.equal(engine.drawnEnemies[0].sleepPhase, "sleeping");
    now = advance(engine, 40, now + 10_000);
    assert.equal(engine.drawnEnemies[0].enemy.x, 100);
    assert.equal(engine.drawnEnemies[0].sleepPhase, "warning");
    assert.ok(engine.drawnText.includes("¡DESPIERTA!"));
    assert.equal(engine.events.includes("hurt"), false);
    assert.equal(engine.events.includes("howl"), false);
    advance(engine, 60, now);
    assert.equal(engine.drawnEnemies[0].sleepPhase, "awake");
    assert.ok(engine.drawnEnemies[0].enemy.x > 100);
    assert.ok(engine.events.includes("hurt"));
    assert.equal(engine.events.filter((event) => event === "howl").length, 1);
  } finally {
    engine.unmount();
  }
  const retry = mountEngine(data);
  try {
    retry.tick(1000);
    assert.equal(retry.drawnEnemies[0].sleepPhase, "sleeping");
    assert.equal(retry.drawnEnemies[0].enemy.x, 100);
  } finally {
    retry.unmount();
  }
});

test("los pétalos permanecen sólidos durante el aviso y desaparecen solo al cerrar", () => {
  assert.equal(bloomBridgeState(flower, 0), "open");
  assert.equal(bloomBridgeState(flower, 1), "warning");
  assert.equal(bloomBridgeState(flower, 2), "closed");
  assert.equal(bloomBridgeState(flower, 4), "open");
  assert.equal(bloomBridgeState({ ...flower, delay: 1 }, .5), "closed");
  const data = level({ world: 11, bloomBridges: [flower] });
  assert.equal(getMechanicPlatforms(data, 0).length, 2);
  assert.equal(getMechanicPlatforms(data, 1.5).length, 2);
  assert.equal(getMechanicPlatforms(data, 2.5).length, 1);
  assert.ok(getMechanicPlatforms(data, .5).every((platform) => platform.kind !== "spring" && platform.kind !== "dew"));
});

test("el puente real permite aterrizar sin rebotar, avisa, pausa y deja caer sobre suelo seguro al cerrar", () => {
  const data = level({ world: 11, theme: "giant-valley", start: { x: 100, y: 292 }, bloomBridges: [flower] });
  const engine = mountEngine(data);
  try {
    engine.tick(1000);
    let now = advance(engine, 40);
    assert.equal(engine.playerRect!.y, 292);
    assert.ok(engine.drawnText.includes("¡PASA!"));
    assert.equal(engine.events.includes("jump"), false, "una flor no es un muelle");
    engine.setRunning(false);
    engine.setRunning(true);
    engine.tick(now + 10_000);
    assert.equal(engine.playerRect!.y, 292);
    now = advance(engine, 40, now + 10_000);
    assert.equal(engine.playerRect!.y, 292);
    assert.ok(engine.drawnText.includes("¡SE CIERRA!"));
    advance(engine, 80, now);
    assert.equal(engine.playerRect!.y, 398);
    assert.ok(engine.drawnText.includes("¡SE ABRE!"), "los capullos anticipan suavemente la próxima apertura");
    assert.equal(engine.events.includes("life"), false);
  } finally {
    engine.unmount();
  }
  const retry = mountEngine(data);
  try {
    retry.tick(1000);
    advance(retry, 1);
    assert.equal(retry.playerRect!.y, 292);
    assert.ok(retry.drawnText.includes("¡PASA!"));
  } finally {
    retry.unmount();
  }
});

test("el puente es unidireccional: deja subir desde abajo y recibe el aterrizaje", () => {
  const engine = mountEngine(level({
    world: 11, theme: "giant-valley", bloomBridges: [{ ...flower, openDuration: 3 }],
  }));
  try {
    engine.tick(1000);
    let now = advance(engine, 1);
    engine.input.jump = true;
    engine.input.jumpQueued = true;
    now = advance(engine, 20, now);
    assert.ok(engine.playerRect!.y < flower.y - 58, "atraviesa los pétalos al ascender");
    advance(engine, 35, now);
    assert.equal(engine.playerRect!.y, flower.y - 58);
    assert.equal(engine.events.filter((event) => event === "jump").length, 1);
  } finally {
    engine.unmount();
  }
});

test("la corriente acelera suavemente, limita solo su empuje y no apila zonas ni recorta saltos", () => {
  assert.ok(updraftVelocity(100, [current], 1 / 60) < 100);
  assert.equal(updraftVelocity(-625, [current], 1 / 60), -625);
  assert.equal(updraftVelocity(-120, [current], 1), -130);
  assert.equal(updraftVelocity(0, [current, current], 1 / 60), updraftVelocity(0, [current], 1 / 60));
  assert.equal(updraftVelocity(100, [], 1 / 60), 100);
});

test("la corriente real eleva solo dentro de su zona, pausa y no altera un salto ya rápido", () => {
  const data = level({ world: 7, theme: "secret-sky", updrafts: [current] });
  const engine = mountEngine(data);
  try {
    engine.tick(1000);
    let now = advance(engine, 45);
    assert.ok(engine.playerRect!.y < 330, "el aire debe elevar a Noa suavemente");
    assert.ok(engine.playerRect!.y > 250, "no es un lanzamiento de muelle");
    assert.ok(engine.drawnText.includes("¡AIRE ARRIBA!"));
    const y = engine.playerRect!.y;
    engine.setRunning(false);
    engine.setRunning(true);
    engine.tick(now + 10_000);
    assert.equal(engine.playerRect!.y, y);
    engine.input.right = true;
    now = advance(engine, 60, now + 10_000);
    engine.input.right = false;
    advance(engine, 90, now);
    assert.equal(engine.playerRect!.y, 398, "al salir recupera gravedad y aterriza");
    assert.equal(engine.events.includes("hurt"), false);
  } finally {
    engine.unmount();
  }
  const fastZone = { ...current, y: 0, height: 600 };
  const withCurrent = mountEngine(level({ world: 7, theme: "secret-sky", updrafts: [fastZone] }));
  const withoutCurrent = mountEngine(level({ world: 7, theme: "secret-sky" }));
  try {
    for (const run of [withCurrent, withoutCurrent]) {
      run.tick(1000);
      advance(run, 1);
      run.input.jump = true;
      run.input.jumpQueued = true;
      advance(run, 1, 1017);
    }
    assert.ok(withCurrent.playerRect!.y <= withoutCurrent.playerRect!.y, "no recorta el salto inicial a 130 px/s");
    withCurrent.input.jump = false;
    let now = advance(withCurrent, 1, 1034);
    withCurrent.input.jump = true;
    withCurrent.input.jumpQueued = true;
    now = advance(withCurrent, 1, now);
    assert.equal(withCurrent.events.filter((event) => event === "jump").length, 2);
    withCurrent.input.jump = false;
    now = advance(withCurrent, 1, now);
    withCurrent.input.jump = true;
    withCurrent.input.jumpQueued = true;
    advance(withCurrent, 1, now);
    assert.equal(withCurrent.events.filter((event) => event === "jump").length, 2, "la corriente no recarga saltos infinitos");
  } finally {
    withCurrent.unmount();
    withoutCurrent.unmount();
  }
});

test("los respawns usan suelo permanente, nunca pétalos, sin cambiar el contrato de otros mundos", () => {
  const data = level({ world: 11, bloomBridges: [flower] });
  assert.deepEqual(mechanicRespawn(data, 122, 42, 58), { x: 122, y: 398 });
  assert.deepEqual(mechanicRespawn({ ...data, platforms: [] }, 122, 42, 58), data.start);
  const original = level({ world: 1, start: { x: 100, y: 350 }, bloomBridges: [flower] });
  assert.deepEqual(mechanicRespawn(original, 122, 42, 58), { x: 122, y: 350 });
});

test("una muerte real reaparece en el checkpoint sobre suelo permanente y no sobre la flor", () => {
  const engine = mountEngine(level({
    world: 11, theme: "giant-valley", start: { x: 100, y: 350 },
    checkpoints: [150], bloomBridges: [flower],
    enemies: [{ ...wolf, kind: "slime", sleepCycle: undefined, x: 220, minX: 220, maxX: 220, speed: 0 }],
  }));
  try {
    engine.tick(1000);
    let now = advance(engine, 40);
    engine.input.right = true;
    while (!engine.events.includes("life") && now < 3000) {
      now = advance(engine, 1, now);
    }
    assert.ok(now < 3000, "el contacto real resta una vida");
    assert.ok(engine.events.includes("checkpoint"));
    assert.equal(engine.playerRect!.x, 172);
    assert.equal(engine.playerRect!.y, 398);
    assert.notEqual(engine.playerRect!.y, flower.y - 58);
  } finally {
    engine.unmount();
  }
});

for (const world of [1, 2] as const) {
  test(`ninguna mecánica nueva cambia la física del mundo ${world}`, () => {
    const distantWolf = { ...wolf, x: 600, minX: 550, maxX: 700, sleepCycle: undefined };
    const base = level({
      world, theme: world === 2 ? "crystal-cave" : "orchard-day", enemies: [distantWolf],
      platforms: [
        { x: 0, y: 456, width: 2000, height: 84, kind: world === 2 ? "cave-ground" : "ground" },
        world === 1
          ? { x: 70, y: 398, width: 100, height: 58, kind: "spring" }
          : { x: 70, y: 280, width: 180, height: 50, kind: "cave-wall" },
      ],
    });
    const control = mountEngine(base);
    const annotated = mountEngine({ ...base, enemies: [{ ...distantWolf, sleepCycle: cycle }], bloomBridges: [flower], updrafts: [current] });
    try {
      for (const run of [control, annotated]) {
        run.tick(1000);
        advance(run, 1);
        run.input.jump = true;
        run.input.jumpQueued = true;
        advance(run, 60, 1017);
      }
      assert.deepEqual(annotated.playerRect, control.playerRect);
      assert.equal(annotated.drawnEnemies[0].sleepPhase, "awake");
      assert.equal(annotated.drawnEnemies[0].enemy.x, control.drawnEnemies[0].enemy.x);
      if (world === 1) assert.ok(control.events.filter((event) => event === "jump").length > 1, "el muelle conserva su rebote");
      assert.equal(getMechanicPlatforms({ ...base, bloomBridges: [flower] }, 0), base.platforms);
      assert.ok(!annotated.drawnText.includes("¡AIRE ARRIBA!"));
      assert.ok(!annotated.drawnText.includes("¡PASA!"));
    } finally {
      control.unmount();
      annotated.unmount();
    }
  });
}
