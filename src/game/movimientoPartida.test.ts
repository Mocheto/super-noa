import assert from "node:assert/strict";
import test from "node:test";
import {
  COYOTE_SECONDS, empujeViento, GRAVITY, JUMP_BUFFER_SECONDS, JUMP_SPEED, MOVE_SPEED, pisaHielo, resolverSalto, SWIM_SPEED,
  velocidadHorizontal, type Saltador,
} from "./gameplay.ts";
import type { Platform } from "./types";

const DELTA = 1 / 60;
const noa = (cambios: Partial<Saltador> = {}): Saltador => ({
  x: 100, y: 398, width: 42, height: 58, vx: 0, vy: 0, grounded: true, facing: 1,
  coyote: 0, jumpBuffer: 0, jumpsUsed: 0, springLaunch: false, doubleJumpFx: 0, ...cambios,
});
const quieto = { left: false, right: false, swimming: false, ice: false, steerLock: 0 };
const suelta = { jump: false, pulsado: false, swimming: false, inUpdraft: false };
const pulsa = { jump: true, pulsado: true, swimming: false, inUpdraft: false };

test("pisa hielo solo de pie y a menos de 6 px de la superficie del hielo", () => {
  const hielo: Platform[] = [{ x: 0, y: 456, width: 500, height: 40, kind: "ice-ground" }];
  assert.equal(pisaHielo(noa(), hielo), true);
  assert.equal(pisaHielo(noa({ grounded: false }), hielo), false);
  assert.equal(pisaHielo(noa({ y: 390 }), hielo), false);
  assert.equal(pisaHielo(noa({ x: 600 }), hielo), false);
  assert.equal(pisaHielo(noa(), [{ ...hielo[0], kind: "ground" }]), false);
});

test("andando va a su velocidad en el acto y frena casi en seco; en el hielo acelera 520 px/s² y frena a 0,32^Δ", () => {
  assert.deepEqual(velocidadHorizontal(noa(), { ...quieto, right: true }, DELTA), { vx: MOVE_SPEED, facing: 1 });
  assert.deepEqual(velocidadHorizontal(noa(), { ...quieto, left: true, swimming: true }, DELTA), { vx: -SWIM_SPEED, facing: -1 });
  assert.ok(velocidadHorizontal(noa({ vx: 250 }), quieto, DELTA).vx < 250 * 0.9);
  assert.equal(velocidadHorizontal(noa({ vx: 250 }), { ...quieto, left: true, right: true }, DELTA).vx, 250 * Math.pow(0.0008, DELTA));
  assert.equal(velocidadHorizontal(noa(), { ...quieto, right: true, ice: true }, DELTA).vx, 520 * DELTA);
  assert.equal(velocidadHorizontal(noa({ vx: 250 }), { ...quieto, ice: true }, DELTA).vx, 250 * Math.pow(0.32, DELTA));
});

test("la nube que rebota bloquea la dirección mientras dure su bloqueo", () => {
  assert.deepEqual(velocidadHorizontal(noa({ vx: -300, facing: -1 }), { ...quieto, right: true, steerLock: 0.2 }, DELTA), { vx: -300, facing: -1 });
});

test("el viento empuja fuera del agua sin pasar de 360 px/s", () => {
  assert.equal(empujeViento(0, { direction: 1, strength: 600 }, false, 0.5), 300);
  assert.equal(empujeViento(300, { direction: 1, strength: 600 }, false, 0.5), 360);
  assert.equal(empujeViento(0, { direction: -1, strength: 600 }, true, 0.5), 0);
  assert.equal(empujeViento(42, undefined, false, 0.5), 42);
});

test("salta desde el suelo, y con coyote justo después de dejarlo, pero no más tarde", () => {
  const suelo = noa();
  assert.equal(resolverSalto(suelo, pulsa, DELTA), "salto");
  assert.equal(suelo.vy, -JUMP_SPEED);
  assert.equal(suelo.jumpsUsed, 1);
  const cayendo = noa({ grounded: false, coyote: COYOTE_SECONDS });
  for (let paso = 0; paso < 5; paso++) resolverSalto(cayendo, suelta, DELTA);
  assert.equal(resolverSalto(cayendo, pulsa, DELTA), "salto", "a los 0,1 s aún vale");
  const tarde = noa({ grounded: false, coyote: COYOTE_SECONDS });
  for (let paso = 0; paso < 8; paso++) resolverSalto(tarde, suelta, DELTA);
  // Sin coyote y sin haber saltado, la pulsación espera en el búfer.
  assert.equal(resolverSalto(tarde, pulsa, DELTA), null);
  assert.ok(tarde.jumpBuffer > 0 && tarde.jumpBuffer < JUMP_BUFFER_SECONDS);
});

test("el búfer guarda la pulsación 0,13 s: si aterriza a tiempo, salta", () => {
  // Se descuenta también en el paso de la pulsación y en el del aterrizaje: aterrizar hasta 6 pasos después vale.
  const aire = noa({ grounded: false, jumpsUsed: 2 });
  resolverSalto(aire, pulsa, DELTA);
  for (let paso = 0; paso < 5; paso++) resolverSalto(aire, { ...suelta, jump: true }, DELTA);
  Object.assign(aire, { grounded: true, jumpsUsed: 0 });
  assert.equal(resolverSalto(aire, { ...suelta, jump: true }, DELTA), "salto");
  const tarde = noa({ grounded: false, jumpsUsed: 2 });
  resolverSalto(tarde, pulsa, DELTA);
  for (let paso = 0; paso < 7; paso++) resolverSalto(tarde, { ...suelta, jump: true }, DELTA);
  Object.assign(tarde, { grounded: true, jumpsUsed: 0 });
  assert.equal(resolverSalto(tarde, { ...suelta, jump: true }, DELTA), null);
});

test("el doble salto es al 94 % y solo uno", () => {
  const aire = noa({ grounded: false, jumpsUsed: 1, vy: 100 });
  assert.equal(resolverSalto(aire, pulsa, DELTA), "doble");
  assert.equal(aire.vy, -JUMP_SPEED * 0.94);
  assert.equal(aire.doubleJumpFx, 0.38);
  assert.equal(resolverSalto(aire, pulsa, DELTA), null);
});

test("soltar el botón subiendo deprisa corta el salto, salvo lanzada por un muelle", () => {
  const corto = noa({ grounded: false, jumpsUsed: 1, vy: -500 });
  resolverSalto(corto, suelta, DELTA);
  assert.equal(corto.vy, -500 + GRAVITY * 1.4 * DELTA);
  const sostenido = noa({ grounded: false, jumpsUsed: 1, vy: -500 });
  resolverSalto(sostenido, { ...suelta, jump: true }, DELTA);
  assert.equal(sostenido.vy, -500);
  const muelle = noa({ grounded: false, jumpsUsed: 1, vy: -900, springLaunch: true });
  resolverSalto(muelle, suelta, DELTA);
  assert.equal(muelle.vy, -900);
});

test("en el agua cada pulsación es una brazada a −190 y se puede volver a saltar al salir", () => {
  const agua = noa({ grounded: false, jumpsUsed: 2, springLaunch: true, vy: 80 });
  assert.equal(resolverSalto(agua, { ...pulsa, swimming: true }, DELTA), null);
  assert.equal(agua.vy, -190);
  assert.equal(agua.jumpsUsed, 0);
  assert.equal(agua.springLaunch, false);
  assert.equal(agua.jumpBuffer, 0);
});

test("en una corriente de aire se salta sin suelo", () => {
  assert.equal(resolverSalto(noa({ grounded: false }), { ...pulsa, inUpdraft: true }, DELTA), "salto");
});
