import { useState, type CSSProperties } from "react";
import type { Tempo } from "./ritmoNucleo";
import { useMinijuegoRitmico, type SesionRitmo } from "./useMinijuegoRitmico";
import { bossCatalog } from "./bosses";
import { cssAssetUrl } from "./assets";
import { Dialog } from "./Dialog";
import type { SoundKind } from "./GameCanvas";
import {
  ARMONIA_DRUM, BATON, NOA, NOA_DRUM, PERFIL_TAMBOR, PHASE_NAMES, PULSE_MS, RESUME_COUNT_PULSES, WIN_AT, autoHits, callStart, createRun, drumScores, hitsIn, musicForEighth, outcomeOf, partAt, practiceFirst,
  pressAt, printsAt, printsOrigin, responseNote, responseStart, scoreLength, snare, xylophone,
  type DrumMode, type DrumNote, type DrumRun, type Outcome, type PressResult, type PrintsView,
} from "./armoniaDrum";
import "./armoniaDrum.css";
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

type Session = SesionRitmo<DrumRun> & {
  strikeUntil: number;
  glowUntil: number;
  feedback: { text: string; miss: boolean; until: number } | null;
  applaudFrom: number | null;
  /** Pulso hasta el que cae una nota del atril tras un «¡Uy!». */
  gotaUntil: number;
  /** La demostración ya ha enseñado su «¡Uy!». */
  demoVacia: boolean;
};
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
  gota: boolean;
  phase: string | null;
  counting: number;
};

const STAGE_WIDTH = 960;
const TEMPO: Tempo = { pulsoMs: PULSE_MS, pulsosCuenta: RESUME_COUNT_PULSES };
const emptyView: View = { pulse: -1, lamp: -1, turn: null, armoniaPose: 0, armoniaHit: false, armoniaBubble: null, noaPose: "espera", noaBubble: null, noaHit: false, noaGlow: false, prints: null, feedback: null, gota: false, phase: null, counting: 0 };
const NOA_POSES: Record<NoaPose, string> = { espera: "0%", golpe: "33.333%", escucha: "66.667%", celebra: "100%" };

/** La demostración enseña un «¡Uy!» en el silencio del segundo pulso de la primera respuesta y se para medio pulso después. */
const DEMO_VACIA_PULSO = responseStart(0) + 1;
/** La práctica se detiene al llegar cada parte nueva y la explica con su rótulo y su frase. */
const PARADAS: Record<DrumMode, ParadaPractica[]> = {
  demo: [{ pulso: callStart(0), pieza: "escucha" }, { pulso: responseStart(0), pieza: "turno" }, { pulso: DEMO_VACIA_PULSO + 0.5, pieza: "vacia" }, { pulso: callStart(1), pieza: "seguidos" }],
  practice: [{ pulso: callStart(0), pieza: "escucha" }, { pulso: responseStart(0), pieza: "turno" }],
  song: [],
};
const CLAVE_PARADA = {
  escucha: { rotulo: "minijuegos.tambor.practica.escucha.rotulo", juntos: "minijuegos.tambor.practica.escucha.juntos" },
  turno: { rotulo: "minijuegos.tambor.practica.turno.rotulo", juntos: "minijuegos.tambor.practica.turno.juntos" },
  seguidos: { rotulo: "minijuegos.tambor.practica.seguidos.rotulo", juntos: "minijuegos.tambor.practica.seguidos.juntos" },
  vacia: { rotulo: "minijuegos.tambor.practica.vacia.rotulo", juntos: "minijuegos.tambor.practica.vacia.juntos" },
} as const;

const RESULT_TEXT = {
  perfecto: { title: "minijuegos.tambor.resultado.perfecto.rotulo", text: "minijuegos.tambor.resultado.perfecto.juntos" },
  bien: { title: "minijuegos.tambor.resultado.bien.rotulo", text: "minijuegos.tambor.resultado.bien.juntos" },
  casi: { title: "minijuegos.tambor.resultado.casi.rotulo", text: "minijuegos.tambor.resultado.casi.juntos" },
} as const satisfies Record<Outcome["result"], { title: string; text: string }>;

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
    : applauding ? t("minijuegos.tambor.compas.bravo.rotulo")
      : part?.kind === "call" && part.beat < 2 ? t("minijuegos.tambor.compas.escucha.rotulo")
        : part?.kind === "call" && part.beat === 3 ? t("minijuegos.tambor.compas.tin.rotulo") : null;
  const noaPose: NoaPose = session.strikeUntil > pulse ? "golpe" : part?.kind === "end" ? "celebra" : part?.kind === "call" ? "escucha" : "espera";
  // Cartel de fase: solo durante la llamada del primer par de una fase nueva.
  const pairPhase = part && (part.kind === "call" || part.kind === "response") ? run.score.pairs[part.pair].phase : null;
  const newPhase = part?.kind === "call" && pairPhase !== null && (part.pair === 0 || run.score.pairs[part.pair - 1].phase !== pairPhase);
  const phase = counting || !newPhase || pairPhase === null ? null : PHASE_NAMES[pairPhase];
  return {
    pulse, phase, counting, armoniaPose, armoniaBubble, noaPose,
    lamp: part && !counting ? part.beat : -1,
    turn: part?.kind === "call" ? "call" : part?.kind === "response" ? "response" : null,
    armoniaHit: Boolean(callHit) && fraction < 0.15,
    noaBubble: !counting && part?.kind === "response" && part.beat < 2 ? t("minijuegos.tambor.compas.ahora.rotulo") : null,
    noaHit: session.strikeUntil > pulse,
    noaGlow: session.glowUntil > pulse,
    prints: counting ? null : printsAt(run, pulse),
    feedback: session.feedback && session.feedback.until > pulse ? { text: session.feedback.text, miss: session.feedback.miss } : null,
    gota: session.gotaUntil > pulse,
  };
}

function Prints({ view, className, style }: { view: NonNullable<PrintsView>; className: string; style?: CSSProperties }) {
  return <div className={`${className} is-${view.drum}`} style={style}>
    {view.prints.map((state, index) => <span key={index} className={`armonia-drum-print is-${state}${view.lit === index + 1 ? " is-lit" : ""}${view.current === index + 1 ? " is-current" : ""}`}>{index + 1}</span>)}
  </div>;
}

export function ArmoniaDrumGame({ paused, muted, musicVolume, effectsVolume, reduceMotion, levelCompleted, onAbandon, onWin, playSound, friendlyReplay = false }: Props) {
  const [informe, setInforme] = useState<string>();
  const [finished, setFinished] = useState<{ mode: DrumMode; outcome: Outcome } | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [got, setGot] = useState(0);
  const boss = bossCatalog["maestra-armonia"];

  const { frameRef, scale, mode, clockKind, view, parada, seguirParada, showLeave, setShowLeave, interactionPaused, begin, strike: strike, finish, playCue, sessionRef } = useMinijuegoRitmico<DrumMode, DrumRun, Session, DrumNote, View>({
    tempo: TEMPO, perfil: PERFIL_TAMBOR, paused, muted, musicVolume, effectsVolume, anchoEscena: STAGE_WIDTH, paradas: PARADAS,
    crearSesion: (nextMode, base) => ({ ...base, run: createRun(nextMode), strikeUntil: -Infinity, glowUntil: -Infinity, feedback: null, applaudFrom: null, gotaUntil: -Infinity, demoVacia: false }),
    largo: (run) => scoreLength(run.score),
    musicaDeCorchea: musicForEighth,
    cuenta: BATON,
    sePuedePulsar: (session) => !session.run.score.auto,
    alPulsar: (session, pulse) => react(session, pressAt(session.run, pulse), pulse),
    alFotograma: (session, pulse) => {
      if (session.run.score.auto) {
        for (const result of autoHits(session.run, pulse)) react(session, result, pulse, true);
        if (!session.demoVacia && pulse >= DEMO_VACIA_PULSO) { session.demoVacia = true; react(session, { kind: "uy", resta: false }, pulse); }
      }
    },
    vista: snapshot,
    vistaVacia: emptyView,
    alEmpezar: (nextMode) => {
      if (nextMode === "song") setAttempted(true);
      setFinished(null);
      setGot(0);
    },
    alTerminar: (session) => {
      const outcome = outcomeOf(session.run);
      setFinished({ mode: session.run.mode, outcome });
      setInforme(session.run.mode === "song" ? informeRitmo({ aciertos: session.run.got, total: hitsIn(session.run.score), vacias: session.run.cuenta.vacias, raya: session.run.cuenta.raya, meta: WIN_AT }) : undefined);
      if (session.run.mode === "song") playSound(outcome.won ? "checkpoint" : "hurt");
    },
    claseBotonGolpe: "armonia-drum-hit",
  });

  /** Respuesta a la pulsación: en la demostración el sonido ya va en la partitura; si toca la jugadora, suena al momento. */
  function react(session: Session, result: PressResult, pulse: number, automatic = false) {
    session.strikeUntil = pulse + 0.25;
    if (result.kind === "hit") {
      if (!automatic) playCue([...snare(false), ...xylophone(responseNote(session.run, result.target))]);
      session.feedback = { text: t("minijuegos.tambor.compas.bien.rotulo"), miss: false, until: pulse + 0.5 };
      session.glowUntil = pulse + 0.3;
      setGot(session.run.cuenta.raya);
      if (session.run.mode === "song" && session.run.cuenta.raya === WIN_AT && session.applaudFrom === null) {
        session.applaudFrom = pulse;
      }
    } else if (result.kind === "uy") {
      // Pulsación vacía: «¡Uy!» y cae una nota del atril (en la práctica solo se ve; en la canción, además, resta).
      playCue(snare(true));
      session.feedback = { text: t("minijuegos.tambor.compas.uy.rotulo"), miss: true, until: pulse + 0.5 };
      session.gotaUntil = pulse + 0.6;
      setGot(session.run.cuenta.raya);
    } else if (result.kind === "soft") playCue(snare(true));
  }

  const confirmWin = (challengeCompleted: boolean) => {
    playSound("goal");
    onWin(challengeCompleted);
  };
  const leave = () => friendlyReplay && !mode ? onAbandon() : setShowLeave(true);
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

  const retrato = <div className="armonia-drum-retrato" style={{ backgroundImage: `url("${boss.assetAtlas}")` }} />;
  const enPrevia = !mode && (!finished || finished.mode !== "song");

  return <><Dialog labelledBy="armonia-drum-title" backdropClassName="boss-backdrop" className="boss-battle armonia-drum-game" gamepad={interactionPaused || !mode}>
    <h2 id="armonia-drum-title" className="sr-only"><Texto clave="minijuegos.tambor.previa.nombre.rotulo" /></h2>
    <div className={`armonia-drum-frame${reduceMotion ? " is-still" : ""}`} ref={frameRef} onPointerDown={(event) => { if (event.button === 0 && mode && mode !== "demo") strike(); }}>
      <div className="armonia-drum-stage" style={{ transform: `scale(${scale})` }} aria-hidden="true">
        <img className="armonia-drum-background" src="./assets/worlds/teatro-armonia-v0.webp" alt="" />
        <div className={`armonia-drum-spot is-armonia${mode && view.turn === "call" ? " is-on" : ""}`} />
        <div className={`armonia-drum-spot is-noa${mode && view.turn === "response" ? " is-on" : ""}`} />
        <div className={`armonia-drum-lamps${view.turn ? ` is-${view.turn}` : ""}`}>{[0, 1, 2, 3].map((index) => <span key={index} className={mode && view.lamp === index ? "is-on" : undefined} />)}</div>
        <div className={`armonia-drum-armonia${view.armoniaHit && mode ? " is-hit" : ""}`} style={{ backgroundImage: `url("${boss.assetAtlas}")`, backgroundPosition: `${armoniaPose * 25}% 100%` }} />
        <div className={`armonia-drum-drum${view.armoniaHit && mode ? " is-hit" : ""}`} style={{ ...ARMONIA_DRUM, backgroundImage: 'url("./assets/sprites/tambor-armonia-v0.webp")' }} />
        <div className="armonia-drum-noa" style={{ ...NOA, "--noa-sprite": cssAssetUrl("./assets/sprites/noa-tambor-v0.webp"), backgroundPosition: `${NOA_POSES[noaPose]} 0` } as CSSProperties} />
        <div className={`armonia-drum-drum${view.noaHit && mode ? " is-hit" : ""}${view.noaGlow && mode ? " is-glow" : ""}`} style={{ ...NOA_DRUM, backgroundImage: 'url("./assets/sprites/tambor-noa-v0.webp")' }} />
        {prints && <Prints view={prints} className="armonia-drum-prints" style={prints.drum === "armonia" ? { left: armoniaPrints.x, top: armoniaPrints.y } : { left: noaPrints.x, top: noaPrints.y }} />}
        {mode && view.armoniaBubble && <span className="armonia-drum-bubble is-armonia">{view.armoniaBubble}</span>}
        {mode && view.noaBubble && <span className="armonia-drum-bubble is-noa">{view.noaBubble}</span>}
        {view.feedback && mode && <div className={`armonia-drum-feedback${view.feedback.miss ? " is-miss" : ""}`}>{view.feedback.text}</div>}
        <div className={`armonia-drum-stand${showGoal && got >= WIN_AT ? " is-reached" : ""}`} style={{ "--atril": cssAssetUrl("./assets/sprites/atril-armonia-v0.webp") } as CSSProperties}>
          <div className="armonia-drum-staff">
            {Array.from({ length: total }, (_, index) => <i key={index} className={index < got ? "is-got" : undefined} />)}
            {showGoal && <b className="armonia-drum-line" style={{ left: `calc(${WIN_AT / total * 100}% - 3px)` }} />}
          </div>
          {mode && view.gota && <i className="gota-cae" style={{ "--gota": "#ffd76a", left: `calc(${Math.min(got, total - 1) / total * 100}% + 8px)` } as CSSProperties} />}
        </div>
        {mode && view.counting > 0 && <div className="armonia-drum-caption">{view.counting}</div>}
        {mode && view.phase && <span className="armonia-drum-phase">{view.phase}</span>}
      </div>
    </div>
    {mode && <BotonControl className="armonia-drum-pausa" pictograma="pausa" etiqueta="partida.hud.pausa.oculto" onClick={() => setShowLeave(true)} />}
    {mode && <progress className="armonia-drum-progress" max={scoreLength(drumScores[mode])} value={Math.max(0, view.pulse)} aria-label={t("minijuegos.tambor.avance.oculto")} />}

    {mode && <div className="armonia-drum-controls">
      {mode && clockKind === "frame" && <span className="ritmo-mute"><Pictograma nombre="sin-sonido" /></span>}
      <div className={`armonia-drum-bigprints${prints ? ` is-${prints.drum}` : " is-off"}`} aria-hidden="true">
        {prints ? <Prints view={prints} className="armonia-drum-bigprints-row" /> : <span className="armonia-drum-bigprints-row" />}
      </div>
      {mode !== "demo" && <Boton tipo="seguir" className="armonia-drum-hit" clave="minijuegos.tambor.boton.golpea.rotulo" disabled={interactionPaused}
        onPointerDown={(event) => { event.stopPropagation(); if (event.button === 0) strike(); }} onClick={(event) => { if (event.detail === 0) strike(); }} />}
      {mode !== "song" && <Boton clave="minijuegos.tambor.practica.termina.rotulo" onClick={() => { const session = sessionRef.current; if (session) finish(session); }} />}
    </div>}
  </Dialog>

  {enPrevia && !showLeave && <PantallaPrevia id="armonia-drum-previa" nombre="minijuegos.tambor.previa.nombre.rotulo" guardian={retrato}
    regla={`${t("minijuegos.tambor.previa.regla.juntos")} ${boss.challenge.label}`}
    ayudaAdultos={[t("adultos.minijuegos.tambor.controles"), t("adultos.minijuegos.tambor.sinSonido")]}
    practicaPrimero={highlightPractice && finished?.mode !== "practice"}
    onPracticar={() => void begin(finished?.mode === "demo" ? "practice" : "demo")} onJugar={() => void begin("song")} onSalir={leave} />}

  {parada && !paused && <Ventana id="armonia-drum-parada" titulo={CLAVE_PARADA[parada.pieza as keyof typeof CLAVE_PARADA].rotulo}
    botones={<Boton tipo="seguir" clave="minijuegos.tambor.practica.sigue.rotulo" data-gamepad-default onClick={seguirParada} />}>
    <p className="juntos">{t(CLAVE_PARADA[parada.pieza as keyof typeof CLAVE_PARADA].juntos)}</p>
  </Ventana>}

  {result && !showLeave && <ResultadoMinijuego informe={informe} id="armonia-drum-resultado" titulo={RESULT_TEXT[result.result].title} gano={result.won} onSalir={leave}
    dibujo={<div className="armonia-drum-staff armonia-drum-staff-resultado" role="img" aria-label={t("minijuegos.tambor.resultado.atril.oculto")} style={{ "--atril": cssAssetUrl("./assets/sprites/atril-armonia-v0.webp") } as CSSProperties}>
      {Array.from({ length: total }, (_, index) => <i key={index} className={index < got ? "is-got" : undefined} />)}
      <b className="armonia-drum-line" style={{ left: `calc(${WIN_AT / total * 100}% - 3px)` }} />
    </div>}
    frase={t(RESULT_TEXT[result.result].text)}
    botones={result.won ? <>
      <Boton tipo="seguir" clave={friendlyReplay ? "minijuegos.tambor.resultado.amigos.rotulo" : "minijuegos.tambor.resultado.sigue.rotulo"} data-gamepad-default onClick={() => confirmWin(result.challengeCompleted)} />
      <Boton clave="minijuegos.tambor.resultado.otraVez.rotulo" onClick={() => void begin("song")} />
    </> : <>
      <Boton tipo="seguir" clave="minijuegos.tambor.resultado.otraVez.rotulo" data-gamepad-default onClick={() => void begin("song")} />
      <Boton clave="minijuegos.comun.previa.practica.rotulo" onClick={() => void begin("demo")} />
      <Boton clave={friendlyReplay ? "minijuegos.tambor.resultado.amigos.rotulo" : "minijuegos.tambor.resultado.mapa.rotulo"} data-gamepad-back onClick={leave} />
    </>} />}

  {showLeave && <Ventana id="armonia-drum-leave-title" titulo={mode ? "partida.pausa.titulo.rotulo" : "minijuegos.tambor.salir.titulo.rotulo"} onClose={() => setShowLeave(false)}
    botones={<>
      <Boton tipo="seguir" clave="minijuegos.tambor.salir.seguir.rotulo" data-gamepad-default data-gamepad-back onClick={() => setShowLeave(false)} />
      <Boton clave={friendlyReplay ? "minijuegos.tambor.resultado.amigos.rotulo" : mode ? "minijuegos.tambor.resultado.mapa.rotulo" : "minijuegos.tambor.salir.si.rotulo"} onClick={onAbandon} />
    </>}>
    <p className="juntos">{t("minijuegos.tambor.salir.juntos.juntos")}</p>
  </Ventana>}
  </>;
}
