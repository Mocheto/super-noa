import assert from "node:assert/strict";
import { test } from "node:test";
import { nuevoAndante, type Andante } from "./casaDeambular.ts";
import {
  atrapadaSinMoverse, avanzarBola, limitesDe, nuevaBola, nuevoJuego, pasoJuego, quienJuega, quieta, sinGatito, type Juego,
} from "./casaPelota.ts";

const suelo = { izquierda: -330, derecha: 1170, fondo: 405, delante: 520 };

/** Juega hasta que acaba (o 20 s) y cuenta lo que pasa. */
function jugar(juego: Juego, gatito: Andante | null) {
  const fases: string[] = [];
  let atrapadas = 0;
  let botes = 0;
  let acaba = false;
  for (let ahora = 0; ahora < 20_000 && !acaba; ahora += 16) {
    const paso = pasoJuego(juego, gatito, 16, ahora);
    juego = paso.juego;
    gatito = paso.gatito;
    if (paso.atrapa) atrapadas += 1;
    if (paso.boto) botes += 1;
    acaba = paso.acaba;
    if (fases.at(-1) !== juego.fase) fases.push(juego.fase);
    assert.ok(juego.bola.x >= juego.limites.izquierda && juego.bola.x <= juego.limites.derecha, "la pelota no se sale");
    assert.ok(juego.bola.z >= 0);
  }
  return { juego, gatito, fases, atrapadas, botes, acaba };
}

test("la pelota se queda dentro de lo que se ve", () => {
  const limites = limitesDe(suelo, { x: 100, ancho: 560 });
  assert.deepEqual([limites.izquierda, limites.derecha], [140, 620]);
  assert.deepEqual(limitesDe(suelo, { x: -1140, ancho: 400 }), suelo);
});

test("soltada en alto cae, bota y acaba parada en el suelo", () => {
  const limites = limitesDe(suelo, { x: 100, ancho: 560 });
  let bola = nuevaBola({ x: 300, y: 200 }, { vx: 700, vy: -300 }, limites);
  assert.equal(bola.y, 405);
  assert.equal(bola.z, 205);
  let botes = 0;
  for (let i = 0; i < 800; i += 1) {
    const paso = avanzarBola(bola, 16, limites);
    bola = paso.bola;
    if (paso.boto) botes += 1;
  }
  assert.ok(botes >= 2);
  assert.ok(quieta(bola));
  assert.notEqual(bola.giro, 0);
});

test("sin impulso rueda hacia el centro", () => {
  const limites = limitesDe(suelo, { x: 100, ancho: 560 });
  assert.ok(nuevaBola({ x: 600, y: 480 }, { vx: 0, vy: 0 }, limites).vx < 0);
  assert.ok(nuevaBola({ x: 150, y: 480 }, { vx: 0, vy: 0 }, limites).vx > 0);
});

test("va el despierto más cercano con ganas; si ninguno tiene, el más cercano", () => {
  const gatito = (clave: number, x: number, despierto: boolean, ganas: boolean) => ({ clave, pies: { x, y: 460 }, despierto, ganas });
  const bola = { x: 100, y: 460 };
  assert.equal(quienJuega(bola, [gatito(1, 110, false, true), gatito(2, 200, true, false), gatito(3, 900, true, true)]), 3);
  assert.equal(quienJuega(bola, [gatito(1, 900, true, false), gatito(2, 200, true, false)]), 2);
  assert.equal(quienJuega(bola, [gatito(1, 110, false, true)]), null);
});

test("el gatito la mira, corre, se agazapa, salta, la sujeta una vez y la empuja", () => {
  const limites = limitesDe(suelo, { x: 100, ancho: 560 });
  const bola = nuevaBola({ x: 300, y: 250 }, { vx: 400, vy: 0 }, limites);
  // El gatito está lejos, fuera de la vista.
  const fin = jugar(nuevoJuego(bola, limites, true), nuevoAndante({ x: 1100, y: 500 }, 0));
  assert.deepEqual(fin.fases, ["mira", "corre", "agazapa", "salta", "sujeta", "empuja"]);
  assert.equal(fin.atrapadas, 1);
  assert.ok(fin.botes >= 1);
  assert.ok(fin.acaba);
  assert.equal(fin.gatito!.destino, null);
});

test("sin gatito la pelota rueda sola y se va al rato", () => {
  const limites = limitesDe(suelo, { x: 100, ancho: 560 });
  const fin = jugar(nuevoJuego(nuevaBola({ x: 300, y: 450 }, { vx: 300, vy: 0 }, limites), limites, false), null);
  assert.equal(fin.atrapadas, 0);
  assert.ok(fin.acaba);
  const juego = nuevoJuego(nuevaBola({ x: 300, y: 450 }, { vx: 300, vy: 0 }, limites), limites, true);
  assert.equal(sinGatito(juego).fase, "sola");
});

test("con movimiento tranquilo la sujeta sin moverse nada más", () => {
  const limites = limitesDe(suelo, { x: 100, ancho: 560 });
  const juego = nuevoJuego(nuevaBola({ x: 300, y: 450 }, { vx: 0, vy: 0 }, limites), limites, true);
  const hecho = atrapadaSinMoverse(juego, nuevoAndante({ x: 900, y: 500 }, 0), 0);
  assert.equal(hecho.juego.fase, "sujeta");
  assert.ok(Math.abs(hecho.gatito.x - hecho.juego.bola.x) < 60);
});
