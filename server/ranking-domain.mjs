import { createHmac, randomBytes, randomUUID } from "node:crypto";

export const maxAliasLength = 16;
export const maxTotalApples = Number.MAX_SAFE_INTEGER;
const aliasPattern = /^[\p{L}\p{N} _-]{3,16}$/u;

export function normalizeAlias(value) {
  if (typeof value !== "string") return null;
  const alias = value.trim().replace(/\s+/g, " ");
  return aliasPattern.test(alias) ? alias : null;
}

function boundedInteger(value, maximum) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= maximum
    ? value
    : null;
}

export function validateProgress(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const world = boundedInteger(value.world, 12);
  const completedLevels = boundedInteger(value.completedLevels, 30);
  const stickers = boundedInteger(value.stickers, 36);
  const bossChallenges = boundedInteger(value.bossChallenges, 12);
  if ([world, completedLevels, stickers, bossChallenges].some((item) => item === null)) return null;
  const campaignWorld = campaignWorldFromLegacyWorld(world);
  if (value.campaignWorld !== undefined && value.campaignWorld !== campaignWorld) return null;
  const progress = { world, campaignWorld, completedLevels, stickers, bossChallenges };
  if (Object.hasOwn(value, "totalApples")) {
    const totalApples = boundedInteger(value.totalApples, maxTotalApples);
    if (totalApples === null) return null;
    progress.totalApples = totalApples;
  }
  if (Object.hasOwn(value, "achievedAt")) {
    const achievedAt = value.achievedAt === null ? null : normalizeAchievementDate(value.achievedAt);
    if (achievedAt === null && value.achievedAt !== null) return null;
    progress.achievedAt = achievedAt;
  }
  return progress;
}

function normalizeAchievementDate(value) {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute, second, zone] = match;
  const days = [31, Number(year) % 4 === 0 && (Number(year) % 100 !== 0 || Number(year) % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (Number(year) < 1 || Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > days[Number(month) - 1]
    || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59
    || (zone !== "Z" && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4)) > 59))) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  const normalized = new Date(timestamp).toISOString();
  return /^\d{4}-/.test(normalized) && !normalized.startsWith("0000-") ? normalized : null;
}

export function campaignWorldFromLegacyWorld(world) {
  return world === 7 || world === 8 ? null : world > 8 ? world - 2 : world;
}

export function validateDeviceCredentials(value) {
  return value !== null && typeof value === "object"
    && typeof value.deviceId === "string" && /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(value.deviceId)
    && typeof value.deviceToken === "string" && /^[\w-]{32,128}$/.test(value.deviceToken)
    ? { id: value.deviceId.toLowerCase(), token: value.deviceToken }
    : null;
}

export function createDeviceCredentials(pepper) {
  const id = randomUUID();
  const token = randomBytes(32).toString("base64url");
  return { id, token, tokenHash: hashDeviceToken(pepper, token) };
}

export function hashDeviceToken(pepper, token) {
  return createHmac("sha256", pepper).update(token).digest("hex");
}
