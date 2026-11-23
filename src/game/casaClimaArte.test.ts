import assert from "node:assert/strict";
import test from "node:test";
import { CAE_LLUVIA, CRISTALES_VENTANA, particula, pintarClima, ZONA_HABITACION, ZONA_JARDIN } from "./casaClimaArte.ts";

function contextoFalso() {
  const rects: number[][] = [];
  const nada = () => undefined;
  const contexto = {
    save: nada, restore: nada, beginPath: nada, rect: nada, clip: nada, arc: nada, stroke: nada,
    fillRect: (...args: number[]) => { rects.push(args); }, fillStyle: "", strokeStyle: "", lineWidth: 1, globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;
  return { contexto, rects };
}

test("los cristales de la ventana caben en la caída de la habitación", () => {
  const { caida } = ZONA_HABITACION;
  for (const c of CRISTALES_VENTANA) assert.ok(c.x >= caida.x && c.y >= caida.y && c.x + c.ancho <= caida.x + caida.ancho && c.y + c.alto <= caida.y + caida.alto);
});

test("gotas y copos se quedan en su zona y caen con el tiempo", () => {
  for (const zona of [ZONA_HABITACION, ZONA_JARDIN]) {
    for (let i = 0; i < zona.gotas; i++) {
      for (const segundos of [0, 0.37, 5.2]) {
        const { x, y } = particula(zona, i, segundos, CAE_LLUVIA, 14);
        assert.ok(x >= zona.caida.x && x <= zona.caida.x + zona.caida.ancho);
        assert.ok(y >= zona.caida.y - 14 && y <= zona.caida.y + zona.caida.alto);
      }
    }
  }
  const antes = particula(ZONA_JARDIN, 3, 0, CAE_LLUVIA, 14);
  const despues = particula(ZONA_JARDIN, 3, 0.1, CAE_LLUVIA, 14);
  assert.ok(despues.y > antes.y, "cae");
});

test("con sol no se pinta nada; con movimiento tranquilo, gotas y copos quietos", () => {
  const sol = contextoFalso();
  pintarClima(sol.contexto, "sol", ZONA_HABITACION, 3, false);
  assert.equal(sol.rects.length, 0);
  for (const clima of ["lluvia", "nieve"] as const) {
    const a = contextoFalso(), b = contextoFalso(), c = contextoFalso();
    pintarClima(a.contexto, clima, ZONA_HABITACION, 1, true);
    pintarClima(b.contexto, clima, ZONA_HABITACION, 4, true);
    pintarClima(c.contexto, clima, ZONA_HABITACION, 4, false);
    assert.ok(a.rects.length > 0);
    assert.deepEqual(a.rects, b.rects, `${clima} quieta`);
    assert.notDeepEqual(a.rects, c.rects, `${clima} se mueve sin la opción`);
  }
});
