import { request as httpRequest } from "node:http";
import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createRankingServer, leaderboardQuery, rankingSchema } from "./ranking-server.mjs";
import { createRateLimiter, rateLimits } from "./ranking-domain.mjs";

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

async function apiFixture(t, pool = profilePool(), options = {}) {
  const server = createRankingServer({ pool, tokenPepper: "test-pepper", logger: { error() {} }, ...options });
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
  assert.deepEqual(await retry.json(), { ...card, aliasStatus: "pending" });
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
      assert.match(sql, /SELECT total_apples, achieved_at, alias_status, approved_alias FROM super_noa_ranking_profiles/);
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
  assert.deepEqual(await ready.json(), { status: "bien", release: "abc123", registrationVersion: 2, progressVersion: 2, aliasReviewVersion: 1 });
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
  assert.match(rankingSchema, /WHEN world BETWEEN 0 AND 6 THEN world WHEN world BETWEEN 9 AND 13 THEN world - 2 ELSE NULL/);
  assert.match(rankingSchema, /WHERE campaign_world IS NULL/);
  assert.doesNotMatch(rankingSchema, /DROP TABLE|DELETE FROM|SET world =/);
  assert.match(rankingSchema, /\('campaign_world', 15\)/);
  // Los máximos solo se amplían: la restricción se rehace solo si falta o si la que hay es más estrecha.
  assert.match(rankingSchema, /IF actual IS NULL OR actual < limite\.maximo THEN/);
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

test("revisión de alias sin base: clave mala, sin clave configurada y alias que no vale", async (t) => {
  const adminToken = "clave-de-prueba-larga-0123456789";
  const queries = [];
  const pool = { query: async (sql) => { queries.push(sql); return { rowCount: 0, rows: [] }; } };
  const server = createRankingServer({ pool, tokenPepper: "test-pepper", adminToken, logger: { error() {} } });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  for (const authorization of [undefined, "Bearer mala-mala-mala-mala", `Bearer ${adminToken}x`, adminToken]) {
    const response = await fetch(`${url}/v1/admin/aliases`, { headers: authorization ? { Authorization: authorization } : {} });
    assert.equal(response.status, 401);
    const body = await response.text();
    assert.match(body, /admin_invalid/);
    assert.ok(!body.includes(adminToken));
  }
  const approve = await fetch(`${url}/v1/admin/aliases/approve-all`, { method: "POST", headers: { Authorization: "Bearer mala-mala-mala-mala" } });
  assert.equal(approve.status, 401);
  assert.deepEqual(queries, [], "con una clave mala no se toca la base");
  const ok = await fetch(`${url}/v1/admin/aliases`, { headers: { Authorization: `Bearer ${adminToken}` } });
  assert.equal(ok.status, 200);
  assert.match(queries.at(-1), /alias_status = \$1/);

  const blocked = await fetch(`${url}/v1/devices`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alias: "M1erda" }) });
  assert.equal(blocked.status, 400);
  assert.deepEqual(await blocked.json(), { error: "Ese nombre no vale. Prueba otro.", code: "alias_not_allowed", retryable: false });

  const sinClave = createRankingServer({ pool, tokenPepper: "test-pepper", logger: { error() {} } });
  sinClave.listen(0, "127.0.0.1");
  await once(sinClave, "listening");
  t.after(async () => {
    sinClave.closeAllConnections();
    await new Promise((resolve) => sinClave.close(resolve));
  });
  const missing = await fetch(`http://127.0.0.1:${sinClave.address().port}/v1/admin/aliases`, { headers: { Authorization: `Bearer ${adminToken}` } });
  assert.equal(missing.status, 404);
});

test("límite de peticiones: 200 registros seguidos desde una IP ya no entran, con 429 y Retry-After", async (t) => {
  const api = await apiFixture(t);
  const origin = "https://mocheto.github.io";
  const statuses = [];
  let rejected;
  for (let i = 0; i < 200; i += 1) {
    const response = await fetch(`${api.url}/v1/devices`, {
      method: "POST", headers: { "Content-Type": "application/json", Origin: origin, "X-Forwarded-For": "203.0.113.7" },
      body: JSON.stringify({ alias: `Noa${String(i).padStart(3, "0")}`, deviceId: randomUUID(), deviceToken: "a".repeat(43) }),
    });
    statuses.push(response.status);
    if (response.status === 429 && !rejected) rejected = response;
    else await response.body.cancel();
  }
  assert.equal(statuses.filter((status) => status === 201).length, rateLimits.registro.ip.max);
  assert.equal(statuses.filter((status) => status === 429).length, 200 - rateLimits.registro.ip.max);
  assert.equal(api.pool.profiles.size, rateLimits.registro.ip.max, "lo rechazado no llega a la base de datos");
  assert.equal(rejected.headers.get("Retry-After"), String(Math.ceil(3_600 / rateLimits.registro.ip.max)));
  assert.equal(rejected.headers.get("Access-Control-Expose-Headers"), "Retry-After", "el navegador puede leer Retry-After desde otro origen");
  assert.equal(rejected.headers.get("Access-Control-Allow-Origin"), origin);
  assert.deepEqual(await rejected.json(), {
    error: "Hay muchas peticiones seguidas. Espera un poquito y vuelve a intentarlo.", code: "rate_limited", retryable: true, retryAfter: 360,
  });
  const other = await fetch(`${api.url}/v1/devices`, {
    method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": "203.0.113.8" },
    body: JSON.stringify({ alias: "OtraCasa", deviceId: randomUUID(), deviceToken: "b".repeat(43) }),
  });
  assert.equal(other.status, 201, "otra IP no se ve afectada");
});

test("límite de peticiones: por dispositivo, aunque cambie la IP, y cada tipo tiene su cubeta", async (t) => {
  let now = 0;
  const api = await apiFixture(t, undefined, { rateLimiter: createRateLimiter({ now: () => now }) });
  const card = { deviceId: randomUUID(), deviceToken: "c".repeat(43) };
  const headers = (ip) => ({ "Content-Type": "application/json", "X-Forwarded-For": ip, "X-Super-Noa-Device": card.deviceId, "X-Super-Noa-Token": card.deviceToken });
  const progress = { world: 1, completedLevels: 1, stickers: 0, bossChallenges: 0 };
  const statuses = [];
  for (let i = 0; i < rateLimits.progreso.device.max + 3; i += 1) {
    const response = await fetch(`${api.url}/v1/progress`, { method: "POST", headers: headers(`198.51.100.${i}`), body: JSON.stringify(progress) });
    statuses.push(response.status);
    await response.body.cancel();
  }
  assert.equal(statuses.filter((status) => status === 429).length, 3, "con 12 envíos por minuto, el resto espera, venga de la IP que venga");
  assert.ok(!statuses.slice(0, rateLimits.progreso.device.max).includes(429));
  const read = await fetch(`${api.url}/health`, { headers: { "X-Forwarded-For": "198.51.100.200" } });
  assert.equal(read.status, 200, "consultar el tablón no gasta fichas de envío");
  await read.body.cancel();
  now = 5_000;
  const later = await fetch(`${api.url}/v1/progress`, { method: "POST", headers: headers("198.51.100.99"), body: JSON.stringify(progress) });
  assert.notEqual(later.status, 429, "pasado el Retry-After, vuelve a entrar");
  await later.body.cancel();
});

test("límite de peticiones: el registro cuenta por tarjeta aunque se repita el cuerpo, y la consulta tiene su tope por IP", async (t) => {
  const api = await apiFixture(t);
  const card = { alias: "NoaLuna", deviceId: randomUUID(), deviceToken: "d".repeat(43) };
  const codes = [];
  for (let i = 0; i < rateLimits.registro.device.max + 2; i += 1) {
    const response = await api.post("/v1/devices", card, { "X-Forwarded-For": `192.0.2.${i}` });
    codes.push(response.status);
    await response.body.cancel();
  }
  assert.deepEqual(codes, [201, 200, 200, 200, 200, 429, 429]);
  const reads = [];
  for (let i = 0; i < rateLimits.consulta.ip.max + 1; i += 1) {
    const response = await fetch(`${api.url}/health`, { headers: { "X-Forwarded-For": "192.0.2.250" } });
    reads.push(response.status);
    await response.body.cancel();
  }
  assert.equal(reads.at(-1), 429);
  assert.equal(reads.filter((status) => status === 200).length, rateLimits.consulta.ip.max);
});

test("límite de peticiones: sin proxy de confianza la IP es la del socket y X-Forwarded-For no sirve para esquivarlo", async (t) => {
  const api = await apiFixture(t, undefined, { trustedProxies: 0 });
  const statuses = [];
  for (let i = 0; i < rateLimits.registro.ip.max + 1; i += 1) {
    const response = await api.post("/v1/devices", { alias: `Falso${i}`, deviceId: randomUUID(), deviceToken: "e".repeat(43) }, { "X-Forwarded-For": `192.0.2.${i}` });
    statuses.push(response.status);
    await response.body.cancel();
  }
  assert.equal(statuses.at(-1), 429);
});

test("una «ñ» partida entre dos trozos del cuerpo no estropea el alias", async (t) => {
  const api = await apiFixture(t);
  const body = Buffer.from(JSON.stringify({ alias: "Ñoñoñoñoñoñoñoño" }));
  // Se parte justo en medio de los dos bytes de una «ñ».
  const corte = body.indexOf(Buffer.from("ñ")) + 1;
  const response = await new Promise((resolve, reject) => {
    const request = httpRequest(`${api.url}/v1/devices`, { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": body.length } }, (res) => {
      let text = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { text += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(text) }));
    });
    request.on("error", reject);
    request.write(body.subarray(0, corte));
    setTimeout(() => request.end(body.subarray(corte)), 20);
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.alias, "Ñoñoñoñoñoñoñoño");
});

test("alias que crecen al pasar a minúsculas u otras escrituras: 400 al momento, nunca 503 reintentable", async (t) => {
  const api = await apiFixture(t);
  for (const alias of ["İ".repeat(16), "Noа", "Ноа", "Νοα"]) {
    const response = await api.post("/v1/devices", { alias });
    assert.equal(response.status, 400, alias);
    const body = await response.json();
    assert.equal(body.code, "invalid_alias");
    assert.equal(body.retryable, false);
  }
  assert.equal((await api.post("/v1/devices", { alias: "İsabel" })).status, 201);
  assert.equal(api.pool.profiles.size, 1);
});

test("cuerpo demasiado grande se rechaza por su Content-Length antes de leerlo", async (t) => {
  const api = await apiFixture(t);
  const response = await api.post("/v1/devices", { alias: "Luna", relleno: "x".repeat(20_000) });
  assert.equal(response.status, 413);
});

test("cabeceras defensivas en las respuestas y en el preflight", async (t) => {
  const api = await apiFixture(t);
  for (const response of [
    await fetch(`${api.url}/health`),
    await fetch(`${api.url}/v1/leaderboard`, { method: "OPTIONS", headers: { Origin: "https://mocheto.github.io" } }),
  ]) {
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("content-security-policy"), "default-src 'none'; frame-ancestors 'none'");
  }
});
