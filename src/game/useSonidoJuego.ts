import { useCallback, useEffect, useRef, useState } from "react";
import { busDeZona, contextoAudio, pistaDeMusica } from "./audio";
import type { SoundKind } from "./GameCanvas";
import { createMusicPlayer } from "./music";
import type { Pista } from "./musicaDePantalla";
import { t } from "../textos";

const notas: Record<SoundKind, [number, number, OscillatorType]> = {
  apple: [660, 0.11, "square"], block: [410, 0.12, "square"], cat: [523, 0.28, "triangle"], jump: [360, 0.12, "square"],
  hurt: [145, 0.22, "sawtooth"], stomp: [210, 0.09, "square"], yarn: [760, 0.08, "triangle"],
  checkpoint: [880, 0.18, "triangle"], goal: [1046, 0.42, "square"], sticker: [1174, 0.32, "triangle"],
  howl: [196, 0.48, "sawtooth"], snort: [110, 0.22, "square"], countdown: [330, 0.08, "square"],
  cannon: [92, 0.3, "sawtooth"],
};

/** Los efectos de la partida (`playSound`): una nota corta por código, por el bus de la zona. */
export function useEfectos({ muted, effectsVolume }: { muted: boolean; effectsVolume: number }) {
  const busRef = useRef<GainNode | null>(null);
  return useCallback((kind: SoundKind) => {
    if (muted || effectsVolume === 0) return;
    const audioContext = contextoAudio();
    if (!audioContext) return;
    busRef.current ??= busDeZona(audioContext);
    if (audioContext.state === "suspended") void audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    const [frequency, duration, type] = notas[kind];
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(kind === "hurt" || kind === "howl" || kind === "snort" ? 70 : frequency * 1.35, now + duration);
    gain.gain.setValueAtTime(0.075 * Math.min(1, Math.max(0, effectsVolume / 100)), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(busRef.current);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }, [effectsVolume, muted]);
}

/** Hace sonar lo que diga `musicaDePantalla` y avisa (para adultos) si el navegador no deja reproducir. */
export function useMusicaDeFondo({ mundo, estrella }: { mundo: Pista; estrella: Pista }) {
  const [audioMessage, setAudioMessage] = useState("");
  const musicRef = useRef<ReturnType<typeof createMusicPlayer> | null>(null);
  const starMusicRef = useRef<ReturnType<typeof createMusicPlayer> | null>(null);

  useEffect(() => {
    const createPlayer = () => createMusicPlayer(
      pistaDeMusica,
      (error) => {
        console.warn("No se pudo reproducir la música.", error);
        setAudioMessage(t("adultos.app.la-musica-no-ha"));
      },
      () => setAudioMessage(""),
    );
    musicRef.current ??= createPlayer();
    starMusicRef.current ??= createPlayer();
    musicRef.current.update({ source: mundo.source, volume: mundo.volume, playing: mundo.playing });
    starMusicRef.current.update({ source: estrella.source, volume: estrella.volume, playing: estrella.playing });
  }, [mundo.source, mundo.volume, mundo.playing, estrella.source, estrella.volume, estrella.playing]);

  useEffect(() => () => { musicRef.current?.pause(); starMusicRef.current?.pause(); }, []);

  return audioMessage;
}
