/** Qué música de fondo suena en cada momento: la del mundo, la de la estrella o ninguna. */
import { musicTracks } from "./music.ts";
import type { BossId, Level } from "./types";

export const PISTA_ESTRELLA = "./assets/music/noa-estelar.mp3";

/** Duelos con su propia canción (rítmicos y de memoria): mientras duran, la música del mundo calla. */
export const duelosConCancion: readonly BossId[] = ["queen-bee", "maestra-armonia", "great-boar", "aurora-celeste", "triceratops-queen"];

export type Pista = { source: string; volume: number; playing: boolean };

export function musicaDePantalla(
  screen: string,
  level: Pick<Level, "world" | "boss" | "restStop">,
  estado: { shopActive: boolean; paused: boolean; muted: boolean; musicVolume: number; starActive: boolean },
): { mundo: Pista; estrella: Pista } {
  const cancionPropia = screen === "boss" && level.boss !== undefined && duelosConCancion.includes(level.boss);
  const suena = (screen === "game" || screen === "boss") && !cancionPropia && !estado.shopActive && !estado.paused && !estado.muted && estado.musicVolume > 0;
  return {
    mundo: {
      source: musicTracks[level.world],
      // En el paseo de los amigos la música del mundo suena más suave.
      volume: level.restStop ? estado.musicVolume * .6 : estado.musicVolume,
      playing: suena && !estado.starActive,
    },
    estrella: { source: PISTA_ESTRELLA, volume: estado.musicVolume, playing: suena && estado.starActive },
  };
}
