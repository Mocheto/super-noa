import type { Progress } from "./progress.ts";
import type { Level } from "./types.ts";
import { campaignLevels } from "./routes.ts";

export type WorldId = Level["world"];
export const worldArtwork = (world: WorldId) => `./assets/worlds/world-${world}${world <= 5 ? "-hd-v1" : ""}.png`;

export const worldCatalog: Array<{
  id: WorldId; name: string; shortName: string; description: string; cat: string; catAsset: string;
  x: number; y: number;
}> = [
  { id: 1, name: "El Prado de las Manzanas", shortName: "Manzanos", description: "Sol, ramas anchas y manzanas crujientes.", cat: "Miel", catAsset: "./assets/sprites/world-cat-1-v1.png", x: 13, y: 61 },
  { id: 2, name: "El Bosque de los Gatitos", shortName: "Gatitos", description: "Luciérnagas, cristales, murciélagos y una cueva de lava.", cat: "Bruma", catAsset: "./assets/sprites/world-cat-2-v1.png", x: 31, y: 42 },
  { id: 3, name: "El Bosque de los Lobos", shortName: "Lobos", description: "Pinos, luna llena y lobos enfadados.", cat: "Pino", catAsset: "./assets/sprites/world-cat-3-v1.png", x: 51, y: 24 },
  { id: 8, name: "La Laguna de los Corales", shortName: "Laguna", description: "Una poza entre los bosques: peces traviesos, erizos y el palacio de Don Aleta.", cat: "Perla", catAsset: "./assets/sprites/world-cat-8-v1.png", x: 51, y: 70 },
  { id: 4, name: "El Bosque de los Jabalíes", shortName: "Jabalíes", description: "Bellotas, copas altas y jabalíes salvajes.", cat: "Bellota", catAsset: "./assets/sprites/world-cat-4-v1.png", x: 73, y: 34 },
  { id: 5, name: "La Flota de las Nubes", shortName: "Barcos", description: "Barcos voladores, piratas, loros y cañones.", cat: "Nube", catAsset: "./assets/sprites/world-cat-5-v1.png", x: 86, y: 53 },
  { id: 6, name: "El Castillo Encantado", shortName: "Castillo", description: "Un laberinto de piedra, trampas con pinchos y fantasmas traviesos.", cat: "Luna", catAsset: "./assets/sprites/world-cat-6-v1.png", x: 81, y: 79 },
  { id: 7, name: "El Reino Secreto", shortName: "Nubes", description: "Nubes mágicas, pájaros y unicornios en lo más alto del cielo.", cat: "Iris", catAsset: "./assets/sprites/world-cat-7-v1.png", x: 88, y: 12 },
];

export type MapRoute = { from: WorldId; to: WorldId; path: string; branch?: "water" | "secret"; requiresCompletion?: string };

// Coordenadas del lienzo SVG 1000 × 560: la imagen queda libre de caminos y marcadores.
export const mapRoutes: MapRoute[] = [
  { from: 1, to: 2, path: "M 130 342 C 174 318 235 280 310 235" },
  { from: 2, to: 3, path: "M 310 235 C 388 221 422 131 510 134" },
  { from: 3, to: 4, path: "M 510 134 C 595 154 626 205 730 190" },
  { from: 4, to: 5, path: "M 730 190 C 808 202 885 244 860 297" },
  { from: 5, to: 6, path: "M 860 297 C 819 347 794 377 810 442" },
  { from: 3, to: 8, path: "M 510 134 C 564 227 434 282 510 392", branch: "water" },
  { from: 8, to: 4, path: "M 510 392 C 594 340 642 251 730 190", branch: "water", requiresCompletion: "A-3" },
  { from: 4, to: 7, path: "M 730 190 C 807 162 788 70 880 67", branch: "secret" },
];

export function worldAvailable(world: WorldId, progress: Progress): boolean {
  if (world === 7) return progress.secretUnlocked;
  if (world === 8) return progress.waterUnlocked;
  const firstIndex = campaignLevels.findIndex((level) => level.world === world);
  return firstIndex >= 0 && progress.unlocked >= firstIndex;
}

export function mapRouteState(route: MapRoute, progress: Progress): "hidden" | "available" | "open" {
  if (route.branch === "secret" && !progress.secretUnlocked) return "hidden";
  if (route.branch === "water" && route.from === 8 && !progress.waterUnlocked) return "hidden";
  if (route.requiresCompletion && !progress.levelStats[route.requiresCompletion]?.completed) return "available";
  if (worldAvailable(route.to, progress)) return "open";
  return worldAvailable(route.from, progress) ? "available" : "hidden";
}

export type MapJourneyStep = { route: MapRoute; reverse: boolean };

export function findMapJourney(from: WorldId, to: WorldId, progress: Progress): MapJourneyStep[] | null {
  if (from === to) return [];
  if (!worldAvailable(from, progress) || !worldAvailable(to, progress)) return null;
  const queue: Array<{ world: WorldId; steps: MapJourneyStep[] }> = [{ world: from, steps: [] }];
  const visited = new Set<WorldId>([from]);
  for (const entry of queue) {
    for (const route of mapRoutes) {
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
