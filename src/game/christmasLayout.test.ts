import assert from "node:assert/strict";
import test from "node:test";
import { levels } from "./levels.ts";
import { mountEngine } from "./engineTestHarness.ts";
import { readRgbaPng } from "./pngTestUtils.ts";

for (const level of levels.filter((l) => l.world === 13)) {
  for (const box of level.rewardBlocks) {
    test(`${level.id}: Noa golpea ${box.id} desde su repisa con un salto real`, () => {
      const support = level.platforms.filter((p) => p.x <= box.x && p.x + p.width >= box.x + 48 && p.y > box.y + 48).sort((a,b) => a.y - b.y)[0];
      const engine = mountEngine({ ...level, enemies: [], items: [], start: { x: box.x + 3, y: support.y - 58 } });
      engine.tick(1); engine.tick(18); engine.tick(35);
      engine.input.jump = true; engine.input.jumpQueued = true;
      for (let i = 3; i < 55; i++) engine.tick(1 + i * 17);
      assert.ok(engine.events.includes("block"), `${box.id}: colisión real con la cara inferior`);
      assert.ok(!engine.events.includes("life"));
      engine.unmount();
    });
  }
}

test("los atlas propios de la aldea tienen transparencia y dos zonas de terreno separadas", () => {
  for (const name of ["winter-village-terrain-v1", "winter-village-enemies-v1"]) {
    const {width,height,pixels} = readRgbaPng(`./assets/atlases/${name}.png`);
    assert.ok(width >= 1024 && height >= 512);
    let transparent = 0, opaque = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
      if (pixels[i] >= 200) opaque++;
    }
    assert.ok(transparent > width * height * .2);
    assert.ok(opaque > width * height * .1);
  }
});

test("la senda de Navidad muestra su propio consejo y no descarga los atlas de hielo", () => {
  const engine = mountEngine(levels.find((l) => l.id === "13-1")!);
  engine.tick(1); engine.tick(18);
  assert.ok(engine.drawnText.includes("¡SALTA SOBRE EL REGALO DE LA FLECHA!"));
  assert.ok(engine.drawnText.every((text) => !text.includes("HIELO RESBALA")));
  assert.ok(engine.requested.some((path) => path.includes("winter-village-enemies")));
  assert.ok(engine.requested.every((path) => !path.includes("ice-mountain")));
  engine.unmount();
});
