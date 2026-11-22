import assert from "node:assert/strict";
import test from "node:test";
import { PERFIL_TAMBOR } from "./armoniaDrum.ts";
import { PERFIL_ABEJA } from "./beeNinja.ts";
import { PERFIL_FIESTA } from "./catParty.ts";
import { PERFIL_MERIENDA } from "./meriendaJabatos.ts";
import { crearEquipo, liberarEquipo, tocarNota, tocarYa, tramoNuevo, type EquipoAudio, type NotaRitmo, type PerfilSintesis } from "./ritmoAudio.ts";

// AudioContext falso: cada nodo anota sus parámetros, sus automatizaciones, a quién se conecta y cuándo arranca.
class Param {
  eventos: Array<[string, number, number?]> = [];
  entradas: Nodo[] = [];
  set value(valor: number) { this.eventos.push(["valor", valor]); }
  get value() { return 0; }
  setValueAtTime(valor: number, t: number) { this.eventos.push(["fija", valor, t]); return this; }
  exponentialRampToValueAtTime(valor: number, t: number) { this.eventos.push(["rampa", valor, t]); return this; }
}
class Nodo {
  tipo?: string;
  buffer?: unknown;
  salidas: Array<Nodo | Param> = [];
  llamadas: Array<[string, number]> = [];
  desconectado = false;
  gain = new Param();
  frequency = new Param();
  playbackRate = new Param();
  clase: string;
  constructor(clase: string) { this.clase = clase; }
  set type(valor: string) { this.tipo = valor; }
  connect<T extends Nodo | Param>(destino: T) { this.salidas.push(destino); if (destino instanceof Param) destino.entradas.push(this); return destino; }
  disconnect() { this.desconectado = true; }
  start(t: number) { this.llamadas.push(["start", t]); }
  stop(t: number) { this.llamadas.push(["stop", t]); }
}
function contextoFalso(estado = "running") {
  const creados: Nodo[] = [];
  const nuevo = (clase: string) => { const nodo = new Nodo(clase); creados.push(nodo); return nodo; };
  const context = {
    state: estado, currentTime: 2, sampleRate: 100, destination: nuevo("destino"),
    createGain: () => nuevo("gain"), createOscillator: () => nuevo("osc"), createBiquadFilter: () => nuevo("filtro"),
    createBufferSource: () => nuevo("fuente"), createBuffer: () => ({ getChannelData: () => new Float32Array(4) }),
  } as unknown as AudioContext;
  return { context, creados };
}
const nota = (extra: Partial<NotaRitmo> = {}): NotaRitmo => ({ offset: 0.5, frequency: 400, duration: 1, wave: "sine", volume: 0.2, bus: "music", ...extra });
function equipo(perfil: PerfilSintesis, estado?: string) {
  const { context, creados } = contextoFalso(estado);
  const eq = crearEquipo(perfil, 0.5, 0.8, context) as EquipoAudio;
  const antes = creados.length;
  return { eq, nuevos: () => creados.slice(antes) as Nodo[] };
}
const unico = (nodos: Nodo[], clase: string) => { const lista = nodos.filter((nodo) => nodo.clase === clase); assert.equal(lista.length, 1, clase); return lista[0]; };

test("el minijuego cuelga sus buses del contexto y al salir se desconecta entero", () => {
  const { eq } = equipo(PERFIL_TAMBOR);
  const [zona, music, cue, segment] = [eq.zona, eq.music, eq.cue, eq.segment] as unknown as Nodo[];
  assert.equal((zona.salidas[0] as Nodo).clase, "destino");
  assert.deepEqual([music.salidas[0], cue.salidas[0], segment.salidas[0]], [zona, zona, music]);
  assert.deepEqual([music.gain.eventos, cue.gain.eventos], [[["valor", 0.5]], [["valor", 0.8]]]);
  tramoNuevo(eq);
  assert.ok(segment.desconectado, "el tramo viejo se corta");
  assert.equal((eq.segment as unknown as Nodo).salidas[0], music);
  liberarEquipo(eq);
  assert.ok(zona.desconectado);
});

test("la música va por el tramo, salvo en la fiesta, que la manda directa", () => {
  for (const [perfil, bus] of [[PERFIL_ABEJA, "segment"], [PERFIL_FIESTA, "music"]] as const) {
    const { eq, nuevos } = equipo(perfil);
    tocarNota(eq, nota(), 10);
    assert.equal(unico(nuevos(), "gain").salidas[0], eq[bus]);
  }
});

test("el oscilador arranca en cuando + offset con el ataque del perfil y para 30 ms tras su duración", () => {
  for (const perfil of [PERFIL_ABEJA, PERFIL_TAMBOR, PERFIL_FIESTA]) {
    const { eq, nuevos } = equipo(perfil);
    tocarNota(eq, nota({ glideTo: 300 }), 10);
    const osc = unico(nuevos(), "osc");
    assert.deepEqual(osc.frequency.eventos, [["fija", 400, 10.5], ["rampa", 300, 11.5]]);
    assert.deepEqual(unico(nuevos(), "gain").gain.eventos, [["fija", 0.0001, 10.5], ["rampa", 0.2, 10.5 + perfil.ataque], ["rampa", 0.0001, 11.5]]);
    assert.deepEqual(osc.llamadas, [["start", 10.5], ["stop", 11.53]]);
  }
});

test("el ruido usa el filtro de su tipo y la cola del perfil", () => {
  const { eq, nuevos } = equipo(PERFIL_TAMBOR);
  tocarNota(eq, nota({ noise: "clap", bus: "cue" }), 10);
  const filtro = unico(nuevos(), "filtro");
  assert.equal(filtro.tipo, "bandpass");
  assert.deepEqual(filtro.frequency.eventos, [["valor", 1400]]);
  const fuente = unico(nuevos(), "fuente");
  assert.equal(fuente.buffer, eq.noise);
  assert.deepEqual(fuente.llamadas, [["start", 10.5], ["stop", 11.5 + PERFIL_TAMBOR.colaRuido]]);
  assert.equal(unico(nuevos(), "gain").salidas[0], eq.cue);

  const fiesta = equipo(PERFIL_FIESTA);
  tocarNota(fiesta.eq, nota({ noise: true }), 10);
  assert.equal(unico(fiesta.nuevos(), "filtro").tipo, "highpass");
});

test("el vibrato de la abeja alarga el ataque y el aliento de la merienda sostiene la nota", () => {
  const abeja = equipo(PERFIL_ABEJA);
  tocarNota(abeja.eq, nota({ vibrato: true }), 10);
  const lfo = abeja.nuevos().find((nodo) => nodo.clase === "osc" && (nodo.salidas[0] as Nodo).salidas[0] instanceof Param)!;
  assert.deepEqual(lfo.frequency.eventos, [["valor", 5.5]]);
  assert.deepEqual(lfo.llamadas, [["start", 10.5], ["stop", 11.55]]);
  const envolvente = abeja.nuevos().filter((nodo) => nodo.clase === "gain").find((nodo) => nodo.gain.eventos.length > 1)!;
  assert.deepEqual(envolvente.gain.eventos[1], ["rampa", 0.2, 10.56]);

  const merienda = equipo(PERFIL_MERIENDA);
  tocarNota(merienda.eq, nota({ breath: true, attack: 0.02, filter: { type: "lowpass", frequency: 800 } }), 10);
  const gain = merienda.nuevos().filter((nodo) => nodo.clase === "gain").find((nodo) => nodo.gain.eventos.length > 1)!;
  assert.deepEqual(gain.gain.eventos, [["fija", 0.0001, 10.5], ["rampa", 0.2, 10.52], ["fija", 0.2, 11.2], ["rampa", 0.0001, 11.5]]);
  assert.equal(unico(merienda.nuevos(), "filtro").salidas[0], gain, "el filtro de la nota va también sobre el oscilador");
});

test("con samples cargados suena el sample; null lo calla y sin samples suena el respaldo", () => {
  const banco = { zum: { id: "zum" } as unknown as AudioBuffer };
  const conSample = equipo(PERFIL_ABEJA);
  tocarNota(conSample.eq, nota({ sample: { id: "zum", gain: 0.3, rate: 1.5 } }), 10, banco);
  const fuente = unico(conSample.nuevos(), "fuente");
  assert.deepEqual([fuente.buffer, fuente.playbackRate.eventos, fuente.llamadas], [banco.zum, [["valor", 1.5]], [["start", 10.5]]]);
  assert.equal(conSample.nuevos().some((nodo) => nodo.clase === "osc"), false);

  const callada = equipo(PERFIL_ABEJA);
  tocarNota(callada.eq, nota({ sample: null }), 10, banco);
  assert.deepEqual(callada.nuevos(), []);

  const respaldo = equipo(PERFIL_ABEJA);
  tocarNota(respaldo.eq, nota({ sample: { id: "zum", gain: 0.3 } }), 10, null);
  assert.equal(respaldo.nuevos().filter((nodo) => nodo.clase === "osc").length, 1);

  const soloSample = equipo(PERFIL_FIESTA);
  tocarNota(soloSample.eq, nota({ volume: 0 }), 10, null);
  assert.deepEqual(soloSample.nuevos(), [], "una nota de volumen 0 solo existe como sample");
});

test("tocarYa suena ya por los efectos y no hace nada con el audio parado", () => {
  const { eq, nuevos } = equipo(PERFIL_TAMBOR);
  tocarYa(eq, [nota({ offset: 0 })]);
  assert.equal(unico(nuevos(), "gain").salidas[0], eq.cue);
  assert.deepEqual(unico(nuevos(), "osc").llamadas[0], ["start", 2.003]);
  const parado = equipo(PERFIL_TAMBOR, "suspended");
  tocarYa(parado.eq, [nota()]);
  assert.deepEqual(parado.nuevos(), []);
  tocarYa(null, [nota()]);
});
