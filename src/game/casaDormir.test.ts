import assert from "node:assert/strict";
import test from "node:test";
import { asegurarGatitos, casaVacia, mandarDePaseo, normalizeCasa } from "./casa.ts";
import { arropadosDe, arropar, nocheDe, puedeDormir, todosArropados } from "./casaDormir.ts";
import { emptyProgress, parseProgress, serializeProgress } from "./progress.ts";

const a = (dia: number, hora: number) => new Date(2026, 10, dia, hora);
const casaCon = (...mundos: number[]) => asegurarGatitos(casaVacia(a(19, 18)), mundos, a(19, 18));

test("la hora de dormir empieza a las 19 h y dura hasta las 8 h; la madrugada es de la noche anterior", () => {
  assert.equal(puedeDormir(a(19, 18)), false);
  assert.equal(puedeDormir(a(19, 19)), true);
  assert.equal(puedeDormir(a(20, 7)), true);
  assert.equal(puedeDormir(a(20, 8)), false);
  assert.equal(nocheDe(a(19, 22)), "2026-11-19");
  assert.equal(nocheDe(a(20, 3)), "2026-11-19");
});

test("arropar a todos, una vez por noche, con su corazón dentro del límite", () => {
  const noche = a(19, 20);
  let casa = casaCon(1, 2);
  assert.equal(arropar(casa, 1, a(19, 17)).arropado, false, "antes de las 19 h no");
  const primero = arropar(casa, 1, noche);
  assert.ok(primero.arropado && primero.corazon);
  casa = primero.casa;
  assert.equal(casa.gatitos[1].corazones, 1);
  assert.equal(todosArropados(casa, noche), false);
  const otraVez = arropar(casa, 1, noche);
  assert.equal(otraVez.arropado, false, "ya estaba arropado");
  casa = arropar(casa, 2, noche).casa;
  assert.ok(todosArropados(casa, noche));
  // Al día siguiente ya no hay nadie arropado.
  assert.deepEqual(arropadosDe(casa, a(20, 20)), []);
  // El límite de dos corazones al día se respeta.
  const conDos = { ...casa, gatitos: { ...casa.gatitos, 1: { ...casa.gatitos[1], corazonesHoy: 2, dia: "2026-11-20" } } };
  const tarde = arropar(conDos, 1, a(20, 21));
  assert.ok(tarde.arropado && !tarde.corazon);
});

test("solo se arropa a los gatitos en casa", () => {
  const casa = mandarDePaseo(casaCon(1, 2), 2);
  assert.equal(arropar(casa, 2, a(19, 20)).arropado, false);
  assert.ok(todosArropados(arropar(casa, 1, a(19, 20)).casa, a(19, 20)), "basta con los de casa");
});

test("lo arropado se guarda con tolerancia en casa.dormir", () => {
  const casa = arropar(casaCon(1, 2), 1, a(19, 20)).casa;
  const leida = parseProgress(serializeProgress({ ...emptyProgress, casa }));
  assert.deepEqual(leida.casa && arropadosDe(leida.casa, a(19, 23)), [1]);
  assert.deepEqual(normalizeCasa({ ...casa, dormir: { noche: "2026-11-19", arropados: [2, 2, 9, "1"] } })?.dormir, { noche: "2026-11-19", arropados: [1, 2] });
  assert.equal(normalizeCasa({ ...casa, dormir: { noche: "ayer" } })?.dormir, undefined);
});
