import { useState, type CSSProperties } from "react";
import type { SoundKind } from "./GameCanvas";
import { Dialog } from "./Dialog";
import { GameAssetIcon } from "./GameAssetIcon";
import { bossCatalog } from "./bosses";
import { choiceAnswer, guardianGames, type GuardianGameId, makeGuardianSequence } from "./guardianGames";

type Props = {
  bossId: GuardianGameId; paused: boolean; apples: number; protectedByApple: boolean;
  onSpendApple: () => void; onRestartLevel: () => void; onAbandon: () => void;
  onWin: (challengeCompleted: boolean) => void; playSound: (kind: SoundKind) => void; friendlyReplay?: boolean;
};
type Phase = "watch" | "play" | "feedback" | "won" | "lost";

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
      : <img src={`${boss.assetPrefix}-${frame}.png`} alt="" />}
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
      if (nextMistakes >= 3) { setPhase("lost"); setMessage("No pasa nada. Ya sabes cómo se juega y puedes probar otra vez."); return; }
      setInput([]); setPhase(game.kind === "sequence" ? "watch" : "play");
      setMessage(game.kind === "sequence" ? "Casi. Mira de nuevo la secuencia despacito." : "Casi. Mira la pista y prueba otra vez.");
      return;
    }
    playSound("checkpoint"); setInput([]); setMessage(game.success);
    if (round >= 2) setPhase("won");
    else setPhase("feedback");
  };
  const choose = (id: string) => {
    if (paused || phase !== "play") return;
    if (game.kind === "choice") { finishRound(id === choiceAnswer(bossId, sequence[0])); return; }
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
      <div><p className="eyebrow">{friendlyReplay ? "Juego amistoso" : "Juego del guardián"} · Ronda {Math.min(round + 1, 3)} de 3</p><h2 id="guardian-game-title">{game.title}</h2><p>{game.instruction}</p><p className="boss-challenge">★ Reto de amistad: completa el juego sin equivocarte.</p></div>
      <div className="guardian-game-status"><span aria-label={`${3 - mistakes} oportunidades`}>{"♥".repeat(3 - mistakes)}{"♡".repeat(mistakes)}</span><b>{round + (won ? 1 : 0)}/3</b>{!friendlyReplay && <small><GameAssetIcon kind="apple" /> × {apples}</small>}</div>
    </header>
    <div className="guardian-game-stage">
      <GuardianPortrait bossId={bossId} won={won} />
      <div className="guardian-game-board">
        <strong>{phase === "watch" || game.kind === "choice" ? game.prompt : phase === "play" ? "Ahora repítelo" : message}</strong>
        {game.kind === "choice" && !won && !lost && <div className="guardian-target" style={{ "--guardian-color": target.color } as CSSProperties}><span>{bossId === "great-boar" ? (target.id === "left" ? "➡" : target.id === "right" ? "⬅" : "⬆") : target.icon}</span><b>{bossId === "great-boar" ? (target.id === "left" ? "la izquierda" : target.id === "right" ? "la derecha" : "abajo") : target.label}</b></div>}
        {game.kind === "sequence" && phase === "watch" && <div className="guardian-sequence">{sequence.map((id, index) => <span role="img" aria-label={`${index + 1}: ${option(id).label}`} style={{ "--guardian-color": option(id).color } as CSSProperties} key={`${id}-${index}`}>{option(id).icon}<small aria-hidden="true">{index + 1}</small></span>)}</div>}
        {game.kind === "sequence" && phase === "play" && <div className="guardian-progress" aria-label={`${input.length} de ${sequence.length} pasos`} >{sequence.map((_, index) => <span className={index < input.length ? "is-done" : ""} key={index}>{index < input.length ? "★" : index + 1}</span>)}</div>}
        <p aria-live="polite">{message}</p>
      </div>
    </div>
    {phase === "watch" && <button className="pixel-button primary guardian-ready" type="button" disabled={paused} data-gamepad-default onClick={() => { setPhase("play"); setMessage("Toca los dibujos en el mismo orden."); }}>¡Ya me acuerdo! ▶</button>}
    {phase === "play" && <div className="guardian-options">{game.options.map((item) => <button type="button" disabled={paused} onClick={() => choose(item.id)} style={{ "--guardian-color": item.color } as CSSProperties} key={item.id}><span>{item.icon}</span><strong>{item.label}</strong></button>)}</div>}
    {phase === "feedback" && <button className="pixel-button primary guardian-ready" type="button" disabled={paused} data-gamepad-default onClick={nextRound}>Siguiente ronda ▶</button>}
    {won && <div className="guardian-result"><h3>¡Juego completado!</h3><p>{mistakes === 0 ? `¡Reto logrado! ${boss.name} te regala un marco especial.` : `${boss.name} sonríe y abre el camino.`}</p><button className="pixel-button primary" data-gamepad-default onClick={() => { playSound("goal"); onWin(mistakes === 0); }}>{friendlyReplay ? "Volver a mis amigos" : "Continuar la aventura ▶"}</button></div>}
    {lost && <div className="guardian-result"><h3>¡Vamos otra vez!</h3><p>{message}</p>{friendlyReplay ? <button className="pixel-button primary" data-gamepad-default onClick={() => reset(false)}>Jugar otra vez</button> : apples > 0 ? <button className="pixel-button primary" data-gamepad-default onClick={() => reset(true)}><GameAssetIcon kind="apple" /> Usar una manzana y repetir</button> : <button className="pixel-button primary" data-gamepad-default onClick={onRestartLevel}>Volver a empezar la pantalla</button>}</div>}
    {!won && <button className="text-button duel-abandon" type="button" onClick={() => friendlyReplay ? onAbandon() : setShowAbandon(true)}>{friendlyReplay ? "Volver a mis amigos" : "🏳 Rendirse y volver al mapa"}</button>}
    {protectedByApple && <p className="guardian-armor-note">La armadura dorada de Noa sigue brillando durante el juego.</p>}
  </Dialog>{showAbandon && <Dialog labelledBy="guardian-abandon-title" className="game-modal compact" onClose={() => setShowAbandon(false)} gamepad>
    <p className="eyebrow">Un momento</p><h2 id="guardian-abandon-title">¿Volvemos al mapa?</h2>
    <p>Este juego empezará de nuevo cuando vuelvas. Tus pegatinas encontradas siguen guardadas.</p>
    <button className="pixel-button primary" type="button" data-gamepad-default data-gamepad-back onClick={() => setShowAbandon(false)}>Seguir con el juego</button>
    <button className="pixel-button" type="button" onClick={onAbandon}>Sí, volver al mapa</button>
  </Dialog>}</>;
}
