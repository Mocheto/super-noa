import assert from "node:assert/strict";
import test from "node:test";
import { casaVacia, decoracionDe, normalizeCasa } from "./casa.ts";
import { cambiarMueble, cambiarTonoPared, DECORACION_DE_SIEMPRE, muebleEn, MUEBLES, MUEBLES_CASA, normalizeDecoracion, PARED_HASTA, TONOS_PARED, VERSIONES } from "./casaDecoracion.ts";
import { dentroDelSuelo, HABITACION_CASA as H } from "./casaHabitacion.ts";
import { parseProgress, serializeProgress, emptyProgress } from "./progress.ts";

test("cinco muebles con tres versiones cada uno; la pared, con tres tonos", () => {
  assert.deepEqual([...MUEBLES], ["cama", "alfombra", "cuadro", "planta", "pared"]);
  assert.equal(VERSIONES.length, 3);
  assert.equal(TONOS_PARED.length, 3);
  for (const tono of TONOS_PARED) for (const color of tono) assert.match(color, /^#[0-9a-f]{6}$/);
});

test("cada mueble está dentro de la habitación y su gatito va a olerlo por el suelo", () => {
  for (const id of MUEBLES) {
    const { caja, oler } = MUEBLES_CASA[id];
    if (caja) assert.ok(caja.x >= 0 && caja.y >= 0 && caja.x + caja.ancho <= H.ancho && caja.y + caja.alto <= H.alto, id);
    assert.ok(dentroDelSuelo(H, oler.x, oler.y), id);
  }
  // Solo la pared va sin caja ni fila de lámina.
  assert.deepEqual(MUEBLES.filter((id) => MUEBLES_CASA[id].caja === null), ["pared"]);
  assert.deepEqual(MUEBLES.map((id) => MUEBLES_CASA[id].fila), [0, 1, 2, 3, null]);
});

test("los sitios de interés de los gatitos no se mueven al decorar", () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(H.sitios).map(([id, s]) => [id, [s.x, s.y]])),
    { puerta: [140, 420], cama: [360, 425], rascador: [545, 412], ventana: [740, 408], alfombra: [650, 505], banera: [1085, 440] },
  );
});

test("la decoración se lee con tolerancia: lo que falta o no vale es la de siempre", () => {
  assert.deepEqual(normalizeDecoracion(undefined), DECORACION_DE_SIEMPRE);
  assert.deepEqual(normalizeDecoracion([1, 2]), DECORACION_DE_SIEMPRE);
  assert.deepEqual(normalizeDecoracion({ cama: 2, alfombra: 7, cuadro: "1", planta: 1, sofa: 2 }), { cama: 2, alfombra: 0, cuadro: 0, planta: 1, pared: 0 });
  assert.deepEqual(cambiarMueble(DECORACION_DE_SIEMPRE, "pared", 2), { ...DECORACION_DE_SIEMPRE, pared: 2 });
});

test("el progreso guarda la decoración en casa.decoracion y sin ella sale la de siempre", () => {
  const ahora = new Date(2026, 10, 19, 12);
  const casa = casaVacia(ahora);
  assert.deepEqual(decoracionDe(casa), DECORACION_DE_SIEMPRE);
  assert.deepEqual(decoracionDe(undefined), DECORACION_DE_SIEMPRE);
  assert.equal(normalizeCasa({ ...casa, decoracion: DECORACION_DE_SIEMPRE })?.decoracion, undefined, "la de siempre no se guarda");

  const decorada = { ...casa, decoracion: cambiarMueble(DECORACION_DE_SIEMPRE, "cama", 1) };
  const leida = parseProgress(serializeProgress({ ...emptyProgress, casa: decorada }));
  assert.deepEqual(decoracionDe(leida.casa), { ...DECORACION_DE_SIEMPRE, cama: 1 });
  // Un guardado antiguo, sin decoración, sigue valiendo.
  const antiguo = parseProgress(serializeProgress({ ...emptyProgress, casa }));
  assert.equal(antiguo.casa?.decoracion, undefined);
  assert.deepEqual(decoracionDe(antiguo.casa), DECORACION_DE_SIEMPRE);
});

test("tocar la escena elige el mueble de esa caja, la pared por encima del zócalo o nada en el suelo", () => {
  assert.equal(muebleEn(350, 380), "cama");
  assert.equal(muebleEn(730, 460), "alfombra");
  assert.equal(muebleEn(1000, 120), "cuadro");
  assert.equal(muebleEn(920, 180), "planta");
  assert.equal(muebleEn(400, 100), "pared");
  assert.equal(muebleEn(200, 480), null);
});

test("la pared cambia el tono de sus rayas y deja igual lo demás", () => {
  // Tres píxeles de una fila de pared: raya clara, raya oscura y el contorno de algo.
  const pixeles = new Uint8ClampedArray([0xfb, 0xea, 0xd2, 255, 0xf8, 0xda, 0xbb, 255, 0x2f, 0x1d, 0x33, 255]);
  const igual = new Uint8ClampedArray(pixeles);
  cambiarTonoPared(igual, 3, 1, 0);
  assert.deepEqual(igual, pixeles);
  cambiarTonoPared(pixeles, 3, 1, 1);
  assert.deepEqual([...pixeles], [0xe3, 0xf5, 0xe9, 255, 0xcb, 0xeb, 0xd7, 255, 0x2f, 0x1d, 0x33, 255]);
  // Bajo el zócalo no se toca.
  const suelo = new Uint8ClampedArray(PARED_HASTA * 4 * 1 + 4).fill(0);
  const ultima = PARED_HASTA * 4;
  suelo.set([0xfb, 0xea, 0xd2, 255], ultima);
  cambiarTonoPared(suelo, 1, PARED_HASTA + 1, 2);
  assert.deepEqual([...suelo.slice(ultima)], [0xfb, 0xea, 0xd2, 255]);
});
