import assert from "node:assert/strict";
import test from "node:test";
import { readRgbaPng } from "./pngTestUtils.ts";

for (const world of ["desert", "train"] as const) {
  test(`el terreno de ${world} conserva transparencia y tres piezas separadas`, () => {
    const { width, height, pixels } = readRgbaPng(`./assets/atlases/${world}-terrain-v1.png`);
    assert.ok(width >= 1700 && height >= 850);
    let transparent = 0;
    let opaque = 0;
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] === 0) transparent += 1;
      if (pixels[index] > 220) opaque += 1;
    }
    assert.ok(transparent > width * height * .3, "el atlas necesita huecos transparentes entre piezas");
    assert.ok(opaque > width * height * .15, "el atlas necesita terreno visible suficiente");
    const alphaAt = (x: number, y: number) => pixels[(Math.floor(y * height) * width + Math.floor(x * width)) * 4 + 3];
    assert.equal(alphaAt(.5, .15), 0, "el hueco superior central separa las piezas");
    assert.equal(world === "desert" ? alphaAt(.72, .3) : alphaAt(.72, .58), 0, "el hueco junto a la pared es transparente");
  });
}
