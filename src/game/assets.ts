import type { Level } from "./types";
import { mechanicSpriteSheets, type MechanicSprite } from "./mechanicSprites.ts";

export type RasterAssets = {
  worldBackground: HTMLImageElement;
  waterBackground: HTMLImageElement; waterTerrain: HTMLImageElement; seaWall: HTMLImageElement; seaRock: HTMLImageElement;
  waterEnemies: HTMLImageElement; swim: HTMLImageElement; waterCat: HTMLImageElement;
  enemies: HTMLImageElement; castleEnemies: HTMLImageElement; boar: HTMLImageElement;
  dinosaurEnemies: HTMLImageElement; dinosaurTerrain: HTMLImageElement;
  worldCharacters: HTMLImageElement;
  worldTerrain: HTMLImageElement;
  holidayBackground: HTMLImageElement;
  adventureBackground: HTMLImageElement;
  adventurePrecipices: HTMLImageElement;
  skyLift: HTMLImageElement;
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

/**
 * `url()` para pasar arte a una hoja de estilos mediante variables CSS. Una ruta relativa dentro de una variable se
 * resuelve contra la hoja compilada (que vive en `assets/`), no contra la página; por eso se resuelve aquí contra la
 * página y se conserva el funcionamiento en el dominio propio y bajo una subruta de GitHub Pages.
 */
export function cssAssetUrl(src: string): string {
  const resolved = typeof document === "undefined" ? src : new URL(src, document.baseURI).href;
  return `url("${resolved}")`;
}

/** Imagen compartida por ruta. */
export function getImage(src: string): HTMLImageElement {
  let image = cache.get(src);
  if (!image) {
    image = new Image();
    image.src = src;
    cache.set(src, image);
  }
  if (!mapas.has(image)) prepararMapa(image);
  return image;
}

/*
 * Mapas de bits ya descodificados (issue 322). El lienzo 2D descodifica cada imagen en el hilo principal la primera
 * vez que la dibuja: 20–180 ms de golpe en mitad de la partida. `createImageBitmap` sobre el archivo (un `Blob`, no la
 * `<img>`, que Chromium descodifica en el hilo principal) la descodifica fuera de él, y el lienzo de la partida dibuja
 * ese mapa en lugar de la imagen (`dibujarConMapas`). El archivo sale de la caché HTTP: no se descarga dos veces.
 */
const mapas = new Map<HTMLImageElement, ImageBitmap | "pendiente">();
/** Lienzos de partida que usan los mapas: solo se preparan mientras hay alguno, y se liberan al salir de la partida. */
let partidasConMapas = 0;

function prepararMapa(image: HTMLImageElement) {
  if (!partidasConMapas || typeof createImageBitmap !== "function" || typeof fetch !== "function" || !image.src) return;
  mapas.set(image, "pendiente");
  fetch(image.src)
    .then((respuesta) => respuesta.ok ? respuesta.blob() : Promise.reject(new Error(String(respuesta.status))))
    .then((archivo) => createImageBitmap(archivo))
    .then((mapa) => { if (mapas.get(image) === "pendiente") mapas.set(image, mapa); else mapa.close(); })
    .catch(() => mapas.delete(image));
}

/** El mapa de bits descodificado de una imagen, si ya está listo. */
export function mapaDe(image: HTMLImageElement): ImageBitmap | undefined {
  const mapa = mapas.get(image);
  return mapa && mapa !== "pendiente" ? mapa : undefined;
}

/**
 * Hace que `context.drawImage` use el mapa ya descodificado de cada imagen. Mientras su mapa se está descodificando
 * (unas decenas de ms tras llegar), la imagen se trata como si aún no hubiera cargado y no se dibuja: dibujarla
 * descodificaría en el hilo principal justo lo que se quiere evitar.
 */
export function dibujarConMapas(context: CanvasRenderingContext2D): () => void {
  if (typeof HTMLImageElement === "undefined") return () => undefined;
  partidasConMapas += 1;
  const dibujar = context.drawImage.bind(context) as (...args: unknown[]) => void;
  context.drawImage = ((image: CanvasImageSource, ...resto: number[]) => {
    if (!(image instanceof HTMLImageElement)) return dibujar(image, ...resto);
    const mapa = mapas.get(image);
    if (mapa === "pendiente") return;
    dibujar(mapa ?? image, ...resto);
  }) as CanvasRenderingContext2D["drawImage"];
  return () => {
    partidasConMapas -= 1;
    // Se liberan un poco después: al pasar de una pantalla a otra (o al reintentar) la partida vuelve enseguida.
    const liberar = () => {
      if (partidasConMapas) return;
      for (const mapa of mapas.values()) if (mapa !== "pendiente") mapa.close();
      mapas.clear();
    };
    if (typeof setTimeout === "function") setTimeout(liberar, 2000);
    else liberar();
  };
}

/** Poses de Noa que se usan nada más empezar a moverse. */
const POSES_BASICAS = ["./assets/sprites/noa-sprite-sheet.webp", "./assets/sprites/noa-jump-v2.webp"];

/**
 * Pide ya todo el arte que usará la pantalla (issue 322), para que llegue descodificado antes de entrar en escena: la
 * bandera, la puerta de la exploración, los atlas del mundo… Se llama justo después del primer cuadro, para no retrasar
 * el arranque. `extra` son rutas que la pantalla dibuja fuera de `RasterAssets` (gatitos de la exploración, ovillo de la
 * persecución…). Libera los mapas de bits de las imágenes que esta pantalla no pide: si luego se piden, se rehacen.
 */
export function precargarPantalla(assets: RasterAssets, extra: string[] = []) {
  const usadas = new Set<HTMLImageElement>();
  const tocar = (grupo: object) => {
    for (const clave of Object.keys(grupo)) {
      const valor = (grupo as Record<string, unknown>)[clave];
      if (typeof HTMLImageElement !== "undefined" && valor instanceof HTMLImageElement) usadas.add(valor);
      else if (valor instanceof Object && !("src" in valor)) tocar(valor);
    }
  };
  tocar(assets);
  [...POSES_BASICAS, ...extra].forEach((src) => usadas.add(getImage(src)));
  for (const [image, mapa] of mapas) {
    if (usadas.has(image) || mapa === "pendiente") continue;
    mapa.close();
    mapas.delete(image);
  }
}

const when = (needed: boolean, src: string) => needed ? getImage(src) : (unloaded ??= new Image());

export function getLevelAssets(level: Level): RasterAssets {
  const world = level.world;
  const tileImages = {
    1: "world-1-tiles-v1.webp", 2: "world-2-tiles-v1.webp", 3: "world-3-tiles-v1.webp",
    4: "world-4-tiles-v1.webp", 5: "world-5-tiles-v1.webp", 6: "castle-v1.webp",
    7: "secret-sky-v1.webp", 8: "water-terrain-v1.webp", 9: "dinosaur-island-v1.webp",
    10: "platform-tiles-v1.webp", 11: "platform-tiles-v1.webp", 12: "platform-tiles-v1.webp", 13: "platform-tiles-v1.webp",
    14: "platform-tiles-v1.webp", 15: "platform-tiles-v1.webp", 16: "platform-tiles-v1.webp", 17: "sky-kingdom-terrain-v1.webp",
  } as const;
  const tiles = {} as RasterAssets["tiles"];
  const stickerSheets = {} as RasterAssets["stickerSheets"];
  for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] as const) {
    Object.defineProperty(tiles, id, { enumerable: true, get: () => when(id === world, `./assets/atlases/${tileImages[id]}`) });
    Object.defineProperty(stickerSheets, id, { enumerable: true, get: () => when(id === world, `./assets/stickers/world-${id}-v1.webp`) });
  }
  return {
    get secretShopDoor() { return when(Boolean(level.secretShop), mechanicSpriteSheets.secretShopDoor.source); },
    get starAura() { return when(Boolean(level.secretShop), mechanicSpriteSheets.starAura.source); },
    get castleHound() { return when(Boolean(level.chainGuardians?.length), mechanicSpriteSheets.castleHound.source); },
    get castleChainLink() { return when(Boolean(level.chainGuardians?.length), mechanicSpriteSheets.castleChainLink.source); },
    get castleChainPost() { return when(Boolean(level.chainGuardians?.length), mechanicSpriteSheets.castleChainPost.source); },
    get flyingDragon() { return when(level.enemies.some((enemy) => enemy.kind === "flying-dragon"), mechanicSpriteSheets.flyingDragon.source); },
    get sleepingWolf() { return when(level.enemies.some((enemy) => enemy.kind === "wolf" && Boolean(enemy.sleepCycle)), mechanicSpriteSheets.sleepingWolf.source); },
    get bloomFlower() { return when(Boolean(level.bloomBridges?.length), mechanicSpriteSheets.bloomFlower.source); },
    get bloomBridge() { return when(Boolean(level.bloomBridges?.length), mechanicSpriteSheets.bloomBridge.source); },
    get updraft() { return when(Boolean(level.updrafts?.length || level.sandGeysers?.length), mechanicSpriteSheets.updraft.source); },
    get windGust() { return when(Boolean(level.windZones?.length), mechanicSpriteSheets.windGust.source); },
    get lavaJet() { return when(Boolean(level.lavaJets?.length), mechanicSpriteSheets.lavaJet.source); },
    get lavaSurface() { return when(level.theme === "dragon-volcano" && Boolean(level.deadlyWater?.length), mechanicSpriteSheets.lavaSurface.source); },
    get waterSurface() { return when((level.theme === "giant-valley" || level.theme === "ice-mountain") && Boolean(level.deadlyWater?.length), mechanicSpriteSheets.waterSurface.source); },
    get waterEntrance() { return when(Boolean(level.waterEntrance), mechanicSpriteSheets.waterEntrance.source); },
    get flyingShip() { return when(level.platforms.some((platform) => platform.kind === "ship"), mechanicSpriteSheets.flyingShip.source); },
    get airPlank() { return when(level.platforms.some((platform) => platform.kind === "air-plank"), mechanicSpriteSheets.airPlank.source); },
    get mistPlatform() { return when(level.platforms.some((platform) => platform.kind === "mist"), mechanicSpriteSheets.mistPlatform.source); },
    get worldBackground() {
      const source = level.theme === "crystal-cave"
        ? "./assets/worlds/crystal-cave-background-v1.webp"
        : level.theme === "haunted-castle"
          ? "./assets/worlds/castle-interior-background-v1.webp"
          : `./assets/worlds/world-${world}${world <= 5 ? "-hd-v1" : ""}.webp`;
      return when(world <= 12 && world !== 8, source);
    },
    get waterBackground() { return when(world === 8, "./assets/worlds/world-8.webp"); },
    get waterTerrain() { return when(world === 8, "./assets/atlases/water-terrain-v1.webp"); },
    get seaWall() { return when(world === 8, "./assets/sprites/sea-reef-wall-v2.webp"); },
    get seaRock() { return when(world === 8 && level.platforms.some((platform) => platform.asoma), "./assets/sprites/roca-asoma-v1.webp"); },
    get waterEnemies() { return when(world === 8, "./assets/atlases/water-enemies-v1.webp"); },
    get swim() { return when(world === 8, "./assets/sprites/noa-swim-v1.webp"); },
    get waterCat() { return when(world === 8, "./assets/sprites/world-cat-8-v1.webp"); },
    get enemies() { return getImage("./assets/atlases/enemies-v1.webp"); },
    get castleEnemies() { return when(world === 6, "./assets/atlases/castle-enemies-v1.webp"); },
    get dinosaurEnemies() { return when(world === 9, "./assets/atlases/dinosaur-enemies-v1.webp"); },
    get dinosaurTerrain() { return when(world === 9, "./assets/atlases/dinosaur-island-v1.webp"); },
    get holidayBackground() { return when(world === 13, `./assets/worlds/${level.theme === "winter-snow" ? "winter-village-background-v1" : level.theme === "toy-factory" ? "toy-factory-background-v2" : "gift-warehouse-background-v2"}.webp`); },
    get adventureBackground() { return when(world >= 14, `./assets/worlds/${world === 14 ? "desert" : world === 15 ? "train" : world === 16 ? "music" : "sky-kingdom"}-background-v1.webp`); },
    get adventurePrecipices() { return when(world >= 14 && world <= 16, "./assets/atlases/adventure-precipices-v1.webp"); },
    get skyLift() { return when(Boolean(level.skyLifts?.length), "./assets/atlases/sky-lift-v1.webp"); },
    get worldCharacters() { return when(world >= 10, `./assets/atlases/${world === 14 ? "desert-enemies-v1" : world === 15 ? "train-enemies-v1" : world === 16 ? "music-characters-v1" : world === 17 ? "sky-kingdom-characters-v1" : level.theme === "winter-snow" ? "winter-village-enemies-v1" : level.theme === "toy-factory" ? "toy-factory-enemies-v1" : level.theme === "gift-warehouse" ? "gift-warehouse-enemies-v1" : world === 10 ? "volcano-characters-v1" : world === 11 ? "giant-valley-characters-v1" : "ice-mountain-characters-v1"}.webp`); },
    get worldTerrain() { return when(world >= 10, `./assets/atlases/${world === 14 ? "desert" : world === 15 ? "train" : world === 16 ? "music" : world === 17 ? "sky-kingdom" : level.theme === "winter-snow" ? "winter-village" : level.theme === "toy-factory" ? "toy-factory" : level.theme === "gift-warehouse" ? "gift-warehouse" : world === 10 ? "volcano" : world === 11 ? "giant-valley" : "ice-mountain"}-terrain-v1.webp`); },
    get dewTrampoline() { return when(world === 11, "./assets/sprites/dew-trampoline-v1.webp"); },
    get jumpingFish() { return when(Boolean(level.waterJumpers?.length), "./assets/sprites/enemy-jumping-fish-v1.webp"); },
    get boar() { return when(world === 4, "./assets/sprites/enemy-boar-v2.webp"); },
    get bird() { return when(level.enemies.some((enemy) => enemy.kind === "bird"), "./assets/sprites/enemy-bird-v2.webp"); },
    get collectibles() { return getImage("./assets/atlases/collectibles-v1.webp"); },
    get cave() { return when(level.theme === "crystal-cave" || level.id === "2-1", "./assets/atlases/cave-v1.webp"); },
    get castle() { return when(world === 6, "./assets/atlases/castle-v1.webp"); },
    get secret() { return when(world === 7 || level.rewardBlocks.some((block) => block.reward === "secret-vine"), "./assets/atlases/secret-sky-v1.webp"); },
    get cannon() { return when(Boolean(level.cannons?.length), "./assets/sprites/cannon-v1.webp"); },
    get cannonball() { return when(Boolean(level.cannons?.length), "./assets/sprites/cannonball-v1.webp"); },
    get checkpoint() { return getImage("./assets/sprites/checkpoint-v1.webp"); },
    get goalFlag() { return getImage("./assets/sprites/goal-flag-v1.webp"); },
    get goalRescue() { return getImage("./assets/sprites/goal-rescue-v1.webp"); },
    get bossGate() { return when(Boolean(level.boss), "./assets/sprites/boss-gate-v1.webp"); },
    get spring() { return when(level.platforms.some((platform) => platform.kind === "spring"), "./assets/sprites/spring-large-v1.webp"); },
    get platformTiles() { return getImage("./assets/atlases/platform-tiles-v1.webp"); },
    tiles,
    stickerSheets,
  };
}
