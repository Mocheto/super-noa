import type { DetourId, Level, Platform } from "./types.ts";

export const detourArtwork = "./assets/atlases/secret-detours-v1.svg";
export const detourCatalog: Array<{
  id: DetourId; title: string; shortName: string; source: string; world: Level["world"];
  x: number; y: number; path: string; icon: number;
  shortcut?: { from: Level["world"]; to: Level["world"]; path: string };
}> = [
  { id: "fireflies", title: "El sendero de las luciérnagas", shortName: "Luciérnagas", source: "2-1", world: 2, x: 26, y: 23,
    path: "M 310 235 Q 240 208 260 129", icon: 0,
    shortcut: { from: 1, to: 3, path: "M 130 342 C 65 200 170 90 260 129 Q 370 65 510 134" } },
  { id: "mine", title: "El túnel del gatito minero", shortName: "Túnel minero", source: "2-2", world: 2, x: 40, y: 52,
    path: "M 310 235 Q 325 295 400 291", icon: 1,
    shortcut: { from: 2, to: 6, path: "M 310 235 Q 325 295 400 291 C 560 310 665 408 830 431" } },
  { id: "mill", title: "El molino de las manzanas", shortName: "Molino", source: "1-1", world: 1, x: 13, y: 38,
    path: "M 130 342 Q 180 275 130 213", icon: 2 },
  { id: "library", title: "La biblioteca de las patitas", shortName: "Biblioteca", source: "6-1", world: 6, x: 94, y: 69,
    path: "M 830 431 Q 920 460 940 386", icon: 3 },
  { id: "garden", title: "El jardín de los gigantes", shortName: "Jardín", source: "11-1", world: 11, x: 23, y: 92,
    path: "M 320 442 Q 310 503 230 515", icon: 4 },
];

const floor = (kind: Platform["kind"], width: number): Platform => ({ x: 0, y: 456, width, height: 120, kind });
const ledge = (x: number, y: number, width: number, kind: Platform["kind"]): Platform => ({ x, y, width, height: 22, kind });

// Separate from campaign ordering, medals, stickers and guardian unlocks.
export const detourLevels: Level[] = [
  {
    id: "D-fireflies", detour: "fireflies", world: 2, screen: 1,
    title: "El sendero de las luciérnagas", subtitle: "Sigue las luces. Siempre puedes volver por donde has venido.",
    theme: "forest-night", width: 2400, start: { x: 90, y: 398 }, goalX: 2260,
    platforms: [floor("ground", 2400), ledge(380, 370, 180, "stone"), ledge(680, 300, 180, "stone"),
      ledge(980, 240, 180, "stone"), ledge(1280, 300, 180, "stone"), ledge(1580, 365, 180, "stone"), ledge(1910, 330, 180, "stone")],
    items: [{ id: "firefly-apple-1", kind: "apple", x: 735, y: 252 }, { id: "firefly-apple-2", kind: "apple", x: 1035, y: 192 },
      { id: "firefly-apple-3", kind: "apple", x: 1630, y: 317 }],
    enemies: [], rewardBlocks: [], checkpoints: [],
  },
  {
    id: "D-mine", detour: "mine", world: 2, screen: 1,
    title: "El túnel del gatito minero", subtitle: "Sube a la vagoneta y salta entre los cristales.",
    theme: "crystal-cave", width: 2700, start: { x: 90, y: 398 }, goalX: 2540,
    platforms: [floor("cave-ground", 2700), ledge(310, 380, 160, "cave-ledge"), ledge(950, 280, 190, "cave-ledge"),
      ledge(1580, 265, 190, "cave-ledge"), ledge(2260, 345, 180, "cave-ledge")],
    mechanisms: [{ id: "mine-cart", kind: "cart", x: 430, y: 372, width: 150, height: 28, travel: 1740, period: 22, phase: 0 }],
    items: [{ id: "mine-apple-1", kind: "apple", x: 1010, y: 230 }, { id: "mine-apple-2", kind: "apple", x: 1640, y: 215 }],
    enemies: [], rewardBlocks: [], checkpoints: [],
  },
  {
    id: "D-mill", detour: "mill", world: 1, screen: 1,
    title: "El molino de las manzanas", subtitle: "La campana cambia el giro de las ruedas.",
    theme: "orchard-day", width: 2500, start: { x: 90, y: 398 }, goalX: 2340,
    platforms: [floor("ground", 2500), ledge(340, 355, 170, "branch"), ledge(1250, 235, 220, "branch"), ledge(2070, 340, 190, "branch")],
    mechanisms: [0, 1, 2, 3].flatMap((phase) => [
      { id: `mill-left-${phase}`, kind: "wheel" as const, x: 820, y: 310, width: 140, height: 22, travel: 120, period: 12, phase: phase * Math.PI / 2 },
      { id: `mill-right-${phase}`, kind: "wheel" as const, x: 1750, y: 310, width: 140, height: 22, travel: 120, period: 12, phase: phase * Math.PI / 2 },
    ]),
    detourSwitches: [{ id: "bell", x: 360, y: 285, width: 80, height: 70 }],
    items: [{ id: "mill-apple-1", kind: "apple", x: 1300, y: 185 }, { id: "mill-apple-2", kind: "apple", x: 1410, y: 185 }],
    enemies: [], rewardBlocks: [], checkpoints: [],
  },
  {
    id: "D-library", detour: "library", world: 6, screen: 1,
    title: "La biblioteca de las patitas", subtitle: "Las patitas abren los libros y dibujan un puente.",
    theme: "haunted-castle", width: 2400, start: { x: 90, y: 398 }, goalX: 2240,
    platforms: [floor("castle-ground", 2400), ledge(330, 350, 190, "castle-ledge"), ledge(1690, 230, 220, "castle-ledge"),
      ledge(2010, 345, 180, "castle-ledge")],
    mechanisms: [0, 1, 2, 3].map((index) => ({ id: `library-book-${index}`, kind: "book", x: 590 + index * 265,
      y: 320 - index * 30, width: 220, height: 22, travel: 0, period: 1, phase: 0 })),
    detourSwitches: [{ id: "books", x: 370, y: 280, width: 80, height: 70 }],
    items: [{ id: "library-apple", kind: "apple", x: 1770, y: 180 }],
    enemies: [], rewardBlocks: [], checkpoints: [],
  },
  {
    id: "D-garden", detour: "garden", world: 11, screen: 1,
    title: "El jardín de los gigantes", subtitle: "Las hojas bajan con tu peso. El agua despierta la planta.",
    theme: "giant-valley", width: 2600, start: { x: 90, y: 398 }, goalX: 2440,
    platforms: [floor("garden-ground", 2600), ledge(300, 355, 180, "garden-ledge"),
      ledge(1730, 195, 230, "garden-ledge"), ledge(2150, 335, 180, "garden-ledge")],
    mechanisms: [
      { id: "garden-leaf-1", kind: "leaf", x: 580, y: 300, width: 190, height: 22, travel: 100, period: 1, phase: 0 },
      { id: "garden-leaf-2", kind: "leaf", x: 890, y: 255, width: 190, height: 22, travel: 110, period: 1, phase: 0 },
      { id: "garden-vine", kind: "vine", x: 1370, y: 420, width: 190, height: 22, travel: 210, period: 1, phase: 0 },
    ],
    detourSwitches: [{ id: "water", x: 1150, y: 386, width: 80, height: 70 }],
    items: [{ id: "garden-apple-1", kind: "apple", x: 950, y: 205 }, { id: "garden-apple-2", kind: "apple", x: 1820, y: 145 }],
    enemies: [], rewardBlocks: [], checkpoints: [],
  },
];

export function detourLevel(id: DetourId): Level {
  return detourLevels.find((level) => level.detour === id)!;
}
