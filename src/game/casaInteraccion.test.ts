import assert from "node:assert/strict";
import test from "node:test";
import { aEscena, AJUSTES_CASA, frotar, gatitoEn, gatitoMasCerca, huellaEn, leerAjustesCasa, PARON_MS, SITIOS_CASA } from "./casaInteraccion.ts";

test("los ajustes del prototipo se leen de la URL dentro de unos límites", () => {
  assert.deepEqual(leerAjustesCasa(null), AJUSTES_CASA);
  assert.deepEqual(leerAjustesCasa("?casaFrotar=800&casaObjeto=120&casaToque=60&casaNecesidades=pide"), { frotarMs: 800, objeto: 120, toque: 60, necesidades: "pide" });
  assert.deepEqual(leerAjustesCasa("?casaFrotar=1&casaObjeto=9999&casaNecesidades=hambre"), { ...AJUSTES_CASA, frotarMs: 200, objeto: 200 });
});

test("un punto de la pantalla se pasa a la escena de 960 × 540", () => {
  assert.deepEqual(aEscena(240, 135, { left: 0, top: 0, width: 480, height: 270 }), { x: 480, y: 270 });
});

test("soltar o frotar cuenta sobre el gatito más cercano dentro del radio", () => {
  assert.equal(gatitoEn(SITIOS_CASA[1] + 30, 400, SITIOS_CASA), 1);
  assert.equal(gatitoEn(SITIOS_CASA[1], 100, SITIOS_CASA), -1, "en la pared, lejos del gatito");
  assert.equal(gatitoEn((SITIOS_CASA[0] + SITIOS_CASA[1]) / 2, 400, SITIOS_CASA), -1, "entre dos gatitos, fuera del radio");
  assert.equal(gatitoMasCerca(700, SITIOS_CASA), 2);
});

test("la escoba barre la huella que toca", () => {
  const huellas = [{ x: 200 }, { x: 600 }];
  assert.equal(huellaEn(610, 500, huellas), 1);
  assert.equal(huellaEn(610, 200, huellas), -1);
});

test("frotar suma el tiempo moviéndose sobre el mismo gatito; un parón o cambiar de gatito no suma", () => {
  let estado = frotar(null, 0, 0, 500);
  for (let ms = 100; ms <= 400; ms += 100) estado = frotar(estado.frote, 0, ms, 500);
  assert.equal(estado.listo, false);
  assert.equal(frotar(estado.frote, 0, 500, 500).listo, true);
  const paron = frotar(estado.frote, 0, 400 + PARON_MS + 1, 500);
  assert.equal(paron.listo, false, "tras un parón no suma");
  assert.equal(frotar(estado.frote, 1, 500, 500).frote?.ms, 0, "otro gatito empieza de cero");
  assert.equal(frotar(estado.frote, -1, 500, 500).frote, estado.frote, "fuera de un gatito no cambia");
});
