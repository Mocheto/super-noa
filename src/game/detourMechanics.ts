import type { DetourMechanism, Level, Platform } from "./types.ts";

export type DetourClock = { elapsed: number; wheel: number; loads: Record<string, number>; switches: Set<string> };
export type DetourSupport = Platform & { id: string; mechanism: DetourMechanism };
export const createDetourClock = (): DetourClock => ({ elapsed: 0, wheel: 0, loads: {}, switches: new Set() });

export function advanceDetourClock(clock: DetourClock, level: Level, delta: number, standing: string | null): void {
  clock.elapsed += delta;
  clock.wheel += delta * (clock.switches.has("bell") ? -1 : 1);
  for (const mechanism of level.mechanisms ?? []) {
    const loaded = mechanism.kind === "vine" ? clock.switches.has("water") : standing === mechanism.id;
    clock.loads[mechanism.id] = Math.max(0, Math.min(1, (clock.loads[mechanism.id] ?? 0) + delta * (loaded ? .35 : -.2)));
  }
}

export function detourSupports(level: Level, clock: DetourClock): DetourSupport[] {
  return (level.mechanisms ?? []).filter((mechanism) => mechanism.kind !== "book" || clock.switches.has("books")).map((mechanism) => {
    let { x, y } = mechanism;
    if (mechanism.kind === "wheel") {
      const angle = clock.wheel * Math.PI * 2 / mechanism.period + mechanism.phase;
      x += Math.cos(angle) * mechanism.travel - mechanism.width / 2;
      y += Math.sin(angle) * mechanism.travel;
    } else if (mechanism.kind === "cart") {
      x += (1 - Math.cos(clock.elapsed * Math.PI * 2 / mechanism.period)) / 2 * mechanism.travel;
    } else if (mechanism.kind === "leaf") y += (clock.loads[mechanism.id] ?? 0) * mechanism.travel;
    else if (mechanism.kind === "vine") y -= (clock.loads[mechanism.id] ?? 0) * mechanism.travel;
    return { x, y, width: mechanism.width, height: mechanism.height, kind: "branch", id: mechanism.id, mechanism };
  });
}
