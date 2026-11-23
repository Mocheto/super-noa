import assert from "node:assert/strict";
import test from "node:test";
import { asegurarGatitos, casaVacia } from "./casa.ts";
import { azarDelDia, climaDePrueba, climaDelDia, climaQueSeVe, miranPorLaVentana, temporadaDeNieve, type Clima } from "./casaClima.ts";
import { decidir, nuevoAndante } from "./casaDeambular.ts";
import { HABITACION_CASA } from "./casaHabitacion.ts";
import { normalizeFotos } from "./casaFoto.ts";

const dias = (desde: Date, cuantos: number) => Array.from({ length: cuantos }, (_, i) => new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + i, 12));

test("el clima es el mismo todo el día y cambia de un día a otro", () => {
  const manana = new Date(2026, 4, 10, 8), noche = new Date(2026, 4, 10, 23, 30);
  assert.equal(climaDelDia(manana), climaDelDia(noche));
  assert.ok(azarDelDia("2026-05-10") >= 0 && azarDelDia("2026-05-10") < 1);
  assert.ok(new Set(dias(new Date(2026, 3, 1), 30).map(climaDelDia)).size >= 3, "en un mes hay variedad");
});

test("reparto: sol 6 de cada 10, lluvia 1 de cada 4 y arcoíris el resto; nieve solo en Navidad", () => {
  const cuenta: Record<Clima, number> = { sol: 0, lluvia: 0, nieve: 0, arcoiris: 0 };
  const anio = dias(new Date(2027, 0, 7), 3 * 365).filter((d) => !temporadaDeNieve(d));
  for (const dia of anio) cuenta[climaDelDia(dia)] += 1;
  assert.equal(cuenta.nieve, 0, "fuera de Navidad no nieva");
  assert.ok(Math.abs(cuenta.sol / anio.length - 0.6) < 0.05, `sol ${cuenta.sol / anio.length}`);
  assert.ok(Math.abs(cuenta.lluvia / anio.length - 0.25) < 0.05, `lluvia ${cuenta.lluvia / anio.length}`);
  const navidad = dias(new Date(2026, 11, 1), 37);
  assert.ok(navidad.every(temporadaDeNieve) && !temporadaDeNieve(new Date(2027, 0, 7)));
  assert.ok(navidad.every((d) => climaDelDia(d) !== "lluvia"), "en Navidad la lluvia es nieve");
  assert.ok(navidad.some((d) => climaDelDia(d) === "nieve"), "y alguna vez nieva");
});

test("de noche el arcoíris no se ve; lluvia y nieve siguen", () => {
  assert.equal(climaQueSeVe("arcoiris", true), "sol");
  assert.equal(climaQueSeVe("arcoiris", false), "arcoiris");
  assert.equal(climaQueSeVe("nieve", true), "nieve");
  assert.ok(miranPorLaVentana("lluvia") && miranPorLaVentana("nieve") && !miranPorLaVentana("arcoiris"));
});

test("en la web se puede forzar el clima para probarlo", () => {
  assert.equal(climaDePrueba("?casaClima=nieve"), "nieve");
  assert.equal(climaDePrueba("?casaClima=granizo"), null);
  assert.equal(climaDePrueba(null), null);
});

test("con lluvia o nieve, los gatitos van a sentarse a la ventana", () => {
  const ahora = new Date(2026, 4, 10, 12);
  const gatito = asegurarGatitos(casaVacia(ahora), [1], ahora).gatitos[1];
  const ventana = HABITACION_CASA.sitios.ventana!;
  const contexto = { habitacion: HABITACION_CASA, noche: false, casaLimpia: true, alguienPide: false, sitioNoche: { x: 0, y: 0 }, azar: () => 0.1, ahora: 0 };
  const andante = nuevoAndante({ x: 300, y: 480 }, 0);
  const conLluvia = decidir(andante, gatito, [], { ...contexto, miranFuera: true });
  assert.deepEqual(conLluvia.destino, { x: ventana.x, y: ventana.y });
  const conSol = decidir(andante, gatito, [], contexto);
  assert.notDeepEqual(conSol.destino, { x: ventana.x, y: ventana.y });
});

test("la foto guarda el clima, y las antiguas (sin él) siguen valiendo", () => {
  const base = { hecha: "2026-11-23T10:00:00.000Z", vista: { x: 0, ancho: 960 }, noche: false, gatitos: [] };
  assert.equal(normalizeFotos([{ ...base, clima: "nieve" }])[0].clima, "nieve");
  assert.equal(normalizeFotos([base])[0].clima, undefined);
  assert.equal(normalizeFotos([{ ...base, clima: "granizo" }])[0].clima, undefined);
});
