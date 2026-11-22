/** Textos de `minijuegos.gatitos`. Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla). */
export const gatitos = {
  previa: {
    nombre: { rotulo: "{pictograma:fiesta} FIESTA" },
    regla: { juntos: "Bruma y sus amigos necesitan leña para la fiesta. Golpea los troncos cuando lleguen al tajo, al ritmo de la música. ¡El ovillo no se corta! Si golpeas sin tronco, se cae un leño del montón." },
  },
  /** La práctica se detiene en cada pieza nueva: su rótulo y la frase para leer juntos. */
  practica: {
    pequeno: { rotulo: "UN GOLPE", juntos: "Tronco pequeño: un golpe cuando llega al tajo." },
    mediano: { rotulo: "DOS GOLPES", juntos: "Tronco mediano: dos golpes seguidos." },
    ovillo: { rotulo: "{pictograma:lana} ¡NO!", juntos: "El ovillo no se corta: déjalo pasar." },
    vacia: { rotulo: "¡UY!", juntos: "Si golpeas sin leña, se cae un leño del montón. Espera a que llegue el tronco." },
    sigue: { rotulo: "{pictograma:jugar} SIGUE" },
    termina: { rotulo: "TERMINA" },
  },
  /** Rótulos al compás: una palabra que dura un pulso. */
  compas: {
    ahora: { rotulo: "¡AHORA!" },
    toc: { rotulo: "¡TOC!" },
    boing: { rotulo: "¡BOING!" },
    uy: { rotulo: "¡UY!" },
    plop: { rotulo: "¡PLOP!" },
    miau: { rotulo: "¡MIAU!" },
    mio: { rotulo: "¡MIO!" },
    rueda: { rotulo: "¡RUEDA!" },
  },
  /** Carteles de fase: solo cuando llega una pieza nueva; el dibujo es el sprite de la pieza. */
  fase: {
    troncos: { rotulo: "¡TRONCOS!" },
    dos: { rotulo: "¡DOS GOLPES!" },
    ovillo: { rotulo: "¡NO!" },
  },
  boton: {
    golpea: { rotulo: "¡GOLPEA!" },
  },
  resultado: {
    fiesta: { rotulo: "{pictograma:fiesta} ¡FIESTA!", juntos: "¡La hoguera ya brilla! Gracias por la leña." },
    perfecto: { rotulo: "{pictograma:estrella} ¡PERFECTO!", juntos: "¡Toda la leña, sin un solo golpe de más! La hoguera brilla muchísimo." },
    casi: { rotulo: "{pictograma:manzana} ¡CASI!", juntos: "El montón aún no llega a la raya dorada. Los gatitos quieren jugar otra vez." },
    otraVez: { rotulo: "{pictograma:otra-vez} OTRA VEZ" },
    mapa: { rotulo: "{pictograma:mapa} MAPA" },
    hoguera: { oculto: "Hoguera encendida con la leña" },
    apagada: { oculto: "Hoguera todavía apagada" },
  },
  sonido: { oculto: "Quitar el sonido de la fiesta" },
  avance: { oculto: "Avance de la canción" },
} as const;
