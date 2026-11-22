import { detourLevels } from "./detours.ts";
import { levels, waterLevels } from "./levels.ts";
import type { NivelResumen } from "./nivelesIndice.ts";
import { restStopLevels } from "./restStopNiveles.ts";
import type { Level } from "./types";

// La interfaz trabaja con el resumen de cada pantalla (nivelesIndice.ts); la partida necesita la pantalla entera.
// Este módulo se carga junto con GameCanvas y trae la geometría de levels.ts y de los paseos.

const todas = new Map<string, Level>([...levels, ...waterLevels, ...detourLevels, ...restStopLevels].map((level) => [level.id, level]));

/** La pantalla completa de un resumen (o la misma pantalla, si ya lo es: desvíos y pantallas de prueba). */
export function nivelCompleto(nivel: NivelResumen | Level): Level {
  if ("platforms" in nivel) return nivel;
  const completo = todas.get(nivel.id);
  if (!completo) throw new Error(`Pantalla sin geometría: ${nivel.id}`);
  return completo;
}
