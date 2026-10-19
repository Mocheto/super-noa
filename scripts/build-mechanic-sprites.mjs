// Original Super Noa pixel art. No downloaded art, fonts, or runtime dependencies.
// Coordinates are authored on a 2x pixel grid; frame origins are never inset.
import { deflateSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public/assets/sprites/', import.meta.url));
const ink = '#352343';
const cream = '#fff1d5';
const white = '#fff9ff';
const colors = new Map();
function rgba(hex) {
  if (!colors.has(hex)) {
    const value = hex.slice(1);
    colors.set(hex, [0, 2, 4].map(i => parseInt(value.slice(i, i + 2), 16))
      .concat(value.length === 8 ? parseInt(value.slice(6, 8), 16) : 255));
  }
  return colors.get(hex);
}
class Canvas {
  constructor(w, h) {
    this.w = w; this.h = h; this.data = Buffer.alloc(w * h * 4);
  }
  pixel(x, y, color) {
    x = Math.round(x); y = Math.round(y);
    if (this.wrapX) x = ((x % this.w) + this.w) % this.w;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data.set(rgba(color), (y * this.w + x) * 4);
  }
  rect(x, y, w, h, c) {
    for (let j = Math.round(y); j < y + h; j++)
      for (let i = Math.round(x); i < x + w; i++) this.pixel(i, j, c);
  }
  ellipse(x, y, rx, ry, c) {
    for (let j = Math.floor(y - ry); j <= y + ry; j++)
      for (let i = Math.floor(x - rx); i <= x + rx; i++)
        if (((i - x) / rx) ** 2 + ((j - y) / ry) ** 2 <= 1) this.pixel(i, j, c);
  }
  line(points, c, width = 1) {
    for (let n = 1; n < points.length; n++) {
      const [ax, ay] = points[n - 1], [bx, by] = points[n];
      const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 2 || 1;
      for (let k = 0; k <= steps; k++) {
        const x = ax + (bx - ax) * k / steps, y = ay + (by - ay) * k / steps;
        if (width === 1) this.pixel(x, y, c);
        else this.ellipse(x, y, width / 2, width / 2, c);
      }
    }
  }
  poly(points, c) {
    const min = Math.floor(Math.min(...points.map(p => p[1])));
    const max = Math.ceil(Math.max(...points.map(p => p[1])));
    for (let y = min; y <= max; y++) {
      const xs = [];
      for (let j = 0; j < points.length; j++) {
        const a = points[j], b = points[(j + 1) % points.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y))
          xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      }
      xs.sort((a, b) => a - b);
      for (let j = 0; j < xs.length; j += 2)
        for (let x = Math.ceil(xs[j]); x <= xs[j + 1]; x++) this.pixel(x, y, c);
    }
  }
  shape(points, fill, outline = ink, width = 2) {
    this.poly(points, fill);
    this.line([...points, points[0]], outline, width);
  }
  oval(x, y, rx, ry, fill, outline = ink, border = 1) {
    this.ellipse(x, y, rx, ry, outline);
    this.ellipse(x, y - 0.2, rx - border, ry - border, fill);
  }
  paste(other, dx, dy, scale = 1) {
    for (let y = 0; y < other.h; y++) for (let x = 0; x < other.w; x++) {
      const i = (y * other.w + x) * 4;
      if (!other.data[i + 3]) continue;
      for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) {
        const dest = ((dy + y * scale + sy) * this.w + dx + x * scale + sx) * 4;
        other.data.copy(this.data, dest, i, i + 4);
      }
    }
  }
}
function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const tag = Buffer.from(type);
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([tag, data])));
  return Buffer.concat([len, tag, data, crc]);
}
function png(canvas) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(canvas.w, 0); header.writeUInt32BE(canvas.h, 4);
  header[8] = 8; header[9] = 6;
  const rows = Buffer.alloc((canvas.w * 4 + 1) * canvas.h);
  for (let y = 0; y < canvas.h; y++)
    canvas.data.copy(rows, y * (canvas.w * 4 + 1) + 1, y * canvas.w * 4, (y + 1) * canvas.w * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header), chunk('IDAT', deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

function wolf(c, frame) {
  const lift = frame === 2 ? -8 : frame === 1 ? -1 : 0;
  // Palette follows the project's original purple-gray forest wolf.
  const fur = '#8f819f', light = '#b6a9c3', shade = '#655378', deep = '#4b355e';
  c.shape([[7, 36], [6, 30], [9, 24], [13, 21], [20, 19 + (frame === 1 ? -1 : 0)],
    [31, 20], [39, 24], [44, 32], [42, 43], [34, 46], [14, 46], [7, 42]], fur);
  c.poly([[10, 32], [15, 25], [25, 23], [32, 25], [25, 26], [16, 30], [13, 36]], light);
  c.poly([[13, 38], [23, 35], [34, 36], [40, 33], [41, 42], [32, 45], [17, 44]], shade);
  for (const [x, y] of [[15, 27], [21, 25], [27, 28], [11, 33], [31, 32]])
    c.line([[x, y], [x + 2, y + 1], [x + 3, y]], '#c6b8ce');
  c.shape([[34, 34 + lift], [34, 24 + lift], [32, 17 + lift], [34, 12 + lift],
    [40, 19 + lift], [45, 18 + lift], [50, 14 + lift], [52, 25 + lift],
    [55, 28 + lift], [59, 29 + lift], [61, 33 + lift], [58, 38 + lift],
    [50, 40 + lift], [42, 39 + lift], [39, 36 + lift]], fur);
  c.poly([[34, 17 + lift], [35, 14 + lift], [39, 21 + lift], [36, 22 + lift]], '#e691ae');
  c.poly([[47, 20 + lift], [49, 17 + lift], [50, 24 + lift]], '#bd799f');
  c.poly([[36, 25 + lift], [40, 22 + lift], [45, 23 + lift], [43, 25 + lift], [38, 26 + lift]], light);
  c.poly([[40, 33 + lift], [44, 31 + lift], [47, 34 + lift], [53, 33 + lift],
    [59, 33 + lift], [57, 37 + lift], [50, 39 + lift], [44, 37 + lift]], cream);
  c.poly([[39, 35 + lift], [42, 37 + lift], [45, 40 + lift], [43, 42 + lift],
    [40, 40 + lift], [38, 41 + lift]], '#e4cebb');
  if (frame === 2) {
    c.oval(49, 29 + lift, 2, 3, white, deep);
    c.rect(49, 29 + lift, 2, 3, ink);
    c.line([[46, 26 + lift], [51, 26 + lift]], deep);
  } else c.line([[45, 29 + lift], [47, 31 + lift], [50, 31 + lift], [52, 29 + lift]], ink);
  c.line([[45, 26 + lift], [48, 25 + lift]], shade);
  c.oval(59, 31 + lift, 2, 1.5, deep);
  c.pixel(58, 30 + lift, '#b5a1bd');
  c.line([[55, 36 + lift], [57, 35 + lift]], deep);
  c.shape([[36, 42], [43, 40], [51, 41], [54, 44], [52, 46], [39, 46]], cream);
  c.line([[47, 43], [47, 45]], '#bca2b6');
  c.line([[50, 43], [50, 45]], '#bca2b6');
  // Thick curled tail wraps the sleeping haunch rather than becoming a separate blob.
  c.shape([[8, 31], [5, 33], [3, 38], [5, 43], [10, 46], [22, 46], [30, 43],
    [33, 39], [31, 35], [27, 34], [24, 37], [19, 39], [13, 39], [10, 36]], shade);
  c.poly([[4, 37], [6, 34], [8, 33], [10, 38], [15, 40], [22, 39], [19, 43],
    [13, 44], [8, 42]], cream);
  c.line([[11, 43], [17, 44], [23, 42], [27, 39]], '#a48eaa');
}

function leaf(c, x, y, side, color = '#57bc79') {
  c.shape([[x, y], [x + side * 3, y - 6], [x + side * 12, y - 8],
    [x + side * 10, y - 2], [x + side * 4, y + 1]], color, '#285c61', 1);
  c.line([[x, y], [x + side * 9, y - 5]], '#b2e690');
}
function flower(c, f) {
  c.line([[24, 62], [23, 48], [25, 37], [24, 25]], '#285c61', 4);
  c.line([[24, 61], [24, 47], [26, 36]], '#69cf80', 2);
  leaf(c, 24, 50, -1); leaf(c, 25, 42, 1, '#87d58c');
  c.line([[18, 62], [24, 61], [30, 62]], '#285c61', 2);
  const amber = f === 3;
  const edge = amber ? '#95532e' : '#73355f';
  const dark = amber ? '#f49b43' : '#dc639c';
  const mid = amber ? '#ffc66b' : '#f394c1';
  const pale = amber ? '#ffe7a4' : '#ffd0e6';
  if (f === 0) {
    c.shape([[24, 10], [30, 14], [33, 23], [31, 31], [25, 35], [19, 32],
      [15, 25], [17, 17]], dark, edge);
    c.poly([[24, 12], [28, 16], [29, 25], [25, 30], [22, 28], [20, 20]], mid);
    c.line([[23, 16], [22, 21], [23, 25]], pale, 2);
    c.shape([[16, 29], [22, 32], [24, 28], [27, 32], [32, 29], [28, 36], [22, 37]], '#62b973', '#285c61', 1);
  } else {
    const radius = f === 1 ? 11 : 15;
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      const x = 24 + Math.cos(a) * radius, y = 24 + Math.sin(a) * (f === 1 ? 9 : 14);
      c.oval(x, y, f === 1 ? 6 : 8, f === 1 ? 8 : 9, dark, edge);
      c.ellipse(x - 1, y - 2, f === 1 ? 3 : 5, 5, mid);
      c.line([[x - 2, y - 5], [x, y - 6], [x + 2, y - 5]], pale);
      c.line([[x + 3, y + 2], [x + 1, y + 5], [x - 1, y + 6]], amber ? '#e58c42' : '#c95691');
    }
    c.oval(24, 24, 9, 9, '#f5b64e', edge);
    c.ellipse(24, 23, 7, 7, '#ffe494');
    c.line([[20, 19], [23, 18], [26, 19]], cream);
    c.oval(21, 24, 1, 2, ink);
    c.oval(27, 24, 1, 2, ink);
    c.pixel(21, 23, white); c.pixel(27, 23, white);
    c.line([[22, 28], [24, 29], [26, 28]], '#9a5147');
    c.rect(17, 27, 2, 1, '#f39b85'); c.rect(29, 27, 2, 1, '#f39b85');
  }
}
function bridge(c, f) {
  const edge = f ? '#96512f' : '#793758';
  const base = f ? '#edaa49' : '#e17fa9';
  const lit = f ? '#ffe4a0' : '#ffcee3';
  c.rect(0, 0, 32, 3, edge);
  c.rect(0, 1, 32, 2, lit);
  c.line([[0, 8], [8, 9], [16, 7], [25, 9], [31, 8]], '#30655e', 3);
  c.line([[0, 7], [9, 8], [16, 6], [25, 8], [31, 7]], '#7abc76');
  for (const x of [-4, 7, 18, 29]) {
    c.shape([[x - 5, 3], [x + 5, 2], [x + 8, 5], [x + 5, 10], [x, 12], [x - 4, 8]], base, edge, 1);
    c.line([[x - 2, 4], [x + 4, 4], [x + 5, 6]], lit);
    c.line([[x + 1, 6], [x + 1, 9]], f ? '#cf7541' : '#bb568f');
  }
  c.shape([[9, 10], [15, 9], [18, 11], [14, 15], [10, 14]], '#68aa77', '#30655e', 1);
  c.line([[11, 12], [15, 11]], '#b6d992');
}
function arrow(c, x, y, direction, color, edge) {
  let p = [[-3, 8], [-3, 0], [-7, 0], [0, -7], [7, 0], [3, 0], [3, 8]];
  if (direction === 'right') p = p.map(([a, b]) => [-b, a]);
  if (direction === 'down') p = p.map(([a, b]) => [a, -b]);
  c.shape(p.map(([a, b]) => [x + a, y + b]), color, edge, 1);
}
function cloud(c, x, y, width = 1) {
  const edge = '#7979b2', shade = '#c5c4eb';
  c.oval(x, y, 12 * width, 5 * width, shade, edge);
  c.oval(x - 5 * width, y - 3 * width, 6 * width, 5 * width, '#e5e5ff', edge);
  c.oval(x + 2 * width, y - 5 * width, 7 * width, 7 * width, '#ececff', edge);
  c.oval(x + 8 * width, y - 1 * width, 5 * width, 4 * width, '#eeeefe', edge);
  c.ellipse(x - 2 * width, y - 2 * width, 7 * width, 4 * width, white);
  c.line([[x - 9 * width, y + 2 * width], [x - 1 * width, y + 3 * width],
    [x + 7 * width, y + 2 * width]], '#a6b2e0');
}
function updraft(c, f) {
  const edge = '#56709e';
  cloud(c, 15, 42, 0.95);
  const curl = [[9, 34], [5, 30], [5, 24], [8, 20], [12, 19], [14, 21],
    [13, 24], [10, 24]];
  c.line(curl.map(([x, y]) => [x + f, y - f]), edge, 4);
  c.line(curl.map(([x, y]) => [x + f, y - f]), '#b5f3f4', 2);
  c.line([[22, 35], [27, 31], [28, 26], [26, 23]], edge, 3);
  c.line([[22, 34], [26, 30], [27, 26]], white);
  arrow(c, 17, 12 + f, 'up', '#e8ffff', edge);
  c.line([[17, 9 + f], [17, 14 + f]], '#86dadd');
  c.oval(5, 11 - f, 2, 2, '#c0f3ff', edge);
  c.pixel(4, 10 - f, white);
  c.oval(27, 6 + f, 1.5, 1.5, '#e1ffff', edge);
  c.pixel(23, 19, '#70b7d3');
}
function snowflake(c, x, y) {
  c.line([[x - 3, y], [x + 3, y]], '#d9faff');
  c.line([[x, y - 3], [x, y + 3]], '#d9faff');
  c.line([[x - 2, y - 2], [x + 2, y + 2]], '#88c6e7');
  c.line([[x + 2, y - 2], [x - 2, y + 2]], '#88c6e7');
  c.pixel(x, y, white);
}
function gust(c, f) {
  const edge = '#4f6d9c';
  const upper = [[4, 12], [12, 12], [19, 12], [23, 9], [23, 5], [20, 3], [16, 4], [16, 7]];
  c.line(upper.map(([x, y]) => [x, y + f]), edge, 4);
  c.line(upper.map(([x, y]) => [x, y + f]), '#e3faff', 2);
  c.line([[7, 21], [19, 21], [24, 25], [23, 28], [19, 28]], edge, 4);
  c.line([[7, 21], [19, 21], [23, 25], [22, 27], [19, 27]], '#a7e6f4', 2);
  c.line([[16, 17], [37, 17]], edge, 4);
  c.line([[16, 17], [37, 17]], white, 2);
  arrow(c, 38, 17, 'right', '#d9f9ff', edge);
  snowflake(c, 8 + f, 5); snowflake(c, 35 - f, 27);
  c.pixel(3, 25, '#73b9d9'); c.pixel(29, 5, '#9bdbe9');
}
function lavaJet(c, f) {
  const edge = '#a83a41', red = '#e85c35', orange = '#ff943f', gold = '#ffd56b';
  const d = [0, 1, 0, -1][f];
  c.shape([[4, 95], [6, 73], [4, 64], [6, 46], [3, 36], [3, 24],
    [6, 17], [10, 15], [9, 8 + d], [13, 3], [16, 8], [20, 2 - d],
    [24, 7], [24, 14], [28, 18], [30, 26], [28, 39], [26, 45],
    [28, 60], [26, 74], [29, 95]], red, edge, 2);
  c.poly([[8, 95], [10, 77], [8, 65], [11, 52], [9, 38], [7, 28], [10, 21],
    [14, 20], [13, 12], [16, 16], [20, 8], [21, 19], [26, 23], [26, 34],
    [22, 46], [24, 58], [22, 73], [25, 95]], orange);
  c.poly([[13, 95], [16, 77], [13, 64], [17, 49], [14, 36], [13, 26],
    [17, 22], [18, 28], [22, 25], [23, 31], [19, 45], [21, 58], [18, 75], [21, 95]], gold);
  c.line([[15, 31], [15, 27], [18, 24]], '#fff2ad', 2);
  for (let i = 0; i < 6; i++) {
    const y = 37 + i * 9 + f;
    const x = 8 + (i % 3) * 5;
    c.line([[x, y], [x + 1, y + 4]], i % 2 ? '#ffe9a0' : '#c84737', 2);
  }
  c.oval(10, 24 + d, 2, 3, '#ffdb75', orange);
  c.oval(24, 20, 2, 2, '#ffe998', orange);
}
function lavaSurface(c, f) {
  c.rect(0, 0, 64, 32, '#dc4b35');
  c.rect(0, 0, 64, 4, '#ffdb6c');
  c.rect(0, 1, 64, 1, '#fff1ac');
  for (let x = -8; x < 72; x += 16) {
    c.ellipse(x + 4, 5, 9, 4, '#ffb64f');
    c.ellipse(x + 4, 4, 6, 2, '#ffdb6c');
    c.line([[x - 3, 14], [x + 2, 11], [x + 9, 12], [x + 13, 16]], '#f9823c', 3);
    c.line([[x, 23], [x + 4, 20], [x + 10, 21], [x + 13, 26]], '#b93c3b', 3);
    c.line([[x + 2, 22], [x + 6, 23], [x + 9, 27]], '#ff9945');
  }
  for (const [x, y, r] of [[10, 9, 3], [36, 14, 4], [54, 7, 2], [22, 26, 2], [58, 27, 3]]) {
    c.oval(x, y + f, r, r / 2 + 1, '#e76c39', '#ffba54');
    c.line([[x - 1, y - 1 + f], [x + 1, y - 1 + f]], '#ffe28b');
  }
  c.line([[0, 31], [63, 31]], '#bd3c36');
}
function pond(c, f) {
  c.oval(40, 36, 37, 24, '#476d86', '#31465f', 2);
  c.oval(40, 34, 33, 21, '#3d9eb3', '#8cbfc2', 2);
  c.ellipse(40, 34, 29, 18, '#4fbec6');
  c.ellipse(40, 30, 25, 12, '#65d5d1');
  c.ellipse(40, 32, 19, 9, '#3d9eb3');
  c.ellipse(40, 31, 16, 7, '#58c8cf');
  for (let i = 0; i < 14; i++) {
    const a = i * Math.PI * 2 / 14;
    const x = 40 + Math.cos(a) * 33, y = 36 + Math.sin(a) * 21;
    c.shape([[x - 6, y - 3], [x - 3, y - 6], [x + 3, y - 5], [x + 6, y - 2],
      [x + 5, y + 3], [x - 1, y + 5], [x - 6, y + 2]], '#8a9caa', '#445970', 1);
    c.line([[x - 4, y - 3], [x - 2, y - 4], [x + 2, y - 3]], '#cfdae0');
    c.line([[x - 2, y + 3], [x + 3, y + 2]], '#61798d');
    if (i % 3 === 0) {
      c.line([[x - 3, y - 4], [x - 4, y - 8], [x - 1, y - 5], [x + 2, y - 8], [x + 2, y - 4]], '#34765e', 2);
      c.pixel(x - 2, y - 6, '#91cf80');
    }
  }
  for (const [x, y, r] of [[27, 28, 7], [51, 37, 8], [31, 44, 5]]) {
    c.line([[x - r, y], [x - r + 2, y + 2], [x + r - 2, y + 2], [x + r, y]], '#b0f1e7');
    c.line([[x - r + f, y + 4], [x + r - f, y + 4]], '#80dcd8');
  }
  arrow(c, 40, 29 + f, 'down', '#e5fff0', '#397e93');
  c.pixel(58, 25, '#e4ffff'); c.pixel(20, 38, '#e4ffff');
}
function ship(c, f) {
  const wood = '#a6604e', edge = '#49374c', gold = '#e8b76b';
  // The deck is precisely y72 (source y144) across every column.
  c.line([[29, 71], [76, 8], [137, 71]], '#9b7e82', 1);
  c.line([[76, 8], [111, 71]], '#c4ac9c', 1);
  c.rect(75, 5, 4, 68, edge);
  c.rect(76, 5, 2, 67, '#bd8868');
  c.shape([[80, 13], [111, 24], [119, 34], [123, 46], [121, 60], [105, 56], [80, 57]], '#ded1e4', edge, 1);
  c.poly([[82, 16], [107, 26], [115, 35], [117, 46], [115, 53], [103, 51], [82, 53]], '#fff1db');
  c.line([[84, 19], [102, 27], [109, 34]], '#fffaf0', 2);
  c.line([[85, 52], [102, 49], [116, 52]], '#c0a8c6');
  c.line([[100, 25], [104, 36], [104, 48]], '#e3cbd3');
  c.shape([[71, 20], [65, 27], [60, 39], [45, 53], [69, 55]], '#f2e4ef', edge, 1);
  c.poly([[68, 28], [64, 40], [52, 50], [67, 51]], '#fff8e7');
  c.line([[49, 54], [68, 54]], '#b39abd');
  c.shape([[78, 6], [91, 5 + f * 2], [104, 9], [94, 12 + f], [80, 11]], '#cc6169', edge, 1);
  c.line([[81, 7], [91, 7 + f], [97, 9]], '#ffd881');
  c.oval(77, 4, 2, 2, gold, edge);
  c.line([[40, 69], [40, 62], [49, 62], [49, 69]], edge, 2);
  c.rect(41, 63, 7, 5, '#dbab71');
  for (const x of [13, 31, 126, 145]) {
    c.rect(x, 62, 2, 10, edge); c.pixel(x, 61, gold);
  }
  c.line([[12, 64], [33, 64]], '#bc986a', 2);
  c.line([[125, 64], [148, 64]], '#bc986a', 2);
  c.shape([[0, 72], [159, 72], [155, 80], [147, 85], [143, 96],
    [132, 104], [113, 109], [44, 109], [25, 103], [15, 94], [9, 83], [4, 81]], wood, edge, 1);
  c.poly([[13, 81], [146, 81], [141, 94], [130, 101], [111, 105], [43, 105], [27, 99], [20, 92]], '#bf8058');
  c.poly([[26, 99], [43, 104], [112, 104], [135, 98], [130, 104], [111, 108], [44, 108]], '#805043');
  c.rect(0, 72, 160, 3, edge);
  c.rect(0, 73, 160, 1, '#ffe1a0');
  c.line([[8, 79], [151, 79]], gold, 2);
  c.line([[17, 88], [142, 88]], '#7d4e48');
  c.line([[23, 96], [137, 96]], '#8c5346');
  c.line([[35, 102], [125, 102]], '#d79562');
  for (const x of [31, 57, 83, 109, 133]) {
    c.line([[x, 81], [x, 87]], '#8c5346');
    c.line([[x - 9, 90], [x - 9, 95]], '#8c5346');
    c.pixel(x + 1, 83, '#ecc58b');
  }
  for (const [x, y] of [[34, 84], [60, 94], [98, 83], [119, 99], [48, 100]]) {
    c.line([[x - 5, y], [x - 2, y - 1], [x + 3, y - 1], [x + 6, y]], '#e0a16c');
    c.line([[x - 4, y + 1], [x, y + 2], [x + 4, y + 1]], '#8f5549');
    c.pixel(x, y, '#77484a');
  }
  for (const x of [43, 76, 109]) {
    c.oval(x, 90, 6, 6, gold, edge);
    c.oval(x, 90, 4, 4, '#4b7393', '#835649');
    c.line([[x - 2, 88], [x, 87], [x + 1, 87]], '#bce9e6');
    c.pixel(x + 2, 92, '#80aabd');
  }
  c.line([[149, 77], [147, 82], [140, 85]], '#eccc88');
  c.line([[13, 78], [19, 82], [25, 82]], '#eccc88');
}
function plank(c) {
  for (const [x, y, r] of [[8, 16, 0.7], [23, 19, 0.7], [40, 16, 0.8], [55, 18, 0.6]])
    cloud(c, x, y, r);
  c.rect(0, 0, 64, 11, '#70454b');
  c.rect(0, 1, 64, 2, '#f1c28a');
  c.rect(0, 3, 64, 5, '#b57956');
  c.rect(0, 8, 64, 1, '#965b4d');
  for (let x = 0; x < 64; x += 16) {
    c.line([[x, 2], [x, 8]], '#70454b');
    c.line([[x + 4, 4], [x + 8, 4], [x + 11, 5]], '#e0a572');
    c.line([[x + 3, 6], [x + 7, 7], [x + 12, 7]], '#925449');
    c.oval(x + 2, 3, 1, 1, '#f9dba0', '#674554');
    c.pixel(x + 13, 8, '#f5c894');
  }
}
function mist(c) {
  c.rect(0, 0, 64, 3, '#7d7aa5');
  c.rect(0, 1, 64, 2, '#f4f3ff');
  c.rect(0, 3, 64, 8, '#d4d0eb');
  for (const [x, y, r] of [[-2, 9, 0.7], [12, 10, 1], [29, 13, 0.85], [46, 9, 1], [64, 9, 0.7]])
    cloud(c, x, y, r);
  c.rect(0, 1, 64, 2, '#f4f3ff');
  c.line([[6, 4], [13, 4], [17, 6]], white);
  c.line([[37, 4], [44, 4], [49, 5]], white);
  c.line([[20, 20], [25, 21], [29, 20]], '#b4aed9');
  c.line([[49, 18], [54, 19], [58, 17]], '#b4aed9');
}

function waterSurface(c, frame) {
  const icy = frame >= 2, phase = frame % 2;
  const palette = icy
    ? ['#215778', '#276c96', '#3285b0', '#50a8c7', '#98d5e5', '#e3f7ff']
    : ['#257b91', '#298fa2', '#38a9b5', '#62c6ca', '#a1e6df', '#edfff0'];
  c.rect(0, 0, 64, 32, palette[0]);
  c.rect(0, 2, 64, 7, palette[3]);
  c.rect(0, 9, 64, 7, palette[2]);
  c.rect(0, 16, 64, 8, palette[1]);
  for (let x = -12; x < 80; x += 16) {
    const left = x + phase * 4;
    c.line([[left, 3], [left + 4, 1], [left + 9, 1], [left + 13, 3], [left + 16, 3]], palette[4], 2);
    c.line([[left + 3, 2], [left + 7, 1], [left + 10, 2]], palette[5]);
    c.line([[left - 4, 11], [left, 10], [left + 6, 10]], palette[4]);
    c.line([[left + 5, 19], [left + 10, 17], [left + 15, 18]], palette[2]);
    c.line([[left - 2, 26], [left + 2, 25], [left + 6, 26]], '#226f91');
  }
  for (const [x, y] of [[8, 15], [28, 22], [48, 12]]) {
    c.oval(x + phase * 3, y, 2, 2, palette[2], palette[3]);
    c.pixel(x + phase * 3, y - 1, palette[5]);
  }
  if (icy) {
    c.shape([[17 + phase * 2, 5], [24 + phase * 2, 4], [27 + phase * 2, 6], [21 + phase * 2, 8]], '#d9f2fa', '#82c4db', 1);
    c.line([[19 + phase * 2, 5], [22 + phase * 2, 5]], white);
  } else {
    c.line([[36 - phase * 2, 6], [40 - phase * 2, 7], [46 - phase * 2, 6]], '#c3f3e5');
  }
}

const specs = [
  ['mechanic-wolf-v1.png', 128, 96, 3, wolf],
  ['bloom-flower-v1.png', 96, 128, 4, flower],
  ['bloom-bridge-v1.png', 64, 32, 2, bridge],
  ['updraft-v1.png', 64, 96, 2, updraft],
  ['wind-gust-v1.png', 96, 64, 2, gust],
  ['lava-jet-v1.png', 64, 192, 4, lavaJet],
  ['lava-surface-v1.png', 128, 64, 2, lavaSurface],
  ['water-entrance-v1.png', 160, 128, 2, pond],
  ['flying-ship-v1.png', 320, 224, 2, ship],
  ['air-plank-v1.png', 128, 48, 1, plank],
  ['mist-platform-v1.png', 128, 48, 1, mist],
  ['water-surface-v1.png', 128, 64, 4, waterSurface],
];
const args = new Set(process.argv.slice(2));
for (const arg of args) if (!['--check', '--contact-sheet'].includes(arg)) throw new Error(`Unknown option: ${arg}`);
let total = 0;
const sheets = [];
for (const [name, width, height, count, draw] of specs) {
  const sheet = new Canvas(width * count, height);
  for (let f = 0; f < count; f++) {
    const cell = new Canvas(width / 2, height / 2);
    cell.wrapX = ['bloom-bridge-v1.png', 'lava-surface-v1.png', 'air-plank-v1.png',
      'mist-platform-v1.png', 'water-surface-v1.png'].includes(name);
    draw(cell, f);
    sheet.paste(cell, f * width, 0, 2);
  }
  const bytes = png(sheet);
  total += bytes.length;
  if (args.has('--check')) {
    let actual;
    try { actual = readFileSync(root + name); }
    catch (error) {
      if (error.code === 'ENOENT') throw new Error(`Missing sprite: ${name}. Run node scripts/build-mechanic-sprites.mjs`, { cause: error });
      throw error;
    }
    if (!bytes.equals(actual)) throw new Error(`Stale sprite: ${name}. Run node scripts/build-mechanic-sprites.mjs`);
  } else writeFileSync(root + name, bytes);
  sheets.push(sheet);
  console.log(`${name}: ${sheet.w}x${sheet.h}, ${bytes.length} bytes${args.has('--check') ? ' OK' : ''}`);
}
if (total > 250 * 1024) throw new Error(`Sprite budget exceeded: ${total} bytes`);
console.log(`Total: ${total} bytes / ${250 * 1024}`);
if (args.has('--contact-sheet')) {
  const preview = new Canvas(800, sheets.reduce((sum, s) => sum + s.h + 16, 16));
  for (let y = 0; y < preview.h; y += 8)
    for (let x = 0; x < preview.w; x += 8)
      preview.rect(x, y, 8, 8, (x / 8 + y / 8) % 2 ? '#758595' : '#8191a1');
  let y = 8;
  for (const sheet of sheets) { preview.paste(sheet, 8, y); y += sheet.h + 16; }
  writeFileSync('.mechanic-contact-sheet.png', png(preview));
}
