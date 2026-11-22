import { paseos } from "../es/paseos.ts";
import { registrarZona } from "../index.ts";

/** Zona diferida `paseos`: la importan los módulos que usan sus claves, para que viaje en su bloque y no en el principal. */
registrarZona("paseos", paseos);
