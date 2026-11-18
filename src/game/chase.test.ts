import assert from "node:assert/strict";
import test from "node:test";
import { levels } from "./levels.ts";
import { reachable } from "./levelBeats.ts";
import { CHASE_TALK_EVERY, chaseGoalX, chaseTrail, createChaseState, stepChase } from "./chase.ts";
import { chaseTestLevel } from "./testScreens.ts";
import { textoLienzo } from "../textos/index.ts";
import type { Level } from "./types";

const chaseLevels: Level[] = [...levels.filter((level) => level.chase), chaseTestLevel];
const beatOrder = ["presentation", "development", "twist", "finale"] as const;
const noa = (x: number, bottom = 456) => ({ x: x - 21, y: bottom - 58, width: 42, height: 58 });

test("las paradas van por tramos, con frases cortas, y la última es el rincón y la meta", () => {
  for (const level of chaseLevels) {
    const chase = level.chase!;
    assert.ok(chase.stops.length >= 5 && chase.stops.length <= 12, level.id);
    const order = chase.stops.map((stop) => beatOrder.indexOf(stop.beat));
    assert.deepEqual([...order].sort((a, b) => a - b), order, `${level.id}: tramos fuera de orden`);
    for (const beat of beatOrder) assert.ok(chase.stops.some((stop) => stop.beat === beat), `${level.id}: falta una parada de ${beat}`);
    assert.equal(chase.stops.at(-1)!.beat, "finale");
    for (const stop of chase.stops) assert.ok(stop.talk.length >= 1 && stop.talk.length <= 30, `${level.id}: «${stop.talk}»`);
    assert.equal(level.goalX, chaseGoalX(level), `${level.id}: la meta es el rincón`);
    assert.ok(!level.enemies.some((enemy) => enemy.kind === chase.runner), `${level.id}: el animal travieso no puede ser enemigo en su pantalla`);
  }
});

test("cada parada se apoya en una superficie y se alcanza desde la anterior", () => {
  for (const level of chaseLevels) {
    const stops = level.chase!.stops;
    stops.forEach((stop, index) => {
      assert.ok(level.platforms.some((p) => Math.abs(p.y - stop.y) <= 2 && p.x <= stop.x - 20 && p.x + p.width >= stop.x + 20),
        `${level.id}: la parada ${index + 1} flota`);
      if (index === 0) return;
      const previous = stops[index - 1];
      assert.ok(reachable(level, { from: previous.x, fromTop: previous.y, to: stop.x, toTop: stop.y }), `${level.id}: la parada ${index + 1} no se alcanza`);
    });
  }
});

test("desde cada checkpoint se llega al rincón, y el rincón no tiene salida", () => {
  for (const level of chaseLevels) {
    const corner = level.chase!.stops.at(-1)!;
    for (const checkpoint of level.checkpoints) {
      assert.ok(reachable(level, { from: checkpoint + 22, to: corner.x, toTop: corner.y }), `${level.id}: el rincón no se alcanza desde ${checkpoint}`);
    }
    const wallBehind = level.platforms.some((p) => (p.kind ?? "").endsWith("wall") && p.x > corner.x && p.x - corner.x < 200 && p.y < corner.y - 150);
    assert.ok(level.width - corner.x <= 250 || wallBehind, `${level.id}: detrás del rincón hay salida`);
  }
});

test("el animal espera hasta que Noa se acerca, corre a la parada siguiente y repite su frase", () => {
  const chase = chaseTestLevel.chase!;
  const state = createChaseState(chase);
  assert.deepEqual(stepChase(chase, state, noa(100), 10), [{ kind: "talk", text: chase.stops[0].talk }].slice(0, 10 >= CHASE_TALK_EVERY ? 1 : 0));
  assert.equal(state.stop, 0, "lejos, nunca avanza");
  assert.deepEqual(stepChase(chase, state, noa(chase.stops[0].x - 150), 1 / 60).map((e) => e.kind), ["run"]);
  assert.equal(state.stop, 1);
  for (let i = 0; i < 400 && state.from; i += 1) stepChase(chase, state, noa(100), 1 / 60);
  assert.equal(state.x, chase.stops[1].x);
  assert.equal(state.facing, -1, "espera mirando a Noa");
  assert.equal(chaseTrail(chase, state).length, 4);
  // Tras perder una vida Noa reaparece lejos: el animal sigue esperando en su parada.
  for (let i = 0; i < 600; i += 1) stepChase(chase, state, noa(1000), 1 / 60);
  assert.equal(state.stop, 1);
});

test("los saltos hacen un arco y en el rincón se pilla al animal", () => {
  const chase = chaseTestLevel.chase!;
  const state = createChaseState(chase);
  state.stop = 3; state.x = chase.stops[3].x; state.y = chase.stops[3].y;
  stepChase(chase, state, noa(state.x - 100), 1 / 60);
  let highest = state.y;
  for (let i = 0; i < 300 && state.from; i += 1) {
    stepChase(chase, state, noa(100), 1 / 60);
    highest = Math.min(highest, state.y);
  }
  assert.ok(highest < chase.stops[4].y, "sube en arco por encima de la parada");
  state.stop = chase.stops.length - 1; state.x = chase.stops.at(-1)!.x; state.y = 456;
  assert.deepEqual(stepChase(chase, state, noa(state.x - 120), 1 / 60), []);
  assert.deepEqual(stepChase(chase, state, noa(state.x - 20), 1 / 60), [{ kind: "caught", text: textoLienzo("partida.lienzo.tuLana.rotulo") }]);
  assert.ok(state.caught);
  assert.deepEqual(chaseTrail(chase, state), []);
});
