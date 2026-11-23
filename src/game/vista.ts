import { VIEW_WIDTH } from "./constants.ts";

/**
 * Parte del lienzo que se ve (issue 323). En vertical, el escenario es 4:3: el lienzo sigue midiendo 960 × 540, pero
 * solo se ven `ANCHO_VERTICAL` unidades, en una ventana que sigue a Noa. El dibujo que se pega a los bordes de la
 * pantalla (flechas, bocadillos, la palabra al recoger) usa estos bordes en lugar de 0 y `VIEW_WIDTH`.
 */
export const ANCHO_VERTICAL = 720;
export const vista = { izquierda: 0, derecha: VIEW_WIDTH };

/** Dónde empieza la ventana para que Noa quede a un 40 % de su ancho, sin salirse del lienzo. */
export const recorteObjetivo = (noaX: number, ancho = ANCHO_VERTICAL) => Math.max(0, Math.min(VIEW_WIDTH - ancho, noaX - ancho * .4));

export function ponerVista(izquierda: number, ancho: number) {
  vista.izquierda = izquierda;
  vista.derecha = izquierda + ancho;
}
