import type { Enemy } from "./types";
import { conTextos } from "../textos/index.ts";

/** Pestaña Amigos: ficha de cada animal o enemigo del juego. Los textos son para una niña de cinco años. */
export type FriendFood = "apple" | "acorn" | "flower";
type FriendDatos = { kind: Enemy["kind"]; world: number; favoriteFood: FriendFood };
export type FriendEntry = FriendDatos & { name: string; biteLine: string; tip: string };

export const MAX_HEARTS = 5;

/** Amigos tal como se declaran: sin textos. Nombre, si muerde y consejo salen del catálogo (`amigos.<tipo>.nombre.rotulo`, `.muerde.juntos`, `.consejo.juntos`). */
const datosAmigos: FriendDatos[] = [
  { kind: "slime", world: 1, favoriteFood: "apple" },
  { kind: "beetle", world: 1, favoriteFood: "flower" },
  { kind: "cloud", world: 1, favoriteFood: "flower" },
  { kind: "bat", world: 2, favoriteFood: "apple" },
  { kind: "wolf", world: 3, favoriteFood: "acorn" },
  { kind: "fish", world: 8, favoriteFood: "flower" },
  { kind: "urchin", world: 8, favoriteFood: "flower" },
  { kind: "boar", world: 4, favoriteFood: "acorn" },
  { kind: "bird", world: 4, favoriteFood: "flower" },
  { kind: "pirate", world: 5, favoriteFood: "apple" },
  { kind: "parrot", world: 5, favoriteFood: "apple" },
  { kind: "skeleton", world: 6, favoriteFood: "apple" },
  { kind: "ghost", world: 6, favoriteFood: "flower" },
  { kind: "zombie", world: 6, favoriteFood: "apple" },
  { kind: "baby-t-rex", world: 9, favoriteFood: "apple" },
  { kind: "pterodactyl", world: 9, favoriteFood: "apple" },
  { kind: "baby-dragon", world: 10, favoriteFood: "apple" },
  { kind: "fire-salamander", world: 10, favoriteFood: "flower" },
  { kind: "flying-dragon", world: 10, favoriteFood: "apple" },
  { kind: "ant", world: 11, favoriteFood: "acorn" },
  { kind: "snail", world: 11, favoriteFood: "flower" },
  { kind: "bee", world: 11, favoriteFood: "flower" },
  { kind: "penguin", world: 12, favoriteFood: "apple" },
  { kind: "snow-fox", world: 12, favoriteFood: "apple" },
  { kind: "snowy-owl", world: 12, favoriteFood: "acorn" },
  { kind: "snow-scout", world: 13, favoriteFood: "apple" },
  { kind: "toy-reindeer", world: 13, favoriteFood: "apple" },
  { kind: "winter-robin", world: 13, favoriteFood: "acorn" },
  { kind: "toy-bird", world: 13, favoriteFood: "flower" },
  { kind: "toy-elf", world: 13, favoriteFood: "apple" },
  { kind: "toy-robot", world: 13, favoriteFood: "apple" },
  { kind: "gift-box", world: 13, favoriteFood: "flower" },
  { kind: "star-lantern", world: 13, favoriteFood: "flower" },
  { kind: "gift-gnome", world: 13, favoriteFood: "acorn" },
  { kind: "desert-scarab", world: 14, favoriteFood: "acorn" },
  { kind: "fennec", world: 14, favoriteFood: "apple" },
  { kind: "tumbleweed", world: 14, favoriteFood: "flower" },
  { kind: "rolling-suitcase", world: 15, favoriteFood: "apple" },
  { kind: "conductor-pigeon", world: 15, favoriteFood: "acorn" },
  { kind: "clockwork-mouse", world: 15, favoriteFood: "apple" },
  { kind: "walking-drum", world: 16, favoriteFood: "flower" },
  { kind: "note-bird", world: 16, favoriteFood: "flower" },
  { kind: "violin-mouse", world: 16, favoriteFood: "apple" },
  { kind: "puffling", world: 17, favoriteFood: "flower" },
  { kind: "sky-unicorn", world: 7, favoriteFood: "apple" },
];

export const friendCatalog: FriendEntry[] = datosAmigos.map((amigo) => conTextos(amigo, {
  name: `amigos.${amigo.kind}.nombre.rotulo`, biteLine: `amigos.${amigo.kind}.muerde.juntos`, tip: `amigos.${amigo.kind}.consejo.juntos`,
}) as FriendEntry);

export const foodNames = conTextos({} as Record<FriendFood, string>, { apple: "amigos.comida.apple.rotulo", acorn: "amigos.comida.acorn.rotulo", flower: "amigos.comida.flower.rotulo" });
