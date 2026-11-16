# Investigación: «Feeding the beast» y otros juegos de dar de comer al compás

Ticket: [#46](https://github.com/Mocheto/super-noa/issues/46) · Mapa: [#45](https://github.com/Mocheto/super-noa/issues/45)

Fecha: 2026-11-17. Solo se extraen lecciones de diseño para **La merienda de los jabatos**. No se copia ningún personaje, sonido, música, gráfico ni secuencia.

## Respuesta corta

- En «Feeding the Beast» (Rhythm Heaven Groove, 2026), Dino está en una colina. En la colina de enfrente, unas flores se abren y lanzan comida en forma de corazón. Dino tiene que morder **dos pulsos después del lanzamiento**, cuando la comida le llega a la boca.
  - Si muerde antes o después de tiempo, el corazón sale despedido detrás de las colinas.
  - Si no muerde, el corazón cae en la colina, y eso también es un fallo.
- El **aviso** es visual y sonoro a la vez: la flor se abre y lanza la comida. La **forma de la flor** anticipa qué tipo de comida va a salir.
  - En la segunda versión (Stage 15) aparecen flores nuevas cuya comida tarda más en caer. Eso supone una espera más larga antes del mordisco.
  - En esa versión también es fallo morder cuando no hay comida.
- Las guías y los foros señalan dos cosas:
  - Se puede jugar casi a reflejos, mirando la trayectoria.
  - La dificultad principal es no despistarse cuando hay muchos proyectiles a la vez.
- Para una niña de cinco años que juega más por la vista que por el oído, la lección principal es **una cuenta atrás visible pulso a pulso**: la boca se abre por etapas y está abierta del todo justo en el pulso del bocado. Una espera más larga se reserva para la criatura grande. Los trucos tienen que ser mínimos y evidentes.

## Grado de confianza

Los datos concretos de Groove son **escasos**. Proceden de wikis de aficionados y guías de terceros, no de Nintendo, y no hay ninguna tabla de pulsos por tipo de flor.

| Dato | Confianza | Fuente |
|---|---|---|
| Dino muerde dos pulsos después de que la flor lance el corazón | Media-alta: dos wikis coinciden | Fandom, rhwiki.net |
| Si falla, el corazón sale despedido detrás de las colinas; si no muerde, el corazón cae en la colina y cuenta como fallo | Media | Fandom (vía buscador) |
| «Feeding the Beast 2» (Stage 15) tiene flores nuevas con comida que tarda más en caer | Media | Fandom |
| En la 2 también es fallo morder sin comida | Media-baja | Fandom (vía buscador) |
| La forma de la flor anticipa el proyectil; hay muchos proyectiles a la vez y el reto es no despistarse | Media | Gamereactor |
| Es el último juego del Stage 1 | Media | Gamereactor, Game Informer |
| Hay tramos que se aceleran | **Baja**: guía de calidad dudosa | rhythmheavengroovegame.wiki |
| Cuántos pulsos espera exactamente cada flor de la versión 2 | **Sin datos** | — |
| Tempo (BPM), duración y sonido exacto del aviso | **Sin datos** | — |
| Se puede jugar casi sin sentir el ritmo | Opinión de un jugador | Foro de Nintendo Life |

Las páginas de las wikis no se pudieron abrir directamente (402, 403 y 502). Lo que contienen se ha leído a través de los extractos del buscador. Para concretar más habría que ver una partida grabada. Esta investigación no lo ha hecho.

## Otros minijuegos de dar de comer, recoger o lanzar al compás

Todos son de la serie Rhythm Heaven, salvo el último de la lista.

- **Yum-Bot Simulator** (Groove):
  - Un pastel tembloroso suena con dos pitidos y se recoge unos dos pulsos después, a mitad de caída.
  - Un pastel «malo» pide otra acción, un rayo láser, un pulso después de los pitidos.
  - Es decir: un mismo aviso y dos respuestas, según el aspecto del objeto.
- **Flutter Speed** (Groove): cada criatura tiene su propia espera.
  - La mariposa rosa se caza en el tercer pitido.
  - El saltamontes, en el cuarto pulso.
  - En la versión avanzada, la libélula se caza cuatro pulsos después de pararse delante.
  - Es decir: la especie indica la espera.
- **Slice N Dice Kitchen** (Groove): el balanceo del cocinero marca el ritmo y un sonido anuncia qué verdura llega. Los brócolis llegan de tres en tres, muy seguidos, y piden una respuesta propia.
- **Munchy Monk** (DS; en Fever como juego sin fin):
  - Una voz canta la cantidad, «¡Tres!», y luego «¡Ya! ¡Ya! ¡Ya!». El monje come en cada «¡Ya!».
  - Las bolas rosas van de dos en dos, con dos golpes rápidos.
  - Es decir: el aviso dice cuántos bocados vienen.
- **Catchy Tune** (Megamix):
  - La fruta baja botando por una escalera, un bote por pulso, y se recoge al final.
  - La naranja tarda un compás.
  - La piña, que es más grande, tarda dos (Eurogamer; una wiki de aficionados da otros números).
  - Es decir: cada bote visible es una cuenta atrás, y el objeto grande espera más.
- **LumBEARjack** (Megamix): troncos de varios tamaños para cortar. No se han encontrado los pulsos de cada tamaño.
- **Bits & Bops** (2024, otro estudio): incluye un minijuego en el que se da de comer a un caimán en un zoo. No se han encontrado detalles de su mecánica.

## Lecciones de diseño para La merienda de los jabatos

Todo lo que sigue es una propuesta propia. Se deciden en los tickets siguientes del mapa.

1. **Aviso doble, sonido y gesto, sobre un pulso entero.**
   - El Gran Jabalí llama («¡oinc!» o un silbido propio) y a la vez hace un gesto con el hocico o la pata hacia la madriguera de la que asoma el jabato.
   - Esto encaja con el Empuje y el Vuelo de los duelos anteriores: también avisan con un sonido en su pulso, dos pulsos antes del golpe.
2. **Bellota: el bocado llega dos pulsos después de la llamada.**
   - Es la misma distancia que en «Feeding the Beast» y que en los gatitos y la abeja ninja, así que ya es familiar.
   - Cada pulso intermedio tiene que verse:
     - Pulso 0: llamada y el jabato asoma.
     - Pulso 1: el jabato olfatea y empieza a abrir la boca.
     - Pulso 2: la boca abierta del todo y el golpe.
   - Esta cuenta atrás visible es lo que hace legible el juego para quien juega por la vista. Es la lección de los botes de Catchy Tune.
3. **Castaña grande y jabato grande: espera más larga y distinta a simple vista.**
   - Igual que la piña o las flores nuevas de la versión 2, lo grande tarda más. Una propuesta: cuatro pulsos, un compás entero.
   - Hace falta otra llamada (más grave y más larga) y otro tamaño.
   - Se puede añadir un gesto intermedio por pulso (barriga que suena, babero...), para que la niña no pulse en el segundo pulso por costumbre.
   - Con un solo botón, la variedad viene de **cuándo** se pulsa, no de qué se elige. Eso cumple el requisito del mapa.
4. **Dobles con moderación.**
   - Dos jabatos llamados seguidos dan dos bocados en pulsos consecutivos, como las bolas rosas o los brócolis.
   - Solo en la segunda mitad y con la llamada repetida («¡oinc-oinc!») para que se oiga y se vea que son dos.
   - Para una niña de cinco años, nunca más de dos seguidos.
5. **Trucos: mejor ninguno, o uno muy evidente.**
   - En Groove los trucos piden **otra acción**: el pastel malo o la comida que tarda más. Con un solo botón, el único truco posible es «no pulses»: un jabato que asoma pero bosteza o se da la vuelta sin abrir la boca.
   - «Feeding the Beast 2» castiga morder sin comida. Para nuestra jugadora, recomendamos que un golpe sin jabato **no cuente como fallo**: la bellota rueda y no pasa nada. Como mucho, que cuente en el reto `perfect-game`.
6. **Una sola cosa en vuelo al principio.**
   - La dificultad de «Feeding the Beast» está en los muchos proyectiles a la vez.
   - Nosotros deberíamos empezar con un jabato cada vez y solapar llamadas (uno come mientras otro asoma) solo más adelante y con madrigueras separadas a izquierda y derecha.
7. **Un fallo que se vea, pero amable.**
   - En Groove, el fallo se muestra con la comida despedida o caída.
   - Propuesta propia:
     - Si llega pronto o tarde, la bellota rebota en el hocico y rueda, y el jabato pone cara de pena.
     - Si no se pulsa, el jabato cierra la boca vacía y se esconde.
     - Si se acierta, un «¡ñam!» con los mofletes hinchados.
   - El fallo no debe asustar ni sonar fuerte.
8. **Tempo y duración: los decidimos nosotros.**
   - No hay datos fiables del tempo ni de la duración de «Feeding the Beast».
   - Conviene usar los valores de los duelos anteriores del proyecto: un tempo tranquilo y una canción continua de alrededor de un minuto.
   - Que no se acelere (el único dato de tramos acelerados es de baja confianza), salvo quizá en el reto.
9. **Que se pueda jugar «por reflejos» no es un defecto aquí.**
   - Un jugador echa de menos el ritmo en «Feeding the Beast». Para una niña que juega por la vista, eso es justo lo que la ayuda.
   - Aun así, la llamada y el bocado caen siempre en pulsos enteros, para que quien escuche también vaya bien.

## Qué no se toma

No se toman dinosaurios, flores que lanzan comida, corazones, colinas enfrentadas, sonidos, música ni el orden de las secuencias de ningún minijuego citado. Solo se toman principios generales: aviso y golpe a una distancia fija, una espera más larga para lo grande, una cuenta atrás visible y un fallo que se vea.

## Fuentes

- Gamereactor, guía para conseguir «Perfect» en los 30 minijuegos de Rhythm Paradise Groove: https://www.gamereactor.eu/rhythm-paradise-groove-guide-how-to-perfect-all-30-base-solo-mini-games-1741843/
- Rhythm Heaven Wiki (Fandom), Feeding the Beast: https://rhythmheaven.fandom.com/wiki/Feeding_the_Beast (leída solo mediante extractos del buscador)
- Rhythm Heaven Wiki (Fandom), Feeding the Beast 2: https://rhythmheaven.fandom.com/wiki/Feeding_the_Beast_2 (extractos)
- Rhythm Heaven Wiki (rhwiki.net), Feeding the Beast: https://rhwiki.net/wiki/Feeding_the_Beast (extractos)
- Game Informer, avance de Rhythm Heaven Groove: https://gameinformer.com/preview/2026/06/11/toe-tapping-along-with-minigames-and-an-all-new-rhythm-based-rpg-mode
- Press Start, análisis (reto «Perfect» de Feeding the Beast): https://press-start.com.au/reviews/nintendo-switch-2-reviews/2026/07/01/rhythm-paradise-groove-review-just-the-right-amount-of-challenge/
- Foro de Nintendo Life sobre Rhythm Heaven Groove: https://www.nintendolife.com/forums/nintendo-switch/rhythm_heaven_groove?start=20
- Guía de «Perfect» (baja confianza): https://rhythmheavengroovegame.wiki/guide/perfect/
- Rhythm Heaven Wiki (Fandom), Munchy Monk: https://rhythmheaven.fandom.com/wiki/Munchy_Monk (extractos)
- Eurogamer, análisis de Rhythm Paradise Megamix (Catchy Tune), a través de un espejo: https://st2.moderno.dk/rhythm-paradise-megamix-review-eurogamer-net.html
- Super Mario Wiki, Rhythm Heaven Megamix: https://www.mariowiki.com/Rhythm_Heaven_Megamix
- Vice, sobre Rhythm Paradise Megamix (LumBEARjack): https://vice.com/en/article/the-pick-me-up-rhythm-paradise-megamix
- LadiesGamers, análisis de Bits & Bops: https://ladiesgamers.com/bits-bops-review/
