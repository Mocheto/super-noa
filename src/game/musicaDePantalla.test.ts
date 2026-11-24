import assert from "node:assert/strict";
import test from "node:test";
import { musicTracks } from "./music.ts";
import { duelosConCancion, musicaDePantalla, PISTA_ESTRELLA } from "./musicaDePantalla.ts";

const tranquila = { shopActive: false, paused: false, muted: false, musicVolume: 80, starActive: false };
const bosque = { world: 1 as const };

test("en la partida suena la música del mundo a su volumen", () => {
  const { mundo, estrella } = musicaDePantalla("game", bosque, tranquila);
  assert.deepEqual(mundo, { source: musicTracks[1], volume: 80, playing: true });
  assert.equal(estrella.playing, false);
});

test("con la estrella suena su pista en lugar de la del mundo", () => {
  const { mundo, estrella } = musicaDePantalla("game", bosque, { ...tranquila, starActive: true });
  assert.equal(mundo.playing, false);
  assert.deepEqual(estrella, { source: PISTA_ESTRELLA, volume: 80, playing: true });
});

test("calla en pausa, en la tienda secreta, en silencio, a volumen 0 y fuera de la partida", () => {
  for (const cambio of [{ paused: true }, { shopActive: true }, { muted: true }, { musicVolume: 0 }]) {
    const { mundo, estrella } = musicaDePantalla("game", bosque, { ...tranquila, ...cambio, starActive: false });
    assert.equal(mundo.playing, false, JSON.stringify(cambio));
    assert.equal(musicaDePantalla("game", bosque, { ...tranquila, ...cambio, starActive: true }).estrella.playing, false, JSON.stringify(cambio));
    assert.equal(estrella.playing, false);
  }
  for (const screen of ["home", "map", "complete", "gameover", "casa", "cat-party", "avioneta", "secret-transition"]) {
    assert.equal(musicaDePantalla(screen, bosque, tranquila).mundo.playing, false, screen);
  }
});

test("calla en los duelos con canción propia (abeja, tambor, merienda y los de memoria) y suena en los demás", () => {
  for (const boss of ["queen-bee", "maestra-armonia", "great-boar", "aurora-celeste", "triceratops-queen"] as const) {
    assert.ok(duelosConCancion.includes(boss));
    assert.equal(musicaDePantalla("boss", { world: 1, boss }, tranquila).mundo.playing, false, boss);
  }
  assert.equal(musicaDePantalla("boss", { world: 1, boss: "bramble-king" }, tranquila).mundo.playing, true);
  // En la partida de la pantalla del duelo (antes de llegar al guardián) sí suena.
  assert.equal(musicaDePantalla("game", { world: 11, boss: "queen-bee" }, tranquila).mundo.playing, true);
});

test("en el paseo de los amigos suena al 60 %", () => {
  assert.equal(musicaDePantalla("game", { world: 3, restStop: 3 }, tranquila).mundo.volume, 48);
  assert.equal(musicaDePantalla("game", { world: 3, restStop: 3 }, tranquila).estrella.volume, 80);
});
