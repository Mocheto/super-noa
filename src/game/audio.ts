import type { MusicAudio } from "./music.ts";

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

/** ¿Este navegador respeta `HTMLAudioElement.volume`? iOS lo ignora: siempre lee 1. */
export function volumenDeElementoFunciona(): boolean {
  if (typeof Audio === "undefined") return true;
  try {
    const prueba = new Audio();
    prueba.volume = 0.5;
    return Math.abs(prueba.volume - 0.5) < 0.01;
  } catch {
    return true;
  }
}

let volumenNativo: boolean | null = null;
const musicaEnrutada = new Map<string, MusicAudio & { reiniciar: () => void }>();

/**
 * Pista de música para `createMusicPlayer`. Donde `volume` funciona es un `<audio>` normal; en iOS, que lo ignora, el
 * elemento pasa por el contexto compartido y el volumen lo pone una ganancia. Se reutiliza una por pista, porque un
 * elemento solo se puede enrutar una vez.
 */
export function pistaDeMusica(source: string): MusicAudio {
  volumenNativo ??= volumenDeElementoFunciona();
  if (volumenNativo) return new Audio(source);
  const guardada = musicaEnrutada.get(source);
  if (guardada) {
    // Como un `<audio>` nuevo: la pista vuelve a empezar.
    guardada.pause();
    guardada.reiniciar();
    return guardada;
  }
  const audio = new Audio(source);
  const context = contextoAudio();
  if (!context) return audio;
  let bus: GainNode;
  try {
    bus = busDeZona(context, 0);
    context.createMediaElementSource(audio).connect(bus);
  } catch {
    return audio;
  }
  const pista: MusicAudio & { reiniciar: () => void } = {
    get loop() { return audio.loop; },
    set loop(valor: boolean) { audio.loop = valor; },
    get volume() { return bus.gain.value; },
    set volume(valor: number) { bus.gain.value = valor; },
    get paused() { return audio.paused; },
    play() {
      if (context.state !== "running") void context.resume().catch(() => {});
      return audio.play();
    },
    pause() { audio.pause(); },
    reiniciar() { audio.currentTime = 0; },
  };
  musicaEnrutada.set(source, pista);
  return pista;
}
