import { useEffect, useState } from "react";
import { getImage, getLevelAssets } from "./assets";
import { FriendSprite, sample } from "./DibujoAmigo";
import { heartsOf, isBestFriend, isFriend } from "./friendProgress";
import { foodNames, friendCatalog, MAX_HEARTS, type FriendEntry, type FriendFood } from "./friends";
import { nivelesCampana as levels } from "./nivelesIndice";
import type { Progress } from "./progress";
import { GameAssetIcon } from "./GameAssetIcon";
import "./friends.css";
import { t } from "../textos";
import { Pictogramas, Texto } from "../textos/Texto";

/** La manzana sale del atlas de objetos; la bellota y la flor, de sus dibujos de la merienda y el valle. */
const FOOD_ICONS: Record<Exclude<FriendFood, "apple">, string> = { acorn: "./assets/sprites/bellota-v1.webp", flower: "./assets/sprites/bloom-flower-v1.webp" };

const worldAvailable = (world: number, progress: Progress) => {
  if (world === 7) return progress.secretUnlocked;
  if (world === 8) return progress.waterUnlocked;
  const campaign = levels.filter((level) => level.world !== 7 && level.world !== 8);
  return campaign.findIndex((level) => level.world === world) <= progress.unlocked;
};

/** Pestaña Amigos de la colección: cuadrícula por mundo y visita de cada amigo. */
export function FriendsTab({ progress, onHeart }: { progress: Progress; onHeart: (kind: string) => void }) {
  const [visiting, setVisiting] = useState<FriendEntry | null>(null);
  const [reply, setReply] = useState("");
  const [mood, setMood] = useState<"" | "hop" | "dance">("");
  const friends = friendCatalog.filter((entry) => isFriend(entry, progress));
  useEffect(() => { if (!mood) return; const timer = window.setTimeout(() => setMood(""), 900); return () => window.clearTimeout(timer); }, [mood]);

  if (visiting) {
    const hearts = heartsOf(visiting.kind, progress);
    const background = sample(visiting) ? getLevelAssets(sample(visiting)!.level).worldBackground.src : "";
    const act = (text: string, nextMood: "hop" | "dance", heart = true) => {
      setReply(text);
      setMood(nextMood);
      if (heart) onHeart(visiting.kind);
    };
    return (
      <section className="friend-visit" aria-label={t("coleccion.amigos.visita.oculto", { nombre: visiting.name })}>
        <div className="friend-visit-stage">
          {background && <img className="friend-visit-bg" src={background} alt="" />}
          <div className={`friend-visit-sprite ${mood ? `is-${mood}` : ""}`}><FriendSprite entry={visiting} size={260} /></div>
        </div>
        <h3>{visiting.name}{isBestFriend(visiting.kind, progress) ? " ★" : ""}</h3>
        <p className="friend-hearts" aria-label={t("coleccion.amigos.corazones.oculto", { n: hearts, total: MAX_HEARTS })}>
          {Array.from({ length: MAX_HEARTS }, (_, index) => <span key={index} className={index < hearts ? "is-full" : ""}>♥</span>)}
          {hearts >= MAX_HEARTS && <strong> <Texto clave="coleccion.amigos.mejorAmigo.rotulo" /></strong>}
        </p>
        <div className="friend-actions">
          <button className="pixel-button" type="button" onClick={() => act(t("coleccion.amigos.leEncanta.rotulo"), "hop")}><Texto clave="coleccion.amigos.acariciar.rotulo" /></button>
          {(Object.keys(foodNames) as FriendFood[]).map((food) => (
            <button key={food} className="pixel-button friend-food" type="button"
              onClick={() => act(food === visiting.favoriteFood ? `${t("coleccion.amigos.favorita.rotulo")} ${t("coleccion.amigos.favorita.juntos")}` : t("coleccion.amigos.nam.rotulo"), food === visiting.favoriteFood ? "dance" : "hop")}>
              {food === "apple" ? <GameAssetIcon kind="apple" /> : <img src={getImage(FOOD_ICONS[food]).src || FOOD_ICONS[food]} alt="" />}
              {foodNames[food]}
            </button>
          ))}
          <button className="pixel-button" type="button" onClick={() => act(`${t("coleccion.amigos.noMuerde.rotulo")} ${visiting.biteLine} ${visiting.tip}`, "hop", false)}><Texto clave="coleccion.amigos.muerde.rotulo" /></button>
        </div>
        <p className="friend-reply" role="status" aria-live="polite"><Pictogramas texto={reply} /></p>
        <button className="pixel-button" type="button" data-gamepad-back onClick={() => { setVisiting(null); setReply(""); }}><Texto clave="coleccion.amigos.volver.rotulo" /></button>
      </section>
    );
  }

  const worlds = [...new Set(friendCatalog.map((entry) => entry.world))].sort((a, b) => a - b);
  return (
    <>
      <p><span className="rotulo"><Texto clave="coleccion.amigos.intro.rotulo" /></span> <small className="juntos">{t("coleccion.amigos.intro.juntos")}</small></p>
      <div className="friends-grid">
        {worlds.map((world) => friendCatalog.filter((entry) => entry.world === world).map((entry) => {
          const friend = isFriend(entry, progress);
          const available = worldAvailable(world, progress);
          return friend ? (
            <button key={entry.kind} type="button" className={`friend-card ${isBestFriend(entry.kind, progress) ? "is-best" : ""}`} onClick={() => setVisiting(entry)}>
              <FriendSprite entry={entry} size={96} />
              <strong>{entry.name}</strong>
              <small>{"♥".repeat(heartsOf(entry.kind, progress)) || <Texto clave="coleccion.amigos.nuevo.rotulo" />}</small>
            </button>
          ) : (
            <article key={entry.kind} className="friend-card is-locked" aria-label={t("coleccion.amigos.porDescubrir.oculto")}>
              {available ? <FriendSprite entry={entry} size={96} silhouette /> : <span className="friend-mystery">?</span>}
              <strong>{available ? <Texto clave="coleccion.amigos.quien.rotulo" /> : world === 7 ? <Texto clave="mapa.mundo.secreto.rotulo" /> : world === 8 ? <Texto clave="mapa.mundo.agua.rotulo" /> : <Texto clave="mapa.mundo.numero.rotulo" variables={{ n: world }} />}</strong>
            </article>
          );
        }))}
      </div>
      <p className="album-progress" aria-label={t("coleccion.amigos.progreso.oculto", { n: friends.length, total: friendCatalog.length })}><Texto clave="coleccion.amigos.progreso.rotulo" variables={{ n: friends.length, total: friendCatalog.length }} /></p>
    </>
  );
}
