import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { CANCION, MAULLIDOS, notaHz, PIDE_CADA_MS, tonoDe } from "./casaSonido.ts";
import { MUNDOS_CASA } from "./casaRescate.ts";

test("cada gatito de la casa maúlla en su tono: Bruma más grave y Pino más agudo que Miel", () => {
  const tonos = MUNDOS_CASA.map(tonoDe);
  assert.equal(new Set(tonos).size, MUNDOS_CASA.length);
  assert.ok(tonoDe(2) < tonoDe(1) && tonoDe(1) < tonoDe(3));
  assert.equal(tonoDe(99), 1, "un gatito sin tono usa el de Miel");
});

test("los maullidos usan los samples de la fiesta y «gracias» suena más alegre que «ahora no»", () => {
  for (const { sample } of Object.values(MAULLIDOS)) assert.ok(existsSync(new URL(`../../public/assets/audio/gatitos/${sample}.wav`, import.meta.url)), sample);
  assert.ok(MAULLIDOS.gracias.tono > MAULLIDOS.ahoraNo.tono);
  assert.ok(PIDE_CADA_MS >= 5000, "pedir no maúlla sin parar");
});

test("la canción tiene cuatro notas en la tonalidad de cada gatito", () => {
  assert.equal(CANCION.length, 4);
  assert.ok(Math.abs(notaHz(1, 0) - 523.25) < 0.01);
  assert.ok(Math.abs(notaHz(1, 12) / notaHz(1, 0) - 2) < 1e-9, "doce semitonos son una octava");
  assert.ok(notaHz(3, 0) > notaHz(1, 0) && notaHz(2, 0) < notaHz(1, 0));
});
