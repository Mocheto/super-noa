import { merienda } from "../es/minijuegos/merienda.ts";
import { registrarZona } from "../index.ts";

/** Zona diferida `minijuegos.merienda`: la importan los módulos que usan sus claves, para que viaje en su bloque y no en el principal. */
registrarZona("minijuegos.merienda", merienda);
