import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

export function readRgbaPng(source: string) {
  const png = readFileSync(new URL(`../../public/${source.slice(2)}`, import.meta.url));
  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  assert.equal(png[24], 8, "canales de 8 bits");
  assert.equal(png[25], 6, "RGBA, sin fondo opaco");
  assert.equal(png[28], 0, "PNG sin entrelazado");
  const chunks: Buffer[] = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    if (png.toString("ascii", offset + 4, offset + 8) === "IDAT") chunks.push(png.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  assert.equal(raw.length, height * (stride + 1));
  const pixels = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    assert.ok(filter <= 4);
    for (let x = 0; x < stride; x++) {
      const left = x >= 4 ? pixels[y * stride + x - 4] : 0;
      const above = y ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft = y && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
      const p = left + above - upperLeft;
      const paeth = Math.abs(p - left) <= Math.abs(p - above) && Math.abs(p - left) <= Math.abs(p - upperLeft)
        ? left : Math.abs(p - above) <= Math.abs(p - upperLeft) ? above : upperLeft;
      const predictor = [0, left, above, Math.floor((left + above) / 2), paeth][filter];
      pixels[y * stride + x] = (raw[y * (stride + 1) + x + 1] + predictor) & 255;
    }
  }
  return { width, height, pixels, bytes: png.length };
}
