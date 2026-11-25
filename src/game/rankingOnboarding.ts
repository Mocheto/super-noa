import type { RankingDevice, RankingOwn, RankingPlayer } from "./ranking.ts";

/**
 * Apuntarse al tablón es opcional y viene desactivado: lo enciende una persona adulta en Ajustes, tras la puerta para
 * adultos. Un dispositivo que ya tenía tarjeta (también una pendiente de confirmar) sigue con el tablón encendido.
 */
export const TABLON_ACTIVO_KEY = "super-noa-tablon-activo";

export function isEnrolled(device: RankingDevice | null): boolean {
  return Boolean(device && !device.registrationPending);
}

/** Lo guardado manda (`"1"` o `"0"`); sin nada guardado, encendido solo si este dispositivo ya tenía tarjeta. */
export function tablonActivo(guardado: string | null, device: RankingDevice | null): boolean {
  if (guardado === "1") return true;
  if (guardado === "0") return false;
  return device !== null;
}

/** Al abrir el juego se pide otro alias si la revisión rechazó el que había. Sin motivo, y una sola vez por visita. */
export function pideOtroAlias(own: RankingOwn | null): boolean {
  return own?.aliasStatus === "rejected";
}

/** La fila propia del tablón: los demás (y la lista) ven el nombre público, que puede ser el provisional. */
export function esFilaPropia(player: RankingPlayer, own: RankingOwn | null, device: RankingDevice | null): boolean {
  const nombre = own?.publicAlias || (own ? null : device?.alias);
  return Boolean(nombre) && player.alias.toLocaleLowerCase("es") === nombre!.toLocaleLowerCase("es");
}
