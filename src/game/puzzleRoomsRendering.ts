import { getImage } from "./assets.ts";
import { BUTTON_STEP, CRATE_SIZE, buttonRect, colorBeatProgress, plateWeighed, roomColor, type PuzzleState } from "./puzzleRooms.ts";
import type { Level, PuzzleTrigger } from "./types";

export const PUZZLE_ATLAS = "./assets/atlases/puzzle-pieces-v1.webp";

/** Recortes del atlas `puzzle-pieces-v1` ([x, y, ancho, alto], en píxeles del archivo, a 2 × de la pantalla).
 * Salen de `docs/art/variedad-v1-recortes.json`; una prueba comprueba que coinciden. */
export const PUZZLE_PIECES = {
  "paw-button-up": [4, 4, 144, 133], "plate-up": [152, 4, 144, 120], "pink-button-up": [300, 4, 144, 133],
  "blue-button-up": [448, 4, 144, 133], "paw-button-down": [596, 4, 162, 141], "plate-down": [762, 4, 179, 154],
  "pink-button-down": [4, 166, 158, 141], "blue-button-down": [166, 166, 157, 141], "door-closed": [327, 166, 212, 280],
  "door-open": [543, 166, 205, 280], "emblem-paw": [752, 166, 64, 65], "emblem-star": [820, 166, 64, 64],
  "emblem-moon": [888, 166, 64, 65], crate: [4, 454, 192, 195], "platform-pink-left": [200, 454, 40, 48],
  "platform-pink-middle": [244, 454, 188, 48], "platform-pink-right": [436, 454, 40, 48], "platform-blue-left": [480, 454, 41, 48],
  "platform-blue-middle": [525, 454, 135, 48], "platform-blue-right": [664, 454, 41, 48],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export type PuzzlePiece = keyof typeof PUZZLE_PIECES;
export type SparkTrail = { from: { x: number; y: number }; to: { x: number; y: number }; life: number };

function piece(context: CanvasRenderingContext2D, image: HTMLImageElement, name: PuzzlePiece, x: number, y: number, width: number, height: number) {
  const [sx, sy, sw, sh] = PUZZLE_PIECES[name];
  context.drawImage(image, sx, sy, sw, sh, Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

/** Dibuja un pedestal de botón: la mitad de abajo queda hundida en el suelo y asoma el pedestal y el botón. */
function drawButton(context: CanvasRenderingContext2D, image: HTMLImageElement, trigger: PuzzleTrigger, pressed: boolean, cameraX: number) {
  const kind = trigger.kind === "paw" ? "paw" : trigger.color === "blue" ? "blue" : "pink";
  const name = `${kind}-button-${pressed ? "down" : "up"}` as PuzzlePiece;
  const [, , sw, sh] = PUZZLE_PIECES[name];
  const scale = trigger.width / 144;
  const width = sw * scale;
  const height = sh * scale;
  const top = buttonRect(trigger).y;
  const x = trigger.x + trigger.width / 2 - width / 2 - cameraX;
  // La cúpula pulsada queda más abajo en su dibujo: se sube para que Noa la pise sin flotar.
  piece(context, image, name, x, top - (pressed ? 18 : 8), width, height);
}

function drawPlate(context: CanvasRenderingContext2D, image: HTMLImageElement, trigger: PuzzleTrigger, pressed: boolean, cameraX: number) {
  // La placa se dibuja aplastada, como una losa del suelo; al pesar algo encima se hunde.
  const height = 26;
  piece(context, image, pressed ? "plate-down" : "plate-up", trigger.x - cameraX, trigger.y - (pressed ? 8 : 14), trigger.width, height);
}

function drawColorPlatform(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, color: "pink" | "blue", solid: boolean, ghostAlpha = .5) {
  const cap = 20;
  context.save();
  context.globalAlpha = solid ? 1 : ghostAlpha;
  piece(context, image, `platform-${color}-left`, x, y, cap, 24);
  const [, , mw] = PUZZLE_PIECES[`platform-${color}-middle`];
  const tile = mw / 2;
  for (let left = x + cap; left < x + width - cap; left += tile) {
    const w = Math.min(tile, x + width - cap - left);
    const [sx, sy, , sh] = PUZZLE_PIECES[`platform-${color}-middle`];
    context.drawImage(image, sx, sy, w * 2, sh, Math.round(left), Math.round(y), Math.ceil(w), 24);
  }
  piece(context, image, `platform-${color}-right`, x + width - cap, y, cap, 24);
  if (!solid) {
    context.strokeStyle = color === "pink" ? "#ef79a9" : "#5aa0dc";
    context.setLineDash([8, 6]);
    context.lineWidth = 2;
    context.strokeRect(Math.round(x) + 1, Math.round(y) + 1, Math.round(width) - 2, 22);
  }
  context.restore();
}

/** Dibuja las piezas de todas las salas visibles y las chispas que viajan de un activador a su puerta. */
export function drawPuzzleRooms(context: CanvasRenderingContext2D, level: Level, state: PuzzleState, cameraX: number, sparks: readonly SparkTrail[], frame: number, now = 0) {
  const image = getImage(PUZZLE_ATLAS);
  if (!image.complete || !image.naturalWidth) return;
  (level.puzzleRooms ?? []).forEach((room, index) => {
    if (room.x - cameraX > 1000 || room.x - cameraX < -1000) return;
    const active = roomColor(level, state, index, now);
    // Al compás, las plataformas que van a aparecer se encienden poco a poco antes del cambio.
    const warning = room.colorBeat ? Math.max(0, colorBeatProgress(room, now) - .7) / .3 : 0;
    for (const platform of room.colorPlatforms ?? []) {
      drawColorPlatform(context, image, platform.x - cameraX, platform.y, platform.width, platform.color, platform.color === active, .5 + warning * .35);
    }
    for (const door of room.doors) {
      const open = state.openDoors.has(door.id);
      const width = door.height * 212 / 280;
      const x = door.x + door.width / 2 - width / 2 - cameraX;
      const top = door.y;
      piece(context, image, open ? "door-open" : "door-closed", x, top, width, door.height);
      if (!open) {
        const size = door.height * .2;
        piece(context, image, `emblem-${door.symbol}`, door.x + door.width / 2 - size / 2 - cameraX, top + door.height * .17, size, size);
      }
    }
    for (const trigger of room.triggers) {
      if (trigger.kind === "plate") {
        const crates = state.crates.filter((crate) => crate.room === index);
        drawPlate(context, image, trigger, plateWeighed(trigger, crates, null) || state.openDoors.has(trigger.opens ?? ""), cameraX);
      } else {
        const pressed = trigger.kind === "paw" ? state.pressedPaws.has(trigger.id) : trigger.color === roomColor(level, state, index, now);
        drawButton(context, image, trigger, pressed, cameraX);
      }
      const door = room.doors.find((d) => d.id === trigger.opens);
      if (door) {
        // Activador y puerta comparten emblema: se dibuja pequeño sobre el activador.
        const size = 22;
        piece(context, image, `emblem-${door.symbol}`, trigger.x + trigger.width / 2 - size / 2 - cameraX, trigger.y - BUTTON_STEP - 46 + Math.sin(frame / 18) * 2, size, size);
      }
    }
  });
  for (const crate of state.crates) piece(context, image, "crate", crate.x - cameraX, crate.y - CRATE_SIZE, CRATE_SIZE, CRATE_SIZE * 195 / 192);
  for (const spark of sparks) {
    const steps = 9;
    const head = 1 - spark.life;
    for (let i = 0; i < steps; i += 1) {
      const t = Math.min(1, head * 1.4 - i * .06);
      if (t <= 0) continue;
      const x = spark.from.x + (spark.to.x - spark.from.x) * t - cameraX;
      const y = spark.from.y + (spark.to.y - spark.from.y) * t - Math.sin(t * Math.PI) * 40;
      context.fillStyle = i % 2 ? "#fff3a5" : "#ffd76a";
      context.fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6);
    }
  }
}
