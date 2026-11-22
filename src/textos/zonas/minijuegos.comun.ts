import { comun } from "../es/minijuegos/comun.ts";
import { registrarZona } from "../index.ts";

/** Zona diferida `minijuegos.comun`: la importan los módulos que usan sus claves, para que viaje en su bloque y no en el principal. */
registrarZona("minijuegos.comun", comun);
