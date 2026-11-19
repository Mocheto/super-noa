import { cambiarTonoPared, type Version } from "./casaDecoracion.ts";

/**
 * Fondo de la habitación con la pared en el tono de la versión elegida, pintado una vez por tono en un lienzo
 * (como la hoja de cada gatito). La versión 0 es el fondo tal cual; si algo falla, también.
 */
const fondos = new Map<string, Promise<string>>();

export function fondoConPared(fondo: string, version: Version): Promise<string> {
  if (version === 0) return Promise.resolve(fondo);
  const clave = `${fondo}#${version}`;
  const guardado = fondos.get(clave);
  if (guardado) return guardado;
  const promesa = new Promise<HTMLImageElement>((resolver, fallar) => {
    const imagen = new Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = fallar;
    imagen.src = fondo;
  }).then((imagen) => {
    const lienzo = document.createElement("canvas");
    lienzo.width = imagen.naturalWidth;
    lienzo.height = imagen.naturalHeight;
    const contexto = lienzo.getContext("2d", { willReadFrequently: true });
    if (!contexto) return fondo;
    contexto.drawImage(imagen, 0, 0);
    const datos = contexto.getImageData(0, 0, lienzo.width, lienzo.height);
    cambiarTonoPared(datos.data, lienzo.width, lienzo.height, version);
    contexto.putImageData(datos, 0, 0);
    return new Promise<string>((resolver) => lienzo.toBlob((blob) => resolver(blob ? URL.createObjectURL(blob) : lienzo.toDataURL())));
  }).catch(() => fondo);
  fondos.set(clave, promesa);
  return promesa;
}
