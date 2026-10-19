import type { Progress } from "./progress";
import { readStorage, writeStorage } from "./storage";
import { campaignLevels } from "./routes";
import { levels } from "./levels";

const RANKING_URL = "https://rankings.moche-home.es";
const DEVICE_KEY = "super-noa-ranking-device-v1";
export const rankingConnectionMessage = "Los rankings no conectan debido ha bloqueos por la liga.es";

export type RankingDevice = { id: string; token: string; alias: string };
export type RankingPlayer = { alias: string; world: number; completedLevels: number; stickers: number; bossChallenges: number };

export function readRankingDevice(): RankingDevice | null {
  try {
    const value: unknown = JSON.parse(readStorage(DEVICE_KEY) ?? "null");
    return value !== null && typeof value === "object" && typeof (value as RankingDevice).id === "string" && typeof (value as RankingDevice).token === "string" && typeof (value as RankingDevice).alias === "string" ? value as RankingDevice : null;
  } catch { return null; }
}

export function rankingProgress(progress: Progress) {
  const finished = levels.filter((level) => progress.levelStats[level.id]?.completed);
  return {
    world: Math.max(0, ...finished.map((level) => level.world), progress.secretUnlocked ? 7 : 0, progress.waterUnlocked ? 8 : 0),
    completedLevels: campaignLevels.filter((level) => progress.levelStats[level.id]?.completed).length,
    stickers: progress.stickers.length,
    bossChallenges: Object.values(progress.bossChallenges).filter(Boolean).length,
  };
}

async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${RANKING_URL}${path}`, { ...init, signal: AbortSignal.timeout(7_000) });
  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof (body as { error?: unknown }).error === "string" ? (body as { error: string }).error : "No pude hablar con el ranking.");
  return body;
}

export async function registerRankingDevice(alias: string): Promise<RankingDevice> {
  const body = await request("/v1/devices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alias }) }) as { deviceId: string; deviceToken: string; alias: string };
  const device = { id: body.deviceId, token: body.deviceToken, alias: body.alias };
  writeStorage(DEVICE_KEY, JSON.stringify(device));
  return device;
}

export async function syncRanking(device: RankingDevice, progress: Progress) {
  await request("/v1/progress", { method: "POST", headers: { "Content-Type": "application/json", "X-Super-Noa-Device": device.id, "X-Super-Noa-Token": device.token }, body: JSON.stringify(rankingProgress(progress)) });
}

export async function loadRanking(): Promise<RankingPlayer[]> {
  const body = await request("/v1/leaderboard?limit=20") as { players: RankingPlayer[] };
  return body.players;
}
