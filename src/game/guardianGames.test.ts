import assert from "node:assert/strict";
import test from "node:test";
import { bossCatalog } from "./bosses.ts";
import { choiceAnswer, guardianGames, isGuardianGameId, makeGuardianSequence } from "./guardianGames.ts";

test("los siete guardianes nuevos tienen juegos cortos, tres opciones y reto sin azar", () => {
  assert.equal(Object.keys(guardianGames).length, 7);
  for (const [id, game] of Object.entries(guardianGames)) {
    assert.equal(game.options.length, 3, id);
    assert.ok(game.instruction.length > 20, id);
    assert.equal(bossCatalog[id as keyof typeof bossCatalog].challenge.id, "perfect-game", id);
    assert.equal(isGuardianGameId(id as keyof typeof bossCatalog), true, id);
  }
});

test("las secuencias progresan sin superar cuatro pasos", () => {
  for (const [id, game] of Object.entries(guardianGames)) {
    if (game.kind !== "sequence") continue;
    const lengths = [0, 1, 2].map((round) => makeGuardianSequence(game, round, [0, 1, 2, 1]).length);
    assert.deepEqual(lengths, [...game.sequenceLengths!], id);
    assert.ok(Math.max(...lengths) <= 4, id);
  }
});

test("el Gran Jabalí se esquiva hacia el lado contrario o saltando", () => {
  assert.equal(choiceAnswer("great-boar", "left"), "right");
  assert.equal(choiceAnswer("great-boar", "right"), "left");
  assert.equal(choiceAnswer("great-boar", "jump"), "jump");
  assert.equal(choiceAnswer("queen-bee", "pink"), "pink");
});
