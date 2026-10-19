import assert from "node:assert/strict";
import test from "node:test";
import { levels } from "./levels.ts";
import { campaignLevels, campaignUnlockIndex, levelIndex, nextLevelIndex } from "./routes.ts";

test("todas las rutas declaradas llevan a pantallas existentes", () => {
  for (const level of levels) {
    for (const id of [level.route?.next, level.route?.required, level.route?.waterExit, level.route?.secretExit]) {
      if (id) assert.ok(levelIndex(id) >= 0, `${level.id} apunta a ${id}`);
    }
    if (level.waterEntrance) assert.ok(level.route?.waterExit, `${level.id} necesita salida al agua`);
    if (level.rewardBlocks.some((block) => block.reward === "secret-vine")) assert.ok(level.route?.secretExit, `${level.id} necesita salida secreta`);
  }
});

test("la ruta normal evita el agua y la laguna vuelve al bosque de los jabalíes", () => {
  for (const id of ["3-3", "A-3"]) {
    const level = levels[levelIndex(id)];
    assert.equal(levels[nextLevelIndex(level)].id, "4-1");
    assert.equal(campaignUnlockIndex(level), campaignLevels.findIndex((candidate) => candidate.id === "4-1"));
  }
  assert.equal(levels[nextLevelIndex(levels[levelIndex("A-1")])].id, "A-2");
  assert.equal(levels[nextLevelIndex(levels[levelIndex("A-2")])].id, "A-3");
  assert.equal(levels[levelIndex("3-3")].route?.waterExit, "A-1");
  assert.equal(levels[levelIndex("4-3")].route?.secretExit, "S-1");
  assert.equal(levels[nextLevelIndex(levels[levelIndex("6-3")])].id, "9-1");
  assert.equal(campaignUnlockIndex(levels[levelIndex("6-3")]), campaignLevels.findIndex((level) => level.id === "9-1"));
  assert.equal(levels[nextLevelIndex(levels[levelIndex("9-3")])].id, "10-1");
  assert.equal(levels[nextLevelIndex(levels[levelIndex("10-3")])].id, "11-1");
  assert.equal(levels[nextLevelIndex(levels[levelIndex("11-3")])].id, "12-1");
  assert.equal(nextLevelIndex(levels[levelIndex("12-3")]), -1);
  assert.equal(campaignUnlockIndex(levels[levelIndex("12-3")]), campaignLevels.length - 1);
});
