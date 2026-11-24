import { GameAssetIcon } from "./GameAssetIcon";
import type { NivelResumen } from "./nivelesIndice";
import type { GameSnapshot, Level } from "./types";
import { puntos, t } from "../textos";
import { BotonControl, Pictograma, Texto } from "../textos/Texto";

type Props = {
  lives: number;
  maxLives: number;
  /** Cambia al perder una vida, para que el corazón caiga y la fila lata. */
  latidoVidas: number;
  snapshot: GameSnapshot;
  starActive: boolean;
  displayedLevel: NivelResumen | Level;
  mostrarPausa: boolean;
  onPausa: () => void;
};

/** HUD de esquinas sobre el escenario (decisión «El HUD de la partida»): vidas y contadores a la izquierda, pantalla y banderas en el centro y la pausa a la derecha. */
export function HudEsquinas({ lives, maxLives, latidoVidas, snapshot, starActive, displayedLevel, mostrarPausa, onPausa }: Props) {
  return <div className="hud-esquinas">
    <div className="hud-izquierda">
      <span key={latidoVidas} className={`hud-chip hud-vidas${latidoVidas ? " late" : ""}`} role="img" aria-label={t("partida.hud.vidas.oculto", { n: lives })}>{Array.from({ length: maxLives }, (_, vida) => <span key={vida} className="hud-vida">
        <GameAssetIcon kind="heart" className={vida < lives ? "" : "vida-perdida"} />
        {latidoVidas > 0 && vida === lives && <GameAssetIcon kind="heart" className="vida-cae" />}
      </span>)}</span>
      <span className="hud-contadores">
        <span className="hud-chip" role="img" aria-label={t("partida.hud.manzanas.oculto", { n: snapshot.apples })}><GameAssetIcon kind="apple" /> {snapshot.apples}</span>
        <span className="hud-chip" role="img" aria-label={t("partida.hud.pegatinas.oculto", { n: snapshot.stickers.length })}><Pictograma nombre="pegatina" />{snapshot.stickers.length}</span>
        {(starActive || snapshot.power === "cat" || snapshot.power === "apple") && <span className={`hud-chip power-chip power-${snapshot.power} ${starActive ? "star-power-chip" : ""}`} role="img" aria-label={t(starActive ? "partida.hud.poder.estrella.oculto" : snapshot.power === "cat" ? "partida.hud.poder.gata.oculto" : "partida.hud.poder.manzana.oculto")}><Texto clave={starActive ? "partida.hud.poder.estrella.rotulo" : snapshot.power === "cat" ? "partida.hud.poder.gata.rotulo" : "partida.hud.poder.manzana.rotulo"} /></span>}
      </span>
    </div>
    <div className="hud-centro">
      {displayedLevel.detour ? <span className="hud-chip hud-pantalla"><Texto clave="partida.hud.secreto.rotulo" /></span>
        : displayedLevel.restStop ? <span className="hud-chip hud-pantalla"><Texto clave="partida.hud.paseo.rotulo" /></span>
          : <span className="hud-chip hud-pantalla">{displayedLevel.id}</span>}
      {!displayedLevel.detour && !displayedLevel.restStop && <span className="hud-chip hud-banderas" role="img" aria-label={displayedLevel.puzzleRooms
        ? t("partida.hud.salas.oculto", { n: snapshot.checkpoint + 1, total: displayedLevel.puzzleRooms.length })
        : t("partida.hud.banderas.oculto", { n: snapshot.checkpoint, total: displayedLevel.verticalCheckpoints?.length ?? displayedLevel.checkpoints.length })}>
        {displayedLevel.puzzleRooms ? <Texto clave="partida.hud.sala.rotulo" variables={{ puntos: puntos(snapshot.checkpoint + 1, displayedLevel.puzzleRooms.length) }} /> : <Texto clave="partida.hud.bandera.rotulo" variables={{ puntos: puntos(snapshot.checkpoint, displayedLevel.verticalCheckpoints?.length ?? displayedLevel.checkpoints.length) }} />}
      </span>}
      {snapshot.kittens && snapshot.kittens.total > 0 && <span className="hud-chip hud-banderas" role="img" aria-label={t("partida.hud.gatitos.oculto", { n: snapshot.kittens.found, total: snapshot.kittens.total })}>
        <Texto clave="partida.hud.gatitos.rotulo" variables={{ puntos: puntos(snapshot.kittens.found, snapshot.kittens.total) }} />
      </span>}
    </div>
    <div className="hud-derecha">
      {mostrarPausa && <BotonControl className="hud-pausa" pictograma="pausa" etiqueta="partida.hud.pausa.oculto" onClick={onPausa} />}
    </div>
  </div>;
}
