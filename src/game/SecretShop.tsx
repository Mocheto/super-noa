import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { Dialog } from "./Dialog";
import type { ShopMatchCount } from "./types";
import {
  advanceShopClock, countShopMatches, SHOP_ACTIVATION_GAP_MS, shopPhase,
  shopRewardSeconds, snapShopCat, type ShopCat, type ShopClock,
} from "./secretShopGame";
import "./secretShop.css";

type SecretShopProps = {
  paused: boolean;
  reduceMotion: boolean;
  onResult: (matches: ShopMatchCount) => void;
  onLeave: () => void;
  playSound: (kind: "countdown" | "cat" | "goal" | "block") => void;
};

const catNames = ["gatito Miel", "gatito Bruma", "gatito Pino"];
const partNames = ["orejas", "carita", "patitas"];
const prompts = ["¡Para las orejas!", "¡Para la carita!", "¡Para las patitas!"];
const kittenSource = "./assets/sprites/secret-shop-kittens-v1.png";

export function SecretShop({ paused, reduceMotion, onResult, onLeave, playSound }: SecretShopProps) {
  const titleId = useId();
  const [localPaused, setLocalPaused] = useState(false);
  const [away, setAway] = useState(() => document.hidden || !document.hasFocus());
  const [activeMs, setActiveMs] = useState(0);
  const [stopped, setStopped] = useState<ShopCat[]>([]);
  const [result, setResult] = useState<ShopMatchCount | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [roomFailed, setRoomFailed] = useState(false);
  const clock = useRef<ShopClock>({ activeMs: 0, lastFrame: null });
  const lockedCats = useRef<ShopCat[]>([]);
  const reported = useRef(false);
  const nextActivation = useRef(0);
  const awayRef = useRef(away);
  const frozen = paused || localPaused || away;

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
        <header>
          <h2 id={titleId}>El rincón de los gatitos</h2>
          <p>¡Junta las tres partes del mismo gatito!</p>
        </header>
        <img className="secret-shop-preload" src={kittenSource} alt="" onLoad={() => setImageReady(true)} onError={() => { setImageFailed(true); setImageReady(false); }} />
        <div className="secret-shop-bands" aria-label="Retrato del gatito">
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
                aria-label={`${partNames[row]}: ${catNames[selected]}${locked !== undefined ? ", listo" : ""}`}
                data-testid={`shop-band-${row}`}
                data-cat={selected}
                data-stopped={locked !== undefined}
              >
                <div className="secret-shop-track" style={{ transform: `translateX(calc(var(--shop-tile) * ${-fraction - 1}))` }}>
                  {[-2, -1, 0, 1, 2, 3].map((offset) => {
                    const column = ((whole + offset) % 3 + 3) % 3;
                    const style = {
                      "--kitten-color": ["#e7ac64", "#b7a5cf", "#658f83"][column],
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
        <div className="secret-shop-feedback" role="status" aria-live="polite" aria-atomic="true">
          {result !== null ? <>
            <span className="secret-shop-stars" aria-hidden="true">{"★".repeat(result)}</span>
            <p>{seconds ? `¡${seconds} segundos de escudo al salir!` : "¡Qué gatito tan divertido!"}</p>
          </> : <p>{frozen ? "Descansamos un poquito." : `${prompts[stopped.length]} (${stopped.length + 1}/3)`}</p>}
        </div>
        <div className="secret-shop-controls">
          <button
            type="button"
            className="secret-shop-action"
            data-gamepad-default
            data-testid="shop-stop"
            disabled={frozen}
            onClick={result === null ? stopBand : onLeave}
          >{result === null ? "¡Parar!" : "Volver a jugar fuera"}</button>
          <button type="button" className="secret-shop-pause" data-testid="shop-pause" onClick={togglePause}>
            {localPaused ? "Seguir" : "Pausa"}
          </button>
        </div>
        <p className="secret-shop-hint">3 iguales: 🛡️ 12 s · 2 iguales: 🛡️ 5 s</p>
        {imageFailed && <p className="secret-shop-notice">El dibujo no ha llegado. ¡Jugamos con gatitos de colores!</p>}
      </div>
    </Dialog>
  );
}
