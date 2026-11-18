import { coleccion } from "./coleccion.ts";
import { inicio } from "./inicio.ts";
import { mapa } from "./mapa.ts";
import { partida } from "./partida.ts";
import { ventanas } from "./ventanas.ts";

/** Catálogo en español: una zona por archivo, unidas aquí. Es el idioma de referencia del que sale el tipo del catálogo. */
export const es = {
  coleccion,
  inicio,
  mapa,
  partida,
  ventanas,
} as const;
