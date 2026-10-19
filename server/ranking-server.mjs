import { createServer } from "node:http";
import { Pool } from "pg";
import {
  createDeviceCredentials,
  hashDeviceToken,
  normalizeAlias,
  validateProgress,
} from "./ranking-domain.mjs";

const port = Number.parseInt(process.env.PORT ?? "8088", 10);
const databaseUrl = process.env.DATABASE_URL;
const tokenPepper = process.env.RANKING_TOKEN_PEPPER;
const release = /^[a-f\d]{40}$/.test(process.env.RANKING_RELEASE_SHA ?? "")
  ? process.env.RANKING_RELEASE_SHA.slice(0, 12)
  : "manual";
const allowedOrigins = new Set((process.env.RANKING_ALLOWED_ORIGINS ?? "https://mocheto.github.io")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean));

if (!databaseUrl || !tokenPepper) {
  throw new Error("DATABASE_URL y RANKING_TOKEN_PEPPER son obligatorios.");
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT debe ser un puerto válido.");
}

const pool = new Pool({ connectionString: databaseUrl });

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS super_noa_ranking_profiles (
      id UUID PRIMARY KEY,
      alias VARCHAR(16) NOT NULL,
      alias_key VARCHAR(16) NOT NULL UNIQUE,
      token_hash CHAR(64) NOT NULL,
      world SMALLINT NOT NULL DEFAULT 0 CHECK (world BETWEEN 0 AND 9),
      completed_levels SMALLINT NOT NULL DEFAULT 0 CHECK (completed_levels BETWEEN 0 AND 25),
      stickers SMALLINT NOT NULL DEFAULT 0 CHECK (stickers BETWEEN 0 AND 27),
      boss_challenges SMALLINT NOT NULL DEFAULT 0 CHECK (boss_challenges BETWEEN 0 AND 9),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE super_noa_ranking_profiles
      DROP CONSTRAINT IF EXISTS super_noa_ranking_profiles_world_check,
      DROP CONSTRAINT IF EXISTS super_noa_ranking_profiles_completed_levels_check,
      DROP CONSTRAINT IF EXISTS super_noa_ranking_profiles_stickers_check,
      DROP CONSTRAINT IF EXISTS super_noa_ranking_profiles_boss_challenges_check;
    ALTER TABLE super_noa_ranking_profiles
      ADD CONSTRAINT super_noa_ranking_profiles_world_check CHECK (world BETWEEN 0 AND 9),
      ADD CONSTRAINT super_noa_ranking_profiles_completed_levels_check CHECK (completed_levels BETWEEN 0 AND 25),
      ADD CONSTRAINT super_noa_ranking_profiles_stickers_check CHECK (stickers BETWEEN 0 AND 27),
      ADD CONSTRAINT super_noa_ranking_profiles_boss_challenges_check CHECK (boss_challenges BETWEEN 0 AND 9);
  `);
}

function sendJson(response, status, payload, origin) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };
  if (origin && allowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }
  response.writeHead(status, headers);
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 10_000) throw new Error("La petición es demasiado grande.");
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("El cuerpo debe ser JSON válido.");
  }
}

function getCredentials(request) {
  const id = request.headers["x-super-noa-device"];
  const token = request.headers["x-super-noa-token"];
  if (typeof id !== "string" || typeof token !== "string" || !id || !token) return null;
  return { id, token };
}

async function handleRegister(request, response, origin) {
  const body = await readJson(request);
  const alias = normalizeAlias(body?.alias);
  if (!alias) return sendJson(response, 400, { error: "El alias debe tener entre 3 y 16 letras o números." }, origin);

  const credentials = createDeviceCredentials(tokenPepper);
  try {
    await pool.query(
      `INSERT INTO super_noa_ranking_profiles (id, alias, alias_key, token_hash)
       VALUES ($1, $2, $3, $4)`,
      [credentials.id, alias, alias.toLocaleLowerCase("es"), credentials.tokenHash],
    );
  } catch (error) {
    if (error?.code === "23505") {
      return sendJson(response, 409, { error: "Ese alias ya está jugando. Prueba otro." }, origin);
    }
    throw error;
  }
  return sendJson(response, 201, { deviceId: credentials.id, deviceToken: credentials.token, alias }, origin);
}

async function handleUpdate(request, response, origin) {
  const credentials = getCredentials(request);
  if (!credentials) return sendJson(response, 401, { error: "Falta la tarjeta de este dispositivo." }, origin);
  const progress = validateProgress(await readJson(request));
  if (!progress) return sendJson(response, 400, { error: "El progreso no es válido." }, origin);

  const result = await pool.query(
    `UPDATE super_noa_ranking_profiles
     SET world = $3, completed_levels = $4, stickers = $5, boss_challenges = $6, updated_at = NOW()
     WHERE id = $1 AND token_hash = $2
     RETURNING alias, world, completed_levels AS "completedLevels", stickers, boss_challenges AS "bossChallenges", updated_at AS "updatedAt"`,
    [credentials.id, hashDeviceToken(tokenPepper, credentials.token), progress.world, progress.completedLevels, progress.stickers, progress.bossChallenges],
  );
  if (result.rowCount !== 1) return sendJson(response, 401, { error: "La tarjeta de este dispositivo no es válida." }, origin);
  return sendJson(response, 200, result.rows[0], origin);
}

async function handleLeaderboard(response, origin, url) {
  const requestedLimit = Number.parseInt(url.searchParams.get("limit") ?? "20", 10);
  const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 20;
  const result = await pool.query(
    `SELECT alias, world, completed_levels AS "completedLevels", stickers, boss_challenges AS "bossChallenges", updated_at AS "updatedAt"
     FROM super_noa_ranking_profiles
     ORDER BY world DESC, completed_levels DESC, stickers DESC, boss_challenges DESC, updated_at ASC
     LIMIT $1`,
    [limit],
  );
  return sendJson(response, 200, { players: result.rows }, origin);
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (request.method === "OPTIONS") {
    if (!origin || !allowedOrigins.has(origin)) return sendJson(response, 403, { error: "Origen no permitido." });
    response.writeHead(204, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Super-Noa-Device, X-Super-Noa-Token",
      "Access-Control-Max-Age": "600",
      Vary: "Origin",
    });
    return response.end();
  }
  if (origin && !allowedOrigins.has(origin)) return sendJson(response, 403, { error: "Origen no permitido." });

  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (request.method === "GET" && url.pathname === "/health") return sendJson(response, 200, { status: "bien", release }, origin);
    if (request.method === "GET" && url.pathname === "/v1/leaderboard") return await handleLeaderboard(response, origin, url);
    if (request.method === "POST" && url.pathname === "/v1/devices") return await handleRegister(request, response, origin);
    if (request.method === "POST" && url.pathname === "/v1/progress") return await handleUpdate(request, response, origin);
    return sendJson(response, 404, { error: "No encuentro ese camino." }, origin);
  } catch (error) {
    console.error(error);
    return sendJson(response, 400, { error: error instanceof Error ? error.message : "No pude leer la petición." }, origin);
  }
});

await initializeDatabase();
server.listen(port, "0.0.0.0", () => console.info(`Ranking de Super Noa listo en el puerto ${port}.`));

async function stop() {
  server.close();
  await pool.end();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
