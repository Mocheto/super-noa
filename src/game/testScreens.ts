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

const meadow = (x: number, width: number): Platform => ({ x, y: 456, width, height: 120, kind: "ground" });
const branch = (x: number, y: number, width: number): Platform => ({ x, y, width, height: 22, kind: "branch" });

/** Persecución de prueba en el prado: un escarabajo con el ovillo, nueve paradas y el rincón junto al borde. */
export const chaseTestLevel: Level = {
  id: "prueba-persecucion", world: 1, screen: 2,
  title: "Prueba de persecución", subtitle: "Pilla al escarabajo del ovillo.",
  theme: "orchard-day", width: 5400, start: { x: 80, y: 398 }, goalX: 5250,
  platforms: [meadow(0, 1800), meadow(1940, 800), meadow(2880, 1000), meadow(4020, 1380), branch(3000, 360, 170), branch(3220, 270, 170), branch(3450, 190, 200)],
  enemies: [],
  items: [{ id: "sticker-prueba-persecucion", kind: "sticker", x: 3520, y: 130 }],
  rewardBlocks: [],
  checkpoints: [1000, 2950, 4100],
  chase: {
    runner: "beetle", carries: "yarn",
    stops: [
      { x: 650, y: 456, talk: "¡Ji, ji! ¡No me pillas!", beat: "presentation" },
      { x: 1400, y: 456, talk: "¡Por aquí!", beat: "presentation" },
      { x: 2250, y: 456, jump: true, talk: "¡Qué salto!", beat: "development" },
      { x: 2950, y: 456, jump: true, talk: "¡Uy, el agua!", beat: "development" },
      { x: 3060, y: 360, jump: true, talk: "¡Sube, sube!", beat: "twist" },
      { x: 3290, y: 270, jump: true, talk: "¡Más arriba!", beat: "twist" },
      { x: 3540, y: 190, jump: true, talk: "¡Desde aquí lo veo todo!", beat: "twist" },
      { x: 4300, y: 456, jump: true, talk: "¡Casi, casi!", beat: "finale" },
      { x: 5250, y: 456, talk: "¡Ay! ¡No hay salida!", beat: "finale" },
    ],
  },
};

const rock = (x: number, y: number, width: number): Platform => ({ x, y, width, height: 24, kind: "volcano-ledge" });

/** Subida de prueba por la chimenea de un volcán: repisas en zigzag, chorros de lava al compás, cajas que se
 * golpean desde abajo, un dragoncito y checkpoints verticales. */
export const verticalTestLevel: Level = {
  id: "prueba-vertical", world: 10, screen: 2,
  title: "Prueba de subida", subtitle: "Sube por la chimenea del volcán.",
  theme: "dragon-volcano", width: 960, height: 2400, orientation: "vertical",
  start: { x: 120, y: 2282 }, goalX: 480, goalY: 175,
  platforms: [
    { x: 0, y: 2340, width: 960, height: 120, kind: "volcano-ground" },
    rock(80, 2200, 220), rock(420, 2090, 200), rock(700, 1980, 200), rock(420, 1860, 220), rock(110, 1740, 220),
    rock(380, 1620, 200), rock(660, 1500, 220), rock(380, 1380, 200), rock(100, 1260, 220), rock(400, 1140, 200),
    rock(690, 1020, 210), rock(420, 900, 200), rock(140, 780, 210), rock(430, 660, 200), rock(700, 540, 200),
    rock(430, 420, 200), rock(360, 300, 240), rock(330, 175, 300),
  ],
  lavaJets: [
    { id: "pv-j1", x: 640, baseY: 2340, width: 54, height: 260, interval: 2.6, delay: 0 },
    { id: "pv-j2", x: 260, baseY: 1740, width: 54, height: 200, interval: 2.4, delay: .8 },
  ],
  enemies: [{ id: "pv-d1", kind: "baby-dragon", x: 450, y: 1814, width: 42, height: 46, minX: 430, maxX: 590, speed: 40 }],
  items: [
    { id: "pv-a1", kind: "apple", x: 480, y: 2030 },
    { id: "pv-a2", kind: "apple", x: 170, y: 1690 },
    { id: "sticker-prueba-vertical", kind: "sticker", x: 470, y: 600 },
  ],
  rewardBlocks: [{ id: "pv-r1", x: 180, y: 2050, reward: "cat" }, { id: "pv-r2", x: 480, y: 1230, reward: "apple" }],
  checkpoints: [],
  verticalCheckpoints: [{ x: 460, y: 1620 }, { x: 460, y: 900 }],
};

export const testScreens: Record<string, Level> = { salas: puzzleRoomsTestLevel, persecucion: chaseTestLevel, vertical: verticalTestLevel };
