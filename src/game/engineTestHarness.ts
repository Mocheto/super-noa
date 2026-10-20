import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import type { GameSnapshot, Level, Rect, ShopMatchCount } from "./types";
import type { InputState } from "./input";
import type { LiveEnemy } from "./gameState";
import type { WolfSleepPhase } from "./worldMechanics";
import type { LiveChainGuardian } from "./chainGuardians";

export function engineModules(overrides: Record<string, unknown> = {}, globals: Record<string, unknown> = {}) {
  const context = vm.createContext({ console, ...globals });
  const cache = new Map<string, { exports: unknown }>();
  const load = (name: string): unknown => {
    if (name.endsWith(".css")) return {};
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
  const shopVisits: string[] = [];
  const shopWins: string[] = [];
  const pad = { index: 0, connected: true, buttons: Array.from({ length: 16 }, () => ({ pressed: false })), axes: [0, 0] };
  let padConnected = false;
  let shopProps: { paused: boolean; onResult: (matches: ShopMatchCount) => void; onLeave: () => void } | undefined;
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
      useState<T>(value: T) {
        const index = hookIndex++;
        const state = hooks[index] ??= { current: value };
        return [state.current, (next: T) => {
          if (Object.is(state.current, next)) return;
          state.current = next;
          renderProps();
        }];
      },
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
    "react/jsx-runtime": {
      jsx(_tag: unknown, props: typeof shopProps) {
        if (typeof props?.onResult === "function" && typeof props?.onLeave === "function") shopProps = props;
      },
      jsxs() {},
    },
    "./SecretShop": { SecretShop() {} },
    "./PixelIcon": { PixelIcon() {} },
    "./input": { useGameInput: () => ({ inputRef: inputContainer }) },
    "./stickers": { getStickerSprite: () => undefined },
  }, {
    Image: PendingImage,
    navigator: { getGamepads: () => padConnected ? [pad] : [] },
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
    onShopVisit: (id: string) => shopVisits.push(id),
    onShopWin: (id: string) => shopWins.push(id),
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
    shopProps = undefined;
    GameCanvas(props);
    effects.forEach((effect) => effect());
  };
  renderProps();
  return {
    input, snapshots, completed, bosses, events, requested, pending, focusCalls, drawnEnemies, drawnText, drawnGuardians, applePickups,
    get playerRect() { return playerRect; },
    shopVisits, shopWins,
    pad,
    setPadConnected(connected: boolean) { padConnected = connected; },
    get shopProps() { return shopProps; },
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
