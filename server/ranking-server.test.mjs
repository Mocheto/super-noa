import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createRankingServer, leaderboardQuery, rankingSchema } from "./ranking-server.mjs";

function profilePool() {
  const profiles = new Map();
  return {
    profiles,
    async query(sql, params) {
      if (sql.startsWith("INSERT")) {
        assert.match(sql, /ON CONFLICT DO NOTHING RETURNING alias/);
        const [id, alias, alias_key, token_hash] = params;
        if (profiles.has(id) || [...profiles.values()].some((profile) => profile.alias_key === alias_key)) return { rowCount: 0, rows: [] };
        profiles.set(id, { alias, alias_key, token_hash, totalApples: 0, achievedAt: null });
        return { rowCount: 1, rows: [{ alias }] };
      }
      if (sql.startsWith("SELECT alias, alias_key")) {
        const profile = profiles.get(params[0]);
        return { rows: profile ? [profile] : [] };
      }
      if (sql.startsWith("SELECT total_apples")) return { rows: [] };
      if (sql.startsWith("UPDATE")) {
        const [id, hash, world, completedLevels, stickers, bossChallenges, campaignWorld] = params;
        const profile = profiles.get(id);
        if (!profile || profile.token_hash !== hash) return { rowCount: 0, rows: [] };
        Object.assign(profile, { world, completedLevels, stickers, bossChallenges, campaignWorld });
        return { rowCount: 1, rows: [profile] };
      }
      throw new Error(`Consulta inesperada: ${sql}`);
    },
  };
}

async function apiFixture(t, pool = profilePool()) {
  const server = createRankingServer({ pool, tokenPepper: "test-pepper", logger: { error() {} } });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  return {
    pool, url,
    post: (path, body, headers = {}) => fetch(`${url}${path}`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) }),
  };
}

test("registro idempotente: perder la respuesta y repetir no cambia la tarjeta ni duplica perfiles", async (t) => {
  const api = await apiFixture(t);
  const card = { alias: "NoaLuna", deviceId: randomUUID(), deviceToken: "a".repeat(43) };
  const first = await api.post("/v1/devices", card);
  assert.equal(first.status, 201);
  await first.body.cancel();
  const retry = await api.post("/v1/devices", { ...card, alias: "noaluna" });
  assert.equal(retry.status, 200);
  assert.deepEqual(await retry.json(), card);
  assert.equal(api.pool.profiles.size, 1);
  assert.notEqual(api.pool.profiles.get(card.deviceId).token_hash, card.deviceToken);
});

test("reintentos simultáneos y conflictos de alias no reemplazan tarjetas existentes", async (t) => {
  const api = await apiFixture(t);
  const card = { alias: "NoaLuna", deviceId: randomUUID(), deviceToken: "a".repeat(43) };
  const results = await Promise.all([api.post("/v1/devices", card), api.post("/v1/devices", card)]);
  assert.deepEqual(results.map((response) => response.status).sort(), [200, 201]);
  const wrongToken = await api.post("/v1/devices", { ...card, deviceToken: "b".repeat(43) });
  assert.equal(wrongToken.status, 401);
  assert.equal((await wrongToken.json()).code, "device_invalid");
  const otherAlias = await api.post("/v1/devices", { ...card, alias: "NoaSol" });
  assert.equal(otherAlias.status, 409);
  assert.equal((await otherAlias.json()).code, "device_exists");
  const occupied = await api.post("/v1/devices", { ...card, deviceId: randomUUID() });
  assert.equal(occupied.status, 409);
  assert.equal((await occupied.json()).code, "alias_taken");
  assert.equal(api.pool.profiles.size, 1);
});

test("clientes antiguos conservan registro, tarjeta y envío del progreso sin campaignWorld", async (t) => {
  const api = await apiFixture(t);
  const response = await api.post("/v1/devices", { alias: "NoaLuna" });
  assert.equal(response.status, 201);
  const card = await response.json();
  const headers = { "X-Super-Noa-Device": card.deviceId, "X-Super-Noa-Token": card.deviceToken };
  const progress = { world: 8, completedLevels: 3, stickers: 2, bossChallenges: 1 };
  const updated = await api.post("/v1/progress", progress, headers);
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).campaignWorld, null);
  const modern = await api.post("/v1/progress", { ...progress, world: 12, campaignWorld: 10 }, headers);
  assert.equal(modern.status, 200);
  assert.equal((await modern.json()).campaignWorld, 10);
  assert.equal((await fetch(`${api.url}/health`).then((result) => result.json())).registrationVersion, 2);
});

test("salud comprueba PostgreSQL y anuncia capacidades solo cuando está disponible", async (t) => {
  let unavailable = false;
  let queries = 0;
  const errors = [];
  const server = createRankingServer({
    pool: { query: async (sql) => {
      queries += 1;
      assert.match(sql, /SELECT total_apples, achieved_at FROM super_noa_ranking_profiles/);
      if (unavailable) throw new Error("base desconectada");
      return { rows: [] };
    } },
    tokenPepper: "test-pepper", release: "abc123", logger: { error: (...args) => errors.push(args) },
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const url = `http://127.0.0.1:${server.address().port}/health`;
  const ready = await fetch(url);
  assert.equal(ready.status, 200);
  assert.deepEqual(await ready.json(), { status: "bien", release: "abc123", registrationVersion: 2, progressVersion: 2 });
  unavailable = true;
  const failed = await fetch(url);
  assert.equal(failed.status, 503);
  assert.equal((await failed.json()).code, "server_unavailable");
  assert.equal(queries, 2);
  assert.equal(errors.length, 1);
});

test("progreso rechaza manzanas y fechas inválidas antes de consultar PostgreSQL", async (t) => {
  const api = await apiFixture(t, { query: async () => { assert.fail("No debe consultar PostgreSQL"); } });
  const headers = { "X-Super-Noa-Device": randomUUID(), "X-Super-Noa-Token": "a".repeat(43) };
  const progress = { world: 0, completedLevels: 0, stickers: 0, bossChallenges: 0 };
  for (const fields of [{ totalApples: Number.MAX_SAFE_INTEGER + 1 }, { totalApples: null }, { achievedAt: "2026-02-30T00:00:00Z" }]) {
    assert.equal((await api.post("/v1/progress", { ...progress, ...fields }, headers)).status, 400);
  }
});

test("las respuestas distinguen JSON inválido, tarjeta inválida e infraestructura", async (t) => {
  const api = await apiFixture(t, { query: async () => { throw new Error("PostgreSQL reiniciándose"); } });
  const unavailable = await fetch(`${api.url}/v1/leaderboard`);
  assert.equal(unavailable.status, 503);
  assert.deepEqual(await unavailable.json(), {
    error: "El ranking está descansando un momento. Tu aventura sigue guardada aquí; vuelve a intentarlo.",
    code: "server_unavailable", retryable: true,
  });
  const invalid = await fetch(`${api.url}/v1/devices`, { method: "POST", body: "{" });
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).retryable, false);
  const malformed = await api.post("/v1/devices", { alias: "NoaLuna", deviceId: "mal", deviceToken: "a".repeat(43) });
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).code, "device_invalid");
  const unauthorized = await api.post("/v1/progress", {});
  assert.equal(unauthorized.status, 401);
});

test("la migración es aditiva y el orden no depende de IDs históricos ni del campo desconocido", () => {
  assert.match(rankingSchema, /ADD COLUMN IF NOT EXISTS campaign_world/);
  assert.match(rankingSchema, /WHEN world BETWEEN 0 AND 6 THEN world WHEN world BETWEEN 9 AND 12 THEN world - 2 ELSE NULL/);
  assert.match(rankingSchema, /WHERE campaign_world IS NULL/);
  assert.doesNotMatch(rankingSchema, /DROP TABLE|DELETE FROM|SET world =/);
  const ordering = leaderboardQuery.split("ORDER BY")[1];
  assert.match(ordering, /^\s*completed_levels DESC/);
  assert.doesNotMatch(ordering, /\bworld\b|\bcampaign_world\b/);
});

test("cliente y API reales recuperan un registro confirmado cuya respuesta se perdió", async (t) => {
  const api = await apiFixture(t);
  const { readRankingDevice, registerRankingDevice, RankingError } = await import("../src/game/ranking.ts");
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const saved = new Map();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
  } });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else Reflect.deleteProperty(globalThis, "localStorage");
  });
  const realFetch = globalThis.fetch;
  let loseResponse = true;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    const response = await realFetch(url.replace("https://rankings.moche-home.es", api.url), init);
    if (url.endsWith("/v1/devices") && loseResponse) {
      loseResponse = false;
      assert.equal(response.status, 201);
      await response.body.cancel();
      throw new TypeError("La red perdió la respuesta");
    }
    return response;
  });
  await assert.rejects(registerRankingDevice("NoaLuna"), (error) => error instanceof RankingError && error.retryable);
  const pending = readRankingDevice();
  const confirmed = await registerRankingDevice("NoaLuna");
  assert.equal(confirmed.id, pending.id);
  assert.equal(confirmed.token, pending.token);
  assert.equal(api.pool.profiles.size, 1);
  assert.equal(readRankingDevice().registrationPending, undefined);
});
