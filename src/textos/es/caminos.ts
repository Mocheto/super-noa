/**
 * Título corto, título largo y pista de cada camino secreto, por identificador.
 * Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla).
 */

export const caminos = {
  "fireflies": {
    titulo: { rotulo: "LUCIERNAGAS", juntos: "El sendero de las luciérnagas" },
    pista: { juntos: "Sigue las luces. Siempre puedes volver por donde has venido." },
  },
  "mine": {
    titulo: { rotulo: "TUNEL MINERO", juntos: "El túnel del gatito minero" },
    pista: { juntos: "Sube a la vagoneta y salta entre los cristales." },
  },
  "mill": {
    titulo: { rotulo: "MOLINO", juntos: "El molino de las manzanas" },
    pista: { juntos: "La campana cambia el giro de las ruedas." },
  },
  "library": {
    titulo: { rotulo: "BIBLIOTECA", juntos: "La biblioteca de las patitas" },
    pista: { juntos: "Las patitas abren los libros y dibujan un puente." },
  },
  "garden": {
    titulo: { rotulo: "JARDIN", juntos: "El jardín de los gigantes" },
    pista: { juntos: "Las hojas bajan con tu peso. El agua despierta la planta." },
  },
} as const;
