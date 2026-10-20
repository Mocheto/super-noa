import assert from "node:assert/strict";
import test from "node:test";
import { engineModules, mountEngine } from "./engineTestHarness.ts";
import { enemyY } from "./gameState.ts";
import { levels } from "./levels.ts";
import { readRgbaPng } from "./pngTestUtils.ts";
import { worldEnemySpriteSources } from "./worldEnemySprites.ts";
import type { RasterAssets } from "./assets";
import type { LiveEnemy } from "./gameState";
import type { Enemy, Level } from "./types";

const { drawEnemy } = engineModules()("./rendering") as typeof import("./rendering");
type WorldSpecies = keyof typeof worldEnemySpriteSources;
const worlds: Record<WorldSpecies, "volcano" | "giant-valley" | "ice-mountain"> = {
  "baby-dragon": "volcano", "fire-salamander": "volcano",
  ant: "giant-valley", snail: "giant-valley", bee: "giant-valley",
  penguin: "ice-mountain", "snow-fox": "ice-mountain", "snowy-owl": "ice-mountain",
};

test("los recortes contienen la silueta completa sin incluir la fila de los guardianes", () => {
  const pngs = new Map<string, ReturnType<typeof readRgbaPng>>();
  for (const kind of Object.keys(worldEnemySpriteSources) as WorldSpecies[]) {
    const name = worlds[kind];
    if (!pngs.has(name)) pngs.set(name, readRgbaPng(`./assets/atlases/${name}-characters-v1.png`));
    const { width, pixels } = pngs.get(name)!;
    const source = worldEnemySpriteSources[kind];
    const [sx, sy, sw, sh] = source;
    const column = kind === "fire-salamander" || kind === "snail" || kind === "snow-fox" ? 1 : kind === "bee" || kind === "snowy-owl" ? 2 : 0;
    const limitY = name === "volcano" ? 330 : name === "giant-valley" ? 350 : 375;
    let left = width, top = limitY, right = -1, bottom = -1;
    for (let y = 0; y < limitY; y++) {
      for (let x = Math.ceil(column * width / 5); x < Math.floor((column + 1) * width / 5); x++) {
        if (pixels[(y * width + x) * 4 + 3] < 32) continue;
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
    assert.deepEqual(source, [left, top, right - left + 1, bottom - top + 1], kind);
    assert.ok(sy + sh <= limitY, `${kind}: no aparecen fragmentos del jefe por debajo`);
    assert.ok(sw > 0 && sh > 0);
    assert.ok(sx >= column * width / 5);
  }
});

test("hormigas, caracoles, dragones y salamandras apoyan el sprite en su base en ambas direcciones", () => {
  const calls: number[][] = [];
  const context = {
    save() {}, restore() {}, translate() {}, scale() {},
    drawImage: (_image: HTMLImageElement, ...values: number[]) => calls.push(values),
  } as unknown as CanvasRenderingContext2D;
  const image = { complete: true, naturalWidth: 1983, naturalHeight: 793 } as HTMLImageElement;
  for (const kind of ["ant", "snail", "baby-dragon", "fire-salamander"] as const) {
    const base = levels.flatMap((level) => level.enemies).find((enemy) => enemy.kind === kind)!;
    for (const direction of [-1, 1]) {
      calls.length = 0;
      drawEnemy(context, { ...base, vx: base.speed * direction, active: true, phase: 0 }, Math.max(0, base.x - 100), false, { worldCharacters: image } as RasterAssets);
      assert.equal(calls.length, 1);
      const [sx, sy, sw, sh, , y, width, height] = calls[0];
      assert.deepEqual([sx, sy, sw, sh], [...worldEnemySpriteSources[kind]]);
      assert.ok(Math.abs(y + height - 456) < .001, `${kind}: sin hueco bajo los pies`);
      assert.ok(Math.abs(width / height - sw / sh) < .001, `${kind}: sin deformar el dibujo`);
    }
  }
});

test("cada pantalla del volcán conserva suelo seguro y añade patrullas aéreas sin atravesar plataformas", () => {
  const volcano = levels.filter((level) => level.world === 10);
  assert.deepEqual(volcano.map((level) => level.enemies.filter((enemy) => enemy.kind === "flying-dragon").length), [2, 3, 4]);
  for (const level of volcano) {
    for (const enemy of level.enemies) {
      if (enemy.kind === "baby-dragon" || enemy.kind === "fire-salamander") {
        assert.equal(enemy.y + enemy.height, 456, `${level.id}/${enemy.id}: pies sobre el suelo`);
      }
      if (enemy.kind !== "flying-dragon") continue;
      assert.ok(enemy.minX <= enemy.x && enemy.x <= enemy.maxX);
      assert.ok(enemy.minX > level.start.x + 250 && enemy.maxX + enemy.width < level.goalX - 100);
      assert.ok(enemy.speed > 0 && enemy.speed <= 64);
      const left = enemy.minX - 15, right = enemy.maxX + enemy.width + 15;
      const top = enemy.y - 20 - 18, bottom = enemy.y + 20 + enemy.height + 18;
      assert.ok(top >= 0 && bottom < 300, "se puede pasar caminando por debajo");
      for (const platform of level.platforms) {
        assert.ok(right <= platform.x || left >= platform.x + platform.width || bottom <= platform.y || top >= platform.y + platform.height,
          `${level.id}/${enemy.id}: las alas no atraviesan ${platform.kind} en ${platform.x}`);
      }
    }
  }
  assert.equal(levels.filter((level) => level.world !== 10).flatMap((level) => level.enemies).some((enemy) => enemy.kind === "flying-dragon"), false);
});

const flier: Enemy = { id: "flying", kind: "flying-dragon", x: 400, y: 160, width: 54, height: 38, minX: 350, maxX: 500, speed: 48 };
const flightLevel = (overrides: Partial<Level> = {}): Level => ({
  id: "flight-test", world: 10, screen: 2, title: "Prueba", subtitle: "", theme: "dragon-volcano",
  width: 2000, start: { x: 80, y: 398 }, goalX: 1800,
  platforms: [{ x: 0, y: 456, width: 2000, height: 120, kind: "volcano-ground" }],
  enemies: [flier], items: [], rewardBlocks: [], checkpoints: [], ...overrides,
});
const advance = (engine: ReturnType<typeof mountEngine>, frames: number, start: number) => {
  let now = start;
  for (let frame = 0; frame < frames; frame++) { now += 1000 / 60 + .001; engine.tick(now); }
  return now;
};

test("el dragón real patrulla y oscila en el aire; pausa y reintento mantienen el contrato del motor", () => {
  const engine = mountEngine(flightLevel());
  try {
    engine.tick(1000);
    const initial = engine.drawnEnemies[0].enemy;
    let now = advance(engine, 60, 1000);
    const moving = engine.drawnEnemies[0].enemy;
    assert.notEqual(moving.x, initial.x);
    assert.notEqual(enemyY(moving), enemyY(initial));
    assert.ok(Math.abs(enemyY(moving) - flier.y) <= 20);
    engine.setRunning(false);
    engine.setRunning(true);
    engine.tick(now + 10_000);
    const resumed = engine.drawnEnemies[0].enemy;
    assert.equal(resumed.x, moving.x);
    assert.equal(resumed.phase, moving.phase);
    now = advance(engine, 240, now + 10_000);
    const last = engine.drawnEnemies[0].enemy;
    assert.ok(last.x >= flier.minX && last.x <= flier.maxX);
    assert.ok(now > 0);
  } finally { engine.unmount(); }
  const retry = mountEngine(flightLevel());
  try {
    retry.tick(1000);
    assert.equal(retry.drawnEnemies[0].enemy.x, flier.x);
    assert.equal(retry.drawnEnemies[0].enemy.phase, 0);
  } finally { retry.unmount(); }
});

test("un dragón volador se puede pisar desde arriba y daña por contacto lateral", () => {
  for (const [startY, sound] of [[90, "stomp"], [180, "hurt"]] as const) {
    const engine = mountEngine(flightLevel({
      start: { x: 100, y: startY },
      enemies: [{ ...flier, x: 100, y: 190, minX: 100, maxX: 100, speed: 0 }],
    }));
    try {
      engine.tick(1000);
      advance(engine, 45, 1000);
      assert.ok(engine.events.includes(sound), `interacción ${sound}`);
      if (sound === "stomp") assert.equal(engine.drawnEnemies[0].enemy.active, false);
    } finally { engine.unmount(); }
  }
});

test("el vuelo usa los cuatro fotogramas y refleja el sprite sin dibujar fragmentos del atlas", () => {
  const calls: unknown[][] = [];
  const scales: number[][] = [];
  const context = {
    save() {}, restore() {}, translate() {},
    scale: (...values: number[]) => scales.push(values),
    drawImage: (...values: unknown[]) => calls.push(values),
  } as unknown as CanvasRenderingContext2D;
  const image = { complete: true, naturalWidth: 512, naturalHeight: 112 } as HTMLImageElement;
  const enemy: LiveEnemy = { ...flier, vx: -48, active: true, phase: 0 };
  for (const elapsed of [0, .2, .4, .6]) drawEnemy(context, enemy, 0, false, { flyingDragon: image } as RasterAssets, "awake", elapsed);
  assert.deepEqual(calls.map((call) => call.slice(0, 5)), [0, 128, 256, 384].map((x) => [image, x, 0, 128, 112]));
  assert.deepEqual(scales, [[-1, 1], [-1, 1], [-1, 1], [-1, 1]]);
});
