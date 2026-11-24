import "../textos/zonas/paseos.ts";
import { conTextos } from "../textos/index.ts";
import { levels } from "./levels.ts";
import { REST_STOP_WIDTH, restStopCatalog, type RestStop } from "./restStops.ts";
import type { Enemy, Level, Platform } from "./types";

// Pantallas jugables de los paseos de los amigos. Usan la geometría de la campaña (suelo de la primera pantalla y
// medidas de los enemigos), así que van aparte de restStops.ts y solo se cargan con la partida.

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
  } as unknown as Level, { title: "mapa.pantallaPaseo.titulo.rotulo", subtitle: "mapa.pantallaPaseo.pista.rotulo" });
}

export const restStopLevels: Level[] = restStopCatalog.map(restStopLevel);

export type RestStopFriendConTexto = RestStop["friends"][number] & { line: string };
export type RestStopConTextos = { world: number; friends: RestStopFriendConTexto[]; farewell: string };

/** Paseos con lo que dicen los amigos y el guardián (`paseos.<mundo>.amigos.<tipo>.rotulo`, `paseos.<mundo>.despedida.rotulo`). */
export const restStopTextos: RestStopConTextos[] = restStopCatalog.map((paseo) => conTextos({
  world: paseo.world,
  friends: paseo.friends.map((amigo) => conTextos({ ...amigo }, { line: `paseos.${paseo.world}.amigos.${amigo.kind}.rotulo` }) as RestStopFriendConTexto),
} as RestStopConTextos, { farewell: `paseos.${paseo.world}.despedida.rotulo` }));
export const restStopConTextos = (world: number) => restStopTextos.find((stop) => stop.world === world);
