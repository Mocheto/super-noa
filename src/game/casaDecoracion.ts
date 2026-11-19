/**
 * Decorar la casa (mapa «Decorar la casa de los gatitos»): los muebles que se pueden cambiar, como datos. Cada uno
 * tiene cinco versiones (la 0 es la de siempre) y un sitio fijo en la habitación: se cambia de versión, nunca de
 * sitio, y los sitios de interés de los gatitos no se mueven. La pared cambia el tono de sus rayas por código.
 * Solo lógica: sin dibujo.
 */

export type MuebleId = "cama" | "alfombra" | "cuadro" | "planta" | "pared";
export type Version = 0 | 1 | 2 | 3 | 4;
export type Decoracion = Record<MuebleId, Version>;
export type Caja = { x: number; y: number; ancho: number; alto: number };

export const MUEBLES: readonly MuebleId[] = ["cama", "alfombra", "cuadro", "planta", "pared"];
export const VERSIONES: readonly Version[] = [0, 1, 2, 3, 4];

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

/** Los dos tonos de las rayas de la pared en el fondo (claro y oscuro) y sus cinco versiones: crema, menta, lila, azul cielo y amarillo. */
export const RAYAS_DEL_FONDO = ["#fbead2", "#f8dabb"] as const;
export const TONOS_PARED: readonly (readonly [string, string])[] = [
  ["#fbead2", "#f8dabb"],
  ["#e3f5e9", "#cbebd7"],
  ["#efe5f8", "#ddcdf0"],
  ["#e2effa", "#c9e0f4"],
  ["#fff4c9", "#fbe6a2"],
];

export const DECORACION_DE_SIEMPRE: Decoracion = { cama: 0, alfombra: 0, cuadro: 0, planta: 0, pared: 0 };

const esVersion = (valor: unknown): valor is Version => VERSIONES.includes(valor as Version);

/** Lectura tolerante: lo que falte o no valga sale como la decoración de siempre. */
export function normalizeDecoracion(raw: unknown): Decoracion {
  const datos = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  return Object.fromEntries(MUEBLES.map((id) => [id, esVersion(datos[id]) ? datos[id] : 0])) as Decoracion;
}

export const esDeSiempre = (decoracion: Decoracion) => MUEBLES.every((id) => decoracion[id] === 0);

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
