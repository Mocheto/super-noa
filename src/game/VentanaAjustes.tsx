import { useState } from "react";
import { Dialog } from "./Dialog";
import { preguntaPuerta, respuestaPuerta } from "./puertaAdultos";
import { t } from "../textos";

import type { TouchControlsMode } from "./ajustes";

export type { TouchControlsMode };

type Props = {
  musicVolume: number;
  effectsVolume: number;
  /** El ajuste «movimiento tranquilo» (no lo que pide el sistema). */
  reduceMotion: boolean;
  touchControls: TouchControlsMode;
  /** El tablón mundial, apagado salvo que una persona adulta lo encienda (tras la puerta para adultos). */
  tablonActivo: boolean;
  onTablonActivo: (activo: boolean) => void;
  onMusicVolume: (volumen: number) => void;
  onEffectsVolume: (volumen: number) => void;
  onReduceMotion: (activo: boolean) => void;
  onTouchControls: (modo: TouchControlsMode) => void;
  onClose: () => void;
};

/** Ajustes para adultos: volúmenes, movimiento tranquilo y controles táctiles. Se guardan en este dispositivo. */
export function VentanaAjustes({ musicVolume, effectsVolume, reduceMotion, touchControls, tablonActivo, onTablonActivo, onMusicVolume, onEffectsVolume, onReduceMotion, onTouchControls, onClose }: Props) {
  // Encender el tablón pasa por la puerta para adultos; apagarlo, no (solo deja de enviar).
  const [puerta, setPuerta] = useState<ReturnType<typeof preguntaPuerta> | null>(null);
  const [respuesta, setRespuesta] = useState("");
  const [fallo, setFallo] = useState(false);
  const comprobar = () => {
    if (!puerta) return;
    if (respuestaPuerta(puerta, respuesta)) {
      setPuerta(null);
      onTablonActivo(true);
      return;
    }
    setPuerta(preguntaPuerta());
    setRespuesta("");
    setFallo(true);
  };
  return (
    <Dialog labelledBy="settings-title" className="game-modal settings-modal" onClose={onClose}>
      <button className="modal-close" type="button" data-gamepad-back onClick={onClose} aria-label={t("adultos.app.cerrar.oculto")}>×</button>
      <p className="eyebrow">{t("adultos.app.a-tu-manera")}</p><h2 id="settings-title">{t("adultos.app.ajustes-de-juego")}</h2>
      <p>{t("adultos.app.estos-ajustes-se-guardan")}</p>
      <div className="settings-group">
        <label htmlFor="music-volume">{t("adultos.app.musica")} <output>{Math.round(musicVolume)}%</output></label>
        <input id="music-volume" type="range" min="0" max="100" value={musicVolume} onChange={(event) => onMusicVolume(Number(event.target.value))} />
        <label htmlFor="effects-volume">{t("adultos.app.efectos")} <output>{Math.round(effectsVolume)}%</output></label>
        <input id="effects-volume" type="range" min="0" max="100" value={effectsVolume} onChange={(event) => onEffectsVolume(Number(event.target.value))} />
      </div>
      <div className="settings-toggle"><input id="reduce-motion" type="checkbox" checked={reduceMotion} onChange={(event) => onReduceMotion(event.target.checked)} /><label htmlFor="reduce-motion"><strong>{t("adultos.app.movimiento-tranquilo")}</strong><small>{t("adultos.app.reduce-destellos-y-animaciones")}</small></label></div>
      <fieldset className="settings-controls"><legend>{t("adultos.app.controles-tactiles")}</legend>
        <label><input type="radio" name="touch-controls" checked={touchControls === "auto"} onChange={() => onTouchControls("auto")} /> {t("adultos.app.automaticos-en-movil")}</label>
        <label><input type="radio" name="touch-controls" checked={touchControls === "always"} onChange={() => onTouchControls("always")} /> {t("adultos.app.siempre-visibles")}</label>
      </fieldset>
      <div className="settings-toggle"><input id="tablon-activo" type="checkbox" checked={tablonActivo || puerta !== null}
        onChange={(event) => { if (!event.target.checked) { setPuerta(null); onTablonActivo(false); } else { setPuerta(preguntaPuerta()); setRespuesta(""); setFallo(false); } }} />
        <label htmlFor="tablon-activo"><strong>{t("adultos.tablon.ajuste")}</strong><small>{t("adultos.tablon.ajuste-ayuda")}</small></label></div>
      {puerta && <form className="puerta-adultos" onSubmit={(event) => { event.preventDefault(); comprobar(); }}>
        <p className="puerta-adultos-titulo"><strong>{t("adultos.tablon.puerta.titulo")}</strong></p>
        <label htmlFor="puerta-respuesta">{t("adultos.tablon.puerta.pregunta", { a: puerta.a, b: puerta.b })}</label>
        <input id="puerta-respuesta" inputMode="numeric" autoComplete="off" value={respuesta} onChange={(event) => setRespuesta(event.target.value)}
          aria-label={t("adultos.tablon.puerta.respuesta")} aria-describedby={fallo ? "puerta-fallo" : undefined} />
        {fallo && <p id="puerta-fallo" className="puerta-adultos-fallo" role="alert">{t("adultos.tablon.puerta.fallo")}</p>}
        <div className="puerta-adultos-botones">
          <button className="pixel-button primary" type="submit" disabled={!respuesta.trim()}>{t("adultos.tablon.puerta.seguir")}</button>
          <button className="pixel-button" type="button" onClick={() => setPuerta(null)}>{t("adultos.tablon.puerta.cancelar")}</button>
        </div>
      </form>}
      <p className="settings-help"><strong>{t("adultos.app.teclado")}</strong> {t("adultos.app.flechas-o-a-d")} <strong>{t("adultos.app.mando")}</strong> {t("adultos.app.cruceta-o-palanca-para")}</p>
      <button className="pixel-button primary" type="button" onClick={onClose}>{t("adultos.app.listo")}</button>
    </Dialog>
  );
}
