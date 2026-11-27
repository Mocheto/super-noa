// Guía del corte de la madriguera para generar su arte: los túneles, las cuevas y los sitios libres exactamente donde
// andan los conejos (casaConejos.ts). Uso: node --experimental-strip-types prototypes/tools/casa-madriguera-guia.mjs
import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { CUEVAS, NODOS_TUNEL, SIN_EXCAVAR, TUNELES } from "../../src/game/casaConejos.ts";

const X = -760, Y = 540, ANCHO = 1280, ALTO = 540;
const p = (nodo) => `${NODOS_TUNEL[nodo].x},${NODOS_TUNEL[nodo].y}`;
const tubos = TUNELES.filter(([, b]) => !SIN_EXCAVAR.includes(b))
  .map(([a, b]) => `<path d="M${p(a)}L${p(b)}" stroke="#4f3327" stroke-width="58" stroke-linecap="round"/>`).join("");
const cuevas = CUEVAS.map((c) => `<ellipse cx="${NODOS_TUNEL[c].x}" cy="${NODOS_TUNEL[c].y + 10}" rx="108" ry="68" fill="#4f3327"/>`).join("");
const libres = SIN_EXCAVAR.map((c) => `<ellipse cx="${NODOS_TUNEL[c].x}" cy="${NODOS_TUNEL[c].y}" rx="54" ry="36" fill="none" stroke="#c79b76" stroke-width="5" stroke-dasharray="12"/>`).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO * 2}" height="${ALTO * 2}" viewBox="${X} ${Y} ${ANCHO} ${ALTO}">
<rect x="${X}" y="${Y}" width="${ANCHO}" height="${ALTO}" fill="#8a5f43"/><rect x="${X}" y="${Y}" width="${ANCHO}" height="26" fill="#94ae78"/>
<rect x="${X}" y="${Y + 26}" width="${ANCHO}" height="12" fill="#6f4a33"/>${tubos}${cuevas}${libres}</svg>`;
const salida = "docs/art/guias/casa-madriguera-corte.png";
writeFileSync(`${salida}.svg`, svg);
execFileSync("sips", ["-s", "format", "png", `${salida}.svg`, "--out", salida], { stdio: "ignore" });
rmSync(`${salida}.svg`);
console.log(salida);
