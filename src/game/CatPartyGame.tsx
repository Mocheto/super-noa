import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { firstConnectedGamepad } from "./gamepad";
import {
  BELT_Y, HIT_WINDOW_PULSES, PULSE_MS, STUMP_X, TRAVEL_PULSES, audioPulse, autoHits, barOfPulse, collectMisses, createRun, leadNote,
  musicForEighth, nextOpenHit, outputLatencySeconds, partyScores, pieceVisible, piecePlacement, pressAt, scoreLength,
  type PartyMode, type PartyNote, type PartyRun, type PressResult,
} from "./catParty";
import "./catParty.css";

const sprites = "./assets/sprites";
const STAGE_WIDTH = 960;
const START_DELAY_S = 0.15;
const PILE_LIMIT = 18;

type Props = {
  paused: boolean;
  muted: boolean;
  musicVolume: number;
  effectsVolume: number;
  reduceMotion: boolean;
  onPause: () => void;
  onExit: () => void;
};

type Half = { id: number; x: number; y: number; width: number; height: number; side: -1 | 1; start: number };
type Session = {
  run: PartyRun;
  clock: "audio" | "frame";
  songStart: number;
  frameMs: number;
  lastPulse: number;
  nextEighth: number;
  chopUntil: number;
  yarnBubbleUntil: number;
  feedback: { text: string; miss: boolean; until: number } | null;
  halves: Half[];
  halfId: number;
  ended: boolean;
};

type PieceView = { id: number; type: PartyRun["pieces"][number]["type"]; x: number; y: number; rotation: number; opacity: number; width: number; height: number; marks: boolean[]; cracked: boolean };
type View = {
  pulse: number;
  pieces: PieceView[];
  halves: Half[];
  pile: number;
  ring: { radius: number; ready: boolean } | null;
  lamp: number;
  bubbleA: { text: string; pink: boolean } | null;
  bubbleB: string | null;
  chop: boolean;
  feedback: { text: string; miss: boolean } | null;
  caption: string;
  phase: string;
};

const emptyView: View = { pulse: -1, pieces: [], halves: [], pile: 0, ring: null, lamp: -1, bubbleA: null, bubbleB: null, chop: false, feedback: null, caption: "", phase: "" };

const CAPTIONS: Record<PartyMode, readonly [number, string][]> = {
  demo: [[0, "Mira cómo lo hace Noa."], [4, "Tronco pequeño: un golpe."], [8, "Tronco mediano: dos golpes seguidos."], [12, "El ovillo no se corta: déjalo pasar."]],
  practice: [[0, "¡Ensayamos! Escucha la cuenta."], [4, "Golpea cuando el tronco llegue al tajo."]],
  song: [[0, "¡Que empiece la fiesta!"], [4, ""]],
};

const pieceSize = (type: PieceView["type"]) => type === "yarn" ? { width: 62, height: 56 } : type === "small" ? { width: 118, height: 33 } : { width: 200, height: 56 };

function snapshot(session: Session, pulse: number, reduceMotion: boolean): View {
  const { run } = session;
  const whole = Math.floor(pulse);
  const pieces = run.pieces.filter((item) => pieceVisible(item, pulse)).map((item) => {
    const place = piecePlacement(item, pulse, reduceMotion);
    const size = pieceSize(item.type);
    return { id: item.id, type: item.type, ...size, x: place.x - size.width / 2, y: place.y - size.height, rotation: place.rotation, opacity: place.opacity, marks: item.hits.map((hit) => item.done.includes(hit)), cracked: item.done.length > 0 };
  });
  const next = nextOpenHit(run, pulse);
  const untilHit = next - pulse;
  const ring = untilHit < TRAVEL_PULSES && untilHit > -0.2 ? { radius: reduceMotion ? 40 : 34 + Math.max(0, untilHit) * 46, ready: Math.abs(untilHit) <= HIT_WINDOW_PULSES * 0.6 } : null;
  const pushed = run.pieces.find((item) => item.push === whole && pulse - item.push < 0.7);
  const echoed = run.pieces.find((item) => item.type === "medium" && item.push + 1 === whole && pulse - whole < 0.7);
  const bubbleA = session.yarnBubbleUntil > pulse ? { text: "¡Es mi ovillo!", pink: true }
    : pushed ? { text: pushed.type === "yarn" ? "¡plop!" : "¡miau!", pink: pushed.type === "yarn" } : null;
  const counting = pulse >= 0 && pulse < 4 && pulse - whole < 0.65;
  const caption = CAPTIONS[run.mode].filter(([from]) => pulse >= from).at(-1)?.[1] ?? "";
  const phase = run.score.phases.filter(({ fromBar }) => barOfPulse(Math.max(0, whole)) >= fromBar).at(-1)?.name ?? "";
  return {
    pulse, pieces, ring, caption, phase,
    halves: session.halves.filter((half) => pulse - half.start < 0.9),
    pile: run.broken,
    lamp: pulse >= 0 ? whole % 4 : -1,
    bubbleA,
    bubbleB: counting ? String(whole + 1) : echoed ? "¡miau!" : null,
    chop: session.chopUntil > pulse,
    feedback: session.feedback && session.feedback.until > pulse ? { text: session.feedback.text, miss: session.feedback.miss } : null,
  };
}

export function CatParty({ paused, muted, musicVolume, effectsVolume, reduceMotion, onPause, onExit }: Props) {
  const sessionRef = useRef<Session | null>(null);
  const audioRef = useRef<{ context: AudioContext; music: GainNode; cue: GainNode; noise: AudioBuffer } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [mode, setMode] = useState<PartyMode | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [silent, setSilent] = useState(false);
  const [clockKind, setClockKind] = useState<"audio" | "frame" | null>(null);
  const [view, setView] = useState<View>(emptyView);
  const [message, setMessage] = useState("Bruma y sus amigos necesitan leña para la fiesta. ¿Ayudas a Noa a cortarla?");
  const soundOff = muted || silent;

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
    audio.music.gain.value = soundOff ? 0 : musicVolume / 100;
    audio.cue.gain.value = soundOff ? 0 : effectsVolume / 100;
  }, [effectsVolume, musicVolume, soundOff, mode]);

  const ensureAudio = useCallback(async () => {
    try {
      if (!audioRef.current) {
        const context = new AudioContext();
        const music = context.createGain();
        const cue = context.createGain();
        music.connect(context.destination);
        cue.connect(context.destination);
        const noise = context.createBuffer(1, Math.floor(context.sampleRate * 0.2), context.sampleRate);
        const data = noise.getChannelData(0);
        for (let index = 0; index < data.length; index++) data[index] = Math.random() * 2 - 1;
        audioRef.current = { context, music, cue, noise };
      }
      const { context } = audioRef.current;
      if (context.state !== "running") await Promise.race([context.resume(), new Promise((resolve) => setTimeout(resolve, 400))]);
      return context.state === "running";
    } catch {
      return false;
    }
  }, []);

  const playNote = useCallback((note: PartyNote, when: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const { context } = audio;
    const bus = note.bus === "music" ? audio.music : audio.cue;
    const gain = context.createGain();
    if (note.noise) {
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      source.buffer = audio.noise;
      filter.type = "highpass";
      filter.frequency.value = 6000;
      gain.gain.setValueAtTime(note.volume, when);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + note.duration);
      source.connect(filter).connect(gain).connect(bus);
      source.start(when);
      source.stop(when + note.duration + 0.01);
      return;
    }
    const oscillator = context.createOscillator();
    oscillator.type = note.wave;
    oscillator.frequency.setValueAtTime(note.frequency, when);
    if (note.glideTo) oscillator.frequency.exponentialRampToValueAtTime(note.glideTo, when + note.duration);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(note.volume, when + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + note.duration);
    oscillator.connect(gain).connect(bus);
    oscillator.start(when);
    oscillator.stop(when + note.duration + 0.03);
  }, []);

  const playNow = useCallback((frequency: number, duration: number, wave: OscillatorType, volume: number, glideTo?: number) => {
    const audio = audioRef.current;
    if (!audio || audio.context.state !== "running") return;
    playNote({ offset: 0, frequency, duration, wave, volume, bus: "cue", glideTo }, audio.context.currentTime + 0.003);
  }, [playNote]);

  const pulseNow = useCallback((session: Session) => {
    const audio = audioRef.current;
    if (session.clock === "audio" && audio && audio.context.state === "running") {
      return audioPulse(audio.context.currentTime, session.songStart, outputLatencySeconds(audio.context));
    }
    if (session.clock === "audio") return session.lastPulse;
    return session.frameMs / PULSE_MS;
  }, []);

  const react = useCallback((session: Session, result: PressResult, pulse: number) => {
    if (result.kind === "hit") {
      playNow(leadNote(session.run, pulse), 0.3, "triangle", 0.13);
      playNow(720, 0.06, "sine", 0.05);
      session.feedback = { text: "¡Toc!", miss: false, until: pulse + 0.5 };
      if (result.broke) {
        const { width, height } = pieceSize(result.piece.type);
        for (const side of [-1, 1] as const) session.halves.push({ id: session.halfId++, x: STUMP_X - width / 2 + (side > 0 ? width / 2 : 0), y: BELT_Y - height, width: width / 2, height, side, start: pulse });
        setMessage(result.piece.type === "small" ? "¡Toc! Un tronco más para la hoguera." : "¡Toc, toc! El tronco mediano está listo.");
      } else setMessage("¡Toc! Falta otro golpe.");
    } else if (result.kind === "yarn") {
      playNow(92, 0.16, "sine", 0.14);
      session.feedback = { text: "¡Boing!", miss: true, until: pulse + 0.5 };
      session.yarnBubbleUntil = pulse + 1.5;
      setMessage("Era el ovillo. ¡Déjalo pasar sin golpear!");
    } else {
      playNow(92, 0.16, "sine", 0.14);
      session.feedback = { text: "¡Uy!", miss: true, until: pulse + 0.5 };
      setMessage("Espera a que el tronco llegue al tajo.");
    }
  }, [playNow]);

  const finish = useCallback((session: Session) => {
    session.ended = true;
    const finishedMode = session.run.mode;
    setMode(null);
    setCelebrating(finishedMode === "song");
    setMessage(finishedMode === "song" ? "¡La hoguera ya brilla! Gracias por la leña." : finishedMode === "demo"
      ? "¡Ya lo has visto! Puedes ensayar o empezar la canción." : "¡Buen ensayo! Puedes ensayar otra vez o empezar la canción.");
  }, []);

  const strike = useCallback(() => {
    const session = sessionRef.current;
    if (!session || session.ended || paused || session.run.mode === "demo") return;
    const pulse = pulseNow(session);
    if (pulse < 0) return;
    session.chopUntil = pulse + 0.2;
    react(session, pressAt(session.run, pulse), pulse);
  }, [paused, pulseNow, react]);

  const begin = async (nextMode: PartyMode) => {
    const session: Session = {
      run: createRun(nextMode), clock: "frame", songStart: 0, frameMs: -START_DELAY_S * 1000, lastPulse: -1, nextEighth: 0,
      chopUntil: -Infinity, yarnBubbleUntil: -Infinity, feedback: null, halves: [], halfId: 0, ended: false,
    };
    sessionRef.current = session;
    setView(emptyView);
    setCelebrating(false);
    setMessage(nextMode === "demo" ? "Mira cómo lo hace Noa." : "Escucha la cuenta y golpea cuando el tronco llegue al tajo.");
    const audioReady = !muted && await ensureAudio();
    if (sessionRef.current !== session) return;
    if (audioReady && audioRef.current) {
      session.clock = "audio";
      session.songStart = audioRef.current.context.currentTime + START_DELAY_S;
    }
    setClockKind(session.clock);
    setMode(nextMode);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !mode || sessionRef.current?.clock !== "audio") return;
    if (paused) void audio.context.suspend().catch(() => {});
    else void audio.context.resume().catch(() => {});
  }, [mode, paused]);

  useEffect(() => {
    if (!mode || paused) return;
    let frame = 0;
    let last: number | null = null;
    const readA = () => Boolean(firstConnectedGamepad()?.buttons[0]?.pressed);
    let wasDown = readA();
    const update = (now: number) => {
      const session = sessionRef.current;
      if (!session || session.ended) return;
      if (session.clock === "frame") {
        session.frameMs += last === null ? 0 : Math.min(100, now - last);
        last = now;
      }
      const audio = audioRef.current;
      if (session.clock === "audio" && audio && audio.context.state === "running") {
        const horizon = audio.context.currentTime + 0.25;
        const total = scoreLength(session.run.score) * 2;
        while (session.nextEighth < total) {
          const when = session.songStart + session.nextEighth * PULSE_MS / 2000;
          if (when > horizon) break;
          const eighth = session.nextEighth++;
          if (when < audio.context.currentTime - 0.02) continue;
          for (const note of musicForEighth(session.run, eighth)) playNote(note, when + note.offset);
        }
      }
      const pulse = pulseNow(session);
      session.lastPulse = pulse;
      if (session.run.mode === "demo") {
        for (const result of autoHits(session.run, pulse)) { session.chopUntil = pulse + 0.2; react(session, result, pulse); }
      } else {
        for (const missed of collectMisses(session.run, pulse)) {
          playNow(180, 0.18, "triangle", 0.06, 90);
          session.feedback = { text: "Se fue rodando", miss: true, until: pulse + 0.6 };
          setMessage(missed.done.length ? "Faltó el segundo golpe. ¡No pasa nada, viene otro!" : "No pasa nada. ¡Ya viene otro tronco!");
        }
      }
      const down = readA();
      if (down && !wasDown) strike();
      wasDown = down;
      if (pulse >= scoreLength(session.run.score)) {
        setView(snapshot(session, pulse, reduceMotion));
        finish(session);
        return;
      }
      setView(snapshot(session, pulse, reduceMotion));
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space" || mode === "demo") return;
      const button = event.target instanceof Element ? event.target.closest("button") : null;
      if (button && !button.classList.contains("cat-party-strike")) return;
      event.preventDefault();
      if (!event.repeat) strike();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
    };
  }, [finish, mode, paused, playNote, playNow, pulseNow, react, reduceMotion, strike]);

  const total = mode ? scoreLength(partyScores[mode]) : 0;
  return <section className={`cat-party-screen${reduceMotion ? " cat-party-still" : ""}`} data-gamepad-managed={mode ? "true" : undefined} aria-labelledby="cat-party-title">
    <header className="cat-party-header">
      <div><p className="eyebrow">El Bosque de los Gatitos</p><h2 id="cat-party-title">La fiesta de los gatitos</h2></div>
      <div className="cat-party-options">
        <button className="pixel-button" type="button" aria-pressed={soundOff} disabled={muted} onClick={() => setSilent(!silent)}>{soundOff ? "Sonido apagado" : "Silenciar"}</button>
        {mode && <button className="pixel-button" type="button" onClick={onPause}>Pausa</button>}
        <button className="pixel-button" type="button" data-gamepad-back onClick={onExit}>Volver al mapa</button>
      </div>
    </header>
    <div className="cat-party-frame" ref={frameRef}>
      <div className="cat-party-stage" style={{ transform: `scale(${scale})` }} aria-hidden="true">
        <div className="cat-party-sky" />
        <svg className="cat-party-scenery" viewBox="0 0 960 540">
          <circle cx="720" cy="250" r="54" fill="#ffe2a0" opacity=".85" />
          <path d="M0 330 Q160 250 320 300 T640 285 T960 300 V540 H0Z" fill="#8a6a8f" opacity=".55" />
          <path d="M0 360 Q200 300 420 345 T960 330 V540 H0Z" fill="#5d6e4c" />
          <g fill="#3c4a33"><path d="M60 420 L95 250 L130 420Z" /><path d="M120 420 L160 220 L200 420Z" /><path d="M700 420 L730 290 L760 420Z" /><path d="M790 420 L830 230 L870 420Z" /><path d="M860 420 L895 260 L930 420Z" /></g>
          <path d="M0 26 Q240 76 480 30 T960 28" fill="none" stroke="#5b3620" strokeWidth="3" />
          <g stroke="#2f1d33" strokeWidth="2">
            <path d="M40 34 l14 0 l-7 18z" fill="#ff8fa8" /><path d="M110 46 l14 0 l-7 18z" fill="#ffd76a" /><path d="M180 54 l14 0 l-7 18z" fill="#8fd3ff" />
            <path d="M250 56 l14 0 l-7 18z" fill="#b6f08e" /><path d="M640 46 l14 0 l-7 18z" fill="#b6f08e" /><path d="M710 48 l14 0 l-7 18z" fill="#ff8fa8" />
            <path d="M780 44 l14 0 l-7 18z" fill="#ffd76a" /><path d="M850 36 l14 0 l-7 18z" fill="#8fd3ff" /><path d="M910 30 l14 0 l-7 18z" fill="#b6f08e" />
          </g>
        </svg>
        <div className="cat-party-ground" />
        <svg className={`cat-party-fire${celebrating ? " is-lit" : ""}`} viewBox="0 0 120 110">
          <g className="cat-party-flame"><path d="M60 20 Q85 55 74 80 Q60 92 46 80 Q35 55 60 20Z" fill="#ff9a3c" /><path d="M60 45 Q72 65 66 80 Q60 86 54 80 Q48 65 60 45Z" fill="#ffe27a" /></g>
          <g stroke="#2f1d33" strokeWidth="3"><rect x="18" y="82" width="84" height="14" rx="7" fill="#8a5632" transform="rotate(-12 60 89)" /><rect x="18" y="82" width="84" height="14" rx="7" fill="#9a6338" transform="rotate(12 60 89)" /></g>
        </svg>
        <div className="cat-party-lamps">{[0, 1, 2, 3].map((index) => <span key={index} className={`${index === 0 ? "is-first" : ""}${mode && view.lamp === index ? " is-on" : ""}`} />)}</div>
        <div className="cat-party-belt"><div className="cat-party-rollers">{Array.from({ length: 7 }, (_, index) => <i key={index} />)}</div></div>
        <div className="cat-party-pile">{Array.from({ length: Math.min(PILE_LIMIT, view.pile) }, (_, index) =>
          <img key={index} src={`${sprites}/gatitos-tronco.png`} alt="" style={{ left: (index % 6) * 30 + Math.floor(index / 6) * 14, top: 70 - Math.floor(index / 6) * 16 }} />)}</div>
        <div className="cat-party-stump"><div className="cat-party-stump-side" /><div className="cat-party-stump-top" /></div>
        {view.ring && <div className={`cat-party-ring${view.ring.ready ? " is-ready" : ""}`} style={{ width: view.ring.radius * 2, height: view.ring.radius * 2, left: STUMP_X - view.ring.radius, top: BELT_Y - 18 - view.ring.radius }} />}
        {view.ring?.ready && <div className="cat-party-now">¡Ahora!</div>}
        <div className="cat-party-lumber">
          <img src={`${sprites}/noa-cat-yarn-v2.webp`} alt="" />
          <svg className={`cat-party-axe${view.chop ? " is-chopping" : ""}`} viewBox="0 0 74 120">
            <rect x="32" y="22" width="10" height="96" rx="4" fill="#9a6338" stroke="#2f1d33" strokeWidth="3" />
            <path d="M40 8 Q70 10 70 34 Q60 46 40 40 Z" fill="#cfd6dd" stroke="#2f1d33" strokeWidth="3" />
            <path d="M36 12 Q12 18 14 34 Q24 38 36 34 Z" fill="#b5bec7" stroke="#2f1d33" strokeWidth="3" />
          </svg>
        </div>
        <div className={`cat-party-kitten is-first${view.bubbleA && !celebrating ? " is-pushing" : ""}${celebrating ? " is-party" : ""}`}>
          <img src={`${sprites}/world-cat-2-v1.png`} alt="" />
          {view.bubbleA && <span className={`cat-party-bubble${view.bubbleA.pink ? " is-pink" : ""}`}>{view.bubbleA.text}</span>}
        </div>
        <div className={`cat-party-kitten is-second${view.bubbleB && !celebrating ? " is-pushing" : ""}${celebrating ? " is-party" : ""}`}>
          <img src={`${sprites}/world-cat-4-v1.png`} alt="" />
          {view.bubbleB && <span className="cat-party-bubble">{view.bubbleB}</span>}
        </div>
        {view.pieces.map((item) => <div key={item.id} className={`cat-party-piece is-${item.type}${item.cracked && item.type === "medium" ? " is-cracked" : ""}`}
          style={{ left: item.x, top: item.y, width: item.width, height: item.height, opacity: item.opacity, transform: `rotate(${item.rotation}deg)` }}>
          <img src={item.type === "yarn" ? `${sprites}/yarn-ball-v1.webp` : `${sprites}/gatitos-tronco.png`} alt="" />
          {item.type !== "yarn" && <span className="cat-party-marks">{item.marks.map((done, index) => <b key={index} className={done ? "is-done" : undefined} />)}</span>}
        </div>)}
        {view.halves.map((half) => <div key={half.id} className={`cat-party-half ${half.side < 0 ? "is-left" : "is-right"}`} style={{ left: half.x, top: half.y, width: half.width, height: half.height }}>
          <img src={`${sprites}/gatitos-tronco.png`} alt="" style={{ width: half.width * 2, height: half.height, marginLeft: half.side > 0 ? -half.width : 0 }} />
        </div>)}
        {view.feedback && <div className={`cat-party-feedback${view.feedback.miss ? " is-miss" : ""}`}>{view.feedback.text}</div>}
        {mode && view.caption && <div className="cat-party-caption">{view.caption}</div>}
        {mode && view.phase && <span className="cat-party-phase">{view.phase}</span>}
      </div>
    </div>
    {mode && <progress className="cat-party-progress" max={total} value={Math.max(0, view.pulse)} aria-label="Avance de la canción" />}
    <p className="cat-party-message" aria-live="polite">{message}</p>
    <div className="cat-party-controls">
      {mode && mode !== "demo" && <button className="pixel-button primary cat-party-strike" type="button" disabled={paused} onPointerDown={(event) => { if (event.button === 0) strike(); }} onClick={(event) => { if (event.detail === 0) strike(); }}>¡Golpea!</button>}
      {mode === "demo" && <button className="pixel-button" type="button" onClick={() => { const session = sessionRef.current; if (session) finish(session); }}>Terminar demostración</button>}
      {mode === "practice" && <button className="pixel-button" type="button" onClick={() => { const session = sessionRef.current; if (session) finish(session); }}>Terminar ensayo</button>}
      {!mode && <>
        <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => void begin("song")}>{celebrating ? "Jugar otra vez" : "Empezar la canción"}</button>
        {!celebrating && <><button className="pixel-button" type="button" onClick={() => void begin("demo")}>Ver la demostración</button><button className="pixel-button" type="button" onClick={() => void begin("practice")}>Ensayar</button></>}
      </>}
    </div>
    {clockKind === "frame" && mode && <p className="cat-party-note">Sin sonido: sigue los farolillos y el aro dorado.</p>}
  </section>;
}

