import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const sampleRate = 32000;
const bpm = 160;
const beatsPerBar = 4;
const beatSeconds = 60 / bpm;
const stepSeconds = beatSeconds / 4;
// Cada casilla es una semicorchea; null deja respirar la nota anterior.
const melodyBars = [
  [84, null, 88, null, 91, null, 96, null, 91, null, 88, null, 86, 88, 91, 93],
  [89, null, 93, null, 96, null, 93, null, 89, null, 91, null, 93, 96, 93, 89],
  [93, null, 96, null, 100, null, 96, null, 93, null, 91, null, 88, 91, 93, 96],
  [91, null, 95, null, 98, null, 95, null, 91, null, 86, null, 88, 89, 91, 95],
  [96, null, 91, null, 88, null, 91, null, 96, null, 88, null, 91, 93, 96, 91],
  [93, null, 89, null, 96, null, 93, null, 89, null, 96, null, 93, 91, 89, 88],
  [93, null, 96, null, 100, null, 96, null, 93, null, 88, null, 91, 93, 96, 93],
  [91, null, 86, null, 95, null, 91, null, 86, null, 88, null, 89, 91, 95, 86],
];
const bassRoots = [48, 53, 45, 43, 48, 53, 45, 43];
const seconds = melodyBars.length * beatsPerBar * beatSeconds;
const samples = new Float32Array(sampleRate * seconds);
const frequency = (note) => 440 * 2 ** ((note - 69) / 12);
function addTone(start, duration, note, volume, decay, harmonics = [1]) {
  const offset = Math.round(start * sampleRate);
  const length = Math.round(duration * sampleRate);
  const angularFrequency = frequency(note) * Math.PI * 2;
  for (let index = 0; index < length && offset + index < samples.length; index++) {
    const age = index / sampleRate;
    const envelope = Math.min(1, age / .008, (duration - age) / .035) * Math.exp(-age * decay);
    const phase = angularFrequency * age;
    const tone = harmonics.reduce((sum, gain, harmonic) => sum + gain * Math.sin(phase * (harmonic + 1)), 0);
    samples[offset + index] += volume * tone * envelope;
  }
}
for (const [barIndex, bar] of melodyBars.entries()) {
  if (bar.length !== 16) throw new Error("Cada compás estelar debe tener dieciséis casillas.");
  const barStart = barIndex * beatsPerBar * beatSeconds;
  for (const [step, note] of bar.entries()) {
    if (note === null) continue;
    const steps = bar[step + 1] === null ? 2 : 1;
    addTone(barStart + step * stepSeconds, steps * stepSeconds * .9, note, .20, 4, [1, .14, .025]);
  }
  for (let beat = 0; beat < beatsPerBar; beat++) {
    addTone(barStart + beat * beatSeconds, beatSeconds * .65, bassRoots[barIndex] + (beat % 2) * 12, .035, 6);
    addTone(barStart + (beat + .5) * beatSeconds, .055, 90, .014, 35);
  }
}
const pcm = Buffer.alloc(samples.length * 4);
let peak = 0;
let energy = 0;
for (let index = 0; index < samples.length; index++) {
  const time = index / sampleRate;
  const edge = Math.min(1, time / .02, (seconds - time) / .02);
  const value = samples[index] * edge;
  peak = Math.max(peak, Math.abs(value));
  energy += value * value;
  pcm.writeFloatLE(value, index * 4);
}
if (peak > .5 || Math.sqrt(energy / samples.length) < .025) throw new Error("La mezcla estelar no cumple su margen de volumen.");
const encoded = spawnSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-f", "f32le", "-ar", String(sampleRate), "-ac", "1", "-i", "pipe:0",
  "-codec:a", "libmp3lame", "-b:a", "96k", "-metadata", "title=Brillo de Noa",
  "-metadata", "artist=Super Noa", "-metadata", "composer=Super Noa", "-metadata", `TBPM=${bpm}`,
  "-metadata", "comment=Composición original sintetizada para Noa Estelar; sin muestras externas.",
  "-id3v2_version", "3", "-f", "mp3", "pipe:1",
], { input: pcm, maxBuffer: 4 * 1024 * 1024, timeout: 30000 });
if (encoded.error) throw encoded.error;
if (encoded.status !== 0) throw new Error(`No se pudo componer Brillo de Noa: ${encoded.stderr.toString()}`);
if (encoded.stdout.length >= 200 * 1024) throw new Error("La música estelar supera su límite de tamaño.");
const decoded = spawnSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-i", "pipe:0", "-f", "f32le", "-acodec", "pcm_f32le", "pipe:1",
], { input: encoded.stdout, maxBuffer: 4 * 1024 * 1024, timeout: 30000 });
if (decoded.error) throw decoded.error;
if (decoded.status !== 0) throw new Error(`No se pudo verificar la música estelar: ${decoded.stderr.toString()}`);
let decodedPeak = 0;
let decodedEnergy = 0;
let decodedAbsolute = 0;
for (let index = 0; index < decoded.stdout.length; index += 4) {
  const value = decoded.stdout.readFloatLE(index);
  if (!Number.isFinite(value)) throw new Error("La música estelar contiene muestras inválidas.");
  decodedPeak = Math.max(decodedPeak, Math.abs(value));
  decodedEnergy += value * value;
  decodedAbsolute += Math.abs(value);
}
const decodedSamples = decoded.stdout.length / 4;
if (!decodedSamples || decodedPeak > .5 || Math.abs(decodedSamples / sampleRate - seconds) > .1) {
  throw new Error("El MP3 estelar no cumple su margen de volumen o duración.");
}
const target = fileURLToPath(new URL("../public/assets/music/noa-estelar.mp3", import.meta.url));
if (process.argv.includes("--check")) {
  if (!readFileSync(target).equals(encoded.stdout)) throw new Error("La música estelar no coincide con su composición original.");
} else writeFileSync(target, encoded.stdout);
const notes = melodyBars.flat().filter((note) => note !== null);
console.log(`Brillo de Noa: ${bpm} BPM, ${melodyBars.length} compases, MIDI ${Math.min(...notes)}–${Math.max(...notes)}, ${seconds}s, ${encoded.stdout.length} bytes.`);
console.log(`PCM peak ${peak.toFixed(3)}; MP3 decodificado ${(decodedSamples / sampleRate).toFixed(3)}s, peak ${decodedPeak.toFixed(3)}, RMS ${Math.sqrt(decodedEnergy / decodedSamples).toFixed(3)}, media absoluta ${(decodedAbsolute / decodedSamples).toFixed(3)}; ${process.argv.includes("--check") ? "OK" : "generada"}.`);
