import { useEffect, useRef } from "react";
import { getLevelAssets } from "./assets";
import { drawEnemy } from "./rendering";
import { friendCatalog, type FriendEntry } from "./friends";
import { levels, waterLevels } from "./levels";

/** Nivel y enemigo de muestra de un amigo: dan el arte de su mundo y sus medidas. */
export function sample(entry: FriendEntry) {
  for (const level of [...levels, ...waterLevels]) {
    const enemy = level.enemies.find((candidate) => candidate.kind === entry.kind);
    if (enemy) return { level, enemy };
  }
  return null;
}

/** Dibuja el amigo con el mismo arte del juego. Vuelve a pintar mientras cargan las imágenes. */
export function FriendSprite({ entry, size, silhouette, className }: { entry: FriendEntry; size: number; silhouette?: boolean; className?: string }) {
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
  return <canvas ref={ref} className={`friend-sprite ${silhouette ? "is-silhouette" : ""} ${className ?? ""}`} width={size} height={Math.round(size * .8)} aria-hidden="true" />;
}


/** El dibujo de un animal amigo por su tipo (el visitante de la casa). */
export function DibujoAmigo({ animal, size, className }: { animal: string; size: number; className?: string }) {
  const entry = friendCatalog.find((amigo) => amigo.kind === animal);
  return entry ? <FriendSprite entry={entry} size={size} className={className} /> : null;
}

/**
 * Pinta un animal amigo en un lienzo como lo dibuja `DibujoAmigo` en la escena: en una caja de `ancho` × `ancho`·0,8
 * con el centro de abajo en `pies` (para las fotos del jardín). Devuelve si se ha podido.
 */
export function pintarAmigo(context: CanvasRenderingContext2D, animal: string, pies: { x: number; y: number }, ancho: number): boolean {
  const entry = friendCatalog.find((amigo) => amigo.kind === animal);
  const found = entry ? sample(entry) : null;
  if (!found) return false;
  const { enemy } = found;
  const alto = ancho * 0.8;
  const scale = Math.min(ancho / (enemy.width + 40), alto / (enemy.height + 40));
  context.save();
  context.translate(pies.x, pies.y - 8);
  context.scale(scale, scale);
  drawEnemy(context, { ...enemy, x: -enemy.width / 2, y: -enemy.height, vx: 1, active: true, phase: 0 }, 0, false, getLevelAssets(found.level));
  context.restore();
  return true;
}
