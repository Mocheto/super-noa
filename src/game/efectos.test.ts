import assert from "node:assert/strict";
import test from "node:test";
import { crearEfectos, DURACION, drawEfectos } from "./efectos.ts";

function contextoFalso() {
  const posiciones: [number, number][] = [];
  const nada = () => undefined;
  const context = {
    save: nada, restore: nada, beginPath: nada, closePath: nada, fill: nada, stroke: nada, rotate: nada,
    arc: (x: number, y: number) => { posiciones.push([x, y]); },
    translate: (x: number, y: number) => { posiciones.push([x, y]); },
    lineTo: (x: number, y: number) => { posiciones.push([Math.round(x), Math.round(y)]); }, drawImage: nada, globalAlpha: 1, fillStyle: "", strokeStyle: "", lineWidth: 1,
  } as unknown as CanvasRenderingContext2D;
  return { context, posiciones };
}

test("cada efecto dura lo elegido en el prototipo y se suelta al acabar", () => {
  assert.deepEqual(DURACION, { polvo: .35, recoger: .5, fuente: 1.2 });
  const efectos = crearEfectos();
  efectos.lanzar("polvo", 100, 400);
  efectos.lanzar("recoger", 200, 300);
  efectos.lanzar("fuente", 300, 400);
  efectos.avanzar(.4);
  assert.deepEqual(efectos.lista.map((efecto) => efecto.tipo), ["recoger", "fuente"]);
  efectos.avanzar(1);
  assert.equal(efectos.lista.length, 0, "no quedan partículas vivas");
});

test("con movimiento tranquilo las partículas no se mueven: solo se desvanecen", () => {
  for (const tipo of ["polvo", "recoger", "fuente"] as const) {
    const primero = contextoFalso();
    const despues = contextoFalso();
    drawEfectos(primero.context, [{ tipo, x: 300, y: 400, edad: DURACION[tipo] * .1 }], 0, true);
    drawEfectos(despues.context, [{ tipo, x: 300, y: 400, edad: DURACION[tipo] * .8 }], 0, true);
    assert.deepEqual(primero.posiciones, despues.posiciones, `${tipo} quieto`);
    const conMovimiento = contextoFalso();
    drawEfectos(conMovimiento.context, [{ tipo, x: 300, y: 400, edad: DURACION[tipo] * .8 }], 0, false);
    assert.notDeepEqual(primero.posiciones, conMovimiento.posiciones, `${tipo} se mueve sin la opción`);
  }
});
