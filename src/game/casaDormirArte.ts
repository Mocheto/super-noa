/**
 * La mantita de la hora de dormir (`casa-mantita-v1.webp`, de `prototypes/tools/casa-dormir-recorte.py`): dos celdas
 * (doblada y extendida) pintadas en violeta clave. Para cada gatito se tiñe del color de su collar, conservando el ribete
 * claro, los pliegues oscuros y el contorno.
 */
import { PALETAS_GATITOS, type Rgb } from "./casaGatoArte.ts";

export const HOJA_MANTITA = "./assets/sprites/casa-mantita-v1.webp";
/** Tamaño de cada celda de la hoja (doblada y extendida), en px. */
export const CELDA_MANTITA = { ancho: 128, alto: 67 } as const;

function hsv([r, g, b]: Rgb): [number, number, number] {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === r / 255) h = ((g - b) / 255 / d) % 6;
    else if (max === g / 255) h = (b - r) / 255 / d + 2;
    else h = (r - g) / 255 / d + 4;
  }
  return [((h * 60) + 360) % 360, max === 0 ? 0 : d / max, max];
}

function rgb(h: number, s: number, v: number): Rgb {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** ¿Es violeta de la mantita? (El contorno ciruela es oscuro y se queda.) */
const esVioleta = ([h, s, v]: [number, number, number]) => h >= 255 && h <= 315 && s >= 0.25 && v >= 0.4;

/**
 * Tiñe los píxeles RGBA de la mantita del color `collar`: cada violeta toma el tono del collar y su saturación y su
 * brillo se escalan con los del collar, así el ribete sigue más claro y los pliegues más oscuros.
 */
export function teñirMantita(pixeles: Uint8ClampedArray, collar: Rgb): void {
  const [tono, saturacion, brillo] = hsv(collar);
  for (let i = 0; i < pixeles.length; i += 4) {
    if (pixeles[i + 3] === 0) continue;
    const color = hsv([pixeles[i], pixeles[i + 1], pixeles[i + 2]]);
    if (!esVioleta(color)) continue;
    const [r, g, b] = rgb(tono, Math.min(1, color[1] * saturacion), Math.min(1, color[2] * Math.max(brillo, 0.55)));
    pixeles[i] = r; pixeles[i + 1] = g; pixeles[i + 2] = b;
  }
}

const mantitas = new Map<number, Promise<string>>();
let hoja: Promise<HTMLImageElement> | null = null;

/** La hoja de la mantita teñida del color del collar del gatito del mundo dado (una vez por gatito). */
export function mantitaDe(mundo: number): Promise<string> {
  const guardada = mantitas.get(mundo);
  if (guardada) return guardada;
  hoja ??= new Promise((resolver, fallar) => {
    const imagen = new Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = fallar;
    imagen.src = HOJA_MANTITA;
  });
  const promesa = hoja.then((imagen) => {
    const lienzo = document.createElement("canvas");
    lienzo.width = imagen.naturalWidth;
    lienzo.height = imagen.naturalHeight;
    const contexto = lienzo.getContext("2d", { willReadFrequently: true });
    if (!contexto) return HOJA_MANTITA;
    contexto.drawImage(imagen, 0, 0);
    const datos = contexto.getImageData(0, 0, lienzo.width, lienzo.height);
    teñirMantita(datos.data, (PALETAS_GATITOS[mundo] ?? PALETAS_GATITOS[1]).collar);
    contexto.putImageData(datos, 0, 0);
    return new Promise<string>((resolver) => lienzo.toBlob((blob) => resolver(blob ? URL.createObjectURL(blob) : lienzo.toDataURL())));
  }).catch(() => HOJA_MANTITA);
  mantitas.set(mundo, promesa);
  return promesa;
}
