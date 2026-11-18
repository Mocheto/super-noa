import assert from "node:assert/strict";
import test from "node:test";
import { capaTransicion, createLevelTransition, ENTRADA_SEGUNDOS, SALIDA_SEGUNDOS } from "./levelTransition.ts";
import type { GameSnapshot } from "./types";

test("las transiciones solo consumen tiempo de simulación activa y finalizan una vez", () => {
  for (const delay of [.45, .7, .85, 1.45]) {
    const emitted: GameSnapshot[] = [];
    const finished: GameSnapshot[] = [];
    const snapshot: GameSnapshot = { apples: 2, stickers: ["a"], power: "cat", checkpoint: 2, paused: false };
    const transition = createLevelTransition((final) => emitted.push(final));
    transition.begin(snapshot, delay, (final) => finished.push(final));
    snapshot.stickers.push("posterior");
    transition.advance(delay / 2, true);
    transition.advance(10_000, false);
    assert.equal(finished.length, 0);
    transition.advance(delay / 2, true);
    transition.advance(delay, true);
    assert.equal(finished.length, 1);
    assert.equal(finished[0], emitted[0]);
    assert.deepEqual(finished[0].stickers, ["a"]);
  }
});

test("cancelar una transición evita su callback", () => {
  const transition = createLevelTransition(() => undefined);
  transition.begin({ apples: 0, stickers: [], power: "normal", checkpoint: 0, paused: false }, .45, () => assert.fail("cancelada"));
  transition.cancel();
  transition.advance(1, true);
});

test("el círculo de salida se cierra en 1,2 s sobre Noa y dice ¡BIEN! en la segunda mitad", () => {
  assert.equal(capaTransicion("salida", 3, 500, false), undefined, "antes de los últimos 1,2 s no se dibuja nada");
  const empieza = capaTransicion("salida", SALIDA_SEGUNDOS * 0.99, 500, false);
  const mitad = capaTransicion("salida", SALIDA_SEGUNDOS * 0.4, 500, false);
  const final = capaTransicion("salida", 0, 500, false);
  assert.ok(empieza?.tipo === "circulo" && empieza.radio > 490 && !empieza.bien);
  assert.ok(mitad?.tipo === "circulo" && mitad.radio < 250 && mitad.bien);
  assert.ok(final?.tipo === "circulo" && final.radio === 0);
});

test("el círculo de entrada se abre en 0,9 s y con movimiento tranquilo es un fundido", () => {
  const abre = capaTransicion("entrada", 0.1, 500, false);
  assert.ok(abre?.tipo === "circulo" && abre.radio < 100 && !abre.bien);
  assert.equal(capaTransicion("entrada", ENTRADA_SEGUNDOS, 500, false), undefined);
  const fundido = capaTransicion("entrada", 0.45, 500, true);
  assert.ok(fundido?.tipo === "fundido" && fundido.alfa > 0.4 && fundido.alfa < 0.6);
});
