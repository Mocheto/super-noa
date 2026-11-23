import assert from "node:assert/strict";
import test from "node:test";
import {
  conCorona, crearMemoria, crearRondaGuiada, duracionEnsenanza, empiezaARepetir, largoDeRonda, mira, momentoEnsenanza, MS_POR_PULSO,
  PARADAS_PRACTICA, recorridoConSemilla, recorridoDeRonda, RONDAS, sitioQueBrilla, tocar, vuelveAEnsenar, type EstadoMemoria, type Sitio,
} from "./memoriaDuelo.ts";

/** Repite bien la ronda en curso. */
function repetirBien(estado: EstadoMemoria) {
  let actual = empiezaARepetir(estado);
  let evento = "";
  for (const sitio of recorridoDeRonda(actual)) ({ estado: actual, evento } = tocar(actual, sitio));
  return { estado: actual, evento };
}
const otro = (sitio: Sitio): Sitio => ((sitio + 1) % 3) as Sitio;

test("el recorrido sale siempre igual con la misma semilla y nunca repite sitio seguido", () => {
  assert.deepEqual(recorridoConSemilla(7), recorridoConSemilla(7));
  assert.notDeepEqual(recorridoConSemilla(7, 20), recorridoConSemilla(8, 20));
  for (let semilla = 0; semilla < 200; semilla++) {
    const recorrido = recorridoConSemilla(semilla, 12);
    recorrido.forEach((sitio, i) => assert.notEqual(sitio, recorrido[i - 1]));
    assert.ok(recorrido.every((sitio) => sitio >= 0 && sitio <= 2));
  }
});

test("cinco rondas de 1 a 5 sitios sobre un único recorrido que crece por el final", () => {
  let estado = crearMemoria(3);
  const largos: number[] = [];
  let evento = "";
  for (let ronda = 1; ronda <= RONDAS; ronda++) {
    largos.push(largoDeRonda(estado));
    assert.deepEqual(recorridoDeRonda(estado), estado.recorrido.slice(0, ronda));
    ({ estado, evento } = repetirBien(estado));
    assert.equal(estado.estrellas, ronda);
    if (ronda < RONDAS) { assert.equal(evento, "rondaGanada"); estado = vuelveAEnsenar(estado); }
  }
  assert.deepEqual(largos, [1, 2, 3, 4, 5]);
  assert.equal(evento, "final");
  assert.ok(conCorona(estado), "sin fallos, corona");
});

test("la guardiana enseña un sitio cada dos pulsos: uno de camino y otro cantando", () => {
  let estado = crearMemoria(5);
  ({ estado } = repetirBien(estado)); estado = vuelveAEnsenar(estado); // ronda 2: dos sitios
  const [primero, segundo] = recorridoDeRonda(estado);
  assert.deepEqual(momentoEnsenanza(estado, 0.5 * MS_POR_PULSO), { terminada: false, indice: 0, sitio: primero, cantando: false, avance: 0.5 });
  const cantaPrimero = momentoEnsenanza(estado, 1.25 * MS_POR_PULSO);
  assert.ok(!cantaPrimero.terminada && cantaPrimero.cantando && cantaPrimero.sitio === primero);
  const vaAlSegundo = momentoEnsenanza(estado, 2.1 * MS_POR_PULSO);
  assert.ok(!vaAlSegundo.terminada && !vaAlSegundo.cantando && vaAlSegundo.sitio === segundo);
  assert.equal(duracionEnsenanza(estado), 4 * MS_POR_PULSO);
  assert.deepEqual(momentoEnsenanza(estado, duracionEnsenanza(estado)), { terminada: true });
});

test("mientras enseña, lo que se toca se ignora", () => {
  const estado = crearMemoria(1);
  assert.equal(tocar(estado, 0).evento, "ignorado");
  assert.equal(tocar(estado, 0).estado, estado);
});

test("al fallar sale «CASI», se vuelve a enseñar y se repite desde el principio; con dos fallos seguidos, ayuda", () => {
  let estado = crearMemoria(9);
  ({ estado } = repetirBien(estado)); estado = vuelveAEnsenar(estado);
  estado = empiezaARepetir(estado);
  const [primero, segundo] = recorridoDeRonda(estado);
  ({ estado } = tocar(estado, primero));
  const fallo = tocar(estado, otro(segundo));
  estado = fallo.estado;
  assert.equal(fallo.evento, "casi");
  assert.equal(estado.paso, 0);
  assert.ok(!estado.ayuda, "un fallo: aún sin ayuda");
  estado = empiezaARepetir(vuelveAEnsenar(estado));
  assert.equal(sitioQueBrilla(estado), null);
  ({ estado } = tocar(estado, otro(primero)));
  assert.ok(estado.ayuda, "dos fallos seguidos: ayuda");
  estado = empiezaARepetir(vuelveAEnsenar(estado));
  assert.equal(sitioQueBrilla(estado), primero);
  ({ estado } = tocar(estado, primero));
  assert.equal(sitioQueBrilla(estado), segundo, "brilla el que toca");
  ({ estado } = tocar(estado, segundo));
  assert.equal(estado.fase, "rondaGanada");
  assert.ok(!estado.ayuda && estado.fallosSeguidos === 0, "al ganar la ronda se apaga");
  assert.equal(estado.fallos, 2);
});

test("siempre se acaba ganando, pero con un fallo no hay corona", () => {
  let estado = empiezaARepetir(crearMemoria(4));
  ({ estado } = tocar(estado, otro(recorridoDeRonda(estado)[0])));
  estado = vuelveAEnsenar(estado);
  for (let ronda = 1; ronda <= RONDAS; ronda++) {
    ({ estado } = repetirBien(estado));
    if (ronda < RONDAS) estado = vuelveAEnsenar(estado);
  }
  assert.equal(estado.fase, "final");
  assert.equal(estado.estrellas, RONDAS);
  assert.ok(!conCorona(estado));
});

test("«MIRA» vuelve a enseñar sin contar como fallo ni quitar la corona", () => {
  let estado = empiezaARepetir(crearMemoria(2));
  estado = mira(estado);
  assert.equal(estado.fase, "ensena");
  assert.equal(estado.fallos, 0);
  assert.equal(mira(estado), estado, "mientras enseña, no hace nada");
});

test("la práctica para en los tres sitios y su ronda guiada es de dos con la ayuda puesta", () => {
  assert.deepEqual(PARADAS_PRACTICA.map((parada) => parada.pieza), ["sitio-0", "sitio-1", "sitio-2"]);
  assert.ok(PARADAS_PRACTICA.every((parada, i) => i === 0 || parada.pulso > PARADAS_PRACTICA[i - 1].pulso));
  const guiada = empiezaARepetir(crearRondaGuiada(6));
  assert.equal(largoDeRonda(guiada), 2);
  assert.equal(sitioQueBrilla(guiada), recorridoDeRonda(guiada)[0]);
  const { estado, evento } = repetirBien(guiada);
  assert.equal(evento, "final");
  assert.ok(estado.ayuda, "la ayuda sigue puesta en la guiada");
});
