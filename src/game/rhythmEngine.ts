export function beatTimeMs(index: number, bpm: number) {
  return index * 60_000 / bpm;
}

export function nearestRhythmTarget<T>(targets: Iterable<T>, positionMs: number, windowMs: number, timeOf: (target: T) => number): T | null {
  let nearest: T | null = null;
  let bestDistance = Infinity;
  for (const target of targets) {
    const distance = Math.abs(positionMs - timeOf(target));
    if (distance <= windowMs && distance < bestDistance) {
      bestDistance = distance;
      nearest = target;
    }
  }
  return nearest;
}

// Retraso entre programar un sonido y oírlo. Los minijuegos rítmicos lo descuentan del
// reloj de audio para que lo que se ve y lo que se golpea coincida con lo que suena.
export function outputLatencySeconds(context: { outputLatency?: number; baseLatency?: number }) {
  const latency = (context.outputLatency || 0) + (context.baseLatency || 0);
  return Number.isFinite(latency) ? Math.min(0.25, Math.max(0, latency)) : 0;
}
