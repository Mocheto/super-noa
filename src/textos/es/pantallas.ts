/**
 * Textos de cada pantalla de la campaña, por identificador: título, pista, botón «siguiente» y lo que dice el animal en las persecuciones.
 * Los datos de `levels.ts` no llevan texto: lo leen de aquí con su identificador (`pantallas.1-2.titulo.rotulo`).
 * Hojas reservadas: `rotulo` (texto para Noa), `juntos` (para leer juntos) y `oculto` (lector de pantalla).
 */

export const pantallas = {
  "1-1": {
    titulo: { rotulo: "SENDERO", juntos: "El sendero de las manzanas" },
    pista: { rotulo: "{pictograma:caja} SALTA Y ABRE", juntos: "Aprende a saltar y descubre la caja con huella." },
  },
  "1-2": {
    titulo: { rotulo: "FIESTA", juntos: "La gran fiesta de las copas" },
    pista: { rotulo: "{pictograma:lana} SIGUE LA LANA", juntos: "¡Un escarabajo se ha llevado el ovillo! Síguelo por el huerto." },
    habla: {
      parada1: { rotulo: "¡JI, JI!" },
      parada2: { rotulo: "¡POR AQUI!" },
      parada3: { rotulo: "¡SALTA EL HUECO!" },
      parada4: { rotulo: "¡ARRIBA!" },
      parada5: { rotulo: "¡BOTA EN EL MUELLE!" },
      parada6: { rotulo: "¡QUE ALTO!" },
      parada7: { rotulo: "¡CASI, CASI!" },
      parada8: { rotulo: "¡NO HAY SALIDA!" },
    },
  },
  "1-3": {
    titulo: { rotulo: "FORTALEZA", juntos: "La fortaleza de las raíces" },
    pista: { rotulo: "{pictograma:salta} TRES SALTOS", juntos: "Un camino largo con tres saltos antes del duelo del Rey Zarzal." },
  },
  "2-1": {
    titulo: { rotulo: "BIGOTES", juntos: "El bosque de los bigotes" },
    pista: { rotulo: "{pictograma:pegatina} SIGUE LAS LUCES", juntos: "Las luciérnagas marcan un camino algo más largo." },
  },
  "2-2": {
    titulo: { rotulo: "GRUTA", juntos: "La gruta de los murciélagos" },
    pista: { rotulo: "{pictograma:caja} ABRE LAS PUERTAS", juntos: "Abre las puertas de cristal. En la niebla, las repisas casi no se ven." },
  },
  "2-3": {
    titulo: { rotulo: "CUEVA", juntos: "El corazón de la cueva" },
    pista: { rotulo: "{pictograma:lava} BUSCA LA SALIDA", juntos: "Busca la salida entre la lava y reta a la Condesa Niebla." },
  },
  "3-1": {
    titulo: { rotulo: "PINAR", juntos: "El pinar de las huellas" },
    pista: { rotulo: "PASA CON ZZZ", juntos: "Los lobos duermen: pasa al ver ZZZ. ¡Avisan antes de despertar!" },
  },
  "3-2": {
    titulo: { rotulo: "LOBOS", juntos: "El corazón del bosque de los lobos" },
    pista: { rotulo: "{pictograma:gato} BUSCA 3 GATITOS", juntos: "¡Tres gatitos perdidos! Búscalos en el árbol y en el túnel sin despertar a los lobos." },
  },
  "3-3": {
    titulo: { rotulo: "GUARIDA", juntos: "La guarida del Gran Lobo" },
    pista: { rotulo: "PASA SIN RUIDO", juntos: "Pasa junto a los lobos dormidos y salta hasta el Gran Lobo." },
  },
  "A-1": {
    titulo: { rotulo: "PERLA", juntos: "La laguna de Perla" },
    pista: { rotulo: "{pictograma:salta} NADA ARRIBA", juntos: "Toca SALTAR para nadar hacia arriba. Suelta para bajar despacito." },
  },
  "A-2": {
    titulo: { rotulo: "ERIZOS", juntos: "El jardín de los erizos" },
    pista: { rotulo: "{pictograma:erizo} ¡OJO, ERIZOS!", juntos: "Nada entre los corales o camina por la arena. ¡Cuidado con los erizos!" },
  },
  "A-3": {
    titulo: { rotulo: "PALACIO", juntos: "El palacio de Don Aleta" },
    pista: { rotulo: "{pictograma:meta} CRUZA LAS GRUTAS", juntos: "Cruza las grutas del arrecife y conoce al guardián del mar." },
    siguiente: { juntos: "Seguir con los jabalíes" },
  },
  "4-1": {
    titulo: { rotulo: "BELLOTAS", juntos: "Las copas de las bellotas" },
    pista: { rotulo: "{pictograma:salta} SUBE POR ARRIBA", juntos: "Arriba hay un camino seguro; abajo, manzanas entre los jabalíes." },
  },
  "4-2": {
    titulo: { rotulo: "COPAS", juntos: "El gran árbol de las copas" },
    pista: { rotulo: "{pictograma:salta} SUBE A LO ALTO", juntos: "¡Sube por las copas hasta lo más alto! Los jabalíes pasean por las ramas." },
  },
  "4-3": {
    titulo: { rotulo: "JABALI", juntos: "La fortaleza del Gran Jabalí" },
    pista: { rotulo: "{pictograma:enredadera} BUSCA LA ENREDADERA", juntos: "Busca la gran plataforma de madera para alcanzar la enredadera secreta." },
  },
  "5-1": {
    titulo: { rotulo: "FLOTA", juntos: "La flota de las nubes" },
    pista: { rotulo: "{pictograma:nube} SALTA ENTRE BARCOS", juntos: "Salta entre barcos voladores y vigila a los primeros piratas." },
  },
  "5-2": {
    titulo: { rotulo: "VELAS", juntos: "El baile de las velas" },
    pista: { rotulo: "{pictograma:lana} SIGUE AL LORO", juntos: "¡Un loro se ha llevado el ovillo! Síguelo de barco en barco." },
    habla: {
      parada1: { rotulo: "¡CRA, CRA!" },
      parada2: { rotulo: "¡AL OTRO BARCO!" },
      parada3: { rotulo: "¡VUELA, VUELA!" },
      parada4: { rotulo: "¡CUIDADO, PIRATA!" },
      parada5: { rotulo: "¡POR LA TABLA!" },
      parada6: { rotulo: "¡QUE VIENTO!" },
      parada7: { rotulo: "¡CASI, CASI!" },
      parada8: { rotulo: "¡QUE LEJOS!" },
      parada9: { rotulo: "¡NO HAY SALIDA!" },
    },
  },
  "5-3": {
    titulo: { rotulo: "TORMENTA", juntos: "La tormenta del Capitán Celeste" },
    pista: { rotulo: "{pictograma:reto} RETO DEL CAPITAN", juntos: "Cruza la gran flota, salta los cañonazos y reta al capitán pirata." },
  },
  "6-1": {
    titulo: { rotulo: "PUERTAS", juntos: "Las puertas del castillo" },
    pista: { rotulo: "{pictograma:perrito} PASA POR ARRIBA", juntos: "Los perritos de cobre avisan antes de morder. ¡Busca el camino de arriba!" },
  },
  "6-2": {
    titulo: { rotulo: "TORRES", juntos: "El laberinto de las torres" },
    pista: { rotulo: "{pictograma:caja} ABRE LAS PUERTAS", juntos: "Abre las puertas de las torres. Los perritos avisan: ¡pasa por arriba!" },
  },
  "6-3": {
    titulo: { rotulo: "SALON", juntos: "El salón del Conde Vampiro" },
    pista: { rotulo: "¡OJO, PINCHOS!", juntos: "Una última ruta entre fantasmas, pinchos y pasadizos." },
    siguiente: { juntos: "Viajar a la isla de los dinosaurios" },
  },
  "9-1": {
    titulo: { rotulo: "COSTA", juntos: "La costa de las huellas" },
    pista: { rotulo: "{pictograma:agua} SALTA EL AGUA", juntos: "Salta sobre el agua y conoce a los pequeños t-rex de la isla." },
  },
  "9-2": {
    titulo: { rotulo: "TERODACTILOS", juntos: "El vuelo de los terodáctilos" },
    pista: { rotulo: "{pictograma:gato} BUSCA 3 GATITOS", juntos: "¡Tres gatitos se han perdido en la isla! Búscalos en los acantilados y la laguna." },
  },
  "9-3": {
    titulo: { rotulo: "NIDO", juntos: "El nido de la Reina Tricera" },
    pista: { rotulo: "{pictograma:reto} RETO FINAL", juntos: "Cruza la gran isla y juega con su guardiana de tres cuernos." },
    siguiente: { juntos: "Viajar al volcán de los dragones" },
  },
  "10-1": {
    titulo: { rotulo: "LADERAS", juntos: "Las laderas humeantes" },
    pista: { rotulo: "{pictograma:lava} MIRA LA LAVA", juntos: "Observa el ritmo de los chorros de lava y salta cuando bajen." },
  },
  "10-2": {
    titulo: { rotulo: "CHIMENEA", juntos: "La chimenea del volcán" },
    pista: { rotulo: "{pictograma:salta} SUBE CON LA LAVA", juntos: "Sube por la chimenea: los chorros de lava suben y bajan al compás." },
  },
  "10-3": {
    titulo: { rotulo: "VOLCAN", juntos: "El corazón del volcán" },
    pista: { rotulo: "{pictograma:reto} RETO DE DRAGONA", juntos: "Llega hasta Dragona Rubí y demuéstrale lo valiente que eres." },
    siguiente: { juntos: "Bajar al valle de los gigantes" },
  },
  "11-1": {
    titulo: { rotulo: "FLORES", juntos: "El sendero de las flores gigantes" },
    pista: { rotulo: "{pictograma:flor} PASA CUANDO ABRE", juntos: "La flor abierta es un puente. Si avisa, ¡salta! También hay gotas de rocío." },
  },
  "11-2": {
    titulo: { rotulo: "GOTAS", juntos: "El jardín de las gotas" },
    pista: { rotulo: "{pictograma:lana} SIGUE A LA ABEJA", juntos: "¡Una abeja se ha llevado el ovillo! Síguela por las flores." },
    habla: {
      parada1: { rotulo: "¡BZZ!" },
      parada2: { rotulo: "¡VEN, VEN!" },
      parada3: { rotulo: "¡SALTA EL AGUA!" },
      parada4: { rotulo: "¡POR LA FLOR!" },
      parada5: { rotulo: "¡BOTA EN EL ROCIO!" },
      parada6: { rotulo: "¡QUE ALTO VUELO!" },
      parada7: { rotulo: "¡OTRA FLOR!" },
      parada8: { rotulo: "¡CASI, CASI!" },
      parada9: { rotulo: "¡NO HAY SALIDA!" },
    },
  },
  "11-3": {
    titulo: { rotulo: "COLMENA", juntos: "La colmena de Melisa" },
    pista: { rotulo: "{pictograma:reto} BUSCA A MELISA", juntos: "Flores y gotas te ayudan. Salta cuando la flor avise y busca a Melisa." },
    siguiente: { juntos: "Subir a la montaña de hielo" },
  },
  "12-1": {
    titulo: { rotulo: "NIEVE", juntos: "La senda de la nieve" },
    pista: { rotulo: "{pictograma:hielo} ¡OJO, RESBALA!", juntos: "El hielo resbala y las ráfagas empujan: avanza mirando el viento." },
  },
  "12-2": {
    titulo: { rotulo: "CUEVAS", juntos: "Las cuevas de hielo" },
    pista: { rotulo: "{pictograma:caja} EMPUJA LAS CAJAS", juntos: "Empuja los cajones: en el hielo resbalan hasta chocar." },
  },
  "12-3": {
    titulo: { rotulo: "AURORA", juntos: "La cima de la aurora" },
    pista: { rotulo: "{pictograma:reto} RETO DE OSA", juntos: "Domina el hielo y el viento para llegar hasta la gran Osa Boreal." },
    siguiente: { juntos: "Seguir a Papá Noel" },
  },
  "13-1": {
    titulo: { rotulo: "REGALOS", juntos: "El camino de los regalos" },
    pista: { rotulo: "{pictograma:regalo} SALTA EN EL REGALO", juntos: "¡Salta sobre el regalo saltarín para subir hasta los pinos!" },
  },
  "13-2": {
    titulo: { rotulo: "ARBOL", juntos: "El gran árbol de la fábrica" },
    pista: { rotulo: "{pictograma:estrella} SUBE A LA ESTRELLA", juntos: "¡Sube hasta la estrella! Las cintas te llevan y los regalos saltarines te impulsan." },
  },
  "13-3": {
    titulo: { rotulo: "ALMACEN", juntos: "El almacén de regalos" },
    pista: { rotulo: "{pictograma:reto} VE A PAPA NOEL", juntos: "¡Combina las cintas y el regalo saltarín para llegar hasta Papá Noel!" },
    siguiente: { juntos: "Seguir hacia el desierto" },
  },
  "14-1": {
    titulo: { rotulo: "DUNAS", juntos: "Las dunas que cantan" },
    pista: { rotulo: "{pictograma:aire} ENTRA EN EL GEISER", juntos: "Entra en el géiser de arena para subir. Los remolinos empujan despacito." },
  },
  "14-2": {
    titulo: { rotulo: "OASIS", juntos: "El oasis de los espejos" },
    pista: { rotulo: "{pictograma:gato} BUSCA 3 GATITOS", juntos: "¡Tres gatitos se han perdido en el oasis! Búscalos arriba, abajo y lejos." },
  },
  "14-3": {
    titulo: { rotulo: "RUINAS", juntos: "Las ruinas de Siroco" },
    pista: { rotulo: "{pictograma:reto} RETO DE SIROCO", juntos: "Cruza las columnas de arena y visita al guardián del desierto." },
    siguiente: { juntos: "Subir al tren" },
  },
  "15-1": {
    titulo: { rotulo: "ANDEN", juntos: "El andén de las maletas" },
    pista: { rotulo: "{pictograma:tren} CAMINA SOBRE EL TREN", juntos: "Monta en los techos largos del tren: puedes caminar o dejar que te lleven." },
  },
  "15-2": {
    titulo: { rotulo: "PUENTE", juntos: "El puente del silbido" },
    pista: { rotulo: "{pictograma:lana} SIGUE AL RATON", juntos: "¡El ratón de cuerda se ha llevado el ovillo! Síguelo por los vagones." },
    habla: {
      parada1: { rotulo: "¡CRIC, CRIC!" },
      parada2: { rotulo: "¡AL TREN!" },
      parada3: { rotulo: "¡SUBE AL VAGON!" },
      parada4: { rotulo: "¡CUIDADO, VAPOR!" },
      parada5: { rotulo: "¡LA CINTA ME LLEVA!" },
      parada6: { rotulo: "¡QUE ALTO!" },
      parada7: { rotulo: "¡CASI, CASI!" },
      parada8: { rotulo: "¡YA NO CORRO!" },
      parada9: { rotulo: "¡NO HAY SALIDA!" },
    },
  },
  "15-3": {
    titulo: { rotulo: "LOCOMOTORA", juntos: "La locomotora de Don Silbato" },
    pista: { rotulo: "{pictograma:reto} RETO DE SILBATO", juntos: "Combina los vagones y el vapor para llegar hasta el maquinista." },
    siguiente: { juntos: "Seguir la melodía" },
  },
  "16-1": {
    titulo: { rotulo: "TAMBORES", juntos: "El jardín de los tambores" },
    pista: { rotulo: "{pictograma:musica} SIGUE LA MUSICA", juntos: "Empieza con un paseo tranquilo y cruza los puentes siguiendo la música." },
  },
  "16-2": {
    titulo: { rotulo: "CAMPANAS", juntos: "El bosque de las campanas" },
    pista: { rotulo: "{pictograma:musica} SALTA CON LA LUZ", juntos: "Las plataformas cambian de color al compás: salta cuando se enciendan." },
  },
  "16-3": {
    titulo: { rotulo: "TEATRO", juntos: "El gran teatro de Armonía" },
    pista: { rotulo: "{pictograma:reto} SALUDA A ARMONIA", juntos: "Sigue la música entre los tambores y llega al gran escenario para saludar a Armonía." },
    siguiente: { juntos: "Subir al Reino Celeste" },
  },
  "17-1": {
    titulo: { rotulo: "AMANECER", juntos: "Las nubes del amanecer" },
    pista: { rotulo: "{pictograma:nube} SUBE DE NUBE", juntos: "Sube de nube en nube o tira de la palanca para tomar el ascensor." },
  },
  "17-2": {
    titulo: { rotulo: "ESCALERA", juntos: "La escalera del cielo" },
    pista: { rotulo: "{pictograma:salta} SIGUE EL CENTRO", juntos: "El camino sigue por el centro. La palanca abre un camino más fácil en ascensor." },
  },
  "17-3": {
    titulo: { rotulo: "ESTRELLAS", juntos: "La puerta de las estrellas" },
    pista: { rotulo: "{pictograma:estrella} ALCANZA LA LUNA", juntos: "Alcanza la luna o tira de la palanca para subir en ascensor y conocer a Aurora Celeste." },
  },
  "S-1": {
    titulo: { rotulo: "NUBES", juntos: "El reino secreto de las nubes" },
    pista: { rotulo: "{pictograma:aire} SUBE POR EL AIRE", juntos: "Entra en las columnas de aire: suben suave. Sal a un lado para bajar." },
  },
} as const;
