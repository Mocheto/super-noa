import { abeja } from "../es/minijuegos/abeja.ts";
import { registrarZona } from "../index.ts";

/** Zona diferida `minijuegos.abeja`: la importan los módulos que usan sus claves, para que viaje en su bloque y no en el principal. */
registrarZona("minijuegos.abeja", abeja);
