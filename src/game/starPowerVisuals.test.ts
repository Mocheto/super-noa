import assert from "node:assert/strict";
import test from "node:test";
import { starPowerLight } from "./starPowerVisuals.ts";

test("Noa vuelve a su color entre destellos locales suaves de 1,5 Hz", () => {
  assert.deepEqual(starPowerLight(0, false), { pulse: 0, brightness: 1, saturation: 1, glow: 0 });
  const bright = starPowerLight(1 / 6, false);
  assert.equal(bright.pulse, 1);
  assert.equal(bright.brightness, 1.8);
  assert.equal(bright.glow, 9);
  assert.equal(starPowerLight(.5, false).brightness, 1);
  let peaks = 0;
  for (let index = 1; index < 1200; index++) {
    const value = starPowerLight(index / 600, false);
    assert.ok(value.brightness >= 1 && value.brightness <= 1.8);
    if (value.pulse > starPowerLight((index - 1) / 600, false).pulse
      && value.pulse >= starPowerLight((index + 1) / 600, false).pulse) peaks++;
  }
  assert.equal(peaks, 3, "tres destellos en dos segundos, sin estrobo rápido");
});

test("movimiento reducido conserva una luz fija sin parpadeo", () => {
  const fixed = starPowerLight(0, true);
  assert.ok(fixed.brightness > 1 && fixed.brightness < 1.8);
  for (const time of [.1, .5, 1, 10, 100]) assert.deepEqual(starPowerLight(time, true), fixed);
});
