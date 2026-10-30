import type { PointerEvent, ReactNode } from "react";
import { PixelIcon } from "./PixelIcon";

export type TouchControl = "left" | "right" | "jump" | "shoot";
type Handler = (control: TouchControl, event: PointerEvent<HTMLButtonElement>) => void;
type Props = {
  onPress: Handler; onRelease: Handler; onCancel: Handler;
  showYarn?: boolean; disabled?: boolean;
  onKeyboardPress?: (control: TouchControl) => void;
  onKeyboardRelease?: (control: TouchControl) => void;
};

/** Campaign and platform bosses share the same buttons, layout and touch targets. */
export function TouchControls({ onPress, onRelease, onCancel, showYarn = true, disabled = false, onKeyboardPress, onKeyboardRelease }: Props) {
  const button = (control: TouchControl, className: string, label: string, content: ReactNode) => <button
    type="button" className={`touch-button ${className}`} aria-label={label} disabled={disabled}
    onPointerDown={(event) => onPress(control, event)} onPointerUp={(event) => onRelease(control, event)}
    onPointerCancel={(event) => onCancel(control, event)} onLostPointerCapture={(event) => onCancel(control, event)}
    onContextMenu={(event) => event.preventDefault()}
    onKeyDown={onKeyboardPress ? (event) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault(); if (!event.repeat) onKeyboardPress(control);
    } : undefined}
    onKeyUp={onKeyboardRelease ? (event) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault(); onKeyboardRelease(control);
    } : undefined}
  >{content}</button>;
  return <div className="touch-controls" aria-label="Controles táctiles">
    <div className="touch-group touch-move">
      {button("left", "touch-direction", "Mover a la izquierda", <><span>◀</span><small>IZQ.</small></>)}
      {button("right", "touch-direction", "Mover a la derecha", <><span>▶</span><small>DER.</small></>)}
    </div>
    <div className="touch-group touch-actions">
      {showYarn && button("shoot", "touch-yarn", "Lanzar bola de lana", <><PixelIcon kind="yarn" /><small>LANA</small></>)}
      {button("jump", "touch-jump", "Saltar; vuelve a tocar para hacer doble salto", <><span className="touch-jump-arrows">↑<i>↑</i></span><small>SALTAR</small></>)}
    </div>
  </div>;
}
