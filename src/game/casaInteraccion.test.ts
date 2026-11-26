import assert from "node:assert/strict";
import test from "node:test";
import { aEscena, AJUSTES_CASA, autodeslizar, centrarEn, ESCALA_MINIMA, escalaCasa, gatitoEn, gatitoMasCerca, huellaEn, leerAjustesCasa, limitarVista, SITIOS_CASA, VISTA_MINIMA_HABITACION } from "./casaInteraccion.ts";

test("los ajustes del prototipo se leen de la URL dentro de unos límites", () => {
  assert.deepEqual(leerAjustesCasa(null), AJUSTES_CASA);
  assert.deepEqual(leerAjustesCasa("?casaObjeto=120&casaToque=60&casaNecesidades=pide"), { objeto: 120, toque: 60, necesidades: "pide", hora: null });
  assert.equal(leerAjustesCasa("?casaHora=20").hora, 20);
  assert.equal(leerAjustesCasa("?casaHora=99").hora, 23);
  assert.deepEqual(leerAjustesCasa("?casaObjeto=9999&casaNecesidades=hambre"), { ...AJUSTES_CASA, objeto: 200 });
});

test("un punto de la pantalla se pasa a la escena de 1280 × 540", () => {
  assert.deepEqual(aEscena(320, 135, { left: 0, top: 0, width: 640, height: 270 }), { x: 640, y: 270 });
  assert.deepEqual(aEscena(100, 0, { left: -380, top: 0, width: 960, height: 405 }), { x: 640, y: 0 }, "con la vista desplazada");
});

test("la habitación cabe a lo alto y en el móvil vertical no baja de 0,75: entonces se desliza", () => {
  assert.equal(escalaCasa(343, 600), ESCALA_MINIMA, "móvil vertical");
  assert.equal(escalaCasa(700, 268), 268 / 540, "móvil apaisado: cabe entera");
  // En vertical se ve una ventana 4:3 de la habitación (issue 332): 720 px de escena de ancho, salvo que no quepa a lo alto.
  assert.equal(escalaCasa(343, 600, true), 343 / 720, "móvil vertical, 4:3");
  assert.equal(escalaCasa(768, 900, true), 768 / 720, "tableta vertical, 4:3");
  assert.equal(escalaCasa(768, 400, true), 400 / 540, "si no cabe a lo alto, manda el alto");
  assert.equal(escalaCasa(1400, 900), 1400 / 1280, "escritorio ancho: cabe entera a lo ancho");
  assert.equal(limitarVista(-50, 457), 0);
  assert.equal(limitarVista(5000, 457), 1280 - 457);
  assert.equal(limitarVista(300, 2000), 0, "si cabe entera, no se desliza");
  assert.equal(centrarEn(640, 400), 440);
  assert.deepEqual([autodeslizar(110, 100, 500), autodeslizar(300, 100, 500), autodeslizar(470, 100, 500)], [-1, 0, 1]);
});

test("tocar o soltar cuenta sobre el gatito más cercano dentro del radio", () => {
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

test("el dedo tiembla sin coger y la esponja no está en la bandeja", async () => {
  const { MOVER_PARA_COGER, HERRAMIENTAS } = await import("./casaInteraccion.ts");
  assert.ok(MOVER_PARA_COGER >= 20 && MOVER_PARA_COGER <= 30);
  assert.ok(!HERRAMIENTAS.includes("esponja"), "la esponja sale de la bandeja");
});

test("el gatito se suelta sobre la bañera o aterriza en el suelo", async () => {
  const { HABITACION_CASA: H, sobreLaBanera, aterrizar, dentroDelSuelo } = await import("./casaHabitacion.ts");
  assert.equal(sobreLaBanera(H, H.sitios.banera.x, H.sitios.banera.y), true);
  assert.equal(sobreLaBanera(H, 400, 450), false);
  const suelo = aterrizar(H, 300, 100);
  assert.ok(dentroDelSuelo(H, suelo.x, suelo.y), "soltado en la pared, aterriza en el suelo");
  assert.deepEqual(aterrizar(H, 600, 470), { x: 600, y: 470 });
});

test("la vista de la habitación llega hasta la ampliación de la izquierda y la del jardín, no", () => {
  assert.equal(VISTA_MINIMA_HABITACION, -1140);
  assert.equal(limitarVista(-1900, 600, VISTA_MINIMA_HABITACION), -1140);
  assert.equal(limitarVista(-900, 600), 0, "sin mínimo, como siempre");
  assert.equal(limitarVista(5000, 600, VISTA_MINIMA_HABITACION), 1280 - 600);
  assert.equal(centrarEn(-215, 600, VISTA_MINIMA_HABITACION), -515, "la pecera se puede centrar");
  assert.equal(centrarEn(-780, 720, VISTA_MINIMA_HABITACION), -1140, "la jaula de hámsters llega al borde izquierdo");
});
