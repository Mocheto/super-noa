/**
 * Comida favorita (mapa «Comida favorita de cada gatito»): cuatro comidas y la favorita de cada gatito de la casa. Con
 * hambre, cualquier comida le vale y da su corazón como siempre; con su favorita, además, se pone más contento y Noa la
 * descubre. Sin hambre, «ahora no» igual. Las descubiertas se guardan en el campo opcional `casa.favoritas`. Solo lógica.
 */
import { cuidar, type CasaProgress, type ResultadoCuidado } from "./casa.ts";

export const COMIDAS = ["pescado", "leche", "galletas", "pollo"] as const;
/** Lámina de las cuatro comidas en su cuenco, en el orden de `COMIDAS` (docs/art/casa-comida-v1.md). */
export const HOJA_COMIDAS = "./assets/sprites/casa-comidas-v1.webp";
export type Comida = (typeof COMIDAS)[number];

/** Favorita de cada gatito por número de mundo: repartidas para que dos mundos seguidos no tengan la misma. */
export const FAVORITA_DE: Readonly<Record<number, Comida>> = {
  1: "pescado", 2: "leche", 3: "galletas", 4: "pollo", 5: "leche", 6: "pescado", 7: "pollo", 8: "galletas", 9: "pescado",
  10: "galletas", 11: "leche", 12: "pollo", 13: "galletas", 14: "pescado", 15: "pollo", 16: "leche", 17: "pescado",
};

export const esComida = (valor: unknown): valor is Comida => (COMIDAS as readonly unknown[]).includes(valor);

/** La favorita del gatito si Noa ya la ha descubierto; si no, `null`. */
export const favoritaDescubierta = (casa: CasaProgress | undefined, mundo: number): Comida | null =>
  casa?.favoritas?.includes(mundo) ? FAVORITA_DE[mundo] ?? null : null;

export type ResultadoComida = ResultadoCuidado & {
  /** Comió su favorita con hambre: reacción especial. */
  favorita: boolean;
  /** Y era la primera vez: Noa acaba de descubrirla. */
  descubierta: boolean;
};

/** Noa le da al gatito del mundo dado una comida. */
export function darDeComer(casa: CasaProgress, mundo: number, comida: Comida, ahora: Date): ResultadoComida {
  const resultado = cuidar(casa, mundo, "comer", ahora);
  const favorita = resultado.respuesta === "gracias" && FAVORITA_DE[mundo] === comida;
  if (!favorita) return { ...resultado, favorita: false, descubierta: false };
  const ya = resultado.casa.favoritas ?? [];
  if (ya.includes(mundo)) return { ...resultado, favorita: true, descubierta: false };
  return { ...resultado, casa: { ...resultado.casa, favoritas: [...ya, mundo].sort((a, b) => a - b) }, favorita: true, descubierta: true };
}

/** Lectura tolerante de las favoritas descubiertas: solo gatitos de la casa, sin repetir. */
export function normalizeFavoritas(raw: unknown, esGatito: (mundo: number) => boolean): number[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const mundos = [...new Set(raw.map(Number).filter((mundo) => Number.isInteger(mundo) && esGatito(mundo)))].sort((a, b) => a - b);
  return mundos.length ? mundos : undefined;
}
