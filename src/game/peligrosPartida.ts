/**
 * Peligros y puntos seguros de la partida como consultas puras (corte 4 de «Mapear el bucle de GameCanvas para sacar
 * la física a un módulo puro»). Solo responden; reaparecer, hacer daño, sonar y avisar se quedan en `GameCanvas`.
 */
import { VIEW_HEIGHT } from "./constants.ts";
import { rectanglesOverlap } from "./gameplay.ts";
import { lavaJetState, type Player } from "./gameState.ts";
import type { Level } from "./types";

/** Pinchos o agua mortal: se reaparece en el acto. Los márgenes perdonan rozar el borde (8/16 px los pinchos, 5/8 px el agua). */
export function peligroMortal(level: Level, player: Player): "pinchos" | "agua" | null {
  if (level.spikePits?.some((pit) => rectanglesOverlap(player, { x: pit.x + 8, y: pit.y + 16, width: pit.width - 16, height: pit.height }))) return "pinchos";
  if (level.deadlyWater?.some((zone) => rectanglesOverlap(player, { x: zone.x + 5, y: zone.y + 8, width: zone.width - 10, height: zone.height }))) return "agua";
  return null;
}

/** Un chorro de lava hace daño mientras asoma más del 12 %. */
export const tocaLava = (level: Level, player: Player, levelAge: number) => Boolean(level.lavaJets?.some((jet) => {
  const state = lavaJetState(jet, levelAge);
  return state.extension > .12 && rectanglesOverlap(player, state.rect);
}));

/** Se ha caído: en vertical, 100 px por debajo de la vista; en exploración, 80 px bajo el mundo; si no, 120 px bajo la pantalla. */
export function seCayo(level: Level, player: Player, cameraY: number, exploracion: boolean): boolean {
  return player.y > (level.orientation === "vertical" ? cameraY + VIEW_HEIGHT + 100 : exploracion ? (level.height ?? VIEW_HEIGHT) + 80 : VIEW_HEIGHT + 120);
}

export type PuntoSeguro =
  | { tipo: "bandera"; indice: number; x: number }
  | { tipo: "vertical"; indice: number; x: number; y: number };

/**
 * Puntos seguros que Noa alcanza en este paso, en orden, con dónde reaparecerá desde cada uno. Primero las banderas (al
 * pasar su `x`) y luego los puntos verticales: en exploración, de pie a menos de 70 × 8 px; en las subidas, al llegar a
 * su altura. Solo cuentan los posteriores al último alcanzado, que se va actualizando entre uno y otro.
 */
export function puntosSegurosAlcanzados(level: Level, player: Player, checkpointIndex: number, exploracion: boolean): PuntoSeguro[] {
  const alcanzados: PuntoSeguro[] = [];
  let ultimo = checkpointIndex;
  level.checkpoints.forEach((checkpoint, index) => {
    if (index > ultimo && player.x >= checkpoint) {
      ultimo = index;
      alcanzados.push({ tipo: "bandera", indice: index, x: checkpoint + 22 });
    }
  });
  level.verticalCheckpoints?.forEach((checkpoint, index) => {
    const reached = exploracion
      ? player.grounded && Math.abs(player.x + player.width / 2 - checkpoint.x - 21) < 70 && Math.abs(player.y + player.height - checkpoint.y) < 8
      : player.y <= checkpoint.y;
    if (index > ultimo && reached) {
      ultimo = index;
      alcanzados.push({ tipo: "vertical", indice: index, x: checkpoint.x, y: checkpoint.y - player.height });
    }
  });
  return alcanzados;
}
