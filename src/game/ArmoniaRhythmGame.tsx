import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog } from "./Dialog";
import type { SoundKind } from "./GameCanvas";
import { firstConnectedGamepad } from "./gamepad";
import {
  ARMONIA_BEAT_COUNT, ARMONIA_COUNT_IN_BEATS, ARMONIA_ROUNDS, adjustArmoniaScore,
  ARMONIA_TARGET_COUNT, armoniaMelodies, beatTimeMs, findTargetWithinWindow, makeArmoniaChallenge,
  type ArmoniaRound,
} from "./armoniaRhythm";

type Props = {
  paused: boolean;
  onAbandon: () => void;
  onWin: (challengeCompleted: boolean) => void;
  playSound: (kind: SoundKind) => void;
  muted?: boolean;
  friendlyReplay?: boolean;
};
type Mode = "demo" | "practice" | "challenge";
type Phase = "intro" | "starting" | "countin" | "playing" | "practice-ready" | "round-done" | "failed" | "won";
type BeatMark = "hit" | "missed";
type MothMotion = "waiting" | "falling" | "landed";

const FLIGHT_MS = 260;
const AUDIO_LOOKAHEAD_MS = 90;
const DEMO_ROUND: ArmoniaRound = { melody: armoniaMelodies[0], bpm: 92 };
const GOLD_FRAME_POSITIONS = ["0% 0%", "33.333% 0%", "66.666% 0%", "100% 0%"];
const BLUE_FRAME_POSITIONS = ["0% 100%", "33.333% 100%", "66.666% 100%"];

function getAudioContext() {
  return typeof window !== "undefined" && "AudioContext" in window ? new window.AudioContext() : null;
}

export function ArmoniaRhythmGame({ paused, onAbandon, onWin, playSound, muted = false, friendlyReplay = false }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [practiceComplete, setPracticeComplete] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [challengePlan, setChallengePlan] = useState<ArmoniaRound[]>([]);
  const [sessionRound, setSessionRound] = useState<ArmoniaRound>(DEMO_ROUND);
  const [score, setScore] = useState(0);
  const [beatMarks, setBeatMarks] = useState<Record<number, BeatMark>>({});
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [countNumber, setCountNumber] = useState(0);
  const [mothMotion, setMothMotion] = useState<MothMotion>("waiting");
  const [visualBeat, setVisualBeat] = useState(0);
  const [showLeave, setShowLeave] = useState(false);
  const [showRestart, setShowRestart] = useState(false);
  const [message, setMessage] = useState("Primero escuchamos una demostración. Después puedes practicar y empezar el reto.");
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [audioAttempted, setAudioAttempted] = useState(false);
  const [tapFeedback, setTapFeedback] = useState<"hit" | "extra" | "" >("");
  const [displayElapsed, setDisplayElapsed] = useState(0);
  const [challengePerfect, setChallengePerfect] = useState(false);
  const interactionPaused = paused || showLeave || showRestart;

  const phaseRef = useRef(phase);
  const modeRef = useRef<Mode | null>(null);
  const roundRef = useRef<ArmoniaRound>(DEMO_ROUND);
  const elapsedRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  const nextCountRef = useRef(0);
  const nextAudioRef = useRef(0);
  const nextVisualRef = useRef(0);
  const beatMarksRef = useRef<Record<number, BeatMark>>({});
  const scoreRef = useRef(0);
  const visualBeatRef = useRef(0);
  const mothMotionRef = useRef<MothMotion>("waiting");
  const audioRef = useRef<AudioContext | null>(null);
  const audioOriginRef = useRef<number | null>(null);
  const voicesRef = useRef<Set<OscillatorNode>>(new Set());
  const previousGamepadHitRef = useRef(false);
  const sessionKeyRef = useRef(0);
  const mountedRef = useRef(true);
  const roundIndexRef = useRef(0);
  const currentRoundCleanRef = useRef(true);
  const cleanRoundsRef = useRef<boolean[]>([]);
  const lastUiUpdateRef = useRef(0);
  const feedbackTimeoutRef = useRef(0);

  const updatePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const setMoth = useCallback((next: MothMotion, beat?: number) => {
    mothMotionRef.current = next;
    setMothMotion(next);
    if (beat !== undefined) {
      visualBeatRef.current = beat;
      setVisualBeat(beat);
    }
  }, []);

  const setMarks = useCallback((marks: Record<number, BeatMark>) => {
    beatMarksRef.current = marks;
    setBeatMarks(marks);
  }, []);

  const setPoints = useCallback((points: number) => {
    scoreRef.current = points;
    setScore(points);
  }, []);

  const updateRoundIndex = useCallback((index: number) => {
    roundIndexRef.current = index;
    setRoundIndex(index);
  }, []);

  const clearVoices = useCallback(() => {
    for (const voice of voicesRef.current) {
      try { voice.stop(); } catch { /* ya terminó */ }
    }
    voicesRef.current.clear();
  }, []);

  const synthesize = useCallback((frequency: number, atAudioTime: number, waveform: OscillatorType, loudness = 0.045) => {
    const context = audioRef.current;
    if (!context || muted || context.state !== "running") return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, atAudioTime);
    gain.gain.setValueAtTime(loudness, atAudioTime);
    gain.gain.exponentialRampToValueAtTime(0.001, atAudioTime + 0.17);
    oscillator.connect(gain);
    gain.connect(context.destination);
    voicesRef.current.add(oscillator);
    oscillator.addEventListener("ended", () => voicesRef.current.delete(oscillator), { once: true });
    oscillator.start(atAudioTime);
    oscillator.stop(atAudioTime + 0.18);
  }, [muted]);

  const ensureAudio = useCallback(async () => {
    setAudioAttempted(true);
    if (muted) {
      setAudioAvailable(false);
      return false;
    }
    try {
      audioRef.current ??= getAudioContext();
      if (!audioRef.current) throw new Error("AudioContext no disponible");
      if (audioRef.current.state === "suspended") await audioRef.current.resume();
      if (audioRef.current.state !== "running") throw new Error("El audio sigue suspendido");
      setAudioAvailable(true);
      return true;
    } catch {
      setAudioAvailable(false);
      return false;
    }
  }, [muted]);

  const configureSession = useCallback((nextMode: Mode, nextRound: ArmoniaRound) => {
    sessionKeyRef.current += 1;
    modeRef.current = nextMode;
    roundRef.current = nextRound;
    elapsedRef.current = 0;
    lastFrameRef.current = null;
    nextCountRef.current = 0;
    nextAudioRef.current = 0;
    nextVisualRef.current = 0;
    audioOriginRef.current = null;
    visualBeatRef.current = 0;
    mothMotionRef.current = "waiting";
    scoreRef.current = 0;
    currentRoundCleanRef.current = true;
    beatMarksRef.current = {};
    setMode(nextMode);
    setSessionRound(nextRound);
    setDisplayElapsed(0);
    setCurrentBeat(-1);
    setCountNumber(0);
    setMothMotion("waiting");
    setVisualBeat(0);
    setMarks({});
    setPoints(0);
    setTapFeedback("");
    window.clearTimeout(feedbackTimeoutRef.current);
    setMessage(nextMode === "challenge" ? "Escucha la melodía y golpea solo las notas doradas." : "Escucha la melodía y prueba el tambor cuando llegue tu nota dorada.");
    updatePhase("starting");
    clearVoices();
  }, [clearVoices, setMarks, setPoints, updatePhase]);

  const launchSession = useCallback(async (nextMode: Mode, nextRound: ArmoniaRound) => {
    configureSession(nextMode, nextRound);
    const sessionKey = sessionKeyRef.current;
    const hasAudio = await ensureAudio();
    if (!mountedRef.current || sessionKey !== sessionKeyRef.current) return;
    const context = audioRef.current;
    audioOriginRef.current = hasAudio && context ? context.currentTime : null;
    setMessage(hasAudio ? "Escucha y mira cuándo cae la campanita dorada." : "Seguimos con las luces y los dibujos. Puedes volver a probar el sonido.");
    updatePhase("countin");
  }, [configureSession, ensureAudio, updatePhase]);

  const beginDemo = useCallback(() => {
    void launchSession("demo", DEMO_ROUND);
  }, [launchSession]);

  const beginPractice = useCallback(() => {
    void launchSession("practice", DEMO_ROUND);
  }, [launchSession]);

  const beginChallenge = useCallback(() => {
    let plan: ArmoniaRound[];
    try {
      plan = makeArmoniaChallenge();
    } catch {
      setMessage("Ahora faltan melodías distintas. Vuelve a probar dentro de un momento.");
      return;
    }
    setChallengePlan(plan);
    cleanRoundsRef.current = [];
    setChallengePerfect(false);
    updateRoundIndex(0);
    void launchSession("challenge", plan[0]);
  }, [launchSession, updateRoundIndex]);

  const setBeatMark = useCallback((beat: number, mark: BeatMark) => {
    if (beatMarksRef.current[beat]) return;
    setMarks({ ...beatMarksRef.current, [beat]: mark });
    setPoints(adjustArmoniaScore(scoreRef.current, mark === "hit" ? 1 : -1));
  }, [setMarks, setPoints]);

  const hitDrum = useCallback(() => {
    if (interactionPaused || (phaseRef.current !== "playing" && phaseRef.current !== "countin")) return;
    const activeMode = modeRef.current;
    if (!activeMode || !roundRef.current) return;
    const countDuration = ARMONIA_COUNT_IN_BEATS * 60_000 / roundRef.current.bpm;
    const musicPosition = elapsedRef.current - countDuration;
    const hitBeat = findTargetWithinWindow(musicPosition, roundRef.current, new Set(
      Object.entries(beatMarksRef.current).filter(([, mark]) => mark === "hit").map(([beat]) => Number(beat)),
    ));
    if (hitBeat !== null) {
      if (activeMode === "challenge") setBeatMark(hitBeat, "hit");
      else setMarks({ ...beatMarksRef.current, [hitBeat]: "hit" });
      setTapFeedback("hit");
      setMessage("¡Muy bien! Esa era tu nota.");
      playSound("checkpoint");
      window.clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = window.setTimeout(() => setTapFeedback(""), 320);
      return;
    }
    if (activeMode === "challenge") {
      currentRoundCleanRef.current = false;
      setPoints(adjustArmoniaScore(scoreRef.current, -1));
    }
    setTapFeedback("extra");
    setMessage("Esa nota no era tuya. Espera la campanita dorada.");
    playSound("hurt");
    window.clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = window.setTimeout(() => setTapFeedback(""), 320);
  }, [interactionPaused, playSound, setBeatMark, setMarks, setPoints]);

  const restartCurrentChallengeRound = useCallback(() => {
    const sameRound = challengePlan[roundIndex];
    if (sameRound) {
      void launchSession("challenge", sameRound);
    }
  }, [challengePlan, launchSession, roundIndex]);

  const continueAfterRound = useCallback(() => {
    if (modeRef.current !== "challenge") return;
    const nextIndex = roundIndex + 1;
    const nextRound = challengePlan[nextIndex];
    if (!nextRound) return;
    updateRoundIndex(nextIndex);
    void launchSession("challenge", nextRound);
  }, [challengePlan, launchSession, roundIndex, updateRoundIndex]);

  const restartChallenge = useCallback(() => {
    setShowRestart(false);
    beginChallenge();
  }, [beginChallenge]);

  const confirmWin = useCallback(() => {
    playSound("goal");
    onWin(challengePerfect);
  }, [challengePerfect, onWin, playSound]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      sessionKeyRef.current += 1;
      window.clearTimeout(feedbackTimeoutRef.current);
      clearVoices();
      if (audioRef.current) void audioRef.current.close();
    };
  }, [clearVoices]);

  useEffect(() => {
    if (muted) {
      clearVoices();
      return;
    }
    if (audioRef.current?.state === "suspended" && !interactionPaused && (phase === "countin" || phase === "playing")) {
      void audioRef.current.resume().then(() => {
        if (audioRef.current) audioOriginRef.current = audioRef.current.currentTime - elapsedRef.current / 1000;
        setAudioAvailable(true);
      }).catch(() => { setAudioAvailable(false); });
    }
  }, [clearVoices, interactionPaused, muted, phase]);

  useEffect(() => {
    if (interactionPaused) {
      lastFrameRef.current = null;
      if (audioRef.current?.state === "running") void audioRef.current.suspend();
      return;
    }
    if (phase !== "countin" && phase !== "playing") return;

    let frameId = 0;
    const tick = (now: number) => {
      if (lastFrameRef.current === null) lastFrameRef.current = now;
      const delta = Math.min(100, now - lastFrameRef.current);
      lastFrameRef.current = now;
      const elapsed = elapsedRef.current + delta;
      elapsedRef.current = elapsed;
      const round = roundRef.current;
      const beatMs = 60_000 / round.bpm;
      const musicStart = ARMONIA_COUNT_IN_BEATS * beatMs;

      while (nextCountRef.current < ARMONIA_COUNT_IN_BEATS && elapsed >= nextCountRef.current * beatMs - AUDIO_LOOKAHEAD_MS) {
        const countBeat = nextCountRef.current++;
        const context = audioRef.current;
        const at = audioOriginRef.current === null ? 0 : audioOriginRef.current + countBeat * beatMs / 1000;
        if (context && audioOriginRef.current !== null) synthesize([440, 523, 659, 784][countBeat], Math.max(context.currentTime + 0.01, at), "sine", 0.035);
        setCountNumber(countBeat + 1);
      }

      while (nextAudioRef.current < ARMONIA_BEAT_COUNT && elapsed >= musicStart + nextAudioRef.current * beatMs - AUDIO_LOOKAHEAD_MS) {
        const beat = nextAudioRef.current++;
        const isTarget = round.melody.targetBeatIndexes.includes(beat);
        const context = audioRef.current;
        const eventSessionMs = musicStart + beat * beatMs;
        const at = audioOriginRef.current === null ? 0 : audioOriginRef.current + eventSessionMs / 1000;
        if (context && audioOriginRef.current !== null) {
          const fundamental = round.melody.audio.notesHz[beat];
          synthesize(fundamental, Math.max(context.currentTime + 0.01, at), round.melody.audio.waveform, isTarget ? 0.055 : 0.035);
          if (isTarget) synthesize(fundamental * 1.5, Math.max(context.currentTime + 0.02, at + 0.035), "sine", 0.018);
        }
      }

      if (audioRef.current?.state === "running" && audioOriginRef.current !== null) {
        const driftSeconds = audioRef.current.currentTime - (audioOriginRef.current + elapsed / 1000);
        if (Math.abs(driftSeconds) > 0.045) audioOriginRef.current += driftSeconds * 0.08;
      }

      const musicPosition = elapsed - musicStart;
      while (nextVisualRef.current < ARMONIA_BEAT_COUNT && musicPosition >= beatTimeMs(nextVisualRef.current, round.bpm) - FLIGHT_MS) {
        const beat = nextVisualRef.current++;
        visualBeatRef.current = beat;
        setVisualBeat(beat);
        setCurrentBeat(beat);
        setMoth(beatTimeMs(beat, round.bpm) - musicPosition <= delta ? "landed" : "falling", beat);
      }
      if (visualBeatRef.current >= 0 && mothMotionRef.current === "falling" && musicPosition >= beatTimeMs(visualBeatRef.current, round.bpm)) setMoth("landed");

      if (elapsed >= musicStart - FLIGHT_MS && phaseRef.current === "countin") updatePhase("playing");
      if (elapsed < musicStart - FLIGHT_MS) setCountNumber(Math.min(4, Math.floor(elapsed / beatMs) + 1));

      if (modeRef.current === "challenge") {
        for (const beat of round.melody.targetBeatIndexes) {
          if (!beatMarksRef.current[beat] && musicPosition > beatTimeMs(beat, round.bpm) + round.melody.windowMs) {
            currentRoundCleanRef.current = false;
            setBeatMark(beat, "missed");
            setMessage("No pasa nada. Esa nota se nos fue; puedes escuchar la misma ronda otra vez.");
            playSound("hurt");
          }
        }
      }

      if (elapsed >= musicStart + beatTimeMs(ARMONIA_BEAT_COUNT - 1, round.bpm) + round.melody.windowMs) {
        if (modeRef.current === "demo" || modeRef.current === "practice") {
          if (modeRef.current === "demo") setPracticeComplete(false);
          else setPracticeComplete(true);
          setMessage(modeRef.current === "demo" ? "¡Ya viste cómo va! Ahora puedes practicar." : "Buen ensayo. Puedes practicar otra vez o empezar el reto.");
          updatePhase("practice-ready");
        } else if (modeRef.current === "challenge") {
          const successful = scoreRef.current === ARMONIA_TARGET_COUNT && round.melody.targetBeatIndexes.every((beat) => beatMarksRef.current[beat] === "hit");
          if (successful) {
            cleanRoundsRef.current[roundIndexRef.current] = currentRoundCleanRef.current;
            if (roundIndexRef.current === ARMONIA_ROUNDS - 1) setChallengePerfect(cleanRoundsRef.current.length === ARMONIA_ROUNDS && cleanRoundsRef.current.every(Boolean));
          }
          updatePhase(successful ? (roundIndexRef.current === ARMONIA_ROUNDS - 1 ? "won" : "round-done") : "failed");
          setMessage(successful ? "¡Las tres notas! Esta melodía está superada." : "Para pasar hacen falta las tres notas doradas. Escucha esta ronda otra vez.");
          playSound(successful ? "checkpoint" : "hurt");
        }
        lastFrameRef.current = null;
        return;
      }

      if (now - lastUiUpdateRef.current > 80) {
        lastUiUpdateRef.current = now;
        setDisplayElapsed(elapsed);
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [interactionPaused, phase, playSound, setBeatMark, setMoth, synthesize, updatePhase]);

  useEffect(() => {
    if (interactionPaused || (phase !== "countin" && phase !== "playing")) return;
    let frameId = 0;
    const poll = () => {
      const pad = firstConnectedGamepad();
      const pressed = Boolean(pad?.buttons[0]?.pressed);
      if (pressed && !previousGamepadHitRef.current) hitDrum();
      previousGamepadHitRef.current = pressed;
      frameId = requestAnimationFrame(poll);
    };
    frameId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(frameId);
  }, [hitDrum, interactionPaused, phase]);

  useEffect(() => {
    if (interactionPaused || (phase !== "countin" && phase !== "playing")) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat || event.defaultPrevented) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("button")) return;
      event.preventDefault();
      hitDrum();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hitDrum, interactionPaused, phase]);

  const beginRestart = () => setShowRestart(true);
  const activeBeat = currentBeat >= 0 ? currentBeat : mode === null ? sessionRound.melody.targetBeatIndexes[0] : visualBeat;
  const isTarget = sessionRound.melody.targetBeatIndexes.includes(activeBeat);
  const frameIndex = Math.floor(displayElapsed / 145) % (isTarget ? GOLD_FRAME_POSITIONS.length : BLUE_FRAME_POSITIONS.length);
  const backgroundPosition = isTarget ? GOLD_FRAME_POSITIONS[frameIndex] : BLUE_FRAME_POSITIONS[frameIndex];
  const isChallengeMode = mode === "challenge";
  const showHitButton = phase === "countin" || phase === "playing";

  return <><Dialog labelledBy="armonia-title" backdropClassName="boss-backdrop" className="boss-battle armonia-rhythm-game" gamepad={interactionPaused || (phase !== "playing" && phase !== "countin")}>
    <header className="boss-header armonia-header">
      <div>
        <p className="eyebrow">{friendlyReplay ? "Juego amistoso" : "Juego del guardián"} · {isChallengeMode ? `Ronda ${roundIndex + 1} de ${ARMONIA_ROUNDS}` : "Practica a tu ritmo"}</p>
        <h2 id="armonia-title">El tambor de Armonía</h2>
        <p>Escucha ocho pulsos. Golpea solo las tres notas doradas.</p>
      </div>
      {isChallengeMode && <div className="armonia-score" aria-label={`${score} de tres notas`}><strong>{score}/3</strong><small>notas doradas</small></div>}
    </header>

    <div className="armonia-stage" aria-label="Escena del tambor">
      <img className="armonia-background" src="./assets/worlds/armonia-rhythm-background-v1.png" alt="" aria-hidden="true" />
      <div className="armonia-scene-label">{phase === "countin" ? `Cuenta: ${countNumber || 1}` : phase === "playing" ? sessionRound.melody.name : "Escucha tu campanita"}</div>
      <div className={`armonia-moth ${isTarget ? "is-gold" : "is-blue"} is-${mothMotion} ${interactionPaused ? "is-paused" : ""}`} style={{ backgroundImage: 'url("./assets/atlases/armonia-rhythm-sprites-v1.png")', backgroundPosition, "--landed-top": "calc(100% - 48px - 95px - 35px)" } as React.CSSProperties} role="img" aria-label={isTarget ? "Polilla dorada, tu nota" : "Polilla azul, nota de tus amigas"} />
      <div className={`armonia-drum ${tapFeedback ? `is-${tapFeedback}` : ""}`} style={{ backgroundImage: 'url("./assets/atlases/armonia-rhythm-sprites-v1.png")' }} role="img" aria-label="Tambor verde con piel dorada" />
      <div className="armonia-beat-line" aria-label="Ocho pulsos">
        {Array.from({ length: ARMONIA_BEAT_COUNT }, (_, beat) => {
          const target = sessionRound.melody.targetBeatIndexes.includes(beat);
          const mark = beatMarks[beat];
          const className = ["armonia-beat", target ? "is-target" : "", mark === "hit" ? "is-hit" : "", mark === "missed" ? "is-missed" : "", currentBeat === beat ? "is-current" : ""].filter(Boolean).join(" ");
          return <span className={className} key={beat} aria-label={`Pulso ${beat + 1}${target ? ", nota dorada" : ", nota azul"}${mark === "hit" ? ", acertada" : mark === "missed" ? ", fallada" : ""}`}>{beat + 1}</span>;
        })}
      </div>
    </div>

    <div className="armonia-controls">
      <p className="armonia-message" aria-live="polite">{message}</p>
      {isChallengeMode && <p className="armonia-tempo">{sessionRound.melody.name} · {sessionRound.bpm} pulsos por minuto · margen ±{sessionRound.melody.windowMs} ms</p>}
      {showHitButton && <button className={`pixel-button primary armonia-hit ${tapFeedback ? `is-${tapFeedback}` : ""}`} type="button" disabled={interactionPaused} onClick={hitDrum}>¡Golpea!</button>}
      {phase === "intro" && <button className="pixel-button primary armonia-main-action" type="button" data-gamepad-default onClick={beginDemo}>Ver demostración ▶</button>}
      {phase === "practice-ready" && <button className="pixel-button primary armonia-main-action" type="button" data-gamepad-default onClick={beginPractice}>{practiceComplete ? "Practicar otra vez ▶" : "Practicar ▶"}</button>}
      {phase === "failed" && <button className="pixel-button primary armonia-main-action" type="button" data-gamepad-default onClick={restartCurrentChallengeRound}>Intentar esta ronda otra vez</button>}
      {phase === "round-done" && <button className="pixel-button primary armonia-main-action" type="button" data-gamepad-default onClick={continueAfterRound}>Siguiente melodía ▶</button>}
      {phase === "won" && <button className="pixel-button primary armonia-main-action" type="button" data-gamepad-default onClick={friendlyReplay ? beginChallenge : confirmWin}>{friendlyReplay ? "Jugar otra vez" : "Continuar la aventura ▶"}</button>}
      {phase === "practice-ready" && practiceComplete && <button className="pixel-button armonia-secondary" type="button" onClick={beginChallenge}>{friendlyReplay ? "Empezar partida amistosa" : "Empezar reto · 3 rondas"}</button>}
      {phase === "won" && !friendlyReplay && <p className="armonia-win-note">{challengePerfect ? "¡Tres melodías perfectas! Has ganado el marco especial." : "¡Tres melodías superadas! Puedes repetir para intentar ganar el marco especial."}</p>}
      {(phase === "countin" || phase === "playing" || phase === "failed" || phase === "round-done") && !friendlyReplay && <button className="text-button armonia-restart" type="button" onClick={beginRestart}>Reiniciar las tres rondas</button>}
      {audioAttempted && !audioAvailable && !muted && <button className="text-button armonia-audio-retry" type="button" onClick={async () => { const ready = await ensureAudio(); if (ready && audioRef.current) audioOriginRef.current = audioRef.current.currentTime - elapsedRef.current / 1000; }}>Reintentar sonido</button>}
      {(muted || !audioAvailable) && <p className="armonia-audio-note">{muted ? "Puedes seguir con las señales visuales aunque el sonido esté apagado." : "Si el sonido no funciona, sigue las luces y los dibujos."}</p>}
      <p className="armonia-input-help">Teclado: Espacio · Mando: botón A · Toca «¡Golpea!»</p>
      <button className="text-button duel-abandon" type="button" onClick={() => friendlyReplay ? onAbandon() : setShowLeave(true)}>{friendlyReplay ? "Volver a mis amigos" : "Volver al mapa"}</button>
    </div>
  </Dialog>

  {showRestart && <Dialog labelledBy="armonia-restart-title" className="game-modal compact" gamepad>
    <p className="eyebrow">Empezar de nuevo</p><h2 id="armonia-restart-title">¿Reiniciamos las tres rondas?</h2>
    <p>Las melodías superadas se borrarán y saldrán tres melodías nuevas.</p>
    <button className="pixel-button primary" type="button" data-gamepad-default onClick={restartChallenge}>Sí, empezar de nuevo</button>
    <button className="pixel-button" type="button" data-gamepad-back onClick={() => setShowRestart(false)}>Seguir con esta melodía</button>
  </Dialog>}

  {showLeave && <Dialog labelledBy="armonia-leave-title" className="game-modal compact" gamepad>
    <p className="eyebrow">Un momento</p><h2 id="armonia-leave-title">¿Volvemos al mapa?</h2>
    <p>Este reto se dejará. Tus pegatinas guardadas seguirán contigo.</p>
    <button className="pixel-button primary" type="button" data-gamepad-default data-gamepad-back onClick={() => setShowLeave(false)}>Seguir jugando</button>
    <button className="pixel-button" type="button" onClick={onAbandon}>Sí, volver al mapa</button>
  </Dialog>}
  </>;
}
