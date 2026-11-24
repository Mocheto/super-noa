/** Textos de `minijuegos.nido`: «El nido de la Reina»: duelo de memoria de la Reina Tricera (mapa «Mejorar los duelos de memoria»). Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla). */
export const nido = {
  previa: {
    nombre: { rotulo: "NIDO DE LA REINA" },
    regla: { juntos: "La Reina da un topetazo a los arbustos de flores. Mira bien y luego toca los arbustos en el mismo orden. ¡En cada ronda sale una cría del huevo!" },
  },
  /** La práctica se para en cada arbusto: su rótulo y la frase para leer juntos. */
  practica: {
    rojo: { rotulo: "{pictograma:flor} ROJO", juntos: "Este es el arbusto de flores rojas. Suena así." },
    amarillo: { rotulo: "{pictograma:flor} AMARILLO", juntos: "Este es el arbusto de flores amarillas. Suena así." },
    morado: { rotulo: "{pictograma:flor} MORADO", juntos: "Este es el arbusto de flores moradas. Suena así." },
    ahora: { juntos: "Ahora tú: toca los arbustos en el mismo orden. El que se mueve es el que toca." },
    sigue: { rotulo: "{pictograma:jugar} SIGUE" },
    termina: { rotulo: "TERMINA" },
  },
  /** Rótulos al compás: una palabra. */
  compas: {
    mira: { rotulo: "{pictograma:busca} MIRA" },
    tu: { rotulo: "¡TU!" },
    casi: { rotulo: "¡ACHIS!" },
    crac: { rotulo: "¡CRAC!" },
  },
  arbusto: {
    rojo: { oculto: "Arbusto de flores rojas" },
    amarillo: { oculto: "Arbusto de flores amarillas" },
    morado: { oculto: "Arbusto de flores moradas" },
  },
  mira: { oculto: "Mirar otra vez: la Reina enseña el camino de nuevo" },
  nido: { oculto: "Nido: {n} de {total} crías" },
  resultado: {
    bravo: { rotulo: "{pictograma:bravo} ¡BRAVO, NOA!", juntos: "Las cinco crías bailan con la Reina." },
    corona: { juntos: "¡Sin fallos! Has protegido los cinco huevos.", oculto: "Corona de la Reina" },
    sigue: { rotulo: "{pictograma:jugar} SIGUE" },
    otraVez: { rotulo: "{pictograma:otra-vez} OTRA VEZ" },
    mapa: { rotulo: "{pictograma:mapa} MAPA" },
    amigos: { rotulo: "{pictograma:amigos} AMIGOS" },
  },
  salir: {
    titulo: { rotulo: "{pictograma:mapa} ¿AL MAPA?" },
    juntos: { juntos: "Podrás volver al nido de la Reina cuando quieras." },
    seguir: { rotulo: "{pictograma:jugar} SIGUE" },
  },
};
