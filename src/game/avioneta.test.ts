import assert from "node:assert/strict";
import test from "node:test";
import {
  BUMP_INVULNERABLE, FLIGHT_ROUTE, FLIGHT_SECONDS, PLANE_Y, TOTAL_STARS, createFlight, difficulty, normalizeAvioneta, recordFlight, stepFlight,
} from "./avioneta.ts";
import { emptyProgress, parseProgress, serializeProgress } from "./progress.ts";

const idle = { left: false, right: false, firePressed: false };
const fly = (seconds: number, flight = createFlight(), input = idle) => {
  const events: string[] = [];
  for (let t = 0; t < seconds && !flight.ended; t += 1 / 60) events.push(...stepFlight(flight, input, 1 / 60));
  return { flight, events };
};

test("el recorrido dura unos 90 s en cuatro tiempos y acaba al cruzar el arcoíris", () => {
  assert.ok(FLIGHT_ROUTE.every((entry, index) => index === 0 || entry.t >= FLIGHT_ROUTE[index - 1].t));
  assert.ok(FLIGHT_ROUTE.at(-1)!.t < FLIGHT_SECONDS - 4);
  assert.equal(TOTAL_STARS, FLIGHT_ROUTE.filter((e) => e.kind === "cloud").length + 4 * FLIGHT_ROUTE.filter((e) => e.kind === "row").length);
  const { flight, events } = fly(120);
  assert.ok(flight.ended && events.includes("rainbow") && events.includes("end"));
  assert.ok(flight.t > FLIGHT_SECONDS - 4 && flight.t < FLIGHT_SECONDS + 4);
});

test("sin vidas: chocar da una voltereta y 1,5 s sin volver a chocar; la burbuja aguanta un choque", () => {
  const flight = createFlight();
  flight.clouds.push({ x: flight.plane.x, baseX: flight.plane.x, y: PLANE_Y, vy: 0, amp: 0, freq: 1, drift: 0, r: 46, happy: 0, wob: 0 });
  assert.deepEqual(stepFlight(flight, idle, 1 / 60).filter((e) => e === "bump"), ["bump"]);
  assert.equal(flight.plane.invuln > BUMP_INVULNERABLE - .1, true);
  assert.deepEqual(stepFlight(flight, idle, 1 / 60).filter((e) => e === "bump"), [], "no vuelve a chocar enseguida");
  flight.plane.invuln = 0;
  flight.plane.bubble = true;
  assert.deepEqual(stepFlight(flight, idle, 1 / 60).filter((e) => e === "bump" || e === "shield-lost"), ["shield-lost"]);
  assert.equal(flight.bumps, 1);
});

test("solo hay pompas al pulsar, con un respiro entre una y otra, y limpian nubarrones que sueltan estrellas", () => {
  const flight = createFlight();
  flight.clouds.push({ x: flight.plane.x, baseX: flight.plane.x, y: 200, vy: 0, amp: 0, freq: 1, drift: 0, r: 46, happy: 0, wob: 0 });
  assert.deepEqual(stepFlight(flight, { ...idle, firePressed: true }, 1 / 60).filter((e) => e === "pop"), ["pop"]);
  assert.deepEqual(stepFlight(flight, { ...idle, firePressed: true }, 1 / 60).filter((e) => e === "pop"), [], "0,12 s entre pompas");
  assert.deepEqual(stepFlight(flight, idle, 1 / 60).filter((e) => e === "pop"), [], "mantener no repite");
  const events: string[] = [];
  for (let i = 0; i < 120; i += 1) events.push(...stepFlight(flight, idle, 1 / 60));
  assert.ok(events.includes("clean"));
  assert.equal(flight.cleaned, 1);
});

test("la dificultad crece a lo largo del vuelo y el vuelo es siempre el mismo", () => {
  assert.equal(difficulty(0), 0);
  assert.equal(difficulty(84), 1);
  const a = fly(60).flight;
  const b = fly(60).flight;
  assert.deepEqual(a.clouds.map((c) => Math.round(c.x)), b.clouds.map((c) => Math.round(c.x)));
});

test("la mejor marca de estrellas se guarda sin cambiar la versión", () => {
  let progress = recordFlight({ ...emptyProgress }, 12);
  progress = recordFlight(progress, 5);
  assert.deepEqual(progress.avioneta, { bestStars: 12, flown: true });
  assert.deepEqual(parseProgress(serializeProgress(progress)).avioneta, { bestStars: 12, flown: true });
  assert.equal(parseProgress(JSON.stringify({ version: 2, unlocked: 0, levelStats: {} })).avioneta, undefined);
  assert.deepEqual(normalizeAvioneta({ bestStars: 999, flown: "sí" }), { bestStars: TOTAL_STARS, flown: false });
});
