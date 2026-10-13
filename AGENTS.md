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
- `src/game/levels.ts`: definición declarativa de las dieciocho pantallas de campaña, las tres acuáticas y la pantalla secreta de las nubes, sus rutas especiales, cajas de recompensa, cañones, trampas y encuentros finales; `src/game/routes.ts`: avance y desbloqueo a partir de esos datos.
- `src/game/BossBattle.tsx`: ocho duelos de piedra, papel o tijera contra los monstruos finales; `gamepad.ts`, `menuGamepad.ts` y `duelGamepad.ts`: entrada de mando en partida, menús y duelos.
- `src/game/stickers.ts`: catálogo estable de 24 insignias coleccionables: dieciocho de campaña, tres acuáticas y tres secretas.
- `src/game/types.ts`: tipos del motor y extensión futura.
- `src/styles.css`: interfaz adaptable y controles táctiles.
- `public/assets/`: hojas de animaciones, sprites raster, atlas y música.

## Reglas

- Mantén los textos visibles en español y adecuados para una niña de cinco años.
- No copies recursos, niveles, música, sonidos o personajes de Nintendo ni de otros juegos comerciales.
- Conserva rutas relativas (`./assets/...`) para que funcione tanto en el dominio propio como bajo una subruta de GitHub Pages.
- El progreso usa la clave `super-noa-progress-v1`. El formato actual declara `version: 2`; amplíalo de forma tolerante a campos ausentes y conserva la migración de guardados anteriores.
- Las fotografías de referencia son privadas: no deben copiarse al repositorio, al sitio ni a documentación pública.
- Los datos de niveles y sus rutas especiales deben permanecer declarativos para poder incorporar pantallas y coleccionables sin cambiar el motor.
- No edites manualmente `dist-pages/`; es un artefacto generado.
- Conserva la atribución musical y la licencia de `CREDITS.md`.
- Publica cada cambio validado: tras ejecutar las comprobaciones, crea un commit, súbelo a `main` y confirma que el despliegue de GitHub Pages termina correctamente, salvo que la persona usuaria indique expresamente que no se publique.

## Verificación

Después de cambios ejecuta:

```bash
npm run lint
npm run build:pages
```

Ejecuta también `npm run test:logic` cuando cambien reglas, niveles, recursos, entrada, bucle o progreso.

Antes de publicar comprueba las dieciocho pantallas de campaña, las tres acuáticas y el reino secreto de las nubes, doble salto, natación, muelles, niebla, avisos de lobos y jabalíes, ruta secreta por las copas, barcos voladores, piratas, loros, cañones, pasillos y pinchos del castillo, pájaros, unicornios, pegatinas y álbum, los ocho duelos, rendirse y volver al mapa, el reintento gastando una manzana y el reinicio sin manzanas, cajas golpeadas desde abajo, pérdida de vidas y reaparición con tres vidas, checkpoints, manzana, gato, lana, rescate final del gatito, progreso, sonido, teclado, controles táctiles, mando en los duelos y pausa automática al ocultar la pestaña o perder el foco.
