import { gatitos } from "../es/minijuegos/gatitos.ts";
import { registrarZona } from "../index.ts";

/** Zona diferida `minijuegos.gatitos`: la importan los módulos que usan sus claves, para que viaje en su bloque y no en el principal. */
registrarZona("minijuegos.gatitos", gatitos);
