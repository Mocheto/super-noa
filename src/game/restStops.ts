import { levels } from "./levels.ts";
import type { Enemy, Level, Platform } from "./types";

/** Paseo de los amigos: pantalla de descanso corta y opcional tras el guardián de un mundo. Sin peligros ni
 * contador: los animales y enemigos del mundo aparecen como amigos que se dejan saludar. */
export type RestStopFriend = { kind: Enemy["kind"]; line: string };
export type RestStop = { world: number; friends: RestStopFriend[]; farewell: string };

export const REST_STOP_WIDTH = 2400;
export const GREET_DISTANCE = 140;

/** Catálogo declarativo: un paseo por cada mundo de campaña (1–6 y 9–16), con un amigo de cada tipo de enemigo
 * (como mucho cinco). */
export const restStopCatalog: RestStop[] = [
  {
    world: 1,
    friends: [
      { kind: "slime", line: "¡Soy blandita y saltarina!" },
      { kind: "beetle", line: "¡Me encanta brillar al sol!" },
      { kind: "cloud", line: "¡Floto como un algodón!" },
    ],
    farewell: "¡Gracias por la visita, Noa!",
  },
  {
    world: 2,
    friends: [
      { kind: "slime", line: "¡En la cueva estoy fresquita!" },
      { kind: "beetle", line: "¡Mis alas brillan en la niebla!" },
      { kind: "bat", line: "¡Duermo boca abajo, ji, ji!" },
      { kind: "cloud", line: "¡La niebla y yo somos primas!" },
    ],
    farewell: "¡Vuelve pronto a la gruta!",
  },
  {
    world: 3,
    friends: [
      { kind: "wolf", line: "¡Ya me he echado la siesta!" },
      { kind: "cloud", line: "¡Soy la nube de la luna!" },
    ],
    farewell: "¡Auuu! ¡Hasta pronto, Noa!",
  },
  {
    world: 4,
    friends: [
      { kind: "boar", line: "¡Me encantan las bellotas!" },
      { kind: "bird", line: "¡Pío, pío, qué bien saltas!" },
    ],
    farewell: "¡Ven a merendar otro día!",
  },
  {
    world: 5,
    friends: [
      { kind: "pirate", line: "¡Ahoy! ¡Soy un pirata bueno!" },
      { kind: "parrot", line: "¡Cra, cra, hola, Noa!" },
    ],
    farewell: "¡Buen viento, marinera!",
  },
  {
    world: 6,
    friends: [
      { kind: "skeleton", line: "¡Mis huesos hacen clac, clac!" },
      { kind: "ghost", line: "¡Buuu! ¿Te he asustado?" },
      { kind: "zombie", line: "¡Solo quiero un abrazo!" },
    ],
    farewell: "¡Vuelve a mi castillo!",
  },
  {
    world: 9,
    friends: [
      { kind: "baby-t-rex", line: "¡Mis bracitos son cortitos!" },
      { kind: "pterodactyl", line: "¡Vuelo sobre la isla!" },
    ],
    farewell: "¡Hasta pronto, pequeña!",
  },
  {
    world: 10,
    friends: [
      { kind: "baby-dragon", line: "¡Echo humito, no fuego!" },
      { kind: "fire-salamander", line: "¡La lava me da calorcito!" },
      { kind: "flying-dragon", line: "¡Me encanta volar alto!" },
    ],
    farewell: "¡Vuelve a mi volcán!",
  },
  {
    world: 11,
    friends: [
      { kind: "ant", line: "¡Llevo hojas muy grandes!" },
      { kind: "snail", line: "¡Voy despacito, despacito!" },
      { kind: "bee", line: "¡Bzz! ¡Hago miel dulce!" },
    ],
    farewell: "¡Gracias por tu visita!",
  },
  {
    world: 12,
    friends: [
      { kind: "penguin", line: "¡Me deslizo con la tripa!" },
      { kind: "snow-fox", line: "¡Mi cola es muy calentita!" },
      { kind: "snowy-owl", line: "¡Uh, uh! ¡Veo de noche!" },
    ],
    farewell: "¡Abrígate bien, Noa!",
  },
  {
    world: 13,
    friends: [
      { kind: "snow-scout", line: "¡Hago muñecos de nieve!" },
      { kind: "toy-reindeer", line: "¡Tiro del trineo!" },
      { kind: "toy-elf", line: "¡Envuelvo los regalos!" },
      { kind: "toy-robot", line: "¡Bip, bip, soy tu amigo!" },
      { kind: "gift-gnome", line: "¡Guardo los regalos!" },
    ],
    farewell: "¡Feliz Navidad, Noa!",
  },
  {
    world: 14,
    friends: [
      { kind: "desert-scarab", line: "¡Ruedo bolitas de arena!" },
      { kind: "fennec", line: "¡Mis orejas lo oyen todo!" },
      { kind: "tumbleweed", line: "¡Ruedo con el viento!" },
    ],
    farewell: "¡Que el viento te acompañe!",
  },
  {
    world: 15,
    friends: [
      { kind: "rolling-suitcase", line: "¡Llevo calcetines dentro!" },
      { kind: "conductor-pigeon", line: "¡Pasajeros, al tren!" },
      { kind: "clockwork-mouse", line: "¡Cric, cric, tengo cuerda!" },
    ],
    farewell: "¡Buen viaje, Noa!",
  },
  {
    world: 16,
    friends: [
      { kind: "walking-drum", line: "¡Pom, pom, pom!" },
      { kind: "note-bird", line: "¡Canto todas las notas!" },
      { kind: "violin-mouse", line: "¡Toco el violín!" },
    ],
    farewell: "¡Bravo, bravo, Noa!",
  },
];

/** Plantilla de cada amigo: sus medidas y su altura salen de un enemigo de ese tipo en la campaña. */
function template(world: number, kind: Enemy["kind"]): Enemy | undefined {
  return levels.filter((level) => level.world === world).flatMap((level) => level.enemies).find((enemy) => enemy.kind === kind);
}

/** Pantalla jugable del paseo de un mundo: el fondo y el suelo de su primera pantalla, suelo continuo, los amigos
 * repartidos y el guardián esperando al final. */
export function restStopLevel(stop: RestStop): Level {
  const first = levels.find((level) => level.world === stop.world && level.screen === 1)!;
  const groundKind = first.platforms.find((platform) => platform.y === 456 && (platform.kind ?? "ground").endsWith("ground"))?.kind ?? "ground";
  const floor: Platform = { x: 0, y: 456, width: REST_STOP_WIDTH, height: 120, kind: groundKind };
  const enemies: Enemy[] = stop.friends.map((friend, index) => {
    const base = template(stop.world, friend.kind);
    const x = 600 + index * Math.round(1300 / Math.max(1, stop.friends.length - 1 || 1));
    const width = base?.width ?? 42;
    const height = base?.height ?? 36;
    const y = base && base.y + base.height < 456 && base.y < 300 ? base.y : 456 - height;
    return { id: `amigo-${stop.world}-${index}`, kind: friend.kind, x, y, width, height, minX: x, maxX: x, speed: 0 };
  });
  return {
    id: `P-${stop.world}`, world: first.world, screen: 1,
    title: "El paseo de los amigos", subtitle: "Saluda a los amigos del mundo: aquí nadie muerde.",
    theme: first.theme, width: REST_STOP_WIDTH, start: { x: 80, y: 398 }, goalX: REST_STOP_WIDTH - 200,
    platforms: [floor], enemies, items: [], rewardBlocks: [], checkpoints: [],
    restStop: stop.world,
  };
}

export const restStopLevels: Level[] = restStopCatalog.map(restStopLevel);
export const restStopFor = (world: number) => restStopCatalog.find((stop) => stop.world === world);
export const restStopIndex = (world: number) => restStopCatalog.findIndex((stop) => stop.world === world);
/** El paseo se abre al completar la pantalla 3 del mundo. */
export const restStopUnlocked = (world: number, levelStats: Record<string, { completed?: boolean } | undefined>) =>
  Boolean(levelStats[`${world}-3`]?.completed) && Boolean(restStopFor(world));
export const guardianOf = (world: number) => levels.find((level) => level.world === world && level.boss)?.boss;
