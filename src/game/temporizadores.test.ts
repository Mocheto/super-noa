import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { crearTemporizadores, ponerRespuesta, sinId, type Reloj } from "./temporizadores.ts";

/** Reloj de mentira: los temporizadores se disparan a mano con `avanzar`. */
function relojFalso() {
  let ahora = 0;
  let siguiente = 1;
  const pendientes = new Map<number, { cuando: number; fn: () => void }>();
  const reloj: Reloj = {
    poner: (fn, ms) => { const id = siguiente++; pendientes.set(id, { cuando: ahora + ms, fn }); return id; },
    quitar: (id) => { pendientes.delete(id as number); },
  };
  const avanzar = (ms: number) => {
    ahora += ms;
    for (const [id, { cuando, fn }] of [...pendientes].sort((a, b) => a[1].cuando - b[1].cuando)) {
      if (cuando <= ahora && pendientes.delete(id)) fn();
    }
  };
  return { reloj, avanzar, pendientes };
}

test("los temporizadores se llaman a su hora y se olvidan al llamarse", () => {
  const { reloj, avanzar } = relojFalso();
  const t = crearTemporizadores(reloj);
  const llamadas: string[] = [];
  t.despues(100, () => llamadas.push("a"));
  t.despues(300, () => llamadas.push("b"));
  assert.equal(t.pendientes, 2);
  avanzar(150);
  assert.deepEqual(llamadas, ["a"]);
  assert.equal(t.pendientes, 1);
  avanzar(200);
  assert.deepEqual(llamadas, ["a", "b"]);
  assert.equal(t.pendientes, 0);
});

test("al cerrar la casa no sobrevive ninguno, ni los que se programan dentro de otros", () => {
  const { reloj, avanzar, pendientes } = relojFalso();
  const t = crearTemporizadores(reloj);
  let llamadas = 0;
  t.despues(100, () => { llamadas++; t.despues(500, () => { llamadas++; }); });
  for (let i = 0; i < 24; i++) t.despues(1000 + i, () => { llamadas++; });
  avanzar(100);
  assert.equal(llamadas, 1);
  t.cancelarTodos();
  assert.equal(t.pendientes, 0);
  assert.equal(pendientes.size, 0, "el reloj no guarda ninguno");
  avanzar(10_000);
  assert.equal(llamadas, 1, "nada se llama tras cerrar");
});

test("se puede cancelar uno solo", () => {
  const { reloj, avanzar } = relojFalso();
  const t = crearTemporizadores(reloj);
  let llamado = false;
  const id = t.despues(100, () => { llamado = true; });
  t.cancelar(id);
  avanzar(200);
  assert.equal(llamado, false);
});

test("una respuesta nueva sustituye a la del mismo gatito y se quita solo la de su id", () => {
  const lista = ponerRespuesta([{ gatito: 0, id: 1 }, { gatito: 1, id: 2 }], { gatito: 0, id: 3 });
  assert.deepEqual(lista, [{ gatito: 1, id: 2 }, { gatito: 0, id: 3 }]);
  assert.deepEqual(sinId(lista, 1), lista, "la vieja ya no estaba");
  assert.deepEqual(sinId(lista, 3), [{ gatito: 1, id: 2 }]);
});

test("la casa no lanza temporizadores sueltos: todos pasan por los que se cancelan al cerrarla", () => {
  const casa = readFileSync(new URL("./CasaGatitos.tsx", import.meta.url), "utf8");
  // Solo quedan los de los efectos, que se limpian en su propio retorno (el reloj de la llegada, el del visitante y el
  // de coger a un gatito).
  const sueltos = casa.split("\n").filter((linea) => /window\.setTimeout\(/.test(linea) && !/const (espera|reloj) = window\.setTimeout|\.temporizador = window\.setTimeout/.test(linea));
  assert.deepEqual(sueltos, []);
  assert.doesNotMatch(casa, /\+\+idRef\.current/, "el patrón id + setTimeout se hace con useEfimero y useRespuestas");
  const bano = readFileSync(new URL("./BanoGatito.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(bano, /window\.setTimeout\(/, "el baño tampoco deja temporizadores sueltos");
});
