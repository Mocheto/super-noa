import assert from "node:assert/strict";
import test from "node:test";
import { createMusicPlayer, musicTracks } from "./music.ts";
import { existsSync } from "node:fs";

test("el bosque usa una melodía calmada propia sin cambiar la música pirata", () => {
  assert.equal(musicTracks[1], "./assets/music/bosque-manzanos.mp3");
  assert.equal(musicTracks[5], "./assets/music/manzanos.mp3");
  assert.notEqual(musicTracks[1], musicTracks[5]);
  assert.ok(existsSync(new URL("../../public/assets/music/bosque-manzanos.mp3", import.meta.url)));
});

test("pausar, silenciar y ajustar volumen conservan el reproductor y su tiempo", async () => {
  const audios: Array<{ source: string; loop: boolean; volume: number; paused: boolean; currentTime: number; play: () => Promise<void>; pause: () => void }> = [];
  const player = createMusicPlayer((source) => {
    const audio = {
      source, loop: false, volume: 1, paused: true, currentTime: 0,
      async play() { this.paused = false; },
      pause() { this.paused = true; },
    };
    audios.push(audio);
    return audio;
  }, (error) => assert.fail(String(error)), () => undefined);
  const settings = { source: musicTracks[10], volume: 100, playing: true };
  player.update({ ...settings, playing: false });
  assert.equal(audios.length, 0);
  player.update(settings);
  await Promise.resolve();
  audios[0].currentTime = 24;
  player.update({ ...settings, playing: false });
  player.update({ ...settings, volume: 25 });
  assert.equal(audios.length, 1);
  assert.equal(audios[0].currentTime, 24);
  assert.equal(audios[0].volume, 0.095);
  assert.equal(audios[0].paused, false);
  player.update({ ...settings, source: musicTracks[12] });
  assert.equal(audios.length, 2);
  assert.equal(audios[0].paused, true);
  player.pause();
  assert.equal(audios[1].paused, true);
});

test("un fallo de reproducción se comunica y puede reintentarse", async () => {
  let attempts = 0;
  const errors: unknown[] = [];
  const player = createMusicPlayer(() => ({
    loop: false, volume: 1, paused: true,
    play() { attempts += 1; return attempts === 1 ? Promise.reject(new Error("audio unavailable")) : Promise.resolve(); },
    pause() {},
  }), (error) => errors.push(error), () => undefined);
  const settings = { source: musicTracks[11], volume: 100, playing: true };
  player.update(settings);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(errors.length, 1);
  player.update(settings);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(attempts, 2);
});
