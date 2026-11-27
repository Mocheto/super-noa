import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { leerFunciones } from "./funciones.ts";
import { accionesProgreso } from "./progressAcciones.ts";
import { adoptarProgreso, emptyProgress, parseProgress, resetCampaignProgress, serializeProgress } from "./progress.ts";
import { ARTE_TRAJES, dibujoDeNoa, normalizeTraje, POSES_NOA, TRAJES, trajePuesto, type ArteTrajes } from "./trajes.ts";

const existe = (src: string) => existsSync(new URL(`../../public/${src.slice(2)}`, import.meta.url));

test("el catálogo tiene el peto y los tres trajes nuevos, con identificadores estables", () => {
  assert.deepEqual([...TRAJES], ["peto", "exploradora", "pirata", "caballera"]);
});

test("todo traje, pose y protección apunta a un archivo que existe", () => {
  for (const traje of TRAJES) for (const pose of POSES_NOA) for (const protegida of [false, true]) {
    const { src } = dibujoDeNoa(traje, pose, protegida);
    assert.ok(existe(src), `${traje} ${pose}: falta ${src}`);
  }
  for (const poses of Object.values(ARTE_TRAJES)) for (const nombre of Object.values(poses)) assert.ok(existe(`./assets/sprites/${nombre}.webp`), nombre);
});

test("sin arte, un traje sale como el peto, con su armadura dorada y sin brillo", () => {
  assert.deepEqual(dibujoDeNoa("pirata", "hoja", false, {}), dibujoDeNoa("peto", "hoja"));
  assert.deepEqual(dibujoDeNoa("pirata", "salto", true, {}), { src: "./assets/sprites/noa-jump-gold-armor-v1.webp", brillo: false });
});

test("con arte, el traje usa el suyo y la protección es un brillo por encima", () => {
  const arte: ArteTrajes = { pirata: { hoja: "noa-pirata-hoja-v1" } };
  assert.deepEqual(dibujoDeNoa("pirata", "hoja", false, arte), { src: "./assets/sprites/noa-pirata-hoja-v1.webp", brillo: false });
  assert.deepEqual(dibujoDeNoa("pirata", "hoja", true, arte), { src: "./assets/sprites/noa-pirata-hoja-v1.webp", brillo: true });
  // La pose que aún no tiene sale del peto; el peto nunca toma arte ajeno.
  assert.equal(dibujoDeNoa("pirata", "salto", false, arte).src, "./assets/sprites/noa-jump-v2.webp");
  assert.equal(dibujoDeNoa("peto", "hoja", false, { peto: { hoja: "otra" } }).src, "./assets/sprites/noa-sprite-sheet.webp");
});

test("apagados, siempre el peto; se encienden con ?funciones=trajes", () => {
  assert.equal(trajePuesto("pirata", false), "peto");
  assert.equal(trajePuesto("pirata", true), "pirata");
  assert.equal(trajePuesto(undefined, true), "peto");
  assert.equal(leerFunciones("").trajes, false);
  assert.equal(leerFunciones("?funciones=trajes").trajes, true);
});

test("el traje elegido se guarda y se carga; un guardado sin él o con uno desconocido sigue valiendo", () => {
  const con = accionesProgreso.ponerTraje(emptyProgress, "caballera");
  assert.equal(parseProgress(serializeProgress(con)).traje, "caballera");
  assert.equal(accionesProgreso.ponerTraje(con, "caballera"), con);
  assert.equal("traje" in parseProgress(serializeProgress(emptyProgress)), false);
  assert.equal("traje" in parseProgress('{"version":2,"traje":"astronauta"}'), false);
  assert.equal(normalizeTraje(7), undefined);
  assert.equal(resetCampaignProgress(con).traje, undefined);
});

test("dos pestañas: se queda con el traje que acaba de guardar la otra, también si vuelve al peto", () => {
  const pirata = accionesProgreso.ponerTraje(emptyProgress, "pirata");
  const peto = accionesProgreso.ponerTraje(pirata, "peto");
  const conocida = serializeProgress(pirata);
  assert.equal(adoptarProgreso(pirata, serializeProgress(peto), conocida).traje, "peto");
  // Con cambios propios sin guardar, manda lo guardado por la otra; si ella no eligió, se conserva el de aquí.
  const conCambios = accionesProgreso.manzanas(pirata, 2);
  assert.equal(adoptarProgreso(conCambios, serializeProgress(peto), conocida).traje, "peto");
  assert.equal(adoptarProgreso(conCambios, serializeProgress(emptyProgress), conocida).traje, "pirata");
});
