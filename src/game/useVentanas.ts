import { useCallback, useState } from "react";
import type { CollectionTab } from "./VentanaAlbum";

export type VentanaId = "ayuda" | "creditos" | "ajustes" | "album" | "tablon";

const cerradas: Record<VentanaId, boolean> = { ayuda: false, creditos: false, ajustes: false, album: false, tablon: false };

/**
 * Las ventanas de la interfaz (ayuda, créditos, ajustes, álbum y tablón), cada una con su bandera como hasta ahora: el
 * tablón puede abrirse sobre otra. Además, la pestaña del álbum y las pistas que se han abierto en él.
 */
export function useVentanas() {
  const [abiertas, setAbiertas] = useState(cerradas);
  const abrir = useCallback((ventana: VentanaId) => setAbiertas((actual) => actual[ventana] ? actual : { ...actual, [ventana]: true }), []);
  const cerrar = useCallback((ventana: VentanaId) => setAbiertas((actual) => actual[ventana] ? { ...actual, [ventana]: false } : actual), []);
  /** Cierra ayuda, álbum, ajustes y créditos, pero no el tablón: lo que hace el alta antes de enseñarlo. */
  const cerrarMenus = useCallback(() => setAbiertas((actual) => actual.ayuda || actual.album || actual.ajustes || actual.creditos
    ? { ...actual, ayuda: false, album: false, ajustes: false, creditos: false } : actual), []);

  const [pestana, setPestana] = useState<CollectionTab>("stickers");
  const [pistas, setPistas] = useState<string[]>([]);
  const abrirColeccion = useCallback((tab: CollectionTab) => {
    setPestana(tab);
    abrir("album");
  }, [abrir]);

  return {
    ...abiertas,
    /** Alguna ventana delante (también el tablón). */
    algunaAbierta: Object.values(abiertas).some(Boolean),
    abrir, cerrar, cerrarMenus,
    pestana, setPestana, abrirColeccion, pistas, setPistas,
  };
}
