import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import test from "node:test";
import { Pool } from "pg";
import { approveAllQuery, createRankingServer, leaderboardQuery, rankingSchema } from "./ranking-server.mjs";
import { provisionalName } from "./ranking-domain.mjs";

/** Estas pruebas hacen muchas peticiones seguidas desde la misma IP: el límite de peticiones tiene sus propias pruebas. */
const sinLimite = { take: () => ({ ok: true }) };

test("PostgreSQL real: migración histórica, acumulación, fechas y desempates", {
  skip: !process.env.TEST_RANKING_DATABASE_URL,
}, async (t) => {
  const schema = `ranking_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new Pool({ connectionString: process.env.TEST_RANKING_DATABASE_URL });
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool = new Pool({ connectionString: process.env.TEST_RANKING_DATABASE_URL, options: `-c search_path=${schema}` });
  t.after(async () => {
    await pool.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  });
  await pool.query(`CREATE TABLE super_noa_ranking_profiles (
    id UUID PRIMARY KEY, alias VARCHAR(16) NOT NULL, alias_key VARCHAR(16) NOT NULL UNIQUE,
    token_hash CHAR(64) NOT NULL, world SMALLINT NOT NULL DEFAULT 0,
    completed_levels SMALLINT NOT NULL DEFAULT 0, stickers SMALLINT NOT NULL DEFAULT 0,
    boss_challenges SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  for (const world of [7, 8, 12]) {
    await pool.query(`INSERT INTO super_noa_ranking_profiles
      (id, alias, alias_key, token_hash, world, completed_levels, updated_at)
      VALUES ($1, $2, $2, $3, $4, 3, '2020-01-01T00:00:00Z')`, [randomUUID(), `Legacy${world}`, "a".repeat(64), world]);
  }
  await pool.query(rankingSchema);
  await pool.query(rankingSchema);
  const historical = await pool.query(`${leaderboardQuery.replace("LIMIT $1", "")}`);
  assert.equal(historical.rows.length, 3);
  for (const row of historical.rows) {
    assert.equal(row.totalApples, 0);
    assert.equal(row.achievedAt, null);
    assert.equal(row.campaignWorld, row.world === 12 ? 10 : null);
    assert.equal(row.updatedAt.toISOString(), "2020-01-01T00:00:00.000Z");
  }

  const errors = [];
  const server = createRankingServer({ pool, tokenPepper: "test", rateLimiter: sinLimite, logger: { error: (...args) => errors.push(args) } });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  async function register(alias) {
    const response = await fetch(`${url}/v1/devices`, { method: "POST", body: JSON.stringify({ alias }) });
    assert.equal(response.status, 201);
    return response.json();
  }
  const card = await register("NoaLuna");
  const base = { world: 0, completedLevels: 0, stickers: 0, bossChallenges: 0 };
  async function sync(progress, device = card) {
    const response = await fetch(`${url}/v1/progress`, {
      method: "POST",
      headers: { "X-Super-Noa-Device": device.deviceId, "X-Super-Noa-Token": device.deviceToken },
      body: JSON.stringify(progress),
    });
    assert.equal(response.status, 200);
    return response.json();
  }
  const early = "2026-01-01T00:00:00.000Z";
  const later = "2026-02-01T00:00:00.000Z";
  const future = "2026-03-01T00:00:00.000Z";
  assert.equal((await sync({ ...base, achievedAt: early })).achievedAt, null, "el mundo cero no es una ganancia");
  const first = { ...base, world: 9, completedLevels: 10, stickers: 5, bossChallenges: 2, totalApples: 40, achievedAt: early };
  let row = await sync(first);
  assert.equal(row.totalApples, 40);
  assert.equal(typeof row.totalApples, "number");
  assert.equal(row.achievedAt, early);
  assert.equal(row.campaignWorld, 7);
  row = await sync({ ...first, achievedAt: future });
  assert.equal(row.achievedAt, early, "sin ganancias no reemplaza la fecha");
  row = await sync({ ...first, totalApples: 45, achievedAt: later });
  assert.equal(row.achievedAt, later);
  row = await sync({ ...base, world: 8, totalApples: 1, achievedAt: future });
  assert.equal(row.totalApples, 45);
  assert.equal(row.world, 9);
  assert.equal(row.campaignWorld, 7);
  assert.equal(row.completedLevels, 10);
  assert.equal(row.stickers, 5);
  assert.equal(row.bossChallenges, 2);
  assert.equal(row.achievedAt, later);
  row = await sync({ ...base, totalApples: 50, achievedAt: early });
  assert.equal(row.achievedAt, later, "la unión de contadores no retrocede la fecha");
  row = await sync({ ...base, completedLevels: 11 });
  assert.equal(row.totalApples, 50);
  assert.equal(row.achievedAt, later, "el cliente antiguo conserva campos ausentes");
  row = await sync({ ...base, totalApples: 51, achievedAt: null });
  assert.equal(row.achievedAt, null);
  row = await sync({ ...base, totalApples: 52, achievedAt: later });
  assert.equal(row.achievedAt, later);
  row = await sync({ ...base, totalApples: 52, achievedAt: null });
  assert.equal(row.achievedAt, later);

  await Promise.all([53, 58, 55, 57].map((totalApples) => sync({ ...base, totalApples, achievedAt: early })));
  row = await sync(base);
  assert.equal(row.totalApples, 58);
  assert.equal(row.achievedAt, later);
  assert.ok(row.updatedAt);

  const second = await register("NoaSol");
  const third = await register("NoaMar");
  // El orden se comprueba con los alias ya aprobados (sin aprobar, los demás ven el nombre provisional).
  await pool.query(approveAllQuery);
  const tied = { ...base, completedLevels: 11, stickers: 5, bossChallenges: 2, totalApples: 58 };
  await sync({ ...tied, achievedAt: early }, second);
  await sync({ ...tied, achievedAt: null }, third);
  let response = await fetch(`${url}/v1/leaderboard`);
  let players = (await response.json()).players;
  assert.deepEqual(players.slice(0, 3).map((player) => player.alias), ["NoaSol", "NoaLuna", "NoaMar"]);
  await sync({ ...tied, totalApples: 59, achievedAt: future }, third);
  response = await fetch(`${url}/v1/leaderboard`);
  players = (await response.json()).players;
  assert.equal(players[0].alias, "NoaMar", "las manzanas preceden a la fecha");
  await sync({ ...tied, completedLevels: 12, totalApples: 0 }, second);
  response = await fetch(`${url}/v1/leaderboard`);
  assert.equal((await response.json()).players[0].alias, "NoaSol", "la campaña conserva prioridad");
  await sync({ ...tied, stickers: 6 }, third);
  response = await fetch(`${url}/v1/leaderboard`);
  assert.equal((await response.json()).players[1].alias, "NoaMar", "las pegatinas preceden a las manzanas");
  await sync({ ...tied, stickers: 6, bossChallenges: 3 }, card);
  response = await fetch(`${url}/v1/leaderboard`);
  assert.equal((await response.json()).players[1].alias, "NoaLuna", "los duelos preceden a las manzanas");

  const water = await register("NoaAgua");
  row = await sync({ ...base, world: 8, totalApples: 1, achievedAt: early }, water);
  assert.equal(row.world, 8);
  assert.equal(row.campaignWorld, null);
  row = await sync({ ...base, world: 7 }, water);
  assert.equal(row.world, 8);
  assert.equal(row.campaignWorld, null);
  row = await sync({ ...base, world: 6 }, water);
  assert.equal(row.world, 6, "un mundo conocido sustituye el desvío histórico desconocido");
  assert.equal(row.campaignWorld, 6);
  row = await sync({ ...base, world: 8 }, water);
  assert.equal(row.world, 6);
  assert.equal(row.campaignWorld, 6);

  row = await sync({ ...base, totalApples: Number.MAX_SAFE_INTEGER });
  assert.equal(row.totalApples, Number.MAX_SAFE_INTEGER);
  await assert.rejects(pool.query("UPDATE super_noa_ranking_profiles SET total_apples = 9007199254740992 WHERE id = $1", [card.deviceId]), /total_apples_check/);
  await assert.rejects(pool.query("UPDATE super_noa_ranking_profiles SET total_apples = -1 WHERE id = $1", [card.deviceId]), /total_apples_check/);
  await pool.query(rankingSchema);
  row = await sync(base);
  assert.equal(row.totalApples, Number.MAX_SAFE_INTEGER, "repetir la migración conserva totales");
  assert.equal(row.achievedAt, later, "repetir la migración conserva fechas");
  assert.equal((await fetch(`${url}/health`)).status, 200);
  assert.deepEqual(errors, []);
  await pool.query("ALTER TABLE super_noa_ranking_profiles RENAME COLUMN achieved_at TO missing_achieved_at");
  const unavailable = await fetch(`${url}/health`);
  assert.equal(unavailable.status, 503, "una base conectada sin el esquema necesario no está lista");
  assert.equal((await unavailable.json()).retryable, true);
  assert.equal(errors.length, 1);
});

async function databaseFixture(t) {
  const schema = `ranking_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new Pool({ connectionString: process.env.TEST_RANKING_DATABASE_URL });
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool = new Pool({ connectionString: process.env.TEST_RANKING_DATABASE_URL, options: `-c search_path=${schema}` });
  t.after(async () => {
    await pool.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  });
  return pool;
}

async function serverFixture(t, pool, options = {}) {
  const errors = [];
  const server = createRankingServer({ pool, tokenPepper: "test", rateLimiter: sinLimite, logger: { error: (...args) => errors.push(args) }, ...options });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  return { url, errors };
}

test("PostgreSQL real: los alias que ya había pasan a pendientes con su progreso y su puesto", {
  skip: !process.env.TEST_RANKING_DATABASE_URL,
}, async (t) => {
  const pool = await databaseFixture(t);
  // El esquema anterior a la revisión, con dos jugadoras y su progreso.
  await pool.query(rankingSchema.split("-- Revisión de alias")[0]);
  const viejas = [randomUUID(), randomUUID()];
  await pool.query(`INSERT INTO super_noa_ranking_profiles (id, alias, alias_key, token_hash, completed_levels, created_at)
    VALUES ($1, 'Primera', 'primera', $3, 20, '2025-05-01T00:00:00Z'), ($2, 'Segunda', 'segunda', $3, 10, '2025-06-01T00:00:00Z')`, [...viejas, "a".repeat(64)]);
  await pool.query(rankingSchema);
  await pool.query(rankingSchema);
  const filas = (await pool.query(`SELECT id, alias, alias_status, approved_alias, alias_submitted_at, completed_levels FROM super_noa_ranking_profiles ORDER BY completed_levels DESC`)).rows;
  assert.deepEqual(filas.map((fila) => [fila.alias, fila.alias_status, fila.approved_alias, fila.completed_levels]), [["Primera", "pending", null, 20], ["Segunda", "pending", null, 10]]);
  assert.equal(filas[0].alias_submitted_at.toISOString(), "2025-05-01T00:00:00.000Z", "la fecha de envío es la de la tarjeta");
  await assert.rejects(pool.query("UPDATE super_noa_ranking_profiles SET alias_status = 'raro'"), /alias_status_check/);
  const { url } = await serverFixture(t, pool);
  const players = (await (await fetch(`${url}/v1/leaderboard`)).json()).players;
  assert.deepEqual(players.map((player) => player.alias), viejas.map(provisionalName), "mismo puesto, con el nombre provisional");
  assert.deepEqual(Object.keys(players[0]).sort(), ["achievedAt", "alias", "bossChallenges", "campaignWorld", "completedLevels", "stickers", "totalApples", "updatedAt", "world"]);
});

test("PostgreSQL real: filtro, estados, tablón y revisión de alias", {
  skip: !process.env.TEST_RANKING_DATABASE_URL,
}, async (t) => {
  const pool = await databaseFixture(t);
  await pool.query(rankingSchema);
  const adminToken = "clave-de-prueba-larga-0123456789";
  const { url, errors } = await serverFixture(t, pool, { adminToken });
  const post = (path, body, headers = {}) => fetch(`${url}${path}`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
  const asDevice = (card) => ({ "X-Super-Noa-Device": card.deviceId, "X-Super-Noa-Token": card.deviceToken });
  const asAdmin = (token = adminToken) => ({ Authorization: `Bearer ${token}` });
  const board = async () => (await (await fetch(`${url}/v1/leaderboard`)).json()).players.map((player) => player.alias);
  const own = async (card) => (await fetch(`${url}/v1/device`, { headers: asDevice(card) })).json();

  // Filtro: ni al apuntarse ni al cambiar de alias.
  for (const alias of ["Pu7a", "M1erda", "p u t a"]) {
    const blocked = await post("/v1/devices", { alias });
    assert.equal(blocked.status, 400, alias);
    assert.equal((await blocked.json()).code, "alias_not_allowed", alias);
  }
  assert.equal((await pool.query("SELECT 1 FROM super_noa_ranking_profiles")).rowCount, 0);

  const luna = await (await post("/v1/devices", { alias: "NoaLuna" })).json();
  assert.equal(luna.aliasStatus, "pending");
  const sol = await (await post("/v1/devices", { alias: "NoaSol" })).json();
  await post("/v1/progress", { world: 2, completedLevels: 5, stickers: 0, bossChallenges: 0 }, asDevice(luna));
  assert.deepEqual(await board(), [provisionalName(luna.deviceId), provisionalName(sol.deviceId)], "pendientes: los demás ven el nombre provisional");
  assert.deepEqual(await own(luna), { alias: "NoaLuna", aliasStatus: "pending", publicAlias: provisionalName(luna.deviceId) }, "el dispositivo ve su alias y su estado");
  const progreso = await (await post("/v1/progress", { world: 2, completedLevels: 5, stickers: 0, bossChallenges: 0 }, asDevice(luna))).json();
  assert.equal(progreso.alias, "NoaLuna");
  assert.equal(progreso.aliasStatus, "pending");

  // Clave mala, ausente o sin configurar.
  for (const headers of [{}, asAdmin("otra-clave-que-no-es-la-buena"), asAdmin(adminToken.slice(0, -1)), { Authorization: adminToken }]) {
    const denied = await fetch(`${url}/v1/admin/aliases`, { headers });
    assert.equal(denied.status, 401);
    const body = await denied.text();
    assert.match(body, /admin_invalid/);
    assert.doesNotMatch(body, new RegExp(adminToken));
  }
  assert.equal((await post("/v1/admin/aliases/approve-all", {}, asAdmin("mala-mala-mala-mala"))).status, 401);
  assert.equal((await pool.query("SELECT 1 FROM super_noa_ranking_profiles WHERE alias_status = 'approved'")).rowCount, 0, "una clave mala no aprueba nada");

  const pendientes = (await (await fetch(`${url}/v1/admin/aliases`, { headers: asAdmin() })).json()).aliases;
  assert.deepEqual(pendientes.map((fila) => [fila.alias, fila.aliasStatus]), [["NoaLuna", "pending"], ["NoaSol", "pending"]]);
  assert.ok(pendientes.every((fila) => fila.submittedAt));

  // Aprobar uno y rechazar otro.
  assert.deepEqual(await (await post("/v1/admin/aliases/approve", { ids: [luna.deviceId] }, asAdmin())).json(), { updated: 1 });
  assert.deepEqual(await (await post("/v1/admin/aliases/reject", { ids: [sol.deviceId] }, asAdmin())).json(), { updated: 1 });
  assert.deepEqual(await board(), ["NoaLuna", provisionalName(sol.deviceId)]);
  assert.equal((await own(sol)).aliasStatus, "rejected");

  // Un rechazado elige otro: vuelve a pendiente, con el nombre provisional mientras tanto.
  const nuevo = await (await post("/v1/alias", { alias: "NoaEstrella" }, asDevice(sol))).json();
  assert.deepEqual(nuevo, { alias: "NoaEstrella", aliasStatus: "pending" });
  assert.equal((await board())[1], provisionalName(sol.deviceId));
  assert.equal((await post("/v1/alias", { alias: "Sh1t" }, asDevice(sol))).status, 400);
  assert.equal((await post("/v1/alias", { alias: "noaluna" }, asDevice(sol))).status, 409, "un alias ocupado no se puede tomar");
  assert.equal((await post("/v1/alias", { alias: "OtraCosa" }, { "X-Super-Noa-Device": sol.deviceId, "X-Super-Noa-Token": "b".repeat(43) })).status, 401);

  // Cambiar un alias aprobado: los demás ven el aprobado anterior hasta que se revise.
  assert.deepEqual(await (await post("/v1/alias", { alias: "LunaNueva" }, asDevice(luna))).json(), { alias: "LunaNueva", aliasStatus: "pending" });
  assert.equal((await board())[0], "NoaLuna");
  assert.deepEqual(await (await post("/v1/alias", { alias: "lunanueva" }, asDevice(luna))).json(), { alias: "LunaNueva", aliasStatus: "pending" }, "el mismo alias no cambia nada");
  await post("/v1/admin/aliases/reject", { ids: [luna.deviceId] }, asAdmin());
  assert.equal((await board())[0], "NoaLuna", "si se rechaza el cambio, sigue el aprobado anterior");

  // Aprobar todos y ocultar uno aprobado.
  assert.deepEqual(await (await post("/v1/admin/aliases/approve-all", {}, asAdmin())).json(), { updated: 1 });
  assert.deepEqual(await board(), ["NoaLuna", "NoaEstrella"]);
  await post("/v1/admin/aliases/hide", { ids: [sol.deviceId] }, asAdmin());
  assert.deepEqual(await board(), ["NoaLuna", provisionalName(sol.deviceId)]);
  assert.equal((await own(sol)).aliasStatus, "hidden");
  const ocultos = (await (await fetch(`${url}/v1/admin/aliases?status=hidden`, { headers: asAdmin() })).json()).aliases;
  assert.deepEqual(ocultos.map((fila) => fila.alias), ["NoaEstrella"]);
  assert.equal((await fetch(`${url}/v1/admin/aliases?status=raro`, { headers: asAdmin() })).status, 400);
  assert.equal((await post("/v1/admin/aliases/approve", { ids: ["no-es-una-tarjeta"] }, asAdmin())).status, 400);
  assert.deepEqual(errors, []);

  // Sin clave en el entorno, la revisión no existe.
  const sinClave = await serverFixture(t, pool);
  assert.equal((await fetch(`${sinClave.url}/v1/admin/aliases`, { headers: asAdmin() })).status, 404);
});

test("PostgreSQL real: la migración amplía los máximos que se quedan cortos y nunca estrecha los más amplios", {
  skip: !process.env.TEST_RANKING_DATABASE_URL,
}, async (t) => {
  const schema = `ranking_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new Pool({ connectionString: process.env.TEST_RANKING_DATABASE_URL });
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool = new Pool({ connectionString: process.env.TEST_RANKING_DATABASE_URL, options: `-c search_path=${schema}` });
  t.after(async () => {
    await pool.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  });
  const maximo = async (columna) => (await pool.query(`SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint
    WHERE conrelid = 'super_noa_ranking_profiles'::REGCLASS AND conname = $1`, [`super_noa_ranking_profiles_${columna}_check`])).rows[0]?.def;
  await pool.query(rankingSchema);
  assert.match(await maximo("world"), /<= 17/);
  assert.match(await maximo("total_apples"), /9007199254740991/);
  // Una versión posterior ya admitía el mundo 20 y hay datos con él: volver a esta no debe estrecharlo ni impedir arrancar.
  await pool.query(`ALTER TABLE super_noa_ranking_profiles DROP CONSTRAINT super_noa_ranking_profiles_world_check,
    ADD CONSTRAINT super_noa_ranking_profiles_world_check CHECK (world BETWEEN 0 AND 20)`);
  await pool.query(`INSERT INTO super_noa_ranking_profiles (id, alias, alias_key, token_hash, world) VALUES ($1, 'Futuro', 'futuro', $2, 20)`, [randomUUID(), "a".repeat(64)]);
  // Una más antigua dejó los pegatinas cortas: se amplían.
  await pool.query(`ALTER TABLE super_noa_ranking_profiles DROP CONSTRAINT super_noa_ranking_profiles_stickers_check,
    ADD CONSTRAINT super_noa_ranking_profiles_stickers_check CHECK (stickers BETWEEN 0 AND 36)`);
  await pool.query(rankingSchema);
  await pool.query(rankingSchema);
  assert.match(await maximo("world"), /<= 20/);
  assert.match(await maximo("stickers"), /<= 51/);
  assert.match(await maximo("alias_status"), /pending/);
});
