import { conTextos, existeClave } from "../textos/index.ts";
import { datosCampana, datosAgua } from "./nivelesIndiceDatos.ts";
import type { Level } from "./types";

/**
 * Lo que la interfaz necesita saber de cada pantalla sin su geometría: identidad, mundo, ruta, guardián, desvíos,
 * coleccionables y qué animales salen. Lo usan el mapa, el progreso, la casa y los amigos desde el bloque principal;
 * la geometría completa (`levels.ts`) solo se descarga con la partida.
 *
 * `nivelesIndiceDatos.ts` se genera desde `levels.ts` con `npm run niveles:indice` y no se edita a mano;
 * `nivelesIndice.test.ts` falla si se queda desfasado.
 */
export type NivelResumen = Pick<Level, "id" | "world" | "screen" | "title" | "subtitle" | "theme" | "orientation" | "boss" | "detour" | "restStop" | "checkpoints" | "verticalCheckpoints"> & {
  /** Solo cuántas salas tiene (para el HUD), no cómo son. */
  puzzleRooms?: object[];
  route?: Omit<NonNullable<Level["route"]>, "nextLabel"> & { nextLabel?: string };
  secretShop?: { id: string };
  detourEntrance?: { id: NonNullable<Level["detourEntrance"]>["id"] };
  items: Array<Pick<Level["items"][number], "id" | "kind">>;
  /** Un tipo de animal por entrada, sin repetir: basta para saber qué animales salen. */
  enemies: Array<Pick<Level["enemies"][number], "kind">>;
  chainGuardians?: Array<Pick<NonNullable<Level["chainGuardians"]>[number], "id">>;
};

export type NivelResumenDatos = Omit<NivelResumen, "title" | "subtitle">;

/** Resumen de una pantalla completa: lo que genera el índice. Sin textos: salen del catálogo por identificador. */
export function resumenDeNivel(level: Level): NivelResumenDatos {
  const resumen: NivelResumenDatos = { id: level.id, world: level.world, screen: level.screen, theme: level.theme, checkpoints: [...level.checkpoints], items: level.items.map(({ id, kind }) => ({ id, kind })), enemies: [...new Set(level.enemies.map(({ kind }) => kind))].map((kind) => ({ kind })) };
  if (level.verticalCheckpoints) resumen.verticalCheckpoints = level.verticalCheckpoints.map(({ x, y }) => ({ x, y }));
  if (level.puzzleRooms) resumen.puzzleRooms = level.puzzleRooms.map(() => ({}));
  if (level.orientation) resumen.orientation = level.orientation;
  if (level.boss) resumen.boss = level.boss;
  if (level.route) {
    const { nextLabel: _texto, ...route } = level.route;
    void _texto;
    resumen.route = { ...route };
  }
  if (level.detour) resumen.detour = level.detour;
  if (level.restStop !== undefined) resumen.restStop = level.restStop;
  if (level.secretShop) resumen.secretShop = { id: level.secretShop.id };
  if (level.detourEntrance) resumen.detourEntrance = { id: level.detourEntrance.id };
  if (level.chainGuardians) resumen.chainGuardians = level.chainGuardians.map(({ id }) => ({ id }));
  return resumen;
}

function conTextosDeResumen(datos: NivelResumenDatos): NivelResumen {
  const nivel = conTextos(datos, { title: `pantallas.${datos.id}.titulo.rotulo`, subtitle: `pantallas.${datos.id}.pista.rotulo` }) as unknown as NivelResumen;
  if (nivel.route && existeClave(`pantallas.${datos.id}.siguiente.juntos`)) conTextos(nivel.route, { nextLabel: `pantallas.${datos.id}.siguiente.juntos` });
  return nivel;
}

/** Las pantallas de la campaña en el mismo orden que `levels`. */
export const nivelesCampana: NivelResumen[] = datosCampana.map(conTextosDeResumen);
/** Las pantallas acuáticas en el mismo orden que `waterLevels`. */
export const nivelesAgua: NivelResumen[] = datosAgua.map(conTextosDeResumen);
