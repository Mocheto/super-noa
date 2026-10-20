import assert from "node:assert/strict";
import test from "node:test";
import { engineModules } from "./engineTestHarness.ts";
import type { useGameInput } from "./input";

class TargetElement {
  readonly tagName: string;
  readonly parent?: TargetElement;
  readonly attributes: Record<string, string>;
  constructor(tagName = "canvas", parent?: TargetElement, attributes: Record<string, string> = {}) {
    this.tagName = tagName;
    this.parent = parent;
    this.attributes = attributes;
  }
  closest(selector: string): TargetElement | null {
    const candidates = selector.split(",").map((part) => part.trim());
    const matches = candidates.includes(this.tagName)
      || (this.tagName === "a" && "href" in this.attributes && candidates.includes("a[href]"))
      || candidates.includes(`[role='${this.attributes.role}']`)
      || ("contenteditable" in this.attributes && this.attributes.contenteditable !== "false"
        && candidates.includes("[contenteditable]:not([contenteditable='false'])"));
    return matches ? this : this.parent?.closest(selector) ?? null;
  }
}

function mountInput(initialRunning = true) {
  const listeners = new Map<string, Set<(event: unknown) => void>>();
  const refs: { current: unknown }[] = [];
  const effects: { dependencies: unknown[]; cleanup?: () => void }[] = [];
  let refIndex = 0;
  let effectIndex = 0;
  const pending: (() => void)[] = [];
  const load = engineModules({
    react: {
      useRef(value: unknown) {
        const index = refIndex++;
        return refs[index] ??= { current: value };
      },
      useEffect(effect: () => (() => void) | void, dependencies: unknown[]) {
        const index = effectIndex++;
        const old = effects[index];
        if (old && dependencies.every((value, i) => Object.is(value, old.dependencies[i]))) return;
        pending.push(() => {
          old?.cleanup?.();
          effects[index] = { dependencies, cleanup: effect() ?? undefined };
        });
      },
    },
  }, {
    Element: TargetElement,
    window: {
      addEventListener(name: string, listener: (event: unknown) => void) {
        if (!listeners.has(name)) listeners.set(name, new Set());
        listeners.get(name)!.add(listener);
      },
      removeEventListener: (name: string, listener: (event: unknown) => void) => listeners.get(name)?.delete(listener),
    },
  });
  const { useGameInput: hook } = load("./input") as { useGameInput: typeof useGameInput };
  let result: ReturnType<typeof useGameInput>;
  const render = (running: boolean) => {
    refIndex = 0;
    effectIndex = 0;
    result = hook(running);
    pending.splice(0).forEach((effect) => effect());
  };
  render(initialRunning);
  return {
    get input() { return result.inputRef.current; },
    setRunning: render,
    key(code: string, target: TargetElement, type = "keydown", prevented = false) {
      const event = {
        code, target, defaultPrevented: prevented, isComposing: false,
        composedPath: () => [target],
        preventDefault() { this.defaultPrevented = true; },
      };
      listeners.get(type)?.forEach((listener) => listener(event));
      return event;
    },
    unmount() { effects.forEach((effect) => effect.cleanup?.()); },
  };
}

test("Espacio en canvas salta y evita desplazamiento, pero no roba activación de controles o diálogos", () => {
  const hook = mountInput();
  try {
    const targets = [
      ...["button", "input", "textarea", "select", "dialog"].map((tag) => new TargetElement(tag)),
      new TargetElement("a", undefined, { href: "#mapa" }),
      ...["dialog", "alertdialog", "button", "link"].map((role) => new TargetElement("div", undefined, { role })),
      new TargetElement("div", undefined, { contenteditable: "true" }),
      new TargetElement("span", new TargetElement("button")),
    ];
    for (const target of targets) {
      const event = hook.key("Space", target);
      assert.equal(event.defaultPrevented, false);
      assert.equal(hook.input.jump, false);
      assert.equal(hook.input.jumpQueued, false);
      assert.equal(hook.key("ArrowLeft", target).defaultPrevented, false);
      assert.equal(hook.input.left, false);
      hook.key("KeyX", target);
      assert.equal(hook.input.shootQueued, false);
    }
    const canvas = new TargetElement();
    assert.equal(hook.key("Space", canvas).defaultPrevented, true);
    assert.equal(hook.input.jump, true);
    assert.equal(hook.input.jumpQueued, true);
    hook.key("Space", canvas, "keyup");
    assert.equal(hook.input.jump, false);
  } finally {
    hook.unmount();
  }
});

test("el teclado pausado no captura Espacio y reanudar no conserva pulsaciones pendientes", () => {
  const hook = mountInput();
  try {
    const canvas = new TargetElement();
    hook.key("Space", canvas);
    hook.key("ArrowRight", canvas);
    hook.setRunning(false);
    assert.equal(hook.input.jumpQueued, false);
    assert.equal(hook.input.right, false);
    assert.equal(hook.key("Space", canvas).defaultPrevented, false);
    assert.equal(hook.key("Space", new TargetElement("button")).defaultPrevented, false);
    assert.equal(hook.input.jumpQueued, false);
    hook.setRunning(true);
    assert.equal(hook.input.jump, false);
    assert.equal(hook.key("Space", canvas).defaultPrevented, true);
    assert.equal(hook.input.jumpQueued, true);
  } finally {
    hook.unmount();
  }
});

test("una liberación sobre un botón elimina la tecla que empezó en canvas", () => {
  const hook = mountInput();
  try {
    hook.key("ArrowLeft", new TargetElement());
    assert.equal(hook.input.left, true);
    hook.key("ArrowLeft", new TargetElement("button"), "keyup");
    assert.equal(hook.input.left, false);
    const event = hook.key("Space", new TargetElement(), "keydown", true);
    assert.equal(event.defaultPrevented, true);
    assert.equal(hook.input.jumpQueued, false);
  } finally {
    hook.unmount();
  }
});

test("arriba encola una entrada por pulsación y la pausa borra la entrada pendiente", () => {
  const hook = mountInput();
  try {
    const canvas = new TargetElement();
    hook.key("ArrowUp", canvas);
    assert.equal(hook.input.enterQueued, true);
    assert.equal(hook.input.jumpQueued, true);
    hook.input.enterQueued = false;
    hook.key("ArrowUp", canvas);
    assert.equal(hook.input.enterQueued, false);
    hook.key("ArrowUp", canvas, "keyup");
    hook.key("ArrowUp", canvas);
    assert.equal(hook.input.enterQueued, true);
    hook.setRunning(false);
    assert.equal(hook.input.enterQueued, false);
    hook.setRunning(true);
    hook.key("ArrowUp", new TargetElement("button"));
    assert.equal(hook.input.enterQueued, false);
  } finally { hook.unmount(); }
});
