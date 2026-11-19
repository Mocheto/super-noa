/**
 * Decorar la casa (mapa «Decorar la casa de los gatitos»): los muebles que se pueden cambiar, como datos. Cada uno
 * tiene tres versiones (la 0 es la de siempre) y un sitio fijo en la habitación: se cambia de versión, nunca de
 * sitio, y los sitios de interés de los gatitos no se mueven. La pared cambia el tono de sus rayas por código.
 * Solo lógica: sin dibujo.
 */

export type MuebleId = "cama" | "alfombra" | "cuadro" | "planta" | "pared";
export type Version = 0 | 1 | 2;
export type Decoracion = Record<MuebleId, Version>;
export type Caja = { x: number; y: number; ancho: number; alto: number };

export const MUEBLES: readonly MuebleId[] = ["cama", "alfombra", "cuadro", "planta", "pared"];
export const VERSIONES: readonly Version[] = [0, 1, 2];

export type Mueble = {
  /** Dónde está en la escena de 1280 × 540 (la pared es toda la habitación y no tiene caja). */
  caja: Caja | null;
  /** Punto del suelo adonde va a olerlo el gatito más cercano cuando cambia. */
  oler: { x: number; y: number };
  /** Fila de su lámina en `casa-muebles-v1.webp` (la pared no tiene). */
  fila: number | null;
};

export const MUEBLES_CASA: Readonly<Record<MuebleId, Mueble>> = {
  cama: { caja: { x: 262, y: 318, ancho: 195, alto: 112 }, oler: { x: 470, y: 440 }, fila: 0 },
  alfombra: { caja: { x: 515, y: 395, ancho: 435, alto: 120 }, oler: { x: 960, y: 480 }, fila: 1 },
  cuadro: { caja: { x: 977, y: 85, ancho: 63, alto: 80 }, oler: { x: 1010, y: 415 }, fila: 2 },
  planta: { caja: { x: 885, y: 140, ancho: 80, alto: 82 }, oler: { x: 925, y: 415 }, fila: 3 },
  pared: { caja: null, oler: { x: 640, y: 430 }, fila: null },
};

/** Los dos tonos de las rayas de la pared en el fondo (claro y oscuro) y sus tres versiones: crema, menta y lila. */
export const RAYAS_DEL_FONDO = ["#fbead2", "#f8dabb"] as const;
export const TONOS_PARED: readonly (readonly [string, string])[] = [
  ["#fbead2", "#f8dabb"],
  ["#e3f5e9", "#cbebd7"],
  ["#efe5f8", "#ddcdf0"],
];

export const DECORACION_DE_SIEMPRE: Decoracion = { cama: 0, alfombra: 0, cuadro: 0, planta: 0, pared: 0 };

const esVersion = (valor: unknown): valor is Version => valor === 0 || valor === 1 || valor === 2;

/** Lectura tolerante: lo que falte o no valga sale como la decoración de siempre. */
export function normalizeDecoracion(raw: unknown): Decoracion {
  const datos = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  return Object.fromEntries(MUEBLES.map((id) => [id, esVersion(datos[id]) ? datos[id] : 0])) as Decoracion;
}

export const esDeSiempre = (decoracion: Decoracion) => MUEBLES.every((id) => decoracion[id] === 0);

export const cambiarMueble = (decoracion: Decoracion, mueble: MuebleId, version: Version): Decoracion =>
  ({ ...decoracion, [mueble]: version });
