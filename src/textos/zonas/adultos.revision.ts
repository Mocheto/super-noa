import { revision } from "../es/revision.ts";
import { registrarZona } from "../index.ts";

/** Zona diferida `adultos.revision`: la importa la página de revisión de alias, que es otra entrada y no carga el juego. */
registrarZona("adultos.revision", revision);
