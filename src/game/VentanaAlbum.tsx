import { lazy, Suspense, type Dispatch, type SetStateAction } from "react";
import type { BossDefinition } from "./bosses";
import { Dialog } from "./Dialog";
import { funciones } from "./funciones";
import { getLevelObjectives } from "./levelObjectives";
import type { NivelResumen } from "./nivelesIndice";
import { nivelesCampana as levels } from "./nivelesIndice";
import type { Progress } from "./progress";
import { getStickerSprite, type StickerDefinition } from "./stickers";
import { worldArtwork, worldCatalog } from "./worldMapData";
import { puntos, sinPictogramas, t } from "../textos";
import { Boton, BotonControl, PalabraConDibujo, Texto } from "../textos/Texto";

// La pestaña Amigos (que arrastra rendering.ts) y las fotos de la casa van en su propio bloque; se precargan en reposo
// desde el mapa (`precargarAlbum`) para que el álbum las abra sin espera.
const cargarFriendsTab = () => import("./FriendsTab");
const cargarFotosCasa = () => import("./FotosCasa");
const FriendsTab = lazy(() => cargarFriendsTab().then((module) => ({ default: module.FriendsTab })));
const FotosCasa = lazy(() => cargarFotosCasa().then((module) => ({ default: module.FotosCasa })));

/** Pide en segundo plano los bloques de la pestaña Amigos y de las fotos. */
export function precargarAlbum() {
  void cargarFriendsTab().catch(() => {});
  void cargarFotosCasa().catch(() => {});
}

export type CollectionTab = "stickers" | "bosses" | "memories" | "friends" | "photos";
export type JefeDelAlbum = { level: NivelResumen; index: number; boss: BossDefinition };
export type RecuerdoDeMundo = { complete: number; total: number; stickers: number; stickerTotal: number; flawless: number; bossFriend: boolean; remembered: boolean };

type Props = {
  progress: Progress;
  collectionTab: CollectionTab;
  albumStickers: readonly StickerDefinition[];
  albumHints: string[];
  setAlbumHints: Dispatch<SetStateAction<string[]>>;
  bossLevels: readonly JefeDelAlbum[];
  knownBosses: number;
  worldProgress: Record<number, RecuerdoDeMundo>;
  onTab: (pestana: CollectionTab) => void;
  onReplayBoss: (index: number) => void;
  onHeart: (kind: string) => void;
  onClose: () => void;
};

/** El álbum: pegatinas con sus pistas, jefes con su revancha, amigos, postales de los mundos y fotos de la casa. */
export function VentanaAlbum({ progress, collectionTab, albumStickers, albumHints, setAlbumHints, bossLevels, knownBosses, worldProgress, onTab, onReplayBoss, onHeart, onClose }: Props) {
  return (
    <Dialog labelledBy="album-title" className="game-modal album-modal ventana-coleccion" onClose={onClose}>
      <BotonControl className="ventana-cerrar" pictograma="cerrar" etiqueta="coleccion.cerrar.oculto" data-gamepad-back onClick={onClose} />
      <h2 id="album-title" className="ventana-cinta texto-noa titulo pictograma-doble"><Texto clave={collectionTab === "stickers" ? "coleccion.titulo.pegatinas.rotulo" : collectionTab === "bosses" ? "coleccion.titulo.jefes.rotulo" : collectionTab === "friends" ? "coleccion.titulo.amigos.rotulo" : collectionTab === "photos" ? "coleccion.titulo.fotos.rotulo" : "coleccion.titulo.postales.rotulo"} /></h2>
      <div className="collection-tabs" aria-label={t("coleccion.grupo.oculto")}>
        <button className={`pestana texto-noa ${collectionTab === "stickers" ? "is-active" : ""}`} type="button" aria-pressed={collectionTab === "stickers"} aria-label={sinPictogramas(t("coleccion.pestana.pegatinas.rotulo"))} onClick={() => onTab("stickers")}><PalabraConDibujo clave="coleccion.pestana.pegatinas.rotulo" /></button>
        <button className={`pestana texto-noa ${collectionTab === "bosses" ? "is-active" : ""}`} type="button" aria-pressed={collectionTab === "bosses"} aria-label={sinPictogramas(t("coleccion.pestana.jefes.rotulo"))} onClick={() => onTab("bosses")}><PalabraConDibujo clave="coleccion.pestana.jefes.rotulo" /></button>
        {funciones.amigos && <button className={`pestana texto-noa ${collectionTab === "friends" ? "is-active" : ""}`} type="button" aria-pressed={collectionTab === "friends"} aria-label={sinPictogramas(t("coleccion.pestana.amigos.rotulo"))} onClick={() => onTab("friends")}><PalabraConDibujo clave="coleccion.pestana.amigos.rotulo" /></button>}
        <button className={`pestana texto-noa ${collectionTab === "memories" ? "is-active" : ""}`} type="button" aria-pressed={collectionTab === "memories"} aria-label={sinPictogramas(t("coleccion.pestana.postales.rotulo"))} onClick={() => onTab("memories")}><PalabraConDibujo clave="coleccion.pestana.postales.rotulo" /></button>
        {funciones.casa && progress.casa && <button className={`pestana texto-noa ${collectionTab === "photos" ? "is-active" : ""}`} type="button" aria-pressed={collectionTab === "photos"} aria-label={sinPictogramas(t("coleccion.pestana.fotos.rotulo"))} onClick={() => onTab("photos")}><PalabraConDibujo clave="coleccion.pestana.fotos.rotulo" /></button>}
      </div>
      {collectionTab === "photos" ? <Suspense fallback={<p className="lazy-loading" role="status"><Texto clave="partida.hud.cargando.rotulo" /></p>}><FotosCasa fotos={progress.casa?.fotos ?? []} /></Suspense> : funciones.amigos && collectionTab === "friends" ? <Suspense fallback={<p className="lazy-loading" role="status"><Texto clave="partida.hud.cargando.rotulo" /></p>}><FriendsTab progress={progress} onHeart={onHeart} /></Suspense> : collectionTab === "stickers" ? <>
        <p className="juntos">{t(progress.secretUnlocked ? "coleccion.pegatinas.introConSecreto.juntos" : "coleccion.pegatinas.introSinSecreto.juntos")}</p>
        <div className="sticker-grid">
          {albumStickers.map((sticker) => {
            const found = progress.stickers.includes(sticker.id);
            const sprite = getStickerSprite(sticker.id);
            const stickerLevel = levels.find((level) => level.items.some((item) => item.id === sticker.id));
            const available = stickerLevel && getLevelObjectives(stickerLevel, progress).available;
            const hintVisible = albumHints.includes(sticker.id);
            return (
              <article className={`sticker-card ${found ? "is-found" : "is-locked"}`} key={sticker.id}>
                <span className="sticker-frame" aria-hidden="true">{found && sprite ? <span className="sticker-sprite" style={{ backgroundImage: `url(${sprite.src})`, backgroundPosition: `${sprite.column * 50}% center` }} /> : "?"}</span>
                <strong className="texto-noa pequeno">{found ? sticker.name : <Texto clave="mapa.mundo.numero.rotulo" variables={{ n: sticker.world }} />}</strong>
                <small>{stickerLevel ? stickerLevel.id : ""} · <Texto clave={found ? "coleccion.pegatinas.encontrada.rotulo" : "coleccion.pegatinas.pendiente.rotulo"} /></small>
                {!found && available && <><button className="level-hint-toggle" type="button" aria-expanded={hintVisible} aria-controls={`album-hint-${sticker.id}`} onClick={() => setAlbumHints((current) => hintVisible ? current.filter((id) => id !== sticker.id) : [...current, sticker.id])}><Texto clave="coleccion.pegatinas.pista.rotulo" /></button><p className="album-sticker-hint" id={`album-hint-${sticker.id}`} hidden={!hintVisible}>{sticker.hint}</p></>}
                {!found && !available && <small><Texto clave="coleccion.pegatinas.abrirPantalla.rotulo" /> <span className="juntos">{t("coleccion.pegatinas.abrirPantalla.juntos")}</span></small>}
              </article>
            );
          })}
        </div>
        <p className="album-progress texto-noa pequeno" aria-label={t("coleccion.pegatinas.progreso.oculto", { n: progress.stickers.filter((id) => albumStickers.some((sticker) => sticker.id === id)).length, total: albumStickers.length })}><Texto clave="coleccion.pegatinas.progreso.rotulo" variables={{ n: progress.stickers.filter((id) => albumStickers.some((sticker) => sticker.id === id)).length, total: albumStickers.length }} /></p>
      </> : collectionTab === "bosses" ? <>
        <p className="juntos">{t("coleccion.jefes.intro.juntos")}</p>
        <div className="boss-friends-grid">
          {bossLevels.map(({ level, index, boss }) => {
            const known = Boolean(progress.levelStats[level.id]?.completed);
            const challengeDone = Boolean(progress.bossChallenges[level.boss ?? ""]);
            return (
              <article className={`boss-friend-card ${known ? "is-friend" : "is-mystery"} ${challengeDone ? "has-challenge-frame" : ""}`} key={level.id}>
                <span className="boss-friend-world">{level.world === 7 ? (progress.secretUnlocked ? <Texto clave="mapa.mundo.secreto.rotulo" /> : <Texto clave="coleccion.jefes.misterioso.rotulo" />) : level.world === 8 ? <Texto clave="mapa.mundo.agua.rotulo" /> : <Texto clave="mapa.mundo.numero.rotulo" variables={{ n: level.world }} />}</span>
                <div className="boss-friend-portrait" aria-hidden="true">
                  {known ? boss.assetAtlas
                    ? <span className={`boss-friend-atlas ${level.boss === "santa-claus" ? "boss-friend-atlas-santa" : ""}`} style={{ backgroundImage: `url("${boss.assetAtlas}")` }} />
                    : <img src={`${boss.assetPrefix}-0.webp`} alt="" />
                    : <span className="boss-mystery-shape">?</span>}
                </div>
                <strong className="texto-noa pequeno" aria-label={known ? undefined : t("coleccion.jefes.porDescubrir.oculto")}>{known ? boss.name : <Texto clave="coleccion.jefes.porDescubrir.rotulo" />}</strong>
                {known ? <>{challengeDone ? <small className="challenge-frame-label"><Texto clave="coleccion.jefes.marco.rotulo" /></small> : <small><Texto clave="coleccion.jefes.retoPendiente.rotulo" /> {boss.challenge.label}</small>}<Boton tipo="seguir" className="boton-pequeno" clave="coleccion.jefes.jugarOtraVez.rotulo" onClick={() => onReplayBoss(index)} /></> : <small className="juntos">{t("coleccion.jefes.conocer.juntos")}</small>}
              </article>
            );
          })}
        </div>
        <p className="album-progress texto-noa pequeno" aria-label={t("coleccion.jefes.progreso.oculto", { n: knownBosses, total: bossLevels.length })}><Texto clave="coleccion.jefes.progreso.rotulo" variables={{ n: knownBosses, total: bossLevels.length }} /></p>
      </> : <>
        <p className="juntos">{t("coleccion.postales.intro.juntos")}</p>
        <div className="memory-grid">
          {worldCatalog.map((world) => {
            const memory = worldProgress[world.id];
            return (
              <article className={`memory-card world-${world.id} ${memory.remembered ? "is-remembered" : "is-locked"}`} key={world.id}>
                <img className="memory-world-art" src={worldArtwork(world.id)} alt="" aria-hidden="true" />
                <div className="memory-content">
                  <span>{world.id === 7 ? <Texto clave="mapa.mundo.secreto.rotulo" /> : world.id === 8 ? <Texto clave="mapa.mundo.agua.rotulo" /> : <Texto clave="mapa.mundo.numero.rotulo" variables={{ n: world.id }} />}</span>
                  {memory.remembered ? <><img className="memory-cat" src={world.catAsset} alt={t("coleccion.postales.gatito.oculto", { gato: world.cat, mundo: world.name })} /><strong>{world.cat}</strong><small>{world.name}</small><em aria-label={t("coleccion.postales.medallas.oculto", { n: memory.complete + memory.stickers + memory.flawless })}><Texto clave="coleccion.postales.medallas.rotulo" variables={{ n: memory.complete + memory.stickers + memory.flawless }} /></em></> : <><b className="memory-lock">?</b><strong aria-label={t("coleccion.postales.porDescubrir.oculto")}><Texto clave="coleccion.postales.porDescubrir.rotulo" /></strong><small aria-label={t("mapa.mundo.progreso.oculto", { n: memory.complete, total: memory.total })}><Texto clave="mapa.mundo.progreso.rotulo" variables={{ puntos: puntos(memory.complete, memory.total) }} /></small></>}
                </div>
              </article>
            );
          })}
        </div>
        <p className="album-progress texto-noa pequeno" aria-label={t("coleccion.postales.progreso.oculto", { n: Object.values(worldProgress).filter((world) => world.remembered).length, total: worldCatalog.length })}><Texto clave="coleccion.postales.progreso.rotulo" variables={{ n: Object.values(worldProgress).filter((world) => world.remembered).length, total: worldCatalog.length }} /></p>
      </>}
      <Boton tipo="seguir" className="coleccion-seguir" clave="coleccion.seguir.rotulo" onClick={onClose} />
    </Dialog>
  );
}
