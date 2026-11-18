/**
 * Textos de la pantalla de inicio y de la ventana de ayuda.
 * Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla).
 * Cualquier otra hoja es texto para adultos.
 */
export const inicio = {
  titulo: { super: { rotulo: "SUPER" }, noa: { rotulo: "NOA" } },
  corre: { rotulo: "¡CORRE Y SALTA!", juntos: "Explora castillos, volcanes, trenes y un cielo lleno de nubes. ¡Los gatitos te esperan!" },
  mundosNuevos: { rotulo: "{pictograma:pegatina} MUNDOS NUEVOS", juntos: "El Tren de las Estaciones, el Reino de la Música y el Reino Celeste." },
  jugar: { rotulo: "{pictograma:jugar} ¡A JUGAR!" },
  comoSeJuega: { rotulo: "{pictograma:ayuda} ¿COMO SE JUEGA?" },
  partidaGuardada: "Partida guardada · {hechas}/{total}",
  partidaGuardadaConSecreto: "Partida guardada · {hechas}/{total} + secreto",
  opciones: { oculto: "Opciones" },
  sonido: { rotulo: "{pictograma:sonido} SONIDO" },
  sinSonido: { rotulo: "{pictograma:sin-sonido} SIN SONIDO" },
  album: { rotulo: "{pictograma:album} ALBUM {n}/{total}" },
  jefes: { rotulo: "{pictograma:reto} JEFES {n}/{total}" },
  /** En la ayuda cada tarjeta lleva ya su icono grande, así que sus rótulos no repiten el pictograma. */
  ayuda: {
    titulo: { rotulo: "{pictograma:ayuda} ¿COMO SE JUEGA?" },
    camina: { rotulo: "CAMINA", juntos: "Mantén pulsada una flecha." },
    dobleSalto: { rotulo: "DOBLE SALTO", juntos: "Toca SALTA y, en el aire, otra vez." },
    caja: { rotulo: "ABRE LA CAJA", juntos: "Salta y golpéala desde abajo." },
    movil: { juntos: "En el móvil, mantén una flecha con un dedo y toca SALTA con otro." },
    lana: { rotulo: "LANZA LANA", juntos: "Cuando Noa tenga orejas de gato, toca LANA." },
    manzana: { rotulo: "MANZANA", juntos: "La manzana salva a Noa de un golpe." },
    reto: { rotulo: "RETO", juntos: "Cada guardián te propone un juego. Mira cómo se juega y juega tres veces." },
    arriba: { rotulo: "MIRA ARRIBA", juntos: "Las pegatinas se esconden en los caminos altos." },
    teclado: "Con teclado: A/D o flechas para caminar, espacio para saltar y X/K para lanzar lana. Con mando, usa la cruceta o palanca, A para saltar o elegir y B para volver. En el agua, SALTA da una brazada hacia arriba; al soltarlo, Noa baja despacito y puede caminar por la arena. ¡Los erizos pinchan!",
    lista: { rotulo: "{pictograma:jugar} ¡LISTA!" },
    cerrar: { oculto: "Cerrar" },
  },
} as const;
