import { GRAVITY, JUMP_SPEED, rectanglesOverlap } from "./gameplay.ts";
import type { Rect } from "./types";

export const SANTA_ARENA = { width: 960, height: 480, floor: 400 };
export const SANTA_PLATFORMS: Rect[] = [
  { x: 285, y: 240, width: 145, height: 22 },
  { x: 805, y: 240, width: 115, height: 22 },
];
export type SantaInput = { left: boolean; right: boolean; jumpPressed: boolean; jumpHeld: boolean };
export type SantaBattle = {
  player: Rect & { vx: number; vy: number; grounded: boolean; jumps: number; facing: -1 | 1; invincible: number; bouncing: boolean };
  boss: Rect & { direction: -1 | 1; stun: number; attackIn: number };
  gifts: Array<Rect & { vx: number }>;
  hits: number; lives: number; elapsed: number; status: "playing" | "won" | "lost";
};
export type SantaEvent = "jump" | "stomp" | "hurt" | "throw";

export function createSantaBattle(): SantaBattle {
  return {
    player: { x: 300, y: 342, width: 42, height: 58, vx: 0, vy: 0, grounded: true, jumps: 0, facing: 1, invincible: 0, bouncing: false },
    boss: { x: 650, y: 280, width: 96, height: 120, direction: -1, stun: 0, attackIn: 3.2 },
    gifts: [], hits: 0, lives: 3, elapsed: 0, status: "playing",
  };
}

/** Called at 60 Hz by the same fixed-step loop as the campaign. */
export function stepSantaBattle(state: SantaBattle, input: SantaInput, delta: number): SantaEvent[] {
  if (state.status !== "playing") return [];
  const events: SantaEvent[] = [];
  const p = state.player, boss = state.boss;
  state.elapsed += delta;
  p.invincible = Math.max(0, p.invincible - delta);
  boss.stun = Math.max(0, boss.stun - delta);
  if (!boss.stun) {
    boss.attackIn -= delta;
    if (boss.attackIn > .65) {
      boss.x += boss.direction * 38 * delta;
      if (boss.x < 510 || boss.x > 735) {
        boss.x = Math.max(510, Math.min(735, boss.x));
        boss.direction = boss.direction === 1 ? -1 : 1;
      }
    }
    if (boss.attackIn <= 0) {
      const direction = p.x + p.width / 2 < boss.x + boss.width / 2 ? -1 : 1;
      state.gifts.push({ x: direction < 0 ? boss.x - 34 : boss.x + boss.width + 4, y: 368, width: 30, height: 32, vx: direction * 210 });
      boss.attackIn = 2.8;
      events.push("throw");
    }
  }
  p.vx = input.left === input.right ? 0 : input.left ? -250 : 250;
  if (p.vx) p.facing = p.vx < 0 ? -1 : 1;
  if (input.jumpPressed && p.jumps < 2) {
    p.vy = -JUMP_SPEED * (p.jumps === 0 ? 1 : .94);
    p.jumps += 1; p.grounded = false; p.bouncing = false;
    events.push("jump");
  }
  // Releasing jump early gives the same short-hop control as a platform game.
  if (!input.jumpHeld && !p.bouncing && p.vy < -250) p.vy = -250;
  const previousBottom = p.y + p.height;
  p.x = Math.max(8, Math.min(SANTA_ARENA.width - p.width - 8, p.x + p.vx * delta));
  p.vy += GRAVITY * delta;
  p.y += p.vy * delta;
  p.grounded = false;
  for (const support of [...SANTA_PLATFORMS, { x: 0, y: SANTA_ARENA.floor, width: SANTA_ARENA.width, height: 80 }]) {
    if (p.vy >= 0 && previousBottom <= support.y + 1 && p.y + p.height >= support.y
      && p.x + p.width > support.x && p.x < support.x + support.width) {
      p.y = support.y - p.height; p.vy = 0; p.grounded = true; p.jumps = 0; p.bouncing = false;
    }
  }
  const aboveHead = p.vy > 0 && previousBottom <= boss.y + 8 && p.y + p.height >= boss.y
    && p.x + p.width > boss.x + 8 && p.x < boss.x + boss.width - 8;
  if (aboveHead) {
    p.y = boss.y - p.height; p.vy = -500; p.grounded = false; p.jumps = 1; p.bouncing = true;
    if (!boss.stun) {
      state.hits += 1; boss.stun = 1.2; boss.attackIn = 2.8;
      p.invincible = Math.max(p.invincible, .5); state.gifts = [];
      events.push("stomp");
      if (state.hits >= 2) state.status = "won";
    }
  }
  state.gifts.forEach((gift) => { gift.x += gift.vx * delta; });
  state.gifts = state.gifts.filter((gift) => gift.x > -40 && gift.x < SANTA_ARENA.width + 40);
  if (state.status === "playing" && !p.invincible && ((!aboveHead && !boss.stun && rectanglesOverlap(p, boss))
    || state.gifts.some((gift) => rectanglesOverlap(p, gift)))) {
    state.lives -= 1; p.invincible = 1.8;
    p.x = p.x < boss.x ? Math.max(20, p.x - 85) : Math.min(890, p.x + 85);
    p.vy = -240; p.grounded = false; state.gifts = [];
    events.push("hurt");
    if (state.lives <= 0) state.status = "lost";
  }
  return events;
}
