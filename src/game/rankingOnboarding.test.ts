import assert from "node:assert/strict";
import test from "node:test";
import { RankingError } from "./ranking.ts";
import { createEnrollmentRecovery, ENROLLMENT_RETRY_MS, enrollmentFailure, isEnrolled, safeEnrollmentMoment } from "./rankingOnboarding.ts";

test("una tarjeta pendiente no permite saltarse el alta, una confirmada sí", () => {
  assert.equal(isEnrolled(null), false);
  const device = { id: "device", token: "token", alias: "Luna" };
  assert.equal(isEnrolled({ ...device, registrationPending: true }), false);
  assert.equal(isEnrolled(device), true);
});

test("las recuperaciones esperan un menú seguro sin otro diálogo", () => {
  for (const screen of ["home", "map"]) {
    assert.equal(safeEnrollmentMoment(screen, false), true);
    assert.equal(safeEnrollmentMoment(screen, true), false);
  }
  for (const screen of ["game", "boss", "secret-transition", "complete", "finished", "gameover"]) {
    assert.equal(safeEnrollmentMoment(screen, false), false);
    assert.equal(safeEnrollmentMoment(screen, true), false);
  }
  assert.ok(ENROLLMENT_RETRY_MS >= 30_000);
});

test("validación mantiene el diálogo, fallos de servicio aplazan y almacenamiento ofrece salida explícita", () => {
  for (const code of ["invalid_alias", "alias_taken", "device_exists"] as const) {
    assert.equal(enrollmentFailure(new RankingError(code, "Elige otro alias", false)), "validate");
  }
  assert.equal(enrollmentFailure(new RankingError("storage_unavailable", "No se puede guardar", false)), "storage");
  for (const code of ["network", "timeout", "server_unavailable", "invalid_response", "backend_outdated", "request_failed"] as const) {
    assert.equal(enrollmentFailure(new RankingError(code, "No disponible", true)), "defer");
  }
  assert.equal(enrollmentFailure(new TypeError("Sin red")), "defer");
});

test("recuperar conexión en partida espera al mapa sin bloquear su propio reintento", () => {
  const now = 1_000;
  const retryAt = { current: now + ENROLLMENT_RETRY_MS };
  let screen = "game";
  let prompts = 0;
  const recovery = createEnrollmentRecovery(retryAt, () => safeEnrollmentMoment(screen, false), () => {
    if (now < retryAt.current) return;
    prompts++;
  }, () => now);
  recovery.online();
  assert.equal(prompts, 0);
  assert.equal(retryAt.current, 0);
  screen = "map";
  recovery.retry();
  assert.equal(prompts, 1);
  assert.equal(retryAt.current, 0);
});

test("el reintento automático vencido solo aplaza tras un nuevo fallo real", () => {
  let now = 1_000;
  const retryAt = { current: now + ENROLLMENT_RETRY_MS };
  let attempts = 0;
  const recovery = createEnrollmentRecovery(retryAt, () => true, () => {
    assert.ok(now >= retryAt.current);
    attempts++;
    retryAt.current = now + ENROLLMENT_RETRY_MS;
  }, () => now);
  recovery.retry();
  assert.equal(attempts, 0);
  now = retryAt.current;
  recovery.retry();
  assert.equal(attempts, 1);
  recovery.retry();
  assert.equal(attempts, 1);
  now = retryAt.current;
  recovery.retry();
  assert.equal(attempts, 2);
});
