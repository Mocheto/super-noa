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
  const world = boundedInteger(value.world, 9);
  const completedLevels = boundedInteger(value.completedLevels, 25);
  const stickers = boundedInteger(value.stickers, 27);
  const bossChallenges = boundedInteger(value.bossChallenges, 9);
  if ([world, completedLevels, stickers, bossChallenges].some((item) => item === null)) return null;
  return { world, completedLevels, stickers, bossChallenges };
}

export function createDeviceCredentials(pepper) {
  const id = randomUUID();
  const token = randomBytes(32).toString("base64url");
  return { id, token, tokenHash: hashDeviceToken(pepper, token) };
}

export function hashDeviceToken(pepper, token) {
  return createHmac("sha256", pepper).update(token).digest("hex");
}
