import { useState, type CSSProperties } from "react";
import type { SoundKind } from "./GameCanvas";
import { Dialog } from "./Dialog";
import { GameAssetIcon } from "./GameAssetIcon";
import { bossCatalog } from "./bosses";
import { GUARDIAN_GAME_ROUNDS, guardianGames, type GuardianGameId, makeGuardianSequence } from "./guardianGames";
import type { GuardianOption } from "./guardianGames";
import { t, type ClaveTexto } from "../textos";
import { Boton, Pictogramas, Texto } from "../textos/Texto";
import { PantallaPrevia, ResultadoMinijuego } from "./minijuegoComun";
import { Ventana } from "./Ventana";

type Props = {
  bossId: GuardianGameId; paused: boolean; apples: number; protectedByApple: boolean;
  onSpendApple: () => void; onRestartLevel: () => void; onAbandon: () => void;
  onWin: (challengeCompleted: boolean) => void; playSound: (kind: SoundKind) => void; friendlyReplay?: boolean;
};
type Phase = "watch" | "play" | "feedback" | "won" | "lost";

function GuardianGameIcon({ option }: { option: GuardianOption }) {
  const [row, column] = option.sprite;
  return <span className="guardian-game-icon" style={{ backgroundImage: 'url("./assets/sprites/guardian-game-icons-v1.webp")', backgroundPosition: `${column * 50}% ${row * (100 / 6)}%` }} aria-hidden="true" />;
}

function randomSequence(gameId: GuardianGameId, round: number) {
  const game = guardianGames[gameId];
  const values = new Uint32Array(Math.max(1, game.sequenceLengths?.[round] ?? 1));
  window.crypto.getRandomValues(values);
  return makeGuardianSequence(game, round, values);
}

function GuardianPortrait({ bossId, won }: { bossId: GuardianGameId; won: boolean }) {
  const boss = bossCatalog[bossId];
  const frame = won ? 4 : 0;
  return <div className={`guardian-game-portrait ${boss.assetAtlas ? "is-atlas" : ""}`} role="img" aria-label={`${boss.name} ${won ? "sonríe" : "prepara su juego"}`}>
    {boss.assetAtlas
      ? <span style={{ backgroundImage: `url("${boss.assetAtlas}")`, backgroundPosition: `${frame * 25}% 100%` }} />
      : <img src={`${boss.assetPrefix}-${frame}.webp`} alt="" />}
  </div>;
}

export function GuardianMiniGame({ bossId, paused, apples, protectedByApple, onSpendApple, onRestartLevel, onAbandon, onWin, playSound, friendlyReplay = false }: Props) {
  const game = guardianGames[bossId], boss = bossCatalog[bossId];
  const [round, setRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [phase, setPhase] = useState<Phase>(game.kind === "sequence" ? "watch" : "play");
  const [sequence, setSequence] = useState(() => randomSequence(bossId, 0));
  const [input, setInput] = useState<string[]>([]);
  const [message, setMessage] = useState(game.instruction);
  const [showAbandon, setShowAbandon] = useState(false);
  const [empezado, setEmpezado] = useState(false);
  const detenido = paused || !empezado;

  const option = (id: string) => game.options.find((item) => item.id === id)!;
  const reset = (spendApple: boolean) => {
    if (spendApple) onSpendApple();
    setRound(0); setMistakes(0); setInput([]); setSequence(randomSequence(bossId, 0));
    setPhase(game.kind === "sequence" ? "watch" : "play"); setMessage(game.instruction);
  };
  const finishRound = (correct: boolean) => {
    if (!correct) {
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes); playSound("hurt");
      if (nextMistakes >= 3) { setPhase("lost"); setMessage(t("duelos.guardian.perdido.juntos")); return; }
      setInput([]); setPhase(game.kind === "sequence" ? "watch" : "play");
      setMessage(t(game.kind === "sequence" ? "duelos.guardian.casiSecuencia.juntos" : "duelos.guardian.casiPista.juntos"));
      return;
    }
    playSound("checkpoint"); setInput([]); setMessage(game.success);
    if (round >= GUARDIAN_GAME_ROUNDS - 1) setPhase("won");
    else setPhase("feedback");
  };
  const choose = (id: string) => {
    if (detenido || phase !== "play") return;
    if (game.kind === "choice") { finishRound(id === sequence[0]); return; }
    const nextInput = [...input, id]; setInput(nextInput);
    if (id !== sequence[nextInput.length - 1]) { finishRound(false); return; }
    if (nextInput.length === sequence.length) finishRound(true);
  };
  const nextRound = () => {
    const next = round + 1; setRound(next); setSequence(randomSequence(bossId, next)); setInput([]);
    setPhase(game.kind === "sequence" ? "watch" : "play"); setMessage(game.instruction);
  };
  const target = option(sequence[0]);
  const won = phase === "won", lost = phase === "lost";

  return <><Dialog labelledBy="guardian-game-title" backdropClassName="boss-backdrop" className={`boss-battle guardian-game boss-theme-${bossId}`} gamepad>
    <header className="boss-header">
      <div><p className="eyebrow rotulo"><Texto clave="duelos.guardian.ronda.rotulo" variables={{ n: Math.min(round + 1, GUARDIAN_GAME_ROUNDS), total: GUARDIAN_GAME_ROUNDS }} /></p><h2 id="guardian-game-title" className="rotulo">{game.title}</h2></div>
      <div className="guardian-game-status"><span aria-label={t("duelos.guardian.oportunidades.oculto", { n: 3 - mistakes })}>{"♥".repeat(3 - mistakes)}{"♡".repeat(mistakes)}</span><b>{round + (won ? 1 : 0)}/{GUARDIAN_GAME_ROUNDS}</b>{!friendlyReplay && <small><GameAssetIcon kind="apple" /> × {apples}</small>}</div>
    </header>
    <div className="guardian-game-stage">
      <GuardianPortrait bossId={bossId} won={won} />
      <div className="guardian-game-board">
        <strong className="texto-noa">{phase === "watch" || game.kind === "choice" ? <Pictogramas texto={game.prompt} /> : phase === "play" ? <Texto clave="duelos.guardian.repite.rotulo" /> : <Pictogramas texto={game.success} />}</strong>
        {game.kind === "choice" && !won && !lost && <div className="guardian-target" style={{ "--guardian-color": target.color } as CSSProperties}><GuardianGameIcon option={target} /><b>{target.label}</b></div>}
        {game.kind === "sequence" && phase === "watch" && <div className="guardian-sequence">{sequence.map((id, index) => <span role="img" aria-label={`${index + 1}: ${option(id).label}`} style={{ "--guardian-color": option(id).color } as CSSProperties} key={`${id}-${index}`}><GuardianGameIcon option={option(id)} /><small aria-hidden="true">{index + 1}</small></span>)}</div>}
        {game.kind === "sequence" && phase === "play" && <div className="guardian-progress" aria-label={t("duelos.guardian.pasos.oculto", { n: input.length, total: sequence.length })} >{sequence.map((_, index) => <span className={index < input.length ? "is-done" : ""} key={index}>{index < input.length ? "★" : index + 1}</span>)}</div>}
        <p className="sr-only" aria-live="polite">{message}</p>
      </div>
    </div>
    {phase === "watch" && <button className="pixel-button primary guardian-ready" type="button" disabled={detenido} data-gamepad-default onClick={() => { setPhase("play"); setMessage(t("duelos.guardian.mismoOrden.juntos")); }}><Texto clave="duelos.guardian.listo.rotulo" /></button>}
    {phase === "play" && <div className="guardian-options">{game.options.map((item) => <button type="button" disabled={detenido} onClick={() => choose(item.id)} style={{ "--guardian-color": item.color } as CSSProperties} key={item.id}><GuardianGameIcon option={item} /><strong>{item.label}</strong></button>)}</div>}
    {phase === "feedback" && <button className="pixel-button primary guardian-ready" type="button" disabled={detenido} data-gamepad-default onClick={nextRound}><Texto clave="duelos.boton.siguiente.rotulo" /></button>}
    {!won && !lost && <Boton className="duel-abandon boton-pequeno" clave={friendlyReplay ? "duelos.boton.amigos.rotulo" : "duelos.boton.rendirse.rotulo"} onClick={() => friendlyReplay ? onAbandon() : setShowAbandon(true)} />}

  </Dialog>
  {!empezado && !paused && <PantallaPrevia id="guardian-previa" nombre={`juegos.${bossId}.titulo.rotulo` as ClaveTexto} guardian={<GuardianPortrait bossId={bossId} won={false} />}
    regla={`${game.instruction} ${t("duelos.guardian.reto.juntos")}${protectedByApple ? ` ${t("duelos.guardian.armadura.juntos")}` : ""}`}
    practicaPrimero={false} onJugar={() => setEmpezado(true)} onSalir={onAbandon} />}
  {won && !paused && <ResultadoMinijuego id="guardian-resultado" titulo="duelos.guardian.completado.rotulo" gano onSalir={() => { playSound("goal"); onWin(mistakes === 0); }}
    dibujo={<GuardianPortrait bossId={bossId} won />}
    frase={t(mistakes === 0 ? "duelos.detalle.reto.juntos" : "duelos.detalle.libre.juntos", { nombre: boss.name })}
    botones={<Boton tipo="seguir" clave={friendlyReplay ? "duelos.boton.amigos.rotulo" : "duelos.boton.continuar.rotulo"} data-gamepad-default onClick={() => { playSound("goal"); onWin(mistakes === 0); }} />} />}
  {lost && !paused && !showAbandon && <ResultadoMinijuego id="guardian-resultado" titulo="duelos.guardian.otraVez.rotulo" gano={false} onSalir={() => friendlyReplay ? onAbandon() : setShowAbandon(true)}
    dibujo={<GuardianPortrait bossId={bossId} won={false} />}
    frase={t("duelos.guardian.perdido.juntos")}
    botones={<>
      {friendlyReplay ? <Boton tipo="seguir" clave="duelos.boton.otraVez.rotulo" data-gamepad-default onClick={() => reset(false)} />
        : apples > 0 ? <Boton tipo="seguir" clave="duelos.boton.manzana.rotulo" data-gamepad-default onClick={() => reset(true)} />
          : <Boton tipo="seguir" clave="duelos.boton.empezar.rotulo" data-gamepad-default onClick={onRestartLevel} />}
      <Boton clave={friendlyReplay ? "duelos.boton.amigos.rotulo" : "duelos.boton.rendirse.rotulo"} data-gamepad-back onClick={() => friendlyReplay ? onAbandon() : setShowAbandon(true)} />
    </>} />}
  {showAbandon && <Ventana id="guardian-abandon-title" titulo="duelos.abandonar.titulo.rotulo" onClose={() => setShowAbandon(false)}
    botones={<>
      <Boton tipo="seguir" clave="duelos.abandonar.seguir.rotulo" data-gamepad-default data-gamepad-back onClick={() => setShowAbandon(false)} />
      <Boton clave="duelos.abandonar.salir.rotulo" onClick={onAbandon} />
    </>}>
    <p className="juntos">{t("duelos.abandonar.juego.juntos")}</p>
  </Ventana>}</>;
}
