// Normalize the project's actual world kittens, without drawing replacement cats.
// Run with Node 22: node --experimental-strip-types scripts/build-shop-world-cats.mjs [--check]
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync, inflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const width = 384, height = 192, columnWidth = 128;
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type), length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}
function decode(bytes) {
  assert(bytes.subarray(0, 8).equals(signature), 'PNG signature');
  let w, h, ended = false, at = 8;
  const compressed = [];
  while (at < bytes.length) {
    const size = bytes.readUInt32BE(at), end = at + size + 8;
    assert(end + 4 <= bytes.length, 'Truncated PNG');
    const type = bytes.toString('ascii', at + 4, at + 8), data = bytes.subarray(at + 8, end);
    assert.equal(bytes.readUInt32BE(end), crc32(bytes.subarray(at + 4, end)), `${type} CRC`);
    if (type === 'IHDR') {
      assert.equal(size, 13);
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      assert.deepEqual([...data.subarray(8)], [8, 6, 0, 0, 0], 'Non-interlaced 8-bit RGBA required');
    } else if (type === 'IDAT') compressed.push(data);
    else if (type === 'IEND') { assert.equal(size, 0); ended = true; }
    at = end + 4;
  }
  assert(ended && w > 0 && h > 0, 'Complete PNG required');
  const stride = w * 4, packed = inflateSync(Buffer.concat(compressed)), pixels = Buffer.alloc(stride * h);
  assert.equal(packed.length, (stride + 1) * h);
  for (let y = 0; y < h; y++) {
    const filter = packed[y * (stride + 1)]; assert(filter <= 4, 'Supported PNG scanline filter');
    for (let x = 0; x < stride; x++) {
      const left = x >= 4 ? pixels[y * stride + x - 4] : 0;
      const up = y ? pixels[(y - 1) * stride + x] : 0;
      const corner = y && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
      let prediction = 0;
      if (filter === 1) prediction = left;
      else if (filter === 2) prediction = up;
      else if (filter === 3) prediction = Math.floor((left + up) / 2);
      else if (filter === 4) {
        const p = left + up - corner, a = Math.abs(p - left), b = Math.abs(p - up), c = Math.abs(p - corner);
        prediction = a <= b && a <= c ? left : b <= c ? up : corner;
      }
      pixels[y * stride + x] = (packed[y * (stride + 1) + x + 1] + prediction) & 255;
    }
  }
  return { w, h, pixels };
}
function encode(pixels) {
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4);
  header[8] = 8; header[9] = 6;
  const rows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) pixels.copy(rows, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  return Buffer.concat([signature, chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
function normalize(source) {
  let left = source.w, top = source.h, right = -1, bottom = -1;
  for (let y = 0; y < source.h; y++) for (let x = 0; x < source.w; x++)
    if (source.pixels[(y * source.w + x) * 4 + 3]) {
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  assert(right >= left && bottom >= top, 'Source kitten must be visible');
  const cropWidth = right - left + 1, cropHeight = bottom - top + 1;
  // A 2x nearest-neighbor grid fits the game's pixel art and compact asset budget.
  // Nothing but fully transparent outer margins is cropped; ears, paws and tails stay.
  const scale = Math.min(60 / cropWidth, 92 / cropHeight);
  const w = Math.max(1, Math.round(cropWidth * scale)), h = Math.max(1, Math.round(cropHeight * scale));
  assert(Math.abs(w / h - cropWidth / cropHeight) <= 1 / h + cropWidth / cropHeight / h, 'Preserved aspect ratio');
  const ox = Math.floor((64 - w) / 2), oy = Math.floor((96 - h) / 2);
  const pixels = Buffer.alloc(columnWidth * height * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = left + Math.min(cropWidth - 1, Math.floor((x + 0.5) * cropWidth / w));
    const sy = top + Math.min(cropHeight - 1, Math.floor((y + 0.5) * cropHeight / h));
    const sourceAt = (sy * source.w + sx) * 4;
    if (!source.pixels[sourceAt + 3]) continue;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const targetAt = (((oy + y) * 2 + dy) * columnWidth + (ox + x) * 2 + dx) * 4;
      source.pixels.copy(pixels, targetAt, sourceAt, sourceAt + 4);
    }
  }
  return pixels;
}
function column(pixels, index) {
  const result = Buffer.alloc(columnWidth * height * 4);
  for (let y = 0; y < height; y++)
    pixels.copy(result, y * columnWidth * 4, (y * width + index * columnWidth) * 4, (y * width + (index + 1) * columnWidth) * 4);
  return result;
}
function validate(pixels, expected) {
  const identities = new Set();
  for (let index = 0; index < 3; index++) {
    const portrait = column(pixels, index);
    assert(portrait.equals(expected[index]), `Column ${index} must exactly match its normalized world-cat source`);
    identities.add(createHash('sha256').update(portrait).digest('hex'));
    let visible = 0;
    const bandColors = [new Set(), new Set(), new Set()];
    for (let y = 0; y < height; y++) for (let x = 0; x < columnWidth; x++) {
      const at = (y * columnWidth + x) * 4, alpha = portrait[at + 3];
      if (alpha) { visible++; bandColors[Math.floor(y / 64)].add(portrait.readUInt32BE(at)); }
      if (x === 0 || x === columnWidth - 1 || y === 0 || y === height - 1)
        assert.equal(alpha, 0, 'Transparent portrait perimeter');
    }
    assert(visible > 1000 && visible < columnWidth * height * 0.9, 'Visible kitten on transparent background');
    assert(bandColors.every(colors => colors.size >= 6), 'All three 64px bands contain recognizable colored artwork');
  }
  assert.equal(identities.size, 3, 'Three distinct real kittens per shop');
}
export async function buildShopWorldCats({ check = false } = {}) {
  const { secretShopCatSets, getSecretShopCatSet } = await import('../src/game/secretShopCats.ts');
  const cache = new Map(), outputs = [];
  for (const set of secretShopCatSets) {
    const { kittens } = getSecretShopCatSet(set.world);
    assert.equal(kittens.length, 3);
    const portraits = kittens.map((cat, index) => {
      assert.equal(cat.world, set.cats[index]);
      assert.equal(cat.source, `./assets/sprites/world-cat-${cat.world}-v1.png`, 'Use actual world-cat source');
      if (!cache.has(cat.source)) cache.set(cat.source, normalize(decode(readFileSync(resolve(root, cat.source)))));
      return cache.get(cat.source);
    });
    const pixels = Buffer.alloc(width * height * 4);
    portraits.forEach((portrait, index) => {
      for (let y = 0; y < height; y++)
        portrait.copy(pixels, (y * width + index * columnWidth) * 4, y * columnWidth * 4, (y + 1) * columnWidth * 4);
    });
    validate(pixels, portraits);
    const bytes = encode(pixels), decoded = decode(bytes);
    assert.equal(decoded.w, width); assert.equal(decoded.h, height); validate(decoded.pixels, portraits);
    outputs.push({ source: set.source, bytes, portraits });
  }
  const total = outputs.reduce((sum, output) => sum + output.bytes.length, 0);
  assert(total < 250 * 1024, 'Five shop atlases must fit within 250 KiB');
  for (const { source, bytes, portraits } of outputs) {
    const target = resolve(root, source);
    if (check) {
      const actual = readFileSync(target), decoded = decode(actual);
      assert.equal(decoded.w, width); assert.equal(decoded.h, height);
      validate(decoded.pixels, portraits); assert(actual.equals(bytes), `${source} differs; regenerate`);
    } else writeFileSync(target, bytes);
    console.log(`${check ? 'Verified' : 'Wrote'} ${source}: ${width}x${height} RGBA, ${bytes.length} bytes`);
  }
  console.log(`Total ${total} bytes; columns 128x192; vertical band cuts y=0,64,128.`);
  return outputs.map(({ source, bytes }) => ({ source, width, height, bytes: bytes.length }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert(process.argv.slice(2).every(arg => arg === '--check'), 'Usage: node --experimental-strip-types scripts/build-shop-world-cats.mjs [--check]');
  await buildShopWorldCats({ check: process.argv.includes('--check') });
}
