import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const sampleRate = 32000;
const seconds = 12;
const pcm = Buffer.alloc(sampleRate * seconds * 4);
const melody = [72, 76, 79, 74, 77, 81, 76, 79, 71, 74, 77, 76, 74, 72, 67, 72];
const chords = [[48, 55, 64], [53, 60, 69], [45, 52, 60], [43, 50, 62]];
const frequency = (note) => 440 * 2 ** ((note - 69) / 12);
let peak = 0;
let energy = 0;
for (let index = 0; index < sampleRate * seconds; index++) {
  const time = index / sampleRate;
  const beat = Math.floor(time / .75);
  const age = time - beat * .75;
  const attack = Math.min(1, age / .025);
  const release = Math.min(1, (.75 - age) / .13);
  const phase = frequency(melody[beat]) * age * Math.PI * 2;
  const bell = (Math.sin(phase) + .22 * Math.sin(phase * 2) + .06 * Math.sin(phase * 3)) * Math.exp(-age * 3);
  const chordAge = time % 3;
  const chordEnvelope = Math.min(1, chordAge / .12, (3 - chordAge) / .24);
  const chord = chords[Math.floor(time / 3)].reduce((sum, note) => sum + Math.sin(frequency(note) * chordAge * Math.PI * 2), 0);
  const edge = Math.min(1, time / .02, (seconds - time) / .02);
  const value = (.16 * bell * attack * release + .025 * chord * chordEnvelope) * edge;
  peak = Math.max(peak, Math.abs(value));
  energy += value * value;
  pcm.writeFloatLE(value, index * 4);
}
if (peak >= .5 || Math.sqrt(energy / (sampleRate * seconds)) < .025) throw new Error("La mezcla estelar no cumple su margen de volumen.");
const encoded = spawnSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-f", "f32le", "-ar", String(sampleRate), "-ac", "1", "-i", "pipe:0",
  "-codec:a", "libmp3lame", "-b:a", "96k", "-metadata", "title=Brillo de Noa",
  "-metadata", "artist=Super Noa", "-id3v2_version", "3", "-f", "mp3", "pipe:1",
], { input: pcm, maxBuffer: 4 * 1024 * 1024, timeout: 30000 });
if (encoded.error) throw encoded.error;
if (encoded.status !== 0) throw new Error(`No se pudo componer Brillo de Noa: ${encoded.stderr.toString()}`);
const target = fileURLToPath(new URL("../public/assets/music/noa-estelar.mp3", import.meta.url));
if (process.argv.includes("--check")) {
  if (!readFileSync(target).equals(encoded.stdout)) throw new Error("La música estelar no coincide con su composición original.");
} else writeFileSync(target, encoded.stdout);
console.log(`Brillo de Noa: ${seconds}s, ${encoded.stdout.length} bytes, peak ${peak.toFixed(3)}; ${process.argv.includes("--check") ? "OK" : "generada"}.`);
