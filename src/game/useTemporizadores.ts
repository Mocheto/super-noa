/**
 * Ganchos finos sobre `temporizadores.ts` (issue 309): todo lo que la casa programa para luego se cancela al cerrarla.
 * - `useTemporizadores()`: `despues(ms, fn)` y su limpieza al desmontar.
 * - `useEfimero()`: un valor que se ve un rato y se quita solo (riego, reacción, destello, pelota, brillo); uno nuevo
 *   sustituye al anterior y su temporizador ya no lo quita.
 * - `useRespuestas()`: los bocadillos de respuesta de los gatitos, uno por gatito, que se quitan solos.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { crearTemporizadores, ponerRespuesta, sinId, type Temporizadores } from "./temporizadores";

export function useTemporizadores(): Temporizadores {
  const [temporizadores] = useState(() => crearTemporizadores());
  useEffect(() => () => temporizadores.cancelarTodos(), [temporizadores]);
  return temporizadores;
}

/** Un valor que se ve durante `ms` y se quita solo; `poner` lo sustituye por otro (con su id) y `quitar` lo borra ya. */
export function useEfimero<T>(temporizadores: Temporizadores): [(T & { id: number }) | null, (valor: T, ms: number) => number, () => void] {
  const [valor, setValor] = useState<(T & { id: number }) | null>(null);
  const idRef = useRef(0);
  const poner = useCallback((nuevo: T, ms: number) => {
    const id = ++idRef.current;
    setValor({ ...nuevo, id });
    temporizadores.despues(ms, () => setValor((actual) => actual?.id === id ? null : actual));
    return id;
  }, [temporizadores]);
  const quitar = useCallback(() => setValor(null), []);
  return [valor, poner, quitar];
}

/** Respuestas de los gatitos: una por gatito; cada una se quita sola a los `ms`. */
export function useRespuestas<R extends { gatito: number; id: number }>(temporizadores: Temporizadores) {
  const [respuestas, setRespuestas] = useState<R[]>([]);
  const idRef = useRef(0);
  const responder = useCallback((respuesta: Omit<R, "id">, ms: number) => {
    const id = ++idRef.current;
    setRespuestas((actuales) => ponerRespuesta(actuales, { ...respuesta, id } as R));
    temporizadores.despues(ms, () => setRespuestas((actuales) => sinId(actuales, id)));
    return id;
  }, [temporizadores]);
  return { respuestas, responder };
}
