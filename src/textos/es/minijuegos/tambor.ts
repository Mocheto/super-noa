/** Textos de `minijuegos.tambor`. Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla). */
export const tambor = {
  previa: {
    nombre: { rotulo: "{pictograma:musica} TAMBOR" },
    regla: { juntos: "Escucha el tambor de la Maestra Armonía y repite sus golpes en las huellas doradas." },
  },
  /** La práctica se detiene en cada pieza nueva: su rótulo y la frase para leer juntos. */
  practica: {
    escucha: { rotulo: "¡ESCUCHA!", juntos: "Escucha a Armonía: el ¡tin! avisa de que acaba su turno." },
    turno: { rotulo: "¡AHORA TU!", juntos: "Noa repite los mismos golpes, en las huellas doradas." },
    seguidos: { rotulo: "{pictograma:musica} SEGUIDOS", juntos: "Ahora tres golpes seguidos." },
    vacia: { rotulo: "¡UY!", juntos: "Si golpeas donde no hay huella, se cae una nota del atril. Golpea solo en las huellas." },
    sigue: { rotulo: "{pictograma:jugar} SIGUE" },
    termina: { rotulo: "TERMINA" },
  },
  /** Rótulos al compás: una palabra que dura un pulso. */
  compas: {
    escucha: { rotulo: "¡ESCUCHA!" },
    tin: { rotulo: "¡TIN!" },
    ahora: { rotulo: "¡AHORA!" },
    bien: { rotulo: "¡BIEN!" },
    uy: { rotulo: "¡UY!" },
    bravo: { rotulo: "¡BRAVO!" },
  },
  /** Carteles de fase: solo cuando cambia la forma de los golpes. */
  fase: {
    seguidos: { rotulo: "{pictograma:musica} ¡SEGUIDOS!" },
    cuatro: { rotulo: "{pictograma:musica} ¡CUATRO!" },
  },
  boton: {
    golpea: { rotulo: "¡GOLPEA!" },
  },
  resultado: {
    perfecto: { rotulo: "{pictograma:estrella} ¡PERFECTO!", juntos: "¡No se ha escapado ni un golpe! Armonía te regala su marco de notas." },
    bien: { rotulo: "{pictograma:estrella} ¡MUY BIEN!", juntos: "Las notas del atril han pasado la raya dorada. ¡Armonía está muy contenta!" },
    casi: { rotulo: "{pictograma:manzana} ¡CASI!", juntos: "Las notas aún no llegan a la raya dorada. Armonía quiere tocar otra vez contigo." },
    sigue: { rotulo: "{pictograma:jugar} SIGUE" },
    amigos: { rotulo: "{pictograma:vuelve} VUELVE" },
    otraVez: { rotulo: "{pictograma:otra-vez} OTRA VEZ" },
    mapa: { rotulo: "{pictograma:mapa} MAPA" },
    atril: { oculto: "Atril con las notas conseguidas" },
  },
  salir: {
    titulo: { rotulo: "{pictograma:mapa} ¿AL MAPA?" },
    juntos: { juntos: "Podrás tocar con Armonía otra vez cuando quieras. Tus pegatinas guardadas seguirán contigo." },
    seguir: { rotulo: "{pictograma:jugar} SIGUE" },
    si: { rotulo: "{pictograma:mapa} SI, AL MAPA" },
  },
  avance: { oculto: "Avance de la canción" },
} as const;
