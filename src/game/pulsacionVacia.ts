/**
 * Pulsación vacía (decisión «Qué cuesta pulsar sin parar en los minijuegos rítmicos»): durante la canción, una
 * pulsación que no acierta ninguna pieza (o toca lo que no se toca) baja un acierto en la raya, sin bajar de cero.
 * Es gratis en la cuenta de entrada, en la llamada y en la práctica, y un rebote del dedo justo después de un acierto
 * no cuenta. Así pulsar sin parar se queda por debajo de la raya dorada y quien juega bien casi no lo nota.
 */

/** Una segunda pulsación a menos de esta distancia de un acierto es un rebote del dedo y se ignora (~90 ms). */
export const REBOTE_PULSOS = 0.15;

export type Raya = {
  /** Aciertos que cuentan para la raya dorada: suben con cada acierto y bajan con cada pulsación vacía que cuesta. */
  raya: number;
  /** Pulsaciones vacías que han costado. «Perfecto» pide que sean cero. */
  vacias: number;
  /** Pulso del último acierto, para reconocer el rebote. */
  ultimoAcierto: number;
};

export const nuevaRaya = (): Raya => ({ raya: 0, vacias: 0, ultimoAcierto: -Infinity });

export const esRebote = (cuenta: Raya, pulso: number) => pulso >= cuenta.ultimoAcierto && pulso - cuenta.ultimoAcierto < REBOTE_PULSOS;

export function anotarAcierto(cuenta: Raya, pulso: number) {
  cuenta.raya += 1;
  cuenta.ultimoAcierto = pulso;
}

/** Anota una pulsación vacía. Si `cuesta`, baja la raya (nunca de cero). Devuelve si ha costado. */
export function anotarVacia(cuenta: Raya, cuesta: boolean): boolean {
  if (!cuesta) return false;
  cuenta.vacias += 1;
  cuenta.raya = Math.max(0, cuenta.raya - 1);
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
