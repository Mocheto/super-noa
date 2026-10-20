import { detourCatalog } from "./detours.ts";
import type { DetourId } from "./types.ts";

export type DetourProgress = Partial<Record<DetourId, { discovered: boolean; completed: boolean; revealed: boolean }>>;
export function normalizeDetours(raw: unknown): DetourProgress {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const entries = raw as Record<string, unknown>;
  const result: DetourProgress = {};
  for (const { id } of detourCatalog) {
    const value = entries[id];
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const flags = value as Record<string, unknown>;
    if (flags.discovered !== true && flags.completed !== true) continue;
    result[id] = { discovered: true, completed: flags.completed === true, revealed: flags.revealed === true };
  }
  return result;
}

export function visitDetour<T extends { detours?: DetourProgress }>(progress: T, id: DetourId, complete = false): T {
  const previous = progress.detours?.[id];
  if (previous?.discovered && (!complete || previous.completed)) return progress;
  return { ...progress, detours: { ...progress.detours, [id]: { discovered: true, completed: complete || previous?.completed === true, revealed: previous?.revealed === true } } };
}
