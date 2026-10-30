import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { santaBattleAssets, santaGiftSource, santaSpriteFrames, santaTerrainSources } from "./santaBattleAssets.ts";
import { readRgbaPng } from "./pngTestUtils.ts";
import { SANTA_ARENA, SANTA_PLATFORMS } from "./santaBattle.ts";

test("el atlas nuevo conserva cinco poses completas, regalo y transparencia sin mezclar vecinos", () => {
  for (const source of Object.values(santaBattleAssets)) {
    assert.ok(source.startsWith("./assets/"));
    assert.ok(existsSync(new URL(`../../public/${source.slice(2)}`, import.meta.url)));
  }
  const {width,height,pixels} = readRgbaPng(santaBattleAssets.characters);
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

test("el terreno nuevo alinea la nieve con la colisión y deja pasar a Noa completa por debajo", () => {
  const {width,height} = readRgbaPng(santaBattleAssets.terrain);
  for (const [x,y,w,h] of Object.values(santaTerrainSources)) assert.ok(x >= 0 && y >= 0 && x + w <= width && y + h <= height);
  for (const platform of SANTA_PLATFORMS) assert.ok(SANTA_ARENA.floor - platform.y - 40 >= 110);
});
