/**
 * Textos de la casa de los gatitos: el botón del mapa, la habitación y la llegada de cada gatito.
 * Los nombres de los gatitos salen de `mundos.<n>.gato.rotulo`.
 */
export const casa = {
  boton: { rotulo: "{pictograma:inicio} CASA" },
  titulo: { oculto: "La casa de los gatitos" },
  gatito: { oculto: "{nombre}, en la casa" },
  salir: { oculto: "Volver al mapa" },
  bandeja: { oculto: "Cosas para cuidar a los gatitos" },
  bano: {
    titulo: { oculto: "Baño de {nombre}" },
    salir: { oculto: "Volver a la habitación" },
    bandeja: { oculto: "Cosas para bañar al gatito" },
    utensilio: {
      alcachofa: { oculto: "Alcachofa de la ducha: moja y aclara al gatito" },
      jabon: { oculto: "Jabón: frota para hacer espuma" },
      secador: { oculto: "Secador: seca al gatito" },
      peine: { oculto: "Peine: péinalo de arriba abajo" },
    },
    fin: {
      titulo: { rotulo: "{pictograma:estrella} ¡LIMPIO!" },
      frase: { juntos: "¡{nombre} está limpio y brillante!" },
      sigue: { rotulo: "{pictograma:jugar} SIGUE" },
    },
  },
  vestidor: {
    titulo: { oculto: "Vestidor de {nombre}" },
    armario: { oculto: "Armario de la ropa: toca una prenda para ponérsela o quitársela" },
    balda: {
      sombrero: { oculto: "Sombreros" },
      gafas: { oculto: "Gafas" },
      bufanda: { oculto: "Bufandas" },
    },
    pieza: {
      paja: { oculto: "Sombrero de paja" },
      gorro: { oculto: "Gorro de lana" },
      fiesta: { oculto: "Gorro de fiesta" },
      chistera: { oculto: "Chistera" },
      redondas: { oculto: "Gafas redondas" },
      estrella: { oculto: "Gafas de estrella" },
      corazon: { oculto: "Gafas de corazón" },
      buceo: { oculto: "Gafas de bucear" },
      rayas: { oculto: "Bufanda de rayas" },
      copos: { oculto: "Bufanda de copos de nieve" },
      lunares: { oculto: "Bufanda de lunares" },
      flecos: { oculto: "Bufanda con flecos" },
    },
    listo: { rotulo: "{pictograma:jugar} ¡LISTO!" },
  },
  comida: {
    abanico: { oculto: "Comidas: arrastra una hasta un gatito" },
    pescado: { oculto: "Cuenco de pescado" },
    leche: { oculto: "Cuenco de leche" },
    galletas: { oculto: "Cuenco de galletas" },
    pollo: { oculto: "Cuenco de pollo" },
    nam: { rotulo: "{pictograma:estrella} ¡ÑAM!" },
    favorita: { oculto: "Su comida favorita: {comida}" },
  },
  objeto: {
    cuenco: { oculto: "Cuenco de comida: tócalo para elegir la comida" },
    pelota: { oculto: "Pelota: suéltala en la habitación para que un gatito la atrape" },
    escoba: { oculto: "Escoba: pásala por las huellas de barro" },
    regadera: { oculto: "Regadera: llévala a un macetero para regarlo" },
  },
  decorar: {
    boton: { oculto: "Decorar la casa" },
    cuidar: { oculto: "Volver a cuidar a los gatitos" },
    bandeja: { oculto: "Versiones del mueble que has tocado" },
    version: { oculto: "{mueble}: opción {numero}" },
    mueble: {
      cama: { oculto: "La cama" },
      alfombra: { oculto: "La alfombra" },
      cuadro: { oculto: "El cuadro" },
      planta: { oculto: "La planta" },
      pared: { oculto: "La pared" },
    },
  },
  foto: {
    boton: { oculto: "Hacer una foto de la casa" },
  },
  jardin: {
    mariposa: { oculto: "Mariposa: tócala para que se pose junto a un gatito" },
    macetero: {
      semilla: { oculto: "Macetero con una semilla" },
      brote: { oculto: "Macetero con un brote" },
      capullo: { oculto: "Macetero con un capullo" },
      flor: { oculto: "Macetero con una flor abierta" },
    },
  },
  visitante: {
    toc: { rotulo: "{pictograma:sala} TOC TOC" },
    llama: { oculto: "{nombre} llama a la puerta" },
    dentro: { oculto: "{nombre} ha venido de visita" },
  },
  puerta: {
    jardin: { oculto: "Puerta: sal al jardín" },
    casa: { oculto: "Puerta: vuelve a casa" },
  },
  dormir: {
    empezar: { oculto: "Hora de dormir: acostar a los gatitos" },
    salir: { oculto: "Terminar la hora de dormir" },
    bandeja: { oculto: "Cosas para acostar a los gatitos" },
    mantita: { oculto: "Mantita: arrástrala hasta un gatito para arroparlo" },
    lampara: { oculto: "Lámpara: tócala para apagarla o encenderla" },
    fin: {
      titulo: { rotulo: "{pictograma:estrella} ¡BUENAS NOCHES!" },
      frase: { juntos: "Los gatitos ya duermen arropados. ¡Hasta mañana!" },
      sigue: { rotulo: "{pictograma:jugar} SIGUE" },
    },
  },
  enCasa: {
    boton: { oculto: "Elegir qué gatitos están en casa" },
    titulo: { rotulo: "{pictograma:inicio} EN CASA" },
    cuantos: { oculto: "{cuantos} de {maximo} gatitos en casa" },
    ficha: {
      dentro: { oculto: "{nombre} está en casa. Tócalo para mandarlo de paseo." },
      paseo: { oculto: "{nombre} está de paseo. Tócalo para traerlo a casa." },
    },
    frase: { juntos: "Toca un gatito para que entre en casa o se vaya de paseo. En casa caben {maximo}." },
    sigue: { rotulo: "{pictograma:jugar} SIGUE" },
  },
  llegada: {
    titulo: { rotulo: "{pictograma:gato} ¡HOLA!" },
    uno: { juntos: "¡{nombre} ya tiene casa! Dale muchos mimos." },
    varios: { juntos: "¡{nombres} ya tienen casa! Dales muchos mimos." },
    muchos: { juntos: "¡{cuantos} gatitos ya tienen casa! Elige quién se queda dentro y quién se va de paseo." },
    union: { juntos: "{primeros} y {ultimo}" },
    sigue: { rotulo: "{pictograma:jugar} SIGUE" },
  },
} as const;
