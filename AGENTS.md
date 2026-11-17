# Guía para agentes

## Tracker del proyecto

- Usa siempre GitHub Issues de https://github.com/Mocheto/super-noa/issues como tracker de este repositorio, también para wayfinder. No crees un tracker local alternativo.
- Consulta [las operaciones de wayfinder](docs/wayfinder-tracker.md) para mapas de decisiones, issues hijas, dependencias y selección de la frontera.

## Arquitectura

Super Noa es un juego React/Vite de plataformas dibujado sobre Canvas 2D.

- `src/App.tsx`: navegación, HUD, música, modales y pausa automática al perder visibilidad o foco; `src/game/music.ts`: motor de audio y gestión de pistas.
- `src/game/progress.ts`: lectura, validación, migración y escritura del progreso local; `src/game/storage.ts`: acceso seguro al almacenamiento local, incluso si el navegador lo bloquea.
- `src/game/GameCanvas.tsx`: coordinación de la partida, física y estado de cada pantalla.
- `src/game/gameState.ts`, `src/game/gameplay.ts` y `src/game/constants.ts`: tipos de estado (`Rect`, `Theme`, `Level`), reglas de movimiento y dimensiones del Canvas.
- `src/game/input.ts`: teclado y controles táctiles; `src/game/gameLoop.ts`: física en pasos fijos y pausa del renderizado.
- `src/game/levels.ts`: definición declarativa de los trece mundos de campaña, tres acuáticas y una pantalla secreta de las nubes, rutas especiales, cajas, cañones y encuentros; `src/game/routes.ts`: resolución del avance y desbloqueo a partir de esos datos.
- `src/game/WorldMap.tsx` y `src/game/worldMapData.ts`: mapa ilustrado, mecánicas, marcadores, caminos según el progreso, cuadros de resumen y coordenadas del mapa.
- `src/game/rendering.ts`: dibujo de escenarios, objetos, terreno, enemigos, jefe y efectos sobre Canvas 2D.
- `src/game/assets.ts`: carga diferida por mundo y reutilización de imágenes, atlas, sprites y música.
- `src/game/secretShop*.ts` / `src/game/SecretShop.tsx`: tienda de minijuego gatito con su progreso, estado de juego, runtime, sprites de gatos por mundo y arte de puertas.
- `src/game/secretDoors.css` y `src/game/secretShop.css`: estilos de la tienda y puertas secretas.
- `src/game/secretShopGame.ts`, `src/game/secretShopRuntime.ts`, `src/game/secretShopCats.ts`, `src/game/secretShopProgress.ts`: lógica de juego, estado, gatos y progreso de la tienda.
- `src/game/starPowerVisuals.ts` y `src/game/detour*.ts` / `src/game/detours.css`: efectos visuales de protección, mecánica de desvíos y progreso.
- `src/game/santaBattle.ts`, `src/game/santaBattleAssets.ts`, `src/game/santaBattleRendering.ts` y `src/game/SantaBossBattle.tsx`: batalla navideña contra Papá Noel, renderizado y assets.
- `src/game/BossBattle.tsx`, `src/game/GuardianMiniGame.tsx` y `src/game/guardianGames.ts`: doce duelos de piedra, papel o tijera contra los guardianes.
- `src/game/beeNinja.ts` y `src/game/BeeNinjaGame.tsx` / `src/game/beeNinja.css`: «La abeja ninja», duelo rítmico de la Reina Melisa (partitura en pulsos, cortes, raya dorada, pausa con cuenta y música «jardín ninja» sobre el reloj de audio con samples de `src/game/beeNinjaSamples.ts`). Su arte sale de `prototypes/tools/abeja-ninja-recorte.py` y sus samples de `prototypes/tools/abeja-ninja-samples.py`.
- `src/game/armoniaDrum.ts` y `src/game/ArmoniaDrumGame.tsx` / `src/game/armoniaDrum.css`: «El tambor de Armonía», duelo de llamada y respuesta de la Maestra Armonía (partitura de parejas en pulsos, huellas en los parches, atril con raya dorada, pausa con cuenta y «marcha de teatro» generada sobre el reloj de audio). Su arte v0 sale de `prototypes/tools/tambor-armonia-arte.py`.
- `src/game/meriendaJabatos.ts` y `src/game/MeriendaJabatosGame.tsx` / `src/game/meriendaJabatos.css`: «La merienda de los jabatos», duelo rítmico del Gran Jabalí en la 4-3 (partitura de llamadas en pulsos con jabatos pequeño, grande y glotón, cuenta atrás de puntos, rama de bellotas con raya dorada, pausa con cuenta y música «merendero del bosque» generada sobre el reloj de audio). Su arte sale de `prototypes/tools/merienda-recorte.py`.
- `src/game/CatPartyGame.tsx`, `src/game/catParty.ts` y `src/game/catPartyArt.ts`: «La fiesta de los gatitos» (partitura en pulsos, escena de 960 × 540 y medidas del arte final, que sale de `prototypes/tools/gatitos-recorte.py`).
- `src/game/chainGuardians.ts` y `src/game/mechanicSprites.ts`: perritos encadenados del castillo y sprites de mecánicas.
- `src/game/stickers.ts`: catálogo estable de 36 insignias coleccionables; `src/game/worldEnemySprites.ts`: sprites troquelados de enemigos por mundo.
- `src/game/worldMechanics.ts`: mecánicas por mundo.
- `src/game/ranking*.ts`: tablón mundial con alias, envío, recuperación y onboarding.
- `src/game/levelTransition.ts`, `src/game/levelSelectCard.tsx` y `src/game/levelObjectives.ts`: transiciones entre pantallas, tarjetas del selector de niveles y objetivos/pistas.
- `src/game/levelBeats.ts`: cuatro tramos de pantalla (`Level.beats`), huecos y salientes, anticopia entre pantallas, alcanzabilidad con 190/310 px y posición de las mecánicas; sus pruebas llevan la lista de mundos pendientes de retoque.
- `src/game/puzzleRooms.ts`, `src/game/puzzleRoomsRendering.ts` y `src/game/puzzleRooms.css`: formato sala-rompecabezas (`Level.puzzleRooms`): salas de 960 px con cámara fija, botón de huella, placa, botones de color, cajón, puertas con emblema, «Empezar la sala» (botón y tecla R) sin perder vidas, y dibujo con el atlas `puzzle-pieces-v1`.
- `src/game/chase.ts` y `src/game/chaseRendering.ts`: formato persecución amable (`Level.chase`): el animal travieso corre a 330 px/s de parada en parada, espera a Noa (radio de 230 × 150 px), deja un rastro, avisa con una flecha en el borde y se le pilla en el rincón, que sustituye a la bandera.
- `src/game/explore.ts` y `src/game/exploreRendering.ts`: formato exploración (`orientation: "explore"`): mundo abierto con cámara en dos ejes, tres gatitos perdidos (`lostKittens`, dibujos `world-cat-*`), maullido a 520 px, flecha tras 20 s, gatitos que siguen a Noa, puerta de los gatitos (`exploreGate`) y atajo (`exploreShortcut`) que se abre con los tres; puntos seguros en `verticalCheckpoints`.
- Pantallas verticales (`orientation: "vertical"`): además del cielo del mundo 17 sirven como formato vertical de campaña, con cajas, enemigos, peligros de mundo y `verticalCheckpoints`; solo el mundo 17 conecta los dos bordes. Sus pruebas están en `src/game/verticalScreens.test.ts`.
- `src/game/restStops.ts` y `src/game/restStopProgress.ts`: paseo de los amigos (`P-<mundo>`, `Level.restStop`): pantalla de descanso opcional tras el guardián, con suelo continuo y sin peligros, amigos que saludan con «¡Aquí no muerde!» y el guardián que se despide; se ofrece al ganar el duelo y queda como marcador en el mapa; el progreso guarda visitas y saludos en `restStops`.
- `src/game/testScreens.ts`: pantallas de prueba de los motores de formato, fuera de la campaña; en desarrollo se abren con `?prueba=<nombre>` (`salas`, `persecucion`, `vertical`, `exploracion`) y también cualquier pantalla de campaña por su identificador (`?prueba=12-2`).
- `src/game/touchControls.tsx`, `src/game/TouchControls.tsx` y `src/game/Dialog.tsx`: controles móviles, interfaz y diálogos.
- `src/game/GameAssetIcon.tsx` y `src/game/PixelIcon.tsx`: iconos de assets y pixeles.
- `server/ranking-server.mjs`: API y migraciones del tablón; `server/ranking-supervisor.mjs`: supervisor que descarga y activa automáticamente el backend del último commit de `main`, con recuperación si falla.
- `src/game/types.ts`: tipos del motor y extensión futura.
- `src/styles.css` y `src/game/secretDoors.css`, `src/game/secretShop.css`, `src/game/detours.css`: estilos generales y de subcaracterísticas.
- `public/assets/`: ilustraciones por mundo, atlas, sprites, hojas de animación, música y arte de la tienda.

## Reglas

- Mantén los textos visibles en español y adecuados para una niña de cinco años.
- No copies recursos, niveles, música, sonidos o personajes de Nintendo ni de otros juegos comerciales.
- Conserva rutas relativas (`./assets/...`) para que funcione tanto en el dominio propio como bajo una subruta de GitHub Pages.
- El progreso usa la clave `super-noa-progress-v1`. El formato actual declara `version: 2`; amplíalo de forma tolerante a campos ausentes y conserva la migración de guardados anteriores.
- Las fotografías de referencia son privadas: no deben copiarse al repositorio, al sitio ni a documentación pública.
- Los datos de niveles y sus rutas especiales deben permanecer declarativos para poder incorporar pantallas y coleccionables sin cambiar el motor.
- Conserva caminos y marcadores del mapa como elementos interactivos superpuestos; no los incrustes en la ilustración de fondo.
- No edites manualmente `dist-pages/`; es un artefacto generado.
- Conserva la atribución musical y la licencia de `CREDITS.md`.
- Para añadir un mundo, incorpora sus tres niveles declarativos y su ruta en `levels.ts`, amplía los tipos de mundo/tema/plataformas/enemigos, añade marcador y camino en `worldMapData.ts`, registra música y carga diferida de recursos, crea tres insignias y un guardián final, y actualiza los límites del ranking. Los atlas propios de enemigos y jefe pueden compartir una cuadrícula de cinco columnas por dos filas: enemigos arriba y las cinco poses del jefe abajo.
- Publica cada cambio validado: tras ejecutar las comprobaciones, crea un commit, súbelo a `main` y confirma que el despliegue de GitHub Pages termina correctamente, salvo que la persona usuaria indique expresamente que no se publique.
- El contenedor del ranking debe arrancar `ranking-supervisor.mjs`, no directamente `ranking-server.mjs`. El supervisor consulta `main` cada cinco minutos (`RANKING_UPDATE_INTERVAL_MS` permite cambiarlo), descarga los archivos usando un SHA inmutable, valida su sintaxis y reinicia únicamente el proceso Node. No recrea el contenedor ni modifica el volumen o PostgreSQL.

## Verificación

Después de cambios ejecuta:

```bash
npm run lint
npm run build:pages
```

Ejecuta también `npm run test:logic` cuando cambien reglas, niveles, recursos, entrada, bucle o progreso.

Antes de publicar comprueba las treinta pantallas de campaña, las tres acuáticas y el reino secreto de las nubes, doble salto, natación, muelles, niebla, avisos de lobos y jabalíes, ruta secreta por las copas, barcos voladores, piratas, loros, cañones, pasillos y pinchos del castillo, la isla tropical, t-rex pequeños, terodáctilos y agua mortal, el volcán y su lava, el rebote en gotas del valle, el deslizamiento en la montaña de hielo, pájaros, unicornios, pegatinas y álbum, los doce duelos, la abeja ninja de la Reina Melisa (práctica, cortes al compás, mariquitas, raya dorada, pausa con cuenta de cuatro y revancha), el tambor de Armonía (práctica, llamada y respuesta, huellas, atril con raya dorada, pausa con cuenta de cuatro y revancha), la merienda de los jabatos del Gran Jabalí (práctica, llamadas del pequeño, el grande y el glotón, cuenta atrás de puntos, bocados al compás, «fsss» sin castigo, rama con raya dorada, pausa con cuenta de cuatro y revancha), rendirse y volver al mapa, el reintento gastando una manzana y el reinicio sin manzanas, cajas golpeadas desde abajo, pérdida de vidas y reaparición con tres vidas, checkpoints, manzana, gato, lana, rescate final del gatito, progreso, sonido, teclado, controles táctiles, mando en los duelos y pausa automática al ocultar la pestaña o perder el foco.

## Cómo añadir un mundo

1. Añade el identificador del mundo y sus variantes a `types.ts` (`Theme`, `Level.world`, enemigos, terreno y jefe si procede). Mantén los niveles, peligros, rutas y recompensas como datos declarativos en `levels.ts`. Registra el arte y la música en `assets.ts` y `App.tsx`.
2. Crea tres pantallas con identificadores estables, una pegatina por pantalla, checkpoints sobre suelo seguro y una ruta explícita desde el final del mundo anterior. Solo la última pantalla de la campaña debe usar `route.finale`; las anteriores deben enlazar con `route.next` cuando el orden del array no sea suficiente.
3. Guarda arte original en `public/assets/`: ilustración en `worlds/`, atlas de terreno y enemigos en `atlases/`, gato y cinco poses del jefe en `sprites/`, y atlas horizontal RGBA de tres pegatinas en `stickers/`. Los atlas de terreno deben tener fondo transparente y separar suelo repetible, plataforma flotante y pared en zonas de recorte estables; registra esos recortes en `rendering.ts`, evita fondos rectangulares de color y coloca la superficie transitable en el borde visual superior del césped, roca o hielo. Usa siempre rutas `./assets/...`.
4. Añade el dibujo del tema, terreno, peligros y enemigos en `rendering.ts`; añade la colisión del peligro en `GameCanvas.tsx` y cualquier movimiento especial en `gameState.ts` o `gameplay.ts`. Los enemigos acuáticos que saltan se declaran en `Level.waterJumpers` y los peligros o fuerzas rítmicas en colecciones declarativas como `Level.lavaJets` y `Level.windZones`, siempre con intervalo, retraso y dimensiones; no codifiques sus posiciones en el motor. Los trampolines deben tener sprite propio, descansar sobre terreno seguro y facilitar una maniobra concreta sin cubrir precipicios ni anular otros peligros.
5. Registra mundo, coordenadas y camino interactivo en `worldMapData.ts`; no dibujes el marcador ni el camino dentro del fondo. Añade el jefe en `bosses.ts`, las pegatinas en `stickers.ts`, música en `App.tsx`, y amplía los límites del ranking si cambian los máximos.
6. Añade pruebas de estructura, recursos, rutas, desbloqueo, peligros, pegatinas, jefe y compatibilidad del progreso. Comprueba también que cada caja deja espacio alcanzable sobre su apoyo y que el mapa sitúa el marcador y su camino encima del bioma correspondiente. Ejecuta la verificación completa indicada arriba y revisa visualmente las tres pantallas antes de publicar.
