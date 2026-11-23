export const mechanicSpriteSheets = {
  secretShopDoor: { source: "./assets/sprites/secret-shop-door-v1.webp", columns: 3, frameWidth: 64, frameHeight: 80 },
  starAura: { source: "./assets/sprites/secret-star-aura-v1.webp", columns: 3, frameWidth: 128, frameHeight: 128 },
  castleHound: { source: "./assets/sprites/castle-hound-v1.webp", columns: 4, frameWidth: 128, frameHeight: 112 },
  castleChainLink: { source: "./assets/sprites/castle-chain-link-v1.webp", columns: 1, frameWidth: 32, frameHeight: 20 },
  castleChainPost: { source: "./assets/sprites/castle-chain-post-v1.webp", columns: 1, frameWidth: 64, frameHeight: 80 },
  flyingDragon: { source: "./assets/sprites/enemy-flying-dragon-v1.webp", columns: 4, frameWidth: 128, frameHeight: 112 },
  sleepingWolf: { source: "./assets/sprites/mechanic-wolf-v1.webp", columns: 3, frameWidth: 128, frameHeight: 96 },
  bloomFlower: { source: "./assets/sprites/bloom-flower-v1.webp", columns: 4, frameWidth: 96, frameHeight: 128 },
  bloomBridge: { source: "./assets/sprites/bloom-bridge-v1.webp", columns: 2, frameWidth: 64, frameHeight: 32 },
  updraft: { source: "./assets/sprites/updraft-v1.webp", columns: 2, frameWidth: 64, frameHeight: 96 },
  windGust: { source: "./assets/sprites/wind-gust-v1.webp", columns: 2, frameWidth: 96, frameHeight: 64 },
  lavaJet: { source: "./assets/sprites/lava-jet-v1.webp", columns: 4, frameWidth: 64, frameHeight: 192 },
  lavaSurface: { source: "./assets/sprites/lava-surface-v1.webp", columns: 2, frameWidth: 128, frameHeight: 64 },
  waterSurface: { source: "./assets/sprites/water-surface-v1.webp", columns: 4, frameWidth: 128, frameHeight: 64 },
  waterEntrance: { source: "./assets/sprites/water-entrance-v1.webp", columns: 2, frameWidth: 160, frameHeight: 128 },
  flyingShip: { source: "./assets/sprites/flying-ship-v1.webp", columns: 2, frameWidth: 320, frameHeight: 224 },
  airPlank: { source: "./assets/sprites/air-plank-v1.webp", columns: 1, frameWidth: 128, frameHeight: 48 },
  giftSpring: { source: "./assets/sprites/gift-spring-v1.webp", columns: 4, frameWidth: 192, frameHeight: 144 },
  mistPlatform: { source: "./assets/sprites/mist-platform-v1.webp", columns: 1, frameWidth: 128, frameHeight: 48 },
} as const;

export type MechanicSprite = keyof typeof mechanicSpriteSheets;

export function drawMechanicSprite(
  context: CanvasRenderingContext2D, image: HTMLImageElement, name: MechanicSprite, frame: number,
  x: number, y: number, width: number, height: number, sourceFraction = 1,
) {
  if (!image.complete || !image.naturalWidth) return false;
  const { columns, frameWidth, frameHeight } = mechanicSpriteSheets[name];
  const column = Math.floor(frame) % columns;
  context.drawImage(image, column * frameWidth, 0, frameWidth * sourceFraction, frameHeight, x, y, width, height);
  return true;
}

export function drawMechanicStrip(
  context: CanvasRenderingContext2D, image: HTMLImageElement, name: MechanicSprite, frame: number,
  x: number, y: number, width: number, height: number, tileWidth: number,
) {
  if (!image.complete || !image.naturalWidth) return false;
  for (let offset = 0; offset < width; offset += tileWidth) {
    const remaining = Math.min(tileWidth, width - offset);
    drawMechanicSprite(context, image, name, frame, x + offset, y, remaining, height, remaining / tileWidth);
  }
  return true;
}
