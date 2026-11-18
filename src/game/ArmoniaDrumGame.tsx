import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { bossCatalog } from "./bosses";
import { cssAssetUrl } from "./assets";
import { Dialog } from "./Dialog";
import type { SoundKind } from "./GameCanvas";
import { firstConnectedGamepad } from "./gamepad";
import {
  ARMONIA_DRUM, BATON, COUNT_PULSES, NOA, NOA_DRUM, NOISE_FILTERS, PHASE_NAMES, PULSE_MS, RESUME_COUNT_PULSES, WIN_AT, advanceFrameClock,
  audioPulse, autoHits, callStart, createRun, drumScores, hitsIn, musicForEighth, outcomeOf, outputLatencySeconds, partAt, practiceFirst,
  pressAt, printsAt, printsOrigin, responseNote, responseStart, risingEdge, scoreLength, snare, songStartAfterPause, xylophone,
  type DrumMode, type DrumNote, type DrumRun, type Outcome, type PressResult, type PrintsView,
} from "./armoniaDrum";
import "./armoniaDrum.css";
import { t } from "../textos/index.ts";

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
  run: DrumRun;
  clock: "audio" | "frame";
  songStart: number;
  frameMs: number;
  countMs: number;
  countUntil: number | null;
  pausedAt: number | null;
  frozenPulse: number;
  lastPulse: number;
  nextEighth: number;
  strikeUntil: number;
  glowUntil: number;
  feedback: { text: string; miss: boolean; until: number } | null;
  applaudFrom: number | null;
  ended: boolean;
};
type AudioRig = { context: AudioContext; music: GainNode; segment: GainNode; cue: GainNode; noise: AudioBuffer };
type NoaPose = "espera" | "golpe" | "escucha" | "celebra";
type View = {
  pulse: number;
  lamp: number;
  turn: "call" | "response" | null;
  armoniaPose: number;
  armoniaHit: boolean;
  armoniaBubble: string | null;
  noaPose: NoaPose;
  noaBubble: string | null;
  noaHit: boolean;
  noaGlow: boolean;
  prints: PrintsView;
  feedback: { text: string; miss: boolean } | null;
  caption: string;
  phase: string;
  counting: number;
};

const START_DELAY_S = 0.15;
const STAGE_WIDTH = 960;
const emptyView: View = { pulse: -1, lamp: -1, turn: null, armoniaPose: 0, armoniaHit: false, armoniaBubble: null, noaPose: "espera", noaBubble: null, noaHit: false, noaGlow: false, prints: null, feedback: null, caption: "", phase: "", counting: 0 };
const NOA_POSES: Record<NoaPose, string> = { espera: "0%", golpe: "33.333%", escucha: "66.667%", celebra: "100%" };

const CAPTIONS: Record<DrumMode, readonly [number, string][]> = {
  demo: [[0, t("minijuegos.tambor.mira-armonia-toca-y.juntos")], [callStart(0), t("minijuegos.tambor.escucha-a-armonia-tin.juntos")], [responseStart(0), t("minijuegos.tambor.noa-repite-los-mismos.juntos")], [callStart(1), t("minijuegos.tambor.ahora-tres-golpes-seguidos.juntos")], [responseStart(1), t("minijuegos.tambor.noa-los-repite-igual.rotulo")]],
  practice: [[0, t("minijuegos.tambor.ahora-tu-escucha-la.juntos")], [callStart(0), t("minijuegos.tambor.escucha-y-mira-las.juntos")], [responseStart(0), t("minijuegos.tambor.tu-turno-golpea-como.juntos")], [callStart(1), ""]],
  song: [[0, t("minijuegos.tambor.que-empiece-el-concierto.rotulo")], [COUNT_PULSES, ""]],
};

const RESULT_TEXT: Record<Outcome["result"], { title: string; text: string }> = {
  perfecto: { title: t("minijuegos.tambor.perfecto.rotulo"), text: t("minijuegos.tambor.no-se-ha-escapado.juntos") },
  bien: { title: t("minijuegos.tambor.bien-hecho.rotulo"), text: t("minijuegos.tambor.las-notas-del-atril.juntos") },
  casi: { title: t("minijuegos.tambor.casi.rotulo"), text: t("minijuegos.tambor.las-notas-aun-no.juntos") },
};

function snapshot(session: Session, pulse: number, counting: number): View {
  const { run } = session;
  const whole = Math.floor(pulse);
  const fraction = pulse - whole;
  const part = pulse >= 0 ? partAt(run.score, pulse) : null;
  const introCount = part?.kind === "count" && fraction < 0.65 ? part.beat + 1 : 0;
  const shownCount = counting || introCount;
  const applauding = session.applaudFrom !== null && pulse - session.applaudFrom < 2;
  const callHit = part?.kind === "call" && run.score.pairs[part.pair].hits.includes(part.beat + 1) && fraction < 0.3;
  const armoniaPose = shownCount ? (shownCount % 2 ? 1 : 2)
    : part?.kind === "end" ? 4
      : applauding ? 4
        : callHit && part ? (part.beat % 2 ? 1 : 2)
          : part?.kind === "call" && part.beat === 3 ? 3 : 0;
  const armoniaBubble = shownCount ? String(shownCount)
    : applauding ? t("minijuegos.tambor.bravo.rotulo")
      : part?.kind === "call" && part.beat < 2 ? t("minijuegos.tambor.escucha.rotulo")
        : part?.kind === "call" && part.beat === 3 ? t("minijuegos.tambor.tin.rotulo") : null;
  const noaPose: NoaPose = session.strikeUntil > pulse ? "golpe" : part?.kind === "end" ? "celebra" : part?.kind === "call" ? "escucha" : "espera";
  const caption = counting ? "" : CAPTIONS[run.mode].filter(([from]) => pulse >= from).at(-1)?.[1] ?? "";
  const phase = !part ? "" : part.kind === "count" ? t("minijuegos.tambor.cuenta.rotulo") : part.kind === "end" ? t("minijuegos.tambor.fanfarria.rotulo") : PHASE_NAMES[run.score.pairs[part.pair].phase];
  return {
    pulse, caption, phase, counting, armoniaPose, armoniaBubble, noaPose,
    lamp: part && !counting ? part.beat : -1,
    turn: part?.kind === "call" ? "call" : part?.kind === "response" ? "response" : null,
    armoniaHit: Boolean(callHit) && fraction < 0.15,
    noaBubble: !counting && part?.kind === "response" && part.beat < 2 ? t("minijuegos.tambor.tu-turno.rotulo") : null,
    noaHit: session.strikeUntil > pulse,
    noaGlow: session.glowUntil > pulse,
    prints: counting ? null : printsAt(run, pulse),
    feedback: session.feedback && session.feedback.until > pulse ? { text: session.feedback.text, miss: session.feedback.miss } : null,
  };
}

function Prints({ view, className, style }: { view: NonNullable<PrintsView>; className: string; style?: CSSProperties }) {
  return <div className={`${className} is-${view.drum}`} style={style}>
    {view.prints.map((state, index) => <span key={index} className={`armonia-drum-print is-${state}${view.lit === index + 1 ? " is-lit" : ""}${view.current === index + 1 ? " is-current" : ""}`}>{index + 1}</span>)}
  </div>;
}

export function ArmoniaDrumGame({ paused, muted, musicVolume, effectsVolume, reduceMotion, levelCompleted, onAbandon, onWin, playSound, friendlyReplay = false }: Props) {
  const sessionRef = useRef<Session | null>(null);
  const audioRef = useRef<AudioRig | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [mode, setMode] = useState<DrumMode | null>(null);
  const [finished, setFinished] = useState<{ mode: DrumMode; outcome: Outcome } | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [clockKind, setClockKind] = useState<"audio" | "frame" | null>(null);
  const [view, setView] = useState<View>(emptyView);
  const [got, setGot] = useState(0);
  const [showLeave, setShowLeave] = useState(false);
  const [message, setMessage] = useState(t("minijuegos.tambor.armonia-toca-su-tambor.juntos"));
  const interactionPaused = paused || showLeave;
  const wasPausedRef = useRef(false);
  const boss = bossCatalog["maestra-armonia"];

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
    void audioRef.current?.context.close().catch(() => {});
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.music.gain.value = muted ? 0 : musicVolume / 100;
    audio.cue.gain.value = muted ? 0 : effectsVolume / 100;
  }, [effectsVolume, musicVolume, muted, mode]);

  /** Cada tramo de canción va por su propio bus: al pausar o terminar, las notas ya programadas se cortan. */
  const freshSegment = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try { audio.segment.disconnect(); } catch { /* ya desconectado */ }
    audio.segment = audio.context.createGain();
    audio.segment.connect(audio.music);
  }, []);

  const ensureAudio = useCallback(async () => {
    if (muted) return false;
    try {
      if (!audioRef.current) {
        const context = new AudioContext();
        const music = context.createGain();
        const cue = context.createGain();
        const segment = context.createGain();
        music.connect(context.destination);
        cue.connect(context.destination);
        segment.connect(music);
        music.gain.value = musicVolume / 100;
        cue.gain.value = effectsVolume / 100;
        const noise = context.createBuffer(1, Math.floor(context.sampleRate * 1.2), context.sampleRate);
        const data = noise.getChannelData(0);
        for (let index = 0; index < data.length; index++) data[index] = Math.random() * 2 - 1;
        audioRef.current = { context, music, segment, cue, noise };
      }
      const { context } = audioRef.current;
      if (context.state !== "running") await Promise.race([context.resume(), new Promise((resolve) => setTimeout(resolve, 400))]);
      return context.state === "running";
    } catch {
      return false;
    }
  }, [effectsVolume, musicVolume, muted]);

  const playNote = useCallback((note: DrumNote, when: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const { context } = audio;
    const bus = note.bus === "music" ? audio.segment : audio.cue;
    const start = when + note.offset;
    const gain = context.createGain();
    if (note.noise) {
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      source.buffer = audio.noise;
      filter.type = NOISE_FILTERS[note.noise].type;
      filter.frequency.value = NOISE_FILTERS[note.noise].frequency;
      gain.gain.setValueAtTime(note.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);
      source.connect(filter).connect(gain).connect(bus);
      source.start(start);
      source.stop(start + note.duration + 0.02);
      return;
    }
    const oscillator = context.createOscillator();
    oscillator.type = note.wave;
    oscillator.frequency.setValueAtTime(note.frequency, start);
    if (note.glideTo) oscillator.frequency.exponentialRampToValueAtTime(note.glideTo, start + note.duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(note.volume, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);
    oscillator.connect(gain).connect(bus);
    oscillator.start(start);
    oscillator.stop(start + note.duration + 0.03);
  }, []);

  const playCue = useCallback((notes: DrumNote[]) => {
    const audio = audioRef.current;
    if (!audio || audio.context.state !== "running") return;
    for (const note of notes) playNote({ ...note, bus: "cue" }, audio.context.currentTime + 0.003);
  }, [playNote]);

  const pulseNow = useCallback((session: Session) => {
    if (session.countUntil !== null || session.countMs > 0 || session.pausedAt !== null) return session.frozenPulse;
    const audio = audioRef.current;
    if (session.clock === "audio" && audio && audio.context.state === "running") {
      return audioPulse(audio.context.currentTime, session.songStart, outputLatencySeconds(audio.context));
    }
    if (session.clock === "audio") return session.lastPulse;
    return session.frameMs / PULSE_MS;
  }, []);

  /** Respuesta al golpe: en la demostración el sonido ya va en la partitura; si toca la jugadora, suena al momento. */
  const react = useCallback((session: Session, result: PressResult, pulse: number, automatic = false) => {
    session.strikeUntil = pulse + 0.25;
    if (result.kind === "hit") {
      if (!automatic) playCue([...snare(false), ...xylophone(responseNote(session.run, result.target))]);
      session.feedback = { text: t("minijuegos.tambor.bien.rotulo"), miss: false, until: pulse + 0.5 };
      session.glowUntil = pulse + 0.3;
      setGot(session.run.got);
      if (session.run.mode === "song" && session.run.got === WIN_AT) {
        session.applaudFrom = pulse;
        setMessage(t("minijuegos.tambor.las-notas-han-pasado.juntos"));
      }
    } else if (result.kind === "uy") {
      playCue(snare(true));
      session.feedback = { text: t("minijuegos.tambor.uy.rotulo"), miss: true, until: pulse + 0.5 };
      setMessage(t("minijuegos.tambor.escucha-a-armonia-y.juntos"));
    } else playCue(snare(true));
  }, [playCue]);

  const finish = useCallback((session: Session) => {
    session.ended = true;
    if (audioRef.current) freshSegment();
    const outcome = outcomeOf(session.run);
    setMode(null);
    setFinished({ mode: session.run.mode, outcome });
    setMessage(session.run.mode === "song" ? RESULT_TEXT[outcome.result].text : session.run.mode === "demo"
      ? t("minijuegos.tambor.ya-lo-has-visto.juntos") : t("minijuegos.tambor.buen-ensayo-puedes-ensayar.juntos"));
    if (session.run.mode === "song") playSound(outcome.won ? "checkpoint" : "hurt");
  }, [freshSegment, playSound]);

  const strike = useCallback(() => {
    const session = sessionRef.current;
    if (!session || session.ended || interactionPaused || session.run.score.auto || session.countUntil !== null || session.countMs > 0) return;
    const pulse = pulseNow(session);
    react(session, pressAt(session.run, pulse), pulse);
  }, [interactionPaused, pulseNow, react]);

  const begin = async (nextMode: DrumMode) => {
    const session: Session = {
      run: createRun(nextMode), clock: "frame", songStart: 0, frameMs: -START_DELAY_S * 1000, countMs: 0, countUntil: null, pausedAt: null, frozenPulse: 0,
      lastPulse: -1, nextEighth: 0, strikeUntil: -Infinity, glowUntil: -Infinity, feedback: null, applaudFrom: null, ended: false,
    };
    sessionRef.current = session;
    if (nextMode === "song") setAttempted(true);
    setFinished(null);
    setGot(0);
    setView(emptyView);
    setMessage(nextMode === "demo" ? t("minijuegos.tambor.mira-como-lo-hacen.juntos") : t("minijuegos.tambor.escucha-a-armonia-y-2.juntos"));
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

  // Pausa (de App o al preguntar si volvemos al mapa): todo se congela; al seguir, Armonía cuenta cuatro pulsos.
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
          for (let index = 0; index < RESUME_COUNT_PULSES; index++) for (const note of BATON(index === 0)) playNote(note, countStart + index * PULSE_MS / 1000);
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
      if (!counting && session.run.score.auto) for (const result of autoHits(session.run, pulse)) react(session, result, pulse, true);
      const down = Boolean(firstConnectedGamepad()?.buttons[0]?.pressed);
      if (risingEdge(padDown, down)) strike();
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
      if (button && !button.classList.contains("armonia-drum-hit")) return;
      event.preventDefault();
      if (!event.repeat) strike();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
    };
  }, [finish, interactionPaused, mode, playNote, pulseNow, react, strike]);

  const confirmWin = (challengeCompleted: boolean) => {
    playSound("goal");
    onWin(challengeCompleted);
  };
  const leave = () => friendlyReplay ? onAbandon() : setShowLeave(true);
  const highlightPractice = practiceFirst(levelCompleted, friendlyReplay, attempted);
  const result = finished?.mode === "song" ? finished.outcome : null;
  const scoreMode = mode ?? finished?.mode ?? "song";
  const total = hitsIn(drumScores[scoreMode]);
  const showGoal = scoreMode === "song";
  const armoniaPose = result ? (result.won ? 4 : 3) : mode ? view.armoniaPose : 0;
  const noaPose: NoaPose = result?.won ? "celebra" : mode ? view.noaPose : "espera";
  const prints = mode ? view.prints : null;
  const armoniaPrints = printsOrigin(ARMONIA_DRUM);
  const noaPrints = printsOrigin(NOA_DRUM);

  return <><Dialog labelledBy="armonia-drum-title" backdropClassName="boss-backdrop" className="boss-battle armonia-drum-game" gamepad={interactionPaused || !mode}>
    <header className="boss-header armonia-drum-header">
      <div>
        <p className="eyebrow">{friendlyReplay ? t("minijuegos.tambor.juego-amistoso.rotulo") : t("minijuegos.tambor.juego-del-guardian.rotulo")} · {boss.name}</p>
        <h2 id="armonia-drum-title">{t("minijuegos.tambor.el-tambor-de-armonia.rotulo")}</h2>
        <p>{t("minijuegos.tambor.armonia-toca-su-tambor-2.juntos")}</p>
        <p className="boss-challenge">{t("minijuegos.tambor.reto-de-amistad.rotulo")} {boss.challenge.label}</p>
      </div>
    </header>

    <div className={`armonia-drum-frame${reduceMotion ? " is-still" : ""}`} ref={frameRef} onPointerDown={(event) => { if (event.button === 0 && mode && mode !== "demo") strike(); }}>
      <div className="armonia-drum-stage" style={{ transform: `scale(${scale})` }} aria-hidden="true">
        <img className="armonia-drum-background" src="./assets/worlds/teatro-armonia-v0.png" alt="" />
        <div className={`armonia-drum-spot is-armonia${mode && view.turn === "call" ? " is-on" : ""}`} />
        <div className={`armonia-drum-spot is-noa${mode && view.turn === "response" ? " is-on" : ""}`} />
        <div className={`armonia-drum-lamps${view.turn ? ` is-${view.turn}` : ""}`}>{[0, 1, 2, 3].map((index) => <span key={index} className={mode && view.lamp === index ? "is-on" : undefined} />)}</div>
        <div className={`armonia-drum-armonia${view.armoniaHit && mode ? " is-hit" : ""}`} style={{ backgroundImage: `url("${boss.assetAtlas}")`, backgroundPosition: `${armoniaPose * 25}% 100%` }} />
        <div className={`armonia-drum-drum${view.armoniaHit && mode ? " is-hit" : ""}`} style={{ ...ARMONIA_DRUM, backgroundImage: 'url("./assets/sprites/tambor-armonia-v0.png")' }} />
        <div className="armonia-drum-noa" style={{ ...NOA, "--noa-sprite": cssAssetUrl("./assets/sprites/noa-tambor-v0.png"), backgroundPosition: `${NOA_POSES[noaPose]} 0` } as CSSProperties} />
        <div className={`armonia-drum-drum${view.noaHit && mode ? " is-hit" : ""}${view.noaGlow && mode ? " is-glow" : ""}`} style={{ ...NOA_DRUM, backgroundImage: 'url("./assets/sprites/tambor-noa-v0.png")' }} />
        {prints && <Prints view={prints} className="armonia-drum-prints" style={prints.drum === "armonia" ? { left: armoniaPrints.x, top: armoniaPrints.y } : { left: noaPrints.x, top: noaPrints.y }} />}
        {mode && view.armoniaBubble && <span className="armonia-drum-bubble is-armonia">{view.armoniaBubble}</span>}
        {mode && view.noaBubble && <span className="armonia-drum-bubble is-noa">{view.noaBubble}</span>}
        {view.feedback && mode && <div className={`armonia-drum-feedback${view.feedback.miss ? " is-miss" : ""}`}>{view.feedback.text}</div>}
        <div className={`armonia-drum-stand${showGoal && got >= WIN_AT ? " is-reached" : ""}`} style={{ "--atril": cssAssetUrl("./assets/sprites/atril-armonia-v0.png") } as CSSProperties}>
          <div className="armonia-drum-staff">
            {Array.from({ length: total }, (_, index) => <i key={index} className={index < got ? "is-got" : undefined} />)}
            {showGoal && <b className="armonia-drum-line" style={{ left: `calc(${WIN_AT / total * 100}% - 3px)` }} />}
          </div>
        </div>
        {mode && view.caption && <div className="armonia-drum-caption">{view.caption}</div>}
        {mode && view.counting > 0 && <div className="armonia-drum-caption">{t("minijuegos.tambor.seguimos-armonia-cuenta.juntos")} {view.counting}</div>}
        {mode && view.phase && <span className="armonia-drum-phase">{view.phase}</span>}
        {result && <div className="armonia-drum-result"><strong>{RESULT_TEXT[result.result].title}</strong></div>}
      </div>
    </div>
    {mode && <progress className="armonia-drum-progress" max={scoreLength(drumScores[mode])} value={Math.max(0, view.pulse)} aria-label={t("minijuegos.tambor.avance-de-la-cancion.oculto")} />}

    <div className="armonia-drum-controls">
      <p className="armonia-drum-message" aria-live="polite">{result ? <><b>{RESULT_TEXT[result.result].title}</b> {message}</> : message}</p>
      {mode && <div className={`armonia-drum-bigprints${prints ? ` is-${prints.drum}` : " is-off"}`} aria-hidden="true">
        {prints ? <Prints view={prints} className="armonia-drum-bigprints-row" /> : <span className="armonia-drum-bigprints-row" />}
      </div>}
      {mode && mode !== "demo" && <button className="pixel-button primary armonia-drum-hit" type="button" disabled={interactionPaused}
        onPointerDown={(event) => { event.stopPropagation(); if (event.button === 0) strike(); }} onClick={(event) => { if (event.detail === 0) strike(); }}>{t("minijuegos.tambor.golpea.rotulo")}</button>}
      {mode === "demo" && <button className="pixel-button" type="button" onClick={() => { const session = sessionRef.current; if (session) finish(session); }}>{t("minijuegos.tambor.terminar-demostracion.rotulo")}</button>}
      {mode === "practice" && <button className="pixel-button" type="button" onClick={() => { const session = sessionRef.current; if (session) finish(session); }}>{t("minijuegos.tambor.terminar-ensayo.rotulo")}</button>}
      {!mode && !finished && <div className="armonia-drum-actions">
        <button className={`pixel-button${highlightPractice ? " primary" : ""}`} type="button" data-gamepad-default={highlightPractice || undefined} onClick={() => void begin("demo")}>{t("minijuegos.tambor.practicar.rotulo")}</button>
        <button className={`pixel-button${highlightPractice ? "" : " primary"}`} type="button" data-gamepad-default={!highlightPractice || undefined} onClick={() => void begin("song")}>{t("minijuegos.tambor.a-jugar.rotulo")}</button>
      </div>}
      {finished?.mode === "demo" && <div className="armonia-drum-actions">
        <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => void begin("practice")}>{t("minijuegos.tambor.ensayar.rotulo")}</button>
        <button className="pixel-button" type="button" onClick={() => void begin("song")}>{t("minijuegos.tambor.a-jugar.rotulo")}</button>
      </div>}
      {finished?.mode === "practice" && <div className="armonia-drum-actions">
        <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => void begin("song")}>{t("minijuegos.tambor.a-jugar.rotulo")}</button>
        <button className="pixel-button" type="button" onClick={() => void begin("practice")}>{t("minijuegos.tambor.ensayar-otra-vez.rotulo")}</button>
      </div>}
      {result?.won && <div className="armonia-drum-actions">
        <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => confirmWin(result.challengeCompleted)}>{friendlyReplay ? t("minijuegos.tambor.volver-a-mis-amigos.rotulo") : t("minijuegos.tambor.continuar-la-aventura.rotulo")}</button>
        <button className="pixel-button" type="button" onClick={() => void begin("song")}>{t("minijuegos.tambor.jugar-otra-vez.rotulo")}</button>
      </div>}
      {result?.won && !result.challengeCompleted && <p className="armonia-drum-note">{t("minijuegos.tambor.si-repites-todos-los.juntos")}</p>}
      {result && !result.won && <div className="armonia-drum-actions">
        <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => void begin("song")}>{t("minijuegos.tambor.intentar-otra-vez.rotulo")}</button>
        <button className="pixel-button" type="button" onClick={() => void begin("demo")}>{t("minijuegos.tambor.practicar.rotulo")}</button>
        <button className="pixel-button" type="button" onClick={leave}>{friendlyReplay ? t("minijuegos.tambor.volver-a-mis-amigos.rotulo") : t("minijuegos.tambor.volver-al-mapa.rotulo")}</button>
      </div>}
      {mode && clockKind === "frame" && <p className="armonia-drum-note">{muted ? t("minijuegos.tambor.sonido-apagado-sigue-las.juntos") : t("minijuegos.tambor.sin-sonido-sigue-las.juntos")}</p>}
      <p className="armonia-drum-help">{t("minijuegos.tambor.teclado-espacio-mando-boton.juntos")}</p>
      {!(result && !result.won) && <button className="text-button duel-abandon" type="button" onClick={leave}>{friendlyReplay ? t("minijuegos.tambor.volver-a-mis-amigos.rotulo") : t("minijuegos.tambor.volver-al-mapa.rotulo")}</button>}
    </div>
  </Dialog>

  {showLeave && <Dialog labelledBy="armonia-drum-leave-title" className="game-modal compact" gamepad onClose={() => setShowLeave(false)}>
    <p className="eyebrow">{t("minijuegos.tambor.un-momento.rotulo")}</p><h2 id="armonia-drum-leave-title">{t("minijuegos.tambor.volvemos-al-mapa.rotulo")}</h2>
    <p>{t("minijuegos.tambor.podras-tocar-con-armonia.juntos")}</p>
    <button className="pixel-button primary" type="button" data-gamepad-default data-gamepad-back onClick={() => setShowLeave(false)}>{t("minijuegos.tambor.seguir-jugando.rotulo")}</button>
    <button className="pixel-button" type="button" onClick={onAbandon}>{t("minijuegos.tambor.si-volver-al-mapa.rotulo")}</button>
  </Dialog>}
  </>;
}
