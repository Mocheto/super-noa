/**
 * Ficha de cada amigo animal, por tipo: nombre, si muerde y consejo (`amigos.slime.nombre.rotulo`).
 * Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla).
 */

export const amigos = {
  comida: {
    apple: { rotulo: "MANZANA" },
    acorn: { rotulo: "BELLOTA" },
    flower: { rotulo: "FLOR" },
  },
  "slime": {
    nombre: { rotulo: "BABOSA SALTARINA", juntos: "Babosa saltarina" },
    muerde: { juntos: "No muerde: ¡solo hace cosquillas!" },
    consejo: { juntos: "En su mundo pasea: ¡salta por encima!" },
  },
  "beetle": {
    nombre: { rotulo: "ESCARABAJO BRILLANTE", juntos: "Escarabajo brillante" },
    muerde: { juntos: "No muerde, pero empuja un poco." },
    consejo: { juntos: "Camina de lado a lado: espera y salta." },
  },
  "cloud": {
    nombre: { rotulo: "NUBE VIAJERA", juntos: "Nube viajera" },
    muerde: { juntos: "No muerde: ¡es de algodón!" },
    consejo: { juntos: "Flota alta: pasa por debajo." },
  },
  "bat": {
    nombre: { rotulo: "MURCIELAGO DORMILON", juntos: "Murciélago dormilón" },
    muerde: { juntos: "No muerde: ¡le da vergüenza!" },
    consejo: { juntos: "Vuela en la cueva: agáchate y pasa." },
  },
  "wolf": {
    nombre: { rotulo: "LOBO DORMILON", juntos: "Lobo dormilón" },
    muerde: { juntos: "Dormido no muerde. ¡Mira los ZZZ!" },
    consejo: { juntos: "Pasa mientras duerme." },
  },
  "fish": {
    nombre: { rotulo: "PECECITO DE CORAL", juntos: "Pececito de coral" },
    muerde: { juntos: "No muerde: ¡solo hace burbujas!" },
    consejo: { juntos: "Nada en la laguna: rodéalo." },
  },
  "urchin": {
    nombre: { rotulo: "ERIZO DE MAR", juntos: "Erizo de mar" },
    muerde: { juntos: "No muerde, pero pincha." },
    consejo: { juntos: "No lo toques: nada por encima." },
  },
  "boar": {
    nombre: { rotulo: "JABALI GLOTON", juntos: "Jabalí glotón" },
    muerde: { juntos: "No muerde: ¡solo quiere bellotas!" },
    consejo: { juntos: "Corre si te ve: salta a las copas." },
  },
  "bird": {
    nombre: { rotulo: "PAJARITO DE LAS COPAS", juntos: "Pajarito de las copas" },
    muerde: { juntos: "No muerde: ¡canta muy bonito!" },
    consejo: { juntos: "Vuela entre las ramas: espera." },
  },
  "pirate": {
    nombre: { rotulo: "PIRATA SIMPATICO", juntos: "Pirata simpático" },
    muerde: { juntos: "No muerde: ¡es un pirata bueno!" },
    consejo: { juntos: "Patrulla el barco: salta sobre él." },
  },
  "parrot": {
    nombre: { rotulo: "LORO CHARLATAN", juntos: "Loro charlatán" },
    muerde: { juntos: "No muerde: ¡solo habla mucho!" },
    consejo: { juntos: "Cruza volando: pasa por debajo." },
  },
  "skeleton": {
    nombre: { rotulo: "ESQUELETO BAILARIN", juntos: "Esqueleto bailarín" },
    muerde: { juntos: "No muerde: ¡no tiene dientes!" },
    consejo: { juntos: "Camina despacio: salta sobre él." },
  },
  "ghost": {
    nombre: { rotulo: "FANTASMA TIMIDO", juntos: "Fantasma tímido" },
    muerde: { juntos: "No muerde: ¡solo dice buuu!" },
    consejo: { juntos: "Flota: pasa cuando se aleje." },
  },
  "zombie": {
    nombre: { rotulo: "ZOMBI DORMILON", juntos: "Zombi dormilón" },
    muerde: { juntos: "No muerde: ¡quiere abrazos!" },
    consejo: { juntos: "Es lento: adelántalo saltando." },
  },
  "baby-t-rex": {
    nombre: { rotulo: "PEQUEÑO T-REX", juntos: "Pequeño t-rex" },
    muerde: { juntos: "No muerde: ¡tiene bracitos cortos!" },
    consejo: { juntos: "Corretea: salta sobre él." },
  },
  "pterodactyl": {
    nombre: { rotulo: "TERODACTILO", juntos: "Terodáctilo" },
    muerde: { juntos: "No muerde: ¡vuela muy alto!" },
    consejo: { juntos: "Planea: espera a que pase." },
  },
  "baby-dragon": {
    nombre: { rotulo: "DRAGONCITO", juntos: "Dragoncito" },
    muerde: { juntos: "No muerde: ¡echa humito!" },
    consejo: { juntos: "Pasea: salta sobre él." },
  },
  "fire-salamander": {
    nombre: { rotulo: "SALAMANDRA DE FUEGO", juntos: "Salamandra de fuego" },
    muerde: { juntos: "No muerde, pero está calentita." },
    consejo: { juntos: "Corre por el suelo: salta." },
  },
  "flying-dragon": {
    nombre: { rotulo: "DRAGON VOLADOR", juntos: "Dragón volador" },
    muerde: { juntos: "No muerde: ¡le gusta volar!" },
    consejo: { juntos: "Vuela alto: pasa por debajo." },
  },
  "ant": {
    nombre: { rotulo: "HORMIGA GIGANTE", juntos: "Hormiga gigante" },
    muerde: { juntos: "No muerde: ¡lleva hojas!" },
    consejo: { juntos: "Camina despacio: salta." },
  },
  "snail": {
    nombre: { rotulo: "CARACOL GIGANTE", juntos: "Caracol gigante" },
    muerde: { juntos: "No muerde: ¡va despacito!" },
    consejo: { juntos: "Es lentísimo: adelántalo." },
  },
  "bee": {
    nombre: { rotulo: "ABEJA GIGANTE", juntos: "Abeja gigante" },
    muerde: { juntos: "No pica: ¡hace miel!" },
    consejo: { juntos: "Zumba en el aire: espera." },
  },
  "penguin": {
    nombre: { rotulo: "PINGUINO DESLIZON", juntos: "Pingüino deslizón" },
    muerde: { juntos: "No muerde: ¡se desliza!" },
    consejo: { juntos: "Resbala por el hielo: salta." },
  },
  "snow-fox": {
    nombre: { rotulo: "ZORRO DE NIEVE", juntos: "Zorro de nieve" },
    muerde: { juntos: "No muerde: ¡tiene cola calentita!" },
    consejo: { juntos: "Corretea: salta sobre él." },
  },
  "snowy-owl": {
    nombre: { rotulo: "BUHO NIVAL", juntos: "Búho nival" },
    muerde: { juntos: "No muerde: ¡ve de noche!" },
    consejo: { juntos: "Vuela bajito: espera." },
  },
  "snow-scout": {
    nombre: { rotulo: "EXPLORADOR DE NIEVE", juntos: "Explorador de nieve" },
    muerde: { juntos: "No muerde: ¡hace muñecos!" },
    consejo: { juntos: "Pasea: salta sobre él." },
  },
  "toy-reindeer": {
    nombre: { rotulo: "RENO DE JUGUETE", juntos: "Reno de juguete" },
    muerde: { juntos: "No muerde: ¡tira del trineo!" },
    consejo: { juntos: "Trota: salta a tiempo." },
  },
  "winter-robin": {
    nombre: { rotulo: "PETIRROJO", juntos: "Petirrojo" },
    muerde: { juntos: "No muerde: ¡canta villancicos!" },
    consejo: { juntos: "Vuela: pasa por debajo." },
  },
  "toy-bird": {
    nombre: { rotulo: "PAJARO DE JUGUETE", juntos: "Pájaro de juguete" },
    muerde: { juntos: "No muerde: ¡tiene cuerda!" },
    consejo: { juntos: "Vuela en la fábrica: espera." },
  },
  "toy-elf": {
    nombre: { rotulo: "DUENDE JUGUETERO", juntos: "Duende juguetero" },
    muerde: { juntos: "No muerde: ¡envuelve regalos!" },
    consejo: { juntos: "Corretea: salta sobre él." },
  },
  "toy-robot": {
    nombre: { rotulo: "ROBOT DE JUGUETE", juntos: "Robot de juguete" },
    muerde: { juntos: "No muerde: ¡hace bip, bip!" },
    consejo: { juntos: "Camina recto: salta." },
  },
  "gift-box": {
    nombre: { rotulo: "CAJA DE REGALO", juntos: "Caja de regalo" },
    muerde: { juntos: "No muerde: ¡tiene sorpresa!" },
    consejo: { juntos: "Da saltitos: espera." },
  },
  "star-lantern": {
    nombre: { rotulo: "FAROLILLO ESTRELLA", juntos: "Farolillo estrella" },
    muerde: { juntos: "No muerde: ¡da luz!" },
    consejo: { juntos: "Flota: pasa por debajo." },
  },
  "gift-gnome": {
    nombre: { rotulo: "GNOMO DE LOS REGALOS", juntos: "Gnomo de los regalos" },
    muerde: { juntos: "No muerde: ¡guarda regalos!" },
    consejo: { juntos: "Pasea: salta sobre él." },
  },
  "desert-scarab": {
    nombre: { rotulo: "ESCARABAJO DEL DESIERTO", juntos: "Escarabajo del desierto" },
    muerde: { juntos: "No muerde: ¡rueda arena!" },
    consejo: { juntos: "Camina: salta sobre él." },
  },
  "fennec": {
    nombre: { rotulo: "FENEC OREJUDO", juntos: "Fénec orejudo" },
    muerde: { juntos: "No muerde: ¡lo oye todo!" },
    consejo: { juntos: "Corre rápido: espera y salta." },
  },
  "tumbleweed": {
    nombre: { rotulo: "PLANTA RODADORA", juntos: "Planta rodadora" },
    muerde: { juntos: "No muerde: ¡rueda con el viento!" },
    consejo: { juntos: "Rueda: salta cuando llegue." },
  },
  "rolling-suitcase": {
    nombre: { rotulo: "MALETA CON RUEDAS", juntos: "Maleta con ruedas" },
    muerde: { juntos: "No muerde: ¡lleva calcetines!" },
    consejo: { juntos: "Rueda por el andén: salta." },
  },
  "conductor-pigeon": {
    nombre: { rotulo: "PALOMA REVISORA", juntos: "Paloma revisora" },
    muerde: { juntos: "No muerde: ¡pide los billetes!" },
    consejo: { juntos: "Vuela: pasa por debajo." },
  },
  "clockwork-mouse": {
    nombre: { rotulo: "RATON DE CUERDA", juntos: "Ratón de cuerda" },
    muerde: { juntos: "No muerde: ¡tiene cuerda!" },
    consejo: { juntos: "Corre recto: salta sobre él." },
  },
  "walking-drum": {
    nombre: { rotulo: "TAMBOR ANDARIN", juntos: "Tambor andarín" },
    muerde: { juntos: "No muerde: ¡hace pom, pom!" },
    consejo: { juntos: "Camina al compás: salta." },
  },
  "note-bird": {
    nombre: { rotulo: "PAJARO NOTA", juntos: "Pájaro nota" },
    muerde: { juntos: "No muerde: ¡canta notas!" },
    consejo: { juntos: "Vuela: espera y pasa." },
  },
  "violin-mouse": {
    nombre: { rotulo: "RATON VIOLINISTA", juntos: "Ratón violinista" },
    muerde: { juntos: "No muerde: ¡toca el violín!" },
    consejo: { juntos: "Pasea: salta sobre él." },
  },
  "puffling": {
    nombre: { rotulo: "NUBECITA", juntos: "Nubecita" },
    muerde: { juntos: "No muerde: ¡es muy suave!" },
    consejo: { juntos: "Flota: pasa por un lado." },
  },
  "sky-unicorn": {
    nombre: { rotulo: "UNICORNIO DEL CIELO", juntos: "Unicornio del cielo" },
    muerde: { juntos: "No muerde: ¡tiene arcoíris!" },
    consejo: { juntos: "Galopa en las nubes: espera." },
  },
} as const;
