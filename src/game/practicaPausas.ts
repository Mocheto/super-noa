/**
 * Práctica que se detiene en cada pieza nueva (decisión «La guía en los minijuegos y duelos»): la demostración corre y,
 * al llegar al pulso en que aparece una pieza nueva, se para y muestra su rótulo y su frase para leer juntos hasta que se
 * toca SIGUE. Así nadie lee mientras corre la música. Es solo lógica: cada minijuego decide cómo pintar la pausa.
 */
export type ParadaPractica = { pulso: number; pieza: string };

export function createPracticaConPausas(paradas: ParadaPractica[]) {
  const pendientes = [...paradas].sort((a, b) => a.pulso - b.pulso);
  let detenida: ParadaPractica | undefined;
  return {
    /** Avanza al pulso dado; si cruza una parada, se detiene en ella y la devuelve. */
    llegar(pulso: number): ParadaPractica | undefined {
      if (detenida) return detenida;
      if (pendientes.length && pulso >= pendientes[0].pulso) detenida = pendientes.shift();
      return detenida;
    },
    /** La parada en la que está detenida, si hay una. */
    get detenida() { return detenida; },
    /** SIGUE: continúa la demostración. */
    seguir() { detenida = undefined; },
    /** Paradas que quedan por enseñar. */
    get quedan() { return pendientes.length; },
  };
}
