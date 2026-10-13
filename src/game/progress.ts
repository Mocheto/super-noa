import { levels } from "./levels.ts";
import { campaignLevels, campaignUnlockIndex } from "./routes.ts";
import { readStorage, writeStorage } from "./storage.ts";

export const STORAGE_KEY = "super-noa-progress-v1";
const SAVE_VERSION = 2;
const campaignLevelCount = campaignLevels.length;
const knownLevelIds = new Set(levels.map((level) => level.id));

export type LevelStats = Record<string, { completed: boolean; bestApples: number; flawless?: boolean }>;
export type Progress = { unlocked: number; levelStats: LevelStats; stickers: string[]; secretUnlocked: boolean; waterUnlocked: boolean; bossChallenges: Record<string, boolean> };

export const emptyProgress: Progress = { unlocked: 0, levelStats: {}, stickers: [], secretUnlocked: false, waterUnlocked: false, bossChallenges: {} };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export function parseProgress(raw: string | null): Progress {
  if (!raw) return emptyProgress;
  try {
    const saved: unknown = JSON.parse(raw);
    if (!isRecord(saved)) return emptyProgress;
    const rawStats = isRecord(saved.levelStats) ? saved.levelStats : {};
    const levelStats: LevelStats = {};
    for (const [id, value] of Object.entries(rawStats)) {
      if (!knownLevelIds.has(id) || !isRecord(value)) continue;
      const bestApples = typeof value.bestApples === "number" && Number.isFinite(value.bestApples)
        ? Math.max(0, Math.floor(value.bestApples)) : 0;
      levelStats[id] = { completed: value.completed === true, bestApples, flawless: value.flawless === true };
    }
    const rawUnlocked = typeof saved.unlocked === "number" && Number.isFinite(saved.unlocked)
      ? Math.max(0, Math.floor(saved.unlocked)) : 0;
    const hasNewLevelStats = ["1-3", "2-3", "3-3"].some((id) => Object.hasOwn(levelStats, id));
    const legacyIndexMap = [0, 1, 3, 4, 6, 7];
    let unlocked = saved.version === SAVE_VERSION || hasNewLevelStats
      ? Math.min(campaignLevelCount - 1, rawUnlocked)
      : legacyIndexMap[Math.min(legacyIndexMap.length - 1, rawUnlocked)];
    for (const level of levels) {
      if (!levelStats[level.id]?.completed) continue;
      const next = campaignUnlockIndex(level);
      if (next >= 0) unlocked = Math.max(unlocked, next);
    }
    return {
      unlocked,
      levelStats,
      stickers: Array.isArray(saved.stickers) ? [...new Set(saved.stickers.filter((id): id is string => typeof id === "string"))] : [],
      secretUnlocked: saved.secretUnlocked === true || Boolean(levelStats["S-1"]),
      waterUnlocked: saved.waterUnlocked === true || ["A-1", "A-2", "A-3"].some((id) => Boolean(levelStats[id])),
      bossChallenges: isRecord(saved.bossChallenges)
        ? Object.fromEntries(Object.entries(saved.bossChallenges).filter((entry): entry is [string, true] => entry[1] === true))
        : {},
    };
  } catch {
    return emptyProgress;
  }
}

export const serializeProgress = (progress: Progress) => JSON.stringify({ version: SAVE_VERSION, ...progress });

export function readProgress(): Progress {
  return parseProgress(readStorage(STORAGE_KEY));
}

export function saveProgress(progress: Progress): boolean {
  return writeStorage(STORAGE_KEY, serializeProgress(progress));
}
