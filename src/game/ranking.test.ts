import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { emptyProgress } from "./progress.ts";
import { checkRankingAvailability, loadRanking, RankingError, rankingProgress, readRankingDevice, registerRankingDevice, syncRanking } from "./ranking.ts";

test("el tablón reconoce el mundo 12 y sus pantallas de campaña", () => {
  const levelStats = Object.fromEntries(["1-1", "9-1", "12-1"].map((id) => [id, {
    completed: true,
    bestApples: 0,
    bestLives: 3,
    flawless: false,
  }]));
  assert.deepEqual(rankingProgress({ ...emptyProgress, levelStats }), {
    world: 12,
    campaignWorld: 10,
    completedLevels: 3,
    stickers: 0,
    bossChallenges: 0,
    totalApples: 0,
    achievedAt: null,
  });
});

function storageFixture(t: TestContext) {
  const values = new Map<string, string>();
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  } });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else Reflect.deleteProperty(globalThis, "localStorage");
  });
  return values;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

test("los desvíos opcionales no se convierten en avance de campaña", () => {
  assert.deepEqual(rankingProgress({ ...emptyProgress, waterUnlocked: true, secretUnlocked: true }), {
    world: 0, campaignWorld: 0, completedLevels: 0, stickers: 0, bossChallenges: 0, totalApples: 0, achievedAt: null,
  });
  const levelStats = { "6-3": { completed: true, bestApples: 0, bestLives: 3, flawless: false } };
  const castle = rankingProgress({ ...emptyProgress, levelStats, waterUnlocked: true });
  assert.equal(castle.world, 6);
  assert.equal(castle.campaignWorld, 6);
  assert.equal(castle.completedLevels, 1);
});

test("guarda la tarjeta antes de registrar y reintenta la misma tras perder la respuesta", async (t) => {
  storageFixture(t);
  const requests: { deviceId: string; deviceToken: string; alias: string }[] = [];
  let loseResponse = true;
  t.mock.method(globalThis, "fetch", async (url: string, init?: RequestInit) => {
    if (url.endsWith("/health")) return jsonResponse({ registrationVersion: 2, progressVersion: 2 });
    const request = JSON.parse(init?.body as string);
    const saved = readRankingDevice();
    assert.equal(saved?.id, request.deviceId);
    assert.equal(saved?.token, request.deviceToken);
    assert.equal(saved?.registrationPending, true);
    requests.push(request);
    if (loseResponse) { loseResponse = false; throw new TypeError("Respuesta perdida"); }
    return jsonResponse(request);
  });
  await assert.rejects(registerRankingDevice("  Noa  Luna "), (error: unknown) => error instanceof RankingError && error.code === "network" && error.retryable);
  const pending = readRankingDevice();
  assert.ok(pending?.registrationPending);
  const device = await registerRankingDevice("noa luna");
  assert.deepEqual(requests[0], requests[1]);
  assert.equal(device.id, pending.id);
  assert.equal(device.token, pending.token);
  assert.equal(device.registrationPending, undefined);
  assert.deepEqual(readRankingDevice(), device);
});

test("almacenamiento bloqueado o que ignora escrituras impide enviar un registro", async (t) => {
  storageFixture(t);
  for (const throws of [true, false]) {
    const mockStorage = t.mock.method(globalThis.localStorage, "setItem", () => { if (throws) throw new Error("Bloqueado"); });
    const fetchMock = t.mock.method(globalThis, "fetch", async () => { throw new Error("No debe solicitar"); });
    await assert.rejects(registerRankingDevice("NoaLuna"), (error: unknown) => error instanceof RankingError && error.code === "storage_unavailable" && !error.retryable);
    assert.equal(fetchMock.mock.callCount(), 0);
    fetchMock.mock.restore();
    mockStorage.mock.restore();
  }
});

test("no pierde una tarjeta antigua ni la cambia al apuntarse otra vez", async (t) => {
  const storage = storageFixture(t);
  const oldDevice = { id: "old-device", token: "old-token", alias: "NoaLuna" };
  storage.set("super-noa-ranking-device-v1", JSON.stringify(oldDevice));
  const fetchMock = t.mock.method(globalThis, "fetch", async () => { throw new Error("No debe registrar de nuevo"); });
  assert.deepEqual(await registerRankingDevice("noaluna"), oldDevice);
  await assert.rejects(registerRankingDevice("OtroNombre"), (error: unknown) => error instanceof RankingError && error.code === "device_exists");
  assert.equal(fetchMock.mock.callCount(), 0);
  assert.deepEqual(readRankingDevice(), oldDevice);
});

test("un servidor antiguo no recibe registros no recuperables", async (t) => {
  storageFixture(t);
  const fetchMock = t.mock.method(globalThis, "fetch", async () => jsonResponse({ status: "bien" }));
  await assert.rejects(registerRankingDevice("NoaLuna"), (error: unknown) => error instanceof RankingError && error.code === "backend_outdated" && error.retryable);
  assert.equal(fetchMock.mock.callCount(), 1);
  assert.ok(readRankingDevice()?.registrationPending);
});

test("un alias ocupado permite elegir otro sin conservar una tarjeta falsa", async (t) => {
  storageFixture(t);
  let occupied = true;
  t.mock.method(globalThis, "fetch", async (url: string, init?: RequestInit) => {
    if (url.endsWith("/health")) return jsonResponse({ registrationVersion: 2 });
    if (occupied) return jsonResponse({ code: "alias_taken", error: "Ese alias ya está jugando." }, 409);
    return jsonResponse(JSON.parse(init?.body as string));
  });
  await assert.rejects(registerRankingDevice("NoaLuna"), (error: unknown) => error instanceof RankingError && error.code === "alias_taken" && !error.retryable);
  assert.equal(readRankingDevice(), null);
  occupied = false;
  assert.equal((await registerRankingDevice("NoaSol")).alias, "NoaSol");
});

test("sync recupera una tarjeta pendiente antes de publicar el progreso", async (t) => {
  const storage = storageFixture(t);
  const pending = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", token: "a".repeat(43), alias: "NoaLuna", registrationPending: true };
  storage.set("super-noa-ranking-device-v1", JSON.stringify(pending));
  const paths: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: string, init?: RequestInit) => {
    paths.push(new URL(url).pathname);
    if (url.endsWith("/health")) return jsonResponse({ registrationVersion: 2, progressVersion: 2 });
    if (url.endsWith("/v1/devices")) return jsonResponse(JSON.parse(init?.body as string));
    assert.equal(readRankingDevice()?.registrationPending, undefined);
    return jsonResponse({});
  });
  await syncRanking(pending, emptyProgress);
  assert.deepEqual(paths, ["/health", "/v1/devices", "/v1/progress", "/health"]);
});

test("si falla la confirmación local tras registrar conserva la tarjeta pendiente para recuperarla", async (t) => {
  storageFixture(t);
  let blockConfirmation = true;
  const realSetItem = globalThis.localStorage.setItem;
  t.mock.method(globalThis.localStorage, "setItem", (key: string, value: string) => {
    if (blockConfirmation && !JSON.parse(value).registrationPending) throw new Error("Disco lleno");
    realSetItem(key, value);
  });
  let card: unknown;
  t.mock.method(globalThis, "fetch", async (url: string, init?: RequestInit) => {
    if (url.endsWith("/health")) return jsonResponse({ registrationVersion: 2 });
    const request = JSON.parse(init?.body as string);
    if (card) assert.deepEqual(request, card);
    card = request;
    return jsonResponse(request);
  });
  await assert.rejects(registerRankingDevice("NoaLuna"), (error: unknown) => error instanceof RankingError && error.code === "storage_unavailable");
  const pending = readRankingDevice();
  assert.ok(pending?.registrationPending);
  blockConfirmation = false;
  const confirmed = await registerRankingDevice("NoaLuna");
  assert.equal(confirmed.id, pending.id);
  assert.equal(confirmed.token, pending.token);
  assert.equal(readRankingDevice()?.registrationPending, undefined);
});

test("distingue timeout, credenciales inválidas, infraestructura y respuestas malformadas", async (t) => {
  const cases = [
    { response: () => { throw new DOMException("Tarda", "TimeoutError"); }, code: "timeout", retryable: true },
    { response: () => jsonResponse({ error: "Tarjeta inválida" }, 401), code: "device_invalid", retryable: false },
    { response: () => jsonResponse({ code: "invalid_alias", error: "Alias inválido" }, 400), code: "invalid_alias", retryable: false },
    { response: () => jsonResponse({ error: "Descansando" }, 503), code: "server_unavailable", retryable: true },
    { response: () => jsonResponse({ players: null }), code: "invalid_response", retryable: true },
    { response: () => jsonResponse({ players: [null] }), code: "invalid_response", retryable: true },
    { response: () => jsonResponse({ players: [{ alias: "Noa", world: 99, completedLevels: 0, stickers: 0, bossChallenges: 0 }] }), code: "invalid_response", retryable: true },
    { response: () => jsonResponse(null), code: "invalid_response", retryable: true },
  ];
  for (const scenario of cases) {
    const fetchMock = t.mock.method(globalThis, "fetch", async () => scenario.response());
    await assert.rejects(loadRanking(), (error: unknown) => error instanceof RankingError && error.code === scenario.code && error.retryable === scenario.retryable);
    fetchMock.mock.restore();
  }
});

test("lee respuestas antiguas sin inventar el avance de campaña de agua o nubes", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse({ players: [
    { alias: "Agua", world: 8, completedLevels: 3, stickers: 1, bossChallenges: 1 },
    { alias: "Castillo", world: 6, completedLevels: 18, stickers: 1, bossChallenges: 1 },
  ] }));
  const players = await loadRanking();
  assert.equal(players[0].campaignWorld, null);
  assert.equal(players[1].campaignWorld, 6);
  assert.equal(players[0].totalApples, null);
  assert.equal(players[0].achievedAt, null);
});

test("la disponibilidad comprueba la base de datos, no solo el health antiguo", async (t) => {
  const paths: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: string) => {
    paths.push(new URL(url).pathname);
    return url.endsWith("/health") ? jsonResponse({ registrationVersion: 2 })
      : jsonResponse({ error: "Base de datos no disponible" }, 503);
  });
  await assert.rejects(checkRankingAvailability(), (error: unknown) => error instanceof RankingError && error.code === "server_unavailable");
  assert.deepEqual(paths, ["/health", "/v1/leaderboard"]);
});

test("la disponibilidad tolera health antiguo con base de datos funcional y detecta timeouts", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async (url: string) =>
    jsonResponse(url.endsWith("/health") ? { registrationVersion: 2 } : { players: [] }));
  await checkRankingAvailability();
  mock.mock.restore();
  t.mock.method(globalThis, "fetch", async () => { throw new DOMException("Tarda", "TimeoutError"); });
  await assert.rejects(checkRankingAvailability(), (error: unknown) => error instanceof RankingError && error.code === "timeout");
});

test("dos clics comparten el registro y las credenciales pendientes", async (t) => {
  storageFixture(t);
  let posts = 0;
  t.mock.method(globalThis, "fetch", async (url: string, init?: RequestInit) => {
    if (url.endsWith("/health")) return jsonResponse({ registrationVersion: 2 });
    posts++;
    return jsonResponse(JSON.parse(init?.body as string));
  });
  const first = registerRankingDevice("NoaLuna");
  const second = registerRankingDevice("noaluna");
  assert.equal(first, second);
  assert.deepEqual(await first, await second);
  assert.equal(posts, 1);
});

test("envía manzanas y fecha sin cambiarlas y avisa si el backend no las conserva", async (t) => {
  const device = { id: "device", token: "token", alias: "Luna" };
  const progress = { ...emptyProgress, totalApples: 123, achievedAt: "2026-10-20T07:00:00.000Z" };
  let payload: unknown;
  let modern = false;
  t.mock.method(globalThis, "fetch", async (url: string, init?: RequestInit) => {
    if (url.endsWith("/health")) return jsonResponse({ registrationVersion: 2, ...(modern ? { progressVersion: 2 } : {}) });
    payload = JSON.parse(init?.body as string);
    return jsonResponse({});
  });
  await assert.rejects(syncRanking(device, progress), (error: unknown) => error instanceof RankingError && error.code === "backend_outdated");
  assert.deepEqual(payload, rankingProgress(progress));
  modern = true;
  await syncRanking(device, progress);
  assert.deepEqual(payload, rankingProgress(progress));
});

test("valida los campos nuevos y conserva fechas históricas desconocidas", async (t) => {
  const player = { alias: "Luna", world: 0, completedLevels: 0, stickers: 0, bossChallenges: 0 };
  for (const extra of [{ totalApples: -1 }, { totalApples: 1.5 }, { totalApples: Number.MAX_SAFE_INTEGER + 1 }, { achievedAt: "ayer" },
    { achievedAt: "2026-02-30T00:00:00Z" }, { achievedAt: "2026-01-01T24:00:00Z" }, { achievedAt: "2026-01-01T12:00:00Z extra" }]) {
    const mock = t.mock.method(globalThis, "fetch", async () => jsonResponse({ players: [{ ...player, ...extra }] }));
    await assert.rejects(loadRanking(), (error: unknown) => error instanceof RankingError && error.code === "invalid_response");
    mock.mock.restore();
  }
  t.mock.method(globalThis, "fetch", async () => jsonResponse({ players: [{ ...player, totalApples: 125, achievedAt: null }] }));
  assert.equal((await loadRanking())[0].totalApples, 125);
  assert.equal((await loadRanking())[0].achievedAt, null);
});

test("la sincronización descarta fechas locales dañadas y normaliza zonas horarias válidas", async (t) => {
  const invalid = rankingProgress({ ...emptyProgress, achievedAt: "2026-02-30T00:00:00Z" });
  assert.equal(invalid.achievedAt, null);
  const normalized = "2024-02-29T10:30:00.000Z";
  assert.equal(rankingProgress({ ...emptyProgress, achievedAt: "2024-02-29T12:30:00+02:00" }).achievedAt, normalized);
  t.mock.method(globalThis, "fetch", async () => jsonResponse({ players: [
    { alias: "Luna", world: 0, completedLevels: 0, stickers: 0, bossChallenges: 0, achievedAt: "2024-02-29T12:30:00+02:00" },
  ] }));
  assert.equal((await loadRanking())[0].achievedAt, normalized);
});
