import assert from "node:assert/strict";
import test from "node:test";
import { drawContornos } from "./halo.ts";

function contextoFalso() {
  const llamadas: string[] = [];
  const registrar = (nombre: string) => (...args: unknown[]) => { llamadas.push(`${nombre}(${args.map((a) => typeof a === "number" ? Math.round(a) : a).join(",")})`); };
  const context = { save: registrar("save"), restore: registrar("restore"), beginPath: registrar("beginPath"), stroke: registrar("stroke"), moveTo: registrar("moveTo"), lineTo: registrar("lineTo"), rect: registrar("rect"), roundRect: registrar("roundRect") } as unknown as CanvasRenderingContext2D;
  return { context, llamadas };
}

test("el contorno de lo que se pisa va en un solo trazo y solo con lo que se ve", () => {
  const { context, llamadas } = contextoFalso();
  drawContornos(context, [
    { x: 0, y: 440, width: 600, height: 100, kind: "ground" },
    { x: 600, y: 440, width: 400, height: 100, kind: "ground" },
    { x: 300, y: 300, width: 120, height: 24, kind: "branch" },
    { x: 500, y: 200, width: 60, height: 30, kind: "spring" },
    { x: 5000, y: 300, width: 120, height: 24, kind: "branch" },
    { x: 100, y: 250, width: 200, height: 40, kind: "sky-cloud" },
  ], 0, 960);
  assert.equal(llamadas.filter((l) => l === "stroke()").length, 1, "un solo trazo");
  assert.equal(llamadas.filter((l) => l.startsWith("roundRect")).length, 1, "la rama flotante lleva el contorno entero; el muelle, nada; la de fuera de pantalla, nada");
  // Los dos suelos se tocan: no hay raya vertical en x = 600, pero sí en los extremos que dan al vacío.
  assert.ok(!llamadas.some((l) => /^lineTo\((598|601),/.test(l) && l.endsWith(",500)")), "sin costura entre suelos que se tocan");
  assert.ok(llamadas.includes("moveTo(112,257)"), "la nube, solo la línea de arriba, sobre su dibujo");
});

test("sin nada que pisar a la vista no se traza nada", () => {
  const { context, llamadas } = contextoFalso();
  drawContornos(context, [{ x: 3000, y: 440, width: 600, height: 100, kind: "ground" }], 0, 960);
  assert.deepEqual(llamadas, []);
});

test("con reducir movimiento Noa no parpadea, y sin él parpadea 3 veces por segundo como mucho", async () => {
  const { opacidadInvencible } = await import("./halo.ts");
  assert.equal(opacidadInvencible(0, false), 1);
  // Recorre 2 s de invencibilidad en pasos de 1/60 s y cuenta cuántas veces se apaga.
  let apagados = 0;
  let antes = opacidadInvencible(2, false);
  for (let t = 2; t > 0; t -= 1 / 60) {
    const ahora = opacidadInvencible(t, false);
    if (ahora < 1 && antes === 1) apagados += 1;
    antes = ahora;
    assert.equal(opacidadInvencible(t, true), 0.6, "quieta con reducir movimiento");
  }
  assert.ok(apagados <= 6, `${apagados} destellos en 2 s`);
});
