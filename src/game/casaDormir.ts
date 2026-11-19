/**
 * Hora de dormir (mapa «Hora de dormir en la casa»): desde las 19 h Noa puede acostar a los gatitos en casa. Arropar a
 * uno lo deja arropado esa noche y es un cuidado (un corazón, dentro del límite de dos al día). Lo arropado se olvida
 * al día siguiente. Solo lógica: sin dibujo ni reloj propio.
 */
import { CORAZONES_AL_DIA, CORAZONES_MEJOR_AMIGO, enCasaDe, fechaLocal, NOCHE_HASTA, type CasaProgress } from "./casa.ts";

/** Desde esta hora (y hasta las 8 h) se puede empezar la hora de dormir. */
export const DORMIR_DESDE = 19;

export const puedeDormir = (fecha: Date) => fecha.getHours() >= DORMIR_DESDE || fecha.getHours() < NOCHE_HASTA;

/** La noche a la que pertenece un momento: la fecha de la tarde en que empezó (de madrugada, la del día anterior). */
export function nocheDe(fecha: Date): string {
  if (fecha.getHours() >= NOCHE_HASTA) return fechaLocal(fecha);
  const ayer = new Date(fecha);
  ayer.setDate(ayer.getDate() - 1);
  return fechaLocal(ayer);
}

/** Gatitos en casa arropados esta noche (los de noches anteriores ya no cuentan). */
export function arropadosDe(casa: CasaProgress, ahora: Date): number[] {
  if (!casa.dormir || casa.dormir.noche !== nocheDe(ahora)) return [];
  const dentro = enCasaDe(casa);
  return casa.dormir.arropados.filter((mundo) => dentro.includes(mundo));
}

/** ¿Están arropados todos los gatitos en casa? */
export function todosArropados(casa: CasaProgress, ahora: Date): boolean {
  const dentro = enCasaDe(casa);
  const arropados = arropadosDe(casa, ahora);
  return dentro.length > 0 && dentro.every((mundo) => arropados.includes(mundo));
}

/**
 * Noa arropa al gatito del mundo dado. Solo a uno en casa, a la hora de dormir y una vez por noche; la primera vez es
 * un cuidado y da corazón si aún no tiene cinco ni ha ganado dos hoy.
 */
export function arropar(casa: CasaProgress, mundo: number, ahora: Date): { casa: CasaProgress; arropado: boolean; corazon: boolean } {
  const gatito = casa.gatitos[mundo];
  const yaEstaba = arropadosDe(casa, ahora).includes(mundo);
  if (!gatito || !enCasaDe(casa).includes(mundo) || !puedeDormir(ahora) || yaEstaba) return { casa, arropado: false, corazon: false };
  const hoy = fechaLocal(ahora);
  const delDia = gatito.dia === hoy ? gatito : { ...gatito, dia: hoy, corazonesHoy: 0 };
  const corazon = delDia.corazones < CORAZONES_MEJOR_AMIGO && delDia.corazonesHoy < CORAZONES_AL_DIA;
  const noche = nocheDe(ahora);
  return {
    casa: {
      ...casa,
      gatitos: { ...casa.gatitos, [mundo]: corazon ? { ...delDia, corazones: delDia.corazones + 1, corazonesHoy: delDia.corazonesHoy + 1 } : delDia },
      dormir: { noche, arropados: [...arropadosDe(casa, ahora), mundo].sort((a, b) => a - b) },
    },
    arropado: true,
    corazon,
  };
}
