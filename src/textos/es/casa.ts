/**
 * Textos de la casa de los gatitos: el botón del mapa, la habitación y la llegada de cada gatito.
 * Los nombres de los gatitos salen de `mundos.<n>.gato.rotulo`.
 */
export const casa = {
  boton: { rotulo: "{pictograma:inicio} CASA" },
  titulo: { oculto: "La casa de los gatitos" },
  gatito: { oculto: "{nombre}, en la casa" },
  salir: { oculto: "Volver al mapa" },
  bandeja: { oculto: "Cosas para cuidar a los gatitos" },
  bano: {
    titulo: { oculto: "Baño de {nombre}" },
    salir: { oculto: "Volver a la habitación" },
    bandeja: { oculto: "Cosas para bañar al gatito" },
    utensilio: {
      alcachofa: { oculto: "Alcachofa de la ducha: moja y aclara al gatito" },
      jabon: { oculto: "Jabón: frota para hacer espuma" },
      secador: { oculto: "Secador: seca al gatito" },
      peine: { oculto: "Peine: péinalo de arriba abajo" },
    },
    fin: {
      titulo: { rotulo: "{pictograma:estrella} ¡LIMPIO!" },
      frase: { juntos: "¡{nombre} está limpio y brillante!" },
      sigue: { rotulo: "{pictograma:jugar} SIGUE" },
    },
  },
  objeto: {
    cuenco: { oculto: "Cuenco de comida: arrástralo hasta un gatito" },
    pelota: { oculto: "Pelota: suéltala en la habitación para que un gatito la atrape" },
    escoba: { oculto: "Escoba: pásala por las huellas de barro" },
  },
  decorar: {
    boton: { oculto: "Decorar la casa" },
    cuidar: { oculto: "Volver a cuidar a los gatitos" },
    bandeja: { oculto: "Versiones del mueble que has tocado" },
    version: { oculto: "{mueble}: opción {numero}" },
    mueble: {
      cama: { oculto: "La cama" },
      alfombra: { oculto: "La alfombra" },
      cuadro: { oculto: "El cuadro" },
      planta: { oculto: "La planta" },
      pared: { oculto: "La pared" },
    },
  },
  llegada: {
    titulo: { rotulo: "{pictograma:gato} ¡HOLA!" },
    uno: { juntos: "¡{nombre} ya tiene casa! Dale muchos mimos." },
    varios: { juntos: "¡{nombres} ya tienen casa! Dales muchos mimos." },
    union: { juntos: "{primeros} y {ultimo}" },
    sigue: { rotulo: "{pictograma:jugar} SIGUE" },
  },
} as const;
