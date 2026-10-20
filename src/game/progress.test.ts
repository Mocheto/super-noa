import assert from "node:assert/strict";
import test from "node:test";
import { collectLifetimeApples, emptyProgress, lifetimeApples, normalizeProgressDate, parseProgress, progressMilestone, resetCampaignProgress, serializeProgress, validProgressDate } from "./progress.ts";
import { completeSecretShop, visitSecretShop } from "./secretShopProgress.ts";

test("las tiendas se guardan en versión 2 sin cambiar manzanas, fechas ni migraciones", () => {
  const date = "2026-10-20T07:00:00.000Z";
  const original = { ...emptyProgress, totalApples: 12, achievedAt: date };
  const visited = visitSecretShop(original, "shop-1-2");
  const completed = completeSecretShop(visited, "shop-3-2");
  const saved = JSON.parse(serializeProgress(completed));
  assert.equal(saved.version, 2);
  assert.deepEqual(parseProgress(serializeProgress(completed)), completed);
  for (const next of [visited, completed]) {
    const milestone = progressMilestone(original, next, "2026-10-21T07:00:00.000Z");
    assert.equal(milestone.achievedAt, date);
    assert.equal(milestone.totalApples, 12);
    assert.deepEqual(milestone.levelStats, original.levelStats);
    assert.deepEqual(milestone.stickers, []);
    assert.deepEqual(milestone.bossChallenges, {});
    assert.equal(milestone.unlocked, 0);
  }
  assert.deepEqual(resetCampaignProgress(completed), original);
  assert.equal(progressMilestone(emptyProgress, completeSecretShop(emptyProgress, "shop-1-2"), date).achievedAt, null);
  for (const version of [undefined, 2]) {
    const parsed = parseProgress(JSON.stringify({ version, unlocked: 0, levelStats: {} }));
    assert.deepEqual(parsed.secretShops, {});
    assert.equal(parsed.unlocked, 0);
  }
});

test("cargar tiendas tolera datos ausentes y descarta identificadores desconocidos", () => {
  const parsed = parseProgress(JSON.stringify({ version: 2, secretShops: {
    "shop-1-2": { visited: "true", completed: false },
    "shop-3-2": { completed: true },
    "shop-6-2": { visited: true, completed: "sí" },
    "shop-10-2": null, "shop-12-2": [],
    "shop-2-2": { visited: true, completed: true },
  } }));
  assert.deepEqual(parsed.secretShops, {
    "shop-1-2": { visited: false, completed: false },
    "shop-3-2": { visited: true, completed: true },
    "shop-6-2": { visited: true, completed: false },
  });
  for (const secretShops of [null, [], "sí", false]) {
    assert.deepEqual(parseProgress(JSON.stringify({ version: 2, secretShops })).secretShops, {});
  }
});

test("el progreso nuevo conserva la campaña y los desvíos al recargar", () => {
  const progress = {
    ...emptyProgress, unlocked: 9, secretUnlocked: true, waterUnlocked: true,
    levelStats: { "3-3": { completed: true, bestApples: 4, flawless: true } },
    stickers: ["sticker-3-3"], bossChallenges: { "great-wolf": true },
  };
  assert.deepEqual(parseProgress(serializeProgress(progress)), progress);
});

test("el guardado antiguo amplía los índices de campaña sin perder logros", () => {
  const parsed = parseProgress(JSON.stringify({ unlocked: 2, levelStats: { "2-2": { completed: true, bestApples: 3 } } }));
  assert.equal(parsed.unlocked, 5);
  assert.equal(parsed.levelStats["2-2"].bestApples, 3);
  assert.equal(parsed.waterUnlocked, false);
});

test("un guardado que terminó el castillo abre la isla sin cambiar de versión", () => {
  const parsed = parseProgress(JSON.stringify({
    version: 2,
    unlocked: 17,
    levelStats: { "6-3": { completed: true, bestApples: 5 } },
  }));
  assert.equal(parsed.unlocked, 18);
});

test("un guardado que terminó la isla abre el volcán automáticamente", () => {
  const parsed = parseProgress(JSON.stringify({
    version: 2,
    unlocked: 20,
    levelStats: { "9-3": { completed: true, bestApples: 4 } },
  }));
  assert.equal(parsed.unlocked, 21);
});

test("los datos ausentes o dañados vuelven a valores seguros", () => {
  assert.deepEqual(parseProgress("{"), emptyProgress);
  assert.deepEqual(parseProgress("null"), emptyProgress);
  const parsed = parseProgress(JSON.stringify({
    version: 2, unlocked: "99", levelStats: { "1-1": { completed: true, bestApples: "muchas" }, falso: { completed: true } },
    stickers: ["sticker-1-1", "sticker-1-1", 2], bossChallenges: { "great-wolf": true, "great-boar": "sí" },
  }));
  assert.equal(parsed.unlocked, 1);
  assert.equal(parsed.levelStats["1-1"].bestApples, 0);
  assert.equal(parsed.levelStats.falso, undefined);
  assert.deepEqual(parsed.stickers, ["sticker-1-1"]);
  assert.deepEqual(parsed.bossChallenges, { "great-wolf": true });
});

test("migra manzanas históricas como mínimo recuperable sin inventar una fecha", () => {
  const parsed = parseProgress(JSON.stringify({ version: 2, levelStats: {
    "1-1": { completed: true, bestApples: 4 },
    "1-2": { completed: false, bestApples: 7 },
  } }));
  assert.equal(parsed.totalApples, 11);
  assert.equal(parsed.achievedAt, null);
  assert.equal(JSON.parse(serializeProgress(parsed)).version, 2);
  assert.equal(parseProgress(serializeProgress(parsed)).achievedAt, null);
});

test("conserva el total acumulado y la fecha al guardar, recargar y repetir", () => {
  const date = "2026-10-20T07:00:00.000Z";
  const collected = collectLifetimeApples(emptyProgress, 5, date);
  assert.equal(collected.totalApples, 5);
  assert.equal(collected.achievedAt, date);
  assert.deepEqual(parseProgress(serializeProgress(collected)), collected);
  const retry = progressMilestone(collected, { ...collected }, "2026-10-21T07:00:00.000Z");
  assert.equal(retry.achievedAt, date);
  assert.equal(collectLifetimeApples(retry, 2, "2026-10-22T07:00:00.000Z").totalApples, 7);
  assert.equal(collected.totalApples, 5);
});

test("solo los avances reales cambian la fecha del progreso actual", () => {
  const date = "2026-10-20T07:00:00.000Z";
  const completed = { ...emptyProgress, levelStats: { "1-1": { completed: true, bestApples: 0 } } };
  const changes = [
    completed,
    { ...emptyProgress, stickers: ["sticker-1-1"] },
    { ...emptyProgress, bossChallenges: { "great-wolf": true } },
    { ...emptyProgress, unlocked: 1 },
    { ...emptyProgress, secretUnlocked: true },
    { ...emptyProgress, waterUnlocked: true },
  ];
  for (const next of changes) assert.equal(progressMilestone(emptyProgress, next, date).achievedAt, date);
  const flawless = progressMilestone(completed, { ...completed, levelStats: { "1-1": { completed: true, bestApples: 0, flawless: true } } }, date);
  assert.equal(flawless.achievedAt, date);
  assert.equal(progressMilestone(flawless, { ...flawless }, "2026-10-21T07:00:00.000Z").achievedAt, date);
  assert.equal(progressMilestone(completed, { ...completed }).achievedAt, null);
});

test("tolera campos nuevos dañados y limita totales a enteros seguros", () => {
  for (const totalApples of [-1, 1.5, "12", Number.MAX_SAFE_INTEGER + 1]) {
    const parsed = parseProgress(JSON.stringify({ version: 2, totalApples, achievedAt: "ayer", levelStats: { "1-1": { bestApples: 3 } } }));
    assert.equal(parsed.totalApples, 3);
    assert.equal(parsed.achievedAt, null);
  }
  for (const count of [0, -1, 1.5, Infinity, NaN]) assert.equal(collectLifetimeApples(emptyProgress, count), emptyProgress);
  const maximum = { ...emptyProgress, totalApples: Number.MAX_SAFE_INTEGER };
  assert.equal(collectLifetimeApples(maximum, 2).totalApples, Number.MAX_SAFE_INTEGER);
  assert.equal(lifetimeApples({ ...emptyProgress, totalApples: undefined, levelStats: { "1-1": { completed: true, bestApples: 5 } } }), 5);
});

test("borrar la campaña conserva las manzanas históricas y su fecha, y la siguiente suma llega al ranking", () => {
  const achievedAt = "2026-10-20T07:00:00.000Z";
  const previous = {
    ...emptyProgress, unlocked: 9, totalApples: 100, achievedAt, secretUnlocked: true, waterUnlocked: true,
    stickers: ["sticker-1-1"], bossChallenges: { "great-wolf": true },
    levelStats: { "1-1": { completed: true, bestApples: 20, flawless: true } },
  };
  const reset = resetCampaignProgress(previous);
  assert.deepEqual(reset, { ...emptyProgress, totalApples: 100, achievedAt });
  assert.equal(previous.levelStats["1-1"].completed, true);
  const reloaded = parseProgress(serializeProgress(reset));
  assert.equal(reloaded.totalApples, 100);
  assert.equal(reloaded.achievedAt, achievedAt);
  const nextDate = "2026-10-21T07:00:00.000Z";
  const collected = collectLifetimeApples(reloaded, 1, nextDate);
  assert.equal(collected.totalApples, 101);
  assert.equal(collected.achievedAt, nextDate);
  assert.equal(Math.max(previous.totalApples, collected.totalApples!), 101);
  assert.equal(resetCampaignProgress(collected).achievedAt, nextDate);
});

test("borrar la campaña antigua conserva el mínimo recuperable sin crear fecha", () => {
  const legacy = { ...emptyProgress, totalApples: undefined, achievedAt: undefined,
    levelStats: { "1-1": { completed: true, bestApples: 4 }, "1-2": { completed: true, bestApples: 7 } } };
  assert.deepEqual(resetCampaignProgress(legacy), { ...emptyProgress, totalApples: 11, achievedAt: null });
});

test("las fechas ISO válidas respetan años bisiestos y se normalizan a UTC", () => {
  const dates = [
    ["2024-02-29T12:30:00+02:00", "2024-02-29T10:30:00.000Z"],
    ["2000-02-29T23:59:59Z", "2000-02-29T23:59:59.000Z"],
    ["2026-01-01T00:30:00-03:30", "2026-01-01T04:00:00.000Z"],
    ["2026-01-01T00:30:00+02:00", "2025-12-31T22:30:00.000Z"],
    ["2026-10-20T08:00:00.1Z", "2026-10-20T08:00:00.100Z"],
    ["2026-10-20T08:00:00.12Z", "2026-10-20T08:00:00.120Z"],
    ["2026-10-20T08:00:00.123Z", "2026-10-20T08:00:00.123Z"],
  ];
  for (const [date, normalized] of dates) {
    assert.equal(validProgressDate(date), true, date);
    assert.equal(normalizeProgressDate(date), normalized, date);
    assert.equal(parseProgress(JSON.stringify({ version: 2, achievedAt: date })).achievedAt, normalized, date);
    assert.equal(JSON.parse(serializeProgress({ ...emptyProgress, achievedAt: date })).achievedAt, normalized, date);
  }
});

test("las fechas imposibles, horas inválidas y sufijos no ISO se descartan sin bloquear la sincronización", () => {
  const invalid = [
    null, undefined, 123, "", "ayer", "2026-01-01", "2026-02-30T00:00:00Z", "2026-02-29T00:00:00Z",
    "1900-02-29T00:00:00Z", "2024-02-30T00:00:00Z", "2026-04-31T00:00:00Z",
    "2026-13-01T00:00:00Z", "2026-00-01T00:00:00Z", "2026-01-00T00:00:00Z",
    "2026-01-01T24:00:00Z", "2026-01-01T12:60:00Z", "2026-01-01T12:00:60Z",
    "2026-01-01T12:00:00+24:00", "2026-01-01T12:00:00+01:60", "2026-01-01T12:00:00",
    "2026-01-01T12:00:00+0100", "2026-01-01T12:00:00.1234Z", "2026-01-01T12:00:00Z extra",
    "2026-01-01T12:00:00GMT", "2026-01-01T12:00:00Z\n", " 2026-01-01T12:00:00Z",
    "0000-01-01T00:00:00Z", "0001-01-01T00:00:00+01:00", "9999-12-31T23:59:59-01:00",
  ];
  for (const date of invalid) {
    assert.equal(validProgressDate(date), false, String(date));
    assert.equal(normalizeProgressDate(date), null, String(date));
    assert.equal(parseProgress(JSON.stringify({ version: 2, achievedAt: date })).achievedAt, null, String(date));
    if (typeof date === "string") assert.equal(JSON.parse(serializeProgress({ ...emptyProgress, achievedAt: date })).achievedAt, null, date);
  }
});
