import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import {
  apagarLuz, aspectoDe, avanzar, cambiarLuz, crearPecera, encenderLuz, enLaPecera, llamar, PECERA, pezEn, posicionDe, soltarComida, tocarPez, zonaDe,
  type Entorno, type Pecera, type SonidoPecera,
} from "./casaPecera.ts";
import { dentroDelSuelo, HABITACION_CASA as H } from "./casaHabitacion.ts";

/** Azar repetible. */
const azarDe = (semilla: number) => () => {
  semilla = (semilla * 1664525 + 1013904223) % 4294967296;
  return semilla / 4294967296;
};
const entorno = (semilla = 3, extra: Partial<Entorno> = {}): Entorno => ({ azar: azarDe(semilla), ...extra });
const asset = (ruta: string) => existsSync(new URL(`../../public/${ruta.replace("./", "")}`, import.meta.url));

/** Deja pasar `ms` de reloj a 50 ms por paso y junta lo que suena. */
function pasar(inicial: Pecera, desde: number, ms: number, e: Entorno) {
  let pecera = inicial;
  const sonidos: SonidoPecera[] = [];
  for (let t = desde + 50; t <= desde + ms; t += 50) {
    const salida = avanzar(pecera, t, e);
    pecera = salida.pecera;
    sonidos.push(...salida.sonidos);
  }
  return { pecera, sonidos, fin: desde + ms };
}

const dentroDelAgua = (p: Pecera, ahora: number) => p.peces.every((pez) => {
  const { x } = posicionDe(pez, ahora);
  return x >= PECERA.agua.izquierda && x <= PECERA.agua.derecha;
});

test("la pecera está en la ampliación de la izquierda y su arte existe", () => {
  assert.ok(H.ampliacion > 0 && PECERA.left >= -H.ampliacion && PECERA.left + PECERA.ancho <= 0, "entera en la ampliación");
  for (const ruta of [PECERA.fondo, PECERA.cristal, PECERA.peces, PECERA.objetos, PECERA.caballito.hoja, PECERA.cofre.hoja, H.fondo]) assert.ok(asset(ruta), ruta);
  assert.ok(dentroDelSuelo(H, H.sitios.pecera.x, H.sitios.pecera.y), "el sitio de mirar los peces está en el suelo");
  assert.ok(Math.abs(H.sitios.pecera.x - (PECERA.left + PECERA.ancho / 2)) < 20, "delante del mueble");
  assert.ok(H.sitios.pecera.y > PECERA.top + PECERA.alto - 60, "con los pies delante del mueble");
});

test("los peces nadan sin salir del agua, miran hacia donde van y no se paran", () => {
  const e = entorno();
  const { pecera, fin } = pasar(crearPecera(0, e.azar), 0, 60000, e);
  assert.equal(pecera.peces.length, 5);
  assert.ok(dentroDelAgua(pecera, fin));
  for (const pez of pecera.peces) assert.ok(pez.y > PECERA.agua.superficie && pez.y < PECERA.agua.arena, `${pez.especie} entre la superficie y la arena`);
});

test("el bote suelta copos y los peces se los comen con su «ñam»; los llenos pasan", () => {
  const e = entorno(5);
  const inicial = crearPecera(0, e.azar);
  const comida = soltarComida(inicial, 0, e.azar);
  assert.deepEqual(comida.sonidos, ["copos"]);
  assert.ok(comida.pecera.copos.length > 0 && comida.pecera.copos.length <= 12);
  const { pecera, sonidos } = pasar(comida.pecera, 0, 20000, e);
  assert.ok(sonidos.includes("nam"), "alguien come");
  assert.ok(pecera.peces.some((pez) => pez.llenoHasta > 20000 || pez.comidos > 0), "alguno se ha llenado o ha comido");
});

test("no caben más de doce copos a la vez, y con la luz apagada la comida la enciende", () => {
  const e = entorno(9);
  let p = crearPecera(0, e.azar);
  for (let i = 0; i < 5; i++) p = soltarComida(p, i, e.azar).pecera;
  assert.ok(p.copos.length <= 12);
  const sinLuz = apagarLuz(crearPecera(0, e.azar)).pecera;
  const salida = soltarComida(sinLuz, 10, e.azar);
  assert.equal(salida.pecera.luz, true);
  assert.ok(salida.sonidos.includes("luz"));
});

test("tocar a cada pez hace su gracia", () => {
  const e = entorno(11);
  const inicial = crearPecera(0, e.azar);
  const acciones = inicial.peces.map((_, i) => tocarPez(inicial, i, 100, e).pecera.peces[i].accion);
  assert.deepEqual(acciones, ["salta", "gira", "esconde", "hincha", "baila"]);
  // El naranja sale por encima del agua (y de la pecera) y vuelve a caer.
  const salto = tocarPez(inicial, 0, 100, e).pecera;
  const alto = Math.min(...Array.from({ length: 60 }, (_, k) => posicionDe(salto.peces[0], 100 + k * 25).y));
  assert.ok(alto < PECERA.agua.superficie - 40, `salta fuera del agua (${alto})`);
  const despues = pasar(salto, 100, 3000, e).pecera;
  assert.equal(despues.peces[0].accion, "nada");
  assert.ok(despues.efectos.length >= 0 && dentroDelAgua(despues, 3100));
});

test("el payaso se mete en el castillo, se esconde y vuelve a asomar", () => {
  const e = entorno(2);
  const inicial = tocarPez(crearPecera(0, e.azar), 2, 0, e).pecera;
  let p = inicial;
  const vistos = new Set<string>();
  const ocultoVisto: boolean[] = [];
  const sonidos: SonidoPecera[] = [];
  for (let t = 50; t <= 12000; t += 50) {
    const s = avanzar(p, t, e);
    p = s.pecera;
    sonidos.push(...s.sonidos);
    vistos.add(p.peces[2].accion);
    ocultoVisto.push(!aspectoDe(p.peces[2], t).visible);
  }
  assert.ok(vistos.has("dentro") && vistos.has("asoma"), [...vistos].join());
  assert.ok(ocultoVisto.some(Boolean), "desaparece un momento");
  assert.ok(sonidos.includes("asoma"));
  assert.equal(p.peces[2].accion, "nada", "luego sigue nadando");
});

test("el globo se infla y suelta el aire con burbujas", () => {
  const e = entorno(4);
  let p = tocarPez(crearPecera(0, e.azar), 3, 0, e).pecera;
  assert.equal(aspectoDe(p.peces[3], 500).cuadro, 3, "inflado");
  const salida = pasar(p, 0, 4000, e);
  p = salida.pecera;
  assert.equal(p.peces[3].accion, "nada");
  assert.ok(salida.sonidos.includes("desinfla"));
});

test("tocar el agua llama a los peces; tocar el cristal fuera del agua, no", () => {
  const e = entorno(6);
  const p = crearPecera(0, e.azar);
  const { pecera, sonidos } = llamar(p, 150, 150, 0, e.azar);
  assert.deepEqual(sonidos, ["toc"]);
  for (const pez of pecera.peces) assert.ok(Math.abs(pez.destino.x - 150) <= 40 && Math.abs(pez.destino.y - 150) <= 30);
  assert.ok(pecera.efectos.some((efecto) => efecto.tipo === "burbuja"));
  assert.equal(zonaDe(150, 150), "agua");
  assert.equal(zonaDe(320, 25), "bote");
  assert.equal(zonaDe(370, 55), "interruptor");
  assert.equal(zonaDe(5, 5), null);
  assert.equal(zonaDe(150, 300), "puertas", "el mueble no es agua: son sus puertas");
});

test("encontrar al pez tocado", () => {
  const e = entorno();
  const p = crearPecera(0, e.azar);
  const centro = posicionDe(p.peces[1], 0);
  assert.equal(pezEn(p, centro.x, centro.y, 0), 1);
  assert.equal(pezEn(p, centro.x + 200, centro.y, 0), -1);
});

test("sin luz duermen, con zetas, y al tocarlos se sobresaltan y vuelven a dormir; con luz despiertan", () => {
  const e = entorno(8);
  let p = cambiarLuz(crearPecera(0, e.azar), 0).pecera;
  assert.equal(p.luz, false);
  const dormidos = pasar(p, 0, 6000, e);
  p = dormidos.pecera;
  assert.ok(p.peces.every((pez) => pez.accion === "duerme"));
  assert.ok(dormidos.sonidos.includes("zzz"), "con zetas");
  assert.equal(aspectoDe(p.peces[0], 6000).cuadro, 4);
  p = tocarPez(p, 0, 6000, e).pecera;
  assert.equal(p.peces[0].accion, "susto");
  p = pasar(p, 6000, 2000, e).pecera;
  assert.equal(p.peces[0].accion, "duerme", "con la luz apagada vuelve a dormir");
  p = encenderLuz(p, 9000).pecera;
  assert.ok(p.peces.every((pez) => pez.accion === "nada"));
});

test("con movimiento tranquilo no hay saltos ni volteretas: solo corazones y burbujas", () => {
  const e = entorno(12, { suave: true });
  const p = crearPecera(0, e.azar);
  for (let i = 0; i < 4; i++) {
    const salida = tocarPez(p, i, 0, e);
    assert.equal(salida.pecera.peces[i].accion, "nada");
    assert.ok(salida.pecera.efectos.some((efecto) => efecto.tipo === "corazon"));
  }
  const { pecera } = pasar(p, 0, 40000, e);
  assert.ok(pecera.peces.every((pez) => pez.accion === "nada"));
});

test("a veces hacen travesuras por su cuenta, y con un gatito mirando se juntan frente a él", () => {
  const e = entorno(21);
  const { sonidos } = pasar(crearPecera(0, e.azar), 0, 60000, e);
  assert.ok(sonidos.some((sonido) => ["chapoteo", "hincha", "beso", "toc"].includes(sonido)), "ha habido al menos una travesura");
  const curioso = pasar(crearPecera(0, e.azar), 0, 60000, entorno(3, { gatoMirando: 206 })).pecera;
  const dx = curioso.peces.map((pez) => Math.abs(pez.x - 206));
  assert.ok(Math.max(...dx) < 130, `juntos frente al gatito (${dx.join(",")})`);
});

test("un punto de la escena se pasa al dibujo de la pecera", () => {
  assert.deepEqual(enLaPecera(PECERA.left + 10, PECERA.top + 20), { x: 10, y: 20 });
  assert.equal(enLaPecera(100, 100), null);
});
