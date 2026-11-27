import { trajes } from "../es/trajes.ts";
import { registrarZona } from "../index.ts";

/** Zona diferida `trajes`: la importa el elegidor de trajes, para que viaje en su bloque y no en el principal. */
registrarZona("trajes", trajes);
