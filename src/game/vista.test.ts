import assert from "node:assert/strict";
import test from "node:test";
import { VIEW_WIDTH } from "./constants.ts";
import { ANCHO_VERTICAL, ponerVista, recorteObjetivo, vista } from "./vista.ts";

test("en vertical la ventana 4:3 sigue a Noa y deja ver de sobra lo que viene por delante", () => {
  assert.equal(ANCHO_VERTICAL / 540, 4 / 3, "escenario 4:3");
  for (let noaX = 0; noaX <= VIEW_WIDTH; noaX += 40) {
    const izquierda = recorteObjetivo(noaX);
    assert.ok(izquierda >= 0 && izquierda + ANCHO_VERTICAL <= VIEW_WIDTH, "la ventana no se sale del lienzo");
    assert.ok(noaX >= izquierda && noaX <= izquierda + ANCHO_VERTICAL, "Noa siempre se ve");
  }
  // La cámara deja a Noa a unas 345 unidades del borde izquierdo: por delante se ven más de 400, más que un salto largo (310).
  const noa = 345;
  assert.ok(recorteObjetivo(noa) + ANCHO_VERTICAL - noa > 400);
});

test("la vista visible vuelve a ser el lienzo entero fuera del vertical", () => {
  ponerVista(120, ANCHO_VERTICAL);
  assert.deepEqual(vista, { izquierda: 120, derecha: 840 });
  ponerVista(0, VIEW_WIDTH);
  assert.deepEqual(vista, { izquierda: 0, derecha: VIEW_WIDTH });
});
