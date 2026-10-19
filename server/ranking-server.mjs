import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { createDeviceCredentials, hashDeviceToken, normalizeAlias, validateDeviceCredentials, validateProgress } from "./ranking-domain.mjs";

export const rankingSchema = `
  CREATE TABLE IF NOT EXISTS super_noa_ranking_profiles (
    id UUID PRIMARY KEY,
    alias VARCHAR(16) NOT NULL,
    alias_key VARCHAR(16) NOT NULL UNIQUE,
    token_hash CHAR(64) NOT NULL,
    world SMALLINT NOT NULL DEFAULT 0,
    completed_levels SMALLINT NOT NULL DEFAULT 0,
    stickers SMALLINT NOT NULL DEFAULT 0,
    boss_challenges SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ALTER TABLE super_noa_ranking_profiles ADD COLUMN IF NOT EXISTS campaign_world SMALLINT;
  UPDATE super_noa_ranking_profiles
    SET campaign_world = CASE WHEN world BETWEEN 0 AND 6 THEN world WHEN world BETWEEN 9 AND 12 THEN world - 2 ELSE NULL END
    WHERE campaign_world IS NULL;
  ALTER TABLE super_noa_ranking_profiles
    DROP CONSTRAINT IF EXISTS super_noa_ranking_profiles_world_check,
    DROP CONSTRAINT IF EXISTS super_noa_ranking_profiles_completed_levels_check,
    DROP CONSTRAINT IF EXISTS super_noa_ranking_profiles_stickers_check,
    DROP CONSTRAINT IF EXISTS super_noa_ranking_profiles_boss_challenges_check,
    DROP CONSTRAINT IF EXISTS super_noa_ranking_profiles_campaign_world_check;
  ALTER TABLE super_noa_ranking_profiles
    ADD CONSTRAINT super_noa_ranking_profiles_world_check CHECK (world BETWEEN 0 AND 12),
    ADD CONSTRAINT super_noa_ranking_profiles_completed_levels_check CHECK (completed_levels BETWEEN 0 AND 30),
    ADD CONSTRAINT super_noa_ranking_profiles_stickers_check CHECK (stickers BETWEEN 0 AND 36),
    ADD CONSTRAINT super_noa_ranking_profiles_boss_challenges_check CHECK (boss_challenges BETWEEN 0 AND 12),
    ADD CONSTRAINT super_noa_ranking_profiles_campaign_world_check CHECK (campaign_world BETWEEN 0 AND 10);
`;

const playerColumns = `alias, world, campaign_world AS "campaignWorld", completed_levels AS "completedLevels",
  stickers, boss_challenges AS "bossChallenges", updated_at AS "updatedAt"`;

// Los agregados antiguos con world=7/8 no permiten recuperar el mundo de campaña.
// completed_levels sí es exacto en todas las versiones y nunca cuenta los desvíos.
export const leaderboardQuery = `SELECT ${playerColumns}
  FROM super_noa_ranking_profiles
  ORDER BY completed_levels DESC, stickers DESC, boss_challenges DESC, updated_at ASC, id ASC
  LIMIT $1`;

class RequestError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 10_000) throw new RequestError(413, "request_failed", "La petición es demasiado grande.");
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new RequestError(400, "request_failed", "El cuerpo debe ser JSON válido.");
  }
}

export async function registerProfile(pool, alias, credentials, pepper) {
  const tokenHash = hashDeviceToken(pepper, credentials.token);
  const aliasKey = alias.toLocaleLowerCase("es");
  const inserted = await pool.query(
    `INSERT INTO super_noa_ranking_profiles (id, alias, alias_key, token_hash)
     VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING alias`,
    [credentials.id, alias, aliasKey, tokenHash],
  );
  if (inserted.rowCount === 1) return { alias: inserted.rows[0].alias, created: true };
  const existing = await pool.query(
    "SELECT alias, alias_key, token_hash FROM super_noa_ranking_profiles WHERE id = $1", [credentials.id],
  );
  const profile = existing.rows[0];
  if (!profile) throw new RequestError(409, "alias_taken", "Ese alias ya está jugando. Prueba otro.");
  if (profile.token_hash !== tokenHash) throw new RequestError(401, "device_invalid", "La tarjeta de este dispositivo no es válida.");
  if (profile.alias_key !== aliasKey) throw new RequestError(409, "device_exists", "Esta tarjeta ya tiene otro nombre. Conserva tu tarjeta para seguir jugando.");
  return { alias: profile.alias, created: false };
}

export function createRankingServer({ pool, tokenPepper, allowedOrigins = new Set(["https://mocheto.github.io"]), release = "manual", logger = console }) {
  function sendJson(response, status, payload, origin) {
    const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
    if (origin && allowedOrigins.has(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers.Vary = "Origin";
    }
    response.writeHead(status, headers);
    response.end(JSON.stringify(payload));
  }

  return createServer(async (request, response) => {
    const origin = request.headers.origin;
    if (request.method === "OPTIONS") {
      if (!origin || !allowedOrigins.has(origin)) return sendJson(response, 403, { error: "Origen no permitido.", code: "request_failed", retryable: false });
      response.writeHead(204, {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Super-Noa-Device, X-Super-Noa-Token",
        "Access-Control-Max-Age": "600", Vary: "Origin",
      });
      return response.end();
    }
    if (origin && !allowedOrigins.has(origin)) return sendJson(response, 403, { error: "Origen no permitido.", code: "request_failed", retryable: false });
    try {
      const url = new URL(request.url ?? "/", "http://localhost");
      if (request.method === "GET" && url.pathname === "/health") return sendJson(response, 200, { status: "bien", release, registrationVersion: 2 }, origin);
      if (request.method === "GET" && url.pathname === "/v1/leaderboard") {
        const requested = Number.parseInt(url.searchParams.get("limit") ?? "20", 10);
        const limit = Number.isInteger(requested) ? Math.min(Math.max(requested, 1), 50) : 20;
        const result = await pool.query(leaderboardQuery, [limit]);
        return sendJson(response, 200, { players: result.rows }, origin);
      }
      if (request.method === "POST" && url.pathname === "/v1/devices") {
        const body = await readJson(request);
        const alias = normalizeAlias(body?.alias);
        if (!alias) throw new RequestError(400, "invalid_alias", "El alias debe tener entre 3 y 16 letras o números.");
        const supplied = body.deviceId !== undefined || body.deviceToken !== undefined;
        const credentials = supplied ? validateDeviceCredentials(body) : createDeviceCredentials(tokenPepper);
        if (!credentials) throw new RequestError(400, "device_invalid", "No pude leer la tarjeta de este dispositivo.");
        const registered = await registerProfile(pool, alias, credentials, tokenPepper);
        return sendJson(response, registered.created ? 201 : 200, {
          deviceId: credentials.id, deviceToken: credentials.token, alias: registered.alias,
        }, origin);
      }
      if (request.method === "POST" && url.pathname === "/v1/progress") {
        const credentials = validateDeviceCredentials({
          deviceId: request.headers["x-super-noa-device"], deviceToken: request.headers["x-super-noa-token"],
        });
        if (!credentials) throw new RequestError(401, "device_invalid", "Falta una tarjeta válida de este dispositivo.");
        const progress = validateProgress(await readJson(request));
        if (!progress) throw new RequestError(400, "request_failed", "El progreso no es válido.");
        const result = await pool.query(
          `UPDATE super_noa_ranking_profiles SET world = $3, completed_levels = $4, stickers = $5,
           boss_challenges = $6, campaign_world = $7, updated_at = NOW()
           WHERE id = $1 AND token_hash = $2 RETURNING ${playerColumns}`,
          [credentials.id, hashDeviceToken(tokenPepper, credentials.token), progress.world, progress.completedLevels, progress.stickers, progress.bossChallenges, progress.campaignWorld],
        );
        if (result.rowCount !== 1) throw new RequestError(401, "device_invalid", "La tarjeta de este dispositivo no es válida.");
        return sendJson(response, 200, result.rows[0], origin);
      }
      throw new RequestError(404, "request_failed", "No encuentro ese camino.");
    } catch (error) {
      if (error instanceof RequestError) return sendJson(response, error.status, { error: error.message, code: error.code, retryable: false }, origin);
      logger.error("El ranking no pudo completar la petición.", error);
      return sendJson(response, 503, { error: "El ranking está descansando un momento. Tu aventura sigue guardada aquí; vuelve a intentarlo.", code: "server_unavailable", retryable: true }, origin);
    }
  });
}

async function main() {
  const port = Number.parseInt(process.env.PORT ?? "8088", 10);
  if (!process.env.DATABASE_URL || !process.env.RANKING_TOKEN_PEPPER) throw new Error("DATABASE_URL y RANKING_TOKEN_PEPPER son obligatorios.");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT debe ser un puerto válido.");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  pool.on("error", (error) => console.error("Se perdió una conexión inactiva del ranking; se abrirá otra cuando haga falta.", error));
  try {
    await pool.query(rankingSchema);
  } catch (error) {
    await pool.end();
    throw error;
  }
  const server = createRankingServer({
    pool, tokenPepper: process.env.RANKING_TOKEN_PEPPER,
    allowedOrigins: new Set((process.env.RANKING_ALLOWED_ORIGINS ?? "https://mocheto.github.io").split(",").map((origin) => origin.trim()).filter(Boolean)),
    release: /^[a-f\d]{40}$/.test(process.env.RANKING_RELEASE_SHA ?? "") ? process.env.RANKING_RELEASE_SHA.slice(0, 12) : "manual",
  });
  server.listen(port, "0.0.0.0", () => console.info(`Ranking de Super Noa listo en el puerto ${port}.`));
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    server.close(() => {
      pool.end().catch((error) => { console.error("No se pudo cerrar el ranking.", error); process.exitCode = 1; });
    });
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => { console.error("No se pudo iniciar el ranking.", error); process.exitCode = 1; });
}
