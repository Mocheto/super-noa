/**
 * Accesorios de los gatitos de la casa (mapa «Ropa y accesorios para los gatitos»): tres tipos (sombrero, gafas y
 * bufanda) con cuatro piezas cada uno, y lo que lleva cada gatito, como mucho uno de cada tipo. Se guarda en el campo
 * opcional `casa.ropa` por número de mundo; un gatito sin nada no aparece. Solo lógica: sin dibujo.
 */
import { ACCESORIOS, esAccesorio, normalizeRopa, normalizeRopaCasa, ropaVacia, TIPOS_ACCESORIO, type Accesorio, type CasaProgress, type Ropa, type TipoAccesorio } from "./casaProgreso.ts";

// Las piezas que se guardan y su lectura viven en `casaProgreso.ts`, fuera del bloque de la casa.
export { ACCESORIOS, esAccesorio, normalizeRopa, normalizeRopaCasa, TIPOS_ACCESORIO };
export type { Accesorio, Ropa, TipoAccesorio };

/** Celda de la pieza en su lámina: fila del tipo y columna de la pieza. */
export const celdaDe = <T extends TipoAccesorio>(tipo: T, pieza: Accesorio<T>) =>
  ({ fila: TIPOS_ACCESORIO.indexOf(tipo), columna: (ACCESORIOS[tipo] as readonly string[]).indexOf(pieza) });

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
  const todas: Record<string, Ropa> = ropaVacia(limpia) ? resto : { ...resto, [mundo]: limpia };
  if (!Object.keys(todas).length) {
    const sinRopa = { ...casa };
    delete sinRopa.ropa;
    return sinRopa;
  }
  return { ...casa, ropa: todas };
}
