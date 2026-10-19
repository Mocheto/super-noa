import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { getLevelAssets } from "./assets.ts";
import { levels } from "./levels.ts";

test("cada pantalla carga sus propios atlas y reutiliza las imágenes", () => {
  const originalImage = globalThis.Image;
  const requested: string[] = [];
  class FakeImage {
    private value = "";
    set src(value: string) { this.value = value; requested.push(value); }
    get src() { return this.value; }
  }
  globalThis.Image = FakeImage as unknown as typeof Image;
  try {
    const orchard = levels.find((level) => level.id === "1-1")!;
    const first = getLevelAssets(orchard);
    const count = requested.length;
    const second = getLevelAssets(orchard);
    assert.equal(requested.length, count);
    assert.equal(first.tiles[1], second.tiles[1]);
    assert.ok(requested.includes("./assets/stickers/world-1-v1.png"));
    assert.ok(!requested.includes("./assets/stickers/world-8-v1.png"));
    assert.ok(!requested.includes("./assets/worlds/world-8.png"));
    const birds = getLevelAssets(levels.find((level) => level.id === "4-2")!);
    assert.equal(birds.bird.src, "./assets/sprites/enemy-bird-v2.png");
    const cave = getLevelAssets(levels.find((level) => level.id === "2-1")!);
    assert.equal(cave.cave.src, "./assets/atlases/cave-v1.png");
    const dinosaurs = getLevelAssets(levels.find((level) => level.id === "9-1")!);
    assert.equal(dinosaurs.dinosaurTerrain.src, "./assets/atlases/dinosaur-island-v1.png");
    assert.equal(dinosaurs.dinosaurEnemies.src, "./assets/atlases/dinosaur-enemies-v1.png");
    const jumpingFish = getLevelAssets(levels.find((level) => level.id === "9-2")!);
    assert.equal(jumpingFish.jumpingFish.src, "./assets/sprites/enemy-jumping-fish-v1.png");
    assert.equal(getLevelAssets(levels.find((level) => level.id === "10-1")!).worldCharacters.src, "./assets/atlases/volcano-characters-v1.png");
    assert.equal(getLevelAssets(levels.find((level) => level.id === "11-1")!).worldCharacters.src, "./assets/atlases/giant-valley-characters-v1.png");
    assert.equal(getLevelAssets(levels.find((level) => level.id === "12-1")!).worldCharacters.src, "./assets/atlases/ice-mountain-characters-v1.png");
    for (const level of levels) getLevelAssets(level);
    for (const src of requested) {
      assert.ok(src.startsWith("./assets/"), `Ruta no relativa: ${src}`);
      assert.ok(existsSync(new URL(`../../public/${src.slice(2)}`, import.meta.url)), `Falta el recurso ${src}`);
    }
  } finally {
    globalThis.Image = originalImage;
  }
});
