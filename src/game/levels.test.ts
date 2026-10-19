import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { levels } from "./levels.ts";
import { GRAVITY, JUMP_SPEED, SPRING_SPEED } from "./gameplay.ts";
import { getStickerSprite, stickerCatalog } from "./stickers.ts";
import { bossCatalog } from "./bosses.ts";

const castle = levels.filter((level) => level.world === 6);

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
    { world: 10, ids: ["10-1", "10-2", "10-3"], boss: "ruby-dragon", enemies: ["baby-dragon", "fire-salamander"], platform: "volcano-ground" },
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
