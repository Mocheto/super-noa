import assert from "node:assert/strict";
import test from "node:test";
import { hashDeviceToken, normalizeAlias, validateProgress } from "./ranking-domain.mjs";

test("normaliza alias infantiles sin permitir texto arbitrario", () => {
  assert.equal(normalizeAlias("  Moche   Luna "), "Moche Luna");
  assert.equal(normalizeAlias("No"), null);
  assert.equal(normalizeAlias("Noa!"), null);
  assert.equal(normalizeAlias("Un alias demasiado largo"), null);
});

test("acepta únicamente totales posibles del progreso", () => {
  assert.deepEqual(validateProgress({ world: 12, completedLevels: 30, stickers: 36, bossChallenges: 12 }), {
    world: 12, completedLevels: 30, stickers: 36, bossChallenges: 12,
  });
  assert.equal(validateProgress({ world: 13, completedLevels: 30, stickers: 36, bossChallenges: 12 }), null);
  assert.equal(validateProgress({ world: 1.5, completedLevels: 2, stickers: 3, bossChallenges: 4 }), null);
});

test("la tarjeta de un dispositivo nunca se almacena sin cifrar", () => {
  assert.notEqual(hashDeviceToken("sal", "tarjeta"), "tarjeta");
  assert.equal(hashDeviceToken("sal", "tarjeta"), hashDeviceToken("sal", "tarjeta"));
});
