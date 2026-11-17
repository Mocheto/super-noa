import type { Chase, ChaseRunner, Level, Rect } from "./types";

export const CHASE_SPEED = 330;
export const CHASE_WAIT_RADIUS = { x: 230, y: 150 };
/** Segundos entre las frases del animal mientras espera. */
export const CHASE_TALK_EVERY = 6;
export const CHASE_ARC = 90;
/** Medidas del animal travieso en pantalla. */
export const RUNNER_SIZE: Record<ChaseRunner, { width: number; height: number }> = {
  beetle: { width: 42, height: 36 }, parrot: { width: 46, height: 32 }, bee: { width: 78, height: 72 }, "clockwork-mouse": { width: 42, height: 36 },
};

/** Estado de la persecución en la partida: no se guarda en el progreso. */
export type ChaseState = {
  stop: number;
  from: { x: number; y: number } | null;
  progress: number;
  x: number;
  y: number;
  waited: number;
  caught: boolean;
  facing: 1 | -1;
};

export type ChaseEvent = { kind: "run" | "talk" | "caught"; text?: string };

export function createChaseState(chase: Chase): ChaseState {
  const first = chase.stops[0];
  return { stop: 0, from: null, progress: 0, x: first.x, y: first.y, waited: 0, caught: false, facing: -1 };
}

/** ¿Está Noa lo bastante cerca para que el animal arranque? */
export function playerClose(chase: Chase, state: ChaseState, player: Rect) {
  const radius = chase.waitRadius ?? CHASE_WAIT_RADIUS;
  return Math.abs(player.x + player.width / 2 - state.x) < radius.x && Math.abs(player.y + player.height - state.y) < radius.y;
}

/** Avanza la persecución. El animal corre en línea o en arco hacia la parada siguiente y allí espera; nunca avanza
 * si Noa no se acerca. En el rincón (la última parada) se le pilla al tocarlo. */
export function stepChase(chase: Chase, state: ChaseState, player: Rect, delta: number): ChaseEvent[] {
  if (state.caught) return [];
  const events: ChaseEvent[] = [];
  const target = chase.stops[state.stop];
  if (state.from) {
    const distance = Math.hypot(target.x - state.from.x, target.y - state.from.y) || 1;
    state.progress = Math.min(1, state.progress + ((chase.speed ?? CHASE_SPEED) * delta) / distance);
    const t = state.progress;
    state.x = state.from.x + (target.x - state.from.x) * t;
    const peak = Math.min(state.from.y, target.y) - CHASE_ARC;
    state.y = target.jump ? (1 - t) ** 2 * state.from.y + 2 * (1 - t) * t * peak + t ** 2 * target.y : state.from.y + (target.y - state.from.y) * t;
    if (t >= 1) {
      state.from = null;
      state.waited = 0;
      state.facing = -1; // mira hacia atrás, a Noa
      events.push({ kind: "talk", text: target.talk });
    }
    return events;
  }
  state.waited += delta;
  const last = state.stop === chase.stops.length - 1;
  if (last) {
    const centre = player.x + player.width / 2;
    if (Math.abs(centre - state.x) < 50 && Math.abs(player.y + player.height - state.y) < 70) {
      state.caught = true;
      events.push({ kind: "caught", text: "¡Toma tu ovillo!" });
    }
  } else if (playerClose(chase, state, player)) {
    state.from = { x: state.x, y: state.y };
    state.progress = 0;
    state.stop += 1;
    state.facing = chase.stops[state.stop].x >= state.x ? 1 : -1;
    events.push({ kind: "run" });
  } else if (state.waited >= CHASE_TALK_EVERY) {
    state.waited = 0;
    events.push({ kind: "talk", text: target.talk });
  }
  return events;
}

/** Puntos del rastro: cuatro marcas desde el animal hacia su parada siguiente (vacío mientras corre o en el rincón). */
export function chaseTrail(chase: Chase, state: ChaseState): Array<{ x: number; y: number }> {
  if (state.from || state.caught || state.stop >= chase.stops.length - 1) return [];
  const next = chase.stops[state.stop + 1];
  return [1, 2, 3, 4].map((k) => {
    const u = k / 5;
    return { x: state.x + (next.x - state.x) * u, y: state.y + (next.y - state.y) * u - (next.jump ? Math.sin(u * Math.PI) * 60 : 0) };
  });
}

/** Rectángulo del animal (para dibujarlo y tocarlo): apoyado sobre su punto y centrado en x. */
export function runnerRect(chase: Chase, state: ChaseState): Rect {
  const size = RUNNER_SIZE[chase.runner];
  return { x: state.x - size.width / 2, y: state.y - size.height, width: size.width, height: size.height };
}

/** goalX de una pantalla de persecución: la x del rincón. */
export const chaseGoalX = (level: Level) => level.chase?.stops.at(-1)?.x ?? level.goalX;
