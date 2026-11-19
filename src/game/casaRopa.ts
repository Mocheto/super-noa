/**
 * Accesorios de los gatitos de la casa (mapa «Ropa y accesorios para los gatitos»): tres tipos (sombrero, gafas y
 * bufanda) con cuatro piezas cada uno, y lo que lleva cada gatito, como mucho uno de cada tipo. Se guarda en el campo
 * opcional `casa.ropa` por número de mundo; un gatito sin nada no aparece. Solo lógica: sin dibujo.
 */
import type { CasaProgress } from "./casa.ts";

export const TIPOS_ACCESORIO = ["sombrero", "gafas", "bufanda"] as const;
export type TipoAccesorio = (typeof TIPOS_ACCESORIO)[number];

/**
 * Las piezas de cada tipo, en el orden de su lámina (`casa-accesorios-v1.webp`: una fila por tipo y una columna por
 * pieza). Los identificadores son estables: se guardan en el progreso.
 */
export const ACCESORIOS = {
  sombrero: ["paja", "gorro", "fiesta", "chistera"],
  gafas: ["redondas", "estrella", "corazon", "buceo"],
  bufanda: ["rayas", "copos", "lunares", "flecos"],
} as const satisfies Record<TipoAccesorio, readonly string[]>;
export type Accesorio<T extends TipoAccesorio = TipoAccesorio> = (typeof ACCESORIOS)[T][number];

/** Lo que lleva un gatito: como mucho una pieza de cada tipo. */
export type Ropa = { [T in TipoAccesorio]?: Accesorio<T> };

export const esAccesorio = <T extends TipoAccesorio>(tipo: T, valor: unknown): valor is Accesorio<T> =>
  (ACCESORIOS[tipo] as readonly unknown[]).includes(valor);

/** Celda de la pieza en su lámina: fila del tipo y columna de la pieza. */
export const celdaDe = <T extends TipoAccesorio>(tipo: T, pieza: Accesorio<T>) =>
  ({ fila: TIPOS_ACCESORIO.indexOf(tipo), columna: (ACCESORIOS[tipo] as readonly string[]).indexOf(pieza) });

const vacia = (ropa: Ropa) => TIPOS_ACCESORIO.every((tipo) => ropa[tipo] === undefined);

/** Lo que lleva el gatito del mundo dado (nada si no lleva). */
export const ropaDe = (casa: CasaProgress | undefined, mundo: number): Ropa => casa?.ropa?.[mundo] ?? {};

/**
 * Tocar una pieza en el vestidor: si ya la lleva, se la quita; si no, se la pone en lugar de la de su tipo.
 */
export function alternar<T extends TipoAccesorio>(ropa: Ropa, tipo: T, pieza: Accesorio<T>): Ropa {
  const siguiente: Ropa = { ...ropa };
  if (ropa[tipo] === pieza) delete siguiente[tipo];
  else (siguiente as Record<TipoAccesorio, string>)[tipo] = pieza;
  return siguiente;
}

/** Deja puesta la ropa del gatito (al salir del vestidor con «LISTO»). Solo para gatitos de la casa. */
export function vestir(casa: CasaProgress, mundo: number, ropa: Ropa): CasaProgress {
  if (!casa.gatitos[mundo]) return casa;
  const limpia = normalizeRopa(ropa) ?? {};
  const resto = Object.fromEntries(Object.entries(casa.ropa ?? {}).filter(([otro]) => Number(otro) !== mundo));
  const todas: Record<string, Ropa> = vacia(limpia) ? resto : { ...resto, [mundo]: limpia };
  if (!Object.keys(todas).length) {
    const sinRopa = { ...casa };
    delete sinRopa.ropa;
    return sinRopa;
  }
  return { ...casa, ropa: todas };
}

/** Lectura tolerante de lo que lleva un gatito: las piezas que no se entienden se quitan; sin nada, `undefined`. */
export function normalizeRopa(raw: unknown): Ropa | undefined {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return undefined;
  const registro = raw as Record<string, unknown>;
  const ropa: Ropa = {};
  for (const tipo of TIPOS_ACCESORIO) {
    const pieza = registro[tipo];
    if (esAccesorio(tipo, pieza)) (ropa as Record<TipoAccesorio, string>)[tipo] = pieza;
  }
  return vacia(ropa) ? undefined : ropa;
}

/** Lectura tolerante de la ropa de todos: solo gatitos de la casa y con algo puesto. */
export function normalizeRopaCasa(raw: unknown, esGatito: (mundo: number) => boolean): Record<string, Ropa> | undefined {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return undefined;
  const todas = Object.entries(raw as Record<string, unknown>).flatMap(([mundo, valor]): [string, Ropa][] => {
    const ropa = /^[1-9]\d?$/.test(mundo) && esGatito(Number(mundo)) ? normalizeRopa(valor) : undefined;
    return ropa ? [[mundo, ropa]] : [];
  });
  return todas.length ? Object.fromEntries(todas) : undefined;
}
