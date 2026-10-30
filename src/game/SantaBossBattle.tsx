import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { SoundKind } from "./GameCanvas";
import { createGameLoop } from "./gameLoop";
import { firstConnectedGamepad, readGameplayPad } from "./gamepad";
import { createSantaBattle, SANTA_ARENA, stepSantaBattle } from "./santaBattle";
import { drawSantaBattle } from "./santaBattleRendering";

type Props = {
  paused: boolean; apples: number; onSpendApple: () => void; onRestartLevel: () => void;
  onAbandon: () => void; onWin: (challengeCompleted: boolean) => void; playSound: (kind: SoundKind) => void;
};
const emptyInput = () => ({ left: false, right: false, jump: false, queued: false });

export function SantaBossBattle({ paused, apples, onSpendApple, onRestartLevel, onAbandon, onWin, playSound }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const battle = useRef(createSantaBattle());
  const keys = useRef(emptyInput()), touch = useRef(emptyInput());
  const [hud, setHud] = useState({ hits: 0, lives: 3, status: "playing" });
  const soundRef = useRef(playSound);
  useEffect(() => { soundRef.current = playSound; }, [playSound]);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const resize = () => {
      context.canvas.width = window.innerWidth <= 600 ? 640 : SANTA_ARENA.width;
      drawSantaBattle(context, battle.current);
    };
    resize(); window.addEventListener("resize", resize);
    let previousPadJump = false;
    const clearInput = () => { keys.current = emptyInput(); touch.current = emptyInput(); previousPadJump = false; };
    const loop = createGameLoop((delta) => {
      const pad = readGameplayPad(firstConnectedGamepad());
      const padJump = pad.jump || pad.up;
      const events = stepSantaBattle(battle.current, {
        left: keys.current.left || touch.current.left || pad.left,
        right: keys.current.right || touch.current.right || pad.right,
        jumpPressed: keys.current.queued || touch.current.queued || (padJump && !previousPadJump),
        jumpHeld: keys.current.jump || touch.current.jump || padJump,
      }, delta);
      keys.current.queued = false; touch.current.queued = false; previousPadJump = padJump;
      for (const event of events) {
        if (event === "jump") soundRef.current("jump");
        else if (event === "stomp") soundRef.current("checkpoint");
        else if (event === "hurt") soundRef.current("hurt");
      }
      const { hits, lives, status } = battle.current;
      setHud((previous) => previous.hits === hits && previous.lives === lives && previous.status === status ? previous : { hits, lives, status });
      if (status !== "playing") loop.setRunning(false);
    }, () => drawSantaBattle(context, battle.current), () => {});
    const key = (event: KeyboardEvent) => {
      const control = ["ArrowLeft", "KeyA"].includes(event.code) ? "left" : ["ArrowRight", "KeyD"].includes(event.code) ? "right" : ["Space", "ArrowUp", "KeyW"].includes(event.code) ? "jump" : null;
      if (!control || (control === "jump" && event.target instanceof HTMLButtonElement)) return;
      event.preventDefault();
      if (event.type === "keydown" && !event.repeat && control === "jump") keys.current.queued = true;
      keys.current[control] = event.type === "keydown";
    };
    const blur = () => { clearInput(); loop.setRunning(false); };
    const visibility = () => { if (document.hidden) blur(); };
    window.addEventListener("keydown", key); window.addEventListener("keyup", key);
    window.addEventListener("blur", blur); document.addEventListener("visibilitychange", visibility);
    clearInput();
    loop.setRunning(!paused && battle.current.status === "playing" && !document.hidden);
    if (paused || battle.current.status !== "playing") drawSantaBattle(context, battle.current);
    return () => {
      loop.stop(); clearInput(); window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", key); window.removeEventListener("keyup", key);
      window.removeEventListener("blur", blur); document.removeEventListener("visibilitychange", visibility);
    };
  }, [paused, hud.status]);

  const retry = () => {
    if (apples <= 0) { onRestartLevel(); return; }
    onSpendApple(); battle.current = createSantaBattle();
    setHud({ hits: 0, lives: 3, status: "playing" });
  };
  const press = (control: "left" | "right" | "jump", event: PointerEvent<HTMLButtonElement>) => {
    if (paused || hud.status !== "playing") return;
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    touch.current[control] = true;
    if (control === "jump") touch.current.queued = true;
  };
  const release = (control: "left" | "right" | "jump") => { touch.current[control] = false; };
  const won = hud.status === "won", lost = hud.status === "lost";
  return <section className="santa-boss-battle" role="dialog" aria-modal="true" aria-labelledby="santa-boss-title">
    <header className="santa-boss-hud"><div><p className="eyebrow">Jefe final de Navidad</p><h2 id="santa-boss-title">Ayuda a Papá Noel</h2><p>Salta los regalos y cae sobre su cabeza dos veces. ¡Puedes dar un doble salto!</p></div><div className="santa-hit-counter"><span aria-label={`${hud.lives} vidas`}>{"♥".repeat(hud.lives)}{"♡".repeat(3 - hud.lives)}</span><b aria-live="polite">{hud.hits}/2 saltos</b></div></header>
    <div className="santa-arena"><canvas ref={canvasRef} width={SANTA_ARENA.width} height={SANTA_ARENA.height} aria-label="Noa y Papá Noel en una pista nevada con dos plataformas. Muévete con las flechas y salta con espacio." /></div>
    {won ? <div className="santa-result"><h3>¡Lo conseguiste!</h3><p>Papá Noel sonríe: ahora los regalos saldrán a tiempo.</p><button className="pixel-button primary" onClick={() => { playSound("goal"); onWin(true); }}>Abrir el camino ▶</button></div> : lost ? <div className="santa-result"><h3>¡Vamos otra vez!</h3><p>Usa las plataformas y el doble salto para caer sobre su cabeza.</p><button className="pixel-button primary" onClick={retry}>{apples > 0 ? "Usar una manzana y reintentar" : "Volver a la pantalla"}</button></div> : <footer className="santa-controls">
      {([['left', '←', 'Mover a la izquierda'], ['right', '→', 'Mover a la derecha'], ['jump', 'SALTAR', 'Saltar']] as const).map(([control, label, aria]) => <button key={control} className={`santa-control-${control} pixel-button ${control === 'jump' ? 'primary' : ''}`} type="button" aria-label={aria} disabled={paused} onPointerDown={(event) => press(control, event)} onPointerUp={() => release(control)} onPointerCancel={() => release(control)} onLostPointerCapture={() => release(control)} onKeyDown={(event) => { if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) { touch.current[control] = true; if (control === 'jump') touch.current.queued = true; } }} onKeyUp={() => release(control)}>{label}</button>)}
      <span className="santa-control-hint">Mantén para caminar · Pulsa dos veces para el doble salto</span>
    </footer>}
    <button className="santa-exit" onClick={onAbandon}>Volver al mapa</button>
  </section>;
}
