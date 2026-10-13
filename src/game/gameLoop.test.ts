import assert from "node:assert/strict";
import test from "node:test";
import { createGameLoop } from "./gameLoop.ts";

test("la física usa pasos constantes y se detiene durante la pausa", () => {
  const pending = new Map<number, FrameRequestCallback>();
  let nextId = 0;
  const oldRequest = globalThis.requestAnimationFrame;
  const oldCancel = globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame = (callback) => { pending.set(++nextId, callback); return nextId; };
  globalThis.cancelAnimationFrame = (id) => { pending.delete(id); };
  const steps: number[] = [];
  let renders = 0;
  const next = (time: number) => {
    const [id, callback] = pending.entries().next().value!;
    pending.delete(id);
    callback(time);
  };
  try {
    const loop = createGameLoop((delta) => steps.push(delta), () => { renders += 1; }, () => undefined);
    loop.setRunning(true);
    next(100);
    next(134);
    assert.equal(steps.length, 2);
    assert.ok(steps.every((delta) => delta === 1 / 60));
    loop.setRunning(false);
    assert.equal(pending.size, 0);
    assert.equal(renders, 3);
    loop.setRunning(true);
    next(10_000);
    assert.equal(steps.length, 2, "reanudar no debe recuperar el tiempo de pausa");
    loop.stop();
    assert.equal(pending.size, 0);
  } finally {
    globalThis.requestAnimationFrame = oldRequest;
    globalThis.cancelAnimationFrame = oldCancel;
  }
});
