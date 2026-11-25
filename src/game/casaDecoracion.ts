/**
 * Decorar la casa (mapa «Decorar la casa de los gatitos»): los muebles que se pueden cambiar, como datos. Cada uno
 * tiene cinco versiones (la 0 es la de siempre) y un sitio fijo en la habitación: se cambia de versión, nunca de
 * sitio, y los sitios de interés de los gatitos no se mueven. La pared cambia el tono de sus rayas por código.
 * Solo lógica: sin dibujo.
 */

import { DECORACION_DE_SIEMPRE, esDeSiempre, MUEBLES, normalizeDecoracion, VERSIONES, type Decoracion, type MuebleId, type Version } from "./casaProgreso.ts";

// Los identificadores que se guardan y su lectura viven en `casaProgreso.ts`, fuera del bloque de la casa.
export { DECORACION_DE_SIEMPRE, esDeSiempre, MUEBLES, normalizeDecoracion, VERSIONES };
export type { Decoracion, MuebleId, Version };

export type Caja = { x: number; y: number; ancho: number; alto: number };

export type Mueble = {
  /** Dónde está el de siempre en la escena de 1280 × 540, para tocarlo (la pared es toda la habitación y no tiene caja). */
  caja: Caja | null;
  /** Punto del suelo adonde va a olerlo el gatito más cercano cuando cambia. */
  oler: { x: number; y: number };
  /**
   * Su lámina (cinco celdas en fila, una por versión, de `prototypes/tools/casa-decorar-recorte.py`) y dónde se pone
   * cada celda en la escena: apoyada abajo y centrada en el de siempre. La pared no tiene: cambia de tono por código.
   */
  dibujo: (Caja & { imagen: string }) | null;
};

export const MUEBLES_CASA: Readonly<Record<MuebleId, Mueble>> = {
  cama: {
    caja: { x: 261, y: 316, ancho: 198, alto: 117 }, oler: { x: 470, y: 440 },
    dibujo: { imagen: "./assets/sprites/casa-mueble-cama-v1.webp", x: 261, y: 251, ancho: 198, alto: 182 },
  },
  alfombra: {
    caja: { x: 512, y: 396, ancho: 442, alto: 123 }, oler: { x: 960, y: 480 },
    dibujo: { imagen: "./assets/sprites/casa-mueble-alfombra-v1.webp", x: 512, y: 396, ancho: 442, alto: 123 },
  },
  cuadro: {
    caja: { x: 975, y: 81, ancho: 66, alto: 89 }, oler: { x: 1010, y: 415 },
    dibujo: { imagen: "./assets/sprites/casa-mueble-cuadro-v1.webp", x: 975, y: 81, ancho: 66, alto: 89 },
  },
  planta: {
    caja: { x: 885, y: 140, ancho: 79, alto: 77 }, oler: { x: 925, y: 415 },
    dibujo: { imagen: "./assets/sprites/casa-mueble-planta-v1.webp", x: 885, y: 125, ancho: 79, alto: 92 },
  },
  pared: { caja: null, oler: { x: 640, y: 430 }, dibujo: null },
  // Mapa «Más decoraciones y accesorios para la casa»: láminas de `prototypes/tools/casa-decorar-v2-recorte.py`.
  cortinas: {
    caja: { x: 586, y: 22, ancho: 298, alto: 262 }, oler: { x: 740, y: 420 },
    dibujo: { imagen: "./assets/sprites/casa-mueble-cortinas-v1.webp", x: 586, y: 22, ancho: 298, alto: 262 },
  },
  estanteria: {
    caja: { x: 282, y: 150, ancho: 160, alto: 82 }, oler: { x: 300, y: 440 },
    dibujo: { imagen: "./assets/sprites/casa-mueble-estanteria-v1.webp", x: 282, y: 150, ancho: 160, alto: 82 },
  },
  cojin: {
    caja: { x: 150, y: 445, ancho: 180, alto: 86 }, oler: { x: 350, y: 500 },
    dibujo: { imagen: "./assets/sprites/casa-mueble-cojin-v1.webp", x: 150, y: 445, ancho: 180, alto: 86 },
  },
};

/** Las estrellas de la habitación CELESTE (versión 4 de cortinas, estantería y cojín) destellan, más de noche. */
export const esMuebleMagico = (mueble: MuebleId, version: Version) => version === 4 && ["cortinas", "estanteria", "cojin"].includes(mueble);

/** Muebles que cuelgan delante del cristal: en las fotos se pintan después de la ventana de noche y del clima (en la escena ya van encima). */
export const DELANTE_DE_LA_VENTANA: readonly MuebleId[] = ["cortinas"];

/** Los dos tonos de las rayas de la pared en el fondo (claro y oscuro) y sus cinco versiones: crema, menta, lila, azul cielo y amarillo. */
export const RAYAS_DEL_FONDO = ["#fbead2", "#f8dabb"] as const;
export const TONOS_PARED: readonly (readonly [string, string])[] = [
  ["#fbead2", "#f8dabb"],
  ["#e3f5e9", "#cbebd7"],
  ["#efe5f8", "#ddcdf0"],
  ["#e2effa", "#c9e0f4"],
  ["#fff4c9", "#fbe6a2"],
];

export const cambiarMueble = (decoracion: Decoracion, mueble: MuebleId, version: Version): Decoracion =>
  ({ ...decoracion, [mueble]: version });

/** La pared de la habitación llega hasta el zócalo (en px de escena): por encima de esto, tocar fuera de un mueble es la pared. */
export const PARED_HASTA = 355;

/** El mueble que hay en el punto (x, y) de la escena: el de la caja que lo contiene, o la pared por encima del zócalo. */
export function muebleEn(x: number, y: number): MuebleId | null {
  const dentro = MUEBLES.find((id) => {
    const caja = MUEBLES_CASA[id].caja;
    return caja !== null && x >= caja.x && x <= caja.x + caja.ancho && y >= caja.y && y <= caja.y + caja.alto;
  });
  return dentro ?? (y >= 0 && y < PARED_HASTA ? "pared" : null);
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
/** Hasta esta distancia de un tono de las rayas, el píxel es pared (la luz de la ventana la aclara un poco). */
const DISTANCIA_PARED = 40;

/**
 * Cambia el tono de la pared en los píxeles RGBA de un fondo de `ancho` × `alto` (los de la escena). Es pared lo que
 * se parece a sus rayas, está por encima del zócalo y se llega a ello desde el borde de arriba sin cruzar un contorno:
 * así el marco de la ventana, la pantalla de la lámpara o la bañera, aunque sean de colores parecidos, no cambian.
 * Cada píxel de pared pasa del tono de su raya al de la versión `version`, conservando lo que la luz lo aclaraba.
 * La versión 0 lo deja como está.
 */
export function cambiarTonoPared(pixeles: Uint8ClampedArray, ancho: number, alto: number, version: Version): void {
  if (version === 0) return;
  const desde = RAYAS_DEL_FONDO.map(rgb);
  const hasta = TONOS_PARED[version].map(rgb);
  const filas = Math.min(alto, PARED_HASTA);
  // Raya de cada píxel parecido a la pared (o -1).
  const raya = new Int8Array(ancho * filas).fill(-1);
  for (let p = 0; p < ancho * filas; p++) {
    let distancia = DISTANCIA_PARED;
    desde.forEach((color, indice) => {
      const d = Math.hypot(pixeles[p * 4] - color[0], pixeles[p * 4 + 1] - color[1], pixeles[p * 4 + 2] - color[2]);
      if (d < distancia) { distancia = d; raya[p] = indice; }
    });
  }
  // Desde la fila de arriba, por vecinos de pared.
  const visto = new Uint8Array(ancho * filas);
  const pendientes: number[] = [];
  for (let x = 0; x < ancho; x++) if (raya[x] >= 0) { visto[x] = 1; pendientes.push(x); }
  while (pendientes.length) {
    const p = pendientes.pop()!;
    const x = p % ancho;
    for (const q of [p - ancho, p + ancho, x > 0 ? p - 1 : -1, x < ancho - 1 ? p + 1 : -1]) {
      if (q >= 0 && q < ancho * filas && !visto[q] && raya[q] >= 0) { visto[q] = 1; pendientes.push(q); }
    }
    const r = raya[p];
    for (let c = 0; c < 3; c++) pixeles[p * 4 + c] = hasta[r][c] + (pixeles[p * 4 + c] - desde[r][c]);
  }
}
