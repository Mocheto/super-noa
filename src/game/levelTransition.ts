import type { GameSnapshot } from "./types";

/** Duración del círculo que se cierra sobre Noa al salir de una pantalla y del que se abre al entrar (decisión «La transición entre pantallas»). */
export const SALIDA_SEGUNDOS = 1.2;
export const ENTRADA_SEGUNDOS = 0.9;

/** Lo que hay que pintar encima de la escena: un círculo abierto alrededor de Noa o, con movimiento tranquilo, un fundido. */
export type CapaTransicion = { tipo: "circulo"; radio: number; bien: boolean } | { tipo: "fundido"; alfa: number; bien: boolean };

const suave = (p: number) => p * p * (3 - 2 * p);
const limitar = (p: number) => Math.min(1, Math.max(0, p));

/**
 * Capa de la transición a partir del tiempo que falta (salida) o del que ha pasado (entrada).
 * - Salida: el círculo se cierra durante los últimos `SALIDA_SEGUNDOS`; «¡BIEN!» sale en la segunda mitad.
 * - Entrada: el círculo se abre durante `ENTRADA_SEGUNDOS`.
 */
export function capaTransicion(fase: "salida" | "entrada", segundos: number, radioMaximo: number, tranquilo: boolean): CapaTransicion | undefined {
  const abierto = fase === "salida" ? limitar(segundos / SALIDA_SEGUNDOS) : limitar(segundos / ENTRADA_SEGUNDOS);
  if (abierto >= 1) return undefined;
  const bien = fase === "salida" && abierto <= 0.5;
  if (tranquilo) return { tipo: "fundido", alfa: 1 - suave(abierto), bien };
  return { tipo: "circulo", radio: radioMaximo * suave(abierto), bien };
}

/** Uses simulation time so a paused or unmounted level cannot finish in the background. */
export function createLevelTransition(onSnapshot: (snapshot: GameSnapshot) => void) {
  let pending: { remaining: number; snapshot: GameSnapshot; complete: (snapshot: GameSnapshot) => void } | undefined;

  return {
    begin(snapshot: GameSnapshot, delay: number, complete: (snapshot: GameSnapshot) => void) {
      if (pending) return;
      const finalSnapshot = { ...snapshot, stickers: [...snapshot.stickers] };
      pending = { remaining: delay, snapshot: finalSnapshot, complete };
      onSnapshot(finalSnapshot);
    },
    advance(delta: number, running: boolean) {
      if (!running || !pending) return;
      pending.remaining -= delta;
      if (pending.remaining > 1e-9) return;
      const finished = pending;
      pending = undefined;
      finished.complete(finished.snapshot);
    },
    /** Segundos que faltan para terminar la salida, o `undefined` si no hay ninguna en marcha. */
    remaining() {
      return pending?.remaining;
    },
    cancel() {
      pending = undefined;
    },
  };
}
