import { SAMPLE_IDS, sampleUrl, type SampleId } from "./beeNinja";

export type SampleBank = Record<SampleId, AudioBuffer>;

let loading: Promise<SampleBank | null> | null = null;

/**
 * Descarga y decodifica los sonidos definitivos del «jardín ninja». Se decodifican con un contexto sin conexión
 * para no necesitar un gesto de la jugadora; los buffers sirven luego en el contexto de la partida. Si algo falla
 * devuelve `null` y el duelo sigue con los sonidos de respaldo de la partitura.
 */
export function loadBeeSamples(): Promise<SampleBank | null> {
  loading ??= (async () => {
    try {
      const decoder = new OfflineAudioContext(1, 1, 32000);
      const entries = await Promise.all(SAMPLE_IDS.map(async (id) => {
        const response = await fetch(sampleUrl(id));
        if (!response.ok) throw new Error(`${id}: ${response.status}`);
        return [id, await decoder.decodeAudioData(await response.arrayBuffer())] as const;
      }));
      return Object.fromEntries(entries) as SampleBank;
    } catch (error) {
      console.warn("No se pudieron cargar los sonidos de la abeja ninja; suenan los de respaldo.", error);
      return null;
    }
  })().then((bank) => { if (!bank) loading = null; return bank; });
  return loading;
}
