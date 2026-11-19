/**
 * Textos de la casa de los gatitos: el botón del mapa, la habitación y la llegada de cada gatito.
 * Los nombres de los gatitos salen de `mundos.<n>.gato.rotulo`.
 */
export const casa = {
  boton: { rotulo: "{pictograma:inicio} CASA" },
  titulo: { oculto: "La casa de los gatitos" },
  gatito: { oculto: "{nombre}, en la casa" },
  salir: { oculto: "Volver al mapa" },
  llegada: {
    titulo: { rotulo: "{pictograma:gato} ¡HOLA!" },
    uno: { juntos: "¡{nombre} ya tiene casa! Dale muchos mimos." },
    varios: { juntos: "¡{nombres} ya tienen casa! Dales muchos mimos." },
    union: { juntos: "{primeros} y {ultimo}" },
    sigue: { rotulo: "{pictograma:jugar} SIGUE" },
  },
} as const;
