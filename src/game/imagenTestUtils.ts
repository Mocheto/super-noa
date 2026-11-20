import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** Cabecera de un WebP sin pérdida (VP8L): medidas y si usa transparencia, sin decodificarlo. */
export function webpSinPerdida(bytes: Buffer) {
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
  assert.equal(bytes.toString("ascii", 8, 16), "WEBPVP8L", "WebP sin pérdida");
  assert.equal(bytes[20], 0x2f, "firma VP8L");
  const bits = bytes.readUInt32LE(21);
  return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1, alpha: ((bits >>> 28) & 1) === 1 };
}

/**
 * Píxeles RGBA de un WebP sin pérdida de `public/` (ruta `./assets/...`). Lo decodifica `dwebp` de libwebp
 * (`brew install webp`, `apt-get install webp`), que devuelve un PAM: cabecera de texto y los bytes RGBA tal cual.
 */
export function readRgbaImage(source: string) {
  const file = new URL(`../../public/${source.slice(2)}`, import.meta.url);
  const bytes = readFileSync(file);
  // Un WebP totalmente opaco (superficies de lava o agua) no marca transparencia; dwebp devuelve RGBA igualmente.
  const { width, height } = webpSinPerdida(bytes);
  let pam: Buffer;
  try {
    pam = execFileSync("dwebp", ["-quiet", "-pam", file.pathname, "-o", "-"], { maxBuffer: 1 << 30 });
  } catch (error) {
    throw new Error(`Hace falta dwebp (libwebp) para leer ${source}: brew install webp o apt-get install webp`, { cause: error });
  }
  const end = pam.indexOf("ENDHDR\n") + 7;
  const header = pam.toString("ascii", 0, end);
  assert.match(header, new RegExp(`WIDTH ${width}\\nHEIGHT ${height}\\nDEPTH 4\\nMAXVAL 255\\nTUPLTYPE RGB_ALPHA`));
  const pixels = pam.subarray(end);
  assert.equal(pixels.length, width * height * 4);
  return { width, height, pixels, bytes: bytes.length };
}
