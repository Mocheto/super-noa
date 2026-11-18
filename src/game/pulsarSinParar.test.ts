import assert from "node:assert/strict";
import test from "node:test";
import * as abeja from "./beeNinja.ts";
import * as fiesta from "./catParty.ts";
import * as tambor from "./armoniaDrum.ts";
import * as merienda from "./meriendaJabatos.ts";
import { pulsacionesSinParar, REBOTE_PULSOS } from "./pulsacionVacia.ts";

// Decisión «Qué cuesta pulsar sin parar en los minijuegos rítmicos»: cada pulsación vacía baja la raya, así que
// pulsar sin parar, o una vez por pulso sin escuchar, no llega a la raya dorada; tocar en su pulso, aunque sea
// con un cuarto de pulso de error, sí gana.

type Juego = {
  nombre: string;
  pulsoMs: number;
  /** Juega la canción con estas pulsaciones (en pulsos, en orden) y dice si gana y si es perfecto. */
  jugar: (pulsaciones: number[]) => { won: boolean; result: string };
  /** Pulsos en que hay que pulsar para acertar cada pieza de la canción. */
  objetivos: () => number[];
  largo: number;
};

const juegos: Juego[] = [
  {
    nombre: "abeja ninja",
    pulsoMs: abeja.PULSE_MS,
    largo: abeja.scoreLength(abeja.beeScores.song),
    objetivos: () => abeja.createRun("song").targets.filter((target) => target.kind === "flower").map((target) => target.cut),
    jugar: (pulsaciones) => {
      const run = abeja.createRun("song");
      for (const pulso of pulsaciones) { abeja.collectFalls(run, pulso); abeja.pressAt(run, pulso); }
      abeja.collectFalls(run, Infinity);
      return abeja.outcomeOf(run);
    },
  },
  {
    nombre: "tambor de Armonía",
    pulsoMs: tambor.PULSE_MS,
    largo: tambor.scoreLength(tambor.drumScores.song),
    objetivos: () => tambor.createRun("song").targets.map((target) => target.pulse),
    jugar: (pulsaciones) => {
      const run = tambor.createRun("song");
      for (const pulso of pulsaciones) tambor.pressAt(run, pulso);
      return tambor.outcomeOf(run);
    },
  },
  {
    nombre: "merienda de los jabatos",
    pulsoMs: merienda.PULSE_MS,
    largo: merienda.scoreLength(merienda.meriendaScores.song),
    objetivos: () => merienda.createRun("song").bites.map((bite) => bite.pulse),
    jugar: (pulsaciones) => {
      const run = merienda.createRun("song");
      for (const pulso of pulsaciones) { merienda.missesAt(run, pulso); merienda.pressAt(run, pulso); }
      return merienda.outcomeOf(run);
    },
  },
  {
    nombre: "fiesta de los gatitos",
    pulsoMs: fiesta.PULSE_MS,
    largo: fiesta.scoreLength(fiesta.partyScores.song),
    objetivos: () => fiesta.createRun("song").pieces.filter((item) => item.type !== "yarn").flatMap((item) => [...item.hits]).sort((a, b) => a - b),
    jugar: (pulsaciones) => {
      const run = fiesta.createRun("song");
      for (const pulso of pulsaciones) { fiesta.collectMisses(run, pulso); fiesta.pressAt(run, pulso); }
      return fiesta.outcomeOf(run);
    },
  },
];

/** Error repetible entre -¼ y +¼ de pulso, distinto en cada pieza. */
const errorDe = (indice: number) => (((indice * 37) % 11) / 10 - 0.5) * 0.5;

for (const juego of juegos) {
  test(`${juego.nombre}: pulsar sin parar no gana`, () => {
    for (const porSegundo of [4, 8, 15]) {
      const porPulso = porSegundo * juego.pulsoMs / 1000;
      for (const fase of [0, 0.3, 0.7]) {
        const resultado = juego.jugar(pulsacionesSinParar(0, juego.largo, porPulso, fase));
        assert.equal(resultado.won, false, `${porSegundo} por segundo, fase ${fase}`);
      }
    }
  });

  test(`${juego.nombre}: pulsar una vez por pulso sin escuchar no gana`, () => {
    for (const fase of [0, 0.25, 0.5, 0.75]) {
      const resultado = juego.jugar(pulsacionesSinParar(-0.5, juego.largo, 1, fase));
      assert.equal(resultado.won, false, `fase ${fase}`);
    }
  });

  test(`${juego.nombre}: tocar en cada pieza con hasta ¼ de pulso de error gana, y sin error es perfecto`, () => {
    const objetivos = juego.objetivos();
    assert.ok(objetivos.every((pulso, indice) => indice === 0 || pulso - objetivos[indice - 1] > REBOTE_PULSOS + 0.5), "las piezas no caben en un rebote");
    const conError = objetivos.map((pulso, indice) => pulso + errorDe(indice)).sort((a, b) => a - b);
    assert.equal(juego.jugar(conError).won, true, "con error");
    assert.equal(juego.jugar(objetivos).result, "perfecto", "en su pulso");
  });
}
