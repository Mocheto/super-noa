import assert from "node:assert/strict";
import test from "node:test";
import { textosSueltosPorArchivo } from "./extraerTextos.ts";

const sueltos = textosSueltosPorArchivo(new URL("../", import.meta.url));

test("ningún archivo tiene texto visible escrito en el código", () => {
  const ejemplos = [...sueltos].flatMap(([archivo, textos]) => textos.slice(0, 3).map((texto) => `  ${archivo}:${texto.linea} «${texto.texto.slice(0, 60)}»`));
  assert.equal(sueltos.size, 0, `Texto visible fuera del catálogo: pásalo a src/textos/es/ con su clave (ver docs/interfaz/catalogo-textos.md).\n${ejemplos.join("\n")}`);
});
