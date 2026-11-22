/** Textos de `minijuegos.abeja`. Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla). */
export const abeja = {
  previa: {
    nombre: { rotulo: "ABEJA NINJA" },
    regla: { juntos: "La Reina Melisa te lanza flores. ¡Córtalas con tu varita cuando lleguen a la punta, al ritmo de la música! A la mariquita no se la corta. Si cortas sin flor, se cae una gota de miel." },
  },
  /** La práctica se detiene en cada pieza nueva: su rótulo y la frase para leer juntos. */
  practica: {
    flor: { rotulo: "{pictograma:flor} CORTA", juntos: "Flor: un corte cuando llega a la punta de la varita." },
    duo: { rotulo: "{pictograma:flor}{pictograma:flor} DOS", juntos: "Dúo: dos flores, dos cortes seguidos." },
    mariquita: { rotulo: "¡NO!", juntos: "La mariquita no se corta: déjala pasar." },
    vacia: { rotulo: "¡UY!", juntos: "Si cortas sin flor, se cae una gota de miel. Espera a que llegue la flor." },
    sigue: { rotulo: "{pictograma:jugar} SIGUE" },
    termina: { rotulo: "TERMINA" },
  },
  /** Rótulos al compás: una palabra que dura un pulso. */
  compas: {
    ya: { rotulo: "¡YA!" },
    zas: { rotulo: "¡ZAS!" },
    uy: { rotulo: "¡UY!" },
    plof: { rotulo: "¡PLOF!" },
    zum: { rotulo: "¡ZUM!" },
    zumzum: { rotulo: "¡ZUM-ZUM!" },
    hola: { rotulo: "¡HOLA!" },
    bravo: { rotulo: "¡BRAVO!" },
  },
  /** Carteles de fase: solo cuando llega una pieza nueva; el dibujo es el sprite de la pieza. */
  fase: {
    flor: { rotulo: "¡FLORES!" },
    duo: { rotulo: "¡DOS!" },
    mariquita: { rotulo: "¡NO!" },
  },
  boton: {
    corta: { rotulo: "¡CORTA!" },
  },
  resultado: {
    perfecto: { rotulo: "{pictograma:estrella} ¡PERFECTO!", juntos: "¡No ha caído ni una flor! Melisa te regala su marco de flores." },
    bien: { rotulo: "{pictograma:estrella} ¡MUY BIEN!", juntos: "El tarro de miel ha pasado la raya dorada. ¡Melisa está muy contenta!" },
    casi: { rotulo: "{pictograma:manzana} ¡CASI!", juntos: "El tarro aún no llega a la raya dorada. Melisa quiere jugar otra vez." },
    sigue: { rotulo: "{pictograma:jugar} SIGUE" },
    amigos: { rotulo: "{pictograma:vuelve} VUELVE" },
    otraVez: { rotulo: "{pictograma:otra-vez} OTRA VEZ" },
    mapa: { rotulo: "{pictograma:mapa} MAPA" },
    tarro: { oculto: "Tarro de miel" },
  },
  salir: {
    titulo: { rotulo: "{pictograma:mapa} ¿AL MAPA?" },
    juntos: { juntos: "Podrás jugar con Melisa otra vez cuando quieras. Tus pegatinas guardadas seguirán contigo." },
    seguir: { rotulo: "{pictograma:jugar} SIGUE" },
    si: { rotulo: "{pictograma:mapa} SI, AL MAPA" },
  },
  avance: { oculto: "Avance de la canción" },
} as const;
