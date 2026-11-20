/**
 * El jardín de la casa (mapa «Jardín de la casa»): la segunda estancia, al aire libre, como datos; en qué estancia está
 * cada gatito en casa (campo opcional `casa.enJardin`) y los tres maceteros que Noa riega (campo opcional
 * `casa.jardin`). Solo lógica.
 */
import { enCasaDe, fechaLocal, type CasaProgress } from "./casa.ts";
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
export const CAMBIAR_SOLO = 0.06;

/** ¿Se va solo a la otra estancia esta vez? (de noche, nunca). */
export const cambiaSolo = (azar: () => number, noche: boolean) => !noche && azar() < CAMBIAR_SOLO;

/** Lectura tolerante de los gatitos en el jardín: solo gatitos de la casa, sin repetir. */
export function normalizeEnJardin(raw: unknown, esGatito: (mundo: number) => boolean): number[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const mundos = [...new Set(raw.map(Number).filter((mundo) => Number.isInteger(mundo) && esGatito(mundo)))].sort((a, b) => a - b);
  return mundos.length ? mundos : undefined;
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
