import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { firstConnectedGamepad } from "./gamepad";
import {
  CAT_PARTY_COUNT_MS, CAT_PARTY_LEAD_MS, CAT_PARTY_WINDOW_MS, findPartyHit,
  partyCharts, type PartyMode, type PartyTarget,
} from "./catParty";
import "./catParty.css";

const scene = "./assets/worlds/world-2-hd-v1.webp";
const sprites = "./assets/sprites";
const sounds = ["cuenta", "aviso", "golpe", "casi"] as const;
type Cue = typeof sounds[number];
type Run = {
  mode: PartyMode;
  elapsed: number;
  startedAt: number | null;
  previousTime: number;
  resolved: Set<PartyTarget>;
  hits: Set<PartyTarget>;
  pile: number;
  impact: number;
};

const emptyView = {
  elapsed: 0,
  resolved: new Set<PartyTarget>(),
  hits: new Set<PartyTarget>(),
  pile: 0,
  impact: -Infinity,
};

type Props = {
  paused: boolean;
  muted: boolean;
  musicVolume: number;
  effectsVolume: number;
  reduceMotion: boolean;
  onPause: () => void;
  onExit: () => void;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const position = (run: Run) => run.elapsed + (run.startedAt === null ? 0 : performance.now() - run.startedAt);
const count = (time: number) => Math.min(3, Math.max(0, Math.ceil(-time / (2000 / 3))));

export function CatParty({ paused, muted, musicVolume, effectsVolume, reduceMotion, onPause, onExit }: Props) {
  const runRef = useRef<Run | null>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const samplesRef = useRef<Partial<Record<Cue, HTMLAudioElement>>>({});
  const [mode, setMode] = useState<PartyMode | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [silent, setSilent] = useState(false);
  const [view, setView] = useState(emptyView);
  const [message, setMessage] = useState("Bruma y sus amigos necesitan leña para la fiesta. ¿Les ayudas?");
  const soundOff = muted || silent;

  useEffect(() => {
    const samples = Object.fromEntries(sounds.map((cue) => [cue, new Audio(`./assets/audio/gatitos-${cue}.wav`)]));
    samplesRef.current = samples;
    const music = new Audio("./assets/music/gatitos-fiesta.mp3");
    music.preload = "auto";
    musicRef.current = music;
    return () => {
      music.pause();
      Object.values(samples).forEach((audio) => audio.pause());
    };
  }, []);

  const playCue = useCallback((cue: Cue) => {
    const audio = samplesRef.current[cue];
    if (soundOff || effectsVolume === 0 || !audio) return;
    audio.volume = effectsVolume / 100;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  }, [effectsVolume, soundOff]);

  const begin = (nextMode: PartyMode) => {
    runRef.current = {
      mode: nextMode, elapsed: 0, startedAt: null, previousTime: -Infinity,
      resolved: new Set(), hits: new Set(), pile: 0, impact: -Infinity,
    };
    setView(emptyView);
    setCelebrating(false);
    setMessage(nextMode === "demo" ? "Mira cómo tocan los gatitos." : "Toca el tronco cuando salga el aviso.");
    setMode(nextMode);
  };

  const finish = useCallback((nextMode: PartyMode) => {
    runRef.current = null;
    setMode(null);
    setCelebrating(nextMode === "song");
    setMessage(nextMode === "song" ? "¡La leña está lista! ¡Empieza la fiesta!" : "¡Ya conoces las dos piezas! Puedes practicar o empezar la canción.");
  }, []);

  const markHit = useCallback((run: Run, target: PartyTarget, time: number) => {
    run.resolved = new Set([...run.resolved, target]);
    run.hits = new Set([...run.hits, target]);
    run.impact = time;
    playCue("golpe");
    const complete = partyCharts[run.mode].targets.filter((item) => item.piece === target.piece)
      .every((item) => run.hits.has(item));
    if (complete) run.pile += 1;
    setMessage(complete ? (target.count === 1 ? "¡Toc! Una ramita para la fiesta." : "¡Toc, toc! La rama grande está lista.")
      : target.hit === 0 ? "¡Toc! Viene el segundo gatito." : "¡Toc! Has dado el segundo golpe.");
  }, [playCue]);

  const strike = useCallback(() => {
    const run = runRef.current;
    if (!run || paused || run.mode === "demo" || run.startedAt === null) return;
    const time = position(run) - CAT_PARTY_COUNT_MS;
    if (time < 0) return;
    const target = findPartyHit(run.mode, time, run.resolved);
    if (target) markHit(run, target, time);
    else setMessage("¡Casi! Espera a «¡Ahora!» o «¡Otra!».");
  }, [markHit, paused]);

  useLayoutEffect(() => {
    const run = runRef.current;
    if (!run || !mode || paused) return;
    run.startedAt = performance.now();
    return () => {
      run.elapsed = position(run);
      run.startedAt = null;
    };
  }, [mode, paused]);

  useLayoutEffect(() => {
    const run = runRef.current;
    const music = musicRef.current;
    if (!music || mode !== "song" || !run || paused || soundOff || musicVolume === 0) return;
    music.volume = musicVolume / 100 * 0.6;
    music.currentTime = position(run) / 1000;
    void music.play().catch(() => {});
    return () => music.pause();
  }, [mode, musicVolume, paused, soundOff]);

  useLayoutEffect(() => {
    if (paused || soundOff || !mode) Object.values(samplesRef.current).forEach((audio) => audio.pause());
  }, [mode, paused, soundOff]);

  useEffect(() => {
    if (!mode || paused) return;
    let frame = 0;
    const readA = () => Boolean(firstConnectedGamepad()?.buttons[0]?.pressed);
    let wasDown = readA();
    const update = () => {
      const run = runRef.current;
      if (!run || run.startedAt === null) return;
      const current = position(run);
      const time = current - CAT_PARTY_COUNT_MS;
      const chart = partyCharts[run.mode];
      if (time >= chart.duration) {
        finish(run.mode);
        return;
      }
      if (time < 0 && (run.previousTime === -Infinity || count(time) !== count(run.previousTime))) playCue("cuenta");
      for (const target of chart.targets) {
        if (run.mode === "demo" && run.previousTime < target.time && time >= target.time) {
          markHit(run, target, time);
        } else if (run.mode !== "demo" && !run.resolved.has(target)) {
          if (run.previousTime < target.time - CAT_PARTY_WINDOW_MS && time >= target.time - CAT_PARTY_WINDOW_MS) playCue("aviso");
          if (time > target.time + CAT_PARTY_WINDOW_MS) {
            run.resolved = new Set([...run.resolved, target]);
            setMessage(target.count === 1 ? "No pasa nada. ¡Ya viene otro gatito!" : target.hit === 0
              ? "Pasó el primer golpe. ¡Viene el segundo!" : "Pasó el segundo golpe. ¡Vamos con la próxima!");
            playCue("casi");
          }
        }
      }
      run.previousTime = time;
      const down = readA();
      if (down && !wasDown) strike();
      wasDown = down;
      setView({ elapsed: current, hits: run.hits, resolved: run.resolved, pile: run.pile, impact: run.impact });
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
  }, [finish, markHit, mode, paused, playCue, strike]);

  const time = view.elapsed - CAT_PARTY_COUNT_MS;
  const chart = mode ? partyCharts[mode] : null;
  const pieceIndex = chart?.pieces.findIndex(({ hits }) => time >= hits[0] - CAT_PARTY_LEAD_MS && time <= hits.at(-1)! + CAT_PARTY_WINDOW_MS) ?? -1;
  const piece = time >= 0 ? chart?.pieces[pieceIndex] : undefined;
  const target = piece && chart?.targets.find((item) => item.piece === pieceIndex && !view.resolved.has(item));
  const ready = target && Math.abs(time - target.time) <= CAT_PARTY_WINDOW_MS;
  const activeRing = target && time >= target.time - 900;
  const still = reduceMotion;
  const first = piece?.hits[0] ?? 0;
  const second = piece?.hits[1];
  const showSecond = second !== undefined && time >= first;
  const firstOffset = still ? 0 : 240 * clamp((first - time) / CAT_PARTY_LEAD_MS);
  const secondOffset = still || second === undefined ? 0 : 260 * clamp((second - time) / (second - first));

  return <section className={`cat-party-screen${still ? " cat-party-still" : ""}`} data-gamepad-managed={mode ? "true" : undefined} aria-labelledby="cat-party-title">
    <header className="cat-party-header">
      <div><p className="eyebrow">El Bosque de los Gatitos</p><h2 id="cat-party-title">La fiesta de los gatitos</h2></div>
      <div className="cat-party-options">
        <button className="pixel-button" type="button" aria-pressed={soundOff} disabled={muted} onClick={() => setSilent(!silent)}>{soundOff ? "Sonido apagado" : "Silenciar"}</button>
        {mode && <button className="pixel-button" type="button" onClick={onPause}>Pausa</button>}
        <button className="pixel-button" type="button" data-gamepad-back onClick={onExit}>Volver al mapa</button>
      </div>
    </header>
    <div className="cat-party-stage" style={{ backgroundImage: `url("${scene}")` }}>
      <img className="cat-party-noa" src={`${sprites}/noa-cat-run-v2.webp`} alt="" />
      <div className="cat-party-pile" aria-hidden="true">{Array.from({ length: Math.min(10, view.pile) }, (_, index) =>
        <img key={index} src={`${sprites}/gatitos-ramita.png`} alt="" style={{ left: index % 2 * 34, bottom: Math.floor(index / 2) * 9, rotate: `${index % 2 ? 12 : -14}deg` }} />)}</div>
      {celebrating ? <div className="cat-party-celebration" aria-hidden="true"><span>✦ ★ ✦</span><img src={`${sprites}/world-cat-1-v1.png`} alt="" /><img src={`${sprites}/world-cat-2-v1.png`} alt="" /><img src={`${sprites}/world-cat-3-v1.png`} alt="" /></div>
        : <img className={`cat-party-log${mode && time - view.impact < 240 ? " is-hit" : ""}`} src={`${sprites}/gatitos-tronco.png`} alt="" />}
      {piece && <div className="cat-party-kittens" aria-hidden="true">
        <div className="cat-party-kitten" style={{ translate: `${firstOffset}px` }}><img src={`${sprites}/world-cat-1-v1.png`} alt="" /><img className={second === undefined ? "cat-party-twig" : "cat-party-twig is-large"} src={`${sprites}/gatitos-ramita.png`} alt="" /></div>
        {showSecond && <div className="cat-party-kitten second" style={{ translate: `${secondOffset}px` }}><img src={`${sprites}/world-cat-2-v1.png`} alt="" /></div>}
        <div className="cat-party-piece">{piece.hits.length === 1 ? "1 golpe" : "2 golpes"} {piece.hits.map((hit) =>
          <span key={hit}>{[...view.hits].some((item) => item.time === hit) ? "●" : "○"}</span>)}</div>
      </div>}
      {activeRing && <div className={`cat-party-ring${ready ? " is-ready" : ""}`} style={{ scale: still ? 1 : 1 + 0.55 * clamp((target.time - time) / 900) }} />}
      {ready && <div className="cat-party-ready">{target.hit === 0 ? "¡Ahora!" : "¡Otra!"}</div>}
      {mode && time < 0 && <div className="cat-party-count"><strong>{count(time)}</strong><small>Prepárate</small></div>}
      {mode && time - view.impact < 350 && <span className="cat-party-impact" aria-hidden="true">¡TOC!</span>}
    </div>
    {chart && <progress className="cat-party-progress" max={chart.duration} value={Math.max(0, time)} aria-label="Avance" />}
    <p className="cat-party-message" aria-live="polite">{message}</p>
    <div className="cat-party-controls">
      {mode === "demo" && <button className="pixel-button" type="button" onClick={() => finish("demo")}>Terminar demostración</button>}
      {mode && mode !== "demo" && <button className="pixel-button primary cat-party-strike" type="button" disabled={paused} onPointerDown={(event) => { if (event.button === 0) strike(); }} onClick={(event) => { if (event.detail === 0) strike(); }}>¡Golpea el tronco!</button>}
      {mode === "practice" && <button className="pixel-button" type="button" onClick={() => finish("practice")}>Terminar práctica</button>}
      {!mode && <>
        <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => begin("song")}>{celebrating ? "Jugar otra vez" : "Empezar la canción"}</button>
        {!celebrating && <><button className="pixel-button" type="button" onClick={() => begin("demo")}>Ver la demostración</button><button className="pixel-button" type="button" onClick={() => begin("practice")}>Practicar</button></>}
      </>}
    </div>
  </section>;
}
