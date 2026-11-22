// Núcleo puro de los duelos rítmicos (abeja ninja, tambor de Armonía y merienda de los jabatos): relojes, cuenta al
// seguir tras una pausa y programación de corcheas. Cada juego solo aporta su tempo; la lógica es la misma.

/** Tempo de un duelo: duración del pulso y pulsos de la cuenta al seguir tras una pausa. */
export type Tempo = { pulsoMs: number; pulsosCuenta: number };

/** «Practicar» se destaca la primera vez: guardián aún no vencido, sin revancha y sin intentos en esta visita. */
export const practicaPrimero = (nivelCompletado: boolean, revanchaAmistosa: boolean, intentado: boolean) =>
  !nivelCompletado && !revanchaAmistosa && !intentado;

/** Una pulsación cuenta solo al bajar: mantener la tecla o el botón cuenta una vez. */
export const flanco = (antes: boolean, ahora: boolean) => ahora && !antes;

/** Pulso actual a partir del reloj de audio, descontando la latencia de salida. */
export const pulsoDeAudio = (tempo: Tempo, ahora: number, inicio: number, latencia: number) =>
  (ahora - inicio - latencia) * 1000 / tempo.pulsoMs;

/**
 * Al seguir tras una pausa, el guardián cuenta unos pulsos con la escena quieta. Devuelve el nuevo inicio de la
 * canción para que, al acabar la cuenta, el reloj de audio marque el mismo pulso en que se pausó.
 */
export const inicioTrasPausa = (tempo: Tempo, inicio: number, pausadoEn: number, cuentaEn: number) =>
  inicio + (cuentaEn - pausadoEn) + tempo.pulsosCuenta * tempo.pulsoMs / 1000;

/** Reloj de fotogramas (sin audio): no avanza mientras dura la cuenta de reanudación. */
export function avanzarRelojFotogramas(reloj: { frameMs: number; countMs: number }, deltaMs: number) {
  const paso = Math.min(100, Math.max(0, deltaMs));
  if (reloj.countMs > 0) {
    const usado = Math.min(reloj.countMs, paso);
    return { frameMs: reloj.frameMs + (paso - usado), countMs: reloj.countMs - usado };
  }
  return { frameMs: reloj.frameMs + paso, countMs: 0 };
}

/**
 * Corcheas que hay que programar ya: las que suenan antes de `horizonte` segundos desde `ahora`, a partir de
 * `siguiente`. Las que ya pasaron (más de 20 ms) se saltan sin sonar. Devuelve cuándo suena cada una y el nuevo índice.
 */
export function corcheasPendientes(tempo: Tempo, inicio: number, siguiente: number, total: number, ahora: number, horizonte = 0.25) {
  const pendientes: Array<{ corchea: number; cuando: number }> = [];
  let indice = siguiente;
  while (indice < total) {
    const cuando = inicio + indice * tempo.pulsoMs / 2000;
    if (cuando > ahora + horizonte) break;
    const corchea = indice++;
    if (cuando < ahora - 0.02) continue;
    pendientes.push({ corchea, cuando });
  }
  return { pendientes, siguiente: indice };
}

/** Número de la cuenta que se ve (1…pulsosCuenta) cuando quedan `quedaMs` de cuenta; 0 si no hay cuenta. */
export const numeroDeCuenta = (tempo: Tempo, quedaMs: number) =>
  quedaMs > 0 ? tempo.pulsosCuenta - Math.floor(quedaMs / tempo.pulsoMs) : 0;
