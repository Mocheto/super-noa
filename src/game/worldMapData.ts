import type { Progress } from "./progress.ts";
import type { Level } from "./types.ts";
import { campaignLevels } from "./routes.ts";
import { detourCatalog } from "./detours.ts";
import type { DetourId } from "./types.ts";

export type WorldId = Level["world"];
export const worldArtwork = (world: WorldId) => `./assets/worlds/world-${world}${world <= 5 ? "-hd-v1" : ""}.png`;

export const worldCatalog: Array<{
  id: WorldId; name: string; shortName: string; description: string; cat: string; catAsset: string;
  x: number; y: number;
}> = [
  { id: 1, name: "El Prado de las Manzanas", shortName: "Manzanos", description: "Sol, ramas anchas y manzanas crujientes.", cat: "Miel", catAsset: "./assets/sprites/world-cat-1-v1.png", x: 13, y: 61 },
  { id: 2, name: "El Bosque de los Gatitos", shortName: "Gatitos", description: "Luciérnagas, cristales, murciélagos y una cueva de lava.", cat: "Bruma", catAsset: "./assets/sprites/world-cat-2-v1.png", x: 31, y: 42 },
  { id: 3, name: "El Bosque de los Lobos", shortName: "Lobos", description: "Pinos, luna llena y lobos dormilones que avisan antes de despertar.", cat: "Pino", catAsset: "./assets/sprites/world-cat-3-v1.png", x: 51, y: 24 },
  { id: 8, name: "La Laguna de los Corales", shortName: "Laguna", description: "Una poza entre los bosques: peces traviesos, erizos y el palacio de Don Aleta.", cat: "Perla", catAsset: "./assets/sprites/world-cat-8-v1.png", x: 51, y: 70 },
  { id: 4, name: "El Bosque de los Jabalíes", shortName: "Jabalíes", description: "Bellotas, copas altas y jabalíes salvajes.", cat: "Bellota", catAsset: "./assets/sprites/world-cat-4-v1.png", x: 73, y: 34 },
  { id: 5, name: "La Flota de las Nubes", shortName: "Barcos", description: "Barcos voladores, piratas, loros y cañones.", cat: "Nube", catAsset: "./assets/sprites/world-cat-5-v1.png", x: 86, y: 53 },
  { id: 6, name: "El Castillo Encantado", shortName: "Castillo", description: "Perritos de cobre encadenados, trampas con pinchos y fantasmas traviesos.", cat: "Luna", catAsset: "./assets/sprites/world-cat-6-v1.png", x: 83, y: 77 },
  { id: 9, name: "La Isla de los Dinosaurios", shortName: "Dinosaurios", description: "Selva tropical, agua peligrosa, pequeños t-rex y terodáctilos juguetones.", cat: "Ámbar", catAsset: "./assets/sprites/world-cat-9-v1.png", x: 71, y: 84 },
  { id: 10, name: "El Volcán de los Dragones", shortName: "Dragones", description: "Lava brillante, cristales rojos y pequeños dragones valientes.", cat: "Chispa", catAsset: "./assets/sprites/world-cat-10-v1.png", x: 51, y: 82 },
  { id: 11, name: "El Valle de los Gigantes", shortName: "Gigantes", description: "Flores que abren puentes de pétalos, gotas de rocío y bichitos gigantes.", cat: "Botón", catAsset: "./assets/sprites/world-cat-11-v1.png", x: 32, y: 79 },
  { id: 12, name: "La Montaña de Hielo", shortName: "Hielo", description: "Nieve suave, cuevas azules y caminos muy resbaladizos.", cat: "Copito", catAsset: "./assets/sprites/world-cat-12-v1.png", x: 10, y: 80 },
  { id: 7, name: "El Reino Secreto", shortName: "Nubes", description: "Nubes mágicas y columnas de aire para subir junto a pájaros y unicornios.", cat: "Iris", catAsset: "./assets/sprites/world-cat-7-v1.png", x: 88, y: 12 },
];

export type MapRoute = { from: WorldId; to: WorldId; path: string; branch?: "water" | "secret"; requiresCompletion?: string; detour?: DetourId };

// Coordenadas del lienzo SVG 1000 × 560: la imagen queda libre de caminos y marcadores.
export const mapRoutes: MapRoute[] = [
  { from: 1, to: 2, path: "M 130 342 C 174 318 235 280 310 235" },
  { from: 2, to: 3, path: "M 310 235 C 388 221 422 131 510 134" },
  { from: 3, to: 4, path: "M 510 134 C 595 154 626 205 730 190" },
  { from: 4, to: 5, path: "M 730 190 C 808 202 885 244 860 297" },
  { from: 5, to: 6, path: "M 860 297 C 825 350 808 385 830 431" },
  { from: 6, to: 9, path: "M 830 431 C 804 463 756 478 710 470" },
  { from: 9, to: 10, path: "M 710 470 C 650 493 575 480 510 459" },
  { from: 10, to: 11, path: "M 510 459 C 448 445 382 440 320 442" },
  { from: 11, to: 12, path: "M 320 442 C 244 430 168 438 100 448" },
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
