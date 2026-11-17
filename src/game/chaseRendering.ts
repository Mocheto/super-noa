import { getImage, type RasterAssets } from "./assets.ts";
import { chaseTrail, runnerRect, type ChaseState } from "./chase.ts";
import { VIEW_WIDTH } from "./constants.ts";
import { drawEnemy } from "./rendering.ts";
import type { Chase } from "./types";

const YARN = "./assets/sprites/yarn-ball-v1.png";
const HEART = "./assets/sprites/ui-heart-v1.png";

function speech(context: CanvasRenderingContext2D, text: string, centerX: number, bottomY: number) {
  context.save();
  context.font = "bold 15px monospace";
  const width = Math.min(320, context.measureText(text).width + 24);
  const x = Math.round(Math.max(8, Math.min(VIEW_WIDTH - width - 8, centerX - width / 2)));
  const y = Math.round(bottomY - 38);
  context.fillStyle = "#fff6e3"; context.strokeStyle = "#2f1d33"; context.lineWidth = 3;
  context.beginPath(); context.roundRect(x, y, width, 30, 8); context.fill(); context.stroke();
  context.beginPath(); context.moveTo(centerX - 7, y + 29); context.lineTo(centerX, y + 40); context.lineTo(centerX + 7, y + 29); context.closePath(); context.fill();
  context.beginPath(); context.moveTo(centerX - 7, y + 30); context.lineTo(centerX, y + 40); context.lineTo(centerX + 7, y + 30); context.stroke();
  context.fillStyle = "#3d294a"; context.textAlign = "center"; context.fillText(text, x + width / 2, y + 21);
  context.restore();
}

/** Dibuja el animal travieso con su ovillo, el rastro hacia la parada siguiente, su frase y la flecha del borde
 * cuando no se ve. `caughtAge` (segundos desde que se le pilla) anima el saltito con corazones. */
export function drawChase(context: CanvasRenderingContext2D, chase: Chase, state: ChaseState, cameraX: number, frame: number, raster: RasterAssets, say: { text: string; life: number } | null, caughtAge: number) {
  context.save();
  context.globalAlpha = .75 + Math.sin(frame * .12) * .2;
  context.fillStyle = "#fff3a5"; context.strokeStyle = "#2f1d33"; context.lineWidth = 2;
  for (const point of chaseTrail(chase, state)) {
    context.beginPath(); context.arc(Math.round(point.x - cameraX), Math.round(point.y - 30), 8, 0, Math.PI * 2); context.fill(); context.stroke();
  }
  context.restore();

  const rect = runnerRect(chase, state);
  const running = Boolean(state.from);
  const hop = state.caught ? Math.abs(Math.sin(caughtAge * 9)) * Math.max(0, 14 - caughtAge * 6) : running ? Math.abs(Math.sin(frame * .4)) * 5 : Math.sin(frame * .08) * 1.5;
  drawEnemy(context, {
    id: "animal-travieso", kind: chase.runner, x: rect.x, y: rect.y - hop, width: rect.width, height: rect.height,
    minX: rect.x, maxX: rect.x, speed: 0, vx: state.facing, active: true, phase: frame * .05,
  }, cameraX, false, raster);
  const yarn = getImage(YARN);
  if (yarn.complete && yarn.naturalWidth && !state.caught) {
    // El ovillo va a lomos del animal, bien a la vista.
    context.drawImage(yarn, Math.round(rect.x + rect.width / 2 - 13 - cameraX), Math.round(rect.y - 20 - hop), 26, 26);
  }
  if (state.caught && caughtAge < 2.2) {
    const heart = getImage(HEART);
    if (heart.complete && heart.naturalWidth) {
      for (let i = 0; i < 3; i += 1) {
        const rise = caughtAge * 50 + i * 14;
        context.save(); context.globalAlpha = Math.max(0, 1 - caughtAge / 2.2);
        context.drawImage(heart, Math.round(rect.x - cameraX + (i - 1) * 22 + rect.width / 2 - 9), Math.round(rect.y - 10 - rise), 18, 16);
        context.restore();
      }
    }
  }
  if (say && say.life > 0) speech(context, say.text, Math.round(rect.x + rect.width / 2 - cameraX), rect.y - 6);

  const screenX = rect.x + rect.width / 2 - cameraX;
  if (!state.caught && (screenX > VIEW_WIDTH - 10 || screenX < 10)) {
    const right = screenX > VIEW_WIDTH - 10;
    context.save();
    context.fillStyle = "#ffd76a"; context.strokeStyle = "#2f1d33"; context.lineWidth = 3;
    const x = right ? VIEW_WIDTH - 34 : 34;
    const y = Math.max(60, Math.min(430, rect.y));
    context.beginPath();
    if (right) { context.moveTo(x + 18, y); context.lineTo(x - 8, y - 14); context.lineTo(x - 8, y + 14); }
    else { context.moveTo(x - 18, y); context.lineTo(x + 8, y - 14); context.lineTo(x + 8, y + 14); }
    context.closePath(); context.fill(); context.stroke();
    context.restore();
  }
}
