import { getImage } from "./assets";
import { SANTA_ARENA, SANTA_PLATFORMS, type SantaBattle } from "./santaBattle";

export function drawSantaBattle(ctx: CanvasRenderingContext2D, state: SantaBattle) {
  const { width, height, floor } = SANTA_ARENA;
  const viewWidth = ctx.canvas.width;
  const cameraX = Math.max(0, Math.min(width - viewWidth, state.player.x - viewWidth * .4));
  ctx.save(); ctx.translate(-cameraX, 0);
  const gradient = ctx.createLinearGradient(0, 0, 0, floor);
  gradient.addColorStop(0, "#273d70"); gradient.addColorStop(1, "#b5dfeb");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
  // Snowy windows and pines sit behind the arena; only snowy shelves support feet.
  for (let x = 35; x < width; x += 155) {
    ctx.fillStyle = "#284f61"; ctx.beginPath(); ctx.moveTo(x, 370); ctx.lineTo(x + 65, 175); ctx.lineTo(x + 130, 370); ctx.fill();
    ctx.fillStyle = "#d7edf0"; ctx.beginPath(); ctx.moveTo(x + 39, 254); ctx.lineTo(x + 65, 175); ctx.lineTo(x + 91, 254); ctx.fill();
  }
  ctx.fillStyle = "#fff6d2";
  for (let i = 0; i < 40; i++) {
    const x = (i * 131 + 27) % width, y = (i * 79 + state.elapsed * 12) % (floor - 25);
    ctx.fillRect(x, y, 3, 3);
  }
  for (const support of [...SANTA_PLATFORMS, { x: 0, y: floor, width, height: height - floor }]) {
    ctx.fillStyle = "#719cae"; ctx.fillRect(support.x, support.y, support.width, support.height);
    ctx.fillStyle = "#effcff"; ctx.fillRect(support.x, support.y, support.width, 9);
    ctx.fillStyle = "#a8d8e5";
    for (let x = support.x + 12; x < support.x + support.width; x += 35) ctx.fillRect(x, support.y + 12, 15, support.height - 12);
  }
  for (const gift of state.gifts) {
    ctx.fillStyle = "#c4364c"; ctx.fillRect(gift.x, gift.y, gift.width, gift.height);
    ctx.fillStyle = "#ffde78"; ctx.fillRect(gift.x + 12, gift.y, 6, gift.height); ctx.fillRect(gift.x, gift.y + 9, gift.width, 5);
  }
  const boss = state.boss;
  const sheet = getImage("./assets/sprites/boss-papa-noel-sheet-v1.png");
  const pose = state.status === "won" ? 4 : boss.stun > 0 ? 3 : boss.attackIn < .65 ? 1 : boss.attackIn > 2.55 && state.elapsed > 3 ? 2 : 0;
  // Explicit crops exclude the adjacent pose and the gift painted over the throwing arm.
  const crops = [[0, 160, 348, 480], [365, 190, 380, 450], [755, 210, 355, 430], [1178, 205, 400, 435], [1585, 295, 398, 345]];
  const [sx, sy, sw, sh] = crops[pose];
  if (sheet.complete && sheet.naturalWidth) ctx.drawImage(sheet, sx, sy, sw, sh, boss.x - 8, boss.y - 12, boss.width + 16, boss.height + 12);
  else { ctx.fillStyle = "#bd3047"; ctx.fillRect(boss.x, boss.y, boss.width, boss.height); }
  if (boss.attackIn < .65 && !boss.stun && state.status === "playing") {
    ctx.fillStyle = "#fff1a2"; ctx.font = "bold 24px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("¡Va un regalo!", boss.x + boss.width / 2, boss.y - 30);
  }
  const p = state.player;
  ctx.save();
  if (p.invincible > 0 && Math.floor(p.invincible * 12) % 2 === 0) ctx.globalAlpha = .4;
  if (p.facing === -1) { ctx.translate(p.x + p.width / 2, 0); ctx.scale(-1, 1); ctx.translate(-p.x - p.width / 2, 0); }
  const image = getImage(p.grounded ? "./assets/sprites/noa-sprite-sheet.png" : "./assets/sprites/noa-jump-v2.png");
  if (image.complete && image.naturalWidth) {
    if (p.grounded) {
      const cell = image.naturalWidth / 4;
      const column = p.vx ? Math.floor(state.elapsed / .095) % 4 : 0;
      ctx.drawImage(image, column * cell + 14, p.vx ? 360 : 0, cell - 28, p.vx ? 300 : 342, p.x - 29, p.y + p.height - 110, 100, 110);
    } else ctx.drawImage(image, p.x - 50, p.y - 37, 145, 125);
  } else { ctx.fillStyle = "#ad6cdb"; ctx.fillRect(p.x, p.y, p.width, p.height); }
  ctx.restore();
  ctx.restore();
  if (boss.x > cameraX + viewWidth - 30) {
    ctx.fillStyle = "#fff1a2"; ctx.font = "bold 20px sans-serif"; ctx.textAlign = "right";
    ctx.fillText("Papá Noel →", viewWidth - 18, 190); ctx.textAlign = "left";
  }
}
