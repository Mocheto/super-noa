import type { GameSnapshot } from "./types";

/** Uses simulation time so a paused or unmounted level cannot finish in the background. */
export function createLevelTransition(onSnapshot: (snapshot: GameSnapshot) => void) {
  let pending: { remaining: number; snapshot: GameSnapshot; complete: (snapshot: GameSnapshot) => void } | undefined;

  return {
    begin(snapshot: GameSnapshot, delay: number, complete: (snapshot: GameSnapshot) => void) {
      if (pending) return;
      const finalSnapshot = { ...snapshot, stickers: [...snapshot.stickers] };
      pending = { remaining: delay, snapshot: finalSnapshot, complete };
      onSnapshot(finalSnapshot);
    },
    advance(delta: number, running: boolean) {
      if (!running || !pending) return;
      pending.remaining -= delta;
      if (pending.remaining > 1e-9) return;
      const finished = pending;
      pending = undefined;
      finished.complete(finished.snapshot);
    },
    cancel() {
      pending = undefined;
    },
  };
}
