import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceShopClock, countShopMatches, SHOP_CHOICE_MS, shopPhase, shopRewardSeconds, snapShopCat,
} from "./secretShopGame.ts";

test("el reloj empieza sin salto y solo suma tiempo activo, con límite por fotograma", () => {
  let clock = advanceShopClock({ activeMs: 0, lastFrame: null }, 90000, false);
  assert.equal(clock.activeMs, 0);
  clock = advanceShopClock(clock, 90016, false);
  assert.equal(clock.activeMs, 16);
  clock = advanceShopClock(clock, 190000, false);
  assert.equal(clock.activeMs, 80);
  clock = advanceShopClock(clock, 200000, true);
  assert.equal(clock.lastFrame, null);
  clock = advanceShopClock(clock, 300000, false);
  assert.equal(clock.activeMs, 80);
  clock = advanceShopClock(clock, 300016, false);
  assert.equal(clock.activeMs, 96);
});

test("un reloj detenido, atrasado o inválido no hace avanzar los gatitos", () => {
  const initial = { activeMs: 42, lastFrame: 100 };
  assert.equal(advanceShopClock(initial, 90, false).activeMs, 42);
  assert.deepEqual(advanceShopClock(initial, Number.NaN, false), { activeMs: 42, lastFrame: null });
  assert.equal(shopPhase(42, 1, false), shopPhase(advanceShopClock(initial, 999999, true).activeMs, 1, false));
});

test("el movimiento suave da dos segundos a cada gatito y encaja al más cercano", () => {
  assert.equal(shopPhase(0, 0, false), 0);
  assert.equal(shopPhase(SHOP_CHOICE_MS / 4, 0, false), 0.25);
  assert.equal(snapShopCat(0.49), 0);
  assert.equal(snapShopCat(0.51), 1);
  assert.equal(snapShopCat(2.8), 0);
  assert.equal(snapShopCat(-1), 2);
  assert.equal(shopPhase(SHOP_CHOICE_MS * 3, 2, false), 2);
});

test("movimiento reducido muestra opciones quietas durante dos segundos, sin deriva", () => {
  for (const row of [0, 1, 2]) {
    assert.equal(shopPhase(0, row, true), row);
    assert.equal(shopPhase(SHOP_CHOICE_MS - 1, row, true), row);
    assert.equal(shopPhase(SHOP_CHOICE_MS, row, true), (row + 1) % 3);
    assert.equal(shopPhase(SHOP_CHOICE_MS * 3, row, true), row);
  }
});

test("los tres gatitos completos valen; cualquier pareja da dos y todos distintos uno", () => {
  for (const cat of [0, 1, 2] as const) assert.equal(countShopMatches([cat, cat, cat]), 3);
  assert.equal(countShopMatches([0, 0, 1]), 2);
  assert.equal(countShopMatches([2, 1, 2]), 2);
  assert.equal(countShopMatches([0, 1, 1]), 2);
  assert.equal(countShopMatches([0, 1, 2]), 1);
  assert.equal(countShopMatches([2, 0, 1]), 1);
  assert.deepEqual([0, 1, 2, 3].map((count) => shopRewardSeconds(count as 0 | 1 | 2 | 3)), [0, 0, 5, 12]);
});
