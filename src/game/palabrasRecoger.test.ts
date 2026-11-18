import assert from "node:assert/strict";
import test from "node:test";
import { createPalabrasRecoger, PALABRA_FUNDIDO, PALABRA_SEGUNDOS } from "./palabrasRecoger.ts";

test("la palabra sale solo la primera vez de cada objeto en la pantalla", () => {
  const palabras = createPalabrasRecoger();
  assert.equal(palabras.recoger("apple"), true);
  palabras.avanzar(2);
  assert.equal(palabras.recoger("apple"), false, "la segunda manzana no repite MANZANA");
  assert.equal(palabras.capa(false), undefined);
  assert.equal(palabras.recoger("sticker"), true);
  assert.equal(palabras.capa(false)?.objeto, "sticker");
  assert.equal(createPalabrasRecoger().recoger("apple"), true, "otra pantalla empieza de cero");
});

test("solo hay una palabra a la vez y dura 1 s más 0,3 s de fundido", () => {
  const palabras = createPalabrasRecoger();
  palabras.recoger("apple");
  palabras.avanzar(0.5);
  palabras.recoger("cat");
  assert.equal(palabras.capa(false)?.objeto, "cat", "la nueva sustituye a la anterior");
  palabras.avanzar(PALABRA_SEGUNDOS);
  assert.equal(palabras.capa(false)?.alfa, 1);
  palabras.avanzar(PALABRA_FUNDIDO / 2);
  const fundiendo = palabras.capa(false)!;
  assert.ok(fundiendo.alfa > 0.4 && fundiendo.alfa < 0.6);
  palabras.avanzar(PALABRA_FUNDIDO);
  assert.equal(palabras.capa(false), undefined);
});

test("con movimiento tranquilo la etiqueta no sube ni da saltito", () => {
  const palabras = createPalabrasRecoger();
  palabras.recoger("flag");
  palabras.avanzar(0.05);
  const normal = palabras.capa(false)!;
  const tranquila = palabras.capa(true)!;
  assert.ok(normal.escala < 1 && normal.subida > 0);
  assert.equal(tranquila.escala, 1);
  assert.equal(tranquila.subida, 0);
});
