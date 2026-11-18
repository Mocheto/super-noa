import { partida } from "./partida.ts";
import { ventanas } from "./ventanas.ts";

/** Catálogo en español: una zona por archivo, unidas aquí. Es el idioma de referencia del que sale el tipo del catálogo. */
export const es = {
  partida,
  ventanas,
} as const;
