import assert from "node:assert/strict";
import test from "node:test";
import { camaraAlReaparecer, camaraInicial, encuadreVertical, metaAlcanzada, seguirCamara, superficieMeta } from "./camaraPartida.ts";
import { VIEW_HEIGHT, VIEW_WIDTH } from "./constants.ts";
import { createInitialPlayer } from "./gameState.ts";
import { levels } from "./levels.ts";
import type { Level } from "./types";

const DELTA = 1 / 60;
const pantalla = (id: string) => levels.find((level) => level.id === id)!;
const base = (overrides: Partial<Level> = {}): Level => ({
  id: "prueba", world: 1, screen: 1, title: "", subtitle: "", theme: "orchard-day", width: 3000, start: { x: 100, y: 398 }, goalX: 2800,
  platforms: [
    { x: 2700, y: 300, width: 200, height: 20, kind: "branch" },
    { x: 0, y: 456, width: 3000, height: 84, kind: "ground" },
  ],
  items: [], enemies: [], rewardBlocks: [], checkpoints: [], ...overrides,
});

test("la superficie de la meta es la primera plataforma bajo el banderín, o la más alta en vertical y en el mundo 8", () => {
  assert.equal(superficieMeta(base()), 300);
  assert.equal(superficieMeta(base({ platforms: [...base().platforms].reverse() })), 456);
  assert.equal(superficieMeta(base({ world: 8, platforms: [...base().platforms].reverse() })), 300);
  assert.equal(superficieMeta(base({ orientation: "vertical", height: 2000, platforms: [...base().platforms].reverse() })), 300);
  assert.equal(superficieMeta(base({ platforms: [] })), 456);
  for (const level of levels) assert.ok(Number.isFinite(superficieMeta(level)), level.id);
});

test("en vertical la meta se alcanza a la altura de la cima y a menos de 130 px del banderín", () => {
  const level = pantalla("4-2");
  const player = createInitialPlayer(level);
  const cima = level.goalY ?? superficieMeta(level);
  player.y = cima;
  player.x = level.goalX - player.width / 2 + 129;
  assert.equal(metaAlcanzada(level, player, superficieMeta(level)), true);
  player.x += 2;
  assert.equal(metaAlcanzada(level, player, superficieMeta(level)), false);
  player.x = level.goalX - player.width / 2;
  player.y = cima + 1;
  assert.equal(metaAlcanzada(level, player, superficieMeta(level)), false);
});

test("la cámara vertical empieza abajo, sube con Noa y nunca baja al caer", () => {
  const level = pantalla("4-2");
  const player = createInitialPlayer(level);
  let camara = camaraInicial(level, player);
  assert.equal(camara.y, (level.height ?? VIEW_HEIGHT) - VIEW_HEIGHT);
  player.y -= 600;
  for (let paso = 0; paso < 120; paso++) camara = seguirCamara(level, player, camara, DELTA, { salaX: null, exploracion: false });
  const arriba = camara.y;
  assert.ok(arriba < (level.height ?? VIEW_HEIGHT) - VIEW_HEIGHT && Math.abs(arriba - encuadreVertical(level, player.y)) < 5);
  player.y += 500;
  for (let paso = 0; paso < 120; paso++) camara = seguirCamara(level, player, camara, DELTA, { salaX: null, exploracion: false });
  assert.equal(camara.y, arriba);
  // Si reaparece por debajo de la vista, baja a buscarla; si se la ve, no se mueve.
  assert.equal(camaraAlReaparecer(level, player, camara.y), encuadreVertical(level, player.y));
  assert.equal(camaraAlReaparecer(level, { ...player, y: arriba + 100 }, arriba), arriba);
});

test("en una sala la cámara queda fija en la sala y se desliza deprisa a la siguiente", () => {
  const level = pantalla("2-2");
  const player = createInitialPlayer(level);
  let camara = { x: 0, y: 0 };
  player.x = 700;
  for (let paso = 0; paso < 60; paso++) camara = seguirCamara(level, player, camara, DELTA, { salaX: 0, exploracion: false });
  assert.equal(camara.x, 0);
  camara = seguirCamara(level, player, camara, DELTA, { salaX: 960, exploracion: false });
  assert.ok(Math.abs(camara.x - 960 * 0.15) < 1e-9, "a 9 por segundo, el 15 % del camino en un paso");
  for (let paso = 0; paso < 60; paso++) camara = seguirCamara(level, player, camara, DELTA, { salaX: 960, exploracion: false });
  assert.ok(Math.abs(camara.x - 960) < 1);
});

test("fuera de las salas sigue a Noa 330 px por detrás, sin salirse de la pantalla", () => {
  const level = base();
  const player = createInitialPlayer(level);
  let camara = { x: 0, y: 0 };
  player.x = 1500;
  for (let paso = 0; paso < 300; paso++) camara = seguirCamara(level, player, camara, DELTA, { salaX: null, exploracion: false });
  assert.ok(Math.abs(camara.x - 1170) < 1);
  player.x = 2990;
  for (let paso = 0; paso < 300; paso++) camara = seguirCamara(level, player, camara, DELTA, { salaX: null, exploracion: false });
  assert.ok(Math.abs(camara.x - (level.width - VIEW_WIDTH)) < 1);
  assert.equal(camara.y, 0);
});

test("en exploración sigue a Noa en los dos ejes", () => {
  const level = pantalla("3-2");
  const player = createInitialPlayer(level);
  let camara = camaraInicial(level, player);
  const antes = { ...camara };
  player.x += 900;
  player.y -= 300;
  for (let paso = 0; paso < 120; paso++) camara = seguirCamara(level, player, camara, DELTA, { salaX: null, exploracion: true });
  assert.ok(camara.x > antes.x + 500);
  assert.ok(camara.y < antes.y - 100);
});
