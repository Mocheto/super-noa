import assert from "node:assert/strict";
import test from "node:test";
import { levels } from "./levels.ts";
import {
  beatProblems, groundGaps, isCampaignScreen, isCopy, mechanicXs, reachable, routeLength, safeGroundAround, similarity,
} from "./levelBeats.ts";
import type { Level } from "./types";

/** Mundos cuyas pantallas aún no tienen los cuatro tramos. Cada issue de retoque quita su mundo de aquí; al
 * quitarlo, sus tres pantallas deben pasar todas las pruebas de este archivo. */
const PENDING_RETOUCH = new Set([1, 2, 3, 4, 5, 17]);

const campaign = levels.filter(isCampaignScreen);
const horizontal = campaign.filter((level) => (level.orientation ?? "horizontal") === "horizontal");
const retouched = campaign.filter((level) => !PENDING_RETOUCH.has(level.world));

const flat = (overrides: Partial<Level>): Level => ({
  id: "t-1", world: 1, screen: 1, title: "", subtitle: "", theme: "orchard-day", width: 3000,
  start: { x: 80, y: 398 }, goalX: 2880, platforms: [], enemies: [], items: [], rewardBlocks: [], checkpoints: [],
  ...overrides,
});
const floor = (...segments: Array<[number, number]>) => segments.map(([x, width]) => ({ x, y: 456, width, height: 120, kind: "ground" as const }));

test("la campaña tiene 45 pantallas y la lista de pendientes solo nombra mundos de campaña", () => {
  assert.equal(campaign.length, 45);
  const worlds = new Set(campaign.map((level) => level.world));
  for (const world of PENDING_RETOUCH) assert.ok(worlds.has(world as Level["world"]), `mundo ${world}`);
});

test("solo las pantallas retocadas declaran tramos, y todas las retocadas los declaran", () => {
  for (const level of campaign) {
    assert.equal(Boolean(level.beats), !PENDING_RETOUCH.has(level.world),
      `${level.id}: ${level.beats ? "tiene tramos pero su mundo sigue pendiente" : "le faltan los tramos"}`);
  }
});

test("los tramos de cada pantalla retocada van en orden y con su reparto", () => {
  for (const level of retouched) assert.deepEqual(beatProblems(level), [], level.id);
});

test("las tres pantallas de un mundo retocado usan giros distintos", () => {
  for (const world of new Set(retouched.map((level) => level.world))) {
    const kinds = retouched.filter((level) => level.world === world).map((level) => level.beats!.twistKind);
    assert.equal(new Set(kinds).size, kinds.length, `mundo ${world}`);
  }
});

test("una pantalla retocada no copia a ninguna otra de la campaña", () => {
  for (const level of retouched.filter((l) => (l.orientation ?? "horizontal") === "horizontal")) {
    for (const other of horizontal) {
      if (other !== level) assert.ok(!isCopy(level, other), `${level.id} copia a ${other.id}: ${JSON.stringify(similarity(level, other))}`);
    }
  }
});

test("las copias que quedan son solo entre pantallas pendientes de retoque", () => {
  for (let i = 0; i < horizontal.length; i++) {
    for (let j = i + 1; j < horizontal.length; j++) {
      const [a, b] = [horizontal[i], horizontal[j]];
      if (isCopy(a, b)) assert.ok(PENDING_RETOUCH.has(a.world) && PENDING_RETOUCH.has(b.world), `${a.id} ~ ${b.id}`);
    }
  }
});

test("la meta de cada pantalla retocada horizontal se alcanza saltando, y la mecánica empieza sobre suelo seguro", () => {
  for (const level of retouched.filter((l) => (l.orientation ?? "horizontal") === "horizontal")) {
    assert.ok(reachable(level), `${level.id}: la meta no se alcanza`);
    const first = mechanicXs(level)[0];
    if (first !== undefined) assert.ok(safeGroundAround(level, first), `${level.id}: la mecánica aparece por primera vez sin suelo seguro`);
  }
});

test("los tramos se comprueban según la pantalla", () => {
  const level = flat({ beats: { development: 840, twist: 1540, finale: 2240, twistKind: "invert" } });
  assert.equal(routeLength(level), 2800);
  assert.deepEqual(beatProblems(level), []);
  assert.deepEqual(beatProblems({ ...level, screen: 2 }), ["la presentación debe ocupar entre 5 y 20 %"]);
  assert.ok(beatProblems({ ...level, beats: { ...level.beats!, twist: 2300 } }).includes("los tramos deben ir en orden dentro del recorrido"));
  assert.deepEqual(beatProblems(flat({})), ["sin tramos"]);
  const vertical = flat({ orientation: "vertical", height: 3500, start: { x: 110, y: 3352 }, goalY: 175 });
  assert.equal(routeLength(vertical), 3177);
});

test("los huecos y la anticopia miden lo que se comparte", () => {
  const a = flat({ platforms: floor([0, 1000], [1140, 900], [2180, 900]), checkpoints: [500, 1500] });
  assert.deepEqual(groundGaps(a), [{ x: 1000, width: 140 }, { x: 2040, width: 140 }]);
  assert.ok(isCopy(a, { ...a, id: "t-2" }));
  const moved = flat({ platforms: floor([0, 700], [840, 1300], [2300, 800]), checkpoints: [600, 1600] });
  assert.equal(similarity(a, moved).shared, 0);
  assert.ok(!isCopy(a, moved));
  assert.ok(isCopy(moved, { ...moved, platforms: floor([0, 400], [700, 2400]), checkpoints: [600, 1600] }), "mismos checkpoints");
});

test("la alcanzabilidad respeta el doble salto y deja quitar la mecánica", () => {
  assert.ok(reachable(flat({ platforms: floor([0, 1000], [1300, 1700]) })), "300 px se cruzan");
  assert.ok(!reachable(flat({ platforms: floor([0, 1000], [1330, 1670]) })), "330 px no se cruzan");
  const withLedge = flat({ platforms: [...floor([0, 1000], [1450, 1550]), { x: 1080, y: 380, width: 280, height: 22, kind: "branch" }] });
  assert.ok(reachable(withLedge));
  assert.ok(!reachable(withLedge, { ignore: (platform) => platform.kind === "branch" }));
  const tooHigh = flat({ platforms: [...floor([0, 1000], [1450, 1550]), { x: 1080, y: 200, width: 280, height: 22, kind: "branch" }] });
  assert.ok(!reachable(tooHigh), "una repisa más alta que el doble salto no sirve de puente");
});

test("todas las pantallas horizontales actuales se completan con saltos o plataformas fijas", () => {
  for (const level of horizontal) assert.ok(reachable(level), level.id);
});

test("la mecánica se localiza y el suelo seguro excluye huecos y peligros", () => {
  const level = flat({
    platforms: [...floor([0, 1000], [1140, 1860]), { x: 600, y: 398, width: 100, height: 58, kind: "spring" }],
    deadlyWater: [{ x: 1000, y: 448, width: 140, height: 128 }],
  });
  assert.deepEqual(mechanicXs(level), [600]);
  assert.ok(safeGroundAround(level, 600));
  assert.ok(!safeGroundAround(level, 1000));
});
