import type { RefObject } from "react";
import { Dialog } from "./Dialog";
import type { RankingDevice, RankingPlayer } from "./ranking";
import { isEnrolled } from "./rankingOnboarding";
import { t } from "../textos";

type Props = {
  /** Alta obligatoria antes de jugar: sin cerrar ni lista. */
  enrollmentRequired: boolean;
  enrollmentStorageBlocked: boolean;
  rankingDevice: RankingDevice | null;
  rankingAlias: string;
  rankingAliasRef: RefObject<HTMLInputElement | null>;
  rankingJoining: boolean;
  rankingSyncState: "idle" | "syncing" | "saved" | "pending";
  rankingSyncMessage: string;
  rankingMessage: string;
  rankingPlayers: RankingPlayer[];
  rankingLoading: boolean;
  campaignLevelCount: number;
  onAliasChange: (alias: string) => void;
  onJoin: () => void;
  onDefer: (mensaje: string) => void;
  onRefresh: () => void;
  onClose: () => void;
};

/** El tablón mundial para adultos: alta con alias, estado del envío y la lista de aventureras y aventureros. */
export function VentanaTablon({ enrollmentRequired, enrollmentStorageBlocked, rankingDevice, rankingAlias, rankingAliasRef, rankingJoining, rankingSyncState, rankingSyncMessage,
  rankingMessage, rankingPlayers, rankingLoading, campaignLevelCount, onAliasChange, onJoin, onDefer, onRefresh, onClose }: Props) {
  return (
    <Dialog labelledBy="ranking-title" className="game-modal ranking-modal" onClose={enrollmentRequired ? undefined : onClose}>
      {!enrollmentRequired && <button className="modal-close" type="button" data-gamepad-back onClick={onClose} aria-label={t("adultos.app.cerrar.oculto")}>×</button>}
      <div className="ranking-heading">
        <span className="ranking-trophy" aria-hidden="true">★</span>
        <div><p className="eyebrow">{t("adultos.app.aventureras-y-aventureros")}</p><h2 id="ranking-title">{enrollmentRequired ? t("adultos.app.tu-alias-para-la") : t("adultos.app.tablon-mundial-2")}</h2></div>
      </div>
      {enrollmentRequired && <p>{t("adultos.app.antes-de-jugar-elige")}</p>}
      {!isEnrolled(rankingDevice) ? <form className="ranking-join" onSubmit={(event) => { event.preventDefault(); onJoin(); }}><label htmlFor="ranking-alias">{t("adultos.app.tu-alias-de-aventura")}</label><input ref={rankingAliasRef} data-gamepad-default id="ranking-alias" value={rankingDevice?.registrationPending ? rankingDevice.alias : rankingAlias} onChange={(event) => onAliasChange(event.target.value)} readOnly={Boolean(rankingDevice?.registrationPending)} maxLength={16} disabled={rankingJoining} placeholder={t("adultos.app.por-ejemplo-moche")} autoComplete="off" aria-describedby="ranking-alias-help" /><button className="pixel-button primary" type="submit" disabled={rankingJoining}>{rankingJoining ? t("adultos.app.preparando-tu-tarjeta") : rankingDevice?.registrationPending ? t("adultos.app.reintentar-mi-tarjeta") : enrollmentRequired ? t("adultos.app.guardar-alias-y-jugar") : t("adultos.app.salir-al-tablon")}</button><small id="ranking-alias-help">{t("adultos.app.solo-compartimos-tu-alias")}{rankingDevice?.registrationPending ? t("adultos.app.recuperaremos-tu-tarjeta-pendiente") : ""}</small></form> : <><p className="ranking-welcome">{t("adultos.app.hola")} {rankingDevice!.alias}!</p><p className="ranking-sync-status" role="status">{rankingSyncState === "saved" ? t("adultos.app.tus-logros-ya-estan") : rankingSyncState === "pending" ? t("adultos.app.envio-pendiente-rankingsyncmessage", { rankingSyncMessage }) : t("adultos.app.enviando-tus-logros")}</p></>}
      {rankingMessage && <p className="ranking-message" role="status">{rankingMessage}</p>}
      {enrollmentRequired && enrollmentStorageBlocked && <><p>{t("adultos.app.no-podemos-guardar-tu")}</p><button className="pixel-button" type="button" disabled={rankingJoining} onClick={() => onDefer(t("adultos.app.el-navegador-no-permite"))}>{t("adultos.app.jugar-sin-guardar-tarjeta")}</button></>}
      {!enrollmentRequired && <><ol className="ranking-list">{rankingPlayers.map((player, index) => {
        const position = index + 1;
        const isCurrentPlayer = rankingDevice?.alias.toLocaleLowerCase("es") === player.alias.toLocaleLowerCase("es");
        return <li className={`${position <= 3 ? `ranking-podium ranking-place-${position}` : ""} ${isCurrentPlayer ? "is-current-player" : ""}`} key={`${player.alias}-${index}`}>
          <span className="ranking-position" aria-label={t("adultos.app.puesto-position.oculto", { position })}>{position}</span>
          <div className="ranking-player">
            <div className="ranking-player-name"><strong>{player.alias}</strong>{isCurrentPlayer && <em>{t("adultos.app.tu")}</em>}</div>
            <div className="ranking-stats">{player.campaignWorld != null && player.campaignWorld > 0 && <span>{t("adultos.app.etapa")} {player.campaignWorld}/15</span>}<span>🚩 {player.completedLevels}/{campaignLevelCount} {t("adultos.app.pantallas")}</span><span>★ {player.stickers}{t("adultos.app.51-pegatinas")}</span><span>🤝 {player.bossChallenges}{t("adultos.app.17-retos-de-amistad")}</span><span>🍎 {player.totalApples === null ? t("adultos.app.total-sin-datos") : t("adultos.app.v-en-toda-la", { v: player.totalApples.toLocaleString("es-ES") })}</span><span>{player.achievedAt === null ? t("adultos.app.fecha-del-progreso-sin") : t("adultos.app.progreso-logrado-el-v", { v: new Date(player.achievedAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }) })}</span></div>
          </div>
        </li>;
      })}</ol>
      {rankingPlayers.length === 0 && !rankingMessage && <p className="ranking-empty">{t("adultos.app.aun-no-hay-nadie")}</p>}
      <div className="ranking-footer"><button className="pixel-button ranking-refresh" type="button" disabled={rankingLoading} onClick={onRefresh}><span aria-hidden="true">↻</span> {rankingLoading ? t("adultos.app.actualizando") : t("adultos.app.actualizar-tablon")}</button></div></>}
    </Dialog>
  );
}
