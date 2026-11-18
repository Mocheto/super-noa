/**
 * Palabras al recoger objetos (decisión «Palabras al recoger objetos»): al recoger algo, una etiqueta con el dibujo del
 * objeto y su palabra sale sobre Noa la primera vez de cada objeto en cada pantalla, durante 1 s y con 0,3 s de fundido.
 * Solo hay una a la vez: la nueva sustituye a la anterior. Usa el reloj del juego, así que se congela con la pausa.
 */
export type ObjetoConPalabra = "apple" | "sticker" | "cat" | "flag";

export const PALABRA_SEGUNDOS = 1;
export const PALABRA_FUNDIDO = 0.3;

/** Lo que hay que dibujar: qué objeto, con qué opacidad, cuánto ha subido (px) y a qué escala. */
export type CapaPalabra = { objeto: ObjetoConPalabra; alfa: number; subida: number; escala: number };

export function createPalabrasRecoger() {
  const vistos = new Set<ObjetoConPalabra>();
  let actual: { objeto: ObjetoConPalabra; segundos: number } | undefined;
  return {
    /** Devuelve si sale la palabra: solo la primera vez de cada objeto en la pantalla. */
    recoger(objeto: ObjetoConPalabra) {
      if (vistos.has(objeto)) return false;
      vistos.add(objeto);
      actual = { objeto, segundos: 0 };
      return true;
    },
    avanzar(delta: number) {
      if (!actual) return;
      actual.segundos += delta;
      if (actual.segundos >= PALABRA_SEGUNDOS + PALABRA_FUNDIDO) actual = undefined;
    },
    capa(tranquilo: boolean): CapaPalabra | undefined {
      if (!actual) return undefined;
      const { objeto, segundos } = actual;
      const alfa = segundos <= PALABRA_SEGUNDOS ? 1 : Math.max(0, 1 - (segundos - PALABRA_SEGUNDOS) / PALABRA_FUNDIDO);
      if (tranquilo) return { objeto, alfa: Math.min(alfa, segundos / 0.2), subida: 0, escala: 1 };
      return { objeto, alfa, subida: Math.min(segundos, PALABRA_SEGUNDOS) * 14, escala: segundos < 0.15 ? 0.8 + segundos / 0.15 * 0.2 : 1 };
    },
  };
}
