import { createHmac, randomBytes, randomUUID } from "node:crypto";

export const maxAliasLength = 16;
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
  return { world, campaignWorld, completedLevels, stickers, bossChallenges };
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
