import assert from "node:assert/strict";
import test from "node:test";
import type { LiveEnemy } from "./gameState";
import type { RasterAssets } from "./assets";
import { engineModules } from "./engineTestHarness.ts";

const { drawEnemy } = engineModules()("./rendering") as typeof import("./rendering");
const species: LiveEnemy["kind"][] = [
  "slime", "beetle", "cloud", "wolf", "boar", "bird", "pirate", "parrot", "bat", "sky-unicorn",
  "skeleton", "zombie", "ghost", "fish", "urchin", "baby-t-rex", "pterodactyl",
  "baby-dragon", "fire-salamander", "flying-dragon", "ant", "snail", "bee", "penguin", "snow-fox", "snowy-owl",
];

for (const complete of [false, true]) {
  test(`todas las especies son visibles con imagen ${complete ? "fallida" : "pendiente"}`, () => {
    for (const kind of species) {
      const paint: unknown[][] = [];
      const context = {
        save() {}, restore() {}, translate() {}, scale() {},
        fillRect: (...args: unknown[]) => paint.push(args),
        drawImage: () => assert.fail("una imagen pendiente o fallida no se debe dibujar"),
      } as unknown as CanvasRenderingContext2D;
      const image = { complete, naturalWidth: 0 } as HTMLImageElement;
      const raster = Object.fromEntries([
        "enemies", "boar", "bird", "cave", "secret", "castleEnemies", "waterEnemies", "dinosaurEnemies", "worldCharacters", "flyingDragon",
      ].map((key) => [key, image])) as unknown as RasterAssets;
      drawEnemy(context, {
        id: kind, kind, x: 100, y: 300, width: 58, height: 50,
        minX: 0, maxX: 500, speed: 50, vx: -50, phase: 0, active: true,
      }, 0, false, raster);
      assert.ok(paint.length > 0, `${kind} debe conservar una silueta visible`);
    }
  });
}

test("el atlas cargado reemplaza la silueta provisional", () => {
  let images = 0;
  let rectangles = 0;
  const context = {
    save() {}, restore() {}, translate() {}, scale() {},
    fillRect: () => { rectangles += 1; },
    drawImage: () => { images += 1; },
  } as unknown as CanvasRenderingContext2D;
  const image = { complete: true, naturalWidth: 1000, naturalHeight: 500 } as HTMLImageElement;
  const enemy: LiveEnemy = {
    id: "rex", kind: "baby-t-rex", x: 100, y: 300, width: 58, height: 50,
    minX: 0, maxX: 500, speed: 50, vx: 50, phase: 0, active: true,
  };
  drawEnemy(context, enemy, 0, false, { dinosaurEnemies: image } as RasterAssets);
  assert.equal(images, 1);
  assert.equal(rectangles, 0);
});
