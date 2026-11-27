/**
 * Dibujo provisional de la madriguera, por código, hasta que llegue su arte (mapa «La madriguera de los conejos»): la
 * pradera de la ampliación del jardín con su montículo, y el corte de tierra con el pozo, los ramales y las cuevas. Todo
 * en coordenadas de la escena del jardín; lo usan la casa (en dos lienzos) y las fotos.
 */
import { AGUJERO, AMPLIACION_JARDIN, CORTE, CUEVAS, NODOS_TUNEL, SIN_EXCAVAR, TUNELES } from "./casaConejos.ts";

/** El pelo y el interior de las orejas de cada conejo. */
export const PELAJES = {
  canela: { pelo: "#c08a58", oreja: "#e8a99a" },
  algodon: { pelo: "#fdf8f0", oreja: "#f2b8c0" },
} as const;

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
  // Lo que hay dentro de cada cueva son los escondites, que dibuja `ConejosCasa`.
  for (const cueva of CUEVAS) ovalo(c, NODOS_TUNEL[cueva].x, NODOS_TUNEL[cueva].y + 10, 108, 68, "#4f3327");
}

// --- Los conejos en las fotos ----------------------------------------------------------------------------------------

/** En las fotos posan siempre en el mismo sitio, mirándose a los lados del montículo (no se guarda dónde estaban). */
export const CONEJOS_EN_FOTO = [
  { id: "canela", x: -390, y: 515, mira: 1 },
  { id: "algodon", x: -110, y: 515, mira: -1 },
] as const;

/** Si la foto coge la ampliación de día salen los dos; de noche duermen abajo y no salen. */
export const conejosDeFoto = (foto: { vista: { x: number }; noche: boolean; jardin?: unknown }) =>
  foto.jardin && foto.vista.x < 0 && !foto.noche ? CONEJOS_EN_FOTO : [];

/** Un conejo sentado de 90 × 100 con los pies en (x, y); el mismo dibujo provisional que en la casa. */
export function pintarConejo(c: CanvasRenderingContext2D, { id, x, y, mira }: (typeof CONEJOS_EN_FOTO)[number]) {
  const { pelo, oreja } = PELAJES[id];
  const parte = (cx: number, cy: number, rx: number, ry: number, color: string, giro = 0, trazo = true) => {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(cx, cy, rx, ry, giro * Math.PI / 180, 0, Math.PI * 2);
    c.fill();
    if (trazo) c.stroke();
  };
  c.save();
  c.translate(x, y - 100);
  if (mira < 0) c.scale(-1, 1);
  c.translate(-45, 0);
  c.strokeStyle = "#2f1d33";
  c.lineWidth = 3;
  parte(14, 76, 9, 9, "#fff");
  parte(40, 77, 28, 21, pelo);
  parte(54, 22, 7, 21, pelo);
  parte(54, 23, 3, 14, oreja, 0, false);
  if (id === "canela") {
    parte(70, 23, 7, 21, pelo);
    parte(70, 24, 3, 14, oreja, 0, false);
  } else {
    parte(78, 42, 7, 19, pelo, -62);
    parte(80, 43, 3, 12, oreja, -62, false);
  }
  parte(62, 55, 20, 20, pelo);
  parte(69, 50, 3.5, 3.5, "#2f1d33", 0, false);
  parte(81, 58, 3.5, 3.5, "#e8849a", 0, false);
  parte(30, 95, 15, 5, pelo);
  parte(62, 94, 9, 5, pelo);
  c.restore();
}
