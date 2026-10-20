import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getSecretShopCatSet, secretShopCatSets } from "./secretShopCats.ts";
import { worldCatalog } from "./worldMapData.ts";

test("cada tienda ofrece tres gatitos existentes en el orden de su atlas", () => {
  assert.deepEqual(secretShopCatSets.map(({ world, cats }) => [world, [...cats]]), [
    [1, [1, 2, 3]], [3, [3, 4, 8]], [6, [6, 5, 7]], [10, [10, 9, 11]], [12, [12, 11, 7]],
  ]);
  for (const definition of secretShopCatSets) {
    const set = getSecretShopCatSet(definition.world);
    assert.equal(set.source, `./assets/sprites/shop-world-cats-${definition.world}-v1.png`);
    assert.equal(new Set(set.kittens.map(({ world }) => world)).size, 3);
    for (const [column, kitten] of set.kittens.entries()) {
      const original = worldCatalog.find(({ id }) => id === definition.cats[column]);
      assert.ok(original);
      assert.deepEqual(kitten, { world: original.id, name: original.cat, source: original.catAsset });
      assert.ok(readFileSync(new URL(`../../public/${kitten.source.slice(2)}`, import.meta.url)).length > 0);
    }
  }
});

test("los mundos sin tienda no toman prestado el atlas de otro mundo", () => {
  assert.throws(() => getSecretShopCatSet(2), /no tiene una tienda/);
});
