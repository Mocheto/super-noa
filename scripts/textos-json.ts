import { mkdirSync, writeFileSync } from "node:fs";
import { exportarJson } from "../src/textos/exportar.ts";

// Genera dist-textos/es.json bajo demanda. No se guarda en el repositorio: el catálogo es la única fuente de los textos.
const mensajes = exportarJson();
mkdirSync(new URL("../dist-textos/", import.meta.url), { recursive: true });
writeFileSync(new URL("../dist-textos/es.json", import.meta.url), `${JSON.stringify(mensajes, null, 2)}\n`);
console.info(`dist-textos/es.json: ${Object.keys(mensajes).length} textos`);
