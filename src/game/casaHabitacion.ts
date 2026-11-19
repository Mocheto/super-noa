/**
 * La habitación de la casa como datos (decisión del mapa «La casa viva»): su ancho, su fondo dibujado, la franja de
 * suelo por la que deambulan los gatitos con su escala de profundidad y los sitios de interés. Añadir una estancia
 * será añadir otro dato como este. Todas las medidas van en px de la escena; `y` es siempre la fila de los pies.
 */
import type { EstadoVida } from "./casa.ts";

export type SitioId = "puerta" | "cama" | "rascador" | "ventana" | "alfombra" | "banera";
export type SitioInteres = { x: number; y: number; /** Lo que va a hacer allí un gatito que va a propósito. */ para: EstadoVida | null };

export type Habitacion = {
  id: string;
  ancho: number;
  alto: number;
  fondo: string;
  /** Franja de suelo por la que se anda: de `fondo` (más lejos) a `delante` (más cerca), entre `izquierda` y `derecha`. */
  suelo: { fondo: number; delante: number; izquierda: number; derecha: number };
  /** Escala del gatito al fondo y delante: más lejos, más pequeño. */
  escala: { fondo: number; delante: number };
  sitios: Record<SitioId, SitioInteres>;
  /** Sitio de cada gatito en casa de día (por la alfombra) y de noche (en la cama y la alfombra), por su orden entre los de casa. */
  sitiosDia: readonly { x: number; y: number }[];
  sitiosNoche: readonly { x: number; y: number }[];
  ventanaNoche: { imagen: string; left: number; top: number; width: number; height: number };
  /** Centro de la luz de la lámpara de noche. */
  lampara: { x: number; y: number };
  /** Zona de la bañera dibujada donde se suelta a un gatito cogido para bañarlo. */
  zonaBanera: { izquierda: number; derecha: number; arriba: number; abajo: number };
  /** Armario de la ropa (mapa «Ropa y accesorios para los gatitos»): su dibujo y la zona donde se suelta a un gatito para vestirlo. */
  armario: { imagen: string; left: number; top: number; width: number; height: number };
  zonaArmario: { izquierda: number; derecha: number; arriba: number; abajo: number };
};

export const HABITACION_CASA: Habitacion = {
  id: "salon",
  ancho: 1280,
  alto: 540,
  /** La habitación vacía: la cama, la alfombra, el cuadro y la planta se ponen encima según la decoración. */
  fondo: "./assets/worlds/casa-habitacion-vacia-v1.webp",
  suelo: { fondo: 405, delante: 520, izquierda: 110, derecha: 1170 },
  escala: { fondo: 0.8, delante: 1 },
  sitios: {
    puerta: { x: 140, y: 420, para: null },
    cama: { x: 360, y: 425, para: "dormir" },
    rascador: { x: 545, y: 412, para: "jugarSolo" },
    ventana: { x: 740, y: 408, para: "sentarse" },
    alfombra: { x: 650, y: 505, para: "cantar" },
    banera: { x: 1085, y: 440, para: null },
  },
  sitiosDia: [{ x: 570, y: 465 }, { x: 680, y: 495 }, { x: 790, y: 465 }, { x: 900, y: 495 }, { x: 1010, y: 465 }],
  // De noche, tres en la cama y dos en la alfombra.
  sitiosNoche: [{ x: 310, y: 425 }, { x: 365, y: 425 }, { x: 420, y: 425 }, { x: 640, y: 470 }, { x: 760, y: 470 }],
  ventanaNoche: { imagen: "./assets/sprites/casa-ventana-noche-v1.webp", left: 619, top: 39, width: 239, height: 234 },
  lampara: { x: 1215, y: 175 },
  zonaBanera: { izquierda: 985, derecha: 1185, arriba: 340, abajo: 470 },
  // Bajo la balda de la planta, entre la ventana y la bañera, con los pies en el suelo.
  armario: { imagen: "./assets/sprites/casa-armario-v1.webp", left: 878, top: 250, width: 95, height: 150 },
  zonaArmario: { izquierda: 862, derecha: 984, arriba: 240, abajo: 430 },
};

/** ¿Está el punto sobre la bañera? */
export const sobreLaBanera = (habitacion: Habitacion, x: number, y: number) =>
  x >= habitacion.zonaBanera.izquierda && x <= habitacion.zonaBanera.derecha && y >= habitacion.zonaBanera.arriba && y <= habitacion.zonaBanera.abajo;

/** ¿Está el punto sobre el armario? */
export const sobreElArmario = (habitacion: Habitacion, x: number, y: number) =>
  x >= habitacion.zonaArmario.izquierda && x <= habitacion.zonaArmario.derecha && y >= habitacion.zonaArmario.arriba && y <= habitacion.zonaArmario.abajo;

/** Punto del suelo donde aterriza un gatito soltado en (x, y): el más cercano dentro del suelo. */
export const aterrizar = (habitacion: Habitacion, x: number, y: number) => ({
  x: Math.max(habitacion.suelo.izquierda, Math.min(habitacion.suelo.derecha, x)),
  y: Math.max(habitacion.suelo.fondo, Math.min(habitacion.suelo.delante, y)),
});

/** Escala de profundidad de un gatito con los pies en `y`: 0,8 al fondo del suelo y 1 delante. */
export function escalaEnSuelo(habitacion: Habitacion, y: number): number {
  const { fondo, delante } = habitacion.suelo;
  const t = Math.max(0, Math.min(1, (y - fondo) / (delante - fondo)));
  return habitacion.escala.fondo + (habitacion.escala.delante - habitacion.escala.fondo) * t;
}

/** ¿Está el punto dentro del suelo por el que se anda? */
export const dentroDelSuelo = (habitacion: Habitacion, x: number, y: number) =>
  x >= habitacion.suelo.izquierda && x <= habitacion.suelo.derecha && y >= habitacion.suelo.fondo && y <= habitacion.suelo.delante;
