/**
 * Complementos de los gatitos de la casa (mapa «Gatitos de la casa distintos», decisión «El complemento de su mundo
 * frente a los accesorios del armario»): la prenda fija que trae cada gatito de su mundo. Va en el sitio de un tipo
 * de accesorio y se dibuja como una pieza más del armario, de su propia lámina (docs/art/casa-complementos-v1.md, de
 * `prototypes/tools/casa-complementos-recorte.py`). No se guarda ni se quita: solo se esconde mientras el gatito lleva
 * un accesorio en su mismo sitio.
 */
import type { Ropa, TipoAccesorio } from "./casaProgreso.ts";

export const HOJA_COMPLEMENTOS = "./assets/sprites/casa-complementos-v1.webp";
export const HOJA_COMPLEMENTOS_CAPAS = "./assets/sprites/casa-complementos-capas-v1.webp";

/**
 * `hundir`: cuánto baja un gorro de cabeza más allá del ancla, como `HUNDIR_SOMBRERO` en el armario (en px del gatito grande del vestidor). Los de cabeza son
 * gorros sin ala que abrazan la cabeza: puestos a la altura de un sombrero se quedaban encima, con el lazo asomando.
 */
type Complemento = { tipo: Extract<TipoAccesorio, "sombrero" | "bufanda" | "capa">; columna: number; hundir?: number };

/**
 * El complemento de cada gatito, por número de mundo, y su columna en la lámina: los de cabeza y cuello en
 * `casa-complementos-v1.webp` (celdas de 200 × 170, como sombreros y bufandas) y los de espalda en
 * `casa-complementos-capas-v1.webp` (celdas de 260 × 240, como las capas). El gorro de aviador de Chispa salió con
 * las gafas en la frente, así que va en la cabeza.
 */
export const COMPLEMENTOS: Readonly<Record<number, Complemento>> = {
  4: { tipo: "sombrero", columna: 0, hundir: 14 }, // gorrito de bellota
  5: { tipo: "sombrero", columna: 1, hundir: 22 }, // pañuelo pirata
  11: { tipo: "sombrero", columna: 2, hundir: 14 }, // tulipán
  15: { tipo: "sombrero", columna: 3, hundir: 14 }, // gorra de revisor
  10: { tipo: "sombrero", columna: 4, hundir: 28 }, // gorro de aviador
  1: { tipo: "bufanda", columna: 5 }, // pañuelo con margarita
  2: { tipo: "bufanda", columna: 6 }, // collar con amatista
  3: { tipo: "bufanda", columna: 7 }, // bufanda de estrellas
  7: { tipo: "bufanda", columna: 8 }, // lazo arcoíris
  8: { tipo: "bufanda", columna: 9 }, // pañuelo con concha
  9: { tipo: "bufanda", columna: 10 }, // collar de hojas
  12: { tipo: "bufanda", columna: 11 }, // bufanda lila
  13: { tipo: "bufanda", columna: 12 }, // bufanda con copo
  14: { tipo: "bufanda", columna: 13 }, // pañuelo con sol
  16: { tipo: "bufanda", columna: 14 }, // pajarita
  6: { tipo: "capa", columna: 0 }, // capita con luna
  17: { tipo: "capa", columna: 1 }, // esclavina de alitas
};

const PREFIJO = "complemento-";
/** Identificador de pieza del complemento de un gatito (no es un accesorio: no se guarda). */
export const piezaComplemento = (mundo: number) => `${PREFIJO}${mundo}`;
export const esComplemento = (pieza: string) => pieza.startsWith(PREFIJO);
export const complementoDe = (pieza: string): Complemento | undefined => COMPLEMENTOS[Number(pieza.slice(PREFIJO.length))];

/** Lo que se ve puesto: una pieza por tipo (accesorio o complemento). */
export type Puestas = Partial<Record<TipoAccesorio, string>>;

/** La ropa del gatito con su complemento en su sitio, si no lleva ahí un accesorio (que lo tapa mientras lo lleve). */
export function conComplemento(ropa: Ropa, mundo: number): Puestas {
  const complemento = COMPLEMENTOS[mundo];
  if (!complemento || ropa[complemento.tipo]) return { ...ropa };
  return { ...ropa, [complemento.tipo]: piezaComplemento(mundo) };
}
