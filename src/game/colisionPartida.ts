/**
 * Colisión vertical y cajas de la partida (corte 3 de «Mapear el bucle de GameCanvas para sacar la física a un
 * módulo puro»). Sin efectos: cambian a Noa (y las cajas golpeadas) y devuelven lo que ha pasado para que `GameCanvas`
 * lo haga sonar y lo cuente.
 */
import { landsOnSpring, platformSurfaceY, SKY_BOUNCE_SPEED, SPRING_SPEED } from "./gameplay.ts";
import type { Player } from "./gameState.ts";
import type { Platform, RewardBlock } from "./types";

/** Paredes con techo: al subir, Noa se da con su parte de abajo. */
const PAREDES_CON_TECHO: ReadonlySet<Platform["kind"]> = new Set(["cave-wall", "castle-wall", "sea-wall", "dino-wall", "volcano-wall", "ice-wall", "puzzle-block"]);
const MUELLES: ReadonlySet<Platform["kind"]> = new Set(["spring", "dew", "gift-spring", "sky-bounce"]);

/** Dónde estaba Noa al empezar el paso. */
export type Previo = { y: number; bottom: number; grounded: boolean };

export type Aterrizaje = {
  /** Muelles (y nubes que rebotan) que la han lanzado en este paso, en orden. */
  muelles: { x: number; nube: boolean }[];
  /** Apoyo del desvío o ascensor en que se ha quedado de pie, si es uno. */
  apoyo: string | null;
  ascensor: string | null;
  /** Rebotes en nube hasta ahora (decide la dirección del siguiente) y bloqueo del giro. */
  rebotesNube: number;
  bloqueoGiro: number;
};

/**
 * Colisión vertical con la lista de plataformas del paso (la del eje vertical: mecánicas, apoyos, ascensores y salas,
 * no la de las paredes). Aterrizar para la caída; un muelle lanza solo si se cae sobre él; la nube que rebota lanza
 * hacia un lado que alterna con sus rebotes y su `x`, y bloquea el giro 0,42 s; las paredes tienen techo.
 */
export function aterrizar(
  player: Player,
  platforms: readonly Platform[],
  previo: Previo,
  ctx: { rebotesNube: number; bloqueoGiro: number; apoyos: readonly (Platform & { id: string })[]; ascensores: readonly Platform[]; idsAscensor: readonly string[] },
): Aterrizaje {
  const resultado: Aterrizaje = { muelles: [], apoyo: null, ascensor: null, rebotesNube: ctx.rebotesNube, bloqueoGiro: ctx.bloqueoGiro };
  player.grounded = false;
  for (const platform of platforms) {
    const horizontal = player.x + player.width > platform.x && player.x < platform.x + platform.width;
    const surfaceY = platformSurfaceY(platform);
    const isSpring = MUELLES.has(platform.kind);
    // El muelle solo responde al aterrizaje de un salto: al caminar se puede pasar de largo.
    const landed = isSpring
      ? landsOnSpring(previo.grounded, previo.bottom, player.y + player.height, surfaceY, player.vy)
      : player.vy >= 0 && previo.bottom <= surfaceY + 10 && player.y + player.height >= surfaceY;
    if (horizontal && landed) {
      player.y = surfaceY - player.height;
      if (isSpring) {
        const nube = platform.kind === "sky-bounce";
        player.vy = -(nube ? platform.bounceSpeed ?? SKY_BOUNCE_SPEED : SPRING_SPEED);
        if (nube) {
          const direction = (resultado.rebotesNube + Math.round(platform.x)) % 2 === 0 ? -1 : 1;
          player.vx = direction * (platform.bounceDrift ?? 330);
          player.facing = direction;
          resultado.bloqueoGiro = .42;
          resultado.rebotesNube += 1;
        }
        player.grounded = false;
        player.jumpsUsed = 2;
        player.springLaunch = true;
        player.doubleJumpFx = 0.32;
        resultado.muelles.push({ x: platform.x, nube });
      } else {
        player.vy = 0;
        player.grounded = true;
        player.jumpsUsed = 0;
        player.springLaunch = false;
        resultado.apoyo = ctx.apoyos.find((entry) => entry === platform)?.id ?? null;
        const liftIndex = ctx.ascensores.indexOf(platform);
        resultado.ascensor = liftIndex >= 0 ? ctx.idsAscensor[liftIndex] ?? null : null;
      }
    } else if (PAREDES_CON_TECHO.has(platform.kind) && horizontal && player.vy < 0) {
      const platformBottom = platform.y + platform.height;
      if (previo.y >= platformBottom - 10 && player.y <= platformBottom) {
        player.y = platformBottom;
        player.vy = 0;
      }
    }
  }
  return resultado;
}

/**
 * Cajas: se puede estar de pie encima y, desde abajo, se golpean (Noa rebota a 95 px/s). Devuelve las cajas golpeadas
 * por primera vez en este paso, en orden, y las apunta en `golpeadas`: el premio sale una sola vez.
 */
export function golpearCajas(player: Player, blocks: readonly RewardBlock[], golpeadas: Set<string>, previo: Pick<Previo, "y" | "bottom">): RewardBlock[] {
  const nuevas: RewardBlock[] = [];
  for (const block of blocks) {
    const horizontal = player.x + player.width > block.x && player.x < block.x + 48;
    if (!horizontal) continue;
    if (player.vy >= 0 && previo.bottom <= block.y + 10 && player.y + player.height >= block.y) {
      player.y = block.y - player.height;
      player.vy = 0;
      player.grounded = true;
      player.jumpsUsed = 0;
    } else if (player.vy < 0 && previo.y >= block.y + 40 && player.y <= block.y + 48) {
      player.y = block.y + 48;
      player.vy = 95;
      if (!golpeadas.has(block.id)) {
        golpeadas.add(block.id);
        nuevas.push(block);
      }
    }
  }
  return nuevas;
}
