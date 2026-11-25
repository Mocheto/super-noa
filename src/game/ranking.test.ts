import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { emptyProgress } from "./progress.ts";
import { aliasValido, changeRankingAlias, loadRanking, parseRetryAfter, RankingError, rankingProgress, readOwnRanking, readRankingDevice, registerRankingDevice, resetRankingCooldowns, syncRanking } from "./ranking.ts";

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
    { response: () => jsonResponse({ code: "alias_not_allowed", error: "Ese nombre no vale. Prueba otro." }, 400), code: "alias_not_allowed", retryable: false },
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

test("lee el avance completo del Reino Celeste", async (t) => {
  t.mock.method(globalThis, "fetch", async () => jsonResponse({ players: [
    { alias: "Noa", world: 17, campaignWorld: 15, completedLevels: 45, stickers: 51, bossChallenges: 17 },
  ] }));
  const [player] = await loadRanking();
  assert.equal(player.world, 17);
  assert.equal(player.campaignWorld, 15);
  assert.equal(player.completedLevels, 45);
  assert.equal(player.stickers, 51);
  assert.equal(player.bossChallenges, 17);
});

test("la tarjeta propia trae su alias, su estado y el nombre que ven los demás, con sus credenciales en cabeceras", async (t) => {
  let headers: Record<string, string> = {};
  t.mock.method(globalThis, "fetch", async (_url: string, init?: RequestInit) => {
    headers = init?.headers as Record<string, string>;
    return jsonResponse({ alias: "Luna", aliasStatus: "pending", publicAlias: "Koala 65" });
  });
  const device = { id: "6f0c8f3e-2b1a-4c3d-9e8f-0a1b2c3d4e5f", token: "token", alias: "Luna" };
  assert.deepEqual(await readOwnRanking(device), { alias: "Luna", aliasStatus: "pending", publicAlias: "Koala 65" });
  assert.equal(headers["X-Super-Noa-Device"], device.id);
  assert.equal(headers["X-Super-Noa-Token"], device.token);
  t.mock.method(globalThis, "fetch", async () => jsonResponse({ alias: "Luna", aliasStatus: "raro", publicAlias: "Koala 65" }));
  await assert.rejects(readOwnRanking(device), (error: unknown) => error instanceof RankingError && error.code === "invalid_response");
});

test("cambiar el alias guarda el nuevo en la tarjeta y explica al momento el que no pasa el filtro", async (t) => {
  const device = { id: "6f0c8f3e-2b1a-4c3d-9e8f-0a1b2c3d4e5f", token: "token", alias: "Luna" };
  storageFixture(t).set("super-noa-ranking-device-v1", JSON.stringify(device));
  const paths: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: string, init?: RequestInit) => {
    paths.push(`${init?.method ?? "GET"} ${new URL(url).pathname}`);
    if (init?.method === "POST") return jsonResponse({ alias: JSON.parse(init.body as string).alias, aliasStatus: "pending" });
    return jsonResponse({ alias: "Sirena", aliasStatus: "pending", publicAlias: "Luna" });
  });
  assert.deepEqual(await changeRankingAlias(device, "  Sirena "), { alias: "Sirena", aliasStatus: "pending", publicAlias: "Luna" });
  assert.deepEqual(paths, ["POST /v1/alias", "GET /v1/device"]);
  assert.equal(readRankingDevice()?.alias, "Sirena");
  await assert.rejects(changeRankingAlias(device, "x"), (error: unknown) => error instanceof RankingError && error.code === "invalid_alias");
  t.mock.method(globalThis, "fetch", async () => jsonResponse({ error: "texto del servidor", code: "alias_not_allowed" }, 400));
  await assert.rejects(changeRankingAlias(device, "Feo"), (error: unknown) => error instanceof RankingError && error.code === "alias_not_allowed" && error.message === "Ese nombre no vale. Prueba otro.");
  assert.equal(readRankingDevice()?.alias, "Sirena");
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

test("Retry-After: segundos, fecha HTTP, cuerpo o un minuto, siempre entre 1 s y 1 h", () => {
  assert.equal(parseRetryAfter("120", null), 120_000);
  assert.equal(parseRetryAfter("0", null), 1_000);
  assert.equal(parseRetryAfter("999999", null), 3_600_000);
  assert.equal(parseRetryAfter("Wed, 21 Oct 2015 07:28:30 GMT", null, Date.parse("2015-10-21T07:28:00Z")), 30_000);
  assert.equal(parseRetryAfter(null, { retryAfter: 45 }), 45_000);
  assert.equal(parseRetryAfter("basura", null), 60_000);
  assert.equal(parseRetryAfter(null, null), 60_000);
});

test("un 429 con Retry-After frena esa ruta sin llamar al servidor hasta que pase, y no frena las demás", async (t) => {
  resetRankingCooldowns();
  t.after(resetRankingCooldowns);
  const now = t.mock.method(Date, "now", () => 1_000_000);
  const calls: string[] = [];
  let limited = true;
  t.mock.method(globalThis, "fetch", async (url: string) => {
    calls.push(url);
    if (url.includes("/v1/leaderboard") && limited) return new Response(JSON.stringify({ code: "rate_limited", retryable: true }), { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "30" } });
    if (url.endsWith("/health")) return jsonResponse({ registrationVersion: 2, progressVersion: 2 });
    return jsonResponse({ players: [] });
  });
  await assert.rejects(loadRanking(), (error: unknown) => error instanceof RankingError && error.code === "rate_limited" && error.retryable && error.status === 429 && error.retryAfterMs === 30_000);
  assert.equal(calls.length, 1);
  for (let i = 0; i < 10; i += 1) {
    await assert.rejects(loadRanking(), (error: unknown) => error instanceof RankingError && error.code === "rate_limited" && error.status === null && error.retryAfterMs === 30_000);
  }
  assert.equal(calls.length, 1, "durante la espera no hay ni una petición más, ni en bucle");
  now.mock.mockImplementation(() => 1_000_000 + 12_000);
  await assert.rejects(loadRanking(), (error: unknown) => error instanceof RankingError && error.retryAfterMs === 18_000);
  assert.equal(calls.length, 1);
  assert.deepEqual(await (async () => { await fetch("https://rankings.moche-home.es/health"); return calls.length; })(), 2, "otras rutas no tienen veda");
  limited = false;
  now.mock.mockImplementation(() => 1_000_000 + 30_000);
  assert.deepEqual(await loadRanking(), []);
  assert.equal(calls.length, 3, "pasado el Retry-After vuelve a llamar");
});

test("el registro respeta la veda sin borrar la tarjeta guardada: se reintenta con la misma", async (t) => {
  resetRankingCooldowns();
  storageFixture(t);
  t.after(resetRankingCooldowns);
  let registrations = 0;
  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url.endsWith("/health")) return jsonResponse({ registrationVersion: 2 });
    registrations += 1;
    return new Response("{}", { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "3600" } });
  });
  await assert.rejects(registerRankingDevice("NoaLuna"), (error: unknown) => error instanceof RankingError && error.code === "rate_limited" && error.retryAfterMs === 3_600_000);
  const pending = readRankingDevice();
  assert.ok(pending?.registrationPending, "la tarjeta sigue pendiente");
  await assert.rejects(registerRankingDevice("NoaLuna"), (error: unknown) => error instanceof RankingError && error.code === "rate_limited");
  assert.equal(registrations, 1);
  assert.equal(readRankingDevice()?.id, pending.id);
});

test("el cliente aplica la misma regla de alias que el servidor", () => {
  for (const alias of ["Noa", "Ñoño", "Àlex 2", "Luna_7", "İsabel"]) assert.equal(aliasValido(alias), true, alias);
  for (const alias of ["Noа", "Ноа", "İ".repeat(16), "No", "Noa!"]) assert.equal(aliasValido(alias), false, alias);
});
