import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { accionesProgreso } from "./progressAcciones";
import { adoptarProgreso, parseProgress, readProgress, serializeProgress, STORAGE_KEY, textoNormalizado, type Progress } from "./progress";
import { readStorage, writeStorage } from "./storage";

type Acciones = typeof accionesProgreso;
type SinProgreso<F> = F extends (current: Progress, ...args: infer A) => Progress ? (...args: A) => void : never;
export type AccionesProgreso = { [K in keyof Acciones]: SinProgreso<Acciones[K]> };

/**
 * El progreso del juego: se lee al empezar, se guarda cada vez que cambia (sin reescribir una cadena idéntica) y adopta
 * lo que guarde otra pestaña. `pantallaRef` dice si la casa está abierta, para volver a montarla con lo adoptado.
 */
export function useProgreso(pantallaRef: RefObject<string>) {
  const [progress, setProgress] = useState<Progress>(readProgress);
  const [saveError, setSaveError] = useState(false);
  // Lo último que se sabe que hay guardado: lo que escribió esta pestaña o lo que leyó de otra.
  const guardadoRef = useRef<string | null | undefined>(undefined);
  const progressRef = useRef(progress);
  /** Cambia al adoptar una casa de otra pestaña con la casa abierta: vuelve a montarla con los datos nuevos. */
  const [casaVersion, setCasaVersion] = useState(0);

  useEffect(() => {
    progressRef.current = progress;
    const texto = serializeProgress(progress);
    // Una cadena idéntica a la guardada no se vuelve a escribir (tampoco la que se acaba de leer de otra pestaña).
    if (texto === guardadoRef.current) return;
    const saved = writeStorage(STORAGE_KEY, texto);
    if (saved) guardadoRef.current = texto;
    const timeout = window.setTimeout(() => setSaveError(!saved), 0);
    return () => window.clearTimeout(timeout);
  }, [progress]);

  // Otra pestaña ha guardado (o se vuelve a esta pestaña): se adopta su progreso en lugar de pisarlo en la siguiente escritura.
  useEffect(() => {
    const adoptar = (remoto: string | null) => {
      const normal = textoNormalizado(remoto);
      if (normal === guardadoRef.current) return;
      const conocida = guardadoRef.current ?? null;
      // Adoptado tal cual, se serializa igual que `normal` y no se vuelve a escribir; fusionado, sí.
      guardadoRef.current = normal;
      const casaRemota = parseProgress(remoto).casa;
      if (pantallaRef.current === "casa" && JSON.stringify(casaRemota) !== JSON.stringify(progressRef.current.casa)) setCasaVersion((version) => version + 1);
      setProgress((actual) => adoptarProgreso(actual, remoto, conocida));
    };
    const alGuardarOtra = (event: StorageEvent) => { if (event.key === STORAGE_KEY) adoptar(event.newValue); };
    const releer = () => { if (document.visibilityState === "visible") adoptar(readStorage(STORAGE_KEY)); };
    const alVolver = (event: PageTransitionEvent) => { if (event.persisted) adoptar(readStorage(STORAGE_KEY)); };
    window.addEventListener("storage", alGuardarOtra);
    document.addEventListener("visibilitychange", releer);
    window.addEventListener("pageshow", alVolver);
    return () => {
      window.removeEventListener("storage", alGuardarOtra);
      document.removeEventListener("visibilitychange", releer);
      window.removeEventListener("pageshow", alVolver);
    };
  }, [pantallaRef]);

  // Cada acción pura, envuelta en un `setProgress` estable.
  const acciones = useMemo(() => Object.fromEntries(Object.entries(accionesProgreso).map(([nombre, accion]) => [
    nombre,
    (...args: unknown[]) => setProgress((current) => (accion as (current: Progress, ...args: unknown[]) => Progress)(current, ...args)),
  ])) as AccionesProgreso, []);

  return { progress, progressRef, saveError, casaVersion, acciones };
}
