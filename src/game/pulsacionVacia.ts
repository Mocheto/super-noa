/**
 * Pulsación vacía (decisión «Qué cuesta pulsar sin parar en los minijuegos rítmicos»): durante la canción, una
 * pulsación que no acierta ninguna pieza (o toca lo que no se toca) baja un acierto en la raya, sin bajar de cero.
 * Es gratis en la cuenta de entrada, en la llamada y en la práctica, y un rebote del dedo justo después de un acierto
 * no cuenta. Así pulsar sin parar se queda por debajo de la raya dorada y quien juega bien casi no lo nota.
 */

/** Una segunda pulsación a menos de esta distancia de un acierto es un rebote del dedo y se ignora (~90 ms). */
export const REBOTE_PULSOS = 0.15;
export const MARGEN_PULSOS = 0.5;
export const RESTA_VACIA = 1;

/**
 * Números de la regla, ajustables desde la dirección (también en la web publicada) para probarlos jugando con Noa
 * (prototipo «Probar con Noa la regla contra pulsar sin parar»):
 * `?ritmoMargen=0.4` (margen de acierto, en pulsos), `?ritmoRebote=0.2` (rebote ignorado, en pulsos),
 * `?ritmoResta=0.5` (cuánto baja la raya cada pulsación vacía) y `?ritmoInforme` (informe para adultos al acabar).
 */
export type AjustesRitmo = { margen: number; rebote: number; resta: number; informe: boolean };

export function leerAjustesRitmo(busqueda: string | null): AjustesRitmo {
  const parametros = new URLSearchParams(busqueda ?? "");
  const numero = (nombre: string, minimo: number, maximo: number, defecto: number) => {
    const valor = parametros.get(nombre);
    const leido = Number(valor);
    return valor !== null && valor !== "" && Number.isFinite(leido) ? Math.max(minimo, Math.min(maximo, leido)) : defecto;
  };
  return {
    margen: numero("ritmoMargen", 0.15, 0.5, MARGEN_PULSOS),
    rebote: numero("ritmoRebote", 0, 0.4, REBOTE_PULSOS),
    resta: numero("ritmoResta", 0, 2, RESTA_VACIA),
    informe: parametros.has("ritmoInforme"),
  };
}

export const ajustesRitmo: AjustesRitmo = leerAjustesRitmo(typeof window !== "undefined" ? window.location.search : null);

export type Raya = {
  /** Aciertos que cuentan para la raya dorada: suben con cada acierto y bajan con cada pulsación vacía que cuesta. */
  raya: number;
  /** Pulsaciones vacías que han costado. «Perfecto» pide que sean cero. */
  vacias: number;
  /** Pulso del último acierto, para reconocer el rebote. */
  ultimoAcierto: number;
};

export const nuevaRaya = (): Raya => ({ raya: 0, vacias: 0, ultimoAcierto: -Infinity });

export const esRebote = (cuenta: Raya, pulso: number) => pulso >= cuenta.ultimoAcierto && pulso - cuenta.ultimoAcierto < ajustesRitmo.rebote;

export function anotarAcierto(cuenta: Raya, pulso: number) {
  cuenta.raya += 1;
  cuenta.ultimoAcierto = pulso;
}

/** Anota una pulsación vacía. Si `cuesta`, baja la raya (nunca de cero). Devuelve si ha costado. */
export function anotarVacia(cuenta: Raya, cuesta: boolean): boolean {
  if (!cuesta) return false;
  cuenta.vacias += 1;
  cuenta.raya = Math.max(0, cuenta.raya - ajustesRitmo.resta);
  return true;
}

/**
 * Pulsos en que cae una pulsación al pulsar sin parar `porPulso` veces por pulso, desde `desde` hasta `hasta`, empezando
 * con la fase dada (0–1 de un paso). Lo usan las pruebas para simular la trampa.
 */
export function pulsacionesSinParar(desde: number, hasta: number, porPulso: number, fase = 0): number[] {
  const paso = 1 / porPulso;
  const pulsos: number[] = [];
  for (let pulso = desde + fase * paso; pulso <= hasta; pulso += paso) pulsos.push(pulso);
  return pulsos;
}
