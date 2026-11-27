import "../textos/zonas/duelos";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { SoundKind } from "./GameCanvas";
import { GameAssetIcon } from "./GameAssetIcon";
import { Dialog } from "./Dialog";
import { bossCatalog, type BossChallengeId } from "./bosses";
import { justPressed, readDuelPad, type DuelPadButtons } from "./duelGamepad";
import { firstConnectedGamepad } from "./gamepad";
import type { BossId } from "./types";
import { dibujoDeNoa, TRAJE_DE_SIEMPRE, type TrajeId } from "./trajes";
import { conTextos, t, tClave } from "../textos/index.ts";
import { Boton, Texto } from "../textos/Texto";
import { PantallaPrevia, ResultadoMinijuego } from "./minijuegoComun";
import { Ventana } from "./Ventana";
import { ganadorRonda, gestoPensado, type GanadorRonda, type Gesto } from "./piedraPapelTijera";

type Choice = Gesto;
type RoundWinner = GanadorRonda;
type BattleStatus = "choosing" | "countdown" | "revealed" | "won" | "lost";

type BattleState = {
  noaScore: number;
  bossScore: number;
  noaChoice?: Choice;
  bossChoice?: Choice;
  roundWinner?: RoundWinner;
  /** Gesto que el guardián enseña en su bocadillo y que sacará en esta ronda. */
  pensado: Choice;
  status: BattleStatus;
};

const azar = () => {
  const valor = new Uint32Array(1);
  window.crypto.getRandomValues(valor);
  return valor[0];
};
/** Empieza el duelo: sin gestos de Noa todavía, el guardián piensa uno al azar. */
const nuevoDuelo = (): BattleState => ({ noaScore: 0, bossScore: 0, pensado: gestoPensado(undefined, azar()), status: "choosing" });

type RoundRecord = { noaChoice: Choice; bossChoice: Choice; winner: RoundWinner };

type BossBattleProps = {
  bossId: BossId;
  paused: boolean;
  apples: number;
  protectedByApple: boolean;
  onSpendApple: () => void;
  onRestartLevel: () => void;
  onAbandon: () => void;
  onWin: (challengeCompleted: boolean) => void;
  playSound: (kind: SoundKind) => void;
  friendlyReplay?: boolean;
  traje?: TrajeId;
};

const choices = [
  conTextos({ id: "rock" }, { label: "duelos.gesto.piedra.rotulo" }),
  conTextos({ id: "paper" }, { label: "duelos.gesto.papel.rotulo" }),
  conTextos({ id: "scissors" }, { label: "duelos.gesto.tijera.rotulo" }),
] as Array<{ id: Choice; label: string }>;
const gestoDe = (choice: Choice) => choice === "rock" ? "piedra" : choice === "paper" ? "papel" : "tijera";

const choiceById = Object.fromEntries(choices.map((choice) => [choice.id, choice])) as Record<Choice, (typeof choices)[number]>;

function RpsIcon({ choice, small = false }: { choice: Choice; small?: boolean }) {
  return <span className={`rps-icon rps-${choice} ${small ? "is-small" : ""}`} style={{ backgroundImage: 'url("./assets/sprites/rps-icons-v1.webp")' }} aria-hidden="true" />;
}

function getRuleText(noa: Choice, boss: Choice) {
  if (noa === boss) return t("duelos.regla.empate.juntos", { gesto: tClave(`duelos.gesto.${gestoDe(noa)}.juntos`) });
  const pair = new Set([noa, boss]);
  if (pair.has("rock") && pair.has("scissors")) return t("duelos.regla.piedra.juntos");
  if (pair.has("paper") && pair.has("rock")) return t("duelos.regla.papel.juntos");
  return t("duelos.regla.tijeras.juntos");
}

function BossSprite({ assetPrefix, assetAtlas, frame, name }: { assetPrefix: string; assetAtlas?: string; frame: number; name: string }) {
  const gesture = tClave(`duelos.gesto.${frame === 1 ? "piedra" : frame === 2 ? "papel" : frame === 3 ? "tijera" : frame === 4 ? "derrota" : "reto"}.juntos`);
  const isWideSprite = assetPrefix.includes("reina-arcoiris");
  return (
    <div className={`boss-sprite-window ${isWideSprite ? "is-wide-sprite" : ""} ${assetAtlas ? "is-atlas-sprite" : ""}`} role="img" aria-label={t("duelos.haceGesto.oculto", { nombre: name, gesto: gesture })}>
      {assetAtlas
        ? <span className="boss-sprite-frame boss-atlas-frame" style={{ backgroundImage: `url("${assetAtlas}")`, backgroundPosition: `${frame * 25}% 100%` }} />
        : <img className="boss-sprite-frame" src={`${assetPrefix}-${frame}.webp`} alt="" />}
    </div>
  );
}

const POSES_DUELO = ["piedra", "papel", "tijera", "victoria"] as const;

function NoaDuelSprite({ frame, protectedByApple, traje }: { frame: number | null; protectedByApple: boolean; traje: TrajeId }) {
  const gesture = tClave(`duelos.gesto.${frame === 0 ? "piedra" : frame === 1 ? "papel" : frame === 2 ? "tijera" : frame === 3 ? "victoria" : "preparada"}.juntos`);
  const dibujo = dibujoDeNoa(traje, frame === null ? "hoja" : POSES_DUELO[frame], protectedByApple);
  return (
    <div className={`duel-noa-sprite${dibujo.brillo ? " con-brillo" : ""}`} role="img" aria-label={t("duelos.haceGesto.oculto", { nombre: tClave("duelos.noa.rotulo"), gesto: gesture })}>
      {frame === null
        ? <div className="duel-noa-idle" style={{ backgroundImage: `url("${dibujo.src}")` }} />
        : <img src={dibujo.src} alt="" />}
    </div>
  );
}

export function BossBattle({ bossId, paused, apples, protectedByApple, onSpendApple, onRestartLevel, onAbandon, onWin, playSound, friendlyReplay = false, traje = TRAJE_DE_SIEMPRE }: BossBattleProps) {
  const boss = bossCatalog[bossId];
  const [battle, setBattle] = useState<BattleState>(nuevoDuelo);
  const [countdown, setCountdown] = useState(3);
  const [history, setHistory] = useState<RoundRecord[]>([]);
  const [usedApple, setUsedApple] = useState(false);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(0);
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const [showAbandon, setShowAbandon] = useState(false);
  const [empezado, setEmpezado] = useState(false);
  const battlePaused = paused || showAbandon || !empezado;
  const previousPadRef = useRef<DuelPadButtons | null>(null);
  const previousBackRef = useRef(false);

  useEffect(() => {
    if (battlePaused || battle.status !== "countdown") return;
    if (countdown > 0) playSound("countdown");
    const timeout = window.setTimeout(() => {
      if (countdown > 0) {
        setCountdown((current) => current - 1);
        return;
      }
      if (!battle.noaChoice || !battle.bossChoice || !battle.roundWinner) return;
      const noaScore = battle.noaScore + (battle.roundWinner === "noa" ? 1 : 0);
      const bossScore = battle.bossScore + (battle.roundWinner === "boss" ? 1 : 0);
      const status: BattleStatus = noaScore >= 2 ? "won" : bossScore >= 2 ? "lost" : "revealed";
      setHistory((current) => [...current, { noaChoice: battle.noaChoice!, bossChoice: battle.bossChoice!, winner: battle.roundWinner! }]);
      setBattle((current) => ({ ...current, noaScore, bossScore, status }));
      playSound(battle.roundWinner === "noa" ? "checkpoint" : battle.roundWinner === "boss" ? "hurt" : "block");
    }, countdown > 0 ? 360 : 220);
    return () => window.clearTimeout(timeout);
  }, [battle, countdown, battlePaused, playSound]);

  const choose = (noaChoice: Choice) => {
    if (battle.status !== "choosing") return;
    // El guardián saca lo que enseñaba su bocadillo: nunca hace trampa.
    const bossChoice = battle.pensado;
    setCountdown(3);
    setBattle((current) => ({ ...current, noaChoice, bossChoice, roundWinner: ganadorRonda(noaChoice, bossChoice), status: "countdown" }));
  };

  const nextRound = () => setBattle((current) => ({ noaScore: current.noaScore, bossScore: current.bossScore, pensado: gestoPensado(current.noaChoice, azar()), status: "choosing" }));
  const retryWithApple = () => {
    if (apples <= 0) return;
    onSpendApple();
    setUsedApple(true);
    setHistory([]);
    setBattle(nuevoDuelo());
  };
  const retryFriendly = () => {
    setHistory([]);
    setBattle(nuevoDuelo());
  };
  const abandonBattle = () => {
    if (friendlyReplay) onAbandon();
    else setShowAbandon(true);
  };
  const choicesRevealed = battle.status !== "choosing" && battle.status !== "countdown";
  const visibleWinner = choicesRevealed ? battle.roundWinner : undefined;
  const bossFrame = battle.status === "won" ? 4 : choicesRevealed && battle.bossChoice ? choices.findIndex((choice) => choice.id === battle.bossChoice) + 1 : 0;
  const noaFrame = battle.status === "won" ? 3 : choicesRevealed && battle.noaChoice ? choices.findIndex((choice) => choice.id === battle.noaChoice) : null;
  const roundText = battle.noaChoice && battle.bossChoice ? getRuleText(battle.noaChoice, battle.bossChoice) : t("duelos.regla.elige.juntos");
  const roundNumber = battle.status === "choosing" || battle.status === "countdown" ? history.length + 1 : Math.max(1, history.length);
  const challengeCompleted = (challengeId: BossChallengeId) => {
    if (challengeId === "clean-sweep") return battle.bossScore === 0;
    if (challengeId === "no-apple") return !usedApple;
    if (challengeId === "finish-rock") return battle.noaChoice === "rock";
    if (challengeId === "finish-scissors") return battle.noaChoice === "scissors";
    if (challengeId === "finish-paper") return battle.noaChoice === "paper";
    return history.some((round) => round.winner === "tie");
  };
  const wonChallenge = battle.status === "won" && challengeCompleted(boss.challenge.id);

  useEffect(() => {
    let animationId = 0;
    const poll = () => {
      const pad = firstConnectedGamepad();
      if (!pad) {
        if (previousPadRef.current) setGamepadConnected(false);
        previousPadRef.current = null;
        previousBackRef.current = false;
        animationId = requestAnimationFrame(poll);
        return;
      }
      if (!previousPadRef.current) setGamepadConnected(true);
      const pressed = readDuelPad(pad);
      const previous = previousPadRef.current;
      const back = Boolean(pad.buttons[1]?.pressed);
      previousPadRef.current = pressed;
      if (previous && !battlePaused && back && !previousBackRef.current && battle.status !== "won") abandonBattle();
      previousBackRef.current = back;
      if (previous && !battlePaused && !back) {
        if (battle.status === "choosing") {
          let nextIndex = selectedChoiceIndex;
          if (justPressed(pressed, previous, 3) || justPressed(pressed, previous, 1)) nextIndex = (nextIndex + choices.length - 1) % choices.length;
          if (justPressed(pressed, previous, 4) || justPressed(pressed, previous, 2)) nextIndex = (nextIndex + 1) % choices.length;
          if (nextIndex !== selectedChoiceIndex) setSelectedChoiceIndex(nextIndex);
          if (justPressed(pressed, previous, 0)) choose(choices[nextIndex].id);
        } else if (justPressed(pressed, previous, 0)) {
          if (battle.status === "revealed") nextRound();
          else if (battle.status === "lost") {
            if (friendlyReplay) retryFriendly();
            else if (apples > 0) retryWithApple();
            else onRestartLevel();
          } else if (battle.status === "won") { playSound("goal"); onWin(wonChallenge); }
        }
      }
      animationId = requestAnimationFrame(poll);
    };
    animationId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(animationId);
  });

  return (
    <>
      <Dialog labelledBy="boss-title" backdropClassName="boss-backdrop" className={`boss-battle boss-theme-${bossId} battle-${battle.status} result-flash-${visibleWinner ?? "none"}`}>
        {(visibleWinner === "noa" || battle.status === "won") && (
          <div className="duel-confetti" aria-hidden="true">
            {Array.from({ length: 14 }, (_, index) => (
              <i style={{ "--piece-x": `${index * 7}%`, "--piece-delay": `${index * 25}ms`, "--piece-drift": `${(index - 7) * 5}px`, "--piece-hue": index * 47 } as CSSProperties} key={index} />
            ))}
          </div>
        )}
        <header className="boss-header">
          <div>
            <p className="eyebrow rotulo"><Texto clave="duelos.ronda.rotulo" variables={{ n: roundNumber }} /></p>
            <h2 id="boss-title" className="rotulo"><Texto clave={friendlyReplay ? "duelos.titulo.amistoso.rotulo" : "duelos.titulo.final.rotulo"} variables={{ nombre: boss.name }} /></h2>
          </div>
          <div className="duel-status-panel">
            <div className="duel-score" aria-label={t("duelos.marcador.oculto", { noa: battle.noaScore, nombre: boss.name, jefe: battle.bossScore })}>
              <span><Texto clave="duelos.noa.rotulo" /> <strong>{battle.noaScore}</strong></span><b>—</b><span><strong>{battle.bossScore}</strong> <Texto clave="duelos.jefe.rotulo" /></span>
            </div>
            {!friendlyReplay && <div className="duel-attempts" aria-label={t("duelos.intentos.oculto", { n: apples })}>
              <span><GameAssetIcon kind="apple" /> × {apples}</span><small><Texto clave="duelos.intentos.rotulo" /></small>
            </div>}
          </div>
        </header>

        {history.length > 0 && (
          <ol className="round-history" aria-label={t("duelos.historial.oculto")}>
            {history.map((round, index) => (
              <li className={`history-${round.winner}`} key={`${round.noaChoice}-${round.bossChoice}-${index}`}>
                <small><Texto clave="duelos.historial.ronda.rotulo" variables={{ n: index + 1 }} /></small><RpsIcon choice={round.noaChoice} small /><b>{round.winner === "noa" ? "★" : round.winner === "boss" ? "×" : "="}</b><RpsIcon choice={round.bossChoice} small />
              </li>
            ))}
          </ol>
        )}

        <div className={`duel-arena ${battle.status === "countdown" ? "is-countdown" : ""} ${choicesRevealed ? "is-revealed" : ""}`}>
          {battle.status === "countdown" && <div className="duel-countdown" aria-live="assertive">{countdown === 0 ? <Texto clave="duelos.cuenta.ya.rotulo" />
            : <span className="duel-countdown-gesto"><RpsIcon choice={countdown === 3 ? "rock" : countdown === 2 ? "paper" : "scissors"} /><b>{choiceById[countdown === 3 ? "rock" : countdown === 2 ? "paper" : "scissors"].label}</b></span>}</div>}
          <div className={`duel-fighter noa-fighter ${visibleWinner === "noa" ? "round-winner" : visibleWinner === "boss" ? "round-loser" : ""}`}>
            <NoaDuelSprite frame={noaFrame} protectedByApple={protectedByApple} traje={traje} />
            <strong><Texto clave="duelos.noa.rotulo" /></strong>
            <div className={`gesture-card ${battle.status === "countdown" ? "is-hidden" : ""}`}>
              <span>{choicesRevealed && battle.noaChoice ? <RpsIcon choice={battle.noaChoice} /> : "?"}</span>
              <b>{choicesRevealed && battle.noaChoice ? choiceById[battle.noaChoice].label : <Texto clave={battle.status === "countdown" ? "duelos.cuenta.piensa.rotulo" : "duelos.cuenta.lista.rotulo"} />}</b>
            </div>
          </div>
          <div className="duel-versus" aria-hidden="true"><Texto clave="duelos.vs.rotulo" /></div>
          <div className={`duel-fighter ${visibleWinner === "boss" ? "round-winner" : visibleWinner === "noa" ? "round-loser" : ""}`}>
            {battle.status === "choosing" && empezado && <span className="boss-bocadillo" role="img" aria-label={t("duelos.bocadillo.oculto", { nombre: boss.name, gesto: choiceById[battle.pensado].label })}><RpsIcon choice={battle.pensado} /></span>}
            <BossSprite assetPrefix={boss.assetPrefix} assetAtlas={boss.assetAtlas} frame={bossFrame} name={boss.name} />
            <strong>{boss.name}</strong>
            <div className={`gesture-card ${battle.status === "countdown" ? "is-hidden" : ""}`}>
              <span>{choicesRevealed && battle.bossChoice ? <RpsIcon choice={battle.bossChoice} /> : "?"}</span>
              <b>{choicesRevealed && battle.bossChoice ? choiceById[battle.bossChoice].label : <Texto clave={battle.status === "countdown" ? "duelos.cuenta.piensa.rotulo" : "duelos.cuenta.espera.rotulo"} />}</b>
            </div>
          </div>
        </div>

        <div className={`round-message result-${visibleWinner ?? "none"}`} aria-live="polite">
          {battle.status !== "countdown" && <strong><Texto variables={{ nombre: boss.name }} clave={battle.status === "won" ? "duelos.mensaje.gana.rotulo" : battle.status === "lost" ? "duelos.mensaje.pierde.rotulo" : visibleWinner === "noa" ? "duelos.mensaje.rondaNoa.rotulo" : visibleWinner === "boss" ? "duelos.mensaje.rondaJefe.rotulo" : visibleWinner === "tie" ? "duelos.mensaje.empate.rotulo" : "duelos.mensaje.elige.rotulo"} /></strong>}
          {choicesRevealed && battle.noaChoice && battle.bossChoice && (
            <div className="round-choice-spotlight" aria-label={t("duelos.mensaje.eleccion.oculto", { noa: choiceById[battle.noaChoice].label, nombre: boss.name, jefe: choiceById[battle.bossChoice].label })}>
              <span><small><Texto clave="duelos.noa.rotulo" /></small><RpsIcon choice={battle.noaChoice} /><b>{choiceById[battle.noaChoice].label}</b></span>
              <em><Texto clave="duelos.vs.rotulo" /></em>
              <span><small>{boss.name.toUpperCase()}</small><RpsIcon choice={battle.bossChoice} /><b>{choiceById[battle.bossChoice].label}</b></span>
            </div>
          )}
          {battle.status === "revealed" && <span className="juntos">{roundText}</span>}
        </div>

        {battle.status === "choosing" && (
          <div className="duel-choices" aria-label={t("duelos.regla.grupo.oculto")}>
            {choices.map((choice, index) => (
              <button type="button" className={gamepadConnected && selectedChoiceIndex === index ? "is-pad-selected" : ""} onClick={() => choose(choice.id)} style={{ "--choice-delay": `${index * 75}ms` } as CSSProperties} key={choice.id}>
                <span><RpsIcon choice={choice.id} /></span><strong>{choice.label}</strong>
              </button>
            ))}
            {gamepadConnected && <p className="duel-pad-tip">{t("duelos.regla.mando")}</p>}
          </div>
        )}
        {battle.status === "revealed" && <Boton tipo="seguir" className="duel-next" clave="duelos.boton.siguiente.rotulo" onClick={nextRound} />}
        {battle.status !== "won" && battle.status !== "lost" && <Boton className="duel-abandon boton-pequeno" clave={friendlyReplay ? "duelos.boton.amigos.rotulo" : "duelos.boton.rendirse.rotulo"} onClick={abandonBattle} />}

        <p className="duel-rules"><span><RpsIcon choice="rock" small /> <Texto clave="duelos.regla.gana.rotulo" /> <RpsIcon choice="scissors" small /></span><span><RpsIcon choice="scissors" small /> <Texto clave="duelos.regla.gana.rotulo" /> <RpsIcon choice="paper" small /></span><span><RpsIcon choice="paper" small /> <Texto clave="duelos.regla.gana.rotulo" /> <RpsIcon choice="rock" small /></span></p>
      </Dialog>
      {!empezado && !paused && <PantallaPrevia id="boss-previa" nombre={friendlyReplay ? "duelos.titulo.amistoso.rotulo" : "duelos.titulo.final.rotulo"} nombreVariables={{ nombre: boss.name }}
        guardian={<BossSprite assetPrefix={boss.assetPrefix} assetAtlas={boss.assetAtlas} frame={0} name={boss.name} />}
        regla={`${t("duelos.regla.bocadillo.juntos")} ${t("duelos.regla.elige.juntos")} ${boss.challenge.label}`}
        ayudaAdultos={[t("duelos.regla.mando")]} practicaPrimero={false} onJugar={() => setEmpezado(true)} onSalir={onAbandon} />}

      {battle.status === "won" && !paused && <ResultadoMinijuego id="boss-resultado" titulo="duelos.mensaje.gana.rotulo" tituloVariables={{ nombre: boss.name }} gano onSalir={() => { playSound("goal"); onWin(wonChallenge); }}
        dibujo={<BossSprite assetPrefix={boss.assetPrefix} assetAtlas={boss.assetAtlas} frame={4} name={boss.name} />}
        frase={friendlyReplay ? t("duelos.detalle.amistad.juntos", { nombre: boss.name }) : wonChallenge ? t("duelos.detalle.reto.juntos", { nombre: boss.name }) : t("duelos.detalle.libre.juntos", { nombre: boss.name })}
        botones={<Boton tipo="seguir" clave={friendlyReplay ? "duelos.boton.amigos.rotulo" : "duelos.boton.continuar.rotulo"} data-gamepad-default onClick={() => { playSound("goal"); onWin(wonChallenge); }} />} />}

      {battle.status === "lost" && !paused && !showAbandon && <ResultadoMinijuego id="boss-resultado" titulo="duelos.mensaje.pierde.rotulo" tituloVariables={{ nombre: boss.name }} gano={false} onSalir={abandonBattle}
        dibujo={<BossSprite assetPrefix={boss.assetPrefix} assetAtlas={boss.assetAtlas} frame={0} name={boss.name} />}
        frase={friendlyReplay ? t("duelos.detalle.otraVez.juntos") : apples > 0 ? t("duelos.detalle.manzana.juntos") : t("duelos.detalle.sinManzanas.juntos")}
        botones={<>
          {friendlyReplay ? <Boton tipo="seguir" clave="duelos.boton.otraVez.rotulo" data-gamepad-default onClick={retryFriendly} />
            : apples > 0 ? <Boton tipo="seguir" className="apple-retry" clave="duelos.boton.manzana.rotulo" data-gamepad-default onClick={retryWithApple} />
              : <Boton tipo="seguir" className="restart-level" clave="duelos.boton.empezar.rotulo" data-gamepad-default onClick={onRestartLevel} />}
          <Boton clave={friendlyReplay ? "duelos.boton.amigos.rotulo" : "duelos.boton.rendirse.rotulo"} data-gamepad-back onClick={abandonBattle} />
        </>} />}

      {showAbandon && <Ventana id="abandon-title" titulo="duelos.abandonar.titulo.rotulo" onClose={() => setShowAbandon(false)}
        botones={<>
          <Boton tipo="seguir" clave="duelos.abandonar.seguir.rotulo" data-gamepad-default data-gamepad-back onClick={() => setShowAbandon(false)} />
          <Boton clave="duelos.abandonar.salir.rotulo" onClick={onAbandon} />
        </>}>
        <p className="juntos">{t("duelos.abandonar.duelo.juntos")}</p>
      </Ventana>}
    </>
  );
}
