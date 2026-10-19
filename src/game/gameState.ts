import type { Level, LevelItem, Power, Rect, WaterJumper } from "./types";

export type Player = Rect & {
  vx: number; vy: number; grounded: boolean; facing: 1 | -1; power: Power;
  invincible: number; coyote: number; jumpBuffer: number; jumpsUsed: number;
  springLaunch: boolean; doubleJumpFx: number; shootFx: number;
};
export type LiveEnemy = Level["enemies"][number] & { vx: number; active: boolean; phase: number };
export type LiveItem = LevelItem & { age: number; rise: number; fromBlock: boolean };
export type Projectile = { x: number; y: number; vx: number; vy: number; life: number };
export type LiveCannon = NonNullable<Level["cannons"]>[number] & { cooldown: number };
export type Cannonball = { x: number; y: number; vx: number; active: boolean };
export type LiveWaterJumper = WaterJumper & { age: number };
export type PixelBurst = { x: number; y: number; life: number; color: string; kind: "stars" | "puff" };

export const positiveModulo = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;

export const enemyY = (enemy: LiveEnemy) =>
  enemy.y + (enemy.kind === "bird" || enemy.kind === "parrot" || enemy.kind === "bat" || enemy.kind === "ghost" || enemy.kind === "fish" || enemy.kind === "pterodactyl" ? Math.sin(enemy.phase) * 20 : enemy.kind === "cloud" ? Math.sin(enemy.phase) * 7 : 0);

export const waterJumperState = (jumper: LiveWaterJumper) => {
  const flightDuration = Math.min(1.45, jumper.interval * 0.62);
  const elapsed = positiveModulo(jumper.age - jumper.delay, jumper.interval);
  const active = elapsed < flightDuration;
  const progress = active ? elapsed / flightDuration : 0;
  return {
    active,
    progress,
    y: active
      ? jumper.surfaceY - jumper.height - Math.sin(progress * Math.PI) * jumper.jumpHeight
      : jumper.surfaceY + 18,
  };
};
