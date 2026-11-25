/**
 * Medidas del arte del vestidor (docs/art/casa-vestidor-v1.md, recortado con prototypes/tools/casa-vestidor-recorte.py):
 * el gatito grande con sus anclas, la lámina de las piezas y las baldas del armario abierto. Las cuentas de dónde va
 * cada pieza son puras; se dan en % de la caja que las contiene, así escalan con la pantalla.
 */
import { ANCLAS_POR_MODELO } from "./casaGatoAnclas.ts";
import { CUADRO_GATO, type AnimacionGato, type ModeloGatito } from "./casaGatoArte.ts";
import { ACCESORIOS, type Accesorio, type Ropa, type TipoAccesorio } from "./casaRopa.ts";

export const FONDO_VESTIDOR = "./assets/worlds/casa-vestidor-v1.webp";
export const ARMARIO_ABIERTO = "./assets/sprites/casa-armario-abierto-v1.webp";
export const HOJA_VESTIDOR = "./assets/sprites/gato-casa-vestidor-v1.webp";
/** El gatito grande de cada modelo con hoja en la casa (los mismos que `HOJAS_MODELO`). */
export const HOJAS_VESTIDOR: Readonly<{ atigrado: string } & Partial<Record<ModeloGatito, string>>> = {
  atigrado: HOJA_VESTIDOR,
  esmoquin: "./assets/sprites/gato-casa-vestidor-esmoquin-v1.webp",
  melena: "./assets/sprites/gato-casa-vestidor-melena-v1.webp",
  nube: "./assets/sprites/gato-casa-vestidor-nube-v1.webp",
};
export const HOJA_ACCESORIOS = "./assets/sprites/casa-accesorios-v2.webp";
export const HOJA_CAPAS = "./assets/sprites/casa-capas-v1.webp";
export const HOJA_ALAS = "./assets/sprites/casa-alas-v1.webp";

/** Medidas del fondo (px). */
export const MEDIDAS_FONDO = { ancho: 1280, alto: 692 };
/** Cuadro del gatito grande (px); dos cuadros: quieto y contento. */
export const CUADRO_VESTIDOR = { ancho: 240, alto: 340 };
/** Celda de un sombrero, unas gafas o una bufanda en su lámina (px). */
export const CELDA_ACCESORIO = { ancho: 200, alto: 170 };

/**
 * La lámina de cada tipo (docs/art/casa-vestidor-v2.md, de prototypes/tools/casa-vestidor-v2-recorte.py): sombreros,
 * gafas y bufandas comparten una de seis columnas por tres filas; capas y alas tienen la suya, más grande, de una fila.
 */
export const LAMINAS: Record<TipoAccesorio, { imagen: string; celda: { ancho: number; alto: number }; columnas: number; filas: number; fila: number }> = {
  sombrero: { imagen: HOJA_ACCESORIOS, celda: CELDA_ACCESORIO, columnas: 6, filas: 3, fila: 0 },
  gafas: { imagen: HOJA_ACCESORIOS, celda: CELDA_ACCESORIO, columnas: 6, filas: 3, fila: 1 },
  bufanda: { imagen: HOJA_ACCESORIOS, celda: CELDA_ACCESORIO, columnas: 6, filas: 3, fila: 2 },
  capa: { imagen: HOJA_CAPAS, celda: { ancho: 260, alto: 240 }, columnas: 6, filas: 1, fila: 0 },
  alas: { imagen: HOJA_ALAS, celda: { ancho: 320, alto: 240 }, columnas: 6, filas: 1, fila: 0 },
};

/** Lo que va detrás del gatito (se pinta antes que él): las alas, más atrás, y la capa. */
export const DETRAS: readonly TipoAccesorio[] = ["alas", "capa"];
/** Orden de dibujo, de atrás adelante. */
export const ORDEN_DE_DIBUJO: readonly TipoAccesorio[] = ["alas", "capa", "bufanda", "gafas", "sombrero"];
/**
 * Lo que se ve de la capa puesta, de arriba abajo: el resto quedaría por debajo de las patas (se dibujó larga, como si
 * cayera hasta el suelo de pie) y parecería otro par de patas.
 */
export const CAPA_VISIBLE = 0.68;
/** Piezas mágicas, que destellan: la capa de Navidad y las alas de unicornio. */
export const PIEZAS_MAGICAS: readonly string[] = ["navidad", "unicornio"];

/** Columna de una pieza en la lámina de su tipo. */
export const columnaDe = (tipo: TipoAccesorio, pieza: string) => (ACCESORIOS[tipo] as readonly string[]).indexOf(pieza);

type Punto = { x: number; y: number };
/** Anclas del gatito grande en su cuadro (iguales en los dos: la misma postura). */
export const ANCLAS_VESTIDOR: Record<"cabeza" | "ojos" | "cuello", Punto> = {
  cabeza: { x: 135, y: 35 },
  ojos: { x: 137, y: 107 },
  cuello: { x: 134, y: 181 },
};
/**
 * Anclas del gatito grande de cada modelo (de `prototypes/tools/casa-modelo-recorte.py`, las del cuadro quieto; la
 * cabeza, sobre los ojos, porque el lazo de los modelos nuevos no siempre va en medio).
 */
export const ANCLAS_VESTIDOR_POR_MODELO: Readonly<{ atigrado: typeof ANCLAS_VESTIDOR } & Partial<Record<ModeloGatito, typeof ANCLAS_VESTIDOR>>> = {
  atigrado: ANCLAS_VESTIDOR,
  esmoquin: { cabeza: { x: 108, y: 40 }, ojos: { x: 108, y: 116 }, cuello: { x: 107, y: 176 } },
  melena: { cabeza: { x: 171, y: 68 }, ojos: { x: 171, y: 139 }, cuello: { x: 171, y: 188 } },
  nube: { cabeza: { x: 155, y: 36 }, ojos: { x: 155, y: 129 }, cuello: { x: 154, y: 184 } },
};
export const anclasVestidorDe = (modelo: ModeloGatito) => ANCLAS_VESTIDOR_POR_MODELO[modelo] ?? ANCLAS_VESTIDOR;

/**
 * Cómo encaja cada tipo en su ancla, en px de la lámina a la escala del gatito grande: la celda de la pieza se escala
 * por `escala` y su punto `(x, y)` de la celda (en fracción) se pone en el ancla más `bajar`. El sombrero se apoya por
 * el ala (abajo de la celda), las gafas por su centro y la bufanda por arriba.
 */
export const ENCAJE: Record<TipoAccesorio, { ancla: keyof typeof ANCLAS_VESTIDOR; escala: number; punto: Punto; bajar: number }> = {
  sombrero: { ancla: "cabeza", escala: 1, punto: { x: 0.5, y: 1 }, bajar: 18 },
  gafas: { ancla: "ojos", escala: 0.85, punto: { x: 0.5, y: 0.5 }, bajar: 0 },
  bufanda: { ancla: "cuello", escala: 1, punto: { x: 0.5, y: 0 }, bajar: -14 },
  // La capa cuelga del cuello, con el broche escondido detrás de la cabeza; las alas salen de detrás de los hombros.
  capa: { ancla: "cuello", escala: 1.25, punto: { x: 0.5, y: 0 }, bajar: -50 },
  alas: { ancla: "cuello", escala: 1, punto: { x: 0.5, y: 0.5 }, bajar: -10 },
};

export type CajaPorcentaje = { left: number; top: number; width: number; height: number };

/**
 * Caja de la celda de una pieza de tipo `tipo` sobre un gatito dibujado en una caja de `cuadro.ancho` × `cuadro.alto`
 * con sus anclas: en % de esa caja (puede salirse, como el sombrero por arriba).
 */
export function cajaSobreElGatito(tipo: TipoAccesorio, anclas: Record<"cabeza" | "ojos" | "cuello", Punto> = ANCLAS_VESTIDOR,
  cuadro: { ancho: number; alto: number } = CUADRO_VESTIDOR, factor = 1): CajaPorcentaje {
  const { ancla, escala, punto, bajar } = ENCAJE[tipo];
  const ancho = LAMINAS[tipo].celda.ancho * escala * factor;
  const alto = LAMINAS[tipo].celda.alto * escala * factor;
  const x = anclas[ancla].x - ancho * punto.x;
  const y = anclas[ancla].y + bajar * factor - alto * punto.y;
  return { left: (x / cuadro.ancho) * 100, top: (y / cuadro.alto) * 100, width: (ancho / cuadro.ancho) * 100, height: (alto / cuadro.alto) * 100 };
}

/**
 * Tamaño y posición CSS de una pieza dentro de su lámina, para un elemento del tamaño de su celda. Con `mitad`, para un
 * elemento de media celda que enseña solo esa mitad (cada ala del par, que aletea por su lado).
 */
export function fondoDePieza(tipo: TipoAccesorio, pieza: string, mitad?: "izquierda" | "derecha"): { backgroundSize: string; backgroundPosition: string } {
  const { columnas, filas, fila } = LAMINAS[tipo];
  const columna = columnaDe(tipo, pieza as Accesorio);
  const y = filas > 1 ? `${(fila / (filas - 1)) * 100}%` : "0%";
  if (!mitad) return { backgroundSize: `${columnas * 100}% ${filas * 100}%`, backgroundPosition: `${columnas > 1 ? (columna / (columnas - 1)) * 100 : 0}% ${y}` };
  const medias = columnas * 2;
  const media = columna * 2 + (mitad === "derecha" ? 1 : 0);
  return { backgroundSize: `${medias * 100}% ${filas * 100}%`, backgroundPosition: `${(media / (medias - 1)) * 100}% ${y}` };
}

/**
 * Las tres filas del armario abierto (en % de su dibujo de 615 × 488), de arriba abajo, con dos piezas cada una: el
 * armario enseña las seis del tipo de la pestaña elegida (mapa «Más decoraciones y accesorios para la casa»). Cada fila
 * va del techo de su hueco (`arriba`) a la tabla donde se apoyan las piezas (`apoyo`) y hasta el final de esa tabla
 * (`abajo`, para que el dedo acierte con más sitio).
 */
export const FILAS_ARMARIO: readonly { arriba: number; apoyo: number; abajo: number }[] = [
  { arriba: 15, apoyo: 31, abajo: 37 },
  { arriba: 37, apoyo: 46, abajo: 57 },
  { arriba: 62, apoyo: 81, abajo: 88 },
];
export const PIEZAS_POR_FILA = 2;
/** Ancho de las filas dentro del hueco del armario (en % de su dibujo), dos piezas por fila. */
export const FILA_DE_PIEZAS = { izquierda: 25, derecha: 75 };
export const MEDIDAS_ARMARIO = { ancho: 615, alto: 488 };

/**
 * Tamaño del gato de la casa frente al gatito grande del vestidor: la distancia del lazo al pañuelo sentado (64 px en
 * la hoja de la casa, 146 en el vestidor). Las piezas se reducen así para la habitación y las fotos.
 */
export const ESCALA_EN_CASA = 64 / 146;

const distancia = (a: Punto, b: Punto) => Math.hypot(a.x - b.x, a.y - b.y);
/** Lo mismo para cada modelo, con sus anclas: del lazo al collar sentado, en la casa y en el vestidor. */
export function escalaEnCasa(modelo: ModeloGatito): number {
  const sentado = ANCLAS_POR_MODELO[modelo]?.sentado[0];
  if (!sentado?.cabeza || !sentado.cuello) return ESCALA_EN_CASA;
  const grande = anclasVestidorDe(modelo);
  return distancia(sentado.cabeza, sentado.cuello) / distancia(grande.cabeza, grande.cuello);
}

export type PiezaEnCuadro = { tipo: TipoAccesorio; pieza: string; caja: CajaPorcentaje; detras: boolean };

/**
 * Las piezas que lleva un gatito de la casa en un cuadro de su hoja, con su caja en % del cuadro de 160 × 160, en orden
 * de dibujo (alas y capa, detrás del gatito; luego bufanda, gafas y sombrero). Las que no tienen sitio en ese cuadro
 * (gafas de espaldas, bufanda o capa dormido) no salen.
 */
export function piezasEnCuadro(ropa: Ropa, animacion: AnimacionGato, cuadro: number, modelo: ModeloGatito = "atigrado"): PiezaEnCuadro[] {
  const tabla = ANCLAS_POR_MODELO[modelo] ?? ANCLAS_POR_MODELO.atigrado;
  const anclas = tabla[animacion][cuadro] ?? tabla[animacion][0];
  const factor = escalaEnCasa(modelo);
  return ORDEN_DE_DIBUJO.flatMap((tipo): PiezaEnCuadro[] => {
    const pieza = ropa[tipo];
    const punto = anclas?.[ENCAJE[tipo].ancla];
    if (!pieza || !punto) return [];
    const caja = cajaSobreElGatito(tipo, { cabeza: punto, ojos: punto, cuello: punto }, { ancho: CUADRO_GATO, alto: CUADRO_GATO }, factor);
    return [{ tipo, pieza, caja, detras: DETRAS.includes(tipo) }];
  });
}
