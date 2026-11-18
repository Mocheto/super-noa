import type { CSSProperties, PointerEvent, ReactNode } from "react";
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

/**
 * Medidas de los botones táctiles para dedos pequeños (decisión «Botones táctiles para dedos pequeños»), en px CSS.
 * El área táctil es el dibujo más `areaExtra` invisible por cada lado.
 */
export const MEDIDAS_TACTILES = { flecha: 88, salta: 116, lana: 80, separacion: 18, areaExtra: 10, borde: 16, opacidad: 0.85 } as const;

const variablesTactiles = {
  "--tactil-flecha": `${MEDIDAS_TACTILES.flecha}px`, "--tactil-salta": `${MEDIDAS_TACTILES.salta}px`, "--tactil-lana": `${MEDIDAS_TACTILES.lana}px`,
  "--tactil-separacion": `${MEDIDAS_TACTILES.separacion}px`, "--tactil-area": `${MEDIDAS_TACTILES.areaExtra}px`,
  "--tactil-borde": `${MEDIDAS_TACTILES.borde}px`, "--tactil-opacidad": String(MEDIDAS_TACTILES.opacidad),
} as CSSProperties;

/** La campaña y las batallas de saltos comparten los mismos botones, posiciones y áreas táctiles. Solo dibujo: el nombre va en la etiqueta oculta. */
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
  return <div className="touch-controls" style={variablesTactiles} aria-label={t("partida.controles.grupo.oculto")}>
    <div className="touch-group touch-move">
      {button("left", "touch-direction", t("partida.controles.izquierda.oculto"), <Texto clave="partida.controles.izquierda.rotulo" />)}
      {button("right", "touch-direction", t("partida.controles.derecha.oculto"), <Texto clave="partida.controles.derecha.rotulo" />)}
    </div>
    <div className="touch-group touch-actions">
      {showYarn && button("shoot", "touch-yarn", t("partida.controles.lana.oculto"), <PixelIcon kind="yarn" />)}
      {button("jump", "touch-jump", t("partida.controles.salta.oculto"), <span className="touch-jump-arrows" aria-hidden="true">↑<i>↑</i></span>)}
    </div>
  </div>;
}
