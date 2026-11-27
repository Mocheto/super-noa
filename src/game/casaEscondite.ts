/**
 * El escondite del mueble de la pecera (issue 436): las dos puertas del mueble se abren a la vez, sobre un único hueco,
 * y dentro cabe un solo gatito. Con las puertas cerradas asoma la cola y maúlla; al abrir sale enseguida, y si nadie
 * abre en un minuto, sale solo. No se guarda: al volver a la casa el mueble está vacío. Solo lógica, con reloj y azar
 * de fuera; la casa (`CasaGatitos.tsx`) mueve al gatito y `PeceraCasa.tsx` dibuja las puertas.
 */

/** Lo que un gatito aguanta escondido antes de salir por su cuenta. */
export const SALE_SOLO_MS = 60_000;
/** El primer maullido llega pronto, para que se note que hay alguien; los demás, de vez en cuando. */
export const PRIMER_MAULLIDO_MS = 2500;
export const MAULLA_CADA_MS = [6000, 10_000] as const;
/** «A veces» uno se cuela solo: en la mitad de las visitas, y no nada más entrar. */
export const PROBABILIDAD_DE_COLARSE = 0.5;
export const COLARSE_A_LOS_MS = [15_000, 45_000] as const;
/** Adónde anda el gatito que se cuela, justo delante de las puertas, antes de meterse. */
export const ENTRADA_ESCONDITE = { x: -190, y: 408 } as const;

export type Escondite = {
  abierto: boolean;
  /** El gatito de dentro (por su mundo), o `null` si está vacío. */
  gatito: number | null;
  /** Cuándo entró (ms) y cuándo vuelve a maullar. */
  desde: number;
  maulla: number;
};

export const esconditeVacio = (): Escondite => ({ abierto: false, gatito: null, desde: 0, maulla: 0 });

const entre = ([desde, hasta]: readonly [number, number], azar: () => number) => desde + azar() * (hasta - desde);

/** ¿Puede entrar este gatito? Solo si no hay otro dentro, está despierto y no es la hora de dormir. */
export const puedeEsconderse = (escondite: Escondite, gatito: { dormido: boolean; arropado: boolean; horaDeDormir: boolean }) =>
  escondite.gatito === null && !gatito.dormido && !gatito.arropado && !gatito.horaDeDormir;

/** El gatito entra y las puertas se cierran. Si ya hay uno, no cabe y no cambia nada. */
export function esconder(escondite: Escondite, mundo: number, ahora: number): Escondite {
  if (escondite.gatito !== null) return escondite;
  return { abierto: false, gatito: mundo, desde: ahora, maulla: ahora + PRIMER_MAULLIDO_MS };
}

/** Sale el de dentro (si lo hay) y las puertas quedan abiertas hasta que Noa las toca. */
export function sacar(escondite: Escondite): { escondite: Escondite; sale: number | null } {
  if (escondite.gatito === null) return { escondite, sale: null };
  return { escondite: { ...esconditeVacio(), abierto: true }, sale: escondite.gatito };
}

/** Tocar una puerta: abre o cierra las dos. Al abrir con un gatito dentro, sale enseguida. */
export function tocarPuertas(escondite: Escondite): { escondite: Escondite; sale: number | null } {
  if (escondite.gatito !== null) return sacar(escondite);
  return { escondite: { ...escondite, abierto: !escondite.abierto }, sale: null };
}

/** Pasa el tiempo: con un gatito dentro, maúlla de vez en cuando y, al minuto, toca que salga (`seAcabo`). */
export function pasarRato(escondite: Escondite, ahora: number, azar: () => number): { escondite: Escondite; maulla: boolean; seAcabo: boolean } {
  if (escondite.gatito === null) return { escondite, maulla: false, seAcabo: false };
  if (ahora - escondite.desde >= SALE_SOLO_MS) return { escondite, maulla: false, seAcabo: true };
  if (ahora < escondite.maulla) return { escondite, maulla: false, seAcabo: false };
  return { escondite: { ...escondite, maulla: ahora + entre(MAULLA_CADA_MS, azar) }, maulla: true, seAcabo: false };
}

/** Al empezar la visita: dentro de cuánto se colará uno solo, o `null` si esta vez no pasa (como mucho una vez). */
export const cuandoSeCuela = (azar: () => number): number | null =>
  azar() < PROBABILIDAD_DE_COLARSE ? entre(COLARSE_A_LOS_MS, azar) : null;
