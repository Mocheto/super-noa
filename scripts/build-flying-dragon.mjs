// Original Super Noa art: the volcano baby dragon, with new articulated flight wings.
// Only the baby in the atlas's top-left corner is sampled; the boss row is never sampled.
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync, inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const sourcePath = fileURLToPath(new URL('../public/assets/atlases/volcano-characters-v1.png', import.meta.url));
const outputPath = fileURLToPath(new URL('../public/assets/sprites/enemy-flying-dragon-v1.png', import.meta.url));
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const frameWidth = 128;
const frameHeight = 112;
const samples = 3;
const width = frameWidth * 4;
const height = frameHeight;

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}

function decodeRgbaPng(bytes) {
  if (!bytes.subarray(0, 8).equals(signature)) throw new Error('Dragon source is not a PNG.');
  let w, h;
  const compressed = [];
  for (let at = 8; at < bytes.length;) {
    const length = bytes.readUInt32BE(at);
    const type = bytes.toString('ascii', at + 4, at + 8);
    const data = bytes.subarray(at + 8, at + 8 + length);
    if (at + length + 12 > bytes.length) throw new Error('Truncated dragon source PNG.');
    if (crc32(bytes.subarray(at + 4, at + 8 + length)) !== bytes.readUInt32BE(at + 8 + length))
      throw new Error(`Invalid source PNG checksum: ${type}.`);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6 || data[10] || data[11] || data[12])
        throw new Error('Dragon source must be a non-interlaced, 8-bit RGBA PNG.');
    } else if (type === 'IDAT') compressed.push(data);
    at += length + 12;
    if (type === 'IEND') break;
  }
  if (w !== 1983 || h !== 793) throw new Error('Unexpected volcano character atlas dimensions.');
  const packed = inflateSync(Buffer.concat(compressed));
  const stride = w * 4;
  if (packed.length !== (stride + 1) * h) throw new Error('Invalid dragon source scanlines.');
  const pixels = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    const filter = packed[y * (stride + 1)];
    if (filter > 4) throw new Error(`Unsupported PNG filter ${filter}.`);
    for (let x = 0; x < stride; x++) {
      const left = x >= 4 ? pixels[y * stride + x - 4] : 0;
      const up = y ? pixels[(y - 1) * stride + x] : 0;
      const corner = y && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
      let prediction = 0;
      if (filter === 1) prediction = left;
      if (filter === 2) prediction = up;
      if (filter === 3) prediction = Math.floor((left + up) / 2);
      if (filter === 4) {
        const p = left + up - corner;
        const a = Math.abs(p - left), b = Math.abs(p - up), c = Math.abs(p - corner);
        prediction = a <= b && a <= c ? left : b <= c ? up : corner;
      }
      pixels[y * stride + x] = (packed[y * (stride + 1) + x + 1] + prediction) & 255;
    }
  }
  return { w, pixels };
}

function encodePng(pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4);
  header[8] = 8; header[9] = 6;
  const rows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++)
    pixels.copy(rows, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  return Buffer.concat([signature, chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const palette = {
  ink: [78, 32, 25], bone: [192, 66, 27], light: [255, 187, 65],
  vein: [215, 88, 29], glow: [255, 225, 126],
};
function inside(x, y, polygon) {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [ax, ay] = polygon[i], [bx, by] = polygon[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) hit = !hit;
  }
  return hit;
}

class Canvas {
  constructor() {
    this.w = frameWidth * samples;
    this.h = frameHeight * samples;
    this.data = Buffer.alloc(this.w * this.h * 4);
  }
  blend(x, y, color, opacity = 1) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    const alpha = opacity * (color[3] === undefined ? 1 : color[3] / 255);
    const previous = this.data[i + 3] / 255;
    const combined = alpha + previous * (1 - alpha);
    if (!combined) return;
    for (let c = 0; c < 3; c++)
      this.data[i + c] = Math.round((color[c] * alpha + this.data[i + c] * previous * (1 - alpha)) / combined);
    this.data[i + 3] = Math.round(combined * 255);
  }
  polygon(points, color) {
    const minX = Math.max(0, Math.floor(Math.min(...points.map(p => p[0])) * samples));
    const maxX = Math.min(this.w - 1, Math.ceil(Math.max(...points.map(p => p[0])) * samples));
    const minY = Math.max(0, Math.floor(Math.min(...points.map(p => p[1])) * samples));
    const maxY = Math.min(this.h - 1, Math.ceil(Math.max(...points.map(p => p[1])) * samples));
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const px = (x + 0.5) / samples, py = (y + 0.5) / samples;
      if (inside(px, py, points)) this.blend(x, y, typeof color === 'function' ? color(px, py) : color);
    }
  }
  line(points, color, thickness = 1) {
    for (let n = 1; n < points.length; n++) {
      const [ax, ay] = points[n - 1], [bx, by] = points[n];
      const minX = Math.max(0, Math.floor((Math.min(ax, bx) - thickness) * samples));
      const maxX = Math.min(this.w - 1, Math.ceil((Math.max(ax, bx) + thickness) * samples));
      const minY = Math.max(0, Math.floor((Math.min(ay, by) - thickness) * samples));
      const maxY = Math.min(this.h - 1, Math.ceil((Math.max(ay, by) + thickness) * samples));
      const dx = bx - ax, dy = by - ay;
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const px = (x + 0.5) / samples, py = (y + 0.5) / samples;
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
        if ((px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2 <= (thickness / 2) ** 2)
          this.blend(x, y, color);
      }
    }
  }
  outline(points, color = palette.ink, thickness = 1.5) {
    this.line([...points, points[0]], color, thickness);
  }
}

function curve(start, control, end, count = 12) {
  return Array.from({ length: count }, (_, n) => {
    const t = (n + 1) / count, s = 1 - t;
    return [s * s * start[0] + 2 * s * t * control[0] + t * t * end[0],
      s * s * start[1] + 2 * s * t * control[1] + t * t * end[1]];
  });
}

// Root stays on the shoulder. Fingers and scalloped trailing edges sweep down
// together, not a stretched/translated copy of the grounded atlas wing.
const poses = [
  { elbow: [49, 19], tip: [14, 10], fingers: [[23, 34], [43, 48]], end: [65, 68] },
  { elbow: [44, 37], tip: [8, 35], fingers: [[20, 61], [43, 72]], end: [66, 73] },
  { elbow: [45, 65], tip: [15, 72], fingers: [[30, 92], [51, 103]], end: [70, 82] },
  { elbow: [48, 39], tip: [13, 32], fingers: [[24, 58], [46, 71]], end: [67, 73] },
];

function wing(canvas, pose, far = false) {
  const root = [76, 63];
  const transform = ([x, y]) => far ? [82 + (76 - x) * 0.53, 61 + (y - 63) * 0.88] : [x, y];
  const { elbow, tip, fingers: [first, second], end } = pose;
  const contour = [root, ...curve(root, [64, elbow[1] - 5], elbow),
    ...curve(elbow, [tip[0] + 12, tip[1] - 6], tip),
    ...curve(tip, [first[0] + 9, tip[1] + 7], first),
    ...curve(first, [second[0] + 1, first[1] - 6], second),
    ...curve(second, [end[0] - 2, second[1] - 12], end),
    ...curve(end, [78, 75], root)].map(transform);
  canvas.polygon(contour, (x, y) => {
    const [rx, ry] = transform(root);
    const t = Math.min(1, Math.hypot(x - rx, y - ry) / (far ? 49 : 69));
    const shade = far ? 0.79 : 1;
    const grain = Math.sin(Math.floor(x * 1.7) * 127.1 + Math.floor(y * 1.7) * 311.7) * 2;
    const warmth = Math.sin(x * 0.19 + y * 0.13) * 3;
    return [(246 + t * 9 + grain) * shade,
      (113 + t * 90 + grain + warmth) * shade, (32 + t * 60 + grain) * shade]
      .map(value => Math.max(0, Math.min(255, value)));
  });
  canvas.outline(contour, palette.ink, far ? 1.5 : 1.8);
  const leading = [root, ...curve(root, [64, elbow[1] - 5], elbow),
    ...curve(elbow, [tip[0] + 12, tip[1] - 6], tip)].map(transform);
  canvas.line(leading, palette.ink, far ? 3 : 4);
  canvas.line(leading, palette.bone, far ? 1.6 : 2.7);
  canvas.line(leading.map(([x, y]) => [x, y - 0.5]), palette.light, far ? 0.55 : 0.9);
  for (const finger of [first, second, end]) {
    const rib = [elbow, ...curve(elbow, [(elbow[0] + finger[0]) / 2 + 8,
      (elbow[1] + finger[1]) / 2], finger)].map(transform);
    canvas.line(rib, palette.vein, far ? 1.4 : 2.1);
    canvas.line(rib.map(([x, y]) => [x - 0.6, y]), palette.light, far ? 0.4 : 0.65);
  }
  if (!far) {
    const claw = [[elbow[0] - 2, elbow[1]], [elbow[0] - 3, elbow[1] - 5],
      [elbow[0] + 1, elbow[1] - 3], [elbow[0] + 3, elbow[1] + 1]];
    canvas.polygon(claw, palette.glow);
    canvas.outline(claw, palette.ink, 0.8);
  }
}

const source = decodeRgbaPng(readFileSync(sourcePath));
const scale = 0.28, dx = 23, dy = 7;
function sourcePart(canvas, polygon, pivot = [0, 0], angle = 0, tint = 1) {
  if (polygon.some(([x, y]) => x < 44 || x > 342 || y < 65 || y >= 330))
    throw new Error('Dragon sampling must stay inside the baby, strictly above the boss row.');
  const cos = Math.cos(angle), sin = Math.sin(angle);
  for (let y = 0; y < canvas.h; y++) for (let x = 0; x < canvas.w; x++) {
    const px = ((x + 0.5) / samples - dx) / scale - pivot[0];
    const py = ((y + 0.5) / samples - dy) / scale - pivot[1];
    const sx = Math.floor(px * cos + py * sin + pivot[0]);
    const sy = Math.floor(-px * sin + py * cos + pivot[1]);
    if (sx < 44 || sx > 341 || sy < 65 || sy >= 330 || !inside(sx + 0.5, sy + 0.5, polygon)) continue;
    const i = (sy * source.w + sx) * 4;
    if (!source.pixels[i + 3]) continue;
    canvas.blend(x, y, [source.pixels[i] * tint, source.pixels[i + 1] * tint,
      source.pixels[i + 2] * tint, source.pixels[i + 3]]);
  }
}

const body = [[147, 66], [341, 66], [341, 244], [313, 244], [313, 300],
  [256, 300], [249, 270], [227, 269], [191, 278], [154, 272], [127, 275],
  [99, 269], [78, 255], [59, 237], [44, 214], [44, 173], [68, 166],
  [83, 207], [118, 228], [145, 227], [165, 216], [183, 208], [190, 188],
  [190, 156], [183, 135], [165, 124]];
const hindLeg = [[153, 232], [187, 239], [184, 267], [158, 289],
  [160, 308], [146, 323], [100, 323], [99, 293], [116, 267]];
const nearLeg = [[203, 235], [234, 232], [236, 267], [255, 299],
  [247, 324], [197, 324], [183, 293], [181, 261]];
const pixels = Buffer.alloc(width * height * 4);
for (let frame = 0; frame < poses.length; frame++) {
  const canvas = new Canvas();
  wing(canvas, poses[frame], true);
  // Rotate the detailed legs back from their hips into a tucked flight pose.
  sourcePart(canvas, hindLeg, [161, 255], Math.PI * 0.31, 0.87);
  sourcePart(canvas, nearLeg, [211, 252], Math.PI * 0.43);
  sourcePart(canvas, body);
  wing(canvas, poses[frame]);
  for (let y = 0; y < frameHeight; y++) for (let x = 0; x < frameWidth; x++) {
    let alpha = 0;
    const rgb = [0, 0, 0];
    for (let sy = 0; sy < samples; sy++) for (let sx = 0; sx < samples; sx++) {
      const i = ((y * samples + sy) * canvas.w + x * samples + sx) * 4;
      const a = canvas.data[i + 3];
      alpha += a;
      for (let c = 0; c < 3; c++) rgb[c] += canvas.data[i + c] * a;
    }
    const out = (y * width + frame * frameWidth + x) * 4;
    if (alpha) {
      for (let c = 0; c < 3; c++) pixels[out + c] = Math.round(rgb[c] / alpha);
      pixels[out + 3] = Math.round(alpha / (samples * samples));
    }
  }
}

for (let frame = 0; frame < 4; frame++) {
  for (let y = 0; y < frameHeight; y++) for (let x = 0; x < frameWidth; x++) {
    if (x > 1 && x < frameWidth - 2 && y > 1 && y < frameHeight - 2) continue;
    if (pixels[(y * width + frame * frameWidth + x) * 4 + 3])
      throw new Error(`Clipped dragon art at frame ${frame}, (${x}, ${y}).`);
  }
}
const expected = encodePng(pixels);
if (expected.length >= 40 * 1024) throw new Error('Flying dragon exceeds its 40 KiB asset budget.');
const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== '--check'))
  throw new Error('Usage: node scripts/build-flying-dragon.mjs [--check]');
if (args[0] === '--check') {
  // Missing files intentionally throw ENOENT rather than passing or regenerating.
  if (!readFileSync(outputPath).equals(expected))
    throw new Error('Flying dragon PNG is stale. Run node scripts/build-flying-dragon.mjs');
  console.log(`Flying dragon is current: ${width}×${height} RGBA, ${expected.length} bytes.`);
} else {
  writeFileSync(outputPath, expected);
  console.log(`Generated ${outputPath}: ${width}×${height} RGBA, ${expected.length} bytes.`);
}
