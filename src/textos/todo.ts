import { es } from "./es/index.ts";
import { registrarZona } from "./index.ts";

/**
 * Registra el catálogo completo, con todas sus zonas diferidas. Solo para las pruebas y `npm run textos:json`:
 * el juego nunca lo importa, y cada pantalla registra sus zonas desde `src/textos/zonas/`.
 */
for (const [zona, textos] of Object.entries(es)) registrarZona(zona, textos);

export { es };
