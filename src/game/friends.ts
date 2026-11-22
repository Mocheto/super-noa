import "../textos/zonas/amigos.ts";
import { conTextos } from "../textos/index.ts";
import { friendData, type FriendDatos, type FriendFood } from "./friendData.ts";

/** Pestaña Amigos: ficha de cada animal o enemigo del juego. Los textos son para una niña de cinco años. */
export { MAX_HEARTS, type FriendFood } from "./friendData.ts";
export type FriendEntry = FriendDatos & { name: string; biteLine: string; tip: string };

export const friendCatalog: FriendEntry[] = friendData.map((amigo) => conTextos({ ...amigo }, {
  name: `amigos.${amigo.kind}.nombre.rotulo`, biteLine: `amigos.${amigo.kind}.muerde.juntos`, tip: `amigos.${amigo.kind}.consejo.juntos`,
}) as FriendEntry);

export const foodNames = conTextos({} as Record<FriendFood, string>, { apple: "amigos.comida.apple.rotulo", acorn: "amigos.comida.acorn.rotulo", flower: "amigos.comida.flower.rotulo" });
