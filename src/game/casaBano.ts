/**
 * Pantalla de baño (mapa «El baño de la casa de los gatitos»): cinco pasos guiados en orden fijo (mojar, enjabonar,
 * aclarar, secar y peinar). Cada paso se hace frotando su utensilio sobre el gatito; peinar pide tres pasadas de arriba
 * abajo. Con otro utensilio el gatito pone cara de «ese todavía no», sin castigo. Solo lógica: sin dibujo ni sonido.
 */

export type Utensilio = "alcachofa" | "jabon" | "secador" | "peine";
export type PasoBano = "mojar" | "enjabonar" | "aclarar" | "secar" | "peinar";

export const UTENSILIOS: readonly Utensilio[] = ["alcachofa", "jabon", "secador", "peine"];
export const PASOS_BANO: readonly PasoBano[] = ["mojar", "enjabonar", "aclarar", "secar", "peinar"];
export const UTENSILIO_DE: Readonly<Record<PasoBano, Utensilio>> = { mojar: "alcachofa", enjabonar: "jabon", aclarar: "alcachofa", secar: "secador", peinar: "peine" };

/** Tiempo frotando que pide cada paso (peinar se cuenta por pasadas). */
export const FROTAR_PASO_MS: Readonly<Record<Exclude<PasoBano, "peinar">, number>> = { mojar: 1500, enjabonar: 2500, aclarar: 1800, secar: 2000 };
export const PASADAS_PEINE = 3;
/** Una pasada de peine es bajar el peine al menos esta fracción del alto del gatito sin subir. */
export const PASADA_FRACCION = 0.5;
/** Un parón de más de esto entre dos movimientos no suma tiempo frotando. */
export const PARON_BANO_MS = 250;
/** Como mucho, estos grumos de espuma a la vez. */
export const MAX_ESPUMA = 14;
/** Cada cuánto deja un grumo de espuma el jabón al frotar. */
export const ESPUMA_CADA_MS = 180;

export type Grumo = { x: number; y: number; tam: 0 | 1 | 2 | 3 };
export type Bano = {
  paso: number;
  /** Avance del paso actual, de 0 a 1. */
  avance: number;
  /** Peine: pasadas hechas y cuánto ha bajado en la pasada que va (fracción del alto del gatito). */
  pasadas: number;
  bajada: number;
  espuma: Grumo[];
  /** Momento del último movimiento que sumó, para no contar los parones. */
  ultimo: number;
  /** Momento del último grumo de espuma. */
  ultimaEspuma: number;
};

export const banoNuevo = (): Bano => ({ paso: 0, avance: 0, pasadas: 0, bajada: 0, espuma: [], ultimo: -Infinity, ultimaEspuma: -Infinity });
export const pasoActual = (bano: Bano): PasoBano | null => PASOS_BANO[bano.paso] ?? null;
export const utensilioQueToca = (bano: Bano): Utensilio | null => {
  const paso = pasoActual(bano);
  return paso ? UTENSILIO_DE[paso] : null;
};
export const terminado = (bano: Bano) => bano.paso >= PASOS_BANO.length;

export type RespuestaBano = "nada" | "avanza" | "todaviaNo" | "pasoHecho" | "terminado";

/**
 * Un movimiento del utensilio sobre el gatito en el momento `ahora`, en el punto (x, y) relativo al gatito (0–1) y
 * habiendo bajado `dy` (fracción del alto del gatito, positiva hacia abajo) desde el movimiento anterior.
 */
export function frotarBano(bano: Bano, utensilio: Utensilio, punto: { x: number; y: number; dy: number }, ahora: number): { bano: Bano; respuesta: RespuestaBano } {
  const paso = pasoActual(bano);
  if (!paso) return { bano, respuesta: "nada" };
  if (UTENSILIO_DE[paso] !== utensilio) return { bano, respuesta: "todaviaNo" };
  const intervalo = ahora - bano.ultimo;
  const suma = intervalo > 0 && intervalo <= PARON_BANO_MS ? intervalo : 0;
  let siguiente: Bano = { ...bano, ultimo: ahora };

  if (paso === "peinar") {
    // Solo cuenta bajar: subir el peine empieza otra pasada.
    siguiente.bajada = punto.dy > 0 ? bano.bajada + punto.dy : 0;
    if (siguiente.bajada >= PASADA_FRACCION) {
      siguiente.pasadas = bano.pasadas + 1;
      siguiente.bajada = 0;
    }
    siguiente.avance = Math.min(1, siguiente.pasadas / PASADAS_PEINE);
  } else {
    siguiente.avance = Math.min(1, bano.avance + suma / FROTAR_PASO_MS[paso]);
    if (paso === "enjabonar" && ahora - bano.ultimaEspuma >= ESPUMA_CADA_MS && siguiente.espuma.length < MAX_ESPUMA) {
      const tam = Math.min(3, Math.floor(siguiente.avance * 4)) as Grumo["tam"];
      siguiente.espuma = [...bano.espuma, { x: punto.x, y: punto.y, tam }];
      siguiente.ultimaEspuma = ahora;
    }
    if (paso === "aclarar") {
      // El agua se lleva la espuma: quedan tantos grumos como falte por aclarar.
      const quedan = Math.ceil(bano.espuma.length * (1 - siguiente.avance));
      siguiente.espuma = bano.espuma.slice(0, quedan);
    }
  }
  if (siguiente.avance < 1) return { bano: siguiente, respuesta: suma > 0 || paso === "peinar" ? "avanza" : "nada" };
  siguiente = { ...siguiente, paso: bano.paso + 1, avance: 0, pasadas: 0, bajada: 0, espuma: paso === "aclarar" ? [] : siguiente.espuma };
  return { bano: siguiente, respuesta: terminado(siguiente) ? "terminado" : "pasoHecho" };
}

/** Cómo se ve el gatito según el paso: mojado (más oscuro), con espuma, esponjoso al secar y con brillo al peinar. */
export function aspectoDelGatito(bano: Bano): { mojado: number; esponjoso: number; brillo: number } {
  const paso = pasoActual(bano);
  const indice = paso ? PASOS_BANO.indexOf(paso) : PASOS_BANO.length;
  const mojado = indice === 0 ? bano.avance : indice < 3 ? 1 : indice === 3 ? 1 - bano.avance : 0;
  const esponjoso = indice === 3 ? bano.avance : indice > 3 ? 1 : 0;
  const brillo = indice === 4 ? bano.avance : indice > 4 ? 1 : 0;
  return { mojado, esponjoso, brillo };
}
