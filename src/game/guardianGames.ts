import type { BossId } from "./types";
import { conTextos } from "../textos/index.ts";

/**
 * Duelos de elegir y de memoria con tablero fijo que siguen en `GuardianMiniGame`. Aurora Celeste y la Reina Tricera
 * tienen sus duelos de memoria con movimiento propios («El vuelo de Aurora» y «El nido de la Reina»); la fila de iconos
 * de las cestas de la Reina se queda en el atlas `guardian-game-icons-v1`.
 */
export type GuardianGameId = Extract<BossId, "sky-captain" | "rainbow-queen">;

type OpcionDatos = { id: string; sprite: readonly [row: number, column: number]; color: string };
export type GuardianOption = OpcionDatos & { label: string };
type JuegoDatos = { kind: "choice" | "sequence"; options: readonly OpcionDatos[]; sequenceLengths?: readonly number[] };
export type GuardianGame = {
  kind: "choice" | "sequence";
  title: string;
  instruction: string;
  prompt: string;
  success: string;
  options: readonly GuardianOption[];
  sequenceLengths?: readonly number[];
};

export const GUARDIAN_GAME_ROUNDS = 5;

const cannonOptions = [
  { id: "red", sprite: [2, 0], color: "#df5c62" },
  { id: "yellow", sprite: [2, 1], color: "#efc94f" },
  { id: "blue", sprite: [2, 2], color: "#58a9df" },
] as const;
const rainbowOptions = [
  { id: "red", sprite: [6, 0], color: "#e45e66" },
  { id: "yellow", sprite: [6, 1], color: "#f0c84d" },
  { id: "blue", sprite: [6, 2], color: "#5aa9df" },
] as const;

/** Juegos tal como se declaran: sin textos. Título, instrucción, pista, éxito y nombre de cada opción salen de `juegos.<guardián>.…`. */
const datosJuegos: Record<GuardianGameId, JuegoDatos> = {
  "sky-captain": { kind: "choice", options: cannonOptions },
  "rainbow-queen": { kind: "sequence", options: rainbowOptions, sequenceLengths: [3, 3, 4, 4, 5] },
};

export const guardianGames = Object.fromEntries(Object.entries(datosJuegos).map(([id, juego]) => [id, conTextos({
  ...juego,
  options: juego.options.map((opcion) => conTextos({ ...opcion }, { label: `juegos.${id}.opciones.${opcion.id}.rotulo` })),
}, { title: `juegos.${id}.titulo.rotulo`, instruction: `juegos.${id}.instruccion.juntos`, prompt: `juegos.${id}.pista.rotulo`, success: `juegos.${id}.exito.rotulo` })])) as unknown as Record<GuardianGameId, GuardianGame>;

export function isGuardianGameId(id: BossId): id is GuardianGameId {
  return id in guardianGames;
}

export function makeGuardianSequence(game: GuardianGame, round: number, randomValues: ArrayLike<number>) {
  const length = game.kind === "sequence" ? (game.sequenceLengths?.[round] ?? 3) : 1;
  return Array.from({ length }, (_, index) => game.options[(randomValues[index] ?? index) % game.options.length].id);
}
