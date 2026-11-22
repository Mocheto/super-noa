/**
 * Visitantes de la casa (mapa «Visitas de los amigos a la casa»): de vez en cuando, un animal amigo llama a la puerta y
 * pasa un rato en el jardín. Quién puede venir, cuándo toca, y qué pasa al darle de comer. La última visita se guarda en
 * el campo opcional `casa.visitante`; los corazones van al progreso de amigos de siempre. Solo lógica.
 */
import { fechaLocal, type CasaProgress } from "./casa.ts";
import { friendCatalog, type FriendFood } from "./friends.ts";
import { nivelesCampana as levels, nivelesAgua as waterLevels } from "./nivelesIndice.ts";

/** Las tres comidas de los amigos, en el orden de su lámina (docs/art/casa-visitante-v1.md). */
export const COMIDAS_AMIGOS: readonly FriendFood[] = ["apple", "acorn", "flower"];
/** Lámina de las tres comidas en su plato: tres celdas de 128 × 128 (`casa-visitante-recorte.py`). */
export const HOJA_COMIDAS_AMIGOS = "./assets/sprites/casa-comidas-amigos-v1.webp";
/** Cuánto dura la despedida: dice adiós y vuelve andando a la valla. */
export const DESPEDIDA_MS = 3000;
/** Llaman entre las 9 y las 19 h. */
export const VISITA_DESDE = 9;
export const VISITA_HASTA = 19;
/** El «toc, toc» se repite cada 10 s mientras espera. */
export const TOC_CADA_MS = 10_000;
/** A los pocos segundos de abrir la casa, si toca visita, llaman. */
export const LLAMA_A_LOS_MS = 4000;
/** Se despide 20 s después de comer, o a los 3 min si no come. */
export const SE_VA_TRAS_COMER_MS = 20_000;
export const SE_VA_SIN_COMER_MS = 180_000;

/** En el jardín: dónde asoma junto a la valla mientras llama, y adónde va al entrar (pies, en px de la escena). */
export const VISITANTE_ASOMA = { x: 960, y: 486 };
export const VISITANTE_SITIO = { x: 840, y: 505 };
/** Radio de toque del visitante alrededor de su cuerpo (px de la escena). */
export const TOQUE_VISITANTE = 90;
/** Centro del cuerpo del visitante con los pies en `pies`: para tocarlo. */
export const cuerpoDelVisitante = (pies: { x: number; y: number }) => ({ x: pies.x, y: pies.y - 50 });

/** Sitios alrededor del visitante adonde van los gatitos del jardín a olerlo, de más cerca a más lejos. */
export const SITIOS_PARA_OLER: readonly { x: number; y: number }[] = [
  { x: 745, y: 495 },
  { x: 935, y: 490 },
  { x: 760, y: 525 },
  { x: 920, y: 525 },
  { x: 730, y: 468 },
];
/** Los gatitos van a olerlo cuando ha terminado de entrar. */
export const OLER_TRAS_ENTRAR_MS = 2600;

export type VisitanteProgress = { /** Día local de la última visita (AAAA-MM-DD). */ dia: string; /** Animal (tipo del catálogo de amigos). */ animal: string };

type Estadisticas = Record<string, { completed?: boolean } | undefined>;

/** Animales que Noa ya se ha encontrado: los que salen en una pantalla completada. Por orden del catálogo. */
export function visitantesPosibles(levelStats: Estadisticas): string[] {
  const vistos = new Set<string>();
  for (const level of [...levels, ...waterLevels]) {
    if (!levelStats[level.id]?.completed) continue;
    for (const enemy of level.enemies) vistos.add(enemy.kind);
  }
  return friendCatalog.map((amigo) => amigo.kind).filter((kind) => vistos.has(kind));
}

/** ¿Toca visita ahora? De 9 a 19 h y si hoy aún no ha venido nadie. */
export function tocaVisita(casa: CasaProgress, ahora: Date): boolean {
  const hora = ahora.getHours();
  return hora >= VISITA_DESDE && hora < VISITA_HASTA && casa.visitante?.dia !== fechaLocal(ahora);
}

/** Elige quién viene: al azar entre los posibles, sin repetir el de la visita anterior si hay otro. `null` si nadie. */
export function elegirVisitante(casa: CasaProgress, levelStats: Estadisticas, azar: () => number = Math.random): string | null {
  const posibles = visitantesPosibles(levelStats);
  const otros = posibles.filter((kind) => kind !== casa.visitante?.animal);
  const entre = otros.length ? otros : posibles;
  if (!entre.length) return null;
  return entre[Math.min(entre.length - 1, Math.floor(azar() * entre.length))];
}

/** Apunta la visita de hoy al llamar a la puerta: si no se le abre, vuelve otro día. */
export const apuntarVisita = (casa: CasaProgress, animal: string, ahora: Date): CasaProgress =>
  ({ ...casa, visitante: { dia: fechaLocal(ahora), animal } });

/** La comida favorita de un animal amigo. */
export const comidaFavoritaDe = (animal: string): FriendFood | null => friendCatalog.find((amigo) => amigo.kind === animal)?.favoriteFood ?? null;

/**
 * El visitante come lo que le da Noa: siempre se lo come; con su favorita, y si aún no ha ganado corazón en esta visita,
 * gana uno (se suma en el progreso de amigos).
 */
export function darDeComerAlVisitante(animal: string, comida: FriendFood, yaGanoCorazon: boolean): { favorita: boolean; corazon: boolean } {
  const favorita = comidaFavoritaDe(animal) === comida;
  return { favorita, corazon: favorita && !yaGanoCorazon };
}

/** Lectura tolerante de la última visita: día válido y animal del catálogo. */
export function normalizeVisitante(raw: unknown): VisitanteProgress | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const { dia, animal } = raw as Record<string, unknown>;
  if (typeof dia !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dia) || typeof animal !== "string") return undefined;
  return friendCatalog.some((amigo) => amigo.kind === animal) ? { dia, animal } : undefined;
}
