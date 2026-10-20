import assert from "node:assert/strict";
import test from "node:test";
import { levels } from "./levels.ts";
import { getLevelObjectives } from "./levelObjectives.ts";
import { emptyProgress } from "./progress.ts";
import { stickerCatalog } from "./stickers.ts";
import { completeSecretShop, visitSecretShop } from "./secretShopProgress.ts";

const level = (id: string) => levels.find((entry) => entry.id === id)!;

test("visitas y estrellas de las cinco tiendas no añaden medallas ni objetivos al álbum", () => {
  const progress = { ...emptyProgress, unlocked: 29, secretUnlocked: true, waterUnlocked: true, levelStats: {
    "A-1": { completed: true, bestApples: 0 }, "A-2": { completed: true, bestApples: 0 },
  } };
  const shops = levels.flatMap((entry) => entry.secretShop ? [entry.secretShop.id] : []);
  const visited = shops.reduce(visitSecretShop, progress);
  const completed = shops.reduce(completeSecretShop, visited);
  for (const entry of levels) {
    const original = getLevelObjectives(entry, progress);
    assert.deepEqual(getLevelObjectives(entry, visited), original);
    assert.deepEqual(getLevelObjectives(entry, completed), original);
  }
  assert.equal(stickerCatalog.length, 36);
  assert.equal(levels.reduce((total, entry) => total + entry.items.filter((item) => item.kind === "sticker").length, 0), 36);
  assert.deepEqual(completed.stickers, []);
  assert.deepEqual(completed.bossChallenges, {});
});

test("los objetivos distinguen final, pegatina y partida sin perder vidas", () => {
  const result = getLevelObjectives(level("1-1"), emptyProgress);
  assert.equal(result.available, true);
  assert.deepEqual(result.objectives.map((objective) => objective.kind), ["complete", "sticker", "flawless"]);
  assert.equal(result.pendingCount, 3);
  const progress = { ...emptyProgress, levelStats: { "1-1": { completed: true, bestApples: 4, flawless: true } } };
  const completed = getLevelObjectives(level("1-1"), progress);
  assert.equal(completed.completedCount, 2);
  assert.equal(completed.pendingCount, 1);
  assert.equal(completed.objectives.find((objective) => !objective.completed)?.id, "sticker-1-1");
  assert.equal(completed.objectives[1].hint, stickerCatalog.find((sticker) => sticker.id === "sticker-1-1")?.hint);
});

test("el reino secreto tiene tres pegatinas independientes y un reto de jefe", () => {
  const progress = { ...emptyProgress, secretUnlocked: true, stickers: ["sticker-s-2"], bossChallenges: { "rainbow-queen": true } };
  const result = getLevelObjectives(level("S-1"), progress);
  assert.equal(result.totalCount, 6);
  assert.deepEqual(result.objectives.filter((objective) => objective.kind === "sticker").map((objective) => [objective.id, objective.completed]), [
    ["sticker-s-1", false], ["sticker-s-2", true], ["sticker-s-3", false],
  ]);
  assert.equal(result.objectives.find((objective) => objective.kind === "boss")?.completed, true);
  assert.equal(result.completedCount, 2);
});

test("los objetivos cerrados no revelan pistas ni datos secretos", () => {
  for (const id of ["1-2", "A-1", "S-1"]) {
    const result = getLevelObjectives(level(id), emptyProgress);
    assert.equal(result.available, false);
    assert.deepEqual(result.objectives, []);
    assert.equal(result.totalCount, 0);
  }
  const water = { ...emptyProgress, waterUnlocked: true };
  assert.equal(getLevelObjectives(level("A-1"), water).available, true);
  assert.equal(getLevelObjectives(level("A-2"), water).available, false);
  assert.equal(getLevelObjectives(level("A-2"), { ...water, levelStats: { "A-1": { completed: true, bestApples: 0 } } }).available, true);
});

test("completar una pantalla no concede la pegatina, la partida perfecta ni el reto", () => {
  const result = getLevelObjectives(level("1-3"), {
    ...emptyProgress, unlocked: 2, levelStats: { "1-3": { completed: true, bestApples: 0 } },
  });
  assert.equal(result.completedCount, 1);
  assert.equal(result.pendingCount, 3);
  const inconsistent = getLevelObjectives(level("1-1"), { ...emptyProgress, levelStats: { "1-1": { completed: false, bestApples: 0, flawless: true } } });
  assert.equal(inconsistent.objectives.find((objective) => objective.kind === "flawless")?.completed, false);
});

test("todas las pantallas abiertas tienen objetivos únicos y pistas", () => {
  const progress = { ...emptyProgress, unlocked: 29, waterUnlocked: true, secretUnlocked: true, levelStats: {
    "A-1": { completed: true, bestApples: 0 }, "A-2": { completed: true, bestApples: 0 },
  } };
  for (const entry of levels) {
    const result = getLevelObjectives(entry, progress);
    assert.equal(result.available, true, entry.id);
    assert.equal(result.totalCount, 2 + entry.items.filter((item) => item.kind === "sticker").length + Number(Boolean(entry.boss)));
    assert.equal(new Set(result.objectives.map((objective) => objective.id)).size, result.totalCount);
    assert.ok(result.objectives.every((objective) => objective.hint.length > 0));
  }
});

test("todos los objetivos conseguidos dejan cero pendientes sin modificar el progreso", () => {
  const progress = {
    ...emptyProgress, secretUnlocked: true,
    levelStats: { "S-1": { completed: true, bestApples: 7, flawless: true } },
    stickers: ["sticker-s-1", "sticker-s-2", "sticker-s-3"],
    bossChallenges: { "rainbow-queen": true },
  };
  const before = JSON.stringify(progress);
  const result = getLevelObjectives(level("S-1"), progress);
  assert.equal(result.completedCount, 6);
  assert.equal(result.pendingCount, 0);
  assert.equal(JSON.stringify(progress), before);
});

test("la pista del castillo explica la cadena sin confundir al perrito con el duelo final", () => {
  const result = getLevelObjectives(level("6-1"), { ...emptyProgress, unlocked: 29 });
  assert.match(result.objectives[0].hint, /cadena tiene un límite/);
  assert.match(result.objectives[0].hint, /plataformas de arriba/);
  assert.equal(result.objectives.some((objective) => objective.kind === "boss"), false);
});
