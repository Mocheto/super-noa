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
