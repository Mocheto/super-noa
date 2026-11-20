import assert from "node:assert/strict";
import test from "node:test";
import { asegurarGatitos, casaVacia, normalizeCasa, type CasaProgress } from "./casa.ts";
import { COMIDAS, darDeComer, FAVORITA_DE, favoritaDescubierta } from "./casaComida.ts";
import { MUNDOS_CASA } from "./casaRescate.ts";
import { emptyProgress, parseProgress, serializeProgress } from "./progress.ts";

const ahora = new Date(2026, 10, 20, 12);
const casaCon = (...mundos: number[]) => asegurarGatitos(casaVacia(ahora), mundos, ahora);
const conHambre = (casa: CasaProgress, mundo: number): CasaProgress =>
  ({ ...casa, gatitos: { ...casa.gatitos, [mundo]: { ...casa.gatitos[mundo], necesidades: { ...casa.gatitos[mundo].necesidades, comer: 1 } } } });
const otra = (mundo: number) => COMIDAS.find((comida) => comida !== FAVORITA_DE[mundo])!;

test("cada gatito tiene su favorita, sin repetir entre mundos seguidos, y se usan las cuatro", () => {
  for (const mundo of MUNDOS_CASA) assert.ok(COMIDAS.includes(FAVORITA_DE[mundo]), `mundo ${mundo}`);
  for (let mundo = 2; mundo <= MUNDOS_CASA.length; mundo += 1) assert.notEqual(FAVORITA_DE[mundo], FAVORITA_DE[mundo - 1]);
  assert.deepEqual(new Set(MUNDOS_CASA.map((m) => FAVORITA_DE[m])), new Set(COMIDAS));
});

test("con hambre cualquier comida le vale y da su corazón; con la favorita, además, se descubre", () => {
  let casa = conHambre(casaCon(1), 1);
  const otraComida = darDeComer(casa, 1, otra(1), ahora);
  assert.equal(otraComida.respuesta, "gracias");
  assert.ok(otraComida.corazon && !otraComida.favorita && !otraComida.descubierta);
  assert.equal(favoritaDescubierta(otraComida.casa, 1), null);

  casa = conHambre(casaCon(1), 1);
  const primera = darDeComer(casa, 1, FAVORITA_DE[1], ahora);
  assert.ok(primera.corazon && primera.favorita && primera.descubierta);
  assert.equal(favoritaDescubierta(primera.casa, 1), FAVORITA_DE[1]);
  const segunda = darDeComer(conHambre(primera.casa, 1), 1, FAVORITA_DE[1], ahora);
  assert.ok(segunda.favorita && !segunda.descubierta, "ya estaba descubierta");
});

test("sin hambre, «ahora no» aunque sea su favorita, y no se descubre", () => {
  const resultado = darDeComer(casaCon(2), 2, FAVORITA_DE[2], ahora);
  assert.equal(resultado.respuesta, "ahoraNo");
  assert.ok(!resultado.favorita && !resultado.corazon);
  assert.equal(favoritaDescubierta(resultado.casa, 2), null);
});

test("las descubiertas se guardan y se leen con tolerancia", () => {
  const { casa } = darDeComer(conHambre(casaCon(1, 3), 3), 3, FAVORITA_DE[3], ahora);
  assert.deepEqual(parseProgress(serializeProgress({ ...emptyProgress, casa })).casa?.favoritas, [3]);
  assert.deepEqual(normalizeCasa({ ...casa, favoritas: [3, 3, 9, "x"] })?.favoritas, [3]);
  assert.equal("favoritas" in (normalizeCasa({ ...casa, favoritas: [] }) ?? {}), false);
});
