import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { codigoIndice } from "../../scripts/niveles-indice.ts";
import { levels, waterLevels } from "./levels.ts";
import { nivelCompleto } from "./nivelCompleto.ts";
import { nivelesAgua, nivelesCampana } from "./nivelesIndice.ts";
import { restStopLevels } from "./restStopNiveles.ts";
import { restStopResumenes } from "./restStops.ts";

test("el índice de pantallas está al día con levels.ts (npm run niveles:indice)", () => {
  assert.equal(readFileSync(new URL("./nivelesIndiceDatos.ts", import.meta.url), "utf8"), codigoIndice());
});

test("cada resumen corresponde a su pantalla, en el mismo orden y con los mismos textos", () => {
  for (const [resumenes, completas] of [[nivelesCampana, levels], [nivelesAgua, waterLevels]] as const) {
    assert.deepEqual(resumenes.map((nivel) => nivel.id), completas.map((nivel) => nivel.id));
    resumenes.forEach((resumen, index) => {
      const completa = completas[index];
      assert.equal(resumen.title, completa.title);
      assert.equal(resumen.subtitle, completa.subtitle);
      assert.equal(resumen.route?.nextLabel, completa.route?.nextLabel);
      assert.equal(nivelCompleto(resumen), completa);
    });
  }
});

test("el resumen de cada paseo coincide con su pantalla jugable", () => {
  assert.deepEqual(restStopResumenes.map((nivel) => nivel.id), restStopLevels.map((nivel) => nivel.id));
  restStopResumenes.forEach((resumen, index) => {
    const completa = restStopLevels[index];
    assert.equal(nivelCompleto(resumen), completa);
    for (const campo of ["world", "screen", "theme", "restStop", "title", "subtitle"] as const) assert.equal(resumen[campo], completa[campo], `${resumen.id}.${campo}`);
    assert.deepEqual(resumen.enemies.map((enemigo) => enemigo.kind), [...new Set(completa.enemies.map((enemigo) => enemigo.kind))]);
  });
});
