import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SAMPLE_IDS, createRun, hitSamples, musicForEighth, partyScores, scoreLength, sampleUrl, type PartyNote } from "./catParty.ts";

const wav = (id: string) => readFileSync(new URL(`../../public/assets/audio/gatitos/${id}.wav`, import.meta.url));
const song = () => createRun("song");
const allNotes = () => { const run = song(); return Array.from({ length: scoreLength(run.score) * 2 }, (_, eighth) => musicForEighth(run, eighth)).flat(); };

test("cada sample existe como WAV mono de 16 bits a 32 kHz y la ruta es relativa", () => {
  assert.equal(SAMPLE_IDS.length, 10);
  for (const id of SAMPLE_IDS) {
    const bytes = wav(id);
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF", id);
    assert.equal(bytes.toString("ascii", 8, 12), "WAVE", id);
    assert.deepEqual([bytes.readUInt16LE(20), bytes.readUInt16LE(22), bytes.readUInt32LE(24), bytes.readUInt16LE(34)], [1, 1, 32000, 16], id);
    assert.match(sampleUrl(id), /^\.\/assets\/audio\/gatitos\/[a-z0-9-]+\.wav$/);
  }
});

test("la partitura usa todos los instrumentos y conserva el sonido de respaldo de cada nota", () => {
  const used = new Set<string>();
  for (const note of allNotes()) {
    if (note.sample) {
      used.add(note.sample.id);
      assert.ok(note.sample.gain > 0 && note.sample.gain <= 0.6, `volumen ${note.sample.gain}`);
      assert.ok(Number.isFinite(note.sample.rate ?? 1) && (note.sample.rate ?? 1) > 0.5 && (note.sample.rate ?? 1) < 2.3, `velocidad ${note.sample.rate}`);
    }
    if (note.sample === null || !note.sample) assert.ok(note.volume > 0, "una nota sin sample necesita su oscilador");
  }
  for (const id of ["marimba-do5", "flauta-sol5", "pizzicato-do3", "cascabeles", "madera", "plop-ovillo", "miau-gatito-1", "miau-gatito-2"]) assert.ok(used.has(id), id);
});

test("los avisos de los gatitos, el bajo y la madera suenan con sus samples en su pulso", () => {
  const run = song();
  const at = (pulse: number, half = 0): PartyNote[] => musicForEighth(run, pulse * 2 + half);
  const small = run.pieces.find((item) => item.type === "small")!;
  assert.ok(at(small.push).some((note) => note.sample?.id === "miau-gatito-1"), "maullido del primer gatito");
  const medium = run.pieces.find((item) => item.type === "medium")!;
  assert.ok(at(medium.push + 1).some((note) => note.sample?.id === "miau-gatito-2"), "el segundo gatito repite el maullido");
  const yarn = run.pieces.find((item) => item.type === "yarn")!;
  assert.ok(at(yarn.push).some((note) => note.sample?.id === "plop-ovillo"), "el ovillo suena distinto");
  const bass = at(8).find((note) => note.sample?.id === "pizzicato-do3");
  assert.ok(bass && Math.abs(bass.sample!.rate! - bass.frequency / 130.81) < 1e-9, "el pizzicato se transporta a la raíz del acorde");
  assert.ok(at(9).some((note) => note.sample?.id === "madera"), "madera en el pulso 2");
  assert.ok(at(8, 1).some((note) => note.sample?.id === "cascabeles"), "cascabeles entre pulsos");
  assert.equal(at(8, 1).filter((note) => note.sample === null).length, 1, "el siseo se calla cuando hay samples");
});

test("la flauta entra al principio de los compases pares y no existe sin sample", () => {
  const flute = allNotes().filter((note) => note.sample?.id === "flauta-sol5" && note.volume === 0);
  assert.ok(flute.length > 5);
  assert.ok(flute.every((note) => note.bus === "music"));
});

test("el golpe de la jugadora toca hachazo y marimba afinada en la nota del acorde", () => {
  const [axe, marimba] = hitSamples(523.25);
  assert.equal(axe.id, "hachazo");
  assert.deepEqual([marimba.id, marimba.rate], ["marimba-do5", 1]);
  assert.ok(Math.abs(hitSamples(659.25)[1].rate! - 659.25 / 523.25) < 1e-9);
  assert.equal(partyScores.song.bars, 28, "la partitura no cambia");
});
