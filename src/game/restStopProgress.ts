/** Progreso de los paseos de los amigos: si se ha visitado y a qué amigos se ha saludado (por tipo de animal).
 * Campo opcional y tolerante: un guardado sin él sigue siendo válido. */
export type RestStopProgress = Record<string, { visited: boolean; greeted: string[] }>;

export function normalizeRestStops(raw: unknown): RestStopProgress {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const result: RestStopProgress = {};
  for (const [world, value] of Object.entries(raw as Record<string, unknown>)) {
    const number = Number(world);
    if (!Number.isInteger(number) || number < 1 || number > 16) continue;
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const entry = value as Record<string, unknown>;
    const greeted = Array.isArray(entry.greeted) ? [...new Set(entry.greeted.filter((kind): kind is string => typeof kind === "string" && kind.length > 0 && kind.length <= 40))] : [];
    if (entry.visited !== true && greeted.length === 0) continue;
    result[String(number)] = { visited: entry.visited === true, greeted };
  }
  return result;
}

export function greetFriend<T extends { restStops?: RestStopProgress }>(progress: T, world: number, kind: string): T {
  const previous = progress.restStops?.[world] ?? { visited: false, greeted: [] };
  if (previous.greeted.includes(kind)) return progress;
  return { ...progress, restStops: { ...progress.restStops, [world]: { ...previous, greeted: [...previous.greeted, kind] } } };
}

export function visitRestStop<T extends { restStops?: RestStopProgress }>(progress: T, world: number): T {
  const previous = progress.restStops?.[world] ?? { visited: false, greeted: [] };
  return { ...progress, restStops: { ...progress.restStops, [world]: { ...previous, visited: true } } };
}
