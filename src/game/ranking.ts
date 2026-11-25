import type { Progress } from "./progress";
import { readStorage, writeStorage } from "./storage.ts";
import { campaignLevels } from "./routes.ts";
import { lifetimeApples, normalizeProgressDate, validProgressDate } from "./progress.ts";
import { t } from "../textos/index.ts";
import { RANKING_URL } from "./rankingServidor.ts";

const DEVICE_KEY = "super-noa-ranking-device-v1";
export const rankingConnectionMessage = t("adultos.ranking.sin-conexion");

export type RankingDevice = { id: string; token: string; alias: string; registrationPending?: boolean };
export type RankingPlayer = { alias: string; world: number; campaignWorld: number | null; completedLevels: number; stickers: number; bossChallenges: number; totalApples: number | null; achievedAt: string | null };
/** Estado del alias de una tarjeta en la revisión del servidor. */
export type RankingAliasStatus = "pending" | "approved" | "rejected" | "hidden";
const aliasStatuses: readonly RankingAliasStatus[] = ["pending", "approved", "rejected", "hidden"];
/** Lo que el servidor sabe de la tarjeta propia: el alias, su estado y cómo la ven los demás (alias aprobado o nombre provisional). */
export type RankingOwn = { alias: string; aliasStatus: RankingAliasStatus; publicAlias: string };
export type RankingErrorCode = "network" | "timeout" | "storage_unavailable" | "invalid_alias" | "alias_not_allowed" | "alias_taken" | "device_invalid" | "device_exists" | "backend_outdated" | "invalid_response" | "server_unavailable" | "rate_limited" | "request_failed";
const rankingErrorCodes: readonly RankingErrorCode[] = ["network", "timeout", "storage_unavailable", "invalid_alias", "alias_not_allowed", "alias_taken", "device_invalid", "device_exists", "backend_outdated", "invalid_response", "server_unavailable", "rate_limited", "request_failed"];

export class RankingError extends Error {
  readonly code: RankingErrorCode;
  readonly retryable: boolean;
  readonly status: number | null;
  /** Milisegundos que pidió esperar el servidor (`Retry-After`); solo en `rate_limited`. */
  readonly retryAfterMs: number | null;

  constructor(code: RankingErrorCode, message: string, retryable: boolean, status: number | null = null, retryAfterMs: number | null = null) {
    super(message);
    this.retryAfterMs = retryAfterMs;
    this.name = "RankingError";
    this.code = code;
    this.retryable = retryable;
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function readRankingDevice(): RankingDevice | null {
  try {
    const value: unknown = JSON.parse(readStorage(DEVICE_KEY) ?? "null");
    return isRecord(value) && typeof value.id === "string" && !!value.id && typeof value.token === "string" && !!value.token && typeof value.alias === "string" && !!value.alias
      && (value.registrationPending === undefined || typeof value.registrationPending === "boolean") ? value as RankingDevice : null;
  } catch { return null; }
}

function persistDevice(device: RankingDevice) {
  const serialized = JSON.stringify(device);
  if (!writeStorage(DEVICE_KEY, serialized) || readStorage(DEVICE_KEY) !== serialized) {
    throw new RankingError("storage_unavailable", t("adultos.ranking.sin-almacenamiento"), false);
  }
}

function campaignWorld(world: number): number | null {
  return world === 7 || world === 8 ? null : world > 8 ? world - 2 : world;
}

export function rankingProgress(progress: Progress) {
  const finished = campaignLevels.filter((level) => progress.levelStats[level.id]?.completed);
  const world = Math.max(0, ...finished.map((level) => level.world));
  return {
    world,
    campaignWorld: campaignWorld(world),
    completedLevels: finished.length,
    stickers: progress.stickers.length,
    bossChallenges: Object.values(progress.bossChallenges).filter(Boolean).length,
    totalApples: lifetimeApples(progress),
    achievedAt: normalizeProgressDate(progress.achievedAt),
  };
}

// Si el servidor dice «espera» (429 con Retry-After), no se le vuelve a llamar a esa ruta hasta pasado ese tiempo, venga el reintento
// de donde venga (conexión recuperada, botón de actualizar, cambio de progreso). Es una veda por tipo de petición, igual que el servidor.
const MIN_RETRY_AFTER_MS = 1_000;
const MAX_RETRY_AFTER_MS = 3_600_000;
const DEFAULT_RETRY_AFTER_MS = 60_000;
const cooldowns = new Map<string, number>();

function cooldownGroup(path: string, post: boolean) {
  const route = path.split("?")[0];
  return post && (route === "/v1/devices" || route === "/v1/alias") ? "registro" : post && route === "/v1/progress" ? "progreso" : "consulta";
}

/** `Retry-After` son segundos enteros o una fecha HTTP; sin cabecera legible se usa el campo `retryAfter` del cuerpo o un minuto. */
export function parseRetryAfter(header: string | null, body: unknown, now = Date.now()): number {
  const fromBody = isRecord(body) && typeof body.retryAfter === "number" ? body.retryAfter : null;
  const seconds = header !== null && /^\s*\d+\s*$/.test(header) ? Number(header)
    : header !== null && !Number.isNaN(Date.parse(header)) ? (Date.parse(header) - now) / 1_000
    : fromBody;
  const ms = seconds !== null && Number.isFinite(seconds) ? seconds * 1_000 : DEFAULT_RETRY_AFTER_MS;
  return Math.min(MAX_RETRY_AFTER_MS, Math.max(MIN_RETRY_AFTER_MS, Math.ceil(ms)));
}

/** Solo para las pruebas: olvida las vedas. */
export function resetRankingCooldowns() { cooldowns.clear(); }

function rateLimitedError(waitMs: number, status: number | null) {
  return new RankingError("rate_limited", t("adultos.ranking.demasiadas-peticiones"), true, status, waitMs);
}

async function request(path: string, init?: RequestInit) {
  const group = cooldownGroup(path, init?.method === "POST");
  const waiting = (cooldowns.get(group) ?? 0) - Date.now();
  if (waiting > 0) throw rateLimitedError(waiting, null);
  try {
    const response = await fetch(`${RANKING_URL}${path}`, { ...init, signal: AbortSignal.timeout(7_000) });
    const body: unknown = await response.json().catch(() => null);
    if (response.status === 429) {
      const waitMs = parseRetryAfter(response.headers.get("Retry-After"), body);
      cooldowns.set(group, Date.now() + waitMs);
      throw rateLimitedError(waitMs, 429);
    }
    if (!response.ok) {
      const fallbackCode = response.status === 401 ? "device_invalid" : response.status === 409
        ? isRecord(body) && body.code === "device_exists" ? "device_exists" : "alias_taken"
        : response.status >= 500 ? "server_unavailable" : "request_failed";
      const code = isRecord(body) && rankingErrorCodes.includes(body.code as RankingErrorCode) ? body.code as RankingErrorCode : fallbackCode;
      // El filtro de alias se explica con el texto del catálogo, no con el del servidor.
      // Lo que se enseña sale del catálogo según el código, no del texto que manda el servidor.
      throw new RankingError(code, mensajeDeCodigo(code),
        response.status >= 500 || response.status === 408 || response.status === 429, response.status);
    }
    if (!isRecord(body)) throw new RankingError("invalid_response", t("adultos.ranking.respuesta-rara"), true);
    return body;
  } catch (error) {
    if (error instanceof RankingError) throw error;
    const timeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    throw new RankingError(timeout ? "timeout" : "network", timeout ? t("adultos.ranking.tardando") : rankingConnectionMessage, true);
  }
}

/**
 * La misma regla que el servidor: letras latinas, cifras, espacio, guion y guion bajo, de 3 a 16, y que siga cabiendo
 * al pasar a minúsculas. Otras escrituras tienen letras iguales a las latinas y permitirían suplantar a alguien.
 */
export function aliasValido(alias: string): boolean {
  return /^(?:(?=\p{L})\p{Script=Latin}|[0-9 _-]){3,16}$/u.test(alias) && alias.toLocaleLowerCase("es").length <= 16;
}

/** Texto para adultos de cada error que manda el servidor. */
function mensajeDeCodigo(code: RankingErrorCode): string {
  switch (code) {
    case "alias_not_allowed": return t("adultos.tablon.alias-no-vale");
    case "invalid_alias": return t("adultos.ranking.alias-no-valido");
    case "alias_taken": return t("adultos.ranking.alias-ocupado");
    case "device_exists": return t("adultos.ranking.otra-tarjeta");
    case "device_invalid": return t("adultos.ranking.tarjeta-no-valida");
    case "server_unavailable": return t("adultos.ranking.no-disponible");
    default: return t("adultos.ranking.fallo");
  }
}

let registrationFlight: { alias: string; promise: Promise<RankingDevice> } | null = null;

export function registerRankingDevice(alias: string): Promise<RankingDevice> {
  const normalized = alias.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
  if (registrationFlight) {
    return registrationFlight.alias === normalized ? registrationFlight.promise
      : Promise.reject(new RankingError("device_exists", t("adultos.ranking.preparando-tarjeta"), false));
  }
  const promise = registerDevice(alias).finally(() => { registrationFlight = null; });
  registrationFlight = { alias: normalized, promise };
  return promise;
}

async function registerDevice(alias: string): Promise<RankingDevice> {
  const normalized = alias.normalize("NFC").trim().replace(/\s+/g, " ");
  if (!aliasValido(normalized)) throw new RankingError("invalid_alias", t("adultos.ranking.alias-no-valido"), false);
  let device = readRankingDevice();
  if (device && device.alias.toLocaleLowerCase("es") !== normalized.toLocaleLowerCase("es")) {
    throw new RankingError("device_exists", t("adultos.ranking.otra-tarjeta"), false);
  }
  if (device && !device.registrationPending) return device;
  if (!device) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const token = btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
    device = { id: crypto.randomUUID(), token, alias: normalized, registrationPending: true };
  }
  persistDevice(device);
  const health = await request("/health");
  if (typeof health.registrationVersion !== "number" || health.registrationVersion < 2) {
    throw new RankingError("backend_outdated", t("adultos.ranking.servidor-antiguo-alta"), true);
  }
  let body: Record<string, unknown>;
  try {
    body = await request("/v1/devices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias: device.alias, deviceId: device.id, deviceToken: device.token }),
    });
  } catch (error) {
    if (error instanceof RankingError && (error.code === "alias_taken" || error.code === "invalid_alias" || error.code === "alias_not_allowed")) {
      if (!writeStorage(DEVICE_KEY, "null") || readStorage(DEVICE_KEY) !== "null") {
        throw new RankingError("storage_unavailable", t("adultos.ranking.sin-almacenamiento-cambio"), false);
      }
    }
    throw error;
  }
  if (body.deviceId !== device.id || body.deviceToken !== device.token || typeof body.alias !== "string"
    || body.alias.toLocaleLowerCase("es") !== device.alias.toLocaleLowerCase("es")) {
    throw new RankingError("invalid_response", t("adultos.ranking.sin-confirmar-tarjeta"), true);
  }
  const registered = { id: device.id, token: device.token, alias: body.alias };
  persistDevice(registered);
  return registered;
}

export async function syncRanking(device: RankingDevice, progress: Progress) {
  const registered = device.registrationPending ? await registerRankingDevice(device.alias) : device;
  await request("/v1/progress", { method: "POST", headers: { "Content-Type": "application/json", ...deviceHeaders(registered) }, body: JSON.stringify(rankingProgress(progress)) });
  const health = await request("/health");
  if (typeof health.progressVersion !== "number" || health.progressVersion < 2) {
    throw new RankingError("backend_outdated", t("adultos.ranking.servidor-antiguo-progreso"), true);
  }
}

export async function loadRanking(): Promise<RankingPlayer[]> {
  const body = await request("/v1/leaderboard?limit=20");
  if (!Array.isArray(body.players)) throw new RankingError("invalid_response", t("adultos.ranking.lista-ilegible"), true);
  return body.players.map((player: unknown) => {
    if (!isRecord(player) || typeof player.alias !== "string" || !Object.entries({ world: 17, completedLevels: 45, stickers: 51, bossChallenges: 17 })
      .every(([key, maximum]) => typeof player[key] === "number" && Number.isInteger(player[key]) && (player[key] as number) >= 0 && (player[key] as number) <= maximum)
      || (player.totalApples !== undefined && (!Number.isSafeInteger(player.totalApples) || (player.totalApples as number) < 0))
      || (player.achievedAt !== undefined && player.achievedAt !== null && !validProgressDate(player.achievedAt))
      || (player.campaignWorld !== undefined && player.campaignWorld !== null
        && (typeof player.campaignWorld !== "number" || !Number.isInteger(player.campaignWorld) || player.campaignWorld < 0 || player.campaignWorld > 15))) {
      throw new RankingError("invalid_response", t("adultos.ranking.lista-ilegible"), true);
    }
    return { ...player, campaignWorld: player.campaignWorld === undefined ? campaignWorld(player.world as number) : player.campaignWorld,
      totalApples: player.totalApples ?? null, achievedAt: normalizeProgressDate(player.achievedAt) } as RankingPlayer;
  });
}

const deviceHeaders = (device: RankingDevice) => ({ "X-Super-Noa-Device": device.id, "X-Super-Noa-Token": device.token });

function ownFrom(body: Record<string, unknown>): RankingOwn {
  if (typeof body.alias !== "string" || !aliasStatuses.includes(body.aliasStatus as RankingAliasStatus) || typeof body.publicAlias !== "string") {
    throw new RankingError("invalid_response", t("adultos.ranking.tarjeta-ilegible"), true);
  }
  return { alias: body.alias, aliasStatus: body.aliasStatus as RankingAliasStatus, publicAlias: body.publicAlias };
}

/** La tarjeta propia según el servidor: su alias, si está pendiente, aprobado, rechazado u oculto, y el nombre que ven los demás. */
export async function readOwnRanking(device: RankingDevice): Promise<RankingOwn> {
  return ownFrom(await request("/v1/device", { headers: deviceHeaders(device) }));
}

/**
 * Cambia el alias de una tarjeta ya registrada. El nuevo pasa por el filtro y queda pendiente; hasta que se apruebe, los
 * demás ven el aprobado anterior o el nombre provisional. La tarjeta guardada aquí se queda con el alias nuevo.
 */
export async function changeRankingAlias(device: RankingDevice, alias: string): Promise<RankingOwn> {
  const normalized = alias.normalize("NFC").trim().replace(/\s+/g, " ");
  if (!aliasValido(normalized)) throw new RankingError("invalid_alias", t("adultos.ranking.alias-no-valido"), false);
  const body = await request("/v1/alias", {
    method: "POST", headers: { "Content-Type": "application/json", ...deviceHeaders(device) }, body: JSON.stringify({ alias: normalized }),
  });
  if (typeof body.alias !== "string" || !aliasStatuses.includes(body.aliasStatus as RankingAliasStatus)) {
    throw new RankingError("invalid_response", t("adultos.ranking.sin-confirmar-alias"), true);
  }
  const renamed = { id: device.id, token: device.token, alias: body.alias };
  persistDevice(renamed);
  // El nombre que ven los demás no cambia hasta la revisión: se vuelve a leer con la tarjeta.
  return readOwnRanking(renamed);
}
