/**
 * Decorar la casa (mapa «Decorar la casa de los gatitos»): los muebles que se pueden cambiar, como datos. Cada uno
 * tiene cinco versiones (la 0 es la de siempre) y un sitio fijo en la habitación: se cambia de versión, nunca de
 * sitio, y los sitios de interés de los gatitos no se mueven. La pared cambia el tono de sus rayas por código.
 * La pecera y la jaula de hámsters también se decoran, por partes (mapa «Decorar la pecera y la jaula de hámsters»):
 * tres cambian de color por código y dos, el adorno de la pecera y la casita, esperan sus láminas.
 * Solo lógica: sin dibujo.
 */

import { PECERA } from "./casaPecera.ts";
import { aEscena, DIBUJO, SITIO_JAULA } from "./casaHamsters.ts";
import { CAJA_JAULA, COLOCADOS, TUBO } from "./casaHamstersArte.ts";
import { DECORACION_DE_SIEMPRE, esDeSiempre, MUEBLES, normalizeDecoracion, VERSIONES, type Decoracion, type MuebleId, type Version } from "./casaProgreso.ts";

// Los identificadores que se guardan y su lectura viven en `casaProgreso.ts`, fuera del bloque de la casa.
export { DECORACION_DE_SIEMPRE, esDeSiempre, MUEBLES, normalizeDecoracion, VERSIONES };
export type { Decoracion, MuebleId, Version };

export type Caja = { x: number; y: number; ancho: number; alto: number };

export type Mueble = {
  /** Dónde está el de siempre en la escena de 1280 × 540, para tocarlo (la pared es toda la habitación y no tiene caja). */
  caja: Caja | null;
  /** Otros trozos de la misma parte: el tejado de la jaula, además de su bandeja. */
  mas?: readonly Caja[];
  /** Punto del suelo adonde va a olerlo el gatito más cercano cuando cambia; en la jaula reaccionan los hámsters. */
  oler: { x: number; y: number } | null;
  /**
   * Su lámina (cinco celdas en fila, una por versión, de `prototypes/tools/casa-decorar-recorte.py`) y dónde se pone
   * cada celda en la escena: apoyada abajo y centrada en el de siempre. Sin lámina: la pared y las partes de la pecera y
   * la jaula que cambian de color por código, y las que aún esperan su arte (`SIN_ARTE`).
   */
  dibujo: (Caja & { imagen: string }) | null;
};

/** Un trozo del dibujo del laberinto de la jaula, en px de escena. */
function enLaJaula(x: number, y: number, ancho: number, alto: number): Caja {
  const esquina = aEscena({ x, y });
  return { x: Math.round(esquina.x), y: Math.round(esquina.y), ancho: Math.round(ancho * SITIO_JAULA.escala), alto: Math.round(alto * SITIO_JAULA.escala) };
}

/** El mueble de madera de la pecera: de esta fila de su dibujo para abajo. */
export const MADERA_DESDE = 205;
/** Delante de la pecera, donde el gatito se sienta y los peces se juntan a mirarlo (el sitio `pecera` de la habitación). */
const ANTE_LA_PECERA = { x: -215, y: 462 };

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
  mueblePecera: {
    caja: { x: PECERA.left, y: PECERA.top + MADERA_DESDE, ancho: PECERA.ancho, alto: 150 }, oler: ANTE_LA_PECERA, dibujo: null,
  },
  adornoPecera: {
    caja: { x: PECERA.left + PECERA.agua.izquierda, y: PECERA.top + PECERA.agua.superficie, ancho: PECERA.agua.derecha - PECERA.agua.izquierda, alto: 134 },
    oler: ANTE_LA_PECERA, dibujo: null,
  },
  casita: { caja: enLaJaula(COLOCADOS.casita.x, COLOCADOS.casita.y, COLOCADOS.casita.lado, COLOCADOS.casita.lado), oler: null, dibujo: null },
  // La bandeja de la jaula y, además, su tejado (algo más alto que el dibujo, para el dedo).
  baseJaula: {
    caja: enLaJaula(CAJA_JAULA.x, 436, CAJA_JAULA.ancho, CAJA_JAULA.y + CAJA_JAULA.alto - 436),
    mas: [enLaJaula(CAJA_JAULA.x, 130, CAJA_JAULA.ancho, 56)], oler: null, dibujo: null,
  },
  tubos: { caja: enLaJaula(DIBUJO.x, DIBUJO.y, DIBUJO.ancho, DIBUJO.alto), oler: null, dibujo: null },
};

/** Partes que aún no tienen sus láminas (se montan en «Montar el adorno de la pecera y las casitas»): no se ofrecen. */
export const SIN_ARTE: readonly MuebleId[] = ["adornoPecera", "casita"];
export const sePuedeDecorar = (mueble: MuebleId) => !SIN_ARTE.includes(mueble);

// --- Colores de la pecera y la jaula (valores del boceto) -------------------------------------------------------------

/** El mueble de la pecera: madera (la de siempre), blanco, rosa, azul y verde menta. */
export const COLORES_MUEBLE_PECERA: readonly (string | null)[] = [null, "#f1ece4", "#ee8fb1", "#6ea6dc", "#8fd6b6"];
/** La base y el tejado de la jaula: celeste (el de siempre), rosa, verde, lila y amarillo. */
export const COLORES_BASE_JAULA: readonly (string | null)[] = [null, "#ee6fa3", "#5cbc52", "#9d78dc", "#f7c62f"];

export type ColoresTubos = typeof TUBO;
const juego = (rojo: string, azul: string, amarillo: string): ColoresTubos => ({ rojo, azul, amarillo });
/** Los tubos: los de siempre, pastel, frutas, mar y rosas. Cada juego hace de rojo, azul y amarillo. */
export const JUEGOS_TUBOS: Readonly<Record<Version, ColoresTubos>> = {
  0: TUBO,
  1: juego("#ff97aa", "#8fcdf2", "#ffdd75"),
  2: juego("#52b52e", "#ff7f11", "#8a3fc0"),
  3: juego("#1d4fa8", "#2f9fe0", "#1fb58f"),
  4: juego("#f56aa8", "#c2187f", "#a06fd8"),
};

export type ParteDeColor = "mueblePecera" | "baseJaula";

/** Qué píxeles del dibujo cambian en cada parte (tono 0–360, saturación y luz 0–1) y la luz que se toma de referencia. */
const REGLAS: Readonly<Record<ParteDeColor, { colores: readonly (string | null)[]; referencia: number; es: (tono: number, saturacion: number, luz: number, y: number) => boolean }>> = {
  mueblePecera: { colores: COLORES_MUEBLE_PECERA, referencia: 0.55, es: (h, s, l, y) => y >= MADERA_DESDE && (h <= 33 || h >= 345) && s > 0.2 && l > 0.2 },
  // Los barrotes (tonos 165–196) quedan fuera: siguen celestes.
  baseJaula: { colores: COLORES_BASE_JAULA, referencia: 0.5, es: (h, s, l) => h >= 196 && h <= 232 && s > 0.35 && l > 0.2 && l < 0.72 },
};

function aHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const luz = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, luz];
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const sexto = max === R ? ((G - B) / d + 6) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return [sexto * 60, Math.min(1, d / (1 - Math.abs(2 * luz - 1))), luz];
}

function aRgb(tono: number, saturacion: number, luz: number): [number, number, number] {
  const a = saturacion * Math.min(luz, 1 - luz);
  const canal = (n: number) => {
    const k = (n + tono / 30) % 12;
    return Math.round(255 * (luz - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [canal(0), canal(8), canal(4)];
}

/**
 * Cambia de color los píxeles RGBA (de `ancho` px por fila) de una parte: cada uno toma el tono y la saturación del
 * color nuevo y conserva cuánto se separaba su luz de la de referencia. La versión 0 lo deja como está.
 */
export function recolorear(pixeles: Uint8ClampedArray, ancho: number, parte: ParteDeColor, version: Version): void {
  const { colores, referencia, es } = REGLAS[parte];
  const color = colores[version];
  if (!color) return;
  const [r, g, b] = rgb(color);
  const [tono, saturacion, luzColor] = aHsl(r, g, b);
  const contraste = luzColor > 0.8 ? 0.6 : 0.9;
  for (let i = 0; i < pixeles.length; i += 4) {
    if (!pixeles[i + 3]) continue;
    const [h, s, l] = aHsl(pixeles[i], pixeles[i + 1], pixeles[i + 2]);
    if (!es(h, s, l, Math.floor(i / 4 / ancho))) continue;
    const luz = Math.max(0.06, Math.min(0.98, luzColor + (l - referencia) * contraste));
    [pixeles[i], pixeles[i + 1], pixeles[i + 2]] = aRgb(tono, saturacion, luz);
  }
}

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

/** Los trozos tocables de un mueble (la pared no tiene). */
export function cajasDe(mueble: MuebleId): readonly Caja[] {
  const { caja, mas = [] } = MUEBLES_CASA[mueble];
  return caja ? [caja, ...mas] : [];
}

/** El mueble que hay en el punto (x, y) de la escena: el de la caja que lo contiene, o la pared por encima del zócalo. */
export function muebleEn(x: number, y: number): MuebleId | null {
  // El orden de `MUEBLES` importa en la jaula: la casita y la base van antes que los tubos, que lo ocupan todo.
  const dentro = MUEBLES.find((id) => sePuedeDecorar(id) && cajasDe(id).some((caja) => x >= caja.x && x <= caja.x + caja.ancho && y >= caja.y && y <= caja.y + caja.alto));
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
