import { vuelo } from "../es/minijuegos/vuelo.ts";
import { registrarZona } from "../index.ts";

/** Zona diferida `minijuegos.vuelo`: la importan los módulos que usan sus claves, para que viaje en su bloque y no en el principal. */
registrarZona("minijuegos.vuelo", vuelo);
