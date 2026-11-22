import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { crearEquipo, despertar, liberarEquipo, ponerVolumenes, tocarNota, tocarYa, tramoNuevo, type EquipoAudio } from "./ritmoAudio";
import { bossCatalog } from "./bosses";
import { cssAssetUrl } from "./assets";
import { Dialog } from "./Dialog";
import type { SoundKind } from "./GameCanvas";
import { firstConnectedGamepad } from "./gamepad";
import {
  COUNT_PULSES, CUT_POINT, HERO, PERFIL_ABEJA, PLOF_SOUND, PULSE_MS, UY_SOUND, cutSound, RESUME_COUNT_PULSES, WIN_AT, advanceFrameClock, audioPulse, autoCuts, barOfPulse, beeScores,
  collectFalls, COUNT_TICK, createRun, flowersIn, jarLevel, leadNote, musicForEighth, nextOpenCut, outcomeOf, outputLatencySeconds,
  practiceFirst, pressAt, risingEdge, scoreLength, songStartAfterPause, targetPlacement, targetVisible, throwPulses,
  type BeeMode, type BeeNote, type BeeRun, type Outcome, type PressResult,
} from "./beeNinja";
import { loadBeeSamples, type SampleBank } from "./beeNinjaSamples";
import "./beeNinja.css";
import { t } from "../textos/index.ts";
import { Boton, BotonControl, Pictograma, Texto } from "../textos/Texto";
import { informeRitmo, PantallaPrevia, ResultadoMinijuego } from "./minijuegoComun";
import { createPracticaConPausas, type ParadaPractica } from "./practicaPausas";
import { Ventana } from "./Ventana";

type Props = {
  paused: boolean;
  muted: boolean;
  musicVolume: number;
  effectsVolume: number;
  reduceMotion: boolean;
  levelCompleted: boolean;
  onAbandon: () => void;
  onWin: (challengeCompleted: boolean) => void;
  playSound: (kind: SoundKind) => void;
  friendlyReplay?: boolean;
};

type Half = { id: number; color: number; start: number };
type Session = {
  run: BeeRun;
  clock: "audio" | "frame";
  songStart: number;
  frameMs: number;
  countMs: number;
  countUntil: number | null;
  pausedAt: number | null;
  frozenPulse: number;
  lastPulse: number;
  nextEighth: number;
  cutUntil: number;
  greet: { x: number; y: number; until: number } | null;
  feedback: { text: string; miss: boolean; until: number } | null;
  applaudFrom: number | null;
  celebrateUntil: number;
  lastJar: number;
  /** Pulso hasta el que cae una gota del tarro tras una pulsación vacía. */
  gotaUntil: number;
  /** La demostración ya ha enseñado su pulsación vacía. */
  demoVacia: boolean;
  halves: Half[];
  halfId: number;
  ended: boolean;
};
type TargetView = { id: number; kind: "flower" | "ladybug"; color: number; x: number; y: number; rotation: number; opacity: number };
type View = {
  pulse: number;
  targets: TargetView[];
  halves: Half[];
  jar: number;
  gota: boolean;
  ring: { scale: number; ready: boolean } | null;
  lamp: number;
  heroPose: "espera" | "alza" | "corta" | "celebra";
  melisaPose: number;
  melisaThrowing: boolean;
  melisaBubble: string | null;
  greet: { x: number; y: number } | null;
  feedback: { text: string; miss: boolean } | null;
  phase: { name: string; piece: "flower" | "duo" | "ladybug" } | null;
  counting: number;
};

const START_DELAY_S = 0.15;
const STAGE_WIDTH = 960;
const emptyView: View = { pulse: -1, targets: [], halves: [], jar: 0, gota: false, ring: null, lamp: -1, heroPose: "espera", melisaPose: 0, melisaThrowing: false, melisaBubble: null, greet: null, feedback: null, phase: null, counting: 0 };

/** La demostración enseña una pulsación vacía en este pulso, sin flor delante, y se para medio pulso después. */
const DEMO_VACIA_PULSO = 15.5;
/** La práctica se detiene en cada pieza nueva (pulso en que llega a la varita) y explica cómo se corta. */
const PARADAS: Record<BeeMode, ParadaPractica[]> = {
  demo: [{ pulso: 4, pieza: "flor" }, { pulso: 8, pieza: "duo" }, { pulso: 12, pieza: "mariquita" }, { pulso: DEMO_VACIA_PULSO + 0.5, pieza: "vacia" }],
  practice: [{ pulso: 4, pieza: "flor" }, { pulso: 12, pieza: "duo" }, { pulso: 16, pieza: "mariquita" }],
  song: [],
};
const CLAVE_PARADA = {
  flor: { rotulo: "minijuegos.abeja.practica.flor.rotulo", juntos: "minijuegos.abeja.practica.flor.juntos" },
  duo: { rotulo: "minijuegos.abeja.practica.duo.rotulo", juntos: "minijuegos.abeja.practica.duo.juntos" },
  mariquita: { rotulo: "minijuegos.abeja.practica.mariquita.rotulo", juntos: "minijuegos.abeja.practica.mariquita.juntos" },
  vacia: { rotulo: "minijuegos.abeja.practica.vacia.rotulo", juntos: "minijuegos.abeja.practica.vacia.juntos" },
} as const;

const RESULT_TEXT = {
  perfecto: { title: "minijuegos.abeja.resultado.perfecto.rotulo", text: "minijuegos.abeja.resultado.perfecto.juntos" },
  bien: { title: "minijuegos.abeja.resultado.bien.rotulo", text: "minijuegos.abeja.resultado.bien.juntos" },
  casi: { title: "minijuegos.abeja.resultado.casi.rotulo", text: "minijuegos.abeja.resultado.casi.juntos" },
} as const satisfies Record<Outcome["result"], { title: string; text: string }>;

/** Arte que usa la hoja de estilos, con rutas relativas al sitio publicado. */
const STAGE_ART = {
  "--flores": cssAssetUrl("./assets/sprites/flores-abeja-v1.webp"),
  "--mariquita": cssAssetUrl("./assets/sprites/mariquita-v1.webp"),
} as CSSProperties;
/** Rejilla de `flores-abeja-v1.webp`: columna = color; filas = entera, mitad izquierda, mitad derecha y pétalo. */
const flowerSprite = (color: number, row: 0 | 1 | 2 | 3): CSSProperties => ({ backgroundPosition: `${(color % 4) * 100 / 3}% ${row * 100 / 3}%` });

function snapshot(session: Session, pulse: number, counting: number, reduceMotion: boolean): View {
  const { run } = session;
  const whole = Math.floor(pulse);
  const targets = run.targets.filter((target) => targetVisible(target, pulse)).map((target) => {
    const place = targetPlacement(target, pulse, reduceMotion);
    return { id: target.id, kind: target.kind, color: target.color, x: place.x, y: place.y, rotation: place.rotation, opacity: place.opacity };
  });
  const untilCut = nextOpenCut(run, pulse) - pulse;
  const ring = untilCut <= 1 && untilCut > -0.3 ? { scale: reduceMotion ? 1 : 1 + Math.max(0, untilCut) * 1.4, ready: Math.abs(untilCut) <= 0.3 } : null;
  const throwing = run.score.items.find((item) => throwPulses(item)[0] === whole && pulse - whole < 0.35);
  const introCount = pulse >= 0 && pulse < COUNT_PULSES && pulse - whole < 0.65 ? whole + 1 : 0;
  const shownCount = counting || introCount;
  const applauding = session.applaudFrom !== null && pulse - session.applaudFrom < 2;
  const heroPose = session.cutUntil > pulse ? "corta" : session.celebrateUntil > pulse ? "celebra" : untilCut <= 1 && untilCut > 0.1 ? "alza" : "espera";
  // El cartel de fase solo dura el primer compás de la fase.
  const phase = counting ? null : run.score.phases.find(({ fromBar }) => barOfPulse(Math.max(0, whole)) === fromBar) ?? null;
  return {
    pulse, targets, ring, phase, counting,
    halves: session.halves.filter((half) => pulse - half.start < 0.9),
    jar: jarLevel(run.cuenta.raya),
    gota: session.gotaUntil > pulse,
    lamp: pulse >= 0 && !counting ? whole % 4 : -1,
    heroPose,
    melisaPose: shownCount ? (shownCount % 2 ? 1 : 3) : applauding ? 2 : throwing ? 1 : 0,
    melisaThrowing: Boolean(throwing) && !shownCount,
    melisaBubble: shownCount ? String(shownCount) : applauding ? t("minijuegos.abeja.compas.bravo.rotulo") : throwing ? t(throwing.type === "duo" ? "minijuegos.abeja.compas.zumzum.rotulo" : "minijuegos.abeja.compas.zum.rotulo") : null,
    greet: session.greet && session.greet.until > pulse ? { x: session.greet.x, y: session.greet.y } : null,
    feedback: session.feedback && session.feedback.until > pulse ? { text: session.feedback.text, miss: session.feedback.miss } : null,
  };
}

export function BeeNinjaGame({ paused, muted, musicVolume, effectsVolume, reduceMotion, levelCompleted, onAbandon, onWin, playSound, friendlyReplay = false }: Props) {
  const sessionRef = useRef<Session | null>(null);
  const [informe, setInforme] = useState<string>();
  const audioRef = useRef<EquipoAudio | null>(null);
  const samplesRef = useRef<SampleBank | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [mode, setMode] = useState<BeeMode | null>(null);
  const [finished, setFinished] = useState<{ mode: BeeMode; outcome: Outcome } | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [clockKind, setClockKind] = useState<"audio" | "frame" | null>(null);
  const [view, setView] = useState<View>(emptyView);
  const [showLeave, setShowLeave] = useState(false);
  const [parada, setParada] = useState<ParadaPractica | null>(null);
  const practicaRef = useRef<ReturnType<typeof createPracticaConPausas> | null>(null);
  const interactionPaused = paused || showLeave || parada !== null;
  const wasPausedRef = useRef(false);
  const boss = bossCatalog["queen-bee"];

  useLayoutEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const update = () => setScale(element.clientWidth / STAGE_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Los sonidos definitivos se cargan al entrar; hasta que estén (o si fallan) suenan los osciladores de respaldo.
  useEffect(() => {
    let alive = true;
    void loadBeeSamples().then((bank) => { if (alive) samplesRef.current = bank; });
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
      audioRef.current ??= crearEquipo(PERFIL_ABEJA, musicVolume / 100, effectsVolume / 100);
      return audioRef.current ? await despertar(audioRef.current) : false;
    } catch {
      return false;
    }
  }, [effectsVolume, musicVolume, muted]);

  const playNote = useCallback((note: BeeNote, when: number) => {
    if (audioRef.current) tocarNota(audioRef.current, note, when, samplesRef.current);
  }, []);

  const playCue = useCallback((notes: BeeNote[]) => tocarYa(audioRef.current, notes, samplesRef.current), []);

  const pulseNow = useCallback((session: Session) => {
    if (session.countUntil !== null || session.countMs > 0 || session.pausedAt !== null) return session.frozenPulse;
    const audio = audioRef.current;
    if (session.clock === "audio" && audio && audio.context.state === "running") {
      return audioPulse(audio.context.currentTime, session.songStart, outputLatencySeconds(audio.context));
    }
    if (session.clock === "audio") return session.lastPulse;
    return session.frameMs / PULSE_MS;
  }, []);

  const react = useCallback((session: Session, result: PressResult, pulse: number) => {
    session.cutUntil = pulse + 0.3;
    if (result.kind === "cut") {
      playCue(cutSound(leadNote(session.run)));
      session.feedback = { text: t("minijuegos.abeja.compas.zas.rotulo"), miss: false, until: pulse + 0.5 };
      session.halves.push({ id: session.halfId++, color: result.target.color, start: pulse });
      if (session.run.mode === "song") {
        const level = jarLevel(session.run.cuenta.raya);
        if (level > session.lastJar) { session.lastJar = level; session.celebrateUntil = pulse + 0.9; }
        if (session.run.cuenta.raya === WIN_AT && session.applaudFrom === null) session.applaudFrom = pulse;
      }
    } else if (result.kind === "ladybug") {
      session.cutUntil = -Infinity;
      const place = targetPlacement(result.target, pulse, reduceMotion);
      session.greet = { x: place.x, y: place.y, until: pulse + 1.2 };
      session.gotaUntil = pulse + 0.6;
      session.lastJar = Math.min(session.lastJar, jarLevel(session.run.cuenta.raya));
    } else if (result.kind === "empty") {
      // Pulsación vacía: «¡UY!» y cae una gota del tarro (en la práctica solo se ve; en la canción, además, resta).
      playCue(UY_SOUND);
      session.feedback = { text: t("minijuegos.abeja.compas.uy.rotulo"), miss: true, until: pulse + 0.5 };
      session.gotaUntil = pulse + 0.6;
      session.lastJar = Math.min(session.lastJar, jarLevel(session.run.cuenta.raya));
    } else session.cutUntil = -Infinity;
  }, [playCue, reduceMotion]);

  const finish = useCallback((session: Session) => {
    session.ended = true;
    if (audioRef.current) freshSegment();
    const outcome = outcomeOf(session.run);
    setMode(null);
    setFinished({ mode: session.run.mode, outcome });
    setInforme(session.run.mode === "song" ? informeRitmo({ aciertos: session.run.cut, total: flowersIn(session.run.score), vacias: session.run.cuenta.vacias, raya: session.run.cuenta.raya, meta: WIN_AT }) : undefined);
    setParada(null);
    if (session.run.mode === "song") playSound(outcome.won ? "checkpoint" : "hurt");
  }, [freshSegment, playSound]);

  const strike = useCallback(() => {
    const session = sessionRef.current;
    if (!session || session.ended || interactionPaused || session.run.mode === "demo" || session.countUntil !== null || session.countMs > 0) return;
    const pulse = pulseNow(session);
    if (pulse < 0) return;
    react(session, pressAt(session.run, pulse), pulse);
  }, [interactionPaused, pulseNow, react]);

  const begin = async (nextMode: BeeMode) => {
    const session: Session = {
      run: createRun(nextMode), clock: "frame", songStart: 0, frameMs: -START_DELAY_S * 1000, countMs: 0, countUntil: null, pausedAt: null, frozenPulse: 0,
      lastPulse: -1, nextEighth: 0, cutUntil: -Infinity, greet: null, feedback: null, applaudFrom: null, celebrateUntil: -Infinity, lastJar: 0, gotaUntil: -Infinity, demoVacia: false, halves: [], halfId: 0, ended: false,
    };
    sessionRef.current = session;
    practicaRef.current = createPracticaConPausas(PARADAS[nextMode]);
    setParada(null);
    if (nextMode === "song") setAttempted(true);
    setFinished(null);
    setView(emptyView);
    const audioReady = await ensureAudio();
    if (sessionRef.current !== session) return;
    if (audioReady && audioRef.current) {
      freshSegment();
      session.clock = "audio";
      session.songStart = audioRef.current.context.currentTime + START_DELAY_S;
    }
    setClockKind(session.clock);
    setMode(nextMode);
  };

  // Pausa (de App o al preguntar si volvemos al mapa): todo se congela; al seguir, Melisa cuenta cuatro pulsos.
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
          for (let index = 0; index < RESUME_COUNT_PULSES; index++) for (const note of COUNT_TICK(index === 0)) playNote(note, countStart + index * PULSE_MS / 1000);
          session.songStart = songStartAfterPause(session.songStart, pausedAt, countStart);
          session.countUntil = countStart + RESUME_COUNT_PULSES * PULSE_MS / 1000;
          session.nextEighth = Math.max(0, Math.ceil(session.frozenPulse * 2));
          session.pausedAt = null;
        }).catch(() => { session.pausedAt = null; });
      } else {
        session.countMs = RESUME_COUNT_PULSES * PULSE_MS;
        session.pausedAt = null;
      }
    }
    wasPausedRef.current = interactionPaused;
  }, [freshSegment, interactionPaused, mode, playNote, pulseNow]);

  useEffect(() => {
    if (!mode || interactionPaused) return;
    let frame = 0;
    let last: number | null = null;
    let padDown = Boolean(firstConnectedGamepad()?.buttons[0]?.pressed);
    const update = (now: number) => {
      const session = sessionRef.current;
      if (!session || session.ended) return;
      const delta = last === null ? 0 : now - last;
      last = now;
      if (session.clock === "frame" && session.pausedAt === null) {
        const next = advanceFrameClock({ frameMs: session.frameMs, countMs: session.countMs }, delta);
        session.frameMs = next.frameMs;
        session.countMs = next.countMs;
      }
      const audio = audioRef.current;
      let counting = 0;
      if (session.countUntil !== null && audio) {
        const left = session.countUntil - audio.context.currentTime;
        if (left <= 0) session.countUntil = null;
        else counting = RESUME_COUNT_PULSES - Math.floor(left * 1000 / PULSE_MS);
      } else if (session.countMs > 0) counting = RESUME_COUNT_PULSES - Math.floor(session.countMs / PULSE_MS);
      if (session.clock === "audio" && audio && audio.context.state === "running" && session.pausedAt === null) {
        const horizon = audio.context.currentTime + 0.25;
        const total = scoreLength(session.run.score) * 2;
        while (session.nextEighth < total) {
          const when = session.songStart + session.nextEighth * PULSE_MS / 2000;
          if (when > horizon) break;
          const eighth = session.nextEighth++;
          if (when < audio.context.currentTime - 0.02) continue;
          for (const note of musicForEighth(session.run, eighth)) playNote(note, when);
        }
      }
      const pulse = pulseNow(session);
      session.lastPulse = pulse;
      // Práctica: al llegar una pieza nueva se detiene y la explica; sigue al tocar SIGUE (con la cuenta de Melisa).
      const nueva = !counting && session.run.mode !== "song" ? practicaRef.current?.llegar(pulse) : undefined;
      if (nueva) {
        setView(snapshot(session, pulse, 0, reduceMotion));
        setParada(nueva);
        return;
      }
      if (!counting) {
        if (session.run.mode === "demo") {
          for (const result of autoCuts(session.run, pulse)) react(session, result, pulse);
          if (!session.demoVacia && pulse >= DEMO_VACIA_PULSO) { session.demoVacia = true; react(session, { kind: "empty", resta: false }, pulse); }
        }
        else if (collectFalls(session.run, pulse).length) {
          playCue(PLOF_SOUND);
          session.feedback = { text: t("minijuegos.abeja.compas.plof.rotulo"), miss: true, until: pulse + 0.6 };
        }
      }
      const down = Boolean(firstConnectedGamepad()?.buttons[0]?.pressed);
      if (risingEdge(padDown, down)) strike();
      padDown = down;
      if (!counting && pulse >= scoreLength(session.run.score)) {
        setView(snapshot(session, pulse, 0, reduceMotion));
        finish(session);
        return;
      }
      setView(snapshot(session, pulse, counting, reduceMotion));
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space" || mode === "demo") return;
      const button = event.target instanceof Element ? event.target.closest("button") : null;
      if (button && !button.classList.contains("bee-ninja-cut")) return;
      event.preventDefault();
      if (!event.repeat) strike();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
    };
  }, [finish, interactionPaused, mode, playCue, playNote, pulseNow, react, reduceMotion, strike]);

  const confirmWin = (challengeCompleted: boolean) => {
    playSound("goal");
    onWin(challengeCompleted);
  };
  const leave = () => friendlyReplay && !mode ? onAbandon() : setShowLeave(true);
  const highlightPractice = practiceFirst(levelCompleted, friendlyReplay, attempted);
  const result = finished?.mode === "song" ? finished.outcome : null;
  const ended = finished !== null;
  const melisaPose = result ? (result.won ? 4 : 3) : view.melisaPose;
  const heroPose = result?.won ? "celebra" : mode ? view.heroPose : "espera";
  const total = mode ? scoreLength(beeScores[mode]) : 0;

  const retrato = <div className="bee-ninja-retrato" style={{ backgroundImage: `url("${boss.assetAtlas}")` }} />;
  const salir = friendlyReplay ? "minijuegos.abeja.resultado.amigos.rotulo" : "minijuegos.abeja.resultado.mapa.rotulo";
  const enPrevia = !mode && (!finished || finished.mode !== "song");

  return <><Dialog labelledBy="bee-ninja-title" backdropClassName="boss-backdrop" className="boss-battle bee-ninja-game" gamepad={interactionPaused || !mode}>
    <h2 id="bee-ninja-title" className="sr-only"><Texto clave="minijuegos.abeja.previa.nombre.rotulo" /></h2>
    <div className={`bee-ninja-frame${reduceMotion ? " is-still" : ""}`} ref={frameRef} onPointerDown={(event) => { if (event.button === 0 && mode && mode !== "demo") strike(); }}>
      <div className="bee-ninja-stage" style={{ transform: `scale(${scale})`, ...STAGE_ART }} aria-hidden="true">
        <img className="bee-ninja-background" src="./assets/worlds/world-11.webp" alt="" />
        <div className="bee-ninja-ground" />
        <div className="bee-ninja-comb">{[0, 1, 2, 3].map((index) => <span key={index} className={mode && view.lamp === index ? "is-on" : undefined} />)}</div>
        <div className={`bee-ninja-melisa${view.melisaThrowing && mode ? " is-throwing" : ""}`} style={{ backgroundImage: `url("${boss.assetAtlas}")`, backgroundPosition: `${melisaPose * 25}% 100%` }} />
        {mode && view.melisaBubble && <span className="bee-ninja-bubble is-melisa">{view.melisaBubble}</span>}
        <div className={`bee-ninja-jar${view.jar >= 2 ? " is-reached" : ""}`} style={{ backgroundImage: 'url("./assets/sprites/tarro-miel-v1.webp")', backgroundPosition: `${(mode || ended ? view.jar : 0) * 25}% 0` }}>
          {mode && view.gota && <i className="gota-cae" style={{ "--gota": "#f2b632" } as CSSProperties} />}
        </div>
        {view.ring && mode && <div className={`bee-ninja-ring${view.ring.ready ? " is-ready" : ""}`} style={{ left: CUT_POINT.x - 50, top: CUT_POINT.y - 50, transform: `scale(${view.ring.scale})` }} />}
        {mode && clockKind === "frame" && <span className="bee-ninja-mute" style={{ left: CUT_POINT.x + 40, top: CUT_POINT.y - 70 }}><Pictograma nombre="sin-sonido" /></span>}
        {view.ring?.ready && mode && <div className="bee-ninja-now" style={{ left: CUT_POINT.x - 26, top: CUT_POINT.y - 150 }}>{t("minijuegos.abeja.compas.ya.rotulo")}</div>}
        <div className="bee-ninja-hero" data-pose={heroPose} style={{ backgroundImage: 'url("./assets/sprites/noa-abeja-v1.webp")', left: HERO.left, top: HERO.top, width: HERO.width, height: HERO.height }} />
        {view.targets.map((target) => <div key={target.id} className={`bee-ninja-target is-${target.kind}${target.kind === "ladybug" && view.greet ? " is-greeting" : ""}`}
          style={{ transform: `translate(${target.x - 32}px, ${target.y - 32}px) rotate(${target.rotation}deg)`, opacity: target.opacity, ...(target.kind === "ladybug" ? {} : flowerSprite(target.color, 0)) }} />)}
        {view.halves.map((half) => <div key={half.id} className="bee-ninja-cut-flower" style={{ left: CUT_POINT.x - 32, top: CUT_POINT.y - 32 }}>
          <span className="is-left" style={flowerSprite(half.color, 1)} />
          <span className="is-right" style={flowerSprite(half.color, 2)} />
          {!reduceMotion && [0, 1, 2, 3].map((petal) => <i key={petal} style={{ ...flowerSprite(half.color, 3), "--dx": `${870 - CUT_POINT.x + (petal - 1.5) * 12}px`, "--dy": `${430 - CUT_POINT.y}px` } as CSSProperties} />)}
        </div>)}
        {view.greet && <span className="bee-ninja-bubble is-pink" style={{ left: view.greet.x - 24, top: view.greet.y - 70 }}>{t("minijuegos.abeja.compas.hola.rotulo")}</span>}
        {view.feedback && <div className={`bee-ninja-feedback${view.feedback.miss ? " is-miss" : ""}`} style={{ left: CUT_POINT.x - 130, top: CUT_POINT.y - 110 }}>{view.feedback.text}</div>}
        {mode && view.counting > 0 && <div className="bee-ninja-caption">{view.counting}</div>}
        {mode && view.phase && <span className="bee-ninja-phase"><i className={`bee-ninja-phase-piece is-${view.phase.piece}`} style={view.phase.piece === "ladybug" ? undefined : flowerSprite(0, 0)} />{view.phase.piece === "duo" && <i className="bee-ninja-phase-piece is-duo" style={flowerSprite(1, 0)} />}{view.phase.name}</span>}
      </div>
    </div>
    {mode && <BotonControl className="bee-ninja-pausa" pictograma="pausa" etiqueta="partida.hud.pausa.oculto" onClick={() => setShowLeave(true)} />}
    {mode && <progress className="bee-ninja-progress" max={total} value={Math.max(0, view.pulse)} aria-label={t("minijuegos.abeja.avance.oculto")} />}

    {mode && <div className="bee-ninja-controls">
      {mode !== "demo" && <Boton tipo="seguir" className="bee-ninja-cut" clave="minijuegos.abeja.boton.corta.rotulo" disabled={interactionPaused}
        onPointerDown={(event) => { event.stopPropagation(); if (event.button === 0) strike(); }} onClick={(event) => { if (event.detail === 0) strike(); }} />}
      {mode !== "song" && <Boton clave="minijuegos.abeja.practica.termina.rotulo" onClick={() => { const session = sessionRef.current; if (session) finish(session); }} />}
    </div>}
  </Dialog>

  {enPrevia && !showLeave && <PantallaPrevia id="bee-ninja-previa" nombre="minijuegos.abeja.previa.nombre.rotulo" guardian={retrato}
    regla={`${t("minijuegos.abeja.previa.regla.juntos")} ${boss.challenge.label}`}
    ayudaAdultos={[t("adultos.minijuegos.abeja.controles"), t("adultos.minijuegos.abeja.sinSonido")]}
    practicaPrimero={highlightPractice && finished?.mode !== "practice"}
    onPracticar={() => void begin(finished?.mode === "demo" ? "practice" : "demo")} onJugar={() => void begin("song")} onSalir={leave} />}

  {parada && !paused && <Ventana id="bee-ninja-parada" titulo={CLAVE_PARADA[parada.pieza as keyof typeof CLAVE_PARADA].rotulo}
    botones={<Boton tipo="seguir" clave="minijuegos.abeja.practica.sigue.rotulo" data-gamepad-default onClick={() => { practicaRef.current?.seguir(); setParada(null); }} />}>
    <p className="juntos">{t(CLAVE_PARADA[parada.pieza as keyof typeof CLAVE_PARADA].juntos)}</p>
  </Ventana>}

  {result && !showLeave && <ResultadoMinijuego informe={informe} id="bee-ninja-resultado" titulo={RESULT_TEXT[result.result].title} gano={result.won} onSalir={leave}
    dibujo={<div className="bee-ninja-jar-resultado" role="img" aria-label={t("minijuegos.abeja.resultado.tarro.oculto")} style={{ backgroundImage: 'url("./assets/sprites/tarro-miel-v1.webp")', backgroundPosition: `${view.jar * 25}% 0` }} />}
    frase={t(RESULT_TEXT[result.result].text)}
    botones={result.won ? <>
      <Boton tipo="seguir" clave={friendlyReplay ? "minijuegos.abeja.resultado.amigos.rotulo" : "minijuegos.abeja.resultado.sigue.rotulo"} data-gamepad-default onClick={() => confirmWin(result.challengeCompleted)} />
      <Boton clave="minijuegos.abeja.resultado.otraVez.rotulo" onClick={() => void begin("song")} />
    </> : <>
      <Boton tipo="seguir" clave="minijuegos.abeja.resultado.otraVez.rotulo" data-gamepad-default onClick={() => void begin("song")} />
      <Boton clave="minijuegos.comun.previa.practica.rotulo" onClick={() => void begin("demo")} />
      <Boton clave={salir} data-gamepad-back onClick={leave} />
    </>} />}

  {showLeave && <Ventana id="bee-ninja-leave-title" titulo={mode ? "partida.pausa.titulo.rotulo" : "minijuegos.abeja.salir.titulo.rotulo"} onClose={() => setShowLeave(false)}
    botones={<>
      <Boton tipo="seguir" clave="minijuegos.abeja.salir.seguir.rotulo" data-gamepad-default data-gamepad-back onClick={() => setShowLeave(false)} />
      <Boton clave={friendlyReplay ? "minijuegos.abeja.resultado.amigos.rotulo" : mode ? "minijuegos.abeja.resultado.mapa.rotulo" : "minijuegos.abeja.salir.si.rotulo"} onClick={onAbandon} />
    </>}>
    <p className="juntos">{t("minijuegos.abeja.salir.juntos.juntos")}</p>
  </Ventana>}
  </>;
}
