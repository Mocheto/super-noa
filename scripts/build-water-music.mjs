import { writeFileSync } from "node:fs";

// «Brazadas de coral»: composición original, sin muestras ni melodías externas.
const sampleRate = 22050;
const beat = 60 / 104;
const duration = beat * 64;
const notes = [76, 79, 83, 81, 79, 76, 74, 71, 72, 76, 79, 83, 81, 79, 76, 74,
  69, 72, 76, 79, 78, 76, 74, 72, 71, 74, 78, 81, 79, 78, 74, 71];
const roots = [52, 48, 45, 47];
const hz = midi => 440 * 2 ** ((midi - 69) / 12);
const count = Math.round(duration * sampleRate);
const wav = Buffer.alloc(44 + count * 2);
wav.write("RIFF", 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write("data", 36);
wav.writeUInt32LE(count * 2, 40);
for (let i = 0; i < count; i += 1) {
  const t = i / sampleRate;
  const position = t / beat;
  const step = Math.floor(position * 2);
  const local = (position * 2 - step) * beat / 2;
  const root = roots[Math.floor(position / 4) % roots.length];
  const lead = hz(notes[step % notes.length]);
  const envelope = Math.min(1, local * 45) * Math.exp(-local * 7);
  const bell = Math.sin(2 * Math.PI * lead * t) + 0.2 * Math.sin(2 * Math.PI * lead * 2 * t);
  const arp = hz(root + [12, 19, 24, 19][Math.floor(position * 4) % 4]);
  const low = Math.sin(2 * Math.PI * hz(root - 12) * t) * 0.07;
  const harmony = Math.sin(2 * Math.PI * arp * t) * Math.exp(-(position * 4 % 1) * 4) * 0.05;
  const fade = Math.min(1, t / 0.03, (duration - t) / 0.05);
  wav.writeInt16LE(Math.round((bell * envelope * 0.16 + low + harmony) * fade * 32767), 44 + i * 2);
}
writeFileSync(new URL("../public/assets/music/laguna.wav", import.meta.url), wav);
