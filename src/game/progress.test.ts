import assert from "node:assert/strict";
import test from "node:test";
import { emptyProgress, parseProgress, serializeProgress } from "./progress.ts";

test("el progreso nuevo conserva la campaña y los desvíos al recargar", () => {
  const progress = {
    ...emptyProgress, unlocked: 9, secretUnlocked: true, waterUnlocked: true,
    levelStats: { "3-3": { completed: true, bestApples: 4, flawless: true } },
    stickers: ["sticker-3-3"], bossChallenges: { "great-wolf": true },
  };
  assert.deepEqual(parseProgress(serializeProgress(progress)), progress);
});

test("el guardado antiguo amplía los índices de campaña sin perder logros", () => {
  const parsed = parseProgress(JSON.stringify({ unlocked: 2, levelStats: { "2-2": { completed: true, bestApples: 3 } } }));
  assert.equal(parsed.unlocked, 5);
  assert.equal(parsed.levelStats["2-2"].bestApples, 3);
  assert.equal(parsed.waterUnlocked, false);
});

test("los datos ausentes o dañados vuelven a valores seguros", () => {
  assert.deepEqual(parseProgress("{"), emptyProgress);
  assert.deepEqual(parseProgress("null"), emptyProgress);
  const parsed = parseProgress(JSON.stringify({
    version: 2, unlocked: "99", levelStats: { "1-1": { completed: true, bestApples: "muchas" }, falso: { completed: true } },
    stickers: ["sticker-1-1", "sticker-1-1", 2], bossChallenges: { "great-wolf": true, "great-boar": "sí" },
  }));
  assert.equal(parsed.unlocked, 1);
  assert.equal(parsed.levelStats["1-1"].bestApples, 0);
  assert.equal(parsed.levelStats.falso, undefined);
  assert.deepEqual(parsed.stickers, ["sticker-1-1"]);
  assert.deepEqual(parsed.bossChallenges, { "great-wolf": true });
});
