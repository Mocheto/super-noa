/**
 * El clima de la casa (mapa «Idea: clima en la ventana», issue 345): sol, lluvia, nieve o arcoíris según el día, sin
 * internet. Sale de la fecha local, así que es el mismo todo el día; del 1 de diciembre al 6 de enero la nieve sustituye
 * a la lluvia. Solo lógica: el dibujo está en `casaClimaArte.ts`.
 */
import { CLIMAS, esClima, fechaLocal, type Clima } from "./casaProgreso.ts";

export { CLIMAS, esClima };
export type { Clima };

/** Reparto de los días: sol 6 de cada 10, lluvia (o nieve) 1 de cada 4 y arcoíris el resto. */
export const PARTE_SOL = 0.6;
export const PARTE_LLUVIA = 0.25;

/** Con lluvia o nieve, al decidir qué hacer, un gatito va a la ventana con esta probabilidad (si está libre). */
export const IR_A_LA_VENTANA = 0.35;

/** Número en [0, 1) fijo para cada día (FNV-1a de «AAAA-MM-DD» con una mezcla final). */
export function azarDelDia(dia: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < dia.length; i++) {
    h ^= dia.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 2 ** 32;
}

/** Del 1 de diciembre al 6 de enero (Navidad), la lluvia es nieve. */
export const temporadaDeNieve = (fecha: Date) => fecha.getMonth() === 11 || (fecha.getMonth() === 0 && fecha.getDate() <= 6);

export function climaDelDia(fecha: Date): Clima {
  const tirada = azarDelDia(fechaLocal(fecha));
  if (tirada < PARTE_SOL) return "sol";
  if (tirada < PARTE_SOL + PARTE_LLUVIA) return temporadaDeNieve(fecha) ? "nieve" : "lluvia";
  return "arcoiris";
}

/** De noche el arcoíris no se ve; la lluvia y la nieve siguen. */
export const climaQueSeVe = (clima: Clima, noche: boolean): Clima => noche && clima === "arcoiris" ? "sol" : clima;

/** Con lluvia o nieve los gatitos van más a mirar por la ventana. */
export const miranPorLaVentana = (clima: Clima) => clima === "lluvia" || clima === "nieve";

/** `?casaClima=lluvia` fuerza el clima para probarlo; si no, `null`. */
export function climaDePrueba(busqueda: string | null): Clima | null {
  const valor = new URLSearchParams(busqueda ?? "").get("casaClima");
  return esClima(valor) ? valor : null;
}
