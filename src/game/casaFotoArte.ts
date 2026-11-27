/**
 * Dibujar una foto de la casa (mapa «Cámara de fotos de la casa»): se vuelve a pintar en un lienzo con las mismas piezas
 * que la casa (fondo vacío con la pared de su tono, muebles en su versión, gatitos con su hoja y su cuadro o su pose de
 * arropado, sus accesorios, y noche). Las cuentas de dónde va cada cosa son puras; el dibujo usa el lienzo del navegador.
 */
import type { FotoCasa, GatitoEnFoto } from "./casaFoto.ts";
import { DELANTE_DE_LA_VENTANA, MUEBLES, MUEBLES_CASA, VERSIONES, type MuebleId } from "./casaDecoracion.ts";
import { dibujoDeColor, fondoConPared } from "./casaDecoracionArte.ts";
import { pintarClima, ZONA_HABITACION, ZONA_JARDIN } from "./casaClimaArte.ts";
import { ANIMACIONES_GATO, CUADRO_GATO, hojaDeGatito, modeloDibujado } from "./casaGatoArte.ts";
import { arropadoDe, CUADROS_ARROPADO } from "./casaDormirArte.ts";
import { escalaEnSuelo, HABITACION_CASA as HABITACION } from "./casaHabitacion.ts";
import { crearPecera, PECERA } from "./casaPecera.ts";
import { pintarPradera } from "./casaMadrigueraArte.ts";
import { pintarJaulaEnFoto, saleLaJaula } from "./casaHamstersFoto.ts";
import { CAPA_VISIBLE, laminaDePieza, piezasEnCuadro, type PiezaEnCuadro } from "./casaVestidorArte.ts";
import { conComplemento } from "./casaComplementos.ts";
import { CELDAS_MACETEROS, HOJA_MACETEROS, JARDIN, luciernagasDelJardin } from "./casaJardin.ts";

/** Fila de los pies dentro del cuadro del gato (la misma que en la casa). */
export const PIES_GATITO = 152;
/** Alto de la escena de la casa. */
const ALTO = HABITACION.alto;

export type Caja = { x: number; y: number; ancho: number; alto: number };

/**
 * Caja del cuadro del gato en la escena, como la dibuja la casa: el cuadro de 160 × 160 con los pies en su sitio,
 * centrado en `x` y escalado por la profundidad desde el 95 % de su alto.
 */
export function cajaDeGatito(gatito: Pick<GatitoEnFoto, "x" | "y">, enJardin = false): Caja {
  const escala = escalaEnSuelo(enJardin ? JARDIN : HABITACION, gatito.y);
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

  const enJardin = Boolean(foto.jardin);
  if (foto.jardin) {
    // En el jardín: su fondo, la colchoneta y cada macetero como estaba.
    const fondo = await cargar(JARDIN.fondo);
    // El jardín dibujado empieza en x = 0; a su izquierda, la ampliación con la madriguera.
    if (foto.vista.x < 0) {
      contexto.save();
      contexto.setTransform(escala, 0, 0, escala, -foto.vista.x * escala, 0);
      pintarPradera(contexto);
      contexto.restore();
    }
    contexto.drawImage(fondo, 0, 0, JARDIN.ancho, ALTO, -foto.vista.x * escala, 0, JARDIN.ancho * escala, ALTO * escala);
    const colchoneta = await cargar(JARDIN.colchoneta.imagen);
    const { left, top, width, height } = JARDIN.colchoneta;
    pintar(colchoneta, { x: 0, y: 0, ancho: colchoneta.naturalWidth, alto: colchoneta.naturalHeight }, { x: left, y: top, ancho: width, alto: height });
    const lamina = await cargar(HOJA_MACETEROS);
    const celda = lamina.naturalWidth / CELDAS_MACETEROS;
    foto.jardin.maceteros.forEach((indice, i) => {
      const caja = JARDIN.maceteros[i];
      if (caja) pintar(lamina, { x: celda * indice, y: 0, ancho: celda, alto: lamina.naturalHeight }, { x: caja.left, y: caja.top, ancho: caja.width, alto: caja.height });
    });
  }

  // Fondo con la pared de su tono.
  const fondo = enJardin ? null : await cargar(await fondoConPared(HABITACION.fondo, foto.decoracion.pared));
  // El fondo de la habitación empieza en x = -ampliacion de la escena (la ampliación de la izquierda).
  if (fondo) contexto.drawImage(fondo, foto.vista.x + HABITACION.ampliacion, 0, foto.vista.ancho, ALTO, 0, 0, ancho, ALTO * escala);
  // La jaula de hámsters, a la izquierda de la pecera.
  if (saleLaJaula(foto)) await pintarJaulaEnFoto(contexto, foto, escala, cargar);
  // La pecera de la ampliación: el mueble, los cuatro peces como al empezar y el cristal por delante.
  if (!enJardin && foto.vista.x < PECERA.left + PECERA.ancho) {
    const caja = { x: PECERA.left, y: PECERA.top, ancho: PECERA.ancho, alto: PECERA.alto };
    const entera = (imagen: HTMLImageElement) => ({ x: 0, y: 0, ancho: imagen.naturalWidth, alto: imagen.naturalHeight });
    const fondoPecera = await cargar(await dibujoDeColor(PECERA.fondo, "mueblePecera", foto.decoracion.mueblePecera));
    pintar(fondoPecera, entera(fondoPecera), caja);
    const adorno = await cargar(PECERA.adornos[foto.decoracion.adornoPecera]);
    pintar(adorno, entera(adorno), caja);
    const hojaPeces = await cargar(PECERA.peces);
    const { ancho: anchoPez, alto: altoPez } = PECERA.cuadroPez;
    const hojaCaballito = await cargar(PECERA.caballito.hoja);
    const { cuadro: cuadroCaballito, mostrar: ladoCaballito } = PECERA.caballito;
    for (const pez of crearPecera(0, () => 0.5).peces) {
      if (pez.especie === 4) {
        pintar(hojaCaballito, { x: 0, y: 0, ancho: cuadroCaballito, alto: cuadroCaballito }, { x: PECERA.left + pez.x - ladoCaballito / 2, y: PECERA.top + pez.y - ladoCaballito / 2, ancho: ladoCaballito, alto: ladoCaballito }, pez.mira < 0);
        continue;
      }
      pintar(hojaPeces, { x: 0, y: pez.especie * altoPez, ancho: anchoPez, alto: altoPez }, { x: PECERA.left + pez.x - anchoPez / 2, y: PECERA.top + pez.y - altoPez / 2, ancho: anchoPez, alto: altoPez }, pez.mira < 0);
    }
    const hojaCofre = await cargar(PECERA.cofre.hoja);
    pintar(hojaCofre, { x: 0, y: 0, ancho: hojaCofre.naturalHeight, alto: hojaCofre.naturalHeight }, { x: PECERA.left + PECERA.cofre.izquierda, y: PECERA.top + PECERA.cofre.arriba, ancho: PECERA.cofre.mostrar, alto: PECERA.cofre.mostrar });
    const cristal = await cargar(PECERA.cristal);
    pintar(cristal, entera(cristal), caja);
  }

  // Muebles en su versión (las cortinas, más abajo: delante de la ventana de noche y del clima).
  const pintarMueble = async (mueble: MuebleId) => {
    const dibujo = MUEBLES_CASA[mueble].dibujo;
    if (!dibujo) return;
    const hoja = await cargar(dibujo.imagen);
    const celda = hoja.naturalWidth / VERSIONES.length;
    pintar(hoja, { x: celda * foto.decoracion[mueble], y: 0, ancho: celda, alto: hoja.naturalHeight }, dibujo);
  };
  for (const mueble of enJardin ? [] : MUEBLES) if (!DELANTE_DE_LA_VENTANA.includes(mueble)) await pintarMueble(mueble);

  // De noche, la ventana de noche encima de la de día.
  if (foto.noche && !enJardin) {
    const ventana = HABITACION.ventanaNoche;
    const imagen = await cargar(ventana.imagen);
    pintar(imagen, { x: 0, y: 0, ancho: imagen.naturalWidth, alto: imagen.naturalHeight }, { x: ventana.left, y: ventana.top, ancho: ventana.width, alto: ventana.height });
  }

  // El clima que se veía, quieto.
  if (foto.clima) {
    contexto.save();
    contexto.scale(escala, escala);
    contexto.translate(-foto.vista.x, 0);
    pintarClima(contexto, foto.clima, enJardin ? ZONA_JARDIN : ZONA_HABITACION, 0, true);
    contexto.restore();
  }
  for (const mueble of enJardin ? [] : DELANTE_DE_LA_VENTANA) await pintarMueble(mueble);

  // Gatitos, de atrás adelante; los arropados, con su pose propia (cabeza fuera y mantita de su color).
  for (const gatito of [...foto.gatitos].sort((a, b) => a.y - b.y)) {
    const variante = { sucio: gatito.sucio, mejorAmigo: gatito.mejorAmigo };
    const caja = cajaDeGatito(gatito, enJardin);
    if (gatito.arropado) {
      const hoja = await cargar(await arropadoDe(gatito.mundo, variante));
      pintar(hoja, { x: (gatito.cuadro % CUADROS_ARROPADO) * CUADRO_GATO, y: 0, ancho: CUADRO_GATO, alto: CUADRO_GATO }, caja, gatito.mira < 0);
      continue;
    }
    const puestas = conComplemento(gatito.ropa ?? {}, gatito.mundo);
    // Con algo en la cabeza, el lazo de mejor amigo queda debajo (como en la casa).
    const hoja = await cargar(await hojaDeGatito(gatito.mundo, { ...variante, mejorAmigo: variante.mejorAmigo && !puestas.sombrero }));
    const { fila } = ANIMACIONES_GATO[gatito.animacion];
    // Sus accesorios, en su sitio de ese cuadro (como en la casa): alas y capa detrás del gatito, lo demás delante.
    const piezas = piezasEnCuadro(puestas, gatito.animacion, gatito.cuadro, modeloDibujado(gatito.mundo));
    const pintarPieza = async ({ tipo, pieza, caja: enCuadro }: PiezaEnCuadro) => {
      const lamina = laminaDePieza(tipo, pieza);
      const imagen = await cargar(lamina.imagen);
      const ancho = caja.ancho * enCuadro.width / 100;
      const izquierda = gatito.mira < 0 ? caja.x + caja.ancho * (1 - (enCuadro.left + enCuadro.width) / 100) : caja.x + caja.ancho * enCuadro.left / 100;
      // La capa, cortada a la altura de las patas como en la escena.
      const parte = tipo === "capa" ? CAPA_VISIBLE : 1;
      pintar(imagen, { x: lamina.columna * lamina.celda.ancho, y: lamina.fila * lamina.celda.alto, ancho: lamina.celda.ancho, alto: lamina.celda.alto * parte },
        { x: izquierda, y: caja.y + caja.alto * enCuadro.top / 100, ancho, alto: caja.alto * enCuadro.height / 100 * parte }, gatito.mira < 0);
    };
    for (const pieza of piezas) if (pieza.detras) await pintarPieza(pieza);
    pintar(hoja, { x: gatito.cuadro * CUADRO_GATO, y: fila * CUADRO_GATO, ancho: CUADRO_GATO, alto: CUADRO_GATO }, caja, gatito.mira < 0);
    for (const pieza of piezas) if (!pieza.detras) await pintarPieza(pieza);
  }

  // El visitante del jardín, delante de los gatitos (que se le acercan a olerlo), con su dibujo de amigo (como en la escena: 200 px de ancho, los pies abajo en el centro).
  const visitante = foto.jardin?.visitante;
  if (visitante) {
    const { pintarAmigo } = await import("./DibujoAmigo.tsx");
    const prueba = document.createElement("canvas").getContext("2d");
    // La primera vez carga las imágenes de su mundo: se espera un momento antes de pintarlo de verdad.
    if (prueba && pintarAmigo(prueba, visitante.animal, { x: 100, y: 160 }, 200)) await new Promise((listo) => window.setTimeout(listo, 400));
    contexto.save();
    contexto.setTransform(escala, 0, 0, escala, -foto.vista.x * escala, 0);
    pintarAmigo(contexto, visitante.animal, visitante, 200);
    contexto.restore();
    contexto.imageSmoothingEnabled = false;
  }

  // De noche en el jardín: su capa oscura y las luciérnagas donde estaban al hacerla.
  if (foto.noche && enJardin) {
    contexto.fillStyle = "rgba(20, 29, 90, 0.65)";
    contexto.fillRect(0, 0, ancho, lienzo.height);
    const momento = Date.parse(foto.hecha);
    for (const { x, y } of luciernagasDelJardin(() => momento)) {
      const centro = { x: (x - foto.vista.x) * escala, y: y * escala };
      const brillo = contexto.createRadialGradient(centro.x, centro.y, 0, centro.x, centro.y, 16 * escala);
      brillo.addColorStop(0, "rgba(255, 246, 168, 1)");
      brillo.addColorStop(0.3, "rgba(255, 233, 106, 0.7)");
      brillo.addColorStop(1, "rgba(255, 233, 106, 0)");
      contexto.fillStyle = brillo;
      contexto.fillRect(centro.x - 16 * escala, centro.y - 16 * escala, 32 * escala, 32 * escala);
    }
    return;
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
