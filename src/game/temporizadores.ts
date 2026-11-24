/**
 * Temporizadores que se pueden cancelar todos a la vez (issue 309, corte 7 del informe del estado de la casa): la casa
 * los usa para respuestas, riego, destellos, botes y salidas por la puerta, y al cerrarla no sobrevive ninguno. Lógica
 * pura: el reloj (por defecto, `setTimeout`) se puede cambiar en las pruebas. El gancho de React está en
 * `useTemporizadores.ts`.
 */
export type Reloj = { poner: (fn: () => void, ms: number) => unknown; quitar: (id: unknown) => void };

const relojDelNavegador: Reloj = {
  poner: (fn, ms) => setTimeout(fn, ms),
  quitar: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
};

export function crearTemporizadores(reloj: Reloj = relojDelNavegador) {
  const vivos = new Set<unknown>();
  return {
    /** Llama a `fn` dentro de `ms`; devuelve su id para cancelarlo. */
    despues(ms: number, fn: () => void): unknown {
      let id: unknown = null;
      id = reloj.poner(() => { vivos.delete(id); fn(); }, ms);
      vivos.add(id);
      return id;
    },
    cancelar(id: unknown) {
      if (vivos.delete(id)) reloj.quitar(id);
    },
    /** Al cerrar: ninguno llega a llamarse. */
    cancelarTodos() {
      for (const id of vivos) reloj.quitar(id);
      vivos.clear();
    },
    get pendientes() { return vivos.size; },
  };
}
export type Temporizadores = ReturnType<typeof crearTemporizadores>;

/** Cosas con id que se ven un rato (respuestas, destellos, riego…): quitar solo la que tiene ese id. */
export const sinId = <T extends { id: number }>(lista: readonly T[], id: number) => lista.filter((cosa) => cosa.id !== id);
/** La respuesta nueva de un gatito sustituye a la que tuviera. */
export const ponerRespuesta = <T extends { gatito: number }>(lista: readonly T[], nueva: T) => [...lista.filter((cosa) => cosa.gatito !== nueva.gatito), nueva];
