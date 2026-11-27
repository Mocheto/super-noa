/**
 * El arte de la jaula de hámsters (`docs/art/casa-hamsters-v1.md`, recortado con
 * `prototypes/tools/casa-hamsters-recorte.py`) y dónde va cada pieza, en px del dibujo del laberinto. Lo usan la jaula
 * de la casa (`JaulaHamsters.tsx`) y las fotos. Los tubos, los cubos, la repisa, las rampas y la puerta van por código.
 */
import { COSAS, NODOS, type ColorTubo, type HamsterId } from "./casaHamsters.ts";

export const ARTE_JAULA = {
  jaula: "./assets/sprites/casa-jaula-v1.webp",
  objetos: "./assets/sprites/casa-jaula-objetos-v1.webp",
  /** Los botones de la bandeja: saco de comida y jarrita de agua, en dos celdas. */
  bandeja: "./assets/sprites/casa-jaula-bandeja-v1.webp",
  hamsters: { perla: "./assets/sprites/casa-hamster-perla-v1.webp", bolita: "./assets/sprites/casa-hamster-bolita-v1.webp" },
} as const;

/** La jaula vacía: tejado, barrotes y bandeja. */
export const CAJA_JAULA = { x: 382, y: 146, ancho: 386, alto: 374 } as const;
/** El fondo claro entre los barrotes, para que los de dentro se vean bien. */
export const FONDO_JAULA = { x: 392, y: 180, ancho: 366, alto: 290 } as const;

export const TUBO: Readonly<Record<ColorTubo, string>> = { rojo: "#ef5b6b", azul: "#35a9e0", amarillo: "#f4c22b" };

export const CELDA_OBJETO = 96;
export const OBJETOS_JAULA = ["soporte", "aro", "marco", "asiento", "casita", "comidaLlena", "comidaVacia", "botella"] as const;
export type ObjetoJaula = (typeof OBJETOS_JAULA)[number];
/** Dónde va la celda de un objeto: esquina de arriba a la izquierda y lado, en px del dibujo. */
export type Colocado = { celda: number; x: number; y: number; lado: number };

/** La celda apoyada en (`x`, `suelo`): las piezas van centradas y con la base en la fila 94. */
const apoyado = (objeto: ObjetoJaula, x: number, suelo: number, escala: number): Colocado =>
  ({ celda: OBJETOS_JAULA.indexOf(objeto), x: x - 48 * escala, y: suelo - 94 * escala, lado: CELDA_OBJETO * escala });

const SUELO = NODOS.f1.y + 19;
const REPISA_Y = 330;
const { x: ruedaX } = NODOS[COSAS.rueda];
const { x: columpioX } = NODOS[COSAS.columpio];
const { x: aguaX } = NODOS[COSAS.agua];

/** Alrededor de qué giran el aro de la rueda y el asiento del columpio. */
export const EJE_RUEDA = { x: ruedaX, y: 293 } as const;
export const EJE_COLUMPIO = { x: columpioX, y: 420 } as const;

export const COLOCADOS = {
  soporte: apoyado("soporte", ruedaX, REPISA_Y, 0.66),
  // El aro, centrado en su eje (su centro en la celda es (48, 49)).
  aro: { celda: 1, x: EJE_RUEDA.x - 48 * 0.9, y: EJE_RUEDA.y - 49 * 0.9, lado: CELDA_OBJETO * 0.9 },
  marco: apoyado("marco", columpioX, SUELO, 0.9),
  asiento: apoyado("asiento", columpioX, SUELO - 7, 0.55),
  casita: apoyado("casita", NODOS[COSAS.casita].x, REPISA_Y, 0.78),
  comidaLlena: apoyado("comidaLlena", NODOS[COSAS.comida].x, SUELO + 2, 0.52),
  comidaVacia: apoyado("comidaVacia", NODOS[COSAS.comida].x, SUELO + 2, 0.52),
  botella: { celda: 7, x: aguaX + 8 - 19 * 0.85, y: 452 - 94 * 0.85, lado: CELDA_OBJETO * 0.85 },
} as const satisfies Record<ObjetoJaula, Colocado>;

/** El agua dentro de la botella, en px de su celda. */
export const AGUA_EN_BOTELLA = { x: 37, ancho: 30, fondo: 60, alto: 48 } as const;

export const CUADRO_HAMSTER = { ancho: 96, alto: 72, pie: 70 } as const;
export const POSES = ["andarA", "andarB", "sentado", "comiendo", "bebiendo", "dormido", "asomado", "cogido"] as const;
export type Pose = (typeof POSES)[number];
const ESCALA_HAMSTER: Readonly<Record<HamsterId, number>> = { perla: 0.92, bolita: 0.82 };

/** Caja del cuadro de un hámster respecto a su centro, mirando a la derecha: los pies, 19 px por debajo. */
export function cajaDeHamster(id: HamsterId) {
  const escala = ESCALA_HAMSTER[id];
  return { x: -48 * escala, y: 19 - CUADRO_HAMSTER.pie * escala, ancho: CUADRO_HAMSTER.ancho * escala, alto: CUADRO_HAMSTER.alto * escala };
}

/** La puerta de la casita, en px del dibujo: su centro y su suelo. */
export const PUERTA_CASITA = {
  x: COLOCADOS.casita.x + (45 * COLOCADOS.casita.lado) / CELDA_OBJETO,
  suelo: COLOCADOS.casita.y + (92 * COLOCADOS.casita.lado) / CELDA_OBJETO,
} as const;
/** La cabeza y las manitas dentro del cuadro «asomado», igual en las dos hojas. */
export const ASOMADO = { x: 27, y: 38, ancho: 42, alto: 32 } as const;
