import assert from "node:assert/strict";
import test from "node:test";
import { aEscena, AJUSTES_CASA, autodeslizar, centrarEn, ESCALA_MINIMA, escalaCasa, frotar, gatitoEn, gatitoMasCerca, huellaEn, leerAjustesCasa, limitarVista, PARON_MS, SITIOS_CASA } from "./casaInteraccion.ts";

test("los ajustes del prototipo se leen de la URL dentro de unos límites", () => {
  assert.deepEqual(leerAjustesCasa(null), AJUSTES_CASA);
  assert.deepEqual(leerAjustesCasa("?casaFrotar=800&casaObjeto=120&casaToque=60&casaNecesidades=pide"), { frotarMs: 800, objeto: 120, toque: 60, necesidades: "pide" });
  assert.deepEqual(leerAjustesCasa("?casaFrotar=1&casaObjeto=9999&casaNecesidades=hambre"), { ...AJUSTES_CASA, frotarMs: 200, objeto: 200 });
});

test("un punto de la pantalla se pasa a la escena de 1280 × 540", () => {
  assert.deepEqual(aEscena(320, 135, { left: 0, top: 0, width: 640, height: 270 }), { x: 640, y: 270 });
  assert.deepEqual(aEscena(100, 0, { left: -380, top: 0, width: 960, height: 405 }), { x: 640, y: 0 }, "con la vista desplazada");
});

test("la habitación cabe a lo alto y en el móvil vertical no baja de 0,75: entonces se desliza", () => {
  assert.equal(escalaCasa(343, 600), ESCALA_MINIMA, "móvil vertical");
  assert.equal(escalaCasa(700, 268), 268 / 540, "móvil apaisado: cabe entera");
  assert.equal(escalaCasa(1400, 900), 1400 / 1280, "escritorio ancho: cabe entera a lo ancho");
  assert.equal(limitarVista(-50, 457), 0);
  assert.equal(limitarVista(5000, 457), 1280 - 457);
  assert.equal(limitarVista(300, 2000), 0, "si cabe entera, no se desliza");
  assert.equal(centrarEn(640, 400), 440);
  assert.deepEqual([autodeslizar(110, 100, 500), autodeslizar(300, 100, 500), autodeslizar(470, 100, 500)], [-1, 0, 1]);
});

test("soltar o frotar cuenta sobre el gatito más cercano dentro del radio", () => {
  assert.equal(gatitoEn(SITIOS_CASA[1] + 30, 400, SITIOS_CASA), 1);
  assert.equal(gatitoEn(SITIOS_CASA[1], 100, SITIOS_CASA), -1, "en la pared, lejos del gatito");
  assert.equal(gatitoEn(SITIOS_CASA[0] - 150, 400, SITIOS_CASA), -1, "lejos de cualquier gatito");
  assert.equal(gatitoMasCerca(SITIOS_CASA[2] - 20, SITIOS_CASA), 2);
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
