import assert from "node:assert/strict";
import test from "node:test";
import { FUNCIONES_POR_DEFECTO, leerFunciones } from "./funciones.ts";

test("los paseos y la pestaña Amigos están apagados por defecto", () => {
  assert.deepEqual(FUNCIONES_POR_DEFECTO, { amigos: false, paseos: false });
  assert.deepEqual(leerFunciones(null), { amigos: false, paseos: false });
});

test("?funciones= enciende solo las funciones conocidas", () => {
  assert.deepEqual(leerFunciones("?funciones=amigos"), { amigos: true, paseos: false });
  assert.deepEqual(leerFunciones("?prueba=1-1&funciones=paseos, amigos,cohetes"), { amigos: true, paseos: true });
  assert.deepEqual(leerFunciones("?funciones="), { amigos: false, paseos: false });
});
