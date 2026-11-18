import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { SoundKind } from "./GameCanvas";
import { createGameLoop } from "./gameLoop";
import { firstConnectedGamepad, readGameplayPad } from "./gamepad";
import { createSantaBattle, PLATFORM_BOSS_HITS, SANTA_ARENA, stepSantaBattle } from "./santaBattle";
import { drawSantaBattle } from "./santaBattleRendering";
import { TouchControls, type TouchControl } from "./TouchControls";
import type { BossId } from "./types";
import { t, tClave } from "../textos/index.ts";
import { Pictogramas, Texto } from "../textos/Texto";

type Props = {
  bossId?: Extract<BossId, "santa-claus" | "siroco" | "don-silbato">;
  paused: boolean; apples: number; onSpendApple: () => void; onRestartLevel: () => void;
  onAbandon: () => void; onWin: (challengeCompleted: boolean) => void; playSound: (kind: SoundKind) => void;
};
const emptyInput = () => ({ left: false, right: false, jump: false, queued: false });



export function SantaBossBattle({ bossId = "santa-claus", paused, apples, onSpendApple, onRestartLevel, onAbandon, onWin, playSound }: Props) {
  const clave = (hoja: string) => `duelos.santa.${bossId}.${hoja}`;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const battle = useRef(createSantaBattle());
  const keys = useRef(emptyInput()), touch = useRef(emptyInput());
  const touchPointers = useRef<Partial<Record<TouchControl, number>>>({});
  const [hud, setHud] = useState({ hits: 0, lives: 3, status: "playing" });
  const soundRef = useRef(playSound);
  useEffect(() => { soundRef.current = playSound; }, [playSound]);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const resize = () => {
      context.canvas.width = window.innerWidth <= 600 ? 640 : SANTA_ARENA.width;
      drawSantaBattle(context, battle.current, bossId);
    };
    resize(); window.addEventListener("resize", resize);
    let previousPadJump = false;
    const clearInput = () => { keys.current = emptyInput(); touch.current = emptyInput(); touchPointers.current = {}; previousPadJump = false; };
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
    }, () => drawSantaBattle(context, battle.current, bossId), () => {});
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
    if (!paused && battle.current.status === "playing") canvasRef.current?.focus({ preventScroll: true });
    loop.setRunning(!paused && battle.current.status === "playing" && !document.hidden);
    if (paused || battle.current.status !== "playing") drawSantaBattle(context, battle.current, bossId);
    return () => {
      loop.stop(); clearInput(); window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", key); window.removeEventListener("keyup", key);
      window.removeEventListener("blur", blur); document.removeEventListener("visibilitychange", visibility);
    };
  }, [bossId, paused, hud.status]);

  const retry = () => {
    if (apples <= 0) { onRestartLevel(); return; }
    onSpendApple(); battle.current = createSantaBattle();
    setHud({ hits: 0, lives: 3, status: "playing" });
  };
  const press = (control: TouchControl, event: PointerEvent<HTMLButtonElement>) => {
    if (control === "shoot" || paused || hud.status !== "playing") return;
    event.preventDefault();
    if (touchPointers.current[control] !== undefined) return;
    touchPointers.current[control] = event.pointerId;
    try { event.currentTarget.setPointerCapture(event.pointerId); }
    catch { /* Keep the same multitouch fallback as the campaign controls. */ }
    touch.current[control] = true;
    if (control === "jump") touch.current.queued = true;
  };
  const release = (control: TouchControl, event: PointerEvent<HTMLButtonElement>) => {
    if (control === "shoot" || touchPointers.current[control] !== event.pointerId) return;
    delete touchPointers.current[control]; touch.current[control] = false;
  };
  const won = hud.status === "won", lost = hud.status === "lost";
  return <section className="santa-boss-battle" role="dialog" aria-modal="true" aria-labelledby="santa-boss-title">
    <header className="santa-boss-hud"><div><p className="eyebrow rotulo"><Pictogramas texto={tClave(clave("etiqueta.rotulo"))} /></p><h2 id="santa-boss-title" className="rotulo"><Pictogramas texto={tClave(clave("titulo.rotulo"))} /></h2><p className="juntos">{tClave(clave("como.juntos"))}</p></div><div className="santa-hit-counter"><span aria-label={t("partida.hud.vidas.oculto", { n: hud.lives })}>{"♥".repeat(hud.lives)}{"♡".repeat(3 - hud.lives)}</span><b aria-live="polite" aria-label={t("duelos.santa.saltos.oculto", { n: hud.hits, total: PLATFORM_BOSS_HITS })}><Texto clave="duelos.santa.saltos.rotulo" variables={{ n: hud.hits, total: PLATFORM_BOSS_HITS }} /></b></div></header>
    <div className="santa-arena game-frame">
      <div className="game-stage"><canvas ref={canvasRef} tabIndex={0} width={SANTA_ARENA.width} height={SANTA_ARENA.height} aria-label={t("duelos.santa.controles.oculto", { escena: tClave(clave("escena.oculto")) })} /></div>
      {!won && !lost && <TouchControls showYarn={false} disabled={paused} onPress={press} onRelease={release} onCancel={release}
        onKeyboardPress={(control) => { if (control !== "shoot") { touch.current[control] = true; if (control === "jump") touch.current.queued = true; } }}
        onKeyboardRelease={(control) => { if (control !== "shoot") touch.current[control] = false; }} />}
    </div>
    {won ? <div className="santa-result"><h3 className="rotulo"><Texto clave="duelos.santa.conseguido.rotulo" /></h3><p className="juntos">{tClave(clave("gana.juntos"))}</p><button className="pixel-button primary" onClick={() => { playSound("goal"); onWin(true); }}><Texto clave="duelos.santa.abrir.rotulo" /></button></div> : lost ? <div className="santa-result"><h3 className="rotulo"><Texto clave="duelos.santa.otraVez.rotulo" /></h3><p className="juntos">{t("duelos.santa.perdido.juntos")}</p><button className="pixel-button primary" onClick={retry}><Texto clave={apples > 0 ? "duelos.santa.manzana.rotulo" : "duelos.santa.pantalla.rotulo"} /></button></div> : null}
    <button className="santa-exit" onClick={onAbandon}><Texto clave="duelos.santa.mapa.rotulo" /></button>
  </section>;
}
