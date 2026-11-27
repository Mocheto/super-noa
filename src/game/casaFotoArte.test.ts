import assert from "node:assert/strict";
import test from "node:test";
import { aFoto, altoDeFoto, cajaDeGatito } from "./casaFotoArte.ts";
import { aEscena } from "./casaHamsters.ts";
import { POSADO, saleLaJaula } from "./casaHamstersFoto.ts";

test("el gatito de la foto va donde lo dibuja la casa: pies en su sitio y más pequeño al fondo", () => {
  const delante = cajaDeGatito({ x: 600, y: 520 });
  assert.deepEqual(delante, { x: 520, y: 368, ancho: 160, alto: 160 }, "delante, a escala 1");
  const fondo = cajaDeGatito({ x: 600, y: 405 });
  assert.ok(fondo.ancho < delante.ancho);
  // Los pies (fila 152 del cuadro) quedan en la `y` del gatito.
  assert.ok(Math.abs(fondo.y + fondo.alto * 152 / 160 - 405) < 3);
});

test("la foto escala la vista", () => {
  const foto = { vista: { x: 200, ancho: 640 } };
  assert.deepEqual(aFoto({ x: 200, y: 0, ancho: 640, alto: 540 }, foto, 320), { x: 0, y: 0, ancho: 320, alto: 270 });
  assert.equal(altoDeFoto(foto, 320), 270);
});

test("la jaula de hámsters sale en las fotos que llegan a ella y las de antes no cambian", () => {
  assert.ok(saleLaJaula({ vista: { x: -1140, ancho: 720 } }));
  assert.ok(!saleLaJaula({ vista: { x: -420, ancho: 720 } }), "las fotos de antes llegaban como mucho a -420");
  assert.ok(!saleLaJaula({ vista: { x: -1140, ancho: 720 }, jardin: { maceteros: [0, 0, 0] } }));
  for (const [id, punto] of Object.entries(POSADO)) {
    const { x, y } = aEscena(punto);
    assert.ok(x > -1140 && x < -420 && y > 0 && y < 540, id);
  }
});
