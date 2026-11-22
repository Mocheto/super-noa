import { nivelesCampana as levels } from "./nivelesIndice.ts";
import type { NivelResumen } from "./nivelesIndice.ts";

export const campaignLevels = levels.filter((level) => level.world !== 7 && level.world !== 8);

export function levelIndex(id: string): number {
  return levels.findIndex((level) => level.id === id);
}

export function nextLevelIndex(level: NivelResumen): number {
  if (level.route?.finale) return -1;
  if (level.route?.next) return levelIndex(level.route.next);
  const index = levelIndex(level.id);
  return index < 0 || index >= levels.length - 1 ? -1 : index + 1;
}

export function campaignUnlockIndex(level: NivelResumen): number {
  if (level.route?.finale) return campaignLevels.findIndex((candidate) => candidate.id === level.id);
  const next = levels[nextLevelIndex(level)];
  return next ? campaignLevels.findIndex((candidate) => candidate.id === next.id) : -1;
}
