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

test("los gorros del complemento abrazan la cabeza: van más bajos que un sombrero del armario", () => {
  for (const [mundo, complemento] of Object.entries(COMPLEMENTOS)) {
    if (complemento.tipo !== "sombrero") continue;
    const [gorro] = piezasEnCuadro({ sombrero: piezaComplemento(Number(mundo)) }, "sentado", 0);
    const [sombrero] = piezasEnCuadro({ sombrero: "paja" }, "sentado", 0);
    assert.ok(gorro.caja.top > sombrero.caja.top, `el del mundo ${mundo}`);
  }
});

test("las piezas encogen con la cabeza del modelo: en la melena, más pequeñas que en el atigrado", () => {
  const [melena] = piezasEnCuadro({ bufanda: piezaComplemento(8) }, "sentado", 0, "melena");
  const [atigrado] = piezasEnCuadro({ bufanda: piezaComplemento(8) }, "sentado", 0, "atigrado");
  assert.ok(melena.caja.width < atigrado.caja.width);
});

test("ninguna animación pierde el cuello en un cuadro suelto: la bufanda no parpadea", async () => {
  const { ANCLAS_POR_MODELO } = await import("./casaGatoAnclas.ts");
  for (const [modelo, tabla] of Object.entries(ANCLAS_POR_MODELO)) {
    if (modelo === "atigrado") continue;
    for (const [animacion, cuadros] of Object.entries(tabla)) {
      const conCabeza = cuadros.filter((a) => a.cabeza);
      const conCuello = conCabeza.filter((a) => a.cuello);
      assert.ok(conCuello.length === 0 || conCuello.length === conCabeza.length, `${modelo} ${animacion}`);
    }
  }
});
