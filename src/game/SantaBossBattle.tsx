import "../textos/zonas/duelos";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { SoundKind } from "./GameCanvas";
import { createGameLoop } from "./gameLoop";
import { firstConnectedGamepad, readGameplayPad } from "./gamepad";
import { createSantaBattle, PLATFORM_BOSS_HITS, SANTA_ARENA, stepSantaBattle } from "./santaBattle";
import { drawSantaBattle } from "./santaBattleRendering";
import { actionBossBackgrounds } from "./santaBattleAssets";
import { cssAssetUrl } from "./assets";
import { TouchControls, type TouchControl } from "./TouchControls";
import type { BossId } from "./types";
import { t, tClave, type ClaveTexto } from "../textos/index.ts";
import { Boton, Texto } from "../textos/Texto";
import { bossCatalog } from "./bosses";
import { PantallaPrevia, ResultadoMinijuego } from "./minijuegoComun";

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
  const [empezado, setEmpezado] = useState(false);
  const detenido = paused || !empezado;
  const soundRef = useRef(playSound);
  useEffect(() => { soundRef.current = playSound; }, [playSound]);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const resize = () => {
      // En vertical (y en pantallas estrechas) se ve una ventana 4:3 de la arena que sigue a Noa, como en la partida.
      const vertical = typeof matchMedia === "function" && matchMedia("(orientation: portrait)").matches;
      context.canvas.width = vertical || window.innerWidth <= 600 ? 640 : SANTA_ARENA.width;
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
    if (!detenido && battle.current.status === "playing") canvasRef.current?.focus({ preventScroll: true });
    loop.setRunning(!detenido && battle.current.status === "playing" && !document.hidden);
    if (detenido || battle.current.status !== "playing") drawSantaBattle(context, battle.current, bossId);
    return () => {
      loop.stop(); clearInput(); window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", key); window.removeEventListener("keyup", key);
      window.removeEventListener("blur", blur); document.removeEventListener("visibilitychange", visibility);
    };
  }, [bossId, detenido, hud.status]);

  const retry = () => {
    if (apples <= 0) { onRestartLevel(); return; }
    onSpendApple(); battle.current = createSantaBattle();
    setHud({ hits: 0, lives: 3, status: "playing" });
  };
  const press = (control: TouchControl, event: PointerEvent<HTMLButtonElement>) => {
    if (control === "shoot" || detenido || hud.status !== "playing") return;
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
  const boss = bossCatalog[bossId];
  // Papá Noel: su hoja de 3 × 2 (quieto arriba a la izquierda). Siroco y Don Silbato: la cuadrícula común de 5 × 2, con
  // las poses abajo.
  const retrato = <span className={`santa-retrato ${bossId === "santa-claus" ? "is-santa" : "is-cuadricula"}`} style={{ backgroundImage: `url("${boss.assetAtlas}")` }} />;
  return <section className="santa-boss-battle" role="dialog" aria-modal="true" aria-labelledby="santa-boss-title">
    <h2 id="santa-boss-title" className="sr-only"><Texto clave={clave("titulo.rotulo") as ClaveTexto} /></h2>
    {/* En vertical, lo que sobra arriba es el fondo de la arena difuminado, como en la partida (`--fondo-mundo`). */}
    <div className="santa-arena game-frame" style={{ "--fondo-mundo": cssAssetUrl(actionBossBackgrounds[bossId]) } as CSSProperties}>
      <div className="game-stage"><canvas ref={canvasRef} tabIndex={0} width={SANTA_ARENA.width} height={SANTA_ARENA.height} aria-label={t("duelos.santa.controles.oculto", { escena: tClave(clave("escena.oculto")) })} />
        {/* HUD de esquinas, como en la partida: vidas a la izquierda, saltos en el centro y el mapa a la derecha. */}
        <div className="hud-esquinas">
          <div className="hud-izquierda"><span className="hud-chip hud-vidas santa-vidas" role="img" aria-label={t("partida.hud.vidas.oculto", { n: hud.lives })}>{"♥".repeat(hud.lives)}{"♡".repeat(3 - hud.lives)}</span></div>
          <div className="hud-centro"><span className="hud-chip hud-banderas" aria-live="polite" aria-label={t("duelos.santa.saltos.oculto", { n: hud.hits, total: PLATFORM_BOSS_HITS })}><Texto clave="duelos.santa.saltos.rotulo" variables={{ n: hud.hits, total: PLATFORM_BOSS_HITS }} /></span></div>
          <div className="hud-derecha"><Boton className="santa-exit boton-pequeno" clave="duelos.santa.mapa.rotulo" onClick={onAbandon} /></div>
        </div>
      </div>
      {!won && !lost && empezado && <TouchControls showYarn={false} disabled={detenido} onPress={press} onRelease={release} onCancel={release}
        onKeyboardPress={(control) => { if (control !== "shoot") { touch.current[control] = true; if (control === "jump") touch.current.queued = true; } }}
        onKeyboardRelease={(control) => { if (control !== "shoot") touch.current[control] = false; }} />}
    </div>
    {!empezado && !paused && <PantallaPrevia id="santa-previa" nombre={clave("titulo.rotulo") as ClaveTexto} guardian={retrato}
      regla={`${tClave(clave("como.juntos"))} ${t("duelos.santa.perdido.juntos")}`} ayudaAdultos={[t("adultos.minijuegos.saltos.controles")]}
      practicaPrimero={false} onJugar={() => setEmpezado(true)} onSalir={onAbandon} />}
    {won && !paused && <ResultadoMinijuego id="santa-resultado" titulo="duelos.santa.conseguido.rotulo" gano onSalir={() => { playSound("goal"); onWin(true); }}
      dibujo={retrato} frase={tClave(clave("gana.juntos"))}
      botones={<Boton tipo="seguir" clave="duelos.santa.abrir.rotulo" data-gamepad-default onClick={() => { playSound("goal"); onWin(true); }} />} />}
    {lost && !paused && <ResultadoMinijuego id="santa-resultado" titulo="duelos.santa.otraVez.rotulo" gano={false} onSalir={onAbandon}
      dibujo={retrato} frase={t("duelos.santa.perdido.juntos")}
      botones={<>
        <Boton tipo="seguir" clave={apples > 0 ? "duelos.santa.manzana.rotulo" : "duelos.santa.pantalla.rotulo"} data-gamepad-default onClick={retry} />
        <Boton clave="duelos.santa.mapa.rotulo" data-gamepad-back onClick={onAbandon} />
      </>} />}
  </section>;
}
