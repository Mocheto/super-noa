/**
 * Quién vive en la casa (decisión «Llegar a la casa y llegar un gatito nuevo»): un gatito está rescatado cuando su
 * mundo está completo, el mismo criterio que la postal del álbum. En la v1 solo caben los de los mundos 1, 2 y 3; el
 * botón CASA aparece al rescatar al del mundo 1.
 */
import { asegurarGatitos, avanzar, casaVacia, llegadasPendientes, type CasaProgress } from "./casa.ts";
import { levels } from "./levels.ts";

/** Mundos cuyos gatitos caben en la casa de la v1: los que tienen paleta del gato base. */
export const MUNDOS_CASA: readonly number[] = [1, 2, 3];

type Estadisticas = Record<string, { completed?: boolean } | undefined>;

export function mundoCompleto(levelStats: Estadisticas, mundo: number): boolean {
  const pantallas = levels.filter((level) => level.world === mundo);
  return pantallas.length > 0 && pantallas.every((level) => levelStats[level.id]?.completed);
}

export const gatitosRescatados = (levelStats: Estadisticas): number[] => MUNDOS_CASA.filter((mundo) => mundoCompleto(levelStats, mundo));

/** El botón CASA aparece al rescatar al gatito del mundo 1. */
export const casaAbierta = (levelStats: Estadisticas) => mundoCompleto(levelStats, MUNDOS_CASA[0]);

/** Pone la casa al día: hace pasar el tiempo y mete a los gatitos rescatados que aún no estaban. */
export const prepararCasa = (casa: CasaProgress | undefined, levelStats: Estadisticas, ahora: Date): CasaProgress =>
  asegurarGatitos(avanzar(casa ?? casaVacia(ahora), ahora), gatitosRescatados(levelStats), ahora);

/** Gatitos rescatados cuya llegada aún no se ha visto (aunque la casa todavía no los haya metido). */
export const llegadasPorVer = (casa: CasaProgress | undefined, levelStats: Estadisticas): number[] =>
  casa ? llegadasPendientes(asegurarGatitos(casa, gatitosRescatados(levelStats), new Date(casa.calculadoEn)))
    : gatitosRescatados(levelStats);
