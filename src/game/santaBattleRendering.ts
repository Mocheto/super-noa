import { getImage } from "./assets";
import { actionBossBackgrounds, santaBattleAssets, santaGiftSource, santaSpriteFrames, santaTerrainSources } from "./santaBattleAssets";
import { SANTA_ARENA, SANTA_PLATFORMS, type SantaBattle } from "./santaBattle";
import type { BossId } from "./types";

type PlatformBossId = Extract<BossId, "santa-claus" | "siroco" | "don-silbato">;

export function drawSantaBattle(ctx: CanvasRenderingContext2D, state: SantaBattle, bossId: PlatformBossId = "santa-claus") {
  const { width, height, floor } = SANTA_ARENA;
  const viewWidth = ctx.canvas.width;
  const cameraX = Math.max(0, Math.min(width - viewWidth, state.player.x - viewWidth * .4));
  ctx.save(); ctx.translate(-cameraX, 0);
  const background = getImage(actionBossBackgrounds[bossId]);
  ctx.fillStyle = bossId === "siroco" ? "#d79b4d" : bossId === "don-silbato" ? "#6faed2" : "#284365"; ctx.fillRect(0, 0, width, height);
  if (background.complete && background.naturalWidth) ctx.drawImage(background, 0, 0, width, height);
  ctx.fillStyle = "rgba(22,26,48,.1)"; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#fff6d2";
  for (let i = 0; i < 40; i++) {
    const x = (i * 131 + 27) % width, y = (i * 79 + state.elapsed * 12) % (floor - 25);
    ctx.fillRect(x, y, 3, 3);
  }
  const terrain = getImage(santaBattleAssets.terrain);
  for (const support of [...SANTA_PLATFORMS, { x: 0, y: floor, width, height: height - floor }]) {
    const ground = support.y === floor;
    if (terrain.complete && terrain.naturalWidth) {
      const [sx, sy, sw, sh] = santaTerrainSources[ground ? "ground" : "ledge"];
      const tileWidth = ground ? 384 : support.width;
      for (let offset = 0; offset < support.width; offset += tileWidth) {
        const drawnWidth = Math.min(tileWidth, support.width - offset);
        ctx.drawImage(terrain, sx, sy, sw * drawnWidth / tileWidth, sh, support.x + offset, support.y, drawnWidth, ground ? support.height : 40);
      }
    } else {
      ctx.fillStyle = "#876447"; ctx.fillRect(support.x, support.y, support.width, support.height);
      ctx.fillStyle = "#fff6e7"; ctx.fillRect(support.x, support.y, support.width, 7);
    }
  }
  const sheet = getImage(bossId === "santa-claus" ? santaBattleAssets.characters : `./assets/sprites/boss-${bossId === "siroco" ? "siroco" : "don-silbato"}-sheet-v1.png`);
  for (const gift of state.gifts) {
    if (bossId === "santa-claus" && sheet.complete && sheet.naturalWidth) ctx.drawImage(sheet, ...santaGiftSource, gift.x, gift.y, gift.width, gift.height);
    else {
      ctx.fillStyle = bossId === "siroco" ? "#d49a43" : "#a74a42";
      if (bossId === "siroco") { ctx.beginPath(); ctx.arc(gift.x + gift.width / 2, gift.y + gift.height / 2, gift.width / 2, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.fillRect(gift.x, gift.y, gift.width, gift.height); ctx.fillStyle = "#f0c85b"; ctx.fillRect(gift.x + 12, gift.y, 6, gift.height); }
    }
  }
  const boss = state.boss;
  const pose = state.status === "won" ? 4 : boss.stun > 0 ? 3 : boss.attackIn < .65 ? 1 : boss.attackIn > 2.55 && state.elapsed > 3 ? 2 : 0;
  const sprite = santaSpriteFrames[pose];
  const [sx, sy, sw, sh] = sprite.source;
  const scale = 132 / sprite.bodyHeight;
  if (sheet.complete && sheet.naturalWidth && bossId === "santa-claus") {
    ctx.save();
    // The atlas faces left. Face the player when he approaches from the right.
    const center = boss.x + boss.width / 2;
    ctx.translate(center, 0);
    if (state.player.x > center) ctx.scale(-1, 1);
    ctx.drawImage(sheet, sx, sy, sw, sh, (sx - sprite.anchorX) * scale, boss.y + boss.height - sh * scale, sw * scale, sh * scale);
    ctx.restore();
  } else if (sheet.complete && sheet.naturalWidth) {
    const cellWidth = sheet.naturalWidth / 5;
    ctx.save();
    const center = boss.x + boss.width / 2;
    ctx.translate(center, 0);
    if (state.player.x > center) ctx.scale(-1, 1);
    ctx.drawImage(sheet, pose * cellWidth, 0, cellWidth, sheet.naturalHeight, -72, boss.y - 10, 144, boss.height + 18);
    ctx.restore();
  } else { ctx.fillStyle = "#bd3047"; ctx.fillRect(boss.x, boss.y, boss.width, boss.height); }
  if (boss.attackIn < .65 && !boss.stun && state.status === "playing") {
    ctx.fillStyle = "#fff1a2"; ctx.font = "bold 24px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(bossId === "siroco" ? "¡Va la arena!" : bossId === "don-silbato" ? "¡Va una maleta!" : "¡Va un regalo!", boss.x + boss.width / 2, boss.y - 30);
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
    ctx.fillText(`${bossId === "siroco" ? "Siroco" : bossId === "don-silbato" ? "Don Silbato" : "Papá Noel"} →`, viewWidth - 18, 190); ctx.textAlign = "left";
  }
}
