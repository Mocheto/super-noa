# Mapa del bucle de `GameCanvas` y cortes para sacar la física a un módulo puro

Investigación de [#297](https://github.com/Mocheto/super-noa/issues/297), hija del mapa [#282](https://github.com/Mocheto/super-noa/issues/282). Medido sobre `main` en `078683b` (2026-11-22). No cambia `src/`.

## Conclusión

- `update` (`src/game/GameCanvas.tsx`, líneas 374–978, unas 600 líneas) vive dentro del `useEffect` de montaje y cierra sobre **unas 45 variables locales** (`player`, `enemies`, `items`, `cameraX/Y`, `apples`, `checkpointIndex`, `starRemaining`, `frame`, `levelAge`, `skyBounceUses`…), **7 refs de React** y **5 `setState`**. Llama a App por `callbacksRef` (40 llamadas a `playSound`, más `onLoseLife`, `onAppleCollected`, `onSnapshot`, `onFriendGreeted`, `onShopVisit/ActiveChange`, `onDetourVisit/ActiveChange`, `onComplete/onBossEncounter/onSecretExit/onWaterExit` a través de `finishLevel`) y escribe 21 avisos accesibles en `statusRef.current.textContent`.
- La física **ya está medio sacada**: las reglas pequeñas son puras y tienen pruebas (`gameplay.ts`, `gameState.ts`, `worldMechanics.ts`, `chainGuardians.ts`, `detourMechanics.ts`, `puzzleRooms.ts`, `chase.ts`, `explore.ts`, `secretShopRuntime.ts`, `palabrasRecoger.ts`, `levelTransition.ts`). Lo que queda en el componente es **el orden** en que se combinan y los efectos (sonido, avisos, callbacks, `setState`).
- El único obstáculo real para probar sin React son los efectos intercalados. La salida es un **paso puro que devuelve eventos**: `pasoPartida(estado, nivel, entrada, delta) → EventoPartida[]`, y `GameCanvas` se queda como adaptador que lee la entrada, aplica los eventos en orden y dibuja.
- Ya existe una red de seguridad: `engineTestHarness.ts` monta `GameCanvas` en Node con React falso (46 montajes en 12 archivos de prueba) y captura sonidos, snapshots, callbacks y el rectángulo de Noa (dibujado como `fillRect #aa6bd5` porque las imágenes nunca cargan). **Antes del primer corte** conviene añadir con él una prueba de «huella» por pantalla que fije el comportamiento; cada corte se valida con que la huella no cambie.
- Se puede hacer en **10 cortes**, uno por cambio, sin tocar cómo se juega. Los cuatro primeros no necesitan el objeto de estado y son casi sin riesgo.

## 1. Qué hay alrededor de `update`

### Estado que lee y escribe (cierre del `useEffect`, líneas 222–293)

| Grupo | Variables | Quién las escribe |
| --- | --- | --- |
| Noa | `player` (`Player` de `gameState.ts`), `respawnX/Y`, `checkpointIndex`, `walkCycleTime` | `update`, `respawn`, `hurt`, `restartRoom` |
| Entrada con flanco | `previousJump`, `previousShoot`, `previousUp`, `shootCooldown`; además muta `inputRef.current.{jumpQueued, shootQueued, enterQueued, jump}` | `update`, `returnFromDetourRef` |
| Poderes | `starRemaining`, `starDuration`, `shopUsed` | `update`, `respawn`, `returnFromShopRef` |
| Mundo vivo | `enemies`, `items`, `collected`, `collectedStickers`, `warnedEnemies`, `hitBlocks`, `projectiles`, `bursts`, `cannons`, `cannonballs`, `waterJumpers`, `chainGuardians` | `update`, `respawn` (vacía proyectiles y balas) |
| Formatos | `puzzle` + `sparks` + `roomHintShown`; `chase` + `chaseSay` + `chaseCaughtAge`; `explore`; `restStop` + `greetedFriends` + `friendHops` + `friendSay` | `update`, `restartRoom` |
| Mecanismos | `detourClock`, `activatedSkyLifts`, `standingOnMechanism`, `standingOnSkyLift`, `skyBounceUses`, `skyBounceSteerLock`, `lastSpringX/Frame`, `vineStartedFrame` | `update`, `respawn` |
| Tiempo y cámara | `levelAge` (segundos de simulación), `frame` (lo sube `gameLoop` **después** de cada paso), `cameraX/Y`, `lastSnapshot`, `entradaSegundos` | `update`, bucle |
| Fin | `completed`, `goalCelebrationFrame`, `transition` (`levelTransition.ts`), `palabras` | `finishLevel`, `update` |
| Derivados fijos | `goalPlatforms`, `goalSurfaceY`, `raster` | montaje |

### Refs, `setState` y efectos hacia fuera

- Refs: `inputRef` (de `useGameInput`), `runningRef`, `gameLoopRef` (se para a sí mismo al entrar en tienda o desvío), `interactionRef`, `doorAvailableRef`, `shopOpenRef`, `shopResultRef`, `statusRef`, `motionRef` (solo dibujo), `callbacksRef`.
- `setState`: `setInteraction`, `setDoorAvailable` (botón de entrar), `setRoomHint` (botón «Empezar la sala»), `setExcursion`, `setShopOpen`.
- Fuera del componente: `readGameplayPad(firstConnectedGamepad())` (lee `navigator`), `t()`/`textoLienzo()` para avisos y el saludo de los amigos.
- Funciones auxiliares del cierre que `update` llama: `finishLevel` (294), `enterSecretVine`, `restartRoom` (308), `respawn` (324), `hurt` (357), `currentSnapshot`. `respawn` y `hurt` disparan `onLoseLife` y sonidos **en medio** de los bucles de enemigos.

## 2. Mapa de `update` por bloques

Las líneas son de `GameCanvas.tsx` en `078683b`. «Puro» = ya es una función de módulo con pruebas de nodo.

| # | Líneas | Bloque | Lee | Escribe | Efectos | Ya puro |
| --- | --- | --- | --- | --- | --- | --- |
| B1 | 375–386 | Reloj y apoyos del desvío; arrastra a Noa con el mecanismo que pisa | `detourClock`, `standingOnMechanism` | `levelAge`, `player.x/y` | — | `advanceDetourClock`, `detourSupports` |
| B2 | 387–446 | Interacciones: puerta secreta, desvío, interruptores, ascensor del cielo; **sale del paso** al entrar en tienda o desvío | entrada, mando, `shopUsed`, `activatedSkyLifts` | `interactionRef`, `detourClock.switches`, `activatedSkyLifts`, `shopUsed`, entrada | `setInteraction`, `setDoorAvailable`, `setExcursion`, `setShopOpen`, `gameLoop.setRunning(false)`, `onDetourVisit/ActiveChange`, `onShopVisit/ActiveChange`, sonidos `checkpoint`/`block`, 3 avisos | `canEnterSecretShop` |
| B3 | 447–458 | Plataformas del paso: mecánicas, apoyos, ascensores (y arrastre del ascensor), muros del atajo, cajones que resbalan | `levelAge`, `activatedSkyLifts`, `puzzle`, `explore` | `player.y`, `puzzle.crates`, lista `platforms` | sonido `block` | `getMechanicPlatforms`, `skyLiftPlatform`, `shortcutWalls`, `slideCrates`, `puzzlePlatforms` |
| B4 | 459–461 | Estrella que se acaba | `starRemaining` | `starRemaining` | `onSnapshot` | — |
| B5 | 462–486 | Mando + teclado, agua, corrientes, hielo, viento → `vx`, `facing` | entrada, `level.platforms`, zonas | `player.vx/facing`, `skyBounceSteerLock` | — | `waterAt`, `platformSurfaceY` (el resto, en línea) |
| B6 | 487–512 | Salto: búfer, coyote, doble salto, brazada, salto corto | entrada, `previousJump`, `swimming`, `inUpdraft` | `player.vy/jumpBuffer/coyote/jumpsUsed/doubleJumpFx…`, `previousJump`, entrada | sonido `jump` | `swimmingVelocity` |
| B7 | 514–528 | Lanzar lana | entrada, `power`, `shootCooldown` | `projectiles`, `shootCooldown`, `player.shootFx` | sonido `yarn` | — |
| B8 | 530–541 | Movimiento horizontal: cinta, cruce de bordes del cielo (solo mundo 17), empujar cajones, paredes | `level.platforms` + muros de sala/atajo (**no** los de B3) | `player.x/vx`, cajones | — | `conveyorSpeed`, `wrapHorizontalPosition`, `pushCrates`, `resolveHorizontalWallCollision` |
| B9 | 543–603 | Vertical: gravedad, corrientes, superficie del agua, aterrizaje, muelles, nube que rebota (dirección alterna con `skyBounceUses`), techo de paredes | `platforms` de B3, `wasGrounded` | `player.*`, `standingOnMechanism/SkyLift`, `skyBounceUses/SteerLock`, `lastSpringX/Frame` | sonido `jump`, aviso nube | `landsOnSpring`, `updraftVelocity`, `platformSurfaceY` |
| B10 | 605–626 | Salas: botones, placas, puertas, cambio de sala, chispas, pista de reinicio | `puzzle`, `levelAge` | `bursts`, `sparks`, `checkpointIndex`, `roomHintShown` | sonidos, avisos, `setRoomHint` | `stepTriggers`, `advanceRoom`, `restartHintActive` |
| B11 | 628–649 | Cajas golpeadas desde abajo (y enredadera) | `level.rewardBlocks`, `hitBlocks` | `player.*`, `hitBlocks`, `items`, `vineStartedFrame` | sonido `block` | — |
| B12 | 651–670 | Peligros mortales (pinchos, agua mortal → `respawn` y **sale del paso**), lava (`hurt`), caída (`respawn`, **no** sale) | zonas, `levelAge`, `cameraY` | vía `respawn`/`hurt` | `hurt`, `onLoseLife` | `lavaJetState` |
| B13 | 672–703 | Objetos: subida desde la caja, recogida de manzana, gato, insignia | `items`, `collected` | `apples`, `collectedStickers`, `player.power` | `onAppleCollected`, sonidos, avisos, `palabras.recoger` | — |
| B14 | 705–723 | Paseo de los amigos: miran, saludan una vez, saltan con Noa | `restStop`, `enemies` | `enemies[].vx/phase`, `greetedFriends`, `friendHops`, `friendSay` | sonido `cat`, `onFriendGreeted`, aviso, `textoLienzo` | — |
| B15 | 725–759 | Enemigos: lobo dormido, avisos de lobo y jabalí, patrulla, carga, pisotón o daño | `enemies`, `levelAge`, `previousBottom` | `enemies[]`, `warnedEnemies`, `player.vy/jumpsUsed`, `bursts` | sonidos `howl`/`snort`/`stomp`, `hurt` | `wolfSleepState`, `keepInsidePatrol`, `boarChargeVelocity`, `enemyY` |
| B16 | 761–776 | Perritos encadenados y peces saltarines | ambos | ambos | sonido `countdown`, aviso, `hurt` | `updateChainGuardian`, `guardianHitbox`, `waterJumperState` |
| B17 | 778–809 | Cañones y balas (disparo, pisotón, daño) | `cannons`, `cannonballs`, `level.screen` | ambos, `player.vy`, `bursts` | sonidos `cannon`/`stomp`, `hurt` | — |
| B18 | 811–860 | Lana contra roca, enemigos, perritos y balas; limpieza de listas y estallidos | `projectiles`, `enemies`, `cannonballs` | las cuatro listas, `bursts` | sonidos `block`/`stomp` | `projectileHitsWaterWall` |
| B19 | 862–884 | Banderas y puntos seguros verticales o de exploración | `level.checkpoints`, `verticalCheckpoints` | `checkpointIndex`, `respawnX/Y` | sonido, aviso, `palabras.recoger("flag")` | — |
| B20 | 886–901 | Salida acuática (**sale**) y enredadera secreta (crece con `frame`, **sale**) | `waterEntrance`, `vineStartedFrame`, `frame` | vía `finishLevel` | sonido, aviso, `onWaterExit`/`onSecretExit` | — |
| B21 | 903–915 | Persecución | `chase` | `chase`, `chaseSay`, `chaseCaughtAge` | sonidos, aviso, `finishLevel → onComplete` | `stepChase` |
| B22 | 917–935 | Exploración | `explore` | `explore`, `bursts` | sonidos, avisos, `finishLevel → onComplete` | `stepExplore`, `reachedGate` |
| B23 | 937–955 | Meta (banderín o cima vertical) | `goalSurfaceY`, `level.goalY` | `player.*`, `goalCelebrationFrame` | sonido `goal`, aviso, `finishLevel → onComplete/onBossEncounter` | `hasReachedGoalFlag` |
| B24 | 957–972 | Temporizadores de Noa, ciclo de paso y cámara (sala, exploración, vertical que solo sube) | `player`, `puzzle`, `explore` | `player.invincible/…Fx`, `walkCycleTime`, `cameraX/Y` | — | `exploreCameraTarget` |
| B25 | 974–977 | Snapshot cada 130 ms (tiempo real, `now`) | `now`, `lastSnapshot` | `lastSnapshot` | `onSnapshot` | — |

Fuera de `update` pero en el bucle (líneas 1316–1322): `entradaSegundos`, `palabras.avanzar`, `transition.advance` cuando `completed`, y `frame += 1` tras cada paso.

## 3. Detalles que un corte debe conservar al pie de la letra

1. **Salidas tempranas del paso**: B2 (tienda, desvío), pinchos y agua mortal de B12, B20. La caída de B12 **no** sale: el resto del paso sigue con Noa ya reaparecida. Tras una salida temprana no bajan `invincible`, no se mueve la cámara ni se manda snapshot.
2. **`hurt`/`respawn` en medio de los bucles**: un daño en B15 reaparece a Noa y los enemigos siguientes del mismo `forEach` ya la ven en el punto seguro.
3. **Dos listas de plataformas**: la colisión horizontal (B8) usa `level.platforms` + sala/atajo; la vertical (B9) usa `getMechanicPlatforms` (las del nivel más puentes de flores y plataformas al ritmo activos) + apoyos del desvío + ascensores + sala/atajo. Así, los apoyos, ascensores, puentes y plataformas al ritmo no hacen de pared. Además, los cajones de la lista vertical son los de antes de empujar (B3 se calcula antes que B8). No unificar sin querer.
4. **Tiempo mezclado**: la física usa `delta` y `levelAge`; la enredadera y el destello del muelle usan `frame` (cuadros de 1/60 s, que sube después del paso); el snapshot usa `now` de `requestAnimationFrame`. Al pasar a puro, `frame` y `now` deben entrar como datos.
5. **Snapshot atómico**: `finishLevel` toma `currentSnapshot()` en el momento de llamarse; la prueba «recogida y meta en el mismo paso comunican estado atómico» lo vigila. Un evento `fin` debe llevar su snapshot ya calculado.
6. **Mutación de la entrada**: el paso pone a `false` `jumpQueued`, `shootQueued`, `enterQueued` y, al entrar, `jump`. Si el paso puro recibe una copia, el adaptador tiene que devolver esos consumos a `inputRef`.
7. **La dirección de la nube que rebota** depende de `skyBounceUses` y de `Math.round(platform.x)`; es estado, no azar.
8. **`completed`** se pone dentro del mismo paso; B21–B23 comprueban `!completed` para no terminar dos veces.
9. `enemies` se reasigna con una copia justo antes de crear el bucle (línea 1310); el objeto que dibuja `render` es el mismo que mueve `update`.

## 4. Forma propuesta del módulo puro

```ts
// src/game/partida.ts (nombre orientativo)
export type EstadoPartida = { player: Player; enemies: LiveEnemy[]; /* … el resto de la tabla 1 */ };
export type EntradaPaso = { left: boolean; right: boolean; jump: boolean; shoot: boolean; jumpQueued: boolean; shootQueued: boolean; enter: boolean };
export type EventoPartida =
  | { tipo: "sonido"; sonido: SoundKind }
  | { tipo: "aviso"; clave: ClaveTexto; valores?: Record<string, string | number> }
  | { tipo: "vida" } | { tipo: "manzana" } | { tipo: "palabra"; objeto: ObjetoConPalabra }
  | { tipo: "amigo"; mundo: number; animal: string }
  | { tipo: "interaccion"; valor: Interaccion | "" } | { tipo: "pistaSala"; valor: boolean }
  | { tipo: "entrar"; destino: "tienda" | "desvio"; id: string }
  | { tipo: "fin"; demora: number; destino: "completar" | "guardian" | "secreto" | "agua"; snapshot: GameSnapshot }
  | { tipo: "snapshot"; snapshot: GameSnapshot };
export function crearEstadoPartida(level: Level): EstadoPartida;
export function pasoPartida(estado: EstadoPartida, level: Level, entrada: EntradaPaso, delta: number, reloj: { frame: number; now: number }): EventoPartida[];
```

`GameCanvas` conserva: lectura de teclado y mando, `inputRef` (aplicando los consumos), `setState`, `statusRef`, `callbacksRef`, la transición y todo `render`/`drawPlayer`. El orden de los eventos en la lista es el orden en que hoy se llaman los callbacks, y el adaptador los aplica justo al terminar el paso (ninguno de ellos realimenta el paso en curso: `onLoseLife` y compañía solo cambian el estado de App, que llega en el siguiente render).

## 5. Cortes ordenados

Cada corte es un commit propio con `npm run lint`, `npm run test:logic` y `npm run build:pages` en verde. «Huella» es la prueba del corte 0.

### Corte 0 · Huella de la partida (solo prueba)

`src/game/partidaHuella.test.ts`: con `mountEngine`, juega cada pantalla de `levels` y `waterLevels` (y las de `testScreens.ts`) con una entrada fija (derecha sostenida, salto cada 0,7 s con doble salto, lana cada 1,1 s, entrar al pasar por puertas) durante 600 pasos, y guarda por pantalla un resumen: rectángulo de Noa cada 30 pasos, lista de eventos (sonidos, vidas, snapshots, fin) y el último snapshot. El resultado se compara con `src/game/partidaHuella.json`; regenerar el JSON solo se permite con una línea en el commit que diga por qué.
- Riesgo: ninguno, no toca `src/` fuera de la prueba. Medir el tiempo (presupuesto ≤ 3 s en `test:logic`; si se pasa, bajar a 300 pasos o a las pantallas con mecánica).
- Añadir dos guiones más: uno que se queda quieto 5 s (enemigos, cañones, lava, perritos solos) y otro que va a la izquierda en las pantallas con muros (exploración y salas).

### Corte 1 · Cámara y meta a funciones puras

`camaraPartida.ts`: `seguirCamara(level, player, camara, delta, sala)` (B24, parte de cámara) y `metaAlcanzada(level, player, goalSurfaceY)` + `superficieMeta(level)` (B23 y el cálculo de `goalSurfaceY` del montaje). Sin efectos, sin estado.
- Pruebas: cámara que no baja en vertical, que se fija en la sala, que sigue en dos ejes en exploración; meta vertical a 130 px; `superficieMeta` igual que hoy para todas las pantallas.
- Comprobar: huella igual; jugar 4-2 (vertical), 2-2 (salas), 3-2 (exploración) y la meta de 1-1 y 1-3 (guardián).

### Corte 2 · Movimiento horizontal y salto

En `gameplay.ts`: `pisaHielo(player, platforms)`, `velocidadHorizontal(player, {left, right, swimming, ice, steerLock}, delta)`, `empujeViento(...)` (B5) y `resolverSalto(player, {jump, nuevaBrazada, swimming, inUpdraft}, delta) → "salto" | "doble" | null` (B6, sin la lectura de la entrada).
- Pruebas: hielo frena a 0,32^Δ y acelera 520 px/s²; coyote de 0,12 s y búfer de 0,13 s; doble salto al 94 %; salto corto al soltar; brazada a −190.
- Comprobar: huella igual; jugar 1-1 (doble salto), 12-1 (hielo y viento), A-1 (agua), S-1 (corrientes), 14-1 (géiseres).

### Corte 3 · Colisión vertical y cajas

`colisionPartida.ts`: `aterrizar(player, platforms, previo, ctx) → {muelle?, nube?, apoyo?, ascensor?}` (B9) y `golpearCajas(player, blocks, golpeadas, previo) → bloques golpeados` (B11). El contador de la nube entra y sale como dato.
- Pruebas: muelle solo al caer, nube que alterna dirección y bloquea el giro 0,42 s, techo de las paredes, caja desde abajo con rebote a 95 px/s y premio una sola vez.
- Comprobar: huella igual; jugar 1-2 (muelles), 11-1 (gotas), 13-1 (muelle de regalo), 17-1 a 17-3 (nubes y cruce de bordes), 4-3 (enredadera).

### Corte 4 · Peligros y puntos seguros como consultas

`peligrosPartida.ts`: `peligroMortal(level, player)` (pinchos, agua mortal), `tocaLava(level, player, levelAge)`, `seCayo(level, player, cameraY)`, `puntoSeguroAlcanzado(level, player, checkpointIndex, exploracion) → {indice, x, y} | null` (B12 y B19, solo la consulta; respawn y sonidos se quedan).
- Pruebas: márgenes de 8/16 px de los pinchos, lava activa por encima de 0,12, límites de caída de cada orientación, punto seguro de exploración a 70 × 8 px.
- Comprobar: huella igual; jugar 6-1 (pinchos), 9-1 (agua mortal), 10-1 (lava), 3-2 y 14-2 (puntos de exploración), 17-2 (nube segura).

### Corte 5 · Un único objeto de estado

`crearEstadoPartida(level)` en `partida.ts` reúne las variables de la tabla 1 en un objeto; `update`, `render`, `respawn`, `hurt`, `restartRoom` y los `returnFrom…Ref` pasan a leer `s.apples`, `s.cameraX`… Cambio mecánico, sin mover lógica.
- Pruebas: estado inicial de todas las pantallas (posición, cámara inicial vertical/exploración, listas copiadas y no compartidas con `level`).
- Comprobar: huella igual; `GameCanvas.test.ts` y las 46 pruebas con `mountEngine`; jugar una pantalla de cada formato.

### Corte 6 · Eventos en lugar de callbacks

Dentro de `GameCanvas`, `update` empuja `EventoPartida` a una lista y un `aplicarEventos` hace lo que hoy hacen las llamadas directas (sonido, aviso en `statusRef`, `onLoseLife`, `setInteraction`…). `finishLevel` emite `fin` con su snapshot. Aún no se mueve código de archivo.
- Pruebas: la huella ya fija el orden de sonidos y callbacks; añadir una de orden «daño en el mismo paso que la meta».
- Comprobar: huella igual; jugar 1-3 (guardián), 3-3 (salida acuática), 4-3 (enredadera), 1-3 y 10-1 (tienda secreta, entrar y volver con estrella), 1-1 (desvío, entrar y volver).

### Corte 7 · Mundo vivo a `mundoVivo.ts`

B13–B18 (objetos, amigos, enemigos, perritos, peces, cañones, balas, lana) a funciones `(estado, level, delta, emitir)` que piden el daño con un evento interno `dano` que el paso resuelve con `hurt` en el mismo orden. Es el corte más largo: se puede partir en 7a (objetos y amigos), 7b (enemigos, perritos y peces), 7c (cañones, balas y lana).
- Pruebas por función: pisotón con `vy > 60`, el erizo y el pez no se pisan, aviso de lobo y jabalí una vez a 340 px, cañón a 900 px y velocidad 205 + 14·pantalla, lana parada en la roca del arrecife, saludo una sola vez a `GREET_DISTANCE`.
- Comprobar: huella igual; jugar 3-1 (lobos dormidos), 4-1 (jabalí), 5-3 (cañones y piratas), 6-2 (perritos), 9-1 (peces), A-1…A-3 (lana contra la roca del arrecife), un paseo `P-1`, y la pérdida de poder gato → manzana → normal.

### Corte 8 · Formatos y mecanismos a sus módulos

B1–B3 y B10, B21, B22: el reloj del desvío, los ascensores, salas, persecución y exploración pasan a `pasoFormatos(estado, level, delta, emitir)`. Sus reglas ya son puras; aquí solo se mueve la orquestación (chispas, pista de sala, bocadillos de la persecución). Las interacciones de B2 emiten `interaccion` y `entrar`.
- Comprobar: huella igual; jugar 2-2, 6-2, 12-2, 16-2 (salas, con R y el botón), 1-2, 5-2, 11-2, 15-2 (persecución), 3-2, 9-2, 14-2 (exploración), 17-1 (ascensor), 16-1 (plataformas al ritmo), 11-1 (puentes de flores) y un desvío con interruptores.

### Corte 9 · `pasoPartida` y `GameCanvas` como adaptador

`update` queda en `partida.ts` como `pasoPartida(estado, level, entrada, delta, reloj)`. `GameCanvas` lee teclado y mando, llama al paso, devuelve los consumos a `inputRef`, aplica eventos y dibuja.
- Pruebas: `partida.test.ts` juega pantallas enteras en Node sin `mountEngine` (llegar a la meta de 1-1 con un guion, perder una vida en 6-1, completar 2-2); la huella pasa a usar `pasoPartida` directamente y se compara con el JSON del corte 0.
- Comprobar: lista completa de «Verificación» de `AGENTS.md` en escritorio y en móvil (375×812 y 740×340), con teclado, táctil y mando; `GameCanvas.tsx` debería bajar de 1370 a unas 750 líneas (dibujo y adaptador).

## 6. Qué se puede sacar sin riesgo y qué no

- **Sin riesgo** (cortes 0–4): consultas sin efectos y sin estado nuevo; si la huella no cambia, la partida no cambia.
- **Riesgo medio** (5–6): mecánicos pero tocan todo el cierre; la huella y las 46 pruebas con `mountEngine` los cubren casi enteros. Lo que no cubren: `setState` de botones (puerta, sala) y la tienda/desvío con la interfaz real; por eso se juegan.
- **Riesgo alto** (7–9): reordenar sin querer `hurt`/`respawn` dentro de los bucles o las salidas tempranas. Mitigación: los puntos 1–3 de la sección 3 como pruebas explícitas antes de mover nada.
- **No sacar**: `drawPlayer` y `render` (dibujo, otro trabajo), la transición (`levelTransition.ts` ya es pura y vive en el bucle, no en el paso) y la lectura del mando (depende de `navigator`).

## 7. Mecánicas y pantallas para jugar en cada corte

Sacado de los datos de `levels.ts`: muelles 1-1, 1-2, 1-3, 4-3; persecución 1-2, 5-2, 11-2, 15-2; salas 2-2, 6-2, 12-2, 16-2; exploración 3-2, 9-2, 14-2; vertical 4-2, 10-2, 13-2, 17-1…17-3; tienda secreta 1-3, 3-2, 6-3, 10-1, 12-1; desvíos 1-1, 2-1, 2-3, 6-1, 11-1; lobos 3-x; jabalíes 4-x; enredadera 4-3; salida acuática 3-3; cañones 5-3; pinchos 6-1, 6-3; perritos 6-x; agua mortal 9-1…11-3; peces 9-x; lava 10-x, 15-2, 15-3; gotas y puentes de flores 11-x; hielo 12-x; viento 12-x, 13-1, 14-1, 14-3, 16-1, 16-2; muelle de regalo 13-x; cintas 13-2, 13-3, 15-x; géiseres 14-x; plataformas al ritmo 16-x; nubes y ascensores 17-x; corrientes S-1; agua A-1…A-3.
