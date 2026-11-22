import { friendCatalog, MAX_HEARTS, type FriendEntry } from "./friends.ts";
import { nivelesCampana as levels, nivelesAgua as waterLevels } from "./nivelesIndice.ts";
import { restStopFor } from "./restStops.ts";
import type { RestStopProgress } from "./restStopProgress.ts";

/** Corazones de amistad de cada amigo (0–5). Nunca bajan. Campo opcional y tolerante del progreso. */
export type FriendProgress = Record<string, { hearts: number }>;

type FriendSource = { levelStats: Record<string, { completed?: boolean } | undefined>; restStops?: RestStopProgress; friends?: FriendProgress };

const knownKinds = new Set<string>(friendCatalog.map((entry) => entry.kind));

export function normalizeFriends(raw: unknown): FriendProgress {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const result: FriendProgress = {};
  for (const [kind, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!knownKinds.has(kind) || !value || typeof value !== "object" || Array.isArray(value)) continue;
    const hearts = Number((value as Record<string, unknown>).hearts);
    if (!Number.isFinite(hearts) || hearts <= 0) continue;
    result[kind] = { hearts: Math.min(MAX_HEARTS, Math.floor(hearts)) };
  }
  return result;
}

/** ¿Es ya amigo? Se hace amigo al saludarlo en un paseo. Los del reino secreto, las acuáticas y el cielo (sin paseo)
 * al completar una pantalla donde aparecen; los que no caben en el paseo de su mundo, al visitar ese paseo. */
export function isFriend(entry: FriendEntry, progress: FriendSource): boolean {
  const stops = progress.restStops ?? {};
  if (Object.values(stops).some((stop) => stop.greeted.includes(entry.kind))) return true;
  const stop = restStopFor(entry.world);
  if (stop) return !stop.friends.some((friend) => friend.kind === entry.kind) && Boolean(stops[entry.world]?.visited);
  return [...levels, ...waterLevels].some((level) => level.enemies.some((enemy) => enemy.kind === entry.kind) && progress.levelStats[level.id]?.completed);
}

export const heartsOf = (kind: string, progress: FriendSource) => progress.friends?.[kind]?.hearts ?? 0;
export const isBestFriend = (kind: string, progress: FriendSource) => heartsOf(kind, progress) >= MAX_HEARTS;

/** Una caricia o una comida suma un corazón, hasta cinco. */
export function addHeart<T extends FriendSource>(progress: T, kind: string): T {
  if (!knownKinds.has(kind)) return progress;
  const hearts = Math.min(MAX_HEARTS, heartsOf(kind, progress) + 1);
  return { ...progress, friends: { ...progress.friends, [kind]: { hearts } } };
}
