import type { RefObject } from "react";
import { Dialog } from "./Dialog";
import { esFilaPropia, isEnrolled } from "./rankingOnboarding";
import type { Tablon } from "./useTablon";
import { t } from "../textos";

type Props = {
  tablon: Tablon;
  campaignLevelCount: number;
};

type FormAlias = {
  id: string;
  etiqueta: string;
  valor: string;
  boton: string;
  ocupado: boolean;
  soloLectura?: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onCambio: (valor: string) => void;
  onEnviar: () => void;
};

/** Campo de alias con su botón; la ayuda recuerda no poner el nombre real. */
function FormularioAlias({ id, etiqueta, valor, boton, ocupado, soloLectura, inputRef, onCambio, onEnviar }: FormAlias) {
  return (
    <form className="ranking-join" onSubmit={(event) => { event.preventDefault(); onEnviar(); }}>
      <label htmlFor={id}>{etiqueta}</label>
      <input ref={inputRef} data-gamepad-default id={id} value={valor} onChange={(event) => onCambio(event.target.value)} readOnly={soloLectura} maxLength={16}
        disabled={ocupado} placeholder={t("adultos.app.por-ejemplo-moche")} autoComplete="off" aria-describedby={`${id}-ayuda`} />
      <button className="pixel-button primary" type="submit" disabled={ocupado}>{ocupado ? t("adultos.app.preparando-tu-tarjeta") : boton}</button>
      <small id={`${id}-ayuda`}>{t("adultos.app.solo-compartimos-tu-alias")}</small>
    </form>
  );
}

/** El tablón mundial para adultos: alta con alias, estado del alias y del envío, cambio de alias y la lista. */
export function VentanaTablon({ tablon, campaignLevelCount }: Props) {
  const { device, own, pedirOtro, cambiando, joining, message, players, loading, syncState, syncMessage } = tablon;
  const publico = own?.publicAlias ?? "";
  const formCambio = (
    <FormularioAlias id="ranking-alias-nuevo" etiqueta={t("adultos.tablon.alias-nuevo")} valor={tablon.aliasNuevo} boton={t("adultos.tablon.guardar-alias")}
      ocupado={joining} inputRef={tablon.aliasRef} onCambio={tablon.setAliasNuevo} onEnviar={() => void tablon.cambiarAlias()} />
  );
  return (
    <Dialog labelledBy="ranking-title" className="game-modal ranking-modal" onClose={tablon.cerrarTablon}>
      <button className="modal-close" type="button" data-gamepad-back onClick={tablon.cerrarTablon} aria-label={t("adultos.app.cerrar.oculto")}>×</button>
      <div className="ranking-heading">
        <span className="ranking-trophy" aria-hidden="true">★</span>
        <div><p className="eyebrow">{t("adultos.app.aventureras-y-aventureros")}</p><h2 id="ranking-title">{pedirOtro ? t("adultos.tablon.otro-alias.titulo") : t("adultos.app.tablon-mundial-2")}</h2></div>
      </div>
      {pedirOtro ? <>
        <p>{t("adultos.tablon.otro-alias.texto", { publico })}</p>
        {formCambio}
        {message && <p className="ranking-message" role="status">{message}</p>}
        <button className="pixel-button" type="button" onClick={tablon.cerrarTablon}>{t("adultos.tablon.otro-alias.luego")}</button>
      </> : <>
        {!isEnrolled(device) ? (
          <FormularioAlias id="ranking-alias" etiqueta={t("adultos.app.tu-alias-de-aventura")} valor={device?.registrationPending ? device.alias : tablon.alias}
            boton={device?.registrationPending ? t("adultos.app.reintentar-mi-tarjeta") : t("adultos.tablon.apuntarme")} soloLectura={Boolean(device?.registrationPending)}
            ocupado={joining} inputRef={tablon.aliasRef} onCambio={tablon.setAlias} onEnviar={() => void tablon.unirse()} />
        ) : <>
          <p className="ranking-welcome">{t("adultos.app.hola")} {device!.alias}!</p>
          {own && own.aliasStatus !== "approved" && <p className="ranking-alias-status" role="status">{t(`adultos.tablon.estado-${own.aliasStatus}`, { publico })}</p>}
          <p className="ranking-sync-status" role="status">{syncState === "saved" ? t("adultos.app.tus-logros-ya-estan") : syncState === "pending" ? t("adultos.app.envio-pendiente-rankingsyncmessage", { rankingSyncMessage: syncMessage }) : t("adultos.app.enviando-tus-logros")}</p>
          {cambiando ? formCambio : <button className="pixel-button" type="button" onClick={() => { tablon.setAliasNuevo(""); tablon.setCambiando(true); }}>{t("adultos.tablon.cambiar-alias")}</button>}
        </>}
        {message && <p className="ranking-message" role="status">{message}</p>}
        <ol className="ranking-list">{players.map((player, index) => {
          const position = index + 1;
          const isCurrentPlayer = esFilaPropia(player, own, isEnrolled(device) ? device : null);
          return <li className={`${position <= 3 ? `ranking-podium ranking-place-${position}` : ""} ${isCurrentPlayer ? "is-current-player" : ""}`} key={`${player.alias}-${index}`}>
            <span className="ranking-position" aria-label={t("adultos.app.puesto-position.oculto", { position })}>{position}</span>
            <div className="ranking-player">
              <div className="ranking-player-name"><strong>{player.alias}</strong>{isCurrentPlayer && <em>{t("adultos.app.tu")}</em>}</div>
              <div className="ranking-stats">{player.campaignWorld != null && player.campaignWorld > 0 && <span>{t("adultos.app.etapa")} {player.campaignWorld}/15</span>}<span>🚩 {player.completedLevels}/{campaignLevelCount} {t("adultos.app.pantallas")}</span><span>★ {player.stickers}{t("adultos.app.51-pegatinas")}</span><span>🤝 {player.bossChallenges}{t("adultos.app.17-retos-de-amistad")}</span><span>🍎 {player.totalApples === null ? t("adultos.app.total-sin-datos") : t("adultos.app.v-en-toda-la", { v: player.totalApples.toLocaleString("es-ES") })}</span><span>{player.achievedAt === null ? t("adultos.app.fecha-del-progreso-sin") : t("adultos.app.progreso-logrado-el-v", { v: new Date(player.achievedAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }) })}</span></div>
            </div>
          </li>;
        })}</ol>
        {players.length === 0 && !message && <p className="ranking-empty">{t("adultos.app.aun-no-hay-nadie")}</p>}
        <div className="ranking-footer"><button className="pixel-button ranking-refresh" type="button" disabled={loading} onClick={() => void tablon.refresh()}><span aria-hidden="true">↻</span> {loading ? t("adultos.app.actualizando") : t("adultos.app.actualizar-tablon")}</button></div>
      </>}
    </Dialog>
  );
}
