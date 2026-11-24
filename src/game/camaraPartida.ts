/**
 * Cámara y meta de la partida como funciones puras (corte 1 de «Mapear el bucle de GameCanvas para sacar la física a un
 * módulo puro»). Sin efectos ni estado: `GameCanvas` guarda la cámara y llama a estas funciones en cada paso.
 */
import { VIEW_HEIGHT, VIEW_WIDTH } from "./constants.ts";
import { exploreCameraTarget } from "./explore.ts";
import { hasReachedGoalFlag } from "./gameplay.ts";
import type { Player } from "./gameState.ts";
import type { Level } from "./types";

export type Camara = { x: number; y: number };

/** Altura del suelo de la meta: la plataforma bajo `goalX` (la más alta en el mundo 8 y en vertical). */
export function superficieMeta(level: Level): number {
  const debajo = level.platforms.filter((platform) => level.goalX >= platform.x && level.goalX <= platform.x + platform.width);
  return level.world === 8 || level.orientation === "vertical"
    ? Math.min(...debajo.map((platform) => platform.y))
    : debajo[0]?.y ?? 456;
}

/** Si Noa ha llegado a la meta: en vertical, a la altura de la cima y a menos de 130 px del banderín; si no, el banderín. */
export function metaAlcanzada(level: Level, player: Player, goalSurfaceY: number): boolean {
  return level.orientation === "vertical"
    ? player.y <= (level.goalY ?? goalSurfaceY) && Math.abs(player.x + player.width / 2 - level.goalX) < 130
    : hasReachedGoalFlag(player, level.goalX, goalSurfaceY);
}

/** Altura a la que la cámara vertical quiere estar para ver a Noa a 250 px del borde de arriba. */
export const encuadreVertical = (level: Level, y: number) => Math.max(0, Math.min((level.height ?? VIEW_HEIGHT) - VIEW_HEIGHT, y - 250));

/** Cámara al empezar: abajo del todo en vertical, sobre Noa en exploración y arriba en el resto. */
export function camaraInicial(level: Level, player: Player): Camara {
  return {
    x: 0,
    y: level.orientation === "vertical" ? Math.max(0, (level.height ?? VIEW_HEIGHT) - VIEW_HEIGHT)
      : level.orientation === "explore" ? exploreCameraTarget(level, player, { width: VIEW_WIDTH, height: VIEW_HEIGHT }).y : 0,
  };
}

/**
 * Un paso de la cámara. En exploración sigue a Noa en los dos ejes; en una sala queda fija en la sala (`salaX`) y se
 * desliza rápido al cambiar; si no, sigue a Noa 330 px por detrás. En vertical, además, solo sube.
 */
export function seguirCamara(level: Level, player: Player, camara: Camara, delta: number, opciones: { salaX: number | null; exploracion: boolean }): Camara {
  let { x, y } = camara;
  if (opciones.exploracion) {
    const target = exploreCameraTarget(level, player, { width: VIEW_WIDTH, height: VIEW_HEIGHT });
    x += (target.x - x) * Math.min(1, delta * 9);
    y += (target.y - y) * Math.min(1, delta * 7);
  } else {
    const objetivo = opciones.salaX ?? player.x - 330;
    x += (Math.max(0, Math.min(level.width - VIEW_WIDTH, objetivo)) - x) * Math.min(1, delta * (opciones.salaX !== null ? 9 : 5));
  }
  if (level.orientation === "vertical") y = Math.min(y, y + (encuadreVertical(level, player.y) - y) * Math.min(1, delta * 5));
  return { x, y };
}

/** Al reaparecer en vertical por debajo de la vista, la cámara baja a buscarla (si no, seguiría «cayendo» en cada paso). */
export function camaraAlReaparecer(level: Level, player: Player, camaraY: number): number {
  return level.orientation === "vertical" && player.y + player.height > camaraY + VIEW_HEIGHT ? encuadreVertical(level, player.y) : camaraY;
}
