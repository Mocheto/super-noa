import type { ChainGuardian, Rect } from "./types";
import { keepInsidePatrol } from "./gameplay.ts";

export type GuardianPhase = "patrol" | "warning" | "lunge" | "recovery";
export type LiveChainGuardian = ChainGuardian & {
  x: number;
  y: number;
  direction: -1 | 1;
  phase: GuardianPhase;
  phaseAge: number;
  wait: number;
};

export function createChainGuardian(data: ChainGuardian): LiveChainGuardian {
  const durations = [data.patrolDuration, data.warningDuration, data.lungeDuration, data.recoveryDuration];
  if (durations.some((value) => !Number.isFinite(value) || value <= 0)
    || ![data.anchorX, data.groundY, data.leashLength, data.width, data.height, data.patrolSpeed, data.lungeSpeed, data.delay].every(Number.isFinite)
    || data.width <= 0 || data.height <= 0 || data.leashLength < data.width / 2
    || data.patrolSpeed < 0 || data.lungeSpeed < 0 || data.delay < 0) {
    throw new RangeError(`Guardián encadenado inválido: ${data.id}`);
  }
  return { ...data, x: data.anchorX - data.width / 2, y: data.groundY - data.height, direction: 1, phase: "patrol", phaseAge: 0, wait: data.delay };
}

export function guardianBounds(guardian: ChainGuardian) {
  return { minX: guardian.anchorX - guardian.leashLength, maxX: guardian.anchorX + guardian.leashLength - guardian.width };
}

export function guardianHitbox(guardian: LiveChainGuardian): Rect {
  return { x: guardian.x, y: guardian.y, width: guardian.width, height: guardian.height };
}

export function updateChainGuardian(guardian: LiveChainGuardian, delta: number, playerCenterX: number) {
  let remaining = delta;
  if (guardian.wait > 0) {
    const waiting = Math.min(remaining, guardian.wait);
    guardian.wait -= waiting;
    remaining -= waiting;
  }
  const { minX, maxX } = guardianBounds(guardian);
  while (remaining > 0) {
    const duration = guardian.phase === "patrol" ? guardian.patrolDuration
      : guardian.phase === "warning" ? guardian.warningDuration
      : guardian.phase === "lunge" ? guardian.lungeDuration : guardian.recoveryDuration;
    const step = Math.min(remaining, duration - guardian.phaseAge);
    if (guardian.phase === "patrol") {
      const patrol = keepInsidePatrol(guardian.x + guardian.direction * guardian.patrolSpeed * step, guardian.direction * guardian.patrolSpeed, minX, maxX);
      guardian.x = patrol.x;
      guardian.direction = patrol.velocity < 0 ? -1 : 1;
    } else if (guardian.phase === "lunge") {
      guardian.x = Math.max(minX, Math.min(maxX, guardian.x + guardian.direction * guardian.lungeSpeed * step));
    }
    guardian.phaseAge += step;
    remaining -= step;
    if (guardian.phaseAge < duration) break;
    guardian.phaseAge = 0;
    if (guardian.phase === "patrol") {
      guardian.phase = "warning";
      guardian.direction = playerCenterX < guardian.x + guardian.width / 2 ? -1 : 1;
    } else if (guardian.phase === "warning") {
      guardian.phase = "lunge";
    } else if (guardian.phase === "lunge") {
      guardian.phase = "recovery";
    } else {
      guardian.phase = "patrol";
      guardian.direction = guardian.x + guardian.width / 2 < guardian.anchorX ? 1 : -1;
    }
  }
}
