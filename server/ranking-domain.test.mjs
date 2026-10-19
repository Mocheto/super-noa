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
  assert.deepEqual(validateProgress({ world: 9, completedLevels: 25, stickers: 27, bossChallenges: 9 }), {
    world: 9, completedLevels: 25, stickers: 27, bossChallenges: 9,
  });
  assert.equal(validateProgress({ world: 10, completedLevels: 25, stickers: 27, bossChallenges: 9 }), null);
  assert.equal(validateProgress({ world: 1.5, completedLevels: 2, stickers: 3, bossChallenges: 4 }), null);
});

test("la tarjeta de un dispositivo nunca se almacena sin cifrar", () => {
  assert.notEqual(hashDeviceToken("sal", "tarjeta"), "tarjeta");
  assert.equal(hashDeviceToken("sal", "tarjeta"), hashDeviceToken("sal", "tarjeta"));
});
