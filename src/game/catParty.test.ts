import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { CAT_PARTY_LEVEL_ID, CAT_PARTY_WINDOW_MS, findPartyHit, partyCharts } from "./catParty.ts";
import { levels } from "./levels.ts";

test("the party follows the forest guardian and its approved assets are packaged", () => {
  const forestFinal = levels.find((level) => level.id === CAT_PARTY_LEVEL_ID);
  assert.equal(forestFinal?.world, 2);
  assert.equal(forestFinal?.boss, "mist-countess");
  for (const path of [
    "sprites/gatitos-tronco.png", "sprites/gatitos-ramita.png", "music/gatitos-fiesta.mp3",
    "audio/gatitos-cuenta.wav", "audio/gatitos-aviso.wav", "audio/gatitos-golpe.wav", "audio/gatitos-casi.wav",
  ]) assert.ok(existsSync(new URL(`../../public/assets/${path}`, import.meta.url)), path);
});

test("party hit windows include both edges and never count a resolved target again", () => {
  const [first] = partyCharts.practice.targets;
  const resolved = new Set<typeof first>();
  assert.equal(findPartyHit("practice", first.time - CAT_PARTY_WINDOW_MS - 1, resolved), null);
  assert.equal(findPartyHit("practice", first.time - CAT_PARTY_WINDOW_MS, resolved), first);
  assert.equal(findPartyHit("practice", first.time + CAT_PARTY_WINDOW_MS, resolved), first);
  assert.equal(findPartyHit("practice", first.time + CAT_PARTY_WINDOW_MS + 1, resolved), null);
  resolved.add(first);
  assert.equal(findPartyHit("practice", first.time, resolved), null);
});

test("both large-piece hits are distinct and remain playable if one is missed", () => {
  const large = partyCharts.practice.targets.filter((target) => target.count === 2);
  const [first, second] = large;
  assert.equal(first.piece, second.piece);
  assert.equal(findPartyHit("practice", second.time, new Set([first])), second);
  for (const { targets, duration } of Object.values(partyCharts)) {
    assert.ok(targets.at(-1)!.time + CAT_PARTY_WINDOW_MS < duration);
    for (let index = 1; index < targets.length; index++) {
      assert.ok(targets[index].time - targets[index - 1].time > 2 * CAT_PARTY_WINDOW_MS);
    }
  }
});
