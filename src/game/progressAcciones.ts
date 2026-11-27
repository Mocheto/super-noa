/**
 * Todo lo que el juego escribe en el progreso, como funciones puras `(progreso, …) => progreso`. `useProgreso.ts` las
 * envuelve en `setProgress`; aquí se prueban sin React.
 */
import { recordFlight } from "./avioneta.ts";
import { DECORACION_DE_SIEMPRE, type CasaProgress } from "./casaProgreso.ts";
import { casaAbierta } from "./casaRescate.ts";
import { ganarRegalo, type RegalosProgress } from "./regalos.ts";
import { completeSecretShop, visitSecretShop } from "./secretShopProgress.ts";
import { visitDetour } from "./detourProgress.ts";
import { addHeart } from "./friendProgress.ts";
import type { NivelResumen } from "./nivelesIndice.ts";
import { collectLifetimeApples, progressMilestone, resetCampaignProgress, type Progress } from "./progress.ts";
import { greetFriend, visitRestStop } from "./restStopProgress.ts";
import { campaignUnlockIndex } from "./routes.ts";
import type { TrajeId } from "./trajes.ts";
import type { BossId, DetourId } from "./types.ts";

/** Pegatinas recogidas durante la partida: solo cuenta (y fecha el logro) si alguna es nueva. */
export function conPegatinas(current: Progress, ids: readonly string[]): Progress {
  const nuevas = ids.filter((id) => !current.stickers.includes(id));
  return nuevas.length > 0 ? progressMilestone(current, { ...current, stickers: [...current.stickers, ...nuevas] }) : current;
}

/** Desvíos que el mapa ya ha enseñado: deja de mostrarse su aviso. Sin cambios, el mismo objeto. */
export function revelarDesvios(current: Progress, ids: readonly DetourId[]): Progress {
  const detours = { ...current.detours };
  let changed = false;
  for (const id of ids) {
    const previous = detours[id];
    if (!previous || previous.revealed) continue;
    detours[id] = { ...previous, revealed: true };
    changed = true;
  }
  return changed ? { ...current, detours } : current;
}

/** Una pantalla de campaña superada: pegatinas, desbloqueo, mejor marca de manzanas, «sin caer» y reto del jefe. */
export function completarPantalla(
  current: Progress,
  level: Pick<NivelResumen, "id" | "boss"> & Parameters<typeof campaignUnlockIndex>[0],
  final: { stickers: readonly string[]; apples: number },
  { sinCaer, reto }: { sinCaer: boolean; reto: boolean },
): Progress {
  const previous = current.levelStats[level.id];
  return progressMilestone(current, {
    ...current,
    stickers: [...new Set([...current.stickers, ...final.stickers])],
    unlocked: Math.max(current.unlocked, campaignUnlockIndex(level)),
    levelStats: {
      ...current.levelStats,
      [level.id]: { completed: true, bestApples: Math.max(previous?.bestApples ?? 0, final.apples), flawless: previous?.flawless || sinCaer },
    },
    bossChallenges: level.boss && reto ? { ...current.bossChallenges, [level.boss]: true } : current.bossChallenges,
  });
}

/** Tras superar una pantalla: llega un regalo si la casa ya está abierta y toca. Si no, el mismo objeto. */
export function ganarRegaloDePantalla(current: Progress, ahora: Date): Progress {
  if (!casaAbierta(current.levelStats)) return current;
  const regalos = ganarRegalo(current.regalos, current.casa?.decoracion ?? DECORACION_DE_SIEMPRE, ahora);
  return regalos === current.regalos ? current : { ...current, regalos };
}

export const desbloquearAgua = (current: Progress): Progress => progressMilestone(current, { ...current, waterUnlocked: true });
export const desbloquearSecreto = (current: Progress): Progress => progressMilestone(current, { ...current, secretUnlocked: true });

/** El reto de un guardián conseguido en una revancha. */
export const retoDeJefe = (current: Progress, boss: BossId): Progress =>
  progressMilestone(current, { ...current, bossChallenges: { ...current.bossChallenges, [boss]: true } });

/**
 * Salir de la avioneta: rendirse (`null`) no pierde nada y deja el marcador abierto; cruzar el arcoíris guarda la mejor
 * marca.
 */
export const terminarVuelo = (current: Progress, stars: number | null): Progress =>
  stars === null ? { ...current, avioneta: { bestStars: current.avioneta?.bestStars ?? 0, flown: true } } : recordFlight(current, stars);

export const conCasa = (current: Progress, casa: CasaProgress): Progress => ({ ...current, casa });
export const conRegalos = (current: Progress, regalos: RegalosProgress): Progress => ({ ...current, regalos });

/** El traje elegido en el mapa; elegir el que ya lleva no cambia nada. */
export const ponerTraje = (current: Progress, traje: TrajeId): Progress => current.traje === traje ? current : { ...current, traje };

/** Las acciones con nombre que usa la interfaz; cada una recibe el progreso actual y devuelve el siguiente. */
export const accionesProgreso = {
  pegatinas: conPegatinas,
  manzanas: (current: Progress, count: number) => collectLifetimeApples(current, count),
  visitarTienda: (current: Progress, id: string) => visitSecretShop(current, id),
  ganarTienda: (current: Progress, id: string) => completeSecretShop(current, id),
  visitarDesvio: (current: Progress, id: DetourId) => visitDetour(current, id),
  completarDesvio: (current: Progress, id: DetourId) => visitDetour(current, id, true),
  revelarDesvios,
  saludar: (current: Progress, world: number, kind: string) => greetFriend(current, world, kind),
  visitarPaseo: (current: Progress, world: number) => visitRestStop(current, world),
  completarPantalla,
  ganarRegaloDePantalla,
  desbloquearAgua,
  desbloquearSecreto,
  retoDeJefe,
  terminarVuelo,
  guardarCasa: conCasa,
  guardarRegalos: conRegalos,
  ponerTraje,
  amistad: (current: Progress, kind: string) => addHeart(current, kind),
  borrar: resetCampaignProgress,
};
