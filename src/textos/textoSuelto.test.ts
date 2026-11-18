import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { textosSueltosPorArchivo } from "./extraerTextos.ts";
import { archivosPendientes } from "./pendientes.ts";

const raiz = new URL("../", import.meta.url);
const sueltos = textosSueltosPorArchivo(raiz);

const ejemplos = (archivo: string) => (sueltos.get(archivo) ?? []).slice(0, 3).map((texto) => `  ${archivo}:${texto.linea} «${texto.texto.slice(0, 60)}»`).join("\n");

test("ningún archivo migrado vuelve a tener texto visible escrito en el código", () => {
  const nuevos = [...sueltos.keys()].filter((archivo) => !archivosPendientes.includes(archivo));
  assert.deepEqual(nuevos, [], `Texto visible fuera del catálogo: pásalo a src/textos/es/ con su clave.\n${nuevos.map(ejemplos).join("\n")}`);
});

test("la lista de pendientes solo contiene archivos que aún tienen texto suelto", () => {
  for (const archivo of archivosPendientes) {
    assert.ok(existsSync(new URL(archivo.replace(/^src\//, ""), raiz)), `${archivo} ya no existe: quítalo de pendientes.ts`);
    assert.ok(sueltos.has(archivo), `${archivo} ya no tiene texto suelto: quítalo de src/textos/pendientes.ts`);
  }
});
