import { cambiarTonoPared, recolorear, type ParteDeColor, type Version } from "./casaDecoracion.ts";

/**
 * Los dibujos que cambian de color por código (la pared y, de la pecera y la jaula, el mueble y la base con el tejado),
 * pintados una vez por versión en un lienzo (como la hoja de cada gatito). La versión 0 es el dibujo tal cual; si algo
 * falla, también.
 */
const pintados = new Map<string, Promise<string>>();

function conColor(ruta: string, version: Version, pintar: (pixeles: Uint8ClampedArray, ancho: number, alto: number) => void): Promise<string> {
  if (version === 0) return Promise.resolve(ruta);
  const clave = `${ruta}#${version}`;
  const guardado = pintados.get(clave);
  if (guardado) return guardado;
  const promesa = new Promise<HTMLImageElement>((resolver, fallar) => {
    const imagen = new Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = fallar;
    imagen.src = ruta;
  }).then((imagen) => {
    const lienzo = document.createElement("canvas");
    lienzo.width = imagen.naturalWidth;
    lienzo.height = imagen.naturalHeight;
    const contexto = lienzo.getContext("2d", { willReadFrequently: true });
    if (!contexto) return ruta;
    contexto.drawImage(imagen, 0, 0);
    const datos = contexto.getImageData(0, 0, lienzo.width, lienzo.height);
    pintar(datos.data, lienzo.width, lienzo.height);
    contexto.putImageData(datos, 0, 0);
    return new Promise<string>((resolver) => lienzo.toBlob((blob) => resolver(blob ? URL.createObjectURL(blob) : lienzo.toDataURL())));
  }).catch(() => ruta);
  pintados.set(clave, promesa);
  return promesa;
}

/** Fondo de la habitación con la pared en el tono de la versión elegida. */
export const fondoConPared = (fondo: string, version: Version): Promise<string> =>
  conColor(fondo, version, (pixeles, ancho, alto) => cambiarTonoPared(pixeles, ancho, alto, version));

/** El dibujo de la pecera o de la jaula con su mueble o su base en el color de la versión. */
export const dibujoDeColor = (ruta: string, parte: ParteDeColor, version: Version): Promise<string> =>
  conColor(ruta, version, (pixeles, ancho) => recolorear(pixeles, ancho, parte, version));
