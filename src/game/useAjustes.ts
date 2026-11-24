import { useCallback, useEffect, useState } from "react";
import { conVolumen, guardarAjustes, leerAjustes, marcarVolumenElegido, type TouchControlsMode, type Volumen } from "./ajustes.ts";

const CONSULTA_MOVIMIENTO = "(prefers-reduced-motion: reduce)";

/** Los ajustes del juego, guardados en el navegador cada vez que cambian. */
export function useAjustes() {
  const [ajustes, setAjustes] = useState(leerAjustes);
  // «Reducir movimiento» vale tanto el ajuste del juego como el del sistema (issue 336).
  const [movimientoSistema, setMovimientoSistema] = useState(() => typeof matchMedia === "function" && matchMedia(CONSULTA_MOVIMIENTO).matches);
  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const consulta = matchMedia(CONSULTA_MOVIMIENTO);
    const cambiar = () => setMovimientoSistema(consulta.matches);
    consulta.addEventListener?.("change", cambiar);
    return () => consulta.removeEventListener?.("change", cambiar);
  }, []);

  useEffect(() => { guardarAjustes(ajustes); }, [ajustes]);

  const alternarSonido = useCallback(() => setAjustes((actual) => ({ ...actual, muted: !actual.muted })), []);
  const ajustarVolumen = useCallback((cual: Volumen, valor: number) => {
    marcarVolumenElegido(cual);
    setAjustes((actual) => conVolumen(actual, cual, valor));
  }, []);
  const setReduceMotion = useCallback((reduceMotion: boolean) => setAjustes((actual) => ({ ...actual, reduceMotion })), []);
  const setTouchControls = useCallback((touchControls: TouchControlsMode) => setAjustes((actual) => ({ ...actual, touchControls })), []);

  return {
    muted: ajustes.muted,
    musicVolume: ajustes.musicVolume,
    effectsVolume: ajustes.effectsVolume,
    /** El ajuste del juego, para la casilla de la ventana de ajustes. */
    reduceMotionAjuste: ajustes.reduceMotion,
    /** El ajuste del juego o el del sistema: lo que usa todo el juego. */
    reduceMotion: ajustes.reduceMotion || movimientoSistema,
    touchControls: ajustes.touchControls,
    alternarSonido, ajustarVolumen, setReduceMotion, setTouchControls,
  };
}

export type AjustesJuego = ReturnType<typeof useAjustes>;
