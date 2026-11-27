import assert from "node:assert/strict";
import test from "node:test";
import { DECORACION_DE_SIEMPRE } from "./casaProgreso.ts";
import { emptyProgress, fusionarProgreso, parseProgress, serializeProgress } from "./progress.ts";
import { abrirRegalo, ganarRegalo, normalizeRegalos, porGanar, PREMIOS, regaloEsperando, regalosDe, tieneVersion, type RegalosProgress } from "./regalos.ts";

const lunes = new Date(2026, 10, 30, 10);
const martes = new Date(2026, 11, 1, 10);
const puesta = { ...DECORACION_DE_SIEMPRE, cama: 3 as const };

test("hay 52 versiones por ganar y quien ya juega conserva la de siempre y la puesta", () => {
  assert.equal(PREMIOS.length, 52);
  const regalos = regalosDe(undefined, puesta);
  assert.ok(tieneVersion(regalos, "cama", 3));
  assert.ok(tieneVersion(regalos, "cama", 0));
  assert.ok(!tieneVersion(regalos, "cama", 2));
  assert.equal(porGanar(regalos).length, 51);
});

test("un regalo al día como mucho y nunca con otro sin abrir", () => {
  const uno = ganarRegalo(undefined, puesta, lunes)!;
  assert.ok(regaloEsperando(uno));
  assert.equal(ganarRegalo(uno, puesta, martes), uno, "con uno esperando no llega otro");
  const abierto = abrirRegalo(uno, 0)!.regalos;
  assert.equal(ganarRegalo(abierto, puesta, lunes), abierto, "el mismo día no hay segundo");
  assert.ok(regaloEsperando(ganarRegalo(abierto, puesta, martes)));
});

test("al abrirlo sale una versión que faltaba", () => {
  const abierto = abrirRegalo(ganarRegalo(undefined, puesta, lunes)!, 0.999)!;
  assert.deepEqual(abierto.premio, { mueble: "tubos", version: 4 });
  assert.ok(tieneVersion(abierto.regalos, "tubos", 4));
  assert.equal(abrirRegalo(abierto.regalos, 0), null);
});

test("con las 52 ganadas dejan de salir", () => {
  let regalos: RegalosProgress | undefined;
  for (let dia = 1; dia <= 60; dia += 1) {
    regalos = ganarRegalo(regalos, DECORACION_DE_SIEMPRE, new Date(2027, 0, dia, 10));
    regalos = abrirRegalo(regalos!, 0.5)?.regalos ?? regalos;
  }
  assert.equal(regalos!.ganados.length, 52);
  assert.equal(regalos!.recibidos, 52);
});

test("se guardan en el progreso, se leen con tolerancia y dos pestañas no los repiten", () => {
  assert.equal(parseProgress(serializeProgress(emptyProgress)).regalos, undefined);
  assert.deepEqual(normalizeRegalos({ ganados: ["cama:2", "cama:2", "cama:9", 3], recibidos: 1, abiertos: 5, dia: "ayer" }),
    { ganados: ["cama:2"], recibidos: 1, abiertos: 1 });
  const esperando = { ...emptyProgress, regalos: ganarRegalo(undefined, puesta, lunes) };
  assert.deepEqual(parseProgress(serializeProgress(esperando)).regalos, esperando.regalos);
  const abierto = { ...emptyProgress, regalos: abrirRegalo(esperando.regalos!, 0)!.regalos };
  assert.ok(!regaloEsperando(fusionarProgreso(esperando, abierto).regalos));
  assert.ok(!regaloEsperando(fusionarProgreso(abierto, esperando).regalos));
});
