import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { HOJA_ARROPADO, HOJA_MANTITA, teñirMantita } from "./casaDormirArte.ts";

test("la hoja de la mantita y la de la pose arropado existen", () => {
  for (const hoja of [HOJA_MANTITA, HOJA_ARROPADO]) assert.ok(existsSync(new URL(`../../public/${hoja.replace("./", "")}`, import.meta.url)), hoja);
});

test("la mantita toma el color del collar y conserva ribete, pliegues y contorno", () => {
  // Violeta clave, pliegue oscuro, ribete claro, contorno ciruela y blanco de las estrellas.
  const pixeles = new Uint8ClampedArray([0xb0, 0x00, 0xff, 255, 0x6a, 0x00, 0xa8, 255, 0xd8, 0x90, 0xff, 255, 0x2f, 0x1d, 0x33, 255, 0xff, 0xff, 0xff, 255]);
  teñirMantita(pixeles, [0x3d, 0x8b, 0xe0]);
  const color = (i: number) => [...pixeles.slice(i * 4, i * 4 + 3)];
  const [base, pliegue, ribete, contorno, blanco] = [0, 1, 2, 3, 4].map(color);
  assert.ok(base[2] > base[0] && base[2] > base[1], "azul como el collar");
  assert.ok(pliegue[2] < base[2], "el pliegue sigue más oscuro");
  assert.ok(ribete[0] + ribete[1] + ribete[2] > base[0] + base[1] + base[2], "el ribete sigue más claro");
  assert.deepEqual(contorno, [0x2f, 0x1d, 0x33]);
  assert.deepEqual(blanco, [255, 255, 255]);
});

test("las puntas violetas de los modelos nuevos no se tiñen como la mantita", () => {
  const pixeles = new Uint8ClampedArray([0xa2, 0x1c, 0xaf, 255]);
  teñirMantita(pixeles, [0x3d, 0x8b, 0xe0]);
  assert.deepEqual([...pixeles], [0xa2, 0x1c, 0xaf, 255]);
});
