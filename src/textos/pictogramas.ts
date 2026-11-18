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
