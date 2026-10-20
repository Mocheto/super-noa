import assert from "node:assert/strict";
import test from "node:test";
import { campaignWorldFromLegacyWorld, hashDeviceToken, normalizeAlias, validateDeviceCredentials, validateProgress } from "./ranking-domain.mjs";

test("normaliza alias infantiles sin permitir texto arbitrario", () => {
  assert.equal(normalizeAlias("  Moche   Luna "), "Moche Luna");
  assert.equal(normalizeAlias("No"), null);
  assert.equal(normalizeAlias("Noa!"), null);
  assert.equal(normalizeAlias("Un alias demasiado largo"), null);
});

test("acepta únicamente totales posibles del progreso", () => {
  assert.deepEqual(validateProgress({ world: 12, completedLevels: 30, stickers: 36, bossChallenges: 12 }), {
    world: 12, campaignWorld: 10, completedLevels: 30, stickers: 36, bossChallenges: 12,
  });
  assert.equal(validateProgress({ world: 13, completedLevels: 30, stickers: 36, bossChallenges: 12 }), null);
  assert.equal(validateProgress({ world: 1.5, completedLevels: 2, stickers: 3, bossChallenges: 4 }), null);
});

test("migra IDs históricos sin confundir agua y nubes con mundos de campaña", () => {
  assert.equal(campaignWorldFromLegacyWorld(6), 6);
  assert.equal(campaignWorldFromLegacyWorld(7), null);
  assert.equal(campaignWorldFromLegacyWorld(8), null);
  assert.equal(campaignWorldFromLegacyWorld(9), 7);
  assert.equal(campaignWorldFromLegacyWorld(12), 10);
  assert.equal(validateProgress({ world: 8, completedLevels: 3, stickers: 0, bossChallenges: 0 }).campaignWorld, null);
  assert.equal(validateProgress({ world: 12, campaignWorld: 12, completedLevels: 30, stickers: 36, bossChallenges: 12 }), null);
});

test("las manzanas son acumulativas, opcionales y enteros seguros", () => {
  const progress = { world: 0, completedLevels: 0, stickers: 0, bossChallenges: 0 };
  assert.equal(Object.hasOwn(validateProgress(progress), "totalApples"), false);
  for (const totalApples of [0, 1, Number.MAX_SAFE_INTEGER]) {
    assert.equal(validateProgress({ ...progress, totalApples }).totalApples, totalApples);
  }
  for (const totalApples of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, Infinity, NaN, "4", null, undefined]) {
    assert.equal(validateProgress({ ...progress, totalApples }), null);
  }
});

test("la fecha opcional distingue el pasado desconocido y valida el calendario real", () => {
  const progress = { world: 0, completedLevels: 0, stickers: 0, bossChallenges: 0 };
  assert.equal(Object.hasOwn(validateProgress(progress), "achievedAt"), false);
  assert.equal(validateProgress({ ...progress, achievedAt: null }).achievedAt, null);
  assert.equal(validateProgress({ ...progress, achievedAt: "2024-02-29T12:30:00+02:00" }).achievedAt, "2024-02-29T10:30:00.000Z");
  assert.equal(validateProgress({ ...progress, achievedAt: "2026-10-20T08:00:00.123Z" }).achievedAt, "2026-10-20T08:00:00.123Z");
  for (const achievedAt of ["ayer", "", "2026-02-29T00:00:00Z", "2024-02-30T00:00:00Z",
    "2026-13-01T00:00:00Z", "2026-00-01T00:00:00Z", "2026-01-00T00:00:00Z",
    "2026-01-01", "2026-01-01T24:00:00Z", "2026-01-01T12:60:00Z",
    "2026-01-01T12:00:60Z", "2026-01-01T12:00:00+24:00", "2026-01-01T12:00:00+01:60",
    "0000-01-01T00:00:00Z", undefined, 123, {}]) {
    assert.equal(validateProgress({ ...progress, achievedAt }), null, String(achievedAt));
  }
});

test("valida tarjetas generadas por el cliente sin aceptar tarjetas parciales", () => {
  const deviceId = "AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA";
  const deviceToken = "a".repeat(43);
  assert.deepEqual(validateDeviceCredentials({ deviceId, deviceToken }), { id: deviceId.toLowerCase(), token: deviceToken });
  assert.equal(validateDeviceCredentials({ deviceId }), null);
  assert.equal(validateDeviceCredentials({ deviceId: "mal", deviceToken }), null);
  assert.equal(validateDeviceCredentials({ deviceId, deviceToken: "" }), null);
});

test("la tarjeta de un dispositivo nunca se almacena sin cifrar", () => {
  assert.notEqual(hashDeviceToken("sal", "tarjeta"), "tarjeta");
  assert.equal(hashDeviceToken("sal", "tarjeta"), hashDeviceToken("sal", "tarjeta"));
});
