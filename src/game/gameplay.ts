import type { Platform, Rect } from "./types";

export const GRAVITY = 1650;
export const JUMP_SPEED = 625;
export const SPRING_SPEED = 1080;

export const walkAnimationFrame = (elapsedSeconds: number) => Math.floor(elapsedSeconds / 0.095) % 4;

/** En el arrecife, las algas sobresalen por encima de la roca que se puede pisar. */
export const platformSurfaceY = (platform: Platform) => platform.kind === "sea-wall"
  ? platform.y + Math.round(platform.height * 0.3)
  : platform.y;

const solidWallKinds = new Set<Platform["kind"]>(["cave-wall", "castle-wall", "sea-wall", "dino-wall"]);

/** Impide atravesar una pared incluso si el personaje ya ha quedado ligeramente dentro. */
export const resolveHorizontalWallCollision = (
  previousX: number,
  nextX: number,
  playerY: number,
  playerWidth: number,
  playerHeight: number,
  platform: Platform,
) => {
  if (!solidWallKinds.has(platform.kind)) return nextX;
  const surfaceY = platformSurfaceY(platform);
  // Conserva una franja superior para aterrizar y caminar sobre la pared.
  const overlapsVertically = playerY + playerHeight > surfaceY + 10 && playerY < platform.y + platform.height;
  const overlapsHorizontally = nextX + playerWidth > platform.x && nextX < platform.x + platform.width;
  if (!overlapsVertically || !overlapsHorizontally) return nextX;
  if (nextX > previousX) return platform.x - playerWidth;
  if (nextX < previousX) return platform.x + platform.width;
  const leftCorrection = platform.x - playerWidth;
  const rightCorrection = platform.x + platform.width;
  return Math.abs(nextX - leftCorrection) <= Math.abs(nextX - rightCorrection) ? leftCorrection : rightCorrection;
};

/** El centro del cuerpo activa el agua, evitando oscilaciones en la orilla. */
export const waterAt = (player: Rect, zones: Rect[] = []) => zones.find((zone) =>
  player.x + player.width / 2 >= zone.x && player.x + player.width / 2 < zone.x + zone.width &&
  player.y + player.height * 0.6 >= zone.y && player.y < zone.y + zone.height);

export const swimmingVelocity = (velocity: number, swimmingUp: boolean, delta: number) =>
  swimmingUp ? Math.max(-190, velocity - 920 * delta) : Math.min(95, velocity + 290 * delta);

export const landsOnSpring = (wasGrounded: boolean, previousBottom: number, currentBottom: number, springY: number, verticalSpeed: number) =>
  !wasGrounded && verticalSpeed >= 0 && previousBottom <= springY + 10 && currentBottom >= springY;

/** Zona alta de la meta: se puede tocar el banderín mientras Noa salta. */
export const goalFlagHitbox = (goalX: number, surfaceY: number): Rect => ({
  x: goalX,
  y: surfaceY - 232,
  width: 172,
  height: 232,
});

export const rectanglesOverlap = (first: Rect, second: Rect) =>
  first.x < second.x + second.width && first.x + first.width > second.x && first.y < second.y + second.height && first.y + first.height > second.y;

/** La lana choca con la roca del arrecife, no con las algas decorativas. */
export const projectileHitsWaterWall = (projectile: Rect, platforms: Platform[]) => platforms.some((platform) => {
  if (platform.kind !== "sea-wall") return false;
  const surfaceY = platformSurfaceY(platform);
  return rectanglesOverlap(projectile, { x: platform.x, y: surfaceY, width: platform.width, height: platform.y + platform.height - surfaceY });
});

export const hasReachedGoalFlag = (player: Rect, goalX: number, surfaceY: number) =>
  rectanglesOverlap(player, goalFlagHitbox(goalX, surfaceY));

export const keepInsidePatrol = (x: number, velocity: number, minX: number, maxX: number) => {
  if (x <= minX) return { x: minX, velocity: Math.abs(velocity) };
  if (x >= maxX) return { x: maxX, velocity: -Math.abs(velocity) };
  return { x, velocity };
};

/** Nunca ordena al jabalí cargar contra el borde que acaba de tocar. */
export const boarChargeVelocity = (boarX: number, playerX: number, minX: number, maxX: number, currentVelocity: number) => {
  const speed = Math.max(82, Math.abs(currentVelocity));
  if (boarX <= minX && playerX <= boarX) return speed;
  if (boarX >= maxX && playerX >= boarX) return -speed;
  return playerX < boarX ? -speed : speed;
};
