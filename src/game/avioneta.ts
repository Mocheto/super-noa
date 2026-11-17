/** La avioneta de las nubes: minijuego aparte que la Reina Arcoíris regala tras S-1. El cielo avanza solo; la
 * avioneta se mueve a izquierda y derecha y lanza pompas que convierten los nubarrones en nubecitas con estrella.
 * Sin vidas: al chocar da una voltereta y sigue. Lógica pura y determinista (generador con semilla). */

export const SKY_WIDTH = 960;
export const SKY_HEIGHT = 540;
export const PLANE_Y = 440;
export const FLIGHT_SECONDS = 90;
export const POP_COOLDOWN = .12;
export const BUMP_INVULNERABLE = 1.5;

export type RouteEntry =
  | { t: number; kind: "cloud"; x: number }
  | { t: number; kind: "row"; gap: number }
  | { t: number; kind: "bubble"; x: number }
  | { t: number; kind: "friend"; who: "bird" | "unicorn"; y: number; dir: 1 | -1; dive?: number };

/** Cinco carriles: 120, 300, 480, 660 y 840. */
export const lane = (n: number) => 120 + n * 180;

/** Recorrido fijo en cuatro tiempos: presentar, desarrollar, giro (unicornios y filas con hueco) y remate. */
export const FLIGHT_ROUTE: RouteEntry[] = [
  { t: 2, kind: "cloud", x: lane(2) }, { t: 5, kind: "cloud", x: lane(1) }, { t: 8, kind: "cloud", x: lane(3) },
  { t: 11, kind: "cloud", x: lane(2) }, { t: 14, kind: "cloud", x: lane(0) }, { t: 16, kind: "cloud", x: lane(4) },
  { t: 18, kind: "friend", who: "bird", y: 140, dir: 1 },
  { t: 21, kind: "bubble", x: lane(2) },
  { t: 23, kind: "cloud", x: lane(1) }, { t: 23, kind: "cloud", x: lane(3) },
  { t: 26, kind: "friend", who: "bird", y: 220, dir: -1 },
  { t: 28, kind: "cloud", x: lane(0) }, { t: 29, kind: "cloud", x: lane(2) },
  { t: 31, kind: "friend", who: "bird", y: 120, dir: 1 },
  { t: 33, kind: "cloud", x: lane(4) }, { t: 34, kind: "cloud", x: lane(2) },
  { t: 37, kind: "cloud", x: lane(1) }, { t: 38, kind: "cloud", x: lane(3) },
  { t: 40, kind: "friend", who: "bird", y: 260, dir: -1 },
  { t: 42, kind: "cloud", x: lane(0) }, { t: 42, kind: "cloud", x: lane(4) },
  { t: 46, kind: "friend", who: "unicorn", y: 60, dir: 1, dive: 140 },
  { t: 49, kind: "row", gap: 3 },
  { t: 52, kind: "bubble", x: lane(1) },
  { t: 54, kind: "friend", who: "unicorn", y: 80, dir: -1, dive: 150 },
  { t: 57, kind: "row", gap: 0 },
  { t: 60, kind: "friend", who: "bird", y: 200, dir: 1 },
  { t: 62, kind: "row", gap: 2 },
  { t: 65, kind: "friend", who: "unicorn", y: 50, dir: 1, dive: 160 },
  { t: 67, kind: "cloud", x: lane(1) }, { t: 67, kind: "cloud", x: lane(3) },
  { t: 71, kind: "bubble", x: lane(3) },
  { t: 72, kind: "cloud", x: lane(0) }, { t: 72.5, kind: "cloud", x: lane(2) }, { t: 73, kind: "cloud", x: lane(4) },
  { t: 75, kind: "friend", who: "bird", y: 150, dir: -1 }, { t: 76, kind: "friend", who: "unicorn", y: 40, dir: 1, dive: 120 },
  { t: 77, kind: "row", gap: 1 },
  { t: 80, kind: "cloud", x: lane(3) }, { t: 80.5, kind: "cloud", x: lane(1) },
  { t: 82, kind: "friend", who: "bird", y: 230, dir: 1 },
  { t: 83, kind: "cloud", x: lane(2) }, { t: 84, kind: "cloud", x: lane(0) }, { t: 84, kind: "cloud", x: lane(4) },
];

/** Estrellas posibles: una por nubarrón. */
export const TOTAL_STARS = FLIGHT_ROUTE.reduce((n, e) => n + (e.kind === "cloud" ? 1 : e.kind === "row" ? 4 : 0), 0);

export type Cloud = { x: number; baseX: number; y: number; vy: number; amp: number; freq: number; drift: number; r: number; happy: number; wob: number };
export type Friend = { who: "bird" | "unicorn"; x: number; y: number; vx: number; vy: number; phase: number };
export type Flight = {
  t: number; next: number; ended: boolean; rand: () => number;
  plane: { x: number; vx: number; flip: number; invuln: number; bubble: boolean; cooldown: number };
  pops: Array<{ x: number; y: number; done?: boolean }>;
  clouds: Cloud[]; friends: Friend[];
  stars: Array<{ x: number; y: number; vy: number; done?: boolean }>;
  bubbles: Array<{ x: number; y: number; vy: number; done?: boolean }>;
  rainbow: { y: number } | null;
  got: number; cleaned: number; bumps: number;
};
export type FlightInput = { left: boolean; right: boolean; firePressed: boolean };
export type FlightEvent = "pop" | "clean" | "star" | "bump" | "shield-lost" | "bubble" | "rainbow" | "end";

/** Generador con semilla: el mismo vuelo cada vez. */
export function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Dificultad de 0 a 1 según avanza el vuelo. */
export const difficulty = (t: number) => Math.max(0, Math.min(1, t / 84));

/** Velocidad, vaivén y (desde el desarrollo) deriva propios de cada nubarrón; todo crece con la dificultad. */
export function cloudMotion(rand: () => number, t: number) {
  const lv = difficulty(t);
  return {
    vy: (70 + 80 * lv) * (.75 + rand() * .5),
    amp: (25 + 85 * lv) * (.6 + rand() * .8),
    freq: .6 + rand() * (.6 + .8 * lv),
    drift: lv > .3 && rand() < .25 + .5 * lv ? (40 + 90 * lv) * (rand() < .5 ? -1 : 1) : 0,
  };
}

export function createFlight(seed = 7): Flight {
  return {
    t: 0, next: 0, ended: false, rand: seeded(seed),
    plane: { x: SKY_WIDTH / 2, vx: 0, flip: 0, invuln: 0, bubble: false, cooldown: 0 },
    pops: [], clouds: [], friends: [], stars: [], bubbles: [], rainbow: null, got: 0, cleaned: 0, bumps: 0,
  };
}

function spawn(flight: Flight, entry: RouteEntry) {
  const add = (x: number, m: ReturnType<typeof cloudMotion>, phase: number) =>
    flight.clouds.push({ x, baseX: x, y: -60, vy: m.vy, amp: m.amp, freq: m.freq, drift: m.drift, r: 46, happy: 0, wob: phase });
  if (entry.kind === "cloud") add(entry.x, cloudMotion(flight.rand, flight.t), flight.rand() * 6);
  if (entry.kind === "row") {
    // La fila baila entera a la vez para que el hueco siga siendo un hueco.
    const m = { ...cloudMotion(flight.rand, flight.t), drift: 0 };
    m.amp = Math.min(m.amp, 60);
    const phase = flight.rand() * 6;
    for (let i = 0; i < 5; i += 1) if (i !== entry.gap) add(lane(i), m, phase);
  }
  if (entry.kind === "bubble") flight.bubbles.push({ x: entry.x, y: -40, vy: 80 });
  if (entry.kind === "friend") {
    const vx = (entry.who === "unicorn" ? 190 : 150) * entry.dir;
    flight.friends.push({ who: entry.who, x: entry.dir > 0 ? -60 : SKY_WIDTH + 60, y: entry.y, vx, vy: entry.dive ?? 30, phase: 0 });
  }
}

/** Choque: con burbuja solo se pierde la burbuja; sin ella, voltereta y 1,5 s sin poder chocar otra vez. */
function bump(flight: Flight): FlightEvent | null {
  const plane = flight.plane;
  if (plane.invuln > 0) return null;
  if (plane.bubble) {
    plane.bubble = false;
    plane.invuln = 1;
    return "shield-lost";
  }
  plane.flip = .7;
  plane.invuln = BUMP_INVULNERABLE;
  flight.bumps += 1;
  return "bump";
}

export function stepFlight(flight: Flight, input: FlightInput, dt: number): FlightEvent[] {
  const events: FlightEvent[] = [];
  if (flight.ended) return events;
  const plane = flight.plane;
  flight.t += dt;
  while (flight.next < FLIGHT_ROUTE.length && FLIGHT_ROUTE[flight.next].t <= flight.t) spawn(flight, FLIGHT_ROUTE[flight.next++]);
  if (flight.t >= FLIGHT_SECONDS - 4 && !flight.rainbow) {
    flight.rainbow = { y: -260 };
    events.push("rainbow");
  }
  const target = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  plane.vx += (target * 430 - plane.vx) * Math.min(1, dt * 9);
  plane.x = Math.max(70, Math.min(SKY_WIDTH - 70, plane.x + plane.vx * dt));
  plane.flip = Math.max(0, plane.flip - dt);
  plane.invuln = Math.max(0, plane.invuln - dt);
  // Pompas: solo al pulsar, una por pulsación.
  plane.cooldown = Math.max(0, plane.cooldown - dt);
  if (input.firePressed && plane.cooldown <= 0) {
    flight.pops.push({ x: plane.x, y: PLANE_Y - 50 });
    plane.cooldown = POP_COOLDOWN;
    events.push("pop");
  }
  for (const pop of flight.pops) pop.y -= 560 * dt;
  for (const cloud of flight.clouds) {
    cloud.y += cloud.vy * dt;
    cloud.wob += dt;
    if (cloud.happy > 0) {
      cloud.happy += dt;
      cloud.y -= cloud.vy * dt * .6;
      continue;
    }
    cloud.baseX += cloud.drift * dt;
    if (cloud.baseX < 80 || cloud.baseX > SKY_WIDTH - 80) {
      cloud.drift = -cloud.drift;
      cloud.baseX = Math.max(80, Math.min(SKY_WIDTH - 80, cloud.baseX));
    }
    cloud.x = Math.max(50, Math.min(SKY_WIDTH - 50, cloud.baseX + Math.sin(cloud.wob * cloud.freq * Math.PI * 2) * cloud.amp));
    for (const pop of flight.pops) {
      if (pop.done || Math.hypot(pop.x - cloud.x, pop.y - cloud.y) >= cloud.r + 16) continue;
      pop.done = true;
      cloud.happy = .001;
      flight.cleaned += 1;
      flight.stars.push({ x: cloud.x, y: cloud.y + 10, vy: 60 + 60 * difficulty(flight.t) });
      events.push("clean");
      break;
    }
    if (cloud.happy === 0 && Math.abs(cloud.x - plane.x) < cloud.r + 30 && Math.abs(cloud.y - PLANE_Y) < cloud.r + 18) {
      const hit = bump(flight);
      if (hit) events.push(hit);
    }
  }
  for (const friend of flight.friends) {
    friend.x += friend.vx * dt;
    friend.y += friend.vy * dt;
    friend.phase += dt;
    if (Math.abs(friend.x - plane.x) < 62 && Math.abs(friend.y - PLANE_Y) < 40) {
      const hit = bump(flight);
      if (hit) events.push(hit);
    }
  }
  for (const star of flight.stars) {
    star.y += star.vy * dt;
    // Imán amable: las estrellas cercanas vuelan solas hacia la avioneta; al final atrae menos.
    const distance = Math.hypot(star.x - plane.x, star.y - PLANE_Y);
    if (distance < 150 - 70 * difficulty(flight.t)) {
      star.x += (plane.x - star.x) * Math.min(1, dt * 5);
      star.y += (PLANE_Y - star.y) * Math.min(1, dt * 5);
    }
    if (distance < 40 && !star.done) {
      star.done = true;
      flight.got += 1;
      events.push("star");
    }
  }
  for (const bubble of flight.bubbles) {
    bubble.y += bubble.vy * dt;
    if (!bubble.done && Math.abs(bubble.x - plane.x) < 60 && Math.abs(bubble.y - PLANE_Y) < 50) {
      bubble.done = true;
      plane.bubble = true;
      events.push("bubble");
    }
  }
  flight.pops = flight.pops.filter((pop) => !pop.done && pop.y > -40);
  flight.clouds = flight.clouds.filter((cloud) => cloud.y < SKY_HEIGHT + 80 && cloud.happy < 2.5);
  flight.friends = flight.friends.filter((friend) => friend.x > -120 && friend.x < SKY_WIDTH + 120 && friend.y < SKY_HEIGHT + 80);
  flight.stars = flight.stars.filter((star) => !star.done && star.y < SKY_HEIGHT + 40);
  flight.bubbles = flight.bubbles.filter((bubble) => !bubble.done && bubble.y < SKY_HEIGHT + 60);
  if (flight.rainbow) {
    flight.rainbow.y += 120 * dt;
    if (flight.rainbow.y > PLANE_Y - 60) {
      flight.ended = true;
      events.push("end");
    }
  }
  return events;
}

/** Mejor marca del vuelo en el progreso: estrellas y si se consiguieron todas (marco dorado). */
export type AvionetaProgress = { bestStars: number; flown: boolean };

export function normalizeAvioneta(raw: unknown): AvionetaProgress | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const entry = raw as Record<string, unknown>;
  const best = Number(entry.bestStars);
  return { bestStars: Number.isFinite(best) ? Math.max(0, Math.min(TOTAL_STARS, Math.floor(best))) : 0, flown: entry.flown === true };
}

export function recordFlight<T extends { avioneta?: AvionetaProgress }>(progress: T, stars: number): T {
  const best = Math.max(progress.avioneta?.bestStars ?? 0, Math.max(0, Math.min(TOTAL_STARS, stars)));
  return { ...progress, avioneta: { bestStars: best, flown: true } };
}
