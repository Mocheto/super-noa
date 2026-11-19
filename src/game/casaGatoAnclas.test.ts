import assert from "node:assert/strict";
import test from "node:test";
import { ANCLAS_GATO } from "./casaGatoAnclas.ts";
import { ANIMACIONES_GATO, CUADRO_GATO, type AnimacionGato } from "./casaGatoArte.ts";

const animaciones = Object.keys(ANIMACIONES_GATO) as AnimacionGato[];

test("cada cuadro de la hoja del gato tiene sus anclas, dentro del cuadro", () => {
  for (const animacion of animaciones) {
    assert.equal(ANCLAS_GATO[animacion].length, ANIMACIONES_GATO[animacion].cuadros, animacion);
    for (const anclas of ANCLAS_GATO[animacion]) {
      for (const punto of [anclas.cabeza, anclas.ojos, anclas.cuello]) {
        if (!punto) continue;
        assert.ok(punto.x >= 0 && punto.x < CUADRO_GATO && punto.y >= 0 && punto.y < CUADRO_GATO, animacion);
      }
    }
  }
});

test("de cabeza a cuello, en orden: el sombrero arriba, las gafas en medio y la bufanda abajo", () => {
  for (const animacion of animaciones) {
    for (const { cabeza, ojos, cuello } of ANCLAS_GATO[animacion]) {
      if (cabeza && ojos) assert.ok(cabeza.y < ojos.y, animacion);
      if (ojos && cuello) assert.ok(ojos.y < cuello.y, animacion);
    }
  }
});

test("despierto y fuera del baño se pueden poner los tres; de espaldas, sin gafas; dormido, solo el sombrero", () => {
  const sinLosTres = animaciones.flatMap((animacion) => ANCLAS_GATO[animacion]
    .map((anclas, cuadro) => ({ animacion, cuadro, anclas }))
    .filter(({ anclas }) => !(anclas.cabeza && anclas.ojos && anclas.cuello))
    .map(({ animacion, cuadro }) => `${animacion} ${cuadro}`));
  assert.deepEqual(sinLosTres, ["dormir 0", "dormir 1", "jugarSolo 0", "bano 0", "bano 1"]);
  assert.ok(ANCLAS_GATO.dormir.every((anclas) => anclas.cabeza));
});
