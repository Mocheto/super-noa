import type { Level } from "./types";
import { worldCatalog } from "./worldMapData.ts";

export const secretShopCatSets = [
  { world: 1, cats: [1, 2, 3], source: "./assets/sprites/shop-world-cats-1-v1.png" },
  { world: 3, cats: [3, 4, 8], source: "./assets/sprites/shop-world-cats-3-v1.png" },
  { world: 6, cats: [6, 5, 7], source: "./assets/sprites/shop-world-cats-6-v1.png" },
  { world: 10, cats: [10, 9, 11], source: "./assets/sprites/shop-world-cats-10-v1.png" },
  { world: 12, cats: [12, 11, 7], source: "./assets/sprites/shop-world-cats-12-v1.png" },
] as const;

export function getSecretShopCatSet(world: Level["world"]) {
  const set = secretShopCatSets.find((candidate) => candidate.world === world);
  if (!set) throw new Error(`El mundo ${world} no tiene una tienda de gatitos.`);
  return {
    ...set,
    kittens: set.cats.map((id) => {
      const cat = worldCatalog.find((candidate) => candidate.id === id);
      if (!cat) throw new Error(`No existe el gatito del mundo ${id}.`);
      return { world: cat.id, name: cat.cat, source: cat.catAsset };
    }),
  };
}
