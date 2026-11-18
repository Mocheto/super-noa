import assert from "node:assert/strict";
import test from "node:test";
import { detourCatalog, detourLevels } from "../game/detours.ts";
import { friendCatalog, foodNames } from "../game/friends.ts";
import { levels, themeNames } from "../game/levels.ts";
import { restStopCatalog, restStopLevels } from "../game/restStops.ts";
import { stickerCatalog } from "../game/stickers.ts";
import { worldCatalog } from "../game/worldMapData.ts";
import { es } from "./es/index.ts";
import { existeClave, hojas } from "./index.ts";

/** Claves de una zona, agrupadas por su primer nivel: `{ "1-1": ["titulo.rotulo", "titulo.juntos", …] }`. */
function clavesPorElemento(zona: string): Map<string, string[]> {
  const resultado = new Map<string, string[]>();
  for (const [clave] of hojas()) {
    const partes = clave.split(".");
    if (partes[0] !== zona) continue;
    resultado.set(partes[1], [...(resultado.get(partes[1]) ?? []), partes.slice(2).join(".")]);
  }
  return resultado;
}

const sinSobrantes = (zona: string, ids: string[], extras: string[] = []) => {
  const esperados = new Set([...ids, ...extras]);
  const sobran = [...clavesPorElemento(zona).keys()].filter((id) => !esperados.has(id));
  assert.deepEqual(sobran, [], `Textos de ${zona} sin dato al que correspondan: quítalos de src/textos/es/${zona}.ts`);
};

test("cada pantalla de la campaña tiene título, pista y lo que dicen en la persecución", () => {
  for (const nivel of levels) {
    for (const hoja of ["titulo.rotulo", "titulo.juntos", "pista.rotulo", "pista.juntos"]) {
      assert.ok(existeClave(`pantallas.${nivel.id}.${hoja}`), `Falta pantallas.${nivel.id}.${hoja}`);
    }
    nivel.chase?.stops.forEach((parada, indice) => {
      assert.ok(existeClave(`pantallas.${nivel.id}.habla.parada${indice + 1}.rotulo`), `Falta la frase ${indice + 1} de la persecución de ${nivel.id}`);
      assert.ok(parada.talk.length > 0);
    });
    assert.equal(Boolean(nivel.route?.nextLabel), existeClave(`pantallas.${nivel.id}.siguiente.juntos`) && Boolean(nivel.route), `${nivel.id}: el botón «siguiente» y su texto deben ir juntos`);
  }
  sinSobrantes("pantallas", levels.map((nivel) => nivel.id));
});

test("cada decorado, mundo, camino y paseo tiene sus textos y no sobra ninguno", () => {
  for (const tema of Object.keys(themeNames)) assert.ok(existeClave(`temas.${tema}.rotulo`), `Falta temas.${tema}.rotulo`);
  sinSobrantes("temas", Object.keys(themeNames));
  for (const mundo of worldCatalog) for (const hoja of ["nombre.rotulo", "nombre.juntos", "gato.rotulo"]) assert.ok(existeClave(`mundos.${mundo.id}.${hoja}`), `Falta mundos.${mundo.id}.${hoja}`);
  sinSobrantes("mundos", worldCatalog.map((mundo) => String(mundo.id)));
  for (const camino of detourCatalog) for (const hoja of ["titulo.rotulo", "titulo.juntos", "pista.juntos"]) assert.ok(existeClave(`caminos.${camino.id}.${hoja}`), `Falta caminos.${camino.id}.${hoja}`);
  sinSobrantes("caminos", detourCatalog.map((camino) => camino.id));
  for (const paseo of restStopCatalog) {
    assert.ok(existeClave(`paseos.${paseo.world}.despedida.rotulo`), `Falta la despedida del paseo ${paseo.world}`);
    for (const amigo of paseo.friends) for (const hoja of ["rotulo", "juntos"]) assert.ok(existeClave(`paseos.${paseo.world}.amigos.${amigo.kind}.${hoja}`), `Falta paseos.${paseo.world}.amigos.${amigo.kind}.${hoja}`);
    const esperados = new Set(paseo.friends.map((amigo) => amigo.kind));
    const sobran = Object.keys((es.paseos as unknown as Record<string, { amigos: Record<string, unknown> }>)[String(paseo.world)].amigos).filter((tipo) => !esperados.has(tipo as never));
    assert.deepEqual(sobran, [], `Amigos del paseo ${paseo.world} sin dato: quítalos de paseos.ts`);
  }
  sinSobrantes("paseos", restStopCatalog.map((paseo) => String(paseo.world)), ["titulo", "pista"]);
});

test("los datos leen sus textos del catálogo y no llevan texto propio", () => {
  for (const nivel of [...levels, ...detourLevels, ...restStopLevels]) {
    assert.ok(nivel.title.length > 0, `${nivel.id} sin título`);
    assert.ok(nivel.subtitle.length > 0, `${nivel.id} sin pista`);
  }
  for (const mundo of worldCatalog) assert.ok(mundo.name && mundo.shortName && mundo.description && mundo.cat, `Mundo ${mundo.id} sin textos`);
  for (const paseo of restStopCatalog) assert.ok(paseo.farewell && paseo.friends.every((amigo) => amigo.line), `Paseo ${paseo.world} sin textos`);
});

test("cada pegatina y cada amigo tiene sus textos y no sobra ninguno", () => {
  for (const pegatina of stickerCatalog) for (const hoja of ["nombre.rotulo", "nombre.juntos", "pista.juntos"]) assert.ok(existeClave(`pegatinas.${pegatina.id}.${hoja}`), `Falta pegatinas.${pegatina.id}.${hoja}`);
  sinSobrantes("pegatinas", stickerCatalog.map((pegatina) => pegatina.id));
  for (const amigo of friendCatalog) for (const hoja of ["nombre.rotulo", "nombre.juntos", "muerde.juntos", "consejo.juntos"]) assert.ok(existeClave(`amigos.${amigo.kind}.${hoja}`), `Falta amigos.${amigo.kind}.${hoja}`);
  for (const comida of Object.keys(foodNames)) assert.ok(existeClave(`amigos.comida.${comida}.rotulo`), `Falta la comida ${comida}`);
  sinSobrantes("amigos", friendCatalog.map((amigo) => amigo.kind), ["comida"]);
  assert.ok(stickerCatalog.every((pegatina) => pegatina.name && pegatina.hint) && friendCatalog.every((amigo) => amigo.name && amigo.biteLine && amigo.tip));
});
