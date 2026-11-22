import { avioneta } from "../es/minijuegos/avioneta.ts";
import { registrarZona } from "../index.ts";

/** Zona diferida `minijuegos.avioneta`: la importan los módulos que usan sus claves, para que viaje en su bloque y no en el principal. */
registrarZona("minijuegos.avioneta", avioneta);
