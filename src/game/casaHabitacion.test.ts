import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { dentroDelSuelo, escalaEnSuelo, HABITACION_CASA as H } from "./casaHabitacion.ts";
import { MUNDOS_CASA } from "./casaRescate.ts";

const asset = (ruta: string) => existsSync(new URL(`../../public/${ruta.replace("./", "")}`, import.meta.url));

test("la habitación de la casa es un dato con su fondo y su ventana de noche", () => {
  assert.equal(H.ancho, 1280);
  assert.ok(asset(H.fondo) && asset(H.ventanaNoche.imagen));
  assert.ok(H.ventanaNoche.left + H.ventanaNoche.width <= H.ancho && H.lampara.x < H.ancho);
});

test("todos los sitios de interés y de los gatitos están en el suelo por el que se anda", () => {
  for (const [id, sitio] of Object.entries(H.sitios)) assert.ok(dentroDelSuelo(H, sitio.x, sitio.y), id);
  for (const sitio of [...H.sitiosDia, ...H.sitiosNoche]) assert.ok(dentroDelSuelo(H, sitio.x, sitio.y), `${sitio.x},${sitio.y}`);
  assert.equal(H.sitiosDia.length, MUNDOS_CASA.length);
  assert.equal(H.sitiosNoche.length, MUNDOS_CASA.length);
});

test("de día los gatitos se separan al menos 120 px; los sitios de interés también entre sí", () => {
  const lejos = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y) >= 120;
  H.sitiosDia.forEach((a, i) => H.sitiosDia.slice(i + 1).forEach((b) => assert.ok(lejos(a, b))));
  const sitios = Object.values(H.sitios);
  sitios.forEach((a, i) => sitios.slice(i + 1).forEach((b) => assert.ok(lejos(a, b), `${a.x} y ${b.x}`)));
});

test("la profundidad hace al gatito más pequeño al fondo", () => {
  assert.equal(escalaEnSuelo(H, H.suelo.fondo), 0.8);
  assert.equal(escalaEnSuelo(H, H.suelo.delante), 1);
  assert.equal(escalaEnSuelo(H, 0), 0.8, "fuera del suelo se limita");
  assert.ok(escalaEnSuelo(H, 460) > 0.8 && escalaEnSuelo(H, 460) < 1);
});
