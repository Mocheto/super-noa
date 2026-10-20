import type { Progress } from "./progress";
import { readStorage, writeStorage } from "./storage.ts";
import { campaignLevels } from "./routes.ts";
import { lifetimeApples, normalizeProgressDate, validProgressDate } from "./progress.ts";

const RANKING_URL = "https://rankings.moche-home.es";
const DEVICE_KEY = "super-noa-ranking-device-v1";
export const rankingConnectionMessage = "No puedo conectar con el ranking. Tu aventura sigue guardada aquí. Puedes volver a intentarlo.";

export type RankingDevice = { id: string; token: string; alias: string; registrationPending?: boolean };
export type RankingPlayer = { alias: string; world: number; campaignWorld: number | null; completedLevels: number; stickers: number; bossChallenges: number; totalApples: number | null; achievedAt: string | null };
export type RankingErrorCode = "network" | "timeout" | "storage_unavailable" | "invalid_alias" | "alias_taken" | "device_invalid" | "device_exists" | "backend_outdated" | "invalid_response" | "server_unavailable" | "request_failed";
const rankingErrorCodes: readonly RankingErrorCode[] = ["network", "timeout", "storage_unavailable", "invalid_alias", "alias_taken", "device_invalid", "device_exists", "backend_outdated", "invalid_response", "server_unavailable", "request_failed"];

export class RankingError extends Error {
  readonly code: RankingErrorCode;
  readonly retryable: boolean;
  readonly status: number | null;

  constructor(code: RankingErrorCode, message: string, retryable: boolean, status: number | null = null) {
    super(message);
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
    throw new RankingError("storage_unavailable", "El navegador no deja guardar tu tarjeta del ranking. Permite el almacenamiento antes de apuntarte para no perderla.", false);
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

async function request(path: string, init?: RequestInit) {
  try {
    const response = await fetch(`${RANKING_URL}${path}`, { ...init, signal: AbortSignal.timeout(7_000) });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const fallbackCode = response.status === 401 ? "device_invalid" : response.status === 409
        ? isRecord(body) && body.code === "device_exists" ? "device_exists" : "alias_taken"
        : response.status >= 500 ? "server_unavailable" : "request_failed";
      const code = isRecord(body) && rankingErrorCodes.includes(body.code as RankingErrorCode) ? body.code as RankingErrorCode : fallbackCode;
      throw new RankingError(code, isRecord(body) && typeof body.error === "string" ? body.error : "No pude hablar con el ranking.",
        response.status >= 500 || response.status === 408 || response.status === 429, response.status);
    }
    if (!isRecord(body)) throw new RankingError("invalid_response", "El ranking ha respondido de una forma que no entiendo. Puedes volver a intentarlo.", true);
    return body;
  } catch (error) {
    if (error instanceof RankingError) throw error;
    const timeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    throw new RankingError(timeout ? "timeout" : "network", timeout ? "El ranking está tardando. Tu tarjeta está guardada; vuelve a intentarlo." : rankingConnectionMessage, true);
  }
}

let registrationFlight: { alias: string; promise: Promise<RankingDevice> } | null = null;

export function registerRankingDevice(alias: string): Promise<RankingDevice> {
  const normalized = alias.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
  if (registrationFlight) {
    return registrationFlight.alias === normalized ? registrationFlight.promise
      : Promise.reject(new RankingError("device_exists", "Estamos preparando tu tarjeta. Espera un momento antes de cambiar de alias.", false));
  }
  const promise = registerDevice(alias).finally(() => { registrationFlight = null; });
  registrationFlight = { alias: normalized, promise };
  return promise;
}

async function registerDevice(alias: string): Promise<RankingDevice> {
  const normalized = alias.trim().replace(/\s+/g, " ");
  if (!/^[\p{L}\p{N} _-]{3,16}$/u.test(normalized)) throw new RankingError("invalid_alias", "Elige un nombre de entre 3 y 16 letras o números.", false);
  let device = readRankingDevice();
  if (device && device.alias.toLocaleLowerCase("es") !== normalized.toLocaleLowerCase("es")) {
    throw new RankingError("device_exists", "Ya tienes una tarjeta guardada con otro nombre. Conserva esa tarjeta para seguir jugando.", false);
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
    throw new RankingError("backend_outdated", "El ranking se está preparando para guardar tu tarjeta. Vuelve a intentarlo dentro de un ratito.", true);
  }
  let body: Record<string, unknown>;
  try {
    body = await request("/v1/devices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias: device.alias, deviceId: device.id, deviceToken: device.token }),
    });
  } catch (error) {
    if (error instanceof RankingError && (error.code === "alias_taken" || error.code === "invalid_alias")) {
      if (!writeStorage(DEVICE_KEY, "null") || readStorage(DEVICE_KEY) !== "null") {
        throw new RankingError("storage_unavailable", "No pude guardar el cambio de tarjeta. Permite el almacenamiento y vuelve a intentarlo.", false);
      }
    }
    throw error;
  }
  if (body.deviceId !== device.id || body.deviceToken !== device.token || typeof body.alias !== "string"
    || body.alias.toLocaleLowerCase("es") !== device.alias.toLocaleLowerCase("es")) {
    throw new RankingError("invalid_response", "No pude confirmar tu tarjeta. Está guardada aquí para volver a intentarlo.", true);
  }
  const registered = { id: device.id, token: device.token, alias: body.alias };
  persistDevice(registered);
  return registered;
}

export async function syncRanking(device: RankingDevice, progress: Progress) {
  const registered = device.registrationPending ? await registerRankingDevice(device.alias) : device;
  await request("/v1/progress", { method: "POST", headers: { "Content-Type": "application/json", "X-Super-Noa-Device": registered.id, "X-Super-Noa-Token": registered.token }, body: JSON.stringify(rankingProgress(progress)) });
  const health = await request("/health");
  if (typeof health.progressVersion !== "number" || health.progressVersion < 2) {
    throw new RankingError("backend_outdated", "El tablón aún no guarda las manzanas totales ni la fecha. Las conservamos aquí para enviarlas cuando esté listo.", true);
  }
}

export async function checkRankingAvailability(): Promise<void> {
  const health = await request("/health");
  if (typeof health.registrationVersion !== "number" || health.registrationVersion < 2) {
    throw new RankingError("backend_outdated", "El tablón se está preparando. Puedes jugar y apuntarte más tarde.", true);
  }
  // Los servidores anteriores podían responder a /health sin tener acceso a la base de datos.
  await loadRanking();
}

export async function loadRanking(): Promise<RankingPlayer[]> {
  const body = await request("/v1/leaderboard?limit=20");
  if (!Array.isArray(body.players)) throw new RankingError("invalid_response", "No pude leer la lista del ranking. Puedes volver a intentarlo.", true);
  return body.players.map((player: unknown) => {
    if (!isRecord(player) || typeof player.alias !== "string" || !Object.entries({ world: 12, completedLevels: 30, stickers: 36, bossChallenges: 12 })
      .every(([key, maximum]) => typeof player[key] === "number" && Number.isInteger(player[key]) && (player[key] as number) >= 0 && (player[key] as number) <= maximum)
      || (player.totalApples !== undefined && (!Number.isSafeInteger(player.totalApples) || (player.totalApples as number) < 0))
      || (player.achievedAt !== undefined && player.achievedAt !== null && !validProgressDate(player.achievedAt))
      || (player.campaignWorld !== undefined && player.campaignWorld !== null
        && (typeof player.campaignWorld !== "number" || !Number.isInteger(player.campaignWorld) || player.campaignWorld < 0 || player.campaignWorld > 10))) {
      throw new RankingError("invalid_response", "No pude leer la lista del ranking. Puedes volver a intentarlo.", true);
    }
    return { ...player, campaignWorld: player.campaignWorld === undefined ? campaignWorld(player.world as number) : player.campaignWorld,
      totalApples: player.totalApples ?? null, achievedAt: normalizeProgressDate(player.achievedAt) } as RankingPlayer;
  });
}
