import { GRAVITY, JUMP_SPEED } from "./gameplay.ts";
import type { Level, Platform } from "./types";

/** Saltos de Noa: distancia horizontal que cubre el salto simple y el doble, y altura del doble salto. */
export const SINGLE_JUMP_REACH = 190;
export const DOUBLE_JUMP_REACH = 310;
export const DOUBLE_JUMP_RISE = (JUMP_SPEED ** 2 + (JUMP_SPEED * .94) ** 2) / (2 * GRAVITY);

/** Las 45 pantallas de campaña: mundos 1–6 y 9–17 (sin acuáticas, reino secreto ni desvíos). */
export const isCampaignScreen = (level: Level) => level.world !== 7 && level.world !== 8 && !level.detour;

const isGround = (platform: Platform) => platform.y === 456 && (platform.kind ?? "ground").endsWith("ground");
const isWall = (platform: Platform) => (platform.kind ?? "").endsWith("wall") || platform.kind === "puzzle-block";

/** Longitud del recorrido: x hasta la meta en horizontal, altura subida hasta la meta en vertical. */
export function routeLength(level: Level): number {
  return level.orientation === "vertical" ? level.start.y - (level.goalY ?? 0) : level.goalX - level.start.x;
}

/** Problemas de los tramos de una pantalla (vacío si están bien). La presentación ocupa ~30 % en la pantalla 1
 * y ~10 % en la 2 y la 3; el giro empieza hacia el 55 % y el remate, corto, hacia el 80 %. */
export function beatProblems(level: Level): string[] {
  const beats = level.beats;
  if (!beats) return ["sin tramos"];
  if (level.orientation === "explore") {
    // En una exploración el desarrollo y el giro están en sus gatitos y el remate es la vuelta a la puerta.
    const kitten = (beat: string) => level.lostKittens?.find((k) => k.beat === beat)?.x;
    return beats.development === kitten("development") && beats.twist === kitten("twist") && beats.finale === level.exploreGate?.x
      ? [] : ["los tramos de la exploración son sus gatitos y la puerta"];
  }
  if (level.chase) {
    // En una persecución cada tramo empieza en su primera parada.
    const first = (beat: string) => level.chase!.stops.find((stop) => stop.beat === beat)?.x;
    return beats.development === first("development") && beats.twist === first("twist") && beats.finale === first("finale")
      ? [] : ["cada tramo de la persecución debe empezar en su primera parada"];
  }
  if (level.puzzleRooms) {
    // En una sala-rompecabezas cada tramo es una sala: los tramos empiezan donde empieza cada sala.
    const rooms = level.puzzleRooms.map((room) => room.x);
    return rooms.length === 4 && beats.development === rooms[1] && beats.twist === rooms[2] && beats.finale === rooms[3]
      ? [] : ["cada tramo de la sala-rompecabezas debe empezar en su sala (cuatro salas)"];
  }
  const length = routeLength(level);
  const share = (value: number) => value / length;
  const problems: string[] = [];
  if (!(beats.development > 0 && beats.development < beats.twist && beats.twist < beats.finale && beats.finale < length)) {
    problems.push("los tramos deben ir en orden dentro del recorrido");
  }
  const [low, high] = level.screen === 1 ? [.2, .4] : [.05, .2];
  if (share(beats.development) < low || share(beats.development) > high) problems.push(`la presentación debe ocupar entre ${low * 100} y ${high * 100} %`);
  if (share(beats.twist) < .45 || share(beats.twist) > .68) problems.push("el giro debe empezar hacia el 55 %");
  if (share(beats.finale) < .72 || share(beats.finale) > .9) problems.push("el remate debe empezar hacia el 80 % y ser corto");
  return problems;
}

/** Huecos entre tramos de suelo de una pantalla horizontal: x de inicio y ancho. */
export function groundGaps(level: Level): Array<{ x: number; width: number }> {
  const floor = level.platforms.filter(isGround).sort((a, b) => a.x - b.x);
  const gaps: Array<{ x: number; width: number }> = [];
  let reach = floor[0]?.x ?? 0;
  for (const platform of floor) {
    if (platform.x > reach) gaps.push({ x: reach, width: platform.x - reach });
    reach = Math.max(reach, platform.x + platform.width);
  }
  return gaps;
}

/** Salientes: plataformas que no son suelo ni pared (ramas, repisas, barcos, nubes…). */
export const ledgesOf = (level: Level) => level.platforms.filter((platform) => !isGround(platform) && !isWall(platform));

const countShared = <T>(left: T[], right: T[], same: (a: T, b: T) => boolean) =>
  left.filter((a) => right.some((b) => same(a, b))).length;

/** Parecido entre dos pantallas horizontales: parte de huecos y salientes compartidos, contada sobre la pantalla
 * que tiene más (así dos pantallas con pocos huecos no parecen copias por casualidad), y si los checkpoints son
 * idénticos. Un hueco se comparte a menos de 60 px en x y en ancho; un saliente, a menos de 80 px en x y 40 en y. */
export function similarity(a: Level, b: Level) {
  const gapsA = groundGaps(a);
  const gapsB = groundGaps(b);
  const ledgesA = ledgesOf(a);
  const ledgesB = ledgesOf(b);
  const shared = countShared(gapsA, gapsB, (p, q) => Math.abs(p.x - q.x) < 60 && Math.abs(p.width - q.width) < 60)
    + countShared(ledgesA, ledgesB, (p, q) => Math.abs(p.x - q.x) < 80 && Math.abs(p.y - q.y) < 40);
  const total = Math.max(gapsA.length, gapsB.length) + Math.max(ledgesA.length, ledgesB.length);
  return {
    shared: total ? shared / total : 0,
    checkpoints: a.checkpoints.length > 0 && a.checkpoints.join() === b.checkpoints.join(),
  };
}

/** Una pantalla copia a otra si comparte la mitad o más de sus huecos y salientes, o los mismos checkpoints. */
export function isCopy(a: Level, b: Level): boolean {
  const s = similarity(a, b);
  return s.shared >= .5 || s.checkpoints;
}

type Surface = { left: number; right: number; top: number };

/** ¿Se llega de `from` a `to` (x) en una pantalla horizontal solo andando y saltando sobre plataformas fijas?
 * Cada salto cubre como mucho 310 px en horizontal y sube como mucho la altura del doble salto. `ignore` quita
 * plataformas del cálculo (por ejemplo, las de la mecánica para comprobar que hace falta); `toTop` exige llegar
 * a una superficie a esa altura o más arriba (para alcanzar algo que flota) y `fromTop` sale de la superficie a esa
 * altura bajo `from`. */
export function reachable(level: Level, options: { from?: number; fromTop?: number; to?: number; toTop?: number; ignore?: (platform: Platform) => boolean } = {}): boolean {
  const from = options.from ?? level.start.x;
  const to = options.to ?? level.goalX;
  const kept = level.platforms.filter((platform) => !options.ignore?.(platform));
  const walls = kept.filter(isWall);
  const touching = (low: Platform, high: Platform) => high !== low && high.x < low.x + low.width && high.x + high.width > low.x
    && Math.abs(high.y + high.height - low.y) <= 6;
  // Paredes apiladas (una puerta con piedra encima) forman una columna: cuenta su parte más alta.
  const columns = walls.map((wall) => {
    let top = wall.y;
    for (let changed = true; changed;) {
      changed = false;
      for (const other of walls) {
        if (other.y < top && other.x < wall.x + wall.width && other.x + other.width > wall.x && Math.abs(other.y + other.height - top) <= 6) {
          top = other.y;
          changed = true;
        }
      }
    }
    return { left: wall.x, right: wall.x + wall.width, top, bottom: wall.y + wall.height };
  });
  const tallOver = (column: typeof columns[number], surfaceTop: number) =>
    column.top < surfaceTop - DOUBLE_JUMP_RISE && column.bottom >= surfaceTop - 10;
  const surfaces: Surface[] = [];
  for (const platform of kept) {
    if (isWall(platform) && walls.some((other) => touching(platform, other))) continue; // cubierta por otra pared
    let pieces: Surface[] = [{ left: platform.x, right: platform.x + platform.width, top: platform.y }];
    if (!isWall(platform)) {
      // Una columna demasiado alta para saltarla corta el suelo en dos.
      for (const column of columns.filter((c) => tallOver(c, platform.y))) {
        pieces = pieces.flatMap((s) => column.left >= s.right || column.right <= s.left ? [s]
          : [{ ...s, right: column.left }, { ...s, left: column.right }].filter((p) => p.right > p.left));
      }
    }
    surfaces.push(...pieces);
  }
  const blocked = (a: Surface, b: Surface) => columns.some((column) => {
    const between = column.left < Math.max(a.left, b.left) && column.right > Math.min(a.right, b.right);
    return between && tallOver(column, Math.min(a.top, b.top));
  });
  const linked = (a: Surface, b: Surface) => {
    const gap = Math.max(0, b.left - a.right, a.left - b.right);
    return gap <= DOUBLE_JUMP_REACH && a.top - b.top <= DOUBLE_JUMP_RISE && !blocked(a, b);
  };
  const startSurfaces = surfaces.filter((s) => s.left <= from && s.right >= from
    && (options.fromTop === undefined ? s.top >= level.start.y : Math.abs(s.top - options.fromTop) <= 2));
  const seen = new Set(startSurfaces);
  const queue = [...startSurfaces];
  while (queue.length) {
    const current = queue.shift()!;
    if (current.left <= to && current.right >= to && current.top <= (options.toTop ?? Infinity)) return true;
    for (const next of surfaces) {
      if (!seen.has(next) && linked(current, next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return false;
}

/** x de cada instancia de la mecánica del mundo en una pantalla (muelles, chorros, saltadores, flores,
 * ráfagas, plataformas al compás, géiseres, cintas, rocío, perritos, lobos dormidos…), ordenadas. */
export function mechanicXs(level: Level): number[] {
  const xs = [
    ...level.platforms.filter((p) => p.kind === "spring" || p.kind === "gift-spring" || p.kind === "dew" || p.beltSpeed).map((p) => p.x),
    ...(level.lavaJets ?? []).map((jet) => jet.x),
    ...(level.waterJumpers ?? []).map((fish) => fish.x),
    ...(level.bloomBridges ?? []).map((bridge) => bridge.x),
    ...(level.windZones ?? []).map((zone) => zone.x),
    ...(level.beatPlatforms ?? []).map((platform) => platform.x),
    ...(level.sandGeysers ?? []).map((geyser) => geyser.x),
    ...(level.updrafts ?? []).map((draft) => draft.x),
    ...(level.chainGuardians ?? []).map((guardian) => guardian.anchorX),
    ...level.enemies.filter((enemy) => enemy.sleepCycle).map((enemy) => enemy.x),
  ];
  return xs.sort((a, b) => a - b);
}

/** ¿Hay suelo seguro bajo `x` y a 150 px a cada lado, sin huecos ni peligros? */
export function safeGroundAround(level: Level, x: number, margin = 150): boolean {
  const left = x - margin;
  const right = x + margin;
  const floor = level.platforms.some((p) => isGround(p) && p.x <= left && p.x + p.width >= right);
  const hazards = [...(level.spikePits ?? []), ...(level.deadlyWater ?? [])];
  return floor && !hazards.some((h) => h.x < right && h.x + h.width > left);
}
