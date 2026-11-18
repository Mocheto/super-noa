import type { PointerEvent, ReactNode } from "react";
import { PixelIcon } from "./PixelIcon";
import { t } from "../textos";
import { Texto } from "../textos/Texto";

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
  return <div className="touch-controls" aria-label={t("partida.controles.grupo.oculto")}>
    <div className="touch-group touch-move">
      {button("left", "touch-direction", t("partida.controles.izquierda.oculto"), <span><Texto clave="partida.controles.izquierda.rotulo" /></span>)}
      {button("right", "touch-direction", t("partida.controles.derecha.oculto"), <span><Texto clave="partida.controles.derecha.rotulo" /></span>)}
    </div>
    <div className="touch-group touch-actions">
      {showYarn && button("shoot", "touch-yarn", t("partida.controles.lana.oculto"), <><PixelIcon kind="yarn" /><small><Texto clave="partida.controles.lana.rotulo" /></small></>)}
      {button("jump", "touch-jump", t("partida.controles.salta.oculto"), <><span className="touch-jump-arrows">↑<i>↑</i></span><small><Texto clave="partida.controles.salta.rotulo" /></small></>)}
    </div>
  </div>;
}
