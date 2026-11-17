import { useEffect, useRef, useState } from "react";
import { getImage, getLevelAssets } from "./assets";
import { drawEnemy } from "./rendering";
import { heartsOf, isBestFriend, isFriend } from "./friendProgress";
import { foodNames, friendCatalog, MAX_HEARTS, type FriendEntry, type FriendFood } from "./friends";
import { levels, waterLevels } from "./levels";
import type { Progress } from "./progress";
import { GameAssetIcon } from "./GameAssetIcon";
import "./friends.css";

/** La manzana sale del atlas de objetos; la bellota y la flor, de sus dibujos de la merienda y el valle. */
const FOOD_ICONS: Record<Exclude<FriendFood, "apple">, string> = { acorn: "./assets/sprites/bellota-v1.webp", flower: "./assets/sprites/bloom-flower-v1.png" };

/** Nivel y enemigo de muestra de un amigo: dan el arte de su mundo y sus medidas. */
function sample(entry: FriendEntry) {
  for (const level of [...levels, ...waterLevels]) {
    const enemy = level.enemies.find((candidate) => candidate.kind === entry.kind);
    if (enemy) return { level, enemy };
  }
  return null;
}

/** Dibuja el amigo con el mismo arte del juego. Vuelve a pintar mientras cargan las imágenes. */
function FriendSprite({ entry, size, silhouette }: { entry: FriendEntry; size: number; silhouette?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const found = sample(entry);
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!found || !canvas || !context) return;
    const raster = getLevelAssets(found.level);
    let tries = 0;
    const paint = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      const { enemy } = found;
      const scale = Math.min(canvas.width / (enemy.width + 40), canvas.height / (enemy.height + 40));
      context.save();
      context.translate(canvas.width / 2, canvas.height - 8);
      context.scale(scale, scale);
      drawEnemy(context, { ...enemy, x: -enemy.width / 2, y: -enemy.height, vx: 1, active: true, phase: 0 }, 0, false, raster);
      context.restore();
    };
    paint();
    const timer = window.setInterval(() => { paint(); if (++tries > 8) window.clearInterval(timer); }, 400);
    return () => window.clearInterval(timer);
  }, [entry]);
  return <canvas ref={ref} className={`friend-sprite ${silhouette ? "is-silhouette" : ""}`} width={size} height={Math.round(size * .8)} aria-hidden="true" />;
}

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
      <section className="friend-visit" aria-label={`Visita a ${visiting.name}`}>
        <div className="friend-visit-stage">
          {background && <img className="friend-visit-bg" src={background} alt="" />}
          <div className={`friend-visit-sprite ${mood ? `is-${mood}` : ""}`}><FriendSprite entry={visiting} size={260} /></div>
        </div>
        <h3>{visiting.name}{isBestFriend(visiting.kind, progress) ? " ★" : ""}</h3>
        <p className="friend-hearts" aria-label={`${hearts} de ${MAX_HEARTS} corazones de amistad`}>
          {Array.from({ length: MAX_HEARTS }, (_, index) => <span key={index} className={index < hearts ? "is-full" : ""}>♥</span>)}
          {hearts >= MAX_HEARTS && <strong> ¡Mejor amigo!</strong>}
        </p>
        <div className="friend-actions">
          <button className="pixel-button" type="button" onClick={() => act("¡Le encanta! ♥", "hop")}>Acariciar</button>
          {(Object.keys(foodNames) as FriendFood[]).map((food) => (
            <button key={food} className="pixel-button friend-food" type="button"
              onClick={() => act(food === visiting.favoriteFood ? "¡Su comida favorita! Baila de alegría." : "¡Ñam!", food === visiting.favoriteFood ? "dance" : "hop")}>
              {food === "apple" ? <GameAssetIcon kind="apple" /> : <img src={getImage(FOOD_ICONS[food]).src || FOOD_ICONS[food]} alt="" />}
              {foodNames[food]}
            </button>
          ))}
          <button className="pixel-button" type="button" onClick={() => act(`${visiting.biteLine} ${visiting.tip}`, "hop", false)}>¿Muerde?</button>
        </div>
        <p className="friend-reply" role="status" aria-live="polite">{reply}</p>
        <button className="pixel-button" type="button" data-gamepad-back onClick={() => { setVisiting(null); setReply(""); }}>Volver a los amigos</button>
      </section>
    );
  }

  const worlds = [...new Set(friendCatalog.map((entry) => entry.world))].sort((a, b) => a - b);
  return (
    <>
      <p>Saluda a los animales en el paseo de los amigos y luego visítalos aquí: acarícialos y dales de comer.</p>
      <div className="friends-grid">
        {worlds.map((world) => friendCatalog.filter((entry) => entry.world === world).map((entry) => {
          const friend = isFriend(entry, progress);
          const available = worldAvailable(world, progress);
          return friend ? (
            <button key={entry.kind} type="button" className={`friend-card ${isBestFriend(entry.kind, progress) ? "is-best" : ""}`} onClick={() => setVisiting(entry)}>
              <FriendSprite entry={entry} size={96} />
              <strong>{entry.name}</strong>
              <small>{"♥".repeat(heartsOf(entry.kind, progress)) || "Nuevo amigo"}</small>
            </button>
          ) : (
            <article key={entry.kind} className="friend-card is-locked" aria-label="Amigo por descubrir">
              {available ? <FriendSprite entry={entry} size={96} silhouette /> : <span className="friend-mystery">?</span>}
              <strong>{available ? "¿Quién será?" : `Mundo ${world === 7 ? "secreto" : world === 8 ? "del agua" : world}`}</strong>
            </article>
          );
        }))}
      </div>
      <p className="album-progress">♥ {friends.length} de {friendCatalog.length} amigos</p>
    </>
  );
}
