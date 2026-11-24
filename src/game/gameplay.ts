import type { Platform, Rect } from "./types";

export const GRAVITY = 1650;
export const JUMP_SPEED = 625;
export const SPRING_SPEED = 1080;
export const SKY_BOUNCE_SPEED = 1450;

export const walkAnimationFrame = (elapsedSeconds: number) => Math.floor(elapsedSeconds / 0.095) % 4;

/** En los ascensos celestes, el centro de Noa une ambos lados de la pantalla. */
export const wrapHorizontalPosition = (nextX: number, playerWidth: number, worldWidth: number) => {
  if (!(worldWidth > playerWidth) || !(playerWidth > 0)) return nextX;
  const center = nextX + playerWidth / 2;
  if (center <= 0) return nextX + worldWidth;
  if (center >= worldWidth) return nextX - worldWidth;
  return nextX;
};

/** En el arrecife, las algas sobresalen por encima de la roca que se puede pisar; la roca que asoma no lleva algas. */
export const platformSurfaceY = (platform: Platform) => platform.kind === "sea-wall" && !platform.asoma
  ? platform.y + Math.round(platform.height * 0.3)
  : platform.y;

const solidWallKinds = new Set<Platform["kind"]>(["cave-wall", "castle-wall", "sea-wall", "dino-wall", "volcano-wall", "ice-wall", "puzzle-block"]);

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

/** Belts carry feet on their surface, never a player jumping above or below. */
export function conveyorSpeed(player: Rect & { grounded: boolean }, platforms: readonly Platform[]): number {
  if (!player.grounded) return 0;
  return platforms.find((platform) => platform.beltSpeed
    && player.x + player.width > platform.x && player.x < platform.x + platform.width
    && Math.abs(player.y + player.height - platformSurfaceY(platform)) < 6)?.beltSpeed ?? 0;
}

// --- Movimiento horizontal y salto (corte 2 de «Mapear el bucle de GameCanvas para sacar la física a un módulo puro») ---

export const MOVE_SPEED = 250;
/** Velocidad nadando: más lenta que andando. */
export const SWIM_SPEED = 175;
/** Tiempo de coyote (saltar justo después de dejar el suelo) y búfer de salto (pulsar justo antes de aterrizar). */
export const COYOTE_SECONDS = 0.12;
export const JUMP_BUFFER_SECONDS = 0.13;

type Movil = Rect & { vx: number; vy: number; grounded: boolean; facing: 1 | -1 };

/** Si Noa está de pie sobre hielo (suelo, repisa o pared de hielo, a menos de 6 px de su superficie). */
export const pisaHielo = (player: Movil, platforms: readonly Platform[]) => player.grounded && platforms.some((platform) =>
  (platform.kind === "ice-ground" || platform.kind === "ice-ledge" || platform.kind === "ice-wall") &&
  player.x + player.width > platform.x && player.x < platform.x + platform.width &&
  Math.abs(player.y + player.height - platformSurfaceY(platform)) < 6);

/**
 * Velocidad horizontal y hacia dónde mira tras un paso. Mientras la nube que rebota bloquea el giro, nada cambia. Sin
 * dirección (o con las dos) frena: casi en seco, o poco a poco en el hielo. Con dirección, va a su velocidad (nadando,
 * más despacio); en el hielo acelera como mucho 520 px/s².
 */
export function velocidadHorizontal(
  player: Movil,
  mando: { left: boolean; right: boolean; swimming: boolean; ice: boolean; steerLock: number },
  delta: number,
): { vx: number; facing: 1 | -1 } {
  const { left, right, swimming, ice, steerLock } = mando;
  if (steerLock > 0) return { vx: player.vx, facing: player.facing };
  if (left === right) return { vx: player.vx * Math.pow(ice ? 0.32 : 0.0008, delta), facing: player.facing };
  const targetVelocity = (left ? -1 : 1) * (swimming ? SWIM_SPEED : MOVE_SPEED);
  return {
    vx: ice ? player.vx + Math.max(-520 * delta, Math.min(520 * delta, targetVelocity - player.vx)) : targetVelocity,
    facing: left ? -1 : 1,
  };
}

/** El viento empuja a Noa fuera del agua, sin pasar de 360 px/s. */
export function empujeViento(vx: number, viento: { direction: number; strength: number } | undefined, swimming: boolean, delta: number): number {
  return viento && !swimming ? Math.max(-360, Math.min(360, vx + viento.direction * viento.strength * delta)) : vx;
}

export type Saltador = Movil & { coyote: number; jumpBuffer: number; jumpsUsed: number; springLaunch: boolean; doubleJumpFx: number };

/**
 * El salto de un paso, sobre los campos de salto de Noa: búfer, coyote, brazada en el agua, salto (desde el suelo o
 * en una corriente), doble salto al 94 % y salto corto al soltar. `pulsado` es una pulsación nueva en este paso.
 * Devuelve el salto que ha dado, para que suene.
 */
export function resolverSalto(
  player: Saltador,
  mando: { jump: boolean; pulsado: boolean; swimming: boolean; inUpdraft: boolean },
  delta: number,
): "salto" | "doble" | null {
  const { jump, pulsado, swimming, inUpdraft } = mando;
  if (pulsado) player.jumpBuffer = JUMP_BUFFER_SECONDS;
  player.jumpBuffer = Math.max(0, player.jumpBuffer - delta);
  player.coyote = player.grounded ? COYOTE_SECONDS : Math.max(0, player.coyote - delta);
  let salto: "salto" | "doble" | null = null;
  if (swimming) {
    player.vy = swimmingVelocity(player.vy, jump || pulsado, delta);
    if (pulsado) player.vy = -190;
    player.jumpsUsed = 0;
    player.springLaunch = false;
    player.jumpBuffer = 0;
  } else if (player.jumpBuffer > 0 && (player.coyote > 0 || inUpdraft) && player.jumpsUsed === 0) {
    player.vy = -JUMP_SPEED;
    player.grounded = false;
    player.coyote = 0;
    player.jumpBuffer = 0;
    player.jumpsUsed = 1;
    salto = "salto";
  } else if (player.jumpBuffer > 0 && !player.grounded && player.jumpsUsed === 1) {
    player.vy = -JUMP_SPEED * 0.94;
    player.jumpBuffer = 0;
    player.jumpsUsed = 2;
    player.doubleJumpFx = 0.38;
    salto = "doble";
  }
  if (!swimming && !jump && player.vy < -220 && !player.springLaunch) player.vy += GRAVITY * 1.4 * delta;
  return salto;
}
