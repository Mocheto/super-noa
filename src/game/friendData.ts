import type { Enemy } from "./types";

/** Amigos sin textos: lo que necesitan el progreso y la casa (tipo, mundo y comida favorita). Los textos los añade `friends.ts`, que registra la zona diferida `amigos` y solo cargan las pantallas que los enseñan. */
export type FriendFood = "apple" | "acorn" | "flower";
export type FriendDatos = { kind: Enemy["kind"]; world: number; favoriteFood: FriendFood };

export const MAX_HEARTS = 5;

/** Amigos tal como se declaran: sin textos. Nombre, si muerde y consejo salen del catálogo (`amigos.<tipo>.nombre.rotulo`, `.muerde.juntos`, `.consejo.juntos`). */
export const friendData: FriendDatos[] = [
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
