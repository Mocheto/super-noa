import assert from "node:assert/strict";
import test from "node:test";
import { aspectoDelGatito, banoNuevo, FROTAR_PASO_MS, frotarBano, MAX_ESPUMA, PASADAS_PEINE, PASOS_BANO, terminado, UTENSILIO_DE, utensilioQueToca, type Bano, type Utensilio } from "./casaBano.ts";

/** Frota `ms` milisegundos con movimientos cada 100 ms. */
function frotarDurante(bano: Bano, utensilio: Utensilio, ms: number, desde = 0) {
  let estado = bano;
  let ultima = "nada";
  for (let t = desde; t <= desde + ms; t += 100) {
    const { bano: siguiente, respuesta } = frotarBano(estado, utensilio, { x: 0.5, y: 0.5, dy: 0 }, t);
    estado = siguiente;
    ultima = respuesta;
    if (respuesta === "pasoHecho" || respuesta === "terminado") break;
  }
  return { bano: estado, ultima };
}

test("los cinco pasos van en orden: mojar, enjabonar, aclarar, secar y peinar", () => {
  assert.deepEqual(PASOS_BANO, ["mojar", "enjabonar", "aclarar", "secar", "peinar"]);
  assert.equal(UTENSILIO_DE.aclarar, "alcachofa", "aclarar es otra vez con la alcachofa");
  assert.equal(utensilioQueToca(banoNuevo()), "alcachofa");
});

test("con otro utensilio, «ese todavía no» y no avanza", () => {
  const { bano, respuesta } = frotarBano(banoNuevo(), "secador", { x: 0.5, y: 0.5, dy: 0 }, 0);
  assert.equal(respuesta, "todaviaNo");
  assert.equal(bano.avance, 0);
});

test("frotar suma tiempo solo sin parones y completa el paso", () => {
  const { bano, ultima } = frotarDurante(banoNuevo(), "alcachofa", FROTAR_PASO_MS.mojar + 200);
  assert.equal(ultima, "pasoHecho");
  assert.equal(utensilioQueToca(bano), "jabon");
  const conParon = frotarBano(frotarBano(banoNuevo(), "alcachofa", { x: 0.5, y: 0.5, dy: 0 }, 0).bano, "alcachofa", { x: 0.5, y: 0.5, dy: 0 }, 2000).bano;
  assert.equal(conParon.avance, 0, "un parón largo no suma");
});

test("el jabón deja espuma donde se frota y el aclarado la quita", () => {
  let bano = frotarDurante(banoNuevo(), "alcachofa", 3000).bano;
  bano = frotarDurante(bano, "jabon", FROTAR_PASO_MS.enjabonar + 300, 5000).bano;
  assert.ok(bano.espuma.length > 3 && bano.espuma.length <= MAX_ESPUMA, `${bano.espuma.length} grumos`);
  const mitad = frotarDurante(bano, "alcachofa", FROTAR_PASO_MS.aclarar / 2, 10_000).bano;
  assert.ok(mitad.espuma.length < bano.espuma.length, "se va yendo");
  const aclarado = frotarDurante(bano, "alcachofa", FROTAR_PASO_MS.aclarar + 300, 10_000).bano;
  assert.equal(aclarado.espuma.length, 0);
  assert.equal(utensilioQueToca(aclarado), "secador");
});

test("peinar pide tres pasadas de arriba abajo; subir no cuenta", () => {
  let bano: Bano = { ...banoNuevo(), paso: 4 };
  for (let pasada = 0; pasada < PASADAS_PEINE; pasada++) {
    bano = frotarBano(bano, "peine", { x: 0.5, y: 0.8, dy: -0.6 }, pasada * 1000).bano;
    for (let paso = 1; paso <= 3; paso++) bano = frotarBano(bano, "peine", { x: 0.5, y: 0.3 + paso * 0.2, dy: 0.2 }, pasada * 1000 + paso * 50).bano;
  }
  assert.equal(terminado(bano), true);
});

test("el gatito se ve mojado, luego esponjoso y al final con brillo", () => {
  assert.deepEqual(aspectoDelGatito(banoNuevo()), { mojado: 0, esponjoso: 0, brillo: 0 });
  assert.equal(aspectoDelGatito({ ...banoNuevo(), paso: 2 }).mojado, 1);
  assert.deepEqual(aspectoDelGatito({ ...banoNuevo(), paso: 5 }), { mojado: 0, esponjoso: 1, brillo: 1 });
});
