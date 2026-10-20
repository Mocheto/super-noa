// Original, geometry-authored Super Noa artwork; no images, fonts or dependencies.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync, inflateSync } from 'node:zlib';
import assert from 'node:assert/strict';

const ink = '#392c50', cream = '#fff0ce', gold = '#ffd278';
const colors = new Map();
function rgba(hex) {
  if (!colors.has(hex)) colors.set(hex, [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
    .concat(hex.length === 9 ? parseInt(hex.slice(7, 9), 16) : 255));
  return colors.get(hex);
}
class Canvas {
  constructor(w, h) { this.w = w; this.h = h; this.data = Buffer.alloc(w * h * 4); }
  pixel(x, y, color) {
    x = Math.round(x); y = Math.round(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.data.set(rgba(color), (y * this.w + x) * 4);
  }
  rect(x, y, w, h, color) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.pixel(i, j, color);
  }
  oval(x, y, rx, ry, color) {
    for (let j = Math.ceil(y - ry); j <= y + ry; j++)
      for (let i = Math.ceil(x - rx); i <= x + rx; i++)
        if (((i - x) / rx) ** 2 + ((j - y) / ry) ** 2 <= 1) this.pixel(i, j, color);
  }
  line(points, color, width = 1) {
    for (let n = 1; n < points.length; n++) {
      const [ax, ay] = points[n - 1], [bx, by] = points[n];
      const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 2 || 1;
      for (let k = 0; k <= steps; k++) {
        const x = ax + (bx - ax) * k / steps, y = ay + (by - ay) * k / steps;
        if (width === 1) this.pixel(x, y, color);
        else this.oval(Math.round(x), Math.round(y), width / 2, width / 2, color);
      }
    }
  }
  poly(points, color) {
    for (let y = Math.floor(Math.min(...points.map(p => p[1]))); y <= Math.max(...points.map(p => p[1])); y++) {
      const xs = [];
      for (let n = 0; n < points.length; n++) {
        const a = points[n], b = points[(n + 1) % points.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y))
          xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      }
      xs.sort((a, b) => a - b);
      for (let n = 0; n < xs.length; n += 2)
        for (let x = Math.ceil(xs[n]); x <= xs[n + 1]; x++) this.pixel(x, y, color);
    }
  }
  shape(points, color, outline = ink) {
    this.poly(points, color); this.line([...points, points[0]], outline);
  }
  outlinedOval(x, y, rx, ry, color) {
    this.oval(x, y, rx, ry, ink); this.oval(x, y, rx - 1, ry - 1, color);
  }
  paste(source, dx, dy, scale = 1) {
    for (let y = 0; y < source.h; y++) for (let x = 0; x < source.w; x++)
      for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) {
        const at = ((dy + y * scale + sy) * this.w + dx + x * scale + sx) * 4;
        source.data.copy(this.data, at, (y * source.w + x) * 4, (y * source.w + x + 1) * 4);
      }
  }
}
function star(c, x, y, r, fill = gold) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.46 : r;
    return [Math.round(x + Math.cos(a) * radius), Math.round(y + Math.sin(a) * radius)];
  });
  c.shape(points, fill, '#956197'); c.pixel(x - 1, y - 1, cream);
}
function paw(c, x, y, color, size = 1) {
  c.oval(x, y + 2 * size, 3 * size, 2 * size, color);
  for (const [dx, dy] of [[-3, -1], [-1, -3], [2, -3], [4, -1]])
    c.oval(x + dx * size, y + dy * size, size, size, color);
}
function door(frame) {
  const c = new Canvas(32, 40);
  c.shape([[4, 38], [4, 12], [8, 7], [24, 7], [28, 12], [28, 38]], '#946077');
  c.rect(6, 13, 20, 25, '#e8b478');
  c.rect(7, 14, 18, 24, '#714454');
  c.shape([[9, 37], [9, 16], [12, 12], [21, 12], [24, 16], [24, 37]], frame === 1 ? '#d49c64' : '#b47650');
  for (const x of [12, 16, 20]) {
    c.line([[x, 15], [x, 36]], '#8d5748');
    c.line([[x + 1, 17], [x + 1, 35]], frame === 1 ? '#f1c780' : '#cb9260');
  }
  c.line([[10, 28], [23, 28]], '#774650');
  c.rect(10, 29, 13, 1, '#d6a16e');
  c.outlinedOval(21, 27, 2, 2, gold);
  c.pixel(21, 26, cream);
  c.shape([[2, 13], [4, 9], [16, 2], [28, 9], [30, 13], [26, 15], [16, 8], [6, 15]], '#775986');
  c.line([[4, 11], [16, 4], [28, 11]], '#b897c3');
  star(c, 16, 7, 4, frame === 1 ? '#ffe4a1' : '#e9b773');
  c.rect(6, 17, 1, 18, '#f3cd91'); c.rect(26, 17, 1, 18, '#6c4866');
  c.outlinedOval(16, 20, 5, 5, frame === 1 ? '#ffe6a1' : '#e8bc85');
  paw(c, 16, 20, '#865475', 0.65);
  if (frame === 1) {
    c.line([[9, 17], [9, 35]], '#ffe5a1');
    for (const x of [5, 27]) {
      c.rect(x - 1, 20, 3, 5, '#734a65'); c.rect(x, 21, 1, 3, gold);
      c.pixel(x, 20, cream);
    }
  }
  c.shape([[3, 37], [28, 37], [30, 39], [2, 39]], '#74566b');
  c.line([[4, 37], [27, 37]], '#efcc98');
  if (frame === 2) {
    c.outlinedOval(16, 35, 8, 3, '#d5a079');
    c.oval(17, 34, 5, 2, '#efc494');
    c.shape([[9, 35], [9, 30], [12, 32], [15, 31], [17, 30], [18, 35]], '#e2af81');
    c.line([[11, 34], [12, 35], [13, 34]], ink);
    c.line([[15, 34], [16, 35]], ink);
    c.line([[20, 35], [23, 35], [24, 34], [23, 33]], '#94617a', 2);
  }
  return c;
}
const catPalettes = [
  { fur: '#e7ac64', light: '#ffda97', shade: '#be7d54', bib: '#fff0ce', pink: '#ec9a9e', eyes: '#668967', collar: '#a76ca0' },
  { fur: '#b7a5cf', light: '#ddd0ec', shade: '#8c78ab', bib: '#f4e8ef', pink: '#dfa3be', eyes: '#557f9c', collar: '#dfac66' },
  { fur: '#658f83', light: '#9cbd9b', shade: '#486b70', bib: '#f8e8be', pink: '#df9b9b', eyes: '#b08b4e', collar: '#b980a8' },
];
function kitten(index) {
  const p = catPalettes[index], c = new Canvas(64, 168);
  // All three portraits share the same neck and row joins, but never a blank band.
  c.outlinedOval(32, 132, 22, 31, p.fur);
  c.oval(28, 127, 15, 23, p.light);
  c.oval(32, 133, 11, 23, p.bib);
  c.line([[48, 151], [55, 144], [56, 128], [53, 121]], ink, 7);
  c.line([[48, 151], [54, 144], [55, 128], [53, 121]], p.shade, 5);
  c.line([[54, 133], [55, 137]], p.light, 3);
  c.shape([[9, 64], [7, 8], [12, 4], [27, 38], [36, 38], [52, 4], [57, 8], [55, 64]], p.fur);
  c.shape([[12, 45], [11, 13], [23, 40]], p.pink);
  c.shape([[41, 40], [53, 13], [52, 45]], p.pink);
  c.line([[13, 29], [13, 17], [19, 32]], '#f6c6c1');
  c.line([[46, 32], [51, 19], [51, 30]], '#f6c6c1');
  c.outlinedOval(32, 74, 28, 39, p.fur);
  c.oval(29, 69, 23, 33, p.light);
  c.poly([[9, 77], [12, 94], [22, 105], [33, 110], [46, 105], [55, 91], [57, 75], [49, 87], [44, 94], [32, 100], [19, 94]], p.fur);
  c.shape([[26, 36], [28, 31], [32, 35], [35, 32], [40, 39]], p.light, p.fur);
  for (const [x, y, direction] of [[17, 58, 1], [47, 58, -1], [14, 65, 1], [50, 65, -1]])
    c.poly([[x - 2, y - 3], [x + direction * 7, y], [x - 2, y + 2]], p.shade);
  c.poly([[28, 41], [31, 43], [32, 52], [34, 43], [37, 41], [35, 54], [31, 58]], p.shade);
  if (index === 2) c.poly([[30, 54], [34, 54], [38, 87], [32, 94], [25, 87]], p.bib);
  for (const x of [21, 43]) {
    c.outlinedOval(x, 78, 6, 8, ink);
    c.oval(x, 79, 4, 6, p.eyes);
    c.oval(x, 78, 2, 5, ink);
    c.rect(x - 2, 73, 3, 3, '#fff8eb'); c.pixel(x + 2, 81, cream);
    c.line([[x - 4, 67], [x, 65], [x + 3, 66]], p.shade);
  }
  c.oval(17, 91, 5, 3, p.pink); c.oval(47, 91, 5, 3, p.pink);
  c.oval(27, 95, 7, 6, p.bib); c.oval(37, 95, 7, 6, p.bib);
  c.shape([[28, 89], [36, 89], [32, 94]], '#ae687e');
  c.line([[32, 94], [32, 97], [29, 99], [27, 98]], ink);
  c.line([[32, 97], [35, 99], [37, 98]], ink);
  for (const side of [-1, 1]) {
    c.line([[32 + side * 14, 94], [32 + side * 26, 91]], p.shade);
    c.line([[32 + side * 15, 98], [32 + side * 25, 100]], p.shade);
  }
  c.shape([[19, 108], [32, 112], [45, 108], [44, 115], [32, 119], [20, 115]], p.collar);
  star(c, 32, 117, 4);
  for (const x of [22, 40]) {
    c.line([[x, 128], [x - 1, 151]], p.shade);
    c.outlinedOval(x, 156, 10, 7, p.bib);
    for (const dx of [-3, 2]) c.line([[x + dx, 156], [x + dx, 160]], '#bd9e9b');
  }
  c.line([[14, 144], [18, 147]], p.shade, 2);
  c.line([[44, 142], [47, 145]], p.light, 2);
  return c;
}
function aura(frame) {
  const c = new Canvas(64, 64);
  // Leave the whole central 56x78 output rectangle clear, not just a round hole.
  for (let y = 2; y < 62; y++) for (let x = 2; x < 62; x++) {
    if (x >= 18 && x <= 45 && y >= 12 && y <= 51) continue;
    const radius = ((x - 31.5) / 27) ** 2 + ((y - 31.5) / 29) ** 2;
    if (radius >= 0.76 && radius <= 1.07) c.pixel(x, y, '#9f6acb70');
    if (radius >= 0.90 && radius <= 0.99)
      c.pixel(x, y, (x + y + frame * 2) % 19 < 11 ? '#e9b85fcc' : '#be8de6bb');
  }
  for (const [x, y, r] of [[11, 19, 4], [52, 43, 4], [36, 5, 4], [23, 59, 3], [55, 16, 3], [7, 42, 3]]) {
    if (y < 53 && (x < 18 || x > 45))
      c.line([[x - 2, y + 6], [x - 4, y + 8 + frame % 2], [x - 6, y + 8]], '#bc83d4a0');
    star(c, x, y, r, frame === 1 ? '#ffe099' : '#f6c364');
  }
  for (const [x, y] of [[17, 8], [47, 6], [59, 31], [8, 52], [41, 58]]) {
    c.pixel(x, y, '#db9bde'); c.pixel(x + 1, y, '#ffe5a3');
    if (frame === 2) c.pixel(x, y + 1, '#bc8de1');
  }
  return c;
}
function plant(c, x, y, scale = 1) {
  c.line([[x, y], [x - 1, y - 21 * scale]], '#587c76', 2);
  for (const [dx, dy, dir] of [[0, -8, 1], [-1, -15, -1], [-1, -22, 1]]) {
    c.oval(x + dx + dir * 5 * scale, y + dy * scale, 7 * scale, 3 * scale, '#598d7b');
    c.line([[x + dx, y + dy * scale + 1], [x + dx + dir * 8 * scale, y + dy * scale - 1]], '#a4c392');
  }
  c.shape([[x - 10, y - 1], [x + 10, y - 1], [x + 7, y + 13], [x - 7, y + 13]], '#bd7c83', '#704e71');
  c.rect(x - 9, y, 18, 3, '#e7ad9d'); c.rect(x - 5, y + 5, 3, 5, '#d9948d');
}
function room() {
  const c = new Canvas(480, 270);
  c.rect(0, 0, 480, 270, '#a18aa9');
  c.rect(0, 0, 480, 14, '#735c80'); c.rect(0, 14, 480, 3, '#c7a9bf');
  c.rect(0, 17, 480, 5, '#dfb97d'); c.rect(0, 22, 480, 2, '#886b83');
  c.rect(93, 25, 294, 171, '#a992b1');
  c.rect(101, 31, 278, 159, '#ac97b5');
  for (const x of [3, 84, 390, 473]) {
    c.rect(x, 24, 4, 180, '#8a718f'); c.rect(x + 1, 24, 1, 176, '#c4a6ba');
  }
  c.rect(0, 192, 480, 12, '#76586e'); c.rect(0, 194, 480, 3, '#dbad85');
  c.rect(0, 204, 480, 66, '#ac7d6c');
  for (let y = 205; y < 270; y += 16) {
    c.rect(0, y, 480, 1, '#805f60'); c.rect(0, y + 1, 480, 1, '#d09f80');
    for (let x = (y % 3) * 51; x < 480; x += 96) {
      c.rect(x, y + 1, 1, 15, '#8f6662');
      c.line([[x + 12, y + 10], [x + 23, y + 10], [x + 27, y + 9]], '#b88c74');
    }
  }
  // The rug's busy patchwork stays below the minigame's quiet central panel.
  c.shape([[90, 224], [386, 224], [413, 264], [66, 264]], '#765777', '#785e75');
  c.shape([[96, 228], [380, 228], [402, 260], [78, 260]], '#d7a8a1', '#f1cfac');
  for (let row = 0; row < 3; row++) for (let col = 0; col < 10; col++) {
    const x = 89 + col * 30 - row * 3, y = 232 + row * 8;
    c.rect(x, y, 28, 7, ['#aa8cb2', '#d3b57e', '#8ca89b', '#c68f9e'][(col + row * 3) % 4]);
    c.line([[x + 2, y + 3], [x + 5, y + 3]], '#e5c7ae');
  }
  for (let x = 77; x < 404; x += 7) c.line([[x, 264], [x - 2, 268]], '#dbbca4');
  for (const side of [0, 1]) {
    const x = side ? 401 : 13;
    c.rect(x, 66, 65, 110, '#77566d');
    c.rect(x + 4, 70, 57, 101, '#8b677c');
    for (const y of [95, 132, 174]) {
      c.rect(x - 2, y, 69, 6, '#674d64'); c.rect(x - 2, y, 69, 2, '#d5a477');
      c.rect(x + 5, y + 6, 4, 6, '#76556c'); c.rect(x + 54, y + 6, 4, 6, '#76556c');
    }
    for (let n = 0; n < 4; n++) {
      const bx = x + 7 + n * 10, by = 77 + (n % 2) * 3;
      c.rect(bx, by, 7, 18 - n % 2 * 3, ['#ad92ba', '#8eafa0', '#d5ac81', '#c58e9d'][n]);
      c.rect(bx + 1, by + 2, 1, 13, '#f0caaa'); c.rect(bx, 89, 7, 1, '#775d77');
    }
    c.outlinedOval(x + 18, 121, 11, 10, '#b99ac4');
    c.line([[x + 10, 118], [x + 23, 124], [x + 25, 117], [x + 13, 127]], '#e5c5cf');
    c.outlinedOval(x + 46, 122, 10, 9, '#dfba83');
    c.line([[x + 39, 119], [x + 49, 127], [x + 52, 120]], '#a6797e');
    c.shape([[x + 8, 152], [x + 26, 152], [x + 28, 172], [x + 6, 172]], '#d6aa89', '#75576a');
    paw(c, x + 17, 161, '#a97688');
    c.rect(x + 36, 150, 20, 22, '#a79caa'); c.rect(x + 34, 148, 24, 4, '#c8b8bf');
    c.line([[x + 38, 154], [x + 38, 167]], '#e6ccbb');
    plant(c, x + 38, 62, 0.75);
  }
  plant(c, 35, 211, 1.4); plant(c, 446, 211, 1.4);
  // Soft hanging ribbons and wooden ornaments remain in the side gutters.
  for (const x of [51, 429]) {
    c.line([[x, 24], [x, 39]], '#e7bf85');
    star(c, x, 47, 9, '#d9ad7a');
    c.line([[x - 3, 44], [x, 41], [x + 2, 44]], '#ffe2ab');
    c.line([[x - 15, 25], [x - 11, 33], [x, 36], [x + 10, 33], [x + 15, 25]], '#dbb47e', 2);
  }
  for (const x of [16, 462]) {
    c.line([[x, 27], [x, 46]], '#795b79');
    c.outlinedOval(x, 52, 8, 8, '#c7a4b4'); paw(c, x, 51, '#f2d3ab', 0.8);
  }
  c.outlinedOval(68, 208, 12, 5, '#bf929f');
  c.oval(68, 207, 9, 2, '#ead1b7');
  c.outlinedOval(411, 208, 12, 5, '#a2b4a7');
  c.oval(411, 207, 9, 2, '#e6d3b7');
  const out = new Canvas(960, 540); out.paste(c, 0, 0, 2); return out;
}
function atlas(w, h, frames, frameWidth) {
  const c = new Canvas(w, h);
  frames.forEach((f, i) => c.paste(f, i * frameWidth, 0, 2));
  return c;
}
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const tag = Buffer.from(type), length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([tag, data])));
  return Buffer.concat([length, tag, data, crc]);
}
function png(c) {
  const header = Buffer.alloc(13); header.writeUInt32BE(c.w); header.writeUInt32BE(c.h, 4);
  header[8] = 8; header[9] = 6;
  const rows = Buffer.alloc((c.w * 4 + 1) * c.h);
  for (let y = 0; y < c.h; y++) c.data.copy(rows, y * (c.w * 4 + 1) + 1, y * c.w * 4, (y + 1) * c.w * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header), chunk('IDAT', deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
function validatePng(bytes, c) {
  assert(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
  let at = 8, ended = false;
  const compressed = [];
  while (at < bytes.length) {
    const length = bytes.readUInt32BE(at), end = at + 8 + length;
    const type = bytes.toString('ascii', at + 4, at + 8), data = bytes.subarray(at + 8, end);
    assert.equal(bytes.readUInt32BE(end), crc32(bytes.subarray(at + 4, end)), `${type} CRC`);
    if (type === 'IHDR') {
      assert.equal(data.readUInt32BE(0), c.w); assert.equal(data.readUInt32BE(4), c.h);
      assert.deepEqual([...data.subarray(8)], [8, 6, 0, 0, 0], '8-bit RGBA, no interlace');
    } else if (type === 'IDAT') compressed.push(data);
    else if (type === 'IEND') ended = true;
    else assert.fail(`Unexpected PNG chunk ${type}`);
    at = end + 4;
  }
  assert(ended); assert.equal(at, bytes.length);
  const rows = inflateSync(Buffer.concat(compressed)), stride = c.w * 4 + 1;
  assert.equal(rows.length, stride * c.h);
  for (let y = 0; y < c.h; y++) {
    assert.equal(rows[y * stride], 0);
    assert(rows.subarray(y * stride + 1, (y + 1) * stride).equals(c.data.subarray(y * c.w * 4, (y + 1) * c.w * 4)));
  }
}
function validateArt(c, frameWidth, frameHeight, kind) {
  const signatures = new Set();
  if (kind === 'kitten') for (let x = 0; x < c.w; x++) {
    assert.equal(c.data[x * 4 + 3], 0, 'Portrait top border');
    assert.equal(c.data[((c.h - 1) * c.w + x) * 4 + 3], 0, 'Portrait bottom border');
  }
  for (let oy = 0; oy < c.h; oy += frameHeight) for (let ox = 0; ox < c.w; ox += frameWidth) {
    const visible = new Set(), pixels = [];
    for (let y = 0; y < frameHeight; y++) for (let x = 0; x < frameWidth; x++) {
      const i = ((oy + y) * c.w + ox + x) * 4, color = c.data.readUInt32BE(i);
      pixels.push(color);
      if (c.data[i + 3]) visible.add(color);
      const border = x === 0 || x === frameWidth - 1 || y === 0 || y === frameHeight - 1;
      // Door rests on its specified bottom baseline; kitten rows are continuous cuts.
      if (kind !== 'room' && border && (kind === 'kitten' ? x === 0 || x === frameWidth - 1 : kind === 'door' ? y !== frameHeight - 1 : true))
        assert.equal(c.data[i + 3], 0, `${kind} transparent border ${x},${y}`);
      if (kind === 'aura' && x >= 36 && x <= 91 && y >= 24 && y <= 103)
        assert.equal(c.data[i + 3], 0, 'Aura must not cover Noa');
    }
    assert(visible.size >= 6, `${kind} needs at least six visible colors per frame`);
    const signature = pixels.join(',');
    assert(!signatures.has(signature), `${kind} duplicate frame`); signatures.add(signature);
  }
}
export function buildSecretShopArt({ check = false } = {}) {
  const assets = [
    ['sprites/secret-shop-door-v1.png', atlas(192, 80, [0, 1, 2].map(door), 64), 64, 80, 'door'],
    ['sprites/secret-shop-kittens-v1.png', atlas(384, 336, [0, 1, 2].map(kitten), 128), 128, 112, 'kitten'],
    ['sprites/secret-star-aura-v1.png', atlas(384, 128, [0, 1, 2].map(aura), 128), 128, 128, 'aura'],
    ['worlds/secret-shop-room-v1.png', room(), 960, 540, 'room'],
  ];
  const rendered = assets.map(([path, c, fw, fh, kind]) => {
    validateArt(c, fw, fh, kind);
    const bytes = png(c); validatePng(bytes, c);
    return { path, c, bytes };
  });
  const total = rendered.reduce((sum, { bytes }) => sum + bytes.length, 0);
  assert(total < 150 * 1024, 'Combined PNG budget exceeded');
  const root = fileURLToPath(new URL('../public/assets/', import.meta.url));
  for (const { path, c, bytes } of rendered) {
    const target = resolve(root, path);
    if (check) {
      const actual = readFileSync(target); validatePng(actual, c);
      assert(actual.equals(bytes), `${path} differs; run node scripts/build-secret-shop-art.mjs`);
    } else writeFileSync(target, bytes);
    console.log(`${check ? 'Verified' : 'Wrote'} ${path}: ${c.w}x${c.h} RGBA, ${bytes.length} bytes`);
  }
  console.log(`Total ${total} bytes; door baseline y=79; aura anchor (64,64), clear center x=36..91 y=24..103.`);
  return rendered.map(({ path, c, bytes }) => ({ path, width: c.w, height: c.h, bytes: bytes.length }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert(process.argv.slice(2).every(arg => arg === '--check'), 'Usage: node scripts/build-secret-shop-art.mjs [--check]');
  buildSecretShopArt({ check: process.argv.includes('--check') });
}
