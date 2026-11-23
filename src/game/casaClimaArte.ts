/**
 * Dibujo del clima de la casa (issue 346), todo por código y en coordenadas de la escena (1280 × 540): gotas y copos de
 * pixelitos, velo gris en el cristal con lluvia y arcoíris de bandas. Lo usan la casa (en un lienzo sobre el fondo, cada
 * cuadro) y las fotos (una vez, quieto). Las gotas y los copos salen de su índice, sin estado: el mismo `segundos` da
 * el mismo dibujo.
 */
import type { Clima } from "./casaClima.ts";

export type Caja = { x: number; y: number; ancho: number; alto: number };
export type Arco = { cx: number; cy: number; radio: number };
export type ZonaClima = {
  /** Donde caen la lluvia y la nieve. */
  caida: Caja;
  /** Recortes de la caída y del arcoíris (los cristales de la ventana); sin ellos, toda la caída. */
  cristales?: readonly Caja[];
  /** Velo gris sobre los cristales con lluvia. */
  velo: boolean;
  arcoiris: Arco;
  /** Recorte del arcoíris (el cielo), si no son los cristales. */
  cielo?: Caja;
  gotas: number;
  copos: number;
};

/** Los cuatro cristales de la ventana de la habitación, medidos sobre `casa-habitacion-vacia-v1.webp`. */
export const CRISTALES_VENTANA: readonly Caja[] = [
  { x: 640, y: 60, ancho: 90, alto: 91 }, { x: 747, y: 60, ancho: 90, alto: 91 },
  { x: 640, y: 167, ancho: 90, alto: 84 }, { x: 747, y: 167, ancho: 90, alto: 84 },
];

export const ZONA_HABITACION: ZonaClima = {
  caida: { x: 640, y: 60, ancho: 197, alto: 191 },
  cristales: CRISTALES_VENTANA,
  velo: true,
  arcoiris: { cx: 760, cy: 300, radio: 190 },
  gotas: 26,
  copos: 18,
};

/** En el jardín cae sobre todo el jardín; el arcoíris va en el cielo, a la izquierda del árbol y bajo las nubes. */
export const ZONA_JARDIN: ZonaClima = {
  caida: { x: 0, y: 0, ancho: 1280, alto: 540 },
  velo: false,
  arcoiris: { cx: 590, cy: 265, radio: 140 },
  cielo: { x: 437, y: 0, ancho: 843, alto: 265 },
  gotas: 70,
  copos: 50,
};

/** Bandas del arcoíris, de fuera adentro. */
export const COLORES_ARCOIRIS = ["#e8545a", "#f29a4a", "#ffd45f", "#6cc56b", "#5aa9e6", "#9a7ad8"] as const;
export const ANCHO_BANDA = 9;
const GOTA = "#e3f1ff";
const COPO = "#ffffff";
const SOMBRA_COPO = "#7f9cc4";
/** Velocidades de caída, en px de escena por segundo. */
export const CAE_LLUVIA = 420;
export const CAE_NIEVE = 45;

/** Parte fraccionaria: reparte las partículas sin azar (proporción áurea). */
const fraccion = (n: number) => n - Math.floor(n);

/** Dónde está la partícula `i` a los `segundos` (dentro de la caída, volviendo a empezar arriba). */
export function particula(zona: ZonaClima, i: number, segundos: number, velocidad: number, largo: number) {
  const { caida } = zona;
  const recorrido = caida.alto + largo;
  const x = caida.x + fraccion(i * 0.618034 + 0.13) * caida.ancho;
  const y = caida.y - largo + fraccion(fraccion(i * 0.381966 + 0.71) + (segundos * velocidad * (0.85 + fraccion(i * 0.7548) * 0.3)) / recorrido) * recorrido;
  return { x, y };
}

function recortar(contexto: CanvasRenderingContext2D, cajas: readonly Caja[]) {
  contexto.beginPath();
  for (const caja of cajas) contexto.rect(caja.x, caja.y, caja.ancho, caja.alto);
  contexto.clip();
}

/**
 * Pinta el clima en `contexto` (en coordenadas de la escena). `calma`: con «movimiento tranquilo» y en las fotos, las
 * partículas se quedan donde están.
 */
export function pintarClima(contexto: CanvasRenderingContext2D, clima: Clima, zona: ZonaClima, segundos: number, calma: boolean) {
  if (clima === "sol") return;
  const t = calma ? 0 : segundos;
  contexto.save();
  if (zona.cristales) recortar(contexto, zona.cristales);
  if (clima === "arcoiris") {
    if (zona.cielo) recortar(contexto, [zona.cielo]);
    contexto.globalAlpha = 0.75;
    contexto.lineWidth = ANCHO_BANDA;
    COLORES_ARCOIRIS.forEach((color, banda) => {
      contexto.strokeStyle = color;
      contexto.beginPath();
      contexto.arc(zona.arcoiris.cx, zona.arcoiris.cy, zona.arcoiris.radio - banda * ANCHO_BANDA, Math.PI, Math.PI * 2);
      contexto.stroke();
    });
  } else if (clima === "lluvia") {
    if (zona.velo) {
      contexto.fillStyle = "rgba(84, 96, 120, 0.3)";
      contexto.fillRect(zona.caida.x, zona.caida.y, zona.caida.ancho, zona.caida.alto);
    }
    contexto.fillStyle = GOTA;
    contexto.globalAlpha = 0.85;
    for (let i = 0; i < zona.gotas; i++) {
      const { x, y } = particula(zona, i, t, CAE_LLUVIA, 14);
      contexto.fillRect(Math.round(x), Math.round(y), 3, 12);
    }
  } else {
    for (let i = 0; i < zona.copos; i++) {
      const { x, y } = particula(zona, i, t, CAE_NIEVE, 8);
      const lado = i % 3 === 0 ? 6 : 4;
      const vaiven = calma ? 0 : Math.sin(t * 1.3 + i) * 6;
      // Con una sombrita debajo, para que se vean sobre el cielo claro.
      contexto.fillStyle = SOMBRA_COPO;
      contexto.fillRect(Math.round(x + vaiven), Math.round(y) + 2, lado, lado);
      contexto.fillStyle = COPO;
      contexto.fillRect(Math.round(x + vaiven), Math.round(y), lado, lado);
    }
  }
  contexto.restore();
}
