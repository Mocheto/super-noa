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
      // Una palabra nunca se parte: a 24 px, una caja de rótulo mide 288 px por dentro, doce letras de Press Start 2P.
      const larga = palabras.reduce((mayor, palabra) => palabra.replace(/[¡!¿?,]/g, "").length > mayor.length ? palabra.replace(/[¡!¿?,]/g, "") : mayor, "");
      assert.ok(larga.length <= 12, `${clave} tiene una palabra de más de doce letras («${larga}»), que no cabe en 288 px a 24 px: ${texto}`);
    }
  }
});

// El dibujo del cartel de fase es el sprite de la pieza del propio juego, que pone el minijuego (no un pictograma del atlas).
test("en los minijuegos, un rótulo al compás tiene una palabra y un cartel de fase hasta dos", () => {
  for (const [clave, hoja] of hojas()) {
    const compas = /^minijuegos\.[\w-]+\.compas\..+\.rotulo$/.test(clave);
    const fase = /^minijuegos\.[\w-]+\.fase\..+\.rotulo$/.test(clave);
    if (!compas && !fase) continue;
    for (const texto of formas(hoja)) {
      const palabras = sinMarcas(texto).trim().split(/\s+/).filter((palabra) => /[A-ZÑ0-9]/.test(palabra));
      if (compas) assert.equal(palabras.length, 1, `${clave} dura un pulso: una sola palabra («${texto}»)`);
      if (fase) assert.ok(palabras.length <= 2, `${clave} dura un compás: hasta dos palabras («${texto}»)`);
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
