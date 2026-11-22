/** Textos de `minijuegos.tienda`. Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla). */
export const tienda = {
  previa: {
    nombre: { rotulo: "{pictograma:gato} TIENDA" },
    regla: { juntos: "El rincón de los gatitos. ¡Para las tiras y junta las tres partes del mismo gatito! Tres iguales dan 12 segundos de estrellas y dos iguales, 5." },
  },
  /** Carteles mientras se juega: qué parte toca parar, una palabra con su cuenta. */
  parte: {
    orejas: { rotulo: "¡OREJAS!" },
    carita: { rotulo: "¡CARITA!" },
    patitas: { rotulo: "¡PATITAS!" },
  },
  pausa: { rotulo: "{pictograma:pausa} PAUSA" },
  boton: { para: { rotulo: "¡PARA!" } },
  resultado: {
    tres: { rotulo: "{pictograma:estrella} ¡IGUALES!" },
    dos: { rotulo: "{pictograma:estrella} ¡CASI IGUALES!" },
    ninguno: { rotulo: "{pictograma:gato} ¡QUE GRACIOSO!", juntos: "¡Qué gatito tan divertido!" },
    estrellas: { juntos: "¡{seconds} segundos de estrellas al salir!" },
    sigue: { rotulo: "{pictograma:jugar} SIGUE" },
  },
  retrato: { oculto: "Retrato del gatito" },
  sinDibujo: { juntos: "El dibujo no ha llegado. ¡Jugamos con gatitos de colores!" },
  estado: {
    conseguido: { juntos: "Tienda secreta: reto conseguido" },
    visitada: { juntos: "Tienda secreta: visitada" },
    porDescubrir: { juntos: "Tienda secreta: por descubrir" },
  },
} as const;
