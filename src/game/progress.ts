import { levels } from "./levels.ts";
import { campaignLevels, campaignUnlockIndex } from "./routes.ts";
import { readStorage, writeStorage } from "./storage.ts";

export const STORAGE_KEY = "super-noa-progress-v1";
const SAVE_VERSION = 2;
const campaignLevelCount = campaignLevels.length;
const knownLevelIds = new Set(levels.map((level) => level.id));

export type LevelStats = Record<string, { completed: boolean; bestApples: number; flawless?: boolean }>;
export type Progress = { unlocked: number; levelStats: LevelStats; stickers: string[]; secretUnlocked: boolean; waterUnlocked: boolean; bossChallenges: Record<string, boolean>; totalApples?: number; achievedAt?: string | null };

export const emptyProgress: Progress = { unlocked: 0, levelStats: {}, stickers: [], secretUnlocked: false, waterUnlocked: false, bossChallenges: {}, totalApples: 0, achievedAt: null };

export function normalizeProgressDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute, second, zone] = match;
  const leapYear = Number(year) % 4 === 0 && (Number(year) % 100 !== 0 || Number(year) % 400 === 0);
  const days = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (Number(year) < 1 || Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > days[Number(month) - 1]
    || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59
    || (zone !== "Z" && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4)) > 59))) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  const normalized = new Date(timestamp).toISOString();
  return /^\d{4}-/.test(normalized) && !normalized.startsWith("0000-") ? normalized : null;
}

export function validProgressDate(value: unknown): value is string {
  return normalizeProgressDate(value) !== null;
}

export function lifetimeApples(progress: Progress): number {
  if (Number.isSafeInteger(progress.totalApples) && progress.totalApples! >= 0) return progress.totalApples!;
  return Object.values(progress.levelStats).reduce((sum, stat) =>
    Math.min(Number.MAX_SAFE_INTEGER, sum + (Number.isSafeInteger(stat.bestApples) && stat.bestApples >= 0 ? stat.bestApples : 0)), 0);
}

export function resetCampaignProgress(current: Progress): Progress {
  return { ...emptyProgress, levelStats: {}, stickers: [], bossChallenges: {}, totalApples: lifetimeApples(current), achievedAt: normalizeProgressDate(current.achievedAt) };
}

export function progressMilestone(current: Progress, next: Progress, now = new Date().toISOString()): Progress {
  const gained = lifetimeApples(next) > lifetimeApples(current)
    || next.unlocked > current.unlocked || (next.secretUnlocked && !current.secretUnlocked) || (next.waterUnlocked && !current.waterUnlocked)
    || next.stickers.some((id) => !current.stickers.includes(id))
    || Object.entries(next.bossChallenges).some(([id, won]) => won && !current.bossChallenges[id])
    || Object.entries(next.levelStats).some(([id, stat]) => {
      const previous = current.levelStats[id];
      return (stat.completed && !previous?.completed) || (stat.flawless && !previous?.flawless)
        || stat.bestApples > (previous?.bestApples ?? 0);
    });
  return { ...next, totalApples: lifetimeApples(next), achievedAt: normalizeProgressDate(gained ? now : current.achievedAt) };
}

export function collectLifetimeApples(current: Progress, count: number, now = new Date().toISOString()): Progress {
  if (!Number.isSafeInteger(count) || count <= 0) return current;
  return progressMilestone(current, { ...current, totalApples: Math.min(Number.MAX_SAFE_INTEGER, lifetimeApples(current) + count) }, now);
}

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
        ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value.bestApples))) : 0;
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
      totalApples: lifetimeApples({ ...emptyProgress, levelStats, totalApples: saved.totalApples as number | undefined }),
      achievedAt: normalizeProgressDate(saved.achievedAt),
    };
  } catch {
    return emptyProgress;
  }
}

export const serializeProgress = (progress: Progress) => JSON.stringify({ version: SAVE_VERSION, ...progress, totalApples: lifetimeApples(progress), achievedAt: normalizeProgressDate(progress.achievedAt) });

export function readProgress(): Progress {
  return parseProgress(readStorage(STORAGE_KEY));
}

export function saveProgress(progress: Progress): boolean {
  return writeStorage(STORAGE_KEY, serializeProgress(progress));
}
