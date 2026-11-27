/**
 * Textos del elegidor de trajes del mapa. El nombre de cada traje sale de su identificador (`trajes.<id>`).
 * Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla).
 */
export const trajes = {
  titulo: { rotulo: "TRAJES", juntos: "Elige la ropa de Noa para sus viajes." },
  elegir: { oculto: "Trajes de Noa" },
  puesto: { rotulo: "{pictograma:si} PUESTO" },
  listo: { rotulo: "{pictograma:jugar} ¡LISTO!" },
  peto: { rotulo: "PETO" },
  exploradora: { rotulo: "EXPLORADORA" },
  pirata: { rotulo: "PIRATA" },
  caballera: { rotulo: "CABALLERA" },
} as const;
