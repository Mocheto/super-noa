import { t } from "../textos";
import { Boton, BotonControl, Texto } from "../textos/Texto";

type Props = {
  albumFound: number;
  albumTotal: number;
  knownBosses: number;
  jefesTotal: number;
  muted: boolean;
  /** Hay partida guardada (alguna pantalla desbloqueada) que contar debajo. */
  partidaEmpezada: boolean;
  secretUnlocked: boolean;
  saveError: boolean;
  completedLevels: number;
  campaignLevelCount: number;
  onJugar: () => void;
  onAyuda: () => void;
  onColeccion: (pestana: "stickers" | "bosses") => void;
  onSonido: () => void;
  onAjustes: () => void;
  onTablon: () => void;
  onCreditos: () => void;
};

/** Pantalla de inicio: título, jugar, cómo se juega, álbum y jefes, sonido y el menú para adultos. */
export function PantallaInicio({ albumFound, albumTotal, knownBosses, jefesTotal, muted, partidaEmpezada, secretUnlocked, saveError, completedLevels, campaignLevelCount,
  onJugar, onAyuda, onColeccion, onSonido, onAjustes, onTablon, onCreditos }: Props) {
  return (
    <section className="home-screen" aria-labelledby="game-title">
      <div className="home-copy">
        <h1 id="game-title" className="inicio-titulo"><span><Texto clave="inicio.titulo.super.rotulo" /></span> <Texto clave="inicio.titulo.noa.rotulo" /></h1>
        <div className="rotulo-con-frase inicio-lema"><p className="texto-noa"><Texto clave="inicio.corre.rotulo" /></p><p className="juntos">{t("inicio.corre.juntos")}</p></div>
        <div className="rotulo-con-frase inicio-novedades"><p className="texto-noa pequeno"><Texto clave="inicio.mundosNuevos.rotulo" /></p><p className="juntos">{t("inicio.mundosNuevos.juntos")}</p></div>
        <div className="home-actions">
          <Boton tipo="jugar" className="home-play" clave="inicio.jugar.rotulo" data-gamepad-default onClick={onJugar} />
          <Boton clave="inicio.comoSeJuega.rotulo" onClick={onAyuda} />
        </div>
      </div>
      <div className="inicio-arte">
        <div className="hero-scene" aria-hidden="true">
          <img className="hero-backdrop" src={"./assets/home-adventure-v3.webp"} alt="" />
        </div>
        <div className="inicio-baldosas">
          <button type="button" className="baldosa" aria-label={t("inicio.album.oculto", { n: albumFound, total: albumTotal })} onClick={() => onColeccion("stickers")}><span className="texto-noa pictograma-doble"><Texto clave="inicio.album.rotulo" /></span><span className="baldosa-cuenta">{albumFound}/{albumTotal}</span></button>
          <button type="button" className="baldosa" aria-label={t("inicio.jefes.oculto", { n: knownBosses, total: jefesTotal })} onClick={() => onColeccion("bosses")}><span className="texto-noa pictograma-doble"><Texto clave="inicio.jefes.rotulo" /></span><span className="baldosa-cuenta">{knownBosses}/{jefesTotal}</span></button>
        </div>
      </div>
      <BotonControl className="inicio-sonido" pictograma={muted ? "sin-sonido" : "sonido"} etiqueta={muted ? "partida.hud.sonido.oculto" : "partida.hud.silencio.oculto"} aria-pressed={!muted} onClick={onSonido} />
      <nav className="inicio-adultos" aria-label={t("inicio.opciones.oculto")}>
        {partidaEmpezada && !saveError && <span>{t(secretUnlocked ? "inicio.partidaGuardadaConSecreto" : "inicio.partidaGuardada", { hechas: completedLevels, total: campaignLevelCount })}</span>}
        <button type="button" onClick={onAjustes}>{t("adultos.app.ajustes")}</button>
        <button type="button" onClick={onTablon}>{t("adultos.app.tablon-mundial")}</button>
        <button type="button" onClick={onCreditos}>{t("adultos.app.creditos")}</button>
      </nav>
    </section>
  );
}
