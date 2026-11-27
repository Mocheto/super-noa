import assert from "node:assert/strict";
import test from "node:test";
import { emptyProgress } from "./progress.ts";
import { ganarRegaloDePantalla } from "./progressAcciones.ts";

const ahora = new Date(2026, 10, 30, 10);
const mundoUno = Object.fromEntries(["1-1", "1-2", "1-3"].map((id) => [id, { completed: true, bestApples: 0 }]));

test("sin casa no llega ningún regalo; con el mundo 1 completo, sí", () => {
  assert.equal(ganarRegaloDePantalla(emptyProgress, ahora), emptyProgress);
  const conCasa = { ...emptyProgress, levelStats: mundoUno };
  const ganado = ganarRegaloDePantalla(conCasa, ahora);
  assert.equal(ganado.regalos?.recibidos, 1);
  assert.equal(ganarRegaloDePantalla(ganado, ahora), ganado);
});
