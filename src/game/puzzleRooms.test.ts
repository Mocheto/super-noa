import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { levels } from "./levels.ts";
import { reachable } from "./levelBeats.ts";
import {
  CRATE_SIZE, RESTART_HINT_SECONDS, advanceRoom, buttonRect, createPuzzleState, doorsOpen, puzzlePlatforms, pushCrates, resetRoom,
  restartHintActive, roomReachLevel, stepTriggers,
} from "./puzzleRooms.ts";
import { PUZZLE_PIECES } from "./puzzleRoomsRendering.ts";
import { puzzleRoomsTestLevel } from "./testScreens.ts";
import type { Level, PuzzleColor } from "./types";

const puzzleLevels: Level[] = [...levels.filter((level) => level.puzzleRooms), puzzleRoomsTestLevel];
const colors: PuzzleColor[] = ["pink", "blue"];
const player = (x: number, bottom: number, grounded = true) => ({ x, y: bottom - 58, width: 42, height: 58, grounded });

test("cada sala tiene referencias válidas, 960 px y la entrada dentro", () => {
  for (const level of puzzleLevels) {
    const rooms = level.puzzleRooms!;
    assert.ok(rooms.length >= 1 && rooms.length <= 4, level.id);
    const ids = rooms.flatMap((room) => [...room.triggers, ...room.doors, ...(room.colorPlatforms ?? []), ...(room.crates ?? [])].map((item) => item.id));
    assert.equal(new Set(ids).size, ids.length, `${level.id}: identificadores repetidos`);
    rooms.forEach((room, index) => {
      const where = `${level.id} sala ${index + 1}`;
      if (index > 0) assert.equal(room.x - rooms[index - 1].x, 960, where);
      assert.ok(room.entry.x > room.x && room.entry.x < room.x + 300, `${where}: la entrada queda a la izquierda`);
      assert.ok(room.doors.some((door) => door.id === room.exitDoor), `${where}: falta la puerta de salida`);
      for (const trigger of room.triggers) {
        if (trigger.opens) assert.ok(room.doors.some((door) => door.id === trigger.opens), `${where}: ${trigger.id} abre una puerta de otra sala`);
        if (trigger.kind === "color") assert.ok(trigger.color, `${where}: ${trigger.id} sin color`);
        else assert.ok(trigger.opens, `${where}: ${trigger.id} no abre nada`);
      }
      for (const door of room.doors) {
        assert.ok(room.triggers.some((trigger) => trigger.opens === door.id), `${where}: nadie abre ${door.id}`);
        assert.ok(door.x > room.x && door.x + door.width <= room.x + 960, `${where}: ${door.id} fuera de la sala`);
      }
    });
    const last = rooms.at(-1)!;
    assert.ok(level.goalX > last.x && level.goalX < last.x + 960, `${level.id}: la bandera va en la última sala`);
  }
});

test("los topes de cada cajón dejan la placa de su sala dentro de su recorrido", () => {
  for (const level of puzzleLevels) {
    for (const room of level.puzzleRooms!) {
      for (const plate of room.triggers.filter((trigger) => trigger.kind === "plate")) {
        assert.ok((room.crates ?? []).some((crate) => crate.y === plate.y && crate.minX <= plate.x + plate.width - CRATE_SIZE + 8 && crate.maxX >= plate.x - 8),
          `${level.id}: ningún cajón llega a ${plate.id}`);
      }
      for (const crate of room.crates ?? []) {
        assert.ok(crate.minX <= crate.x && crate.x <= crate.maxX && crate.minX >= room.x && crate.maxX + CRATE_SIZE <= room.x + 960);
      }
    }
  }
});

test("ninguna sala se cruza con su estado inicial: no hay atajos", () => {
  for (const level of puzzleLevels) {
    level.puzzleRooms!.forEach((room, index) => {
      const pseudo = roomReachLevel(level, index, { open: new Set(), color: room.startColor ?? "pink" });
      assert.ok(!reachable(pseudo), `${level.id} sala ${index + 1}: la salida se alcanza sin resolverla`);
    });
  }
});

test("cada sala tiene solución: con sus puertas abiertas y algún color se llega a la salida", () => {
  for (const level of puzzleLevels) {
    level.puzzleRooms!.forEach((room, index) => {
      const open = new Set(room.doors.map((door) => door.id));
      const solved = colors.some((color) => reachable(roomReachLevel(level, index, { open, color, crates: [] })));
      assert.ok(solved, `${level.id} sala ${index + 1}: sin solución`);
      // Lo que abre cada puerta también se alcanza.
      for (const trigger of room.triggers.filter((t) => t.kind !== "plate")) {
        const top = buttonRect(trigger).y;
        const pressable = colors.some((color) => reachable(roomReachLevel(level, index, { open, color, crates: [] }), { to: trigger.x + trigger.width / 2, toTop: top }));
        assert.ok(pressable, `${level.id}: ${trigger.id} no se puede pisar`);
      }
    });
  }
});

test("las pegatinas de una pantalla de salas se alcanzan tras resolverla", () => {
  for (const level of puzzleLevels) {
    for (const sticker of level.items.filter((item) => item.kind === "sticker")) {
      const index = level.puzzleRooms!.findIndex((room) => sticker.x >= room.x && sticker.x < room.x + 960);
      assert.ok(index >= 0, `${level.id}: la pegatina queda fuera de las salas`);
      const open = new Set(level.puzzleRooms![index].doors.map((door) => door.id));
      const ok = colors.some((color) => reachable(roomReachLevel(level, index, { open, color, crates: [] }), { to: sticker.x + 20, toTop: sticker.y + 98 }));
      assert.ok(ok, `${level.id}: ${sticker.id} inalcanzable`);
    }
  }
});

test("el botón de huella se queda pulsado y la placa solo abre mientras pesa algo", () => {
  const level = puzzleRoomsTestLevel;
  const state = createPuzzleState(level);
  const paw = level.puzzleRooms![0].triggers[0];
  const onPaw = player(paw.x + 10, paw.y - 24);
  const events = stepTriggers(level, state, onPaw, true, 3);
  assert.deepEqual(events.map((event) => event.kind).sort(), ["door", "paw"]);
  assert.ok(state.openDoors.has("d1"));
  stepTriggers(level, state, player(100, 456), true, 4);
  assert.ok(state.openDoors.has("d1"), "la huella sigue pulsada al bajarse");

  state.room = 1;
  const plate = level.puzzleRooms![1].triggers[0];
  stepTriggers(level, state, player(plate.x + 20, 456), true, 5);
  assert.ok(state.openDoors.has("d2"), "Noa pesa sobre la placa");
  stepTriggers(level, state, player(plate.x + 300, 456), true, 6);
  assert.ok(!state.openDoors.has("d2"), "al bajarse se cierra");
  state.crates.find((crate) => crate.id === "c2")!.x = plate.x + 10;
  stepTriggers(level, state, player(plate.x + 300, 456), true, 7);
  assert.ok(state.openDoors.has("d2"), "el cajón pesa sobre la placa");
});

test("los botones de color cambian las plataformas sólidas", () => {
  const level = puzzleRoomsTestLevel;
  const state = createPuzzleState(level);
  state.room = 2;
  const solidIds = () => puzzlePlatforms(level, state).filter((p) => p.kind === "puzzle-color").map((p) => `${p.x}`);
  assert.deepEqual(solidIds(), ["2330", "3180", "3260"].filter((x) => x === "2330" || state.color[3] === "pink"));
  const blue = level.puzzleRooms![2].triggers.find((t) => t.color === "blue")!;
  stepTriggers(level, state, player(blue.x + 10, blue.y - 24), true, 1);
  assert.equal(state.color[2], "blue");
  assert.ok(solidIds().includes("2280") && !solidIds().includes("2330"));
  stepTriggers(level, state, player(blue.x + 10, blue.y - 24), false, 2);
  assert.equal(state.color[2], "blue", "solo cambia al aterrizar, no mientras sigue encima");
});

test("el cajón se empuja despacio, se para en sus topes y no se arrastra", () => {
  const level = puzzleRoomsTestLevel;
  const state = createPuzzleState(level);
  const crate = state.crates.find((c) => c.id === "c2")!;
  const noa = player(crate.x - 42, 456);
  const x = pushCrates(state, noa, noa.x, noa.x + 10, 1 / 60, 9);
  assert.equal(crate.x, 1202);
  assert.equal(x, crate.x - 42);
  assert.equal(state.lastProgress, 9);
  crate.x = crate.maxX;
  pushCrates(state, player(crate.x - 42, 456), crate.x - 42, crate.x - 32, 1 / 60);
  assert.equal(crate.x, crate.maxX, "tope derecho");
  const behind = player(crate.x - 60, 456);
  pushCrates(state, behind, behind.x, behind.x - 10, 1 / 60);
  assert.equal(crate.x, crate.maxX, "alejarse no tira del cajón");
  const jumping = player(crate.x - 42, 400);
  pushCrates(state, jumping, jumping.x, jumping.x + 10, 1 / 60);
  assert.equal(crate.x, crate.maxX);
});

test("al cruzar la puerta de salida se pasa de sala y la puerta se cierra detrás", () => {
  const level = puzzleRoomsTestLevel;
  const state = createPuzzleState(level);
  state.pressedPaws.add("t1");
  state.openDoors = doorsOpen(level, state, null);
  assert.ok(state.openDoors.has("d1"));
  assert.equal(advanceRoom(level, state, 900, 2), false);
  assert.equal(advanceRoom(level, state, 940, 2), true);
  assert.equal(state.room, 1);
  assert.ok(!state.openDoors.has("d1"), "no hay vuelta atrás");
});

test("empezar la sala la deja como al entrar sin tocar las demás", () => {
  const level = puzzleRoomsTestLevel;
  const state = createPuzzleState(level);
  state.pressedPaws.add("t1");
  state.room = 3;
  state.color[3] = "pink";
  state.crates.find((c) => c.id === "c4")!.x = 3300;
  state.pressedPaws.add("t4");
  resetRoom(level, state, 3, 50);
  assert.equal(state.color[3], "blue");
  assert.equal(state.crates.find((c) => c.id === "c4")!.x, 2980);
  assert.ok(!state.pressedPaws.has("t4") && state.pressedPaws.has("t1"));
  assert.ok(!restartHintActive(state, 50 + RESTART_HINT_SECONDS - 1));
  assert.ok(restartHintActive(state, 50 + RESTART_HINT_SECONDS));
});

test("los recortes del atlas coinciden con las medidas del recorte del arte", () => {
  const json = JSON.parse(readFileSync(new URL("../../docs/art/variedad-v1-recortes.json", import.meta.url), "utf8"));
  assert.deepEqual(PUZZLE_PIECES, json["puzzle-pieces-v1"]);
});
