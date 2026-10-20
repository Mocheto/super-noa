// Original clockwork canine guardian, drawn entirely from authored geometry.
// No source images, commercial character references, dependencies, or import-time writes.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const palette = {
  ink: '#352840', shadow: '#58445e', iron: '#81738c', stone: '#a99bb7',
  copper: '#cc8250', copperDark: '#96543c', copperLight: '#f5be7c',
  teal: '#398e90', tealDark: '#285e70', mint: '#85d4c2',
  cream: '#fff0cf', creamDark: '#d8bf99', white: '#fffaf0',
  amber: '#ffb344', amberLight: '#ffe69c', mouth: '#693d58', tongue: '#dc8b91',
};
const colorCache = new Map();
function rgba(color) {
  const hex = palette[color] ?? color;
  if (!colorCache.has(hex))
    colorCache.set(hex, [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16)).concat(255));
  return colorCache.get(hex);
}

class Canvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.pixels = Buffer.alloc(width * height * 4);
  }
  pixel(x, y, color) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    this.pixels.set(rgba(color), (y * this.width + x) * 4);
  }
  rect(x, y, width, height, color) {
    for (let j = y; j < y + height; j++)
      for (let i = x; i < x + width; i++) this.pixel(i, j, color);
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
        const x = ax + (bx - ax) * k / steps;
        const y = ay + (by - ay) * k / steps;
        if (width === 1) this.pixel(x, y, color);
        else this.oval(Math.round(x), Math.round(y), width / 2, width / 2, color);
      }
    }
  }
  poly(points, color) {
    const ys = points.map(point => point[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++) {
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
  shape(points, color, outline = 'ink', width = 2) {
    this.poly(points, color);
    this.line([...points, points[0]], outline, width);
  }
  ring(x, y, rx, ry) {
    // Paint only the annulus: the chain's hole stays genuinely transparent.
    for (let j = Math.ceil(y - ry); j <= y + ry; j++)
      for (let i = Math.ceil(x - rx); i <= x + rx; i++) {
        const outer = ((i - x) / rx) ** 2 + ((j - y) / ry) ** 2;
        const inner = ((i - x) / (rx - 4)) ** 2 + ((j - y) / (ry - 4)) ** 2;
        if (outer <= 1 && inner >= 1) this.pixel(i, j, 'ink');
        const middle = ((i - x) / (rx - 1)) ** 2 + ((j - y) / (ry - 1)) ** 2;
        const hole = ((i - x) / (rx - 3)) ** 2 + ((j - y) / (ry - 3)) ** 2;
        if (middle <= 1 && hole >= 1)
          this.pixel(i, j, j < y ? 'copperLight' : 'copper');
      }
  }
  paste(other, dx) {
    for (let y = 0; y < other.height; y++)
      other.pixels.copy(this.pixels, (y * this.width + dx) * 4,
        y * other.width * 4, (y + 1) * other.width * 4);
  }
}

function rivet(c, x, y, far = false) {
  c.oval(x, y, 2, 2, 'ink');
  c.pixel(x, y, far ? 'copper' : 'cream');
}

function leg(c, hip, knee, foot, far = false) {
  const [hx, hy] = hip, [kx, ky] = knee, [fx, fy] = foot;
  c.line([[hx, hy], [kx, ky], [fx - 2, fy - 6]], 'ink', 10);
  c.line([[hx, hy], [kx, ky], [fx - 2, fy - 6]], far ? 'copperDark' : 'copper', 6);
  c.line([[hx - 1, hy], [kx - 1, ky]], far ? 'copper' : 'copperLight', 2);
  c.oval(kx, ky, 5, 5, 'ink');
  c.oval(kx, ky, 3, 3, far ? 'tealDark' : 'teal');
  c.pixel(kx - 1, ky - 1, far ? 'teal' : 'mint');
  c.shape([[fx - 8, fy - 7], [fx - 2, fy - 9], [fx + 6, fy - 6],
    [fx + 8, fy - 2], [fx + 7, fy], [fx - 8, fy]], far ? 'creamDark' : 'cream');
  c.line([[fx - 6, fy - 2], [fx + 6, fy - 2]], far ? 'copperDark' : 'copper');
  for (const x of [fx + 1, fx + 4]) c.line([[x, fy - 5], [x, fy - 3]], 'copperDark');
}

// The torso origin (56, 71) and collar-ring center (70, 46) never translate.
// Paw centers are authored individually, not a floating/scaled copy of one pose.
export const houndPoses = [
  { paws: [[46, 104], [91, 104], [28, 108], [76, 108]],
    knees: [[43, 91], [87, 91], [24, 93], [73, 94]], head: 0, mouth: 0 },
  { paws: [[46, 104], [94, 104], [24, 108], [77, 108]],
    knees: [[46, 92], [88, 93], [30, 94], [71, 94]], head: -2, mouth: 0 },
  { paws: [[36, 102], [108, 101], [17, 108], [89, 108]],
    knees: [[40, 88], [97, 89], [26, 93], [80, 95]], head: 2, mouth: 1 },
  { paws: [[47, 104], [100, 104], [26, 108], [79, 108]],
    knees: [[43, 91], [92, 92], [27, 94], [76, 95]], head: 1, mouth: 2 },
];

function hound(frame) {
  const c = new Canvas(128, 112);
  const pose = houndPoses[frame], dy = pose.head;
  const hips = [[42, 77], [77, 75], [36, 77], [70, 76]];
  // A segmented, upturned tail, long torso, four legs, and a long muzzle
  // deliberately avoid the silhouette of a spherical chained creature.
  const tail = frame === 1
    ? [[30, 64], [18, 58], [12, 44], [15, 35]]
    : frame === 2
      ? [[30, 64], [17, 59], [7, 48], [8, 40]]
      : [[30, 64], [17, 59], [11, 48], [14, 42]];
  c.line(tail, 'ink', 9);
  c.line(tail, 'copper', 5);
  c.line(tail.map(([x, y]) => [x - 1, y - 1]), 'copperLight', 1);
  c.oval(tail[2][0], tail[2][1], 4, 4, 'ink');
  c.oval(tail[2][0], tail[2][1], 2, 2, 'teal');
  const [tx, ty] = tail[3];
  c.shape([[tx - 5, ty + 2], [tx - 4, ty - 6], [tx + 1, ty - 10],
    [tx + 5, ty - 5], [tx + 4, ty + 2]], 'teal');
  c.line([[tx - 2, ty - 3], [tx, ty - 6]], 'mint', 2);
  for (let n = 0; n < 2; n++) leg(c, hips[n], pose.knees[n], pose.paws[n], true);

  c.shape([[23, 61], [34, 53], [59, 53], [75, 56], [83, 67],
    [78, 81], [62, 86], [35, 84], [23, 77]], 'copper');
  c.poly([[26, 70], [40, 75], [63, 76], [79, 70], [76, 80],
    [61, 84], [36, 82], [25, 76]], 'copperDark');
  c.shape([[29, 60], [39, 55], [58, 55], [64, 59], [61, 70],
    [43, 73], [30, 69]], 'teal');
  c.line([[33, 61], [41, 58], [57, 58]], 'mint', 2);
  c.line([[42, 58], [44, 70]], 'tealDark', 2);
  c.line([[54, 57], [56, 69]], 'tealDark', 2);
  c.shape([[46, 75], [62, 73], [70, 77], [62, 82], [47, 82]], 'cream', 'copperDark', 1);
  for (const [x, y] of [[32, 64], [59, 62], [53, 78]]) rivet(c, x, y);

  leg(c, hips[2], pose.knees[2], pose.paws[2]);
  // A small gear-shaped hip cap and shield shoulder read as clockwork armor.
  c.shape([[29, 68], [34, 65], [39, 68], [42, 73], [40, 79],
    [35, 83], [29, 80], [26, 74]], 'copperLight');
  c.oval(34, 74, 5, 5, 'copperDark');
  c.oval(34, 74, 3, 3, 'teal');
  c.line([[33, 72], [35, 74], [33, 76]], 'mint');
  leg(c, hips[3], pose.knees[3], pose.paws[3]);
  c.shape([[64, 62], [73, 59], [81, 64], [80, 77], [73, 83],
    [65, 78], [62, 70]], 'teal');
  c.line([[66, 65], [72, 63], [77, 66]], 'mint', 2);
  rivet(c, 72, 74);

  c.shape([[68, 61], [73, 48 + dy], [83, 42 + dy], [92, 48 + dy],
    [88, 67 + dy], [82, 76], [75, 73]], 'cream');
  c.poly([[71, 60], [76, 51 + dy], [80, 53 + dy], [77, 67], [81, 72],
    [77, 74], [71, 70]], 'creamDark');
  c.shape([[68, 55], [73, 52], [86, 61], [84, 67], [78, 69], [68, 61]],
    frame === 1 ? 'amber' : 'teal');
  c.line([[72, 56], [80, 62], [83, 62]], frame === 1 ? 'amberLight' : 'mint', 2);
  rivet(c, 73, 60);

  // Two individually posed, tall ears, with inset copper panels.
  const ears = frame === 1
    ? [[[75, 45], [73, 16], [80, 21], [85, 44]],
      [[86, 43], [88, 12], [95, 17], [97, 46]]]
    : frame === 2
      ? [[[77, 44], [66, 21], [74, 23], [87, 43]],
        [[87, 44], [85, 19], [92, 23], [97, 47]]]
      : [[[76, 44], [70, 20], [77, 23], [85, 44]],
        [[86, 43], [87, 16], [94, 21], [96, 46]]];
  for (const points of ears) {
    const p = points.map(([x, y]) => [x, y + dy]);
    c.shape(p, 'teal');
    const [a, b, d] = [p[0], p[1], p[2]];
    c.poly([[a[0] + 2, a[1] - 3], [b[0] + 3, b[1] + 7],
      [d[0] - 1, d[1] + 5], [a[0] + 5, a[1] - 2]], 'copperLight');
  }
  const h = points => points.map(([x, y]) => [x, y + dy]);
  c.shape(h([[76, 40], [85, 35], [95, 39], [101, 50], [99, 61],
    [89, 69], [79, 65], [73, 54]]), 'teal');
  c.poly(h([[78, 42], [86, 38], [93, 41], [95, 45], [82, 46],
    [76, 51]]), 'mint');
  c.shape(h([[83, 56], [96, 51], [109, 55], [118, 59],
    [118, 66], [108, 71], [94, 71], [84, 66]]), 'cream');
  c.poly(h([[88, 64], [103, 66], [116, 63], [116, 66], [107, 69],
    [95, 69], [87, 66]]), 'creamDark');
  if (pose.mouth) {
    c.shape(h([[91, 65], [105, 67], [117, 64], [115, 74],
      [105, pose.mouth === 1 ? 80 : 76], [94, 75], [89, 70]]), 'mouth');
    c.shape(h([[91, 74], [102, pose.mouth === 1 ? 79 : 75],
      [114, 73], [111, 80], [101, 83], [93, 79]]), 'cream', 'ink', 1);
    c.poly(h([[100, 75], [105, 74], [108, 76], [105, 79], [100, 78]]), 'tongue');
    // Two blunt, square puppy teeth, never a triangular tooth rim.
    c.rect(99, 67 + dy, 3, 3, 'white');
    c.rect(111, 67 + dy, 3, 3, 'white');
  } else {
    c.line(h([[94, 65], [102, 67], [112, 66]]), 'copperDark');
    c.pixel(113, 65 + dy, 'ink');
  }
  c.shape(h([[111, 55], [119, 58], [120, 62], [116, 65], [111, 62]]), 'ink', 'ink', 1);
  c.line(h([[113, 57], [117, 59]]), 'iron', 2);
  // One large visible eye and a narrow far-eye glint retain the lateral view.
  c.shape(h([[84, 47], [89, 45], [94, 48], [93, 55], [87, 57],
    [83, 53]]), 'white', 'ink', 1);
  c.oval(90, 51 + dy, 3, 4, 'copperDark');
  c.oval(91, 51 + dy, 2, 3, 'ink');
  c.pixel(90, 49 + dy, 'white');
  c.pixel(92, 53 + dy, 'amberLight');
  c.line(h(frame === 0 ? [[82, 44], [87, 42], [92, 44]]
    : [[82, 43], [87, 43], [93, 46]]), 'copperDark', 2);
  c.line(h([[98, 49], [100, 51]]), 'cream', 2);
  c.line(h([[78, 57], [78, 61], [81, 63]]), 'copperLight', 2);
  rivet(c, 79, 54 + dy);

  // Back-mounted ring is unobscured and fixed for the runtime chain endpoint.
  c.shape([[65, 53], [65, 49], [74, 49], [76, 55], [71, 58]], 'copper');
  c.ring(70, 46, 7, 8);
  if (frame === 1) {
    c.line([[58, 35], [55, 31]], 'amber', 2);
    c.line([[65, 31], [65, 27]], 'amberLight', 2);
    c.line([[102, 30], [106, 27]], 'amber', 2);
  }
  return c;
}

function post() {
  const c = new Canvas(64, 80);
  c.shape([[11, 67], [18, 61], [47, 61], [54, 68], [54, 77], [10, 77]], 'shadow');
  c.shape([[15, 66], [46, 66], [50, 71], [50, 76], [14, 76]], 'stone', 'ink', 1);
  c.line([[17, 69], [44, 69], [47, 72]], 'creamDark');
  c.line([[26, 70], [25, 76]], 'iron');
  c.line([[39, 69], [40, 76]], 'iron');
  c.shape([[23, 29], [40, 29], [43, 64], [38, 68], [25, 67], [21, 63]], 'tealDark');
  c.poly([[25, 31], [30, 32], [29, 62], [25, 64]], 'teal');
  c.line([[27, 33], [26, 60]], 'mint', 2);
  c.shape([[20, 56], [43, 56], [44, 62], [21, 62]], 'copper');
  c.line([[23, 58], [40, 58]], 'copperLight');
  rivet(c, 25, 60); rivet(c, 39, 60);
  c.shape([[19, 24], [24, 19], [40, 19], [45, 24], [43, 31], [21, 31]], 'copper');
  c.line([[23, 24], [40, 24]], 'copperLight', 2);
  c.shape([[32, 3], [39, 12], [37, 20], [27, 20], [25, 12]], 'teal');
  c.poly([[32, 6], [32, 17], [28, 13]], 'mint');
  c.line([[31, 20], [33, 20]], 'cream', 2);
  c.oval(32, 38, 11, 12, 'ink');
  c.oval(32, 38, 9, 10, 'copper');
  c.oval(32, 38, 5, 6, 'ink');
  c.line([[25, 35], [27, 31], [33, 30], [37, 32]], 'copperLight', 2);
  c.line([[29, 46], [35, 46], [39, 42]], 'copperDark', 2);
  c.pixel(26, 34, 'cream');
  return c;
}

export function buildCastleHoundSprites() {
  const sheet = new Canvas(512, 112);
  const frames = houndPoses.map((_, frame) => hound(frame));
  frames.forEach((frame, n) => sheet.paste(frame, n * 128));
  const link = new Canvas(32, 20);
  link.ring(15.5, 9.5, 14.5, 8.5);
  link.line([[6, 5], [10, 3], [20, 3]], 'cream');
  link.line([[12, 16], [22, 15], [26, 12]], 'copperDark');
  link.line([[25, 5], [27, 7], [28, 9], [27, 12]], '#e3a46b');
  return { 'castle-hound-v1.png': sheet, 'castle-chain-link-v1.png': link,
    'castle-chain-post-v1.png': post() };
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const tag = Buffer.from(type), size = Buffer.alloc(4), checksum = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  checksum.writeUInt32BE(crc32(Buffer.concat([tag, data])));
  return Buffer.concat([size, tag, data, checksum]);
}
function png(canvas) {
  const { width, height, pixels } = canvas;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4);
  header[8] = 8; header[9] = 6;
  const stride = width * 4, rows = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++)
    pixels.copy(rows, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header), chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))]);
}

function validate(sprites) {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  for (const [name, c] of Object.entries(sprites)) {
    const alpha = (x, y) => c.pixels[(y * c.width + x) * 4 + 3];
    for (let x = 0; x < c.width; x++)
      assert(!alpha(x, 0) && !alpha(x, c.height - 1), `${name}: clipped vertical border`);
    for (let y = 0; y < c.height; y++)
      assert(!alpha(0, y) && !alpha(c.width - 1, y), `${name}: clipped horizontal border`);
  }
  const sheet = sprites['castle-hound-v1.png'];
  const frames = [];
  for (let frame = 0; frame < 4; frame++) {
    const pixels = Buffer.alloc(128 * 112 * 4);
    let bottom = 0;
    for (let y = 0; y < 112; y++) {
      const at = (y * 512 + frame * 128) * 4;
      sheet.pixels.copy(pixels, y * 128 * 4, at, at + 128 * 4);
      assert(!pixels[(y * 128) * 4 + 3] && !pixels[(y * 128 + 127) * 4 + 3],
        `Hound frame ${frame}: clipped cell border`);
      for (let x = 0; x < 128; x++) if (pixels[(y * 128 + x) * 4 + 3]) bottom = y;
    }
    assert(bottom === 109, `Hound frame ${frame}: paws must end at y109`);
    for (const [x, y] of houndPoses[frame].paws)
      assert(pixels[((y - 2) * 128 + x) * 4 + 3], `Hound frame ${frame}: missing paw`);
    assert(frames.every(previous => !previous.equals(pixels)), `Duplicate hound frame ${frame}`);
    frames.push(pixels);
  }
  const link = sprites['castle-chain-link-v1.png'];
  assert(!link.pixels[(10 * 32 + 16) * 4 + 3], 'Chain-link hole must be transparent');
  const linkColors = new Set();
  for (let i = 0; i < link.pixels.length; i += 4)
    if (link.pixels[i + 3]) linkColors.add(link.pixels.readUInt32BE(i));
  assert(linkColors.size >= 6, 'Chain link needs at least six visible shading colors');
}

function main() {
  if (process.argv.slice(2).some(arg => arg !== '--check'))
    throw new Error('Usage: node scripts/build-castle-hound.mjs [--check]');
  const sprites = buildCastleHoundSprites();
  validate(sprites);
  const outputs = Object.entries(sprites).map(([name, canvas]) => [name, png(canvas)]);
  const bytes = outputs.reduce((sum, [, data]) => sum + data.length, 0);
  if (bytes >= 60 * 1024) throw new Error('Castle sprites exceed the 60 KiB budget');
  for (const [name, data] of outputs) {
    const path = fileURLToPath(new URL(`../public/assets/sprites/${name}`, import.meta.url));
    if (process.argv.includes('--check')) {
      if (!readFileSync(path).equals(data)) throw new Error(`${name} is stale; regenerate castle sprites`);
    } else writeFileSync(path, data);
    const c = sprites[name];
    console.log(`${process.argv.includes('--check') ? 'OK' : 'Wrote'} ${name}: ${c.width}x${c.height}, ${data.length} bytes`);
  }
  console.log(`Total: ${bytes} bytes; four distinct grounded frames, transparent borders and link hole verified.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
