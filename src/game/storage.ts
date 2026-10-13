export function readStorage(key: string): string | null {
  try { return globalThis.localStorage.getItem(key); }
  catch { return null; }
}

export function writeStorage(key: string, value: string): boolean {
  try { globalThis.localStorage.setItem(key, value); return true; }
  catch { return false; }
}

export function readSavedPercentage(key: string, fallback: number): number {
  const saved = readStorage(key);
  // Un 0 antiguo, escrito automáticamente, no equivale a elegir silencio.
  if (saved === "0" && readStorage(`${key}-configured`) !== "true") return fallback;
  const value = saved === null ? fallback : Number(saved);
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : fallback;
}
