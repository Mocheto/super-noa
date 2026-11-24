/**
 * Fotos de la casa (mapa «Cámara de fotos de la casa»): una foto guarda como datos lo que se veía al hacerla (el trozo
 * de habitación, la decoración, la noche y cada gatito con su pose), y se vuelve a dibujar al mirarla. Se guardan las
 * doce últimas, la más nueva primero. Solo lógica: sin dibujo.
 */
import { MAX_FOTOS, normalizeFotos, type CasaProgress, type FotoCasa, type GatitoEnFoto } from "./casaProgreso.ts";

// Lo que guarda una foto y su lectura viven en `casaProgreso.ts`, fuera del bloque de la casa.
export { MAX_FOTOS, normalizeFotos };
export type { FotoCasa, GatitoEnFoto };

/** Guarda la foto delante de las demás; con más de doce, se va la más antigua. */
export const guardarFoto = (casa: CasaProgress, foto: FotoCasa): CasaProgress =>
  ({ ...casa, fotos: [foto, ...(casa.fotos ?? [])].slice(0, MAX_FOTOS) });

export const fotosDe = (casa: CasaProgress | undefined): FotoCasa[] => casa?.fotos ?? [];
