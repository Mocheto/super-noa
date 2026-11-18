import assert from "node:assert/strict";
import test from "node:test";
import { hojas, partes, t, textoLienzo, type Plural } from "./index.ts";

const formas = (hoja: string | Plural) => typeof hoja === "string" ? [hoja] : Object.values(hoja).filter((valor): valor is string => typeof valor === "string");
const sinMarcas = (texto: string) => texto.replace(/\{pictograma:[\w-]+\}/g, " ").replace(/\{\w+\}/g, "X");

test("cada rótulo cumple la guía de escritura del texto para Noa", () => {
  for (const [clave, hoja] of hojas()) {
    if (!clave.endsWith(".rotulo")) continue;
    for (const texto of formas(hoja)) {
      const limpio = sinMarcas(texto).trim();
      assert.equal(limpio, limpio.toUpperCase(), `${clave} debe ir en MAYÚSCULAS: ${texto}`);
      assert.doesNotMatch(limpio, /[ÁÉÍÓÚÜ]/, `${clave} no lleva tildes ni diéresis: ${texto}`);
      assert.doesNotMatch(limpio, /[:·…]|\.\.\./, `${clave} no lleva dos puntos, puntos medios ni suspensivos: ${texto}`);
      const palabras = limpio.split(/\s+/).filter((palabra) => /[A-ZÑ0-9]/.test(palabra));
      assert.ok(palabras.length <= 4, `${clave} tiene más de cuatro palabras: ${texto}`);
    }
  }
});

test("los pictogramas del catálogo existen y las hojas no están vacías", () => {
  for (const [clave, hoja] of hojas()) for (const texto of formas(hoja)) {
    assert.ok(texto.trim().length > 0, `${clave} está vacía`);
    assert.doesNotThrow(() => partes(texto), `${clave} usa un pictograma desconocido`);
  }
});

test("el catálogo se exporta a JSON sin perder nada", () => {
  const { es } = { es: JSON.parse(JSON.stringify(Object.fromEntries(hojas()))) as Record<string, unknown> };
  assert.equal(Object.keys(es).length, hojas().length);
});

test("t pone variables y elige el plural", () => {
  assert.equal(t("partida.hud.vidas.oculto", { n: 1 }), "1 vida");
  assert.equal(t("partida.hud.vidas.oculto", { n: 3 }), "3 vidas");
  assert.equal(t("partida.hud.banderas.oculto", { n: 2, total: 3 }), "Bandera 2 de 3");
  assert.equal(textoLienzo("partida.pausa.seguir.rotulo"), "▶ SEGUIR");
  assert.deepEqual(partes(t("partida.pausa.mapa.rotulo")), [{ tipo: "pictograma", nombre: "mapa" }, { tipo: "texto", valor: " MAPA" }]);
});
