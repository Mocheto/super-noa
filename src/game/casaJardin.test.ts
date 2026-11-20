import assert from "node:assert/strict";
import test from "node:test";
import { asegurarGatitos, casaVacia, normalizeCasa, traerACasa, type CasaProgress } from "./casa.ts";
import { dentroDelSuelo } from "./casaHabitacion.ts";
import {
  cambiaSolo, COLORES_FLOR, estanciaDe, gatitosEn, JARDIN, jardinDe, llevarA, maceteroBajo, regar, sobreLaColchoneta, sobreLaPuerta,
  todosALaHabitacion,
} from "./casaJardin.ts";
import { emptyProgress, parseProgress, serializeProgress } from "./progress.ts";

const ahora = new Date(2026, 10, 20, 12);
const manana = new Date(2026, 10, 21, 12);
const casaCon = (...mundos: number[]) => asegurarGatitos(casaVacia(ahora), mundos, ahora);
const ida = (casa: CasaProgress) => normalizeCasa(JSON.parse(JSON.stringify(casa)));

test("el jardín mide como la habitación y sus sitios están en su suelo", () => {
  assert.equal(JARDIN.ancho, 1280);
  assert.equal(JARDIN.alto, 540);
  for (const sitio of [JARDIN.sitios.puerta, JARDIN.sitios.colchoneta, JARDIN.sitios.arbol, JARDIN.sitios.hierba]) assert.ok(dentroDelSuelo(JARDIN, sitio.x, sitio.y));
  assert.ok(sobreLaColchoneta(JARDIN.sitios.colchoneta.x, JARDIN.sitios.colchoneta.y - 40));
  assert.ok(sobreLaPuerta("jardin", 140, 300) && sobreLaPuerta("habitacion", 140, 300));
  assert.ok(!sobreLaPuerta("jardin", 600, 300));
  assert.equal(JARDIN.maceteros.length, 3);
  JARDIN.maceteros.forEach((caja, i) => assert.equal(maceteroBajo(caja.left + caja.width / 2, caja.top + caja.height / 2), i));
  assert.equal(maceteroBajo(600, 470), null);
});

test("todos empiezan en la habitación; llevar a uno al jardín y volver", () => {
  let casa = casaCon(1, 2, 3);
  assert.deepEqual(gatitosEn(casa, "habitacion"), [1, 2, 3]);
  casa = llevarA(casa, 2, "jardin");
  assert.equal(estanciaDe(casa, 2), "jardin");
  assert.deepEqual(gatitosEn(casa, "jardin"), [2]);
  assert.deepEqual(gatitosEn(casa, "habitacion"), [1, 3]);
  assert.deepEqual(ida(casa)?.enJardin, [2]);
  casa = llevarA(casa, 2, "habitacion");
  assert.equal(casa.enJardin, undefined);
});

test("los de paseo no van al jardín, y al volver de paseo entran en la habitación", () => {
  let casa = casaCon(1, 2, 3, 4, 5, 6);
  assert.equal(llevarA(casa, 6, "jardin"), casa);
  casa = llevarA(casa, 5, "jardin");
  casa = { ...casa, enCasa: [1, 2, 3, 4] };
  assert.equal(estanciaDe(casa, 5), "habitacion");
  casa = traerACasa(casa, 5);
  assert.equal(estanciaDe(casa, 5), "habitacion");
  assert.equal(casa.enJardin, undefined);
});

test("a la hora de dormir todos vuelven a la habitación; de noche nadie cambia solo", () => {
  const casa = llevarA(llevarA(casaCon(1, 2), 1, "jardin"), 2, "jardin");
  assert.deepEqual(gatitosEn(todosALaHabitacion(casa), "habitacion"), [1, 2]);
  assert.equal(cambiaSolo(() => 0, true), false);
  assert.equal(cambiaSolo(() => 0, false), true);
  assert.equal(cambiaSolo(() => 0.9, false), false);
});

test("regar una vez al día: semilla, brote, capullo y flor, con un color al brotar; en flor, brillitos", () => {
  let casa = casaCon(1);
  assert.deepEqual(jardinDe(casa).maceteros.map((m) => m.etapa), ["semilla", "semilla", "semilla"]);
  let riego = regar(casa, 0, ahora, () => 0);
  assert.ok(riego.crecio);
  casa = riego.casa;
  assert.equal(jardinDe(casa).maceteros[0].etapa, "brote");
  assert.ok(COLORES_FLOR.includes(jardinDe(casa).maceteros[0].color!));
  riego = regar(casa, 0, ahora);
  assert.ok(riego.yaRegado && !riego.crecio);
  casa = regar(casa, 0, manana).casa;
  casa = regar(casa, 0, new Date(2026, 10, 22, 12)).casa;
  assert.equal(jardinDe(casa).maceteros[0].etapa, "flor");
  riego = regar(casa, 0, new Date(2026, 10, 23, 12));
  assert.ok(riego.brillitos && !riego.crecio);
  assert.deepEqual(ida(casa)?.jardin, casa.jardin);
});

test("cada macetero brota de un color distinto mientras quedan libres", () => {
  let casa = casaCon(1);
  for (const i of [0, 1, 2]) casa = regar(casa, i, ahora, () => 0).casa;
  const colores = jardinDe(casa).maceteros.map((m) => m.color);
  assert.equal(new Set(colores).size, 3);
});

test("lectura tolerante del jardín y de quién está en él", () => {
  const casa = casaCon(1, 2);
  const leida = normalizeCasa({ ...casa, enJardin: [2, 2, 99, "x"], jardin: { maceteros: [{ color: "verde", etapa: "flor" }, { color: "azul", etapa: "capullo", regado: "ayer" }, 7] } });
  assert.deepEqual(leida?.enJardin, [2]);
  assert.deepEqual(leida?.jardin?.maceteros, [{ etapa: "semilla" }, { color: "azul", etapa: "capullo" }, { etapa: "semilla" }]);
  assert.equal(normalizeCasa({ ...casa, jardin: "nada" })?.jardin, undefined);
  assert.equal(normalizeCasa(casa)?.enJardin, undefined);
});

test("el progreso guarda el jardín de ida y vuelta", () => {
  const casa = regar(llevarA(casaCon(1), 1, "jardin"), 1, ahora, () => 0).casa;
  const progreso = parseProgress(serializeProgress({ ...emptyProgress, casa }));
  assert.deepEqual(progreso.casa?.enJardin, [1]);
  assert.deepEqual(progreso.casa?.jardin, casa.jardin);
});

test("botar en la colchoneta: con ganas de jugar, contento y corazón de una vez; sin ganas, bota igual sin cambiar nada", async () => {
  const { botar, BAJA_EN, BOTA_EN } = await import("./casaJardin.ts");
  const conGanas = (casa: CasaProgress): CasaProgress =>
    ({ ...casa, gatitos: { ...casa.gatitos, 1: { ...casa.gatitos[1], necesidades: { ...casa.gatitos[1].necesidades, jugar: 1 } } } });
  const casa = conGanas(casaCon(1));
  const con = botar(casa, 1, ahora);
  assert.equal(con.respuesta, "gracias");
  assert.ok(con.corazon);
  assert.equal(con.casa.gatitos[1].necesidades.jugar, 0);
  const sin = botar(con.casa, 1, ahora);
  assert.equal(sin.respuesta, "juegaIgual");
  assert.ok(!sin.corazon);
  assert.equal(sin.casa, con.casa);
  assert.ok(sobreLaColchoneta(BOTA_EN.x, BOTA_EN.y));
  assert.ok(dentroDelSuelo(JARDIN, BAJA_EN.x, BAJA_EN.y) && !sobreLaColchoneta(BAJA_EN.x, BAJA_EN.y));
});

test("las mariposas vuelan por el aire del jardín, se tocan cerca y se posan junto al gatito más cercano", async () => {
  const { dondeSePosa, mariposaBajo, masCercano, MARIPOSAS, POSADA_MS, POSARSE_MS, posicionPosada, VOLVER_MS, vueloDeMariposa } = await import("./casaJardin.ts");
  for (let indice = 0; indice < MARIPOSAS; indice += 1) {
    for (let ms = 0; ms < 120_000; ms += 700) {
      const { x, y } = vueloDeMariposa(indice, ms);
      assert.ok(x > 300 && x < 1120 && y > 130 && y < 390, `mariposa ${indice} a los ${ms} ms: ${x}, ${y}`);
    }
  }
  const posiciones = [{ x: 500, y: 300 }, { x: 900, y: 250 }];
  assert.equal(mariposaBajo({ x: 520, y: 290 }, posiciones), 0);
  assert.equal(mariposaBajo({ x: 700, y: 300 }, posiciones), -1);
  assert.equal(mariposaBajo({ x: 520, y: 290 }, [null, posiciones[1]]), -1);
  assert.equal(masCercano({ x: 880, y: 450 }, [{ x: 300, y: 450 }, { x: 860, y: 470 }]), 1);
  assert.equal(masCercano({ x: 0, y: 0 }, []), -1);
  const posada = { desde: 1000, de: posiciones[0], a: dondeSePosa({ x: 860, y: 470 }) };
  assert.deepEqual(posicionPosada(posada, 1000, posiciones[0]), { ...posiciones[0], quieta: false });
  assert.deepEqual(posicionPosada(posada, 1000 + POSARSE_MS + 10, posiciones[0]), { ...posada.a, quieta: true });
  assert.equal(posicionPosada(posada, 1000 + POSARSE_MS + POSADA_MS + VOLVER_MS, posiciones[0]), null);
});

test("los sitios de día del jardín están en su suelo, lejos de la colchoneta, y los maceteros sobre la jardinera", () => {
  for (const sitio of JARDIN.sitiosDia) {
    assert.ok(dentroDelSuelo(JARDIN, sitio.x, sitio.y), `${sitio.x}, ${sitio.y}`);
    assert.ok(!sobreLaColchoneta(sitio.x, sitio.y - 30));
  }
  for (const caja of JARDIN.maceteros) assert.ok(caja.left >= JARDIN.suelo.derecha && caja.left + caja.width <= JARDIN.ancho);
});

test("cada macetero se dibuja con su celda: semilla, brote y, por color, capullo y flor", async () => {
  const { celdaDeMacetero, CELDAS_MACETEROS, maceteroPorRegar } = await import("./casaJardin.ts");
  assert.equal(celdaDeMacetero({ etapa: "semilla" }), 0);
  assert.equal(celdaDeMacetero({ etapa: "brote", color: "azul" }), 1);
  assert.equal(celdaDeMacetero({ etapa: "capullo", color: "roja" }), 2);
  assert.equal(celdaDeMacetero({ etapa: "flor", color: "roja" }), 3);
  assert.equal(celdaDeMacetero({ etapa: "flor", color: "rosa" }), CELDAS_MACETEROS - 1);
  let casa = casaCon(1);
  assert.equal(maceteroPorRegar(casa, ahora), 0);
  casa = regar(casa, 0, ahora).casa;
  assert.equal(maceteroPorRegar(casa, ahora), 1);
});
