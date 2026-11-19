import assert from "node:assert/strict";
import test from "node:test";
import { llegadasPendientes, presentar } from "./casa.ts";
import { casaAbierta, gatitosRescatados, llegadasPorVer, MUNDOS_CASA, mundoCompleto, prepararCasa } from "./casaRescate.ts";
import { levels } from "./levels.ts";
import { worldCatalog } from "./worldMapData.ts";
import { t } from "../textos/index.ts";

const completo = (...mundos: number[]) => Object.fromEntries(levels.filter((level) => mundos.includes(level.world)).map((level) => [level.id, { completed: true }]));
const ahora = new Date(2026, 10, 19, 10);

test("un gatito está rescatado con su mundo completo, como la postal, y solo caben los de los mundos 1–3", () => {
  assert.deepEqual(MUNDOS_CASA, [1, 2, 3]);
  const casi = { ...completo(1), [levels.find((level) => level.world === 1)!.id]: { completed: false } };
  assert.equal(mundoCompleto(casi, 1), false);
  assert.deepEqual(gatitosRescatados(completo(1, 2, 3, 4, 8)), [1, 2, 3], "los demás esperan a tener paleta");
  for (const mundo of MUNDOS_CASA) assert.ok(worldCatalog.some((world) => world.id === mundo && world.catAsset), `el mundo ${mundo} tiene gatito`);
});

test("el botón CASA aparece al rescatar al gatito del mundo 1", () => {
  assert.equal(casaAbierta({}), false);
  assert.equal(casaAbierta(completo(2)), false);
  assert.equal(casaAbierta(completo(1)), true);
});

test("la llegada se ve una vez: juntos si llegan varios y luego solo el nuevo", () => {
  const estreno = prepararCasa(undefined, completo(1, 2), ahora);
  assert.deepEqual(llegadasPendientes(estreno), [1, 2], "al estrenarla entran juntos");
  const vista = presentar(estreno, [1, 2]);
  assert.deepEqual(llegadasPendientes(vista), []);
  assert.deepEqual(llegadasPorVer(vista, completo(1, 2)), []);
  assert.deepEqual(llegadasPorVer(vista, completo(1, 2, 3)), [3], "la ventana de mundo completado ofrece A CASA");
  assert.deepEqual(llegadasPendientes(prepararCasa(vista, completo(1, 2, 3), ahora)), [3], "si no fue entonces, llega la próxima vez");
  assert.deepEqual(llegadasPorVer(undefined, completo(1)), [1]);
});

test("los textos de la llegada nombran a cada gatito", () => {
  assert.equal(t("casa.llegada.uno.juntos", { nombre: t("mundos.1.gato.rotulo") }), "¡MIEL ya tiene casa! Dale muchos mimos.");
  assert.equal(t("casa.llegada.union.juntos", { primeros: "MIEL, BRUMA", ultimo: "PINO" }), "MIEL, BRUMA y PINO");
});
