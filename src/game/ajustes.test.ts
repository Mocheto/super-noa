import assert from "node:assert/strict";
import test from "node:test";
import { CLAVES_AJUSTES, conVolumen, guardarAjustes, leerAjustes, marcarVolumenElegido } from "./ajustes.ts";

function almacenFalso(inicial: Record<string, string> = {}) {
  const datos = new Map(Object.entries(inicial));
  const almacen = {
    datos,
    getItem: (clave: string) => datos.get(clave) ?? null,
    setItem: (clave: string, valor: string) => { datos.set(clave, valor); },
  };
  Object.defineProperty(globalThis, "localStorage", { value: almacen, configurable: true, writable: true });
  return datos;
}

test("sin nada guardado: con sonido, volúmenes al 100 %, movimiento normal y controles automáticos", () => {
  almacenFalso();
  assert.deepEqual(leerAjustes(), { muted: false, musicVolume: 100, effectsVolume: 100, reduceMotion: false, touchControls: "auto" });
});

test("se leen las mismas claves de siempre", () => {
  almacenFalso({
    "super-noa-muted": "true", "super-noa-music-volume": "40", "super-noa-effects-volume": "70",
    "super-noa-reduce-motion": "true", "super-noa-touch-controls": "always",
  });
  assert.deepEqual(leerAjustes(), { muted: true, musicVolume: 40, effectsVolume: 70, reduceMotion: true, touchControls: "always" });
});

test("un 0 antiguo sin marcar no es silencio; marcado, sí", () => {
  almacenFalso({ "super-noa-music-volume": "0", "super-noa-effects-volume": "0" });
  assert.equal(leerAjustes().musicVolume, 100);
  marcarVolumenElegido("musica");
  assert.equal(leerAjustes().musicVolume, 0);
  assert.equal(leerAjustes().effectsVolume, 100);
  marcarVolumenElegido("efectos");
  assert.equal(leerAjustes().effectsVolume, 0);
});

test("guardar y volver a leer da lo mismo", () => {
  const datos = almacenFalso();
  const ajustes = conVolumen(conVolumen({ ...leerAjustes(), muted: true, touchControls: "always" as const }, "musica", 35), "efectos", 0);
  guardarAjustes(ajustes);
  marcarVolumenElegido("efectos");
  assert.deepEqual(leerAjustes(), ajustes);
  assert.deepEqual([...datos.keys()].sort(), [...Object.values(CLAVES_AJUSTES), "super-noa-effects-volume-configured"].sort());
});

test("valores raros vuelven a lo de siempre", () => {
  almacenFalso({ "super-noa-music-volume": "abc", "super-noa-effects-volume": "250", "super-noa-touch-controls": "nunca" });
  const ajustes = leerAjustes();
  assert.equal(ajustes.musicVolume, 100);
  assert.equal(ajustes.effectsVolume, 100);
  assert.equal(ajustes.touchControls, "auto");
});
