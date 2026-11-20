/**
 * El jardín de la casa (mapa «Jardín de la casa»): la segunda estancia, al aire libre, como datos; en qué estancia está
 * cada gatito en casa (campo opcional `casa.enJardin`) y los tres maceteros que Noa riega (campo opcional
 * `casa.jardin`). Solo lógica.
 */
import { cuidar, enCasaDe, fechaLocal, LANZAMIENTOS_PARA_JUGAR, type CasaProgress, type ResultadoCuidado } from "./casa.ts";
import type { SitioInteres, SueloDeEstancia } from "./casaHabitacion.ts";

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
  /** Los tres maceteros junto a la valla, de izquierda a derecha: dónde se dibuja cada uno (con su flor encima). */
  maceteros: readonly Caja[];
};

/** Jardín de 1280 × 540, como la habitación: la pared de la casa con su puerta a la izquierda, la colchoneta en el centro y los maceteros junto a la valla a la derecha. */
export const JARDIN: Jardin = {
  id: "jardin",
  ancho: 1280,
  alto: 540,
  fondo: "./assets/worlds/casa-jardin-v1.webp",
  suelo: { fondo: 405, delante: 520, izquierda: 110, derecha: 1170 },
  escala: { fondo: 0.8, delante: 1 },
  sitios: {
    puerta: { x: 140, y: 420, para: null },
    colchoneta: { x: 600, y: 470, para: null },
    arbol: { x: 830, y: 410, para: "dormir" },
    hierba: { x: 420, y: 500, para: "cantar" },
  },
  zonaPuerta: { izquierda: 50, derecha: 240, arriba: 100, abajo: 430 },
  colchoneta: { imagen: "./assets/sprites/casa-colchoneta-v1.webp", left: 500, top: 410, width: 200, height: 90 },
  zonaColchoneta: { izquierda: 490, derecha: 710, arriba: 340, abajo: 510 },
  maceteros: [
    { left: 935, top: 300, width: 90, height: 120 },
    { left: 1035, top: 300, width: 90, height: 120 },
    { left: 1135, top: 300, width: 90, height: 120 },
  ],
};

/** La puerta del corazón de la habitación (dibujada en su fondo): lleva al jardín. */
export const ZONA_PUERTA_HABITACION: Zona = { izquierda: 50, derecha: 240, arriba: 100, abajo: 430 };

const dentro = (zona: Zona, x: number, y: number) => x >= zona.izquierda && x <= zona.derecha && y >= zona.arriba && y <= zona.abajo;

/** ¿Está el punto sobre la puerta que lleva a la otra estancia? */
export const sobreLaPuerta = (estancia: Estancia, x: number, y: number) =>
  dentro(estancia === "jardin" ? JARDIN.zonaPuerta : ZONA_PUERTA_HABITACION, x, y);

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

/** Lectura tolerante de los gatitos en el jardín: solo gatitos de la casa, sin repetir. */
export function normalizeEnJardin(raw: unknown, esGatito: (mundo: number) => boolean): number[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const mundos = [...new Set(raw.map(Number).filter((mundo) => Number.isInteger(mundo) && esGatito(mundo)))].sort((a, b) => a - b);
  return mundos.length ? mundos : undefined;
}

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

// --- Maceteros -------------------------------------------------------------------------------------------------------

export const ETAPAS = ["semilla", "brote", "capullo", "flor"] as const;
export type Etapa = (typeof ETAPAS)[number];
export const COLORES_FLOR = ["roja", "amarilla", "azul", "rosa"] as const;
export type ColorFlor = (typeof COLORES_FLOR)[number];

/** Un macetero: su etapa y, desde que brota, el color de su flor (al azar, distinto de los otros si se puede). */
export type Macetero = { color?: ColorFlor; etapa: Etapa; /** Día local del último riego (AAAA-MM-DD). */ regado?: string };
export type JardinProgress = { maceteros: Macetero[] };

/** Si nunca se ha regado: los tres maceteros con su semilla. */
export const JARDIN_DE_SIEMPRE: JardinProgress = { maceteros: [{ etapa: "semilla" }, { etapa: "semilla" }, { etapa: "semilla" }] };

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

/** Lectura tolerante del jardín: tres maceteros con color y etapa conocidos; lo que no se entiende, como de siempre. */
export function normalizeJardin(raw: unknown): JardinProgress | undefined {
  if (typeof raw !== "object" || raw === null || !Array.isArray((raw as { maceteros?: unknown }).maceteros)) return undefined;
  const leidos = (raw as { maceteros: unknown[] }).maceteros;
  const maceteros = JARDIN_DE_SIEMPRE.maceteros.map((deSiempre, i): Macetero => {
    const m = leidos[i] as Partial<Record<keyof Macetero, unknown>> | undefined;
    if (!m || typeof m !== "object") return deSiempre;
    const color = (COLORES_FLOR as readonly unknown[]).includes(m.color) ? (m.color as ColorFlor) : undefined;
    const leida = (ETAPAS as readonly unknown[]).includes(m.etapa) ? (m.etapa as Etapa) : "semilla";
    // Sin color no puede haber brotado.
    const etapa = color ? leida : "semilla";
    const regado = typeof m.regado === "string" && /^\d{4}-\d{2}-\d{2}$/.test(m.regado) ? m.regado : undefined;
    return { ...(etapa !== "semilla" ? { color } : {}), etapa, ...(regado ? { regado } : {}) };
  });
  return maceteros.every((m) => m.etapa === "semilla" && !m.regado) ? undefined : { maceteros };
}
