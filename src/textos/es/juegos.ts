/**
 * Juegos de memoria y de elegir de los guardianes (el Capitán Celeste y la Reina Arcoíris), por guardián. Aurora Celeste y
 * la Reina Tricera tienen sus duelos de memoria propios (`minijuegos.vuelo` y `minijuegos.nido`).
 * Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla).
 */
export const juegos = {
  "sky-captain": {
    titulo: { rotulo: "CAÑONES DE COLORES" },
    instruccion: { juntos: "Mira la bandera y dispara el cañón del mismo color." },
    pista: { rotulo: "¡ESTE COLOR!" },
    exito: { rotulo: "¡DESPEJADA!" },
    opciones: { red: { rotulo: "CAÑON ROJO" }, yellow: { rotulo: "CAÑON AMARILLO" }, blue: { rotulo: "CAÑON AZUL" } },
  },
  "rainbow-queen": {
    titulo: { rotulo: "PINTA EL ARCOIRIS" },
    instruccion: { juntos: "Mira los colores y repítelos en el mismo orden." },
    pista: { rotulo: "¡MIRA!" },
    exito: { rotulo: "¡BRILLA!" },
    opciones: { red: { rotulo: "ROJO" }, yellow: { rotulo: "AMARILLO" }, blue: { rotulo: "AZUL" } },
  },
} as const;
