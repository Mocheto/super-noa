import assert from "node:assert/strict";
import test from "node:test";
import { asegurarGatitos, casaVacia, normalizeCasa } from "./casa.ts";
import { DECORACION_DE_SIEMPRE } from "./casaDecoracion.ts";
import { fotosDe, guardarFoto, MAX_FOTOS, normalizeFotos, type FotoCasa } from "./casaFoto.ts";
import { emptyProgress, parseProgress, serializeProgress } from "./progress.ts";

const ahora = new Date(2026, 10, 19, 18);
const foto = (n: number): FotoCasa => ({
  hecha: new Date(2026, 10, 19, 18, n).toISOString(), vista: { x: 200, ancho: 600 }, decoracion: { ...DECORACION_DE_SIEMPRE, cama: 2 }, noche: false, apagada: false,
  gatitos: [{ mundo: 1, x: 600, y: 470, animacion: "sentado", cuadro: 1, mira: -1, sucio: false, mejorAmigo: true, arropado: false }],
});

test("se guardan las doce últimas fotos, la más nueva primero", () => {
  let casa = asegurarGatitos(casaVacia(ahora), [1], ahora);
  assert.deepEqual(fotosDe(casa), []);
  for (let n = 0; n < MAX_FOTOS + 2; n++) casa = guardarFoto(casa, foto(n));
  assert.equal(fotosDe(casa).length, MAX_FOTOS);
  assert.equal(fotosDe(casa)[0].hecha, foto(MAX_FOTOS + 1).hecha, "la más nueva, delante");
  assert.equal(fotosDe(casa).at(-1)!.hecha, foto(2).hecha, "las dos más antiguas se han ido");
});

test("las fotos se guardan en el progreso y se leen con tolerancia", () => {
  const casa = guardarFoto(asegurarGatitos(casaVacia(ahora), [1], ahora), foto(0));
  const leida = parseProgress(serializeProgress({ ...emptyProgress, casa }));
  assert.deepEqual(fotosDe(leida.casa), [foto(0)]);
  assert.equal(normalizeCasa({ ...casa, fotos: undefined })?.fotos, undefined);
  const raras = normalizeFotos([
    "foto", { hecha: "nunca", vista: { x: 0, ancho: 600 } },
    { ...foto(1), vista: { x: 1200, ancho: 600 }, apagada: true, gatitos: [{ mundo: 99, x: 1, y: 1 }, { mundo: 2, x: 5000, y: 470, animacion: "volar", cuadro: 9, mira: 7 }] },
  ]);
  assert.equal(raras.length, 1);
  assert.deepEqual(raras[0].vista, { x: 680, ancho: 600 }, "la vista cabe en la habitación");
  assert.equal(raras[0].apagada, false, "de día no hay lámpara apagada");
  assert.deepEqual(raras[0].gatitos, [{ mundo: 2, x: 1280, y: 470, animacion: "sentado", cuadro: 1, mira: 1, sucio: false, mejorAmigo: false, arropado: false }]);
});
