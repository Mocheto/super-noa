import assert from "node:assert/strict";
import test from "node:test";
import {
  abandonar, acariciar, AMPLIACION_JARDIN, avanzar, BUSCAR_CELEBRAN_MS, BUSCAR_ENTRAN_MS, conejoCercano, conejoEn, CONEJOS, CORTE, crearMadriguera,
  CUEVAS, darZanahoria, ESCONDITES_CONEJO, GESTO_MS, mirar, NODOS_TUNEL, pista, PISTA_MS, ponerNoche, puestoEnCueva, rutaTunel, SIN_EXCAVAR,
  tocarAgujero, tocarCueva, tocarEscondite, type Madriguera, type NodoTunel, type SitioConejo, type SonidoConejos,
} from "./casaConejos.ts";

/** Azar repetible. */
const azarDe = (semilla: number) => () => {
  semilla = (semilla * 1664525 + 1013904223) % 4294967296;
  return semilla / 4294967296;
};

/** Deja pasar `ms` de reloj a 50 ms por paso; `ver` mira cada paso. */
function pasar(inicial: Madriguera, ms: number, azar = azarDe(7), ver?: (m: Madriguera) => void) {
  let madriguera = inicial;
  const sonidos: SonidoConejos[] = [];
  for (let t = inicial.ultimo + 50; t <= inicial.ultimo + ms; t += 50) {
    const salida = avanzar(madriguera, t, azar);
    madriguera = salida.madriguera;
    sonidos.push(...salida.sonidos);
    ver?.(madriguera);
  }
  return { madriguera, sonidos };
}

const canela = (m: Madriguera) => m.conejos[0];
const algodon = (m: Madriguera) => m.conejos[1];
const nueva = (noche = false) => crearMadriguera(noche, 0, azarDe(1));
/** Buscando, ya escondidos. */
function buscando(semilla = 3) {
  const { madriguera } = tocarAgujero(nueva(), 0, azarDe(semilla));
  return pasar(madriguera, BUSCAR_ENTRAN_MS);
}
const vacio = (m: Madriguera) => (Object.keys(ESCONDITES_CONEJO) as SitioConejo[]).find((s) => !Object.values(m.busqueda!.sitios).includes(s))!;

test("la madriguera cabe en la ampliación y en su corte, y todo está comunicado", () => {
  assert.equal(CORTE.x, -AMPLIACION_JARDIN);
  const dentro = ({ x, y }: { x: number; y: number }) => x >= CORTE.x && x <= CORTE.x + CORTE.ancho && y >= CORTE.y && y <= CORTE.y + CORTE.alto;
  for (const punto of [...Object.values(NODOS_TUNEL), ...Object.values(ESCONDITES_CONEJO)]) assert.ok(dentro(punto));
  for (const nodo of [...CUEVAS, ...SIN_EXCAVAR] as NodoTunel[]) assert.equal(rutaTunel("boca", nodo).at(-1), nodo);
  for (const cueva of CUEVAS) assert.equal(Object.values(ESCONDITES_CONEJO).filter((s) => s.cueva === cueva).length, 2);
});

test("al abrir la casa, de día están arriba y de noche duermen en el dormitorio", () => {
  assert.ok(nueva().conejos.every((c) => c.nivel === "arriba" && c.x >= -AMPLIACION_JARDIN && c.x < 0));
  assert.ok(nueva(true).conejos.every((c) => c.nivel === "abajo" && c.nodo === "dormitorio" && c.hace === "duerme"));
});

test("por su cuenta hacen de todo, suben y bajan y lo que Noa mira no se queda vacío", () => {
  for (const vista of ["arriba", "abajo"] as const) {
    const hechos = new Set<string>();
    const nodos = new Set<string>();
    let cambios = 0;
    let antes = "";
    pasar(mirar(nueva(), vista, 0, azarDe(2)).madriguera, 600_000, azarDe(5), (m) => {
      assert.ok(m.conejos.some((c) => c.nivel === vista));
      for (const c of m.conejos) {
        hechos.add(`${c.nivel}:${c.hace}`);
        if (c.nivel === "abajo") nodos.add(c.nodo);
        assert.ok(c.x >= CORTE.x && c.x <= CORTE.x + CORTE.ancho);
        assert.ok(c.nivel === "arriba" ? c.y < CORTE.y : c.y >= CORTE.y);
      }
      const niveles = m.conejos.map((c) => c.nivel).join();
      if (antes && niveles !== antes) cambios += 1;
      antes = niveles;
    });
    assert.ok(cambios > 0);
    if (vista === "arriba") for (const hace of ["anda", "mordisquea", "yergue", "lava"]) assert.ok(hechos.has(`arriba:${hace}`), hace);
    else {
      for (const hace of ["acurruca", "mordisquea", "juega"]) assert.ok(hechos.has(`abajo:${hace}`), hace);
      assert.ok(!SIN_EXCAVAR.some((n) => nodos.has(n)));
    }
  }
});

test("de noche no se mueven", () => {
  const antes = nueva(true);
  const { madriguera } = pasar(antes, 60_000);
  assert.deepEqual(madriguera.conejos, antes.conejos);
});

test("la zanahoria se mordisquea sin gastarse y el otro se acerca a mirar", () => {
  const dada = darZanahoria(nueva(), "canela", 0);
  assert.deepEqual(dada.sonidos, ["zanahoria"]);
  assert.equal(canela(dada.madriguera).gesto?.tipo, "come");
  const { madriguera } = pasar(dada.madriguera, GESTO_MS.come - 50, azarDe(9));
  assert.equal(canela(madriguera).x, canela(dada.madriguera).x);
  assert.ok(Math.abs(algodon(madriguera).x - canela(madriguera).x) <= 200);
  assert.deepEqual(darZanahoria(dada.madriguera, "canela", 100).sonidos, ["zanahoria"]);
});

test("la zanahoria solo se da arriba, de día y sin estar buscando", () => {
  for (const m of [nueva(true), mirar(nueva(), "abajo", 0, azarDe(1)).madriguera, buscando().madriguera]) {
    assert.deepEqual(darZanahoria(m, "canela", 0).sonidos, []);
  }
});

test("acariciar los tiene quietos y dormidos siguen durmiendo", () => {
  const { madriguera, sonidos } = acariciar(nueva(), "algodon", 0);
  assert.deepEqual(sonidos, ["caricia"]);
  assert.equal(algodon(pasar(madriguera, GESTO_MS.caricia - 50).madriguera).x, algodon(madriguera).x);
  assert.equal(algodon(pasar(madriguera, GESTO_MS.caricia + 50).madriguera).gesto, null);
  const dormido = acariciar(mirar(nueva(true), "abajo", 0, azarDe(1)).madriguera, "canela", 0).madriguera;
  assert.equal(canela(dormido).hace, "duerme");
  assert.equal(canela(dormido).gesto?.tipo, "caricia");
});

test("el dedo y el teclado encuentran al conejo más cercano de los que se ven", () => {
  const m = nueva();
  assert.equal(conejoEn(m, canela(m)), "canela");
  assert.equal(conejoEn(m, { x: 600, y: 500 }), null);
  assert.equal(conejoCercano(m, { x: 600, y: 500 }), "algodon");
  assert.equal(conejoCercano(nueva(true), { x: 0, y: 500 }), null);
});

test("al bajar hay alguien y al tocar una cueva va un conejo por los túneles", () => {
  let m = mirar(nueva(), "abajo", 0, azarDe(4)).madriguera;
  assert.ok(m.conejos.some((c) => c.nivel === "abajo"));
  for (const cueva of CUEVAS) {
    m = tocarCueva(m, cueva, azarDe(6)).madriguera;
    const llamado = m.conejos.find((c) => c.nodo === cueva)!;
    let fin = m;
    for (let i = 0; i < 200; i += 1) {
      fin = avanzar(fin, fin.ultimo + 50, () => 0.99).madriguera;
      const c = fin.conejos.find((otro) => otro.id === llamado.id)!;
      if (c.hace !== "anda") break;
    }
    const c = fin.conejos.find((otro) => otro.id === llamado.id)!;
    assert.deepEqual({ x: c.x, y: c.y }, puestoEnCueva(cueva, c.id));
    m = fin;
  }
});

test("buscar: los dos se meten, la vista baja y cada uno está en un sitio distinto", () => {
  const entrando = tocarAgujero(nueva(), 0, azarDe(3)).madriguera;
  assert.equal(entrando.vista, "arriba");
  assert.deepEqual(tocarEscondite(entrando, "paja", 0).sonidos, []);
  const { madriguera, sonidos } = buscando();
  assert.deepEqual(sonidos, ["baja"]);
  assert.equal(madriguera.vista, "abajo");
  const { sitios } = madriguera.busqueda!;
  assert.notEqual(sitios.canela, sitios.algodon);
  for (const c of madriguera.conejos) {
    assert.equal(conejoEn(madriguera, c), null);
    assert.deepEqual(acariciar(madriguera, c.id, 0).sonidos, []);
  }
  assert.deepEqual(pasar(madriguera, 60_000).madriguera.conejos, madriguera.conejos);
});

test("buscar: el vacío se mueve, cada acierto es un «cucú» y con los dos se celebra y siguen abajo", () => {
  const { madriguera } = buscando();
  const fallo = tocarEscondite(madriguera, vacio(madriguera), 5000);
  assert.deepEqual(fallo.sonidos, ["vacio"]);
  assert.ok(fallo.madriguera.movido);
  const uno = tocarEscondite(fallo.madriguera, madriguera.busqueda!.sitios.canela, 6000);
  assert.deepEqual(uno.sonidos, ["cucu"]);
  const dos = tocarEscondite(uno.madriguera, madriguera.busqueda!.sitios.algodon, 7000);
  assert.deepEqual(dos.sonidos, ["cucu", "bravo"]);
  assert.equal(dos.madriguera.busqueda?.fase, "celebran");
  const fin = pasar({ ...dos.madriguera, ultimo: 7000 }, BUSCAR_CELEBRAN_MS).madriguera;
  assert.equal(fin.busqueda, null);
  assert.ok(fin.conejos.every((c) => c.nivel === "abajo"));
});

test("buscar: la pista sale a los 20 s si no se ha encontrado a ninguno", () => {
  const { madriguera } = buscando();
  const desde = madriguera.busqueda!.desde;
  assert.equal(pista(madriguera, desde + PISTA_MS - 1), null);
  assert.ok(Object.values(madriguera.busqueda!.sitios).includes(pista(madriguera, desde + PISTA_MS)!));
  const uno = tocarEscondite(madriguera, madriguera.busqueda!.sitios.algodon, desde).madriguera;
  assert.equal(pista(uno, desde + PISTA_MS), null);
});

test("irse del jardín mientras se meten también acaba el juego", () => {
  const entrando = tocarAgujero(nueva(), 0, azarDe(3)).madriguera;
  const fuera = abandonar(entrando, 100, azarDe(1));
  assert.equal(fuera.busqueda, null);
  assert.ok(fuera.conejos.every((c) => c.nivel === "arriba"));
  assert.equal(abandonar(fuera, 200, azarDe(1)), fuera);
});

test("subir a medias o anochecer acaba el juego", () => {
  const { madriguera } = buscando();
  const arriba = mirar(madriguera, "arriba", 5000, azarDe(1)).madriguera;
  assert.equal(arriba.busqueda, null);
  assert.ok(arriba.conejos.every((c) => c.nivel === "arriba"));
  const noche = ponerNoche(madriguera, true, 5000, azarDe(1));
  assert.equal(noche.busqueda, null);
  assert.ok(noche.conejos.every((c) => c.hace === "duerme"));
  assert.ok(ponerNoche({ ...noche, vista: "arriba" }, false, 6000, azarDe(1)).conejos.every((c) => c.nivel === "arriba"));
  for (const id of CONEJOS) assert.deepEqual(tocarAgujero(noche, 0, azarDe(1)).sonidos, [], id);
  assert.equal(tocarAgujero({ ...noche, vista: "arriba" }, 0, azarDe(1)).madriguera.busqueda, null);
});
