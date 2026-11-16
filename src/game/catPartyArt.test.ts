import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ART, BELT, CLEARING_BACKGROUND, KITTENS, NOA_FEET, cellPosition, cellStyle, halfCell, shown, type Strip } from "./catPartyArt.ts";

const file = (src: string) => readFileSync(new URL(`../../public/assets/${src.replace("./assets/", "")}`, import.meta.url));
/** Tamaño y transparencia de un WebP con canal alfa (cabecera VP8X). */
function webp(src: string) {
  const bytes = file(src);
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF", src);
  assert.equal(bytes.toString("ascii", 8, 12), "WEBP", src);
  if (bytes.toString("ascii", 12, 16) === "VP8X") return { alpha: (bytes[20] & 0x10) !== 0, width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
  assert.equal(bytes.toString("ascii", 12, 16), "VP8 ", src); // WebP con pérdida y sin alfa (el fondo)
  return { alpha: false, width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
}

test("cada tira del arte final tiene celdas iguales, transparencia real y el tamaño declarado", () => {
  for (const [name, strip] of Object.entries(ART)) {
    if (!("cell" in strip)) continue;
    const size = webp(strip.src);
    assert.ok(size.alpha, `${name} sin transparencia`);
    assert.deepEqual([size.width, size.height], [strip.cell[0] * strip.count, strip.cell[1]], name);
  }
});

test("las piezas sueltas tienen el tamaño declarado y transparencia real", () => {
  for (const [name, piece] of Object.entries(ART)) {
    if (!("size" in piece)) continue;
    const size = webp(piece.src);
    assert.ok(size.alpha, `${name} sin transparencia`);
    assert.deepEqual([size.width, size.height], [...piece.size], name);
  }
});

test("el fondo del claro es un WebP 16:9 con las rutas relativas del juego", () => {
  assert.match(CLEARING_BACKGROUND, /^\.\/assets\/worlds\//);
  const size = webp(CLEARING_BACKGROUND);
  assert.ok(Math.abs(size.width / size.height - 16 / 9) < 0.02, `${size.width}×${size.height}`);
  for (const strip of Object.values(ART)) assert.match("src" in strip ? strip.src : "", /^\.\/assets\/sprites\//);
});

test("las celdas se eligen por posición y las mitades de los troncos son las dos últimas", () => {
  const four: Strip = ART.mediumLog;
  assert.equal(cellPosition(four, 0), "0% 0");
  assert.equal(cellPosition(four, 3), "100% 0");
  assert.equal(cellStyle(four, 1).backgroundSize, "400% 100%");
  assert.deepEqual([halfCell(four, -1), halfCell(four, 1)], [2, 3]);
  assert.deepEqual([halfCell(ART.smallLog, -1), halfCell(ART.smallLog, 1)], [1, 2]);
  assert.deepEqual(shown(ART.smallLog), { width: 118, height: 39.5 }, "el tronco pequeño mide 118 de ancho en pantalla");
  assert.equal(shown(ART.mediumLog).width, 200, "el mediano mide 200 de ancho y se distingue por el tamaño");
});

test("la escena queda dentro de los 960 × 540 y los pies caen dentro de cada celda", () => {
  assert.ok(BELT.left + BELT.tiles * ART.belt.size[0] / 2 <= 960);
  assert.ok(NOA_FEET.x + shown(ART.noa).width / 2 <= 960 && NOA_FEET.y <= 540);
  for (const strip of [ART.noa, ART.kittenGrey, ART.kittenOrange, ART.fire]) assert.ok(strip.feetX! > 0 && strip.feetX! < strip.cell[0], strip.src);
  assert.ok(KITTENS.grey.feetX + shown(ART.kittenGrey).width / 2 <= 960);
});

test("el juego usa el arte final y ya no el provisional", () => {
  const code = readFileSync(new URL("./CatPartyGame.tsx", import.meta.url), "utf8");
  for (const retired of ["gatitos-tronco", "noa-cat-yarn-v2", "world-cat-2-v1", "world-cat-4-v1", "cat-party-axe"]) assert.equal(code.includes(retired), false, retired);
  assert.match(code, /ART\.noa/);
  assert.match(code, /CLEARING_BACKGROUND/);
});
