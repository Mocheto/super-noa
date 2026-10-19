import { writeFileSync } from "node:fs";

// «Pasos por la jungla»: composición original, sin muestras ni melodías externas.
const sampleRate = 22050;
const bpm = 118;
const beat = 60 / bpm;
const beats = 64;
const sampleCount = Math.round(sampleRate * beat * beats);
const output = new Int16Array(sampleCount);
const melody = [
  72, 76, 79, 76, 74, 77, 81, 77,
  72, 76, 79, 83, 81, 79, 77, 74,
  69, 72, 76, 72, 67, 71, 74, 71,
  69, 72, 76, 79, 77, 76, 74, 71,
];
const roots = [48, 45, 53, 55, 48, 45, 43, 47];
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
const triangle = (phase) => 2 * Math.abs(2 * (phase - Math.floor(phase + 0.5))) - 1;

for (let index = 0; index < sampleCount; index += 1) {
  const time = index / sampleRate;
  const beatPosition = time / beat;
  const eighth = Math.floor(beatPosition * 2);
  const localEighth = beatPosition * 2 - eighth;
  const root = roots[Math.floor(beatPosition / 4) % roots.length];
  const leadFrequency = hz(melody[eighth % melody.length]);
  const leadEnvelope = Math.min(1, localEighth * 16) * Math.exp(-localEighth * 2.8);
  const marimba = triangle(time * leadFrequency) * 0.12
    + Math.sin(time * leadFrequency * Math.PI * 4) * 0.035;
  const bassFrequency = hz(root - 12);
  const bassPulse = Math.exp(-(beatPosition % 1) * 4.5);
  const bass = Math.sin(time * bassFrequency * Math.PI * 2) * bassPulse * 0.095;
  const sixteenth = beatPosition * 4;
  const shakerPosition = sixteenth % 1;
  const noise = Math.sin(index * 12.9898) * Math.sin(index * 78.233);
  const shaker = shakerPosition < 0.18 ? noise * (1 - shakerPosition / 0.18) * 0.027 : 0;
  const drumPosition = beatPosition % 2;
  const drum = drumPosition < 0.12
    ? Math.sin(time * (82 - drumPosition * 180) * Math.PI * 2) * (1 - drumPosition / 0.12) * 0.11
    : 0;
  const fade = Math.min(1, time / 0.04, (sampleCount / sampleRate - time) / 0.06);
  const value = (marimba * leadEnvelope + bass + shaker + drum) * fade;
  output[index] = Math.max(-32768, Math.min(32767, Math.round(value * 32767)));
}

const wav = Buffer.alloc(44 + output.byteLength);
wav.write("RIFF", 0);
wav.writeUInt32LE(wav.length - 8, 4);
wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(output.byteLength, 40);
Buffer.from(output.buffer).copy(wav, 44);
writeFileSync(new URL("../public/assets/music/jurasico.wav", import.meta.url), wav);
