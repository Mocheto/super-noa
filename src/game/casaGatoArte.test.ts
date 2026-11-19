import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { ANIMACIONES_GATO, CLAVES_GATO, COLUMNAS_GATO, cuadroDe, FILAS_GATO, LAZO_DORADO, PALETAS_GATITOS, recolorear, tablaDeColores } from "./casaGatoArte.ts";
import { MUNDOS_CASA } from "./casaRescate.ts";

const asset = (path: string) => existsSync(new URL(`../../public/assets/${path}`, import.meta.url));

test("la hoja del gato tiene 13 filas, con hasta cuatro cuadros, y su arte existe", () => {
  assert.equal(FILAS_GATO, 13);
  const filas = Object.values(ANIMACIONES_GATO).map((a) => a.fila).sort((a, b) => a - b);
  assert.deepEqual(filas, Array.from({ length: 13 }, (_, i) => i));
  assert.ok(Object.values(ANIMACIONES_GATO).every((a) => a.cuadros >= 1 && a.cuadros <= COLUMNAS_GATO));
  assert.equal(Object.values(ANIMACIONES_GATO).reduce((total, a) => total + a.cuadros, 0), 32);
  for (const archivo of ["sprites/gato-casa-v1.webp", "sprites/casa-objetos-v1.webp", "sprites/casa-ventana-noche-v1.webp", "worlds/casa-habitacion-v1.webp", "sprites/roca-asoma-v1.webp"]) {
    assert.ok(asset(archivo), archivo);
  }
});

test("los cuadros avanzan en bucle a su velocidad", () => {
  assert.equal(cuadroDe("andar", 0), 0);
  assert.equal(cuadroDe("andar", 1 / 8), 1);
  assert.equal(cuadroDe("andar", 4 / 8), 0, "vuelve a empezar");
  assert.equal(cuadroDe("cola", 99), 0, "un solo cuadro");
});

test("cada gatito de la casa tiene paleta y el cambio de color respeta barro y lazo", () => {
  for (const mundo of MUNDOS_CASA) assert.ok(PALETAS_GATITOS[mundo], `paleta del mundo ${mundo}`);
  const pixel = (rgb: readonly number[]) => new Uint8ClampedArray([...rgb, 255]);
  const limpio = tablaDeColores(PALETAS_GATITOS[2], { sucio: false, mejorAmigo: false });
  assert.deepEqual([...recolorear(pixel(CLAVES_GATO.pelo), limpio)], [...PALETAS_GATITOS[2].pelo, 255]);
  assert.deepEqual([...recolorear(pixel(CLAVES_GATO.barro), limpio)], [...PALETAS_GATITOS[2].pelo, 255], "limpio, el barro es pelo");
  assert.equal(recolorear(pixel(CLAVES_GATO.lazo), limpio)[3], 0, "sin cinco corazones no hay lazo");
  const sucioAmigo = tablaDeColores(PALETAS_GATITOS[2], { sucio: true, mejorAmigo: true });
  assert.deepEqual([...recolorear(pixel(CLAVES_GATO.barro), sucioAmigo)], [...CLAVES_GATO.barro, 255]);
  assert.deepEqual([...recolorear(pixel(CLAVES_GATO.lazo), sucioAmigo)], [...LAZO_DORADO, 255]);
  assert.deepEqual([...recolorear(pixel([255, 255, 255]), limpio)], [255, 255, 255, 255], "la espuma no cambia");
});
