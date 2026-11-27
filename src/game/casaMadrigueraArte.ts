/**
 * Dibujo provisional de la madriguera, por código, hasta que llegue su arte (mapa «La madriguera de los conejos»): la
 * pradera de la ampliación del jardín con su montículo, y el corte de tierra con el pozo, los ramales y las cuevas. Todo
 * en coordenadas de la escena del jardín; lo usan la casa (en dos lienzos) y las fotos.
 */
import { AGUJERO, AMPLIACION_JARDIN, CORTE, CUEVAS, NODOS_TUNEL, SIN_EXCAVAR, TUNELES, type CuevaId } from "./casaConejos.ts";

/** El trozo de escena de cada lienzo. El de abajo es más ancho que el corte para llenar las pantallas anchas. */
export const LIENZO_PRADERA = { x: -AMPLIACION_JARDIN, y: 0, ancho: AMPLIACION_JARDIN, alto: 540 } as const;
export const LIENZO_CORTE = { x: CORTE.x + CORTE.ancho / 2 - 640, y: CORTE.y, ancho: 1280, alto: CORTE.alto } as const;

/** Las flechas para bajar (sobre el montículo) y para subir (en el corte): centro y radio de toque. */
export const FLECHA_BAJAR = { x: AGUJERO.x, y: 320, radio: 60 } as const;
export const FLECHA_SUBIR = { x: CORTE.x + CORTE.ancho / 2, y: CORTE.y + 66, radio: 60 } as const;
export const sobreFlecha = (flecha: { x: number; y: number; radio: number }, punto: { x: number; y: number }) =>
  Math.hypot(punto.x - flecha.x, punto.y - flecha.y) <= flecha.radio;

const ovalo = (c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, desde = 0, hasta = Math.PI * 2) => {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, desde, hasta);
  c.fill();
};
const caja = (c: CanvasRenderingContext2D, x: number, y: number, ancho: number, alto: number, color: string) => {
  c.fillStyle = color;
  c.fillRect(x, y, ancho, alto);
};

/** La pradera de la ampliación: sigue el cielo, la tapia y la hierba del jardín, y encima el montículo. */
export function pintarPradera(c: CanvasRenderingContext2D) {
  const { x, ancho } = LIENZO_PRADERA;
  caja(c, x, 0, ancho, 140, "#87d6fd");
  caja(c, x, 140, ancho, 126, "#8ccef8");
  caja(c, x, 266, ancho, 172, "#f6e7cd");
  caja(c, x, 438, ancho, 102, "#94ae78");
  for (const [nx, ny] of [[-390, 70], [-120, 110]]) {
    ovalo(c, nx, ny, 52, 18, "#fff");
    ovalo(c, nx - 8, ny - 14, 26, 18, "#fff");
  }
  // La esquina de la casa.
  caja(c, -4, 0, 4, 438, "#b99a86");
  // El montículo y su agujero.
  ovalo(c, AGUJERO.x, 505, 150, 95, "#7f9a62", Math.PI, Math.PI * 2);
  ovalo(c, AGUJERO.x, 505, 150, 14, "#7f9a62");
  ovalo(c, AGUJERO.x, AGUJERO.y, 40, 28, "#8a5f43");
  ovalo(c, AGUJERO.x, AGUJERO.y + 3, 30, 21, "#3b2620");
}

/** Lo que hay en cada cueva, para reconocerla sin leer: paja, zanahorias o una pelota. */
function pintarCueva(c: CanvasRenderingContext2D, cueva: CuevaId) {
  const { x, y } = NODOS_TUNEL[cueva];
  ovalo(c, x, y + 10, 108, 68, "#4f3327");
  if (cueva === "dormitorio") {
    ovalo(c, x, y + 46, 70, 18, "#e8c15a");
    c.strokeStyle = "#f6dc8a";
    c.lineWidth = 3;
    for (let i = -60; i <= 60; i += 12) {
      c.beginPath();
      c.moveTo(x + i, y + 56);
      c.lineTo(x + i + 10, y + 34);
      c.stroke();
    }
  } else if (cueva === "despensa") {
    for (const dx of [-54, -18, 18, 54]) {
      c.fillStyle = "#f08a2c";
      c.beginPath();
      c.moveTo(x + dx - 11, y - 22);
      c.lineTo(x + dx + 11, y - 22);
      c.lineTo(x + dx, y + 18);
      c.fill();
      caja(c, x + dx - 6, y - 34, 4, 12, "#5fa14a");
      caja(c, x + dx + 2, y - 34, 4, 12, "#5fa14a");
    }
  } else {
    ovalo(c, x, y - 4, 30, 30, "#e8545a");
    ovalo(c, x, y - 4, 30, 9, "#fff8e9");
  }
}

/** El corte de tierra: pozo, ramales, las tres cuevas y los dos sitios sin excavar. */
export function pintarCorte(c: CanvasRenderingContext2D) {
  const { x, y, ancho, alto } = LIENZO_CORTE;
  caja(c, x, y, ancho, alto, "#8a5f43");
  caja(c, x, y, ancho, 26, "#94ae78");
  caja(c, x, y + 26, ancho, 12, "#6f4a33");
  // Piedrecitas, repartidas sin azar.
  for (let i = 0; i < 60; i += 1) ovalo(c, x + (i * 277) % ancho, y + 60 + (i * 149) % (alto - 80), 7, 5, "#a3785a");
  c.strokeStyle = "#4f3327";
  c.lineWidth = 58;
  c.lineCap = "round";
  c.lineJoin = "round";
  for (const [a, b] of TUNELES) {
    if ((SIN_EXCAVAR as readonly string[]).includes(b)) continue;
    c.beginPath();
    c.moveTo(NODOS_TUNEL[a].x, NODOS_TUNEL[a].y);
    c.lineTo(NODOS_TUNEL[b].x, NODOS_TUNEL[b].y);
    c.stroke();
  }
  c.setLineDash([12, 12]);
  c.strokeStyle = "#c79b76";
  c.lineWidth = 5;
  for (const libre of SIN_EXCAVAR) {
    c.beginPath();
    c.ellipse(NODOS_TUNEL[libre].x, NODOS_TUNEL[libre].y, 54, 36, 0, 0, Math.PI * 2);
    c.stroke();
  }
  c.setLineDash([]);
  for (const cueva of CUEVAS) pintarCueva(c, cueva);
}
