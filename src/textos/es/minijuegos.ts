import { comun } from "./minijuegos/comun.ts";
import { abeja } from "./minijuegos/abeja.ts";
import { tambor } from "./minijuegos/tambor.ts";
import { merienda } from "./minijuegos/merienda.ts";
import { gatitos } from "./minijuegos/gatitos.ts";
import { avioneta } from "./minijuegos/avioneta.ts";
import { tienda } from "./minijuegos/tienda.ts";

/**
 * Textos de los cuatro minijuegos rítmicos (la abeja ninja, el tambor de Armonía, la merienda de los jabatos y la fiesta de los gatitos),
 * de la avioneta de las nubes y de la tienda secreta.
 * Las claves salen del propio texto (`minijuegos.abeja.practica.rotulo`). Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla).
 * Cada minijuego tiene su archivo en `minijuegos/`, para que sus textos viajen solo en el bloque de su pantalla.
 */
export const minijuegos = { comun, abeja, tambor, merienda, gatitos, avioneta, tienda } as const;
