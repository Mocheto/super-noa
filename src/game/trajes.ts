/**
 * Los trajes de Noa (mapa «Trajes para los viajes de Noa», issue 471): ropa entera que solo cambia su aspecto. Aquí
 * están el catálogo, qué lleva puesto y qué archivo dibuja cada pose; va en el bloque principal, con el progreso, y
 * no carga ninguna imagen: cada pantalla pide solo las rutas que le salen de aquí, así que nunca llega el arte de un
 * traje que no está puesto.
 */

/** Identificadores que se guardan en el progreso: no se cambian ni se reutilizan. */
export const TRAJES = ["peto", "exploradora", "pirata", "caballera"] as const;
export type TrajeId = (typeof TRAJES)[number];
export const TRAJE_DE_SIEMPRE: TrajeId = "peto";

/** Lectura tolerante del campo `traje` del progreso: lo que no se entiende es como no haber elegido. */
export const normalizeTraje = (raw: unknown): TrajeId | undefined => TRAJES.find((id) => id === raw);

/** El traje que se ve: con los trajes apagados (`funciones.trajes`), siempre el peto. */
export const trajePuesto = (elegido: TrajeId | undefined, encendidos: boolean): TrajeId =>
  (encendidos ? elegido : undefined) ?? TRAJE_DE_SIEMPRE;

const DEL_PETO = {
  /** Hoja de poses: quieta, andar, salto y gata, en cuatro columnas. También el mapa y las batallas. */
  hoja: "noa-sprite-sheet",
  salto: "noa-jump-v2",
  gataQuieta: "noa-cat-yarn-v2",
  gataCorrer: "noa-cat-run-v2",
  gataSalto: "noa-cat-jump-v2",
  gataTirar: "noa-cat-throw-v1",
  /** Dos brazadas y tres filas: normal, protegida y gata. */
  nadar: "noa-swim-v1",
  /** Gestos del duelo contra los guardianes. */
  piedra: "noa-rps-0",
  papel: "noa-rps-1",
  tijera: "noa-rps-2",
  victoria: "noa-rps-3",
} as const;

export type PoseNoa = keyof typeof DEL_PETO;
export const POSES_NOA = Object.keys(DEL_PETO) as PoseNoa[];

/** El peto es el único con versión dorada dibujada para la protección de la manzana. */
const DORADAS: Partial<Record<PoseNoa, string>> = {
  hoja: "noa-sprite-sheet-gold-armor-v1",
  salto: "noa-jump-gold-armor-v1",
  piedra: "noa-rps-0-gold-armor-v1",
  papel: "noa-rps-1-gold-armor-v1",
  tijera: "noa-rps-2-gold-armor-v1",
  victoria: "noa-rps-3-gold-armor-v1",
};

/** Arte ya montado de los trajes nuevos (nombre del archivo, sin carpeta ni extensión). Lo que falte sale del peto. */
export type ArteTrajes = Partial<Record<TrajeId, Partial<Record<PoseNoa, string>>>>;
/** Los once archivos de un traje, como los deja `prototypes/tools/trajes-recorte.py`. */
const montado = (traje: string): Record<PoseNoa, string> => ({
  hoja: `noa-${traje}-sheet-v1`,
  salto: `noa-${traje}-jump-v1`,
  gataQuieta: `noa-${traje}-cat-yarn-v1`,
  gataCorrer: `noa-${traje}-cat-run-v1`,
  gataSalto: `noa-${traje}-cat-jump-v1`,
  gataTirar: `noa-${traje}-cat-throw-v1`,
  nadar: `noa-${traje}-swim-v1`,
  piedra: `noa-${traje}-rps-0-v1`,
  papel: `noa-${traje}-rps-1-v1`,
  tijera: `noa-${traje}-rps-2-v1`,
  victoria: `noa-${traje}-rps-3-v1`,
});
export const ARTE_TRAJES: ArteTrajes = { caballera: montado("caballera") };

const ruta = (nombre: string) => `./assets/sprites/${nombre}.webp`;

export type DibujoNoa = {
  src: string;
  /** Protegida con un traje sin versión dorada: hay que ponerle el brillo dorado por encima. */
  brillo: boolean;
};

/** Qué dibujo toca para una pose con un traje, protegida o no por la manzana. */
export function dibujoDeNoa(traje: TrajeId, pose: PoseNoa, protegida = false, arte: ArteTrajes = ARTE_TRAJES): DibujoNoa {
  const propio = traje === TRAJE_DE_SIEMPRE ? undefined : arte[traje]?.[pose];
  if (propio) return { src: ruta(propio), brillo: protegida };
  return { src: ruta((protegida ? DORADAS[pose] : undefined) ?? DEL_PETO[pose]), brillo: false };
}
