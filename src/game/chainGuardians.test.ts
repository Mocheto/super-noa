import assert from "node:assert/strict";
import test from "node:test";
import { createChainGuardian, guardianBounds, updateChainGuardian } from "./chainGuardians.ts";
import { engineModules, mountEngine } from "./engineTestHarness.ts";
import { rectanglesOverlap } from "./gameplay.ts";
import { levels } from "./levels.ts";
import type { ChainGuardian, Level } from "./types";
import type { RasterAssets } from "./assets";

const guardian: ChainGuardian = {
  id: "hound", anchorX: 400, groundY: 456, leashLength: 170, width: 80, height: 56,
  patrolSpeed: 78, lungeSpeed: 340, patrolDuration: 3, warningDuration: 1.1,
  lungeDuration: .85, recoveryDuration: 1.3, delay: 0,
};
const level = (overrides: Partial<Level> = {}): Level => ({
  id: "hound-test", world: 6, screen: 2, title: "Prueba", subtitle: "", theme: "haunted-castle",
  width: 2000, start: { x: 80, y: 398 }, goalX: 1800,
  platforms: [{ x: 0, y: 456, width: 2000, height: 120, kind: "castle-ground" }],
  chainGuardians: [guardian], enemies: [], items: [], rewardBlocks: [], checkpoints: [], ...overrides,
});
function advance(engine: ReturnType<typeof mountEngine>, frames: number, start = 1000) {
  let now = start;
  for (let frame = 0; frame < frames; frame++) {
    now += 1000 / 60 + .001;
    engine.tick(now);
  }
  return now;
}

test("el guardián patrulla, avisa inmóvil, fija el mordisco y respeta la cadena en ambos sentidos", () => {
  for (const target of [0, 2000]) {
    const live = createChainGuardian(guardian);
    const phases = new Set<string>();
    const bounds = guardianBounds(guardian);
    let warningX = 0;
    let warningDirection = 0;
    for (let frame = 0; frame < 60 * 60; frame++) {
      const previous = live.phase;
      updateChainGuardian(live, 1 / 60, live.phase === "warning" ? 2000 - target : target);
      phases.add(live.phase);
      assert.ok(live.x >= bounds.minX && live.x <= bounds.maxX);
      assert.equal(live.y + live.height, guardian.groundY);
      if (live.phase === "warning") {
        if (previous !== "warning") {
          warningX = live.x;
          warningDirection = live.direction;
        }
        assert.equal(live.x, warningX);
        assert.equal(live.direction, warningDirection, "no gira el aviso para perseguir a Noa");
      }
      if (live.phase === "lunge" && previous !== "lunge") assert.equal(previous, "warning");
    }
    assert.deepEqual([...phases].sort(), ["lunge", "patrol", "recovery", "warning"]);
  }
  const delayed = createChainGuardian({ ...guardian, delay: 2 });
  updateChainGuardian(delayed, 1, 0);
  assert.equal(delayed.x, guardian.anchorX - guardian.width / 2);
  assert.equal(delayed.phaseAge, 0);
  assert.throws(() => createChainGuardian({ ...guardian, warningDuration: 0 }), RangeError);
});

test("el castillo ampliado tiene guardianes sobre suelo, rutas altas y checkpoints fuera de su alcance", () => {
  const castle = levels.filter((entry) => entry.world === 6);
  assert.equal(castle[0].width, 5200, "primera pantalla un 30 % más larga");
  assert.equal(castle[0].goalX, 5020);
  assert.equal(castle[0].checkpoints.length, 4);
  assert.equal(castle[0].spikePits?.length, 4);
  for (const data of castle) {
    assert.equal(data.chainGuardians?.length, 2);
    for (const hound of data.chainGuardians ?? []) {
      const { minX, maxX } = guardianBounds(hound);
      assert.ok(hound.warningDuration >= .9);
      assert.ok(hound.lungeSpeed > hound.patrolSpeed * 3);
      assert.ok(minX > data.start.x + 300 && maxX + hound.width < data.goalX - 300);
      assert.ok(data.platforms.some((platform) => platform.kind === "castle-ground"
        && platform.x <= minX && platform.x + platform.width >= maxX + hound.width && platform.y === hound.groundY));
      const envelope = { x: minX, y: hound.groundY - hound.height, width: maxX + hound.width - minX, height: hound.height };
      for (const obstacle of [...data.platforms, ...(data.spikePits ?? [])]) {
        assert.equal(rectanglesOverlap(envelope, obstacle), false, `${hound.id}: atraviesa una pared o los pinchos`);
      }
      for (const checkpoint of [data.start.x - 22, ...data.checkpoints]) {
        const spawn = { x: checkpoint + 22, y: hound.groundY - 58, width: 42, height: 58 };
        assert.equal(rectanglesOverlap(envelope, spawn), false, `${hound.id}: alcanza una reaparición`);
      }
      assert.ok(data.platforms.some((platform) => platform.kind === "castle-ledge" && platform.y <= hound.groundY - hound.height - 40
        && platform.x < maxX + hound.width && platform.x + platform.width > minX), `${hound.id}: sin alternativa por arriba`);
    }
  }
  assert.equal(levels.filter((entry) => entry.world !== 6).some((entry) => entry.chainGuardians?.length), false);
});

test("el guardián real conserva sus fases al pausar y se reinicia al reintentar", () => {
  const engine = mountEngine(level());
  try {
    engine.tick(1000);
    let now = advance(engine, 195);
    const warning = engine.drawnGuardians[0];
    assert.equal(warning.phase, "warning");
    assert.ok(engine.events.includes("countdown"));
    engine.setRunning(false);
    engine.setRunning(true);
    engine.tick(now + 10_000);
    assert.deepEqual(engine.drawnGuardians[0], warning);
    now = advance(engine, 80, now + 10_000);
    assert.ok(["lunge", "recovery"].includes(engine.drawnGuardians[0].phase));
    assert.ok(now > 0);
    assert.equal(engine.events.includes("life"), false);
  } finally { engine.unmount(); }
  const retry = mountEngine(level());
  try {
    retry.tick(1000);
    assert.equal(retry.drawnGuardians[0].phase, "patrol");
    assert.equal(retry.drawnGuardians[0].x, guardian.anchorX - guardian.width / 2);
  } finally { retry.unmount(); }
});

test("los seis perritos se pueden superar sin daño usando sus plataformas reales y saltos normales", () => {
  const routes = [
    { id: "6-1", x: 960, y: 292, jumps: [1090], finish: 1490 },
    { id: "6-1", x: 3190, y: 292, jumps: [3250, 3460], finish: 3820 },
    { id: "6-2", x: 2200, y: 287, jumps: [2250, 2460], finish: 2700 },
    { id: "6-2", x: 3130, y: 262, jumps: [3210], finish: 3650 },
    { id: "6-3", x: 2120, y: 267, jumps: [2420], finish: 2690 },
    { id: "6-3", x: 4550, y: 277, jumps: [4640, 4880], finish: 5080 },
  ];
  for (const route of routes) {
    const data = levels.find((entry) => entry.id === route.id)!;
    const engine = mountEngine({ ...data, start: { x: route.x, y: route.y }, enemies: [] });
    try {
      engine.tick(1000);
      let now = advance(engine, 1);
      let jump = 0;
      let holdUntil = 0;
      engine.input.right = true;
      for (let frame = 0; frame < 600 && engine.worldPlayerRect!.x < route.finish; frame++) {
        const player = engine.worldPlayerRect!;
        const supported = data.platforms.some((platform) => Math.abs(player.y + player.height - platform.y) < .01
          && player.x + player.width > platform.x && player.x < platform.x + platform.width);
        if (jump < route.jumps.length && player.x >= route.jumps[jump] && supported) {
          engine.input.jump = true;
          engine.input.jumpQueued = true;
          holdUntil = frame + 18;
          jump++;
        } else engine.input.jump = frame < holdUntil;
        now = advance(engine, 1, now);
      }
      assert.ok(engine.worldPlayerRect!.x >= route.finish, `${route.id}/${route.x}: camino bloqueado`);
      assert.equal(engine.events.includes("hurt"), false, `${route.id}/${route.x}: obliga a tocar al perrito`);
      assert.equal(engine.events.includes("life"), false, `${route.id}/${route.x}: cae en los pinchos`);
      assert.equal(jump, route.jumps.length);
    } finally { engine.unmount(); }
  }
});

test("el guardián no se derrota por pisotón ni por lana y sí permite pasar sobre una repisa", () => {
  const stationary = { ...guardian, anchorX: 200, patrolSpeed: 0, lungeSpeed: 0 };
  for (const startY of [300, 398]) {
    const engine = mountEngine(level({ start: { x: 180, y: startY }, chainGuardians: [stationary] }));
    try {
      engine.tick(1000);
      advance(engine, 60);
      assert.ok(engine.events.includes("hurt"));
      assert.equal(engine.events.includes("stomp"), false);
      assert.equal(engine.drawnGuardians.length, 1);
    } finally { engine.unmount(); }
  }
  const shooting = mountEngine(level({
    start: { x: 80, y: 398 }, chainGuardians: [stationary],
    items: [{ id: "cat", kind: "cat", x: 80, y: 398 }],
  }));
  try {
    shooting.tick(1000);
    const now = advance(shooting, 1);
    shooting.input.shoot = true;
    shooting.input.shootQueued = true;
    advance(shooting, 35, now);
    assert.ok(shooting.events.includes("yarn"));
    assert.ok(shooting.events.includes("block"));
    assert.equal(shooting.events.includes("stomp"), false);
    assert.equal(shooting.drawnGuardians.length, 1);
  } finally { shooting.unmount(); }
  const above = mountEngine(level({
    start: { x: 80, y: 272 },
    platforms: [...level().platforms, { x: 0, y: 330, width: 800, height: 24, kind: "castle-ledge" }],
  }));
  try {
    above.tick(1000);
    above.input.right = true;
    advance(above, 150);
    assert.ok(above.worldPlayerRect!.x > guardian.anchorX + guardian.leashLength);
    assert.equal(above.events.includes("hurt"), false);
    assert.equal(above.events.includes("life"), false);
    assert.equal(above.playerRect!.y, 272);
  } finally { above.unmount(); }
});

test("la ampliación de 6-1 permite cruzar el nuevo foso, usar el cuarto checkpoint y llegar a la meta", () => {
  const data = levels.find((entry) => entry.id === "6-1")!;
  const engine = mountEngine({ ...data, start: { x: 3820, y: 398 }, enemies: [] });
  try {
    engine.tick(1000);
    let now = advance(engine, 1);
    const jumps = [4000, 4310, 4495];
    let jump = 0;
    let holdUntil = 0;
    engine.input.right = true;
    for (let frame = 0; frame < 600 && engine.completed.length === 0; frame++) {
      const player = engine.worldPlayerRect!;
      const supported = data.platforms.some((platform) => Math.abs(player.y + player.height - platform.y) < .01
        && player.x + player.width > platform.x && player.x < platform.x + platform.width);
      if (jump < jumps.length && player.x >= jumps[jump] && supported) {
        engine.input.jumpQueued = true;
        holdUntil = frame + 18;
        jump++;
      }
      engine.input.jump = frame < holdUntil;
      now = advance(engine, 1, now);
    }
    assert.equal(engine.completed.length, 1);
    assert.equal(engine.completed[0].checkpoint, 4);
    assert.equal(engine.events.includes("hurt"), false);
    assert.equal(engine.events.includes("life"), false);
  } finally { engine.unmount(); }
});

test("el dibujo usa sprites de perro, eslabones y poste, avisa sin leer y mantiene sus patas en el suelo", () => {
  const { drawChainGuardian } = engineModules()("./rendering") as typeof import("./rendering");
  const calls: unknown[][] = [];
  const marks: number[][] = [];
  const scales: number[][] = [];
  const context = new Proxy<Record<string, unknown>>({}, {
    get: (target, key: string) => {
      if (key === "drawImage") return (...args: unknown[]) => calls.push(args);
      if (key === "fillRect") return (...args: number[]) => marks.push(args);
      if (key === "scale") return (...args: number[]) => scales.push(args);
      return target[key] ?? (() => undefined);
    },
    set: (target, key: string, value) => { target[key] = value; return true; },
  }) as unknown as CanvasRenderingContext2D;
  const image = { complete: true, naturalWidth: 512 } as HTMLImageElement;
  const raster = { castleHound: image, castleChainLink: image, castleChainPost: image } as RasterAssets;
  for (const direction of [-1, 1] as const) {
    const live = { ...createChainGuardian(guardian), direction, phase: "warning" as const };
    drawChainGuardian(context, live, 0, raster);
    const dog = calls.filter((call) => call[3] === 128).at(-1)!;
    assert.equal(dog[1], 128, "pose de aviso");
    const height = dog[8] as number;
    const top = dog[6] as number;
    assert.ok(Math.abs(top + 109 * height / 112 - guardian.groundY) < .001);
    assert.ok(calls.some((call) => call[3] === 32), "cadena con sprite");
    assert.ok(calls.some((call) => call[3] === 64), "poste con sprite");
    assert.ok(marks.some((mark) => mark[2] === 4 && mark[3] === 10), "aviso visual de admiración");
  }
  assert.ok(scales.some(([x]) => x === -1));
  calls.length = 0;
  const pending = { complete: false, naturalWidth: 0 } as HTMLImageElement;
  drawChainGuardian(context, createChainGuardian(guardian), 0, { castleHound: pending, castleChainLink: pending, castleChainPost: pending } as RasterAssets);
  assert.equal(calls.length, 0);
  assert.ok(marks.length > 5, "el obstáculo nunca es invisible si falla el PNG");
});
