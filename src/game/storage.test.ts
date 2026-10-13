import assert from "node:assert/strict";
import test from "node:test";
import { emptyProgress, readProgress, saveProgress } from "./progress.ts";
import { readSavedPercentage, readStorage, writeStorage } from "./storage.ts";

test("el acceso al almacenamiento soporta navegadores que lo bloquean", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  try {
    Object.defineProperty(globalThis, "localStorage", { configurable: true, get: () => { throw Error("bloqueado"); } });
    assert.equal(readStorage("cualquiera"), null);
    assert.equal(writeStorage("cualquiera", "valor"), false);
    assert.equal(readSavedPercentage("volumen", 80), 80);
    assert.deepEqual(readProgress(), emptyProgress);
    assert.equal(saveProgress(emptyProgress), false);
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});

test("el cero elegido se conserva y el cero automático antiguo usa el valor predeterminado", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const values = new Map<string, string>();
  try {
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    } });
    assert.equal(writeStorage("volumen", "0"), true);
    assert.equal(readSavedPercentage("volumen", 75), 75);
    assert.equal(writeStorage("volumen-configured", "true"), true);
    assert.equal(readSavedPercentage("volumen", 75), 0);
    assert.equal(writeStorage("volumen", "130"), true);
    assert.equal(readSavedPercentage("volumen", 75), 100);
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
