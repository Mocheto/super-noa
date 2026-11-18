/**
 * Interruptores de funciones del juego. Una función apagada desaparece de la interfaz, pero su progreso
 * guardado (`friends`, `restStops`) se conserva tal cual para cuando vuelva.
 *
 * - `amigos`: pestaña Amigos de la colección.
 * - `paseos`: paseo de los amigos tras cada guardián (botón PASEO del mundo y de la ventana del guardián).
 *
 * Están apagadas mientras se rehace la parte de amigos. En desarrollo se encienden con
 * `?funciones=amigos,paseos`.
 */
export type Funcion = "amigos" | "paseos";

export const FUNCIONES_POR_DEFECTO: Readonly<Record<Funcion, boolean>> = { amigos: false, paseos: false };

/** Funciones activas: las de por defecto más las que pide `?funciones=` (solo se usa en desarrollo). */
export function leerFunciones(busqueda: string | null, base: Readonly<Record<Funcion, boolean>> = FUNCIONES_POR_DEFECTO): Record<Funcion, boolean> {
  const activas = { ...base };
  const pedidas = new URLSearchParams(busqueda ?? "").get("funciones");
  for (const nombre of pedidas?.split(",") ?? []) {
    const limpia = nombre.trim();
    if (limpia in activas) activas[limpia as Funcion] = true;
  }
  return activas;
}

const busquedaDesarrollo = (() => {
  try {
    return import.meta.env?.DEV && typeof window !== "undefined" ? window.location.search : null;
  } catch {
    return null;
  }
})();

export const funciones: Readonly<Record<Funcion, boolean>> = leerFunciones(busquedaDesarrollo);
