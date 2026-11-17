import type { Level, Platform, PuzzleColor, PuzzleCrate, PuzzleRoom, PuzzleTrigger, Rect } from "./types";

export const ROOM_WIDTH = 960;
export const CRATE_SIZE = 64;
export const CRATE_PUSH_SPEED = 120;
/** Velocidad del cajón que resbala sobre el hielo tras un empujón. */
export const CRATE_SLIDE_SPEED = 260;
/** Altura del pedestal de los botones: hay que subirse de un salto para pisarlos. */
export const BUTTON_STEP = 24;
/** Segundos sin avanzar tras los que «Empezar la sala» late para recordarse. */
export const RESTART_HINT_SECONDS = 45;

export type CrateState = PuzzleCrate & { room: number; vx: number };

/** Estado de las salas durante una partida. No se guarda en el progreso: cada sala es su propio punto de control. */
export type PuzzleState = {
  room: number;
  pressedPaws: Set<string>;
  color: PuzzleColor[];
  crates: CrateState[];
  openDoors: Set<string>;
  lastProgress: number;
};

const roomCrates = (room: PuzzleRoom, index: number): CrateState[] => (room.crates ?? []).map((crate) => ({ ...crate, room: index, vx: 0 }));

export function createPuzzleState(level: Level): PuzzleState {
  const rooms = level.puzzleRooms ?? [];
  return {
    room: 0,
    pressedPaws: new Set(),
    color: rooms.map((room) => room.startColor ?? "pink"),
    crates: rooms.flatMap(roomCrates),
    openDoors: new Set(),
    lastProgress: 0,
  };
}

/** Vuelve a dejar una sala como al entrar: botones, color y cajones. */
export function resetRoom(level: Level, state: PuzzleState, index: number, now = 0) {
  const room = level.puzzleRooms?.[index];
  if (!room) return;
  for (const trigger of room.triggers) state.pressedPaws.delete(trigger.id);
  state.color[index] = room.startColor ?? "pink";
  state.crates = [...state.crates.filter((crate) => crate.room !== index), ...roomCrates(room, index)];
  state.openDoors = doorsOpen(level, state, null);
  state.lastProgress = now;
}

export const roomIndexAt = (level: Level, x: number) => {
  const rooms = level.puzzleRooms ?? [];
  let index = 0;
  rooms.forEach((room, i) => { if (x >= room.x) index = i; });
  return index;
};

const crateRect = (crate: PuzzleCrate): Rect => ({ x: crate.x, y: crate.y - CRATE_SIZE, width: CRATE_SIZE, height: CRATE_SIZE });
const overlapsX = (a: Rect, left: number, right: number) => a.x + a.width > left && a.x < right;

/** Rectángulo del botón (huella o color): un pedestal bajo que se pisa desde arriba. */
export const buttonRect = (trigger: PuzzleTrigger): Rect => ({ x: trigger.x, y: trigger.y - BUTTON_STEP, width: trigger.width, height: BUTTON_STEP });

/** ¿Pesa algo sobre la placa? Noa de pie encima o un cajón que la pisa. */
export function plateWeighed(trigger: PuzzleTrigger, crates: readonly CrateState[], player: (Rect & { grounded: boolean }) | null) {
  const onPlate = (box: Rect) => overlapsX(box, trigger.x + 8, trigger.x + trigger.width - 8) && Math.abs(box.y + box.height - trigger.y) < 6;
  return crates.some((crate) => onPlate(crateRect(crate))) || Boolean(player?.grounded && onPlate(player));
}

/** Puertas abiertas ahora mismo: las de un botón de huella pulsado o una placa con peso. Las puertas de salida
 * de las salas ya superadas se cierran detrás de Noa. */
export function doorsOpen(level: Level, state: PuzzleState, player: (Rect & { grounded: boolean }) | null): Set<string> {
  const open = new Set<string>();
  (level.puzzleRooms ?? []).forEach((room, index) => {
    for (const trigger of room.triggers) {
      if (!trigger.opens) continue;
      const active = trigger.kind === "paw" ? state.pressedPaws.has(trigger.id)
        : trigger.kind === "plate" ? plateWeighed(trigger, state.crates.filter((crate) => crate.room === index), player) : false;
      if (active) open.add(trigger.opens);
    }
    if (index < state.room) open.delete(room.exitDoor);
  });
  return open;
}

/** Plataformas que añaden las salas: puertas cerradas y cajones (sólidos), pedestales de botones y plataformas
 * del color activo (se pisan). */
export function puzzlePlatforms(level: Level, state: PuzzleState): Platform[] {
  const out: Platform[] = [];
  (level.puzzleRooms ?? []).forEach((room, index) => {
    for (const door of room.doors) if (!state.openDoors.has(door.id)) out.push({ x: door.x, y: door.y, width: door.width, height: door.height, kind: "puzzle-block" });
    for (const trigger of room.triggers) if (trigger.kind !== "plate") out.push({ ...buttonRect(trigger), kind: "puzzle-block" });
    for (const platform of room.colorPlatforms ?? []) {
      if (platform.color === state.color[index]) out.push({ x: platform.x, y: platform.y, width: platform.width, height: platform.height, kind: "puzzle-color" });
    }
  });
  for (const crate of state.crates) out.push({ ...crateRect(crate), kind: "puzzle-block" });
  return out;
}

/** Noa empuja un cajón al andar contra él por el suelo: el cajón avanza como mucho a 120 px/s y se para en sus
 * topes; no se puede tirar de él. Devuelve la x de Noa después del empuje. */
export function pushCrates(state: PuzzleState, player: Rect, previousX: number, nextX: number, delta: number, now = 0): number {
  const moving = nextX - previousX;
  if (moving === 0) return nextX;
  for (const crate of state.crates) {
    const box = crateRect(crate);
    const sameFloor = Math.abs(player.y + player.height - crate.y) < 4;
    if (!sameFloor) continue;
    const touching = moving > 0
      ? previousX + player.width <= box.x + 1 && nextX + player.width > box.x
      : previousX >= box.x + box.width - 1 && nextX < box.x + box.width;
    if (!touching) continue;
    if (crate.slides) {
      // En el hielo basta un empujón: el cajón sale resbalando y Noa se queda donde estaba.
      const at = crate.x;
      if ((moving > 0 && crate.x < crate.maxX) || (moving < 0 && crate.x > crate.minX)) {
        crate.vx = Math.sign(moving) * CRATE_SLIDE_SPEED;
        state.lastProgress = now;
      }
      return moving > 0 ? at - player.width : at + CRATE_SIZE;
    }
    const step = Math.sign(moving) * Math.min(Math.abs(moving), CRATE_PUSH_SPEED * delta);
    const before = crate.x;
    crate.x = Math.max(crate.minX, Math.min(crate.maxX, crate.x + step));
    if (crate.x !== before) state.lastProgress = now;
    return moving > 0 ? crate.x - player.width : crate.x + CRATE_SIZE;
  }
  return nextX;
}

/** Mueve los cajones que resbalan. Se paran en sus topes, contra otro cajón de la misma sala o contra Noa.
 * Devuelve los que se acaban de parar (para el sonido). */
export function slideCrates(state: PuzzleState, delta: number, player: Rect | null): CrateState[] {
  const stopped: CrateState[] = [];
  for (const crate of state.crates) {
    if (!crate.vx) continue;
    let next = Math.max(crate.minX, Math.min(crate.maxX, crate.x + crate.vx * delta));
    let stop = next === crate.minX || next === crate.maxX;
    const obstacles: Rect[] = state.crates.filter((other) => other !== crate && other.room === crate.room && other.y === crate.y).map(crateRect);
    if (player && Math.abs(player.y + player.height - crate.y) < CRATE_SIZE) obstacles.push(player);
    for (const box of obstacles) {
      if (crate.vx > 0 && box.x >= crate.x + CRATE_SIZE - 1 && next + CRATE_SIZE > box.x) {
        next = box.x - CRATE_SIZE;
        stop = true;
      } else if (crate.vx < 0 && box.x + box.width <= crate.x + 1 && next < box.x + box.width) {
        next = box.x + box.width;
        stop = true;
      }
    }
    crate.x = next;
    if (stop) {
      crate.vx = 0;
      stopped.push(crate);
    }
  }
  return stopped;
}

export type PuzzleEvent = { kind: "paw" | "color" | "door"; id: string; from: { x: number; y: number }; to?: { x: number; y: number } };

/** Activa los botones que Noa pisa al aterrizar y recalcula las puertas. Devuelve lo que ha cambiado para el
 * sonido y las chispas. */
export function stepTriggers(level: Level, state: PuzzleState, player: Rect & { grounded: boolean }, landedNow: boolean, now: number): PuzzleEvent[] {
  const events: PuzzleEvent[] = [];
  const rooms = level.puzzleRooms ?? [];
  const room = rooms[state.room];
  if (room && player.grounded) {
    for (const trigger of room.triggers) {
      if (trigger.kind === "plate") continue;
      const top = buttonRect(trigger);
      const standing = overlapsX(player, top.x + 4, top.x + top.width - 4) && Math.abs(player.y + player.height - top.y) < 6;
      if (!standing) continue;
      if (trigger.kind === "paw" && !state.pressedPaws.has(trigger.id)) {
        state.pressedPaws.add(trigger.id);
        events.push({ kind: "paw", id: trigger.id, from: { x: trigger.x + trigger.width / 2, y: top.y } });
      } else if (trigger.kind === "color" && trigger.color && landedNow && state.color[state.room] !== trigger.color) {
        state.color[state.room] = trigger.color;
        events.push({ kind: "color", id: trigger.id, from: { x: trigger.x + trigger.width / 2, y: top.y } });
      }
    }
  }
  const before = state.openDoors;
  state.openDoors = doorsOpen(level, state, player);
  for (const id of state.openDoors) {
    if (before.has(id)) continue;
    const door = rooms.flatMap((r) => r.doors).find((d) => d.id === id);
    const trigger = rooms.flatMap((r) => r.triggers).find((t) => t.opens === id);
    if (door && trigger) events.push({ kind: "door", id, from: { x: trigger.x + trigger.width / 2, y: trigger.y - 20 }, to: { x: door.x + door.width / 2, y: door.y + 40 } });
  }
  if (events.length) state.lastProgress = now;
  return events;
}

/** Pasa a la sala siguiente cuando Noa cruza la puerta de salida; la puerta se cierra detrás. */
export function advanceRoom(level: Level, state: PuzzleState, playerX: number, now: number): boolean {
  const room = level.puzzleRooms?.[state.room];
  const exit = room?.doors.find((door) => door.id === room.exitDoor);
  if (!room || !exit || state.room >= (level.puzzleRooms?.length ?? 0) - 1 || playerX < exit.x + exit.width + 4) return false;
  state.room += 1;
  state.lastProgress = now;
  state.openDoors = doorsOpen(level, state, null);
  return true;
}

export const restartHintActive = (state: PuzzleState, now: number) => now - state.lastProgress >= RESTART_HINT_SECONDS;

/** Pantalla equivalente a una sala en un estado dado, para comprobar con `reachable` qué se alcanza: suelo y
 * paredes de la sala, puertas cerradas, pedestales, cajones y las plataformas del color activo. */
export function roomReachLevel(level: Level, index: number, setup: { open: ReadonlySet<string>; color: PuzzleColor; crates?: readonly CrateState[] }): Level {
  const room = level.puzzleRooms![index];
  const left = room.x;
  const right = room.x + ROOM_WIDTH;
  const inside = level.platforms
    .filter((p) => p.x < right && p.x + p.width > left)
    .map((p) => ({ ...p, x: Math.max(p.x, left), width: Math.min(p.x + p.width, right) - Math.max(p.x, left) }));
  const state: PuzzleState = {
    room: index, pressedPaws: new Set(), color: level.puzzleRooms!.map((_, i) => i === index ? setup.color : "pink"),
    crates: [...(setup.crates ?? roomCrates(room, index))], openDoors: new Set(setup.open), lastProgress: 0,
  };
  const only = { ...level, puzzleRooms: level.puzzleRooms!.map((r, i) => i === index ? r : { ...r, triggers: [], doors: [], colorPlatforms: [] }) };
  const exit = room.doors.find((door) => door.id === room.exitDoor)!;
  const last = index === level.puzzleRooms!.length - 1;
  return {
    ...level,
    platforms: [...inside, ...puzzlePlatforms(only, state).filter((p) => p.x < right && p.x + p.width > left)],
    start: room.entry,
    goalX: last ? level.goalX : exit.x + exit.width + 30,
  };
}
