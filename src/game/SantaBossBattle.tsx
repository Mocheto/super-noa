import { useEffect, useRef, useState } from "react";
import { Dialog } from "./Dialog";
import { GameAssetIcon } from "./GameAssetIcon";
import type { SoundKind } from "./GameCanvas";

type Props = {
  paused: boolean; apples: number; onSpendApple: () => void; onRestartLevel: () => void;
  onAbandon: () => void; onWin: (challengeCompleted: boolean) => void; playSound: (kind: SoundKind) => void;
};

type Present = { id: number; x: number };

export function SantaBossBattle({ paused, apples, onSpendApple, onRestartLevel, onAbandon, onWin, playSound }: Props) {
  const [noaX, setNoaX] = useState(18);
  const [jumping, setJumping] = useState(false);
  const [hits, setHits] = useState(0);
  const [presents, setPresents] = useState<Present[]>([]);
  const [lost, setLost] = useState(false);
  const presentId = useRef(0);
  const hitCooldown = useRef(0);
  const won = hits >= 2;

  const jump = () => {
    if (paused || lost || won || jumping) return;
    setJumping(true);
    playSound("jump");
    window.setTimeout(() => setJumping(false), 520);
    if (noaX > 64 && hitCooldown.current <= 0) {
      hitCooldown.current = 900;
      setHits((value) => value + 1);
      playSound("checkpoint");
    }
  };
  useEffect(() => {
    if (paused || lost || won) return;
    const spawn = window.setInterval(() => setPresents((items) => [...items, { id: presentId.current++, x: 78 }]), 1450);
    const move = window.setInterval(() => {
      hitCooldown.current = Math.max(0, hitCooldown.current - 80);
      setPresents((items) => {
        const next = items.map((gift) => ({ ...gift, x: gift.x - 3.8 })).filter((gift) => gift.x > -10);
        if (!jumping && next.some((gift) => Math.abs(gift.x - noaX) < 7)) { setLost(true); playSound("hurt"); return []; }
        return next;
      });
    }, 80);
    return () => { window.clearInterval(spawn); window.clearInterval(move); };
  }, [jumping, lost, noaX, paused, playSound, won]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.repeat || paused || lost || won) return;
      if (event.code === "Space" || event.code === "ArrowUp") { event.preventDefault(); jump(); }
      if (event.code === "ArrowLeft") setNoaX((x) => Math.max(5, x - 8));
      if (event.code === "ArrowRight") setNoaX((x) => Math.min(78, x + 8));
    };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  });
  const retry = () => { if (apples > 0) { onSpendApple(); setLost(false); setPresents([]); setNoaX(18); } else onRestartLevel(); };
  return <Dialog labelledBy="santa-boss-title" backdropClassName="boss-backdrop" className="santa-boss-battle">
    <header className="boss-header"><div><p className="eyebrow">Jefe final de Navidad</p><h2 id="santa-boss-title">Ayuda a Papá Noel</h2><p>Esquiva los regalos, acércate y salta sobre él dos veces. ¡Con suavidad!</p></div><div className="duel-status-panel"><div className="duel-score"><span>SALTOS <strong>{hits}</strong></span><b>—</b><span><strong>2</strong> META</span></div><div className="duel-attempts"><span><GameAssetIcon kind="apple" /> × {apples}</span><small>reintentos</small></div></div></header>
    <div className="santa-arena" aria-label="Arena de Papá Noel">
      <div className="santa-snow" aria-hidden="true">❄ ❄ ❄ ❄ ❄ ❄ ❄</div>
      {presents.map((gift) => <span className="flying-present" key={gift.id} style={{ left: `${gift.x}%` }}>🎁</span>)}
      <button className={`santa-noa ${jumping ? "is-jumping" : ""}`} style={{ left: `${noaX}%` }} onClick={jump} aria-label="Saltar">🐱</button>
      <div className={`santa-sprite ${hits > 0 ? "is-surprised" : ""}`} aria-label="Papá Noel"><img src="./assets/sprites/boss-papa-noel-sheet-v1.png" alt="" /></div>
      <div className="santa-floor" />
    </div>
    {won ? <div className="santa-result"><h3>¡Lo conseguiste!</h3><p>Papá Noel sonríe: ahora los regalos saldrán a tiempo.</p><button className="pixel-button primary" onClick={() => { playSound("goal"); onWin(true); }}>Abrir el camino ▶</button></div> : lost ? <div className="santa-result"><h3>¡Uy, un regalo!</h3><p>Los paquetes ruedan rápido. Prueba a saltar un poquito antes.</p><button className="pixel-button primary" onClick={retry}>{apples > 0 ? "Usar una manzana y reintentar" : "Volver a la pantalla"}</button></div> : <footer className="santa-controls"><button type="button" onClick={() => setNoaX((x) => Math.max(5, x - 8))}>←</button><button className="pixel-button primary" type="button" onClick={jump}>SALTAR</button><button type="button" onClick={() => setNoaX((x) => Math.min(78, x + 8))}>→</button><button type="button" onClick={onAbandon}>Volver al mapa</button></footer>}
  </Dialog>;
}
