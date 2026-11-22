import type { BossId } from "./types";

/** Guardianes que retan con un juego propio en lugar de piedra, papel o tijera. Va aparte de `guardianGames.ts` para que
 * la navegación sepa qué duelo abrir sin cargar los textos de los juegos (zona diferida `juegos`). */
export const guardianGameIds = ["triceratops-queen", "sky-captain", "aurora-celeste", "rainbow-queen"] as const satisfies readonly BossId[];
export type GuardianGameId = typeof guardianGameIds[number];

export function isGuardianGameId(id: BossId): id is GuardianGameId {
  return (guardianGameIds as readonly BossId[]).includes(id);
}
