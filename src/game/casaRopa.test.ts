import assert from "node:assert/strict";
import test from "node:test";
import { asegurarGatitos, casaVacia, mandarDePaseo, normalizeCasa } from "./casa.ts";
import { ACCESORIOS, alternar, celdaDe, normalizeRopa, ropaDe, TIPOS_ACCESORIO, vestir } from "./casaRopa.ts";
import { emptyProgress, parseProgress, serializeProgress } from "./progress.ts";

const ahora = new Date(2026, 10, 20, 10);
const casaCon = (...mundos: number[]) => asegurarGatitos(casaVacia(ahora), mundos, ahora);

test("tres tipos de accesorio con cuatro piezas distintas cada uno, en su celda de la lámina", () => {
  assert.deepEqual([...TIPOS_ACCESORIO], ["sombrero", "gafas", "bufanda"]);
  for (const tipo of TIPOS_ACCESORIO) {
    assert.equal(new Set(ACCESORIOS[tipo]).size, 4, tipo);
  }
  assert.deepEqual(celdaDe("sombrero", "paja"), { fila: 0, columna: 0 });
  assert.deepEqual(celdaDe("bufanda", "flecos"), { fila: 2, columna: 3 });
});

test("tocar una pieza la pone en lugar de la de su tipo, y tocarla otra vez la quita", () => {
  let ropa = alternar({}, "sombrero", "paja");
  ropa = alternar(ropa, "gafas", "estrella");
  assert.deepEqual(ropa, { sombrero: "paja", gafas: "estrella" });
  ropa = alternar(ropa, "sombrero", "gorro");
  assert.deepEqual(ropa, { sombrero: "gorro", gafas: "estrella" }, "uno de cada tipo");
  ropa = alternar(ropa, "gafas", "estrella");
  assert.deepEqual(ropa, { sombrero: "gorro" });
});

test("vestir guarda lo que lleva cada gatito, lo conserva de paseo y desnudarlo lo quita del progreso", () => {
  let casa = casaCon(1, 2);
  assert.deepEqual(ropaDe(casa, 1), {});
  casa = vestir(casa, 1, { sombrero: "fiesta", bufanda: "rayas" });
  casa = vestir(casa, 2, { gafas: "corazon" });
  assert.deepEqual(ropaDe(casa, 1), { sombrero: "fiesta", bufanda: "rayas" });
  assert.deepEqual(ropaDe(mandarDePaseo(casa, 1), 1), { sombrero: "fiesta", bufanda: "rayas" }, "de paseo no la pierde");
  assert.equal(vestir(casa, 7, { gafas: "buceo" }), casa, "solo gatitos de la casa");
  casa = vestir(casa, 1, {});
  assert.deepEqual(Object.keys(casa.ropa ?? {}), ["2"]);
  casa = vestir(casa, 2, {});
  assert.equal("ropa" in casa, false);
});

test("lectura tolerante: piezas y gatitos que no se entienden fuera", () => {
  assert.equal(normalizeRopa(null), undefined);
  assert.equal(normalizeRopa({ sombrero: "corona" }), undefined);
  assert.deepEqual(normalizeRopa({ sombrero: "paja", gafas: "paja", capa: "roja" }), { sombrero: "paja" });
  const casa = vestir(casaCon(1), 1, { gafas: "buceo" });
  const leida = normalizeCasa(JSON.parse(JSON.stringify({ ...casa, ropa: { ...casa.ropa, 5: { gafas: "buceo" }, x: {} } })));
  assert.deepEqual(leida?.ropa, { 1: { gafas: "buceo" } });
});

test("la ropa sobrevive a guardar y leer el progreso, y un guardado sin ella sigue valiendo", () => {
  const casa = vestir(casaCon(1), 1, { sombrero: "chistera" });
  const progreso = { ...emptyProgress, casa };
  assert.deepEqual(ropaDe(parseProgress(serializeProgress(progreso)).casa, 1), { sombrero: "chistera" });
  assert.deepEqual(ropaDe(parseProgress(serializeProgress({ ...emptyProgress, casa: casaCon(1) })).casa, 1), {});
});
