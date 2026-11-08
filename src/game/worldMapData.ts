import type { Progress } from "./progress.ts";
import type { Level } from "./types.ts";
import { campaignLevels } from "./routes.ts";
import { detourCatalog } from "./detours.ts";
import type { DetourId } from "./types.ts";

export const MAP_WIDTH = 3000;
export const MAP_HEIGHT = 2000;
export const mapLandscape = "./assets/worlds/noa-adventure-map-v2.webp";

export type WorldId = Level["world"];
export const worldArtwork = (world: WorldId) => world === 14
  ? "./assets/worlds/desert-background-v1.webp"
  : world === 15 ? "./assets/worlds/train-background-v1.webp"
    : world === 16 ? "./assets/worlds/music-background-v1.webp"
      : world === 17 ? "./assets/worlds/sky-kingdom-background-v1.webp" : `./assets/worlds/world-${world}${world <= 5 ? "-hd-v1" : ""}.webp`;

export const worldCatalog: Array<{
  id: WorldId; name: string; shortName: string; description: string; cat: string; catAsset: string;
  x: number; y: number;
}> = [
  { id: 1, name: "El Prado de las Manzanas", shortName: "Manzanos", description: "Sol, ramas anchas y manzanas crujientes.", cat: "Miel", catAsset: "./assets/sprites/world-cat-1-v1.png", x: 10, y: 76 },
  { id: 2, name: "El Bosque de los Gatitos", shortName: "Gatitos", description: "Luciérnagas, cristales, murciélagos y una cueva de lava.", cat: "Bruma", catAsset: "./assets/sprites/world-cat-2-v1.png", x: 30, y: 78 },
  { id: 3, name: "El Bosque de los Lobos", shortName: "Lobos", description: "Pinos, luna llena y lobos dormilones que avisan antes de despertar.", cat: "Pino", catAsset: "./assets/sprites/world-cat-3-v1.png", x: 50, y: 81 },
  { id: 8, name: "La Laguna de los Corales", shortName: "Laguna", description: "Una poza entre los bosques: peces traviesos, erizos y el palacio de Don Aleta.", cat: "Perla", catAsset: "./assets/sprites/world-cat-8-v1.png", x: 60, y: 58 },
  { id: 4, name: "El Bosque de los Jabalíes", shortName: "Jabalíes", description: "Bellotas, copas altas y jabalíes salvajes.", cat: "Bellota", catAsset: "./assets/sprites/world-cat-4-v1.png", x: 70, y: 79 },
  { id: 5, name: "La Flota de las Nubes", shortName: "Barcos", description: "Barcos voladores, piratas, loros y cañones.", cat: "Nube", catAsset: "./assets/sprites/world-cat-5-v1.png", x: 90, y: 79 },
  { id: 6, name: "El Castillo Encantado", shortName: "Castillo", description: "Perritos de cobre encadenados, trampas con pinchos y fantasmas traviesos.", cat: "Luna", catAsset: "./assets/sprites/world-cat-6-v1.png", x: 90, y: 52 },
  { id: 9, name: "La Isla de los Dinosaurios", shortName: "Dinosaurios", description: "Selva tropical, agua peligrosa, pequeños t-rex y terodáctilos juguetones.", cat: "Ámbar", catAsset: "./assets/sprites/world-cat-9-v1.png", x: 71, y: 48 },
  { id: 10, name: "El Volcán de los Dragones", shortName: "Dragones", description: "Lava brillante, cristales rojos y pequeños dragones valientes.", cat: "Chispa", catAsset: "./assets/sprites/world-cat-10-v1.png", x: 50, y: 47 },
  { id: 11, name: "El Valle de los Gigantes", shortName: "Gigantes", description: "Flores que abren puentes de pétalos, gotas de rocío y bichitos gigantes.", cat: "Botón", catAsset: "./assets/sprites/world-cat-11-v1.png", x: 29, y: 49 },
  { id: 12, name: "La Montaña de Hielo", shortName: "Hielo", description: "Nieve suave, cuevas azules y caminos muy resbaladizos.", cat: "Copito", catAsset: "./assets/sprites/world-cat-12-v1.png", x: 10, y: 49 },
  { id: 13, name: "El Mundo de Papá Noel", shortName: "Navidad", description: "Nieve, duendes, juguetes y regalos para repartir.", cat: "Estrella", catAsset: "./assets/sprites/world-cat-13-v1.png", x: 11, y: 20 },
  { id: 14, name: "El Desierto de los Espejismos", shortName: "Desierto", description: "Dunas, oasis, géiseres de arena y ruinas doradas.", cat: "Duna", catAsset: "./assets/sprites/world-cat-14-v1.png", x: 30, y: 20 },
  { id: 15, name: "El Tren de las Estaciones", shortName: "Tren", description: "Andenes, vagones veloces, vapor y una locomotora alegre.", cat: "Vía", catAsset: "./assets/sprites/world-cat-15-v1.png", x: 51, y: 20 },
  { id: 16, name: "El Reino de la Música", shortName: "Música", description: "Tambores, campanas, ondas musicales y un gran teatro brillante.", cat: "Tempo", catAsset: "./assets/sprites/world-cat-16-v1.png", x: 70, y: 21 },
  { id: 17, name: "El Reino Celeste", shortName: "Celeste", description: "Un ascenso vertical por nubes mágicas hasta la puerta de las estrellas.", cat: "Celeste", catAsset: "./assets/sprites/world-cat-17-v1.png", x: 89, y: 20 },
  { id: 7, name: "El Reino Secreto", shortName: "Secreto", description: "Nubes mágicas y columnas de aire para subir junto a pájaros y unicornios.", cat: "Iris", catAsset: "./assets/sprites/world-cat-7-v1.png", x: 78, y: 93 },
];

export type MapRoute = { from: WorldId; to: WorldId; path: string; branch?: "water" | "secret"; requiresCompletion?: string; detour?: DetourId };

// Geometría del lienzo 3000 × 2000. Los caminos se superponen al paisaje.
export const mapRoutes: MapRoute[] = [
  { from: 1, to: 2, path: "M 300 1520 C 600 1520 600 1560 900 1560" },
  { from: 2, to: 3, path: "M 900 1560 C 1200 1560 1200 1620 1500 1620" },
  { from: 3, to: 4, path: "M 1500 1620 C 1800 1620 1800 1580 2100 1580" },
  { from: 4, to: 5, path: "M 2100 1580 C 2400 1580 2400 1580 2700 1580" },
  { from: 5, to: 6, path: "M 2700 1580 C 2560 1580 2560 1040 2700 1040" },
  { from: 6, to: 9, path: "M 2700 1040 C 2415 1040 2415 960 2130 960" },
  { from: 9, to: 10, path: "M 2130 960 C 1815 960 1815 940 1500 940" },
  { from: 10, to: 11, path: "M 1500 940 C 1185 940 1185 980 870 980" },
  { from: 11, to: 12, path: "M 870 980 C 585 980 585 980 300 980" },
  { from: 12, to: 13, path: "M 300 980 C 80 980 80 400 330 400" },
  { from: 13, to: 14, path: "M 330 400 C 615 400 615 400 900 400" },
  { from: 14, to: 15, path: "M 900 400 C 1215 400 1215 400 1530 400" },
  { from: 15, to: 16, path: "M 1530 400 C 1815 400 1815 420 2100 420" },
  { from: 16, to: 17, path: "M 2100 420 C 2385 420 2385 400 2670 400" },
  { from: 3, to: 8, path: "M 1500 1620 C 1650 1620 1650 1160 1800 1160", branch: "water" },
  { from: 8, to: 4, path: "M 1800 1160 C 1950 1160 1950 1580 2100 1580", branch: "water", requiresCompletion: "A-3" },
  { from: 4, to: 7, path: "M 2100 1580 C 2220 1580 2220 1860 2340 1860", branch: "secret" },
];

export function worldAvailable(world: WorldId, progress: Progress): boolean {
  if (world === 7) return progress.secretUnlocked;
  if (world === 8) return progress.waterUnlocked;
  const firstIndex = campaignLevels.findIndex((level) => level.world === world);
  return firstIndex >= 0 && progress.unlocked >= firstIndex;
}

export function mapRouteState(route: MapRoute, progress: Progress): "hidden" | "available" | "open" {
  if (route.detour) return progress.detours?.[route.detour]?.completed && worldAvailable(route.from, progress) && worldAvailable(route.to, progress) ? "open" : "hidden";
  if (route.branch === "secret" && !progress.secretUnlocked) return "hidden";
  if (route.branch === "water" && route.from === 8 && !progress.waterUnlocked) return "hidden";
  if (route.requiresCompletion && !progress.levelStats[route.requiresCompletion]?.completed) return "available";
  if (worldAvailable(route.to, progress)) return "open";
  return worldAvailable(route.from, progress) ? "available" : "hidden";
}

export type MapJourneyStep = { route: MapRoute; reverse: boolean };
export const shortcutRoutes: MapRoute[] = detourCatalog.flatMap((detour) => detour.shortcut ? [{ ...detour.shortcut, detour: detour.id }] : []);

export function findMapJourney(from: WorldId, to: WorldId, progress: Progress): MapJourneyStep[] | null {
  if (from === to) return [];
  if (!worldAvailable(from, progress) || !worldAvailable(to, progress)) return null;
  const queue: Array<{ world: WorldId; steps: MapJourneyStep[] }> = [{ world: from, steps: [] }];
  const visited = new Set<WorldId>([from]);
  for (const entry of queue) {
    // Prefer unlocked shortcuts when several routes join the same worlds.
    for (const route of [...shortcutRoutes, ...mapRoutes]) {
      if (mapRouteState(route, progress) !== "open") continue;
      const reverse = route.to === entry.world;
      if (!reverse && route.from !== entry.world) continue;
      const next = reverse ? route.from : route.to;
      if (visited.has(next)) continue;
      const steps = [...entry.steps, { route, reverse }];
      if (next === to) return steps;
      visited.add(next);
      queue.push({ world: next, steps });
    }
  }
  return null;
}
