/** Nombres estables de los pictogramas (docs/interfaz/pictogramas.md) y su relleno provisional hasta que exista el atlas. */
export const pictogramas = {
  vidas: "❤", manzana: "🍎", pegatina: "✨", estrella: "⭐", gato: "🐱", lana: "🧶",
  caja: "📦", bandera: "🚩", meta: "🏁", sala: "🚪", reto: "👑", bravo: "🏆",
  marco: "🖼", noa: "👧", agua: "💧", lava: "🌋", hielo: "🧊", aire: "💨",
  flor: "🌸", nube: "☁", erizo: "🦔", perrito: "🐶", musica: "🎵", regalo: "🎁",
  enredadera: "🌿", tren: "🚃", mapa: "🗺", inicio: "🏠", album: "📒", amigos: "🐾",
  postal: "✉", fiesta: "🎉", secreto: "✦", "no-muerde": "😊", pista: "💡", cerrado: "🔒",
  jugar: "▶", pausa: "⏸", sonido: "🔊", "sin-sonido": "🔇", "otra-vez": "↺",
  vuelve: "↩", si: "✓", "por-descubrir": "❔", ayuda: "❓", espera: "⏳",
  "pantalla-grande": "⛶", cerrar: "✕", salta: "↑", camina: "◀▶", busca: "🔍",
} as const;

export type Pictograma = keyof typeof pictogramas;

export const esPictograma = (nombre: string): nombre is Pictograma => Object.hasOwn(pictogramas, nombre);

/** Celda de cada pictograma en su atlas (docs/interfaz/pictogramas.md). El orden es estable. */
const ORDEN_COLOR: readonly Pictograma[] = [
  "vidas", "manzana", "pegatina", "estrella", "gato", "lana",
  "caja", "bandera", "meta", "sala", "reto", "bravo",
  "marco", "noa", "agua", "lava", "hielo", "aire",
  "flor", "nube", "erizo", "perrito", "musica", "regalo",
  "enredadera", "tren", "mapa", "inicio", "album", "amigos",
  "postal", "fiesta", "secreto", "no-muerde", "pista", "cerrado",
];
const ORDEN_CONTROLES: readonly Pictograma[] = [
  "jugar", "pausa", "sonido", "sin-sonido", "otra-vez",
  "vuelve", "si", "por-descubrir", "ayuda", "espera",
  "pantalla-grande", "cerrar", "salta", "camina", "busca",
];
export type CeldaPictograma = { atlas: "color" | "controles"; columna: number; fila: number; columnas: number; filas: number };
export function celdaPictograma(nombre: Pictograma): CeldaPictograma {
  const color = ORDEN_COLOR.indexOf(nombre);
  if (color >= 0) return { atlas: "color", columna: color % 6, fila: Math.floor(color / 6), columnas: 6, filas: 6 };
  const control = ORDEN_CONTROLES.indexOf(nombre);
  return { atlas: "controles", columna: control % 5, fila: Math.floor(control / 5), columnas: 5, filas: 3 };
}
export const ATLAS_PICTOGRAMAS = { color: "./assets/sprites/pictogramas-v1.webp", controles: "./assets/sprites/pictogramas-controles-v1.webp" } as const;
