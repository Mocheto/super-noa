import assert from "node:assert/strict";
import test from "node:test";
import { ganadorRonda, gestoPensado, GESTOS, loQueGanaA, type Gesto } from "./piedraPapelTijera.ts";

/** Juega un duelo a dos victorias. `elige` recibe lo que piensa el guardián y devuelve el gesto de Noa. */
function duelo(elige: (pensado: Gesto) => Gesto, azar: number) {
  let noa = 0;
  let guardian = 0;
  let ultimo: Gesto | undefined;
  for (let ronda = 0; ronda < 50 && noa < 2 && guardian < 2; ronda++) {
    const pensado = gestoPensado(ultimo, azar + ronda);
    const gesto = elige(pensado);
    const ganador = ganadorRonda(gesto, pensado);
    if (ganador === "noa") noa += 1;
    if (ganador === "boss") guardian += 1;
    ultimo = gesto;
  }
  return noa === 2 ? "noa" : "guardian";
}

test("las reglas: el papel envuelve la piedra, la piedra rompe la tijera y la tijera corta el papel", () => {
  assert.equal(ganadorRonda("paper", "rock"), "noa");
  assert.equal(ganadorRonda("rock", "scissors"), "noa");
  assert.equal(ganadorRonda("scissors", "paper"), "noa");
  assert.equal(ganadorRonda("rock", "paper"), "boss");
  assert.equal(ganadorRonda("paper", "paper"), "tie");
  for (const gesto of GESTOS) assert.equal(ganadorRonda(loQueGanaA(gesto), gesto), "noa");
});

test("el guardián piensa al azar la primera vez y después lo que gana al último gesto de Noa", () => {
  assert.deepEqual([0, 1, 2, 3].map((azar) => gestoPensado(undefined, azar)), ["rock", "paper", "scissors", "rock"]);
  assert.equal(gestoPensado("rock", 0), "paper");
  assert.equal(gestoPensado("scissors", 1), "rock");
});

test("pulsar siempre el mismo botón pierde el duelo", () => {
  for (const gesto of GESTOS) for (const azar of [0, 1, 2]) assert.equal(duelo(() => gesto, azar), "guardian", `${gesto}, azar ${azar}`);
});

test("mirar el bocadillo y sacar lo que le gana gana siempre, sin perder ninguna ronda", () => {
  for (const azar of [0, 1, 2]) assert.equal(duelo(loQueGanaA, azar), "noa");
});
