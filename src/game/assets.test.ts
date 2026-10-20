import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { getImage, getLevelAssets, optimizedAssetSource } from "./assets.ts";
import { levels } from "./levels.ts";
import { mechanicSpriteSheets, type MechanicSprite } from "./mechanicSprites.ts";

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
    assert.equal(requested.length, 0, "crear el catálogo no inicia descargas");
    for (const key of Object.keys(mechanicSpriteSheets) as MechanicSprite[]) {
      assert.equal(first[key].src, "", `el bosque inicial no carga ${key}`);
    }
    assert.equal(requested.length, 0);
    void first.tiles[1];
    void first.stickerSheets[1];
    const count = requested.length;
    const second = getLevelAssets(orchard);
    assert.equal(requested.length, count);
    assert.equal(first.tiles[1], second.tiles[1]);
    assert.ok(requested.includes("./assets/stickers/world-1-v1.webp"));
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
    assert.equal(getLevelAssets(levels.find((level) => level.id === "10-1")!).worldTerrain.src, "./assets/atlases/volcano-terrain-v1.png");
    const giants = getLevelAssets(levels.find((level) => level.id === "11-1")!);
    assert.equal(giants.worldTerrain.src, "./assets/atlases/giant-valley-terrain-v1.png");
    assert.equal(giants.dewTrampoline.src, "./assets/sprites/dew-trampoline-v1.png");
    const mechanicLevels: Record<MechanicSprite, string> = {
      flyingDragon: "10-1",
      sleepingWolf: "3-1", bloomFlower: "11-1", bloomBridge: "11-1", updraft: "S-1", windGust: "12-1",
      lavaJet: "10-1", lavaSurface: "10-1", waterSurface: "11-1", waterEntrance: "3-3", flyingShip: "5-1", airPlank: "5-1", mistPlatform: "2-1",
    };
    for (const name of Object.keys(mechanicLevels) as MechanicSprite[]) {
      const level = levels.find((entry) => entry.id === mechanicLevels[name])!;
      const assets = getLevelAssets(level);
      assert.equal(assets[name].src, mechanicSpriteSheets[name].source);
      assert.equal(assets[name], getLevelAssets(level)[name], "los fotogramas comparten la imagen en caché");
    }
    assert.equal(getLevelAssets(levels.find((level) => level.id === "12-1")!).worldTerrain.src, "./assets/atlases/ice-mountain-terrain-v1.png");
    for (const level of levels) {
      const assets = getLevelAssets(level);
      for (const key of Object.keys(assets) as (keyof typeof assets)[]) {
        if (key === "tiles" || key === "stickerSheets") void assets[key][level.world];
        else void assets[key];
      }
    }
    for (const src of requested) {
      assert.ok(src.startsWith("./assets/"), `Ruta no relativa: ${src}`);
      assert.ok(existsSync(new URL(`../../public/${src.slice(2)}`, import.meta.url)), `Falta el recurso ${src}`);
    }
  } finally {
    globalThis.Image = originalImage;
  }
});

test("la interfaz y el motor comparten una fuente optimizada y la misma imagen", () => {
  for (const original of [
    "./assets/home-adventure-v3.png", "./assets/worlds/noa-adventure-map-v1.png",
    "./assets/sprites/noa-sprite-sheet.png", "./assets/atlases/collectibles-v1.png",
  ]) {
    const source = optimizedAssetSource(original);
    assert.equal(source, original.replace(/\.png$/, ".webp"));
    assert.equal(optimizedAssetSource(source), source);
    const png = readFileSync(new URL(`../../public/${original.slice(2)}`, import.meta.url));
    const webp = readFileSync(new URL(`../../public/${source.slice(2)}`, import.meta.url));
    assert.equal(webp.toString("ascii", 0, 4), "RIFF");
    assert.equal(webp.toString("ascii", 8, 12), "WEBP");
    assert.ok(webp.length < png.length);
  }
  assert.equal(optimizedAssetSource("./assets/worlds/world-8.png"), "./assets/worlds/world-8.png");
  const originalImage = globalThis.Image;
  const requested: string[] = [];
  globalThis.Image = class {
    set src(value: string) { requested.push(value); }
  } as unknown as typeof Image;
  try {
    const source = "./assets/home-adventure-v3.png";
    assert.equal(getImage(source), getImage(optimizedAssetSource(source)));
    assert.deepEqual(requested, ["./assets/home-adventure-v3.webp"]);
  } finally {
    globalThis.Image = originalImage;
  }
});
