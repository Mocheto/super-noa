import { levels } from "./levels.ts";
import type { Level } from "./types.ts";

export const campaignLevels = levels.filter((level) => level.world !== 7 && level.world !== 8);

export function levelIndex(id: string): number {
  return levels.findIndex((level) => level.id === id);
}

export function nextLevelIndex(level: Level): number {
  if (level.route?.finale) return -1;
  if (level.route?.next) return levelIndex(level.route.next);
  const index = levels.indexOf(level);
  return index < 0 || index >= levels.length - 1 ? -1 : index + 1;
}

export function campaignUnlockIndex(level: Level): number {
  if (level.route?.finale) return campaignLevels.findIndex((candidate) => candidate.id === level.id);
  const next = levels[nextLevelIndex(level)];
  return next ? campaignLevels.findIndex((candidate) => candidate.id === next.id) : -1;
}
