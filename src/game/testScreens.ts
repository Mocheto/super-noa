import type { Level, Platform } from "./types";

/** Pantallas de prueba de los motores de formato. No forman parte de la campaña: las usan las pruebas y, solo en
 * desarrollo, `?prueba=<nombre>` las abre directamente para revisarlas en el navegador. */

const floor = (x: number, width: number): Platform => ({ x, y: 456, width, height: 120, kind: "castle-ground" });
const wall = (x: number, y: number, width: number, height: number): Platform => ({ x, y, width, height, kind: "castle-wall" });
const ledge = (x: number, y: number, width: number): Platform => ({ x, y, width, height: 24, kind: "castle-ledge" });
/** Columna de piedra sobre cada puerta: junto con la puerta cierra el paso hasta el techo. */
const lintel = (doorX: number) => wall(doorX - 8, -60, 64, 376);

/** Cuatro salas de 960 px, una por tramo: botón de huella; cajón sobre la placa; botones de color para subir a
 * una repisa; y un remate que junta cajón, placa y color. */
export const puzzleRoomsTestLevel: Level = {
  id: "prueba-salas", world: 6, screen: 2,
  title: "Prueba de salas", subtitle: "Cuatro salas para probar los activadores.",
  theme: "haunted-castle", width: 3840, start: { x: 60, y: 398 }, goalX: 3790,
  platforms: [
    floor(0, 3840),
    lintel(880), lintel(1840), lintel(2800), lintel(3600), lintel(3700),
    ledge(2560, 190, 210),
    ledge(3380, 190, 150),
  ],
  enemies: [],
  items: [{ id: "sticker-prueba-salas", kind: "sticker", x: 2572, y: 136 }],
  rewardBlocks: [],
  checkpoints: [],
  beats: { development: 960, twist: 1920, finale: 2880, twistKind: "combine" },
  puzzleRooms: [
    {
      x: 0, entry: { x: 60, y: 398 }, exitDoor: "d1",
      triggers: [{ id: "t1", kind: "paw", x: 420, y: 456, width: 72, opens: "d1" }],
      doors: [{ id: "d1", symbol: "paw", x: 880, y: 316, width: 48, height: 140 }],
    },
    {
      x: 960, entry: { x: 1000, y: 398 }, exitDoor: "d2",
      triggers: [{ id: "t2", kind: "plate", x: 1500, y: 456, width: 92, opens: "d2" }],
      doors: [{ id: "d2", symbol: "star", x: 1840, y: 316, width: 48, height: 140 }],
      crates: [{ id: "c2", x: 1200, y: 456, minX: 1160, maxX: 1520 }],
    },
    {
      x: 1920, entry: { x: 1960, y: 398 }, exitDoor: "d3", startColor: "pink",
      triggers: [
        { id: "t3-blue", kind: "color", color: "blue", x: 2060, y: 456, width: 72 },
        { id: "t3-pink", kind: "color", color: "pink", x: 2160, y: 456, width: 72 },
        { id: "t3", kind: "paw", x: 2650, y: 190, width: 72, opens: "d3" },
      ],
      doors: [{ id: "d3", symbol: "moon", x: 2800, y: 316, width: 48, height: 140 }],
      colorPlatforms: [
        { id: "p3-1", color: "blue", x: 2280, y: 360, width: 140, height: 24 },
        { id: "p3-2", color: "blue", x: 2450, y: 270, width: 120, height: 24 },
        { id: "p3-3", color: "pink", x: 2330, y: 250, width: 120, height: 24 },
      ],
    },
    {
      x: 2880, entry: { x: 2920, y: 398 }, exitDoor: "d4", startColor: "blue",
      triggers: [
        { id: "t4-plate", kind: "plate", x: 3300, y: 456, width: 92, opens: "d4" },
        { id: "t4-pink", kind: "color", color: "pink", x: 3480, y: 456, width: 72 },
        { id: "t4", kind: "paw", x: 3420, y: 190, width: 72, opens: "d5" },
      ],
      doors: [
        { id: "d4", symbol: "star", x: 3600, y: 316, width: 48, height: 140 },
        { id: "d5", symbol: "paw", x: 3700, y: 316, width: 48, height: 140 },
      ],
      colorPlatforms: [
        { id: "p4-1", color: "pink", x: 3180, y: 350, width: 120, height: 24 },
        { id: "p4-2", color: "pink", x: 3260, y: 270, width: 100, height: 24 },
      ],
      crates: [{ id: "c4", x: 2980, y: 456, minX: 2960, maxX: 3320 }],
    },
  ],
};

export const testScreens: Record<string, Level> = { salas: puzzleRoomsTestLevel };
