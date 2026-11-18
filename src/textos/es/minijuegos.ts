/**
 * Textos de los cuatro minijuegos rítmicos (la abeja ninja, el tambor de Armonía, la merienda de los jabatos y la fiesta de los gatitos),
 * de la avioneta de las nubes y de la tienda secreta.
 * Las claves salen del propio texto (`minijuegos.abeja.practica.rotulo`). Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla).
 */
export const minijuegos = {
  /**
   * Piezas comunes a todos los minijuegos. Las claves nuevas siguen `minijuegos.<juego>.<momento>.<elemento>.<capa>`,
   * con el momento `previa`, `practica`, `compas` (una palabra, dura un pulso), `fase` (hasta dos palabras con dibujo,
   * dura un compás) o `resultado`.
   */
  comun: {
    previa: {
      practica: { rotulo: "{pictograma:otra-vez} PRACTICA" },
      jugar: { rotulo: "{pictograma:jugar} ¡A JUGAR!" },
    },
    salir: {
      mapa: { oculto: "Volver al mapa" },
      amigos: { oculto: "Volver a mis amigos" },
    },
  },
  abeja: {
    previa: {
      nombre: { rotulo: "ABEJA NINJA" },
      regla: { juntos: "La Reina Melisa te lanza flores. ¡Córtalas con tu varita cuando lleguen a la punta, al ritmo de la música! A la mariquita no se la corta." },
    },
    /** La práctica se detiene en cada pieza nueva: su rótulo y la frase para leer juntos. */
    practica: {
      flor: { rotulo: "{pictograma:flor} CORTA", juntos: "Flor: un corte cuando llega a la punta de la varita." },
      duo: { rotulo: "{pictograma:flor}{pictograma:flor} DOS", juntos: "Dúo: dos flores, dos cortes seguidos." },
      mariquita: { rotulo: "¡NO!", juntos: "La mariquita no se corta: déjala pasar." },
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
  },
  tambor: {
    previa: {
      nombre: { rotulo: "{pictograma:musica} TAMBOR" },
      regla: { juntos: "La Maestra Armonía toca su tambor y Noa repite sus golpes. Escucha, espera tu turno y golpea en las huellas doradas." },
    },
    /** La práctica se detiene en cada pieza nueva: su rótulo y la frase para leer juntos. */
    practica: {
      escucha: { rotulo: "¡ESCUCHA!", juntos: "Escucha a Armonía: el ¡tin! avisa de que acaba su turno." },
      turno: { rotulo: "¡AHORA TU!", juntos: "Noa repite los mismos golpes, en las huellas doradas." },
      seguidos: { rotulo: "{pictograma:musica} SEGUIDOS", juntos: "Ahora tres golpes seguidos." },
      sigue: { rotulo: "{pictograma:jugar} SIGUE" },
      termina: { rotulo: "TERMINA" },
    },
    /** Rótulos al compás: una palabra que dura un pulso. */
    compas: {
      escucha: { rotulo: "¡ESCUCHA!" },
      tin: { rotulo: "¡TIN!" },
      ahora: { rotulo: "¡AHORA!" },
      bien: { rotulo: "¡BIEN!" },
      uy: { rotulo: "¡UY!" },
      bravo: { rotulo: "¡BRAVO!" },
    },
    /** Carteles de fase: solo cuando cambia la forma de los golpes. */
    fase: {
      seguidos: { rotulo: "{pictograma:musica} ¡SEGUIDOS!" },
      cuatro: { rotulo: "{pictograma:musica} ¡CUATRO!" },
    },
    boton: {
      golpea: { rotulo: "¡GOLPEA!" },
    },
    resultado: {
      perfecto: { rotulo: "{pictograma:estrella} ¡PERFECTO!", juntos: "¡No se ha escapado ni un golpe! Armonía te regala su marco de notas." },
      bien: { rotulo: "{pictograma:estrella} ¡MUY BIEN!", juntos: "Las notas del atril han pasado la raya dorada. ¡Armonía está muy contenta!" },
      casi: { rotulo: "{pictograma:manzana} ¡CASI!", juntos: "Las notas aún no llegan a la raya dorada. Armonía quiere tocar otra vez contigo." },
      sigue: { rotulo: "{pictograma:jugar} SIGUE" },
      amigos: { rotulo: "{pictograma:vuelve} VUELVE" },
      otraVez: { rotulo: "{pictograma:otra-vez} OTRA VEZ" },
      mapa: { rotulo: "{pictograma:mapa} MAPA" },
      atril: { oculto: "Atril con las notas conseguidas" },
    },
    salir: {
      titulo: { rotulo: "{pictograma:mapa} ¿AL MAPA?" },
      juntos: { juntos: "Podrás tocar con Armonía otra vez cuando quieras. Tus pegatinas guardadas seguirán contigo." },
      seguir: { rotulo: "{pictograma:jugar} SIGUE" },
      si: { rotulo: "{pictograma:mapa} SI, AL MAPA" },
    },
    avance: { oculto: "Avance de la canción" },
  },
  merienda: {
    previa: {
      nombre: { rotulo: "{pictograma:amigos} MERIENDA" },
      regla: { juntos: "Los jabatos tienen hambre. Cuando el Gran Jabalí gruña, un jabato asomará: ¡dale su bocado cuando abra la boca del todo, al compás!" },
    },
    /** La práctica se detiene en cada jabato nuevo: su rótulo y la frase para leer juntos. */
    practica: {
      pequeno: { rotulo: "¡GRU!", juntos: "¡Gru! El jabato abre la boca. Cuando esté abierta del todo, Noa le da su bellota." },
      grande: { rotulo: "¡GRUUUU!", juntos: "El grande tarda más: espera cuatro puntos y dale su castaña." },
      sigue: { rotulo: "{pictograma:jugar} SIGUE" },
      termina: { rotulo: "TERMINA" },
    },
    /** Rótulos al compás: una palabra que dura un pulso. */
    compas: {
      gru: { rotulo: "¡GRU!" },
      gruuuu: { rotulo: "¡GRUUUU!" },
      grugru: { rotulo: "¡GRU-GRU!" },
      nam: { rotulo: "¡ÑAM!" },
      ay: { rotulo: "¡AY!" },
      rico: { rotulo: "¡RICO!" },
    },
    /** Carteles de fase: solo cuando llega un jabato nuevo; el dibujo es el sprite del jabato. */
    fase: {
      grande: { rotulo: "¡EL GRANDE!" },
      gloton: { rotulo: "¡EL GLOTON!" },
    },
    boton: {
      dale: { rotulo: "¡DALE!" },
    },
    resultado: {
      perfecto: { rotulo: "{pictograma:estrella} ¡PERFECTO!", juntos: "¡Ningún jabato se ha quedado con hambre! El Gran Jabalí te regala su marco de bellotas." },
      bien: { rotulo: "{pictograma:estrella} ¡MUY BIEN!", juntos: "Las bellotas de la rama han pasado la raya dorada. ¡Los jabatos están contentos!" },
      casi: { rotulo: "{pictograma:manzana} ¡CASI!", juntos: "Las bellotas aún no llegan a la raya dorada. Los jabatos quieren merendar otra vez contigo." },
      sigue: { rotulo: "{pictograma:jugar} SIGUE" },
      amigos: { rotulo: "{pictograma:vuelve} VUELVE" },
      otraVez: { rotulo: "{pictograma:otra-vez} OTRA VEZ" },
      mapa: { rotulo: "{pictograma:mapa} MAPA" },
      rama: { oculto: "Rama con las bellotas conseguidas" },
    },
    salir: {
      titulo: { rotulo: "{pictograma:mapa} ¿AL MAPA?" },
      juntos: { juntos: "Podrás volver a dar de merendar a los jabatos cuando quieras. Tus pegatinas guardadas seguirán contigo." },
      seguir: { rotulo: "{pictograma:jugar} SIGUE" },
      si: { rotulo: "{pictograma:mapa} SI, AL MAPA" },
    },
    avance: { oculto: "Avance de la merienda" },
  },
  gatitos: {
    previa: {
      nombre: { rotulo: "{pictograma:fiesta} FIESTA" },
      regla: { juntos: "Bruma y sus amigos necesitan leña para la fiesta. Golpea los troncos cuando lleguen al tajo, al ritmo de la música. ¡El ovillo no se corta!" },
    },
    /** La práctica se detiene en cada pieza nueva: su rótulo y la frase para leer juntos. */
    practica: {
      pequeno: { rotulo: "UN GOLPE", juntos: "Tronco pequeño: un golpe cuando llega al tajo." },
      mediano: { rotulo: "DOS GOLPES", juntos: "Tronco mediano: dos golpes seguidos." },
      ovillo: { rotulo: "{pictograma:lana} ¡NO!", juntos: "El ovillo no se corta: déjalo pasar." },
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
      otraVez: { rotulo: "{pictograma:otra-vez} OTRA VEZ" },
      mapa: { rotulo: "{pictograma:mapa} MAPA" },
      hoguera: { oculto: "Hoguera encendida con la leña" },
    },
    sonido: { oculto: "Quitar el sonido de la fiesta" },
    avance: { oculto: "Avance de la canción" },
  },
  avioneta: {
    "la-reina-arcoiris-te": { juntos: "¡La Reina Arcoíris te regala su avioneta!" },
    "lanza-pompas-a-los": { juntos: "¡Lanza pompas a los nubarrones!" },
    "la-avioneta-de-las": { oculto: "La avioneta de las nubes" },
    "cielo-de-la-avioneta": { oculto: "Cielo de la avioneta: mueve la avioneta y lanza pompas a los nubarrones" },
    "volver-al-mapa": { rotulo: "VUELVE AL MAPA" },
    "mover-a-la-izquierda": { rotulo: "MOVER A LA IZQUIERDA" },
    "lanzar-pompa": { rotulo: "LANZAR POMPA" },
    "mover-a-la-derecha": { rotulo: "MOVER A LA DERECHA" },
    "todas-las-estrellas": { rotulo: "¡TODAS LAS ESTRELLAS!" },
    "has-cruzado-el-arcoiris": { rotulo: "¡HAS CRUZADO EL ARCOIRIS!" },
    "recogidas": { juntos: "Has recogido {n} de {total} estrellas." },
    "nueva-marca": { rotulo: "¡NUEVA MARCA!" },
  },
  tienda: {
    "para-las-orejas": { rotulo: "¡PARA LAS OREJAS!" },
    "para-la-carita": { rotulo: "¡PARA LA CARITA!" },
    "para-las-patitas": { rotulo: "¡PARA LAS PATITAS!" },
    "el-rincon-de-los": { juntos: "El rincón de los gatitos" },
    "junta-las-tres-partes": { juntos: "¡Junta las tres partes del mismo gatito!" },
    "retrato-del-gatito": { oculto: "Retrato del gatito" },
    "seconds-segundos-de-estrellas": { juntos: "¡{seconds} segundos de estrellas al salir!" },
    "que-gatito-tan-divertido": { rotulo: "¡QUE GATITO TAN DIVERTIDO!" },
    "descansamos-un-poquito": { juntos: "Descansamos un poquito." },
    "parar": { rotulo: "¡PARAR!" },
    "volver-a-jugar-fuera": { rotulo: "VOLVER A JUGAR FUERA" },
    "seguir": { rotulo: "SEGUIR" },
    "pausa": { rotulo: "PAUSA" },
    "3-iguales-12-s": { juntos: "3 iguales: ★ 12 s · 2 iguales: ★ 5 s" },
    "el-dibujo-no-ha": { juntos: "El dibujo no ha llegado. ¡Jugamos con gatitos de colores!" },
    "tienda-secreta-reto-conseguido": { juntos: "Tienda secreta: reto conseguido" },
    "tienda-secreta-visitada": { juntos: "Tienda secreta: visitada" },
    "tienda-secreta-por-descubrir": { juntos: "Tienda secreta: por descubrir" },
  },
} as const;
