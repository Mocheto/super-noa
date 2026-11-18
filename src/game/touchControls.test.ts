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

test("los botones táctiles caben en un móvil y siguen siendo fáciles de tocar", () => {
  const { MEDIDAS_TACTILES: m } = engineModules({ "react/jsx-runtime": { jsx, jsxs: jsx } })("./TouchControls") as typeof import("./TouchControls");
  for (const tamano of [m.grande, m.apaisado, m.vertical]) {
    // Un dedo de cinco años mide unos 40–45 px: cada área táctil le saca al menos 60.
    for (const lado of [tamano.flecha, tamano.salta, tamano.lana]) assert.ok(lado + 2 * tamano.areaExtra >= 60, `área táctil de ${lado} px demasiado pequeña`);
    assert.ok(tamano.salta > tamano.flecha && tamano.flecha > tamano.lana, "SALTA es el más grande y LANA el más pequeño");
    assert.ok(tamano.separacion >= tamano.areaExtra, "las áreas táctiles de las flechas no se pisan del todo");
  }
  // En un móvil de 375 px de ancho en vertical caben las dos flechas, LANA y SALTA en una fila.
  const v = m.vertical;
  assert.ok(2 * v.flecha + v.separacion + v.lana + v.salta + v.separacion + 2 * v.borde + 40 <= 375);
  // En móvil apaisado (340 px de alto) SALTA y LANA no suben más de un tercio de la pantalla.
  const a = m.apaisado;
  assert.ok(a.borde + a.salta * 1.45 + a.lana <= 340 * 0.6);
  assert.ok(m.opacidad >= 0.5 && m.opacidad <= 0.7, "translúcidos sobre el escenario");
});

test("los botones táctiles llevan solo dibujo: el nombre va en la etiqueta oculta", () => {
  const tree = TouchControls({ onPress: noop, onRelease: noop, onCancel: noop }) as unknown as Tree;
  for (const button of buttons(tree)) {
    assert.ok(typeof button.props["aria-label"] === "string" && (button.props["aria-label"] as string).length > 3);
    assert.ok(!JSON.stringify(button.props.children).includes("small"), "sin palabra pequeña debajo del dibujo");
  }
});
