import assert from "node:assert/strict";
import test from "node:test";
import { aFoto, altoDeFoto, cajaDeGatito, cajaDeMantita } from "./casaFotoArte.ts";

test("el gatito de la foto va donde lo dibuja la casa: pies en su sitio y más pequeño al fondo", () => {
  const delante = cajaDeGatito({ x: 600, y: 520 });
  assert.deepEqual(delante, { x: 520, y: 368, ancho: 160, alto: 160 }, "delante, a escala 1");
  const fondo = cajaDeGatito({ x: 600, y: 405 });
  assert.ok(fondo.ancho < delante.ancho);
  // Los pies (fila 152 del cuadro) quedan en la `y` del gatito.
  assert.ok(Math.abs(fondo.y + fondo.alto * 152 / 160 - 405) < 3);
});

test("la mantita se pone sobre la mitad de abajo del gatito y la foto escala la vista", () => {
  const gato = cajaDeGatito({ x: 600, y: 520 });
  const mantita = cajaDeMantita(gato);
  assert.ok(mantita.y > gato.y + gato.alto / 2 && mantita.y + mantita.alto <= gato.y + gato.alto);
  const foto = { vista: { x: 200, ancho: 640 } };
  assert.deepEqual(aFoto({ x: 200, y: 0, ancho: 640, alto: 540 }, foto, 320), { x: 0, y: 0, ancho: 320, alto: 270 });
  assert.equal(altoDeFoto(foto, 320), 270);
});
