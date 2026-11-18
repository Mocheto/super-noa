import assert from "node:assert/strict";
import test from "node:test";
import { readRgbaPng } from "./pngTestUtils.ts";
import { ATLAS_PICTOGRAMAS, celdaPictograma, pictogramas, type Pictograma } from "../textos/pictogramas.ts";
import { pictogramasDibujados } from "../textos/pictogramasDibujados.ts";

const CELDA = 96;

test("los atlas de pictogramas miden lo previsto, son transparentes y cada pictograma dibujado tiene su celda llena", () => {
  const atlas = { color: readRgbaPng(ATLAS_PICTOGRAMAS.color), controles: readRgbaPng(ATLAS_PICTOGRAMAS.controles) };
  assert.deepEqual([atlas.color.width, atlas.color.height], [576, 576]);
  assert.deepEqual([atlas.controles.width, atlas.controles.height], [480, 288]);
  for (const nombre of pictogramasDibujados) {
    assert.ok(nombre in pictogramas, `${nombre} no es un pictograma`);
    const celda = celdaPictograma(nombre as Pictograma);
    const { width, pixels } = atlas[celda.atlas];
    let opacos = 0, esquinaOpaca = false;
    for (let y = 0; y < CELDA; y++) for (let x = 0; x < CELDA; x++) {
      const alfa = pixels[((celda.fila * CELDA + y) * width + celda.columna * CELDA + x) * 4 + 3];
      if (alfa > 0) opacos++;
      if (alfa > 0 && (x < 4 || y < 4) && (x < 4 && y < 4)) esquinaOpaca = true;
    }
    assert.ok(opacos > 600, `la celda de ${nombre} está vacía`);
    assert.equal(esquinaOpaca, false, `la celda de ${nombre} tiene fondo en la esquina`);
  }
});
