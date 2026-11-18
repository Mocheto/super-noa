import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { bossCatalog } from "./bosses";
import { cssAssetUrl } from "./assets";
import { Dialog } from "./Dialog";
import type { SoundKind } from "./GameCanvas";
import { firstConnectedGamepad } from "./gamepad";
import {
  COUNT_PULSES, FSSS, JABATOS, MISS, PULSE_MS, RESUME_COUNT_PULSES, activeJabato, advanceFrameClock, audioPulse, autoFeeds, biteSound,
  bitesIn, branchSlot, createRun, dotsFor, goalOf, grunt, hoof, jabatoPose, meriendaScores, missesAt, musicForEighth, outcomeOf,
  outputLatencySeconds, partAt, PHASE_NAMES, practiceFirst, pressAt, risingEdge, scoreLength, songStartAfterPause,
  type Dot, type Food, type JabatoKind, type JabatoPose, type MeriendaMode, type MeriendaNote, type MeriendaRun, type Outcome, type PressResult,
} from "./meriendaJabatos";
import "./meriendaJabatos.css";
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
  ended: boolean;
};
type AudioRig = { context: AudioContext; music: GainNode; segment: GainNode; cue: GainNode; noise: AudioBuffer };
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
  caption: string;
  phase: string;
  counting: number;
};

const START_DELAY_S = 0.15;
const STAGE_WIDTH = 960;
const emptyView: View = { pulse: -1, lamp: -1, bossCall: false, bossCheer: false, bossBubble: null, noaPose: 0, jabato: null, dots: [], thrown: null, feedback: null, caption: "", phase: "", counting: 0 };
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

const CAPTIONS: Record<MeriendaMode, readonly [number, string][]> = {
  demo: [[0, t("minijuegos.merienda.mira-el-gran-jabali.juntos")], [COUNT_PULSES, t("minijuegos.merienda.gru-el-jabato-abre.juntos")], [COUNT_PULSES + 2, t("minijuegos.merienda.ahora-noa-le-da.juntos")], [COUNT_PULSES + 4, t("minijuegos.merienda.gruuuu-el-grande-tarda.juntos")], [COUNT_PULSES + 8, t("minijuegos.merienda.castana-para-el-grande.rotulo")]],
  practice: [[0, t("minijuegos.merienda.ahora-tu-escucha-la.juntos")], [COUNT_PULSES, t("minijuegos.merienda.cuando-la-boca-este.juntos")], [COUNT_PULSES + 8, t("minijuegos.merienda.el-grande-espera-cuatro.juntos")], [COUNT_PULSES + 13, ""]],
  song: [[0, t("minijuegos.merienda.a-merendar.rotulo")], [COUNT_PULSES, ""]],
};

const RESULT_TEXT: Record<Outcome["result"], { title: string; text: string }> = {
  perfecto: { title: t("minijuegos.merienda.perfecto.rotulo"), text: t("minijuegos.merienda.ningun-jabato-se-ha.juntos") },
  bien: { title: t("minijuegos.merienda.bien-hecho.rotulo"), text: t("minijuegos.merienda.las-bellotas-de-la.juntos") },
  casi: { title: t("minijuegos.merienda.casi.rotulo"), text: t("minijuegos.merienda.las-bellotas-aun-no.juntos") },
};

function snapshot(session: Session, pulse: number, counting: number): View {
  const { run } = session;
  const fraction = pulse - Math.floor(pulse);
  const part = pulse >= 0 ? partAt(run.score, pulse) : null;
  const introCount = part?.kind === "count" && fraction < 0.65 ? part.beat + 1 : 0;
  const shownCount = counting || introCount;
  const calling = run.jabatos.find((item) => pulse >= item.call && pulse < item.call + 1.4) ?? null;
  const cheering = (session.cheerFrom !== null && pulse - session.cheerFrom < 2) || part?.kind === "end";
  const jabato = counting ? null : activeJabato(run, pulse);
  const caption = counting ? "" : CAPTIONS[run.mode].filter(([from]) => pulse >= from).at(-1)?.[1] ?? "";
  const phase = !part ? "" : part.kind === "count" ? t("minijuegos.merienda.cuenta.rotulo") : part.kind === "end" ? t("minijuegos.merienda.fanfarria.rotulo") : PHASE_NAMES[part.phase ?? 1];
  return {
    pulse, caption, phase, counting,
    lamp: part && !counting ? part.beat : -1,
    bossCall: Boolean(shownCount ? shownCount % 2 === 0 : calling),
    bossCheer: !shownCount && !calling && cheering,
    bossBubble: shownCount ? { text: String(shownCount), big: false }
      : calling ? { text: JABATOS[calling.kind].call, big: calling.kind === "grande" }
        : session.cheerFrom !== null && pulse - session.cheerFrom < 2 ? { text: t("minijuegos.merienda.que-rico.rotulo"), big: false } : null,
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
  const audioRef = useRef<AudioRig | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [mode, setMode] = useState<MeriendaMode | null>(null);
  const [finished, setFinished] = useState<{ mode: MeriendaMode; outcome: Outcome } | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [clockKind, setClockKind] = useState<"audio" | "frame" | null>(null);
  const [view, setView] = useState<View>(emptyView);
  const [got, setGot] = useState(0);
  const [showLeave, setShowLeave] = useState(false);
  const [message, setMessage] = useState(t("minijuegos.merienda.los-jabatos-tienen-hambre.juntos"));
  const interactionPaused = paused || showLeave;
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

  const playNote = useCallback((note: MeriendaNote, when: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const { context } = audio;
    const bus = note.bus === "music" ? audio.segment : audio.cue;
    const start = when + note.offset;
    const end = start + note.duration;
    const gain = context.createGain();
    let output: AudioNode = gain;
    if (note.filter) {
      const filter = context.createBiquadFilter();
      filter.type = note.filter.type;
      filter.frequency.value = note.filter.frequency;
      filter.connect(gain);
      output = filter;
    }
    gain.connect(bus);
    if (note.noise) {
      const source = context.createBufferSource();
      source.buffer = audio.noise;
      gain.gain.setValueAtTime(note.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      source.connect(output);
      source.start(start);
      source.stop(end + 0.02);
      return;
    }
    const oscillator = context.createOscillator();
    oscillator.type = note.wave;
    oscillator.frequency.setValueAtTime(note.frequency, start);
    if (note.glideTo) oscillator.frequency.exponentialRampToValueAtTime(note.glideTo, end);
    const attack = note.attack ?? 0.006;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(note.volume, start + attack);
    if (note.breath) {
      const vibrato = context.createOscillator();
      const depth = context.createGain();
      vibrato.frequency.value = 5.2;
      depth.gain.value = note.frequency * 0.006;
      vibrato.connect(depth).connect(oscillator.frequency);
      vibrato.start(start);
      vibrato.stop(end + 0.03);
      gain.gain.setValueAtTime(note.volume, Math.max(start + attack, start + note.duration * 0.7));
    }
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(output);
    oscillator.start(start);
    oscillator.stop(end + 0.03);
  }, []);

  const playCue = useCallback((notes: MeriendaNote[]) => {
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

  /** Respuesta a la pulsación: en la demostración el sonido ya va en la partitura; si toca la jugadora, suena al momento. */
  const react = useCallback((session: Session, result: PressResult, pulse: number, automatic = false) => {
    session.feedUntil = pulse + 0.3;
    if (result.kind === "fed") {
      if (!automatic) playCue(biteSound(session.run, result.bite));
      const big = result.jabato.kind === "grande";
      session.thrown = { food: JABATOS[result.jabato.kind].food, id: ++session.throws, miss: false };
      session.feedback = { text: big ? t("minijuegos.merienda.nam.rotulo") : t("minijuegos.merienda.nam.rotulo"), miss: false, until: pulse + 0.5 };
      setGot(session.run.got);
      if (session.run.mode === "song" && session.run.got === goalOf(session.run.score)) {
        session.cheerFrom = pulse;
        playCue(grunt(false));
        setMessage(t("minijuegos.merienda.las-bellotas-han-pasado.juntos"));
      }
    } else playCue(FSSS);
  }, [playCue]);

  const finish = useCallback((session: Session) => {
    session.ended = true;
    if (audioRef.current) freshSegment();
    const outcome = outcomeOf(session.run);
    setMode(null);
    setFinished({ mode: session.run.mode, outcome });
    setMessage(session.run.mode === "song" ? RESULT_TEXT[outcome.result].text : session.run.mode === "demo"
      ? t("minijuegos.merienda.ya-lo-has-visto.juntos") : t("minijuegos.merienda.buen-ensayo-puedes-ensayar.juntos"));
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
      lastPulse: -1, nextEighth: 0, feedUntil: -Infinity, oopsUntil: -Infinity, throws: 0, thrown: null, feedback: null, cheerFrom: null, ended: false,
    };
    sessionRef.current = session;
    if (nextMode === "song") setAttempted(true);
    setFinished(null);
    setGot(0);
    setView(emptyView);
    setMessage(nextMode === "demo" ? t("minijuegos.merienda.mira-como-noa-da.juntos") : t("minijuegos.merienda.cuando-el-jabato-abra.juntos"));
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
      if (!counting) {
        if (session.run.score.auto) for (const result of autoFeeds(session.run, pulse)) react(session, result, pulse, true);
        const missed = missesAt(session.run, pulse);
        if (missed.length) {
          playCue(MISS);
          const kind = session.run.jabatos[missed[0].jabato].kind;
          session.thrown = { food: JABATOS[kind].food, id: ++session.throws, miss: true };
          session.feedback = { text: t("minijuegos.merienda.ay.rotulo"), miss: true, until: pulse + 0.5 };
          session.oopsUntil = pulse + 0.5;
          setMessage(t("minijuegos.merienda.mira-los-puntos-cuando.juntos"));
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
  const leave = () => friendlyReplay ? onAbandon() : setShowLeave(true);
  const highlightPractice = practiceFirst(levelCompleted, friendlyReplay, attempted);
  const result = finished?.mode === "song" ? finished.outcome : null;
  const scoreMode = mode ?? finished?.mode ?? "song";
  const total = bitesIn(meriendaScores[scoreMode]);
  const goal = goalOf(meriendaScores[scoreMode]);
  const showGoal = scoreMode === "song";
  const bossPose = result ? (result.won ? 3 : 0) : mode ? (view.bossCheer ? 3 : view.bossCall ? 2 : 0) : 0;
  const noaPose: NoaPose = result?.won ? 3 : result ? 2 : mode ? view.noaPose : 0;
  const jabato = mode ? view.jabato : null;

  return <><Dialog labelledBy="merienda-title" backdropClassName="boss-backdrop" className="boss-battle merienda-game" gamepad={interactionPaused || !mode}>
    <header className="boss-header merienda-header">
      <div>
        <p className="eyebrow">{friendlyReplay ? t("minijuegos.merienda.juego-amistoso.rotulo") : t("minijuegos.merienda.juego-del-guardian.rotulo")} · {boss.name}</p>
        <h2 id="merienda-title">{t("minijuegos.merienda.la-merienda-de-los.juntos")}</h2>
        <p>{t("minijuegos.merienda.cuando-el-gran-jabali.juntos")}</p>
        <p className="boss-challenge">{t("minijuegos.merienda.reto-de-amistad.rotulo")} {boss.challenge.label}</p>
      </div>
    </header>

    <div className={`merienda-frame${reduceMotion ? " is-still" : ""}`} ref={frameRef} onPointerDown={(event) => { if (event.button === 0 && mode && mode !== "demo") feed(); }}>
      <div className="merienda-stage" style={{ transform: `scale(${scale})`, ...STAGE_ART }} aria-hidden="true">
        <img className="merienda-background" src="./assets/worlds/world-4-hd-v1.webp" alt="" />
        <img className="merienda-rock" src="./assets/sprites/roca-merienda-v1.webp" alt="" />
        <img className={`merienda-boss${view.bossCall && mode ? " is-call" : ""}`} src={`${boss.assetPrefix}-${bossPose}.png`} alt="" />
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
        </div>
        {mode && view.caption && <div className="merienda-caption">{view.caption}</div>}
        {mode && view.counting > 0 && <div className="merienda-caption">{t("minijuegos.merienda.seguimos-el-gran-jabali.juntos")} {view.counting}</div>}
        {mode && view.phase && <span className="merienda-phase">{view.phase}</span>}
        {result && <div className="merienda-result"><strong>{RESULT_TEXT[result.result].title}</strong></div>}
      </div>
    </div>
    {mode && <progress className="merienda-progress" max={scoreLength(meriendaScores[mode])} value={Math.max(0, view.pulse)} aria-label={t("minijuegos.merienda.avance-de-la-merienda.oculto")} />}

    <div className="merienda-controls">
      <p className="merienda-message" aria-live="polite">{result ? <><b>{RESULT_TEXT[result.result].title}</b> {message}</> : message}</p>
      {mode && <div className={`merienda-bigdots${jabato ? "" : " is-off"}`} aria-hidden="true"><Dots dots={jabato ? view.dots : []} className="merienda-bigdots-row" /></div>}
      {mode && mode !== "demo" && <button className="pixel-button primary merienda-feed" type="button" disabled={interactionPaused}
        onPointerDown={(event) => { event.stopPropagation(); if (event.button === 0) feed(); }} onClick={(event) => { if (event.detail === 0) feed(); }}>{t("minijuegos.merienda.dale-de-comer.rotulo")}</button>}
      {mode === "demo" && <button className="pixel-button" type="button" onClick={() => { const session = sessionRef.current; if (session) finish(session); }}>{t("minijuegos.merienda.terminar-demostracion.rotulo")}</button>}
      {mode === "practice" && <button className="pixel-button" type="button" onClick={() => { const session = sessionRef.current; if (session) finish(session); }}>{t("minijuegos.merienda.terminar-ensayo.rotulo")}</button>}
      {!mode && !finished && <div className="merienda-actions">
        <button className={`pixel-button${highlightPractice ? " primary" : ""}`} type="button" data-gamepad-default={highlightPractice || undefined} onClick={() => void begin("demo")}>{t("minijuegos.merienda.practicar.rotulo")}</button>
        <button className={`pixel-button${highlightPractice ? "" : " primary"}`} type="button" data-gamepad-default={!highlightPractice || undefined} onClick={() => void begin("song")}>{t("minijuegos.merienda.a-jugar.rotulo")}</button>
      </div>}
      {finished?.mode === "demo" && <div className="merienda-actions">
        <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => void begin("practice")}>{t("minijuegos.merienda.ensayar.rotulo")}</button>
        <button className="pixel-button" type="button" onClick={() => void begin("song")}>{t("minijuegos.merienda.a-jugar.rotulo")}</button>
      </div>}
      {finished?.mode === "practice" && <div className="merienda-actions">
        <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => void begin("song")}>{t("minijuegos.merienda.a-jugar.rotulo")}</button>
        <button className="pixel-button" type="button" onClick={() => void begin("practice")}>{t("minijuegos.merienda.ensayar-otra-vez.rotulo")}</button>
      </div>}
      {result?.won && <div className="merienda-actions">
        <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => confirmWin(result.challengeCompleted)}>{friendlyReplay ? t("minijuegos.merienda.volver-a-mis-amigos.rotulo") : t("minijuegos.merienda.continuar-la-aventura.rotulo")}</button>
        <button className="pixel-button" type="button" onClick={() => void begin("song")}>{t("minijuegos.merienda.jugar-otra-vez.rotulo")}</button>
      </div>}
      {result?.won && !result.challengeCompleted && <p className="merienda-note">{t("minijuegos.merienda.si-das-de-comer.juntos")}</p>}
      {result && !result.won && <div className="merienda-actions">
        <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => void begin("song")}>{t("minijuegos.merienda.intentar-otra-vez.rotulo")}</button>
        <button className="pixel-button" type="button" onClick={() => void begin("demo")}>{t("minijuegos.merienda.practicar.rotulo")}</button>
        <button className="pixel-button" type="button" onClick={leave}>{friendlyReplay ? t("minijuegos.merienda.volver-a-mis-amigos.rotulo") : t("minijuegos.merienda.volver-al-mapa.rotulo")}</button>
      </div>}
      {mode && clockKind === "frame" && <p className="merienda-note">{muted ? t("minijuegos.merienda.sonido-apagado-sigue-los.juntos") : t("minijuegos.merienda.sin-sonido-sigue-los.juntos")}</p>}
      <p className="merienda-help">{t("minijuegos.merienda.teclado-espacio-mando-boton.juntos")}</p>
      {!(result && !result.won) && <button className="text-button duel-abandon" type="button" onClick={leave}>{friendlyReplay ? t("minijuegos.merienda.volver-a-mis-amigos.rotulo") : t("minijuegos.merienda.volver-al-mapa.rotulo")}</button>}
    </div>
  </Dialog>

  {showLeave && <Dialog labelledBy="merienda-leave-title" className="game-modal compact" gamepad onClose={() => setShowLeave(false)}>
    <p className="eyebrow">{t("minijuegos.merienda.un-momento.rotulo")}</p><h2 id="merienda-leave-title">{t("minijuegos.merienda.volvemos-al-mapa.rotulo")}</h2>
    <p>{t("minijuegos.merienda.podras-volver-a-dar.juntos")}</p>
    <button className="pixel-button primary" type="button" data-gamepad-default data-gamepad-back onClick={() => setShowLeave(false)}>{t("minijuegos.merienda.seguir-jugando.rotulo")}</button>
    <button className="pixel-button" type="button" onClick={onAbandon}>{t("minijuegos.merienda.si-volver-al-mapa.rotulo")}</button>
  </Dialog>}
  </>;
}
