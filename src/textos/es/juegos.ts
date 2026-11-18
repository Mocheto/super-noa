/**
 * Juegos de memoria y de elegir de los guardianes (la Reina Tricera, el Capitán Celeste, Aurora Celeste y la Reina Arcoíris), por guardián.
 * Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla).
 */
export const juegos = {
  "triceratops-queen": {
    titulo: { rotulo: "SALVA EL HUEVO" },
    instruccion: { juntos: "Mira dónde cae el huevo y coloca allí la cesta." },
    pista: { rotulo: "¡AQUI!" },
    exito: { rotulo: "¡A SALVO!" },
    opciones: { left: { rotulo: "CESTA IZQUIERDA" }, center: { rotulo: "CESTA DEL CENTRO" }, right: { rotulo: "CESTA DERECHA" } },
  },
  "sky-captain": {
    titulo: { rotulo: "CAÑONES DE COLORES" },
    instruccion: { juntos: "Mira la bandera y dispara el cañón del mismo color." },
    pista: { rotulo: "¡ESTE COLOR!" },
    exito: { rotulo: "¡DESPEJADA!" },
    opciones: { red: { rotulo: "CAÑON ROJO" }, yellow: { rotulo: "CAÑON AMARILLO" }, blue: { rotulo: "CAÑON AZUL" } },
  },
  "aurora-celeste": {
    titulo: { rotulo: "UNE LAS ESTRELLAS" },
    instruccion: { juntos: "Mira el camino del cielo y toca los dibujos en el mismo orden." },
    pista: { rotulo: "{pictograma:estrella} ¡MIRA!" },
    exito: { rotulo: "¡ENCENDIDA!" },
    opciones: { moon: { rotulo: "LUNA" }, star: { rotulo: "ESTRELLA" }, cloud: { rotulo: "NUBE" } },
  },
  "rainbow-queen": {
    titulo: { rotulo: "PINTA EL ARCOIRIS" },
    instruccion: { juntos: "Mira los colores y repítelos en el mismo orden." },
    pista: { rotulo: "¡MIRA!" },
    exito: { rotulo: "¡BRILLA!" },
    opciones: { red: { rotulo: "ROJO" }, yellow: { rotulo: "AMARILLO" }, blue: { rotulo: "AZUL" } },
  },
} as const;
