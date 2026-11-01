import type { BeatPlatform, BloomBridge, Enemy, Level, Platform, SkyLift, Updraft } from "./types";

export type WolfSleepPhase = "sleeping" | "warning" | "awake";
export type BloomBridgePhase = "closed" | "open" | "warning";

export function beatPlatformActive(platform: BeatPlatform, elapsed: number): boolean {
  const time = cycleTime(elapsed, platform.delay, platform.interval);
  return time < 0 || time < platform.activeDuration;
}

const cycleTime = (elapsed: number, delay: number, interval: number) => {
  const time = elapsed - delay;
  return time < 0 ? -1 : ((time % interval) + interval) % interval;
};

export function wolfSleepState(enemy: Pick<Enemy, "kind" | "sleepCycle">, elapsed: number): WolfSleepPhase {
  const cycle = enemy.sleepCycle;
  if (enemy.kind !== "wolf" || !cycle || !(cycle.interval > 0)) return "awake";
  const time = cycleTime(elapsed, cycle.delay, cycle.interval);
  if (time < 0 || time < cycle.sleepDuration) return "sleeping";
  return time < cycle.sleepDuration + cycle.warningDuration ? "warning" : "awake";
}

export function bloomBridgeState(bridge: BloomBridge, elapsed: number): BloomBridgePhase {
  if (!(bridge.interval > 0)) return "closed";
  const time = cycleTime(elapsed, bridge.delay, bridge.interval);
  if (time < 0) return "closed";
  if (time < bridge.openDuration) return "open";
  return time < bridge.openDuration + bridge.warningDuration ? "warning" : "closed";
}

export function getMechanicPlatforms(level: Level, elapsed: number): Platform[] {
  const flowers = level.world === 11 ? level.bloomBridges ?? [] : [];
  const beats = level.beatPlatforms ?? [];
  if (!flowers.length && !beats.length) return level.platforms;
  return [...level.platforms, ...flowers
    .filter((bridge) => bloomBridgeState(bridge, elapsed) !== "closed")
    .map((bridge): Platform => ({ x: bridge.x, y: bridge.y, width: bridge.width, height: bridge.height, kind: "garden-ledge" })),
  ...beats.filter((platform) => beatPlatformActive(platform, elapsed))];
}

/** Apply only the strongest overlapping current, without clipping a faster existing jump. */
export function updraftVelocity(velocity: number, zones: readonly Updraft[], delta: number): number {
  return zones.reduce((best, zone) => {
    const limit = -Math.max(0, zone.maxRiseSpeed);
    const lifted = velocity < limit ? velocity : Math.max(limit, velocity - Math.max(0, zone.strength) * delta);
    return Math.min(best, lifted);
  }, velocity);
}

export function skyLiftY(lift: SkyLift, activatedAt: number | undefined, elapsed: number): number {
  if (activatedAt === undefined) return lift.bottomY;
  const distance = Math.max(0, lift.bottomY - lift.topY);
  const travelDuration = distance / Math.max(1, lift.speed);
  const wait = Math.max(0, lift.waitDuration);
  const cycleDuration = travelDuration * 2 + wait * 2;
  if (cycleDuration === 0) return lift.topY;
  const phase = Math.max(0, elapsed - activatedAt) % cycleDuration;
  if (phase < wait) return lift.bottomY;
  if (phase < wait + travelDuration) return lift.bottomY - (phase - wait) / travelDuration * distance;
  if (phase < wait * 2 + travelDuration) return lift.topY;
  return lift.topY + (phase - wait * 2 - travelDuration) / travelDuration * distance;
}

export function skyLiftPlatform(lift: SkyLift, activatedAt: number | undefined, elapsed: number): Platform {
  return { x: lift.x, y: skyLiftY(lift, activatedAt, elapsed), width: lift.width, height: lift.height, kind: "sky-cloud" };
}

export function hasWorldMechanics(level: Level): boolean {
  return Boolean(level.chainGuardians?.length)
    || (level.world === 3 && level.enemies.some((enemy) => enemy.kind === "wolf" && enemy.sleepCycle))
    || (level.world === 11 && Boolean(level.bloomBridges?.length))
    || (level.world === 7 && Boolean(level.updrafts?.length))
    || (level.world === 14 && Boolean(level.sandGeysers?.length))
    || Boolean(level.skyLifts?.length)
    || Boolean(level.beatPlatforms?.length);
}

/** Temporary flowers are never respawn supports; preserve legacy spawning in other worlds. */
export function mechanicRespawn(level: Level, x: number, width: number, height: number): { x: number; y: number } {
  if (!hasWorldMechanics(level)) return { x, y: level.start.y };
  const hazards = [...(level.deadlyWater ?? []), ...(level.spikePits ?? [])];
  const supports = level.platforms.filter((platform) => {
    if (platform.kind === "spring" || platform.kind === "dew" || platform.kind === "gift-spring" || platform.kind === "sky-bounce" || x < platform.x || x + width > platform.x + platform.width) return false;
    const y = platform.y - height;
    return !hazards.some((hazard) =>
      x < hazard.x + hazard.width && x + width > hazard.x && y < hazard.y + hazard.height && y + height > hazard.y);
  });
  const support = supports.sort((a, b) => Math.abs(a.y - height - level.start.y) - Math.abs(b.y - height - level.start.y))[0];
  return support ? { x, y: support.y - height } : { ...level.start };
}

/** Recupera a Noa sobre la nube normal más baja que todavía se ve en una subida vertical. */
export function visibleSkyRespawn(level: Level, cameraY: number, viewHeight: number, playerWidth: number, playerHeight: number): { x: number; y: number } | null {
  if (level.orientation !== "vertical") return null;
  const topMargin = cameraY + 80;
  const bottomMargin = cameraY + viewHeight - 34;
  const support = level.platforms
    .filter((platform) => platform.kind === "sky-cloud" && platform.width >= playerWidth + 20
      && platform.y >= topMargin && platform.y <= bottomMargin)
    .sort((first, second) => second.y - first.y)[0];
  if (!support) return null;
  return {
    x: support.x + (support.width - playerWidth) / 2,
    y: support.y - playerHeight,
  };
}
