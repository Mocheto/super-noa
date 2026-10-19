import assert from "node:assert/strict";
import test from "node:test";
import { isCommitSha, parseUpdateInterval } from "./ranking-supervisor.mjs";

test("acepta únicamente SHA completos de Git", () => {
  assert.equal(isCommitSha("a".repeat(40)), true);
  assert.equal(isCommitSha("A".repeat(40)), false);
  assert.equal(isCommitSha("a".repeat(39)), false);
  assert.equal(isCommitSha("main"), false);
});

test("usa cinco minutos por defecto y rechaza intervalos demasiado cortos", () => {
  assert.equal(parseUpdateInterval(undefined), 300_000);
  assert.equal(parseUpdateInterval("30000"), 300_000);
  assert.equal(parseUpdateInterval("60000"), 60_000);
  assert.equal(parseUpdateInterval("900000"), 900_000);
});
