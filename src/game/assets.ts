import type { Level } from "./types";
import { mechanicSpriteSheets, type MechanicSprite } from "./mechanicSprites.ts";

export type RasterAssets = {
  waterBackground: HTMLImageElement; waterTerrain: HTMLImageElement; seaWall: HTMLImageElement;
  waterEnemies: HTMLImageElement; swim: HTMLImageElement; waterCat: HTMLImageElement;
  enemies: HTMLImageElement; castleEnemies: HTMLImageElement; boar: HTMLImageElement;
  dinosaurEnemies: HTMLImageElement; dinosaurTerrain: HTMLImageElement;
  worldCharacters: HTMLImageElement;
  worldTerrain: HTMLImageElement;
  dewTrampoline: HTMLImageElement;
  jumpingFish: HTMLImageElement;
  bird: HTMLImageElement; collectibles: HTMLImageElement; cave: HTMLImageElement;
  castle: HTMLImageElement; secret: HTMLImageElement; cannon: HTMLImageElement;
  cannonball: HTMLImageElement; checkpoint: HTMLImageElement; goalFlag: HTMLImageElement;
  goalRescue: HTMLImageElement; bossGate: HTMLImageElement; spring: HTMLImageElement;
  platformTiles: HTMLImageElement; tiles: Record<Level["world"], HTMLImageElement>;
  stickerSheets: Record<Level["world"], HTMLImageElement>;
} & Record<MechanicSprite, HTMLImageElement>;

const cache = new Map<string, HTMLImageElement>();
let unloaded: HTMLImageElement | undefined;

// Lossless gameplay variants; original PNG URLs remain available to other screens.
const optimizedImages = new Set([
  "home-adventure-v3", "worlds/noa-adventure-map-v1",
  "atlases/collectibles-v1", "atlases/enemies-v1", "atlases/platform-tiles-v1", "atlases/world-1-tiles-v1",
  "sprites/checkpoint-v1", "sprites/goal-flag-v1", "sprites/goal-rescue-v1",
  "sprites/noa-sprite-sheet", "sprites/noa-sprite-sheet-gold-armor-v1",
  "sprites/noa-jump-v2", "sprites/noa-jump-gold-armor-v1",
  "sprites/noa-cat-jump-v2", "sprites/noa-cat-yarn-v2", "sprites/noa-cat-throw-v1",
  "sprites/noa-cat-run-v2", "sprites/yarn-ball-v1", "stickers/world-1-v1",
].map((name) => `./assets/${name}.png`));

export function optimizedAssetSource(src: string): string {
  return optimizedImages.has(src) ? src.replace(/\.png$/, ".webp") : src;
}

export function getImage(src: string): HTMLImageElement {
  const source = optimizedAssetSource(src);
  let image = cache.get(source);
  if (!image) {
    image = new Image();
    image.src = source;
    cache.set(source, image);
  }
  return image;
}

const when = (needed: boolean, src: string) => needed ? getImage(src) : (unloaded ??= new Image());

export function getLevelAssets(level: Level): RasterAssets {
  const world = level.world;
  const tileImages = {
    1: "world-1-tiles-v1.png", 2: "world-2-tiles-v1.png", 3: "world-3-tiles-v1.png",
    4: "world-4-tiles-v1.png", 5: "world-5-tiles-v1.png", 6: "castle-v1.png",
    7: "secret-sky-v1.png", 8: "water-terrain-v1.png", 9: "dinosaur-island-v1.png",
    10: "platform-tiles-v1.png", 11: "platform-tiles-v1.png", 12: "platform-tiles-v1.png",
  } as const;
  const tiles = {} as RasterAssets["tiles"];
  const stickerSheets = {} as RasterAssets["stickerSheets"];
  for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const) {
    Object.defineProperty(tiles, id, { enumerable: true, get: () => when(id === world, `./assets/atlases/${tileImages[id]}`) });
    Object.defineProperty(stickerSheets, id, { enumerable: true, get: () => when(id === world, `./assets/stickers/world-${id}-v1.png`) });
  }
  return {
    get sleepingWolf() { return when(level.enemies.some((enemy) => enemy.kind === "wolf" && Boolean(enemy.sleepCycle)), mechanicSpriteSheets.sleepingWolf.source); },
    get bloomFlower() { return when(Boolean(level.bloomBridges?.length), mechanicSpriteSheets.bloomFlower.source); },
    get bloomBridge() { return when(Boolean(level.bloomBridges?.length), mechanicSpriteSheets.bloomBridge.source); },
    get updraft() { return when(Boolean(level.updrafts?.length), mechanicSpriteSheets.updraft.source); },
    get windGust() { return when(Boolean(level.windZones?.length), mechanicSpriteSheets.windGust.source); },
    get lavaJet() { return when(Boolean(level.lavaJets?.length), mechanicSpriteSheets.lavaJet.source); },
    get lavaSurface() { return when(level.theme === "dragon-volcano" && Boolean(level.deadlyWater?.length), mechanicSpriteSheets.lavaSurface.source); },
    get waterSurface() { return when((level.theme === "giant-valley" || level.theme === "ice-mountain") && Boolean(level.deadlyWater?.length), mechanicSpriteSheets.waterSurface.source); },
    get waterEntrance() { return when(Boolean(level.waterEntrance), mechanicSpriteSheets.waterEntrance.source); },
    get flyingShip() { return when(level.platforms.some((platform) => platform.kind === "ship"), mechanicSpriteSheets.flyingShip.source); },
    get airPlank() { return when(level.platforms.some((platform) => platform.kind === "air-plank"), mechanicSpriteSheets.airPlank.source); },
    get mistPlatform() { return when(level.platforms.some((platform) => platform.kind === "mist"), mechanicSpriteSheets.mistPlatform.source); },
    get waterBackground() { return when(world === 8, "./assets/worlds/world-8.png"); },
    get waterTerrain() { return when(world === 8, "./assets/atlases/water-terrain-v1.png"); },
    get seaWall() { return when(world === 8, "./assets/sprites/sea-reef-wall-v2.png"); },
    get waterEnemies() { return when(world === 8, "./assets/atlases/water-enemies-v1.png"); },
    get swim() { return when(world === 8, "./assets/sprites/noa-swim-v1.png"); },
    get waterCat() { return when(world === 8, "./assets/sprites/world-cat-8-v1.png"); },
    get enemies() { return getImage("./assets/atlases/enemies-v1.png"); },
    get castleEnemies() { return when(world === 6, "./assets/atlases/castle-enemies-v1.png"); },
    get dinosaurEnemies() { return when(world === 9, "./assets/atlases/dinosaur-enemies-v1.png"); },
    get dinosaurTerrain() { return when(world === 9, "./assets/atlases/dinosaur-island-v1.png"); },
    get worldCharacters() { return when(world >= 10, `./assets/atlases/${world === 10 ? "volcano" : world === 11 ? "giant-valley" : "ice-mountain"}-characters-v1.png`); },
    get worldTerrain() { return when(world >= 10, `./assets/atlases/${world === 10 ? "volcano" : world === 11 ? "giant-valley" : "ice-mountain"}-terrain-v1.png`); },
    get dewTrampoline() { return when(world === 11, "./assets/sprites/dew-trampoline-v1.png"); },
    get jumpingFish() { return when(Boolean(level.waterJumpers?.length), "./assets/sprites/enemy-jumping-fish-v1.png"); },
    get boar() { return when(world === 4, "./assets/sprites/enemy-boar-v2.png"); },
    get bird() { return when(level.enemies.some((enemy) => enemy.kind === "bird"), "./assets/sprites/enemy-bird-v2.png"); },
    get collectibles() { return getImage("./assets/atlases/collectibles-v1.png"); },
    get cave() { return when(level.theme === "crystal-cave" || level.id === "2-1", "./assets/atlases/cave-v1.png"); },
    get castle() { return when(world === 6, "./assets/atlases/castle-v1.png"); },
    get secret() { return when(world === 7 || level.rewardBlocks.some((block) => block.reward === "secret-vine"), "./assets/atlases/secret-sky-v1.png"); },
    get cannon() { return when(Boolean(level.cannons?.length), "./assets/sprites/cannon-v1.png"); },
    get cannonball() { return when(Boolean(level.cannons?.length), "./assets/sprites/cannonball-v1.png"); },
    get checkpoint() { return getImage("./assets/sprites/checkpoint-v1.png"); },
    get goalFlag() { return getImage("./assets/sprites/goal-flag-v1.png"); },
    get goalRescue() { return getImage("./assets/sprites/goal-rescue-v1.png"); },
    get bossGate() { return when(Boolean(level.boss), "./assets/sprites/boss-gate-v1.png"); },
    get spring() { return when(level.platforms.some((platform) => platform.kind === "spring"), "./assets/sprites/spring-large-v1.png"); },
    get platformTiles() { return getImage("./assets/atlases/platform-tiles-v1.png"); },
    tiles,
    stickerSheets,
  };
}
