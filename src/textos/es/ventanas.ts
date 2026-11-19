/**
 * Textos de las ventanas de la partida: pantalla completada, otra oportunidad, final y subida al reino secreto.
 * Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla).
 */
export const ventanas = {
  completada: {
    titulo: { rotulo: "{pictograma:estrella} ¡MUY BIEN!" },
    manzanas: { juntos: { one: "Noa ha recogido {n} manzana.", other: "Noa ha recogido {n} manzanas." } },
    reina: { juntos: "La Reina Arcoíris guarda para siempre las insignias encontradas." },
    guardian: { juntos: "El guardián deja libre el camino." },
    siguienteAventura: { juntos: "¡La siguiente aventura ya está abierta!" },
    medallas: { oculto: "Medallas de esta pantalla" },
    casa: { rotulo: "{pictograma:inicio} A CASA" },
    meta: { rotulo: "{pictograma:estrella} META" },
    pegatina: { rotulo: "{pictograma:pegatina} PEGATINA" },
    sinCaer: { rotulo: "{pictograma:vidas} SIN CAER" },
    insignia: {
      rotulo: "{pictograma:album} ¡AL ALBUM!",
      juntos: { one: "Insignia guardada en el álbum.", other: "{n} insignias guardadas en el álbum." },
    },
    fiesta: { rotulo: "{pictograma:fiesta} FIESTA", juntos: "Bruma te invita a preparar la leña para la fiesta." },
    siguiente: { rotulo: "{pictograma:jugar} SIGUE" },
    paseo: { rotulo: "{pictograma:amigos} PASEO" },
    mapa: { rotulo: "{pictograma:mapa} MAPA" },
    trofeo: { oculto: "Trofeo dorado con una huella de gato" },
    gatito: { oculto: "Gatito feliz rescatado" },
  },
  otraOportunidad: {
    titulo: { rotulo: "{pictograma:manzana} ¡CASI!" },
    vidas: { juntos: "Las tres vidas vuelven a estar listas." },
    otraVez: { rotulo: "{pictograma:otra-vez} OTRA VEZ" },
    mapa: { rotulo: "{pictograma:mapa} MAPA" },
  },
  final: {
    titulo: { rotulo: "{pictograma:bravo} ¡BRAVO, NOA!" },
    amigos: { juntos: "Los guardianes ya son amigos de Noa. Los gatitos celebran una fiesta en el castillo." },
    mapa: { rotulo: "{pictograma:mapa} MAPA" },
    inicio: { rotulo: "{pictograma:inicio} INICIO" },
  },
  subidaSecreta: {
    secreto: { rotulo: "{pictograma:secreto} ¡SECRETO!" },
    arriba: { rotulo: "{pictograma:nube} ¡ARRIBA!", juntos: "La enredadera mágica lleva a Noa al Reino de las Nubes." },
  },
} as const;
