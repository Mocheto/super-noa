/** Textos de `minijuegos.merienda`. Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla). */
export const merienda = {
  previa: {
    nombre: { rotulo: "{pictograma:amigos} MERIENDA" },
    regla: { juntos: "Los jabatos tienen hambre. Cuando el Gran Jabalí gruña, un jabato asomará: ¡dale su bocado cuando abra la boca del todo, al compás! Si das sin boca abierta, se cae una bellota." },
  },
  /** La práctica se detiene en cada jabato nuevo: su rótulo y la frase para leer juntos. */
  practica: {
    pequeno: { rotulo: "¡GRU!", juntos: "¡Gru! El jabato abre la boca. Cuando esté abierta del todo, Noa le da su bellota." },
    grande: { rotulo: "¡GRUUUU!", juntos: "El grande tarda más: espera cuatro puntos y dale su castaña." },
    vacia: { rotulo: "¡FSSS!", juntos: "Si das de comer sin boca abierta, se cae una bellota de la rama. Espera a que abra la boca." },
    sigue: { rotulo: "{pictograma:jugar} SIGUE" },
    termina: { rotulo: "TERMINA" },
  },
  /** Rótulos al compás: una palabra que dura un pulso. */
  compas: {
    gru: { rotulo: "¡GRU!" },
    gruuuu: { rotulo: "¡GRUUUU!" },
    grugru: { rotulo: "¡GRU-GRU!" },
    nam: { rotulo: "¡ÑAM!" },
    ay: { rotulo: "¡AY!" },
    rico: { rotulo: "¡RICO!" },
  },
  /** Carteles de fase: solo cuando llega un jabato nuevo; el dibujo es el sprite del jabato. */
  fase: {
    grande: { rotulo: "¡EL GRANDE!" },
    gloton: { rotulo: "¡EL GLOTON!" },
  },
  boton: {
    dale: { rotulo: "¡DALE!" },
  },
  resultado: {
    perfecto: { rotulo: "{pictograma:estrella} ¡PERFECTO!", juntos: "¡Ningún jabato se ha quedado con hambre! El Gran Jabalí te regala su marco de bellotas." },
    bien: { rotulo: "{pictograma:estrella} ¡MUY BIEN!", juntos: "Las bellotas de la rama han pasado la raya dorada. ¡Los jabatos están contentos!" },
    casi: { rotulo: "{pictograma:manzana} ¡CASI!", juntos: "Las bellotas aún no llegan a la raya dorada. Los jabatos quieren merendar otra vez contigo." },
    sigue: { rotulo: "{pictograma:jugar} SIGUE" },
    amigos: { rotulo: "{pictograma:vuelve} VUELVE" },
    otraVez: { rotulo: "{pictograma:otra-vez} OTRA VEZ" },
    mapa: { rotulo: "{pictograma:mapa} MAPA" },
    rama: { oculto: "Rama con las bellotas conseguidas" },
  },
  salir: {
    titulo: { rotulo: "{pictograma:mapa} ¿AL MAPA?" },
    juntos: { juntos: "Podrás volver a dar de merendar a los jabatos cuando quieras. Tus pegatinas guardadas seguirán contigo." },
    seguir: { rotulo: "{pictograma:jugar} SIGUE" },
    si: { rotulo: "{pictograma:mapa} SI, AL MAPA" },
  },
  avance: { oculto: "Avance de la merienda" },
} as const;
