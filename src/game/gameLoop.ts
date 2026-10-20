const STEP_SECONDS = 1 / 60;
const MAX_FRAME_SECONDS = 0.1;

export type GameLoop = {
  setRunning: (running: boolean) => void;
  stop: () => void;
};

export function createGameLoop(update: (delta: number, now: number) => void, render: () => void, advanceFrame: () => void): GameLoop {
  let running = false;
  let animationId = 0;
  let lastTime = 0;
  let accumulator = 0;

  const tick = (now: number) => {
    animationId = 0;
    if (!running) return;
    if (lastTime) accumulator += Math.min(MAX_FRAME_SECONDS, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    while (accumulator >= STEP_SECONDS) {
      update(STEP_SECONDS, now);
      if (!running) return;
      advanceFrame();
      accumulator -= STEP_SECONDS;
    }
    render();
    if (running) animationId = requestAnimationFrame(tick);
  };

  return {
    setRunning(next) {
      if (next === running) return;
      running = next;
      lastTime = 0;
      accumulator = 0;
      if (next) animationId = requestAnimationFrame(tick);
      else {
        cancelAnimationFrame(animationId);
        animationId = 0;
        render();
      }
    },
    stop() {
      running = false;
      cancelAnimationFrame(animationId);
      animationId = 0;
    },
  };
}
