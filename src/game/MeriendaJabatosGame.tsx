import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { crearEquipo, despertar, liberarEquipo, ponerVolumenes, tocarNota, tocarYa, tramoNuevo, type EquipoAudio } from "./ritmoAudio";
import { bossCatalog } from "./bosses";
import { cssAssetUrl } from "./assets";
import { Dialog } from "./Dialog";
import type { SoundKind } from "./GameCanvas";
import { firstConnectedGamepad } from "./gamepad";
import {
  COUNT_PULSES, FSSS, JABATOS, MISS, PERFIL_MERIENDA, PULSE_MS, RESUME_COUNT_PULSES, activeJabato, advanceFrameClock, audioPulse, autoFeeds, biteSound,
  bitesIn, branchSlot, createRun, dotsFor, goalOf, grunt, hoof, jabatoPose, meriendaScores, missesAt, musicForEighth, outcomeOf,
  outputLatencySeconds, partAt, PHASE_JABATO, PHASE_NAMES, callPulse, practiceFirst, pressAt, risingEdge, scoreLength, songStartAfterPause,
  type Dot, type Food, type JabatoKind, type JabatoPose, type MeriendaMode, type MeriendaNote, type MeriendaRun, type Outcome, type PressResult,
} from "./meriendaJabatos";
import "./meriendaJabatos.css";
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

type Session = {
  run: MeriendaRun;
  clock: "audio" | "frame";
  songStart: number;
  frameMs: number;
  countMs: number;
  countUntil: number | null;
  pausedAt: number | null;
  frozenPulse: number;
  lastPulse: number;
  nextEighth: number;
  feedUntil: number;
  oopsUntil: number;
  throws: number;
  thrown: { food: Food; id: number; miss: boolean } | null;
  feedback: { text: string; miss: boolean; until: number } | null;
  cheerFrom: number | null;
  /** Pulso hasta el que cae una bellota de la rama tras un «fsss». */
  gotaUntil: number;
  /** La demostración ya ha enseñado su «fsss». */
  demoVacia: boolean;
  ended: boolean;
};
/** Tira de Noa guarda del bosque: preparada, dar, ¡uy! y celebrar. */
type NoaPose = 0 | 1 | 2 | 3;
type View = {
  pulse: number;
  lamp: number;
  bossCall: boolean;
  bossCheer: boolean;
  bossBubble: { text: string; big: boolean } | null;
  noaPose: NoaPose;
  jabato: { kind: JabatoKind; pose: JabatoPose; index: number } | null;
  dots: Dot[];
  thrown: Session["thrown"];
  feedback: { text: string; miss: boolean } | null;
  gota: boolean;
  phase: { name: string; kind: JabatoKind } | null;
  counting: number;
};

const START_DELAY_S = 0.15;
const STAGE_WIDTH = 960;
const emptyView: View = { pulse: -1, lamp: -1, bossCall: false, bossCheer: false, bossBubble: null, noaPose: 0, jabato: null, dots: [], thrown: null, feedback: null, gota: false, phase: null, counting: 0 };
const JABATO_SPRITES: Record<JabatoKind, string> = {
  pequeno: "./assets/sprites/jabato-pequeno-v1.webp",
  grande: "./assets/sprites/jabato-grande-v1.webp",
  gloton: "./assets/sprites/jabato-pequeno-v1.webp",
};
/** Arte que usa la hoja de estilos, con rutas relativas al sitio publicado. */
const STAGE_ART = {
  "--noa-sprite": cssAssetUrl("./assets/sprites/noa-guarda-v1.webp"),
  "--rama": cssAssetUrl("./assets/sprites/rama-bellotas-vacia-v1.webp"),
  "--bellota": cssAssetUrl("./assets/sprites/bellota-v1.webp"),
} as CSSProperties;
const FOOD_SPRITES: Record<Food, string> ={ bellota: "./assets/sprites/bellota-v1.webp", castana: "./assets/sprites/castana-v1.webp" };

/** La demostración enseña un «fsss» en el silencio tras el primer bocado y se para medio pulso después. */
const DEMO_VACIA_PULSO = COUNT_PULSES + 3;
/** La práctica se detiene en cada jabato nuevo y explica cuándo darle de comer. */
const PARADAS: Record<MeriendaMode, ParadaPractica[]> = {
  demo: [{ pulso: COUNT_PULSES, pieza: "pequeno" }, { pulso: DEMO_VACIA_PULSO + 0.5, pieza: "vacia" }, { pulso: COUNT_PULSES + 4, pieza: "grande" }],
  practice: [{ pulso: COUNT_PULSES, pieza: "pequeno" }, { pulso: COUNT_PULSES + 8, pieza: "grande" }],
  song: [],
};
const CLAVE_PARADA = {
  pequeno: { rotulo: "minijuegos.merienda.practica.pequeno.rotulo", juntos: "minijuegos.merienda.practica.pequeno.juntos" },
  grande: { rotulo: "minijuegos.merienda.practica.grande.rotulo", juntos: "minijuegos.merienda.practica.grande.juntos" },
  vacia: { rotulo: "minijuegos.merienda.practica.vacia.rotulo", juntos: "minijuegos.merienda.practica.vacia.juntos" },
} as const;

const RESULT_TEXT = {
  perfecto: { title: "minijuegos.merienda.resultado.perfecto.rotulo", text: "minijuegos.merienda.resultado.perfecto.juntos" },
  bien: { title: "minijuegos.merienda.resultado.bien.rotulo", text: "minijuegos.merienda.resultado.bien.juntos" },
  casi: { title: "minijuegos.merienda.resultado.casi.rotulo", text: "minijuegos.merienda.resultado.casi.juntos" },
} as const satisfies Record<Outcome["result"], { title: string; text: string }>;

function snapshot(session: Session, pulse: number, counting: number): View {
  const { run } = session;
  const fraction = pulse - Math.floor(pulse);
  const part = pulse >= 0 ? partAt(run.score, pulse) : null;
  const introCount = part?.kind === "count" && fraction < 0.65 ? part.beat + 1 : 0;
  const shownCount = counting || introCount;
  const calling = run.jabatos.find((item) => pulse >= item.call && pulse < item.call + 1.4) ?? null;
  const cheering = (session.cheerFrom !== null && pulse - session.cheerFrom < 2) || part?.kind === "end";
  const jabato = counting ? null : activeJabato(run, pulse);
  // Cartel de fase: solo el primer compás desde que sale el primer jabato de una fase nueva.
  const firstCall = part?.kind === "merienda" && part.phase ? run.score.calls.find((item) => item.phase === part.phase) : undefined;
  const phaseName = part?.phase ? PHASE_NAMES[part.phase] : null;
  const phaseKind = part?.phase ? PHASE_JABATO[part.phase] : null;
  const phase = !counting && firstCall && phaseName && phaseKind && pulse >= callPulse(firstCall) && pulse < callPulse(firstCall) + 4 ? { name: phaseName, kind: phaseKind } : null;
  return {
    pulse, phase, counting,
    gota: session.gotaUntil > pulse,
    lamp: part && !counting ? part.beat : -1,
    bossCall: Boolean(shownCount ? shownCount % 2 === 0 : calling),
    bossCheer: !shownCount && !calling && cheering,
    bossBubble: shownCount ? { text: String(shownCount), big: false }
      : calling ? { text: JABATOS[calling.kind].call, big: calling.kind === "grande" }
        : session.cheerFrom !== null && pulse - session.cheerFrom < 2 ? { text: t("minijuegos.merienda.compas.rico.rotulo"), big: false } : null,
    noaPose: part?.kind === "end" ? 3 : session.oopsUntil > pulse ? 2 : session.feedUntil > pulse ? 1 : 0,
    jabato: jabato ? { kind: jabato.kind, pose: jabatoPose(jabato, pulse), index: jabato.index } : null,
    dots: jabato ? dotsFor(jabato, pulse) : [],
    thrown: session.thrown,
    feedback: session.feedback && session.feedback.until > pulse ? { text: session.feedback.text, miss: session.feedback.miss } : null,
  };
}

function Dots({ dots, className }: { dots: Dot[]; className: string }) {
  return <div className={className}>
    {dots.map((dot) => <i key={dot.pulse} className={`merienda-dot${dot.bite ? " is-bite" : ""}${dot.big ? " is-big" : ""} is-${dot.state}`}
      style={dot.bite ? { "--food": cssAssetUrl(FOOD_SPRITES[dot.big ? "castana" : "bellota"]) } as CSSProperties : undefined} />)}
  </div>;
}

export function MeriendaJabatosGame({ paused, muted, musicVolume, effectsVolume, reduceMotion, levelCompleted, onAbandon, onWin, playSound, friendlyReplay = false }: Props) {
  const sessionRef = useRef<Session | null>(null);
  const [informe, setInforme] = useState<string>();
  const audioRef = useRef<EquipoAudio | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [mode, setMode] = useState<MeriendaMode | null>(null);
  const [finished, setFinished] = useState<{ mode: MeriendaMode; outcome: Outcome } | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [clockKind, setClockKind] = useState<"audio" | "frame" | null>(null);
  const [view, setView] = useState<View>(emptyView);
  const [got, setGot] = useState(0);
  const [showLeave, setShowLeave] = useState(false);
  const [parada, setParada] = useState<ParadaPractica | null>(null);
  const practicaRef = useRef<ReturnType<typeof createPracticaConPausas> | null>(null);
  const interactionPaused = paused || showLeave || parada !== null;
  const wasPausedRef = useRef(false);
  const boss = bossCatalog["great-boar"];

  useLayoutEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const update = () => setScale(element.clientWidth / STAGE_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
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
      audioRef.current ??= crearEquipo(PERFIL_MERIENDA, musicVolume / 100, effectsVolume / 100);
      return audioRef.current ? await despertar(audioRef.current) : false;
    } catch {
      return false;
    }
  }, [effectsVolume, musicVolume, muted]);

  const playNote = useCallback((note: MeriendaNote, when: number) => {
    if (audioRef.current) tocarNota(audioRef.current, note, when, null);
  }, []);

  const playCue = useCallback((notes: MeriendaNote[]) => tocarYa(audioRef.current, notes, null), []);

  const pulseNow = useCallback((session: Session) => {
    if (session.countUntil !== null || session.countMs > 0 || session.pausedAt !== null) return session.frozenPulse;
    const audio = audioRef.current;
    if (session.clock === "audio" && audio && audio.context.state === "running") {
      return audioPulse(audio.context.currentTime, session.songStart, outputLatencySeconds(audio.context));
    }
    if (session.clock === "audio") return session.lastPulse;
    return session.frameMs / PULSE_MS;
  }, []);

  /** Respuesta a la pulsación: en la demostración el sonido ya va en la partitura; si toca la jugadora, suena al momento. */
  const react = useCallback((session: Session, result: PressResult, pulse: number, automatic = false) => {
    session.feedUntil = pulse + 0.3;
    if (result.kind === "fed") {
      if (!automatic) playCue(biteSound(session.run, result.bite));
      session.thrown = { food: JABATOS[result.jabato.kind].food, id: ++session.throws, miss: false };
      session.feedback = { text: t("minijuegos.merienda.compas.nam.rotulo"), miss: false, until: pulse + 0.5 };
      setGot(session.run.cuenta.raya);
      if (session.run.mode === "song" && session.run.cuenta.raya === goalOf(session.run.score) && session.cheerFrom === null) {
        session.cheerFrom = pulse;
        playCue(grunt(false));
      }
    } else if (result.kind === "fsss") {
      // Pulsación vacía: «fsss» y cae una bellota de la rama (en la práctica solo se ve; en la canción, además, resta).
      playCue(FSSS);
      session.gotaUntil = pulse + 0.6;
      setGot(session.run.cuenta.raya);
    }
  }, [playCue]);

  const finish = useCallback((session: Session) => {
    session.ended = true;
    if (audioRef.current) freshSegment();
    const outcome = outcomeOf(session.run);
    setMode(null);
    setFinished({ mode: session.run.mode, outcome });
    setInforme(session.run.mode === "song" ? informeRitmo({ aciertos: session.run.got, total: bitesIn(session.run.score), vacias: session.run.cuenta.vacias, raya: session.run.cuenta.raya, meta: goalOf(session.run.score) }) : undefined);
    setParada(null);
    if (session.run.mode === "song") playSound(outcome.won ? "checkpoint" : "hurt");
  }, [freshSegment, playSound]);

  const feed = useCallback(() => {
    const session = sessionRef.current;
    if (!session || session.ended || interactionPaused || session.run.score.auto || session.countUntil !== null || session.countMs > 0) return;
    const pulse = pulseNow(session);
    react(session, pressAt(session.run, pulse), pulse);
  }, [interactionPaused, pulseNow, react]);

  const begin = async (nextMode: MeriendaMode) => {
    const session: Session = {
      run: createRun(nextMode), clock: "frame", songStart: 0, frameMs: -START_DELAY_S * 1000, countMs: 0, countUntil: null, pausedAt: null, frozenPulse: 0,
      lastPulse: -1, nextEighth: 0, feedUntil: -Infinity, oopsUntil: -Infinity, throws: 0, thrown: null, feedback: null, cheerFrom: null, gotaUntil: -Infinity, demoVacia: false, ended: false,
    };
    sessionRef.current = session;
    if (nextMode === "song") setAttempted(true);
    setFinished(null);
    setGot(0);
    setView(emptyView);
    practicaRef.current = createPracticaConPausas(PARADAS[nextMode]);
    setParada(null);
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

  // Pausa (de App o al preguntar si volvemos al mapa): todo se congela; al seguir, el Gran Jabalí cuenta cuatro pulsos.
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
          for (let index = 0; index < RESUME_COUNT_PULSES; index++) for (const note of hoof(index === 0)) playNote(note, countStart + index * PULSE_MS / 1000);
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
      // Práctica: al asomar un jabato nuevo se detiene y lo explica; sigue al tocar SIGUE (con la cuenta del Gran Jabalí).
      const nueva = !counting && session.run.mode !== "song" ? practicaRef.current?.llegar(pulse) : undefined;
      if (nueva) {
        setView(snapshot(session, pulse, 0));
        setParada(nueva);
        return;
      }
      if (!counting) {
        if (session.run.score.auto) {
          for (const result of autoFeeds(session.run, pulse)) react(session, result, pulse, true);
          if (!session.demoVacia && pulse >= DEMO_VACIA_PULSO) { session.demoVacia = true; react(session, { kind: "fsss", resta: false }, pulse); }
        }
        const missed = missesAt(session.run, pulse);
        if (missed.length) {
          playCue(MISS);
          const kind = session.run.jabatos[missed[0].jabato].kind;
          session.thrown = { food: JABATOS[kind].food, id: ++session.throws, miss: true };
          session.feedback = { text: t("minijuegos.merienda.compas.ay.rotulo"), miss: true, until: pulse + 0.5 };
          session.oopsUntil = pulse + 0.5;
        }
      }
      const down = Boolean(firstConnectedGamepad()?.buttons[0]?.pressed);
      if (risingEdge(padDown, down)) feed();
      padDown = down;
      if (!counting && pulse >= scoreLength(session.run.score)) {
        setView(snapshot(session, pulse, 0));
        finish(session);
        return;
      }
      setView(snapshot(session, pulse, counting));
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space" || mode === "demo") return;
      const button = event.target instanceof Element ? event.target.closest("button") : null;
      if (button && !button.classList.contains("merienda-feed")) return;
      event.preventDefault();
      if (!event.repeat) feed();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
    };
  }, [feed, finish, interactionPaused, mode, playCue, playNote, pulseNow, react]);

  const confirmWin = (challengeCompleted: boolean) => {
    playSound("goal");
    onWin(challengeCompleted);
  };
  const leave = () => friendlyReplay && !mode ? onAbandon() : setShowLeave(true);
  const highlightPractice = practiceFirst(levelCompleted, friendlyReplay, attempted);
  const result = finished?.mode === "song" ? finished.outcome : null;
  const scoreMode = mode ?? finished?.mode ?? "song";
  const total = bitesIn(meriendaScores[scoreMode]);
  const goal = goalOf(meriendaScores[scoreMode]);
  const showGoal = scoreMode === "song";
  const bossPose = result ? (result.won ? 3 : 0) : mode ? (view.bossCheer ? 3 : view.bossCall ? 2 : 0) : 0;
  const noaPose: NoaPose = result?.won ? 3 : result ? 2 : mode ? view.noaPose : 0;
  const jabato = mode ? view.jabato : null;

  const retrato = <img className="merienda-retrato" src={`${boss.assetPrefix}-0.webp`} alt="" />;
  const enPrevia = !mode && (!finished || finished.mode !== "song");

  return <><Dialog labelledBy="merienda-title" backdropClassName="boss-backdrop" className="boss-battle merienda-game" gamepad={interactionPaused || !mode}>
    <h2 id="merienda-title" className="sr-only"><Texto clave="minijuegos.merienda.previa.nombre.rotulo" /></h2>
    <div className={`merienda-frame${reduceMotion ? " is-still" : ""}`} ref={frameRef} onPointerDown={(event) => { if (event.button === 0 && mode && mode !== "demo") feed(); }}>
      <div className="merienda-stage" style={{ transform: `scale(${scale})`, ...STAGE_ART }} aria-hidden="true">
        <img className="merienda-background" src="./assets/worlds/world-4-hd-v1.webp" alt="" />
        <img className="merienda-rock" src="./assets/sprites/roca-merienda-v1.webp" alt="" />
        <img className={`merienda-boss${view.bossCall && mode ? " is-call" : ""}`} src={`${boss.assetPrefix}-${bossPose}.webp`} alt="" />
        {mode && view.bossBubble && <span className={`merienda-bubble${view.bossBubble.big ? " is-big" : ""}`}>{view.bossBubble.text}</span>}

        <div className="merienda-noa" style={{ backgroundPosition: `${noaPose * 100 / 3}% 0` }} />
        <img className="merienda-basket" src="./assets/sprites/cesta-v1.webp" alt="" />
        {mode && view.thrown && <img key={view.thrown.id} className={`merienda-thrown${view.thrown.miss ? " is-miss" : ""}${jabato?.kind === "grande" ? " is-big" : ""}`} src={FOOD_SPRITES[view.thrown.food]} alt="" />}

        <div className="merienda-spot">
          {jabato && <Dots dots={view.dots} className="merienda-dots" />}
          <div className="merienda-hole">
            <div className={`merienda-jabato is-${jabato?.kind ?? "pequeno"}${jabato ? " is-up" : ""}`}
              style={{ backgroundImage: `url("${JABATO_SPRITES[jabato?.kind ?? "pequeno"]}")`, backgroundPosition: `${(jabato?.pose ?? 0) * 25}% 0` }} />
          </div>
          <img className="merienda-bush" src="./assets/sprites/arbusto-merienda-v1.webp" alt="" />
        </div>
        {view.feedback && mode && <div className={`merienda-feedback${view.feedback.miss ? " is-miss" : ""}`}>{view.feedback.text}</div>}

        <div className="merienda-lamps">{[0, 1, 2, 3].map((index) => <span key={index} className={mode && view.lamp === index ? "is-on" : undefined} />)}</div>
        <div className={`merienda-branch${showGoal && got >= goal ? " is-reached" : ""}`}>
          {Array.from({ length: total }, (_, index) => <i key={index} className={index < got ? "is-got" : undefined} style={{ left: `${branchSlot(index, total)}%` }} />)}
          {showGoal && <b className="merienda-line" style={{ left: `${(branchSlot(goal - 1, total) + branchSlot(goal, total)) / 2}%` }} />}
          {mode && view.gota && <i className="gota-cae" style={{ "--gota": "#a8693a", left: `${branchSlot(Math.min(got, total - 1), total)}%` } as CSSProperties} />}
        </div>
        {mode && view.counting > 0 && <div className="merienda-caption">{view.counting}</div>}
        {mode && clockKind === "frame" && <span className="merienda-mute"><Pictograma nombre="sin-sonido" /></span>}
        {mode && view.phase && <span className="merienda-phase"><i className="merienda-phase-jabato" style={{ backgroundImage: `url("${JABATO_SPRITES[view.phase.kind]}")` }} />{view.phase.name}</span>}
      </div>
    </div>
    {mode && <BotonControl className="merienda-pausa" pictograma="pausa" etiqueta="partida.hud.pausa.oculto" onClick={() => setShowLeave(true)} />}
    {mode && <progress className="merienda-progress" max={scoreLength(meriendaScores[mode])} value={Math.max(0, view.pulse)} aria-label={t("minijuegos.merienda.avance.oculto")} />}

    {mode && <div className="merienda-controls">
      {mode !== "demo" && <Boton tipo="seguir" className="merienda-feed" clave="minijuegos.merienda.boton.dale.rotulo" disabled={interactionPaused}
        onPointerDown={(event) => { event.stopPropagation(); if (event.button === 0) feed(); }} onClick={(event) => { if (event.detail === 0) feed(); }} />}
      {mode !== "song" && <Boton clave="minijuegos.merienda.practica.termina.rotulo" onClick={() => { const session = sessionRef.current; if (session) finish(session); }} />}
    </div>}
  </Dialog>

  {enPrevia && !showLeave && <PantallaPrevia id="merienda-previa" nombre="minijuegos.merienda.previa.nombre.rotulo" guardian={retrato}
    regla={`${t("minijuegos.merienda.previa.regla.juntos")} ${boss.challenge.label}`}
    ayudaAdultos={[t("adultos.minijuegos.merienda.controles"), t("adultos.minijuegos.merienda.sinSonido")]}
    practicaPrimero={highlightPractice && finished?.mode !== "practice"}
    onPracticar={() => void begin(finished?.mode === "demo" ? "practice" : "demo")} onJugar={() => void begin("song")} onSalir={leave} />}

  {parada && !paused && <Ventana id="merienda-parada" titulo={CLAVE_PARADA[parada.pieza as keyof typeof CLAVE_PARADA].rotulo}
    botones={<Boton tipo="seguir" clave="minijuegos.merienda.practica.sigue.rotulo" data-gamepad-default onClick={() => { practicaRef.current?.seguir(); setParada(null); }} />}>
    <p className="juntos">{t(CLAVE_PARADA[parada.pieza as keyof typeof CLAVE_PARADA].juntos)}</p>
  </Ventana>}

  {result && !showLeave && <ResultadoMinijuego informe={informe} id="merienda-resultado" titulo={RESULT_TEXT[result.result].title} gano={result.won} onSalir={leave}
    dibujo={<div className="merienda-rama-resultado" role="img" aria-label={t("minijuegos.merienda.resultado.rama.oculto")} style={STAGE_ART}>
        <div className={`merienda-branch${showGoal && got >= goal ? " is-reached" : ""}`}>
          {Array.from({ length: total }, (_, index) => <i key={index} className={index < got ? "is-got" : undefined} style={{ left: `${branchSlot(index, total)}%` }} />)}
          {showGoal && <b className="merienda-line" style={{ left: `${(branchSlot(goal - 1, total) + branchSlot(goal, total)) / 2}%` }} />}
        </div>
    </div>}
    frase={t(RESULT_TEXT[result.result].text)}
    botones={result.won ? <>
      <Boton tipo="seguir" clave={friendlyReplay ? "minijuegos.merienda.resultado.amigos.rotulo" : "minijuegos.merienda.resultado.sigue.rotulo"} data-gamepad-default onClick={() => confirmWin(result.challengeCompleted)} />
      <Boton clave="minijuegos.merienda.resultado.otraVez.rotulo" onClick={() => void begin("song")} />
    </> : <>
      <Boton tipo="seguir" clave="minijuegos.merienda.resultado.otraVez.rotulo" data-gamepad-default onClick={() => void begin("song")} />
      <Boton clave="minijuegos.comun.previa.practica.rotulo" onClick={() => void begin("demo")} />
      <Boton clave={friendlyReplay ? "minijuegos.merienda.resultado.amigos.rotulo" : "minijuegos.merienda.resultado.mapa.rotulo"} data-gamepad-back onClick={leave} />
    </>} />}

  {showLeave && <Ventana id="merienda-leave-title" titulo={mode ? "partida.pausa.titulo.rotulo" : "minijuegos.merienda.salir.titulo.rotulo"} onClose={() => setShowLeave(false)}
    botones={<>
      <Boton tipo="seguir" clave="minijuegos.merienda.salir.seguir.rotulo" data-gamepad-default data-gamepad-back onClick={() => setShowLeave(false)} />
      <Boton clave={friendlyReplay ? "minijuegos.merienda.resultado.amigos.rotulo" : mode ? "minijuegos.merienda.resultado.mapa.rotulo" : "minijuegos.merienda.salir.si.rotulo"} onClick={onAbandon} />
    </>}>
    <p className="juntos">{t("minijuegos.merienda.salir.juntos.juntos")}</p>
  </Ventana>}
  </>;
}
