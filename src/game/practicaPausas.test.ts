import assert from "node:assert/strict";
import test from "node:test";
import { createPracticaConPausas } from "./practicaPausas.ts";

test("la práctica se para en cada pieza nueva y sigue al tocar SIGUE", () => {
  const practica = createPracticaConPausas([{ pulso: 12, pieza: "duo" }, { pulso: 4, pieza: "flor" }]);
  assert.equal(practica.llegar(3), undefined);
  assert.equal(practica.llegar(4)?.pieza, "flor", "se ordenan por pulso");
  assert.equal(practica.llegar(9)?.pieza, "flor", "sigue parada hasta tocar SIGUE");
  practica.seguir();
  assert.equal(practica.llegar(9), undefined);
  assert.equal(practica.llegar(20)?.pieza, "duo", "un salto de pulsos no se salta la parada");
  practica.seguir();
  assert.equal(practica.quedan, 0);
  assert.equal(practica.llegar(40), undefined);
});
