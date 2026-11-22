import { tambor } from "../es/minijuegos/tambor.ts";
import { registrarZona } from "../index.ts";

/** Zona diferida `minijuegos.tambor`: la importan los módulos que usan sus claves, para que viaje en su bloque y no en el principal. */
registrarZona("minijuegos.tambor", tambor);
