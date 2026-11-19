/**
 * Reglas de piedra, papel o tijera y el gesto que piensa el guardián (decisión «Piedra, papel o tijera: ¿azar puro o
 * algo que leer?»). El guardián enseña en su bocadillo el gesto que va a sacar y siempre dice la verdad: en la primera
 * ronda lo piensa al azar y después piensa el que gana al último gesto de Noa. Así, quien mira el bocadillo gana
 * siempre y quien pulsa siempre el mismo botón pierde.
 */
export type Gesto = "rock" | "paper" | "scissors";
export type GanadorRonda = "noa" | "boss" | "tie";

export const GESTOS: readonly Gesto[] = ["rock", "paper", "scissors"];

/** El gesto que gana al dado: el papel envuelve la piedra, la piedra rompe la tijera y la tijera corta el papel. */
export const loQueGanaA = (gesto: Gesto): Gesto => gesto === "rock" ? "paper" : gesto === "paper" ? "scissors" : "rock";

export function ganadorRonda(noa: Gesto, guardian: Gesto): GanadorRonda {
  if (noa === guardian) return "tie";
  return loQueGanaA(guardian) === noa ? "noa" : "boss";
}

/** Gesto que piensa el guardián: al azar si Noa aún no ha sacado ninguno; si no, el que gana al último de Noa. */
export const gestoPensado = (ultimoDeNoa: Gesto | undefined, azar: number): Gesto =>
  ultimoDeNoa ? loQueGanaA(ultimoDeNoa) : GESTOS[Math.abs(Math.floor(azar)) % GESTOS.length];
