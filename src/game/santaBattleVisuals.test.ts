import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { actionBossBackgrounds, bossTerrains, santaBattleAssets, santaGiftSource, santaSpriteFrames, santaTerrainSources } from "./santaBattleAssets.ts";
import { readRgbaImage } from "./imagenTestUtils.ts";
import { SANTA_ARENA, SANTA_PLATFORMS } from "./santaBattle.ts";

test("el atlas nuevo conserva cinco poses completas, regalo y transparencia sin mezclar vecinos", () => {
  for (const source of Object.values(santaBattleAssets)) {
    assert.ok(source.startsWith("./assets/"));
    assert.ok(existsSync(new URL(`../../public/${source.slice(2)}`, import.meta.url)));
  }
  const {width,height,pixels} = readRgbaImage(santaBattleAssets.characters);
  const crops = [...santaSpriteFrames.map((frame) => frame.source), santaGiftSource];
  for (let index = 0; index < crops.length; index++) {
    const [x,y,w,h] = crops[index];
    assert.ok(x >= 0 && y >= 0 && x + w <= width && y + h <= height);
    let opaque = 0;
    for (let py = y; py < y + h; py++) for (let px = x; px < x + w; px++) {
      if (pixels[(py * width + px) * 4 + 3] >= 128) opaque++;
    }
    assert.ok(opaque > w * h * .3, `pose ${index}: silueta visible`);
    for (const other of crops.slice(index + 1)) {
      assert.ok(x + w <= other[0] || other[0] + other[2] <= x || y + h <= other[1] || other[1] + other[3] <= y);
    }
  }
  for (const frame of santaSpriteFrames) {
    assert.ok(frame.anchorX > frame.source[0] && frame.anchorX < frame.source[0] + frame.source[2]);
    assert.ok(frame.bodyHeight >= 440 && frame.bodyHeight <= 480, "el cuerpo mantiene la misma escala incluso al aturdirse");
  }
  assert.equal(pixels[3], 0, "las esquinas son transparentes");
});

test("cada jefe de acción carga su propia sala ilustrada", () => {
  const backgrounds = Object.values(actionBossBackgrounds);
  assert.equal(new Set(backgrounds).size, backgrounds.length);
  for (const source of backgrounds) {
    assert.match(source, /^\.\/assets\/worlds\/.*-boss-.*\.webp$/);
    assert.ok(existsSync(new URL(`../../public/${source.slice(2)}`, import.meta.url)), `falta ${source}`);
  }
});

test("el terreno nuevo alinea la nieve con la colisión y deja pasar a Noa completa por debajo", () => {
  const {width,height} = readRgbaImage(santaBattleAssets.terrain);
  for (const [x,y,w,h] of Object.values(santaTerrainSources)) assert.ok(x >= 0 && y >= 0 && x + w <= width && y + h <= height);
  for (const platform of SANTA_PLATFORMS) assert.ok(SANTA_ARENA.floor - platform.y - 40 >= 110);
});

test("Siroco y Don Silbato tienen su terreno y su proyectil, con el borde donde se pisa recto", () => {
  const atlases = Object.values(bossTerrains).map((terreno) => terreno.atlas);
  assert.ok(!atlases.includes(santaBattleAssets.terrain as never), "ya no usan el suelo nevado de Papá Noel");
  for (const terreno of Object.values(bossTerrains)) {
    assert.ok(existsSync(new URL(`../../public/${terreno.atlas.slice(2)}`, import.meta.url)), `falta ${terreno.atlas}`);
    const { width, height, pixels } = readRgbaImage(terreno.atlas);
    const alfa = (x: number, y: number) => pixels[(y * width + x) * 4 + 3];
    for (const [x, y, w, h] of [terreno.ground, terreno.ledge, terreno.projectile]) assert.ok(x >= 0 && y >= 0 && x + w <= width && y + h <= height);
    for (const pieza of ["ground", "ledge"] as const) {
      const [x, y, w] = terreno[pieza];
      // La fila de arriba de cada pieza: opaca en casi todo el ancho (sin ondas ni cosas encima que la tapen).
      let opacos = 0;
      for (let px = x; px < x + w; px++) if (alfa(px, y + 2) >= 128) opacos++;
      assert.ok(opacos > w * .85, `${terreno.atlas} ${pieza}: borde de arriba recto`);
    }
  }
});
