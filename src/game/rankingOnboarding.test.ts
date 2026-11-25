import assert from "node:assert/strict";
import test from "node:test";
import { esFilaPropia, isEnrolled, pideOtroAlias, tablonActivo } from "./rankingOnboarding.ts";
import { preguntaPuerta, respuestaPuerta } from "./puertaAdultos.ts";

const device = { id: "device", token: "token", alias: "Luna" };
const fila = (alias: string) => ({ alias, world: 1, campaignWorld: 1, completedLevels: 1, stickers: 0, bossChallenges: 0, totalApples: 3, achievedAt: null });

test("una tarjeta pendiente aún no está apuntada; una confirmada sí", () => {
  assert.equal(isEnrolled(null), false);
  assert.equal(isEnrolled({ ...device, registrationPending: true }), false);
  assert.equal(isEnrolled(device), true);
});

test("el tablón viene apagado; los dispositivos con tarjeta siguen encendidos y lo guardado manda", () => {
  assert.equal(tablonActivo(null, null), false);
  assert.equal(tablonActivo(null, device), true);
  assert.equal(tablonActivo(null, { ...device, registrationPending: true }), true);
  assert.equal(tablonActivo("0", device), false);
  assert.equal(tablonActivo("1", null), true);
});

test("solo un alias rechazado pide otro al abrir el juego", () => {
  assert.equal(pideOtroAlias(null), false);
  for (const aliasStatus of ["pending", "approved", "hidden"] as const) assert.equal(pideOtroAlias({ alias: "Luna", aliasStatus, publicAlias: "Koala 65" }), false);
  assert.equal(pideOtroAlias({ alias: "Luna", aliasStatus: "rejected", publicAlias: "Koala 65" }), true);
});

test("la fila propia se reconoce por el nombre que ven los demás, también el provisional", () => {
  const pendiente = { alias: "Luna", aliasStatus: "pending" as const, publicAlias: "Koala 65" };
  assert.equal(esFilaPropia(fila("Koala 65"), pendiente, device), true);
  assert.equal(esFilaPropia(fila("Luna"), pendiente, device), false);
  assert.equal(esFilaPropia(fila("luna"), null, device), true);
  assert.equal(esFilaPropia(fila("Luna"), null, null), false);
});

test("puerta para adultos: multiplicación del 6 al 9 y solo vale el número exacto", () => {
  for (const azar of [0, 0.3, 0.6, 0.99999]) {
    const { a, b } = preguntaPuerta(() => azar);
    assert.ok(a >= 6 && a <= 9 && b >= 6 && b <= 9);
  }
  const pregunta = { a: 7, b: 8 };
  assert.equal(respuestaPuerta(pregunta, "56"), true);
  assert.equal(respuestaPuerta(pregunta, " 56 "), true);
  for (const mala of ["", "15", "56.0", "5 6", "cincuenta y seis", "-56"]) assert.equal(respuestaPuerta(pregunta, mala), false);
});
