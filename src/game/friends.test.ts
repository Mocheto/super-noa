import assert from "node:assert/strict";
import test from "node:test";
import { addHeart, heartsOf, isBestFriend, isFriend, normalizeFriends } from "./friendProgress.ts";
import { foodNames, friendCatalog, MAX_HEARTS } from "./friends.ts";
import { levels, waterLevels } from "./levels.ts";
import { emptyProgress, parseProgress, serializeProgress } from "./progress.ts";
import { greetFriend, visitRestStop } from "./restStopProgress.ts";

const usedKinds = new Set([...levels, ...waterLevels].flatMap((level) => level.enemies.map((enemy) => enemy.kind)));

test("cada tipo de enemigo del juego tiene su ficha y no sobra ninguna", () => {
  const kinds = friendCatalog.map((entry) => entry.kind);
  assert.equal(new Set(kinds).size, kinds.length);
  assert.deepEqual(new Set(kinds), usedKinds);
  for (const entry of friendCatalog) {
    assert.ok(entry.world >= 1 && entry.world <= 17);
    for (const text of [entry.name, entry.biteLine, entry.tip]) assert.ok(text.length >= 1 && text.length < 40, `${entry.kind}: «${text}»`);
    assert.ok(entry.favoriteFood in foodNames);
  }
});

test("se hace amigo al saludarlo en un paseo, o al completar su pantalla si su mundo no tiene paseo", () => {
  const slime = friendCatalog.find((entry) => entry.kind === "slime")!;
  const puffling = friendCatalog.find((entry) => entry.kind === "puffling")!;
  const starLantern = friendCatalog.find((entry) => entry.kind === "star-lantern")!;
  assert.equal(isFriend(slime, emptyProgress), false);
  assert.equal(isFriend(slime, greetFriend({ ...emptyProgress }, 1, "slime")), true);
  assert.equal(isFriend(puffling, emptyProgress), false);
  assert.equal(isFriend(puffling, { levelStats: { "17-1": { completed: true } } }), true);
  assert.equal(isFriend(starLantern, emptyProgress), false, "no cabe en el paseo de Navidad");
  assert.equal(isFriend(starLantern, visitRestStop({ ...emptyProgress }, 13)), true, "se hace amigo al visitar ese paseo");
});

test("los corazones suben hasta cinco, nunca bajan y se guardan sin cambiar la versión", () => {
  let progress = { ...emptyProgress };
  for (let i = 0; i < 7; i += 1) progress = addHeart(progress, "slime");
  assert.equal(heartsOf("slime", progress), MAX_HEARTS);
  assert.ok(isBestFriend("slime", progress));
  assert.equal(addHeart(progress, "no-existe"), progress);
  assert.deepEqual(parseProgress(serializeProgress(progress)).friends, { slime: { hearts: 5 } });
  assert.deepEqual(parseProgress(JSON.stringify({ version: 2, unlocked: 0, levelStats: {} })).friends, {});
  assert.deepEqual(normalizeFriends({ slime: { hearts: 99 }, beetle: { hearts: -2 }, dragon: { hearts: 3 }, cloud: "x" }), { slime: { hearts: 5 } });
});
