import type { Level, LostKitten, Platform, Rect } from "./types";

/** Distancia a la que el gatito más cercano maúlla, y cada cuánto. */
export const MEOW_DISTANCE = 520;
export const MEOW_EVERY = 3.2;
/** Segundos sin encontrar gatitos tras los que aparece la flecha. */
export const ARROW_AFTER = 20;
export const KITTEN_TOUCH = { x: 44, y: 60 };
/** Altura de cámara: Noa queda al 58 % de la pantalla. */
export const CAMERA_FOCUS = .58;

/** Estado de la exploración en la partida: los gatitos encontrados se conservan al perder una vida y se pierden al
 * salir de la pantalla, porque nunca se guardan en el progreso. */
export type ExploreState = {
  found: string[];
  sinceFind: number;
  meowCooldown: number;
  meowing: { kitten: string; life: number } | null;
  trail: Array<{ x: number; y: number }>;
};

export type ExploreEvent = { kind: "found" | "meow" | "open"; kitten?: LostKitten };

export const createExploreState = (): ExploreState => ({ found: [], sinceFind: 0, meowCooldown: 2, meowing: null, trail: [] });

export const allFound = (level: Level, state: ExploreState) => (level.lostKittens?.length ?? 0) > 0 && state.found.length === level.lostKittens!.length;

const feetOf = (player: Rect) => ({ x: player.x + player.width / 2, y: player.y + player.height });

export function nearestMissing(level: Level, state: ExploreState, player: Rect) {
  const feet = feetOf(player);
  return (level.lostKittens ?? [])
    .filter((kitten) => !state.found.includes(kitten.id))
    .map((kitten) => ({ kitten, distance: Math.hypot(kitten.x - feet.x, kitten.y - feet.y) }))
    .sort((a, b) => a.distance - b.distance)[0];
}

/** Avanza la búsqueda: encuentra gatitos al tocarlos, hace maullar al más cercano y avisa cuando la puerta se
 * abre (al encontrar el tercero). */
export function stepExplore(level: Level, state: ExploreState, player: Rect, delta: number): ExploreEvent[] {
  const events: ExploreEvent[] = [];
  const feet = feetOf(player);
  state.sinceFind += delta;
  state.trail.unshift(feet);
  state.trail.length = Math.min(state.trail.length, 90);
  for (const kitten of level.lostKittens ?? []) {
    if (state.found.includes(kitten.id)) continue;
    if (Math.abs(feet.x - kitten.x) < KITTEN_TOUCH.x && Math.abs(feet.y - kitten.y) < KITTEN_TOUCH.y) {
      state.found.push(kitten.id);
      state.sinceFind = 0;
      events.push({ kind: "found", kitten });
      if (allFound(level, state)) events.push({ kind: "open" });
    }
  }
  state.meowCooldown -= delta;
  if (state.meowing) {
    state.meowing.life -= delta;
    if (state.meowing.life <= 0) state.meowing = null;
  }
  const near = nearestMissing(level, state, player);
  if (near && near.distance < MEOW_DISTANCE && state.meowCooldown <= 0) {
    state.meowCooldown = MEOW_EVERY;
    state.meowing = { kitten: near.kitten.id, life: 1.2 };
    events.push({ kind: "meow", kitten: near.kitten });
  }
  return events;
}

/** Hacia dónde apunta la flecha: al gatito más cercano tras 20 s sin encontrar ninguno, o a la puerta con los tres. */
export function hintTarget(level: Level, state: ExploreState, player: Rect): { x: number; y: number } | null {
  if (allFound(level, state) && level.exploreGate) return { x: level.exploreGate.x + level.exploreGate.width / 2, y: level.exploreGate.y };
  if (state.sinceFind < ARROW_AFTER) return null;
  const near = nearestMissing(level, state, player);
  return near ? { x: near.kitten.x, y: near.kitten.y - 30 } : null;
}

/** Posición de cada gatito encontrado: siguen a Noa por su rastro, uno detrás de otro. */
export const followerPositions = (state: ExploreState) =>
  state.found.map((_, index) => state.trail[Math.min(state.trail.length - 1, 18 + index * 16)] ?? null);

/** ¿Ha llegado Noa a la puerta con los tres gatitos? */
export const reachedGate = (level: Level, state: ExploreState, player: Rect) => {
  const gate = level.exploreGate;
  return Boolean(gate && allFound(level, state) && player.x + player.width > gate.x && player.x < gate.x + gate.width
    && player.y + player.height > gate.y && player.y < gate.y + gate.height);
};

/** Paredes del atajo del remate: cierran el paso hasta tener los tres gatitos. */
export const shortcutWalls = (level: Level, state: ExploreState): Platform[] => allFound(level, state) ? [] : level.exploreShortcut ?? [];

/** Cámara en los dos ejes: sigue a Noa con adelanto hacia donde mira y la deja al 58 % de la altura. */
export function exploreCameraTarget(level: Level, player: Rect & { facing: 1 | -1 }, view: { width: number; height: number }) {
  const width = level.width;
  const height = level.height ?? view.height;
  return {
    x: Math.max(0, Math.min(width - view.width, player.x + player.width / 2 - view.width / 2 + player.facing * 60)),
    y: Math.max(0, Math.min(height - view.height, player.y + player.height / 2 - view.height * CAMERA_FOCUS)),
  };
}
