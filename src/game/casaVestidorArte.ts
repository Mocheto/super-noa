/**
 * Medidas del arte del vestidor (docs/art/casa-vestidor-v1.md, recortado con prototypes/tools/casa-vestidor-recorte.py):
 * el gatito grande con sus anclas, la lámina de las piezas y las baldas del armario abierto. Las cuentas de dónde va
 * cada pieza son puras; se dan en % de la caja que las contiene, así escalan con la pantalla.
 */
import { ANCLAS_GATO } from "./casaGatoAnclas.ts";
import { CUADRO_GATO, type AnimacionGato } from "./casaGatoArte.ts";
import { celdaDe, TIPOS_ACCESORIO, type Accesorio, type Ropa, type TipoAccesorio } from "./casaRopa.ts";

export const FONDO_VESTIDOR = "./assets/worlds/casa-vestidor-v1.webp";
export const ARMARIO_ABIERTO = "./assets/sprites/casa-armario-abierto-v1.webp";
export const HOJA_VESTIDOR = "./assets/sprites/gato-casa-vestidor-v1.webp";
export const HOJA_ACCESORIOS = "./assets/sprites/casa-accesorios-v1.webp";

/** Medidas del fondo (px). */
export const MEDIDAS_FONDO = { ancho: 1280, alto: 692 };
/** Cuadro del gatito grande (px); dos cuadros: quieto y contento. */
export const CUADRO_VESTIDOR = { ancho: 240, alto: 340 };
/** Celda de cada pieza en su lámina (px): cuatro columnas y tres filas. */
export const CELDA_ACCESORIO = { ancho: 200, alto: 170 };

type Punto = { x: number; y: number };
/** Anclas del gatito grande en su cuadro (iguales en los dos: la misma postura). */
export const ANCLAS_VESTIDOR: Record<"cabeza" | "ojos" | "cuello", Punto> = {
  cabeza: { x: 135, y: 35 },
  ojos: { x: 137, y: 107 },
  cuello: { x: 134, y: 181 },
};

/**
 * Cómo encaja cada tipo en su ancla, en px de la lámina a la escala del gatito grande: la celda de la pieza se escala
 * por `escala` y su punto `(x, y)` de la celda (en fracción) se pone en el ancla más `bajar`. El sombrero se apoya por
 * el ala (abajo de la celda), las gafas por su centro y la bufanda por arriba.
 */
export const ENCAJE: Record<TipoAccesorio, { ancla: keyof typeof ANCLAS_VESTIDOR; escala: number; punto: Punto; bajar: number }> = {
  sombrero: { ancla: "cabeza", escala: 1, punto: { x: 0.5, y: 1 }, bajar: 18 },
  gafas: { ancla: "ojos", escala: 0.85, punto: { x: 0.5, y: 0.5 }, bajar: 0 },
  bufanda: { ancla: "cuello", escala: 1, punto: { x: 0.5, y: 0 }, bajar: -14 },
};

export type CajaPorcentaje = { left: number; top: number; width: number; height: number };

/**
 * Caja de la celda de una pieza de tipo `tipo` sobre un gatito dibujado en una caja de `cuadro.ancho` × `cuadro.alto`
 * con sus anclas: en % de esa caja (puede salirse, como el sombrero por arriba).
 */
export function cajaSobreElGatito(tipo: TipoAccesorio, anclas: Record<"cabeza" | "ojos" | "cuello", Punto> = ANCLAS_VESTIDOR,
  cuadro: { ancho: number; alto: number } = CUADRO_VESTIDOR, factor = 1): CajaPorcentaje {
  const { ancla, escala, punto, bajar } = ENCAJE[tipo];
  const ancho = CELDA_ACCESORIO.ancho * escala * factor;
  const alto = CELDA_ACCESORIO.alto * escala * factor;
  const x = anclas[ancla].x - ancho * punto.x;
  const y = anclas[ancla].y + bajar * factor - alto * punto.y;
  return { left: (x / cuadro.ancho) * 100, top: (y / cuadro.alto) * 100, width: (ancho / cuadro.ancho) * 100, height: (alto / cuadro.alto) * 100 };
}

/** Posición CSS de una pieza dentro de la lámina (`background-size: 400% 300%`). */
export function fondoDePieza(tipo: TipoAccesorio, pieza: string): string {
  const { fila, columna } = celdaDe(tipo, pieza as Accesorio);
  return `${(columna / 3) * 100}% ${(fila / 2) * 100}%`;
}

/**
 * Baldas del armario abierto (en % de su dibujo de 615 × 488), de arriba abajo (las bufandas, largas, en el hueco del
 * suelo del armario, y la balda de en medio libre): el hueco de cada tipo, del techo del
 * hueco (`arriba`) a la tabla donde se apoyan las piezas (`apoyo`) y hasta el final de esa tabla (`abajo`, para que el
 * dedo acierte con más sitio). Las piezas ocupan un poco más que el hueco de dentro, para que se vean y se toquen bien.
 */
export const BALDAS: Record<TipoAccesorio, { arriba: number; apoyo: number; abajo: number }> = {
  sombrero: { arriba: 15, apoyo: 31, abajo: 37 },
  gafas: { arriba: 37, apoyo: 46, abajo: 57 },
  bufanda: { arriba: 66, apoyo: 81, abajo: 88 },
};
export const FILA_DE_PIEZAS = { izquierda: 15, derecha: 85 };
export const MEDIDAS_ARMARIO = { ancho: 615, alto: 488 };

/**
 * Tamaño del gato de la casa frente al gatito grande del vestidor: la distancia del lazo al pañuelo sentado (64 px en
 * la hoja de la casa, 146 en el vestidor). Las piezas se reducen así para la habitación y las fotos.
 */
export const ESCALA_EN_CASA = 64 / 146;

export type PiezaEnCuadro = { tipo: TipoAccesorio; pieza: string; caja: CajaPorcentaje };

/**
 * Las piezas que lleva un gatito de la casa en un cuadro de su hoja, con su caja en % del cuadro de 160 × 160, en orden
 * de dibujo (bufanda, gafas, sombrero). Las que no tienen sitio en ese cuadro (gafas de espaldas, bufanda dormido) no salen.
 */
export function piezasEnCuadro(ropa: Ropa, animacion: AnimacionGato, cuadro: number): PiezaEnCuadro[] {
  const anclas = ANCLAS_GATO[animacion][cuadro] ?? ANCLAS_GATO[animacion][0];
  return [...TIPOS_ACCESORIO].reverse().flatMap((tipo): PiezaEnCuadro[] => {
    const pieza = ropa[tipo];
    const punto = anclas?.[ENCAJE[tipo].ancla];
    if (!pieza || !punto) return [];
    const caja = cajaSobreElGatito(tipo, { cabeza: punto, ojos: punto, cuello: punto }, { ancho: CUADRO_GATO, alto: CUADRO_GATO }, ESCALA_EN_CASA);
    return [{ tipo, pieza, caja }];
  });
}
