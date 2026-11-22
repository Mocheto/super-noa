import { contextoAudio, despertarAudio } from "./audio.ts";

// Núcleo de audio de los cuatro minijuegos rítmicos (abeja ninja, tambor de Armonía, merienda de los jabatos y fiesta
// de los gatitos). Antes cada uno copiaba su `playNote`; lo único que cambiaba eran unos números, que ahora son el
// `PerfilSintesis` de cada juego. El grafo de cada nota es el mismo de siempre: fuente → [filtro] → ganancia → bus.

/** Sample grabado que sustituye a una nota sintetizada. */
export type MuestraRitmo<Id extends string = string> = { id: Id; gain: number; rate?: number };

/** Nota de cualquiera de los minijuegos rítmicos. Cada juego usa solo los campos que necesita. */
export type NotaRitmo<Id extends string = string> = {
  offset: number;
  frequency: number;
  duration: number;
  wave: OscillatorType;
  volume: number;
  bus: "music" | "cue";
  glideTo?: number;
  /** Ataque propio de la nota; si falta, el del perfil. */
  attack?: number;
  /** Ruido en lugar de oscilador: el nombre (o `true`) elige su filtro en el perfil. */
  noise?: string | boolean;
  /** Filtro explícito de la nota, sobre el ruido o el oscilador. */
  filter?: { type: BiquadFilterType; frequency: number };
  vibrato?: boolean;
  breath?: boolean;
  /** Con samples cargados: este sample en lugar de la nota; `null`, otro sample la sustituye. */
  sample?: MuestraRitmo<Id> | null;
};

export type BancoMuestras<Id extends string = string> = Record<Id, AudioBuffer>;

/** Lo que distinguía los cuatro `playNote`: números, no lógica. */
export type PerfilSintesis = {
  /** Ataque del oscilador en segundos. */
  ataque: number;
  /** Cuánto suena el ruido tras su duración antes de pararse. */
  colaRuido: number;
  /** Largo del búfer de ruido blanco. */
  segundosRuido: number;
  /** Filtro de cada tipo de ruido (`true` se busca como `"true"`); sin entrada, el ruido va sin filtro. */
  filtrosRuido: Readonly<Record<string, { type: BiquadFilterType; frequency: number }>>;
  /** Notas con `vibrato` (abeja): oscilador lento sobre la frecuencia y ataque más largo. */
  vibrato?: { hz: number; profundidad: number; ataque: number; cola: number };
  /** Notas con `breath` (merienda): vibrato suave y la nota sostenida hasta una fracción de su duración. */
  aliento?: { hz: number; profundidad: number; cola: number; sostener: number };
  /** La música va por un bus de tramo que se corta al pausar o terminar; sin él, directa al bus de música. */
  conTramo: boolean;
};

/** Buses de un minijuego sobre el contexto compartido. */
export type EquipoAudio = {
  context: AudioContext;
  perfil: PerfilSintesis;
  /** Salida del minijuego: desconectarla calla todo lo que tenga programado. */
  zona: GainNode;
  music: GainNode;
  segment: GainNode;
  cue: GainNode;
  noise: AudioBuffer;
};

/** Crea los buses del minijuego en el contexto compartido. `null` si no hay Web Audio. */
export function crearEquipo(perfil: PerfilSintesis, musica: number, efectos: number, context: AudioContext | null = contextoAudio()): EquipoAudio | null {
  if (!context) return null;
  const zona = context.createGain();
  const music = context.createGain();
  const cue = context.createGain();
  const segment = context.createGain();
  zona.connect(context.destination);
  music.connect(zona);
  cue.connect(zona);
  segment.connect(music);
  music.gain.value = musica;
  cue.gain.value = efectos;
  const noise = context.createBuffer(1, Math.floor(context.sampleRate * perfil.segundosRuido), context.sampleRate);
  const data = noise.getChannelData(0);
  for (let index = 0; index < data.length; index++) data[index] = Math.random() * 2 - 1;
  return { context, perfil, zona, music, segment, cue, noise };
}

/** Desconecta el minijuego del contexto compartido: lo que tuviera programado deja de oírse. */
export function liberarEquipo(equipo: EquipoAudio | null): void {
  if (!equipo) return;
  try { equipo.zona.disconnect(); } catch { /* ya desconectado */ }
}

/** Volúmenes de 0 a 1 de la música y los efectos. */
export function ponerVolumenes(equipo: EquipoAudio, musica: number, efectos: number): void {
  equipo.music.gain.value = musica;
  equipo.cue.gain.value = efectos;
}

/** Cada tramo de canción va por su propio bus: al pausar o terminar, las notas ya programadas se cortan. */
export function tramoNuevo(equipo: EquipoAudio): void {
  try { equipo.segment.disconnect(); } catch { /* ya desconectado */ }
  equipo.segment = equipo.context.createGain();
  equipo.segment.connect(equipo.music);
}

/** Reanuda el contexto compartido si hace falta. */
export const despertar = (equipo: EquipoAudio) => despertarAudio(equipo.context);

/** Programa una nota en `cuando + nota.offset` segundos del reloj de audio. */
export function tocarNota<Id extends string>(equipo: EquipoAudio, nota: NotaRitmo<Id>, cuando: number, banco: BancoMuestras<Id> | null = null): void {
  const { context, perfil } = equipo;
  const bus = nota.bus === "music" ? (perfil.conTramo ? equipo.segment : equipo.music) : equipo.cue;
  const start = cuando + nota.offset;
  const end = start + nota.duration;
  if (banco && nota.sample !== undefined) {
    if (nota.sample === null) return;
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = banco[nota.sample.id];
    source.playbackRate.value = nota.sample.rate ?? 1;
    gain.gain.value = nota.sample.gain;
    source.connect(gain).connect(bus);
    source.start(start);
    return;
  }
  if (nota.volume === 0) return; // nota que solo existe como sample
  const gain = context.createGain();
  gain.connect(bus);
  const filtro = nota.filter ?? (nota.noise ? perfil.filtrosRuido[String(nota.noise)] : undefined);
  let salida: AudioNode = gain;
  if (filtro) {
    const filter = context.createBiquadFilter();
    filter.type = filtro.type;
    filter.frequency.value = filtro.frequency;
    filter.connect(gain);
    salida = filter;
  }
  if (nota.noise) {
    const source = context.createBufferSource();
    source.buffer = equipo.noise;
    gain.gain.setValueAtTime(nota.volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    source.connect(salida);
    source.start(start);
    source.stop(end + perfil.colaRuido);
    return;
  }
  const oscillator = context.createOscillator();
  oscillator.type = nota.wave;
  oscillator.frequency.setValueAtTime(nota.frequency, start);
  if (nota.glideTo) oscillator.frequency.exponentialRampToValueAtTime(nota.glideTo, end);
  const vibrato = nota.vibrato ? perfil.vibrato : undefined;
  const aliento = nota.breath ? perfil.aliento : undefined;
  const ondulacion = vibrato ?? aliento;
  if (ondulacion) {
    const lfo = context.createOscillator();
    const depth = context.createGain();
    lfo.frequency.value = ondulacion.hz;
    depth.gain.value = nota.frequency * ondulacion.profundidad;
    lfo.connect(depth).connect(oscillator.frequency);
    lfo.start(start);
    lfo.stop(end + ondulacion.cola);
  }
  const ataque = nota.attack ?? vibrato?.ataque ?? perfil.ataque;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(nota.volume, start + ataque);
  if (aliento) gain.gain.setValueAtTime(nota.volume, Math.max(start + ataque, start + nota.duration * aliento.sostener));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  oscillator.connect(salida);
  oscillator.start(start);
  oscillator.stop(end + 0.03);
}

/** Toca unas notas ya, por el bus de efectos (respuesta a una pulsación). No hace nada si el audio está parado. */
export function tocarYa<Id extends string>(equipo: EquipoAudio | null, notas: readonly NotaRitmo<Id>[], banco: BancoMuestras<Id> | null = null): void {
  if (!equipo || equipo.context.state !== "running") return;
  for (const nota of notas) tocarNota(equipo, { ...nota, bus: "cue" }, equipo.context.currentTime + 0.003, banco);
}

/**
 * Cargador de los samples de un minijuego: los decodifica una vez y recuerda el resultado; si falla, avisa con
 * `alFallar`, devuelve `null` (suenan los osciladores de respaldo) y lo reintenta la próxima vez.
 */
export function cargadorMuestras<Id extends string>(ids: readonly Id[], url: (id: Id) => string, alFallar: (error: unknown) => void): () => Promise<BancoMuestras<Id> | null> {
  let cargando: Promise<BancoMuestras<Id> | null> | null = null;
  return () => {
    if (cargando) return cargando;
    cargando = (async () => {
      const decoder = new OfflineAudioContext(1, 1, 32000);
      const buffers = await Promise.all(ids.map(async (id) => {
        const response = await fetch(url(id));
        if (!response.ok) throw new Error(`${id}: ${response.status}`);
        return [id, await decoder.decodeAudioData(await response.arrayBuffer())] as const;
      }));
      return Object.fromEntries(buffers) as BancoMuestras<Id>;
    })().catch((error: unknown) => {
      alFallar(error);
      cargando = null;
      return null;
    });
    return cargando;
  };
}
