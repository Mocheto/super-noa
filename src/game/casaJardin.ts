/**
 * El jardín de la casa (mapa «Jardín de la casa»): la segunda estancia, al aire libre, como datos; en qué estancia está
 * cada gatito en casa (campo opcional `casa.enJardin`) y los tres maceteros que Noa riega (campo opcional
 * `casa.jardin`). Solo lógica.
 */
import { cuidar, enCasaDe, fechaLocal, LANZAMIENTOS_PARA_JUGAR, type CasaProgress, type ResultadoCuidado } from "./casa.ts";
import {
  CELDAS_MACETEROS, COLORES_FLOR, ETAPAS, JARDIN_DE_SIEMPRE, normalizeEnJardin, normalizeJardin,
  type ColorFlor, type Etapa, type JardinProgress, type Macetero,
} from "./casaProgreso.ts";
import type { SitioInteres, SueloDeEstancia } from "./casaHabitacion.ts";

// Lo que se guarda del jardín y su lectura viven en `casaProgreso.ts`, fuera del bloque de la casa.
export { CELDAS_MACETEROS, COLORES_FLOR, ETAPAS, JARDIN_DE_SIEMPRE, normalizeEnJardin, normalizeJardin };
export type { ColorFlor, Etapa, JardinProgress, Macetero };

export const ESTANCIAS = ["habitacion", "jardin"] as const;
export type Estancia = (typeof ESTANCIAS)[number];

type Caja = { left: number; top: number; width: number; height: number };
type Zona = { izquierda: number; derecha: number; arriba: number; abajo: number };

export type Jardin = SueloDeEstancia & {
  id: "jardin";
  ancho: number;
  alto: number;
  fondo: string;
  sitios: { puerta: SitioInteres; colchoneta: SitioInteres; arbol: SitioInteres; hierba: SitioInteres };
  /** Puerta de la casa (a la izquierda): tocarla vuelve a la habitación; soltar ahí a un gatito lo lleva a la habitación. */
  zonaPuerta: Zona;
  /** Colchoneta: su dibujo y la zona donde se suelta a un gatito para que bote. */
  colchoneta: Caja & { imagen: string };
  zonaColchoneta: Zona;
  /** Los tres maceteros sobre la jardinera de la valla, de izquierda a derecha: su celda de 100 × 128 (con su flor encima). */
  maceteros: readonly Caja[];
  /** Sitio de cada gatito del jardín cuando llega, por su orden: por la hierba, lejos de la colchoneta. */
  sitiosDia: readonly { x: number; y: number }[];
};

/**
 * Jardín de 1280 × 540, como la habitación (medidas del arte, `casa-jardin-recorte.py`): la pared de la casa con su
 * puerta a la izquierda, la hierba desde la fila 428, el árbol, la colchoneta en el centro y la jardinera de la valla a
 * la derecha (de x = 996 en adelante), con los maceteros encima.
 */
export const JARDIN: Jardin = {
  id: "jardin",
  ancho: 1280,
  alto: 540,
  fondo: "./assets/worlds/casa-jardin-v1.webp",
  suelo: { fondo: 445, delante: 528, izquierda: 110, derecha: 975 },
  escala: { fondo: 0.85, delante: 1 },
  sitios: {
    puerta: { x: 171, y: 455, para: null },
    colchoneta: { x: 600, y: 485, para: null },
    arbol: { x: 880, y: 465, para: "dormir" },
    hierba: { x: 420, y: 512, para: "cantar" },
  },
  zonaPuerta: { izquierda: 60, derecha: 285, arriba: 90, abajo: 460 },
  colchoneta: { imagen: "./assets/sprites/casa-colchoneta-v1.webp", left: 500, top: 440, width: 200, height: 96 },
  zonaColchoneta: { izquierda: 490, derecha: 710, arriba: 380, abajo: 540 },
  maceteros: [
    { left: 1003, top: 340, width: 100, height: 128 },
    { left: 1090, top: 340, width: 100, height: 128 },
    { left: 1177, top: 340, width: 100, height: 128 },
  ],
  sitiosDia: [{ x: 330, y: 490 }, { x: 420, y: 515 }, { x: 770, y: 480 }, { x: 860, y: 510 }, { x: 940, y: 480 }],
};

/** El sitio de la puerta en cada estancia: por donde se entra y adonde se va para salir. */
export const puertaDe = (estancia: Estancia, habitacion: { sitios: { puerta: { x: number; y: number } } }) =>
  estancia === "jardin" ? JARDIN.sitios.puerta : habitacion.sitios.puerta;

/** La puerta del corazón de la habitación (dibujada en su fondo): lleva al jardín. */
export const ZONA_PUERTA_HABITACION: Zona = { izquierda: 50, derecha: 240, arriba: 100, abajo: 430 };

const dentro = (zona: Zona, x: number, y: number) => x >= zona.izquierda && x <= zona.derecha && y >= zona.arriba && y <= zona.abajo;

/** ¿Está el punto sobre la puerta que lleva a la otra estancia? */
export const sobreLaPuerta = (estancia: Estancia, x: number, y: number) => dentro(zonaPuertaDe(estancia), x, y);

/** La zona de la puerta en cada estancia. */
export const zonaPuertaDe = (estancia: Estancia): Zona => estancia === "jardin" ? JARDIN.zonaPuerta : ZONA_PUERTA_HABITACION;

/** ¿Está el punto sobre la colchoneta? */
export const sobreLaColchoneta = (x: number, y: number) => dentro(JARDIN.zonaColchoneta, x, y);

/** Índice del macetero bajo el punto, o `null`. */
export function maceteroBajo(x: number, y: number): number | null {
  const indice = JARDIN.maceteros.findIndex((caja) => x >= caja.left && x <= caja.left + caja.width && y >= caja.top && y <= caja.top + caja.height);
  return indice >= 0 ? indice : null;
}

// --- Dónde está cada gatito ------------------------------------------------------------------------------------------

/** Estancia de un gatito en casa: el jardín si está apuntado allí; si no, la habitación. */
export const estanciaDe = (casa: CasaProgress, mundo: number): Estancia =>
  casa.enJardin?.includes(mundo) && enCasaDe(casa).includes(mundo) ? "jardin" : "habitacion";

/** Gatitos en casa que están en la estancia dada, por orden de mundo. */
export const gatitosEn = (casa: CasaProgress, estancia: Estancia): number[] =>
  enCasaDe(casa).filter((mundo) => estanciaDe(casa, mundo) === estancia);

const conJardin = (casa: CasaProgress, enJardin: number[]): CasaProgress => {
  const resto = { ...casa };
  delete resto.enJardin;
  return enJardin.length ? { ...resto, enJardin: [...enJardin].sort((a, b) => a - b) } : resto;
};

/** Lleva a un gatito en casa a la estancia dada. Los de paseo no se mueven. */
export function llevarA(casa: CasaProgress, mundo: number, estancia: Estancia): CasaProgress {
  if (!enCasaDe(casa).includes(mundo) || estanciaDe(casa, mundo) === estancia) return casa;
  const enJardin = (casa.enJardin ?? []).filter((otro) => otro !== mundo);
  return conJardin(casa, estancia === "jardin" ? [...enJardin, mundo] : enJardin);
}

/** A la hora de dormir, todos vuelven a la habitación. */
export const todosALaHabitacion = (casa: CasaProgress): CasaProgress => (casa.enJardin ? conJardin(casa, []) : casa);

/** Cada vez que un gatito decide qué hacer, esta probabilidad de que se vaya solo a la otra estancia. */
export const CAMBIAR_SOLO = 0.03;

/** ¿Se va solo a la otra estancia esta vez? (de noche, nunca). */
export const cambiaSolo = (azar: () => number, noche: boolean) => !noche && azar() < CAMBIAR_SOLO;

// --- Colchoneta ------------------------------------------------------------------------------------------------------

/** Cuánto bota un gatito en la colchoneta antes de bajar de un salto, y cuántos botes da. */
export const BOTAR_MS = 3000;
export const BOTES = 4;

/**
 * Una partida de juego de una vez (la colchoneta o saltar a por una mariposa): cuenta como una partida entera de pelota. Con ganas de jugar («se nota» o
 * «pide») queda contento y, si toca, gana su corazón; sin ganas ha botado igual, sin «ahora no» y sin que cambie nada.
 */
export function jugarDeUnaVez(casa: CasaProgress, mundo: number, ahora: Date): ResultadoCuidado {
  const gatito = casa.gatitos[mundo];
  if (!gatito) return { casa, respuesta: "juegaIgual", corazon: false };
  const listo = { ...casa, gatitos: { ...casa.gatitos, [mundo]: { ...gatito, lanzamientos: LANZAMIENTOS_PARA_JUGAR - 1 } } };
  const resultado = cuidar(listo, mundo, "pelota", ahora);
  return resultado.respuesta === "gracias" ? resultado : { casa, respuesta: "juegaIgual", corazon: false };
}

/** Un gatito ha botado en la colchoneta. */
export const botar = jugarDeUnaVez;

/** Dónde baja de un salto, a la hierba de al lado de la colchoneta. */
export const BAJA_EN = { x: JARDIN.colchoneta.left + JARDIN.colchoneta.width + 60, y: 500 };
/** Dónde bota: los pies sobre el centro de la colchoneta. */
export const BOTA_EN = { x: JARDIN.colchoneta.left + JARDIN.colchoneta.width / 2, y: JARDIN.colchoneta.top + 30 };

// --- Mariposas ------------------------------------------------------------------------------------------------------

/** Dos mariposas revolotean por el jardín de día. */
export const MARIPOSAS = 2;
/** Cuánto tarda en llegar junto al gatito, cuánto se queda posada y cuánto en volver a su vuelo. */
export const POSARSE_MS = 800;
export const POSADA_MS = 1200;
export const VOLVER_MS = 700;
/** Radio de toque de una mariposa, en px de la escena. */
export const TOQUE_MARIPOSA = 60;

/** Dónde está la mariposa `indice` a los `ms` de su vuelo: ondas lentas por el aire del jardín, entre la casa y la valla. */
export function vueloDeMariposa(indice: number, ms: number): { x: number; y: number } {
  const t = ms / 1000;
  const fase = indice * 2.3;
  return {
    x: 720 + 380 * Math.sin(t * 0.23 + fase),
    y: 260 + 90 * Math.sin(t * 0.61 + fase * 1.7) + 20 * Math.sin(t * 2.1 + fase),
  };
}

/** La mariposa bajo el punto (entre las que se pueden tocar), o -1. */
export function mariposaBajo(punto: { x: number; y: number }, posiciones: readonly ({ x: number; y: number } | null)[]): number {
  let mejor = -1;
  let distancia = TOQUE_MARIPOSA;
  posiciones.forEach((posicion, indice) => {
    if (!posicion) return;
    const d = Math.hypot(posicion.x - punto.x, posicion.y - punto.y);
    if (d <= distancia) { mejor = indice; distancia = d; }
  });
  return mejor;
}

/** Dónde se posa junto a un gatito (con los pies en `gatito`): a su lado, a la altura de la cabeza. */
export const dondeSePosa = (gatito: { x: number; y: number }) => ({ x: gatito.x + 55, y: gatito.y - 80 });

/** El gatito más cercano a un punto (índice en `gatitos`), o -1 si no hay ninguno. */
export function masCercano(punto: { x: number; y: number }, gatitos: readonly { x: number; y: number }[]): number {
  return gatitos.reduce((mejor, gatito, i) =>
    mejor < 0 || Math.hypot(gatito.x - punto.x, gatito.y - punto.y) < Math.hypot(gatitos[mejor].x - punto.x, gatitos[mejor].y - punto.y) ? i : mejor, -1);
}

export type Posada = { desde: number; de: { x: number; y: number }; a: { x: number; y: number } };

/**
 * Dónde se ve una mariposa que se ha posado: va hasta el gatito, se queda y vuelve a su vuelo. `null` cuando ya ha
 * vuelto (vuela otra vez sola).
 */
export function posicionPosada(posada: Posada, ms: number, vuelo: { x: number; y: number }): { x: number; y: number; quieta: boolean } | null {
  const t = ms - posada.desde;
  const entre = (a: { x: number; y: number }, b: { x: number; y: number }, f: number) => {
    const suave = f * f * (3 - 2 * f);
    return { x: a.x + (b.x - a.x) * suave, y: a.y + (b.y - a.y) * suave };
  };
  if (t < POSARSE_MS) return { ...entre(posada.de, posada.a, Math.max(0, t) / POSARSE_MS), quieta: false };
  if (t < POSARSE_MS + POSADA_MS) return { ...posada.a, quieta: true };
  if (t < POSARSE_MS + POSADA_MS + VOLVER_MS) return { ...entre(posada.a, vuelo, (t - POSARSE_MS - POSADA_MS) / VOLVER_MS), quieta: false };
  return null;
}

// --- Luciérnagas ----------------------------------------------------------------------------------------------------

/** De noche, en lugar de las mariposas, unas luciérnagas que brillan sobre la hierba (dibujadas por código). */
export const LUCIERNAGAS = 7;

/** Dónde está la luciérnaga `indice` a los `ms`: deriva despacio cerca de la hierba, cada una en su zona. */
export function luciernagaEn(indice: number, ms: number): { x: number; y: number } {
  const t = ms / 1000;
  const fase = indice * 1.7;
  const centro = 200 + (indice * 740) / (LUCIERNAGAS - 1);
  return {
    x: centro + 70 * Math.sin(t * 0.37 + fase) + 25 * Math.sin(t * 1.3 + fase * 2),
    y: 360 + 70 * Math.sin(t * 0.29 + fase * 1.3) + 15 * Math.sin(t * 1.7 + fase),
  };
}

/** Y unas pocas sobre la ampliación de la madriguera. */
export const LUCIERNAGAS_MADRIGUERA = 3;

export function luciernagaMadriguera(indice: number, ms: number): { x: number; y: number } {
  const { x, y } = luciernagaEn(indice * 2, ms + 4000);
  // La misma deriva, en x negativas: de -400 a -80 de centro.
  const centro = 200 + (indice * 2 * 740) / (LUCIERNAGAS - 1);
  return { x: -400 + (indice * 320) / (LUCIERNAGAS_MADRIGUERA - 1) + (x - centro) * 0.6, y };
}

/** Todas las del jardín, para la casa y las fotos. */
export const luciernagasDelJardin = (ms: (indice: number) => number) => [
  ...Array.from({ length: LUCIERNAGAS }, (_, i) => luciernagaEn(i, ms(i))),
  ...Array.from({ length: LUCIERNAGAS_MADRIGUERA }, (_, i) => luciernagaMadriguera(i, ms(LUCIERNAGAS + i))),
];

// --- Maceteros -------------------------------------------------------------------------------------------------------

/** Lámina de los maceteros: diez celdas de 100 × 128 en fila (semilla, brote y, por color, capullo y flor). */
export const HOJA_MACETEROS = "./assets/sprites/casa-maceteros-v1.webp";
/** La regadera de la bandeja, en una celda de 128 × 128. */
export const REGADERA = "./assets/sprites/casa-regadera-v1.webp";

export const jardinDe = (casa: CasaProgress | undefined): JardinProgress => casa?.jardin ?? JARDIN_DE_SIEMPRE;

export type ResultadoRiego = {
  casa: CasaProgress;
  /** Ha subido una etapa. */
  crecio: boolean;
  /** Ya estaba en flor: solo brillitos. */
  brillitos: boolean;
  /** Ya se había regado hoy: espera a mañana (el agua cae igual). */
  yaRegado: boolean;
};

/** Noa riega el macetero dado: una vez al día cada uno sube una etapa (al brotar, elige su color); en flor, brillitos. Nunca se marchita. */
export function regar(casa: CasaProgress, indice: number, ahora: Date, azar: () => number = Math.random): ResultadoRiego {
  const jardin = jardinDe(casa);
  const macetero = jardin.maceteros[indice];
  if (!macetero) return { casa, crecio: false, brillitos: false, yaRegado: false };
  if (macetero.etapa === "flor") return { casa, crecio: false, brillitos: true, yaRegado: false };
  const hoy = fechaLocal(ahora);
  if (macetero.regado === hoy) return { casa, crecio: false, brillitos: false, yaRegado: true };
  const etapa = ETAPAS[ETAPAS.indexOf(macetero.etapa) + 1];
  const usados = jardin.maceteros.map((m) => m.color);
  const libres = COLORES_FLOR.filter((color) => !usados.includes(color));
  const entre = libres.length ? libres : COLORES_FLOR;
  const color = macetero.color ?? entre[Math.min(entre.length - 1, Math.floor(azar() * entre.length))];
  const maceteros = jardin.maceteros.map((m, i) => (i === indice ? { color, etapa, regado: hoy } : m));
  return { casa: { ...casa, jardin: { maceteros } }, crecio: true, brillitos: false, yaRegado: false };
}

/** Celda de la lámina de los maceteros que toca a un macetero. */
export function celdaDeMacetero(macetero: Macetero): number {
  if (macetero.etapa === "semilla") return 0;
  if (macetero.etapa === "brote" || !macetero.color) return 1;
  return 2 + COLORES_FLOR.indexOf(macetero.color) * 2 + (macetero.etapa === "flor" ? 1 : 0);
}

/** El primer macetero que aún se puede regar hoy (para regar con el teclado), o el primero. */
export function maceteroPorRegar(casa: CasaProgress, ahora: Date): number {
  const hoy = fechaLocal(ahora);
  const indice = jardinDe(casa).maceteros.findIndex((m) => m.etapa !== "flor" && m.regado !== hoy);
  return Math.max(0, indice);
}
