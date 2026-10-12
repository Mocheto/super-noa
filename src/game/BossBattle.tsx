import { useEffect, useState, type CSSProperties } from "react";
import type { SoundKind } from "./GameCanvas";
import { GameAssetIcon } from "./GameAssetIcon";
import { bossCatalog, type BossChallengeId } from "./bosses";
import type { BossId } from "./types";

type Choice = "rock" | "paper" | "scissors";
type RoundWinner = "noa" | "boss" | "tie";
type BattleStatus = "choosing" | "countdown" | "revealed" | "won" | "lost";

type BattleState = {
  noaScore: number;
  bossScore: number;
  noaChoice?: Choice;
  bossChoice?: Choice;
  roundWinner?: RoundWinner;
  status: BattleStatus;
};

type RoundRecord = { noaChoice: Choice; bossChoice: Choice; winner: RoundWinner };

type BossBattleProps = {
  bossId: BossId;
  apples: number;
  protectedByApple: boolean;
  onSpendApple: () => void;
  onRestartLevel: () => void;
  onAbandon: () => void;
  onWin: (challengeCompleted: boolean) => void;
  playSound: (kind: SoundKind) => void;
  friendlyReplay?: boolean;
};

const choices: Array<{ id: Choice; label: string }> = [
  { id: "rock", label: "Piedra" },
  { id: "paper", label: "Papel" },
  { id: "scissors", label: "Tijera" },
];

const choiceById = Object.fromEntries(choices.map((choice) => [choice.id, choice])) as Record<Choice, (typeof choices)[number]>;

function RpsIcon({ choice, small = false }: { choice: Choice; small?: boolean }) {
  return <span className={`rps-icon rps-${choice} ${small ? "is-small" : ""}`} aria-hidden="true" />;
}

function getWinner(noa: Choice, boss: Choice): RoundWinner {
  if (noa === boss) return "tie";
  if (
    (noa === "rock" && boss === "scissors") ||
    (noa === "paper" && boss === "rock") ||
    (noa === "scissors" && boss === "paper")
  ) return "noa";
  return "boss";
}

function getRuleText(noa: Choice, boss: Choice) {
  if (noa === boss) return `Los dos han elegido ${choiceById[noa].label.toLowerCase()}.`;
  const pair = new Set([noa, boss]);
  if (pair.has("rock") && pair.has("scissors")) return "La piedra rompe las tijeras.";
  if (pair.has("paper") && pair.has("rock")) return "El papel envuelve la piedra.";
  return "Las tijeras cortan el papel.";
}

function BossSprite({ assetPrefix, frame, name }: { assetPrefix: string; frame: number; name: string }) {
  const gesture = frame === 1 ? "piedra" : frame === 2 ? "papel" : frame === 3 ? "tijera" : frame === 4 ? "derrota" : "reto";
  const isWideSprite = assetPrefix.includes("reina-arcoiris");
  return (
    <div className={`boss-sprite-window ${isWideSprite ? "is-wide-sprite" : ""}`} role="img" aria-label={`${name} hace el gesto de ${gesture}`}>
      <img className="boss-sprite-frame" src={`${assetPrefix}-${frame}.png`} alt="" />
    </div>
  );
}

function NoaDuelSprite({ frame, protectedByApple }: { frame: number | null; protectedByApple: boolean }) {
  const gesture = frame === 0 ? "piedra" : frame === 1 ? "papel" : frame === 2 ? "tijera" : frame === 3 ? "victoria" : "preparada";
  const armorSuffix = protectedByApple ? "-gold-armor-v1" : "";
  return (
    <div className="duel-noa-sprite" role="img" aria-label={`Noa hace el gesto de ${gesture}`}>
      {frame === null
        ? <div className="duel-noa-idle" style={{ backgroundImage: `url("./assets/sprites/noa-sprite-sheet${armorSuffix}.png")` }} />
        : <img src={`./assets/sprites/noa-rps-${frame}${armorSuffix}.png`} alt="" />}
    </div>
  );
}

export function BossBattle({ bossId, apples, protectedByApple, onSpendApple, onRestartLevel, onAbandon, onWin, playSound, friendlyReplay = false }: BossBattleProps) {
  const boss = bossCatalog[bossId];
  const [battle, setBattle] = useState<BattleState>({ noaScore: 0, bossScore: 0, status: "choosing" });
  const [countdown, setCountdown] = useState(3);
  const [history, setHistory] = useState<RoundRecord[]>([]);
  const [usedApple, setUsedApple] = useState(false);

  useEffect(() => {
    if (battle.status !== "countdown") return;
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
  }, [battle, countdown, playSound]);

  const choose = (noaChoice: Choice) => {
    if (battle.status !== "choosing") return;
    const randomValue = new Uint32Array(1);
    window.crypto.getRandomValues(randomValue);
    const bossChoice = choices[randomValue[0] % choices.length].id;
    setCountdown(3);
    setBattle((current) => ({ ...current, noaChoice, bossChoice, roundWinner: getWinner(noaChoice, bossChoice), status: "countdown" }));
  };

  const nextRound = () => setBattle((current) => ({ noaScore: current.noaScore, bossScore: current.bossScore, status: "choosing" }));
  const retryWithApple = () => {
    if (apples <= 0) return;
    onSpendApple();
    setUsedApple(true);
    setHistory([]);
    setBattle({ noaScore: 0, bossScore: 0, status: "choosing" });
  };
  const retryFriendly = () => {
    setHistory([]);
    setBattle({ noaScore: 0, bossScore: 0, status: "choosing" });
  };
  const abandonBattle = () => {
    if (friendlyReplay || window.confirm("¿Quieres rendirte y volver al mapa? Podrás intentar este duelo otra vez cuando quieras.")) onAbandon();
  };
  const choicesRevealed = battle.status !== "choosing" && battle.status !== "countdown";
  const visibleWinner = choicesRevealed ? battle.roundWinner : undefined;
  const bossFrame = battle.status === "won" ? 4 : choicesRevealed && battle.bossChoice ? choices.findIndex((choice) => choice.id === battle.bossChoice) + 1 : 0;
  const noaFrame = battle.status === "won" ? 3 : choicesRevealed && battle.noaChoice ? choices.findIndex((choice) => choice.id === battle.noaChoice) : null;
  const roundText = battle.noaChoice && battle.bossChoice ? getRuleText(battle.noaChoice, battle.bossChoice) : "Elige un gesto. El primero que gane dos rondas vence.";
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

  return (
    <div className="modal-backdrop boss-backdrop">
      <section className={`boss-battle boss-theme-${bossId} battle-${battle.status} result-flash-${visibleWinner ?? "none"}`} aria-labelledby="boss-title">
        {(visibleWinner === "noa" || battle.status === "won") && (
          <div className="duel-confetti" aria-hidden="true">
            {Array.from({ length: 14 }, (_, index) => (
              <i style={{ "--piece-x": `${index * 7}%`, "--piece-delay": `${index * 25}ms`, "--piece-drift": `${(index - 7) * 5}px`, "--piece-hue": index * 47 } as CSSProperties} key={index} />
            ))}
          </div>
        )}
        <header className="boss-header">
          <div>
            <p className="eyebrow">{friendlyReplay ? "Duelo amistoso" : "Monstruo final"} · Ronda {roundNumber}</p>
            <h2 id="boss-title">{friendlyReplay ? `Juega con ${boss.name}` : `Duelo contra ${boss.name}`}</h2>
            <p>{boss.intro}</p>
            <p className="boss-challenge">★ Reto de amistad: {boss.challenge.label}</p>
          </div>
          <div className="duel-status-panel">
            <div className="duel-score" aria-label={`Marcador: Noa ${battle.noaScore}, ${boss.name} ${battle.bossScore}`}>
              <span>NOA <strong>{battle.noaScore}</strong></span><b>—</b><span><strong>{battle.bossScore}</strong> JEFE</span>
            </div>
            {!friendlyReplay && <div className="duel-attempts" aria-label={`${apples} reintentos disponibles`}>
              <span><GameAssetIcon kind="apple" /> × {apples}</span><small>{apples === 1 ? "reintento" : "reintentos"}</small>
            </div>}
          </div>
        </header>

        {history.length > 0 && (
          <ol className="round-history" aria-label="Historial de rondas">
            {history.map((round, index) => (
              <li className={`history-${round.winner}`} key={`${round.noaChoice}-${round.bossChoice}-${index}`}>
                <small>R{index + 1}</small><RpsIcon choice={round.noaChoice} small /><b>{round.winner === "noa" ? "★" : round.winner === "boss" ? "×" : "="}</b><RpsIcon choice={round.bossChoice} small />
              </li>
            ))}
          </ol>
        )}

        <div className={`duel-arena ${battle.status === "countdown" ? "is-countdown" : ""} ${choicesRevealed ? "is-revealed" : ""}`}>
          {battle.status === "countdown" && <div className="duel-countdown" aria-live="assertive">{countdown === 0 ? "¡YA!" : countdown}</div>}
          <div className={`duel-fighter noa-fighter ${visibleWinner === "noa" ? "round-winner" : visibleWinner === "boss" ? "round-loser" : ""}`}>
            <NoaDuelSprite frame={noaFrame} protectedByApple={protectedByApple} />
            <strong>NOA</strong>
            <div className={`gesture-card ${battle.status === "countdown" ? "is-hidden" : ""}`}>
              <span>{choicesRevealed && battle.noaChoice ? <RpsIcon choice={battle.noaChoice} /> : "?"}</span>
              <b>{choicesRevealed && battle.noaChoice ? choiceById[battle.noaChoice].label : battle.status === "countdown" ? "Pensando…" : "Preparada"}</b>
            </div>
          </div>
          <div className="duel-versus" aria-hidden="true">VS</div>
          <div className={`duel-fighter ${visibleWinner === "boss" ? "round-winner" : visibleWinner === "noa" ? "round-loser" : ""}`}>
            <BossSprite assetPrefix={boss.assetPrefix} frame={bossFrame} name={boss.name} />
            <strong>{boss.name}</strong>
            <div className={`gesture-card ${battle.status === "countdown" ? "is-hidden" : ""}`}>
              <span>{choicesRevealed && battle.bossChoice ? <RpsIcon choice={battle.bossChoice} /> : "?"}</span>
              <b>{choicesRevealed && battle.bossChoice ? choiceById[battle.bossChoice].label : battle.status === "countdown" ? "Pensando…" : "Esperando"}</b>
            </div>
          </div>
        </div>

        <div className={`round-message result-${visibleWinner ?? "none"}`} aria-live="polite">
          <strong>{battle.status === "countdown" ? "Piedra, papel…" : battle.status === "won" ? "¡Noa gana el duelo!" : battle.status === "lost" ? `Esta vez gana ${boss.name}` : visibleWinner === "noa" ? "¡Ronda para Noa!" : visibleWinner === "boss" ? `Ronda para ${boss.name}` : visibleWinner === "tie" ? "¡Empate!" : "Piedra, papel o tijera"}</strong>
          {choicesRevealed && battle.noaChoice && battle.bossChoice && (
            <div className="round-choice-spotlight" aria-label={`Noa elige ${choiceById[battle.noaChoice].label} y ${boss.name} elige ${choiceById[battle.bossChoice].label}`}>
              <span><small>NOA</small><RpsIcon choice={battle.noaChoice} /><b>{choiceById[battle.noaChoice].label}</b></span>
              <em>VS</em>
              <span><small>{boss.name.toUpperCase()}</small><RpsIcon choice={battle.bossChoice} /><b>{choiceById[battle.bossChoice].label}</b></span>
            </div>
          )}
          <span>{battle.status === "countdown" ? "Los dos gestos aparecerán a la vez." : battle.status === "won" ? friendlyReplay ? `La amistad con ${boss.name} sigue creciendo.` : wonChallenge ? `¡Reto logrado! ${boss.name} te regala un marco especial.` : `${boss.name} sonríe y deja libre el camino.` : battle.status === "lost" ? friendlyReplay ? "¡Puedes intentarlo otra vez cuando quieras!" : apples > 0 ? "Puedes gastar una manzana para repetir el duelo." : "No quedan manzanas: toca recorrer de nuevo la pantalla." : roundText}</span>
        </div>

        {battle.status === "choosing" && (
          <div className="duel-choices" aria-label="Elige piedra, papel o tijera">
            {choices.map((choice, index) => (
              <button type="button" onClick={() => choose(choice.id)} style={{ "--choice-delay": `${index * 75}ms` } as CSSProperties} key={choice.id}>
                <span><RpsIcon choice={choice.id} /></span><strong>{choice.label}</strong>
              </button>
            ))}
          </div>
        )}
        {battle.status === "revealed" && <button className="pixel-button primary duel-next" type="button" onClick={nextRound}>Siguiente ronda ▶</button>}
        {battle.status === "lost" && friendlyReplay && <button className="pixel-button primary duel-next" type="button" onClick={retryFriendly}>↺ Jugar otra vez</button>}
        {battle.status === "lost" && !friendlyReplay && apples > 0 && <button className="pixel-button primary duel-next apple-retry" type="button" onClick={retryWithApple}><GameAssetIcon kind="apple" /> Usar una manzana y repetir</button>}
        {battle.status === "lost" && !friendlyReplay && apples === 0 && <button className="pixel-button primary duel-next restart-level" type="button" onClick={onRestartLevel}>↺ Volver a empezar la pantalla</button>}
        {battle.status === "won" && <button className="pixel-button primary duel-next" type="button" onClick={() => { playSound("goal"); onWin(wonChallenge); }}>{friendlyReplay ? "Volver a mis amigos" : "Continuar la aventura ▶"}</button>}
        {battle.status !== "won" && <button className="text-button duel-abandon" type="button" onClick={abandonBattle}>{friendlyReplay ? "Volver a mis amigos" : "🏳 Rendirse y volver al mapa"}</button>}

        <p className="duel-rules"><span><RpsIcon choice="rock" small /> gana a <RpsIcon choice="scissors" small /></span><span><RpsIcon choice="scissors" small /> gana a <RpsIcon choice="paper" small /></span><span><RpsIcon choice="paper" small /> gana a <RpsIcon choice="rock" small /></span></p>
      </section>
    </div>
  );
}
