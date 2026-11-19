import assert from "node:assert/strict";
import test from "node:test";
import { hzDeMidi, NANA_BAJO, NANA_BPM, NANA_MELODIA, NANA_VOLUMEN, notasDelPulso, PULSOS_POR_COMPAS, pulsosNana, segundosPorPulso } from "./casaNana.ts";

test("la nana tiene ocho compases de tres pulsos con su bajo, y empieza cada compás con nota", () => {
  assert.equal(NANA_MELODIA.length, 8);
  assert.equal(NANA_BAJO.length, NANA_MELODIA.length);
  for (const compas of NANA_MELODIA) {
    assert.equal(compas.length, PULSOS_POR_COMPAS);
    assert.notEqual(compas[0], null);
  }
  const notas = NANA_MELODIA.flat().filter((n): n is number => n !== null);
  assert.ok(notas.every((n) => n >= 55 && n <= 79), "melodía en un registro suave");
  assert.ok(NANA_BAJO.every((n) => n >= 36 && n < 55), "bajo grave");
  assert.equal(NANA_MELODIA.at(-1)![0], 60, "acaba en do, la tónica, para volver a empezar");
});

test("las notas largas duran hasta la siguiente y el bajo suena al principio de cada compás", () => {
  assert.deepEqual(notasDelPulso(9), [{ nota: 72, pulsos: 3, bajo: false }, { nota: 48, pulsos: 3, bajo: true }]);
  assert.deepEqual(notasDelPulso(10), [], "el silencio alarga la nota");
  assert.deepEqual(notasDelPulso(1), [{ nota: 67, pulsos: 1, bajo: false }]);
  assert.deepEqual(notasDelPulso(pulsosNana()), notasDelPulso(0), "en bucle");
});

test("de noche va más lenta y más bajita", () => {
  assert.ok(NANA_BPM.noche < NANA_BPM.dia);
  assert.ok(segundosPorPulso(true) > segundosPorPulso(false));
  assert.ok(NANA_VOLUMEN.noche < NANA_VOLUMEN.dia && NANA_VOLUMEN.dia <= 0.3, "por debajo de los maullidos");
  assert.ok(Math.abs(hzDeMidi(69) - 440) < 1e-9);
});
