/**
 * El arte de la madriguera (docs/art/casa-madriguera-v1.md, `prototypes/tools/casa-madriguera-recorte.py`): los dos
 * fondos, las hojas de los conejos, de los escondites y de la zanahoria, las flechas y los conejos de las fotos. Todo en
 * coordenadas de la escena del jardín.
 */
import { AGUJERO, AMPLIACION_JARDIN, CORTE } from "./casaConejos.ts";

/** La ampliación del jardín, a la izquierda de la puerta. */
export const FONDO_PRADERA = { imagen: "./assets/worlds/casa-jardin-madriguera-v1.webp", x: -AMPLIACION_JARDIN, y: 0, ancho: AMPLIACION_JARDIN, alto: 540 } as const;
/** El corte de tierra: más ancho que lo que se mira, para llenar las pantallas anchas. */
export const FONDO_CORTE = { imagen: "./assets/worlds/casa-madriguera-corte-v1.webp", x: CORTE.x + CORTE.ancho / 2 - 640, y: CORTE.y, ancho: 1280, alto: CORTE.alto } as const;

/** Hojas de 5 × 2 celdas de 180 × 200 (al doble de la escena), con el suelo en la fila 196. */
export const HOJAS_CONEJO = { canela: "./assets/sprites/casa-conejo-canela-v1.webp", algodon: "./assets/sprites/casa-conejo-algodon-v1.webp" } as const;
export const CELDA_CONEJO = { ancho: 180, alto: 200 } as const;
/** Seis celdas de 200 × 140, en el orden de `ESCONDITES_CONEJO`. */
export const HOJA_ESCONDITES = "./assets/sprites/casa-conejo-escondites-v1.webp";
/** Dos celdas de 128 × 128: la zanahoria y la cabeza de conejo del botón de la bandeja. */
export const HOJA_ZANAHORIA = "./assets/sprites/casa-zanahoria-v1.webp";

/** Las flechas para bajar (sobre el montículo) y para subir (en el corte): centro y radio de toque. */
export const FLECHA_BAJAR = { x: AGUJERO.x, y: 320, radio: 60 } as const;
export const FLECHA_SUBIR = { x: CORTE.x + CORTE.ancho / 2, y: CORTE.y + 66, radio: 60 } as const;
export const sobreFlecha = (flecha: { x: number; y: number; radio: number }, punto: { x: number; y: number }) =>
  Math.hypot(punto.x - flecha.x, punto.y - flecha.y) <= flecha.radio;

// --- Los conejos en las fotos ----------------------------------------------------------------------------------------

/** En las fotos posan siempre en el mismo sitio, mirándose a los lados del montículo (no se guarda dónde estaban). */
export const CONEJOS_EN_FOTO = [
  { id: "canela", x: -390, y: 515, mira: 1 },
  { id: "algodon", x: -110, y: 515, mira: -1 },
] as const;

/** Si la foto coge la ampliación de día salen los dos; de noche duermen abajo y no salen. */
export const conejosDeFoto = (foto: { vista: { x: number }; noche: boolean; jardin?: unknown }) =>
  foto.jardin && foto.vista.x < 0 && !foto.noche ? CONEJOS_EN_FOTO : [];

/** El conejo sentado (la primera celda de su hoja, ya cargada), con los pies en (x, y). */
export function pintarConejo(c: CanvasRenderingContext2D, hoja: CanvasImageSource, { x, y, mira }: (typeof CONEJOS_EN_FOTO)[number]) {
  c.save();
  c.imageSmoothingEnabled = false;
  c.translate(x, y);
  if (mira < 0) c.scale(-1, 1);
  c.drawImage(hoja, 0, 0, CELDA_CONEJO.ancho, CELDA_CONEJO.alto, -54, -117.6, 108, 120);
  c.restore();
}
