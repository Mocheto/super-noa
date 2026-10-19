import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

// Partituras y síntesis originales de Super Noa; sin muestras ni música externa.
// Las notas y sus ecos se suman módulo la duración: las colas cruzan el bucle.
const sampleRate = 32000;
const channels = 2;
const outputDirectory = new URL("../public/assets/music/", import.meta.url);
const checkOnly = process.argv.includes("--check");
const only = process.argv.slice(2).find((arg) => arg.startsWith("--only="))?.slice(7);
assert(process.argv.slice(2).every((arg) => arg === "--check" || arg === `--only=${only}`),
  "Uso: node scripts/build-adventure-music.mjs [--check] [--only=nombre]");

const songs = [
  {
    file: "volcan",
    title: "Dragones de caramelo",
    bpm: 108,
    meter: 4,
    key: "Do mayor / La menor",
    style: "Aventura cálida; pulso suave, bajo redondo, toms y arpegios de brasas",
    lead: "reed",
    roots: [48, 48, 53, 55, 57, 53, 50, 55, 57, 52, 53, 48, 50, 53, 55, 55],
    chords: [
      [60, 64, 67, 71], [60, 64, 67, 69], [60, 65, 69, 72], [59, 62, 67, 69],
      [60, 64, 69, 72], [60, 65, 69, 72], [62, 65, 69, 72], [59, 62, 67, 71],
      [60, 64, 69, 72], [59, 64, 67, 71], [60, 65, 69, 72], [60, 64, 67, 71],
      [62, 65, 69, 72], [60, 65, 69, 72], [59, 62, 67, 69], [59, 62, 67, 71],
    ],
    melody: [
      "E5:.5 G5:.5 A5:1 G5:.5 E5:.5 D5:1",
      "C5:1 E5:.5 G5:.5 E5:1 R:1",
      "F5:.75 A5:.25 G5:.5 F5:.5 E5:1 C5:1",
      "D5:.5 G5:.5 B4:1 D5:.5 E5:.5 G5:1",
      "A5:1 E5:.5 G5:.5 A5:.5 C6:.5 B5:.5 A5:.5",
      "G5:.5 F5:.5 E5:1 C5:1 A4:1",
      "D5:.5 F5:.5 A5:1 F5:.5 E5:.5 D5:1",
      "B4:1 D5:.5 G5:.5 A5:.5 G5:.5 R:1",
      "C6:1 B5:.5 A5:.5 E5:1 A5:1",
      "B5:.75 G5:.25 E5:1 G5:.5 E5:.5 B4:1",
      "A4:.5 C5:.5 F5:.5 A5:.5 G5:1 F5:1",
      "E5:.5 D5:.5 C5:1 G4:1 E5:1",
      "F5:.5 A5:.5 C6:1 A5:.5 F5:.5 E5:1",
      "F5:1 C5:.5 A4:.5 C5:1 F5:1",
      "D5:.5 G5:.5 A5:.5 B5:.5 A5:1 G5:1",
      "F5:.5 D5:.5 B4:1 D5:1 R:1",
    ],
  },
  {
    file: "valle",
    title: "El vals de las flores gigantes",
    bpm: 96,
    meter: 3,
    key: "Fa mayor",
    style: "Vals botánico juguetón; marimba de triángulo, pasos de gigantes y semillas",
    lead: "wood",
    roots: [41, 48, 46, 41, 43, 48, 41, 48, 50, 45, 46, 41, 43, 48, 46, 48],
    chords: [
      [57, 60, 65, 69], [55, 60, 64, 67], [58, 62, 65, 69], [57, 60, 65, 69],
      [58, 62, 67, 69], [58, 60, 64, 67], [57, 60, 65, 69], [55, 60, 64, 67],
      [57, 62, 65, 69], [57, 60, 64, 67], [58, 62, 65, 69], [57, 60, 65, 69],
      [58, 62, 67, 69], [58, 60, 64, 67], [58, 62, 65, 69], [58, 60, 64, 67],
    ],
    melody: [
      "A5:.5 C6:.5 A5:.5 G5:.5 F5:1",
      "E5:.5 G5:.5 C6:1 G5:.5 R:.5",
      "F5:.5 D5:.5 Bb4:.5 D5:.5 F5:.5 A5:.5",
      "G5:.5 A5:.5 C6:.5 A5:.5 F5:1",
      "Bb5:1 A5:.5 G5:.5 D5:1",
      "E5:.5 G5:.5 Bb5:.5 G5:.5 E5:.5 C5:.5",
      "F5:.5 A5:.5 G5:.5 F5:.5 A5:1",
      "G5:1 E5:.5 D5:.5 C5:.5 R:.5",
      "D5:.5 F5:.5 A5:1 C6:1",
      "B5:.5 A5:.5 E5:.5 C5:.5 E5:1",
      "D5:.5 F5:.5 Bb5:.5 A5:.5 F5:.5 D5:.5",
      "C5:.5 F5:.5 A5:1 G5:1",
      "G5:.5 Bb5:.5 D6:1 Bb5:.5 G5:.5",
      "C6:.5 Bb5:.5 G5:.5 E5:.5 D5:1",
      "F5:.5 D5:.5 Bb4:1 F5:1",
      "E5:.5 G5:.5 Bb5:.5 G5:.5 C5:.5 R:.5",
    ],
  },
  {
    file: "hielo",
    title: "Patines de cristal",
    bpm: 90,
    meter: 4,
    key: "Re mayor / Si menor",
    style: "Cristalino y fluido; campanas redondeadas, celesta y almohadilla de nieve",
    lead: "bell",
    roots: [50, 45, 47, 43, 50, 52, 43, 45, 47, 42, 43, 50, 52, 43, 45, 45],
    chords: [
      [57, 62, 66, 69], [57, 61, 64, 71], [59, 62, 66, 69], [59, 62, 67, 69],
      [57, 62, 66, 69], [59, 64, 67, 71], [59, 62, 67, 69], [57, 61, 64, 69],
      [59, 62, 66, 73], [57, 61, 66, 69], [59, 62, 67, 74], [57, 62, 66, 69],
      [59, 64, 67, 71], [59, 62, 67, 69], [57, 61, 64, 71], [57, 61, 64, 69],
    ],
    melody: [
      "F#5:1.5 A5:.5 E5:1 D5:1",
      "C#5:1 E5:.5 A5:.5 B5:1 A5:1",
      "F#5:.5 D5:.5 B4:1 D5:.5 F#5:.5 A5:1",
      "G5:1.5 B5:.5 A5:1 D5:1",
      "E5:.5 F#5:.5 A5:1 D6:1 A5:1",
      "G5:1 E5:.5 B4:.5 E5:1 F#5:1",
      "D5:1 G5:1 B5:.5 A5:.5 G5:1",
      "E5:1 C#5:1 B4:1 R:1",
      "B5:1.5 F#5:.5 D5:1 F#5:1",
      "A5:1 C#6:.5 B5:.5 A5:1 F#5:1",
      "G5:.5 A5:.5 B5:1 D6:1 B5:1",
      "A5:1 F#5:.5 E5:.5 D5:1 A4:1",
      "B4:.5 E5:.5 G5:1 B5:1 A5:1",
      "G5:1.5 D5:.5 B4:1 D5:1",
      "C#5:.5 E5:.5 A5:1 B5:1 E5:1",
      "C#5:1 E5:1 A4:1 R:1",
    ],
  },
  {
    file: "bosque-manzanos",
    title: "Brisa entre manzanos",
    bpm: 84,
    meter: 4,
    key: "Do mayor",
    style: "Bosque acogedor; flauta senoidal en registro medio, arpa amortiguada y pad cálido sin percusión",
    lead: "forest-flute",
    roots: [48, 43, 53, 48, 53, 48, 43, 43, 53, 48, 43, 48, 53, 48, 43, 43],
    chords: [
      [55, 60, 64, 67], [55, 59, 62, 67], [57, 60, 65, 69], [55, 60, 64, 67],
      [57, 60, 65, 69], [55, 60, 64, 67], [55, 59, 62, 67], [55, 59, 62, 67],
      [57, 60, 65, 69], [55, 60, 64, 67], [55, 59, 62, 67], [55, 60, 64, 67],
      [57, 60, 65, 69], [55, 60, 64, 67], [55, 59, 62, 67], [55, 59, 62, 67],
    ],
    melody: [
      "E4:1.5 G4:.5 E4:1 R:1",
      "D4:2 G4:1 R:1",
      "F4:1 A4:1 G4:.5 F4:.5 R:1",
      "E4:2 C4:1 R:1",
      "A4:1.5 G4:.5 F4:1 R:1",
      "G4:1 E4:1 D4:.5 C4:.5 R:1",
      "D4:1 G4:2 R:1",
      "B3:1 D4:1 G4:1 R:1",
      "F4:2 A4:.5 G4:.5 R:1",
      "E4:1 G4:.5 E4:.5 C4:1 R:1",
      "D4:1 B3:1 D4:.5 G4:.5 R:1",
      "E4:2 G4:1 R:1",
      "A4:1 F4:1 E4:.5 F4:.5 R:1",
      "G4:1.5 E4:.5 C4:1 R:1",
      "D4:1 G4:1 B3:1 R:1",
      "D4:1 B3:1 G3:1 R:1",
    ],
  },
];
assert(!only || songs.some((song) => song.file === only), `Pista desconocida: ${only}`);

function run(tool, args, input) {
  const result = spawnSync(tool, args, { input, maxBuffer: 128 * 1024 * 1024 });
  if (result.error) throw new Error(`Se necesita ${tool} instalado: ${result.error.message}`);
  assert.equal(result.status, 0, `${tool}: ${result.stderr?.toString()}`);
  return result.stdout;
}

function midi(note) {
  const match = /^([A-G])([#b]?)(\d)$/.exec(note);
  assert(match, `Nota inválida: ${note}`);
  return 12 * (Number(match[3]) + 1)
    + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[match[1]]
    + (match[2] === "#" ? 1 : match[2] === "b" ? -1 : 0);
}

const sine = (phase) => Math.sin(2 * Math.PI * phase);
function voice(kind, frequency, time) {
  const phase = frequency * time;
  switch (kind) {
    case "forest-flute":
      return .97 * sine(phase) + .03 * sine(phase * 2);
    case "forest-harp":
      return .97 * sine(phase) - .03 * sine(phase * 3) * Math.exp(-time * 6);
    case "forest-pad":
      return .99 * sine(phase) + .01 * sine(phase * 2);
    case "reed":
      return .76 * sine(phase) + .17 * sine(phase * 2) + .07 * sine(phase * 3);
    case "wood":
      return .84 * sine(phase) - .09 * sine(phase * 3) + .04 * sine(phase * 5)
        + .03 * sine(phase * 4) * Math.exp(-time * 18);
    case "bell":
      return .82 * sine(phase) + .13 * sine(phase * 2) * Math.exp(-time * 3)
        + .05 * sine(phase * 3) * Math.exp(-time * 5);
    case "pad":
      return .85 * sine(phase) + .1 * sine(phase * 2) + .05 * sine(phase * 3);
    case "tom":
      return sine(phase + 2 * (1 - Math.exp(-time * 24)));
    case "seed":
      return .65 * sine(phase) + .35 * sine(phase * 1.61);
    default:
      return sine(phase);
  }
}

function render(song) {
  const forest = song.file === "bosque-manzanos";
  const beat = 60 / song.bpm;
  const sampleCount = Math.round(32 * song.meter * beat * sampleRate);
  const audio = new Float32Array(sampleCount * channels);

  function note(start, length, pitch, gain, kind, pan = 0, echo = false) {
    const seconds = length * beat;
    const attack = kind === "forest-pad" ? .28 : kind === "forest-flute" ? .085
      : kind === "forest-harp" ? .035 : kind === "pad" ? .16 : kind === "bell" ? .016 : .012;
    const release = Math.min(seconds * .45,
      kind === "forest-pad" ? .4 : forest ? .18 : kind === "pad" ? .3 : .09);
    const frequency = 440 * 2 ** ((pitch - 69) / 12);
    const first = Math.round(start * beat * sampleRate);
    const count = Math.round(seconds * sampleRate);
    const left = Math.cos((pan + 1) * Math.PI / 4) * gain;
    const right = Math.sin((pan + 1) * Math.PI / 4) * gain;
    for (let i = 0; i < count; i += 1) {
      const time = i / sampleRate;
      const fadeIn = Math.min(1, time / attack);
      const fadeOut = Math.min(1, (count - 1 - i) / sampleRate / release);
      const envelope = Math.sin(fadeIn * Math.PI / 2) ** 2
        * Math.sin(fadeOut * Math.PI / 2) ** 2
        * (kind === "pad" || kind === "forest-pad" ? 1
          : Math.exp(-time / (kind === "forest-flute" ? 1.8 : kind === "forest-harp" ? .5 : kind === "bell" ? .55 : .34)));
      const value = voice(kind, frequency, time) * envelope;
      const index = ((first + i) % sampleCount) * channels;
      audio[index] += value * left;
      audio[index + 1] += value * right;
    }
    if (echo) {
      note(start + .75, length, pitch, gain * .18, kind, -pan);
      note(start + 1.5, length, pitch, gain * .065, kind, pan);
    }
  }

  for (let bar = 0; bar < 32; bar += 1) {
    // A–B–A'–B': la segunda vuelta cambia respuestas, registro y densidad.
    const phrase = bar % 16;
    const start = bar * song.meter;
    const chord = song.chords[phrase];
    const root = song.roots[phrase];
    let cursor = 0;
    for (const token of song.melody[phrase].split(" ")) {
      const [pitch, duration] = token.split(":");
      const length = Number(duration);
      assert(length > 0);
      if (pitch !== "R") {
        note(start + cursor, length * (forest ? .97 : .91) + (forest ? .25 : .12),
          midi(pitch), forest ? .15 : .19, song.lead, -.16, true);
        if (bar >= 16 && cursor === 0 && bar % 2 === 0) {
          note(start + cursor + (forest ? 2.5 : .5), forest ? 1 : .8,
            chord[2] + (forest ? 0 : 12), forest ? .025 : .04,
            forest ? "forest-harp" : "bell", .55, true);
        }
      }
      cursor += length;
    }
    assert.equal(cursor, song.meter, `${song.file}, compás ${bar + 1}`);

    chord.forEach((pitch, index) => {
      note(start, song.meter + (forest ? .6 : .18), pitch - 12,
        song.file === "hielo" ? .033 : .018,
        forest ? "forest-pad" : "pad", (index - 1.5) * .25);
    });

    if (forest) {
      note(start + .15, 2.5, root - 12, .055, "forest-flute");
      for (const [offset, tone] of [[.5, 0], [1.75, 2], [3, 1]]) {
        note(start + offset, 1.25, chord[tone], .038, "forest-harp", offset < 2 ? -.35 : .35, true);
      }
    } else if (song.file === "volcan") {
      for (const offset of [0, 1.5, 2, 3.5]) {
        note(start + offset, .45, root - (offset === 2 ? 5 : 0), .13, "bass", 0);
      }
      for (let step = 0; step < 8; step += 1) {
        note(start + step / 2 + .25, .3, chord[[0, 2, 1, 3][step % 4]],
          bar >= 16 ? .052 : .04, "wood", step % 2 ? -.4 : .4);
      }
      for (const offset of [0, 2]) note(start + offset, .3, 40, .09, "tom");
      for (const offset of [.75, 1.75, 2.75, 3.75]) {
        note(start + offset, .13, 76, .022, "seed", .45);
      }
      note(start + 3, .24, 52, .052, "tom", -.3);
    } else if (song.file === "valle") {
      note(start, .8, root, .14, "bass");
      note(start + 2.5, .35, root + 7, .07, "wood", -.25);
      for (const offset of [1, 2]) {
        chord.slice(0, 3).forEach((pitch, index) => {
          note(start + offset + index * .025, .38, pitch, .045, "wood", .2);
        });
      }
      note(start, .3, 36, .055, "tom");
      for (const offset of [.5, 1.5, 2.5]) {
        note(start + offset, .12, 83, .018, "seed", -.4);
      }
      if (bar % 2) note(start + 2.25, .55, chord[3] + 12, .035, "bell", .6, true);
    } else {
      note(start, 1.8, root, .10, "bass");
      note(start + 2, 1.7, root + 7, .065, "bass");
      const pattern = bar % 2 ? [3, 1, 2, 0, 2, 1, 3, 2] : [0, 2, 1, 3, 2, 1, 0, 2];
      for (let step = 0; step < 8; step += 1) {
        note(start + step * .5, .85, chord[pattern[step]] + 12,
          .04, "bell", step % 2 ? -.55 : .55, true);
      }
      if (bar % 4 === 3) note(start + 3.5, 1.2, chord[3] + 12, .028, "bell", -.6, true);
    }
  }

  // Eliminación de DC y margen amplio antes de la codificación con pérdidas.
  const means = [0, 0];
  audio.forEach((value, index) => { means[index % channels] += value / sampleCount; });
  let peak = 0;
  audio.forEach((value, index) => { peak = Math.max(peak, Math.abs(value - means[index % channels])); });
  const pcm = Buffer.alloc(audio.length * 4);
  audio.forEach((value, index) => {
    pcm.writeFloatLE((value - means[index % channels]) * (forest ? .46 : .68) / peak, index * 4);
  });
  return { pcm, sampleCount };
}

function validate(song, expectedSamples) {
  const path = fileURLToPath(new URL(`${song.file}.mp3`, outputDirectory));
  const info = JSON.parse(run("ffprobe", [
    "-v", "error", "-show_streams", "-show_format", "-of", "json", path,
  ]));
  const stream = info.streams[0];
  assert.equal(stream.codec_name, "mp3");
  assert.equal(Number(stream.sample_rate), sampleRate);
  assert.equal(stream.channels, channels);
  assert.equal(info.format.tags.title, song.title);
  const size = statSync(path).size;
  assert(size < 1024 * 1024, `${song.file}: supera 1 MiB`);
  const decoded = run("ffmpeg", ["-v", "error", "-i", path, "-f", "f32le", "-acodec", "pcm_f32le", "pipe:1"]);
  const frames = decoded.length / (4 * channels);
  assert.equal(frames, expectedSamples, `${song.file}: retardo/relleno MP3 no compensado`);
  const duration = frames / sampleRate;
  const forest = song.file === "bosque-manzanos";
  assert(duration >= (forest ? 60 : 45) && duration <= (forest ? 100 : 90));
  let peak = 0;
  let square = 0;
  let maxStep = 0;
  let clipped = 0;
  const seamWindow = Math.round(sampleRate * .025);
  const seamEnergy = [0, 0];
  const sample = (frame, channel) => decoded.readFloatLE((frame * channels + channel) * 4);
  for (let frame = 0; frame < frames; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const value = sample(frame, channel);
      assert(Number.isFinite(value));
      peak = Math.max(peak, Math.abs(value));
      square += value * value;
      if (Math.abs(value) >= .999) clipped += 1;
      if (frame) maxStep = Math.max(maxStep, Math.abs(value - sample(frame - 1, channel)));
      if (frame < seamWindow) seamEnergy[0] += value * value;
      if (frame >= frames - seamWindow) seamEnergy[1] += value * value;
    }
  }
  let seamStep = 0;
  let seamSlopeChange = 0;
  for (let channel = 0; channel < channels; channel += 1) {
    const step = sample(0, channel) - sample(frames - 1, channel);
    seamStep = Math.max(seamStep, Math.abs(step));
    seamSlopeChange = Math.max(seamSlopeChange,
      Math.abs(step - (sample(1, channel) - sample(0, channel))),
      Math.abs(step - (sample(frames - 1, channel) - sample(frames - 2, channel))));
  }
  const db = (value) => 20 * Math.log10(Math.max(value, 1e-12));
  const rmsDb = db(Math.sqrt(square / frames / channels));
  const seamBalanceDb = 10 * Math.log10(seamEnergy[0] / seamEnergy[1]);
  // Una entrada de compás tiene ataque musical: se compara con los otros
  // compases, no con un límite que penalizaría cualquier nota de percusión.
  let maxBarBalanceDb = 0;
  for (let bar = 1; bar < 32; bar += 1) {
    const boundary = Math.round(bar * song.meter * 60 / song.bpm * sampleRate);
    let before = 0;
    let after = 0;
    for (let offset = 0; offset < seamWindow; offset += 1) {
      for (let channel = 0; channel < channels; channel += 1) {
        before += sample(boundary - offset - 1, channel) ** 2;
        after += sample(boundary + offset, channel) ** 2;
      }
    }
    maxBarBalanceDb = Math.max(maxBarBalanceDb, Math.abs(10 * Math.log10(after / before)));
  }
  assert.equal(clipped, 0, `${song.file}: clipping`);
  assert(db(peak) <= -2, `${song.file}: margen insuficiente`);
  assert(rmsDb >= -23 && rmsDb <= -12, `${song.file}: nivel medio inadecuado`);
  if (forest) {
    assert(db(peak) >= -7.5 && db(peak) <= -5.5, `${song.file}: pico del bosque fuera de objetivo`);
    assert(rmsDb >= -22 && rmsDb <= -18, `${song.file}: RMS del bosque fuera de objetivo`);
  }
  assert(seamStep < .025 && seamStep <= maxStep, `${song.file}: discontinuidad de bucle`);
  assert(seamSlopeChange < .025, `${song.file}: cambio de pendiente en bucle`);
  assert(seamEnergy.every((energy) => db(Math.sqrt(energy / seamWindow / channels)) > -60),
    `${song.file}: silencio en la unión`);
  assert(Math.abs(seamBalanceDb) <= maxBarBalanceDb + 3, `${song.file}: salto anómalo de energía en bucle`);
  console.log(`${song.file}.mp3 | ${duration.toFixed(3)} s | ${(size / 1024).toFixed(1)} KiB`
    + ` | pico ${db(peak).toFixed(2)} dBFS | RMS ${rmsDb.toFixed(2)} dBFS | clipping ${clipped}`
    + ` | unión Δ ${seamStep.toFixed(5)}, pendiente ${seamSlopeChange.toFixed(5)}, energía ${seamBalanceDb.toFixed(2)} dB`);
  if (forest) validateBrightness(path);
}

function highBandRatio(path) {
  const pcm = run("ffmpeg", [
    "-v", "error", "-i", path, "-ar", String(sampleRate), "-ac", "1", "-f", "f32le", "pipe:1",
  ]);
  // Espectro de Welch: ventanas Hann de 4096 muestras, solape del 50 %.
  // La razón de potencias no depende del volumen ni de la duración del tema.
  const size = 4096;
  const real = new Float64Array(size);
  const imaginary = new Float64Array(size);
  const window = Float64Array.from({ length: size }, (_, i) => .5 - .5 * Math.cos(2 * Math.PI * i / (size - 1)));
  let total = 0;
  let high = 0;
  for (let first = 0; first + size <= pcm.length / 4; first += size / 2) {
    for (let i = 0; i < size; i += 1) {
      real[i] = pcm.readFloatLE((first + i) * 4) * window[i];
      imaginary[i] = 0;
    }
    for (let i = 1, j = 0; i < size; i += 1) {
      let bit = size >> 1;
      while (j & bit) { j ^= bit; bit >>= 1; }
      j ^= bit;
      if (i < j) [real[i], real[j]] = [real[j], real[i]];
    }
    for (let length = 2; length <= size; length *= 2) {
      const angle = -2 * Math.PI / length;
      const stepReal = Math.cos(angle);
      const stepImaginary = Math.sin(angle);
      for (let start = 0; start < size; start += length) {
        let twiddleReal = 1;
        let twiddleImaginary = 0;
        for (let j = 0; j < length / 2; j += 1) {
          const a = start + j;
          const b = a + length / 2;
          const r = real[b] * twiddleReal - imaginary[b] * twiddleImaginary;
          const im = real[b] * twiddleImaginary + imaginary[b] * twiddleReal;
          real[b] = real[a] - r;
          imaginary[b] = imaginary[a] - im;
          real[a] += r;
          imaginary[a] += im;
          const nextReal = twiddleReal * stepReal - twiddleImaginary * stepImaginary;
          twiddleImaginary = twiddleReal * stepImaginary + twiddleImaginary * stepReal;
          twiddleReal = nextReal;
        }
      }
    }
    for (let bin = 0; bin <= size / 2; bin += 1) {
      const power = (real[bin] ** 2 + imaginary[bin] ** 2) * (bin === 0 || bin === size / 2 ? 1 : 2);
      total += power;
      if (bin * sampleRate / size > 4000) high += power;
    }
  }
  assert(total > 0, `${path}: no hay energía para analizar`);
  return high / total;
}

function validateBrightness(path) {
  const oldPath = fileURLToPath(new URL("manzanos.mp3", outputDirectory));
  const current = highBandRatio(path);
  const previous = highBandRatio(oldPath);
  assert(current < .001, "Bosque: demasiada energía por encima de 4 kHz");
  assert(current < previous * .1, "Bosque: el brillo no se ha reducido al menos diez veces");
  console.log(`Brillo >4 kHz / total (mono, 32 kHz, FFT Hann): bosque ${(current * 100).toExponential(3)} %`
    + ` | manzanos anterior ${(previous * 100).toFixed(4)} %`
    + ` | reducción ${(10 * Math.log10(previous / current)).toFixed(2)} dB de proporción espectral`);
}

mkdirSync(outputDirectory, { recursive: true });
for (const song of songs.filter((song) => !only || song.file === only)) {
  const expectedSamples = Math.round(32 * song.meter * 60 / song.bpm * sampleRate);
  const destination = fileURLToPath(new URL(`${song.file}.mp3`, outputDirectory));
  if (!checkOnly) {
    const { pcm, sampleCount } = render(song);
    assert.equal(sampleCount, expectedSamples);
    run("ffmpeg", [
      "-v", "error", "-y", "-f", "f32le", "-ar", String(sampleRate), "-ac", String(channels),
      "-i", "pipe:0", "-map_metadata", "-1", "-c:a", "libmp3lame", "-b:a", "80k",
      ...(song.file === "bosque-manzanos" ? ["-cutoff", "3200"] : []),
      "-ar", String(sampleRate), "-write_xing", "1", "-id3v2_version", "3",
      "-metadata", `title=${song.title}`, "-metadata", "artist=Super Noa",
      "-metadata", "album=Aventuras originales de Super Noa",
      "-metadata", "composer=Super Noa - composicion sintetica original",
      "-metadata", `TBPM=${song.bpm}`,
      "-metadata", `comment=Original; ${song.key}; ${song.meter}/4; ${song.style}; 32 compases; bucle circular`,
      destination,
    ], pcm);
  } else {
    assert(readFileSync(destination).length > 0);
  }
  validate(song, expectedSamples);
}
