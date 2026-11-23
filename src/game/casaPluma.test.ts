import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { asegurarGatitos, casaVacia, type CasaProgress } from "./casa.ts";
import { nuevoAndante } from "./casaDeambular.ts";
import { HABITACION_CASA } from "./casaHabitacion.ts";
import {
  bajoLaPluma, ALCANCE, ALTO_SALTO, atraparPluma, HILO, moverPluma, nuevaPluma, perseguir, plumaQuieta, plumaSoltada, PARA_A, QUIETA_MS,
  puntaDeCana, quienAtrapa, quiereLaPluma, TEMBLOR, VELOCIDAD_PERSIGUE,
} from "./casaPluma.ts";

const ahora = new Date(2026, 10, 23, 12);
const conGanas = (valor: number): CasaProgress => {
  const casa = asegurarGatitos(casaVacia(ahora), [1, 2], ahora);
  return { ...casa, gatitos: { ...casa.gatitos, 1: { ...casa.gatitos[1], necesidades: { ...casa.gatitos[1].necesidades, jugar: valor } } } };
};
const suelo = HABITACION_CASA.suelo;

test("la pluma cuelga del hilo y sigue a la caña con un poco de retraso", () => {
  const pluma = nuevaPluma({ x: 400, y: 200 }, 0);
  assert.deepEqual({ x: pluma.x, y: pluma.y }, { x: 400, y: 200 + HILO });
  const poco = moverPluma(pluma, { x: 600, y: 200 }, 50, 50);
  assert.ok(poco.x > 400 && poco.x < 600, "va detrás de la caña");
  let luego = poco;
  for (let ms = 100; ms <= 1000; ms += 50) luego = moverPluma(luego, { x: 600, y: 200 }, 50, ms);
  assert.ok(Math.abs(luego.x - 600) < 1, "al rato llega");
});

test("quieta medio segundo, sin contar el temblor del dedo; al moverla vuelve a empezar", () => {
  let pluma = nuevaPluma({ x: 400, y: 200 }, 0);
  pluma = moverPluma(pluma, { x: 400 + TEMBLOR / 2, y: 203 }, 300, 300);
  assert.ok(!plumaQuieta(pluma, 300));
  assert.ok(plumaQuieta(pluma, QUIETA_MS), "el temblor no cuenta");
  pluma = moverPluma(pluma, { x: 700, y: 200 }, 50, QUIETA_MS + 50);
  assert.ok(!plumaQuieta(pluma, QUIETA_MS + 100), "al moverla deprisa no está quieta");
  assert.ok(!plumaQuieta(plumaSoltada(pluma, 2000), 2000 + QUIETA_MS - 1), "tras atraparla hay que esperar otra vez");
});

test("la persiguen los que tienen ganas de jugar", () => {
  assert.ok(quiereLaPluma(conGanas(0.6).gatitos[1]), "se nota");
  assert.ok(quiereLaPluma(conGanas(1).gatitos[1]), "pide");
  assert.ok(!quiereLaPluma(conGanas(0).gatitos[1]), "sin ganas, solo mira");
  assert.ok(!quiereLaPluma(undefined));
});

test("corre más deprisa que al deambular hasta el suelo bajo la pluma, y allí se sienta mirándola", () => {
  const andante = nuevoAndante({ x: 200, y: 480 }, 0);
  const pluma = { x: 800, y: 300 };
  const paso = perseguir(andante, pluma, suelo, 100, 100);
  assert.ok(paso.destino, "corre");
  assert.ok(Math.abs(Math.hypot(paso.x - 200, paso.y - 480) - VELOCIDAD_PERSIGUE / 10) < 0.01);
  assert.equal(paso.mira, 1);
  assert.ok(paso.destino!.y >= suelo.fondo, "no sube al aire: va al suelo");
  let actual = paso;
  for (let ms = 200; ms < 6000; ms += 100) actual = perseguir(actual, pluma, suelo, 100, ms);
  assert.equal(actual.destino, null, "ha llegado");
  assert.ok(Math.hypot(actual.x - 800, actual.y - suelo.fondo) <= PARA_A + 0.01);
});

test("con la pluma quieta la atrapa el más cercano que la alcanza; muy alta o en movimiento, nadie", () => {
  let pluma = nuevaPluma({ x: 500, y: 300 }, 0);
  const candidatos = [
    { clave: 1, pies: { x: 500 + ALCANCE - 10, y: 450 } },
    { clave: 2, pies: { x: 520, y: 450 } },
    { clave: 3, pies: { x: 900, y: 450 } },
  ];
  assert.equal(quienAtrapa(pluma, candidatos, QUIETA_MS - 1), null, "aún no está quieta");
  assert.equal(quienAtrapa(pluma, candidatos, QUIETA_MS), 2);
  assert.equal(quienAtrapa(pluma, [candidatos[2]], QUIETA_MS), null, "lejos no la alcanza");
  pluma = nuevaPluma({ x: 500, y: 450 - ALTO_SALTO - HILO - 20 }, 0);
  assert.equal(quienAtrapa(pluma, candidatos, QUIETA_MS), null, "muy alta: la mira");
});

test("cada atrapada es una pelota: a las tres se le pasan las ganas y da corazón", () => {
  let casa = conGanas(1);
  const respuestas = [];
  for (let vez = 0; vez < 3; vez++) {
    const resultado = atraparPluma(casa, 1, ahora);
    casa = resultado.casa;
    respuestas.push(resultado.respuesta);
    if (vez === 2) assert.ok(resultado.corazon);
  }
  assert.deepEqual(respuestas, ["sigueJugando", "sigueJugando", "gracias"]);
  assert.ok(!quiereLaPluma(casa.gatitos[1]), "ya no la persigue");
});

test("el dedo coge la caña por el mango y la pluma cuelga lejos del dedo", () => {
  const dedo = { x: 600, y: 400 };
  const pluma = nuevaPluma(puntaDeCana(dedo), 0);
  assert.ok(Math.hypot(pluma.x - dedo.x, pluma.y - dedo.y) > 100, "el dedo no la tapa");
});

test("junto a una pared, los que la persiguen se reparten hacia dentro sin montarse", () => {
  const puntos = [-60, 0, 60].map((hueco) => bajoLaPluma({ x: 0, y: 450 }, suelo, hueco).x);
  assert.equal(new Set(puntos).size, 3);
  assert.ok(puntos.every((x) => x >= suelo.izquierda));
});

test("el arte de la caña está publicado como WebP", () => {
  assert.ok(existsSync(new URL("../../public/assets/sprites/casa-pluma-v1.webp", import.meta.url)));
});
