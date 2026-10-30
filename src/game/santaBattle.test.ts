import assert from "node:assert/strict";
import test from "node:test";
import { createSantaBattle, SANTA_PLATFORMS, stepSantaBattle } from "./santaBattle.ts";
const idle = { left: false, right: false, jumpPressed: false, jumpHeld: true };
const dt = 1 / 60;

test("caminar es continuo, el salto usa gravedad y admite solo un segundo impulso", () => {
  const s = createSantaBattle();
  for (let i = 0; i < 30; i++) stepSantaBattle(s, { ...idle, right: true }, dt);
  assert.ok(Math.abs(s.player.x - 225) < .001);
  assert.deepEqual(stepSantaBattle(s, { ...idle, jumpPressed: true }, dt), ["jump"]);
  assert.ok(s.player.vy < 0);
  const y = s.player.y;
  for (let i = 0; i < 10; i++) stepSantaBattle(s, idle, dt);
  assert.ok(s.player.y < y);
  assert.deepEqual(stepSantaBattle(s, { ...idle, jumpPressed: true }, dt), ["jump"]);
  assert.ok(!stepSantaBattle(s, { ...idle, jumpPressed: true }, dt).includes("jump"));
  for (let i = 0; i < 120; i++) stepSantaBattle(s, idle, dt);
  assert.equal(s.player.grounded, true);
  assert.equal(s.player.jumps, 0);
});

test("solo caer cruzando la cabeza produce un golpe y un rebote, nunca pulsar cerca", () => {
  const s = createSantaBattle();
  s.player.x = s.boss.x + 20;
  stepSantaBattle(s, { ...idle, jumpPressed: true }, dt);
  assert.equal(s.hits, 0);
  assert.equal(s.lives, 2, "tocar el cuerpo hace daño");
  s.player.x = s.boss.x + 20;
  s.player.y = s.boss.y - s.player.height - 2;
  s.player.vy = 180;
  const events = stepSantaBattle(s, idle, dt);
  assert.ok(events.includes("stomp"));
  assert.equal(s.hits, 1);
  assert.ok(s.player.vy < 0);
  assert.ok(s.boss.stun > 0);
  s.player.y = s.boss.y - s.player.height - 2; s.player.vy = 180;
  stepSantaBattle(s, idle, dt);
  assert.equal(s.hits, 1, "la misma caída no puede descontar dos golpes");
  s.boss.stun = 0; s.player.y = s.boss.y - s.player.height - 2; s.player.vy = 180;
  stepSantaBattle(s, idle, dt);
  assert.equal(s.status, "won");
});

test("las repisas sostienen a Noa al caer y se atraviesan al subir", () => {
  const s = createSantaBattle(), shelf = SANTA_PLATFORMS[0];
  s.player.x = shelf.x + 20; s.player.y = shelf.y - s.player.height - 2; s.player.vy = 180;
  stepSantaBattle(s, idle, dt);
  assert.equal(s.player.y + s.player.height, shelf.y);
  assert.equal(s.player.grounded, true);
  s.player.y = shelf.y + 2; s.player.vy = -200;
  stepSantaBattle(s, idle, dt);
  assert.equal(s.player.grounded, false);
  assert.ok(s.player.vy < 0);
});

test("los regalos tienen aviso, cadencia estable y colisión que respeta la altura", () => {
  const s = createSantaBattle();
  s.boss.attackIn = .5;
  for (let i = 0; i < 20; i++) stepSantaBattle(s, { ...idle, right: i % 2 === 0 }, dt);
  assert.equal(s.gifts.length, 0);
  for (let i = 0; i < 12; i++) stepSantaBattle(s, idle, dt);
  assert.equal(s.gifts.length, 1);
  const gift = s.gifts[0];
  s.player.x = gift.x; s.player.y = 200; s.player.vy = 0;
  stepSantaBattle(s, idle, dt);
  assert.equal(s.lives, 3, "un regalo por debajo no golpea a Noa en el aire");
  s.player.y = 342; stepSantaBattle(s, idle, dt);
  assert.equal(s.lives, 2);
  s.gifts.push({ ...gift, x: s.player.x }); stepSantaBattle(s, idle, dt);
  assert.equal(s.lives, 2, "hay tiempo de protección después de un golpe");
});

test("la derrota necesita tres golpes; el reintento restaura toda la pelea", () => {
  const s = createSantaBattle();
  for (let i = 0; i < 3; i++) {
    s.player.invincible = 0; s.player.x = s.boss.x; s.player.y = 342;
    stepSantaBattle(s, idle, dt);
  }
  assert.equal(s.status, "lost");
  const before = structuredClone(s);
  assert.deepEqual(stepSantaBattle(s, { ...idle, jumpPressed: true }, dt), []);
  assert.deepEqual(s, before);
  const retry = createSantaBattle();
  assert.equal(retry.hits, 0); assert.equal(retry.lives, 3);
  assert.equal(retry.player.grounded, true); assert.equal(retry.gifts.length, 0);
});

test("se puede ganar jugando con movimiento y saltos, sin modificar posiciones", () => {
  const s = createSantaBattle();
  for (let i = 0; i < 1800 && s.status === "playing"; i++) {
    const distance = s.boss.x + s.boss.width / 2 - s.player.x - s.player.width / 2;
    stepSantaBattle(s, { left: distance < -12, right: distance > 12, jumpPressed: s.player.grounded && Math.abs(distance) < 240, jumpHeld: true }, dt);
  }
  assert.equal(s.status, "won");
  assert.equal(s.hits, 2);
  assert.ok(s.lives > 0);
});
