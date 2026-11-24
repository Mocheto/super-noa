import assert from "node:assert/strict";
import test from "node:test";
import { VIEW_HEIGHT } from "./constants.ts";
import { createInitialPlayer, type Player } from "./gameState.ts";
import { peligroMortal, puntosSegurosAlcanzados, seCayo, tocaLava } from "./peligrosPartida.ts";
import type { Level } from "./types";

const base = (overrides: Partial<Level> = {}): Level => ({
  id: "prueba", world: 6, screen: 1, title: "", subtitle: "", theme: "orchard-day", width: 3000, start: { x: 100, y: 398 }, goalX: 2800,
  platforms: [], items: [], enemies: [], rewardBlocks: [], checkpoints: [], ...overrides,
});
const noa = (x: number, y: number, cambios: Partial<Player> = {}): Player => ({ ...createInitialPlayer(base()), x, y, ...cambios });

test("los pinchos perdonan 8 px por cada lado y 16 px arriba; el agua mortal, 5 y 8", () => {
  const pinchos = base({ spikePits: [{ x: 500, y: 456, width: 100, height: 40 }] });
  // Noa mide 42 × 58: sus pies tocan la zona que daña desde y = 456 + 16.
  assert.equal(peligroMortal(pinchos, noa(520, 456 + 16 - 58 + 1)), "pinchos");
  assert.equal(peligroMortal(pinchos, noa(520, 456 + 16 - 58 - 1)), null);
  assert.equal(peligroMortal(pinchos, noa(500 + 100 - 8 + 1, 430)), null);
  assert.equal(peligroMortal(pinchos, noa(500 + 100 - 8 - 2, 430)), "pinchos");
  const agua = base({ deadlyWater: [{ x: 500, y: 456, width: 100, height: 84 }] });
  assert.equal(peligroMortal(agua, noa(520, 456 + 8 - 58 + 1)), "agua");
  assert.equal(peligroMortal(agua, noa(520, 456 + 8 - 58 - 1)), null);
  assert.equal(peligroMortal(base(), noa(520, 430)), null);
});

test("la lava solo hace daño cuando asoma más del 12 %", () => {
  const lava = base({ lavaJets: [{ id: "chorro", x: 100, baseY: 456, width: 60, height: 200, interval: 4, delay: 0 }] });
  const encima = noa(110, 456 - 58 + 2);
  assert.equal(tocaLava(lava, encima, 0.072), false, "al 10 % aún no");
  assert.equal(tocaLava(lava, encima, 0.12), true, "al 17 %, sí");
  assert.equal(tocaLava(lava, noa(110, 300), 1), true);
  assert.equal(tocaLava(lava, noa(110, 300), 3), false, "recogida");
  assert.equal(tocaLava(lava, noa(400, 300), 1), false);
});

test("cada orientación tiene su límite de caída", () => {
  assert.equal(seCayo(base(), noa(0, VIEW_HEIGHT + 120), 0, false), false);
  assert.equal(seCayo(base(), noa(0, VIEW_HEIGHT + 121), 0, false), true);
  const vertical = base({ orientation: "vertical", height: 2600 });
  assert.equal(seCayo(vertical, noa(0, 1500 + VIEW_HEIGHT + 100), 1500, false), false);
  assert.equal(seCayo(vertical, noa(0, 1500 + VIEW_HEIGHT + 101), 1500, false), true);
  const exploracion = base({ orientation: "explore", height: 1400 });
  assert.equal(seCayo(exploracion, noa(0, 1480), 600, true), false);
  assert.equal(seCayo(exploracion, noa(0, 1481), 600, true), true);
});

test("las banderas se toman al pasar su x, en orden, y se reaparece 22 px más allá", () => {
  const level = base({ checkpoints: [400, 900, 1500] });
  assert.deepEqual(puntosSegurosAlcanzados(level, noa(950, 398), -1, false), [
    { tipo: "bandera", indice: 0, x: 422 },
    { tipo: "bandera", indice: 1, x: 922 },
  ]);
  assert.deepEqual(puntosSegurosAlcanzados(level, noa(950, 398), 1, false), []);
});

test("en las subidas el punto seguro se toma al llegar a su altura", () => {
  const level = base({ orientation: "vertical", height: 2600, verticalCheckpoints: [{ x: 440, y: 1880 }, { x: 460, y: 1000 }] });
  assert.deepEqual(puntosSegurosAlcanzados(level, noa(100, 1881), -1, false), []);
  assert.deepEqual(puntosSegurosAlcanzados(level, noa(100, 1880), -1, false), [{ tipo: "vertical", indice: 0, x: 440, y: 1880 - 58 }]);
});

test("en exploración se toma de pie a menos de 70 px de su centro y 8 px de su altura", () => {
  const level = base({ orientation: "explore", height: 1400, verticalCheckpoints: [{ x: 1000, y: 800 }] });
  // El centro de Noa (x + 21) frente al del punto (x + 21).
  const de = (dx: number, dy: number, grounded = true) => puntosSegurosAlcanzados(level, noa(1000 + dx, 800 - 58 + dy, { grounded }), -1, true).length;
  assert.equal(de(69, 0), 1);
  assert.equal(de(70, 0), 0);
  assert.equal(de(0, 7), 1);
  assert.equal(de(0, 8), 0);
  assert.equal(de(0, 0, false), 0);
});

test("banderas y puntos verticales comparten el índice: uno anterior al último no cuenta", () => {
  const level = base({ checkpoints: [400], verticalCheckpoints: [{ x: 100, y: 2000 }, { x: 100, y: 1000 }] });
  assert.deepEqual(puntosSegurosAlcanzados(level, noa(500, 900), -1, false).map((punto) => [punto.tipo, punto.indice]), [["bandera", 0], ["vertical", 1]]);
});
