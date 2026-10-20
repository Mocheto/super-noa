import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import test from "node:test";
import { Pool } from "pg";
import { createRankingServer, leaderboardQuery, rankingSchema } from "./ranking-server.mjs";

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
  const server = createRankingServer({ pool, tokenPepper: "test", logger: { error: (...args) => errors.push(args) } });
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
