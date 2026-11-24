import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { adminTokenMatches, aliasAllowed, aliasStatuses, clientIp, createDeviceCredentials, createRateLimiter, hashDeviceToken, normalizeAlias, publicAlias, rateLimitGroup, rateLimits, validateDeviceCredentials, validateProgress } from "./ranking-domain.mjs";

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
  ALTER TABLE super_noa_ranking_profiles ADD COLUMN IF NOT EXISTS total_apples BIGINT NOT NULL DEFAULT 0;
  ALTER TABLE super_noa_ranking_profiles ADD COLUMN IF NOT EXISTS achieved_at TIMESTAMPTZ;
  UPDATE super_noa_ranking_profiles
    SET campaign_world = CASE WHEN world BETWEEN 0 AND 6 THEN world WHEN world BETWEEN 9 AND 13 THEN world - 2 ELSE NULL END
    WHERE campaign_world IS NULL;
  ALTER TABLE super_noa_ranking_profiles
    DROP CONSTRAINT IF EXISTS super_noa_ranking_profiles_world_check,
    DROP CONSTRAINT IF EXISTS super_noa_ranking_profiles_completed_levels_check,
    DROP CONSTRAINT IF EXISTS super_noa_ranking_profiles_stickers_check,
    DROP CONSTRAINT IF EXISTS super_noa_ranking_profiles_boss_challenges_check,
    DROP CONSTRAINT IF EXISTS super_noa_ranking_profiles_campaign_world_check,
    DROP CONSTRAINT IF EXISTS super_noa_ranking_profiles_total_apples_check;
  ALTER TABLE super_noa_ranking_profiles
    ADD CONSTRAINT super_noa_ranking_profiles_world_check CHECK (world BETWEEN 0 AND 17),
    ADD CONSTRAINT super_noa_ranking_profiles_completed_levels_check CHECK (completed_levels BETWEEN 0 AND 45),
    ADD CONSTRAINT super_noa_ranking_profiles_stickers_check CHECK (stickers BETWEEN 0 AND 51),
    ADD CONSTRAINT super_noa_ranking_profiles_boss_challenges_check CHECK (boss_challenges BETWEEN 0 AND 17),
    ADD CONSTRAINT super_noa_ranking_profiles_campaign_world_check CHECK (campaign_world BETWEEN 0 AND 15),
    ADD CONSTRAINT super_noa_ranking_profiles_total_apples_check CHECK (total_apples BETWEEN 0 AND 9007199254740991);
  -- Revisión de alias (issue 314): los alias que ya había pasan a pendientes, con su progreso y su puesto.
  ALTER TABLE super_noa_ranking_profiles ADD COLUMN IF NOT EXISTS alias_status VARCHAR(10);
  ALTER TABLE super_noa_ranking_profiles ADD COLUMN IF NOT EXISTS approved_alias VARCHAR(16);
  ALTER TABLE super_noa_ranking_profiles ADD COLUMN IF NOT EXISTS alias_submitted_at TIMESTAMPTZ;
  UPDATE super_noa_ranking_profiles SET alias_status = 'pending', alias_submitted_at = COALESCE(alias_submitted_at, created_at)
    WHERE alias_status IS NULL;
  ALTER TABLE super_noa_ranking_profiles
    ALTER COLUMN alias_status SET DEFAULT 'pending', ALTER COLUMN alias_status SET NOT NULL,
    ALTER COLUMN alias_submitted_at SET DEFAULT NOW(),
    DROP CONSTRAINT IF EXISTS super_noa_ranking_profiles_alias_status_check;
  ALTER TABLE super_noa_ranking_profiles
    ADD CONSTRAINT super_noa_ranking_profiles_alias_status_check CHECK (alias_status IN ('pending', 'approved', 'rejected', 'hidden'));
`;

const playerColumns = `alias, world, campaign_world AS "campaignWorld", completed_levels AS "completedLevels",
  stickers, boss_challenges AS "bossChallenges", total_apples::DOUBLE PRECISION AS "totalApples",
  achieved_at AS "achievedAt", updated_at AS "updatedAt", alias_status AS "aliasStatus"`;

// Los agregados antiguos con world=7/8 no permiten recuperar el mundo de campaña.
// completed_levels sí es exacto en todas las versiones y nunca cuenta los desvíos.
export const leaderboardQuery = `SELECT id, approved_alias AS "approvedAlias", ${playerColumns}
  FROM super_noa_ranking_profiles
  ORDER BY completed_levels DESC, stickers DESC, boss_challenges DESC, total_apples DESC,
    achieved_at ASC NULLS LAST, created_at ASC, id ASC
  LIMIT $1`;

// Cada contador es acumulativo: un reintento antiguo nunca deshace otro envío.
export const progressUpdateQuery = `UPDATE super_noa_ranking_profiles SET
  world = CASE
    WHEN $7::SMALLINT IS NOT NULL AND (campaign_world IS NULL OR $7 >= campaign_world) THEN $3
    WHEN campaign_world IS NULL THEN GREATEST(world, $3)
    ELSE world END,
  campaign_world = GREATEST(campaign_world, $7::SMALLINT),
  completed_levels = GREATEST(completed_levels, $4::SMALLINT),
  stickers = GREATEST(stickers, $5::SMALLINT),
  boss_challenges = GREATEST(boss_challenges, $6::SMALLINT),
  total_apples = GREATEST(total_apples, $8::BIGINT),
  achieved_at = CASE WHEN $10::BOOLEAN AND (
    ($7::SMALLINT IS NOT NULL AND $7 > COALESCE(campaign_world, 0))
    OR $4 > completed_levels OR $5 > stickers OR $6 > boss_challenges OR $8::BIGINT > total_apples
  ) THEN CASE WHEN $9::TIMESTAMPTZ IS NULL THEN NULL ELSE GREATEST(achieved_at, $9::TIMESTAMPTZ) END
    ELSE achieved_at END,
  updated_at = NOW()
  WHERE id = $1 AND token_hash = $2 RETURNING ${playerColumns}`;

class RequestError extends Error {
  constructor(status, code, message, retryAfter = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

/** Una fila del tablón tal como la ven los demás: sin tarjeta ni estado, y con el alias que les toca ver. */
export function leaderboardRow({ id, approvedAlias, aliasStatus, alias, ...player }) {
  return { alias: publicAlias({ id, alias, aliasStatus, approvedAlias }), ...player };
}

const aliasNotAllowed = () => new RequestError(400, "alias_not_allowed", "Ese nombre no vale. Prueba otro.");

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
     VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING alias, alias_status AS "aliasStatus"`,
    [credentials.id, alias, aliasKey, tokenHash],
  );
  if (inserted.rowCount === 1) return { alias: inserted.rows[0].alias, aliasStatus: inserted.rows[0].aliasStatus ?? "pending", created: true };
  const existing = await pool.query(
    `SELECT alias, alias_key, token_hash, alias_status AS "aliasStatus" FROM super_noa_ranking_profiles WHERE id = $1`, [credentials.id],
  );
  const profile = existing.rows[0];
  if (!profile) throw new RequestError(409, "alias_taken", "Ese alias ya está jugando. Prueba otro.");
  if (profile.token_hash !== tokenHash) throw new RequestError(401, "device_invalid", "La tarjeta de este dispositivo no es válida.");
  if (profile.alias_key !== aliasKey) throw new RequestError(409, "device_exists", "Esta tarjeta ya tiene otro nombre. Conserva tu tarjeta para seguir jugando.");
  return { alias: profile.alias, aliasStatus: profile.aliasStatus ?? "pending", created: false };
}

/**
 * Cambia el alias de una tarjeta: vuelve a quedar pendiente y, si el anterior estaba aprobado, los demás lo siguen
 * viendo hasta que se revise el nuevo. El mismo alias (sin distinguir mayúsculas) no cambia nada.
 */
export async function changeAlias(pool, alias, credentials, pepper) {
  const tokenHash = hashDeviceToken(pepper, credentials.token);
  const aliasKey = alias.toLocaleLowerCase("es");
  let changed;
  try {
    changed = await pool.query(
      `UPDATE super_noa_ranking_profiles SET alias = $3, alias_key = $4, alias_status = 'pending', alias_submitted_at = NOW(),
         approved_alias = CASE WHEN alias_status = 'approved' THEN alias ELSE approved_alias END, updated_at = NOW()
       WHERE id = $1 AND token_hash = $2 AND alias_key <> $4 RETURNING alias, alias_status AS "aliasStatus"`,
      [credentials.id, tokenHash, alias, aliasKey],
    );
  } catch (error) {
    if (error?.code === "23505") throw new RequestError(409, "alias_taken", "Ese alias ya está jugando. Prueba otro.");
    throw error;
  }
  if (changed.rowCount === 1) return changed.rows[0];
  const current = await readOwnProfile(pool, credentials, pepper);
  if (!current) throw new RequestError(401, "device_invalid", "La tarjeta de este dispositivo no es válida.");
  return { alias: current.alias, aliasStatus: current.aliasStatus };
}

async function readOwnProfile(pool, credentials, pepper) {
  const result = await pool.query(
    `SELECT id, alias, alias_status AS "aliasStatus", approved_alias AS "approvedAlias" FROM super_noa_ranking_profiles
     WHERE id = $1 AND token_hash = $2`,
    [credentials.id, hashDeviceToken(pepper, credentials.token)],
  );
  return result.rows[0] ?? null;
}

const uuidPattern = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;
function readIds(body) {
  const ids = body?.ids;
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 200 || !ids.every((id) => typeof id === "string" && uuidPattern.test(id))) {
    throw new RequestError(400, "request_failed", "Hace falta una lista de tarjetas.");
  }
  return ids.map((id) => id.toLowerCase());
}

/** Lo que hace cada botón de la revisión. `$1` es la lista de tarjetas. */
export const adminActions = {
  approve: `UPDATE super_noa_ranking_profiles SET alias_status = 'approved', approved_alias = alias WHERE id = ANY($1::UUID[])`,
  reject: `UPDATE super_noa_ranking_profiles SET alias_status = 'rejected' WHERE id = ANY($1::UUID[]) AND alias_status = 'pending'`,
  hide: `UPDATE super_noa_ranking_profiles SET alias_status = 'hidden', approved_alias = NULL WHERE id = ANY($1::UUID[])`,
};
export const approveAllQuery = `UPDATE super_noa_ranking_profiles SET alias_status = 'approved', approved_alias = alias WHERE alias_status = 'pending'`;
export const adminListQuery = `SELECT id, alias, approved_alias AS "approvedAlias", alias_status AS "aliasStatus",
  alias_submitted_at AS "submittedAt" FROM super_noa_ranking_profiles
  WHERE ($1::TEXT IS NULL OR alias_status = $1) ORDER BY alias_submitted_at ASC NULLS FIRST, id ASC LIMIT 500`;

export function createRankingServer({ pool, tokenPepper, adminToken = null, allowedOrigins = new Set(["https://mocheto.github.io"]), release = "manual", logger = console, rateLimiter = createRateLimiter(), trustedProxies = 1 }) {
  function sendJson(response, status, payload, origin, extraHeaders = {}) {
    const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extraHeaders };
    if (origin && allowedOrigins.has(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
      // Sin esto, el navegador no deja leer `Retry-After` desde otro origen.
      headers["Access-Control-Expose-Headers"] = "Retry-After";
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
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Super-Noa-Device, X-Super-Noa-Token",
        "Access-Control-Max-Age": "600", Vary: "Origin",
      });
      return response.end();
    }
    if (origin && !allowedOrigins.has(origin)) return sendJson(response, 403, { error: "Origen no permitido.", code: "request_failed", retryable: false });
    try {
      const url = new URL(request.url ?? "/", "http://localhost");
      // Primero la IP, antes de leer el cuerpo o tocar la base de datos; el dispositivo se mira en cuanto se conoce.
      const group = rateLimitGroup(request.method, url.pathname);
      const limit = (key, rule) => {
        const verdict = rateLimiter.take(`${group}:${key}`, rule);
        if (!verdict.ok) {
          throw new RequestError(429, "rate_limited", "Hay muchas peticiones seguidas. Espera un poquito y vuelve a intentarlo.", verdict.retryAfter);
        }
      };
      const limitDevice = (deviceId) => {
        if (typeof deviceId === "string" && uuidPattern.test(deviceId)) limit(`device:${deviceId.toLowerCase()}`, rateLimits[group].device);
      };
      limit(`ip:${clientIp(request, trustedProxies)}`, rateLimits[group].ip);
      // Las rutas con la tarjeta en las cabeceras se limitan por dispositivo antes de leer nada más.
      limitDevice(request.headers["x-super-noa-device"]);
      if (request.method === "GET" && url.pathname === "/health") {
        await pool.query("SELECT total_apples, achieved_at, alias_status, approved_alias FROM super_noa_ranking_profiles LIMIT 0");
        return sendJson(response, 200, { status: "bien", release, registrationVersion: 2, progressVersion: 2, aliasReviewVersion: 1 }, origin);
      }
      if (request.method === "GET" && url.pathname === "/v1/leaderboard") {
        const requested = Number.parseInt(url.searchParams.get("limit") ?? "20", 10);
        const limit = Number.isInteger(requested) ? Math.min(Math.max(requested, 1), 50) : 20;
        const result = await pool.query(leaderboardQuery, [limit]);
        return sendJson(response, 200, { players: result.rows.map(leaderboardRow) }, origin);
      }
      if (request.method === "POST" && url.pathname === "/v1/devices") {
        const body = await readJson(request);
        limitDevice(body?.deviceId);
        const alias = normalizeAlias(body?.alias);
        if (!alias) throw new RequestError(400, "invalid_alias", "El alias debe tener entre 3 y 16 letras o números.");
        if (!aliasAllowed(alias)) throw aliasNotAllowed();
        const supplied = body.deviceId !== undefined || body.deviceToken !== undefined;
        const credentials = supplied ? validateDeviceCredentials(body) : createDeviceCredentials(tokenPepper);
        if (!credentials) throw new RequestError(400, "device_invalid", "No pude leer la tarjeta de este dispositivo.");
        const registered = await registerProfile(pool, alias, credentials, tokenPepper);
        return sendJson(response, registered.created ? 201 : 200, {
          deviceId: credentials.id, deviceToken: credentials.token, alias: registered.alias, aliasStatus: registered.aliasStatus,
        }, origin);
      }
      const deviceFromHeaders = () => {
        const credentials = validateDeviceCredentials({
          deviceId: request.headers["x-super-noa-device"], deviceToken: request.headers["x-super-noa-token"],
        });
        if (!credentials) throw new RequestError(401, "device_invalid", "Falta una tarjeta válida de este dispositivo.");
        return credentials;
      };
      if (request.method === "GET" && url.pathname === "/v1/device") {
        const profile = await readOwnProfile(pool, deviceFromHeaders(), tokenPepper);
        if (!profile) throw new RequestError(401, "device_invalid", "La tarjeta de este dispositivo no es válida.");
        return sendJson(response, 200, { alias: profile.alias, aliasStatus: profile.aliasStatus, publicAlias: publicAlias(profile) }, origin);
      }
      if (request.method === "POST" && url.pathname === "/v1/alias") {
        const credentials = deviceFromHeaders();
        const alias = normalizeAlias((await readJson(request))?.alias);
        if (!alias) throw new RequestError(400, "invalid_alias", "El alias debe tener entre 3 y 16 letras o números.");
        if (!aliasAllowed(alias)) throw aliasNotAllowed();
        return sendJson(response, 200, await changeAlias(pool, alias, credentials, tokenPepper), origin);
      }
      if (url.pathname.startsWith("/v1/admin/")) {
        // Sin clave configurada, la revisión no existe; con una clave mala, nunca se dice cuál era.
        if (!adminToken) throw new RequestError(404, "request_failed", "No encuentro ese camino.");
        const supplied = /^Bearer (.+)$/.exec(request.headers.authorization ?? "")?.[1];
        if (!adminTokenMatches(adminToken, supplied)) throw new RequestError(401, "admin_invalid", "Esa clave no vale.");
        if (request.method === "GET" && url.pathname === "/v1/admin/aliases") {
          const status = url.searchParams.get("status") ?? "pending";
          if (status !== "all" && !aliasStatuses.includes(status)) throw new RequestError(400, "request_failed", "Ese estado no existe.");
          const result = await pool.query(adminListQuery, [status === "all" ? null : status]);
          return sendJson(response, 200, { aliases: result.rows.map((row) => ({ ...row, publicAlias: publicAlias(row) })) }, origin);
        }
        if (request.method === "POST" && url.pathname === "/v1/admin/aliases/approve-all") {
          return sendJson(response, 200, { updated: (await pool.query(approveAllQuery)).rowCount }, origin);
        }
        const action = /^\/v1\/admin\/aliases\/(approve|reject|hide)$/.exec(url.pathname)?.[1];
        if (request.method === "POST" && action) {
          const ids = readIds(await readJson(request));
          return sendJson(response, 200, { updated: (await pool.query(adminActions[action], [ids])).rowCount }, origin);
        }
        throw new RequestError(404, "request_failed", "No encuentro ese camino.");
      }
      if (request.method === "POST" && url.pathname === "/v1/progress") {
        const credentials = deviceFromHeaders();
        const progress = validateProgress(await readJson(request));
        if (!progress) throw new RequestError(400, "request_failed", "El progreso no es válido.");
        const result = await pool.query(
          progressUpdateQuery,
          [credentials.id, hashDeviceToken(tokenPepper, credentials.token), progress.world, progress.completedLevels, progress.stickers, progress.bossChallenges, progress.campaignWorld,
            progress.totalApples ?? null, progress.achievedAt ?? null, Object.hasOwn(progress, "achievedAt")],
        );
        if (result.rowCount !== 1) throw new RequestError(401, "device_invalid", "La tarjeta de este dispositivo no es válida.");
        return sendJson(response, 200, result.rows[0], origin);
      }
      throw new RequestError(404, "request_failed", "No encuentro ese camino.");
    } catch (error) {
      if (error instanceof RequestError && error.status === 429) {
        return sendJson(response, 429, { error: error.message, code: error.code, retryable: true, retryAfter: error.retryAfter }, origin, { "Retry-After": String(error.retryAfter) });
      }
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
    // Clave de la revisión de alias: solo en el entorno del servidor; sin ella, la revisión no existe.
    adminToken: process.env.RANKING_ADMIN_TOKEN || null,
    allowedOrigins: new Set((process.env.RANKING_ALLOWED_ORIGINS ?? "https://mocheto.github.io").split(",").map((origin) => origin.trim()).filter(Boolean)),
    // Saltos de proxy inverso de confianza para leer la IP de `X-Forwarded-For` (0 la ignora; sin proxy delante, ponlo a 0).
    trustedProxies: process.env.RANKING_TRUSTED_PROXIES === undefined ? 1 : Math.max(0, Number.parseInt(process.env.RANKING_TRUSTED_PROXIES, 10) || 0),
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
