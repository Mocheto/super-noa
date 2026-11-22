import assert from "node:assert/strict";
import test from "node:test";
import { avanzarRelojFotogramas, corcheasPendientes, flanco, inicioTrasPausa, numeroDeCuenta, practicaPrimero, pulsoDeAudio, type Tempo } from "./ritmoNucleo.ts";

const tempo: Tempo = { pulsoMs: 600, pulsosCuenta: 4 };

test("el pulso de audio descuenta la latencia y el inicio", () => {
  assert.ok(Math.abs(pulsoDeAudio(tempo, 3.2, 2, 0.2) - 1 / 0.6) < 1e-9, "1 s de canción son 1,67 pulsos de 600 ms");
  assert.equal(pulsoDeAudio(tempo, 2, 2, 0), 0);
});

test("tras la pausa y su cuenta, el reloj marca el pulso en que se pausó", () => {
  const inicio = 1;
  const pausadoEn = 4;
  const cuentaEn = 10;
  const nuevoInicio = inicioTrasPausa(tempo, inicio, pausadoEn, cuentaEn);
  const finCuenta = cuentaEn + tempo.pulsosCuenta * tempo.pulsoMs / 1000;
  assert.ok(Math.abs(pulsoDeAudio(tempo, finCuenta, nuevoInicio, 0) - pulsoDeAudio(tempo, pausadoEn, inicio, 0)) < 1e-9);
});

test("el reloj de fotogramas se para durante la cuenta y no da saltos de más de 100 ms", () => {
  assert.deepEqual(avanzarRelojFotogramas({ frameMs: 0, countMs: 0 }, 16), { frameMs: 16, countMs: 0 });
  assert.deepEqual(avanzarRelojFotogramas({ frameMs: 0, countMs: 0 }, 500), { frameMs: 100, countMs: 0 });
  assert.deepEqual(avanzarRelojFotogramas({ frameMs: 50, countMs: 30 }, 80), { frameMs: 100, countMs: 0 });
  assert.deepEqual(avanzarRelojFotogramas({ frameMs: 50, countMs: 300 }, 80), { frameMs: 50, countMs: 220 });
  assert.deepEqual(avanzarRelojFotogramas({ frameMs: 5, countMs: 0 }, -10), { frameMs: 5, countMs: 0 });
});

test("se programan las corcheas del horizonte y se saltan las que ya pasaron", () => {
  // Corcheas de 0,3 s desde 1 s. A los 1,5 s, con 0,25 s de horizonte: la 0 (1,0 s) y la 1 (1,3 s) ya pasaron y se
  // saltan, la 2 (1,6 s) se programa y la 3 (1,9 s) queda para después.
  const redondear = (lista: Array<{ corchea: number; cuando: number }>) => lista.map(({ corchea, cuando }) => [corchea, Math.round(cuando * 1000) / 1000]);
  const { pendientes, siguiente } = corcheasPendientes(tempo, 1, 0, 10, 1.5);
  assert.deepEqual(redondear(pendientes), [[2, 1.6]]);
  assert.equal(siguiente, 3);
  const final = corcheasPendientes(tempo, 1, 3, 4, 1.85);
  assert.deepEqual([redondear(final.pendientes), final.siguiente], [[[3, 1.9]], 4], "no pasa del final");
});

test("la cuenta se ve de 1 a 4 y la práctica se destaca solo la primera vez", () => {
  assert.deepEqual([2400, 1801, 1200, 1, 0].map((queda) => numeroDeCuenta(tempo, queda)), [0, 1, 2, 4, 0]);
  assert.equal(practicaPrimero(false, false, false), true);
  assert.equal(practicaPrimero(true, false, false) || practicaPrimero(false, true, false) || practicaPrimero(false, false, true), false);
  assert.deepEqual([flanco(false, true), flanco(true, true), flanco(true, false)], [true, false, false]);
});
