import { VIEW_WIDTH } from "./constants.ts";
import type { ClaveTexto } from "../textos/index.ts";

/**
 * Carteles del lienzo (issue 317): como mucho una pista a la vez, encima de todo y sin pisar el HUD de esquinas ni a
 * los carteles de las cajas. Las pistas son las ayudas de la pantalla (doble salto, mecánica del mundo, cielo, nadar);
 * los carteles de objeto («SALTA DEBAJO», «¡TOCA!») van sobre su caja y pueden convivir con ella.
 */

/** Primera fila libre bajo el HUD de esquinas en escritorio, en unidades del lienzo. */
export const CARTEL_ARRIBA = 66;
/** Aire entre dos carteles, y entre un cartel y el HUD, en unidades del lienzo. */
export const CARTEL_HUECO = 6;

export type Pista = { claves: ClaveTexto[]; centroX: number };

export type EstadoPista = {
  levelId: string;
  world: number;
  screen: number;
  vertical: boolean;
  detour: boolean;
  bloomBridges: boolean;
  mecanicas: boolean;
  cameraX: number;
  levelAge: number;
  playerX: number;
  playerY: number;
  completed: boolean;
};

const AYUDA_MUNDO: Partial<Record<number, "lava" | "rocio" | "regalo" | "arena" | "vagones" | "musica">> = { 10: "lava", 11: "rocio", 13: "regalo", 14: "arena", 15: "vagones", 16: "musica" };
const AYUDA_INICIO: Partial<Record<number, "lobos" | "petalos" | "perrito" | "compas">> = { 3: "lobos", 11: "petalos", 6: "perrito", 16: "compas" };

/** Todas las pistas que tocarían ahora, de más a menos urgente. La de inicio dura unos segundos y va primero. */
export function pistasPosibles(estado: EstadoPista): Pista[] {
  const pistas: Pista[] = [];
  const centro = VIEW_WIDTH / 2;
  if (estado.mecanicas && estado.levelAge < 7 && estado.cameraX < 360 && estado.playerY > 150 && !estado.completed) {
    pistas.push({ claves: [`partida.lienzo.ayudaInicio.${AYUDA_INICIO[estado.world] ?? "aire"}.rotulo`], centroX: centro });
  }
  if (!estado.vertical && !estado.detour && estado.screen === 1 && estado.cameraX < 520 && estado.world >= 10 && !(estado.world === 11 && estado.bloomBridges)) {
    pistas.push({ claves: [`partida.lienzo.ayudaMundo.${AYUDA_MUNDO[estado.world] ?? "hielo"}.rotulo`], centroX: centro - estado.cameraX * .22 });
  }
  if (estado.levelId === "1-1" && estado.playerX >= 130 && estado.playerX < 1120) {
    pistas.push({ claves: ["partida.lienzo.dobleSalto.rotulo", "partida.lienzo.dobleSaltoComo.rotulo"], centroX: centro });
  }
  if (estado.world === 17 && estado.levelAge < 8) {
    pistas.push({ claves: ["partida.lienzo.vertical.sube.rotulo", "partida.lienzo.vertical.bordes.rotulo", "partida.lienzo.vertical.supersalto.rotulo"], centroX: centro });
  }
  if (estado.world === 8 && estado.playerX < 650) {
    pistas.push({ claves: ["partida.lienzo.nadar.nada.rotulo", "partida.lienzo.nadar.erizos.rotulo"], centroX: centro });
  }
  return pistas;
}

/** La única pista que se enseña: la primera de las posibles. Cuando se va, sale la siguiente. */
export const pistaDeLaPartida = (estado: EstadoPista): Pista | undefined => pistasPosibles(estado)[0];

export type Caja = { x: number; y: number; ancho: number; alto: number };
export type CartelPorColocar = { centroX: number; arriba: number; ancho: number; alto: number };

const pisa = (a: Caja, b: Caja) => a.x < b.x + b.ancho && b.x < a.x + a.ancho && a.y < b.y + b.alto && b.y < a.y + a.alto;

/**
 * Coloca los carteles en orden: ninguno sube por encima de `techo` (el borde inferior del HUD) y, si pisa uno ya
 * puesto, baja justo debajo de él. Devuelve el borde superior de cada uno.
 */
export function colocarCarteles(carteles: CartelPorColocar[], techo: number, ocupadas: Caja[] = []): number[] {
  const puestas = [...ocupadas];
  return carteles.map((cartel) => {
    const caja: Caja = { x: cartel.centroX - cartel.ancho / 2, y: Math.max(techo, cartel.arriba), ancho: cartel.ancho, alto: cartel.alto };
    for (let intento = 0; intento < puestas.length + 1; intento += 1) {
      const pisada = puestas.find((otra) => pisa(caja, otra));
      if (!pisada) break;
      caja.y = pisada.y + pisada.alto + CARTEL_HUECO;
    }
    puestas.push(caja);
    return caja.y;
  });
}

/** Techo de los carteles en el lienzo: bajo el HUD de esquinas, que mide en píxeles de pantalla y no escala con el lienzo. */
export function techoCarteles(hudAbajoPx: number | undefined, escala: number): number {
  if (!hudAbajoPx || !(escala > 0)) return CARTEL_ARRIBA;
  return Math.max(CARTEL_ARRIBA, Math.ceil(hudAbajoPx / escala + CARTEL_HUECO));
}
