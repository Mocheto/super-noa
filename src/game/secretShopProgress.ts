import { nivelesCampana as levels } from "./nivelesIndice.ts";
import type { Progress } from "./progress.ts";
import type { Level } from "./types.ts";
import { worldAvailable } from "./worldMapData.ts";
import { t } from "../textos/index.ts";

export type SecretShopVisit = { visited: boolean; completed: boolean };
export type SecretShopVisits = Record<string, SecretShopVisit>;
export type SecretShopBadge = { id: string; levelId: string; state: "available" | "visited" | "completed"; label: string };

const knownShopIds = new Set(levels.flatMap((level) => level.secretShop ? [level.secretShop.id] : []));
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export function normalizeSecretShops(value: unknown): SecretShopVisits {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([id, entry]) => {
    if (!knownShopIds.has(id) || !isRecord(entry)) return [];
    const completed = entry.completed === true;
    return [[id, { visited: entry.visited === true || completed, completed }]];
  }));
}

export function visitSecretShop(progress: Progress, id: string): Progress {
  if (!knownShopIds.has(id) || progress.secretShops?.[id]?.visited) return progress;
  return { ...progress, secretShops: { ...progress.secretShops, [id]: { visited: true, completed: progress.secretShops?.[id]?.completed === true } } };
}

export function completeSecretShop(progress: Progress, id: string): Progress {
  if (!knownShopIds.has(id) || (progress.secretShops?.[id]?.completed && progress.secretShops[id].visited)) return progress;
  return { ...progress, secretShops: { ...progress.secretShops, [id]: { visited: true, completed: true } } };
}

export function getSecretShopBadge(level: Pick<Level, "id" | "world"> & { secretShop?: { id: string } }, progress: Progress): SecretShopBadge | null {
  if (!level.secretShop || !worldAvailable(level.world, progress)) return null;
  const visit = progress.secretShops?.[level.secretShop.id];
  const state = visit?.completed ? "completed" : visit?.visited ? "visited" : "available";
  const label = state === "completed" ? t("minijuegos.tienda.estado.conseguido.juntos") : state === "visited" ? t("minijuegos.tienda.estado.visitada.juntos") : t("minijuegos.tienda.estado.porDescubrir.juntos");
  return { id: level.secretShop.id, levelId: level.id, state, label };
}

export function getWorldSecretShopBadge(world: Level["world"], progress: Progress): SecretShopBadge | null {
  const level = levels.find((entry) => entry.world === world && entry.secretShop);
  return level ? getSecretShopBadge(level, progress) : null;
}
