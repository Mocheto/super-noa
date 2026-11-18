import assert from "node:assert/strict";
import test from "node:test";
import { aIcu, exportarJson } from "./exportar.ts";
import { hojas } from "./index.ts";

test("la exportación incluye todas las hojas del catálogo", () => {
  const mensajes = exportarJson();
  assert.equal(Object.keys(mensajes).length, hojas().length);
  for (const [clave] of hojas()) assert.equal(typeof mensajes[clave], "string", `Falta ${clave} en la exportación`);
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(mensajes)));
});

test("los plurales se exportan como mensajes ICU", () => {
  assert.equal(aIcu({ one: "{n} vida", other: "{n} vidas" }), "{n, plural, one {{n} vida} other {{n} vidas}}");
  assert.equal(aIcu("Hola"), "Hola");
  assert.equal(exportarJson()["partida.hud.vidas.oculto"], "{n, plural, one {{n} vida} other {{n} vidas}}");
});
