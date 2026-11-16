// Arte final de «La fiesta de los gatitos». Las medidas son las de los archivos (a doble resolución); en la
// escena de 960 × 540 se muestran a la mitad. Salen de `prototypes/tools/gatitos-recorte.py`.
const sprites = "./assets/sprites";
export const CLEARING_BACKGROUND = "./assets/worlds/claro-fiesta-v1.webp";

/** Tira horizontal de celdas iguales: `cell` es el tamaño de una celda en píxeles del archivo. */
export type Strip = { src: string; cell: readonly [number, number]; count: number; feetX?: number };
export const strip = (name: string, cell: readonly [number, number], count: number, feetX?: number): Strip => ({ src: `${sprites}/${name}`, cell, count, feetX });

export const ART = {
  noa: strip("noa-lenadora-v1.webp", [319, 494], 4, 155),
  kittenGrey: strip("gatito-gris-empuja-v1.webp", [208, 209], 3, 102),
  kittenOrange: strip("gatito-naranja-empuja-v1.webp", [291, 249], 3, 123),
  smallLog: strip("tronco-pequeno-v1.webp", [236, 79], 3),
  mediumLog: strip("tronco-mediano-v1.webp", [400, 157], 4),
  fire: strip("hoguera-v1.webp", [389, 408], 4, 192),
  belt: { src: `${sprites}/cinta-v1.webp`, size: [53, 128] as const },
  stump: { src: `${sprites}/tajo-v1.webp`, size: [280, 238] as const },
  stick: { src: `${sprites}/lena-v1.webp`, size: [148, 38] as const },
  woodpile: { src: `${sprites}/monton-lena-v1.webp`, size: [440, 226] as const },
} as const;

export const NOA_POSES = { ready: 0, raise: 1, chop: 2, celebrate: 3 } as const;
export const KITTEN_POSES = { ready: 0, push: 1, meow: 2 } as const;
/** Índice de cada pieza en la tira de un tronco: entero, con grieta (solo el mediano) y las dos mitades. */
export const LOG_CELLS = { whole: 0, cracked: 1 } as const;
export const halfCell = (strip: Strip, side: -1 | 1) => strip.count - (side < 0 ? 2 : 1);

/** Tamaño en pantalla (la mitad del archivo) de una celda. */
export const shown = (strip: Strip) => ({ width: strip.cell[0] / 2, height: strip.cell[1] / 2 });

/** Posición de fondo de una celda dentro de su tira (para `background-position`). */
export const cellPosition = (strip: Strip, index: number) => `${strip.count > 1 ? index / (strip.count - 1) * 100 : 0}% 0`;
export const cellStyle = (strip: Strip, index: number) => ({
  backgroundImage: `url("${strip.src}")`,
  backgroundSize: `${strip.count * 100}% 100%`,
  backgroundPosition: cellPosition(strip, index),
});

export const FIRE_FRAMES = { unlit: 0, flames: [1, 2, 3] as const };

// Colocación en la escena. Los pies de Noa y de los gatitos se alinean con su x indicada.
export const NOA_FEET = { x: 181, y: 490 };
export const KITTENS = { grey: { feetX: 885, floor: 404 }, orange: { feetX: 790, floor: 404 } } as const;
export const BELT = { left: 330, top: 404, tiles: 23 };
export const STUMP_BOX = { centerX: 318, centerTop: 404 };
export const FIRE_BOX = { left: 548, bottom: 414, scale: 0.9 };
/** El montón completo de la hoguera final se muestra algo más pequeño para no tapar a Noa. */
export const WOODPILE_SCALE = 0.86;
