import assert from "node:assert/strict";
import test from "node:test";
import { levels } from "./levels.ts";
import { emptyProgress } from "./progress.ts";
import { completeSecretShop, getSecretShopBadge, getWorldSecretShopBadge, normalizeSecretShops, visitSecretShop } from "./secretShopProgress.ts";
import { worldCatalog } from "./worldMapData.ts";

test("visitar y completar tiendas son cambios puros, independientes e idempotentes", () => {
  const before = JSON.stringify(emptyProgress);
  const visited = visitSecretShop(emptyProgress, "shop-1-2");
  assert.deepEqual(visited.secretShops, { "shop-1-2": { visited: true, completed: false } });
  assert.equal(visitSecretShop(visited, "shop-1-2"), visited);
  const completed = completeSecretShop(visited, "shop-1-2");
  assert.deepEqual(completed.secretShops, { "shop-1-2": { visited: true, completed: true } });
  assert.equal(completeSecretShop(completed, "shop-1-2"), completed);
  assert.equal(visitSecretShop(completed, "shop-1-2"), completed);
  const other = completeSecretShop(completed, "shop-3-2");
  assert.deepEqual(other.secretShops?.["shop-3-2"], { visited: true, completed: true });
  assert.equal(other.secretShops?.["shop-1-2"], completed.secretShops?.["shop-1-2"]);
  assert.equal(JSON.stringify(emptyProgress), before);
  assert.equal(visited.secretShops?.["shop-1-2"].completed, false);
  assert.equal(visitSecretShop(other, "shop-2-2"), other);
  assert.equal(completeSecretShop(other, "__proto__"), other);
  const { secretShops: ignored, ...unchanged } = other;
  assert.ok(ignored);
  const { secretShops: originalIgnored, ...original } = emptyProgress;
  assert.ok(originalIgnored);
  assert.deepEqual(unchanged, original);
});

test("los distintivos del mapa solo aparecen en mundos abiertos y en la pantalla exacta", () => {
  const allOpen = { ...emptyProgress, unlocked: 29, waterUnlocked: true, secretUnlocked: true };
  const badges = worldCatalog.flatMap((world) => {
    const badge = getWorldSecretShopBadge(world.id, allOpen);
    return badge ? [[world.id, badge.id, badge.levelId, badge.state]] : [];
  });
  assert.deepEqual(badges, [
    [1, "shop-1-2", "1-2", "available"], [3, "shop-3-2", "3-2", "available"],
    [6, "shop-6-2", "6-2", "available"], [10, "shop-10-2", "10-2", "available"],
    [12, "shop-12-2", "12-2", "available"],
  ]);
  for (const world of worldCatalog) {
    assert.equal(Boolean(getWorldSecretShopBadge(world.id, emptyProgress)), world.id === 1);
  }
  assert.deepEqual(levels.filter((level) => getSecretShopBadge(level, allOpen)).map((level) => level.id),
    ["1-2", "3-2", "6-2", "10-2", "12-2"]);
  const visited = visitSecretShop(allOpen, "shop-1-2");
  assert.equal(getWorldSecretShopBadge(1, visited)?.state, "visited");
  assert.match(getWorldSecretShopBadge(1, visited)!.label, /visitada/);
  const completed = completeSecretShop(visited, "shop-1-2");
  assert.equal(getWorldSecretShopBadge(1, completed)?.state, "completed");
  assert.match(getWorldSecretShopBadge(1, completed)!.label, /reto conseguido/);
  assert.equal(getWorldSecretShopBadge(3, completeSecretShop(emptyProgress, "shop-3-2")), null);
});

test("las entradas dañadas no crean tiendas ni convierten textos en logros", () => {
  for (const invalid of [undefined, null, [], true, "tienda"]) assert.deepEqual(normalizeSecretShops(invalid), {});
  assert.deepEqual(normalizeSecretShops({
    "shop-1-2": { visited: "sí", completed: 1 },
    "shop-3-2": { completed: true },
    "shop-6-2": null, "shop-10-2": [], "shop-12-2": { visited: true, completed: false },
    "shop-2-2": { visited: true, completed: true },
  }), {
    "shop-1-2": { visited: false, completed: false },
    "shop-3-2": { visited: true, completed: true },
    "shop-12-2": { visited: true, completed: false },
  });
});
