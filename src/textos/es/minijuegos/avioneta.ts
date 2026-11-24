/** Textos de `minijuegos.avioneta`. Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla). */
export const avioneta = {
  previa: {
    nombre: { rotulo: "{pictograma:nube} AVIONETA" },
    regalo: { juntos: "¡La Reina Arcoíris te regala su avioneta!" },
    regla: { juntos: "Lanza pompas a los nubarrones para convertirlos en nubecitas con estrella, y recoge todas las estrellas hasta el arcoíris." },
  },
  /** Cartel de los primeros segundos: hasta dos palabras con dibujo. */
  cartel: { rotulo: "{pictograma:aire} ¡POMPAS!" },
  resultado: {
    todas: { rotulo: "{pictograma:estrella} ¡TODAS!", juntos: "¡Has recogido todas las estrellas!" },
    arcoiris: { rotulo: "{pictograma:bravo} ¡ARCOIRIS!", juntos: "Has recogido {n} de {total} estrellas." },
    marca: { juntos: "¡Nueva marca!" },
    mapa: { rotulo: "{pictograma:mapa} MAPA" },
    avioneta: { oculto: "La avioneta de la Reina Arcoíris" },
  },
  mapa: { rotulo: "{pictograma:mapa} MAPA" },
  pompa: { oculto: "Lanzar pompa" },
  escena: { oculto: "La avioneta de las nubes" },
  cielo: { oculto: "Cielo de la avioneta: mueve la avioneta y lanza pompas a los nubarrones" },
} as const;
