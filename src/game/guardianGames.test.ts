import assert from "node:assert/strict";
import test from "node:test";
import { bossCatalog } from "./bosses.ts";
import { GUARDIAN_GAME_ROUNDS, guardianGames, isGuardianGameId, makeGuardianSequence } from "./guardianGames.ts";

test("los dos guardianes que siguen con este juego tienen juegos cortos, tres opciones y reto sin azar", () => {
  assert.equal(Object.keys(guardianGames).length, 2);
  for (const [id, game] of Object.entries(guardianGames)) {
    assert.equal(game.options.length, 3, id);
    assert.ok(game.instruction.length > 20, id);
    assert.equal(bossCatalog[id as keyof typeof bossCatalog].challenge.id, "perfect-game", id);
    assert.equal(isGuardianGameId(id as keyof typeof bossCatalog), true, id);
  }
});

test("las cinco rondas de secuencias progresan sin superar cinco pasos", () => {
  assert.equal(GUARDIAN_GAME_ROUNDS, 5);
  for (const [id, game] of Object.entries(guardianGames)) {
    if (game.kind !== "sequence") continue;
    const lengths = Array.from({ length: GUARDIAN_GAME_ROUNDS }, (_, round) => makeGuardianSequence(game, round, [0, 1, 2, 1, 0]).length);
    assert.deepEqual(lengths, [...game.sequenceLengths!], id);
    assert.ok(Math.max(...lengths) <= 5, id);
    assert.ok(lengths.every((length, index) => index === 0 || length >= lengths[index - 1]), id);
  }
});
