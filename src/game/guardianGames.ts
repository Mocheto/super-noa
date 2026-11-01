import type { BossId } from "./types";

export type GuardianGameId = Extract<BossId,
  "queen-bee" | "triceratops-queen" | "sky-captain" | "great-boar" |
  "maestra-armonia" | "aurora-celeste" | "rainbow-queen"
>;

export type GuardianOption = { id: string; icon: string; label: string; color: string };
export type GuardianGame = {
  kind: "choice" | "sequence";
  title: string;
  instruction: string;
  prompt: string;
  success: string;
  options: readonly GuardianOption[];
  sequenceLengths?: readonly number[];
};

const flowerOptions = [
  { id: "pink", icon: "✿", label: "Flor rosa", color: "#ef79a9" },
  { id: "yellow", icon: "✿", label: "Flor amarilla", color: "#e0ad25" },
  { id: "blue", icon: "✿", label: "Flor azul", color: "#438fc9" },
] as const;
const laneOptions = [
  { id: "left", icon: "◀", label: "Cesta izquierda", color: "#76b98c" },
  { id: "center", icon: "●", label: "Cesta del centro", color: "#e0a452" },
  { id: "right", icon: "▶", label: "Cesta derecha", color: "#8b79cf" },
] as const;
const cannonOptions = [
  { id: "red", icon: "●", label: "Cañón rojo", color: "#df5c62" },
  { id: "yellow", icon: "●", label: "Cañón amarillo", color: "#efc94f" },
  { id: "blue", icon: "●", label: "Cañón azul", color: "#58a9df" },
] as const;
const dodgeOptions = [
  { id: "left", icon: "🌳", label: "Arbusto izquierdo", color: "#60945d" },
  { id: "jump", icon: "⬆", label: "Saltar", color: "#d39a4c" },
  { id: "right", icon: "🌳", label: "Arbusto derecho", color: "#60945d" },
] as const;
const noteOptions = [
  { id: "drum", icon: "🥁", label: "Tambor", color: "#df765f" },
  { id: "bell", icon: "🔔", label: "Campana", color: "#e8bd45" },
  { id: "flute", icon: "♫", label: "Flauta", color: "#6da6dc" },
] as const;
const starOptions = [
  { id: "moon", icon: "☾", label: "Luna", color: "#8b78cf" },
  { id: "star", icon: "★", label: "Estrella", color: "#efc84d" },
  { id: "cloud", icon: "☁", label: "Nube", color: "#71b5de" },
] as const;
const rainbowOptions = [
  { id: "red", icon: "●", label: "Rojo", color: "#e45e66" },
  { id: "yellow", icon: "●", label: "Amarillo", color: "#f0c84d" },
  { id: "blue", icon: "●", label: "Azul", color: "#5aa9df" },
] as const;

export const guardianGames: Record<GuardianGameId, GuardianGame> = {
  "queen-bee": { kind: "choice", title: "Flores para la colmena", instruction: "Melisa pide una flor. Toca la flor del mismo color.", prompt: "Melisa necesita esta flor", success: "¡Néctar para la colmena!", options: flowerOptions },
  "triceratops-queen": { kind: "choice", title: "Protege los huevos", instruction: "Mira dónde cae el huevo y coloca allí la cesta.", prompt: "El huevo cae aquí", success: "¡Huevo a salvo!", options: laneOptions },
  "sky-captain": { kind: "choice", title: "Cañones de colores", instruction: "Mira la bandera y dispara el cañón del mismo color.", prompt: "La bandera del capitán", success: "¡Nube despejada!", options: cannonOptions },
  "great-boar": { kind: "choice", title: "Esquiva la carrera", instruction: "Mira la flecha. Si viene de un lado, escóndete en el contrario. Si viene de abajo, salta.", prompt: "El Jabalí viene desde", success: "¡Bien esquivado! Has encontrado una bellota.", options: dodgeOptions },
  "maestra-armonia": { kind: "sequence", title: "El eco musical", instruction: "Mira los instrumentos y repítelos en el mismo orden.", prompt: "Melodía de Armonía", success: "¡La melodía suena genial!", options: noteOptions, sequenceLengths: [2, 3, 4] },
  "aurora-celeste": { kind: "sequence", title: "Une las estrellas", instruction: "Mira el camino del cielo y toca los dibujos en el mismo orden.", prompt: "Camino de estrellas", success: "¡Constelación encendida!", options: starOptions, sequenceLengths: [2, 3, 4] },
  "rainbow-queen": { kind: "sequence", title: "Pinta el arcoíris", instruction: "Mira los colores y repítelos en el mismo orden.", prompt: "Colores del arcoíris", success: "¡El arcoíris vuelve a brillar!", options: rainbowOptions, sequenceLengths: [3, 3, 4] },
};

export function isGuardianGameId(id: BossId): id is GuardianGameId {
  return id in guardianGames;
}

export function choiceAnswer(gameId: GuardianGameId, targetId: string) {
  if (gameId !== "great-boar") return targetId;
  return targetId === "left" ? "right" : targetId === "right" ? "left" : "jump";
}

export function makeGuardianSequence(game: GuardianGame, round: number, randomValues: ArrayLike<number>) {
  const length = game.kind === "sequence" ? (game.sequenceLengths?.[round] ?? 3) : 1;
  return Array.from({ length }, (_, index) => game.options[(randomValues[index] ?? index) % game.options.length].id);
}
