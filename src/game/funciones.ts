/**
 * Interruptores de funciones del juego. Una función apagada desaparece de la interfaz, pero su progreso
 * guardado (`friends`, `restStops`) se conserva tal cual para cuando vuelva.
 *
 * - `amigos`: pestaña Amigos de la colección.
 * - `paseos`: paseo de los amigos tras cada guardián (botón PASEO del mundo y de la ventana del guardián).
 * - `casa`: la casa de los gatitos (botón CASA del mapa y A CASA de la ventana de mundo completado), hasta que esté
 *   entera.
 *
 * Están apagadas mientras se rehace la parte de amigos y se construye la casa. Para probarlas, también en la web
 * publicada, se encienden solo a petición con `?funciones=amigos,paseos,casa` en la dirección.
 */
export type Funcion = "amigos" | "paseos" | "casa";

export const FUNCIONES_POR_DEFECTO: Readonly<Record<Funcion, boolean>> = { amigos: false, paseos: false, casa: false };

/** Funciones activas: las de por defecto más las que pide `?funciones=`. */
export function leerFunciones(busqueda: string | null, base: Readonly<Record<Funcion, boolean>> = FUNCIONES_POR_DEFECTO): Record<Funcion, boolean> {
  const activas = { ...base };
  const pedidas = new URLSearchParams(busqueda ?? "").get("funciones");
  for (const nombre of pedidas?.split(",") ?? []) {
    const limpia = nombre.trim();
    if (limpia in activas) activas[limpia as Funcion] = true;
  }
  return activas;
}

const busqueda = typeof window !== "undefined" ? window.location.search : null;

export const funciones: Readonly<Record<Funcion, boolean>> = leerFunciones(busqueda);
