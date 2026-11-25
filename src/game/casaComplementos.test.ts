import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { COMPLEMENTOS, conComplemento, esComplemento, HOJA_COMPLEMENTOS, HOJA_COMPLEMENTOS_CAPAS, piezaComplemento } from "./casaComplementos.ts";
import { MUNDOS_CASA } from "./casaRescate.ts";
import { laminaDePieza, piezasEnCuadro } from "./casaVestidorArte.ts";

test("cada gatito de la casa tiene un complemento, sin dos en la misma celda, y sus láminas existen", () => {
  for (const mundo of MUNDOS_CASA) assert.ok(COMPLEMENTOS[mundo], `al gatito del mundo ${mundo} le falta complemento`);
  const celdas = Object.values(COMPLEMENTOS).map((c) => `${c.tipo === "capa"}-${c.columna}`);
  assert.equal(new Set(celdas).size, celdas.length);
  for (const hoja of [HOJA_COMPLEMENTOS, HOJA_COMPLEMENTOS_CAPAS]) assert.ok(existsSync(`public/${hoja.slice(2)}`), hoja);
});

test("el complemento va en su sitio y lo tapa el accesorio del mismo tipo mientras lo lleva", () => {
  assert.deepEqual(conComplemento({}, 15), { sombrero: piezaComplemento(15) }, "Vía, con su gorra");
  assert.deepEqual(conComplemento({ sombrero: "paja" }, 15), { sombrero: "paja" }, "con sombrero, la gorra no se ve");
  assert.deepEqual(conComplemento({ gafas: "redondas" }, 15), { gafas: "redondas", sombrero: piezaComplemento(15) }, "otro sitio, los dos");
  assert.ok(esComplemento(piezaComplemento(1)) && !esComplemento("paja"));
});

test("el complemento se dibuja de su lámina, con la celda de su tipo", () => {
  const gorra = laminaDePieza("sombrero", piezaComplemento(15));
  assert.equal(gorra.imagen, HOJA_COMPLEMENTOS);
  assert.equal(gorra.columna, 3);
  const capita = laminaDePieza("capa", piezaComplemento(6));
  assert.equal(capita.imagen, HOJA_COMPLEMENTOS_CAPAS);
  assert.deepEqual(capita.celda, laminaDePieza("capa", "dragon").celda);
  const [pieza] = piezasEnCuadro(conComplemento({}, 1), "sentado", 0);
  assert.equal(pieza?.tipo, "bufanda");
  assert.equal(pieza?.pieza, piezaComplemento(1));
});
