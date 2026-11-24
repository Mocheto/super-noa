import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/** Módulos que se importan en tiempo de ejecución (no los `import type`). */
const importaciones = (archivo: string) =>
  [...readFileSync(new URL(archivo, import.meta.url), "utf8").matchAll(/^import (?!type )[^;]*? from "([^"]+)";/gms)].map((m) => m[1].replace(/\.tsx?$/, ""));

test("el progreso de la casa solo depende de datos, para no arrastrar la casa al bloque principal", () => {
  assert.deepEqual(importaciones("./casaProgreso.ts"), ["./friendData"]);
});

test("lo que entra en el bloque principal lee la casa desde casaProgreso, no desde su motor", () => {
  for (const archivo of ["./progress.ts", "./casaRescate.ts"]) {
    const deLaCasa = importaciones(archivo).filter((ruta) => /^\.\/casa/.test(ruta));
    assert.deepEqual(deLaCasa, ["./casaProgreso"], archivo);
  }
});
