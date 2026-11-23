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
      regla: { juntos: "Corta las flores de la Reina Melisa cuando lleguen a la punta, al ritmo de la música. ¡La mariquita no se corta!" },
    },
    /** La práctica se detiene en cada pieza nueva: su rótulo y la frase para leer juntos. */
    practica: {
      flor: { rotulo: "{pictograma:flor} CORTA", juntos: "Flor: un corte cuando llega a la punta de la varita." },
      duo: { rotulo: "{pictograma:flor}{pictograma:flor} DOS", juntos: "Dúo: dos flores, dos cortes seguidos." },
      mariquita: { rotulo: "¡NO!", juntos: "La mariquita no se corta: déjala pasar." },
      vacia: { rotulo: "¡UY!", juntos: "Si cortas sin flor, se cae una gota de miel. Espera a que llegue la flor." },
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
      regla: { juntos: "Escucha el tambor de la Maestra Armonía y repite sus golpes en las huellas doradas." },
    },
    /** La práctica se detiene en cada pieza nueva: su rótulo y la frase para leer juntos. */
    practica: {
      escucha: { rotulo: "¡ESCUCHA!", juntos: "Escucha a Armonía: el ¡tin! avisa de que acaba su turno." },
      turno: { rotulo: "¡AHORA TU!", juntos: "Noa repite los mismos golpes, en las huellas doradas." },
      seguidos: { rotulo: "{pictograma:musica} SEGUIDOS", juntos: "Ahora tres golpes seguidos." },
      vacia: { rotulo: "¡UY!", juntos: "Si golpeas donde no hay huella, se cae una nota del atril. Golpea solo en las huellas." },
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
      regla: { juntos: "Cuando un jabato abra la boca del todo, ¡dale su bocado al compás!" },
    },
    /** La práctica se detiene en cada jabato nuevo: su rótulo y la frase para leer juntos. */
    practica: {
      pequeno: { rotulo: "¡GRU!", juntos: "¡Gru! El jabato abre la boca. Cuando esté abierta del todo, Noa le da su bellota." },
      grande: { rotulo: "¡GRUUUU!", juntos: "El grande tarda más: espera cuatro puntos y dale su castaña." },
      vacia: { rotulo: "¡FSSS!", juntos: "Si das de comer sin boca abierta, se cae una bellota de la rama. Espera a que abra la boca." },
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
      regla: { juntos: "Golpea los troncos cuando lleguen al tajo, al ritmo de la música. ¡El ovillo no se corta!" },
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
  },
  avioneta: {
    previa: {
      nombre: { rotulo: "{pictograma:nube} AVIONETA" },
      regalo: { juntos: "¡La Reina Arcoíris te regala su avioneta!" },
      regla: { juntos: "Lanza pompas a los nubarrones para convertirlos en nubecitas con estrella, y recoge todas las estrellas hasta el arcoíris." },
    },
    /** Cartel de los primeros segundos: hasta dos palabras con dibujo. */
    cartel: { rotulo: "{pictograma:aire} ¡POMPAS!" },
    resultado: {
      todas: { rotulo: "{pictograma:estrella} ¡TODAS!", juntos: "¡Has recogido todas las estrellas!" },
      arcoiris: { rotulo: "{pictograma:bravo} ¡ARCOIRIS!", juntos: "Has recogido {n} de {total} estrellas." },
      marca: { juntos: "¡Nueva marca!" },
      mapa: { rotulo: "{pictograma:mapa} MAPA" },
      avioneta: { oculto: "La avioneta de la Reina Arcoíris" },
    },
    mapa: { rotulo: "{pictograma:mapa} MAPA" },
    pompa: { oculto: "Lanzar pompa" },
    escena: { oculto: "La avioneta de las nubes" },
    cielo: { oculto: "Cielo de la avioneta: mueve la avioneta y lanza pompas a los nubarrones" },
  },
  tienda: {
    previa: {
      nombre: { rotulo: "{pictograma:gato} TIENDA" },
      regla: { juntos: "El rincón de los gatitos. ¡Para las tiras y junta las tres partes del mismo gatito! Tres iguales dan 12 segundos de estrellas y dos iguales, 5." },
    },
    /** Carteles mientras se juega: qué parte toca parar, una palabra con su cuenta. */
    parte: {
      orejas: { rotulo: "¡OREJAS!" },
      carita: { rotulo: "¡CARITA!" },
      patitas: { rotulo: "¡PATITAS!" },
    },
    pausa: { rotulo: "{pictograma:pausa} PAUSA" },
    boton: { para: { rotulo: "¡PARA!" } },
    resultado: {
      tres: { rotulo: "{pictograma:estrella} ¡IGUALES!" },
      dos: { rotulo: "{pictograma:estrella} ¡CASI IGUALES!" },
      ninguno: { rotulo: "{pictograma:gato} ¡QUE GRACIOSO!", juntos: "¡Qué gatito tan divertido!" },
      estrellas: { juntos: "¡{seconds} segundos de estrellas al salir!" },
      sigue: { rotulo: "{pictograma:jugar} SIGUE" },
    },
    retrato: { oculto: "Retrato del gatito" },
    sinDibujo: { juntos: "El dibujo no ha llegado. ¡Jugamos con gatitos de colores!" },
    estado: {
      conseguido: { juntos: "Tienda secreta: reto conseguido" },
      visitada: { juntos: "Tienda secreta: visitada" },
      porDescubrir: { juntos: "Tienda secreta: por descubrir" },
    },
  },
} as const;
