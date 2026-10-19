import type { Level } from "./types";

export const musicTracks: Record<Level["world"], string> = {
  1: "./assets/music/manzanos.mp3",
  2: "./assets/music/gatitos.mp3",
  3: "./assets/music/lobos.mp3",
  4: "./assets/music/lobos.mp3",
  5: "./assets/music/manzanos.mp3",
  6: "./assets/music/castillo.wav",
  7: "./assets/music/gatitos.mp3",
  8: "./assets/music/laguna.wav",
  9: "./assets/music/jurasico.wav",
  10: "./assets/music/volcan.mp3",
  11: "./assets/music/valle.mp3",
  12: "./assets/music/hielo.mp3",
};

type MusicAudio = Pick<HTMLAudioElement, "loop" | "volume" | "paused" | "play" | "pause">;
type MusicSettings = { source: string; volume: number; playing: boolean };

export function createMusicPlayer(
  createAudio: (source: string) => MusicAudio,
  onError: (error: unknown) => void,
  onPlaying: () => void,
) {
  let audio: MusicAudio | null = null;
  let source: string | null = null;
  let shouldPlay = false;
  return {
    update(settings: MusicSettings) {
      shouldPlay = settings.playing;
      if (source !== settings.source) {
        audio?.pause();
        audio = null;
        source = settings.source;
      }
      if (!audio && shouldPlay) {
        audio = createAudio(settings.source);
        audio.loop = true;
      }
      if (!audio) return;
      audio.volume = Math.min(1, Math.max(0, settings.volume / 100)) * 0.38;
      if (!shouldPlay) {
        audio.pause();
        return;
      }
      if (!audio.paused) return;
      const playingAudio = audio;
      const promise = playingAudio.play();
      void promise.then(() => {
        if (audio !== playingAudio || !shouldPlay) {
          playingAudio.pause();
          return;
        }
        onPlaying();
      }, (error: unknown) => {
        if (audio === playingAudio && shouldPlay) onError(error);
      });
    },
    pause() {
      shouldPlay = false;
      audio?.pause();
    },
  };
}
