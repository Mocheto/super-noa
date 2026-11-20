import assert from "node:assert/strict";
import test from "node:test";
import { ANCLAS_VESTIDOR, BALDAS, cajaSobreElGatito, CUADRO_VESTIDOR, ESCALA_EN_CASA, fondoDePieza, piezasEnCuadro } from "./casaVestidorArte.ts";
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

test("cada pieza sale de su celda de la lámina de 4 × 3", () => {
  assert.equal(fondoDePieza("sombrero", "paja"), "0% 0%");
  assert.equal(fondoDePieza("gafas", "estrella"), `${(1 / 3) * 100}% 50%`);
  assert.equal(fondoDePieza("bufanda", "flecos"), "100% 100%");
});

test("las baldas van de arriba abajo sin pisarse, con el apoyo dentro de cada una", () => {
  const baldas = [BALDAS.sombrero, BALDAS.gafas, BALDAS.bufanda];
  baldas.forEach((balda, i) => {
    assert.ok(balda.arriba < balda.apoyo && balda.apoyo <= balda.abajo);
    if (i) assert.ok(baldas[i - 1].abajo <= balda.arriba);
  });
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
