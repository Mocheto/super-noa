// npm run niveles:indice — genera src/game/nivelesIndiceDatos.ts a partir de src/game/levels.ts.
// El índice lleva lo que la interfaz usa sin la geometría; nivelesIndice.test.ts comprueba que no se desfasa.
import { writeFileSync } from "node:fs";
import { levels, waterLevels } from "../src/game/levels.ts";
import { resumenDeNivel } from "../src/game/nivelesIndice.ts";

export function codigoIndice(): string {
  const lista = (nombre: string, datos: unknown[]) =>
    `export const ${nombre}: NivelResumenDatos[] = [\n${datos.map((dato) => `  ${JSON.stringify(dato)},`).join("\n")}\n];\n`;
  return [
    "// Generado por `npm run niveles:indice` desde levels.ts. No se edita a mano.",
    'import type { NivelResumenDatos } from "./nivelesIndice.ts";',
    "",
    lista("datosCampana", levels.map(resumenDeNivel)),
    lista("datosAgua", waterLevels.map(resumenDeNivel)),
  ].join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(new URL("../src/game/nivelesIndiceDatos.ts", import.meta.url), codigoIndice());
  console.log(`Índice: ${levels.length} pantallas de campaña y ${waterLevels.length} acuáticas.`);
}
