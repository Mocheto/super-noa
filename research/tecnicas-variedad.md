# Técnicas de variedad en plataformas infantiles

Investigación para la issue [#57](https://github.com/Mocheto/super-noa/issues/57), hija del mapa [#55 «Variedad en la campaña»](https://github.com/Mocheto/super-noa/issues/55).

**Pregunta.** ¿Qué técnicas usan los plataformas pensados para niñas y niños pequeños (y los plataformas familiares) para que pantallas consecutivas no se sientan iguales?

**Alcance.** Solo se extraen *técnicas*. No se propone copiar personajes, niveles, música ni diseños concretos de ningún juego comercial. Las decisiones finales son de la persona usuaria; este documento solo aporta hechos y análisis.

## Punto de partida en Super Noa

- 17 mundos × 3 pantallas. La forma dominante es: avanzar a la derecha, saltar huecos y llegar a la meta. Después, el duelo del guardián.
- Cada mundo ya tiene su mecánica (lobos dormidos, puentes de flores, corrientes de aire, géiseres de arena, ascensores del cielo, plataformas al compás, perritos encadenados, chorros de lava, viento, natación, hielo, gotas que rebotan). Hay cinco desvíos secretos cortos y duelos rítmicos o de piedra, papel o tijera.
- El motor ya admite `orientation: "vertical"` con cámara que sube (`GameCanvas.tsx`), pero solo lo usa el mundo 17. Los desvíos ya traen `mechanisms` y `detourSwitches` (interruptores y mecanismos declarativos). Ambas cosas abaratan varias técnicas de abajo.
- Límites del mapa #55: apto para cinco años (sin contrarreloj que castigue, sin precisión fina obligatoria, siempre una salida amable), niveles declarativos, progreso `super-noa-progress-v1` compatible, solo moverse y saltar (los verbos nuevos, solo como acción automática al tocar algo), y el arte nuevo cuenta como coste porque se genera a mano.

## Qué dicen los referentes (resumen de hallazgos)

- **Una idea por pantalla, contada en cuatro tiempos.** Los análisis del diseño de Nintendo (Super Mario 3D Land/3D World) describen niveles construidos en torno a una sola mecánica que se presenta sin riesgo, se desarrolla, recibe un giro y se remata; lo relacionan con el *kishōtenketsu* y con Koichi Hayashida. Son fuentes secundarias, y hay quien discute que sea una regla universal ([Game Maker's Toolkit vía MCV](https://www.mcvuk.com/development/video-nintendos-level-design-secrets-in-four-steps), [Kotaku](https://kotaku.com/what-made-super-mario-3d-world-so-great-1691916400), [Nintendo Life](https://www.nintendolife.com/news/2015/03/video_nintendos_four_step_stage_design_is_why_you_love_super_mario_games_so_much), [réplica de Craig Perko](https://projectperko.blogspot.com/2017/06/level-design-theory.html)).
- **Un efecto sorpresa distinto en cada pantalla, y opcional.** En Super Mario Bros. Wonder cada pantalla principal tiene su propio efecto «Wonder»; el equipo diseñó cada pantalla para que fuera divertida con y sin el efecto, y se puede terminar sin tocarlo. El director lo justificó como forma de mantener la sorpresa. Hubo unas 2.000 ideas en notas adhesivas; se descartaron las que no conectaban bien el «antes» y el «durante» del efecto. La pantalla en silueta llegó al juego final ([NPR](https://www.npr.org/2023/08/31/1196990890/super-mario-bros-wonder-nintendo-prevew-interview), [Game Developer](https://gamedeveloper.com/business/super-mario-bros-wonder-devs-told-to-forget-about-franchise-staples-to-overcome-limitations-), [Digital Trends, charla GDC](https://digitaltrends.com/gaming/super-mario-bros-wonder-gdc-panel-wonder-effects), [GoNintendo](https://gonintendo.com/contents/27380-nintendo-talks-scrapped-super-mario-bros-wonder-ideas-including-a-live-action)).
- **Pantallas cortas de descanso y retos que enseñan.** Wonder intercala pantallas «Break Time!» con un objetivo sencillo y «Badge Challenge» que enseñan una habilidad en niveles graduados ([MarioWiki: Break Time!](https://www.mariowiki.com/Break_Time!_Wonder_Token_Tunes), [MarioWiki: Badge Challenge](https://mariowiki.com/Badge_Challenge_Floating_High_Jump_II)).
- **Salidas amables integradas en el diseño.** En Wonder, algunos personajes no reciben daño y en cooperativo un compañero puede rescatar a quien cae ([Nintendo, Ask the Developer](https://www.nintendo.com/sg/interview/aqmx/04.html)). En Kirby's Epic Yarn no hay vidas ni pantalla de fin de partida: caer o recibir daño solo hace perder cuentas ([GamesRadar](https://gamesradar.com/kirbys-epic-yarn-review), [Siliconera](https://www.siliconera.com/?p=93790)). Yoshi's Woolly World ofrece un modo tranquilo con alas que permiten planear sin límite, activable en cualquier momento ([MarioWiki](https://mariowiki.com/Mellow_Mode), [Siliconera](https://www.siliconera.com/yoshis-woolly-worlds-mellow-mode-can-still-offer-a-challenge/)).
- **Transformaciones contextuales en lugar de botones nuevos.** Epic Yarn cambia al personaje en vehículos u otras formas en tramos concretos ([Outcyders](https://outcyders.net/parents-guide/kirbys-epic-yarn)). En Kirby y la tierra olvidada, la transformación al tragar objetos se diseñó para ampliar el tipo de juego, y algunas pantallas nacieron de su tema visual (por ejemplo, avanzar con un desfile) ([Nintendo, Ask the Developer](https://www.nintendo.com/ph/interview/arzg/04.html), [Nintendo Life](https://www.nintendolife.com/news/2022/07/kirby-and-the-forgotten-land-developer-shares-the-origins-of-mouthful-mode), [Nintendo Wire](https://nintendowire.com/news/2022/03/24/kirby-and-the-forgotten-land-developers-didnt-want-kirby-to-suffer-by-giving-him-too-many-enemies-to-fight/)).
- **Vehículos con desplazamiento automático como cambio de ritmo.** En Donkey Kong Country las vagonetas eran un sobresalto de ritmo tras pantallas más pausadas; en las entregas modernas, vagonetas y barriles cohete son pantallas con desplazamiento automático donde solo se esquiva. La crítica las valora por variedad pero también señala picos de dificultad y prueba-error ([Indie Gamer Chick](https://indiegamerchick.com/2025/07/31/dkc1/), [MarioWiki: Rocket Rails](https://mariowiki.com/Rocket_Rails), [GameCola](https://gamecola.net/2016/09/the-lost-art-of-good-game-design-donkey-kong-country-tropical-freeze)).
- **Persecuciones y pantallas musicales.** Rayman Origins tiene persecuciones de un cofre que huye y termina parándose cuando no tiene a dónde ir; la crítica señala que exigen memorizar y castigan al rezagado ([RaymanPC Wiki](https://raymanpc.com/wiki/en/Tricky_Treasure_Temple), [God is a Geek](https://godisageek.com/2011/12/rayman-origins-review/)). Rayman Legends tiene pantallas musicales donde los saltos y golpes coinciden con la música y el escenario se diseña a partir de la pista ([Shacknews](https://shacknews.com/article/99305/wii-u-retrospective-rayman-legends), [Designing Sound](https://designingsound.org/2017/12/06/rayman-fun-sound-music-an-interview-with-francois-dumas/), [Game Developer](https://gamedeveloper.com/audio/the-musical-box-27-game-music-level-design)). Las reseñas de Sackboy destacan también sus pantallas musicales y la variedad de artilugios, aunque una critica que cada mundo repite la estructura del anterior ([Game Rant](https://gamerant.com/sackboy-a-big-adventure-review/), [NME](https://www.nme.com/reviews/sackboy-a-big-adventure-playstation-5-review-2818478)).
- **Ver la misma pantalla de otra forma.** Yoshi's Crafted World permite recorrer cada pantalla por su «cara oculta», con la búsqueda de objetos concretos; varias reseñas señalan que esa búsqueda frena el ritmo ([MarioWiki](https://www.mariowiki.com/Yoshi's_Crafted_World), [Nintendo Wire](https://nintendowire.com/news/2019/04/02/review-yoshis-crafted-world/)). Celeste esconde versiones «remix» más difíciles de cada capítulo (las «caras B»), que en desarrollo se llamaban así ([Wikipedia](https://en.wikipedia.org/wiki/Celeste_(video_game))).
- **Una limitación que crea pantallas compactas.** Captain Toad nació de la idea de dioramas con un personaje que no salta; sus responsables explican que esa limitación permitió pantallas mucho más compactas y tipo rompecabezas ([Wikipedia](https://en.wikipedia.org/wiki/Captain_Toad:_Treasure_Tracker), [Nintendo Everything](https://nintendoeverything.com/captain-toad-treasure-tracker-devs-on-the-games-creation/)).
- **Reutilizar una habilidad solo si cambia su uso.** El director de Astro Bot dice que cada pantalla debía tener una jugabilidad propia; una habilidad podía volver solo si su uso era claramente distinto, y se recortaron pantallas que repetían ideas ([GamingBolt](https://gamingbolt.com/astro-bots-vip-stages-were-originally-conceived-as-mini-stages-creative-direcor), [80.lv](https://80.lv/articles/astro-bot-dev-explained-why-the-creators-decided-to-make-it-short), [Game Developer](https://www.gamedeveloper.com/design/-it-s-okay-to-make-a-small-game-astro-bot-director-nicolas-doucet-says-tiny-ideas-contain-huge-potential?pubDate=20250321)).
- **Preescolares.** La motricidad fina madura más despacio que la gruesa; se recomiendan objetivos grandes y gestos tolerantes, y a los 4–6 años la frustración se proyecta sobre la experiencia ([UXPA](https://oldmagazine.uxpa.org/?p=11776), [A List Apart](https://alistapart.com/fig05-02-jpeg/), [Bryant et al., Game Studies](https://gamestudies.org/1001/articles/bryant_akerman_drell)). No se encontró investigación específica sobre temporizadores o fallo en esta edad; la recomendación de evitar contrarrelojes sale de la práctica de los referentes, no de un estudio.

## Cómo leer las fichas

- **Encaje de controles:** ✅ solo moverse y saltar · 🟡 necesita una acción automática al tocar algo · ❌ pide un verbo nuevo.
- **Apto para cinco años:** ✅ · 🟡 con condiciones (indicadas) · ❌.
- **Coste:** Bajo / Medio / Alto, separado en **arte** (piezas que hay que generar a mano) y **motor** (código fuera de `levels.ts`). «Solo datos» significa que basta con declarar la pantalla en `levels.ts`.

## 1. Formatos de pantalla

### 1.1 Ascenso vertical en otros mundos
- **Cómo funciona:** la pantalla sube en vez de avanzar a la derecha; la cámara sigue a Noa hacia arriba y la meta está arriba.
- **Por qué rompe la repetición:** cambia la dirección del recorrido y la lectura del espacio (mirar arriba, saltos de plataforma en plataforma). Muy reconocible para una niña.
- **Controles:** ✅. **Cinco años:** ✅ si caer solo devuelve al último punto de control vertical visible (ya existe `verticalCheckpoints`).
- **Coste:** motor Bajo (ya existe en el mundo 17); arte Medio (fondo vertical del bioma, aunque puede repetirse en mosaico o reutilizar capas).

### 1.2 Descenso
- **Cómo funciona:** se baja por un pozo, cascada o cueva; las plataformas están escalonadas hacia abajo, con cornisas que frenan.
- **Por qué rompe la repetición:** caer deja de ser el peligro y pasa a ser el avance; ritmo más relajado.
- **Controles:** ✅. **Cinco años:** ✅ si la caída nunca mata por altura y la cámara anticipa lo que hay debajo.
- **Coste:** motor Bajo-Medio (cámara que baja y regla de «caer fuera de cámara» invertida); arte Bajo-Medio (reutilizar atlas del mundo).

### 1.3 Persecución amable (Noa persigue)
- **Cómo funciona:** algo huye (un gatito travieso, un sombrero arrastrado por el viento) y Noa lo sigue; cuando no tiene a dónde ir, se detiene y se alcanza. Si Noa se queda atrás, lo que huye la **espera**.
- **Por qué rompe la repetición:** da un motivo narrativo inmediato y una sensación de velocidad sin cambiar los controles.
- **Controles:** ✅. **Cinco años:** ✅ en la versión «perseguir y que te espere». La versión clásica (te persigue algo que aplasta) es 🟡/❌: el rezagado pierde y la crítica la asocia a memorizar.
- **Coste:** motor Medio (actor con ruta declarativa de puntos y regla de espera); arte Bajo (un sprite animado; puede ser un personaje existente).

### 1.4 Desplazamiento automático o vehículo «solo saltar»
- **Cómo funciona:** Noa va en algo que avanza solo (vagoneta, trineo, barca, nube) y la niña solo salta para esquivar o recoger.
- **Por qué rompe la repetición:** cambia el ritmo de golpe y reduce los controles a un único gesto, lo que lo hace muy legible.
- **Controles:** ✅ (subir al vehículo es automático al tocarlo). **Cinco años:** 🟡: solo si no hay huecos mortales, los choques solo frenan o hacen rebotar, y la velocidad es baja. Los referentes muestran que esta forma tiende a picos de dificultad y prueba-error.
- **Coste:** motor Medio-Alto (modo de física y cámara con avance automático); arte Medio-Alto (vehículo con animación y tramo de terreno propio).

### 1.5 Exploración con objetivos para abrir la meta
- **Cómo funciona:** la pantalla es más ancha o tiene pisos; hay que encontrar 3 cosas (llaves, pollitos, farolillos) y entonces se abre la meta. Un contador y flechas suaves indican lo que falta.
- **Por qué rompe la repetición:** deja de ser una línea; hay que volver sobre los pasos y mirar.
- **Controles:** ✅. **Cinco años:** 🟡: el riesgo es perderse. Mitigar con pocos objetivos, brillos visibles y un indicador de dirección. Los referentes muestran que buscar objetos puede frenar el ritmo si se alarga.
- **Coste:** motor Bajo (contador de objetos y meta condicionada, declarativos); arte Bajo (reutilizar objetos y atlas).

### 1.6 Sala-rompecabezas compacta
- **Cómo funciona:** una sola vista sin desplazamiento (o dos), con interruptores que se pisan y plataformas que cambian. El reto es entender, no saltar con precisión.
- **Por qué rompe la repetición:** sustituye habilidad por descubrimiento; la limitación de espacio obliga a ideas distintas.
- **Controles:** ✅ (pisar o tocar activa). **Cinco años:** ✅ si las soluciones son de uno o dos pasos y nunca se puede quedar atrapada (botón o puerta para reiniciar la sala).
- **Coste:** motor Bajo (los desvíos ya traen `mechanisms` y `detourSwitches`); arte Bajo-Medio.

### 1.7 Ida y vuelta
- **Cómo funciona:** se llega al final, se recoge algo, y la pantalla cambia (sube el agua, se hace de noche, se abren caminos) para volver al inicio por otra ruta.
- **Por qué rompe la repetición:** la misma pantalla se juega dos veces de forma distinta; el cambio de estado es una sorpresa.
- **Controles:** ✅. **Cinco años:** ✅.
- **Coste:** motor Medio (estado de pantalla que conmuta capas de datos); arte Bajo (reutiliza el escenario, quizá un filtro de color).

### 1.8 Pantalla musical
- **Cómo funciona:** obstáculos, plataformas y enemigos se mueven al compás de la pista; saltar con la música resulta natural.
- **Por qué rompe la repetición:** el recorrido se siente como una canción; muy distinto a nivel sensorial.
- **Controles:** ✅. **Cinco años:** 🟡: el ritmo debe ser ayuda, no examen (plataformas que permanecen el tiempo suficiente, sin muerte por fallar el compás).
- **Coste:** motor Medio (el mundo de las plataformas al compás ya existe; falta ligar más elementos al reloj de audio); arte Bajo.

## 2. Objetivos alternativos

### 2.1 Rescatar y llevar a la meta
- **Cómo funciona:** al tocar a unos animalitos, estos siguen a Noa en fila; la meta cuenta cuántos llegan. Si recibe daño, se asustan un momento y esperan donde están.
- **Por qué rompe la repetición:** da un objetivo afectivo y cambia la forma de recorrer (volver a por los que faltan).
- **Controles:** ✅. **Cinco años:** ✅ si no se pierden nunca para siempre.
- **Coste:** motor Medio (seguidores con camino); arte Bajo-Medio.

### 2.2 Encender, pintar o despertar el escenario
- **Cómo funciona:** al pisar flores, faroles o piedras, el escenario recupera el color o la luz; la meta aparece cuando todo está encendido o basta con llegar y lo demás es extra.
- **Por qué rompe la repetición:** el progreso es visible en el propio mundo, no solo en la posición.
- **Controles:** ✅. **Cinco años:** ✅.
- **Coste:** motor Bajo-Medio (estado por objeto y filtro de color por zonas); arte Bajo (dos estados del mismo sprite).

### 2.3 Transportar algo
- **Cómo funciona:** Noa coge automáticamente un objeto al tocarlo (farol, semilla, pastel) y lo lleva; cambia algo mientras lo lleva (ilumina, abre puertas, se planta en la meta).
- **Por qué rompe la repetición:** añade un «verbo» sin botón y una consecuencia visible.
- **Controles:** 🟡 (coger y soltar automáticos). **Cinco años:** 🟡: si el objeto se cae, debe reaparecer cerca o volver solo.
- **Coste:** motor Medio; arte Bajo.

### 2.4 Retos opcionales por pantalla
- **Cómo funciona:** cada pantalla propone un reto extra visible (encontrar 3 estrellas, llegar sin que te toquen) que da una insignia o un adorno. Nunca bloquea el avance.
- **Por qué rompe la repetición:** la misma pantalla se puede jugar con otra intención; anima a repetir sin obligar.
- **Controles:** ✅. **Cinco años:** ✅ si son opcionales; el reto «sin daño» puede frustrar si se presenta como obligatorio.
- **Coste:** motor Bajo; arte Bajo. Ojo: afecta al progreso guardado, que tendría que ampliarse de forma tolerante.

## 3. Giros a mitad de pantalla

### 3.1 Estructura en cuatro tiempos dentro de cada pantalla
- **Cómo funciona:** la mecánica del mundo se presenta sin riesgo, se desarrolla, recibe un giro (se combina con otra cosa o se invierte) y se remata con lo aprendido.
- **Por qué rompe la repetición:** cada pantalla del mismo mundo tiene su propio giro, así que la mecánica no se repite igual tres veces.
- **Controles:** ✅. **Cinco años:** ✅.
- **Coste:** solo datos. Es la técnica más barata; requiere revisar las 45 pantallas con una plantilla.

### 3.2 Sorpresa opcional que cambia las reglas un rato
- **Cómo funciona:** un objeto mágico, visible y opcional, transforma la pantalla durante un tramo (todo flota, todo se vuelve gigante, el escenario pasa a siluetas, una estampida lleva a Noa); termina al alcanzar algo y la pantalla vuelve a la normalidad.
- **Por qué rompe la repetición:** es la técnica de los referentes diseñada explícitamente para la sorpresa por pantalla; al ser opcional no estorba a quien no la toca.
- **Controles:** ✅ o 🟡 según el efecto. **Cinco años:** ✅ si el efecto es lento y no añade peligros nuevos.
- **Coste:** variable. Bajo para efectos de parámetros o de dibujo (gravedad baja, siluetas, cámara alejada); Alto para efectos que cambian el escenario. Diseñar cada pantalla para que funcione con y sin efecto duplica trabajo de diseño.

### 3.3 Transformación contextual
- **Cómo funciona:** al tocar un objeto, Noa se convierte o se monta en algo (globo que sube, bola que rueda, hoja que planea) durante un tramo con reglas propias.
- **Por qué rompe la repetición:** cambia la física sin cambiar los botones.
- **Controles:** 🟡 (automática). **Cinco años:** ✅ si dura un tramo delimitado y sale sola.
- **Coste:** motor Medio-Alto por transformación; arte Medio-Alto (sprite de Noa transformada).

### 3.4 Cambio de estado del escenario
- **Cómo funciona:** un interruptor, la hora o el clima cambian el escenario a mitad de pantalla (sube la marea, cambia el viento, se congela el agua).
- **Por qué rompe la repetición:** la mitad final se juega distinta que la inicial con el mismo arte.
- **Controles:** ✅. **Cinco años:** ✅ si se anuncia y no atrapa a Noa.
- **Coste:** motor Medio (zonas declarativas con dos estados); arte Bajo.

### 3.5 Cruce de mecánicas entre mundos
- **Cómo funciona:** traer la mecánica de un mundo anterior a otro, pero con un uso distinto (corrientes de aire bajo el agua, plataformas al compás sobre lava).
- **Por qué rompe la repetición:** combina cosas conocidas en algo nuevo; los referentes reutilizan habilidades solo si su uso cambia de verdad.
- **Controles:** ✅. **Cinco años:** ✅ si se combinan solo dos cosas a la vez.
- **Coste:** solo datos o motor Bajo, si las mecánicas no dependen del tema; arte Bajo (sprites de la mecánica recoloreados).

## 4. Pantallas de descanso y ritmo de la campaña

### 4.1 Pantallas cortas de descanso
- **Cómo funciona:** pantalla de 20–40 segundos sin peligros: lluvia de manzanas, tobogán, columpios, un escenario para jugar. Aparece entre mundos o tras una pantalla intensa.
- **Por qué rompe la repetición:** alterna tensión y alivio; marca el paso de un mundo a otro.
- **Controles:** ✅. **Cinco años:** ✅ (ideal).
- **Coste:** motor Bajo; arte Bajo (reutiliza fondos). Requiere decidir cómo se desbloquean sin romper el progreso guardado.

### 4.2 Remix suave de una pantalla ya jugada
- **Cómo funciona:** una versión opcional de una pantalla conocida con un cambio claro (de noche, en espejo, con lluvia, con otra mecánica), desbloqueada por encontrar algo escondido. A diferencia de los remix de referentes, que son más difíciles, aquí sería distinta, no más difícil.
- **Por qué rompe la repetición:** aprovecha la familiaridad para sorprender.
- **Controles:** ✅. **Cinco años:** ✅ si no sube la dificultad.
- **Coste:** solo datos y arte Bajo. Riesgo: si se abusa, se percibe como relleno.

### 4.3 Regla de ritmo: no repetir formato seguido
- **Cómo funciona:** planificar la campaña como una partitura: tras una pantalla larga y lineal, otra de forma distinta; reservar formatos llamativos (vehículo, persecución) como sorpresas espaciadas.
- **Por qué rompe la repetición:** la variedad se percibe por contraste entre pantallas consecutivas, no por el número total de ideas.
- **Controles / cinco años:** ✅.
- **Coste:** cero motor; es una regla de planificación que puede añadirse a `AGENTS.md`.

### 4.4 Retos que enseñan
- **Cómo funciona:** pantallas cortas opcionales que enseñan y practican una sola habilidad, en dos niveles de dificultad.
- **Por qué rompe la repetición:** separa aprender de jugar la campaña; ofrece algo distinto a quien quiere repetir.
- **Controles:** ✅. **Cinco años:** ✅ en el primer nivel; el segundo, opcional.
- **Coste:** motor Bajo; arte Bajo.

## 5. Presentación que cambia cómo se juega

### 5.1 Siluetas
- **Cómo funciona:** un tramo se dibuja como sombras recortadas contra un fondo luminoso.
- **Por qué rompe la repetición:** la misma geometría se percibe como otra pantalla; muy llamativo.
- **Controles:** ✅. **Cinco años:** 🟡: Noa, los peligros y la meta deben conservar un contorno o color distinguible.
- **Coste:** motor Bajo (filtro en `rendering.ts`); arte Bajo o nulo.

### 5.2 Oscuridad con luz alrededor de Noa
- **Cómo funciona:** solo se ve un círculo alrededor de Noa o de faroles que se encienden; luciérnagas o farolillos amplían la luz.
- **Por qué rompe la repetición:** obliga a explorar con calma.
- **Controles:** ✅. **Cinco años:** 🟡: la oscuridad puede dar miedo; mantener un círculo grande, colores cálidos y peligros siempre iluminados.
- **Coste:** motor Bajo-Medio (máscara radial en Canvas); arte Bajo.

### 5.3 Cámara: alejar, acercar o cámara por salas
- **Cómo funciona:** alejar la cámara en tramos amplios, acercarla en momentos íntimos o fijarla por salas.
- **Por qué rompe la repetición:** cambia la sensación de escala y de lectura.
- **Controles:** ✅. **Cinco años:** ✅ si los objetos siguen siendo grandes.
- **Coste:** motor Medio (escala de cámara y su efecto en dibujo y colisiones de pantalla); arte Bajo (pero el arte debe aguantar el zoom).

### 5.4 Clima con efecto en el juego
- **Cómo funciona:** la lluvia hace crecer plataformas de flores, la nieve deja huellas que marcan el camino, la niebla oculta y descubre.
- **Por qué rompe la repetición:** el clima pasa de decoración a regla.
- **Controles:** ✅. **Cinco años:** ✅.
- **Coste:** motor Medio; arte Bajo-Medio.

### 5.5 Primer plano y fondo
- **Cómo funciona:** puertas o tuberías llevan a Noa a una capa del fondo (o a la «parte de atrás» del escenario).
- **Por qué rompe la repetición:** duplica el espacio y la sensación de descubrimiento.
- **Controles:** ✅ (cambio automático al tocar la puerta). **Cinco años:** ✅.
- **Coste:** motor Alto (dos capas de colisión y dibujo escalado); arte Alto.

## Tabla resumen

| Técnica | Controles | Cinco años | Arte | Motor |
|---|---|---|---|---|
| 1.1 Ascenso vertical | ✅ | ✅ | Medio | Bajo |
| 1.2 Descenso | ✅ | ✅ | Bajo-Medio | Bajo-Medio |
| 1.3 Persecución amable | ✅ | ✅ (Noa persigue) | Bajo | Medio |
| 1.4 Vehículo «solo saltar» | ✅ | 🟡 | Medio-Alto | Medio-Alto |
| 1.5 Exploración con objetivos | ✅ | 🟡 | Bajo | Bajo |
| 1.6 Sala-rompecabezas | ✅ | ✅ | Bajo-Medio | Bajo |
| 1.7 Ida y vuelta | ✅ | ✅ | Bajo | Medio |
| 1.8 Pantalla musical | ✅ | 🟡 | Bajo | Medio |
| 2.1 Rescatar y llevar | ✅ | ✅ | Bajo-Medio | Medio |
| 2.2 Encender o pintar | ✅ | ✅ | Bajo | Bajo-Medio |
| 2.3 Transportar algo | 🟡 | 🟡 | Bajo | Medio |
| 2.4 Retos opcionales | ✅ | ✅ | Bajo | Bajo |
| 3.1 Cuatro tiempos | ✅ | ✅ | — | Solo datos |
| 3.2 Sorpresa opcional | ✅/🟡 | ✅ | Bajo-Alto | Bajo-Alto |
| 3.3 Transformación | 🟡 | ✅ | Medio-Alto | Medio-Alto |
| 3.4 Cambio de estado | ✅ | ✅ | Bajo | Medio |
| 3.5 Cruce de mecánicas | ✅ | ✅ | Bajo | Solo datos-Bajo |
| 4.1 Descanso corto | ✅ | ✅ | Bajo | Bajo |
| 4.2 Remix suave | ✅ | ✅ | Bajo | Solo datos |
| 4.3 Regla de ritmo | ✅ | ✅ | — | — |
| 4.4 Retos que enseñan | ✅ | ✅ | Bajo | Bajo |
| 5.1 Siluetas | ✅ | 🟡 | Nulo-Bajo | Bajo |
| 5.2 Oscuridad con luz | ✅ | 🟡 | Bajo | Bajo-Medio |
| 5.3 Cámara | ✅ | ✅ | Bajo | Medio |
| 5.4 Clima con efecto | ✅ | ✅ | Bajo-Medio | Medio |
| 5.5 Primer plano y fondo | ✅ | ✅ | Alto | Alto |

## Lista corta para Super Noa

Ordenada por relación entre efecto en la variedad y coste. Es análisis, no decisión.

1. **Cuatro tiempos dentro de cada pantalla (3.1).** Coste casi nulo, se aplica a las 45 pantallas existentes y ataca la causa principal: que la mecánica del mundo se repite igual tres veces.
2. **Ascenso vertical (y descenso) en otros mundos (1.1, 1.2).** El motor ya existe en el mundo 17; da una forma distinta muy reconocible a cualquier mundo.
3. **Exploración con objetivos para abrir la meta (1.5).** Motor bajo y arte reutilizado; rompe la línea recta. Mantener pocos objetivos y bien señalados.
4. **Sala-rompecabezas compacta (1.6).** Reutiliza los mecanismos e interruptores de los desvíos; cambia habilidad por descubrimiento, que encaja con la edad.
5. **Persecución amable donde Noa persigue (1.3).** Un solo sprite y un actor con ruta; da emoción sin castigo si lo que huye espera.
6. **Pantallas cortas de descanso (4.1).** Baratas, muy aptas para cinco años y ordenan el ritmo de la campaña; la pieza delicada es el desbloqueo compatible con el progreso.
7. **Regla de ritmo «no repetir formato seguido» (4.3).** Coste cero y necesaria para que el resto se perciba; además encaja como regla de diseño para mundos futuros en `AGENTS.md`.
8. **Sorpresa opcional con efectos baratos (3.2 + 5.1).** Empezar por efectos de dibujo o parámetros (siluetas, gravedad baja, cámara alejada) da mucha sorpresa por poco arte; los efectos caros pueden esperar.
9. **Vehículo «solo saltar» sin huecos mortales (1.4), como sorpresa escasa.** Es el cambio de ritmo más fuerte y encaja con un solo gesto, pero es el más caro en arte y motor y el más propenso a picos de dificultad; conviene reservarlo para uno o dos mundos.

Técnicas descartadas o aplazadas por coste o encaje: primer plano y fondo (5.5, coste alto), transformaciones con sprite propio de Noa (3.3, arte alto) y persecución clásica donde algo persigue a Noa (1.3 en su forma clásica, castiga al rezagado).
