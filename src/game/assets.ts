import type { Level } from "./types";

export type RasterAssets = {
  waterBackground: HTMLImageElement; waterTerrain: HTMLImageElement; seaWall: HTMLImageElement;
  waterEnemies: HTMLImageElement; swim: HTMLImageElement; waterCat: HTMLImageElement;
  enemies: HTMLImageElement; castleEnemies: HTMLImageElement; boar: HTMLImageElement;
  dinosaurEnemies: HTMLImageElement; dinosaurTerrain: HTMLImageElement;
  worldCharacters: HTMLImageElement;
  worldTerrain: HTMLImageElement;
  jumpingFish: HTMLImageElement;
  bird: HTMLImageElement; collectibles: HTMLImageElement; cave: HTMLImageElement;
  castle: HTMLImageElement; secret: HTMLImageElement; cannon: HTMLImageElement;
  cannonball: HTMLImageElement; checkpoint: HTMLImageElement; goalFlag: HTMLImageElement;
  goalRescue: HTMLImageElement; bossGate: HTMLImageElement; spring: HTMLImageElement;
  platformTiles: HTMLImageElement; tiles: Record<Level["world"], HTMLImageElement>;
  stickerSheets: Record<Level["world"], HTMLImageElement>;
};

const cache = new Map<string, HTMLImageElement>();
let unloaded: HTMLImageElement | undefined;

export function getImage(src: string): HTMLImageElement {
  let image = cache.get(src);
  if (!image) {
    image = new Image();
    image.src = src;
    cache.set(src, image);
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
    tiles[id] = when(id === world, `./assets/atlases/${tileImages[id]}`);
    stickerSheets[id] = when(id === world, `./assets/stickers/world-${id}-v1.png`);
  }
  return {
    waterBackground: when(world === 8, "./assets/worlds/world-8.png"),
    waterTerrain: when(world === 8, "./assets/atlases/water-terrain-v1.png"),
    seaWall: when(world === 8, "./assets/sprites/sea-reef-wall-v2.png"),
    waterEnemies: when(world === 8, "./assets/atlases/water-enemies-v1.png"),
    swim: when(world === 8, "./assets/sprites/noa-swim-v1.png"),
    waterCat: when(world === 8, "./assets/sprites/world-cat-8-v1.png"),
    enemies: getImage("./assets/atlases/enemies-v1.png"),
    castleEnemies: when(world === 6, "./assets/atlases/castle-enemies-v1.png"),
    dinosaurEnemies: when(world === 9, "./assets/atlases/dinosaur-enemies-v1.png"),
    dinosaurTerrain: when(world === 9, "./assets/atlases/dinosaur-island-v1.png"),
    worldCharacters: when(world >= 10, `./assets/atlases/${world === 10 ? "volcano" : world === 11 ? "giant-valley" : "ice-mountain"}-characters-v1.png`),
    worldTerrain: when(world >= 10, `./assets/atlases/${world === 10 ? "volcano" : world === 11 ? "giant-valley" : "ice-mountain"}-terrain-v1.png`),
    jumpingFish: when(Boolean(level.waterJumpers?.length), "./assets/sprites/enemy-jumping-fish-v1.png"),
    boar: when(world === 4, "./assets/sprites/enemy-boar-v2.png"),
    bird: when(level.enemies.some((enemy) => enemy.kind === "bird"), "./assets/sprites/enemy-bird-v2.png"),
    collectibles: getImage("./assets/atlases/collectibles-v1.png"),
    cave: when(level.theme === "crystal-cave" || level.id === "2-1", "./assets/atlases/cave-v1.png"),
    castle: when(world === 6, "./assets/atlases/castle-v1.png"),
    secret: when(world === 7 || level.rewardBlocks.some((block) => block.reward === "secret-vine"), "./assets/atlases/secret-sky-v1.png"),
    cannon: when(Boolean(level.cannons?.length), "./assets/sprites/cannon-v1.png"),
    cannonball: when(Boolean(level.cannons?.length), "./assets/sprites/cannonball-v1.png"),
    checkpoint: getImage("./assets/sprites/checkpoint-v1.png"),
    goalFlag: getImage("./assets/sprites/goal-flag-v1.png"),
    goalRescue: getImage("./assets/sprites/goal-rescue-v1.png"),
    bossGate: when(Boolean(level.boss), "./assets/sprites/boss-gate-v1.png"),
    spring: when(level.platforms.some((platform) => platform.kind === "spring"), "./assets/sprites/spring-large-v1.png"),
    platformTiles: getImage("./assets/atlases/platform-tiles-v1.png"),
    tiles,
    stickerSheets,
  };
}
