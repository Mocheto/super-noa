import type { ShopMatchCount } from "./types.ts";

export type ShopCat = 0 | 1 | 2;
export type ShopClock = { activeMs: number; lastFrame: number | null };

export const SHOP_CHOICE_MS = 2000;
export const SHOP_ACTIVATION_GAP_MS = 280;

export function advanceShopClock(clock: ShopClock, timestamp: number, paused: boolean): ShopClock {
  if (paused || !Number.isFinite(timestamp)) return { activeMs: clock.activeMs, lastFrame: null };
  const delta = clock.lastFrame === null ? 0 : Math.min(64, Math.max(0, timestamp - clock.lastFrame));
  return { activeMs: clock.activeMs + delta, lastFrame: timestamp };
}

export function shopPhase(activeMs: number, row: number, reduceMotion: boolean): number {
  const steps = Math.max(0, activeMs) / SHOP_CHOICE_MS;
  return ((reduceMotion ? Math.floor(steps) : steps) + row) % 3;
}

export function snapShopCat(phase: number): ShopCat {
  return ((Math.round(phase) % 3 + 3) % 3) as ShopCat;
}

export function countShopMatches(cats: readonly [ShopCat, ShopCat, ShopCat]): ShopMatchCount {
  if (cats[0] === cats[1] && cats[1] === cats[2]) return 3;
  if (cats[0] === cats[1] || cats[0] === cats[2] || cats[1] === cats[2]) return 2;
  return 1;
}

export function shopRewardSeconds(matches: ShopMatchCount): number {
  return matches === 3 ? 12 : matches === 2 ? 5 : 0;
}
