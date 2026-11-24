/**
 * Quién vive en la casa (decisión «Llegar a la casa y llegar un gatito nuevo»): un gatito está rescatado cuando su
 * mundo está completo, el mismo criterio que la postal del álbum. Se mudan los diecisiete gatitos (mapa «Más gatitos en
 * la casa»), cinco como mucho en casa a la vez; el botón CASA aparece al rescatar al del mundo 1.
 */
import { asegurarGatitos, llegadasPendientes, type CasaProgress } from "./casaProgreso.ts";
import { nivelesCampana as levels } from "./nivelesIndice.ts";
import type { LevelStats } from "./progress.ts";

/** Mundos cuyos gatitos se mudan a la casa: todos los que tienen gatito (y paleta del gato base). */
export const MUNDOS_CASA: readonly number[] = Array.from({ length: 17 }, (_, i) => i + 1);

type Estadisticas = Record<string, { completed?: boolean } | undefined>;

export function mundoCompleto(levelStats: Estadisticas, mundo: number): boolean {
  const pantallas = levels.filter((level) => level.world === mundo);
  return pantallas.length > 0 && pantallas.every((level) => levelStats[level.id]?.completed);
}

export const gatitosRescatados = (levelStats: Estadisticas): number[] => MUNDOS_CASA.filter((mundo) => mundoCompleto(levelStats, mundo));

/** Solo para probar en desarrollo (`?prueba=casa&gatitos=6`): las estadísticas con los mundos 1 a `hasta` completos. */
export function conMundosCompletos(levelStats: LevelStats, hasta: number): LevelStats {
  const completas = levels.filter((level) => level.world <= hasta).map((level) => [level.id, { ...levelStats[level.id], bestApples: levelStats[level.id]?.bestApples ?? 0, completed: true }]);
  return { ...levelStats, ...Object.fromEntries(completas) };
}

/** El botón CASA aparece al rescatar al gatito del mundo 1. */
export const casaAbierta = (levelStats: Estadisticas) => mundoCompleto(levelStats, MUNDOS_CASA[0]);

/** Gatitos rescatados cuya llegada aún no se ha visto (aunque la casa todavía no los haya metido). */
export const llegadasPorVer = (casa: CasaProgress | undefined, levelStats: Estadisticas): number[] =>
  casa ? llegadasPendientes(asegurarGatitos(casa, gatitosRescatados(levelStats), new Date(casa.calculadoEn)))
    : gatitosRescatados(levelStats);
