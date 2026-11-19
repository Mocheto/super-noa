/**
 * Arrastrar y frotar en la casa (prototipo «Arrastrar y frotar en la habitación»). Solo cuentas y medidas, sin
 * React, para probarlas. Los números que hay que fijar jugando con Noa se pueden cambiar desde la URL, también en la web:
 * `?casaFrotar=1500` (milisegundos frotando), `?casaObjeto=96` (tamaño de los objetos de la bandeja, en px de la
 * escena), `?casaToque=90` (radio para soltar algo sobre un gatito) y `?casaNecesidades=pide|senota` (para probar con
 * los gatitos pidiendo o con pistas).
 */
import type { Cuidado } from "./casa.ts";
import { HABITACION_CASA } from "./casaHabitacion.ts";

/** La habitación mide 1280 × 540 y se desliza con el dedo («La habitación de la casa»). */
export const ESCENA_CASA = { ancho: HABITACION_CASA.ancho, alto: HABITACION_CASA.alto, suelo: HABITACION_CASA.sitiosDia[0].y } as const;
/** Sitio de cada gatito sobre la alfombra, por su orden en `MUNDOS_CASA` (de los datos de la habitación). */
export const SITIOS_CASA = HABITACION_CASA.sitiosDia.map((sitio) => sitio.x);
/** De noche duermen juntos en la cama redonda. */
export const SITIOS_NOCHE = HABITACION_CASA.sitiosNoche.map((sitio) => sitio.x);
/** Por dónde pueden andar solos sobre la alfombra. */
export const ALFOMBRA = { desde: 560, hasta: 910 } as const;
/** Al llevar un objeto a menos de esta distancia del borde de la vista, la habitación se desliza sola. */
export const BORDE_AUTODESLIZAR = 40;
/** Alto de un gatito sentado en la escena. */
export const ALTO_GATITO = 140;

export type Herramienta = "cuenco" | "pelota" | "esponja" | "escoba";
/** Objetos de la bandeja. La esponja ya no está: para bañar se coge al gatito y se lleva a la bañera. */
export const HERRAMIENTAS: readonly Herramienta[] = ["cuenco", "pelota", "escoba"];
/** Con el dedo quieto este tiempo sobre un gatito, se coge; si se mueve más de `MOVER_PARA_FROTAR` px antes, es frotar. */
export const MANTENER_PARA_COGER_MS = 500;
export const MOVER_PARA_FROTAR = 8;

/** ¿Se coge? El dedo lleva quieto (menos de `MOVER_PARA_FROTAR` px de pantalla) al menos medio segundo. */
export const seCoge = (ms: number, movido: number) => ms >= MANTENER_PARA_COGER_MS && movido < MOVER_PARA_FROTAR;
export const CUIDADO_DE: Readonly<Record<Exclude<Herramienta, "escoba">, Cuidado>> = { cuenco: "comer", pelota: "pelota", esponja: "esponja" };

export type AjustesCasa = {
  /** Tiempo frotando (con el dedo o la esponja) hasta que cuenta. */
  frotarMs: number;
  /** Tamaño de los objetos de la bandeja, en px de la escena. */
  objeto: number;
  /** Radio alrededor del gatito en el que cuenta soltar o frotar, en px de la escena. */
  toque: number;
  /** Para probar: necesidades al entrar. */
  necesidades: "pide" | "senota" | null;
};

export const AJUSTES_CASA: AjustesCasa = { frotarMs: 1500, objeto: 96, toque: 90, necesidades: null };

const numero = (valor: string | null, minimo: number, maximo: number, defecto: number) => {
  const leido = Number(valor);
  return valor !== null && Number.isFinite(leido) ? Math.max(minimo, Math.min(maximo, leido)) : defecto;
};

export function leerAjustesCasa(busqueda: string | null): AjustesCasa {
  const parametros = new URLSearchParams(busqueda ?? "");
  const necesidades = parametros.get("casaNecesidades");
  return {
    frotarMs: numero(parametros.get("casaFrotar"), 200, 6000, AJUSTES_CASA.frotarMs),
    objeto: numero(parametros.get("casaObjeto"), 48, 200, AJUSTES_CASA.objeto),
    toque: numero(parametros.get("casaToque"), 40, 200, AJUSTES_CASA.toque),
    necesidades: necesidades === "pide" || necesidades === "senota" ? necesidades : null,
  };
}

/** Pasa un punto de la pantalla a coordenadas de la escena (la caja es la de la escena entera, ya escalada y desplazada). */
export const aEscena = (clienteX: number, clienteY: number, caja: { left: number; top: number; width: number; height: number }) => ({
  x: ((clienteX - caja.left) / caja.width) * ESCENA_CASA.ancho,
  y: ((clienteY - caja.top) / caja.height) * ESCENA_CASA.alto,
});

/** Índice del gatito bajo el punto (en `sitios`), o -1. Cuenta su cuerpo sentado más el radio de toque. */
export function gatitoEn(x: number, y: number, sitios: readonly number[], toque = AJUSTES_CASA.toque): number {
  const arriba = ESCENA_CASA.suelo - ALTO_GATITO - toque / 2;
  if (y < arriba || y > ESCENA_CASA.suelo + toque / 2) return -1;
  let mejor = -1;
  let distancia = Infinity;
  sitios.forEach((sitio, indice) => {
    const d = Math.abs(x - sitio);
    if (d <= toque && d < distancia) { mejor = indice; distancia = d; }
  });
  return mejor;
}

/** Índice del gatito más cercano a donde cae la pelota (el que corre a atraparla). */
export const gatitoMasCerca = (x: number, sitios: readonly number[]) =>
  sitios.reduce((mejor, sitio, indice) => Math.abs(x - sitio) < Math.abs(x - sitios[mejor]) ? indice : mejor, 0);

/** Índice de la huella bajo la escoba, o -1. */
export function huellaEn(x: number, y: number, huellas: readonly { x: number }[], radio = 60): number {
  if (Math.abs(y - (ESCENA_CASA.suelo + 30)) > radio) return -1;
  return huellas.findIndex((huella) => Math.abs(huella.x - x) <= radio);
}

/**
 * Frotar: suma el tiempo entre movimientos seguidos sobre el mismo gatito. Un parón de más de 250 ms no suma, y
 * cambiar de gatito empieza de cero. Devuelve el nuevo estado y si ya ha frotado bastante.
 */
export type Frote = { gatito: number; ms: number; ultimo: number };
export const PARON_MS = 250;

export function frotar(frote: Frote | null, gatito: number, ahora: number, objetivoMs: number): { frote: Frote | null; listo: boolean } {
  if (gatito < 0) return { frote, listo: false };
  if (!frote || frote.gatito !== gatito) return { frote: { gatito, ms: 0, ultimo: ahora }, listo: false };
  const paso = ahora - frote.ultimo;
  const ms = frote.ms + (paso > 0 && paso <= PARON_MS ? paso : 0);
  if (ms >= objetivoMs) return { frote: null, listo: true };
  return { frote: { gatito, ms, ultimo: ahora }, listo: false };
}

/**
 * Escala de la habitación en pantalla: cabe a lo alto, y en pantallas estrechas no baja de 0,75 para que el gatito
 * (140 px de escena) mida unos 105 px; entonces se desliza a los lados.
 */
export const ESCALA_MINIMA = 0.75;
export function escalaCasa(anchoDisponible: number, altoDisponible: number): number {
  if (anchoDisponible <= 0 || altoDisponible <= 0) return ESCALA_MINIMA;
  return Math.min(altoDisponible / ESCENA_CASA.alto, Math.max(anchoDisponible / ESCENA_CASA.ancho, ESCALA_MINIMA));
}

/** Desplazamiento de la vista (en px de escena) dentro de los límites de la habitación. */
export const limitarVista = (x: number, anchoVisible: number) => Math.max(0, Math.min(Math.max(0, ESCENA_CASA.ancho - anchoVisible), x));

/** Vista que deja `objetivo` en el centro, si cabe. */
export const centrarEn = (objetivo: number, anchoVisible: number) => limitarVista(objetivo - anchoVisible / 2, anchoVisible);

/** -1, 0 o 1: hacia dónde se desliza sola la vista con un objeto cerca del borde (coordenadas de pantalla). */
export function autodeslizar(clienteX: number, izquierda: number, derecha: number): -1 | 0 | 1 {
  if (clienteX < izquierda + BORDE_AUTODESLIZAR) return -1;
  if (clienteX > derecha - BORDE_AUTODESLIZAR) return 1;
  return 0;
}
