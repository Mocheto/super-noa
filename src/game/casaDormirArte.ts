/**
 * La mantita de la hora de dormir (`casa-mantita-v1.webp`, de `prototypes/tools/casa-dormir-recorte.py`): la doblada
 * va en la bandeja. El gatito arropado tiene su pose propia con la mantita en violeta clave, que se tiñe del color de su
 * collar conservando el ribete claro, los pliegues oscuros y el contorno.
 */
import { CLAVES_GATO, MARCAS_GATITOS, modeloDibujado, PALETAS_GATITOS, recolorear, tablaDeColores, type ModeloGatito, type Rgb, type VarianteGatito } from "./casaGatoArte.ts";

export const HOJA_MANTITA = "./assets/sprites/casa-mantita-v1.webp";
/**
 * Pose «arropado» (mapa «Gatitos dormidos con la cabeza fuera de la mantita»): dos cuadros de 160 × 160, el gatito en
 * los colores clave del gato base y la mantita en el violeta clave. Se pinta con la paleta del gatito y el color de su
 * collar, y se usa en lugar de «dormir» con la mantita encima.
 */
export const HOJA_ARROPADO = "./assets/sprites/gato-casa-arropado-v1.webp";
export const CUADROS_ARROPADO = 2;
/** La pose arropado de cada modelo con hoja en la casa (los mismos que `HOJAS_MODELO`). */
export const HOJAS_ARROPADO: Readonly<{ atigrado: string } & Partial<Record<ModeloGatito, string>>> = {
  atigrado: HOJA_ARROPADO,
  esmoquin: "./assets/sprites/gato-casa-arropado-esmoquin-v1.webp",
  melena: "./assets/sprites/gato-casa-arropado-melena-v1.webp",
  nube: "./assets/sprites/gato-casa-arropado-nube-v1.webp",
};

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
  const [pr, pg, pb] = CLAVES_GATO.puntas;
  for (let i = 0; i < pixeles.length; i += 4) {
    if (pixeles[i + 3] === 0) continue;
    // Las puntas de los modelos melena y nube también son violetas, pero son del gatito, no de la mantita.
    if (pixeles[i] === pr && pixeles[i + 1] === pg && pixeles[i + 2] === pb) continue;
    const color = hsv([pixeles[i], pixeles[i + 1], pixeles[i + 2]]);
    if (!esVioleta(color)) continue;
    const [r, g, b] = rgb(tono, Math.min(1, color[1] * saturacion), Math.min(1, color[2] * Math.max(brillo, 0.55)));
    pixeles[i] = r; pixeles[i + 1] = g; pixeles[i + 2] = b;
  }
}

const arropados = new Map<string, Promise<string>>();
const hojasArropado = new Map<string, Promise<HTMLImageElement>>();

/** La pose «arropado» pintada para el gatito del mundo dado (paleta, barro y lazo) con la mantita del color de su collar. */
export function arropadoDe(mundo: number, variante: VarianteGatito): Promise<string> {
  const clave = `${mundo}-${variante.sucio}-${variante.mejorAmigo}`;
  const guardada = arropados.get(clave);
  if (guardada) return guardada;
  const src = HOJAS_ARROPADO[modeloDibujado(mundo)] ?? HOJA_ARROPADO;
  let hojaArropado = hojasArropado.get(src);
  if (!hojaArropado) {
    hojaArropado = new Promise((resolver, fallar) => {
      const imagen = new Image();
      imagen.onload = () => resolver(imagen);
      imagen.onerror = fallar;
      imagen.src = src;
    });
    hojasArropado.set(src, hojaArropado);
  }
  const promesa = hojaArropado.then((imagen) => {
    const lienzo = document.createElement("canvas");
    lienzo.width = imagen.naturalWidth;
    lienzo.height = imagen.naturalHeight;
    const contexto = lienzo.getContext("2d", { willReadFrequently: true });
    if (!contexto) return HOJA_ARROPADO;
    contexto.drawImage(imagen, 0, 0);
    const datos = contexto.getImageData(0, 0, lienzo.width, lienzo.height);
    const paleta = PALETAS_GATITOS[mundo] ?? PALETAS_GATITOS[1];
    // Primero la mantita (con el gatito aún en colores clave, que no son violetas) y luego la paleta del gatito, que
    // puede tener tonos lilas que la mantita no debe tocar.
    teñirMantita(datos.data, paleta.collar);
    recolorear(datos.data, tablaDeColores(paleta, variante, MARCAS_GATITOS[mundo]));
    contexto.putImageData(datos, 0, 0);
    return new Promise<string>((resolver) => lienzo.toBlob((blob) => resolver(blob ? URL.createObjectURL(blob) : lienzo.toDataURL())));
  }).catch(() => HOJA_ARROPADO);
  arropados.set(clave, promesa);
  return promesa;
}
