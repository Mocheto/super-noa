/**
 * Textos de la partida: HUD, ventana de pausa y carteles del lienzo.
 * Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla).
 * Cualquier otra hoja es texto para adultos.
 */
export const partida = {
  hud: {
    vidas: { oculto: { one: "{n} vida", other: "{n} vidas" } },
    manzanas: { oculto: { one: "{n} manzana", other: "{n} manzanas" } },
    pegatinas: { oculto: { one: "{n} pegatina encontrada", other: "{n} pegatinas encontradas" } },
    poder: {
      estrella: { rotulo: "{pictograma:estrella}", oculto: "Noa Estelar" },
      gata: { rotulo: "{pictograma:gato}", oculto: "Noa gata" },
      manzana: { rotulo: "{pictograma:manzana}", oculto: "Noa protegida" },
    },
    sonido: { oculto: "Activar sonido" },
    silencio: { oculto: "Quitar sonido" },
    pantallaGrande: { oculto: "Pantalla completa" },
    pausa: { oculto: "Pausa" },
    banderas: { oculto: "Bandera {n} de {total}" },
    salas: { oculto: "Sala {n} de {total}" },
    secreto: { rotulo: "{pictograma:secreto} SECRETO" },
    paseo: { rotulo: "{pictograma:amigos} PASEO" },
    cargando: { rotulo: "{pictograma:espera} ESPERA" },
  },
  pausa: {
    titulo: { rotulo: "{pictograma:pausa} PAUSA" },
    seguir: { rotulo: "{pictograma:jugar} SEGUIR" },
    otraVez: { rotulo: "{pictograma:otra-vez} OTRA VEZ" },
    mapa: { rotulo: "{pictograma:mapa} MAPA" },
  },
  lienzo: {
    dobleSalto: { rotulo: "{pictograma:salta}{pictograma:salta} ¡DOBLE SALTO!" },
    dobleSaltoComo: { rotulo: "{pictograma:salta} Y OTRA VEZ {pictograma:salta}" },
  },
} as const;
