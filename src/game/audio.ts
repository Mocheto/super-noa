// Un solo AudioContext para el juego (decisión de «Un AudioContext para todo el juego o uno por pantalla»): cada zona
// cuelga de él su propio bus y lo desconecta al salir, en lugar de crear y cerrar contextos. Así hay un único
// desbloqueo por gesto y un único sitio para suspender y reanudar.

type ConstructorAudio = typeof AudioContext;

let compartido: AudioContext | null = null;

/** El contexto del juego; se crea la primera vez que hace falta. `null` si el navegador no tiene Web Audio. */
export function contextoAudio(): AudioContext | null {
  if (compartido && compartido.state !== "closed") return compartido;
  const Constructor: ConstructorAudio | undefined = typeof window === "undefined" ? undefined
    : window.AudioContext ?? (window as unknown as { webkitAudioContext?: ConstructorAudio }).webkitAudioContext;
  compartido = Constructor ? new Constructor() : null;
  return compartido;
}

/** Reanuda el contexto si está parado; no espera más de 400 ms (Safari puede no resolver nunca `resume()`). */
export async function despertarAudio(context: AudioContext): Promise<boolean> {
  if (context.state !== "running") await Promise.race([context.resume(), new Promise((resolve) => setTimeout(resolve, 400))]);
  return context.state === "running";
}
