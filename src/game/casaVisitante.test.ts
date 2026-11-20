import assert from "node:assert/strict";
import test from "node:test";
import { asegurarGatitos, casaVacia, normalizeCasa } from "./casa.ts";
import {
  apuntarVisita, comidaFavoritaDe, COMIDAS_AMIGOS, darDeComerAlVisitante, elegirVisitante, tocaVisita, visitantesPosibles,
} from "./casaVisitante.ts";
import { friendCatalog } from "./friends.ts";
import { levels } from "./levels.ts";
import { emptyProgress, parseProgress, serializeProgress } from "./progress.ts";

const ahora = new Date(2026, 10, 20, 12);
const casa = asegurarGatitos(casaVacia(ahora), [1], ahora);
const completadas = (...ids: string[]) => Object.fromEntries(ids.map((id) => [id, { completed: true }]));

test("solo vienen animales de pantallas completadas, y todos son del catálogo de amigos", () => {
  assert.deepEqual(visitantesPosibles({}), []);
  const primera = levels[0];
  const posibles = visitantesPosibles(completadas(primera.id));
  assert.ok(posibles.length > 0);
  const deLaPantalla = new Set<string>(primera.enemies.map((enemy) => enemy.kind));
  for (const kind of posibles) {
    assert.ok(deLaPantalla.has(kind));
    assert.ok(friendCatalog.some((amigo) => amigo.kind === kind));
  }
  const todas = visitantesPosibles(completadas(...levels.map((level) => level.id)));
  assert.ok(todas.length > 20);
});

test("como mucho una visita al día, de 9 a 19 h", () => {
  assert.ok(tocaVisita(casa, ahora));
  assert.ok(!tocaVisita(casa, new Date(2026, 10, 20, 8, 59)));
  assert.ok(!tocaVisita(casa, new Date(2026, 10, 20, 19)));
  const visitada = apuntarVisita(casa, "slime", ahora);
  assert.ok(!tocaVisita(visitada, new Date(2026, 10, 20, 17)));
  assert.ok(tocaVisita(visitada, new Date(2026, 10, 21, 10)));
});

test("elige al azar sin repetir el anterior; nadie si no hay a quién", () => {
  const stats = completadas(...levels.map((level) => level.id));
  const posibles = visitantesPosibles(stats);
  const anterior = apuntarVisita(casa, posibles[0], ahora);
  for (const azar of [0, 0.5, 0.999]) assert.notEqual(elegirVisitante(anterior, stats, () => azar), posibles[0]);
  assert.equal(elegirVisitante(casa, {}), null);
});

test("con su comida favorita gana un corazón, una vez por visita; con otra, come sin corazón", () => {
  const animal = "slime";
  const favorita = comidaFavoritaDe(animal)!;
  assert.ok(COMIDAS_AMIGOS.includes(favorita));
  assert.deepEqual(darDeComerAlVisitante(animal, favorita, false), { favorita: true, corazon: true });
  assert.deepEqual(darDeComerAlVisitante(animal, favorita, true), { favorita: true, corazon: false });
  const otra = COMIDAS_AMIGOS.find((comida) => comida !== favorita)!;
  assert.deepEqual(darDeComerAlVisitante(animal, otra, false), { favorita: false, corazon: false });
});

test("la última visita se guarda y se lee de forma tolerante", () => {
  const visitada = apuntarVisita(casa, "wolf", ahora);
  assert.deepEqual(parseProgress(serializeProgress({ ...emptyProgress, casa: visitada })).casa?.visitante, { dia: "2026-11-20", animal: "wolf" });
  assert.equal(normalizeCasa({ ...casa, visitante: { dia: "hoy", animal: "wolf" } })?.visitante, undefined);
  assert.equal(normalizeCasa({ ...casa, visitante: { dia: "2026-11-20", animal: "dragon-gigante" } })?.visitante, undefined);
});

test("los sitios para olerlo están en la hierba del jardín, fuera de la colchoneta", async () => {
  const { SITIOS_PARA_OLER, VISITANTE_SITIO } = await import("./casaVisitante.ts");
  const { JARDIN, sobreLaColchoneta } = await import("./casaJardin.ts");
  const { dentroDelSuelo } = await import("./casaHabitacion.ts");
  assert.ok(dentroDelSuelo(JARDIN, VISITANTE_SITIO.x, VISITANTE_SITIO.y));
  for (const sitio of SITIOS_PARA_OLER) {
    assert.ok(dentroDelSuelo(JARDIN, sitio.x, sitio.y), `${sitio.x}, ${sitio.y}`);
    assert.ok(!sobreLaColchoneta(sitio.x, sitio.y - 30), `${sitio.x}, ${sitio.y}`);
  }
});

test("una foto del jardín guarda al visitante y se lee de forma tolerante", async () => {
  const { normalizeFotos } = await import("./casaFoto.ts");
  const base = { hecha: new Date(2026, 10, 20, 12).toISOString(), vista: { x: 0, ancho: 640 }, decoracion: {}, noche: false, apagada: false, gatitos: [] };
  const [conVisitante] = normalizeFotos([{ ...base, jardin: { maceteros: [0, 0, 0], visitante: { animal: "wolf", x: 840, y: 505 } } }]);
  assert.deepEqual(conVisitante.jardin?.visitante, { animal: "wolf", x: 840, y: 505 });
  const [rara] = normalizeFotos([{ ...base, jardin: { maceteros: [0, 0, 0], visitante: { animal: "<script>", x: 1, y: 1 } } }]);
  assert.equal(rara.jardin?.visitante, undefined);
});
