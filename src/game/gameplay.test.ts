import assert from "node:assert/strict";
import test from "node:test";
import { boarChargeVelocity, goalFlagHitbox, hasReachedGoalFlag, keepInsidePatrol, landsOnSpring, platformSurfaceY, swimmingVelocity, waterAt } from "./gameplay.ts";

test("el banderín tiene una zona elevada y alcanzable al saltar", () => {
  const flag = goalFlagHitbox(900, 456);
  assert.deepEqual(flag, { x: 900, y: 224, width: 172, height: 232 });
  assert.equal(hasReachedGoalFlag({ x: 944, y: 260, width: 42, height: 58 }, 900, 456), true);
});

test("Noa no termina la pantalla antes de llegar al banderín", () => {
  assert.equal(hasReachedGoalFlag({ x: 820, y: 398, width: 42, height: 58 }, 900, 456), false);
});

test("el jabalí rebota y no carga contra el mismo borde en un bucle", () => {
  const atLeftEdge = keepInsidePatrol(90, -120, 90, 310);
  assert.deepEqual(atLeftEdge, { x: 90, velocity: 120 });
  assert.equal(boarChargeVelocity(atLeftEdge.x, 90, 90, 310, atLeftEdge.velocity), 120);
  assert.equal(boarChargeVelocity(310, 310, 90, 310, 120), -120);
});

test("el muelle solo impulsa al aterrizar sobre él, no al caminar de largo", () => {
  assert.equal(landsOnSpring(true, 456, 457, 398, 20), false);
  assert.equal(landsOnSpring(false, 394, 401, 398, 250), true);
  assert.equal(landsOnSpring(false, 394, 401, 398, -250), false);
});

test("el agua solo afecta a Noa dentro de la poza y permite caminar por el fondo", () => {
  const zone = { x: 100, y: 120, width: 700, height: 430 };
  assert.equal(waterAt({ x: 130, y: 50, width: 42, height: 58 }, [zone]), undefined);
  assert.equal(waterAt({ x: 10, y: 200, width: 42, height: 58 }, [zone]), undefined);
  assert.equal(waterAt({ x: 130, y: 100, width: 42, height: 58 }, [zone]), zone);
  assert.equal(waterAt({ x: 130, y: 432, width: 42, height: 58 }, [zone]), zone);
});

test("Noa pisa la roca del arrecife por debajo de las algas decorativas", () => {
  assert.equal(platformSurfaceY({ x: 0, y: 365, width: 150, height: 125, kind: "sea-wall" }), 403);
  assert.equal(platformSurfaceY({ x: 0, y: 120, width: 180, height: 170, kind: "sea-wall" }), 171);
  assert.equal(platformSurfaceY({ x: 0, y: 490, width: 500, height: 90, kind: "sea-ground" }), 490);
  assert.equal(platformSurfaceY({ x: 0, y: 285, width: 230, height: 24, kind: "sea-ledge" }), 285);
});

test("las brazadas suben y soltar el botón hunde con velocidad limitada", () => {
  let velocity = 95;
  for (let tick = 0; tick < 60; tick += 1) velocity = swimmingVelocity(velocity, true, 1 / 60);
  assert.equal(velocity, -190);
  for (let tick = 0; tick < 180; tick += 1) velocity = swimmingVelocity(velocity, false, 1 / 60);
  assert.equal(velocity, 95);
  assert.ok(swimmingVelocity(0, true, 1 / 60) < 0);
  assert.ok(swimmingVelocity(0, false, 1 / 60) > 0);
});
