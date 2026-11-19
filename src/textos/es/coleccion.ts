/**
 * Textos de la colección: álbum de pegatinas, jefes amigos, pestaña Amigos y postales (la interfaz, no los datos de cada pieza).
 * Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla).
 * Cualquier otra hoja es texto para adultos.
 */
export const coleccion = {
  cerrar: { oculto: "Cerrar" },
  grupo: { oculto: "Ver colección" },
  titulo: {
    pegatinas: { rotulo: "{pictograma:album} ALBUM" },
    jefes: { rotulo: "{pictograma:reto} JEFES" },
    amigos: { rotulo: "{pictograma:amigos} AMIGOS" },
    postales: { rotulo: "{pictograma:postal} POSTALES" },
    fotos: { rotulo: "{pictograma:marco} FOTOS" },
  },
  pestana: {
    pegatinas: { rotulo: "{pictograma:pegatina} PEGATINAS" },
    jefes: { rotulo: "{pictograma:reto} JEFES" },
    amigos: { rotulo: "{pictograma:amigos} AMIGOS" },
    postales: { rotulo: "{pictograma:postal} POSTALES" },
    fotos: { rotulo: "{pictograma:marco} FOTOS" },
  },
  fotos: {
    intro: { juntos: "Las fotos que has hecho en la casa de los gatitos. Toca una para verla grande." },
    vacio: { juntos: "Aún no hay fotos. En la casa de los gatitos, toca el marco para hacer una." },
    foto: { oculto: "Foto {numero} de la casa de los gatitos" },
    volver: { oculto: "Volver a las fotos" },
  },
  seguir: { rotulo: "{pictograma:jugar} SEGUIR" },
  pegatinas: {
    introSinSecreto: { juntos: "Hay una pegatina escondida en el camino alto de cada pantalla." },
    introConSecreto: { juntos: "Hay una pegatina por pantalla y tres insignias en el reino secreto." },
    encontrada: { rotulo: "{pictograma:si} ¡SI!" },
    pendiente: { rotulo: "{pictograma:por-descubrir}" },
    pista: { rotulo: "{pictograma:pista} PISTA" },
    abrirPantalla: { rotulo: "{pictograma:cerrado}", juntos: "Abre esta pantalla para ver su pista." },
    progreso: { rotulo: "{pictograma:pegatina} {n}/{total}", oculto: "{n} de {total} pegatinas" },
  },
  jefes: {
    intro: { juntos: "Gana el juego de cada guardián y será tu amigo. Luego podéis jugar otra vez." },
    misterioso: { rotulo: "{pictograma:por-descubrir}" },
    porDescubrir: { rotulo: "{pictograma:por-descubrir}", oculto: "Amigo por descubrir" },
    marco: { rotulo: "{pictograma:marco} ¡MARCO!" },
    retoPendiente: { rotulo: "{pictograma:reto} RETO" },
    jugarOtraVez: { rotulo: "{pictograma:otra-vez} JUGAR" },
    conocer: { juntos: "Gana su juego para conocerlo." },
    progreso: { rotulo: "{pictograma:reto} {n}/{total}", oculto: "{n} de {total} amigos" },
  },
  postales: {
    intro: { juntos: "Termina un mundo entero y guarda una postal con su gatito." },
    gatito: { oculto: "{gato}, el gatito amigo de {mundo}" },
    medallas: { rotulo: "{pictograma:estrella} {n}", oculto: "{n} medallas de aventura" },
    porDescubrir: { rotulo: "{pictograma:por-descubrir}", oculto: "Postal por descubrir" },
    progreso: { rotulo: "{pictograma:postal} {n}/{total}", oculto: "{n} de {total} postales guardadas" },
  },
  amigos: {
    intro: { rotulo: "{pictograma:amigos} SALUDA Y VISITA", juntos: "Saluda a los animales en el paseo de los amigos y luego visítalos aquí: acarícialos y dales de comer." },
    visita: { oculto: "Visita a {nombre}" },
    corazones: { oculto: "{n} de {total} corazones de amistad" },
    mejorAmigo: { rotulo: "{pictograma:vidas} ¡MEJOR AMIGO!" },
    acariciar: { rotulo: "{pictograma:amigos} ACARICIA" },
    leEncanta: { rotulo: "{pictograma:vidas} ¡LE ENCANTA!" },
    nam: { rotulo: "¡ÑAM!" },
    favorita: { rotulo: "{pictograma:vidas} ¡ÑAM, ÑAM!", juntos: "¡Su comida favorita! Baila de alegría." },
    muerde: { rotulo: "{pictograma:no-muerde} ¿MUERDE?" },
    noMuerde: { rotulo: "{pictograma:no-muerde} ¡NO MUERDE!" },
    volver: { rotulo: "{pictograma:vuelve} VUELVE" },
    nuevo: { rotulo: "NUEVO AMIGO" },
    porDescubrir: { oculto: "Amigo por descubrir" },
    quien: { rotulo: "¿QUIEN SERA?" },
    progreso: { rotulo: "{pictograma:amigos} {n}/{total}", oculto: "{n} de {total} amigos" },
  },
} as const;
