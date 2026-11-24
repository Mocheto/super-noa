import assert from "node:assert/strict";
import test from "node:test";
import { aterrizar, golpearCajas, type Previo } from "./colisionPartida.ts";
import { SKY_BOUNCE_SPEED, SPRING_SPEED } from "./gameplay.ts";
import { createInitialPlayer, type Player } from "./gameState.ts";
import { levels } from "./levels.ts";
import type { Platform, RewardBlock } from "./types";

const ctx = { rebotesNube: 0, bloqueoGiro: 0, apoyos: [], ascensores: [], idsAscensor: [] };
/** Noa con los pies en `pies`, cayendo a `vy`, que en el paso anterior tenía los pies en `antes`. */
function cayendo(pies: number, vy: number, antes: number, x = 100): { player: Player; previo: Previo } {
  const player = { ...createInitialPlayer(levels[0]), x, y: pies - 58, vy, grounded: false, jumpsUsed: 1 };
  return { player, previo: { y: antes - 58, bottom: antes, grounded: false } };
}
const suelo: Platform = { x: 0, y: 456, width: 500, height: 84, kind: "ground" };

test("aterriza al cruzar la superficie cayendo, y se queda de pie", () => {
  const { player, previo } = cayendo(462, 300, 450);
  const resultado = aterrizar(player, [suelo], previo, ctx);
  assert.equal(player.y, 456 - 58);
  assert.equal(player.vy, 0);
  assert.equal(player.grounded, true);
  assert.equal(player.jumpsUsed, 0);
  assert.deepEqual(resultado.muelles, []);
});

test("el muelle lanza solo al caer sobre él, no al pasar andando", () => {
  const muelle: Platform = { x: 0, y: 456, width: 200, height: 20, kind: "spring" };
  const salto = cayendo(462, 300, 450);
  const resultado = aterrizar(salto.player, [muelle], salto.previo, ctx);
  assert.equal(salto.player.vy, -SPRING_SPEED);
  assert.equal(salto.player.springLaunch, true);
  assert.equal(salto.player.jumpsUsed, 2);
  assert.deepEqual(resultado.muelles, [{ x: 0, nube: false }]);
  const andando = { player: { ...salto.player, y: 456 - 58, vy: 0, grounded: true }, previo: { y: 456 - 58, bottom: 456, grounded: true } };
  assert.deepEqual(aterrizar(andando.player, [muelle], andando.previo, ctx).muelles, []);
});

test("la nube que rebota alterna el lado con sus rebotes y su x, y bloquea el giro 0,42 s", () => {
  const nube: Platform = { x: 100, y: 456, width: 120, height: 30, kind: "sky-bounce" };
  const lados: number[] = [];
  let rebotes = 0;
  for (let vez = 0; vez < 3; vez++) {
    const { player, previo } = cayendo(462, 300, 450, 120);
    const resultado = aterrizar(player, [nube], previo, { ...ctx, rebotesNube: rebotes });
    assert.equal(player.vy, -SKY_BOUNCE_SPEED);
    assert.equal(resultado.bloqueoGiro, .42);
    assert.deepEqual(resultado.muelles, [{ x: 100, nube: true }]);
    rebotes = resultado.rebotesNube;
    lados.push(player.vx);
  }
  assert.equal(rebotes, 3);
  assert.deepEqual(lados, [-330, 330, -330]);
  const otraX = cayendo(462, 300, 450, 120);
  aterrizar(otraX.player, [{ ...nube, x: 101 }], otraX.previo, ctx);
  assert.equal(otraX.player.vx, 330);
});

test("al subir, Noa se da con el techo de las paredes pero atraviesa las plataformas", () => {
  const pared: Platform = { x: 0, y: 200, width: 300, height: 100, kind: "cave-wall" };
  const subiendo = { player: { ...createInitialPlayer(levels[0]), x: 100, y: 295, vy: -400 }, previo: { y: 305, bottom: 363, grounded: false } };
  aterrizar(subiendo.player, [pared], subiendo.previo, ctx);
  assert.equal(subiendo.player.y, 300);
  assert.equal(subiendo.player.vy, 0);
  const rama = { player: { ...createInitialPlayer(levels[0]), x: 100, y: 295, vy: -400 }, previo: { y: 305, bottom: 363, grounded: false } };
  aterrizar(rama.player, [{ ...pared, kind: "branch" }], rama.previo, ctx);
  assert.equal(rama.player.y, 295);
  assert.equal(rama.player.vy, -400);
});

test("dice en qué apoyo o ascensor se ha quedado de pie", () => {
  const apoyo = { ...suelo, id: "rueda" };
  const ascensor: Platform = { x: 0, y: 456, width: 500, height: 20, kind: "sky-lift-station" };
  const encima = cayendo(462, 300, 450);
  assert.equal(aterrizar(encima.player, [apoyo], encima.previo, { ...ctx, apoyos: [apoyo] }).apoyo, "rueda");
  const enAscensor = cayendo(462, 300, 450);
  assert.equal(aterrizar(enAscensor.player, [ascensor], enAscensor.previo, { ...ctx, ascensores: [ascensor], idsAscensor: ["ascensor-1"] }).ascensor, "ascensor-1");
});

test("una caja golpeada desde abajo rebota a Noa a 95 px/s y da su premio una sola vez", () => {
  const caja: RewardBlock = { id: "caja-1", x: 100, y: 250, reward: "apple" } as RewardBlock;
  const golpeadas = new Set<string>();
  const golpe = () => {
    const player = { ...createInitialPlayer(levels[0]), x: 110, y: 296, vy: -400 };
    return { player, nuevas: golpearCajas(player, [caja], golpeadas, { y: 305, bottom: 363 }) };
  };
  const primero = golpe();
  assert.deepEqual(primero.nuevas.map((block) => block.id), ["caja-1"]);
  assert.equal(primero.player.y, 298);
  assert.equal(primero.player.vy, 95);
  assert.deepEqual(golpe().nuevas, []);
  assert.deepEqual([...golpeadas], ["caja-1"]);
});

test("encima de una caja se puede estar de pie", () => {
  const caja: RewardBlock = { id: "caja-1", x: 100, y: 250, reward: "apple" } as RewardBlock;
  const { player, previo } = cayendo(255, 200, 245, 110);
  assert.deepEqual(golpearCajas(player, [caja], new Set(), previo), []);
  assert.equal(player.y, 250 - 58);
  assert.equal(player.grounded, true);
});
