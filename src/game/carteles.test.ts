import assert from "node:assert/strict";
import test from "node:test";
import { CARTEL_ARRIBA, CARTEL_HUECO, colocarCarteles, pistaDeLaPartida, pistasPosibles, techoCarteles, type EstadoPista } from "./carteles.ts";

const inicio = (cambios: Partial<EstadoPista>): EstadoPista => ({
  levelId: "14-1", world: 14, screen: 1, vertical: false, detour: false, bloomBridges: false, mecanicas: true,
  cameraX: 0, levelAge: 1, playerX: 120, playerY: 400, completed: false, ...cambios,
});

test("al empezar 14-1 y 16-1 tocan dos pistas, pero solo se enseña una", () => {
  for (const [levelId, world] of [["14-1", 14], ["16-1", 16]] as const) {
    const estado = inicio({ levelId, world });
    assert.equal(pistasPosibles(estado).length, 2, `${levelId}: ayuda de inicio y ayuda del mundo`);
    assert.match(pistaDeLaPartida(estado)!.claves[0], /ayudaInicio/, `${levelId}: primero la de inicio, que dura poco`);
    assert.match(pistaDeLaPartida({ ...estado, levelAge: 8 })!.claves[0], /ayudaMundo/, `${levelId}: luego la del mundo`);
  }
});

test("ninguna combinación de estados pide más de una pista a la vez", () => {
  for (const world of [1, 3, 6, 8, 10, 11, 13, 14, 15, 16, 17]) {
    for (const levelAge of [0, 5, 9]) {
      for (const playerX of [140, 600, 2000]) {
        const estado = inicio({ levelId: `${world}-1`, world, levelAge, playerX, cameraX: Math.max(0, playerX - 300) });
        const pista = pistaDeLaPartida(estado);
        assert.deepEqual(pista, pistasPosibles(estado)[0]);
      }
    }
  }
  assert.equal(pistaDeLaPartida(inicio({ world: 2, levelId: "2-1", mecanicas: false })), undefined);
});

test("los carteles no suben al HUD ni se pisan entre ellos", () => {
  const techo = 90;
  const pista = { x: 380, y: techo, ancho: 200, alto: 40 };
  const arribas = colocarCarteles([
    { centroX: 480, arriba: 40, ancho: 180, alto: 32 },
    { centroX: 500, arriba: 60, ancho: 180, alto: 32 },
    { centroX: 900, arriba: 300, ancho: 120, alto: 32 },
  ], techo, [pista]);
  assert.equal(arribas[0], pista.y + pista.alto + CARTEL_HUECO, "debajo de la pista");
  assert.equal(arribas[1], arribas[0] + 32 + CARTEL_HUECO, "debajo del otro cartel");
  assert.equal(arribas[2], 300, "el que no pisa nada se queda donde estaba");
  assert.ok(arribas.every((arriba) => arriba >= techo));
});

test("el techo de los carteles baja con el HUD cuando el lienzo se ve pequeño", () => {
  assert.equal(techoCarteles(undefined, 1), CARTEL_ARRIBA);
  assert.equal(techoCarteles(42, 1.17), CARTEL_ARRIBA, "escritorio: el HUD cabe sobre la primera fila");
  assert.ok(techoCarteles(26, 343 / 960) > CARTEL_ARRIBA, "móvil vertical: el HUD ocupa más lienzo");
});

test("los textos del lienzo miden al menos 14 px reales en cualquier pantalla", async () => {
  const { MINIMO_PX, ponerEscalaLienzo, tamanoLegible } = await import("./cartelLienzo.ts");
  for (const escala of [1.17, 800 / 960, 478 / 960, 343 / 960]) {
    ponerEscalaLienzo(escala);
    for (const tamano of [12, 13, 16, 24]) {
      assert.ok(tamanoLegible(tamano) * escala >= MINIMO_PX - .01, `${tamano} a escala ${escala.toFixed(2)}`);
      assert.ok(tamanoLegible(tamano) >= tamano, "nunca encoge");
    }
  }
  ponerEscalaLienzo(1);
  assert.equal(tamanoLegible(16), 16, "en escritorio no cambia");
});
