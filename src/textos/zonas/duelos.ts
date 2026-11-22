import { duelos } from "../es/duelos.ts";
import { registrarZona } from "../index.ts";

/** Zona diferida `duelos`: la importan los módulos que usan sus claves, para que viaje en su bloque y no en el principal. */
registrarZona("duelos", duelos);
