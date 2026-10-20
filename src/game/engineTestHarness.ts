import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import type { GameSnapshot, Level, Rect } from "./types";
import type { InputState } from "./input";
import type { LiveEnemy } from "./gameState";
import type { WolfSleepPhase } from "./worldMechanics";
import type { LiveChainGuardian } from "./chainGuardians";

export function engineModules(overrides: Record<string, unknown> = {}, globals: Record<string, unknown> = {}) {
  const context = vm.createContext({ console, ...globals });
  const cache = new Map<string, { exports: unknown }>();
  const load = (name: string): unknown => {
    if (name in overrides) return overrides[name];
    if (cache.has(name)) return cache.get(name)!.exports;
    const module = { exports: {} };
    cache.set(name, module);
    const file = name.slice(2) + (/\.(ts|tsx)$/.test(name) ? "" : name === "./GameCanvas" ? ".tsx" : ".ts");
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    const code = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInContext(`(function(require, module, exports) { ${code}\n})`, context)(load, module, module.exports);
    return module.exports;
  };
  return load;
}

export function mountEngine(level: Level) {
  const pending = new Map<number, (time: number) => void>();
  const requested: string[] = [];
  const snapshots: GameSnapshot[] = [];
  const completed: GameSnapshot[] = [];
  const bosses: GameSnapshot[] = [];
  const events: string[] = [];
  const focusCalls: FocusOptions[] = [];
  const drawnEnemies: { enemy: LiveEnemy; sleepPhase: WolfSleepPhase }[] = [];
  const drawnText: string[] = [];
  const drawnGuardians: LiveChainGuardian[] = [];
  const applePickups: number[] = [];
  let cameraX = 0;
  let playerRect: Rect | undefined;
  const input: InputState = { left: false, right: false, jump: false, shoot: false, jumpQueued: false, shootQueued: false };
  let nextId = 0;
  let hookIndex = 0;
  const hooks: { current?: unknown; dependencies?: unknown[]; cleanup?: () => void }[] = [];
  let effects: (() => void)[] = [];
  const gradient = { addColorStop() {} };
  const context = new Proxy<Record<string, unknown>>({}, {
    get: (target, key: string) => {
      if (key === "fillText") return (text: string) => drawnText.push(text);
      if (key === "fillRect") return (x: number, y: number, width: number, height: number) => {
        if (target.fillStyle === "#aa6bd5") playerRect = { x, y, width, height };
      };
      return target[key] ?? (key === "createLinearGradient" ? () => gradient : () => undefined);
    },
    set: (target, key: string, value) => { target[key] = value; return true; },
  });
  const canvas = { getContext: () => context, focus: (options: FocusOptions) => focusCalls.push(options) };
  class PendingImage {
    complete = false;
    naturalWidth = 0;
    private source = "";
    set src(value: string) { this.source = value; requested.push(value); }
    get src() { return this.source; }
  }
  const load = engineModules({
    react: {
      useRef(value: unknown) {
        const index = hookIndex++;
        return hooks[index] ??= { current: index === 0 ? canvas : value };
      },
      useEffect(effect: () => (() => void) | void, dependencies: unknown[]) {
        const index = hookIndex++;
        const old = hooks[index];
        if (old?.dependencies && dependencies.every((value, i) => Object.is(value, old.dependencies![i]))) return;
        effects.push(() => {
          old?.cleanup?.();
          hooks[index] = { dependencies, cleanup: effect() ?? undefined };
        });
      },
    },
    "react/jsx-runtime": { jsx() {}, jsxs() {} },
    "./PixelIcon": { PixelIcon() {} },
    "./input": { useGameInput: () => ({ inputRef: inputContainer }) },
    "./stickers": { getStickerSprite: () => undefined },
  }, {
    Image: PendingImage,
    navigator: { getGamepads: () => [] },
    requestAnimationFrame: (callback: (time: number) => void) => { pending.set(++nextId, callback); return nextId; },
    cancelAnimationFrame: (id: number) => pending.delete(id),
  });
  const inputContainer = { current: input };
  const rendering = load("./rendering") as typeof import("./rendering");
  const drawEnemy = rendering.drawEnemy;
  const drawBackground = rendering.drawBackground;
  rendering.drawBackground = (...args) => {
    cameraX = args[2];
    return drawBackground(...args);
  };
  rendering.drawEnemy = (...args) => {
    drawnEnemies.push({ enemy: { ...args[1] }, sleepPhase: args[5] ?? "awake" });
    return drawEnemy(...args);
  };
  const drawChainGuardian = rendering.drawChainGuardian;
  rendering.drawChainGuardian = (...args) => {
    drawnGuardians.push({ ...args[1] });
    return drawChainGuardian(...args);
  };
  const { GameCanvas } = load("./GameCanvas") as { GameCanvas: (props: unknown) => unknown };
  const props = {
    level, running: true,
    onSnapshot: (snapshot: GameSnapshot) => { snapshots.push(snapshot); events.push("snapshot"); },
    onAppleCollected: (count: number) => applePickups.push(count),
    onComplete: (snapshot: GameSnapshot) => { completed.push(snapshot); events.push("complete"); },
    onBossEncounter: (snapshot: GameSnapshot) => { bosses.push(snapshot); events.push("boss"); },
    onLoseLife: () => events.push("life"),
    onSecretExit: () => events.push("secret"),
    onWaterExit: () => events.push("water"),
    playSound: (sound: string) => events.push(sound),
  };
  const renderProps = () => {
    hookIndex = 0;
    effects = [];
    GameCanvas(props);
    effects.forEach((effect) => effect());
  };
  renderProps();
  return {
    input, snapshots, completed, bosses, events, requested, pending, focusCalls, drawnEnemies, drawnText, drawnGuardians, applePickups,
    get playerRect() { return playerRect; },
    get worldPlayerRect() { return playerRect && { ...playerRect, x: playerRect.x + cameraX }; },
    tick(time: number) {
      drawnEnemies.length = 0;
      drawnText.length = 0;
      drawnGuardians.length = 0;
      const next = pending.entries().next().value;
      if (!next) throw new Error("No hay un frame pendiente");
      pending.delete(next[0]);
      next[1](time);
    },
    setRunning(running: boolean) { props.running = running; renderProps(); },
    unmount() { hooks.forEach((hook) => hook?.cleanup?.()); },
  };
}
