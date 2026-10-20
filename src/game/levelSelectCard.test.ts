import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";
import type { LevelSelectCard } from "./LevelSelectCard";
import { getLevelObjectives } from "./levelObjectives.ts";
import { levels } from "./levels.ts";
import { emptyProgress } from "./progress.ts";
import { completeSecretShop, getSecretShopBadge, visitSecretShop } from "./secretShopProgress.ts";

type Props = Parameters<typeof LevelSelectCard>[0];
type ElementProps = {
  children?: ReactNode;
  className?: string;
  hidden?: boolean;
  disabled?: boolean;
  "aria-expanded"?: boolean;
  "aria-label"?: string;
  role?: string;
  onClick?: () => void;
  onPointerEnter?: (event: { pointerType: string }) => void;
  onPointerLeave?: () => void;
  onKeyDown?: (event: { key: string; preventDefault: () => void; stopPropagation: () => void }) => void;
};
const source = readFileSync(new URL("./LevelSelectCard.tsx", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function mount(overrides: Partial<Props> = {}) {
  let now = 0;
  let nextTimer = 0;
  let closed = 0;
  const opened: boolean[] = [];
  const started: number[] = [];
  const timers = new Map<number, { due: number; callback: () => void }>();
  const cleanups: (() => void)[] = [];
  const listeners = new Map<string, (event: { target: object }) => void>();
  class TestNode {}
  const modules: Record<string, unknown> = {
    react: {
      useRef: (current: unknown) => ({ current }),
      useEffect: (effect: () => void | (() => void)) => {
        const cleanup = effect();
        if (cleanup) cleanups.push(cleanup);
      },
    },
    "react/jsx-runtime": jsxRuntime,
    "./GameAssetIcon": { GameAssetIcon: () => null },
    "./PixelIcon": { PixelIcon: () => null },
    "./levelObjectives": { getLevelObjectives },
    "./secretShopProgress": { getSecretShopBadge },
  };
  const module = { exports: {} };
  const context = vm.createContext({
    Node: TestNode,
    document: {
      addEventListener: (name: string, listener: (event: { target: object }) => void) => listeners.set(name, listener),
      removeEventListener: (name: string) => listeners.delete(name),
    },
    setTimeout: (callback: () => void, delay: number) => {
      timers.set(++nextTimer, { due: now + delay, callback });
      return nextTimer;
    },
    clearTimeout: (id: number) => timers.delete(id),
  });
  vm.runInContext(`(function(require, module, exports) { ${code}\n})`, context)(
    (name: string) => {
      assert.ok(name in modules, `Unexpected import: ${name}`);
      return modules[name];
    }, module, module.exports,
  );
  const Component = (module.exports as { LevelSelectCard: typeof LevelSelectCard }).LevelSelectCard;
  const root = Component({
    level: levels[0], index: 0, unlocked: true, suggested: true, progress: emptyProgress, details: null,
    onBeginLevel: (index) => started.push(index),
    onOpenDetails: (pinned) => opened.push(pinned),
    onCloseDetails: () => { closed++; },
    ...overrides,
  });
  const elements: ReactElement<ElementProps>[] = [];
  const visit = (node: ReactNode) => {
    Children.forEach(node, (child) => {
      if (!isValidElement<ElementProps>(child)) return;
      elements.push(child);
      visit(child.props.children);
    });
  };
  visit(root);
  const find = (className: string) => elements.find((element) => element.props.className?.split(" ").includes(className));
  return {
    root, find, opened, started, timers, listeners, TestNode,
    get closed() { return closed; },
    advance(milliseconds: number) {
      now += milliseconds;
      for (const [id, timer] of timers) {
        if (timer.due > now) continue;
        timers.delete(id);
        timer.callback();
      }
    },
    dispose: () => cleanups.forEach((cleanup) => cleanup()),
  };
}

test("las pistas empiezan ocultas y las estrellas no inician la partida", () => {
  const card = mount();
  assert.equal(card.find("level-objectives")?.props.hidden, true);
  assert.equal(card.find("level-objectives-trigger")?.props["aria-expanded"], false);
  card.find("level-objectives-trigger")?.props.onClick?.();
  assert.deepEqual(card.opened, [true]);
  assert.deepEqual(card.started, []);
  card.find("level-card")?.props.onClick?.();
  assert.deepEqual(card.started, [0]);
});

test("el ratón debe permanecer 900 ms y salir cancela la espera", () => {
  const card = mount();
  card.root.props.onPointerEnter({ pointerType: "mouse" });
  card.advance(899);
  assert.deepEqual(card.opened, []);
  card.advance(1);
  assert.deepEqual(card.opened, [false]);
  card.root.props.onPointerEnter({ pointerType: "mouse" });
  card.root.props.onPointerLeave();
  card.advance(1000);
  assert.deepEqual(card.opened, [false]);
  card.root.props.onPointerEnter({ pointerType: "mouse" });
  card.dispose();
  assert.equal(card.timers.size, 0);
});

test("el tacto y el lápiz no abren ayudas al rozar una pantalla", () => {
  const card = mount();
  for (const pointerType of ["touch", "pen"]) card.root.props.onPointerEnter({ pointerType });
  card.advance(2000);
  assert.deepEqual(card.opened, []);
  assert.equal(card.timers.size, 0);
});

test("la previsualización usa un tip flotante sin desplazar las otras tarjetas", () => {
  const preview = mount({ details: { pinned: false } });
  assert.ok(preview.find("level-objectives")?.props.className?.includes("is-preview"));
  preview.root.props.onPointerLeave();
  assert.equal(preview.closed, 1);
  const pinned = mount({ details: { pinned: true } });
  assert.equal(pinned.find("level-objectives")?.props.className?.includes("is-preview"), false);
});

test("una ayuda fijada muestra la pista y se cierra con estrellas, Escape o fuera", () => {
  const card = mount({ details: { pinned: true } });
  assert.equal(card.find("level-objectives")?.props.hidden, false);
  assert.ok(card.find("level-objective-hint"));
  card.root.props.onPointerLeave();
  assert.equal(card.closed, 0);
  card.find("level-objectives-trigger")?.props.onClick?.();
  assert.equal(card.closed, 1);
  let prevented = false;
  let stopped = false;
  card.find("level-objectives-trigger")?.props.onKeyDown?.({
    key: "Escape", preventDefault: () => { prevented = true; }, stopPropagation: () => { stopped = true; },
  });
  assert.equal(card.closed, 2);
  assert.ok(prevented && stopped);
  card.listeners.get("click")?.({ target: new card.TestNode() });
  assert.equal(card.closed, 3);
  card.dispose();
  assert.equal(card.listeners.size, 0);
});

test("las pantallas cerradas no tienen estrellas interactivas ni pistas", () => {
  const card = mount({ level: levels[1], index: 1, unlocked: false, details: null });
  assert.equal(card.find("level-card")?.props.disabled, true);
  assert.equal(card.find("level-objectives-trigger"), undefined);
  assert.equal(card.find("level-objectives"), undefined);
  card.root.props.onPointerEnter({ pointerType: "mouse" });
  card.advance(1000);
  assert.deepEqual(card.opened, []);
});

test("las puertas muestran tres estados accesibles sin añadir botones ni medallas", () => {
  const progress = { ...emptyProgress, unlocked: 1 };
  const states = [
    { progress, state: "available", label: "Tienda secreta: por descubrir" },
    { progress: visitSecretShop(progress, "shop-1-2"), state: "visited", label: "Tienda secreta: visitada" },
    { progress: completeSecretShop(progress, "shop-1-2"), state: "completed", label: "Tienda secreta: reto conseguido" },
  ];
  for (const state of states) {
    const card = mount({ level: levels[1], index: 1, progress: state.progress });
    const badge = card.find("level-shop-badge");
    assert.equal(badge?.type, "span");
    assert.equal(badge.props.role, "img");
    assert.equal(badge.props["aria-label"], state.label);
    assert.ok(badge.props.className?.split(" ").includes(`is-${state.state}`));
    assert.equal(badge.props.onClick, undefined);
    assert.equal(Children.count(card.find("level-medals")?.props.children), 3);
    assert.equal(card.find("level-objectives-trigger")?.props["aria-expanded"], false);
    assert.equal(card.find("level-objectives")?.props.hidden, true);
    card.find("level-card")?.props.onClick?.();
    assert.deepEqual(card.started, [1]);
    assert.deepEqual(card.opened, []);
  }
});

test("la ayuda de la tienda queda dentro de las pistas ocultas y usa la espera habitual", () => {
  const props = { level: levels[1], index: 1, progress: { ...emptyProgress, unlocked: 1 } };
  const card = mount(props);
  const help = card.find("level-shop-hint");
  assert.ok(help);
  assert.equal(card.find("level-objectives")?.props.hidden, true);
  const containsHelp = (children: ReactNode) => Children.toArray(children).some((child) =>
    isValidElement<ElementProps>(child) && child.props.className === "level-shop-hint");
  assert.ok(containsHelp(card.find("level-objectives")?.props.children));
  assert.equal(containsHelp(card.find("level-card")?.props.children), false);
  card.root.props.onPointerEnter({ pointerType: "mouse" });
  card.advance(899);
  assert.deepEqual(card.opened, []);
  card.advance(1);
  assert.deepEqual(card.opened, [false]);
  const expanded = mount({ ...props, details: { pinned: false } });
  assert.equal(expanded.find("level-objectives")?.props.hidden, false);
  assert.ok(expanded.find("level-shop-hint"));
  assert.ok(expanded.find("level-objectives")?.props.className?.includes("is-preview"));
});

test("las puertas solo aparecen en sus cinco tarjetas abiertas, nunca en pantallas vecinas", () => {
  const progress = { ...emptyProgress, unlocked: 29, secretUnlocked: true, waterUnlocked: true };
  const withDoors = levels.flatMap((level, index) => {
    const card = mount({ level, index, progress });
    return card.find("level-shop-badge") ? [level.id] : [];
  });
  assert.deepEqual(withDoors, ["1-2", "3-2", "6-2", "10-2", "12-2"]);
  const closedLevel = mount({ level: levels[1], index: 1, unlocked: false, progress });
  assert.equal(closedLevel.find("level-shop-badge"), undefined);
  assert.equal(closedLevel.find("level-shop-hint"), undefined);
  const level = levels.find((entry) => entry.id === "3-2")!;
  const closedWorld = mount({ level, progress: completeSecretShop(emptyProgress, "shop-3-2") });
  assert.equal(closedWorld.find("level-shop-badge"), undefined);
  assert.equal(closedWorld.find("level-shop-hint"), undefined);
});
