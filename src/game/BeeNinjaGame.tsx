import { useState, type CSSProperties } from "react";
import type { Tempo } from "./ritmoNucleo";
import { useMinijuegoRitmico, type SesionRitmo } from "./useMinijuegoRitmico";
import { bossCatalog } from "./bosses";
import { cssAssetUrl } from "./assets";
import { Dialog } from "./Dialog";
import type { SoundKind } from "./GameCanvas";
import {
  COUNT_PULSES, CUT_POINT, HERO, PERFIL_ABEJA, PLOF_SOUND, PULSE_MS, UY_SOUND, cutSound, RESUME_COUNT_PULSES, WIN_AT, autoCuts, barOfPulse, beeScores,
  collectFalls, COUNT_TICK, createRun, flowersIn, jarLevel, leadNote, musicForEighth, nextOpenCut, outcomeOf, practiceFirst, pressAt, scoreLength, targetPlacement, targetVisible, throwPulses,
  type BeeMode, type BeeNote, type BeeRun, type Outcome, type PressResult, type SampleId,
} from "./beeNinja";
import { loadBeeSamples } from "./beeNinjaSamples";
import "./beeNinja.css";
import { t } from "../textos/index.ts";
import { Boton, BotonControl, Pictograma, Texto } from "../textos/Texto";
import { informeRitmo, PantallaPrevia, ResultadoMinijuego } from "./minijuegoComun";
import type { ParadaPractica } from "./practicaPausas";
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
type Session = SesionRitmo<BeeRun> & {
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

const STAGE_WIDTH = 960;
const TEMPO: Tempo = { pulsoMs: PULSE_MS, pulsosCuenta: RESUME_COUNT_PULSES };
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
  const [informe, setInforme] = useState<string>();
  const [finished, setFinished] = useState<{ mode: BeeMode; outcome: Outcome } | null>(null);
  const [attempted, setAttempted] = useState(false);
  const boss = bossCatalog["queen-bee"];

  const { frameRef, scale, mode, clockKind, view, parada, seguirParada, showLeave, setShowLeave, interactionPaused, begin, strike, finish, playCue, sessionRef } = useMinijuegoRitmico<BeeMode, BeeRun, Session, BeeNote, View, SampleId>({
    tempo: TEMPO, perfil: PERFIL_ABEJA, muestras: loadBeeSamples, paused, muted, musicVolume, effectsVolume, anchoEscena: STAGE_WIDTH, paradas: PARADAS,
    crearSesion: (nextMode, base) => ({
      ...base, run: createRun(nextMode), cutUntil: -Infinity, greet: null, feedback: null, applaudFrom: null, celebrateUntil: -Infinity, lastJar: 0, gotaUntil: -Infinity,
      demoVacia: false, halves: [], halfId: 0,
    }),
    largo: (run) => scoreLength(run.score),
    musicaDeCorchea: musicForEighth,
    cuenta: COUNT_TICK,
    sePuedePulsar: (session, pulse) => session.run.mode !== "demo" && pulse >= 0,
    alPulsar: (session, pulse) => react(session, pressAt(session.run, pulse), pulse),
    alFotograma: (session, pulse) => {
      if (session.run.mode === "demo") {
        for (const result of autoCuts(session.run, pulse)) react(session, result, pulse);
        if (!session.demoVacia && pulse >= DEMO_VACIA_PULSO) { session.demoVacia = true; react(session, { kind: "empty", resta: false }, pulse); }
      } else if (collectFalls(session.run, pulse).length) {
        playCue(PLOF_SOUND);
        session.feedback = { text: t("minijuegos.abeja.compas.plof.rotulo"), miss: true, until: pulse + 0.6 };
      }
    },
    vista: (session, pulse, counting) => snapshot(session, pulse, counting, reduceMotion),
    vistaVacia: emptyView,
    alEmpezar: (nextMode) => {
      if (nextMode === "song") setAttempted(true);
      setFinished(null);
    },
    alTerminar: (session) => {
      const outcome = outcomeOf(session.run);
      setFinished({ mode: session.run.mode, outcome });
      setInforme(session.run.mode === "song" ? informeRitmo({ aciertos: session.run.cut, total: flowersIn(session.run.score), vacias: session.run.cuenta.vacias, raya: session.run.cuenta.raya, meta: WIN_AT }) : undefined);
      if (session.run.mode === "song") playSound(outcome.won ? "checkpoint" : "hurt");
    },
    claseBotonGolpe: "bee-ninja-cut",
  });

  function react(session: Session, result: PressResult, pulse: number) {
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
  }

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
      {mode && clockKind === "frame" && <span className="ritmo-mute"><Pictograma nombre="sin-sonido" /></span>}
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
    botones={<Boton tipo="seguir" clave="minijuegos.abeja.practica.sigue.rotulo" data-gamepad-default onClick={seguirParada} />}>
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
