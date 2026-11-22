import { juegos } from "../es/juegos.ts";
import { registrarZona } from "../index.ts";

/** Zona diferida `juegos`: la importan los módulos que usan sus claves, para que viaje en su bloque y no en el principal. */
registrarZona("juegos", juegos);
