import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { cssAssetUrl, getImage, getLevelAssets } from "./assets.ts";
import { levels } from "./levels.ts";
import { mechanicSpriteSheets, type MechanicSprite } from "./mechanicSprites.ts";
import { readRgbaImage, webpSinPerdida } from "./imagenTestUtils.ts";

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
    assert.ok(!requested.includes("./assets/stickers/world-8-v1.webp"));
    assert.ok(!requested.includes("./assets/worlds/world-8.webp"));
    assert.equal(first.worldBackground.src, "./assets/worlds/world-1-hd-v1.webp");
    for (const world of [2, 3, 4, 5, 7, 9, 10, 11, 12] as const) {
      const level = levels.find((entry) => entry.world === world)!;
      assert.equal(getLevelAssets(level).worldBackground.src, `./assets/worlds/world-${world}${world <= 5 ? "-hd-v1" : ""}.webp`);
    }
    assert.equal(getLevelAssets(levels.find((level) => level.id === "2-2")!).worldBackground.src, "./assets/worlds/crystal-cave-background-v1.webp");
    assert.equal(getLevelAssets(levels.find((level) => level.id === "2-3")!).worldBackground.src, "./assets/worlds/crystal-cave-background-v1.webp");
    assert.equal(getLevelAssets(levels.find((level) => level.id === "6-1")!).worldBackground.src, "./assets/worlds/castle-interior-background-v1.webp");
    assert.equal(getLevelAssets(levels.find((level) => level.world === 8)!).worldBackground.src, "");
    const birds = getLevelAssets(levels.find((level) => level.id === "4-2")!);
    assert.equal(birds.bird.src, "./assets/sprites/enemy-bird-v2.webp");
    const cave = getLevelAssets(levels.find((level) => level.id === "2-1")!);
    assert.equal(cave.cave.src, "./assets/atlases/cave-v1.webp");
    const dinosaurs = getLevelAssets(levels.find((level) => level.id === "9-1")!);
    assert.equal(dinosaurs.dinosaurTerrain.src, "./assets/atlases/dinosaur-island-v1.webp");
    assert.equal(dinosaurs.dinosaurEnemies.src, "./assets/atlases/dinosaur-enemies-v1.webp");
    const jumpingFish = getLevelAssets(levels.find((level) => level.id === "9-2")!);
    assert.equal(jumpingFish.jumpingFish.src, "./assets/sprites/enemy-jumping-fish-v1.webp");
    assert.equal(getLevelAssets(levels.find((level) => level.id === "10-1")!).worldCharacters.src, "./assets/atlases/volcano-characters-v1.webp");
    assert.equal(getLevelAssets(levels.find((level) => level.id === "11-1")!).worldCharacters.src, "./assets/atlases/giant-valley-characters-v1.webp");
    assert.equal(getLevelAssets(levels.find((level) => level.id === "12-1")!).worldCharacters.src, "./assets/atlases/ice-mountain-characters-v1.webp");
    assert.equal(getLevelAssets(levels.find((level) => level.id === "10-1")!).worldTerrain.src, "./assets/atlases/volcano-terrain-v1.webp");
    const giants = getLevelAssets(levels.find((level) => level.id === "11-1")!);
    assert.equal(giants.worldTerrain.src, "./assets/atlases/giant-valley-terrain-v1.webp");
    assert.equal(giants.dewTrampoline.src, "./assets/sprites/dew-trampoline-v1.webp");
    const mechanicLevels: Record<MechanicSprite, string> = {
      secretShopDoor: "1-3", starAura: "1-3",
      castleHound: "6-1", castleChainLink: "6-1", castleChainPost: "6-1",
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
    assert.equal(getLevelAssets(levels.find((level) => level.id === "12-1")!).worldTerrain.src, "./assets/atlases/ice-mountain-terrain-v1.webp");
    for (const [id, background] of [["13-1", "winter-village-background-v1"], ["13-2", "toy-factory-background-v2"], ["13-3", "gift-warehouse-background-v2"]]) {
      const holiday = getLevelAssets(levels.find((level) => level.id === id)!);
      assert.equal(holiday.holidayBackground.src, `./assets/worlds/${background}.webp`);
      if (id === "13-1") {
        assert.equal(holiday.worldTerrain.src, "./assets/atlases/winter-village-terrain-v1.webp");
        assert.equal(holiday.worldCharacters.src, "./assets/atlases/winter-village-enemies-v1.webp");
      }
    }
    const desert = getLevelAssets(levels.find((level) => level.id === "14-1")!);
    assert.equal(desert.adventureBackground.src, "./assets/worlds/desert-background-v1.webp");
    assert.equal(desert.worldCharacters.src, "./assets/atlases/desert-enemies-v1.webp");
    assert.equal(desert.worldTerrain.src, "./assets/atlases/desert-terrain-v1.webp");
    assert.equal(desert.adventurePrecipices.src, "./assets/atlases/adventure-precipices-v1.webp");
    assert.equal(desert.stickerSheets[14].src, "./assets/stickers/world-14-v1.webp");
    const train = getLevelAssets(levels.find((level) => level.id === "15-1")!);
    assert.equal(train.adventureBackground.src, "./assets/worlds/train-background-v1.webp");
    assert.equal(train.worldCharacters.src, "./assets/atlases/train-enemies-v1.webp");
    assert.equal(train.worldTerrain.src, "./assets/atlases/train-terrain-v1.webp");
    assert.equal(train.stickerSheets[15].src, "./assets/stickers/world-15-v1.webp");
    const music = getLevelAssets(levels.find((level) => level.id === "16-1")!);
    assert.equal(music.adventureBackground.src, "./assets/worlds/music-background-v1.webp");
    assert.equal(music.worldCharacters.src, "./assets/atlases/music-characters-v1.webp");
    assert.equal(music.worldTerrain.src, "./assets/atlases/music-terrain-v1.webp");
    assert.equal(music.adventurePrecipices.src, "./assets/atlases/adventure-precipices-v1.webp");
    assert.equal(music.stickerSheets[16].src, "./assets/stickers/world-16-v1.webp");
    const sky = getLevelAssets(levels.find((level) => level.id === "17-1")!);
    assert.equal(sky.skyLift.src, "./assets/atlases/sky-lift-v1.webp");
    assert.equal(sky.worldTerrain.src, "./assets/atlases/sky-kingdom-terrain-v1.webp");
    assert.equal(first.holidayBackground.src, "");
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

test("el ascensor celeste usa un atlas RGBA completo para nube, palancas, guía, estación y flecha", () => {
  const atlas = readRgbaImage("./assets/atlases/sky-lift-v1.webp");
  assert.deepEqual([atlas.width, atlas.height], [1536, 1024]);
  const crops = [
    [0, 90, 870, 420], [850, 35, 330, 475], [1175, 35, 361, 475],
    [175, 520, 250, 490], [550, 555, 510, 455], [1110, 555, 426, 445],
  ] as const;
  for (const [x, y, width, height] of crops) {
    let visible = 0;
    for (let py = y; py < y + height; py += 1) {
      for (let px = x; px < x + width; px += 1) {
        if (atlas.pixels[(py * atlas.width + px) * 4 + 3] > 24) visible += 1;
      }
    }
    assert.ok(visible > 2000, `El recorte ${x},${y} debe contener un sprite visible`);
    assert.ok(visible < width * height * .8, `El recorte ${x},${y} debe conservar espacio transparente`);
  }
});

test("el arte de public es WebP sin PNG y cada ruta se pide una sola vez", () => {
  const pendientes = ["public/assets"];
  const png: string[] = [];
  while (pendientes.length) {
    const carpeta = pendientes.pop()!;
    for (const entrada of readdirSync(carpeta, { withFileTypes: true })) {
      if (entrada.isDirectory()) pendientes.push(`${carpeta}/${entrada.name}`);
      else if (entrada.name.endsWith(".png")) png.push(`${carpeta}/${entrada.name}`);
    }
  }
  assert.deepEqual(png, [], "el arte se publica como WebP sin pérdida: npm run recursos:webp");
  for (const source of ["./assets/home-adventure-v3.webp", "./assets/sprites/noa-sprite-sheet.webp", "./assets/atlases/collectibles-v1.webp"]) {
    webpSinPerdida(readFileSync(new URL(`../../public/${source.slice(2)}`, import.meta.url)));
  }
  const originalImage = globalThis.Image;
  const requested: string[] = [];
  globalThis.Image = class {
    set src(value: string) { requested.push(value); }
  } as unknown as typeof Image;
  try {
    const source = "./assets/home-adventure-v3.webp";
    assert.equal(getImage(source), getImage(source));
    assert.deepEqual(requested, [source]);
  } finally {
    globalThis.Image = originalImage;
  }
});

test("el arte que llega a la hoja de estilos por variables CSS se resuelve contra la página", () => {
  // Una ruta relativa dentro de una variable se resolvería contra la hoja compilada (assets/assets/...).
  for (const file of readdirSync("src/game").filter((name) => name.endsWith(".tsx"))) {
    const source = readFileSync(`src/game/${file}`, "utf8");
    assert.doesNotMatch(source, /"--[a-z-]+":\s*['`]url\(/, `${file} pasa una url() relativa por una variable CSS`);
  }
  assert.equal(cssAssetUrl("./assets/sprites/noa-guarda-v1.webp"), 'url("./assets/sprites/noa-guarda-v1.webp")');
});
