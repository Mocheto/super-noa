/**
 * Dibujar una foto de la casa (mapa «Cámara de fotos de la casa»): se vuelve a pintar en un lienzo con las mismas piezas
 * que la casa (fondo vacío con la pared de su tono, muebles en su versión, gatitos con su hoja y su cuadro o su pose de
 * arropado, y noche). Las cuentas de dónde va cada cosa son puras; el dibujo usa el lienzo del navegador.
 */
import type { FotoCasa, GatitoEnFoto } from "./casaFoto.ts";
import { MUEBLES, MUEBLES_CASA, VERSIONES } from "./casaDecoracion.ts";
import { fondoConPared } from "./casaDecoracionArte.ts";
import { ANIMACIONES_GATO, CUADRO_GATO, hojaDeGatito } from "./casaGatoArte.ts";
import { arropadoDe, CUADROS_ARROPADO } from "./casaDormirArte.ts";
import { escalaEnSuelo, HABITACION_CASA as HABITACION } from "./casaHabitacion.ts";

/** Fila de los pies dentro del cuadro del gato (la misma que en la casa). */
export const PIES_GATITO = 152;
/** Alto de la escena de la casa. */
const ALTO = HABITACION.alto;

export type Caja = { x: number; y: number; ancho: number; alto: number };

/**
 * Caja del cuadro del gato en la escena, como la dibuja la casa: el cuadro de 160 × 160 con los pies en su sitio,
 * centrado en `x` y escalado por la profundidad desde el 95 % de su alto.
 */
export function cajaDeGatito(gatito: Pick<GatitoEnFoto, "x" | "y">): Caja {
  const escala = escalaEnSuelo(HABITACION, gatito.y);
  const lado = CUADRO_GATO * escala;
  const arriba = gatito.y - PIES_GATITO + CUADRO_GATO * 0.95 * (1 - escala);
  return { x: gatito.x - lado / 2, y: arriba, ancho: lado, alto: lado };
}

/** Pasa una caja de la escena a la foto: la vista empieza en `vista.x` y la foto mide `anchoFoto` px de ancho. */
export function aFoto(caja: Caja, foto: Pick<FotoCasa, "vista">, anchoFoto: number): Caja {
  const escala = anchoFoto / foto.vista.ancho;
  return { x: (caja.x - foto.vista.x) * escala, y: caja.y * escala, ancho: caja.ancho * escala, alto: caja.alto * escala };
}

/** Alto de la foto dibujada a `anchoFoto` px de ancho. */
export const altoDeFoto = (foto: Pick<FotoCasa, "vista">, anchoFoto: number) => Math.round(ALTO * anchoFoto / foto.vista.ancho);

const imagenes = new Map<string, Promise<HTMLImageElement>>();
function cargar(src: string): Promise<HTMLImageElement> {
  const guardada = imagenes.get(src);
  if (guardada) return guardada;
  const promesa = new Promise<HTMLImageElement>((resolver, fallar) => {
    const imagen = new Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = fallar;
    imagen.src = src;
  });
  imagenes.set(src, promesa);
  return promesa;
}

/** Dibuja la foto en el lienzo, a lo ancho que tenga; ajusta su alto. */
export async function dibujarFoto(lienzo: HTMLCanvasElement, foto: FotoCasa): Promise<void> {
  const ancho = lienzo.width;
  lienzo.height = altoDeFoto(foto, ancho);
  const contexto = lienzo.getContext("2d");
  if (!contexto) return;
  contexto.imageSmoothingEnabled = false;
  const escala = ancho / foto.vista.ancho;
  const pintar = (imagen: CanvasImageSource, origen: Caja, destino: Caja, voltear = false) => {
    const d = aFoto(destino, foto, ancho);
    contexto.save();
    if (voltear) {
      contexto.translate(d.x + d.ancho, d.y);
      contexto.scale(-1, 1);
      contexto.drawImage(imagen, origen.x, origen.y, origen.ancho, origen.alto, 0, 0, d.ancho, d.alto);
    } else {
      contexto.drawImage(imagen, origen.x, origen.y, origen.ancho, origen.alto, d.x, d.y, d.ancho, d.alto);
    }
    contexto.restore();
  };

  // Fondo con la pared de su tono.
  const fondo = await cargar(await fondoConPared(HABITACION.fondo, foto.decoracion.pared));
  contexto.drawImage(fondo, foto.vista.x, 0, foto.vista.ancho, ALTO, 0, 0, ancho, ALTO * escala);

  // Muebles en su versión.
  for (const mueble of MUEBLES) {
    const dibujo = MUEBLES_CASA[mueble].dibujo;
    if (!dibujo) continue;
    const hoja = await cargar(dibujo.imagen);
    const celda = hoja.naturalWidth / VERSIONES.length;
    pintar(hoja, { x: celda * foto.decoracion[mueble], y: 0, ancho: celda, alto: hoja.naturalHeight }, dibujo);
  }

  // De noche, la ventana de noche encima de la de día.
  if (foto.noche) {
    const ventana = HABITACION.ventanaNoche;
    const imagen = await cargar(ventana.imagen);
    pintar(imagen, { x: 0, y: 0, ancho: imagen.naturalWidth, alto: imagen.naturalHeight }, { x: ventana.left, y: ventana.top, ancho: ventana.width, alto: ventana.height });
  }

  // Gatitos, de atrás adelante; los arropados, con su pose propia (cabeza fuera y mantita de su color).
  for (const gatito of [...foto.gatitos].sort((a, b) => a.y - b.y)) {
    const variante = { sucio: gatito.sucio, mejorAmigo: gatito.mejorAmigo };
    const caja = cajaDeGatito(gatito);
    if (gatito.arropado) {
      const hoja = await cargar(await arropadoDe(gatito.mundo, variante));
      pintar(hoja, { x: (gatito.cuadro % CUADROS_ARROPADO) * CUADRO_GATO, y: 0, ancho: CUADRO_GATO, alto: CUADRO_GATO }, caja, gatito.mira < 0);
      continue;
    }
    const hoja = await cargar(await hojaDeGatito(gatito.mundo, variante));
    const { fila } = ANIMACIONES_GATO[gatito.animacion];
    pintar(hoja, { x: gatito.cuadro * CUADRO_GATO, y: fila * CUADRO_GATO, ancho: CUADRO_GATO, alto: CUADRO_GATO }, caja, gatito.mira < 0);
  }

  // Capa de noche: azul con el halo de la lámpara, o más oscura con la lámpara apagada.
  if (foto.noche) {
    if (foto.apagada) {
      contexto.fillStyle = "rgba(13, 20, 64, 0.66)";
      contexto.fillRect(0, 0, ancho, lienzo.height);
    } else {
      contexto.fillStyle = "rgba(30, 42, 110, 0.35)";
      contexto.fillRect(0, 0, ancho, lienzo.height);
      const centro = { x: (HABITACION.lampara.x - foto.vista.x) * escala, y: HABITACION.lampara.y * escala };
      const halo = contexto.createRadialGradient(centro.x, centro.y, 0, centro.x, centro.y, 260 * escala);
      halo.addColorStop(0, "rgba(255, 231, 160, 0.47)");
      halo.addColorStop(110 / 260, "rgba(255, 231, 160, 0.47)");
      halo.addColorStop(1, "rgba(255, 231, 160, 0)");
      contexto.fillStyle = halo;
      contexto.fillRect(0, 0, ancho, lienzo.height);
    }
  }
}
