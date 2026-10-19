# Guía para agentes

## Arquitectura

Super Noa es un juego React/Vite de plataformas dibujado sobre Canvas 2D.

- `src/App.tsx`: navegación, HUD, música, modales y pausa automática al perder visibilidad o foco.
- `src/game/progress.ts`: lectura, validación, migración y escritura del progreso local.
- `src/game/storage.ts`: acceso seguro al almacenamiento local, incluso si el navegador lo bloquea.
- `src/game/GameCanvas.tsx`: coordinación de la partida, física y estado de cada pantalla.
- `src/game/rendering.ts`: dibujo de escenarios, objetos y enemigos sobre Canvas 2D.
- `src/game/assets.ts`: carga diferida por mundo y reutilización de imágenes.
- `src/game/input.ts`: teclado y controles táctiles; `src/game/gameLoop.ts`: física en pasos fijos y pausa del renderizado.
- `src/game/gameState.ts`, `src/game/gameplay.ts` y `src/game/constants.ts`: tipos de estado, reglas de movimiento y dimensiones del Canvas.
- `src/game/levels.ts`: definición declarativa de las veintiuna pantallas de campaña, las tres acuáticas y la pantalla secreta de las nubes, sus rutas especiales, cajas de recompensa, cañones, trampas y encuentros finales; `src/game/routes.ts`: avance y desbloqueo a partir de esos datos.
- `src/game/WorldMap.tsx` y `src/game/worldMapData.ts`: mapa ilustrado, marcadores, caminos según el progreso y cuadros de resumen; `public/assets/worlds/noa-adventure-map-v1.png`: fondo original sin interfaz incrustada.
- `src/game/BossBattle.tsx`: nueve duelos de piedra, papel o tijera contra los monstruos finales; `gamepad.ts`, `menuGamepad.ts` y `duelGamepad.ts`: entrada de mando en partida, menús y duelos.
- `src/game/stickers.ts`: catálogo estable de 27 insignias coleccionables: veintiuna de campaña, tres acuáticas y tres secretas.
- `server/ranking-server.mjs`: API y migraciones del tablón mundial; `server/ranking-supervisor.mjs`: descarga y activa automáticamente el backend del último commit de `main`, con recuperación de la versión anterior si falla.
- `src/game/types.ts`: tipos del motor y extensión futura.
- `src/styles.css`: interfaz adaptable, mapa desplazable en móvil y controles táctiles.
- `public/assets/`: hojas de animaciones, sprites raster, atlas y música.

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
- Publica cada cambio validado: tras ejecutar las comprobaciones, crea un commit, súbelo a `main` y confirma que el despliegue de GitHub Pages termina correctamente, salvo que la persona usuaria indique expresamente que no se publique.
- El contenedor del ranking debe arrancar `ranking-supervisor.mjs`, no directamente `ranking-server.mjs`. El supervisor consulta `main` cada cinco minutos (`RANKING_UPDATE_INTERVAL_MS` permite cambiarlo), descarga los archivos usando un SHA inmutable, valida su sintaxis y reinicia únicamente el proceso Node. No recrea el contenedor ni modifica el volumen o PostgreSQL.

## Verificación

Después de cambios ejecuta:

```bash
npm run lint
npm run build:pages
```

Ejecuta también `npm run test:logic` cuando cambien reglas, niveles, recursos, entrada, bucle o progreso.

Antes de publicar comprueba las veintiuna pantallas de campaña, las tres acuáticas y el reino secreto de las nubes, doble salto, natación, muelles, niebla, avisos de lobos y jabalíes, ruta secreta por las copas, barcos voladores, piratas, loros, cañones, pasillos y pinchos del castillo, la isla tropical, t-rex pequeños, terodáctilos y agua mortal, pájaros, unicornios, pegatinas y álbum, los nueve duelos, rendirse y volver al mapa, el reintento gastando una manzana y el reinicio sin manzanas, cajas golpeadas desde abajo, pérdida de vidas y reaparición con tres vidas, checkpoints, manzana, gato, lana, rescate final del gatito, progreso, sonido, teclado, controles táctiles, mando en los duelos y pausa automática al ocultar la pestaña o perder el foco.

## Cómo añadir un mundo

1. Añade el identificador del mundo y sus variantes a `types.ts` (`Theme`, `Level.world`, enemigos, terreno y jefe si procede). Mantén los niveles, peligros, rutas y recompensas como datos declarativos en `levels.ts`.
2. Crea tres pantallas con identificadores estables, una pegatina por pantalla, checkpoints sobre suelo seguro y una ruta explícita desde el final del mundo anterior. Solo la última pantalla de la campaña debe usar `route.finale`; las anteriores deben enlazar con `route.next` cuando el orden del array no sea suficiente.
3. Guarda arte original en `public/assets/`: ilustración en `worlds/`, atlas de terreno y enemigos en `atlases/`, gato y cinco poses del jefe en `sprites/`, y atlas horizontal RGBA de tres pegatinas en `stickers/`. Usa siempre rutas `./assets/...` y registra la carga diferida en `assets.ts`.
4. Añade el dibujo del tema, terreno, peligros y enemigos en `rendering.ts`; añade la colisión del peligro en `GameCanvas.tsx` y cualquier movimiento especial en `gameState.ts` o `gameplay.ts`. Los enemigos acuáticos que saltan se declaran en `Level.waterJumpers` con intervalo, retraso y altura; no codifiques sus posiciones en el motor.
5. Registra mundo, coordenadas y camino interactivo en `worldMapData.ts`; no dibujes el marcador ni el camino dentro del fondo. Añade el jefe en `bosses.ts`, las pegatinas en `stickers.ts`, música reutilizada o debidamente acreditada en `App.tsx`, y amplía los límites del ranking si cambian los máximos.
6. Añade pruebas de estructura, recursos, rutas, desbloqueo, peligros, pegatinas, jefe y compatibilidad del progreso. Ejecuta la verificación completa indicada arriba y revisa visualmente las tres pantallas antes de publicar.
