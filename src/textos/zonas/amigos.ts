import { amigos } from "../es/amigos.ts";
import { registrarZona } from "../index.ts";

/** Zona diferida `amigos`: la importan los módulos que usan sus claves, para que viaje en su bloque y no en el principal. */
registrarZona("amigos", amigos);
