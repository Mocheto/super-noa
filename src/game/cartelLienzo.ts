/** Letra del texto para Noa en el lienzo: Press Start 2P, la misma de la interfaz. */
export const letraLienzo = (tamano: number) => `${tamano}px "Press Start 2P", monospace`;

/** Ancho de un texto en el lienzo; en los lienzos de prueba, que no miden, se estima por letras (Press Start 2P es cuadrada). */
export const medirTexto = (context: CanvasRenderingContext2D, texto: string, tamano: number) => context.measureText?.(texto)?.width ?? texto.length * tamano;

/** Rectángulo redondeado, o recto si el lienzo no sabe redondear. */
export const cajaRedondeada = (context: CanvasRenderingContext2D, x: number, y: number, ancho: number, alto: number, radio: number) => {
  context.beginPath();
  if (typeof context.roundRect === "function") context.roundRect(x, y, ancho, alto, radio);
  else context.rect?.(x, y, ancho, alto);
};

type OpcionesCartel = { alfa?: number; color?: string; fondo?: string; tamano?: number };

const medidaInterior = (context: CanvasRenderingContext2D, lineas: string[], tamano: number) => ({
  ancho: Math.max(...lineas.map((linea) => medirTexto(context, linea, tamano))) + Math.round(tamano * 1.75),
  alto: lineas.length * Math.round(tamano * 1.625) + Math.round(tamano * .875),
});

/** Medida de un cartel con su contorno, para colocarlo antes de dibujarlo; `arriba` sigue siendo el borde de la caja. */
export function medirCartel(context: CanvasRenderingContext2D, lineas: string[], tamano = 16) {
  context.save();
  context.font = letraLienzo(tamano);
  const { ancho, alto } = medidaInterior(context, lineas, tamano);
  context.restore();
  return { ancho: ancho + 8, alto: alto + 8 };
}

/**
 * Cartel del lienzo con el estilo de la interfaz: Press Start 2P (16 px por defecto), caja crema con contorno ciruela a la
 * medida del texto. Cada línea es un rótulo de hasta dos palabras con su dibujo. `arriba` es el borde superior de la caja.
 */
export function drawCartel(context: CanvasRenderingContext2D, lineas: string[], centroX: number, arriba: number, { alfa = 1, color = "#3d1430", fondo = "#fff8e9", tamano = 16 }: OpcionesCartel = {}) {
  context.save();
  context.globalAlpha = alfa;
  context.font = letraLienzo(tamano);
  const paso = Math.round(tamano * 1.625);
  const { ancho, alto } = medidaInterior(context, lineas, tamano);
  const x = centroX - ancho / 2;
  context.fillStyle = "#3d1430";
  cajaRedondeada(context, x - 4, arriba - 4, ancho + 8, alto + 8, 10); context.fill();
  context.fillStyle = fondo;
  cajaRedondeada(context, x, arriba, ancho, alto, 7); context.fill();
  context.fillStyle = color;
  context.textAlign = "center";
  context.textBaseline = "middle";
  lineas.forEach((linea, indice) => context.fillText(linea, centroX, arriba + Math.round(tamano * 1.25) + indice * paso));
  context.restore();
}
