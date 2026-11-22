/**
 * Textos del paseo de los amigos: lo que dice cada amigo y la despedida del guardián, por mundo y tipo de amigo. El título y la pista de la pantalla están en `mapa.pantallaPaseo`, porque los enseña el mapa.
 * Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla).
 */

export const paseos = {
  "1": {
    amigos: {
      "slime": { rotulo: "¡SOY BLANDITA Y SALTARINA!", juntos: "¡Soy blandita y saltarina!" },
      "beetle": { rotulo: "¡BRILLO AL SOL!", juntos: "¡Me encanta brillar al sol!" },
      "cloud": { rotulo: "¡FLOTO COMO UN ALGODON!", juntos: "¡Floto como un algodón!" },
    },
    despedida: { rotulo: "¡GRACIAS, NOA!", juntos: "¡Gracias por la visita, Noa!" },
  },
  "2": {
    amigos: {
      "slime": { rotulo: "¡ESTOY FRESQUITA!", juntos: "¡En la cueva estoy fresquita!" },
      "beetle": { rotulo: "¡MIS ALAS BRILLAN!", juntos: "¡Mis alas brillan en la niebla!" },
      "bat": { rotulo: "¡DUERMO BOCA ABAJO!", juntos: "¡Duermo boca abajo, ji, ji!" },
      "cloud": { rotulo: "¡SOMOS PRIMAS!", juntos: "¡La niebla y yo somos primas!" },
    },
    despedida: { rotulo: "¡VUELVE PRONTO!", juntos: "¡Vuelve pronto a la gruta!" },
  },
  "3": {
    amigos: {
      "wolf": { rotulo: "¡YA DORMI!", juntos: "¡Ya me he echado la siesta!" },
      "cloud": { rotulo: "¡SOY LA LUNA!", juntos: "¡Soy la nube de la luna!" },
    },
    despedida: { rotulo: "¡AUUU! ¡HASTA PRONTO, NOA!", juntos: "¡Auuu! ¡Hasta pronto, Noa!" },
  },
  "4": {
    amigos: {
      "boar": { rotulo: "¡ME ENCANTAN LAS BELLOTAS!", juntos: "¡Me encantan las bellotas!" },
      "bird": { rotulo: "¡PIO, PIO!", juntos: "¡Pío, pío, qué bien saltas!" },
    },
    despedida: { rotulo: "¡VEN A MERENDAR!", juntos: "¡Ven a merendar otro día!" },
  },
  "5": {
    amigos: {
      "pirate": { rotulo: "¡AHOY, SOY BUENO!", juntos: "¡Ahoy! ¡Soy un pirata bueno!" },
      "parrot": { rotulo: "¡CRA, CRA, HOLA, NOA!", juntos: "¡Cra, cra, hola, Noa!" },
    },
    despedida: { rotulo: "¡BUEN VIENTO, MARINERA!", juntos: "¡Buen viento, marinera!" },
  },
  "6": {
    amigos: {
      "skeleton": { rotulo: "¡CLAC, CLAC!", juntos: "¡Mis huesos hacen clac, clac!" },
      "ghost": { rotulo: "¡BUUU! ¿TE HE ASUSTADO?", juntos: "¡Buuu! ¿Te he asustado?" },
      "zombie": { rotulo: "¡SOLO QUIERO UN ABRAZO!", juntos: "¡Solo quiero un abrazo!" },
    },
    despedida: { rotulo: "¡VUELVE A MI CASTILLO!", juntos: "¡Vuelve a mi castillo!" },
  },
  "9": {
    amigos: {
      "baby-t-rex": { rotulo: "¡MIS BRACITOS SON CORTITOS!", juntos: "¡Mis bracitos son cortitos!" },
      "pterodactyl": { rotulo: "¡VUELO SOBRE LA ISLA!", juntos: "¡Vuelo sobre la isla!" },
    },
    despedida: { rotulo: "¡HASTA PRONTO, PEQUEÑA!", juntos: "¡Hasta pronto, pequeña!" },
  },
  "10": {
    amigos: {
      "baby-dragon": { rotulo: "¡ECHO HUMITO, NO FUEGO!", juntos: "¡Echo humito, no fuego!" },
      "fire-salamander": { rotulo: "¡LA LAVA CALIENTA!", juntos: "¡La lava me da calorcito!" },
      "flying-dragon": { rotulo: "¡ME ENCANTA VOLAR ALTO!", juntos: "¡Me encanta volar alto!" },
    },
    despedida: { rotulo: "¡VUELVE A MI VOLCAN!", juntos: "¡Vuelve a mi volcán!" },
  },
  "11": {
    amigos: {
      "ant": { rotulo: "¡LLEVO HOJAS MUY GRANDES!", juntos: "¡Llevo hojas muy grandes!" },
      "snail": { rotulo: "¡VOY DESPACITO, DESPACITO!", juntos: "¡Voy despacito, despacito!" },
      "bee": { rotulo: "¡BZZ! ¡HAGO MIEL DULCE!", juntos: "¡Bzz! ¡Hago miel dulce!" },
    },
    despedida: { rotulo: "¡GRACIAS POR TU VISITA!", juntos: "¡Gracias por tu visita!" },
  },
  "12": {
    amigos: {
      "penguin": { rotulo: "¡ME DESLIZO!", juntos: "¡Me deslizo con la tripa!" },
      "snow-fox": { rotulo: "¡MI COLA CALIENTA!", juntos: "¡Mi cola es muy calentita!" },
      "snowy-owl": { rotulo: "¡VEO DE NOCHE!", juntos: "¡Uh, uh! ¡Veo de noche!" },
    },
    despedida: { rotulo: "¡ABRIGATE BIEN, NOA!", juntos: "¡Abrígate bien, Noa!" },
  },
  "13": {
    amigos: {
      "snow-scout": { rotulo: "¡HAGO MUÑECOS DE NIEVE!", juntos: "¡Hago muñecos de nieve!" },
      "toy-reindeer": { rotulo: "¡TIRO DEL TRINEO!", juntos: "¡Tiro del trineo!" },
      "toy-elf": { rotulo: "¡ENVUELVO LOS REGALOS!", juntos: "¡Envuelvo los regalos!" },
      "toy-robot": { rotulo: "¡BIP, BIP!", juntos: "¡Bip, bip, soy tu amigo!" },
      "gift-gnome": { rotulo: "¡GUARDO LOS REGALOS!", juntos: "¡Guardo los regalos!" },
    },
    despedida: { rotulo: "¡FELIZ NAVIDAD, NOA!", juntos: "¡Feliz Navidad, Noa!" },
  },
  "14": {
    amigos: {
      "desert-scarab": { rotulo: "¡RUEDO BOLITAS DE ARENA!", juntos: "¡Ruedo bolitas de arena!" },
      "fennec": { rotulo: "¡OIGO TODO!", juntos: "¡Mis orejas lo oyen todo!" },
      "tumbleweed": { rotulo: "¡RUEDO CON EL VIENTO!", juntos: "¡Ruedo con el viento!" },
    },
    despedida: { rotulo: "¡BUEN VIENTO!", juntos: "¡Que el viento te acompañe!" },
  },
  "15": {
    amigos: {
      "rolling-suitcase": { rotulo: "¡LLEVO CALCETINES DENTRO!", juntos: "¡Llevo calcetines dentro!" },
      "conductor-pigeon": { rotulo: "¡PASAJEROS, AL TREN!", juntos: "¡Pasajeros, al tren!" },
      "clockwork-mouse": { rotulo: "¡CRIC, CRIC, TENGO CUERDA!", juntos: "¡Cric, cric, tengo cuerda!" },
    },
    despedida: { rotulo: "¡BUEN VIAJE, NOA!", juntos: "¡Buen viaje, Noa!" },
  },
  "16": {
    amigos: {
      "walking-drum": { rotulo: "¡POM, POM, POM!", juntos: "¡Pom, pom, pom!" },
      "note-bird": { rotulo: "¡CANTO TODAS LAS NOTAS!", juntos: "¡Canto todas las notas!" },
      "violin-mouse": { rotulo: "¡TOCO EL VIOLIN!", juntos: "¡Toco el violín!" },
    },
    despedida: { rotulo: "¡BRAVO, BRAVO, NOA!", juntos: "¡Bravo, bravo, Noa!" },
  },
} as const;
