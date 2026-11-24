/**
 * Ajustes del juego que se guardan en el navegador (sonido, volúmenes, movimiento reducido y controles táctiles):
 * qué claves usan, cómo se leen y cómo se escriben. `useAjustes.ts` los envuelve en estado de React.
 */
import { readSavedPercentage, readStorage, writeStorage } from "./storage.ts";

export type TouchControlsMode = "auto" | "always";
export type Volumen = "musica" | "efectos";

export const CLAVES_AJUSTES = {
  muted: "super-noa-muted",
  musica: "super-noa-music-volume",
  efectos: "super-noa-effects-volume",
  reduceMotion: "super-noa-reduce-motion",
  touchControls: "super-noa-touch-controls",
} as const;

export type Ajustes = {
  muted: boolean;
  musicVolume: number;
  effectsVolume: number;
  /** Solo el ajuste del juego; el del sistema se suma en `useAjustes`. */
  reduceMotion: boolean;
  touchControls: TouchControlsMode;
};

export function leerAjustes(): Ajustes {
  return {
    muted: readStorage(CLAVES_AJUSTES.muted) === "true",
    musicVolume: readSavedPercentage(CLAVES_AJUSTES.musica, 100),
    effectsVolume: readSavedPercentage(CLAVES_AJUSTES.efectos, 100),
    reduceMotion: readStorage(CLAVES_AJUSTES.reduceMotion) === "true",
    touchControls: readStorage(CLAVES_AJUSTES.touchControls) === "always" ? "always" : "auto",
  };
}

export function guardarAjustes(ajustes: Ajustes): void {
  writeStorage(CLAVES_AJUSTES.muted, String(ajustes.muted));
  writeStorage(CLAVES_AJUSTES.musica, String(ajustes.musicVolume));
  writeStorage(CLAVES_AJUSTES.efectos, String(ajustes.effectsVolume));
  writeStorage(CLAVES_AJUSTES.reduceMotion, String(ajustes.reduceMotion));
  writeStorage(CLAVES_AJUSTES.touchControls, ajustes.touchControls);
}

/** Un volumen elegido a mano (también un 0) se marca para que `readSavedPercentage` lo respete al volver. */
export function marcarVolumenElegido(cual: Volumen): void {
  writeStorage(`${cual === "musica" ? CLAVES_AJUSTES.musica : CLAVES_AJUSTES.efectos}-configured`, "true");
}

export function conVolumen(ajustes: Ajustes, cual: Volumen, valor: number): Ajustes {
  return cual === "musica" ? { ...ajustes, musicVolume: valor } : { ...ajustes, effectsVolume: valor };
}
