import type { BossId } from "./types";

export type GuardianGameId = Extract<BossId,
  "triceratops-queen" | "sky-captain" |
  "aurora-celeste" | "rainbow-queen"
>;

export type GuardianOption = { id: string; sprite: readonly [row: number, column: number]; label: string; color: string };
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

const laneOptions = [
  { id: "left", sprite: [1, 0], label: "Cesta izquierda", color: "#76b98c" },
  { id: "center", sprite: [1, 1], label: "Cesta del centro", color: "#e0a452" },
  { id: "right", sprite: [1, 2], label: "Cesta derecha", color: "#8b79cf" },
] as const;
const cannonOptions = [
  { id: "red", sprite: [2, 0], label: "Cañón rojo", color: "#df5c62" },
  { id: "yellow", sprite: [2, 1], label: "Cañón amarillo", color: "#efc94f" },
  { id: "blue", sprite: [2, 2], label: "Cañón azul", color: "#58a9df" },
] as const;
const starOptions = [
  { id: "moon", sprite: [5, 0], label: "Luna", color: "#8b78cf" },
  { id: "star", sprite: [5, 1], label: "Estrella", color: "#efc84d" },
  { id: "cloud", sprite: [5, 2], label: "Nube", color: "#71b5de" },
] as const;
const rainbowOptions = [
  { id: "red", sprite: [6, 0], label: "Rojo", color: "#e45e66" },
  { id: "yellow", sprite: [6, 1], label: "Amarillo", color: "#f0c84d" },
  { id: "blue", sprite: [6, 2], label: "Azul", color: "#5aa9df" },
] as const;

export const guardianGames: Record<GuardianGameId, GuardianGame> = {
  "triceratops-queen": { kind: "choice", title: "Protege los huevos", instruction: "Mira dónde cae el huevo y coloca allí la cesta.", prompt: "El huevo cae aquí", success: "¡Huevo a salvo!", options: laneOptions },
  "sky-captain": { kind: "choice", title: "Cañones de colores", instruction: "Mira la bandera y dispara el cañón del mismo color.", prompt: "La bandera del capitán", success: "¡Nube despejada!", options: cannonOptions },
  "aurora-celeste": { kind: "sequence", title: "Une las estrellas", instruction: "Mira el camino del cielo y toca los dibujos en el mismo orden.", prompt: "Camino de estrellas", success: "¡Constelación encendida!", options: starOptions, sequenceLengths: [2, 3, 3, 4, 5] },
  "rainbow-queen": { kind: "sequence", title: "Pinta el arcoíris", instruction: "Mira los colores y repítelos en el mismo orden.", prompt: "Colores del arcoíris", success: "¡El arcoíris vuelve a brillar!", options: rainbowOptions, sequenceLengths: [3, 3, 4, 4, 5] },
};

export function isGuardianGameId(id: BossId): id is GuardianGameId {
  return id in guardianGames;
}

export function makeGuardianSequence(game: GuardianGame, round: number, randomValues: ArrayLike<number>) {
  const length = game.kind === "sequence" ? (game.sequenceLengths?.[round] ?? 3) : 1;
  return Array.from({ length }, (_, index) => game.options[(randomValues[index] ?? index) % game.options.length].id);
}
