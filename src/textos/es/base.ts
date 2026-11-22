import { adultos } from "./adultos.ts";
import { tienda } from "./minijuegos/tienda.ts";
import { guardianes } from "./guardianes.ts";
import { pegatinas } from "./pegatinas.ts";
import { caminos } from "./caminos.ts";
import { mundos } from "./mundos.ts";
import { pantallas } from "./pantallas.ts";
import { temas } from "./temas.ts";
import { coleccion } from "./coleccion.ts";
import { inicio } from "./inicio.ts";
import { mapa } from "./mapa.ts";
import { partida } from "./partida.ts";
import { ventanas } from "./ventanas.ts";

/**
 * Zonas que van en el bloque principal: las que usan el inicio, el mapa, el álbum, la partida y las ventanas comunes.
 * Las demás (duelos, juegos, amigos, paseos, casa y cada minijuego) son **zonas diferidas**: viajan con la pantalla que
 * las usa y las registra `src/textos/zonas/<ruta>.ts`. `minijuegos.tienda` va aquí porque el mapa enseña el estado de la tienda.
 */
export const base = {
  coleccion,
  inicio,
  mapa,
  partida,
  adultos,
  minijuegos: { tienda },
  guardianes,
  pegatinas,
  caminos,
  mundos,
  pantallas,
  temas,
  ventanas,
} as const;
