import { caminos } from "./caminos.ts";
import { mundos } from "./mundos.ts";
import { pantallas } from "./pantallas.ts";
import { paseos } from "./paseos.ts";
import { temas } from "./temas.ts";
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
  caminos,
  mundos,
  pantallas,
  paseos,
  temas,
  ventanas,
} as const;
