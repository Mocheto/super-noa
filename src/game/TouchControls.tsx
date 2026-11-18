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
 * Medidas de los botones táctiles, en px CSS, en tres tamaños de pantalla:
 * - `grande`: tableta u ordenador táctil, botones sobre el escenario;
 * - `apaisado`: móvil apaisado, botones sobre el escenario y más pequeños;
 * - `vertical`: móvil en vertical, botones debajo del escenario, dentro del marco.
 * El área táctil es el dibujo más `areaExtra` invisible por cada lado. Sobre el escenario se ven translúcidos.
 */
export const MEDIDAS_TACTILES = {
  grande: { flecha: 72, salta: 88, lana: 64, separacion: 12, areaExtra: 8, borde: 14 },
  apaisado: { flecha: 56, salta: 68, lana: 50, separacion: 10, areaExtra: 6, borde: 8 },
  vertical: { flecha: 60, salta: 72, lana: 54, separacion: 10, areaExtra: 6, borde: 10 },
  opacidad: 0.6,
} as const;

export const variablesTactiles = Object.fromEntries([
  ...(["grande", "apaisado", "vertical"] as const).flatMap((tamano) => Object.entries(MEDIDAS_TACTILES[tamano])
    .map(([medida, valor]) => [`--tactil-${medida}-${tamano}`, `${valor}px`])),
  ["--tactil-opacidad", String(MEDIDAS_TACTILES.opacidad)],
]) as CSSProperties;

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
