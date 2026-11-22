import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { firstConnectedGamepad } from "./gamepad";
import { createPracticaConPausas, type ParadaPractica } from "./practicaPausas";
import { outputLatencySeconds } from "./rhythmEngine";
import { crearEquipo, despertar, liberarEquipo, ponerVolumenes, tocarNota, tocarYa, tramoNuevo, type BancoMuestras, type EquipoAudio, type NotaRitmo, type PerfilSintesis } from "./ritmoAudio";
import { avanzarRelojFotogramas, corcheasPendientes, flanco, inicioTrasPausa, numeroDeCuenta, pulsoDeAudio, type Tempo } from "./ritmoNucleo";

// Esqueleto común de los duelos rítmicos (abeja ninja, tambor de Armonía y merienda de los jabatos): escala del
// escenario, audio, reloj, pausa con cuenta al seguir, bucle de corcheas, práctica con paradas, mando y Espacio.
// Cada juego pone su sesión, su respuesta a la pulsación, lo que pasa en cada fotograma y su vista.

const RETRASO_INICIO_S = 0.15;

/** Campos de la sesión que lleva el esqueleto; cada juego añade los suyos. */
export type SesionRitmo<Run> = {
  run: Run;
  clock: "audio" | "frame";
  songStart: number;
  frameMs: number;
  countMs: number;
  countUntil: number | null;
  pausedAt: number | null;
  frozenPulse: number;
  lastPulse: number;
  nextEighth: number;
  ended: boolean;
};

export type OpcionesRitmo<Modo extends string, Run, Sesion extends SesionRitmo<Run>, Nota extends NotaRitmo<Id>, Vista, Id extends string = string> = {
  tempo: Tempo;
  perfil: PerfilSintesis;
  /** Samples grabados del juego, si los tiene. */
  muestras?: () => Promise<BancoMuestras<Id> | null>;
  /** Pausa de fuera (App): ocultar la pestaña, perder el foco, Escape. */
  paused: boolean;
  muted: boolean;
  musicVolume: number;
  effectsVolume: number;
  anchoEscena: number;
  paradas: Record<Modo, ParadaPractica[]>;
  /** Sesión nueva: el juego crea su partida y añade sus campos a los del esqueleto. */
  crearSesion: (modo: Modo, base: Omit<SesionRitmo<Run>, "run">) => Sesion;
  largo: (run: Run) => number;
  musicaDeCorchea: (run: Run, corchea: number) => Nota[];
  /** Notas de cada pulso de la cuenta al seguir tras una pausa. */
  cuenta: (primera: boolean) => Nota[];
  /** ¿Cuenta ahora una pulsación de la jugadora? (no en la demostración automática). */
  sePuedePulsar: (sesion: Sesion, pulso: number) => boolean;
  alPulsar: (sesion: Sesion, pulso: number) => void;
  /** Lo propio de cada fotograma sin cuenta: pulsaciones automáticas de la demostración, piezas que se escapan… */
  alFotograma: (sesion: Sesion, pulso: number) => void;
  vista: (sesion: Sesion, pulso: number, contando: number) => Vista;
  vistaVacia: Vista;
  alEmpezar: (modo: Modo) => void;
  alTerminar: (sesion: Sesion) => void;
  /** Clase del botón de golpe: el Espacio sobre otro botón no golpea. */
  claseBotonGolpe: string;
};

export function useMinijuegoRitmico<Modo extends string, Run, Sesion extends SesionRitmo<Run>, Nota extends NotaRitmo<Id>, Vista, Id extends string = string>(
  opciones: OpcionesRitmo<Modo, Run, Sesion, Nota, Vista, Id>,
) {
  const { tempo, paused, muted, musicVolume, effectsVolume } = opciones;
  // Las funciones del juego cambian en cada render; el bucle y la pausa leen siempre las últimas.
  const opcionesRef = useRef(opciones);
  useLayoutEffect(() => { opcionesRef.current = opciones; });

  const sessionRef = useRef<Sesion | null>(null);
  const audioRef = useRef<EquipoAudio | null>(null);
  const samplesRef = useRef<BancoMuestras<Id> | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const practicaRef = useRef<ReturnType<typeof createPracticaConPausas> | null>(null);
  const wasPausedRef = useRef(false);
  const [scale, setScale] = useState(1);
  const [mode, setMode] = useState<Modo | null>(null);
  const [clockKind, setClockKind] = useState<"audio" | "frame" | null>(null);
  const [view, setView] = useState<Vista>(opciones.vistaVacia);
  const [showLeave, setShowLeave] = useState(false);
  const [parada, setParada] = useState<ParadaPractica | null>(null);
  const interactionPaused = paused || showLeave || parada !== null;

  useLayoutEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const ancho = opcionesRef.current.anchoEscena;
    const update = () => setScale(element.clientWidth / ancho);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Los sonidos definitivos se cargan al entrar; hasta que estén (o si fallan) suenan los osciladores de respaldo.
  useEffect(() => {
    const cargar = opcionesRef.current.muestras;
    if (!cargar) return;
    let alive = true;
    void cargar().then((bank) => { if (alive) samplesRef.current = bank; });
    return () => { alive = false; };
  }, []);

  useEffect(() => () => {
    sessionRef.current = null;
    liberarEquipo(audioRef.current);
    audioRef.current = null;
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    ponerVolumenes(audio, muted ? 0 : musicVolume / 100, muted ? 0 : effectsVolume / 100);
  }, [effectsVolume, musicVolume, muted, mode]);

  /** Cada tramo de canción va por su propio bus: al pausar o terminar, las notas ya programadas se cortan. */
  const freshSegment = useCallback(() => {
    if (audioRef.current) tramoNuevo(audioRef.current);
  }, []);

  const ensureAudio = useCallback(async () => {
    if (muted) return false;
    try {
      audioRef.current ??= crearEquipo(opcionesRef.current.perfil, musicVolume / 100, effectsVolume / 100);
      return audioRef.current ? await despertar(audioRef.current) : false;
    } catch {
      return false;
    }
  }, [effectsVolume, musicVolume, muted]);

  const playNote = useCallback((note: Nota, when: number) => {
    if (audioRef.current) tocarNota(audioRef.current, note, when, samplesRef.current);
  }, []);

  /** Notas que suenan ya, por los efectos: la respuesta a una pulsación. */
  const playCue = useCallback((notes: readonly Nota[]) => tocarYa(audioRef.current, notes, samplesRef.current), []);

  const pulseNow = useCallback((session: Sesion) => {
    if (session.countUntil !== null || session.countMs > 0 || session.pausedAt !== null) return session.frozenPulse;
    const audio = audioRef.current;
    if (session.clock === "audio" && audio && audio.context.state === "running") {
      return pulsoDeAudio(tempo, audio.context.currentTime, session.songStart, outputLatencySeconds(audio.context));
    }
    if (session.clock === "audio") return session.lastPulse;
    return session.frameMs / tempo.pulsoMs;
  }, [tempo]);

  const finish = useCallback((session: Sesion) => {
    session.ended = true;
    if (audioRef.current) freshSegment();
    setMode(null);
    setParada(null);
    opcionesRef.current.alTerminar(session);
  }, [freshSegment]);

  const strike = useCallback(() => {
    const session = sessionRef.current;
    if (!session || session.ended || interactionPaused || session.countUntil !== null || session.countMs > 0) return;
    const pulse = pulseNow(session);
    if (!opcionesRef.current.sePuedePulsar(session, pulse)) return;
    opcionesRef.current.alPulsar(session, pulse);
  }, [interactionPaused, pulseNow]);

  const begin = useCallback(async (nextMode: Modo) => {
    const { crearSesion, paradas, alEmpezar, vistaVacia } = opcionesRef.current;
    const session = crearSesion(nextMode, {
      clock: "frame", songStart: 0, frameMs: -RETRASO_INICIO_S * 1000, countMs: 0, countUntil: null, pausedAt: null, frozenPulse: 0,
      lastPulse: -1, nextEighth: 0, ended: false,
    });
    sessionRef.current = session;
    practicaRef.current = createPracticaConPausas(paradas[nextMode]);
    setParada(null);
    alEmpezar(nextMode);
    setView(vistaVacia);
    const audioReady = await ensureAudio();
    if (sessionRef.current !== session) return;
    if (audioReady && audioRef.current) {
      freshSegment();
      session.clock = "audio";
      session.songStart = audioRef.current.context.currentTime + RETRASO_INICIO_S;
    }
    setClockKind(session.clock);
    setMode(nextMode);
  }, [ensureAudio, freshSegment]);

  /** SIGUE en una parada de la práctica: continúa con la cuenta del guardián. */
  const seguirParada = useCallback(() => {
    practicaRef.current?.seguir();
    setParada(null);
  }, []);

  // Pausa (de App, de la ventana de salir o de una parada de la práctica): todo se congela; al seguir, el guardián
  // cuenta unos pulsos antes de que la canción continúe donde iba.
  useEffect(() => {
    const session = sessionRef.current;
    const audio = audioRef.current;
    if (!mode || !session || session.ended) { wasPausedRef.current = interactionPaused; return; }
    if (interactionPaused && !wasPausedRef.current) {
      session.frozenPulse = pulseNow(session);
      if (session.clock === "audio" && audio) {
        session.pausedAt = audio.context.currentTime;
        freshSegment();
        void audio.context.suspend().catch(() => {});
      } else session.pausedAt = 0;
    } else if (!interactionPaused && wasPausedRef.current && session.pausedAt !== null) {
      const pausedAt = session.pausedAt;
      if (session.clock === "audio" && audio) {
        void audio.context.resume().then(() => {
          if (sessionRef.current !== session) return;
          const countStart = audio.context.currentTime + 0.05;
          for (let index = 0; index < tempo.pulsosCuenta; index++) for (const note of opcionesRef.current.cuenta(index === 0)) playNote(note, countStart + index * tempo.pulsoMs / 1000);
          session.songStart = inicioTrasPausa(tempo, session.songStart, pausedAt, countStart);
          session.countUntil = countStart + tempo.pulsosCuenta * tempo.pulsoMs / 1000;
          session.nextEighth = Math.max(0, Math.ceil(session.frozenPulse * 2));
          session.pausedAt = null;
        }).catch(() => { session.pausedAt = null; });
      } else {
        session.countMs = tempo.pulsosCuenta * tempo.pulsoMs;
        session.pausedAt = null;
      }
    }
    wasPausedRef.current = interactionPaused;
  }, [freshSegment, interactionPaused, mode, playNote, pulseNow, tempo]);

  useEffect(() => {
    if (!mode || interactionPaused) return;
    let frame = 0;
    let last: number | null = null;
    let padDown = Boolean(firstConnectedGamepad()?.buttons[0]?.pressed);
    const update = (now: number) => {
      const session = sessionRef.current;
      if (!session || session.ended) return;
      const juego = opcionesRef.current;
      const delta = last === null ? 0 : now - last;
      last = now;
      if (session.clock === "frame" && session.pausedAt === null) {
        const next = avanzarRelojFotogramas({ frameMs: session.frameMs, countMs: session.countMs }, delta);
        session.frameMs = next.frameMs;
        session.countMs = next.countMs;
      }
      const audio = audioRef.current;
      let counting = 0;
      if (session.countUntil !== null && audio) {
        const left = session.countUntil - audio.context.currentTime;
        if (left <= 0) session.countUntil = null;
        else counting = numeroDeCuenta(tempo, left * 1000);
      } else if (session.countMs > 0) counting = numeroDeCuenta(tempo, session.countMs);
      if (session.clock === "audio" && audio && audio.context.state === "running" && session.pausedAt === null) {
        const corcheas = corcheasPendientes(tempo, session.songStart, session.nextEighth, juego.largo(session.run) * 2, audio.context.currentTime);
        session.nextEighth = corcheas.siguiente;
        for (const { corchea, cuando } of corcheas.pendientes) for (const note of juego.musicaDeCorchea(session.run, corchea)) playNote(note, cuando);
      }
      const pulse = pulseNow(session);
      session.lastPulse = pulse;
      // Práctica: al llegar una pieza nueva se detiene y la explica; sigue al tocar SIGUE (con la cuenta del guardián).
      const nueva = !counting && mode !== "song" ? practicaRef.current?.llegar(pulse) : undefined;
      if (nueva) {
        setView(juego.vista(session, pulse, 0));
        setParada(nueva);
        return;
      }
      if (!counting) juego.alFotograma(session, pulse);
      const down = Boolean(firstConnectedGamepad()?.buttons[0]?.pressed);
      if (flanco(padDown, down)) strike();
      padDown = down;
      if (!counting && pulse >= juego.largo(session.run)) {
        setView(juego.vista(session, pulse, 0));
        finish(session);
        return;
      }
      setView(juego.vista(session, pulse, counting));
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space" || mode === "demo") return;
      const button = event.target instanceof Element ? event.target.closest("button") : null;
      if (button && !button.classList.contains(opcionesRef.current.claseBotonGolpe)) return;
      event.preventDefault();
      if (!event.repeat) strike();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
    };
  }, [finish, interactionPaused, mode, playNote, pulseNow, strike, tempo]);

  return { frameRef, scale, mode, clockKind, view, parada, seguirParada, showLeave, setShowLeave, interactionPaused, begin, strike, finish, playCue, sessionRef };
}
