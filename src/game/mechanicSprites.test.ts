import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { mechanicSpriteSheets, type MechanicSprite } from "./mechanicSprites.ts";
import { engineModules } from "./engineTestHarness.ts";
import { lavaJetState } from "./gameState.ts";
import type { RasterAssets } from "./assets";
import type { BloomBridge, LavaJet } from "./types";
import { readRgbaPng } from "./pngTestUtils.ts";

test("los sprites tienen tamaño, transparencia, detalle y fotogramas propios", () => {
  let bytes = 0;
  const tileNames: MechanicSprite[] = ["bloomBridge", "lavaSurface", "waterSurface", "airPlank", "mistPlatform"];
  for (const [name, sheet] of Object.entries(mechanicSpriteSheets)) {
    const png = readRgbaPng(sheet.source);
    assert.equal(png.width, sheet.columns * sheet.frameWidth, name);
    assert.equal(png.height, sheet.frameHeight, name);
    bytes += png.bytes;
    const frames = new Set<string>();
    for (let frame = 0; frame < sheet.columns; frame++) {
      const rgba = Buffer.alloc(sheet.frameWidth * sheet.frameHeight * 4);
      for (let y = 0; y < sheet.frameHeight; y++) {
        png.pixels.copy(rgba, y * sheet.frameWidth * 4, (y * png.width + frame * sheet.frameWidth) * 4, (y * png.width + (frame + 1) * sheet.frameWidth) * 4);
      }
      const colors = new Set<number>();
      let visible = 0;
      for (let index = 0; index < rgba.length; index += 4) {
        if (!rgba[index + 3]) continue;
        visible++;
        colors.add(rgba.readUInt32BE(index));
      }
      const minimumCoverage = name === "starAura" ? .01 : .05;
      assert.ok(visible > sheet.frameWidth * sheet.frameHeight * minimumCoverage, `${name}/${frame}: no está vacío`);
      assert.ok(colors.size >= 6, `${name}/${frame}: conserva sombras y detalles`);
      if (!tileNames.includes(name as MechanicSprite)) {
        assert.equal(rgba[3], 0, `${name}/${frame}: esquina superior transparente`);
        assert.ok(visible < sheet.frameWidth * sheet.frameHeight * .98, `${name}/${frame}: silueta recortada`);
      }
      frames.add(createHash("sha256").update(rgba).digest("hex"));
    }
    assert.equal(frames.size, sheet.columns, `${name}: cada pose es distinta`);
  }
  assert.ok(bytes <= 250 * 1024, `Sprites ligeros: ${bytes} bytes`);
});

test("las estrellas son destellos separados, nunca una burbuja o un aro alrededor de Noa", () => {
  const sheet = mechanicSpriteSheets.starAura;
  const png = readRgbaPng(sheet.source);
  for (let frame = 0; frame < sheet.columns; frame++) {
    const visible = (x: number, y: number) => png.pixels[(y * png.width + frame * sheet.frameWidth + x) * 4 + 3] > 0;
    for (let y = 36; y < 92; y++) for (let x = 48; x < 80; x++) {
      assert.equal(visible(x, y), false, `${frame}: el cuerpo queda libre`);
    }
    const visited = new Set<number>();
    let components = 0;
    for (let y = 0; y < sheet.frameHeight; y++) for (let x = 0; x < sheet.frameWidth; x++) {
      const key = y * sheet.frameWidth + x;
      if (!visible(x, y) || visited.has(key)) continue;
      const pending = [[x, y]];
      visited.add(key);
      let left = x, right = x, top = y, bottom = y;
      while (pending.length) {
        const [px, py] = pending.pop()!;
        left = Math.min(left, px); right = Math.max(right, px);
        top = Math.min(top, py); bottom = Math.max(bottom, py);
        for (const [nx, ny] of [[px - 1, py], [px + 1, py], [px, py - 1], [px, py + 1]]) {
          const neighbor = ny * sheet.frameWidth + nx;
          if (nx < 0 || nx >= sheet.frameWidth || ny < 0 || ny >= sheet.frameHeight || visited.has(neighbor) || !visible(nx, ny)) continue;
          visited.add(neighbor);
          pending.push([nx, ny]);
        }
      }
      components++;
      assert.ok(right - left < 40 && bottom - top < 40, `${frame}: no hay un borde conectado`);
    }
    assert.ok(components >= 7, `${frame}: hay varias estrellas independientes`);
  }
});

test("los puentes, tablones y barcos conservan la superficie transitable en su recorte", () => {
  for (const [name, deckY] of [["bloomBridge", 0], ["airPlank", 0], ["flyingShip", 144]] as const) {
    const sheet = mechanicSpriteSheets[name];
    const { width, pixels } = readRgbaPng(sheet.source);
    for (let column = 0; column < sheet.columns; column++) {
      for (let x = 0; x < sheet.frameWidth; x++) {
        assert.ok(pixels[(deckY * width + column * sheet.frameWidth + x) * 4 + 3] > 0, `${name}: apoyo visible en x=${x}`);
      }
    }
  }
});

const rendering = engineModules()("./rendering") as typeof import("./rendering");
function drawing(loaded = true) {
  const images = Object.fromEntries(Object.entries(mechanicSpriteSheets).map(([key, sheet]) => [key, {
    complete: loaded, naturalWidth: loaded ? sheet.frameWidth * sheet.columns : 0,
    naturalHeight: loaded ? sheet.frameHeight : 0, src: sheet.source,
  }]));
  const pending = { complete: false, naturalWidth: 0 };
  const raster = { ...images, tiles: { 2: pending, 5: pending } } as RasterAssets;
  const calls: unknown[][] = [];
  const marks: string[] = [];
  const scales: number[][] = [];
  const gradient = { addColorStop() {} };
  const context = new Proxy<Record<string, unknown>>({}, {
    get: (target, name: string) => {
      if (name === "drawImage") return (...args: unknown[]) => calls.push(args);
      if (name === "scale") return (...args: number[]) => scales.push(args);
      if (name === "createLinearGradient") return () => gradient;
      if (["fill", "stroke", "fillRect"].includes(name)) return () => marks.push(name);
      return target[name] ?? (() => undefined);
    },
    set: (target, name: string, value) => { target[name] = value; return true; },
  }) as unknown as CanvasRenderingContext2D;
  return { raster, context, calls, marks, scales };
}

test("las estrellas rodean la silueta completa de Noa, tanto de pie como al saltar", () => {
  for (const grounded of [true, false]) {
    const { context, raster, calls } = drawing();
    rendering.drawStarAura(context, { x: 100, y: 398, width: 42, height: 58, grounded }, 0, 12, 12, 0, false, raster);
    assert.deepEqual(calls[0].slice(5), [41, grounded ? 323 : 347, 160, 160]);
  }
});
const bridge: BloomBridge = { id: "flower", x: 100, y: 430, width: 180, height: 18, interval: 4, delay: 0, openDuration: 1, warningDuration: 1 };
const jet: LavaJet = { id: "jet", x: 100, baseY: 456, width: 34, height: 180, interval: 4, delay: 0 };

test("el lobo usa dos poses de sueño y una pose diferente para despertar", () => {
  const { context, raster, calls, scales } = drawing();
  const enemy = { id: "wolf", kind: "wolf" as const, x: 100, y: 398, width: 64, height: 58, minX: 0, maxX: 300, speed: 40, vx: -40, phase: 0, active: true };
  rendering.drawEnemy(context, enemy, 0, false, raster, "sleeping", 0);
  rendering.drawEnemy(context, enemy, 0, false, raster, "sleeping", .8);
  rendering.drawEnemy(context, enemy, 0, false, raster, "warning", .8);
  assert.deepEqual(calls.map((call) => [call[0], call[1]]), [[raster.sleepingWolf, 0], [raster.sleepingWolf, 128], [raster.sleepingWolf, 256]]);
  assert.ok(scales.every(([x, y]) => x === -1 && y === 1), "poses orientadas según el enemigo");
});

test("flor y puente muestran sus estados reales sin dibujar suelo durante el cierre", () => {
  for (const [elapsed, flowerFrame, bridgeFrame] of [[0, 2, 0], [1.2, 3, 1], [2.1, 0, null], [3.1, 1, null]] as const) {
    const { context, raster, calls } = drawing();
    rendering.drawBloomBridge(context, bridge, 0, elapsed, raster);
    assert.equal(calls.filter((call) => call[0] === raster.bloomFlower).length, 2);
    assert.ok(calls.filter((call) => call[0] === raster.bloomFlower).every((call) => call[1] === flowerFrame * 96));
    const floor = calls.filter((call) => call[0] === raster.bloomBridge);
    if (bridgeFrame === null) assert.equal(floor.length, 0, "cerrado no parece transitable");
    else {
      assert.equal(floor.length, Math.ceil(bridge.width / 32));
      assert.ok(floor.every((call) => call[1] === bridgeFrame * 64 && call[6] === bridge.y && call[8] === bridge.height));
      assert.equal(floor.at(-1)![3], 40, "el último pétalo se recorta, no se estira");
      assert.equal(floor.at(-1)![7], 20);
    }
  }
});

test("la lava respeta el rectángulo de daño y desaparece al acabar su ciclo", () => {
  const { context, raster, calls } = drawing();
  const elapsed = .36;
  rendering.drawLavaJet(context, jet, 20, elapsed, raster);
  const { rect } = lavaJetState(jet, elapsed);
  assert.deepEqual(calls[0].slice(5), [rect.x - 20, rect.y, rect.width, rect.height]);
  calls.length = 0;
  rendering.drawLavaJet(context, jet, 20, 3, raster);
  assert.equal(calls.length, 0);
});

test("el agua del valle y del hielo usa sus propios recortes, sin depender del atlas jurásico", () => {
  for (const [theme, expectedFrame] of [["giant-valley", 0], ["ice-mountain", 2]] as const) {
    const { context, raster, calls } = drawing();
    rendering.drawDeadlyWater(context, { x: 100, y: 456, width: 180, height: 100 }, 0, 0, raster, theme);
    assert.ok(calls.length > 0);
    assert.ok(calls.every((call) => call[0] === raster.waterSurface && call[1] === expectedFrame * 128));
  }
});

test("barco, niebla, tablón, poza, lava y corrientes usan sus sprites cargados", () => {
  const { context, raster, calls, scales } = drawing();
  const platform = { x: 50, y: 300, width: 180, height: 20 };
  rendering.drawPlatform(context, { ...platform, kind: "ship" }, 0, 5, 0, 0, raster);
  assert.deepEqual(calls.at(-1)!.slice(5), [50, 300 - 144 + Math.round(Math.sin(50 * .015) * 4), 180, 224]);
  rendering.drawPlatform(context, { ...platform, kind: "air-plank" }, 0, 5, 0, 0, raster);
  rendering.drawPlatform(context, { ...platform, kind: "mist" }, 0, 2, 0, 0, raster);
  rendering.drawWaterEntrance(context, { x: 100, y: 470, width: 145, height: 110 }, 0, 0, raster);
  rendering.drawDeadlyWater(context, { x: 100, y: 456, width: 180, height: 100 }, 0, 0, raster, "dragon-volcano");
  rendering.drawUpdraft(context, { id: "up", x: 100, y: 100, width: 150, height: 270, strength: 1950, maxRiseSpeed: 140 }, 0, 0, raster);
  rendering.drawWindZone(context, { id: "wind", x: 100, y: 0, width: 300, height: 400, direction: -1, strength: 260 }, 0, 0, raster);
  for (const key of ["flyingShip", "airPlank", "mistPlatform", "waterEntrance", "lavaSurface", "updraft", "windGust"] as const) {
    assert.ok(calls.some((call) => call[0] === raster[key]), `sprite de ${key}`);
  }
  assert.ok(scales.some(([x, y]) => x === -1 && y === 1), "el viento también señala hacia la izquierda");
});

test("el arte pendiente conserva los indicadores y los apoyos provisionales", () => {
  const { context, raster, calls, marks } = drawing(false);
  rendering.drawBloomBridge(context, bridge, 0, 0, raster);
  rendering.drawLavaJet(context, jet, 0, .36, raster);
  rendering.drawPlatform(context, { x: 50, y: 300, width: 180, height: 20, kind: "ship" }, 0, 5, 0, 0, raster);
  rendering.drawPlatform(context, { x: 50, y: 300, width: 180, height: 20, kind: "mist" }, 0, 2, 0, 0, raster);
  rendering.drawWaterEntrance(context, { x: 100, y: 470, width: 145, height: 110 }, 0, 0, raster);
  assert.equal(calls.length, 0);
  assert.ok(marks.length > 10, "nunca se vuelven invisibles las flores, la lava ni las plataformas");
});
