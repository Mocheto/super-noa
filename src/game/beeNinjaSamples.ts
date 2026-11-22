import { SAMPLE_IDS, sampleUrl, type SampleId } from "./beeNinja.ts";
import { cargadorMuestras, type BancoMuestras } from "./ritmoAudio.ts";

export type SampleBank = BancoMuestras<SampleId>;

/**
 * Descarga y decodifica los sonidos definitivos del «jardín ninja». Se decodifican con un contexto sin conexión
 * para no necesitar un gesto de la jugadora; los buffers sirven luego en el contexto de la partida. Si algo falla
 * devuelve `null` y el duelo sigue con los sonidos de respaldo de la partitura.
 */
export const loadBeeSamples = cargadorMuestras(SAMPLE_IDS, sampleUrl, (error) =>
  console.warn("No se pudieron cargar los sonidos de la abeja ninja; suenan los de respaldo.", error));
