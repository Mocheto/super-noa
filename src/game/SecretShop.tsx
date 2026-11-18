import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { Dialog } from "./Dialog";
import type { Level, ShopMatchCount } from "./types";
import { getSecretShopCatSet } from "./secretShopCats";
import {
  advanceShopClock, countShopMatches, SHOP_ACTIVATION_GAP_MS, shopPhase,
  shopRewardSeconds, snapShopCat, type ShopCat, type ShopClock,
} from "./secretShopGame";
import "./secretShop.css";
import { t } from "../textos/index.ts";
import { Boton, BotonControl, Pictograma, Texto } from "../textos/Texto";
import { PantallaPrevia, ResultadoMinijuego } from "./minijuegoComun";

type SecretShopProps = {
  world: Level["world"];
  paused: boolean;
  reduceMotion: boolean;
  onResult: (matches: ShopMatchCount) => void;
  onLeave: () => void;
  playSound: (kind: "countdown" | "cat" | "goal" | "block") => void;
};

const kittenColors: Record<Level["world"], string> = {
  1: "#ffb050", 2: "#504060", 3: "#fff0f0", 4: "#ffa030",
  5: "#fff0e0", 6: "#c0b0d0", 7: "#fffff0", 8: "#ffe0c0",
  9: "#ffd090", 10: "#ff9020", 11: "#ff70a0", 12: "#d0e0ff", 13: "#ffe0a0",
  14: "#f2b85f", 15: "#d35f52", 16: "#8d6ad1",
  17: "#84cce9",
};
const partNames = ["orejas", "carita", "patitas"];
const prompts = [t("minijuegos.tienda.parte.orejas.rotulo"), t("minijuegos.tienda.parte.carita.rotulo"), t("minijuegos.tienda.parte.patitas.rotulo")];

export function SecretShop({ world, paused, reduceMotion, onResult, onLeave, playSound }: SecretShopProps) {
  const catSet = getSecretShopCatSet(world);
  const kittenSource = catSet.source;
  const titleId = useId();
  const [localPaused, setLocalPaused] = useState(false);
  const [away, setAway] = useState(() => document.hidden || !document.hasFocus());
  const [activeMs, setActiveMs] = useState(0);
  const [stopped, setStopped] = useState<ShopCat[]>([]);
  const [result, setResult] = useState<ShopMatchCount | null>(null);
  const [loadedSource, setLoadedSource] = useState<string | null>(null);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const imageReady = loadedSource === kittenSource && failedSource !== kittenSource;
  const imageFailed = failedSource === kittenSource;
  const [roomFailed, setRoomFailed] = useState(false);
  const clock = useRef<ShopClock>({ activeMs: 0, lastFrame: null });
  const lockedCats = useRef<ShopCat[]>([]);
  const reported = useRef(false);
  const nextActivation = useRef(0);
  const awayRef = useRef(away);
  const [empezado, setEmpezado] = useState(false);
  const frozen = paused || localPaused || away || !empezado;

  useEffect(() => {
    const freeze = () => {
      awayRef.current = true;
      clock.current = { ...clock.current, lastFrame: null };
      setAway(true);
    };
    const restore = () => {
      const inactive = document.hidden || !document.hasFocus();
      awayRef.current = inactive;
      clock.current = { ...clock.current, lastFrame: null };
      setAway(inactive);
    };
    const visibility = () => { if (document.hidden) freeze(); else restore(); };
    window.addEventListener("blur", freeze);
    window.addEventListener("focus", restore);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("blur", freeze);
      window.removeEventListener("focus", restore);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => {
    clock.current = { ...clock.current, lastFrame: null };
    if (frozen || result !== null) return;
    let frame = 0;
    const tick = (timestamp: number) => {
      clock.current = advanceShopClock(clock.current, timestamp, awayRef.current);
      setActiveMs(clock.current.activeMs);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [frozen, result]);

  function togglePause() {
    clock.current = { ...clock.current, lastFrame: null };
    setLocalPaused((value) => !value);
  }

  function stopBand() {
    if (frozen || awayRef.current || reported.current || clock.current.activeMs < nextActivation.current) return;
    const cats = lockedCats.current;
    const cat = snapShopCat(shopPhase(clock.current.activeMs, cats.length, reduceMotion));
    const next = [...cats, cat];
    lockedCats.current = next;
    nextActivation.current = clock.current.activeMs + SHOP_ACTIVATION_GAP_MS;
    setStopped(next);
    if (next.length === 3) {
      const matches = countShopMatches([next[0], next[1], next[2]]);
      reported.current = true;
      setResult(matches);
      onResult(matches);
      playSound(matches === 3 ? "goal" : "cat");
    } else {
      playSound("block");
    }
  }

  const seconds = result === null ? 0 : shopRewardSeconds(result);
  return (
    <Dialog
      labelledBy={titleId}
      className="secret-shop"
      backdropClassName="secret-shop-backdrop"
      onClose={togglePause}
      gamepad
    >
      <div
        className={`secret-shop-content${reduceMotion ? " is-reduced-motion" : ""}`}
        data-testid="secret-shop"
        onKeyDownCapture={(event) => {
          if ((event.key === "Enter" || event.key === " ") && event.repeat) event.preventDefault();
        }}
      >
        {!roomFailed && <img className="secret-shop-room" src="./assets/worlds/secret-shop-room-v1.png" alt="" onError={() => setRoomFailed(true)} />}
        <h2 id={titleId} className="sr-only">{t("minijuegos.tienda.previa.nombre.rotulo")}</h2>
        <img key={kittenSource} className="secret-shop-preload" src={kittenSource} alt="" onLoad={() => setLoadedSource(kittenSource)} onError={() => setFailedSource(kittenSource)} />
        <div className="secret-shop-bands" aria-label={t("minijuegos.tienda.retrato.oculto")}>
          {[0, 1, 2].map((row) => {
            const locked = stopped[row];
            const phase = locked ?? shopPhase(activeMs, row, reduceMotion);
            const whole = Math.floor(phase);
            const fraction = phase - whole;
            const selected = locked ?? snapShopCat(phase);
            return (
              <div
                key={row}
                className={`secret-shop-band${locked !== undefined ? " is-stopped" : ""}${stopped.length === row ? " is-current" : ""}`}
                role="img"
                aria-label={`${partNames[row]}: ${catSet.kittens[selected].name}${locked !== undefined ? ", listo" : ""}`}
                data-testid={`shop-band-${row}`}
                data-cat={selected}
                data-stopped={locked !== undefined}
              >
                <div className="secret-shop-track" style={{ transform: `translateX(calc(var(--shop-tile) * ${-fraction - 2.5}))` }}>
                  {[-2, -1, 0, 1, 2, 3].map((offset) => {
                    const column = ((whole + offset) % 3 + 3) % 3;
                    const style = {
                      "--kitten-color": kittenColors[catSet.kittens[column].world],
                      backgroundImage: imageReady ? `url("${kittenSource}")` : undefined,
                      backgroundPosition: `${column * 50}% ${row * 50}%`,
                    } as CSSProperties;
                    return (
                      <span className={`secret-shop-piece part-${row}${imageReady ? " has-art" : ""}`} key={offset} style={style}>
                        {!imageReady && <span className="secret-shop-fallback"><i /><b /><i /></span>}
                      </span>
                    );
                  })}
                </div>
                <span className="secret-shop-target" aria-hidden="true" />
              </div>
            );
          })}
        </div>
        <div className="secret-shop-feedback texto-noa" role="status" aria-live="polite" aria-atomic="true">
          {result === null && empezado && <p>{frozen ? <Texto clave="minijuegos.tienda.pausa.rotulo" /> : `${prompts[stopped.length]} ${stopped.length + 1}/3`}</p>}
        </div>
        <div className="secret-shop-controls">
          {result === null && <Boton tipo="seguir" className="secret-shop-action" data-gamepad-default data-testid="shop-stop" disabled={frozen} clave="minijuegos.tienda.boton.para.rotulo" onClick={stopBand} />}
          {result === null && <BotonControl className="secret-shop-pause" data-testid="shop-pause" pictograma={localPaused ? "jugar" : "pausa"} etiqueta={localPaused ? "partida.pausa.seguir.oculto" : "partida.hud.pausa.oculto"} onClick={togglePause} />}
        </div>
        {imageFailed && <p className="secret-shop-notice">{t("minijuegos.tienda.sinDibujo.juntos")}</p>}
      </div>
      {!empezado && !paused && <PantallaPrevia id="tienda-previa" nombre="minijuegos.tienda.previa.nombre.rotulo"
        guardian={<Pictograma nombre="gato" doble />} regla={t("minijuegos.tienda.previa.regla.juntos")}
        practicaPrimero={false} onJugar={() => setEmpezado(true)} onSalir={onLeave} />}
      {result !== null && <ResultadoMinijuego id="tienda-resultado" gano={result > 1} onSalir={onLeave}
        titulo={result === 3 ? "minijuegos.tienda.resultado.tres.rotulo" : result === 2 ? "minijuegos.tienda.resultado.dos.rotulo" : "minijuegos.tienda.resultado.ninguno.rotulo"}
        dibujo={<span className="secret-shop-stars" aria-hidden="true">{"★".repeat(result)}</span>}
        frase={seconds ? t("minijuegos.tienda.resultado.estrellas.juntos", { seconds }) : t("minijuegos.tienda.resultado.ninguno.juntos")}
        botones={<Boton tipo="seguir" clave="minijuegos.tienda.resultado.sigue.rotulo" data-gamepad-default onClick={onLeave} />} />}
    </Dialog>
  );
}
