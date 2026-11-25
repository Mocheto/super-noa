import assert from "node:assert/strict";
import test from "node:test";
import { gatitoNuevo } from "./casa.ts";
import { avanzarAndante, decidir, gatitoBajo, ir, libre, nuevoAndante, parar, puntoLibre, SEPARACION, VELOCIDAD_GATITO, type Andante } from "./casaDeambular.ts";
import { dentroDelSuelo, escalaEnSuelo, HABITACION_CASA as H } from "./casaHabitacion.ts";

/** Azar repetible. */
const azarDe = (semilla: number) => () => { semilla = (semilla * 9301 + 49297) % 233280; return semilla / 233280; };
const contexto = (extra: Partial<Parameters<typeof decidir>[3]> = {}) => ({ habitacion: H, noche: false, casaLimpia: true, alguienPide: false, sitioNoche: H.sitiosNoche[0], azar: azarDe(7), ahora: 0, ...extra });
const ahora = new Date(2026, 10, 19, 10);

test("anda a velocidad constante en cualquier dirección y al llegar empieza su pose", () => {
  const a = ir(nuevoAndante({ x: 500, y: 420 }, 0), { x: 500 + 300, y: 420 + 400 * 0 + 0 }, "cantar", 5, 0);
  const tras1s = avanzarAndante(a, 1000, 1000);
  assert.ok(Math.abs(tras1s.x - (500 + VELOCIDAD_GATITO)) < 1e-9);
  const diagonal = avanzarAndante(ir(nuevoAndante({ x: 0, y: 0 }, 0), { x: 300, y: 400 }, "sentarse", 3, 0), 1000, 1000);
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - VELOCIDAD_GATITO) < 1e-9, "en diagonal, la misma velocidad");
  const llega = avanzarAndante(a, 10_000, 10_000);
  assert.deepEqual([llega.x, llega.y, llega.destino, llega.pose, llega.hasta], [800, 420, null, "cantar", 15_000]);
  assert.equal(a.mira, 1);
  assert.equal(ir(a, { x: 100, y: 420 }, "sentarse", 1, 0).mira, -1, "mira hacia donde va");
});

test("los destinos caen en el suelo y lejos de los demás gatitos", () => {
  const otros = [nuevoAndante(H.sitiosDia[0], 0), { ...nuevoAndante(H.sitiosDia[1], 0), destino: H.sitiosDia[2] }];
  const azar = azarDe(3);
  for (let i = 0; i < 50; i++) {
    const p = puntoLibre(H, { x: 300, y: 450 }, otros, azar);
    assert.ok(dentroDelSuelo(H, p.x, p.y));
    assert.ok(libre(p, otros), `${p.x},${p.y}`);
  }
  assert.ok(!libre({ x: H.sitiosDia[2].x + SEPARACION / 2, y: H.sitiosDia[2].y }, otros), "el destino de otro también cuenta");
});

test("deambula por toda la habitación, no solo por la alfombra", () => {
  const azar = azarDe(11);
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < 200; i++) { const p = puntoLibre(H, { x: 640, y: 460 }, [], azar); xs.push(p.x); ys.push(p.y); }
  assert.ok(Math.min(...xs) < 300 && Math.max(...xs) > 1000, "de un lado a otro");
  assert.ok(Math.max(...ys) - Math.min(...ys) > 80, "y también al fondo y delante");
});

test("el que pide alterna: pide quieto y luego anda un poco para volver a pedir", () => {
  const gatito = { ...gatitoNuevo(ahora), necesidades: { comer: 1, mimos: 0, bano: 0, jugar: 0 } };
  const quieto = decidir(nuevoAndante({ x: 600, y: 460 }, 0), gatito, [], contexto());
  assert.deepEqual([quieto.destino, quieto.pose], [null, "pedir"]);
  const anda = decidir({ ...quieto, hasta: 0 }, gatito, [], contexto());
  assert.ok(anda.destino, "tras pedir, anda");
  assert.equal(anda.pose, "pedir", "y al llegar vuelve a pedir");
  assert.ok(Math.hypot(anda.destino!.x - 600, anda.destino!.y - 460) <= VELOCIDAD_GATITO * 4 + 1, "anda un poco, como mucho 4 s");
});

test("de noche va a la cama a dormir, y a veces va a propósito a su sitio de interés", () => {
  const gatito = gatitoNuevo(ahora);
  const noche = decidir(nuevoAndante({ x: 800, y: 470 }, 0), gatito, [], contexto({ noche: true }));
  assert.deepEqual([noche.destino, noche.pose], [H.sitiosNoche[0], "dormir"]);
  const destinos = new Set<string>();
  const azar = azarDe(5);
  for (let i = 0; i < 300; i++) {
    const a = decidir(nuevoAndante({ x: 1000, y: 500 }, 0), gatito, [], contexto({ azar }));
    if (a.destino) destinos.add(`${a.destino.x},${a.destino.y}`);
  }
  const sitios = Object.values(H.sitios).filter((s) => s.para).map((s) => `${s.x},${s.y}`);
  assert.ok(sitios.some((s) => destinos.has(s)), "va a algún sitio de interés");
});

test("de día, para echarse a dormir, va a la cama o al cojín", () => {
  const gatito = gatitoNuevo(ahora);
  const destinos = new Set<string>();
  const azar = azarDe(9);
  for (let i = 0; i < 600; i++) {
    const a = decidir(nuevoAndante({ x: 1000, y: 500 }, 0), gatito, [], contexto({ azar }));
    if (a.destino && a.pose === "dormir") destinos.add(`${a.destino.x},${a.destino.y}`);
  }
  assert.ok(destinos.has(`${H.sitios.cama.x},${H.sitios.cama.y}`), "a la cama");
  assert.ok(destinos.has(`${H.sitios.cojin.x},${H.sitios.cojin.y}`), "y al cojín");
});

test("tocarlo lo para en el acto y el toque cuenta en vertical con la profundidad", () => {
  const anda = ir(nuevoAndante({ x: 500, y: 420 }, 0), { x: 900, y: 500 }, "sentarse", 3, 0);
  const parado = parar(anda, 1000);
  assert.equal(parado.destino, null);
  assert.ok(parado.hasta > 1000);
  const andantes: Andante[] = [nuevoAndante({ x: 500, y: 420 }, 0), nuevoAndante({ x: 520, y: 510 }, 0)];
  const escalaDe = (y: number) => escalaEnSuelo(H, y);
  assert.equal(gatitoBajo({ x: 500, y: 330 }, andantes, escalaDe, 90), 0, "el del fondo, tocando su cabeza");
  assert.equal(gatitoBajo({ x: 515, y: 470 }, andantes, escalaDe, 90), 1, "si se solapan, gana el de delante");
  assert.equal(gatitoBajo({ x: 500, y: 150 }, andantes, escalaDe, 90), -1, "en la pared no hay gatito");
});
