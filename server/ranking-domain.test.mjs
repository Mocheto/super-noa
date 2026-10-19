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
