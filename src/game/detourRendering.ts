import { getImage } from "./assets.ts";
import { detourArtwork, detourCatalog } from "./detours.ts";
import { detourSupports, type DetourClock } from "./detourMechanics.ts";
import type { DetourEntrance, Level } from "./types.ts";

function sprite(context: CanvasRenderingContext2D, column: number, row: number, x: number, y: number, width: number, height: number) {
  const image = getImage(detourArtwork);
  if (image.complete && image.naturalWidth) context.drawImage(image, column * 128, row * 128, 128, 128, x, y, width, height);
  else {
    context.fillStyle = row ? "#d5b77c" : "#75995b";
    context.fillRect(x, y, width, height);
  }
}

export function drawDetourEntrance(context: CanvasRenderingContext2D, entrance: DetourEntrance, cameraX: number, nearby: boolean, elapsed: number, reduceMotion: boolean) {
  const x = entrance.x - cameraX;
  if (x < -200 || x > 1080) return;
  const column = detourCatalog.find((entry) => entry.id === entrance.id)!.icon;
  sprite(context, column, 0, x - 8, entrance.y - 20, entrance.width + 16, entrance.height + 20);
  for (let step = 1; step <= 3; step++) {
    const pulse = reduceMotion ? .8 : .55 + .35 * Math.sin(elapsed * 2 + step);
    context.save();
    context.globalAlpha = pulse;
    sprite(context, entrance.id === "fireflies" ? 0 : column, 1, x - step * 42, entrance.y + entrance.height - 20 - step * 8, 28, 28);
    context.restore();
  }
  if (nearby) {
    context.fillStyle = "#fff3b6";
    context.font = "bold 30px monospace";
    context.textAlign = "center";
    context.fillText("↑", x + entrance.width / 2, entrance.y - 26);
    context.textAlign = "start";
  }
}

export function drawDetourMechanisms(context: CanvasRenderingContext2D, level: Level, clock: DetourClock, cameraX: number, reduceMotion: boolean) {
  if (!level.detour) return;
  context.save();
  if (level.detour === "mine") {
    context.fillStyle = "#58416e";
    context.fillRect(0, 456, 960, 84);
    for (let x = -(cameraX % 80); x < 960; x += 80) {
      context.fillStyle = "#b697d3";
      context.fillRect(x + 2, 456, 76, 8);
      context.fillStyle = "#72538f";
      context.fillRect(x + 4, 467, 72, 30);
      context.fillStyle = "#3f2d55";
      context.fillRect(x + 8, 502, 64, 35);
    }
  }
  if (level.detour === "fireflies") {
    context.fillStyle = "#151e35a0";
    context.fillRect(0, 0, 960, 456);
    for (const [index, platform] of level.platforms.filter((entry) => entry.height === 22).entries()) {
      context.globalAlpha = reduceMotion ? 1 : .45 + .55 * Math.max(0, Math.sin(clock.elapsed * 1.5 - index * .8));
      const x = platform.x + platform.width / 2 - cameraX;
      const bob = reduceMotion ? 0 : Math.sin(clock.elapsed * 1.8 + platform.x) * 9;
      const light = context.createRadialGradient(x, platform.y - 30, 4, x, platform.y - 30, 150);
      light.addColorStop(0, "#e8f9a34d");
      light.addColorStop(1, "#e8f9a300");
      context.fillStyle = light;
      context.fillRect(x - 150, platform.y - 180, 300, 300);
      sprite(context, 0, 1, x - 48, platform.y - 110 + bob, 96, 96);
    }

    context.globalAlpha = 1;
  }
  for (const mechanism of level.mechanisms ?? []) {
    if (mechanism.kind === "wheel" && mechanism.phase === 0) {
      const x = mechanism.x - cameraX;
      context.strokeStyle = "#8b6045";
      context.lineWidth = 12;
      context.beginPath(); context.arc(x, mechanism.y, mechanism.travel, 0, Math.PI * 2); context.stroke();
      for (const support of detourSupports(level, clock).filter((entry) => entry.mechanism.x === mechanism.x)) {
        context.beginPath(); context.moveTo(x, mechanism.y); context.lineTo(support.x + support.width / 2 - cameraX, support.y); context.stroke();
      }
    }
    if (mechanism.kind === "cart") {
      context.strokeStyle = "#a6b6bd";
      context.lineWidth = 5;
      for (const y of [mechanism.y + 58, mechanism.y + 70]) {
        context.beginPath(); context.moveTo(mechanism.x - cameraX, y); context.lineTo(mechanism.x + mechanism.travel + mechanism.width - cameraX, y); context.stroke();
      }
      sprite(context, 1, 0, mechanism.x - cameraX, mechanism.y - 160, 100, 120);
      const cat = getImage("./assets/sprites/world-cat-2-v1.png");
      if (cat.complete && cat.naturalWidth) {
        const x = mechanism.x - cameraX - 150;
        context.drawImage(cat, x, 336, 120, 120);
        context.fillStyle = "#f2c360";
        context.beginPath(); context.ellipse(x + 60, 354, 32, 15, 0, Math.PI, Math.PI * 2); context.fill();
        context.fillRect(x + 25, 352, 70, 7);
        context.fillStyle = "#fff6b3"; context.fillRect(x + 55, 340, 12, 15);
      }
    }
    if (mechanism.kind === "book" && !clock.switches.has("books")) {
      context.globalAlpha = .4;
      sprite(context, 3, 1, mechanism.x - cameraX, mechanism.y, mechanism.width, 65);
      context.globalAlpha = 1;
    }
  }
  for (const support of detourSupports(level, clock)) {
    const kind = support.mechanism.kind;
    const column = kind === "cart" ? 1 : kind === "wheel" ? 2 : kind === "book" ? 3 : 4;
    // Leaf artwork starts above its surface; the cart and books below theirs.
    const y = kind === "leaf" || kind === "vine" ? support.y - 18 : support.y;
    sprite(context, column, 1, support.x - cameraX, y, support.width, kind === "wheel" ? 50 : kind === "cart" ? 85 : 100);
  }
  for (const toggle of level.detourSwitches ?? []) {
    const column = toggle.id === "bell" ? 0 : toggle.id === "books" ? 1 : 2;
    const image = getImage("./assets/atlases/detour-switches-v1.svg");
    if (image.complete && image.naturalWidth) context.drawImage(image, column * 128, 0, 128, 96, toggle.x - cameraX, toggle.y, toggle.width, toggle.height);
    else sprite(context, column + 2, 0, toggle.x - cameraX, toggle.y, toggle.width, toggle.height);
    context.fillStyle = clock.switches.has(toggle.id) ? "#b1f5c0" : "#fff0ac";
    context.font = "bold 25px monospace"; context.textAlign = "center";
    context.fillText("↑", toggle.x + toggle.width / 2 - cameraX, toggle.y - 10);
  }
  context.restore();
}

export function drawDetourScenery(context: CanvasRenderingContext2D, level: Level, cameraX: number) {
  const column = level.detour === "mill" ? 0 : level.detour === "library" ? 1 : level.detour === "garden" ? 2 : -1;
  if (column < 0) return;
  const image = getImage("./assets/worlds/detour-scenes-v1.svg");
  if (!image.complete || !image.naturalWidth) return;
  const offset = cameraX * .15 % 960;
  for (const x of [-offset, 960 - offset]) context.drawImage(image, column * 960, 0, 960, 540, x, 0, 960, 540);
}
