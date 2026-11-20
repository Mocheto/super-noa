// El arte de public/assets se publica como WebP sin pérdida. Los generadores siguen dibujando y codificando PNG en
// memoria; estas funciones lo convierten con cwebp y lo leen con dwebp (libwebp: brew install webp, apt-get install webp).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const herramienta = (nombre, args) => {
  try { return execFileSync(nombre, args, { maxBuffer: 1 << 30 }); }
  catch (error) {
    if (error.code === 'ENOENT') throw new Error(`Hace falta ${nombre} (libwebp): brew install webp o apt-get install webp`, { cause: error });
    throw error;
  }
};

/** Ruta WebP que corresponde a una ruta PNG. */
export const comoWebp = (ruta) => ruta.replace(/\.png$/, '.webp');

/** Convierte un PNG del disco en WebP sin pérdida a su lado. Sin `-exact`: el color de un píxel transparente no se ve. */
export function pngAWebp(rutaPng, destino = comoWebp(rutaPng)) {
  herramienta('cwebp', ['-quiet', '-lossless', '-z', '9', '-metadata', 'none', rutaPng, '-o', destino]);
  return destino;
}

/** Píxeles RGBA de un WebP: { w, h, pixels }. Los píxeles transparentes salen como 0,0,0,0 para poder compararlos. */
export function leerWebp(ruta) {
  const pam = herramienta('dwebp', ['-quiet', '-pam', ruta, '-o', '-']);
  const fin = pam.indexOf('ENDHDR\n') + 7;
  const cabecera = pam.toString('ascii', 0, fin);
  const pixels = Buffer.from(pam.subarray(fin));
  for (let i = 0; i < pixels.length; i += 4) if (!pixels[i + 3]) pixels.fill(0, i, i + 3);
  return { w: Number(/WIDTH (\d+)/.exec(cabecera)[1]), h: Number(/HEIGHT (\d+)/.exec(cabecera)[1]), pixels };
}

const conTemporal = (accion) => {
  const carpeta = mkdtempSync(join(tmpdir(), 'super-noa-webp-'));
  try { return accion(carpeta); } finally { rmSync(carpeta, { recursive: true, force: true }); }
};

/** Escribe como WebP sin pérdida unos bytes PNG generados en memoria. */
export function escribirPngComoWebp(destinoWebp, bytesPng) {
  conTemporal((carpeta) => {
    const png = join(carpeta, 'imagen.png');
    writeFileSync(png, bytesPng);
    pngAWebp(png, destinoWebp);
  });
}

/** ¿El WebP del disco tiene los mismos píxeles que estos bytes PNG? Ignora el color de los píxeles transparentes. */
export function webpIgualAPng(rutaWebp, bytesPng) {
  return conTemporal((carpeta) => {
    const esperado = join(carpeta, 'esperado.webp');
    writeFileSync(join(carpeta, 'esperado.png'), bytesPng);
    pngAWebp(join(carpeta, 'esperado.png'), esperado);
    const a = leerWebp(rutaWebp), b = leerWebp(esperado);
    if (a.w !== b.w || a.h !== b.h) return false;
    for (let i = 0; i < a.pixels.length; i += 4) {
      if (a.pixels[i + 3] !== b.pixels[i + 3]) return false;
      if (a.pixels[i + 3] && (a.pixels[i] !== b.pixels[i] || a.pixels[i + 1] !== b.pixels[i + 1] || a.pixels[i + 2] !== b.pixels[i + 2])) return false;
    }
    return true;
  });
}

// npm run recursos:webp — pasa a WebP sin pérdida cualquier PNG de public/assets y borra el PNG.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const raiz = fileURLToPath(new URL('../public/assets/', import.meta.url));
  const pendientes = [raiz];
  let convertidos = 0;
  while (pendientes.length) {
    const carpeta = pendientes.pop();
    for (const entrada of readdirSync(carpeta, { withFileTypes: true })) {
      const ruta = join(carpeta, entrada.name);
      if (entrada.isDirectory()) pendientes.push(ruta);
      else if (entrada.name.endsWith('.png')) { pngAWebp(ruta); rmSync(ruta); convertidos++; console.log(`WebP: ${comoWebp(ruta).slice(raiz.length)}`); }
    }
  }
  console.log(`${convertidos} PNG convertidos a WebP sin pérdida.`);
}
