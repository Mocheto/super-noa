import assert from "node:assert/strict";
import test from "node:test";
import { firstConnectedGamepad, readGameplayPad } from "./gamepad.ts";
import { menuDirection, readMenuPad } from "./menuGamepad.ts";

const buttons = () => Array.from({ length: 16 }, () => ({ pressed: false }));

test("el movimiento acepta cruceta, palanca y botones de salto y lana", () => {
  const keys = buttons();
  keys[14].pressed = true;
  keys[0].pressed = true;
  keys[2].pressed = true;
  assert.deepEqual(readGameplayPad({ buttons: keys, axes: [0, 0] }), { left: true, right: false, jump: true, shoot: true, up: false });
  keys[14].pressed = false;
  keys[15].pressed = true;
  assert.deepEqual(readGameplayPad({ buttons: keys, axes: [-0.8, 0] }), { left: true, right: true, jump: true, shoot: true, up: false });
  keys[12].pressed = true;
  assert.equal(readGameplayPad({ buttons: keys, axes: [0, 0] }).up, true);
  keys[12].pressed = false;
  assert.equal(readGameplayPad({ buttons: keys, axes: [0, -.8] }).up, true);
  assert.deepEqual(readGameplayPad(null), { left: false, right: false, jump: false, shoot: false, up: false });
});

test("la navegación por menús actúa una sola vez por pulsación", () => {
  const keys = buttons();
  const released = readMenuPad({ buttons: keys, axes: [0, 0] });
  keys[13].pressed = true;
  const down = readMenuPad({ buttons: keys, axes: [0, 0] });
  assert.equal(menuDirection(down, released), 1);
  assert.equal(menuDirection(down, down), 0);
  keys[13].pressed = false;
  keys[14].pressed = true;
  keys[1].pressed = true;
  keys[9].pressed = true;
  const back = readMenuPad({ buttons: keys, axes: [0, 0] });
  assert.deepEqual(back, [false, false, false, true, false, true, true]);
  assert.equal(menuDirection(back, down), -1);
});

test("se usa el primer mando conectado aunque el puerto cero esté vacío", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const second = { connected: true, index: 1 } as Gamepad;
  try {
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { getGamepads: () => [null, second] } });
    assert.equal(firstConnectedGamepad(), second);
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { getGamepads: () => { throw Error("bloqueado"); } } });
    assert.equal(firstConnectedGamepad(), null);
  } finally {
    if (original) Object.defineProperty(globalThis, "navigator", original);
    else Reflect.deleteProperty(globalThis, "navigator");
  }
});
