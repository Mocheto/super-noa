import assert from "node:assert/strict";
import test from "node:test";
import { createLevelTransition } from "./levelTransition.ts";
import type { GameSnapshot } from "./types";

test("las transiciones solo consumen tiempo de simulación activa y finalizan una vez", () => {
  for (const delay of [.45, .7, .85, 1.45]) {
    const emitted: GameSnapshot[] = [];
    const finished: GameSnapshot[] = [];
    const snapshot: GameSnapshot = { apples: 2, stickers: ["a"], power: "cat", checkpoint: 2, paused: false };
    const transition = createLevelTransition((final) => emitted.push(final));
    transition.begin(snapshot, delay, (final) => finished.push(final));
    snapshot.stickers.push("posterior");
    transition.advance(delay / 2, true);
    transition.advance(10_000, false);
    assert.equal(finished.length, 0);
    transition.advance(delay / 2, true);
    transition.advance(delay, true);
    assert.equal(finished.length, 1);
    assert.equal(finished[0], emitted[0]);
    assert.deepEqual(finished[0].stickers, ["a"]);
  }
});

test("cancelar una transición evita su callback", () => {
  const transition = createLevelTransition(() => undefined);
  transition.begin({ apples: 0, stickers: [], power: "normal", checkpoint: 0, paused: false }, .45, () => assert.fail("cancelada"));
  transition.cancel();
  transition.advance(1, true);
});
