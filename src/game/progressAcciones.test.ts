import assert from "node:assert/strict";
import test from "node:test";
import { casaVacia } from "./casaProgreso.ts";
import { nivelesCampana } from "./nivelesIndice.ts";
import { accionesProgreso as a, completarPantalla } from "./progressAcciones.ts";
import { emptyProgress, parseProgress, serializeProgress, type Progress } from "./progress.ts";
import { campaignUnlockIndex } from "./routes.ts";

const nivel = (id: string) => nivelesCampana.find((level) => level.id === id)!;
const ejemplo: Progress = { ...emptyProgress, unlocked: 2, stickers: ["sticker-1-1"], levelStats: { "1-1": { completed: true, bestApples: 4, flawless: false } } };
/** Guardar y volver a leer no cambia nada: la acción deja un progreso válido. */
const estable = (progress: Progress) => assert.equal(serializeProgress(parseProgress(serializeProgress(progress))), serializeProgress(progress));

test("pegatinas: solo las nuevas, y sin nuevas el mismo progreso", () => {
  const con = a.pegatinas(ejemplo, ["sticker-1-1", "sticker-1-2"]);
  assert.deepEqual(con.stickers, ["sticker-1-1", "sticker-1-2"]);
  assert.equal(a.pegatinas(ejemplo, ["sticker-1-1"]), ejemplo);
  estable(con);
});

test("manzanas: suman al total de siempre", () => {
  const con = a.manzanas(ejemplo, 3);
  assert.equal(con.totalApples, (ejemplo.totalApples ?? 0) + 3);
  estable(con);
});

test("completar una pantalla: desbloquea, guarda la mejor marca, «sin caer» no se pierde y el reto del jefe cuenta", () => {
  const primera = completarPantalla(ejemplo, nivel("1-1"), { stickers: [], apples: 2 }, { sinCaer: true, reto: false });
  assert.deepEqual(primera.levelStats["1-1"], { completed: true, bestApples: 4, flawless: true });
  const otraVez = completarPantalla(primera, nivel("1-1"), { stickers: [], apples: 6 }, { sinCaer: false, reto: false });
  assert.deepEqual(otraVez.levelStats["1-1"], { completed: true, bestApples: 6, flawless: true });

  const jefe = nivel("1-3");
  const ganado = completarPantalla(ejemplo, jefe, { stickers: ["sticker-1-3"], apples: 1 }, { sinCaer: false, reto: true });
  assert.equal(ganado.levelStats["1-3"].completed, true);
  assert.equal(ganado.unlocked, Math.max(ejemplo.unlocked, campaignUnlockIndex(jefe)));
  assert.equal(ganado.bossChallenges[jefe.boss!], true);
  assert.ok(ganado.stickers.includes("sticker-1-3"));
  assert.equal(completarPantalla(ejemplo, jefe, { stickers: [], apples: 0 }, { sinCaer: false, reto: false }).bossChallenges[jefe.boss!], undefined);
  estable(ganado);
});

test("salida acuática y ruta secreta abren su zona", () => {
  assert.equal(a.desbloquearAgua(ejemplo).waterUnlocked, true);
  assert.equal(a.desbloquearSecreto(ejemplo).secretUnlocked, true);
  estable(a.desbloquearSecreto(a.desbloquearAgua(ejemplo)));
});

test("reto de un jefe en la revancha", () => {
  assert.equal(a.retoDeJefe(ejemplo, "bramble-king").bossChallenges["bramble-king"], true);
});

test("tienda secreta, desvíos y paseo con saludos", () => {
  const tienda = a.ganarTienda(a.visitarTienda(ejemplo, "1-2"), "1-2");
  assert.ok(tienda.secretShops);
  estable(tienda);
  const visto = a.visitarDesvio(ejemplo, "fireflies");
  assert.ok(visto.detours?.fireflies);
  assert.equal(a.completarDesvio(visto, "fireflies").detours?.fireflies?.completed, true);
  assert.equal(a.revelarDesvios(visto, ["fireflies"]).detours?.fireflies?.revealed, true);
  estable(a.completarDesvio(visto, "fireflies"));
  const paseo = a.saludar(a.visitarPaseo(ejemplo, 1), 1, "wolf");
  assert.ok(paseo.restStops);
  estable(paseo);
});

test("revelar desvíos: sin desvíos descubiertos no cambia nada", () => {
  assert.equal(a.revelarDesvios(ejemplo, []), ejemplo);
});

test("avioneta: rendirse deja el marcador abierto sin marca; cruzar el arcoíris guarda la mejor", () => {
  assert.deepEqual(a.terminarVuelo(ejemplo, null).avioneta, { bestStars: 0, flown: true });
  const vuelo = a.terminarVuelo(a.terminarVuelo(ejemplo, 7), 3);
  assert.equal(vuelo.avioneta?.bestStars, 7);
  assert.equal(a.terminarVuelo(vuelo, null).avioneta?.bestStars, 7);
  estable(vuelo);
});

test("casa y amistad", () => {
  const casa = casaVacia(new Date("2026-11-24T10:00:00Z"));
  assert.equal(a.guardarCasa(ejemplo, casa).casa, casa);
  const amigo = a.amistad(ejemplo, "wolf");
  assert.equal(amigo.friends?.wolf?.hearts, 1);
  estable(amigo);
});

test("borrar el progreso vuelve a empezar la campaña", () => {
  const borrado = a.borrar(a.desbloquearSecreto(ejemplo));
  assert.deepEqual(borrado.levelStats, {});
  assert.equal(borrado.unlocked, 0);
});

test("ninguna acción toca el progreso que recibe", () => {
  const copia = JSON.stringify(ejemplo);
  completarPantalla(ejemplo, nivel("1-3"), { stickers: ["sticker-1-3"], apples: 1 }, { sinCaer: true, reto: true });
  a.pegatinas(ejemplo, ["x"]);
  a.terminarVuelo(ejemplo, 2);
  a.amistad(ejemplo, "wolf");
  assert.equal(JSON.stringify(ejemplo), copia);
});
