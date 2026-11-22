import { SAMPLE_IDS, sampleUrl, type SampleId } from "./catParty.ts";
import { cargadorMuestras, type BancoMuestras } from "./ritmoAudio.ts";

export type SampleBank = BancoMuestras<SampleId>;

/**
 * Descarga y decodifica los sonidos definitivos de la fiesta. Se decodifican con un contexto sin conexión para no
 * necesitar un gesto de la jugadora; los buffers sirven luego en el contexto de la partida. Si algo falla devuelve
 * `null` y el juego sigue con los sonidos de respaldo de la partitura.
 */
export const loadPartySamples = cargadorMuestras(SAMPLE_IDS, sampleUrl, (error) =>
  console.warn("No se pudieron cargar los sonidos de la fiesta; suenan los de respaldo.", error));
