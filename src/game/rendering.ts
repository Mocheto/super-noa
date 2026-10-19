import type { Level } from "./types";
import type { RasterAssets } from "./assets";
import type { LiveEnemy, LiveCannon, Cannonball, LiveWaterJumper } from "./gameState";
import { enemyY, positiveModulo, waterJumperState } from "./gameState";
import { VIEW_WIDTH, VIEW_HEIGHT } from "./constants";

const enemyAtlasCell = {
  slime: [0, 0], beetle: [1, 0], cloud: [2, 0], wolf: [3, 0],
  boar: [0, 1], bird: [1, 1], pirate: [2, 1], parrot: [3, 1],
} as const;

const enemyRasterSize = {
  slime: [48, 50], beetle: [50, 48], cloud: [56, 43], wolf: [64, 58],
  boar: [70, 58], bird: [52, 46], pirate: [52, 59], parrot: [58, 60],
} as const;

const drawAtlasCell = (context: CanvasRenderingContext2D, image: HTMLImageElement, columns: number, rows: number, column: number, row: number, x: number, y: number, width: number, height: number, alpha = 1) => {
  if (!image.complete || !image.naturalWidth) return false;
  const cellWidth = image.naturalWidth / columns;
  const cellHeight = image.naturalHeight / rows;
  const inset = Math.max(4, Math.round(Math.min(cellWidth, cellHeight) * 0.025));
  context.save();
  context.globalAlpha = alpha;
  context.drawImage(image, column * cellWidth + inset, row * cellHeight + inset, cellWidth - inset * 2, cellHeight - inset * 2, x, y, width, height);
  context.restore();
  return true;
};

export const drawCastleSprite = (context: CanvasRenderingContext2D, image: HTMLImageElement, part: "floor" | "wall" | "ledge" | "spikes", x: number, y: number, width: number, height: number, alpha = 1) => {
  if (!image.complete || !image.naturalWidth) return;
  const source = {
    floor: [28, 300, 664, 312], wall: [696, 88, 530, 532],
    ledge: [20, 704, 652, 486], spikes: [686, 704, 550, 486],
  }[part];
  context.save();
  context.globalAlpha = alpha;
  context.drawImage(image, source[0], source[1], source[2], source[3], x, y, width, height);
  context.restore();
};

const drawDinosaurTerrainSprite = (context: CanvasRenderingContext2D, image: HTMLImageElement, part: "ground" | "wall" | "ledge", x: number, y: number, width: number, height: number) => {
  if (!image.complete || !image.naturalWidth) return;
  if (part === "ground") {
    // La franja de roca cubre solo desde la superficie física hacia abajo.
    context.drawImage(image, 18, 350, 690, 298, x, y, width, height);
    // La vegetación queda sobre fondo transparente y su césped coincide con y.
    context.drawImage(image, 18, 178, 690, 470, x, y - 48, width, 130);
    return;
  }
  const source = {
    wall: [710, 18, 526, 632],
    ledge: [18, 704, 690, 530],
  }[part];
  context.drawImage(image, source[0], source[1], source[2], source[3], x, y, width, height);
};

const drawCollectibleSprite = (context: CanvasRenderingContext2D, image: HTMLImageElement, column: number, row: number, x: number, y: number, width: number, height: number) =>
  drawAtlasCell(context, image, 4, 2, column, row, x, y, width, height);

const stampTileTexture = (context: CanvasRenderingContext2D, image: HTMLImageElement | undefined, tile: number, x: number, y: number, width: number, height: number, alpha = 0.28) => {
  if (!image?.complete || !image.naturalWidth || width < 20 || height < 8) return;
  const size = 54;
  for (let stampX = x; stampX < x + width; stampX += size) {
    drawAtlasCell(context, image, 2, 2, tile % 2, Math.floor(tile / 2), stampX, y, Math.min(size, x + width - stampX), height, alpha);
  }
};

const stampPlatformTile = (context: CanvasRenderingContext2D, image: HTMLImageElement | undefined, world: Level["world"], x: number, y: number, width: number, height: number) => {
  if (!image?.complete || !image.naturalWidth || width < 24 || height < 10) return;
  const column = (world - 1) % 3;
  const row = Math.floor((world - 1) / 3);
  const sourceWidth = image.naturalWidth / 3;
  const sourceHeight = image.naturalHeight / 2;
  context.save();
  context.globalAlpha = 0.2;
  for (let tileX = x; tileX < x + width; tileX += 96) {
    context.drawImage(image, column * sourceWidth, row * sourceHeight, sourceWidth, sourceHeight, tileX, y, Math.min(96, x + width - tileX), height);
  }
  context.restore();
};

const stampWorldTile = (context: CanvasRenderingContext2D, image: HTMLImageElement | undefined, column: number, row: number, x: number, y: number, width: number, height: number, alpha = 1) => {
  if (!image?.complete || !image.naturalWidth || width < 16 || height < 6) return;
  const sourceWidth = image.naturalWidth / 2;
  const sourceHeight = image.naturalHeight / 2;
  context.save();
  context.globalAlpha = alpha;
  for (let tileX = x; tileX < x + width; tileX += 72) {
    context.drawImage(image, column * sourceWidth, row * sourceHeight, sourceWidth, sourceHeight, tileX, y, Math.min(72, x + width - tileX), height);
  }
  context.restore();
};

const worldPlatformCells = (world: Level["world"]) => {
  if (world === 1) return { top: [0, 0] as const, body: [1, 0] as const, branch: [1, 1] as const };
  if (world === 2) return { top: [0, 0] as const, body: [0, 0] as const, branch: [1, 1] as const };
  if (world === 3) return { top: [1, 0] as const, body: [1, 0] as const, branch: [1, 1] as const };
  if (world === 4) return { top: [1, 0] as const, body: [0, 0] as const, branch: [1, 1] as const };
  if (world === 5) return { top: [1, 0] as const, body: [0, 0] as const, branch: [1, 1] as const };
  return { top: [1, 0] as const, body: [1, 0] as const, branch: [1, 1] as const };
};

const drawEnemyAtlasSprite = (context: CanvasRenderingContext2D, image: HTMLImageElement, column: number, row: number, x: number, y: number, width: number, height: number) => {
  const cellWidth = image.naturalWidth / 4;
  const cellHeight = image.naturalHeight / 2;
  const sourceTop = row === 0 ? cellHeight * 0.31 : cellHeight * 0.08;
  const sourceHeight = row === 0 ? cellHeight * 0.67 : cellHeight * 0.84;
  // Los jabalíes y pájaros ocupan el ancho completo de su celda: no añadimos
  // margen lateral al leer el atlas para no cortarles el hocico ni el pico.
  context.drawImage(image, column * cellWidth, row * cellHeight + sourceTop, cellWidth, sourceHeight, x, y, width, height);
};

const drawPixelCloud = (context: CanvasRenderingContext2D, x: number, y: number, color: string, shadow = "#bdd4dc") => {
  const px = Math.round(x);
  const py = Math.round(y);
  context.fillStyle = shadow;
  context.fillRect(px + 7, py + 18, 88, 20);
  context.fillRect(px + 23, py + 6, 34, 30);
  context.fillRect(px + 57, py + 12, 24, 24);
  context.fillStyle = color;
  context.fillRect(px, py + 12, 88, 20);
  context.fillRect(px + 16, py, 34, 30);
  context.fillRect(px + 50, py + 6, 24, 24);
  context.fillStyle = "rgba(255,255,255,.42)";
  context.fillRect(px + 20, py + 4, 21, 5);
};

export const drawTinySparkle = (context: CanvasRenderingContext2D, x: number, y: number, color: string, scale = 1) => {
  context.fillStyle = color;
  context.fillRect(Math.round(x + 4 * scale), Math.round(y), 3 * scale, 11 * scale);
  context.fillRect(Math.round(x), Math.round(y + 4 * scale), 11 * scale, 3 * scale);
};

function drawHappySun(context: CanvasRenderingContext2D, x: number, y: number, sunset: boolean, pirate: boolean, frame: number, collectibles?: HTMLImageElement) {
  if (collectibles && drawCollectibleSprite(context, collectibles, 0, 1, x - 2, y - 2, 84, 84)) return;
  context.fillStyle = sunset ? "#ffd084" : "#ffe36f";
  context.fillRect(x + 27, y, 14, 12);
  context.fillRect(x + 27, y + 68, 14, 12);
  context.fillRect(x, y + 27, 12, 14);
  context.fillRect(x + 68, y + 27, 12, 14);
  context.fillRect(x + 8, y + 8, 12, 12);
  context.fillRect(x + 60, y + 8, 12, 12);
  context.fillRect(x + 8, y + 60, 12, 12);
  context.fillRect(x + 60, y + 60, 12, 12);
  context.fillStyle = sunset ? "#ffc15f" : "#ffdf55";
  context.fillRect(x + 12, y + 12, 56, 56);
  context.fillRect(x + 5, y + 25, 70, 30);
  context.fillStyle = "#5a3b48";
  const blinking = Math.floor(frame / 80) % 5 === 4;
  context.fillRect(x + 25, y + (blinking ? 35 : 31), 6, blinking ? 3 : 8);
  if (pirate) {
    context.fillRect(x + 47, y + 29, 11, 11);
    context.fillRect(x + 42, y + 33, 22, 4);
  } else {
    context.fillRect(x + 49, y + (blinking ? 35 : 31), 6, blinking ? 3 : 8);
  }
  context.fillRect(x + 31, y + 49, 18, 5);
  context.fillStyle = "#f08a72";
  context.fillRect(x + 17, y + 44, 8, 5);
  context.fillRect(x + 55, y + 44, 8, 5);
}

function drawHappyMoon(context: CanvasRenderingContext2D, x: number, y: number, catMoon: boolean, frame: number, collectibles?: HTMLImageElement) {
  if (collectibles && drawCollectibleSprite(context, collectibles, 1, 1, x - 2, y - 2, 84, 84)) return;
  context.fillStyle = "#fff0ad";
  if (catMoon) {
    context.fillRect(x + 12, y + 3, 18, 20);
    context.fillRect(x + 50, y + 3, 18, 20);
  }
  context.fillRect(x + 10, y + 12, 60, 60);
  context.fillRect(x + 3, y + 25, 74, 34);
  context.fillStyle = "#e6cf91";
  context.fillRect(x + 18, y + 19, 9, 8);
  context.fillRect(x + 57, y + 50, 8, 8);
  context.fillRect(x + 21, y + 57, 6, 6);
  context.fillStyle = "#4a3b61";
  const blinking = Math.floor(frame / 95) % 5 === 4;
  context.fillRect(x + 24, y + (blinking ? 39 : 36), 6, blinking ? 3 : 7);
  context.fillRect(x + 50, y + (blinking ? 39 : 36), 6, blinking ? 3 : 7);
  context.fillRect(x + 32, y + 51, 16, 5);
  context.fillStyle = "#e794a0";
  context.fillRect(x + 16, y + 47, 8, 5);
  context.fillRect(x + 56, y + 47, 8, 5);
}

function drawCaveBackground(context: CanvasRenderingContext2D, cameraX: number, frame: number, cave: HTMLImageElement) {
  context.fillStyle = "#120d24";
  context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  context.fillStyle = "#20183c";
  context.fillRect(0, 118, VIEW_WIDTH, 338);

  const wallOffset = positiveModulo(cameraX * 0.08, 210);
  for (let index = -1; index < 6; index += 1) {
    const x = index * 210 - wallOffset;
    drawAtlasCell(context, cave, 4, 2, 2, 0, x, 105 + (index % 2) * 28, 210, 270, 0.28);
  }

  context.fillStyle = "#2b2050";
  context.fillRect(0, 0, VIEW_WIDTH, 38);
  const ceilingOffset = positiveModulo(cameraX * 0.2, 150);
  for (let index = -1; index < 8; index += 1) {
    const x = index * 150 - ceilingOffset;
    const depth = 58 + positiveModulo(index * 17, 48);
    context.beginPath();
    context.moveTo(x, 28);
    context.lineTo(x + 42, 28);
    context.lineTo(x + 72, depth);
    context.lineTo(x + 102, 28);
    context.lineTo(x + 150, 28);
    context.lineTo(x + 150, 0);
    context.lineTo(x, 0);
    context.closePath();
    context.fill();
  }

  const lavaY = 454 + Math.round(Math.sin(frame * 0.08) * 2);
  context.fillStyle = "#7b1838";
  context.fillRect(0, 448, VIEW_WIDTH, VIEW_HEIGHT - 448);
  for (let x = -positiveModulo(cameraX * 0.28, 176) - 30; x < VIEW_WIDTH + 176; x += 176) {
    drawAtlasCell(context, cave, 4, 2, 3, 0, x, lavaY, 184, 100);
  }
  context.fillStyle = frame % 28 < 14 ? "#ffd05a" : "#ff8a35";
  for (let index = 0; index < 8; index += 1) {
    const x = positiveModulo(index * 151 - cameraX * 0.35, VIEW_WIDTH + 40) - 20;
    const y = 474 + positiveModulo(index * 23, 44);
    context.fillRect(Math.round(x), y, index % 2 ? 6 : 9, 4);
  }

  for (let index = 0; index < 7; index += 1) {
    const x = index * 190 - positiveModulo(cameraX * 0.32, 190) - 20;
    drawAtlasCell(context, cave, 4, 2, 3, 1, x, 350 + (index % 2) * 24, 66, 82, 0.72);
  }
}

export function drawBackground(context: CanvasRenderingContext2D, level: Level, cameraX: number, frame: number, raster: RasterAssets) {
  if (level.theme === "water-lagoon") {
    context.fillStyle = "#157b9d";
    context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    if (raster.waterBackground.complete && raster.waterBackground.naturalWidth) {
      // La orilla de la ilustración queda exactamente en la superficie jugable (y=120).
      const offset = positiveModulo(cameraX * 0.13, VIEW_WIDTH);
      const sourceWidth = raster.waterBackground.naturalWidth;
      const sourceHeight = raster.waterBackground.naturalHeight;
      for (const x of [-offset, VIEW_WIDTH - offset]) {
        context.drawImage(raster.waterBackground, 0, 0, sourceWidth, 215, x, 0, VIEW_WIDTH, 120);
        context.drawImage(raster.waterBackground, 0, 215, sourceWidth, sourceHeight - 215, x, 120, VIEW_WIDTH, VIEW_HEIGHT - 120);
      }
    }
    context.fillStyle = "rgba(5,45,84,.18)";
    context.fillRect(0, 120, VIEW_WIDTH, VIEW_HEIGHT - 120);
    return;
  }
  if (level.theme === "haunted-castle") {
    context.fillStyle = "#160f2e";
    context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    context.fillStyle = "#22183c";
    for (let x = -positiveModulo(cameraX * 0.12, 110); x < VIEW_WIDTH + 110; x += 110) {
      for (let y = 0; y < VIEW_HEIGHT; y += 105) {
        drawCastleSprite(context, raster.castle, "wall", x, y, 112, 106, 0.3);
      }
    }
    for (let index = -1; index < 7; index += 1) {
      const x = index * 185 - positiveModulo(cameraX * 0.2, 185);
      context.fillStyle = "#0d0e26";
      context.fillRect(x + 52, 107, 60, 184);
      context.fillRect(x + 64, 93, 36, 14);
      context.fillStyle = "#79559c";
      context.fillRect(x + 61, 121, 42, 134);
      context.fillStyle = "#bc8ac8";
      context.fillRect(x + 77, 120, 9, 134);
      context.fillStyle = "#382953";
      context.fillRect(x + 61, 198, 42, 8);
    }
    for (let index = 0; index < 12; index += 1) {
      const x = positiveModulo(index * 147 - cameraX * 0.17, VIEW_WIDTH);
      const y = 62 + positiveModulo(index * 83, 300);
      drawTinySparkle(context, x, y, index % 2 ? "#d7b5f8" : "#8fe2dc", index % 3 === 0 ? 2 : 1);
    }
    context.fillStyle = "#080b20";
    context.fillRect(0, 455, VIEW_WIDTH, 85);
    return;
  }
  if (level.theme === "dinosaur-island") {
    const gradient = context.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
    gradient.addColorStop(0, "#57c9f4");
    gradient.addColorStop(0.58, "#bdebd5");
    gradient.addColorStop(1, "#2c9a91");
    context.fillStyle = gradient;
    context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    context.fillStyle = "#eef7cf";
    context.beginPath();
    context.arc(785, 78, 45, 0, Math.PI * 2);
    context.fill();
    for (let index = -1; index < 7; index += 1) {
      const x = index * 210 - positiveModulo(cameraX * 0.12, 210);
      context.fillStyle = index % 2 ? "#538b68" : "#477c62";
      context.beginPath();
      context.moveTo(x, 390);
      context.lineTo(x + 92, 215 + positiveModulo(index * 37, 70));
      context.lineTo(x + 210, 390);
      context.closePath();
      context.fill();
    }
    context.fillStyle = "#286c55";
    for (let index = -1; index < 10; index += 1) {
      const x = index * 128 - positiveModulo(cameraX * 0.31, 128);
      const top = 335 - positiveModulo(index * 29, 72);
      context.fillRect(x + 58, top, 13, 122);
      context.beginPath();
      context.arc(x + 64, top + 12, 54, Math.PI, Math.PI * 2);
      context.fill();
      context.fillStyle = index % 2 ? "#349163" : "#2d805b";
    }
    context.fillStyle = "#157b83";
    context.fillRect(0, 448, VIEW_WIDTH, VIEW_HEIGHT - 448);
    return;
  }
  if (level.theme === "crystal-cave") {
    drawCaveBackground(context, cameraX, frame, raster.cave);
    return;
  }
  if (level.theme === "secret-sky") {
    context.fillStyle = "#77cdf5";
    context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    context.fillStyle = "#c6efff";
    context.fillRect(0, 255, VIEW_WIDTH, 285);
    for (let index = 0; index < 12; index += 1) {
      const x = index * 190 - positiveModulo(cameraX * 0.12, 190) - 70;
      drawPixelCloud(context, x, 48 + positiveModulo(index * 67, 250), index % 2 ? "#fff8ff" : "#f7edff", "#c4bff2");
    }
    const rainbowX = 710 - positiveModulo(cameraX * 0.04, 900);
    ["#ec6fa7", "#f4ad55", "#ffe56d", "#79d18d", "#70bde8", "#aa83dc"].forEach((color, index) => {
      context.strokeStyle = color;
      context.lineWidth = 9;
      context.beginPath();
      context.arc(rainbowX, 310, 155 - index * 9, Math.PI, Math.PI * 2);
      context.stroke();
    });
    for (let index = 0; index < 14; index += 1) {
      drawTinySparkle(context, positiveModulo(index * 173 - cameraX * 0.2, VIEW_WIDTH), 55 + positiveModulo(index * 83, 350), index % 2 ? "#fff5a9" : "#f9d3ff", index % 3 === 0 ? 2 : 1);
    }
    return;
  }
  const storm = level.theme === "boar-storm" || level.theme === "sky-storm";
  const night = level.theme === "forest-night" || level.theme === "wolf-moon" || level.theme === "boar-storm";
  const wolves = level.world === 3;
  const boars = level.world === 4;
  const pirates = level.world === 5;
  const forest = level.world >= 2 && level.world <= 4;
  const sunset = level.theme === "orchard-sunset" || level.theme === "forest-dusk" || level.theme === "wolf-pines";
  const sky = level.theme === "sky-storm" ? "#596581" : pirates ? "#72c8ed" : storm ? "#45475f" : boars ? "#d39462" : night ? "#171a3d" : wolves ? "#8d7894" : sunset ? "#f7a873" : "#91dcf4";
  context.fillStyle = sky;
  context.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  const lowerSky = pirates ? (storm ? "#75829b" : "#a7e2ed") : night ? "#292653" : boars ? "#e3ad78" : sunset ? "#f2c07e" : "#bfe8e5";
  context.fillStyle = lowerSky;
  context.fillRect(0, 255, VIEW_WIDTH, 285);
  context.fillStyle = night ? "rgba(213,190,241,.12)" : "rgba(255,248,220,.2)";
  for (let x = -((cameraX * 0.04) % 36); x < VIEW_WIDTH; x += 36) {
    const y = 170 + ((Math.floor((x + cameraX) / 36) % 4) * 22);
    context.fillRect(Math.round(x), y, 5, 5);
  }

  if (night) {
    drawHappyMoon(context, 770, 46, level.world === 2, frame, raster.collectibles);
    context.fillStyle = "#f5dfff";
    for (let index = 0; index < 18; index += 1) {
      const x = (index * 157 + 43) % VIEW_WIDTH;
      const y = 28 + ((index * 61) % 180);
      context.fillRect(x, y, index % 3 === 0 ? 4 : 2, index % 3 === 0 ? 4 : 2);
    }
  } else {
    drawHappySun(context, 770, 46, sunset || storm, pirates, frame, raster.collectibles);
  }

  const cloudColor = level.theme === "sky-storm" ? "#aeb8ce" : storm ? "#77758b" : night ? "#5c548c" : boars ? "#ffe1b5" : sunset ? "#ffe0cf" : "#f8fdff";
  const cloudShadow = level.theme === "sky-storm" ? "#727d98" : night ? "#3c3a69" : sunset ? "#d69b9c" : "#b7d9df";
  for (let index = 0; index < 7; index += 1) {
    const x = index * 310 - ((cameraX * 0.12) % 310) - 90;
    drawPixelCloud(context, x, 72 + (index % 3) * 48, cloudColor, cloudShadow);
  }

  const farColor = pirates ? (storm ? "#44506c" : "#7fb6c9") : boars ? (storm ? "#313c45" : "#596548") : wolves ? "#303956" : forest ? (night ? "#342c5f" : "#5d617b") : sunset ? "#c86d68" : "#6db6b1";
  context.fillStyle = farColor;
  if (pirates) {
    for (let index = -1; index < 6; index += 1) {
      const x = index * 230 - ((cameraX * 0.18) % 230);
      drawPixelCloud(context, x, 330 + (index % 2) * 55, farColor, storm ? "#30384f" : "#4f8397");
      context.fillStyle = storm ? "#343c58" : "#557b91";
      context.fillRect(Math.round(x + 35), 385 + (index % 2) * 55, 54, 10);
      context.fillRect(Math.round(x + 48), 395 + (index % 2) * 55, 28, 15);
    }
  } else {
    const mountainScroll = cameraX * 0.18;
    const firstMountain = Math.floor(mountainScroll / 180) - 1;
    for (let index = firstMountain; index < firstMountain + 8; index += 1) {
      const x = index * 180 - mountainScroll;
      const peak = 270 + positiveModulo(index, 3) * 30;
      context.beginPath();
      context.moveTo(x, 430);
      context.lineTo(x + 72, peak);
      context.lineTo(x + 96, peak + 26);
      context.lineTo(x + 180, 430);
      context.closePath();
      context.fill();
      context.fillStyle = night ? "rgba(220,211,244,.08)" : "rgba(255,244,218,.16)";
      context.beginPath();
      context.moveTo(x + 72, peak);
      context.lineTo(x + 96, peak + 26);
      context.lineTo(x + 118, 365);
      context.closePath();
      context.fill();
      context.fillStyle = farColor;
    }
  }

  const treeSpacing = level.world === 2 ? 190 : forest ? 165 : 220;
  const firstTree = Math.floor((cameraX * 0.45) / treeSpacing) - 2;
  const visibleTrees = Math.ceil(VIEW_WIDTH / treeSpacing) + 4;
  for (let index = firstTree; !pirates && index < firstTree + visibleTrees; index += 1) {
    const x = index * treeSpacing - cameraX * 0.45;
    const tall = 118 + positiveModulo(index * 19, 42);
    context.fillStyle = boars ? "#50372f" : wolves ? "#252a3c" : night ? "#281c49" : forest ? "#3d665e" : "#725039";
    context.fillRect(Math.round(x + 64), 430 - tall, 28, tall);
    context.fillStyle = boars ? "#7d5238" : wolves ? "#394256" : night ? "#493b77" : forest ? "#56806b" : "#9a6748";
    context.fillRect(Math.round(x + 69), 438 - tall, 7, tall - 18);
    context.fillStyle = boars ? (storm ? "#405347" : "#57744d") : wolves ? "#34485a" : night ? "#40366d" : forest ? "#477d68" : "#4d9b63";
    if (wolves) {
      for (let tier = 0; tier < 3; tier += 1) {
        context.beginPath();
        context.moveTo(Math.round(x + 76), 246 + tier * 44 - (index % 2) * 18);
        context.lineTo(Math.round(x + 16 - tier * 5), 348 + tier * 20);
        context.lineTo(Math.round(x + 137 + tier * 5), 348 + tier * 20);
        context.closePath();
        context.fill();
      }
      context.fillStyle = "#4d6570";
      context.fillRect(Math.round(x + 34), 335, 18, 6);
      context.fillRect(Math.round(x + 102), 369, 16, 6);
    } else if (boars) {
      context.fillRect(Math.round(x + 4), 285 - (index % 2) * 20, 145, 58);
      context.fillRect(Math.round(x + 22), 325 - (index % 2) * 20, 112, 46);
      context.fillStyle = storm ? "#526b57" : "#71935a";
      context.fillRect(Math.round(x + 18), 292 - (index % 2) * 20, 48, 11);
      context.fillRect(Math.round(x + 82), 332 - (index % 2) * 20, 42, 9);
      context.fillStyle = "#b57b3e";
      context.fillRect(Math.round(x + 30), 311 - (index % 2) * 20, 8, 8);
      context.fillRect(Math.round(x + 110), 300 - (index % 2) * 20, 8, 8);
    } else {
      const crownY = 290 - positiveModulo(index, 2) * 18;
      const crownInset = level.world === 2 ? 12 : 0;
      context.fillStyle = forest ? (night ? "#302754" : "#365b4f") : "#356f47";
      context.fillRect(Math.round(x + 19 + crownInset), crownY - 9, 110 - crownInset * 2, 87);
      context.fillRect(Math.round(x - 5 + crownInset), crownY + 26, 165 - crownInset * 2, 66);
      context.fillRect(Math.round(x + 45), crownY - 25, 61, 35);
      context.fillStyle = night ? "#40366d" : forest ? "#477d68" : "#4d9b63";
      context.fillRect(Math.round(x + 24 + crownInset), crownY - 4, 99 - crownInset * 2, 74);
      context.fillRect(Math.round(x + 2 + crownInset), crownY + 31, 151 - crownInset * 2, 52);
      context.fillRect(Math.round(x + 50), crownY - 19, 51, 25);
      context.fillStyle = night ? "#574982" : forest ? "#609478" : "#69b66f";
      context.fillRect(Math.round(x + 18 + crownInset), crownY + 7, 44, 13);
      context.fillRect(Math.round(x + 84 - crownInset), crownY + 48, 49, 11);
    }
    if (!forest) {
      context.fillStyle = "#e74b54";
      context.fillRect(Math.round(x + 35), 320, 10, 10);
      context.fillRect(Math.round(x + 108), 300, 10, 10);
      context.fillRect(Math.round(x + 78), 348, 10, 10);
    }
  }

  if (forest) {
    context.fillStyle = night ? "#f2d06b" : "#fff1a3";
    for (let index = 0; index < 20; index += 1) {
      const x = ((index * 173 - cameraX * 0.7) % (VIEW_WIDTH + 80)) - 20;
      const y = 210 + ((index * 47) % 190);
      context.fillRect(Math.round(x), y, 4, 4);
    }
  }

  if (pirates) {
    for (let index = 0; index < 7; index += 1) {
      const x = ((index * 181 - cameraX * 0.5) % (VIEW_WIDTH + 120)) - 40;
      drawTinySparkle(context, x, 205 + (index % 3) * 55, storm ? "#d7def0" : "#fff4b0", index % 3 === 0 ? 2 : 1);
    }
  }
}

export function drawAmbientForeground(context: CanvasRenderingContext2D, level: Level, cameraX: number, frame: number) {
  if (level.world >= 3 && level.world <= 4) {
    const leafColor = level.world === 3 ? "#263645" : level.world === 4 ? "#40573b" : "#3c6857";
    context.fillStyle = leafColor;
    for (let index = 0; index < 8; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      const x = side < 0 ? (index * 17) % 75 - 28 : VIEW_WIDTH - ((index * 19) % 78) - 24;
      const y = 34 + ((index * 79 + Math.floor(cameraX * 0.08)) % 360);
      context.fillRect(x, y, 34, 12);
      context.fillRect(x + (side < 0 ? 10 : -10), y + 9, 29, 10);
    }
  } else if (level.world === 2) {
    for (let index = 0; index < 8; index += 1) {
      const x = positiveModulo(index * 139 + frame * 0.35, VIEW_WIDTH);
      const y = 120 + positiveModulo(index * 67 + frame * 0.2, 310);
      drawTinySparkle(context, x, y, index % 2 ? "#f4d76f" : "#cfa5ef");
    }
  }
}

export function drawPlatform(context: CanvasRenderingContext2D, platform: Level["platforms"][number], cameraX: number, world: Level["world"], playerX: number, frame: number, raster: RasterAssets, springCompressed = false) {
  const x = Math.round(platform.x - cameraX);
  const forest = world >= 2 && world <= 4;
  const worldTiles = worldPlatformCells(world);
  if (x + platform.width < 0 || x > VIEW_WIDTH) return;
  if (platform.kind === "dino-ground" || platform.kind === "dino-ledge" || platform.kind === "dino-wall") {
    const ground = platform.kind === "dino-ground";
    const wall = platform.kind === "dino-wall";
    const part = wall ? "wall" : ground ? "ground" : "ledge";
    const tileWidth = wall ? 100 : ground ? 156 : 138;
    for (let tileY = platform.y; tileY < platform.y + (wall ? platform.height : 1); tileY += 96) {
      for (let tileX = x; tileX < x + platform.width; tileX += tileWidth) {
        drawDinosaurTerrainSprite(context, raster.dinosaurTerrain, part, tileX, tileY - (ground ? 0 : wall ? 0 : 7), Math.min(tileWidth + 3, x + platform.width - tileX), wall ? Math.min(100, platform.y + platform.height - tileY) : ground ? platform.height : 62);
      }
    }
    return;
  }
  if (platform.kind === "sea-ground" || platform.kind === "sea-ledge" || platform.kind === "sea-wall") {
    if (platform.kind === "sea-wall") {
      if (raster.seaWall.complete && raster.seaWall.naturalWidth) {
        context.drawImage(raster.seaWall, x, platform.y, platform.width, platform.height);
      } else {
        context.fillStyle = "#168da6";
        context.fillRect(x, platform.y, platform.width, platform.height);
      }
      return;
    }
    context.fillStyle = "#c9b786";
    context.fillRect(x, platform.y, platform.width, platform.height);
    const image = raster.waterTerrain;
    if (image.complete && image.naturalWidth) {
      const source = platform.kind === "sea-ground" ? [25, 260, 820, 220] : [15, 720, 825, 265];
      for (let tileX = Math.max(x, -100); tileX < Math.min(VIEW_WIDTH, x + platform.width); tileX += 100) {
        context.drawImage(image, source[0], source[1], source[2], source[3], tileX, platform.y, Math.min(100, x + platform.width - tileX), platform.height);
      }
    }
    return;
  }
  if (platform.kind === "castle-ground" || platform.kind === "castle-ledge" || platform.kind === "castle-wall") {
    const ground = platform.kind === "castle-ground";
    const wall = platform.kind === "castle-wall";
    context.fillStyle = wall ? "#332546" : ground ? "#463552" : "#41304e";
    context.fillRect(x, platform.y, platform.width, platform.height);
    for (let tileY = platform.y; tileY < platform.y + (wall ? platform.height : 1); tileY += 100) {
      for (let tileX = x; tileX < x + platform.width; tileX += 100) {
        drawCastleSprite(context, raster.castle, wall ? "wall" : ground ? "floor" : "ledge", tileX, tileY - (wall ? 0 : 8), Math.min(102, x + platform.width - tileX), wall ? Math.min(102, platform.y + platform.height - tileY) : ground ? 112 : 48);
      }
    }
    return;
  }
  if (platform.kind === "cloud-floor") {
    context.fillStyle = "rgba(178,164,232,.75)";
    context.fillRect(x + 14, platform.y + 19, Math.max(0, platform.width - 28), platform.height + 12);
    for (let tileX = x; tileX < x + platform.width; tileX += 150) {
      drawAtlasCell(context, raster.secret, 2, 2, 1, 1, tileX - 8, platform.y - 30, Math.min(172, x + platform.width - tileX + 18), 74);
    }
    return;
  }
  if (platform.kind === "cave-wall") {
    context.fillStyle = "#160e28";
    context.fillRect(x - 4, platform.y - 4, platform.width + 8, platform.height + 8);
    context.fillStyle = "#30204d";
    context.fillRect(x, platform.y, platform.width, platform.height);
    for (let tileY = platform.y; tileY < platform.y + platform.height; tileY += 96) {
      for (let tileX = x; tileX < x + platform.width; tileX += 112) {
        drawAtlasCell(
          context,
          raster.cave,
          4,
          2,
          2,
          0,
          tileX,
          tileY,
          Math.min(116, x + platform.width - tileX),
          Math.min(100, platform.y + platform.height - tileY),
          0.78,
        );
      }
    }
    context.fillStyle = "rgba(205,145,255,.35)";
    context.fillRect(x, platform.y, platform.width, 5);
    return;
  }
  if (platform.kind === "cave-ground") {
    context.fillStyle = "#211636";
    context.fillRect(x - 3, platform.y - 3, platform.width + 6, platform.height + 3);
    context.fillStyle = "#38265a";
    context.fillRect(x, platform.y, platform.width, platform.height);
    for (let tileX = x; tileX < x + platform.width; tileX += 112) {
      drawAtlasCell(context, raster.cave, 4, 2, 0, 0, tileX, platform.y - 5, Math.min(116, x + platform.width - tileX), platform.height + 12);
    }
    return;
  }
  if (platform.kind === "cave-ledge") {
    context.fillStyle = "#1b122e";
    context.fillRect(x - 3, platform.y - 3, platform.width + 6, platform.height + 7);
    for (let tileX = x; tileX < x + platform.width; tileX += 104) {
      drawAtlasCell(context, raster.cave, 4, 2, 1, 0, tileX, platform.y - 6, Math.min(108, x + platform.width - tileX), 55);
    }
    return;
  }
  if (platform.kind === "ship") {
    const shipBob = Math.round(Math.sin(frame * 0.075 + platform.x * 0.015) * 4);
    context.save();
    context.translate(0, shipBob);
    const mastX = x + Math.round(platform.width * 0.58);
    context.fillStyle = "#2a1a2e";
    context.fillRect(x + 7, platform.y - 5, platform.width - 14, 29);
    context.fillStyle = "#4a2b34";
    context.fillRect(mastX, platform.y - 118, 8, 125);
    context.fillStyle = "#8b5840";
    context.fillRect(mastX + 3, platform.y - 112, 3, 108);
    context.fillStyle = "#fff0c9";
    context.beginPath();
    context.moveTo(mastX + 8, platform.y - 108);
    context.lineTo(mastX + Math.min(92, platform.width * 0.28), platform.y - 66);
    context.lineTo(mastX + 8, platform.y - 28);
    context.closePath();
    context.fill();
    context.fillStyle = "#e4c995";
    context.fillRect(mastX + 12, platform.y - 68, Math.min(74, platform.width * 0.22), 5);
    context.fillStyle = "#b76bd0";
    context.fillRect(mastX + 13, platform.y - 82, Math.min(48, platform.width * 0.14), 9);
    const flagWave = Math.floor(frame / 12) % 2 === 0 ? 0 : 5;
    context.fillStyle = "#e95667";
    context.fillRect(mastX + 8, platform.y - 116, 34 + flagWave, 9);
    context.fillStyle = "#ffd45f";
    context.fillRect(mastX + 19, platform.y - 113, 8, 3);
    context.fillStyle = "#6f3e2e";
    context.fillRect(x + 8, platform.y, platform.width - 16, 18);
    context.fillStyle = "#d49a55";
    context.fillRect(x + 3, platform.y, platform.width - 6, 7);
    context.beginPath();
    context.moveTo(x + 18, platform.y + 18);
    context.lineTo(x + platform.width - 12, platform.y + 18);
    context.lineTo(x + platform.width - 58, platform.y + 72);
    context.lineTo(x + 68, platform.y + 72);
    context.closePath();
    context.fillStyle = "#7b4634";
    context.fill();
    context.fillStyle = "#3b2637";
    context.fillRect(x + 80, platform.y + 35, Math.max(28, platform.width - 160), 7);
    context.fillStyle = "#a86645";
    for (let plank = 30; plank < platform.width - 20; plank += 42) context.fillRect(x + plank, platform.y + 7, 4, 12);
    for (let porthole = 92; porthole < platform.width - 70; porthole += 62) {
      context.fillStyle = "#f6c75e";
      context.fillRect(x + porthole, platform.y + 27, 13, 13);
      context.fillStyle = "#74c5df";
      context.fillRect(x + porthole + 3, platform.y + 30, 7, 7);
    }
    context.fillStyle = "#fff1b1";
    context.fillRect(x + 35, platform.y + 31, 9, 5);
    context.fillStyle = "#563243";
    context.fillRect(x + 44, platform.y + 28, 6, 18);
    stampTileTexture(context, raster.tiles[world], 2, x + 12, platform.y + 18, platform.width - 24, 50, 0.2);
    context.restore();
    return;
  }
  if (platform.kind === "air-plank") {
    context.fillStyle = "#513143";
    context.fillRect(x, platform.y, platform.width, platform.height);
    context.fillStyle = "#d79855";
    context.fillRect(x + 4, platform.y + 3, platform.width - 8, 8);
    context.fillStyle = "#fff2d2";
    context.fillRect(x + 12, platform.y + platform.height, platform.width - 24, 8);
    context.fillRect(x + 28, platform.y + platform.height + 6, Math.max(24, platform.width - 56), 8);
    context.fillStyle = "#8a5a38";
    for (let board = 20; board < platform.width; board += 28) context.fillRect(x + board, platform.y + 3, 4, 11);
    stampTileTexture(context, raster.tiles[world], 3, x + 4, platform.y, platform.width - 8, platform.height, 0.19);
    return;
  }
  if (platform.kind === "spring") {
    if (drawAtlasCell(context, raster.spring, 2, 1, springCompressed ? 1 : 0, 0, x, platform.y, platform.width, platform.height)) return;
    context.fillStyle = "#3a2149";
    context.fillRect(x, platform.y, platform.width, platform.height);
    context.fillStyle = "#f7cc58";
    context.fillRect(x + 5, platform.y + 3, platform.width - 10, 6);
    context.fillStyle = "#c783e7";
    for (let mark = 12; mark < platform.width - 8; mark += 20) {
      context.fillRect(x + mark, platform.y + 10, 8, 8);
    }
    return;
  }
  if (platform.kind === "mist") {
    const distance = Math.abs(playerX - (platform.x + platform.width / 2));
    context.save();
    context.globalAlpha = distance < 330 ? 0.96 : 0.34;
    context.fillStyle = "#ede4ff";
    context.fillRect(x, platform.y + 7, platform.width, 15);
    context.fillRect(x + 18, platform.y, Math.max(35, platform.width * 0.35), 18);
    context.fillRect(x + platform.width * 0.52, platform.y + 2, Math.max(28, platform.width * 0.28), 17);
    context.fillStyle = "#b99ddd";
    context.fillRect(x + 8, platform.y + 16, platform.width - 16, 6);
    context.restore();
    stampTileTexture(context, raster.tiles[world], 1, x, platform.y, platform.width, platform.height + 7, 0.18);
    return;
  }
  if (platform.kind === "canopy") {
    context.fillStyle = "#2d2029";
    context.fillRect(x - 3, platform.y + 6, platform.width + 6, platform.height - 3);
    context.fillStyle = "#4b3028";
    context.fillRect(x, platform.y + 8, platform.width, platform.height - 8);
    context.fillStyle = "#bd8444";
    context.fillRect(x, platform.y + 8, platform.width, 7);
    context.fillStyle = "#5f8b49";
    context.fillRect(x + 5, platform.y, platform.width - 10, 11);
    for (let leaf = 12; leaf < platform.width - 8; leaf += 28) {
      context.fillStyle = leaf % 56 ? "#75a855" : "#486f42";
      context.fillRect(x + leaf, platform.y - 5, 18, 12);
      context.fillStyle = "#9bc45c";
      context.fillRect(x + leaf + 4, platform.y - 3, 7, 4);
    }
    stampTileTexture(context, raster.tiles[world], 2, x + 2, platform.y, platform.width - 4, platform.height, 0.22);
    stampWorldTile(context, raster.tiles[world], worldTiles.branch[0], worldTiles.branch[1], x + 2, platform.y - 4, platform.width - 4, platform.height + 8, 0.48);
    return;
  }
  if (platform.kind === "branch") {
    context.fillStyle = "#2d2029";
    context.fillRect(x - 3, platform.y - 3, platform.width + 6, platform.height + 6);
    context.fillStyle = "#5a382d";
    context.fillRect(x, platform.y, platform.width, platform.height);
    context.fillStyle = "#936044";
    context.fillRect(x, platform.y, platform.width, 8);
    context.fillStyle = "#d4955d";
    for (let mark = 18; mark < platform.width; mark += 46) context.fillRect(x + mark, platform.y + 10, 18, 4);
    context.fillStyle = "#7ab75c";
    for (let leaf = 27; leaf < platform.width - 12; leaf += 78) {
      context.fillRect(x + leaf, platform.y - 7, 13, 8);
      context.fillRect(x + leaf + 8, platform.y - 11, 10, 8);
    }
    stampTileTexture(context, raster.tiles[world], 3, x + 2, platform.y, platform.width - 4, platform.height, 0.2);
    stampWorldTile(context, raster.tiles[world], worldTiles.branch[0], worldTiles.branch[1], x + 2, platform.y - 6, platform.width - 4, platform.height + 10, 0.52);
    return;
  }
  if (platform.kind === "stone") {
    context.fillStyle = "#56546f";
    context.fillRect(x, platform.y, platform.width, platform.height);
    context.fillStyle = "#8b87a5";
    context.fillRect(x, platform.y, platform.width, 8);
    for (let mark = 8; mark < platform.width; mark += 38) {
      context.fillStyle = mark % 76 ? "#6d6a87" : "#49465f";
      context.fillRect(x + mark, platform.y + 11, 22, 6);
    }
    stampTileTexture(context, raster.tiles[world], 1, x + 2, platform.y, platform.width - 4, platform.height, 0.2);
    stampWorldTile(context, raster.tiles[world], worldTiles.top[0], worldTiles.top[1], x + 2, platform.y, platform.width - 4, platform.height, 0.46);
    return;
  }
  const earth = world === 1 ? "#9a5d3b" : world === 2 ? "#3c4c50" : world === 3 ? "#303846" : "#493d32";
  const top = world === 1 ? "#62b45b" : world === 2 ? "#618766" : world === 3 ? "#526c5b" : "#65834c";
  const texture = world === 1 ? "#c9834d" : world === 2 ? "#536a60" : world === 3 ? "#465363" : "#6a5940";
  context.fillStyle = "#291d2c";
  context.fillRect(x - 3, platform.y - 3, platform.width + 6, platform.height + 3);
  context.fillStyle = earth;
  context.fillRect(x, platform.y, platform.width, platform.height);
  context.fillStyle = top;
  context.fillRect(x, platform.y, platform.width, 14);
  context.fillStyle = world === 1 ? "#91d565" : "#88aa65";
  for (let grass = 4; grass < platform.width; grass += 22) context.fillRect(x + grass, platform.y - (grass % 44 === 0 ? 7 : 4), 5, 7);
  context.fillStyle = texture;
  for (let tile = 0; tile < platform.width; tile += 48) {
    context.fillRect(x + tile + 4, platform.y + 26, 31, 8);
    context.fillRect(x + tile + 18, platform.y + 48, 24, 7);
    context.fillStyle = forest ? "#2d3e39" : "#77442f";
    context.fillRect(x + tile + 38, platform.y + 17, 5, 5);
    context.fillStyle = texture;
  }
  stampTileTexture(context, raster.tiles[world], 0, x + 2, platform.y, platform.width - 4, platform.height, 0.19);
  stampWorldTile(context, raster.tiles[world], worldTiles.body[0], worldTiles.body[1], x + 2, platform.y + 12, platform.width - 4, Math.max(8, platform.height - 12), 0.7);
  stampWorldTile(context, raster.tiles[world], worldTiles.top[0], worldTiles.top[1], x + 2, platform.y - 3, platform.width - 4, Math.min(34, platform.height + 3), 0.88);
  stampPlatformTile(context, raster.platformTiles, world, x, platform.y, platform.width, platform.height);
}

export function drawApple(context: CanvasRenderingContext2D, x: number, y: number, collectibles?: HTMLImageElement) {
  if (collectibles && drawCollectibleSprite(context, collectibles, 0, 0, x - 6, y - 11, 46, 46)) return;
  context.fillStyle = "#382332";
  context.fillRect(x + 1, y + 3, 30, 25);
  context.fillRect(x - 3, y + 8, 38, 14);
  context.fillStyle = "#5a382d";
  context.fillRect(x + 14, y - 8, 5, 10);
  context.fillStyle = "#5eb454";
  context.fillRect(x + 18, y - 7, 10, 6);
  context.fillStyle = "#e94255";
  context.fillRect(x + 3, y + 2, 26, 24);
  context.fillRect(x, y + 7, 32, 14);
  context.fillStyle = "#ff7a78";
  context.fillRect(x + 6, y + 5, 6, 6);
  context.fillStyle = "#b52f45";
  context.fillRect(x + 7, y + 22, 18, 5);
}

export function drawCatPower(context: CanvasRenderingContext2D, x: number, y: number, collectibles?: HTMLImageElement) {
  if (collectibles && drawCollectibleSprite(context, collectibles, 1, 0, x - 6, y - 12, 52, 52)) return;
  context.fillStyle = "#2d1d39";
  context.fillRect(x, y + 2, 40, 36);
  context.fillRect(x + 1, y - 9, 16, 18);
  context.fillRect(x + 23, y - 9, 16, 18);
  context.fillStyle = "#4b295f";
  context.fillRect(x + 3, y + 4, 34, 31);
  context.fillRect(x + 4, y - 6, 12, 15);
  context.fillRect(x + 24, y - 6, 12, 15);
  context.fillStyle = "#bd83e5";
  context.fillRect(x + 7, y, 7, 7);
  context.fillRect(x + 26, y, 7, 7);
  context.fillStyle = "#fff3e4";
  context.fillRect(x + 10, y + 15, 5, 5);
  context.fillRect(x + 25, y + 15, 5, 5);
  context.fillStyle = "#ee9ccf";
  context.fillRect(x + 18, y + 23, 5, 4);
  context.fillStyle = "#f4d66f";
  context.fillRect(x + 16, y + 31, 9, 4);
}

export function drawSticker(context: CanvasRenderingContext2D, x: number, y: number, pulse: number, collectibles?: HTMLImageElement, stickerSheet?: HTMLImageElement, column = 0) {
  if (stickerSheet?.complete && stickerSheet.naturalWidth) {
    const cell = stickerSheet.naturalWidth / 3;
    context.drawImage(stickerSheet, column * cell, 0, cell, stickerSheet.naturalHeight, x - 6 - pulse, y - 6 - pulse, 50 + pulse * 2, 50 + pulse * 2);
    return;
  }
  if (collectibles && drawCollectibleSprite(context, collectibles, 2, 0, x - 5 - pulse, y - 5 - pulse, 48 + pulse * 2, 48 + pulse * 2)) return;
  context.fillStyle = "#4b295f";
  context.fillRect(x + 5, y, 28, 38);
  context.fillRect(x, y + 5, 38, 28);
  context.fillStyle = pulse > 0 ? "#ffe875" : "#f5c957";
  context.fillRect(x + 8, y + 4, 22, 30);
  context.fillRect(x + 4, y + 8, 30, 22);
  context.fillStyle = "#b468d1";
  context.fillRect(x + 15, y + 7, 8, 24);
  context.fillRect(x + 8, y + 14, 22, 9);
  context.fillStyle = "#fff8d6";
  context.fillRect(x + 17, y + 11, 4, 16);
  context.fillRect(x + 12, y + 16, 14, 4);
}

export function drawRewardBlock(context: CanvasRenderingContext2D, x: number, y: number, hit: boolean, collectibles?: HTMLImageElement) {
  if (collectibles && drawCollectibleSprite(context, collectibles, hit ? 3 : 2, 1, x - 4, y - 4, 56, 56)) return;
  context.fillStyle = "#2c1d38";
  context.fillRect(x - 3, y - 3, 54, 54);
  context.fillStyle = hit ? "#746b7c" : "#5a2e70";
  context.fillRect(x, y, 48, 48);
  context.fillStyle = hit ? "#958c9d" : "#c787e8";
  context.fillRect(x + 5, y + 5, 38, 38);
  context.fillStyle = hit ? "#5e5765" : "#fff0a0";
  context.fillRect(x + 18, y + 12, 12, 12);
  context.fillRect(x + 8, y + 13, 7, 8);
  context.fillRect(x + 33, y + 13, 7, 8);
  context.fillRect(x + 12, y + 27, 24, 11);
  context.fillStyle = hit ? "#bbb2c0" : "#edc6fb";
  context.fillRect(x + 4, y + 4, 8, 5);
}

export function drawSecretBlock(context: CanvasRenderingContext2D, x: number, y: number, hit: boolean, secret: HTMLImageElement) {
  if (!hit && drawAtlasCell(context, secret, 2, 2, 1, 0, x - 5, y - 5, 60, 60)) return;
  context.fillStyle = hit ? "#b8acc2" : "#f4c548";
  context.fillRect(x, y, 48, 48);
}

export function drawSecretVine(context: CanvasRenderingContext2D, x: number, blockY: number, progress: number, secret: HTMLImageElement) {
  const height = Math.max(1, Math.round((blockY + 80) * progress));
  context.save();
  context.beginPath();
  context.rect(x - 28, blockY - height, 104, height + 10);
  context.clip();
  for (let y = blockY - 115; y > blockY - height - 115; y -= 105) {
    drawAtlasCell(context, secret, 2, 2, 0, 1, x - 27, y, 104, 128);
  }
  context.restore();
}

function drawEnemyWarning(context: CanvasRenderingContext2D, x: number, y: number, kind: "wolf" | "boar") {
  context.fillStyle = kind === "boar" ? "#fff0bd" : "#fff3c4";
  context.fillRect(x - (kind === "boar" ? 5 : 9), y - 35, kind === "boar" ? 72 : 77, 24);
  context.fillStyle = kind === "boar" ? "#4a2b2e" : "#3c294a";
  context.font = "bold 12px monospace";
  context.textAlign = "center";
  context.fillText(kind === "boar" ? "¡OINK!" : "¡AUUU!", x + 30, y - 19);
  context.textAlign = "start";
}

export function drawEnemy(context: CanvasRenderingContext2D, enemy: LiveEnemy, cameraX: number, nearby: boolean, raster: RasterAssets) {
  if (!enemy.active) return;
  const x = Math.round(enemy.x - cameraX);
  const y = Math.round(enemyY(enemy));
  if (enemy.kind === "fish" || enemy.kind === "urchin") {
    context.save();
    if (enemy.vx < 0) {
      context.translate(x + enemy.width, 0);
      context.scale(-1, 1);
    } else context.translate(x, 0);
    drawAtlasCell(context, raster.waterEnemies, 2, 1, enemy.kind === "fish" ? 0 : 1, 0, -8, y - 8, enemy.width + 16, enemy.height + 12);
    context.restore();
    return;
  }
  if (enemy.kind === "baby-t-rex" || enemy.kind === "pterodactyl") {
    const column = enemy.kind === "baby-t-rex" ? 0 : 1;
    const width = enemy.kind === "baby-t-rex" ? 66 : 78;
    const height = enemy.kind === "baby-t-rex" ? 62 : 54;
    const drawX = x + Math.round((enemy.width - width) / 2);
    const drawY = y + enemy.height - height;
    context.save();
    if (enemy.vx < 0) {
      context.translate(drawX + width, 0);
      context.scale(-1, 1);
      drawAtlasCell(context, raster.dinosaurEnemies, 2, 1, column, 0, 0, drawY, width, height);
    } else {
      drawAtlasCell(context, raster.dinosaurEnemies, 2, 1, column, 0, drawX, drawY, width, height);
    }
    context.restore();
    return;
  }
  if (enemy.kind === "skeleton" || enemy.kind === "zombie" || enemy.kind === "ghost") {
    const column = enemy.kind === "skeleton" ? 0 : enemy.kind === "zombie" ? 1 : 2;
    const width = enemy.kind === "ghost" ? 60 : 54;
    const height = enemy.kind === "ghost" ? 56 : 62;
    const drawX = x + (enemy.width - width) / 2;
    const drawY = y + enemy.height - height;
    if (raster.castleEnemies.complete && raster.castleEnemies.naturalWidth) {
      context.save();
      if (enemy.vx < 0) {
        context.translate(drawX + width, 0);
        context.scale(-1, 1);
        drawAtlasCell(context, raster.castleEnemies, 3, 1, column, 0, 0, drawY, width, height);
      } else {
        drawAtlasCell(context, raster.castleEnemies, 3, 1, column, 0, drawX, drawY, width, height);
      }
      context.restore();
    } else {
      context.fillStyle = enemy.kind === "skeleton" ? "#f1e8d7" : enemy.kind === "zombie" ? "#9acb90" : "#c8b0e9";
      context.fillRect(drawX + 4, drawY + 4, width - 8, height - 8);
    }
    return;
  }
  if (enemy.kind === "sky-unicorn") {
    const width = 76;
    const height = 64;
    const drawX = x + Math.round((enemy.width - width) / 2);
    const drawY = y + enemy.height - height;
    context.save();
    if (enemy.vx < 0) {
      context.translate(drawX + width, 0);
      context.scale(-1, 1);
      drawAtlasCell(context, raster.secret, 2, 2, 0, 0, 0, drawY, width, height);
    } else {
      drawAtlasCell(context, raster.secret, 2, 2, 0, 0, drawX, drawY, width, height);
    }
    context.restore();
    return;
  }
  if (enemy.kind === "bat") {
    const wingFrame = Math.floor(enemy.phase * 3.2) % 2;
    const width = 62;
    const height = 50;
    const drawX = x + Math.round((enemy.width - width) / 2);
    const drawY = y + enemy.height - height;
    if (raster.cave.complete && raster.cave.naturalWidth) {
      context.save();
      if (enemy.vx < 0) {
        context.translate(drawX + width, 0);
        context.scale(-1, 1);
        drawAtlasCell(context, raster.cave, 4, 2, wingFrame, 1, 0, drawY, width, height);
      } else {
        drawAtlasCell(context, raster.cave, 4, 2, wingFrame, 1, drawX, drawY, width, height);
      }
      context.restore();
    } else {
      context.fillStyle = "#2a193f";
      context.fillRect(x + 12, y + 9, 24, 22);
      context.fillStyle = "#a65ad0";
      context.fillRect(x, y + (wingFrame ? 15 : 4), 16, 12);
      context.fillRect(x + 32, y + (wingFrame ? 15 : 4), 16, 12);
      context.fillStyle = "#ffd66b";
      context.fillRect(x + 18, y + 15, 4, 4);
      context.fillRect(x + 27, y + 15, 4, 4);
    }
    return;
  }
  if ((enemy.kind === "boar" || enemy.kind === "bird") && (enemy.kind === "boar" ? raster.boar : raster.bird).complete && (enemy.kind === "boar" ? raster.boar : raster.bird).naturalWidth) {
    if (nearby && enemy.kind === "boar") drawEnemyWarning(context, x, y, "boar");
    const sprite = enemy.kind === "boar" ? raster.boar : raster.bird;
    const [width, height] = enemyRasterSize[enemy.kind];
    const flyingOffset = enemy.kind === "bird" ? Math.round(Math.sin(enemy.phase * 4) * 3) : 0;
    const drawX = x + Math.round((enemy.width - width) / 2);
    const drawY = y + enemy.height - height + flyingOffset;
    context.save();
    if (enemy.vx < 0) {
      context.translate(drawX + width, 0);
      context.scale(-1, 1);
      context.drawImage(sprite, 0, 0, sprite.naturalWidth, sprite.naturalHeight, 0, drawY, width, height);
    } else {
      context.drawImage(sprite, drawX, drawY, width, height);
    }
    context.restore();
    return;
  }
  if (raster.enemies.complete && raster.enemies.naturalWidth) {
    if (nearby && (enemy.kind === "wolf" || enemy.kind === "boar")) drawEnemyWarning(context, x, y, enemy.kind);
    const [column, row] = enemyAtlasCell[enemy.kind];
    const [width, height] = enemyRasterSize[enemy.kind];
    const flyingOffset = enemy.kind === "bird" || enemy.kind === "parrot" ? Math.round(Math.sin(enemy.phase * 4) * 3) : 0;
    const drawX = x + Math.round((enemy.width - width) / 2);
    const drawY = y + enemy.height - height + flyingOffset;
    context.save();
    if (enemy.vx < 0) {
      context.translate(drawX + width, 0);
      context.scale(-1, 1);
      drawEnemyAtlasSprite(context, raster.enemies, column, row, 0, drawY, width, height);
    } else {
      drawEnemyAtlasSprite(context, raster.enemies, column, row, drawX, drawY, width, height);
    }
    context.restore();
    return;
  }
  const flying = enemy.kind === "bird" || enemy.kind === "parrot" || enemy.kind === "cloud";
  if (!flying) {
    context.save();
    context.globalAlpha = 0.18;
    context.fillStyle = "#21162b";
    context.fillRect(x + 5, y + enemy.height - 2, Math.max(30, enemy.width - 10), 6);
    context.restore();
  }
  if (enemy.kind === "slime") {
    context.fillStyle = "#243548";
    context.fillRect(x + 1, y + 8, 40, 31);
    context.fillRect(x + 7, y - 1, 28, 11);
    context.fillStyle = "#77cbe0";
    context.fillRect(x + 4, y + 8, 34, 28);
    context.fillRect(x + 10, y + 2, 22, 8);
    context.fillStyle = "#24445d";
    context.fillRect(x + 11, y + 14, 5, 7);
    context.fillRect(x + 27, y + 14, 5, 7);
    context.fillStyle = "#a7e7ef";
    context.fillRect(x + 8, y + 7, 8, 5);
    context.fillStyle = "#4d9db8";
    context.fillRect(x + 10, y + 31, 23, 5);
    context.fillStyle = "#24445d";
    context.fillRect(x + 18, y + 25, 8, 3);
  } else if (enemy.kind === "beetle") {
    context.fillStyle = "#251c36";
    context.fillRect(x + 1, y + 8, 40, 28);
    context.fillRect(x + 8, y + 2, 28, 8);
    context.fillStyle = "#3b2c58";
    context.fillRect(x + 4, y + 11, 34, 22);
    context.fillStyle = "#f3a557";
    context.fillRect(x + 9, y + 7, 12, 20);
    context.fillRect(x + 22, y + 7, 12, 20);
    context.fillStyle = "#fff5da";
    context.fillRect(x + 8, y + 12, 4, 5);
    context.fillRect(x + 31, y + 12, 4, 5);
    context.fillStyle = "#3b2c58";
    context.fillRect(x, y + 30, 12, 5);
    context.fillRect(x + 31, y + 30, 12, 5);
    context.fillRect(x + 12, y, 4, 9);
    context.fillRect(x + 29, y, 4, 9);
    context.fillStyle = "#ffd17a";
    context.fillRect(x + 13, y + 10, 5, 11);
  } else if (enemy.kind === "cloud") {
    context.fillStyle = "#4c3d6c";
    context.fillRect(x - 2, y + 10, 48, 27);
    context.fillRect(x + 7, y + 1, 30, 31);
    context.fillStyle = "#ece8ff";
    context.fillRect(x + 2, y + 12, 40, 22);
    context.fillRect(x + 10, y + 4, 24, 25);
    context.fillStyle = "#4c3d6c";
    context.fillRect(x + 12, y + 18, 5, 5);
    context.fillRect(x + 29, y + 18, 5, 5);
    context.fillRect(x + 19, y + 27, 9, 3);
    context.fillStyle = "#d9a7c9";
    context.fillRect(x + 6, y + 25, 6, 4);
    context.fillRect(x + 34, y + 25, 6, 4);
  } else if (enemy.kind === "bird") {
    const flapUp = Math.sin(enemy.phase * 2) > 0;
    context.fillStyle = "#21172c";
    context.fillRect(x + 8, y + 7, 34, 23);
    context.fillRect(x + 26, y + 2, 18, 21);
    context.fillStyle = "#3b2948";
    context.fillRect(x + 11, y + 10, 26, 17);
    context.fillRect(x + 28, y + 5, 13, 15);
    context.fillStyle = "#c96f50";
    context.fillRect(x + 15, y + 17, 18, 10);
    context.fillStyle = "#f2c15d";
    context.fillRect(x + 39, y + 11, 7, 5);
    context.fillStyle = "#fff7d6";
    context.fillRect(x + 34, y + 9, 3, 3);
    context.fillStyle = "#24192f";
    context.fillRect(x + 35, y + 9, 2, 2);
    context.fillRect(x + 3, y + 13, 12, 5);
    context.fillRect(x, y + 9, 8, 5);
    context.fillStyle = "#6f456f";
    if (flapUp) {
      context.fillRect(x + 13, y, 9, 14);
      context.fillRect(x + 20, y + 5, 9, 12);
    } else {
      context.fillRect(x + 13, y + 21, 9, 10);
      context.fillRect(x + 20, y + 18, 9, 10);
    }
  } else if (enemy.kind === "parrot") {
    const flapUp = Math.sin(enemy.phase * 2.3) > 0;
    context.fillStyle = "#221832";
    context.fillRect(x + 9, y + 5, 33, 27);
    context.fillRect(x + 18, y + 1, 24, 22);
    context.fillStyle = "#2d3156";
    context.fillRect(x + 12, y + 8, 26, 20);
    context.fillStyle = "#e65362";
    context.fillRect(x + 20, y + 4, 18, 18);
    context.fillStyle = "#ffd45f";
    context.fillRect(x + 36, y + 10, 10, 6);
    context.fillRect(x + 16, y + 22, 16, 7);
    context.fillStyle = "#fff8e9";
    context.fillRect(x + 29, y + 8, 4, 4);
    context.fillStyle = "#251b39";
    context.fillRect(x + 31, y + 9, 2, 2);
    context.fillStyle = "#55b66c";
    if (flapUp) {
      context.fillRect(x + 6, y, 10, 20);
      context.fillRect(x, y + 2, 9, 12);
    } else {
      context.fillRect(x + 6, y + 18, 12, 12);
      context.fillRect(x + 1, y + 24, 9, 8);
    }
    context.fillStyle = "#58bdda";
    context.fillRect(x + 8, y + 25, 8, 7);
    context.fillStyle = "#2d3156";
    context.fillRect(x + 5, y + 30, 5, 13);
    context.fillRect(x + 12, y + 30, 5, 16);
  } else if (enemy.kind === "pirate") {
    context.fillStyle = "#281b33";
    context.fillRect(x + 2, y + 1, 42, 14);
    context.fillRect(x + 8, y + 10, 32, 38);
    context.fillStyle = "#4a294f";
    context.fillRect(x + 5, y + 4, 36, 10);
    context.fillRect(x + 12, y, 23, 8);
    context.fillStyle = "#f3b07e";
    context.fillRect(x + 12, y + 12, 24, 18);
    context.fillStyle = "#2b203a";
    context.fillRect(x + 14, y + 16, 8, 5);
    context.fillRect(x + 18, y + 14, 4, 9);
    context.fillStyle = "#fff3d4";
    context.fillRect(x + 29, y + 17, 4, 4);
    context.fillStyle = "#d9575e";
    context.fillRect(x + 8, y + 29, 30, 16);
    context.fillStyle = "#f6cb58";
    context.fillRect(x + 8, y + 34, 30, 5);
    context.fillStyle = "#382743";
    context.fillRect(x + 6, y + 44, 14, 6);
    context.fillRect(x + 27, y + 44, 14, 6);
    context.fillStyle = "#f3b07e";
    context.fillRect(x, y + 30, 9, 12);
    context.fillRect(x + 38, y + 30, 8, 12);
    context.fillStyle = "#d9575e";
    context.fillRect(x + 1, y + 7, 13, 6);
    context.fillStyle = "#d7d0dc";
    context.fillRect(x + 42, y + 35, 7, 4);
    context.fillRect(x + 47, y + 31, 4, 8);
  } else if (enemy.kind === "boar") {
    if (nearby) {
      context.fillStyle = "#fff0bd";
      context.fillRect(x - 5, y - 34, 72, 23);
      context.fillStyle = "#4a2b2e";
      context.font = "bold 12px monospace";
      context.textAlign = "center";
      context.fillText("¡OINK!", x + 30, y - 18);
      context.textAlign = "start";
    }
    context.fillStyle = "#2d1d24";
    context.fillRect(x + 2, y + 8, 57, 33);
    context.fillRect(x + 12, y, 42, 31);
    context.fillStyle = "#4b2f2b";
    context.fillRect(x + 5, y + 11, 50, 27);
    context.fillRect(x + 15, y + 3, 35, 27);
    context.fillRect(x + 10, y - 2, 12, 13);
    context.fillRect(x + 43, y - 2, 12, 13);
    context.fillStyle = "#986047";
    context.fillRect(x + 19, y + 15, 29, 17);
    context.fillStyle = "#e58c79";
    context.fillRect(x + 24, y + 21, 19, 10);
    context.fillStyle = "#2d1d24";
    context.fillRect(x + 28, y + 24, 4, 4);
    context.fillRect(x + 37, y + 24, 4, 4);
    context.fillRect(x + 20, y + 11, 5, 5);
    context.fillRect(x + 43, y + 11, 5, 5);
    context.fillStyle = "#fff2cf";
    context.fillRect(x + 18, y + 27, 6, 8);
    context.fillRect(x + 44, y + 27, 6, 8);
    context.fillStyle = "#2d1d24";
    context.fillRect(x, y + 36, 18, 6);
    context.fillRect(x + 44, y + 36, 18, 6);
  } else {
    if (nearby) {
      context.fillStyle = "#fff3c4";
      context.fillRect(x - 9, y - 35, 77, 24);
      context.fillStyle = "#3c294a";
      context.font = "bold 12px monospace";
      context.textAlign = "center";
      context.fillText("¡AUUU!", x + 29, y - 19);
      context.textAlign = "start";
    }
    context.fillStyle = "#201a2b";
    context.fillRect(x + 2, y + 8, 53, 32);
    context.fillRect(x + 9, y, 38, 31);
    context.fillStyle = "#312c42";
    context.fillRect(x + 5, y + 11, 47, 26);
    context.fillRect(x + 12, y + 3, 32, 26);
    context.fillRect(x + 8, y - 3, 12, 14);
    context.fillRect(x + 37, y - 3, 12, 14);
    context.fillStyle = "#655d72";
    context.fillRect(x + 15, y + 8, 27, 18);
    context.fillStyle = "#f4cb68";
    context.fillRect(x + 19, y + 13, 5, 5);
    context.fillRect(x + 34, y + 13, 5, 5);
    context.fillStyle = "#201a2b";
    context.fillRect(x + 26, y + 22, 7, 6);
    context.fillRect(x, y + 34, 16, 6);
    context.fillRect(x + 42, y + 34, 16, 6);
  }
}

export function drawDeadlyWater(context: CanvasRenderingContext2D, zone: NonNullable<Level["deadlyWater"]>[number], cameraX: number, frame: number, raster: RasterAssets) {
  const x = Math.round(zone.x - cameraX);
  if (x + zone.width < 0 || x > VIEW_WIDTH) return;
  const surfaceY = zone.y + 8;
  context.save();
  context.beginPath();
  context.rect(x, surfaceY, zone.width, zone.height - 8);
  context.clip();
  context.fillStyle = "#087b91";
  context.fillRect(x, surfaceY, zone.width, zone.height - 8);
  for (let tileX = x; tileX < x + zone.width; tileX += 105) {
    drawAtlasCell(context, raster.dinosaurTerrain, 2, 2, 1, 1, tileX, zone.y - 13 + Math.sin(frame / 13 + tileX / 40) * 2, Math.min(110, x + zone.width - tileX), 112);
  }
  context.restore();
}

export function drawWaterJumper(context: CanvasRenderingContext2D, jumper: LiveWaterJumper, cameraX: number, sprite: HTMLImageElement) {
  const state = waterJumperState(jumper);
  if (!state.active) return;
  const x = Math.round(jumper.x - cameraX);
  if (x + jumper.width < 0 || x > VIEW_WIDTH) return;
  const y = Math.round(state.y);
  context.save();
  context.translate(x + jumper.width / 2, y + jumper.height / 2);
  context.rotate((0.5 - state.progress) * 0.55);
  if (sprite.complete && sprite.naturalWidth) {
    context.drawImage(sprite, -jumper.width / 2 - 9, -jumper.height / 2 - 9, jumper.width + 18, jumper.height + 18);
  } else {
    context.fillStyle = "#1eb7bc";
    context.fillRect(-jumper.width / 2, -jumper.height / 2, jumper.width, jumper.height);
  }
  context.restore();
}

export function drawCannon(context: CanvasRenderingContext2D, cannon: LiveCannon, cameraX: number, sprite?: HTMLImageElement) {
  const x = Math.round(cannon.x - cameraX);
  if (sprite?.complete && sprite.naturalWidth) {
    context.save();
    if (cannon.direction === -1) {
      context.translate(x + 19, 0);
      context.scale(-1, 1);
      context.translate(-(x + 19), 0);
    }
    context.drawImage(sprite, x - 22, cannon.y - 20, 88, 61);
    context.restore();
    if (cannon.cooldown > cannon.interval - 0.18) {
      const smokeX = cannon.direction === -1 ? x - 31 : x + 52;
      context.fillStyle = "rgba(245,240,255,.8)";
      context.fillRect(smokeX, cannon.y - 2, 10, 10);
      context.fillRect(smokeX + cannon.direction * 8, cannon.y - 12, 8, 8);
    }
    return;
  }
  const barrelX = cannon.direction === -1 ? x - 13 : x + 22;
  context.fillStyle = "#171421";
  context.fillRect(barrelX - 3, cannon.y, 34, 19);
  context.fillRect(x - 3, cannon.y + 5, 41, 31);
  context.fillStyle = "#2c2638";
  context.fillRect(barrelX, cannon.y + 3, 28, 13);
  context.fillStyle = "#51435c";
  context.fillRect(x, cannon.y + 8, 35, 24);
  context.fillStyle = "#d0934f";
  context.fillRect(x + 3, cannon.y + 25, 12, 12);
  context.fillRect(x + 22, cannon.y + 25, 12, 12);
  context.fillStyle = "#704b37";
  context.fillRect(x + 7, cannon.y + 28, 4, 7);
  context.fillRect(x + 26, cannon.y + 28, 4, 7);
  context.fillStyle = "#171421";
  context.fillRect(cannon.direction === -1 ? barrelX : barrelX + 21, cannon.y + 5, 7, 9);
  context.fillStyle = "#8d7e9b";
  context.fillRect(x + 6, cannon.y + 12, 16, 4);
  if (cannon.cooldown > cannon.interval - 0.18) {
    const smokeX = cannon.direction === -1 ? barrelX - 13 : barrelX + 31;
    context.fillStyle = "rgba(245,240,255,.8)";
    context.fillRect(smokeX, cannon.y - 2, 10, 10);
    context.fillRect(smokeX + cannon.direction * 8, cannon.y - 12, 8, 8);
  }
}

export function drawCannonball(context: CanvasRenderingContext2D, ball: Cannonball, cameraX: number, sprite?: HTMLImageElement) {
  if (!ball.active) return;
  const x = Math.round(ball.x - cameraX);
  const y = Math.round(ball.y);
  if (sprite?.complete && sprite.naturalWidth) {
    context.drawImage(sprite, x - 8, y - 8, 40, 40);
    return;
  }
  context.fillStyle = "#171421";
  context.fillRect(x, y, 24, 24);
  context.fillRect(x - 4, y + 6, 32, 12);
  context.fillStyle = "#81758e";
  context.fillRect(x + 5, y + 4, 7, 6);
  context.fillStyle = "#ffd76a";
  context.fillRect(ball.vx < 0 ? x + 25 : x - 8, y + 8, 8, 8);
}

export function drawCheckpoint(context: CanvasRenderingContext2D, worldX: number, cameraX: number, active: boolean, sprite?: HTMLImageElement) {
  const x = Math.round(worldX - cameraX);
  if (sprite?.complete && sprite.naturalWidth) {
    context.save();
    context.globalAlpha = active ? 1 : 0.58;
    context.drawImage(sprite, x - 28, 340, 86, 116);
    context.restore();
    if (active) drawTinySparkle(context, x + 43, 349, "#fff2a0");
    return;
  }
  context.fillStyle = "#f2e4cf";
  context.fillRect(x, 365, 7, 91);
  context.fillStyle = active ? "#bd83e5" : "#b7afaa";
  context.fillRect(x + 7, 370, 48, 30);
  context.fillStyle = active ? "#fff4a5" : "#ded6d1";
  context.fillRect(x + 19, 379, 10, 10);
  if (active) {
    drawTinySparkle(context, x + 49, 359, "#fff2a0");
    context.fillStyle = "#7cc36b";
    context.fillRect(x - 5, 450, 17, 6);
  }
}

export function drawCaveEntrance(context: CanvasRenderingContext2D, worldX: number, cameraX: number, cave: HTMLImageElement) {
  const x = Math.round(worldX - cameraX);
  if (x < -190 || x > VIEW_WIDTH + 40) return;
  if (!drawAtlasCell(context, cave, 4, 2, 2, 1, x, 286, 178, 174)) {
    context.fillStyle = "#2a1b40";
    context.fillRect(x, 320, 178, 136);
    context.fillStyle = "#0d0917";
    context.fillRect(x + 42, 350, 94, 106);
  }
}

export function drawGoalCat(context: CanvasRenderingContext2D, worldX: number, cameraX: number, finalLevel: boolean, collectibles?: HTMLImageElement, rescueProgress = 0, surfaceY = 456, flagSprite?: HTMLImageElement, rescueSprite?: HTMLImageElement) {
  const x = Math.round(worldX - cameraX);
  const rescued = rescueProgress > 0;
  const catBob = rescued ? Math.round(Math.sin(rescueProgress * 18) * 5) : 0;
  if (rescueSprite?.complete && rescueSprite.naturalWidth) {
    context.drawImage(rescueSprite, x - 28, surfaceY - 294 + catBob, 280, 302);
  } else if (flagSprite?.complete && flagSprite.naturalWidth) {
    context.drawImage(flagSprite, x + 35, surfaceY - 232, 174, 205);
  } else {
  context.fillStyle = "#4a2d46";
  context.fillRect(x + 69, surfaceY - 220, 10, 220);
  context.fillStyle = "#f4db93";
  context.fillRect(x + 72, surfaceY - 215, 4, 207);
  context.fillStyle = "#7b4f94";
  context.fillRect(x + 79, surfaceY - 210, 82, 51);
  context.fillStyle = "#d99df0";
  context.fillRect(x + 84, surfaceY - 205, 72, 41);
  context.fillStyle = "#fff3ad";
  context.fillRect(x + 98, surfaceY - 192, 12, 12);
  context.fillRect(x + 124, surfaceY - 192, 12, 12);
  context.fillStyle = "#6ab86a";
  context.fillRect(x + 59, surfaceY - 6, 31, 6);
  context.fillRect(x + 65, surfaceY - 12, 18, 6);
  }
  const catX = x + 18;
  const catY = surfaceY - 58 + catBob;
  if (!rescueSprite?.complete || !rescueSprite.naturalWidth) {
    if (collectibles) drawCollectibleSprite(context, collectibles, 3, 0, catX - 8, catY - 15, 64, 64);
    else {
  context.fillStyle = "#352841";
  context.fillRect(catX + 1, catY + 5, 48, 48);
  context.fillRect(catX + 2, catY - 3, 18, 21);
  context.fillRect(catX + 30, catY - 3, 18, 21);
  context.fillStyle = finalLevel ? "#f5d58d" : "#f5f0e9";
  context.fillRect(catX + 4, catY + 8, 42, 42);
  context.fillRect(catX + 5, catY, 14, 18);
  context.fillRect(catX + 31, catY, 14, 18);
  context.fillStyle = "#4b3958";
  context.fillRect(catX + 13, catY + 20, 5, 6);
  context.fillRect(catX + 33, catY + 20, 5, 6);
  context.fillStyle = "#df79a9";
  context.fillRect(catX + 23, catY + 29, 6, 5);
    }
  }
  if (!rescued) return;
  const sparkleSize = 7 + Math.round(Math.min(1, rescueProgress) * 7);
  drawTinySparkle(context, x + 12, surfaceY - 94 - sparkleSize, "#fff0a1");
  drawTinySparkle(context, x + 116, surfaceY - 84 + sparkleSize, "#f2b9ff");
  drawTinySparkle(context, x + 151, surfaceY - 118, "#fff0a1");
  context.save();
  context.globalAlpha = Math.min(1, rescueProgress * 2.4);
  const panelX = Math.round(VIEW_WIDTH / 2 - 195);
  context.fillStyle = "rgba(42, 25, 58, .88)";
  context.fillRect(panelX - 5, 55, 400, 74);
  context.fillStyle = "#fff8e9";
  context.fillRect(panelX, 60, 390, 64);
  context.fillStyle = "#f1d7f7";
  context.fillRect(panelX + 6, 66, 378, 52);
  context.fillStyle = "#6d3e82";
  context.font = "bold 21px monospace";
  context.textAlign = "center";
  context.fillText("¡GATITO RESCATADO!", VIEW_WIDTH / 2, 91);
  context.fillStyle = "#473052";
  context.font = "bold 13px monospace";
  context.fillText("NOA HA ENCONTRADO UN AMIGO", VIEW_WIDTH / 2, 111);
  context.textAlign = "start";
  context.restore();
}

export function drawBossGate(context: CanvasRenderingContext2D, worldX: number, cameraX: number, surfaceY = 456, gateSprite?: HTMLImageElement) {
  const x = Math.round(worldX - cameraX);
  if (gateSprite?.complete && gateSprite.naturalWidth) {
    context.drawImage(gateSprite, x - 52, surfaceY - 244, 236, 250);
    return;
  }
  context.fillStyle = "#24162f";
  context.fillRect(x + 10, 326, 112, 130);
  context.fillStyle = "#6d477e";
  context.fillRect(x, 326, 18, 130);
  context.fillRect(x + 114, 326, 18, 130);
  context.fillRect(x, 314, 132, 22);
  context.fillStyle = "#c78bea";
  context.fillRect(x + 16, 302, 100, 30);
  context.fillStyle = "#fff1a3";
  context.font = "bold 15px monospace";
  context.textAlign = "center";
  context.fillText("DUELO", x + 66, 323);
  context.fillStyle = "#fff3d2";
  context.fillRect(x + 40, 362, 18, 18);
  context.fillRect(x + 73, 362, 18, 18);
  context.fillStyle = "#d85e73";
  context.fillRect(x + 56, 397, 20, 12);
  context.fillStyle = "#b783d3";
  for (let brick = 0; brick < 4; brick += 1) {
    context.fillRect(x + 3, 340 + brick * 25, 12, 8);
    context.fillRect(x + 117, 350 + brick * 23, 12, 8);
  }
  drawTinySparkle(context, x + 60, 344, "#fff0a1");
  context.textAlign = "start";
}
