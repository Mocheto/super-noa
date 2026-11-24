/**
 * Huella de la partida (corte 0 de «Mapear el bucle de GameCanvas para sacar la física a un módulo puro»): juega cada
 * pantalla con unos guiones de entrada fijos, sin reloj real, y compara dónde estaba Noa, qué pasó y el último
 * snapshot con `partidaHuella.json`. Cada corte de la física debe dejarla igual.
 *
 * Si un cambio altera la partida a propósito, se regenera con `npm run huella:partida` y el commit dice por qué.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import test, { after } from "node:test";
import { mountEngine } from "./engineTestHarness.ts";
import { levels, waterLevels } from "./levels.ts";
import { testScreens } from "./testScreens.ts";
import type { Level } from "./types";

const ARCHIVO = new URL("./partidaHuella.json", import.meta.url);
const ACTUALIZAR = process.env.ACTUALIZAR_HUELLA === "1";

/** Cada tic avanza 50 ms: tres pasos fijos de física. */
const TIC_MS = 50;
/** La posición de Noa se apunta cada 10 tics (30 pasos, medio segundo). */
const MUESTRA_CADA = 10;

type Entrada = ReturnType<typeof mountEngine>["input"];
type Guion = { tics: number; aplicar: (tic: number, entrada: Entrada) => void; vale: (level: Level) => boolean };

/** Salto cada 0,7 s, doble salto 0,2 s después, botón sostenido 0,3 s y lana cada 1,1 s, hacia `lado`. */
const avanzar = (lado: "left" | "right") => (tic: number, entrada: Entrada) => {
  entrada[lado] = true;
  const enSalto = tic % 14;
  if (enSalto === 0 || enSalto === 4) entrada.jumpQueued = true;
  entrada.jump = enSalto < 6;
  if (tic % 22 === 11) entrada.shootQueued = true;
};

const GUIONES: Record<string, Guion> = {
  // 600 pasos hacia la derecha.
  avanza: { tics: 200, aplicar: avanzar("right"), vale: () => true },
  // 5 s sin tocar nada: enemigos, cañones, lava y perritos se mueven solos.
  quieta: { tics: 100, aplicar: () => {}, vale: () => true },
  // Hacia la izquierda donde hay muros que cruzar en los dos sentidos.
  izquierda: { tics: 120, aplicar: avanzar("left"), vale: (level) => level.orientation === "explore" || Boolean(level.puzzleRooms) },
};

// `levels` ya trae las acuáticas; `waterLevels` se añade por si alguna dejara de estar allí.
const PANTALLAS: Level[] = [...new Map([...levels, ...waterLevels, ...Object.values(testScreens)].map((level) => [level.id, level])).values()];

const redondo = (valor: number) => Math.round(valor * 10) / 10;

type Huella = { noa: number[][]; eventos: string; snapshots: number; final: unknown };

function jugar(level: Level, guion: Guion): Huella {
  const motor = mountEngine(level);
  const noa: number[][] = [];
  try {
    let ahora = 1000;
    motor.tick(ahora);
    for (let tic = 0; tic < guion.tics && motor.pending.size; tic++) {
      guion.aplicar(tic, motor.input);
      ahora += TIC_MS;
      motor.tick(ahora);
      if (tic % MUESTRA_CADA === MUESTRA_CADA - 1) {
        const rect = motor.worldPlayerRect;
        noa.push(rect ? [redondo(rect.x), redondo(rect.y)] : []);
      }
    }
  } finally {
    motor.unmount();
  }
  const final = motor.snapshots.at(-1);
  return {
    noa,
    eventos: motor.events.filter((evento) => evento !== "snapshot").join(" "),
    snapshots: motor.snapshots.length,
    final: final ? JSON.parse(JSON.stringify({ ...final, stickers: [...final.stickers] })) : null,
  };
}

const guardada: Record<string, Record<string, Huella>> = existsSync(ARCHIVO) && !ACTUALIZAR ? JSON.parse(readFileSync(ARCHIVO, "utf8")) : {};
const nueva: Record<string, Record<string, Huella>> = {};

test("la huella cubre todas las pantallas de campaña, las acuáticas y las de prueba", () => {
  assert.ok(waterLevels.every((agua) => PANTALLAS.includes(agua)));
  assert.equal(PANTALLAS.length, levels.length + Object.keys(testScreens).length);
  if (!ACTUALIZAR) assert.deepEqual(Object.keys(guardada).sort(), PANTALLAS.map((level) => level.id).sort(), "partidaHuella.json no tiene las mismas pantallas: npm run huella:partida");
});

for (const level of PANTALLAS) {
  test(`huella de la partida en ${level.id}`, () => {
    const huellas: Record<string, Huella> = {};
    for (const [nombre, guion] of Object.entries(GUIONES)) if (guion.vale(level)) huellas[nombre] = jugar(level, guion);
    nueva[level.id] = huellas;
    if (!ACTUALIZAR) assert.deepEqual(huellas, guardada[level.id], `la partida de ${level.id} ha cambiado; si es a propósito, npm run huella:partida`);
  });
}

test("la misma entrada da la misma partida", () => {
  const level = levels.find((candidate) => candidate.id === "1-1")!;
  assert.deepEqual(jugar(level, GUIONES.avanza), jugar(level, GUIONES.avanza));
});

if (ACTUALIZAR) {
  // Una línea por pantalla, para que el diff diga qué pantallas cambian.
  after(() => writeFileSync(ARCHIVO, `{\n${PANTALLAS.map((level) => `${JSON.stringify(level.id)}: ${JSON.stringify(nueva[level.id])}`).join(",\n")}\n}\n`));
}
