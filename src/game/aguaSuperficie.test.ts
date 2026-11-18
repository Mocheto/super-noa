import assert from "node:assert/strict";
import test from "node:test";
import { GRAVITY, platformSurfaceY, resolveHorizontalWallCollision } from "./gameplay.ts";
import { waterLevels } from "./levels.ts";

// Noa mide 42 × 58. En la superficie flota con el 60 % del cuerpo justo sobre la línea del agua
// (`waterAt` y el reposo de `GameCanvas`), y una brazada a 190 px/s la saca unos 11 px.
const NOA = { width: 42, height: 58 };
const BRAZADA = 190 ** 2 / (2 * GRAVITY);
const SUELO_MARINO = 490;
const rocasEsperadas: Record<string, number> = { "A-1": 2, "A-2": 3, "A-3": 4 };

const superficie = (level: (typeof waterLevels)[number]) => {
  const agua = level.waterZones![0];
  const reposo = agua.y + 1 - NOA.height * 0.6;
  return { agua, reposo, cima: reposo - BRAZADA };
};

/** Paredes que paran a Noa nadando por la superficie, a cualquier altura entre el reposo y lo alto de la brazada. */
const paredesEnLaSuperficie = (level: (typeof waterLevels)[number]) => {
  const { reposo, cima } = superficie(level);
  return level.platforms.filter((platform) => [cima, (cima + reposo) / 2, reposo].every((y) =>
    resolveHorizontalWallCollision(platform.x - NOA.width - 2, platform.x - NOA.width + 6, y, NOA.width, NOA.height, platform) !== platform.x - NOA.width + 6));
};

test("nadar pegada a la superficie no llega a la bandera en ninguna acuática", () => {
  assert.deepEqual(waterLevels.map((level) => level.id), Object.keys(rocasEsperadas));
  for (const level of waterLevels) {
    const paredes = paredesEnLaSuperficie(level).filter((platform) => platform.x > level.start.x && platform.x < level.goalX);
    assert.equal(paredes.length, rocasEsperadas[level.id], `${level.id}: rocas que cierran la superficie`);
    assert.ok(paredes.every((platform) => platform.asoma), `${level.id}: solo las rocas que asoman cierran la superficie`);
  }
});

test("a la roca que asoma no se sube con una brazada ni se pasa por encima", () => {
  for (const level of waterLevels) {
    const { agua, reposo, cima } = superficie(level);
    for (const roca of level.platforms.filter((platform) => platform.asoma)) {
      const etiqueta = `${level.id} roca en x=${roca.x}`;
      assert.equal(platformSurfaceY(roca), roca.y, `${etiqueta}: sin franja de algas`);
      assert.ok(agua.y - roca.y >= 20 && agua.y - roca.y <= 40, `${etiqueta}: la cima asoma entre 20 y 40 px`);
      // Para posarse encima, el pie tendría que llegar a 10 px de la cima; con la brazada no llega.
      assert.ok(cima + NOA.height > roca.y + 10, `${etiqueta}: la brazada no la sube`);
      assert.ok(reposo < roca.y + roca.height, `${etiqueta}: cubre el cuerpo en reposo`);
    }
  }
});

test("bajo cada roca que asoma queda un paso amable", () => {
  for (const level of waterLevels) {
    for (const roca of level.platforms.filter((platform) => platform.asoma)) {
      const etiqueta = `${level.id} roca en x=${roca.x}`;
      const fondo = roca.y + roca.height;
      assert.ok(SUELO_MARINO - fondo >= 120, `${etiqueta}: paso de al menos 120 px`);
      const desde = roca.x - 80;
      const hasta = roca.x + roca.width + 80;
      for (const enemigo of level.enemies) {
        const recorrido = [Math.min(enemigo.minX, enemigo.x), Math.max(enemigo.maxX, enemigo.x) + enemigo.width];
        const enElPaso = enemigo.y + enemigo.height > fondo;
        assert.ok(!(enElPaso && recorrido[1] > desde && recorrido[0] < hasta), `${etiqueta}: ${enemigo.id} en la entrada del paso`);
      }
      for (const checkpoint of level.checkpoints) {
        assert.ok(checkpoint + NOA.width < roca.x || checkpoint > roca.x + roca.width, `${etiqueta}: el punto seguro ${checkpoint} cae dentro`);
      }
      for (const item of level.items) {
        const dentro = item.x + 30 > roca.x && item.x < roca.x + roca.width && item.y + 30 > roca.y && item.y < fondo;
        assert.ok(!dentro, `${etiqueta}: ${item.id} queda dentro de la roca`);
      }
      for (const otra of level.platforms.filter((platform) => platform !== roca && platform.kind === "sea-wall")) {
        const solapa = otra.x < roca.x + roca.width && otra.x + otra.width > roca.x;
        assert.ok(!solapa, `${etiqueta}: otro arrecife tapa el paso`);
      }
    }
  }
});
