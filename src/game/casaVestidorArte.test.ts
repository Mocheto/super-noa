import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { ANCLAS_VESTIDOR, cajaSobreElGatito, CUADRO_VESTIDOR, ESCALA_EN_CASA, FILAS_ARMARIO, fondoDePieza, LAMINAS, piezasEnCuadro, PIEZAS_POR_FILA } from "./casaVestidorArte.ts";
import { ACCESORIOS, TIPOS_ACCESORIO } from "./casaRopa.ts";
import { normalizeFotos } from "./casaFoto.ts";
import { HABITACION_CASA, sobreElArmario, sobreLaBanera } from "./casaHabitacion.ts";

const centro = (caja: ReturnType<typeof cajaSobreElGatito>) => ({ x: (caja.left + caja.width / 2) / 100 * CUADRO_VESTIDOR.ancho, y: (caja.top + caja.height / 2) / 100 * CUADRO_VESTIDOR.alto });

test("en el gatito grande, el sombrero va encima de la cabeza, las gafas en los ojos y la bufanda bajo el cuello", () => {
  const sombrero = cajaSobreElGatito("sombrero");
  assert.ok((sombrero.top + sombrero.height) / 100 * CUADRO_VESTIDOR.alto > ANCLAS_VESTIDOR.cabeza.y, "el ala baja de la cabeza");
  assert.ok(sombrero.top < 0, "el sombrero sobresale por arriba del cuadro");
  const gafas = centro(cajaSobreElGatito("gafas"));
  assert.ok(Math.abs(gafas.x - ANCLAS_VESTIDOR.ojos.x) < 1 && Math.abs(gafas.y - ANCLAS_VESTIDOR.ojos.y) < 1);
  const bufanda = cajaSobreElGatito("bufanda");
  assert.ok(Math.abs(bufanda.top / 100 * CUADRO_VESTIDOR.alto - (ANCLAS_VESTIDOR.cuello.y - 14)) < 1);
});

test("cada pieza sale de su celda: sombreros, gafas y bufandas en la lámina de 6 × 3; capas y alas, en la suya", () => {
  assert.deepEqual(fondoDePieza("sombrero", "paja"), { backgroundSize: "600% 300%", backgroundPosition: "0% 0%" });
  assert.deepEqual(fondoDePieza("gafas", "estrella"), { backgroundSize: "600% 300%", backgroundPosition: "20% 50%" });
  assert.deepEqual(fondoDePieza("bufanda", "manzanas"), { backgroundSize: "600% 300%", backgroundPosition: "100% 100%" });
  assert.deepEqual(fondoDePieza("capa", "navidad"), { backgroundSize: "600% 100%", backgroundPosition: "40% 0%" });
  // Cada ala, la mitad de su celda: la izquierda y la derecha del par.
  assert.deepEqual(fondoDePieza("alas", "mariposa", "izquierda"), { backgroundSize: "1200% 100%", backgroundPosition: "0% 0%" });
  assert.deepEqual(fondoDePieza("alas", "unicornio", "derecha"), { backgroundSize: "1200% 100%", backgroundPosition: "100% 0%" });
});

test("seis piezas de cada tipo, cada lámina existe y caben en las tres filas del armario, dos por fila", () => {
  for (const tipo of TIPOS_ACCESORIO) {
    assert.equal(ACCESORIOS[tipo].length, 6, tipo);
    assert.ok(existsSync(new URL(`../../public/${LAMINAS[tipo].imagen.replace("./", "")}`, import.meta.url)), tipo);
  }
  assert.equal(FILAS_ARMARIO.length * PIEZAS_POR_FILA, 6);
  const todas = TIPOS_ACCESORIO.flatMap((tipo) => [...ACCESORIOS[tipo]]);
  assert.equal(new Set(todas).size, todas.length, "los identificadores no se repiten entre tipos");
  FILAS_ARMARIO.forEach((fila, i) => {
    assert.ok(fila.arriba < fila.apoyo && fila.apoyo <= fila.abajo);
    if (i) assert.ok(FILAS_ARMARIO[i - 1].abajo <= fila.arriba);
  });
});

test("la capa y las alas van detrás del gatito, colgando del cuello; se dibujan antes que él", () => {
  const capa = cajaSobreElGatito("capa");
  assert.ok(capa.top / 100 * CUADRO_VESTIDOR.alto < ANCLAS_VESTIDOR.cuello.y, "la capa empieza por encima del cuello");
  assert.ok(capa.width > 70, "y es más ancha que el gatito");
  const alas = centro(cajaSobreElGatito("alas"));
  assert.ok(Math.abs(alas.x - ANCLAS_VESTIDOR.cuello.x) < 1 && alas.y < ANCLAS_VESTIDOR.cuello.y, "las alas, a la altura de los hombros");
  const piezas = piezasEnCuadro({ sombrero: "paja", capa: "dragon", alas: "buho", bufanda: "rayas" }, "sentado", 0);
  assert.deepEqual(piezas.map((pieza) => [pieza.tipo, pieza.detras]), [["alas", true], ["capa", true], ["bufanda", false], ["sombrero", false]]);
});

test("el armario de la habitación no pisa la bañera y tiene los pies en el suelo", () => {
  const { armario, zonaArmario, suelo } = HABITACION_CASA;
  assert.equal(armario.top + armario.height, suelo.fondo - 5);
  assert.ok(sobreElArmario(HABITACION_CASA, armario.left + armario.width / 2, armario.top + armario.height / 2));
  for (let x = zonaArmario.izquierda; x <= zonaArmario.derecha; x += 10) {
    assert.equal(sobreLaBanera(HABITACION_CASA, x, 400), false);
  }
});

test("en la casa, cada cuadro pone las piezas que tienen sitio, de la bufanda al sombrero", () => {
  const ropa = { sombrero: "fiesta", gafas: "corazon", bufanda: "copos" } as const;
  assert.deepEqual(piezasEnCuadro(ropa, "sentado", 0).map((p) => p.tipo), ["bufanda", "gafas", "sombrero"]);
  assert.deepEqual(piezasEnCuadro(ropa, "dormir", 1).map((p) => p.tipo), ["sombrero"], "dormido sin mantita, solo el sombrero");
  assert.deepEqual(piezasEnCuadro(ropa, "jugarSolo", 0).map((p) => p.tipo), ["bufanda", "sombrero"], "de espaldas, sin gafas");
  assert.deepEqual(piezasEnCuadro({}, "sentado", 0), []);
  const [sombrero] = piezasEnCuadro({ sombrero: "paja" }, "sentado", 0);
  assert.ok(sombrero.caja.width < 100 * ESCALA_EN_CASA * 2, "más pequeño que en el vestidor");
});

test("las fotos guardan los accesorios de cada gatito y quitan los que no entienden", () => {
  const [foto] = normalizeFotos([{ hecha: "2026-11-20T10:00:00.000Z", vista: { x: 0, ancho: 640 }, gatitos: [
    { mundo: 1, x: 400, y: 450, animacion: "sentado", cuadro: 0, ropa: { gafas: "buceo", capa: "roja" } },
    { mundo: 2, x: 500, y: 450, animacion: "sentado", cuadro: 0, ropa: { sombrero: "corona" } },
  ] }]);
  assert.deepEqual(foto.gatitos[0].ropa, { gafas: "buceo" });
  assert.equal("ropa" in foto.gatitos[1], false);
});
