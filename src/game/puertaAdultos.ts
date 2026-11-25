/**
 * Puerta para adultos: una pregunta sencilla para una persona adulta y difícil para una niña de cinco años (una
 * multiplicación de dos cifras del 6 al 9) que protege apuntarse al tablón. Un fallo cambia la pregunta.
 */
export type PreguntaPuerta = { a: number; b: number };

export function preguntaPuerta(azar: () => number = Math.random): PreguntaPuerta {
  const cifra = () => 6 + Math.min(3, Math.floor(azar() * 4));
  return { a: cifra(), b: cifra() };
}

/** Solo vale el número exacto, con o sin espacios alrededor. */
export function respuestaPuerta(pregunta: PreguntaPuerta, respuesta: string): boolean {
  const limpia = respuesta.trim();
  return /^\d{1,3}$/.test(limpia) && Number(limpia) === pregunta.a * pregunta.b;
}
