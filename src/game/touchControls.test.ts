import assert from "node:assert/strict";
import test from "node:test";
import { engineModules } from "./engineTestHarness.ts";
import type { TouchControl } from "./TouchControls";

type Tree = { type: string; props: { children?: Tree | Tree[]; className?: string; [key: string]: unknown } };
const jsx = (type: string, props: Tree["props"]) => ({ type, props });
const { TouchControls } = engineModules({ "react/jsx-runtime": { jsx, jsxs: jsx } })("./TouchControls") as typeof import("./TouchControls");
function buttons(tree: Tree): Tree[] {
  const children = tree.props?.children;
  return [...(tree.type === "button" ? [tree] : []), ...(Array.isArray(children) ? children : [children]).flatMap((child) => child && typeof child === "object" ? buttons(child) : [])];
}
const noop = () => {};

test("Papá Noel usa los mismos botones de movimiento y salto de campaña y omite solo la lana", () => {
  const normal = buttons(TouchControls({ onPress: noop, onRelease: noop, onCancel: noop }) as unknown as Tree);
  const santa = buttons(TouchControls({ onPress: noop, onRelease: noop, onCancel: noop, showYarn: false }) as unknown as Tree);
  assert.equal(normal.length, 4); assert.equal(santa.length, 3);
  assert.ok(normal.some((b) => b.props.className?.includes("touch-yarn")));
  assert.ok(santa.every((b) => !b.props.className?.includes("touch-yarn")));
  for (const button of santa) {
    const original = normal.find((b) => b.props["aria-label"] === button.props["aria-label"]);
    assert.ok(original);
    assert.equal(button.props.className, original.props.className);
    assert.deepEqual(button.props.children, original.props.children);
  }
});

test("los controles compartidos conservan la identidad del dedo al soltar o cancelar y no abren el menú", () => {
  const calls: Array<[TouchControl,string,unknown]> = [];
  const tree = TouchControls({ showYarn: false,
    onPress: (key,e) => calls.push([key,"press",e]), onRelease: (key,e) => calls.push([key,"release",e]), onCancel: (key,e) => calls.push([key,"cancel",e]),
  }) as unknown as Tree;
  const jump = buttons(tree).find((b) => b.props.className?.includes("touch-jump"))!;
  const event = { pointerId: 7 };
  for (const name of ["onPointerDown","onPointerUp","onPointerCancel","onLostPointerCapture"]) {
    (jump.props[name] as (e: unknown) => void)(event);
  }
  assert.deepEqual(calls, [["jump","press",event],["jump","release",event],["jump","cancel",event],["jump","cancel",event]]);
  let prevented = false;
  (jump.props.onContextMenu as (e: unknown) => void)({ preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
});

test("los botones táctiles miden lo decidido para dedos pequeños y no se tocan entre sí", () => {
  const { MEDIDAS_TACTILES: m } = engineModules({ "react/jsx-runtime": { jsx, jsxs: jsx } })("./TouchControls") as typeof import("./TouchControls");
  // Un dedo de cinco años mide unos 40–45 px: cada área táctil le saca al menos el doble.
  for (const lado of [m.flecha, m.salta, m.lana]) assert.ok(lado + 2 * m.areaExtra >= 100, `área táctil de ${lado} px demasiado pequeña`);
  assert.ok(m.salta > m.flecha && m.flecha > m.lana, "SALTA es el más grande y LANA el más pequeño");
  // Las áreas invisibles de dos flechas vecinas no se pisan.
  assert.ok(m.separacion >= 2 * m.areaExtra - 4, "las áreas táctiles de las flechas no deben solaparse");
  assert.ok(m.opacidad >= 0.8 && m.opacidad < 1);
  assert.ok(m.borde >= 16);
});

test("los botones táctiles llevan solo dibujo: el nombre va en la etiqueta oculta", () => {
  const tree = TouchControls({ onPress: noop, onRelease: noop, onCancel: noop }) as unknown as Tree;
  for (const button of buttons(tree)) {
    assert.ok(typeof button.props["aria-label"] === "string" && (button.props["aria-label"] as string).length > 3);
    assert.ok(!JSON.stringify(button.props.children).includes("small"), "sin palabra pequeña debajo del dibujo");
  }
});
