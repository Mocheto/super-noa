import assert from "node:assert/strict";
import test from "node:test";
import {
  abrirPuerta, aDibujo, aEscena, arrastrar, avanzar, CAMINOS, coger, COSAS, crearJaula, DIBUJO, ESCONDITES, guardadoDe,
  JAULA_EN_ESCENA, NODOS, pista, PISTA_MS, RACIONES, RADIO_JAULA, rellenar, ruta, SITIO_JAULA, soltar, tocarCosa, tocarTubo,
  type Cosa, type Jaula, type NodoId, type SonidoJaula,
} from "./casaHamsters.ts";
import { normalizeCasa, normalizeHamsters } from "./casaProgreso.ts";
import { HABITACION_CASA } from "./casaHabitacion.ts";

/** Azar repetible. */
const azarDe = (semilla: number) => () => {
  semilla = (semilla * 1664525 + 1013904223) % 4294967296;
  return semilla / 4294967296;
};

/** Deja pasar `ms` de reloj a 50 ms por paso; `ver` mira cada paso. */
function pasar(inicial: Jaula, desde: number, ms: number, azar = azarDe(7), ver?: (jaula: Jaula, t: number) => void) {
  let jaula = inicial;
  const sonidos: SonidoJaula[] = [];
  for (let t = desde + 50; t <= desde + ms; t += 50) {
    const salida = avanzar(jaula, t, azar);
    jaula = salida.jaula;
    sonidos.push(...salida.sonidos);
    ver?.(jaula, t);
  }
  return { jaula, sonidos, fin: desde + ms };
}

test("el laberinto está entero y cabe en sus 720 px de la habitación", () => {
  for (const desde of Object.keys(NODOS) as NodoId[]) {
    for (const hasta of Object.keys(NODOS) as NodoId[]) assert.ok(desde === hasta || ruta(desde, hasta).length > 0, `${desde} → ${hasta}`);
  }
  assert.deepEqual(new Set(CAMINOS.filter((c) => c.tipo === "tubo").map((c) => c.color)), new Set(["rojo", "azul", "amarillo"]));
  assert.ok(JAULA_EN_ESCENA.izquierda >= SITIO_JAULA.zona.desde && JAULA_EN_ESCENA.derecha <= SITIO_JAULA.zona.hasta);
  assert.ok(SITIO_JAULA.zona.hasta - SITIO_JAULA.zona.desde === 720);
  assert.ok(JAULA_EN_ESCENA.arriba >= 0 && JAULA_EN_ESCENA.abajo <= HABITACION_CASA.alto);
  for (const camino of CAMINOS) {
    for (const p of camino.linea) assert.ok(p.x >= DIBUJO.x && p.x <= DIBUJO.x + DIBUJO.ancho && p.y >= DIBUJO.y && p.y <= DIBUJO.y + DIBUJO.alto);
  }
  const ida = aDibujo(aEscena({ x: 200, y: 300 }));
  assert.ok(Math.abs(ida.x - 200) < 1e-9 && Math.abs(ida.y - 300) < 1e-9);
});

test("los hámsters se mueven solos por todo el laberinto, tubos incluidos", () => {
  const tramos = new Set<number>();
  pasar(crearJaula({ comida: RACIONES, agua: RACIONES }, 0, azarDe(1)), 0, 600000, azarDe(2), (jaula) => {
    for (const h of jaula.hamsters) {
      if (h.camino !== null) tramos.add(h.camino);
      assert.ok(h.x >= DIBUJO.x && h.x <= DIBUJO.x + DIBUJO.ancho && h.y >= DIBUJO.y && h.y <= DIBUJO.y + DIBUJO.alto);
    }
  });
  assert.equal(tramos.size, CAMINOS.length);
});

test("con hambre y sed comen y beben, gastando una ración cada vez; vacío, no pasa nada", () => {
  const { jaula, sonidos } = pasar(crearJaula(undefined, 0, azarDe(3)), 0, 600000, azarDe(4));
  assert.equal(jaula.comida, 0);
  assert.equal(jaula.agua, 0);
  assert.equal(sonidos.filter((s) => s === "comida").length, RACIONES);
  assert.equal(sonidos.filter((s) => s === "agua").length, RACIONES);
  assert.deepEqual(guardadoDe(rellenar(jaula, "comida").jaula), { comida: RACIONES, agua: 0 });
  assert.deepEqual(rellenar(rellenar(jaula, "agua").jaula, "agua").sonidos, []);
});

test("tocar una cosa manda allí a un hámster, que la usa", () => {
  for (const cosa of ["rueda", "columpio", "casita", "comida", "agua"] as Cosa[]) {
    const azar = azarDe(5);
    let usada = false;
    const tocada = tocarCosa(crearJaula(undefined, 0, azar), cosa, 0, azar);
    assert.deepEqual(tocada.sonidos, [cosa]);
    pasar(tocada.jaula, 0, 40000, azar, (jaula) => {
      usada ||= jaula.hamsters.some((h) => h.hace === cosa && h.nodo === COSAS[cosa]);
    });
    assert.ok(usada, cosa);
  }
});

test("tocar un tubo hace que un hámster lo recorra", () => {
  CAMINOS.forEach((camino, indice) => {
    if (camino.tipo !== "tubo") return;
    const azar = azarDe(11);
    let dentro = false;
    pasar(tocarTubo(crearJaula(undefined, 0, azar), indice, 0, azar).jaula, 0, 60000, azar, (jaula) => {
      dentro ||= jaula.hamsters.some((h) => h.camino === indice);
    });
    assert.ok(dentro, `tubo ${indice}`);
  });
});

test("escapada: sale uno, se esconde, hay pista a los 20 s y vuelve al soltarlo cerca de la jaula", () => {
  const azar = azarDe(9);
  const abierta = abrirPuerta(crearJaula(undefined, 0, azar), 0, azar);
  assert.ok(abierta.jaula.puertaAbierta);
  assert.deepEqual(abierta.sonidos, ["escapa"]);
  assert.equal(abierta.jaula.hamsters.filter((h) => h.fuera).length, 1);
  assert.equal(abrirPuerta(abierta.jaula, 100, azar).jaula, abierta.jaula, "con uno fuera no sale otro");
  const rato = pasar(abierta.jaula, 0, 12000, azar);
  const fugado = rato.jaula.hamsters.find((h) => h.fuera)!;
  assert.equal(fugado.fuera!.fase, "escondido");
  assert.ok(Math.hypot(fugado.x - ESCONDITES[fugado.fuera!.escondite].x, fugado.y - ESCONDITES[fugado.fuera!.escondite].y) < 5);
  assert.equal(pista(rato.jaula, fugado.fuera!.desde + PISTA_MS - 1), null);
  assert.equal(pista(rato.jaula, fugado.fuera!.desde + PISTA_MS), fugado.fuera!.escondite);

  const cogido = coger(rato.jaula, fugado.id, rato.fin).jaula;
  const lejos = soltar(arrastrar(cogido, fugado.id, { x: 600, y: 400 }), fugado.id, rato.fin, azar);
  assert.equal(lejos.jaula.hamsters.find((h) => h.id === fugado.id)!.fuera!.fase, "corre");
  const cerca = soltar(arrastrar(cogido, fugado.id, { x: JAULA_EN_ESCENA.derecha + RADIO_JAULA, y: 300 }), fugado.id, rato.fin, azar);
  assert.deepEqual(cerca.sonidos, ["vuelve"]);
  assert.equal(cerca.jaula.hamsters.find((h) => h.id === fugado.id)!.fuera, null);
  assert.equal(cerca.jaula.puertaAbierta, false);
});

test("el progreso guarda solo las raciones y se lee con tolerancia", () => {
  assert.equal(normalizeHamsters(undefined), undefined);
  assert.equal(normalizeHamsters({ comida: 3, agua: 3 }), undefined);
  assert.deepEqual(normalizeHamsters({ comida: 1.7, agua: -4, escapado: true }), { comida: 1, agua: 0 });
  assert.deepEqual(normalizeHamsters({ comida: "x", agua: 9 }), undefined);
  const casa = { gatitos: {}, huellas: [], calculadoEn: "2026-11-27T10:00:00.000Z", presentados: [] };
  assert.equal(normalizeCasa(casa)!.hamsters, undefined);
  assert.deepEqual(normalizeCasa({ ...casa, hamsters: { comida: 0 } })!.hamsters, { comida: 0, agua: 3 });
});
