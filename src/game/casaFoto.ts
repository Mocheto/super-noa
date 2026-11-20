/**
 * Fotos de la casa (mapa «Cámara de fotos de la casa»): una foto guarda como datos lo que se veía al hacerla (el trozo
 * de habitación, la decoración, la noche y cada gatito con su pose), y se vuelve a dibujar al mirarla. Se guardan las
 * doce últimas, la más nueva primero. Solo lógica: sin dibujo.
 */
import type { CasaProgress } from "./casa.ts";
import { normalizeDecoracion, type Decoracion } from "./casaDecoracion.ts";
import { ANIMACIONES_GATO, type AnimacionGato } from "./casaGatoArte.ts";
import { normalizeRopa, type Ropa } from "./casaRopa.ts";

export const MAX_FOTOS = 12;
/** Medidas de la escena de la casa (px). */
const ANCHO = 1280;
const ALTO = 540;
const MAX_GATITOS = 5;

export type GatitoEnFoto = {
  mundo: number;
  /** Pies del gatito en la escena. */
  x: number;
  y: number;
  animacion: AnimacionGato;
  cuadro: number;
  mira: 1 | -1;
  sucio: boolean;
  mejorAmigo: boolean;
  arropado: boolean;
  /** Accesorios que llevaba (si llevaba alguno y no estaba arropado). */
  ropa?: Ropa;
};

export type FotoCasa = {
  /** Momento en que se hizo (ISO). */
  hecha: string;
  /** Trozo de la habitación que se veía: desde `x`, `ancho` px de escena. */
  vista: { x: number; ancho: number };
  decoracion: Decoracion;
  noche: boolean;
  /** De noche, con la lámpara apagada. */
  apagada: boolean;
  gatitos: GatitoEnFoto[];
};

/** Guarda la foto delante de las demás; con más de doce, se va la más antigua. */
export const guardarFoto = (casa: CasaProgress, foto: FotoCasa): CasaProgress =>
  ({ ...casa, fotos: [foto, ...(casa.fotos ?? [])].slice(0, MAX_FOTOS) });

export const fotosDe = (casa: CasaProgress | undefined): FotoCasa[] => casa?.fotos ?? [];

const registro = (valor: unknown): valor is Record<string, unknown> => typeof valor === "object" && valor !== null && !Array.isArray(valor);
const entre = (valor: unknown, minimo: number, maximo: number) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.max(minimo, Math.min(maximo, numero)) : null;
};

function normalizeGatito(raw: unknown): GatitoEnFoto | null {
  if (!registro(raw)) return null;
  const mundo = Number(raw.mundo);
  const x = entre(raw.x, 0, ANCHO);
  const y = entre(raw.y, 0, ALTO);
  if (!Number.isInteger(mundo) || mundo < 1 || mundo > 17 || x === null || y === null) return null;
  const animacion = typeof raw.animacion === "string" && Object.hasOwn(ANIMACIONES_GATO, raw.animacion) ? raw.animacion as AnimacionGato : "sentado";
  const cuadro = Math.floor(entre(raw.cuadro, 0, ANIMACIONES_GATO[animacion].cuadros - 1) ?? 0);
  const ropa = normalizeRopa(raw.ropa);
  return { mundo, x, y, animacion, cuadro, mira: raw.mira === -1 ? -1 : 1, sucio: raw.sucio === true, mejorAmigo: raw.mejorAmigo === true, arropado: raw.arropado === true, ...(ropa ? { ropa } : {}) };
}

/** Lectura tolerante de las fotos guardadas: las que no se entienden se quitan. */
export function normalizeFotos(raw: unknown): FotoCasa[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((foto): FotoCasa[] => {
    if (!registro(foto) || typeof foto.hecha !== "string" || !Number.isFinite(Date.parse(foto.hecha)) || !registro(foto.vista)) return [];
    const ancho = entre(foto.vista.ancho, 100, ANCHO);
    const x = entre(foto.vista.x, 0, ANCHO);
    if (ancho === null || x === null) return [];
    const gatitos = (Array.isArray(foto.gatitos) ? foto.gatitos : []).map(normalizeGatito).filter((g): g is GatitoEnFoto => g !== null).slice(0, MAX_GATITOS);
    return [{
      hecha: new Date(foto.hecha).toISOString(),
      vista: { x: Math.min(x, ANCHO - ancho), ancho },
      decoracion: normalizeDecoracion(foto.decoracion),
      noche: foto.noche === true,
      apagada: foto.noche === true && foto.apagada === true,
      gatitos,
    }];
  }).slice(0, MAX_FOTOS);
}
