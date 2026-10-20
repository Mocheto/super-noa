import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { levels } from "./levels.ts";
import { GRAVITY, JUMP_SPEED, SPRING_SPEED } from "./gameplay.ts";
import { getStickerSprite, stickerCatalog } from "./stickers.ts";
import { bossCatalog } from "./bosses.ts";

const castle = levels.filter((level) => level.world === 6);

test("todos los checkpoints reaparecen sobre una superficie que permite aterrizar", () => {
  const playerWidth = 42;
  const playerHeight = 58;
  let checkpointCount = 0;
  for (const level of levels) {
    for (const checkpoint of level.checkpoints) {
      checkpointCount += 1;
      const x = checkpoint + 22;
      let y = level.start.y;
      let velocity = 0;
      let landing: (typeof level.platforms)[number] | undefined;
      for (let tick = 0; tick < 180 && y <= 660 && !landing; tick += 1) {
        const previousBottom = y + playerHeight;
        velocity += GRAVITY / 60;
        y += velocity / 60;
        landing = level.platforms.find((platform) =>
          velocity >= 0 && x + playerWidth > platform.x && x < platform.x + platform.width &&
          previousBottom <= platform.y + 10 && y + playerHeight >= platform.y);
      }
      assert.ok(landing, `${level.id}: checkpoint ${checkpoint} reaparece por debajo del suelo`);
      assert.ok(landing.y < 660, `${level.id}: checkpoint ${checkpoint} cae fuera de la pantalla`);
      assert.ok(![...(level.spikePits ?? []), ...(level.deadlyWater ?? [])].some((hazard) =>
        x + playerWidth > hazard.x && x < hazard.x + hazard.width &&
        landing.y > hazard.y && landing.y - playerHeight < hazard.y + hazard.height),
      `${level.id}: checkpoint ${checkpoint} aterriza en un peligro`);
    }
  }
  assert.equal(checkpointCount, 156);
});

test("el mundo del agua se abre entre los dos bosques desde una poza segura", () => {
  const aquatic = levels.filter((level) => level.world === 8);
  assert.deepEqual(aquatic.map((level) => level.id), ["A-1", "A-2", "A-3"]);
  assert.equal(levels[levels.findIndex((level) => level.id === "3-3") + 1].id, "A-1");
  assert.equal(levels[levels.findIndex((level) => level.id === "A-3") + 1].id, "4-1");
  assert.equal(aquatic[2].boss, "shark-captain");
  assert.equal(levels.filter((level) => level.world !== 7 && level.world !== 8).length, 30);
  assert.equal(levels.find((level) => level.id === "2-3")?.waterEntrance, undefined);
  const forest = levels.find((level) => level.id === "3-3")!;
  const entrance = forest.waterEntrance!;
  assert.ok(entrance);
  assert.ok(!forest.platforms.some((platform) => platform.y >= 456 && platform.x < entrance.x + entrance.width && platform.x + platform.width > entrance.x));
  assert.ok(forest.platforms.some((platform) => platform.y === 456 && platform.x + platform.width === entrance.x));
  assert.ok(forest.platforms.some((platform) => platform.y === 456 && platform.x === entrance.x + entrance.width));
  for (const level of aquatic) {
    assert.ok(level.waterZones?.length);
    assert.ok(level.enemies.some((enemy) => enemy.kind === "fish"));
    assert.ok(level.enemies.some((enemy) => enemy.kind === "urchin"));
    assert.ok(level.items.some((item) => item.id === `sticker-a-${level.screen}`));
    for (const checkpoint of level.checkpoints) {
      assert.ok(level.platforms.some((platform) => platform.kind === "sea-ground" && platform.x <= checkpoint + 22 && platform.x + platform.width >= checkpoint + 64));
      assert.ok(!level.enemies.some((enemy) => enemy.kind === "urchin" && Math.abs(enemy.x - (checkpoint + 22)) < 80));
    }
  }
});

test("los doce jefes del álbum tienen retrato y duelo", () => {
  const bosses = levels.filter((level) => level.boss);
  assert.equal(bosses.length, 12);
  assert.equal(new Set(bosses.map((level) => level.boss)).size, 12);
  for (const level of bosses) {
    assert.ok(level.boss);
    const boss = bossCatalog[level.boss];
    assert.ok(boss?.name);
    const portrait = readFileSync(new URL(`../../public/${boss.assetAtlas?.slice(2) ?? `${boss.assetPrefix.slice(2)}-0.png`}`, import.meta.url));
    assert.equal(portrait.toString("ascii", 1, 4), "PNG", `Falta el retrato de ${boss.name}`);
  }
});

test("los muelles grandes llegan más alto que el doble salto y tienen destinos", () => {
  const doubleJumpRise = (JUMP_SPEED ** 2 + (JUMP_SPEED * 0.94) ** 2) / (2 * GRAVITY);
  const springRise = SPRING_SPEED ** 2 / (2 * GRAVITY);
  assert.ok(springRise > doubleJumpRise + 100);
  for (const level of levels.filter((entry) => entry.world === 1)) {
    const springs = level.platforms.filter((platform) => platform.kind === "spring");
    assert.equal(springs.length, 2, `Faltan muelles en ${level.id}`);
    for (const spring of springs) {
      assert.equal(spring.height, 58);
      assert.ok(level.platforms.some((platform) =>
        platform.kind === "branch" && platform.y <= 95 &&
        platform.x < spring.x + spring.width && platform.x + platform.width > spring.x &&
        spring.y - platform.y < springRise), `Sin destino alto para el muelle de ${level.id}`);
    }
  }
  const png = readFileSync(new URL("../../public/assets/sprites/spring-large-v1.png", import.meta.url));
  assert.equal(png.toString("ascii", 1, 4), "PNG");
  assert.equal(png[25], 6, "El muelle debe tener transparencia RGBA");
});

test("la plataforma secreta de los jabalíes exige el muelle", () => {
  const level = levels.find((entry) => entry.id === "4-3");
  assert.ok(level);
  const block = level.rewardBlocks.find((reward) => reward.reward === "secret-vine");
  assert.ok(block);
  const destination = level.platforms.find((platform) => platform.kind === "canopy" && platform.x <= block.x && platform.x + platform.width >= block.x + 48 && platform.y === 190);
  const spring = level.platforms.find((platform) => platform.kind === "spring" && platform.x < block.x && platform.x + platform.width > block.x);
  assert.ok(destination);
  assert.ok(spring);
  assert.equal(level.platforms.filter((platform) => platform.kind === "canopy" && platform.y >= 430).length, 0,
    "No deben quedar repisas decorativas pegadas al suelo junto al muelle");
  const doubleJumpRise = (JUMP_SPEED ** 2 + (JUMP_SPEED * 0.94) ** 2) / (2 * GRAVITY);
  const springRise = SPRING_SPEED ** 2 / (2 * GRAVITY);
  assert.ok(spring.y - destination.y < springRise);
  assert.ok(456 - destination.y > doubleJumpRise);
  for (const other of level.platforms.filter((platform) => platform !== destination && platform.kind !== "spring")) {
    const gap = Math.max(0, destination.x - (other.x + other.width), other.x - (destination.x + destination.width));
    const rise = other.y - destination.y;
    if (rise > doubleJumpRise) continue;
    // Tiempo máximo a esta altura con el segundo salto en cualquier momento del vuelo.
    let maxFlightTime = 0;
    for (let tick = 0; tick <= 760; tick += 1) {
      const doubleJumpAt = tick / 1000;
      const firstRise = JUMP_SPEED * doubleJumpAt - GRAVITY * doubleJumpAt ** 2 / 2;
      const remainingRise = rise - firstRise;
      const discriminant = (JUMP_SPEED * 0.94) ** 2 - 2 * GRAVITY * remainingRise;
      if (discriminant < 0) continue;
      const landingAtHeight = doubleJumpAt + (JUMP_SPEED * 0.94 + Math.sqrt(discriminant)) / GRAVITY;
      maxFlightTime = Math.max(maxFlightTime, landingAtHeight);
    }
    assert.ok(gap > 250 * maxFlightTime, `Otra plataforma alcanza la repisa secreta: x=${other.x}`);
  }
});

test("el castillo tiene tres pantallas, un jefe y una pegatina por pantalla", () => {
  assert.deepEqual(castle.map((level) => level.id), ["6-1", "6-2", "6-3"]);
  assert.equal(castle[2].boss, "vampire-count");
  for (const level of castle) {
    const sticker = level.items.find((item) => item.kind === "sticker");
    assert.equal(sticker?.id, `sticker-${level.id}`);
    assert.ok(stickerCatalog.some((entry) => entry.id === sticker?.id));
    assert.ok(level.enemies.some((enemy) => enemy.kind === "ghost"));
  }
});

test("la isla jurásica continúa tras el castillo y todos sus huecos son agua mortal", () => {
  const island = levels.filter((level) => level.world === 9);
  assert.deepEqual(island.map((level) => level.id), ["9-1", "9-2", "9-3"]);
  assert.equal(levels.find((level) => level.id === "6-3")?.route?.next, "9-1");
  assert.equal(island[2].route?.next, "10-1");
  assert.equal(island[2].boss, "triceratops-queen");
  for (const level of island) {
    assert.ok(level.enemies.some((enemy) => enemy.kind === "baby-t-rex"));
    assert.ok(level.enemies.some((enemy) => enemy.kind === "pterodactyl"));
    assert.equal(level.items.find((item) => item.kind === "sticker")?.id, `sticker-${level.id}`);
    const floors = level.platforms.filter((platform) => platform.kind === "dino-ground").sort((a, b) => a.x - b.x);
    const gaps = floors.slice(0, -1).map((floor, index) => [floor.x + floor.width, floors[index + 1].x] as const);
    assert.equal(level.deadlyWater?.length, gaps.length);
    gaps.forEach(([start, end], index) => {
      assert.equal(level.deadlyWater?.[index].x, start);
      assert.equal(level.deadlyWater?.[index].width, end - start);
    });
    if (level.screen === 1) assert.equal(level.waterJumpers, undefined);
    else {
      assert.equal(level.waterJumpers?.length, gaps.length);
      for (const fish of level.waterJumpers ?? []) {
        assert.ok(fish.interval >= 2 && fish.interval <= 3);
        assert.ok(level.deadlyWater?.some((water) => fish.x >= water.x && fish.x + fish.width <= water.x + water.width), `${fish.id} debe saltar desde el agua`);
      }
    }
  }
});

test("los tres nuevos mundos forman una aventura completa con mecánicas propias", () => {
  const expectations = [
    { world: 10, ids: ["10-1", "10-2", "10-3"], boss: "ruby-dragon", enemies: ["baby-dragon", "fire-salamander", "flying-dragon"], platform: "volcano-ground" },
    { world: 11, ids: ["11-1", "11-2", "11-3"], boss: "queen-bee", enemies: ["ant", "snail", "bee"], platform: "garden-ground" },
    { world: 12, ids: ["12-1", "12-2", "12-3"], boss: "polar-bear", enemies: ["penguin", "snow-fox", "snowy-owl"], platform: "ice-ground" },
  ] as const;
  for (const expected of expectations) {
    const world = levels.filter((level) => level.world === expected.world);
    assert.deepEqual(world.map((level) => level.id), [...expected.ids]);
    assert.equal(world[2].boss, expected.boss);
    for (const level of world) {
      assert.ok(level.width >= 5600, `${level.id} debe ser más largo que los mundos iniciales`);
      assert.equal(level.items.find((item) => item.kind === "sticker")?.id, `sticker-${level.id}`);
      assert.ok(level.platforms.some((platform) => platform.kind === expected.platform));
      assert.ok(level.deadlyWater?.length);
    }
    for (const kind of expected.enemies) assert.ok(world.some((level) => level.enemies.some((enemy) => enemy.kind === kind)));
  }
  for (const level of levels.filter((entry) => entry.world === 10)) assert.ok(level.lavaJets?.length, `${level.id} necesita chorros de lava`);
  for (const level of levels.filter((entry) => entry.world === 11)) assert.ok(level.platforms.some((platform) => platform.kind === "dew"), `${level.id} necesita gotas de rocío`);
  for (const level of levels.filter((entry) => entry.world === 12)) assert.ok(level.windZones?.length, `${level.id} necesita ráfagas de viento`);
  assert.equal(levels.find((level) => level.id === "12-3")?.route?.finale, true);
});

test("el valle usa monstruos gigantes y trampolines sin tapar los precipicios", () => {
  for (const level of levels.filter((entry) => entry.world === 11)) {
    const pits = level.deadlyWater ?? [];
    for (const enemy of level.enemies) {
      assert.ok(enemy.width >= 76 && enemy.height >= 64, `${level.id}: ${enemy.id} debe ser más grande que Noa`);
    }
    for (const platform of level.platforms.filter((entry) => entry.kind === "dew" || entry.kind === "garden-ledge")) {
      assert.ok(!pits.some((pit) => platform.x < pit.x + pit.width && platform.x + platform.width > pit.x), `${level.id}: ${platform.kind} en ${platform.x} no debe cubrir un precipicio`);
      if (platform.kind === "dew") {
        assert.equal(platform.y + platform.height, 456, `${level.id}: el trampolín debe descansar sobre el suelo`);
        assert.ok(level.platforms.some((ground) => ground.kind === "garden-ground" && ground.x <= platform.x && ground.x + ground.width >= platform.x + platform.width), `${level.id}: el trampolín debe estar completamente sobre terreno seguro`);
      }
    }
  }
});

test("las cajas de los mundos nuevos flotan sobre apoyos alcanzables", () => {
  const maxJumpRise = JUMP_SPEED ** 2 / (2 * GRAVITY);
  for (const level of levels.filter((entry) => entry.world >= 10)) {
    for (const block of level.rewardBlocks) {
      const support = level.platforms
        .filter((platform) => platform.kind !== "dew" && platform.x <= block.x && platform.x + platform.width >= block.x + 48 && platform.y > block.y + 48)
        .sort((a, b) => a.y - b.y)[0];
      assert.ok(support, `${level.id}: la caja ${block.id} no tiene apoyo debajo`);
      const distanceToHit = support.y - 58 - (block.y + 48);
      assert.ok(distanceToHit >= 35 && distanceToHit < maxJumpRise, `${level.id}: la caja ${block.id} debe flotar con espacio visible (${distanceToHit}px)`);
    }
  }
});

test("las cajas jurásicas sobre repisas tienen espacio para golpearlas desde abajo", () => {
  const maxJumpRise = JUMP_SPEED ** 2 / (2 * GRAVITY);
  for (const level of levels.filter((entry) => entry.world === 9 && entry.screen >= 2)) {
    for (const block of level.rewardBlocks) {
      const support = level.platforms
        .filter((platform) => platform.x <= block.x && platform.x + platform.width >= block.x + 48 && platform.y > block.y + 48)
        .sort((a, b) => a.y - b.y)[0];
      assert.ok(support, `${level.id}: la caja ${block.id} no tiene apoyo debajo`);
      const distanceToHit = support.y - 58 - (block.y + 48);
      assert.ok(distanceToHit >= 14 && distanceToHit < maxJumpRise,
        `${level.id}: la caja ${block.id} está demasiado cerca o lejos del apoyo (${distanceToHit}px)`);
    }
  }
});

test("el bloque de gato tras el segundo checkpoint del conde exige usar la repisa", () => {
  const level = levels.find((entry) => entry.id === "6-3");
  const block = level?.rewardBlocks.find((reward) => reward.id === "c3r2");
  assert.ok(block);
  assert.equal(block.y, 210);
  assert.ok(level?.platforms.some((platform) =>
    platform.kind === "castle-ledge" && platform.x <= block.x && platform.x + platform.width >= block.x + 48 && platform.y > block.y,
  ));
});

test("las cajas del castillo se golpean desde apoyos seguros, sin quedar pegadas a las repisas", () => {
  const maxJumpRise = JUMP_SPEED ** 2 / (2 * GRAVITY);
  for (const level of castle) {
    for (const block of level.rewardBlocks) {
      const support = level.platforms
        .filter((platform) => platform.x <= block.x && platform.x + platform.width >= block.x + 48 && platform.y > block.y + 48)
        .sort((a, b) => a.y - b.y)[0];
      assert.ok(support, `${level.id}: la caja ${block.id} no tiene apoyo debajo`);
      const distanceToHit = support.y - 58 - (block.y + 48);
      assert.ok(distanceToHit >= 14 && distanceToHit < maxJumpRise,
        `${level.id}: la caja ${block.id} está demasiado cerca o lejos del apoyo (${distanceToHit}px)`);
      if (block.id !== "c3r2") {
        assert.ok(!level.spikePits?.some((pit) => pit.x < block.x + 48 && pit.x + pit.width > block.x),
          `${level.id}: la caja ${block.id} queda sobre los pinchos`);
      }
    }
  }
});

test("cada hueco del castillo contiene pinchos y los puntos seguros tienen suelo", () => {
  for (const level of castle) {
    const floors = level.platforms.filter((platform) => platform.kind === "castle-ground").sort((a, b) => a.x - b.x);
    const gaps = floors.slice(0, -1).map((floor, index) => [floor.x + floor.width, floors[index + 1].x] as const);
    assert.equal(level.spikePits?.length, gaps.length);
    gaps.forEach(([start, end], index) => {
      assert.equal(level.spikePits?.[index].x, start);
      assert.equal(level.spikePits?.[index].width, end - start);
      assert.ok(end - start < 190, `Hueco demasiado ancho en ${level.id}`);
    });
    for (const x of [level.start.x, ...level.checkpoints, level.goalX]) {
      assert.ok(floors.some((floor) => x >= floor.x && x < floor.x + floor.width), `Sin suelo en ${level.id}, x=${x}`);
    }
  }
});

test("el reino secreto conserva sus identificadores y está después de la campaña", () => {
  const secret = levels.at(-1);
  assert.equal(secret?.id, "S-1");
  assert.equal(secret.world, 7);
  assert.deepEqual(stickerCatalog.filter((entry) => entry.world === 7).map((entry) => entry.id), ["sticker-s-1", "sticker-s-2", "sticker-s-3"]);
});

test("todas las insignias del juego tienen un sprite transparente y su celda correcta", () => {
  const ids = levels.flatMap((level) => level.items.filter((item) => item.kind === "sticker").map((item) => item.id));
  assert.equal(ids.length, 36);
  assert.deepEqual(new Set(ids), new Set(stickerCatalog.map((entry) => entry.id)));
  for (const sticker of stickerCatalog) {
    const sprite = getStickerSprite(sticker.id);
    assert.ok(sprite);
    assert.equal(sprite.column, Number(sticker.id.at(-1)) - 1);
    assert.equal(sprite.src, `./assets/stickers/world-${sticker.world}-v1.png`);
    const png = readFileSync(new URL(`../../public/${sprite.src.slice(2)}`, import.meta.url));
    assert.equal(png.toString("ascii", 1, 4), "PNG");
    assert.equal(png.readUInt32BE(16), 2172);
    assert.equal(png.readUInt32BE(20), 724);
    assert.equal(png[25], 6, "El atlas debe conservar la transparencia RGBA");
  }
});

test("los lobos dormilones se introducen con sueño largo y aviso antes de despertar", () => {
  const forest = levels.filter((level) => level.world === 3);
  assert.deepEqual(forest.map((level) => level.enemies.filter((enemy) => enemy.sleepCycle).length), [4, 6, 7]);
  for (const level of levels) {
    for (const enemy of level.enemies) {
      if (level.world !== 3 || enemy.kind !== "wolf") {
        assert.equal(enemy.sleepCycle, undefined, `${level.id}: solo los lobos de este bosque duermen`);
        continue;
      }
      const cycle = enemy.sleepCycle;
      assert.ok(cycle, `${level.id}: ${enemy.id} necesita su ciclo de sueño`);
      assert.ok(Object.values(cycle).every(Number.isFinite));
      assert.ok(cycle.interval >= 10 && cycle.interval <= 12);
      assert.ok(cycle.sleepDuration >= 6 && cycle.sleepDuration >= cycle.interval / 2);
      assert.ok(cycle.warningDuration >= 1.5);
      assert.ok(cycle.sleepDuration + cycle.warningDuration <= cycle.interval - 2);
      assert.ok(cycle.delay >= 0 && cycle.delay < cycle.sleepDuration, "El primer estado debe ser dormido");
      assert.ok(level.platforms.some((platform) =>
        platform.kind === "ground" && platform.x <= enemy.minX &&
        platform.x + platform.width >= enemy.maxX + enemy.width));
    }
  }
  const firstWolf = forest[0].enemies[0];
  assert.equal(firstWolf.sleepCycle?.delay, 0);
  assert.ok(firstWolf.sleepCycle!.sleepDuration > (firstWolf.x - forest[0].start.x) / 250 + 3,
    "El primer lobo debe dar tiempo para reconocer los ZZZ y pasar");
});

test("los puentes de flores son opcionales, avisan con tiempo y no sostienen checkpoints", () => {
  const valley = levels.filter((level) => level.world === 11);
  assert.deepEqual(valley.map((level) => level.bloomBridges?.length), [1, 3, 4]);
  for (const level of levels) {
    if (level.world !== 11) {
      assert.equal(level.bloomBridges, undefined);
      continue;
    }
    const bridges = level.bloomBridges ?? [];
    assert.equal(new Set(bridges.map((bridge) => bridge.id)).size, bridges.length);
    for (const bridge of bridges) {
      assert.ok(Object.entries(bridge).filter(([key]) => key !== "id").every(([, value]) => typeof value === "number" && Number.isFinite(value)));
      assert.ok(bridge.height > 0 && bridge.width > 0);
      assert.ok(bridge.interval >= 11 && bridge.interval <= 12);
      assert.ok(bridge.openDuration >= 7 && bridge.openDuration < bridge.interval);
      assert.ok(bridge.warningDuration >= 1.8 && bridge.warningDuration < bridge.openDuration);
      assert.ok(bridge.openDuration + bridge.warningDuration <= bridge.interval - 2);
      assert.ok(bridge.delay >= 0 && bridge.delay < bridge.openDuration);
      const pit = level.deadlyWater?.find((pit) =>
        bridge.x <= pit.x && bridge.x + bridge.width >= pit.x + pit.width);
      assert.ok(pit, `${level.id}: ${bridge.id} debe ayudar sobre un hueco existente`);
      assert.ok(bridge.y <= pit.y - 14, "Los pies deben quedar fuera del peligro");
      assert.ok(pit.x - bridge.x <= 20 && bridge.x + bridge.width - pit.x - pit.width <= 20,
        "La flor no debe sustituir los recorridos permanentes");
      const floors = level.platforms.filter((platform) => platform.kind === "garden-ground");
      assert.ok(floors.some((floor) => floor.x + floor.width === pit.x));
      assert.ok(floors.some((floor) => floor.x === pit.x + pit.width));

      let x = pit.x - 42;
      let y = 456 - 58;
      let velocity = -JUMP_SPEED;
      do {
        velocity += GRAVITY / 60;
        x += 250 / 60;
        y += velocity / 60;
      } while (y + 58 < 456);
      assert.ok(x + 42 > pit.x + pit.width, `${level.id}: el hueco debe poder saltarse con la flor cerrada`);
      assert.ok((pit.width / 2 + 42) / 250 < bridge.warningDuration,
        "El aviso debe permitir salir hacia una orilla segura");
      for (const checkpoint of level.checkpoints) {
        assert.ok(checkpoint + 64 <= bridge.x || checkpoint >= bridge.x + bridge.width,
          `${level.id}: el checkpoint ${checkpoint} no debe estar sobre pétalos temporales`);
      }
      for (const x of [level.start.x, level.goalX]) {
        assert.ok(x + 42 <= bridge.x || x >= bridge.x + bridge.width);
      }
    }
  }
});

test("las tres corrientes del reino secreto son ayudas locales con entrada y destino permanentes", () => {
  const secret = levels.find((level) => level.id === "S-1")!;
  const columns = secret.updrafts ?? [];
  assert.equal(columns.length, 3);
  assert.equal(new Set(columns.map((column) => column.id)).size, 3);
  assert.ok(columns.reduce((total, column) => total + column.width, 0) < secret.width / 10);
  for (const level of levels.filter((level) => level.id !== "S-1")) assert.equal(level.updrafts, undefined);
  for (const column of columns) {
    assert.ok(Object.entries(column).filter(([key]) => key !== "id").every(([, value]) => typeof value === "number" && Number.isFinite(value)));
    assert.ok(column.x > secret.start.x + 42 && column.x + column.width < secret.goalX);
    assert.ok(column.width >= 140 && column.width <= 180);
    assert.ok(column.y >= 60 && column.height > 0 && column.y + column.height <= 456);
    assert.ok(column.strength > GRAVITY && column.strength <= GRAVITY + 500);
    assert.ok(column.maxRiseSpeed >= 100 && column.maxRiseSpeed <= 145);
    assert.ok(secret.platforms.some((platform) =>
      platform.y === column.y + column.height && platform.x <= column.x &&
      platform.x + platform.width >= column.x + 42), `${column.id}: falta una entrada sobre una nube`);
    assert.ok(secret.platforms.some((platform) =>
      platform.y > column.y && platform.y < column.y + column.height - 80 &&
      platform.x < column.x + column.width && platform.x + platform.width > column.x),
    `${column.id}: falta una nube alta donde salir del aire`);
    for (const checkpoint of secret.checkpoints) {
      assert.ok(checkpoint + 64 <= column.x || checkpoint >= column.x + column.width);
    }
  }
  for (let index = 1; index < columns.length; index += 1) {
    assert.ok(columns[index].x - columns[index - 1].x - columns[index - 1].width >= 1000,
      "Las corrientes no deben enlazarse para saltarse el reino entero");
  }
});

test("cada mundo presente conserva una identidad jugable propia", () => {
  const worlds = new Set(levels.map((level) => level.world));
  assert.equal(worlds.size, 12);
  for (const world of worlds) {
    const screens = levels.filter((level) => level.world === world);
    const platforms = screens.flatMap((level) => level.platforms);
    const enemies = screens.flatMap((level) => level.enemies);
    switch (world) {
      case 1:
        assert.ok(platforms.some((platform) => platform.kind === "spring"));
        break;
      case 2:
        assert.ok(platforms.some((platform) => platform.kind === "cave-wall"));
        break;
      case 3:
        assert.ok(enemies.some((enemy) => enemy.kind === "wolf" && enemy.sleepCycle));
        assert.deepEqual(screens.filter((level) => level.enemies.some((enemy) => enemy.kind === "wolf" && enemy.sleepCycle)).map((level) => level.id),
          ["3-1", "3-2", "3-3"]);
        break;
      case 4:
        assert.ok(enemies.some((enemy) => enemy.kind === "boar"));
        assert.ok(platforms.some((platform) => platform.kind === "canopy"));
        break;
      case 5:
        assert.ok(screens.some((level) => level.cannons?.length));
        break;
      case 6:
        assert.ok(screens.some((level) => level.spikePits?.length));
        break;
      case 7:
        assert.deepEqual(screens.filter((level) => level.updrafts?.length).map((level) => level.id), ["S-1"]);
        break;
      case 8:
        assert.ok(screens.some((level) => level.waterZones?.length));
        break;
      case 9:
        assert.ok(screens.some((level) => level.waterJumpers?.length && level.deadlyWater?.length));
        break;
      case 10:
        assert.ok(screens.some((level) => level.lavaJets?.length));
        break;
      case 11:
        assert.deepEqual(screens.filter((level) => level.bloomBridges?.length).map((level) => level.id),
          ["11-1", "11-2", "11-3"]);
        break;
      case 12:
        assert.ok(screens.some((level) =>
          level.platforms.some((platform) => platform.kind === "ice-ground" || platform.kind === "ice-ledge" || platform.kind === "ice-wall") &&
          level.windZones?.length));
        break;
      default:
        assert.fail(`El mundo ${world} necesita una comprobación de identidad jugable`);
    }
  }
});
