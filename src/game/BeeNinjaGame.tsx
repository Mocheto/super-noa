import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { bossCatalog } from "./bosses";
import { cssAssetUrl } from "./assets";
import { Dialog } from "./Dialog";
import type { SoundKind } from "./GameCanvas";
import { firstConnectedGamepad } from "./gamepad";
import {
  COUNT_PULSES, CUT_POINT, HERO, PLOF_SOUND, PULSE_MS, UY_SOUND, cutSound, RESUME_COUNT_PULSES, WIN_AT, advanceFrameClock, audioPulse, autoCuts, barOfPulse, beeScores,
  collectFalls, COUNT_TICK, createRun, jarLevel, leadNote, musicForEighth, nextOpenCut, outcomeOf, outputLatencySeconds,
  practiceFirst, pressAt, risingEdge, scoreLength, songStartAfterPause, targetPlacement, targetVisible, throwPulses,
  type BeeMode, type BeeNote, type BeeRun, type Outcome, type PressResult,
} from "./beeNinja";
import { loadBeeSamples, type SampleBank } from "./beeNinjaSamples";
import "./beeNinja.css";
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
  halves: Half[];
  halfId: number;
  ended: boolean;
};
type AudioRig = { context: AudioContext; music: GainNode; segment: GainNode; cue: GainNode; noise: AudioBuffer };
type TargetView = { id: number; kind: "flower" | "ladybug"; color: number; x: number; y: number; rotation: number; opacity: number };
type View = {
  pulse: number;
  targets: TargetView[];
  halves: Half[];
  jar: number;
  ring: { scale: number; ready: boolean } | null;
  lamp: number;
  heroPose: "espera" | "alza" | "corta" | "celebra";
  melisaPose: number;
  melisaThrowing: boolean;
  melisaBubble: string | null;
  greet: { x: number; y: number } | null;
  feedback: { text: string; miss: boolean } | null;
  caption: string;
  phase: string;
  counting: number;
};

const START_DELAY_S = 0.15;
const STAGE_WIDTH = 960;
const emptyView: View = { pulse: -1, targets: [], halves: [], jar: 0, ring: null, lamp: -1, heroPose: "espera", melisaPose: 0, melisaThrowing: false, melisaBubble: null, greet: null, feedback: null, caption: "", phase: "", counting: 0 };

const CAPTIONS: Record<BeeMode, readonly [number, string][]> = {
  demo: [[0, t("minijuegos.abeja.mira-como-lo-hace.juntos")], [4, t("minijuegos.abeja.flor-un-corte-cuando.juntos")], [8, t("minijuegos.abeja.duo-dos-flores-dos.juntos")], [12, t("minijuegos.abeja.la-mariquita-no-se.juntos")]],
  practice: [[0, t("minijuegos.abeja.ahora-tu-escucha-la.juntos")], [4, t("minijuegos.abeja.corta-cuando-la-flor.juntos")], [12, t("minijuegos.abeja.zum-zum-dos-cortes.juntos")], [16, t("minijuegos.abeja.a-la-mariquita-no.rotulo")]],
  song: [[0, t("minijuegos.abeja.que-empiece-el-duelo.rotulo")], [4, ""]],
};

const RESULT_TEXT: Record<Outcome["result"], { title: string; text: string }> = {
  perfecto: { title: t("minijuegos.abeja.perfecto.rotulo"), text: t("minijuegos.abeja.no-ha-caido-ni.juntos") },
  bien: { title: t("minijuegos.abeja.bien-hecho.rotulo"), text: t("minijuegos.abeja.el-tarro-de-miel.juntos") },
  casi: { title: t("minijuegos.abeja.casi.rotulo"), text: t("minijuegos.abeja.el-tarro-aun-no.juntos") },
};

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
  const caption = counting ? "" : CAPTIONS[run.mode].filter(([from]) => pulse >= from).at(-1)?.[1] ?? "";
  const phase = run.score.phases.filter(({ fromBar }) => barOfPulse(Math.max(0, whole)) >= fromBar).at(-1)?.name ?? "";
  return {
    pulse, targets, ring, caption, phase, counting,
    halves: session.halves.filter((half) => pulse - half.start < 0.9),
    jar: jarLevel(run.cut),
    lamp: pulse >= 0 && !counting ? whole % 4 : -1,
    heroPose,
    melisaPose: shownCount ? (shownCount % 2 ? 1 : 3) : applauding ? 2 : throwing ? 1 : 0,
    melisaThrowing: Boolean(throwing) && !shownCount,
    melisaBubble: shownCount ? String(shownCount) : applauding ? t("minijuegos.abeja.bravo.rotulo") : throwing ? (throwing.type === "duo" ? "¡zum-zum!" : t("minijuegos.abeja.zum.rotulo")) : null,
    greet: session.greet && session.greet.until > pulse ? { x: session.greet.x, y: session.greet.y } : null,
    feedback: session.feedback && session.feedback.until > pulse ? { text: session.feedback.text, miss: session.feedback.miss } : null,
  };
}

export function BeeNinjaGame({ paused, muted, musicVolume, effectsVolume, reduceMotion, levelCompleted, onAbandon, onWin, playSound, friendlyReplay = false }: Props) {
  const sessionRef = useRef<Session | null>(null);
  const audioRef = useRef<AudioRig | null>(null);
  const samplesRef = useRef<SampleBank | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [mode, setMode] = useState<BeeMode | null>(null);
  const [finished, setFinished] = useState<{ mode: BeeMode; outcome: Outcome } | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [clockKind, setClockKind] = useState<"audio" | "frame" | null>(null);
  const [view, setView] = useState<View>(emptyView);
  const [showLeave, setShowLeave] = useState(false);
  const [message, setMessage] = useState(t("minijuegos.abeja.la-reina-melisa-te.juntos"));
  const interactionPaused = paused || showLeave;
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
        const noise = context.createBuffer(1, Math.floor(context.sampleRate * 0.25), context.sampleRate);
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

  const playNote = useCallback((note: BeeNote, when: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const { context } = audio;
    const bus = note.bus === "music" ? audio.segment : audio.cue;
    const start = when + note.offset;
    const gain = context.createGain();
    const bank = samplesRef.current;
    if (bank) {
      if (note.sample === null) return; // otro sample sustituye a esta nota
      if (note.sample) {
        const source = context.createBufferSource();
        source.buffer = bank[note.sample.id];
        source.playbackRate.value = note.sample.rate ?? 1;
        gain.gain.value = note.sample.gain;
        source.connect(gain).connect(bus);
        source.start(start);
        return;
      }
    }
    if (note.volume === 0) return; // nota que solo existe como sample
    if (note.noise) {
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      source.buffer = audio.noise;
      filter.type = note.noise === "high" ? "highpass" : note.noise === "low" ? "lowpass" : "bandpass";
      filter.frequency.value = note.noise === "high" ? 6000 : note.noise === "low" ? 900 : 3000;
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
    if (note.vibrato) {
      const lfo = context.createOscillator();
      const depth = context.createGain();
      lfo.frequency.value = 5.5;
      depth.gain.value = note.frequency * 0.012;
      lfo.connect(depth).connect(oscillator.frequency);
      lfo.start(start);
      lfo.stop(start + note.duration + 0.05);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(note.volume, start + (note.vibrato ? 0.06 : 0.006));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);
    oscillator.connect(gain).connect(bus);
    oscillator.start(start);
    oscillator.stop(start + note.duration + 0.03);
  }, []);

  const playCue = useCallback((notes: BeeNote[]) => {
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

  const react = useCallback((session: Session, result: PressResult, pulse: number) => {
    session.cutUntil = pulse + 0.3;
    if (result.kind === "cut") {
      playCue(cutSound(leadNote(session.run)));
      session.feedback = { text: t("minijuegos.abeja.zas.rotulo"), miss: false, until: pulse + 0.5 };
      session.halves.push({ id: session.halfId++, color: result.target.color, start: pulse });
      if (session.run.mode === "song") {
        const level = jarLevel(session.run.cut);
        if (level > session.lastJar) { session.lastJar = level; session.celebrateUntil = pulse + 0.9; }
        if (session.run.cut === WIN_AT) { session.applaudFrom = pulse; setMessage(t("minijuegos.abeja.el-tarro-ha-pasado.juntos")); }
      }
    } else if (result.kind === "ladybug") {
      session.cutUntil = -Infinity;
      const place = targetPlacement(result.target, pulse, reduceMotion);
      session.greet = { x: place.x, y: place.y, until: pulse + 1.2 };
      setMessage(t("minijuegos.abeja.a-la-mariquita-no-2.juntos"));
    } else {
      playCue(UY_SOUND);
      session.feedback = { text: t("minijuegos.abeja.uy.rotulo"), miss: true, until: pulse + 0.5 };
      setMessage(t("minijuegos.abeja.espera-a-que-la.juntos"));
    }
  }, [playCue, reduceMotion]);

  const finish = useCallback((session: Session) => {
    session.ended = true;
    if (audioRef.current) freshSegment();
    const outcome = outcomeOf(session.run);
    setMode(null);
    setFinished({ mode: session.run.mode, outcome });
    setMessage(session.run.mode === "song" ? RESULT_TEXT[outcome.result].text : session.run.mode === "demo"
      ? t("minijuegos.abeja.ya-lo-has-visto.juntos") : t("minijuegos.abeja.buen-ensayo-puedes-ensayar.juntos"));
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
      lastPulse: -1, nextEighth: 0, cutUntil: -Infinity, greet: null, feedback: null, applaudFrom: null, celebrateUntil: -Infinity, lastJar: 0, halves: [], halfId: 0, ended: false,
    };
    sessionRef.current = session;
    if (nextMode === "song") setAttempted(true);
    setFinished(null);
    setView(emptyView);
    setMessage(nextMode === "demo" ? t("minijuegos.abeja.mira-como-lo-hace.juntos") : t("minijuegos.abeja.escucha-la-cuenta-de.juntos"));
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
      if (!counting) {
        if (session.run.mode === "demo") for (const result of autoCuts(session.run, pulse)) react(session, result, pulse);
        else if (collectFalls(session.run, pulse).length) {
          playCue(PLOF_SOUND);
          session.feedback = { text: "plof", miss: true, until: pulse + 0.6 };
          setMessage(t("minijuegos.abeja.no-pasa-nada-ya.juntos"));
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
  const leave = () => friendlyReplay ? onAbandon() : setShowLeave(true);
  const highlightPractice = practiceFirst(levelCompleted, friendlyReplay, attempted);
  const result = finished?.mode === "song" ? finished.outcome : null;
  const ended = finished !== null;
  const melisaPose = result ? (result.won ? 4 : 3) : view.melisaPose;
  const heroPose = result?.won ? "celebra" : mode ? view.heroPose : "espera";
  const total = mode ? scoreLength(beeScores[mode]) : 0;

  return <><Dialog labelledBy="bee-ninja-title" backdropClassName="boss-backdrop" className="boss-battle bee-ninja-game" gamepad={interactionPaused || !mode}>
    <header className="boss-header bee-ninja-header">
      <div>
        <p className="eyebrow">{friendlyReplay ? t("minijuegos.abeja.juego-amistoso.rotulo") : t("minijuegos.abeja.juego-del-guardian.rotulo")} · {boss.name}</p>
        <h2 id="bee-ninja-title">{t("minijuegos.abeja.la-abeja-ninja.rotulo")}</h2>
        <p>{t("minijuegos.abeja.melisa-lanza-flores-cortalas.juntos")}</p>
        <p className="boss-challenge">{t("minijuegos.abeja.reto-de-amistad.rotulo")} {boss.challenge.label}</p>
      </div>
    </header>

    <div className={`bee-ninja-frame${reduceMotion ? " is-still" : ""}`} ref={frameRef} onPointerDown={(event) => { if (event.button === 0 && mode && mode !== "demo") strike(); }}>
      <div className="bee-ninja-stage" style={{ transform: `scale(${scale})`, ...STAGE_ART }} aria-hidden="true">
        <img className="bee-ninja-background" src="./assets/worlds/world-11.webp" alt="" />
        <div className="bee-ninja-ground" />
        <div className="bee-ninja-comb">{[0, 1, 2, 3].map((index) => <span key={index} className={mode && view.lamp === index ? "is-on" : undefined} />)}</div>
        <div className={`bee-ninja-melisa${view.melisaThrowing && mode ? " is-throwing" : ""}`} style={{ backgroundImage: `url("${boss.assetAtlas}")`, backgroundPosition: `${melisaPose * 25}% 100%` }} />
        {mode && view.melisaBubble && <span className="bee-ninja-bubble is-melisa">{view.melisaBubble}</span>}
        <div className={`bee-ninja-jar${view.jar >= 2 ? " is-reached" : ""}`} style={{ backgroundImage: 'url("./assets/sprites/tarro-miel-v1.webp")', backgroundPosition: `${(mode || ended ? view.jar : 0) * 25}% 0` }} />
        {view.ring && mode && <div className={`bee-ninja-ring${view.ring.ready ? " is-ready" : ""}`} style={{ left: CUT_POINT.x - 50, top: CUT_POINT.y - 50, transform: `scale(${view.ring.scale})` }} />}
        {view.ring?.ready && mode && <div className="bee-ninja-now" style={{ left: CUT_POINT.x - 26, top: CUT_POINT.y - 150 }}>{t("minijuegos.abeja.ya.rotulo")}</div>}
        <div className="bee-ninja-hero" data-pose={heroPose} style={{ backgroundImage: 'url("./assets/sprites/noa-abeja-v1.webp")', left: HERO.left, top: HERO.top, width: HERO.width, height: HERO.height }} />
        {view.targets.map((target) => <div key={target.id} className={`bee-ninja-target is-${target.kind}${target.kind === "ladybug" && view.greet ? " is-greeting" : ""}`}
          style={{ transform: `translate(${target.x - 32}px, ${target.y - 32}px) rotate(${target.rotation}deg)`, opacity: target.opacity, ...(target.kind === "ladybug" ? {} : flowerSprite(target.color, 0)) }} />)}
        {view.halves.map((half) => <div key={half.id} className="bee-ninja-cut-flower" style={{ left: CUT_POINT.x - 32, top: CUT_POINT.y - 32 }}>
          <span className="is-left" style={flowerSprite(half.color, 1)} />
          <span className="is-right" style={flowerSprite(half.color, 2)} />
          {!reduceMotion && [0, 1, 2, 3].map((petal) => <i key={petal} style={{ ...flowerSprite(half.color, 3), "--dx": `${870 - CUT_POINT.x + (petal - 1.5) * 12}px`, "--dy": `${430 - CUT_POINT.y}px` } as CSSProperties} />)}
        </div>)}
        {view.greet && <span className="bee-ninja-bubble is-pink" style={{ left: view.greet.x - 24, top: view.greet.y - 70 }}>{t("minijuegos.abeja.hola.rotulo")}</span>}
        {view.feedback && <div className={`bee-ninja-feedback${view.feedback.miss ? " is-miss" : ""}`} style={{ left: CUT_POINT.x - 130, top: CUT_POINT.y - 110 }}>{view.feedback.text}</div>}
        {mode && view.caption && <div className="bee-ninja-caption">{view.caption}</div>}
        {mode && view.counting > 0 && <div className="bee-ninja-caption">{t("minijuegos.abeja.seguimos-melisa-cuenta.juntos")} {view.counting}</div>}
        {mode && view.phase && <span className="bee-ninja-phase">{view.phase}</span>}
        {result && <div className="bee-ninja-result"><strong>{RESULT_TEXT[result.result].title}</strong></div>}
      </div>
    </div>
    {mode && <progress className="bee-ninja-progress" max={total} value={Math.max(0, view.pulse)} aria-label={t("minijuegos.abeja.avance-de-la-cancion.oculto")} />}

    <div className="bee-ninja-controls">
      <p className="bee-ninja-message" aria-live="polite">{result ? <><b>{RESULT_TEXT[result.result].title}</b> {message}</> : message}</p>
      {mode && mode !== "demo" && <button className="pixel-button primary bee-ninja-cut" type="button" disabled={interactionPaused}
        onPointerDown={(event) => { event.stopPropagation(); if (event.button === 0) strike(); }} onClick={(event) => { if (event.detail === 0) strike(); }}>{t("minijuegos.abeja.corta.rotulo")}</button>}
      {mode === "demo" && <button className="pixel-button" type="button" onClick={() => { const session = sessionRef.current; if (session) finish(session); }}>{t("minijuegos.abeja.terminar-demostracion.rotulo")}</button>}
      {mode === "practice" && <button className="pixel-button" type="button" onClick={() => { const session = sessionRef.current; if (session) finish(session); }}>{t("minijuegos.abeja.terminar-ensayo.rotulo")}</button>}
      {!mode && !finished && <div className="bee-ninja-actions">
        <button className={`pixel-button${highlightPractice ? " primary" : ""}`} type="button" data-gamepad-default={highlightPractice || undefined} onClick={() => void begin("demo")}>{t("minijuegos.abeja.practicar.rotulo")}</button>
        <button className={`pixel-button${highlightPractice ? "" : " primary"}`} type="button" data-gamepad-default={!highlightPractice || undefined} onClick={() => void begin("song")}>{t("minijuegos.abeja.a-jugar.rotulo")}</button>
      </div>}
      {finished?.mode === "demo" && <div className="bee-ninja-actions">
        <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => void begin("practice")}>{t("minijuegos.abeja.ensayar.rotulo")}</button>
        <button className="pixel-button" type="button" onClick={() => void begin("song")}>{t("minijuegos.abeja.a-jugar.rotulo")}</button>
      </div>}
      {finished?.mode === "practice" && <div className="bee-ninja-actions">
        <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => void begin("song")}>{t("minijuegos.abeja.a-jugar.rotulo")}</button>
        <button className="pixel-button" type="button" onClick={() => void begin("practice")}>{t("minijuegos.abeja.ensayar-otra-vez.rotulo")}</button>
      </div>}
      {result?.won && <div className="bee-ninja-actions">
        <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => confirmWin(result.challengeCompleted)}>{friendlyReplay ? t("minijuegos.abeja.volver-a-mis-amigos.rotulo") : t("minijuegos.abeja.continuar-la-aventura.rotulo")}</button>
        <button className="pixel-button" type="button" onClick={() => void begin("song")}>{t("minijuegos.abeja.jugar-otra-vez.rotulo")}</button>
      </div>}
      {result?.won && !result.challengeCompleted && <p className="bee-ninja-note">{t("minijuegos.abeja.si-cortas-todas-las.juntos")}</p>}
      {result && !result.won && <div className="bee-ninja-actions">
        <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => void begin("song")}>{t("minijuegos.abeja.intentar-otra-vez.rotulo")}</button>
        <button className="pixel-button" type="button" onClick={() => void begin("demo")}>{t("minijuegos.abeja.practicar.rotulo")}</button>
        <button className="pixel-button" type="button" onClick={leave}>{friendlyReplay ? t("minijuegos.abeja.volver-a-mis-amigos.rotulo") : t("minijuegos.abeja.volver-al-mapa.rotulo")}</button>
      </div>}
      {mode && clockKind === "frame" && <p className="bee-ninja-note">{muted ? t("minijuegos.abeja.sonido-apagado-sigue-el.juntos") : t("minijuegos.abeja.sin-sonido-sigue-el.juntos")}</p>}
      <p className="bee-ninja-help">{t("minijuegos.abeja.teclado-espacio-mando-boton.juntos")}</p>
      {!(result && !result.won) && <button className="text-button duel-abandon" type="button" onClick={leave}>{friendlyReplay ? t("minijuegos.abeja.volver-a-mis-amigos.rotulo") : t("minijuegos.abeja.volver-al-mapa.rotulo")}</button>}
    </div>
  </Dialog>

  {showLeave && <Dialog labelledBy="bee-ninja-leave-title" className="game-modal compact" gamepad onClose={() => setShowLeave(false)}>
    <p className="eyebrow">{t("minijuegos.abeja.un-momento.rotulo")}</p><h2 id="bee-ninja-leave-title">{t("minijuegos.abeja.volvemos-al-mapa.rotulo")}</h2>
    <p>{t("minijuegos.abeja.podras-jugar-con-melisa.juntos")}</p>
    <button className="pixel-button primary" type="button" data-gamepad-default data-gamepad-back onClick={() => setShowLeave(false)}>{t("minijuegos.abeja.seguir-jugando.rotulo")}</button>
    <button className="pixel-button" type="button" onClick={onAbandon}>{t("minijuegos.abeja.si-volver-al-mapa.rotulo")}</button>
  </Dialog>}
  </>;
}
