import { casa } from "../es/casa.ts";
import { registrarZona } from "../index.ts";

/** Zona diferida `casa`: la importan los módulos que usan sus claves, para que viaje en su bloque y no en el principal. */
registrarZona("casa", casa);
