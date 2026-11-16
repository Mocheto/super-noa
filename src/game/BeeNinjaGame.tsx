import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { bossCatalog } from "./bosses";
import { Dialog } from "./Dialog";
import type { SoundKind } from "./GameCanvas";
import { firstConnectedGamepad } from "./gamepad";
import {
  COUNT_PULSES, CUT_POINT, HERO, PULSE_MS, RESUME_COUNT_PULSES, WIN_AT, advanceFrameClock, audioPulse, autoCuts, barOfPulse, beeScores,
  collectFalls, COUNT_TICK, createRun, jarLevel, leadNote, musicForEighth, nextOpenCut, outcomeOf, outputLatencySeconds,
  practiceFirst, pressAt, risingEdge, scoreLength, songStartAfterPause, targetPlacement, targetVisible, throwPulses,
  type BeeMode, type BeeNote, type BeeRun, type Outcome, type PressResult,
} from "./beeNinja";
import "./beeNinja.css";

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

const COLORS = ["#ef79a9", "#f2c230", "#5aa0dc", "#b98be0"];
const START_DELAY_S = 0.15;
const STAGE_WIDTH = 960;
const emptyView: View = { pulse: -1, targets: [], halves: [], jar: 0, ring: null, lamp: -1, heroPose: "espera", melisaPose: 0, melisaThrowing: false, melisaBubble: null, greet: null, feedback: null, caption: "", phase: "", counting: 0 };

const CAPTIONS: Record<BeeMode, readonly [number, string][]> = {
  demo: [[0, "Mira cómo lo hace Noa."], [4, "Flor: un corte cuando llega a la varita."], [8, "Dúo: dos flores, dos cortes seguidos."], [12, "La mariquita no se corta: déjala pasar."]],
  practice: [[0, "¡Ahora tú! Escucha la cuenta de Melisa."], [4, "Corta cuando la flor llegue a la punta."], [12, "¡Zum-zum! Dos cortes seguidos."], [16, "¡A la mariquita no!"]],
  song: [[0, "¡Que empiece el duelo!"], [4, ""]],
};

const RESULT_TEXT: Record<Outcome["result"], { title: string; text: string }> = {
  perfecto: { title: "¡Perfecto!", text: "¡No ha caído ni una flor! Melisa te regala su marco de flores." },
  bien: { title: "¡Bien hecho!", text: "El tarro de miel ha pasado la raya dorada. ¡Melisa está muy contenta!" },
  casi: { title: "¡Casi!", text: "El tarro aún no llega a la raya dorada. Melisa quiere jugar otra vez." },
};

function Flower({ color }: { color: string }) {
  return <svg viewBox="0 0 64 64" aria-hidden="true">
    {Array.from({ length: 6 }, (_, index) => <ellipse key={index} cx="32" cy="16" rx="9" ry="14" transform={`rotate(${index * 60} 32 32)`} fill={color} stroke="#2f1d33" strokeWidth="2.5" />)}
    <circle cx="32" cy="32" r="9" fill="#ffd34d" stroke="#2f1d33" strokeWidth="2.5" />
    <path d="M32 41 Q34 54 30 64" stroke="#3f7a2a" strokeWidth="4" fill="none" />
  </svg>;
}

function Ladybug() {
  return <svg viewBox="0 0 64 64" aria-hidden="true">
    <ellipse cx="22" cy="20" rx="12" ry="9" fill="#e8f6ffcc" stroke="#2f1d33" strokeWidth="2" />
    <ellipse cx="40" cy="18" rx="12" ry="9" fill="#e8f6ffcc" stroke="#2f1d33" strokeWidth="2" />
    <circle cx="50" cy="36" r="9" fill="#2f1d33" /><circle cx="53" cy="33" r="2" fill="#fff" />
    <ellipse cx="32" cy="38" rx="18" ry="15" fill="#e2463f" stroke="#2f1d33" strokeWidth="3" />
    <path d="M32 23 V53" stroke="#2f1d33" strokeWidth="2.5" />
    <circle cx="24" cy="34" r="3.5" fill="#2f1d33" /><circle cx="40" cy="34" r="3.5" fill="#2f1d33" />
    <circle cx="26" cy="45" r="3" fill="#2f1d33" /><circle cx="38" cy="45" r="3" fill="#2f1d33" />
  </svg>;
}

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
    melisaBubble: shownCount ? String(shownCount) : applauding ? "¡Bravo!" : throwing ? (throwing.type === "duo" ? "¡zum-zum!" : "¡zum!") : null,
    greet: session.greet && session.greet.until > pulse ? { x: session.greet.x, y: session.greet.y } : null,
    feedback: session.feedback && session.feedback.until > pulse ? { text: session.feedback.text, miss: session.feedback.miss } : null,
  };
}

export function BeeNinjaGame({ paused, muted, musicVolume, effectsVolume, reduceMotion, levelCompleted, onAbandon, onWin, playSound, friendlyReplay = false }: Props) {
  const sessionRef = useRef<Session | null>(null);
  const audioRef = useRef<AudioRig | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [mode, setMode] = useState<BeeMode | null>(null);
  const [finished, setFinished] = useState<{ mode: BeeMode; outcome: Outcome } | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [clockKind, setClockKind] = useState<"audio" | "frame" | null>(null);
  const [view, setView] = useState<View>(emptyView);
  const [showLeave, setShowLeave] = useState(false);
  const [message, setMessage] = useState("La Reina Melisa te lanza flores. ¡Córtalas con tu varita al ritmo de la música!");
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
      const note = leadNote(session.run);
      playCue([
        { offset: 0, frequency: note, duration: 0.55, wave: "triangle", volume: 0.16, bus: "cue", glideTo: note * 0.995 },
        { offset: 0, frequency: note * 2, duration: 0.12, wave: "sine", volume: 0.05, bus: "cue" },
        { offset: 0, frequency: 0, duration: 0.09, wave: "sine", volume: 0.09, bus: "cue", noise: "high" },
        { offset: 0, frequency: 2600, duration: 0.16, wave: "sine", volume: 0.04, bus: "cue", glideTo: 3300 },
      ]);
      session.feedback = { text: "¡Zas!", miss: false, until: pulse + 0.5 };
      session.halves.push({ id: session.halfId++, color: result.target.color, start: pulse });
      if (session.run.mode === "song") {
        const level = jarLevel(session.run.cut);
        if (level > session.lastJar) { session.lastJar = level; session.celebrateUntil = pulse + 0.9; }
        if (session.run.cut === WIN_AT) { session.applaudFrom = pulse; setMessage("¡El tarro ha pasado la raya dorada! Sigue cortando hasta el final."); }
      }
    } else if (result.kind === "ladybug") {
      session.cutUntil = -Infinity;
      const place = targetPlacement(result.target, pulse, reduceMotion);
      session.greet = { x: place.x, y: place.y, until: pulse + 1.2 };
      setMessage("¡A la mariquita no se la corta! Déjala pasar.");
    } else {
      playCue([{ offset: 0, frequency: 110, duration: 0.16, wave: "sine", volume: 0.14, bus: "cue", glideTo: 80 }]);
      session.feedback = { text: "¡Uy!", miss: true, until: pulse + 0.5 };
      setMessage("Espera a que la flor llegue a la punta de la varita.");
    }
  }, [playCue, reduceMotion]);

  const finish = useCallback((session: Session) => {
    session.ended = true;
    if (audioRef.current) freshSegment();
    const outcome = outcomeOf(session.run);
    setMode(null);
    setFinished({ mode: session.run.mode, outcome });
    setMessage(session.run.mode === "song" ? RESULT_TEXT[outcome.result].text : session.run.mode === "demo"
      ? "¡Ya lo has visto! Ahora ensaya tú, o empieza el duelo." : "¡Buen ensayo! Puedes ensayar otra vez o empezar el duelo.");
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
    setMessage(nextMode === "demo" ? "Mira cómo lo hace Noa." : "Escucha la cuenta de Melisa y corta cuando la flor llegue a la varita.");
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
          playCue([{ offset: 0, frequency: 200, duration: 0.2, wave: "triangle", volume: 0.06, bus: "cue", glideTo: 90 }]);
          session.feedback = { text: "plof", miss: true, until: pulse + 0.6 };
          setMessage("No pasa nada. ¡Ya viene otra flor!");
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
        <p className="eyebrow">{friendlyReplay ? "Juego amistoso" : "Juego del guardián"} · {boss.name}</p>
        <h2 id="bee-ninja-title">La abeja ninja</h2>
        <p>Melisa lanza flores. Córtalas cuando lleguen a la punta de tu varita.</p>
        <p className="boss-challenge">★ Reto de amistad: {boss.challenge.label}</p>
      </div>
    </header>

    <div className={`bee-ninja-frame${reduceMotion ? " is-still" : ""}`} ref={frameRef} onPointerDown={(event) => { if (event.button === 0 && mode && mode !== "demo") strike(); }}>
      <div className="bee-ninja-stage" style={{ transform: `scale(${scale})` }} aria-hidden="true">
        <img className="bee-ninja-background" src="./assets/worlds/world-11.webp" alt="" />
        <div className="bee-ninja-ground" />
        <div className="bee-ninja-comb">{[0, 1, 2, 3].map((index) => <span key={index} className={mode && view.lamp === index ? "is-on" : undefined} />)}</div>
        <div className={`bee-ninja-melisa${view.melisaThrowing && mode ? " is-throwing" : ""}`} style={{ backgroundImage: `url("${boss.assetAtlas}")`, backgroundPosition: `${melisaPose * 25}% 100%` }} />
        {mode && view.melisaBubble && <span className="bee-ninja-bubble is-melisa">{view.melisaBubble}</span>}
        <div className={`bee-ninja-jar${view.jar >= 2 ? " is-reached" : ""}`} style={{ backgroundImage: 'url("./assets/sprites/tarro-miel-v0.png")', backgroundPosition: `${(mode || ended ? view.jar : 0) * 25}% 0` }}><span className="bee-ninja-line" /></div>
        {view.ring && mode && <div className={`bee-ninja-ring${view.ring.ready ? " is-ready" : ""}`} style={{ left: CUT_POINT.x - 50, top: CUT_POINT.y - 50, transform: `scale(${view.ring.scale})` }} />}
        {view.ring?.ready && mode && <div className="bee-ninja-now" style={{ left: CUT_POINT.x - 26, top: CUT_POINT.y - 150 }}>¡Ya!</div>}
        <div className="bee-ninja-hero" data-pose={heroPose} style={{ backgroundImage: 'url("./assets/sprites/noa-abeja-v0.png")', left: HERO.left, top: HERO.top, width: HERO.width, height: HERO.height }} />
        {view.targets.map((target) => <div key={target.id} className={`bee-ninja-target is-${target.kind}`} style={{ transform: `translate(${target.x - 32}px, ${target.y - 32}px) rotate(${target.rotation}deg)`, opacity: target.opacity }}>
          {target.kind === "ladybug" ? <Ladybug /> : <Flower color={COLORS[target.color % COLORS.length]} />}
        </div>)}
        {view.halves.map((half) => <div key={half.id} className="bee-ninja-cut-flower" style={{ left: CUT_POINT.x - 32, top: CUT_POINT.y - 32, "--petal": COLORS[half.color % COLORS.length] } as CSSProperties}>
          <span className="is-left"><Flower color={COLORS[half.color % COLORS.length]} /></span>
          <span className="is-right"><Flower color={COLORS[half.color % COLORS.length]} /></span>
          {!reduceMotion && [0, 1, 2, 3].map((petal) => <i key={petal} style={{ "--dx": `${870 - CUT_POINT.x + (petal - 1.5) * 12}px`, "--dy": `${430 - CUT_POINT.y}px` } as CSSProperties} />)}
        </div>)}
        {view.greet && <span className="bee-ninja-bubble is-pink" style={{ left: view.greet.x - 24, top: view.greet.y - 70 }}>¡Hola!</span>}
        {view.feedback && <div className={`bee-ninja-feedback${view.feedback.miss ? " is-miss" : ""}`} style={{ left: CUT_POINT.x - 130, top: CUT_POINT.y - 110 }}>{view.feedback.text}</div>}
        {mode && view.caption && <div className="bee-ninja-caption">{view.caption}</div>}
        {mode && view.counting > 0 && <div className="bee-ninja-caption">¡Seguimos! Melisa cuenta: {view.counting}</div>}
        {mode && view.phase && <span className="bee-ninja-phase">{view.phase}</span>}
        {result && <div className="bee-ninja-result"><strong>{RESULT_TEXT[result.result].title}</strong></div>}
      </div>
    </div>
    {mode && <progress className="bee-ninja-progress" max={total} value={Math.max(0, view.pulse)} aria-label="Avance de la canción" />}

    <div className="bee-ninja-controls">
      <p className="bee-ninja-message" aria-live="polite">{result ? <><b>{RESULT_TEXT[result.result].title}</b> {message}</> : message}</p>
      {mode && mode !== "demo" && <button className="pixel-button primary bee-ninja-cut" type="button" disabled={interactionPaused}
        onPointerDown={(event) => { event.stopPropagation(); if (event.button === 0) strike(); }} onClick={(event) => { if (event.detail === 0) strike(); }}>¡Corta!</button>}
      {mode === "demo" && <button className="pixel-button" type="button" onClick={() => { const session = sessionRef.current; if (session) finish(session); }}>Terminar demostración</button>}
      {mode === "practice" && <button className="pixel-button" type="button" onClick={() => { const session = sessionRef.current; if (session) finish(session); }}>Terminar ensayo</button>}
      {!mode && !finished && <div className="bee-ninja-actions">
        <button className={`pixel-button${highlightPractice ? " primary" : ""}`} type="button" data-gamepad-default={highlightPractice || undefined} onClick={() => void begin("demo")}>Practicar</button>
        <button className={`pixel-button${highlightPractice ? "" : " primary"}`} type="button" data-gamepad-default={!highlightPractice || undefined} onClick={() => void begin("song")}>¡A jugar!</button>
      </div>}
      {finished?.mode === "demo" && <div className="bee-ninja-actions">
        <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => void begin("practice")}>Ensayar</button>
        <button className="pixel-button" type="button" onClick={() => void begin("song")}>¡A jugar!</button>
      </div>}
      {finished?.mode === "practice" && <div className="bee-ninja-actions">
        <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => void begin("song")}>¡A jugar!</button>
        <button className="pixel-button" type="button" onClick={() => void begin("practice")}>Ensayar otra vez</button>
      </div>}
      {result?.won && <div className="bee-ninja-actions">
        <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => confirmWin(result.challengeCompleted)}>{friendlyReplay ? "Volver a mis amigos" : "Continuar la aventura ▶"}</button>
        <button className="pixel-button" type="button" onClick={() => void begin("song")}>Jugar otra vez</button>
      </div>}
      {result?.won && !result.challengeCompleted && <p className="bee-ninja-note">Si cortas todas las flores sin dejar caer ninguna, Melisa te dará su marco de flores.</p>}
      {result && !result.won && <div className="bee-ninja-actions">
        <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => void begin("song")}>Intentar otra vez</button>
        <button className="pixel-button" type="button" onClick={() => void begin("demo")}>Practicar</button>
        <button className="pixel-button" type="button" onClick={leave}>{friendlyReplay ? "Volver a mis amigos" : "Volver al mapa"}</button>
      </div>}
      {mode && clockKind === "frame" && <p className="bee-ninja-note">{muted ? "Sonido apagado: sigue el aro dorado y el panal." : "Sin sonido: sigue el aro dorado y el panal."}</p>}
      <p className="bee-ninja-help">Teclado: Espacio · Mando: botón A · Toca la escena o «¡Corta!»</p>
      {!(result && !result.won) && <button className="text-button duel-abandon" type="button" onClick={leave}>{friendlyReplay ? "Volver a mis amigos" : "Volver al mapa"}</button>}
    </div>
  </Dialog>

  {showLeave && <Dialog labelledBy="bee-ninja-leave-title" className="game-modal compact" gamepad onClose={() => setShowLeave(false)}>
    <p className="eyebrow">Un momento</p><h2 id="bee-ninja-leave-title">¿Volvemos al mapa?</h2>
    <p>Podrás jugar con Melisa otra vez cuando quieras. Tus pegatinas guardadas seguirán contigo.</p>
    <button className="pixel-button primary" type="button" data-gamepad-default data-gamepad-back onClick={() => setShowLeave(false)}>Seguir jugando</button>
    <button className="pixel-button" type="button" onClick={onAbandon}>Sí, volver al mapa</button>
  </Dialog>}
  </>;
}
