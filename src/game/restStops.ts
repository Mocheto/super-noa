import { levels } from "./levels.ts";
import type { Enemy, Level, Platform } from "./types";
import { conTextos } from "../textos/index.ts";

/** Paseo de los amigos: pantalla de descanso corta y opcional tras el guardián de un mundo. Sin peligros ni
 * contador: los animales y enemigos del mundo aparecen como amigos que se dejan saludar. */
type RestStopFriendDatos = { kind: Enemy["kind"] };
type RestStopDatos = { world: number; friends: RestStopFriendDatos[] };
export type RestStopFriend = RestStopFriendDatos & { line: string };
export type RestStop = { world: number; friends: RestStopFriend[]; farewell: string };

export const REST_STOP_WIDTH = 2400;
export const GREET_DISTANCE = 140;

/** Catálogo declarativo: un paseo por cada mundo de campaña (1–6 y 9–16), con un amigo de cada tipo de enemigo
 * (como mucho cinco). */
const datosPaseos: RestStopDatos[] = [
  {
    world: 1,
    friends: [
      { kind: "slime" },
      { kind: "beetle" },
      { kind: "cloud" },
    ],
  },
  {
    world: 2,
    friends: [
      { kind: "slime" },
      { kind: "beetle" },
      { kind: "bat" },
      { kind: "cloud" },
    ],
  },
  {
    world: 3,
    friends: [
      { kind: "wolf" },
      { kind: "cloud" },
    ],
  },
  {
    world: 4,
    friends: [
      { kind: "boar" },
      { kind: "bird" },
    ],
  },
  {
    world: 5,
    friends: [
      { kind: "pirate" },
      { kind: "parrot" },
    ],
  },
  {
    world: 6,
    friends: [
      { kind: "skeleton" },
      { kind: "ghost" },
      { kind: "zombie" },
    ],
  },
  {
    world: 9,
    friends: [
      { kind: "baby-t-rex" },
      { kind: "pterodactyl" },
    ],
  },
  {
    world: 10,
    friends: [
      { kind: "baby-dragon" },
      { kind: "fire-salamander" },
      { kind: "flying-dragon" },
    ],
  },
  {
    world: 11,
    friends: [
      { kind: "ant" },
      { kind: "snail" },
      { kind: "bee" },
    ],
  },
  {
    world: 12,
    friends: [
      { kind: "penguin" },
      { kind: "snow-fox" },
      { kind: "snowy-owl" },
    ],
  },
  {
    world: 13,
    friends: [
      { kind: "snow-scout" },
      { kind: "toy-reindeer" },
      { kind: "toy-elf" },
      { kind: "toy-robot" },
      { kind: "gift-gnome" },
    ],
  },
  {
    world: 14,
    friends: [
      { kind: "desert-scarab" },
      { kind: "fennec" },
      { kind: "tumbleweed" },
    ],
  },
  {
    world: 15,
    friends: [
      { kind: "rolling-suitcase" },
      { kind: "conductor-pigeon" },
      { kind: "clockwork-mouse" },
    ],
  },
  {
    world: 16,
    friends: [
      { kind: "walking-drum" },
      { kind: "note-bird" },
      { kind: "violin-mouse" },
    ],
  },
];

/** Paseos de los amigos. Lo que dicen los amigos y el guardián sale del catálogo (`paseos.<mundo>.amigos.<tipo>.rotulo`, `paseos.<mundo>.despedida.rotulo`). */
export const restStopCatalog: RestStop[] = datosPaseos.map((paseo) => {
  const amigos = paseo.friends.map((amigo) => conTextos(amigo, { line: `paseos.${paseo.world}.amigos.${amigo.kind}.rotulo` }) as RestStopFriend);
  return conTextos({ world: paseo.world, friends: amigos } as RestStop, { farewell: `paseos.${paseo.world}.despedida.rotulo` });
});

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
  return conTextos({
    id: `P-${stop.world}`, world: first.world, screen: 1,
    theme: first.theme, width: REST_STOP_WIDTH, start: { x: 80, y: 398 }, goalX: REST_STOP_WIDTH - 200,
    platforms: [floor], enemies, items: [], rewardBlocks: [], checkpoints: [],
    restStop: stop.world,
  } as unknown as Level, { title: "paseos.titulo.rotulo", subtitle: "paseos.pista.rotulo" });
}

export const restStopLevels: Level[] = restStopCatalog.map(restStopLevel);
export const restStopFor = (world: number) => restStopCatalog.find((stop) => stop.world === world);
export const restStopIndex = (world: number) => restStopCatalog.findIndex((stop) => stop.world === world);
/** El paseo se abre al completar la pantalla 3 del mundo. */
export const restStopUnlocked = (world: number, levelStats: Record<string, { completed?: boolean } | undefined>) =>
  Boolean(levelStats[`${world}-3`]?.completed) && Boolean(restStopFor(world));
export const guardianOf = (world: number) => levels.find((level) => level.world === world && level.boss)?.boss;
