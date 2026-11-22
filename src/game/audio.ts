// Un solo AudioContext para el juego (decisión de «Un AudioContext para todo el juego o uno por pantalla»): cada zona
// (efectos, música, casa, avioneta, minijuegos) cuelga de él su propio bus y lo desconecta al salir, en lugar de crear
// y cerrar contextos. Así hay un único desbloqueo por gesto y un único sitio para suspender y reanudar.

type ConstructorAudio = typeof AudioContext;

let compartido: AudioContext | null = null;

/** El contexto del juego; se crea la primera vez que hace falta. `null` si el navegador no tiene Web Audio. */
export function contextoAudio(): AudioContext | null {
  if (compartido && compartido.state !== "closed") return compartido;
  const Constructor: ConstructorAudio | undefined = typeof window === "undefined" ? undefined
    : window.AudioContext ?? (window as unknown as { webkitAudioContext?: ConstructorAudio }).webkitAudioContext;
  try {
    compartido = Constructor ? new Constructor() : null;
  } catch {
    compartido = null;
  }
  return compartido;
}

/** Reanuda el contexto si está parado; no espera más de 400 ms (Safari puede no resolver nunca `resume()`). */
export async function despertarAudio(context: AudioContext): Promise<boolean> {
  if (context.state !== "running") await Promise.race([context.resume().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 400))]);
  return context.state === "running";
}

/** Bus de una zona: una ganancia conectada a la salida. Desconectarla calla todo lo que la zona tenga sonando. */
export function busDeZona(context: AudioContext, volumen = 1): GainNode {
  const bus = context.createGain();
  bus.gain.value = volumen;
  bus.connect(context.destination);
  return bus;
}

export function soltarBus(bus: AudioNode | null | undefined): void {
  try { bus?.disconnect(); } catch { /* ya desconectado */ }
}

let vigilando = false;
let suspendidoAlOcultar = false;

/**
 * Se llama una vez al arrancar: el primer toque o tecla desbloquea el audio (iOS y Android lo exigen), y al ocultar la
 * pestaña se suspende el contexto; al volver se reanuda pasados 300 ms (en iOS 17–18, reanudar al instante puede dejarlo
 * «interrumpido»). Solo se reanuda si fue este aviso el que lo suspendió: una pausa de un minijuego sigue siendo suya.
 */
export function vigilarAudio(): void {
  if (vigilando || typeof window === "undefined") return;
  vigilando = true;
  const desbloquear = () => {
    const context = contextoAudio();
    if (context && context.state !== "running") void context.resume().catch(() => {});
  };
  for (const evento of ["pointerdown", "keydown", "touchend"] as const) window.addEventListener(evento, desbloquear, { capture: true, passive: true });
  document.addEventListener("visibilitychange", () => {
    const context = compartido;
    if (!context || context.state === "closed") return;
    if (document.visibilityState === "hidden") {
      if (context.state === "running") {
        suspendidoAlOcultar = true;
        void context.suspend().catch(() => {});
      }
      return;
    }
    if (!suspendidoAlOcultar) return;
    suspendidoAlOcultar = false;
    window.setTimeout(() => { if (document.visibilityState === "visible") void context.resume().catch(() => {}); }, 300);
  });
}
