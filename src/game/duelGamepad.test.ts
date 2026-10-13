import assert from "node:assert/strict";
import test from "node:test";
import { justPressed, readDuelPad } from "./duelGamepad.ts";

test("el mando permite navegar con cruceta o palanca y confirmar una sola vez", () => {
  const buttons = Array.from({ length: 16 }, () => ({ pressed: false }));
  const released = readDuelPad({ buttons, axes: [0, 0] });
  assert.deepEqual(released, [false, false, false, false, false]);
  buttons[15].pressed = true;
  const right = readDuelPad({ buttons, axes: [0, 0] });
  assert.equal(justPressed(right, released, 4), true);
  assert.equal(justPressed(right, right, 4), false);
  buttons[15].pressed = false;
  buttons[0].pressed = true;
  const confirm = readDuelPad({ buttons, axes: [0, -0.8] });
  assert.deepEqual(confirm, [true, true, false, false, false]);
  assert.equal(justPressed(confirm, right, 0), true);
});
