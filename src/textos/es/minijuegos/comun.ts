/**
 * Piezas comunes a todos los minijuegos. Las claves nuevas siguen `minijuegos.<juego>.<momento>.<elemento>.<capa>`,
 * con el momento `previa`, `practica`, `compas` (una palabra, dura un pulso), `fase` (hasta dos palabras con dibujo,
 * dura un compás) o `resultado`.
 */
export const comun = {
  previa: {
    practica: { rotulo: "{pictograma:otra-vez} PRACTICA" },
    jugar: { rotulo: "{pictograma:jugar} ¡A JUGAR!" },
  },
  salir: {
    mapa: { oculto: "Volver al mapa" },
    amigos: { oculto: "Volver a mis amigos" },
  },
} as const;
