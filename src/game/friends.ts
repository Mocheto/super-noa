import type { Enemy } from "./types";

/** Pestaña Amigos: ficha de cada animal o enemigo del juego. Los textos son para una niña de cinco años. */
export type FriendFood = "apple" | "acorn" | "flower";
export type FriendEntry = { kind: Enemy["kind"]; world: number; name: string; biteLine: string; tip: string; favoriteFood: FriendFood };

export const MAX_HEARTS = 5;

export const friendCatalog: FriendEntry[] = [
  { kind: "slime", world: 1, name: "Babosa saltarina", biteLine: "No muerde: ¡solo hace cosquillas!", tip: "En su mundo pasea: ¡salta por encima!", favoriteFood: "apple" },
  { kind: "beetle", world: 1, name: "Escarabajo brillante", biteLine: "No muerde, pero empuja un poco.", tip: "Camina de lado a lado: espera y salta.", favoriteFood: "flower" },
  { kind: "cloud", world: 1, name: "Nube viajera", biteLine: "No muerde: ¡es de algodón!", tip: "Flota alta: pasa por debajo.", favoriteFood: "flower" },
  { kind: "bat", world: 2, name: "Murciélago dormilón", biteLine: "No muerde: ¡le da vergüenza!", tip: "Vuela en la cueva: agáchate y pasa.", favoriteFood: "apple" },
  { kind: "wolf", world: 3, name: "Lobo dormilón", biteLine: "Dormido no muerde. ¡Mira los ZZZ!", tip: "Pasa mientras duerme.", favoriteFood: "acorn" },
  { kind: "fish", world: 8, name: "Pececito de coral", biteLine: "No muerde: ¡solo hace burbujas!", tip: "Nada en la laguna: rodéalo.", favoriteFood: "flower" },
  { kind: "urchin", world: 8, name: "Erizo de mar", biteLine: "No muerde, pero pincha.", tip: "No lo toques: nada por encima.", favoriteFood: "flower" },
  { kind: "boar", world: 4, name: "Jabalí glotón", biteLine: "No muerde: ¡solo quiere bellotas!", tip: "Corre si te ve: salta a las copas.", favoriteFood: "acorn" },
  { kind: "bird", world: 4, name: "Pajarito de las copas", biteLine: "No muerde: ¡canta muy bonito!", tip: "Vuela entre las ramas: espera.", favoriteFood: "flower" },
  { kind: "pirate", world: 5, name: "Pirata simpático", biteLine: "No muerde: ¡es un pirata bueno!", tip: "Patrulla el barco: salta sobre él.", favoriteFood: "apple" },
  { kind: "parrot", world: 5, name: "Loro charlatán", biteLine: "No muerde: ¡solo habla mucho!", tip: "Cruza volando: pasa por debajo.", favoriteFood: "apple" },
  { kind: "skeleton", world: 6, name: "Esqueleto bailarín", biteLine: "No muerde: ¡no tiene dientes!", tip: "Camina despacio: salta sobre él.", favoriteFood: "apple" },
  { kind: "ghost", world: 6, name: "Fantasma tímido", biteLine: "No muerde: ¡solo dice buuu!", tip: "Flota: pasa cuando se aleje.", favoriteFood: "flower" },
  { kind: "zombie", world: 6, name: "Zombi dormilón", biteLine: "No muerde: ¡quiere abrazos!", tip: "Es lento: adelántalo saltando.", favoriteFood: "apple" },
  { kind: "baby-t-rex", world: 9, name: "Pequeño t-rex", biteLine: "No muerde: ¡tiene bracitos cortos!", tip: "Corretea: salta sobre él.", favoriteFood: "apple" },
  { kind: "pterodactyl", world: 9, name: "Terodáctilo", biteLine: "No muerde: ¡vuela muy alto!", tip: "Planea: espera a que pase.", favoriteFood: "apple" },
  { kind: "baby-dragon", world: 10, name: "Dragoncito", biteLine: "No muerde: ¡echa humito!", tip: "Pasea: salta sobre él.", favoriteFood: "apple" },
  { kind: "fire-salamander", world: 10, name: "Salamandra de fuego", biteLine: "No muerde, pero está calentita.", tip: "Corre por el suelo: salta.", favoriteFood: "flower" },
  { kind: "flying-dragon", world: 10, name: "Dragón volador", biteLine: "No muerde: ¡le gusta volar!", tip: "Vuela alto: pasa por debajo.", favoriteFood: "apple" },
  { kind: "ant", world: 11, name: "Hormiga gigante", biteLine: "No muerde: ¡lleva hojas!", tip: "Camina despacio: salta.", favoriteFood: "acorn" },
  { kind: "snail", world: 11, name: "Caracol gigante", biteLine: "No muerde: ¡va despacito!", tip: "Es lentísimo: adelántalo.", favoriteFood: "flower" },
  { kind: "bee", world: 11, name: "Abeja gigante", biteLine: "No pica: ¡hace miel!", tip: "Zumba en el aire: espera.", favoriteFood: "flower" },
  { kind: "penguin", world: 12, name: "Pingüino deslizón", biteLine: "No muerde: ¡se desliza!", tip: "Resbala por el hielo: salta.", favoriteFood: "apple" },
  { kind: "snow-fox", world: 12, name: "Zorro de nieve", biteLine: "No muerde: ¡tiene cola calentita!", tip: "Corretea: salta sobre él.", favoriteFood: "apple" },
  { kind: "snowy-owl", world: 12, name: "Búho nival", biteLine: "No muerde: ¡ve de noche!", tip: "Vuela bajito: espera.", favoriteFood: "acorn" },
  { kind: "snow-scout", world: 13, name: "Explorador de nieve", biteLine: "No muerde: ¡hace muñecos!", tip: "Pasea: salta sobre él.", favoriteFood: "apple" },
  { kind: "toy-reindeer", world: 13, name: "Reno de juguete", biteLine: "No muerde: ¡tira del trineo!", tip: "Trota: salta a tiempo.", favoriteFood: "apple" },
  { kind: "winter-robin", world: 13, name: "Petirrojo", biteLine: "No muerde: ¡canta villancicos!", tip: "Vuela: pasa por debajo.", favoriteFood: "acorn" },
  { kind: "toy-bird", world: 13, name: "Pájaro de juguete", biteLine: "No muerde: ¡tiene cuerda!", tip: "Vuela en la fábrica: espera.", favoriteFood: "flower" },
  { kind: "toy-elf", world: 13, name: "Duende juguetero", biteLine: "No muerde: ¡envuelve regalos!", tip: "Corretea: salta sobre él.", favoriteFood: "apple" },
  { kind: "toy-robot", world: 13, name: "Robot de juguete", biteLine: "No muerde: ¡hace bip, bip!", tip: "Camina recto: salta.", favoriteFood: "apple" },
  { kind: "gift-box", world: 13, name: "Caja de regalo", biteLine: "No muerde: ¡tiene sorpresa!", tip: "Da saltitos: espera.", favoriteFood: "flower" },
  { kind: "star-lantern", world: 13, name: "Farolillo estrella", biteLine: "No muerde: ¡da luz!", tip: "Flota: pasa por debajo.", favoriteFood: "flower" },
  { kind: "gift-gnome", world: 13, name: "Gnomo de los regalos", biteLine: "No muerde: ¡guarda regalos!", tip: "Pasea: salta sobre él.", favoriteFood: "acorn" },
  { kind: "desert-scarab", world: 14, name: "Escarabajo del desierto", biteLine: "No muerde: ¡rueda arena!", tip: "Camina: salta sobre él.", favoriteFood: "acorn" },
  { kind: "fennec", world: 14, name: "Fénec orejudo", biteLine: "No muerde: ¡lo oye todo!", tip: "Corre rápido: espera y salta.", favoriteFood: "apple" },
  { kind: "tumbleweed", world: 14, name: "Planta rodadora", biteLine: "No muerde: ¡rueda con el viento!", tip: "Rueda: salta cuando llegue.", favoriteFood: "flower" },
  { kind: "rolling-suitcase", world: 15, name: "Maleta con ruedas", biteLine: "No muerde: ¡lleva calcetines!", tip: "Rueda por el andén: salta.", favoriteFood: "apple" },
  { kind: "conductor-pigeon", world: 15, name: "Paloma revisora", biteLine: "No muerde: ¡pide los billetes!", tip: "Vuela: pasa por debajo.", favoriteFood: "acorn" },
  { kind: "clockwork-mouse", world: 15, name: "Ratón de cuerda", biteLine: "No muerde: ¡tiene cuerda!", tip: "Corre recto: salta sobre él.", favoriteFood: "apple" },
  { kind: "walking-drum", world: 16, name: "Tambor andarín", biteLine: "No muerde: ¡hace pom, pom!", tip: "Camina al compás: salta.", favoriteFood: "flower" },
  { kind: "note-bird", world: 16, name: "Pájaro nota", biteLine: "No muerde: ¡canta notas!", tip: "Vuela: espera y pasa.", favoriteFood: "flower" },
  { kind: "violin-mouse", world: 16, name: "Ratón violinista", biteLine: "No muerde: ¡toca el violín!", tip: "Pasea: salta sobre él.", favoriteFood: "apple" },
  { kind: "puffling", world: 17, name: "Nubecita", biteLine: "No muerde: ¡es muy suave!", tip: "Flota: pasa por un lado.", favoriteFood: "flower" },
  { kind: "sky-unicorn", world: 7, name: "Unicornio del cielo", biteLine: "No muerde: ¡tiene arcoíris!", tip: "Galopa en las nubes: espera.", favoriteFood: "apple" },
];

export const foodNames: Record<FriendFood, string> = { apple: "Manzana", acorn: "Bellota", flower: "Flor" };
