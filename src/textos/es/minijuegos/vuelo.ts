/** Textos de `minijuegos.vuelo`: «El vuelo de Aurora»: duelo de memoria de Aurora Celeste (mapa «Mejorar los duelos de memoria»). Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla). */
export const vuelo = {
  previa: {
    nombre: { rotulo: "EL VUELO DE AURORA" },
    regla: { juntos: "Aurora vuela de nube en nube y despierta a las nubecitas. Mira bien y luego toca las nubes en el mismo orden." },
  },
  /** La práctica se para en cada nubecita: su rótulo y la frase para leer juntos. */
  practica: {
    rosa: { rotulo: "{pictograma:nube} ROSA", juntos: "Esta es la nubecita rosa. Canta así." },
    amarilla: { rotulo: "{pictograma:nube} AMARILLA", juntos: "Esta es la nubecita amarilla. Canta así." },
    azul: { rotulo: "{pictograma:nube} AZUL", juntos: "Esta es la nubecita azul. Canta así." },
    ahora: { juntos: "Ahora tú: toca las nubes en el mismo orden. La que brilla es la que toca." },
    sigue: { rotulo: "{pictograma:jugar} SIGUE" },
    termina: { rotulo: "TERMINA" },
  },
  /** Rótulos al compás: una palabra. */
  compas: {
    mira: { rotulo: "{pictograma:busca} MIRA" },
    tu: { rotulo: "¡TU!" },
    casi: { rotulo: "¡CASI!" },
    bien: { rotulo: "¡BIEN!" },
  },
  nube: {
    rosa: { oculto: "Nube de la nubecita rosa" },
    amarilla: { oculto: "Nube de la nubecita amarilla" },
    azul: { oculto: "Nube de la nubecita azul" },
  },
  mira: { oculto: "Mirar otra vez: Aurora enseña el camino de nuevo" },
  constelacion: { oculto: "Constelación del gatito: {n} de {total} estrellas" },
  resultado: {
    bravo: { rotulo: "{pictograma:bravo} ¡BRAVO, NOA!", juntos: "Las cinco estrellas forman el gatito del cielo." },
    corona: { juntos: "¡Sin fallos! Aurora te da su corona de estrellas.", oculto: "Corona de Aurora" },
    sigue: { rotulo: "{pictograma:jugar} SIGUE" },
    otraVez: { rotulo: "{pictograma:otra-vez} OTRA VEZ" },
    mapa: { rotulo: "{pictograma:mapa} MAPA" },
    amigos: { rotulo: "{pictograma:amigos} AMIGOS" },
  },
  salir: {
    titulo: { rotulo: "{pictograma:mapa} ¿AL MAPA?" },
    juntos: { juntos: "Podrás volver a volar con Aurora cuando quieras." },
    seguir: { rotulo: "{pictograma:jugar} SIGUE" },
  },
};
