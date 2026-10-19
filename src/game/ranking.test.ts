import assert from "node:assert/strict";
import test from "node:test";
import { emptyProgress } from "./progress.ts";
import { rankingProgress } from "./ranking.ts";

test("el tablón reconoce el mundo 9 y sus pantallas de campaña", () => {
  const levelStats = Object.fromEntries(["1-1", "9-1", "9-2"].map((id) => [id, {
    completed: true,
    bestApples: 0,
    bestLives: 3,
    flawless: false,
  }]));
  assert.deepEqual(rankingProgress({ ...emptyProgress, levelStats }), {
    world: 9,
    completedLevels: 3,
    stickers: 0,
    bossChallenges: 0,
  });
});
