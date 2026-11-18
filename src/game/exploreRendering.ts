import { getImage } from "./assets.ts";
import { allFound, followerPositions, type ExploreState } from "./explore.ts";
import type { Level, LostKitten } from "./types";
import { textoLienzo } from "../textos/index.ts";

const GATE = "./assets/sprites/kitten-gate-v1.webp";
const catSprite = (kitten: LostKitten) => getImage(`./assets/sprites/world-cat-${kitten.cat}-v1.png`);
/** Huecos de la puerta (fracción del dibujo): izquierdo, central y derecho. */
const NICHES = [[.31, .33], [.5, .25], [.69, .33]] as const;

/** Los dibujos de los gatitos son grandes (más de 1000 px): se reducen una vez a 128 px y se reutilizan, para no
 * escalar el original en cada fotograma. */
const smallCats = new Map<number, HTMLCanvasElement>();
function smallCat(kitten: LostKitten): HTMLCanvasElement | HTMLImageElement | null {
  const cached = smallCats.get(kitten.cat);
  if (cached) return cached;
  const image = catSprite(kitten);
  if (!image.complete || !image.naturalWidth) return null;
  if (typeof document === "undefined") return image;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = Math.round(128 * image.naturalHeight / image.naturalWidth);
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  smallCats.set(kitten.cat, canvas);
  return canvas;
}

function drawCat(context: CanvasRenderingContext2D, kitten: LostKitten, x: number, bottom: number, size: number) {
  const image = smallCat(kitten);
  if (!image) return;
  const height = size * image.height / image.width;
  context.drawImage(image, Math.round(x - size / 2), Math.round(bottom - height), Math.round(size), Math.round(height));
}

function bubble(context: CanvasRenderingContext2D, text: string, x: number, y: number) {
  context.save();
  context.font = "bold 14px monospace";
  const width = context.measureText(text).width + 18;
  context.fillStyle = "#fff6e3"; context.strokeStyle = "#2f1d33"; context.lineWidth = 3;
  context.beginPath(); context.roundRect(Math.round(x - width / 2), Math.round(y - 26), width, 24, 7); context.fill(); context.stroke();
  context.fillStyle = "#3d294a"; context.textAlign = "center"; context.fillText(text, Math.round(x), Math.round(y - 9));
  context.restore();
}

/** Dibuja la puerta, los gatitos perdidos y los que siguen a Noa. Va dentro de la traslación de la cámara (x e y
 * del mundo, salvo cameraX, que se resta aquí como en el resto del motor). */
export function drawExploreWorld(context: CanvasRenderingContext2D, level: Level, state: ExploreState, cameraX: number, frame: number) {
  const gate = level.exploreGate;
  const open = allFound(level, state);
  const image = getImage(GATE);
  if (gate && image.complete && image.naturalWidth) {
    const cellWidth = image.naturalWidth / 2;
    const height = gate.width * image.naturalHeight / cellWidth;
    const top = gate.y + gate.height - height;
    context.drawImage(image, open ? cellWidth : 0, 0, cellWidth, image.naturalHeight, Math.round(gate.x - cameraX), Math.round(top), gate.width, Math.round(height));
    (level.lostKittens ?? []).forEach((kitten, index) => {
      if (!state.found.includes(kitten.id)) return;
      const [fx, fy] = NICHES[index] ?? NICHES[1];
      drawCat(context, kitten, gate.x - cameraX + gate.width * fx, top + height * fy + 14, gate.width * .2);
    });
  }
  for (const kitten of level.lostKittens ?? []) {
    if (state.found.includes(kitten.id)) continue;
    const bob = Math.sin(frame * .05 + kitten.x) * 3;
    drawCat(context, kitten, kitten.x - cameraX, kitten.y + bob, 56);
    if (state.meowing?.kitten === kitten.id) bubble(context, textoLienzo("partida.lienzo.miau.rotulo"), kitten.x - cameraX, kitten.y - 62);
  }
  const followers = followerPositions(state);
  state.found.forEach((id, index) => {
    const kitten = level.lostKittens?.find((k) => k.id === id);
    const point = followers[index];
    if (kitten && point) drawCat(context, kitten, point.x - cameraX, point.y, 40);
  });
}

/** Capa de pantalla: huecos de gatitos en el HUD y la flecha que señala el objetivo alrededor de Noa. */
export function drawExploreOverlay(context: CanvasRenderingContext2D, level: Level, state: ExploreState, player: { x: number; y: number; width: number }, target: { x: number; y: number } | null, camera: { x: number; y: number }, frame: number) {
  context.save();
  context.fillStyle = "rgba(42,24,55,.82)";
  context.beginPath(); context.roundRect(12, 12, 190, 46, 10); context.fill();
  context.fillStyle = "#fff6e3"; context.font = "bold 14px monospace"; context.fillText(textoLienzo("partida.lienzo.gatitos.rotulo"), 24, 40);
  (level.lostKittens ?? []).forEach((kitten, index) => {
    const x = 118 + index * 28;
    context.fillStyle = "rgba(255,246,227,.35)";
    context.beginPath(); context.arc(x, 35, 12, 0, Math.PI * 2); context.fill();
    if (state.found.includes(kitten.id)) drawCat(context, kitten, x, 47, 26);
  });
  if (target) {
    const px = player.x + player.width / 2 - camera.x;
    const py = player.y + 10 - camera.y;
    const angle = Math.atan2(target.y - camera.y - py, target.x - camera.x - px);
    context.translate(px + Math.cos(angle) * 70, py + Math.sin(angle) * 70);
    context.rotate(angle);
    context.globalAlpha = .65 + Math.sin(frame * .1) * .3;
    context.fillStyle = "#ffd76a"; context.strokeStyle = "#2f1d33"; context.lineWidth = 3;
    context.beginPath(); context.moveTo(18, 0); context.lineTo(-8, -13); context.lineTo(-8, 13); context.closePath(); context.fill(); context.stroke();
  }
  context.restore();
}
