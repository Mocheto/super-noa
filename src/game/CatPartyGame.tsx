import "../textos/zonas/minijuegos.gatitos";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { crearEquipo, despertar, liberarEquipo, ponerVolumenes, tocarNota, type EquipoAudio } from "./ritmoAudio";
import { firstConnectedGamepad } from "./gamepad";
import {
  BELT_Y, HIT_WINDOW_PULSES, MISS_SAMPLE, PERFIL_FIESTA, PULSE_MS, ROLL_SAMPLE, STUMP_X, TRAVEL_PULSES, audioPulse, autoHits, barOfPulse, collectMisses, createRun, hitSamples, leadNote,
  goalOf, hitsIn, musicForEighth, nextOpenHit, outcomeOf, outputLatencySeconds, partyScores, pieceVisible, piecePlacement, pressAt, scoreLength,
  type Outcome, type PartyMode, type PartyNote, type PartyRun, type PartySample, type PressResult,
} from "./catParty";
import { loadPartySamples, type SampleBank } from "./catPartySamples";
import {
  ART, BELT, CLEARING_BACKGROUND, FIRE_BOX, FIRE_FRAMES, KITTENS, KITTEN_POSES, LOG_CELLS, NOA_FEET, NOA_POSES, STUMP_BOX, WOODPILE_SCALE, cellStyle, halfCell, shown,
} from "./catPartyArt";
import "./catParty.css";
import { t } from "../textos/index.ts";
import { Boton, BotonControl, Pictograma, Texto } from "../textos/Texto";
import { informeRitmo, PantallaPrevia, ResultadoMinijuego } from "./minijuegoComun";
import { createPracticaConPausas, type ParadaPractica } from "./practicaPausas";
import { Ventana } from "./Ventana";

const sprites = "./assets/sprites";
const STAGE_WIDTH = 960;
const START_DELAY_S = 0.15;
const PILE_LIMIT = 18;
/** Posición del leño `index` en el montón: seis por fila, cada fila un poco más arriba y a la derecha. */
const stickStyle = (index: number): CSSProperties => ({ left: (index % 6) * 30 + Math.floor(index / 6) * 14, top: 78 - Math.floor(index / 6) * 16, width: ART.stick.size[0] / 2, height: ART.stick.size[1] / 2 });

type Props = {
  paused: boolean;
  muted: boolean;
  musicVolume: number;
  effectsVolume: number;
  reduceMotion: boolean;
  onPause: () => void;
  onExit: () => void;
};

type Half = { id: number; type: "small" | "medium"; x: number; y: number; width: number; height: number; side: -1 | 1; start: number };
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
  /** Pulso hasta el que cae un leño del montón tras una pulsación vacía. */
  gotaUntil: number;
  /** La demostración ya ha enseñado su pulsación vacía. */
  demoVacia: boolean;
  ended: boolean;
};

type PieceView = { id: number; type: PartyRun["pieces"][number]["type"]; x: number; y: number; rotation: number; opacity: number; width: number; height: number; marks: boolean[]; cracked: boolean };
type View = {
  pulse: number;
  pieces: PieceView[];
  halves: Half[];
  pile: number;
  gota: boolean;
  ring: { radius: number; ready: boolean } | null;
  lamp: number;
  bubbleA: { text: string; pink: boolean } | null;
  bubbleB: string | null;
  noaPose: number;
  kittenA: number;
  kittenB: number;
  feedback: { text: string; miss: boolean } | null;
  phase: { name: string; piece: "small" | "medium" | "yarn" } | null;
};

const emptyView: View = { pulse: -1, pieces: [], halves: [], pile: 0, gota: false, ring: null, lamp: -1, bubbleA: null, bubbleB: null, noaPose: NOA_POSES.ready, kittenA: KITTEN_POSES.ready, kittenB: KITTEN_POSES.ready, feedback: null, phase: null };

/** La demostración enseña una pulsación vacía tras el ovillo, sin pieza en el tajo, y se para medio pulso después. */
const DEMO_VACIA_PULSO = 16;
/** La práctica se detiene en cada pieza nueva y explica cómo se golpea. */
const PARADAS: Record<PartyMode, ParadaPractica[]> = {
  demo: [{ pulso: 4, pieza: "pequeno" }, { pulso: 8, pieza: "mediano" }, { pulso: 12, pieza: "ovillo" }, { pulso: DEMO_VACIA_PULSO + 0.5, pieza: "vacia" }],
  practice: [{ pulso: 4, pieza: "pequeno" }, { pulso: 12, pieza: "mediano" }, { pulso: 16, pieza: "ovillo" }],
  song: [],
};
const CLAVE_PARADA = {
  pequeno: { rotulo: "minijuegos.gatitos.practica.pequeno.rotulo", juntos: "minijuegos.gatitos.practica.pequeno.juntos" },
  mediano: { rotulo: "minijuegos.gatitos.practica.mediano.rotulo", juntos: "minijuegos.gatitos.practica.mediano.juntos" },
  ovillo: { rotulo: "minijuegos.gatitos.practica.ovillo.rotulo", juntos: "minijuegos.gatitos.practica.ovillo.juntos" },
  vacia: { rotulo: "minijuegos.gatitos.practica.vacia.rotulo", juntos: "minijuegos.gatitos.practica.vacia.juntos" },
} as const;

const RESULT_TEXT = {
  perfecto: { title: "minijuegos.gatitos.resultado.perfecto.rotulo", text: "minijuegos.gatitos.resultado.perfecto.juntos" },
  bien: { title: "minijuegos.gatitos.resultado.fiesta.rotulo", text: "minijuegos.gatitos.resultado.fiesta.juntos" },
  casi: { title: "minijuegos.gatitos.resultado.casi.rotulo", text: "minijuegos.gatitos.resultado.casi.juntos" },
} as const satisfies Record<Outcome["result"], { title: string; text: string }>;

const pieceSize = (type: PieceView["type"]) => type === "yarn" ? { width: 62, height: 56 } : shown(type === "small" ? ART.smallLog : ART.mediumLog);

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
  const bubbleA = session.yarnBubbleUntil > pulse ? { text: t("minijuegos.gatitos.compas.mio.rotulo"), pink: true }
    : pushed ? { text: pushed.type === "yarn" ? t("minijuegos.gatitos.compas.plop.rotulo") : t("minijuegos.gatitos.compas.miau.rotulo"), pink: pushed.type === "yarn" } : null;
  const counting = pulse >= 0 && pulse < 4 && pulse - whole < 0.65;
  const noaPose = session.chopUntil > pulse ? NOA_POSES.chop : untilHit < 0.9 && untilHit > 0.05 ? NOA_POSES.raise : NOA_POSES.ready;
  const kittenA = pushed ? (pulse - pushed.push < 0.35 ? KITTEN_POSES.push : pushed.type === "yarn" ? KITTEN_POSES.ready : KITTEN_POSES.meow)
    : session.yarnBubbleUntil > pulse ? KITTEN_POSES.meow : KITTEN_POSES.ready;
  const kittenB = counting || echoed ? KITTEN_POSES.meow : KITTEN_POSES.ready;
  // El cartel de fase solo dura el primer compás de la fase.
  const phase = run.score.phases.find(({ fromBar }) => barOfPulse(Math.max(0, whole)) === fromBar) ?? null;
  return {
    pulse, pieces, ring, phase,
    halves: session.halves.filter((half) => pulse - half.start < 0.9),
    pile: run.cuenta.raya,
    gota: session.gotaUntil > pulse,
    lamp: pulse >= 0 ? whole % 4 : -1,
    bubbleA,
    bubbleB: counting ? String(whole + 1) : echoed ? t("minijuegos.gatitos.compas.miau.rotulo") : null,
    noaPose, kittenA, kittenB,
    feedback: session.feedback && session.feedback.until > pulse ? { text: session.feedback.text, miss: session.feedback.miss } : null,
  };
}

export function CatParty({ paused, muted, musicVolume, effectsVolume, reduceMotion, onPause, onExit }: Props) {
  const sessionRef = useRef<Session | null>(null);
  const [informe, setInforme] = useState<string>();
  const audioRef = useRef<EquipoAudio | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const samplesRef = useRef<SampleBank | null>(null);
  const [scale, setScale] = useState(1);
  const [mode, setMode] = useState<PartyMode | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [resultado, setResultado] = useState<Outcome | null>(null);
  const [silent, setSilent] = useState(false);
  const [clockKind, setClockKind] = useState<"audio" | "frame" | null>(null);
  const [view, setView] = useState<View>(emptyView);
  const [parada, setParada] = useState<ParadaPractica | null>(null);
  const [jugado, setJugado] = useState(false);
  const practicaRef = useRef<ReturnType<typeof createPracticaConPausas> | null>(null);
  /** Se congela con la pausa de la partida y con las paradas de la práctica. */
  const detenido = paused || parada !== null;
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

  // Los sonidos definitivos se cargan al entrar; hasta que estén (o si fallan) suenan los osciladores de respaldo.
  useEffect(() => {
    let alive = true;
    void loadPartySamples().then((bank) => { if (alive) samplesRef.current = bank; });
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
    ponerVolumenes(audio, soundOff ? 0 : musicVolume / 100, soundOff ? 0 : effectsVolume / 100);
  }, [effectsVolume, musicVolume, soundOff, mode]);

  const ensureAudio = useCallback(async () => {
    try {
      audioRef.current ??= crearEquipo(PERFIL_FIESTA, soundOff ? 0 : musicVolume / 100, soundOff ? 0 : effectsVolume / 100);
      return audioRef.current ? await despertar(audioRef.current) : false;
    } catch {
      return false;
    }
  }, [effectsVolume, musicVolume, soundOff]);

  const playNote = useCallback((note: PartyNote, when: number) => {
    if (audioRef.current) tocarNota(audioRef.current, note, when, samplesRef.current);
  }, []);

  const playNow = useCallback((frequency: number, duration: number, wave: OscillatorType, volume: number, glideTo?: number) => {
    const audio = audioRef.current;
    if (!audio || audio.context.state !== "running") return;
    playNote({ offset: 0, frequency, duration, wave, volume, bus: "cue", glideTo }, audio.context.currentTime + 0.003);
  }, [playNote]);

  /** Toca samples al instante; devuelve `false` si aún no están cargados para que suene el respaldo. */
  const playSamplesNow = useCallback((samples: PartySample[]) => {
    const audio = audioRef.current;
    if (!samplesRef.current || !audio || audio.context.state !== "running") return false;
    for (const sample of samples) playNote({ offset: 0, frequency: 0, duration: 0.1, wave: "sine", volume: 0, bus: "cue", sample }, audio.context.currentTime + 0.003);
    return true;
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
      const note = leadNote(session.run, pulse);
      if (!playSamplesNow(hitSamples(note))) {
        playNow(note, 0.3, "triangle", 0.13);
        playNow(720, 0.06, "sine", 0.05);
      }
      session.feedback = { text: t("minijuegos.gatitos.compas.toc.rotulo"), miss: false, until: pulse + 0.5 };
      if (result.broke) {
        const type = result.piece.type === "small" ? "small" : "medium";
        const { width, height } = pieceSize(type);
        // Las mitades se juntan en el tajo: la izquierda acaba en su centro y la derecha empieza en él.
        for (const side of [-1, 1] as const) session.halves.push({ id: session.halfId++, type, x: side < 0 ? STUMP_X - width : STUMP_X, y: BELT_Y - height, width, height, side, start: pulse });
      }
    } else if (result.kind === "yarn") {
      if (!playSamplesNow([MISS_SAMPLE])) playNow(92, 0.16, "sine", 0.14);
      session.feedback = { text: t("minijuegos.gatitos.compas.boing.rotulo"), miss: true, until: pulse + 0.5 };
      session.yarnBubbleUntil = pulse + 1.5;
      session.gotaUntil = pulse + 0.6;
    } else if (result.kind === "empty") {
      // Pulsación vacía: «¡UY!» y cae un leño del montón (en la práctica solo se ve; en la canción, además, resta).
      if (!playSamplesNow([MISS_SAMPLE])) playNow(92, 0.16, "sine", 0.14);
      session.feedback = { text: t("minijuegos.gatitos.compas.uy.rotulo"), miss: true, until: pulse + 0.5 };
      session.gotaUntil = pulse + 0.6;
    }
  }, [playNow, playSamplesNow]);

  const finish = useCallback((session: Session) => {
    session.ended = true;
    const outcome = session.run.mode === "song" ? outcomeOf(session.run) : null;
    setMode(null);
    setResultado(outcome);
    setInforme(outcome ? informeRitmo({ aciertos: session.run.pieces.reduce((total, item) => total + (item.type === "yarn" ? 0 : item.done.length), 0), total: hitsIn(session.run.score), vacias: session.run.cuenta.vacias, raya: session.run.cuenta.raya, meta: goalOf(session.run.score) }) : undefined);
    setCelebrating(Boolean(outcome?.won));
    setParada(null);
  }, []);

  const strike = useCallback(() => {
    const session = sessionRef.current;
    if (!session || session.ended || detenido || session.run.mode === "demo") return;
    const pulse = pulseNow(session);
    if (pulse < 0) return;
    session.chopUntil = pulse + 0.2;
    react(session, pressAt(session.run, pulse), pulse);
  }, [detenido, pulseNow, react]);

  const begin = async (nextMode: PartyMode) => {
    const session: Session = {
      run: createRun(nextMode), clock: "frame", songStart: 0, frameMs: -START_DELAY_S * 1000, lastPulse: -1, nextEighth: 0,
      chopUntil: -Infinity, yarnBubbleUntil: -Infinity, feedback: null, halves: [], halfId: 0, gotaUntil: -Infinity, demoVacia: false, ended: false,
    };
    sessionRef.current = session;
    setView(emptyView);
    setCelebrating(false);
    setResultado(null);
    practicaRef.current = createPracticaConPausas(PARADAS[nextMode]);
    setParada(null);
    if (nextMode === "song") setJugado(true);
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
    if (detenido) void audio.context.suspend().catch(() => {});
    else void audio.context.resume().catch(() => {});
  }, [mode, detenido]);

  useEffect(() => {
    if (!mode || detenido) return;
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
          for (const note of musicForEighth(session.run, eighth)) playNote(note, when);
        }
      }
      const pulse = pulseNow(session);
      session.lastPulse = pulse;
      // Práctica: al llegar una pieza nueva se detiene y la explica; sigue al tocar SIGUE.
      const nueva = session.run.mode !== "song" ? practicaRef.current?.llegar(pulse) : undefined;
      if (nueva) {
        setView(snapshot(session, pulse, reduceMotion));
        setParada(nueva);
        return;
      }
      if (session.run.mode === "demo") {
        for (const result of autoHits(session.run, pulse)) { session.chopUntil = pulse + 0.2; react(session, result, pulse); }
        if (!session.demoVacia && pulse >= DEMO_VACIA_PULSO) { session.demoVacia = true; session.chopUntil = pulse + 0.2; react(session, { kind: "empty", resta: false }, pulse); }
      } else {
        for (let perdidos = collectMisses(session.run, pulse).length; perdidos > 0; perdidos--) {
          if (!playSamplesNow([ROLL_SAMPLE])) playNow(180, 0.18, "triangle", 0.06, 90);
          session.feedback = { text: t("minijuegos.gatitos.compas.rueda.rotulo"), miss: true, until: pulse + 0.6 };
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
  }, [detenido, finish, mode, playNote, playNow, playSamplesNow, pulseNow, react, reduceMotion, strike]);

  const total = mode ? scoreLength(partyScores[mode]) : 0;
  const totalHits = hitsIn(partyScores[mode ?? "song"]);
  const goal = goalOf(partyScores.song);
  const goalSticks = Math.round(goal * PILE_LIMIT / Math.max(1, totalHits));
  const noaSize = shown(ART.noa), greySize = shown(ART.kittenGrey), orangeSize = shown(ART.kittenOrange);
  const fireSize = { width: shown(ART.fire).width * FIRE_BOX.scale, height: shown(ART.fire).height * FIRE_BOX.scale };
  return <section className={`cat-party-screen${reduceMotion ? " cat-party-still" : ""}`} data-gamepad-managed={mode ? "true" : undefined} aria-labelledby="cat-party-title">
    <h2 id="cat-party-title" className="sr-only"><Texto clave="minijuegos.gatitos.previa.nombre.rotulo" /></h2>
    <div className="cat-party-frame" ref={frameRef}>
      <div className="cat-party-stage" style={{ transform: `scale(${scale})` }} aria-hidden="true">
        <img className="cat-party-background" src={CLEARING_BACKGROUND} alt="" />
        <div className={`cat-party-fire${celebrating ? " is-lit" : ""}`} style={{ ...cellStyle(ART.fire, FIRE_FRAMES.unlit), width: fireSize.width, height: fireSize.height, left: FIRE_BOX.left, top: FIRE_BOX.bottom - fireSize.height }} />
        <div className="cat-party-lamps">{[0, 1, 2, 3].map((index) => <span key={index} className={`${index === 0 ? "is-first" : ""}${mode && view.lamp === index ? " is-on" : ""}`} />)}</div>
        <div className="cat-party-belt" style={{ left: BELT.left, top: BELT.top, width: BELT.tiles * ART.belt.size[0] / 2, height: ART.belt.size[1] / 2, backgroundImage: `url("${ART.belt.src}")`, backgroundSize: `${ART.belt.size[0] / 2}px ${ART.belt.size[1] / 2}px` }} />
        <div className={`cat-party-pile${!celebrating && mode === "song" && view.pile >= goal ? " is-reached" : ""}`}>{celebrating
          ? <img className="cat-party-woodpile" src={ART.woodpile.src} alt="" style={{ width: ART.woodpile.size[0] / 2 * WOODPILE_SCALE, height: ART.woodpile.size[1] / 2 * WOODPILE_SCALE }} />
          : <>
            {/* Raya dorada del montón: sombras de los leños que faltan para encender la hoguera. */}
            {mode === "song" && Array.from({ length: goalSticks }, (_, index) =>
              <img key={`sombra-${index}`} className="is-sombra" src={ART.stick.src} alt="" style={stickStyle(index)} />)}
            {Array.from({ length: Math.min(PILE_LIMIT, Math.round(view.pile * PILE_LIMIT / Math.max(1, totalHits))) }, (_, index) =>
              <img key={index} src={ART.stick.src} alt="" style={stickStyle(index)} />)}
            {mode && view.gota && <img className="gota-cae is-leno" src={ART.stick.src} alt="" />}
          </>}</div>
        <div className="cat-party-stump" style={{ backgroundImage: `url("${ART.stump.src}")`, width: ART.stump.size[0] / 2, height: ART.stump.size[1] / 2, left: STUMP_BOX.centerX - ART.stump.size[0] / 4, top: STUMP_BOX.centerTop - 23 }} />
        {view.ring && <div className={`cat-party-ring${view.ring.ready ? " is-ready" : ""}`} style={{ width: view.ring.radius * 2, height: view.ring.radius * 2, left: STUMP_X - view.ring.radius, top: BELT_Y - 18 - view.ring.radius }} />}
        {view.ring?.ready && <div className="cat-party-now">{t("minijuegos.gatitos.compas.ahora.rotulo")}</div>}
        {mode && clockKind === "frame" && <span className="cat-party-mute"><Pictograma nombre="sin-sonido" /></span>}
        <div className="cat-party-noa" style={{ ...cellStyle(ART.noa, celebrating ? NOA_POSES.celebrate : view.noaPose), ...noaSize, left: NOA_FEET.x - ART.noa.feetX! / 2, top: NOA_FEET.y - noaSize.height }} />
        <div className={`cat-party-kitten is-first${celebrating ? " is-party" : ""}`} style={{ ...cellStyle(ART.kittenGrey, celebrating ? KITTEN_POSES.meow : view.kittenA), ...greySize, left: KITTENS.grey.feetX - ART.kittenGrey.feetX! / 2, top: KITTENS.grey.floor - greySize.height }}>
          {view.bubbleA && !celebrating && <span className={`cat-party-bubble${view.bubbleA.pink ? " is-pink" : ""}`}>{view.bubbleA.text}</span>}
        </div>
        <div className={`cat-party-kitten is-second${celebrating ? " is-party" : ""}`} style={{ ...cellStyle(ART.kittenOrange, celebrating ? KITTEN_POSES.meow : view.kittenB), ...orangeSize, left: KITTENS.orange.feetX - ART.kittenOrange.feetX! / 2, top: KITTENS.orange.floor - orangeSize.height }}>
          {view.bubbleB && !celebrating && <span className="cat-party-bubble">{view.bubbleB}</span>}
        </div>
        {view.pieces.map((item) => <div key={item.id} className={`cat-party-piece is-${item.type}`}
          style={{ left: item.x, top: item.y, width: item.width, height: item.height, opacity: item.opacity, transform: `rotate(${item.rotation}deg)` }}>
          {item.type === "yarn" ? <img src={`${sprites}/yarn-ball-v1.webp`} alt="" />
            : <div className="cat-party-log" style={cellStyle(item.type === "small" ? ART.smallLog : ART.mediumLog, item.cracked && item.type === "medium" ? LOG_CELLS.cracked : LOG_CELLS.whole)} />}
          {item.type !== "yarn" && <span className="cat-party-marks">{item.marks.map((done, index) => <b key={index} className={done ? "is-done" : undefined} />)}</span>}
        </div>)}
        {view.halves.map((half) => <div key={half.id} className={`cat-party-half ${half.side < 0 ? "is-left" : "is-right"}`}
          style={{ ...cellStyle(half.type === "small" ? ART.smallLog : ART.mediumLog, halfCell(half.type === "small" ? ART.smallLog : ART.mediumLog, half.side)), left: half.x, top: half.y, width: half.width, height: half.height }} />)}
        {view.feedback && <div className={`cat-party-feedback${view.feedback.miss ? " is-miss" : ""}`}>{view.feedback.text}</div>}
        {mode && view.phase && <span className="cat-party-phase">{view.phase.piece === "yarn" ? <img className="cat-party-phase-piece" src={`${sprites}/yarn-ball-v1.webp`} alt="" />
          : <i className="cat-party-phase-piece cat-party-log" style={cellStyle(view.phase.piece === "small" ? ART.smallLog : ART.mediumLog, LOG_CELLS.whole)} />}{view.phase.name}</span>}
      </div>
    </div>
    {mode && <div className="cat-party-botones-control">
      <BotonControl pictograma={soundOff ? "sin-sonido" : "sonido"} etiqueta="minijuegos.gatitos.sonido.oculto" aria-pressed={soundOff} disabled={muted} onClick={() => setSilent(!silent)} />
      <BotonControl pictograma="pausa" etiqueta="partida.hud.pausa.oculto" onClick={onPause} />
    </div>}
    {mode && <progress className="cat-party-progress" max={total} value={Math.max(0, view.pulse)} aria-label={t("minijuegos.gatitos.avance.oculto")} />}
    {mode && <div className="cat-party-controls">
      {mode !== "demo" && <Boton tipo="seguir" className="cat-party-strike" clave="minijuegos.gatitos.boton.golpea.rotulo" disabled={detenido} onPointerDown={(event) => { if (event.button === 0) strike(); }} onClick={(event) => { if (event.detail === 0) strike(); }} />}
      {mode !== "song" && <Boton clave="minijuegos.gatitos.practica.termina.rotulo" onClick={() => { const session = sessionRef.current; if (session) finish(session); }} />}
    </div>}

    {!mode && !resultado && !paused && <PantallaPrevia id="cat-party-previa" nombre="minijuegos.gatitos.previa.nombre.rotulo"
      guardian={<div className="cat-party-retrato" style={{ ...cellStyle(ART.kittenGrey, KITTEN_POSES.ready), ...shown(ART.kittenGrey) }} />}
      regla={t("minijuegos.gatitos.previa.regla.juntos")}
      ayudaAdultos={[t("adultos.minijuegos.gatitos.controles"), t("adultos.minijuegos.gatitos.sinSonido")]}
      practicaPrimero={!jugado} onPracticar={() => void begin(view.pulse > 0 && !jugado ? "practice" : "demo")} onJugar={() => void begin("song")} onSalir={onExit} />}

    {parada && !paused && <Ventana id="cat-party-parada" titulo={CLAVE_PARADA[parada.pieza as keyof typeof CLAVE_PARADA].rotulo}
      botones={<Boton tipo="seguir" clave="minijuegos.gatitos.practica.sigue.rotulo" data-gamepad-default onClick={() => { practicaRef.current?.seguir(); setParada(null); }} />}>
      <p className="juntos">{t(CLAVE_PARADA[parada.pieza as keyof typeof CLAVE_PARADA].juntos)}</p>
    </Ventana>}

    {resultado && !paused && <ResultadoMinijuego informe={informe} id="cat-party-resultado" titulo={RESULT_TEXT[resultado.result].title} gano={resultado.won} onSalir={onExit}
      dibujo={<div className={`cat-party-hoguera-resultado${resultado.won ? "" : " is-apagada"}`} role="img" aria-label={t(resultado.won ? "minijuegos.gatitos.resultado.hoguera.oculto" : "minijuegos.gatitos.resultado.apagada.oculto")} style={{ ...cellStyle(ART.fire, FIRE_FRAMES.unlit) }} />}
      frase={t(RESULT_TEXT[resultado.result].text)}
      botones={<>
        <Boton tipo="seguir" clave="minijuegos.gatitos.resultado.otraVez.rotulo" data-gamepad-default onClick={() => void begin("song")} />
        <Boton clave="minijuegos.gatitos.resultado.mapa.rotulo" data-gamepad-back onClick={onExit} />
      </>} />}
  </section>;
}

