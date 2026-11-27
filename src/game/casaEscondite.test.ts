import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import {
  COLARSE_A_LOS_MS, cuandoSeCuela, ENTRADA_ESCONDITE, esconder, esconditeVacio, MAULLA_CADA_MS, pasarRato, PRIMER_MAULLIDO_MS,
  puedeEsconderse, sacar, SALE_SOLO_MS, tocarPuertas,
} from "./casaEscondite.ts";
import { dentroDelSuelo, HABITACION_CASA as H, sobreElArmario, sobreElEscondite, sobreLaBanera } from "./casaHabitacion.ts";
import { enLaPecera, PECERA, zonaDe } from "./casaPecera.ts";
import { MADERA_DESDE } from "./casaDecoracion.ts";

const despierto = { dormido: false, arropado: false, horaDeDormir: false };

test("las puertas se abren y se cierran juntas con cada toque", () => {
  const abierta = tocarPuertas(esconditeVacio());
  assert.deepEqual([abierta.escondite.abierto, abierta.sale], [true, null]);
  assert.equal(tocarPuertas(abierta.escondite).escondite.abierto, false);
});

test("cabe un solo gatito, despierto y fuera de la hora de dormir", () => {
  const vacio = esconditeVacio();
  assert.ok(puedeEsconderse(vacio, despierto));
  assert.ok(!puedeEsconderse(vacio, { ...despierto, dormido: true }));
  assert.ok(!puedeEsconderse(vacio, { ...despierto, arropado: true }));
  assert.ok(!puedeEsconderse(vacio, { ...despierto, horaDeDormir: true }));
  const lleno = esconder({ ...vacio, abierto: true }, 3, 1000);
  assert.deepEqual([lleno.gatito, lleno.abierto], [3, false], "al entrar se cierran las puertas");
  assert.ok(!puedeEsconderse(lleno, despierto));
  assert.equal(esconder(lleno, 5, 2000), lleno);
});

test("al abrir sale enseguida y las puertas quedan abiertas", () => {
  const salida = tocarPuertas(esconder(esconditeVacio(), 2, 0));
  assert.equal(salida.sale, 2);
  assert.deepEqual([salida.escondite.abierto, salida.escondite.gatito], [true, null]);
  const rato = pasarRato(salida.escondite, 10 * SALE_SOLO_MS, () => 0.5);
  assert.deepEqual([rato.escondite.abierto, rato.maulla, rato.seAcabo], [true, false, false], "nadie las cierra por Noa");
  assert.equal(sacar(esconditeVacio()).sale, null);
});

test("dentro maúlla de vez en cuando y al minuto toca salir", () => {
  let escondite = esconder(esconditeVacio(), 4, 0);
  const maullidos: number[] = [];
  let sale = 0;
  for (let t = 0; t <= SALE_SOLO_MS && !sale; t += 250) {
    const rato = pasarRato(escondite, t, () => 0.5);
    escondite = rato.escondite;
    if (rato.maulla) maullidos.push(t);
    if (rato.seAcabo) sale = t;
  }
  assert.equal(sale, SALE_SOLO_MS);
  assert.equal(maullidos[0], PRIMER_MAULLIDO_MS);
  const separacion = maullidos[1] - maullidos[0];
  assert.ok(separacion >= MAULLA_CADA_MS[0] && separacion <= MAULLA_CADA_MS[1]);
});

test("a veces uno se cuela solo, pasado un rato", () => {
  assert.equal(cuandoSeCuela(() => 0.9), null);
  const espera = cuandoSeCuela(() => 0.2)!;
  assert.ok(espera >= COLARSE_A_LOS_MS[0] && espera <= COLARSE_A_LOS_MS[1]);
});

test("las puertas se tocan en el mueble, sobre la madera que se recolorea", () => {
  const { izquierda, derecha, arriba, abajo } = PECERA.puertas;
  assert.ok(arriba >= MADERA_DESDE && abajo <= PECERA.alto);
  assert.equal(zonaDe(60, 280), "puertas");
  assert.equal(zonaDe(350, 280), "puertas");
  assert.equal(zonaDe((izquierda + derecha) / 2, arriba), "puertas");
  assert.equal(zonaDe(200, 140), "agua", "el agua sigue siendo agua");
  assert.ok(enLaPecera(PECERA.left + 60, PECERA.top + 280));
});

test("un gatito soltado en el mueble entra; el sitio no se pisa con la bañera ni el armario", () => {
  const centro = { x: PECERA.left + PECERA.ancho / 2, y: PECERA.top + 280 };
  assert.ok(sobreElEscondite(H, centro.x, centro.y));
  assert.ok(!sobreElEscondite(H, centro.x, H.suelo.delante), "delante, en el suelo, no entra");
  assert.ok(!sobreElArmario(H, centro.x, centro.y) && !sobreLaBanera(H, centro.x, centro.y));
  assert.ok(dentroDelSuelo(H, ENTRADA_ESCONDITE.x, ENTRADA_ESCONDITE.y));
  assert.ok(dentroDelSuelo(H, H.salidaEscondite.x, H.salidaEscondite.y));
  assert.ok(H.salidaEscondite.y - H.sitios.pecera.y >= 40, "al salir queda delante, sin tapar las puertas");
});

test("el arte del escondite existe", () => {
  for (const ruta of [PECERA.escondite.dentro, PECERA.escondite.puertas, PECERA.escondite.colas]) {
    assert.ok(existsSync(new URL(`../../public/${ruta.replace("./", "")}`, import.meta.url)), ruta);
  }
});
