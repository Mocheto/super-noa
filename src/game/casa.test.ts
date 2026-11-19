import assert from "node:assert/strict";
import test from "node:test";
import {
  asegurarGatitos, avanzar, barrer, bocadilloDe, casaLimpia, casaVacia, cuidar, dejarHuella, dePaseoDe, elegirVida, enCasaDe, estadosDe, horasDespierto,
  mandarDePaseo, MAX_HUELLAS, normalizeCasa, pistasDe, saludoAlEntrar, traerACasa, type CasaProgress,
} from "./casa.ts";
import { parseProgress, serializeProgress, emptyProgress } from "./progress.ts";

// Fechas en hora local del dispositivo, como las lee el juego.
const a = (dia: number, hora: number, minuto = 0) => new Date(2026, 10, dia, hora, minuto);

const conGatitos = (ahora: Date, ...mundos: number[]) => asegurarGatitos(casaVacia(ahora), mundos, ahora);
const necesidades = (casa: CasaProgress, mundo = 1) => casa.gatitos[mundo].necesidades;

test("las necesidades llegan a «pide» en 6, 8, 10 y 12 horas despierto, con «se nota» a la mitad", () => {
  const inicio = conGatitos(a(18, 8), 1);
  const tres = avanzar(inicio, a(18, 11));
  assert.deepEqual(estadosDe(tres.gatitos[1]), { comer: "seNota", mimos: "bien", bano: "bien", jugar: "bien" });
  const seis = avanzar(inicio, a(18, 14));
  assert.equal(estadosDe(seis.gatitos[1]).comer, "pide");
  assert.equal(estadosDe(seis.gatitos[1]).bano, "seNota");
  const doce = avanzar(inicio, a(18, 20));
  assert.deepEqual(estadosDe(doce.gatitos[1]), { comer: "pide", mimos: "pide", bano: "pide", jugar: "pide" });
  assert.ok(Object.values(necesidades(doce)).every((valor) => valor === 1), "se quedan en «pide» sin pasar de 1");
});

test("de noche (21–8 h) duermen y las necesidades no suben", () => {
  assert.equal(horasDespierto(a(18, 20), a(19, 9)), 2, "de 20 a 21 y de 8 a 9");
  const noche = avanzar(conGatitos(a(18, 21), 1), a(19, 8));
  assert.deepEqual(estadosDe(noche.gatitos[1]), { comer: "bien", mimos: "bien", bano: "bien", jugar: "bien" });
});

test("el reloj cuenta como mucho 48 horas y no regala nada si va hacia atrás", () => {
  const inicio = conGatitos(a(10, 9), 1);
  const semana = avanzar(inicio, a(17, 9));
  assert.equal(estadosDe(semana.gatitos[1]).comer, "pide", "tras una semana, pidiendo pero sin empeorar");
  const atras = avanzar(inicio, a(9, 9));
  assert.deepEqual(necesidades(atras), necesidades(inicio));
  assert.equal(atras.calculadoEn, inicio.calculadoEn, "al volver a la hora buena se sigue contando desde antes");
  assert.equal(horasDespierto(a(18, 9), a(18, 9)), 0);
});

test("el bocadillo enseña una sola cosa, la más urgente en orden: comer, mimos, baño y jugar", () => {
  const casa = avanzar(conGatitos(a(18, 8), 1), a(18, 20));
  assert.equal(bocadilloDe(casa.gatitos[1]), "comer");
  const comido = cuidar(casa, 1, "comer", a(18, 20)).casa;
  assert.equal(bocadilloDe(comido.gatitos[1]), "mimos");
  const mimado = cuidar(comido, 1, "frotar", a(18, 20)).casa;
  assert.equal(bocadilloDe(mimado.gatitos[1]), "bano");
  assert.deepEqual(pistasDe(avanzar(conGatitos(a(18, 8), 1), a(18, 13)).gatitos[1]), ["comer", "mimos", "jugar"], "a las 5 h el baño aún está bien");
});

test("cuidar lo que hace falta da las gracias y un corazón; lo que no, nunca es un error", () => {
  const casa = avanzar(conGatitos(a(18, 8), 1), a(18, 11));
  const comer = cuidar(casa, 1, "comer", a(18, 11));
  assert.deepEqual([comer.respuesta, comer.corazon, comer.casa.gatitos[1].corazones], ["gracias", true, 1]);
  assert.equal(comer.casa.gatitos[1].necesidades.comer, 0);
  const otraVez = cuidar(comer.casa, 1, "comer", a(18, 11));
  assert.deepEqual([otraVez.respuesta, otraVez.corazon], ["ahoraNo", false], "con el cuenco lleno lo huele y gira la cabeza");
  assert.equal(cuidar(comer.casa, 1, "esponja", a(18, 11)).respuesta, "ahoraNo", "limpio, se sacude y se va");
  assert.equal(cuidar(comer.casa, 1, "frotar", a(18, 11)).respuesta, "ronronea", "los mimos siempre gustan");
  assert.equal(cuidar(comer.casa, 1, "pelota", a(18, 11)).respuesta, "juegaIgual");
});

test("jugar pide tres pelotas atrapadas", () => {
  let casa = avanzar(conGatitos(a(18, 8), 1), a(18, 13));
  assert.equal(estadosDe(casa.gatitos[1]).jugar, "seNota");
  const respuestas = [];
  for (let vez = 0; vez < 3; vez++) {
    const resultado = cuidar(casa, 1, "pelota", a(18, 13));
    respuestas.push(resultado.respuesta);
    casa = resultado.casa;
  }
  assert.deepEqual(respuestas, ["sigueJugando", "sigueJugando", "gracias"]);
  assert.deepEqual([casa.gatitos[1].necesidades.jugar, casa.gatitos[1].lanzamientos], [0, 0]);
});

test("dos corazones al día como mucho, cinco para ser mejor amigo y nunca se pierden", () => {
  let casa = avanzar(conGatitos(a(18, 8), 1), a(18, 20));
  const corazones = [];
  for (const cuidado of ["comer", "frotar", "esponja"] as const) {
    const resultado = cuidar(casa, 1, cuidado, a(18, 20));
    corazones.push(resultado.corazon);
    casa = resultado.casa;
  }
  assert.deepEqual(corazones, [true, true, false], "el tercero del día no suma");
  for (const dia of [19, 20]) {
    casa = avanzar(casa, a(dia, 20));
    casa = cuidar(casa, 1, "comer", a(dia, 20)).casa;
    casa = cuidar(casa, 1, "frotar", a(dia, 20)).casa;
  }
  assert.equal(casa.gatitos[1].corazones, 5);
  assert.equal(saludoAlEntrar(casa.gatitos[1]), "cantar", "el mejor amigo canta al entrar Noa");
  casa = avanzar(casa, a(21, 20));
  assert.equal(cuidar(casa, 1, "comer", a(21, 20)).casa.gatitos[1].corazones, 5, "no pasa de cinco");
  assert.equal(saludoAlEntrar(conGatitos(a(18, 8), 2).gatitos[2]), null);
});

test("un gatito sucio deja huellas de barro, hasta seis, y la escoba las barre", () => {
  const limpio = conGatitos(a(18, 8), 1);
  assert.equal(dejarHuella(limpio, 1, 100).huellas.length, 0, "limpio no mancha");
  let sucio = avanzar(limpio, a(18, 14));
  assert.equal(estadosDe(sucio.gatitos[1]).bano, "seNota");
  for (let paso = 0; paso < 10; paso++) sucio = dejarHuella(sucio, 1, paso * 90);
  assert.equal(sucio.huellas.length, MAX_HUELLAS);
  assert.equal(casaLimpia(sucio), false);
  let barrida = sucio;
  while (barrida.huellas.length) barrida = barrer(barrida, 0);
  assert.equal(casaLimpia(barrida), true);
  assert.equal(barrer(barrida, 3), barrida, "barrer donde no hay nada no cambia nada");
});

test("vida propia: pide antes que nada, de noche duerme y con la casa limpia canta más", () => {
  const sereno = conGatitos(a(18, 8), 1).gatitos[1];
  const pidiendo = avanzar(conGatitos(a(18, 8), 1), a(18, 14)).gatitos[1];
  const fijo = (valor: number) => () => valor;
  assert.equal(elegirVida(pidiendo, { noche: false, casaLimpia: true, alguienPide: true }, fijo(0.5)).estado, "pedir");
  assert.equal(elegirVida(sereno, { noche: true, casaLimpia: true, alguienPide: false }, fijo(0.5)).estado, "dormir");
  for (const valor of [0, 0.5, 0.999]) {
    const { segundos } = elegirVida(sereno, { noche: false, casaLimpia: false, alguienPide: false }, fijo(valor));
    assert.ok(segundos >= 4 && segundos <= 10, `${segundos} s`);
  }
  const veces = (contexto: { casaLimpia: boolean; alguienPide: boolean }) => {
    let cantar = 0;
    for (let i = 0; i < 1000; i++) if (elegirVida(sereno, { noche: false, ...contexto }, fijo(i / 1000)).estado === "cantar") cantar += 1;
    return cantar;
  };
  assert.ok(veces({ casaLimpia: true, alguienPide: false }) > veces({ casaLimpia: false, alguienPide: false }));
  assert.equal(veces({ casaLimpia: true, alguienPide: true }), veces({ casaLimpia: false, alguienPide: false }));
});

test("los gatitos rescatados llegan a la casa con todo «bien» y los que ya estaban no cambian", () => {
  const casa = avanzar(conGatitos(a(18, 8), 1), a(18, 14));
  const conDos = asegurarGatitos(casa, [1, 2], a(18, 14));
  assert.deepEqual(conDos.gatitos[1], casa.gatitos[1]);
  assert.deepEqual(estadosDe(conDos.gatitos[2]), { comer: "bien", mimos: "bien", bano: "bien", jugar: "bien" });
  assert.equal(asegurarGatitos(conDos, [1, 2], a(18, 14)), conDos);
});

test("el campo «casa» del progreso es opcional, tolerante y se guarda", () => {
  assert.equal(normalizeCasa(undefined), undefined);
  assert.equal(normalizeCasa({ gatitos: {} }), undefined, "sin fecha no hay casa");
  const raro = normalizeCasa({
    calculadoEn: "2026-11-18T09:00:00.000Z",
    gatitos: { 1: { necesidades: { comer: 7, mimos: -1, bano: "x" }, corazones: 9, corazonesHoy: 4, lanzamientos: 8 }, gato: {}, 0: {} },
    huellas: [{ x: 5000, mundo: 1 }, { x: 10, mundo: 3 }, "x", ...Array.from({ length: 9 }, () => ({ x: 1, mundo: 1 }))],
  })!;
  assert.deepEqual(Object.keys(raro.gatitos), ["1"]);
  assert.deepEqual(raro.gatitos[1].necesidades, { comer: 1, mimos: 0, bano: 0, jugar: 0 });
  assert.deepEqual([raro.gatitos[1].corazones, raro.gatitos[1].corazonesHoy, raro.gatitos[1].lanzamientos], [5, 2, 2]);
  assert.equal(raro.huellas.length, MAX_HUELLAS);
  assert.equal(raro.huellas[0].x, 960);

  const antiguo = parseProgress(JSON.stringify({ version: 2, unlocked: 3, levelStats: {} }));
  assert.equal(antiguo.casa, undefined, "un guardado sin casa sigue cargando");
  const conCasa = { ...emptyProgress, casa: avanzar(conGatitos(a(18, 8), 1, 2), a(18, 12)) };
  assert.deepEqual(parseProgress(serializeProgress(conCasa)).casa, conCasa.casa);
});

test("cinco gatitos en casa como mucho; los demás de paseo, con las necesidades quietas", () => {
  const manana = a(19, 9);
  const llena = asegurarGatitos(casaVacia(manana), [1, 2, 3, 4, 5, 6, 7], manana);
  assert.deepEqual(enCasaDe(llena), [1, 2, 3, 4, 5], "entran mientras hay sitio");
  assert.deepEqual(dePaseoDe(llena), [6, 7]);
  // Lleno: traer a uno de paseo no hace nada.
  assert.equal(traerACasa(llena, 6), llena);
  // Se manda a uno de paseo y entra otro.
  const cambio = traerACasa(mandarDePaseo(llena, 2), 7);
  assert.deepEqual(enCasaDe(cambio), [1, 3, 4, 5, 7]);
  assert.deepEqual(dePaseoDe(cambio), [2, 6]);
  // Seis horas después, el de casa tiene hambre y el de paseo sigue igual.
  const tarde = avanzar(cambio, a(19, 15));
  assert.equal(necesidades(tarde, 1).comer, 1);
  assert.equal(necesidades(tarde, 2).comer, 0);
  // El de paseo no deja huellas.
  const sucio = { ...tarde, gatitos: { ...tarde.gatitos, 2: { ...tarde.gatitos[2], necesidades: { ...tarde.gatitos[2].necesidades, bano: 1 } } } };
  assert.equal(dejarHuella(sucio, 2, 100), sucio);
});

test("quién está en casa se guarda con tolerancia y sin él salen los cinco primeros", () => {
  const manana = a(19, 9);
  const casa = asegurarGatitos(casaVacia(manana), [1, 2, 3, 4, 5, 6, 7], manana);
  const antigua = { ...casa, enCasa: undefined };
  assert.deepEqual(enCasaDe(antigua), [1, 2, 3, 4, 5], "un guardado sin elegir saca los cinco primeros");
  assert.deepEqual(normalizeCasa({ ...casa, enCasa: [7, 7, 99, "3", 1, 2, 4, 5, 6] })?.enCasa, [1, 2, 3, 4, 5]);
  const leida = parseProgress(serializeProgress({ ...emptyProgress, casa: traerACasa(mandarDePaseo(casa, 1), 6) }));
  assert.deepEqual(leida.casa && enCasaDe(leida.casa), [2, 3, 4, 5, 6]);
});
