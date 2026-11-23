# Qué reutiliza hoy el duelo de memoria y qué arte hay de Aurora y la Reina Tricera (issue #350, mapa #349)

Solo lectura del código en `main` (a7432bc). Sin propuesta de diseño.

## 1. Cómo es hoy el duelo de memoria

- `src/game/GuardianMiniGame.tsx` (131 líneas) es **un solo componente** para cuatro guardianes (`triceratops-queen`, `sky-captain`, `aurora-celeste`, `rainbow-queen`). Los datos están en `src/game/guardianGames.ts` (65 líneas): `kind: "choice" | "sequence"`, tres opciones con celda del atlas de iconos y color, y `sequenceLengths`.
- Aurora: `sequence`, opciones luna/estrella/nube, rondas de [2, 3, 3, 4, 5] pasos. Reina Arcoíris: `sequence`, rojo/amarillo/azul, [3, 3, 4, 4, 5]. Reina Tricera («SALVA EL HUEVO») y Capitán Celeste son `choice` (un paso, no es memoria).
- Constantes: `GUARDIAN_GAME_ROUNDS = 5`, tres oportunidades (corazones `♥`), «CASI» = mensaje `duelos.guardian.casiSecuencia.juntos` al fallar (se repite la misma ronda con la misma secuencia, no se regenera); al tercer fallo pasa a `lost`.
- Fases (`Phase`): `watch` (se enseña la secuencia entera a la vez, sin tiempo, con botón «LISTO») → `play` (tres botones, progreso con estrellas) → `feedback` (siguiente ronda) → `won` / `lost`.
- Secuencia con semilla: **no hay semilla real.** `randomSequence` usa `window.crypto.getRandomValues`; `makeGuardianSequence(game, round, randomValues)` es pura y testeable (indices `% options.length`), y la prueba la llama con `[0,1,2,1,0]`. Una repetición de la misma ronda no repite la secuencia: `reset` vuelve a sortear la ronda 0.
- Sin música propia: durante el duelo suena la del mundo (`musicTracks[activeLevel.world]`, App.tsx ~381). Sin reloj de pulsos ni audio generado.
- Sin práctica: `PantallaPrevia` con `practicaPrimero={false}` y sin `onPracticar` (solo ¡A JUGAR!).
- Escena estática: retrato del guardián (poses 0 y 4) a la izquierda + tablero crema; CSS en `src/styles.css` líneas ~724–754 y ~869–879 (`.guardian-*`, `.guardian-game-portrait`). Fondo morado genérico con `boss-theme-<id>` (solo hay `::before` para bramble-king … rainbow-queen; **no hay `boss-theme-aurora-celeste` ni `boss-theme-triceratops-queen`**).
- Iconos: `public/assets/sprites/guardian-game-icons-v1.webp` (821×1915, 3 columnas × 7 filas; `background-size: 300% 700%`): fila 1 carriles (tricera), 2 cañones, 5 luna/estrella/nube (Aurora), 6 colores (arcoíris). Los tests de la merienda exigen conservar este atlas.

## 2. Qué es reutilizable y qué es específico

Reutilizable para un motor de memoria común (hoy mezclado dentro de `GuardianMiniGame.tsx`):

- Lógica de rondas: longitud por ronda, `makeGuardianSequence`, comparación paso a paso (`choose`), contador de fallos, «CASI» con repetición de ronda, victoria tras la ronda 5, reto `perfect-game` = `mistakes === 0`. Nada de esto depende de React salvo el estado; hoy no está extraído a un módulo puro (no existe `guardianGames` con motor testeable más que `makeGuardianSequence`).
- Pantalla previa, resultado y ventana de rendirse: `PantallaPrevia`, `ResultadoMinijuego` (`minijuegoComun.tsx`) y `<Ventana>`; botones comunes `Boton`/`BotonControl`; `Dialog` con `gamepad`.
- Entrada: `data-gamepad-default`/`data-gamepad-back` en los botones (mando); el duelo actual no usa teclado numérico ni Espacio.
- `src/game/practicaPausas.ts` (`createPracticaConPausas`): lógica pura de práctica que se para en cada pieza nueva (válida para cualquier juego).

No reutilizable tal cual (específico de los duelos rítmicos de pulso): `pulsacionVacia.ts` (raya, rebote, resta de pulsación vacía; todo en pulsos), `ritmoNucleo.ts` (tempo, cuenta, relojes de audio/fotogramas, corcheas), `ritmoAudio.ts` (equipo de audio, muestras), `useMinijuegoRitmico.ts` (esqueleto con reloj, pausa con cuenta, mando y Espacio; sus tipos `SesionRitmo`, `OpcionesRitmo` asumen partitura y pulso) y los motores `meriendaJabatos.ts` (354 líneas: partitura de llamadas con `validateScore`, `createRun`, `pressAt`, `outcomeOf`) y `armoniaDrum.ts` (299 líneas: pares llamada/respuesta, huellas, `printsAt`). Del tambor sí se parece la estructura llamada-y-respuesta (`callStart`, `responseStart`, `pairs`) y su `DrumRun`/`outcomeOf`; del esqueleto rítmico, la idea de «sesión + vista + alEmpezar/alTerminar» y la práctica con paradas.

Específico del duelo actual: el tablero estático, los iconos del atlas `guardian-game-icons-v1`, el retrato como único elemento de escena, los textos `juegos.<guardián>.…` y `duelos.guardian.…`.

Patrón de «minijuego propio» que se copió tres veces (App.tsx ~946–1010): `Game.tsx` + `juego.ts` motor + `juego.css`, props `paused, muted, musicVolume, effectsVolume, reduceMotion, levelCompleted, onAbandon, onWin, playSound, friendlyReplay`, y excepción de música en App (variables `beeNinjaDuel`, `armoniaDrumDuel`, `meriendaDuel`). `CatPartyGame.tsx` y `AvionetaGame.tsx` siguen otro patrón (no son duelos).

## 3. Arte de Aurora Celeste y la Reina Tricera

**Aurora Celeste** (`bosses.ts`: `assetAtlas: ./assets/atlases/sky-kingdom-characters-v1.webp`, reto `perfect-game`):

- Atlas 1536×614, 5 columnas × 2 filas, fondo transparente. Fila 0: 5 poses del enemigo «puffling» (pajarito nube lila). **Fila 1: las 5 poses de Aurora**: 0 reposo (ojos abiertos), 1 puño arriba y guiño («fuerte»), 2 brazos abiertos, 3 signo de victoria con guiño, 4 alas arriba celebrando. Ojo: revisando la imagen, **Aurora es una lechuza/búho con corona de luna dorada, no un unicornio**, aunque el mapa #349 dice «Aurora Celeste (el unicornio)». Los unicornios del mundo 17 son los enemigos `sky-unicorn` (dibujados por código en `rendering.ts` ~1474 y ~1661, y del atlas secreto `secret-sky-v1`), no la guardiana. Ningún texto del catálogo la llama unicornio (`guardianes.ts`: «guardiana de las nubes»).
- El duelo solo usa dos poses: `frame 0` y `frame 4` (`GuardianPortrait` calcula `backgroundPosition: frame*25% 100%`). Las poses 1–3 no se usan en ningún duelo. Hay un cuadro por pose, sin ciclo de animación ni hoja de andar/saltar.
- Pegatina «CORONA DE AURORA» en `src/textos/es/pegatinas.ts`.
- Fondo: mundo 17, `./assets/worlds/sky-kingdom-background-v1.webp` (`assets.ts` línea 139); terreno `atlases/sky-kingdom-terrain-v1.webp`; la guardiana está en la pantalla `17-3` (`levels.ts` ~1653, ruta `finale`). Música del mundo: `./assets/music/reino-celeste.mp3`. El duelo actual no pinta ningún fondo propio (sigue el fondo morado de `boss-battle`).
- No hay documento de arte en `docs/art/` ni script en `prototypes/tools/` para Aurora.

**Reina Tricera** (`bosses.ts`: `assetPrefix: ./assets/sprites/boss-reina-tricera`, reto `perfect-game`):

- 5 archivos sueltos `boss-reina-tricera-0..4.webp`, cada uno 434×724 (retrato vertical, triceratops azul con gola naranja, corona y falda de flores). Mismo esquema de 5 poses que el resto de guardianes (0 reposo, 4 sonríe/gana). Solo se usan 0 y 4 en el duelo; las poses 1–3 no se ven en `GuardianMiniGame` (en `BossBattle` el frame 0–4 se usa según el duelo de piedra/papel/tijera, pero ella no pasa por ahí).
- Fondo: mundo 9, `./assets/worlds/world-9.webp`; terreno y enemigos `atlases/dinosaur-island-v1.webp` y `dinosaur-enemies-v1.webp`; pantalla `9-3` (`levels.ts` ~1020, ruta `next: 10-1`). Música del mundo: `./assets/music/jurasico.wav`. Texto: «nido de flores», reto «protege los cinco huevos» y marco tropical.
- No hay arte de huevo, cesta ni nido en `public/assets/sprites` propio de este duelo: «SALVA EL HUEVO» usa solo iconos del atlas `guardian-game-icons-v1` (fila 1). No hay documento de arte ni script en `prototypes/tools/` para ella.

Huecos de arte para movimiento (ambas): ninguna tiene hoja de animación de andar, saltar o marcar un lugar del escenario; solo poses estáticas de retrato. Para comparar, la merienda tiene `JABATO_SPRITES` por tipo, hoja de Noa en 4 poses (`merienda-noa`), roca, arbusto, cesta y comida (`docs/art/merienda-jabatos-v1.md`, `prototypes/tools/merienda-recorte.py`); el tambor usa `teatro-armonia-v0.webp` y `prototypes/tools/tambor-armonia-arte.py`.

## 4. Cómo se enlazan duelo, reto, progreso y revancha

- El encuentro se abre desde `GameCanvas` (`onBossEncounter`) al llegar a la meta de la pantalla con `level.boss` (`9-3`, `17-3`); App pone `screen === "boss"`. El ramal (App.tsx ~946–1010) elige el componente por `activeLevel.boss`: Santa/Siroco/Don Silbato → `SantaBossBattle`; `queen-bee` → `BeeNinjaGame`; `maestra-armonia` → `ArmoniaDrumGame`; `great-boar` → `MeriendaJabatosGame`; `isGuardianGameId(boss)` → `GuardianMiniGame`; resto → `BossBattle` (piedra, papel, tijera). `isGuardianGameId` es el ramal que hay que dejar de cumplir para un guardián con minijuego propio: los tests de los otros tres comprueban `"<boss>" in guardianGames === false` y que el ramal de App lo trate antes.
- Reto `perfect-game`: `GuardianMiniGame` llama `onWin(mistakes === 0)`. En campaña, `handleComplete(challengeCompleted)` (App ~682–705) escribe `progress.bossChallenges[boss] = true` junto con la pantalla completada; en revancha, `finishBossReplay(challengeCompleted)` (App ~622) lo escribe solo si es true. El marco del reto aparece en la pestaña «Jefes» de la colección (`coleccion.jefes.*`) con `bossCatalog[id].challenge.label`.
- Progreso: `progress.ts` conserva `bossChallenges: Record<string, boolean>` (solo `true`; migración tolerante). El duelo no guarda nada propio (sin mejor marca ni intentos), a diferencia de `avioneta` o `secretShops`. El ranking cuenta `bossChallenges`.
- Reintento tras perder: con manzanas, botón «manzana» (`onSpendApple` → `spendBossApple`) reinicia el duelo; sin manzanas, `onRestartLevel` (`restartBossLevel`) reinicia la pantalla. `protectedByApple` solo añade una frase de armadura en la previa. Los otros minijuegos propios no gastan manzanas: ofrecen «OTRA VEZ» y «PRACTICA» en el resultado.
- Revancha: desde la colección (`replayBoss`, solo si la pantalla está completada) se abre con `bossReplay = true`, `friendlyReplay` y manzanas a 0; ahí no hay manzana ni reinicio de pantalla (`otraVez`), y salir vuelve a la colección o al inicio (`bossReplayReturn`). Los tres rítmicos usan además `levelCompleted` + `practicaPrimero(...)` (ritmoNucleo) para destacar PRACTICA solo la primera vez; `GuardianMiniGame` no recibe `levelCompleted`.
- Paseo de los amigos: `restStops.ts` (`guardianOf(world)`) se ofrece al ganar el duelo; no depende del tipo de duelo.
- Pruebas que fijan hoy el comportamiento: `guardianGames.test.ts` (cuatro guardianes, tres opciones, reto `perfect-game`, rondas ≤ 5 pasos), `levels.test.ts` (212: 9-3 jefe `triceratops-queen`; 277 y 675: 17-3 jefe `aurora-celeste`), `meriendaJabatos.test.ts`, `armoniaDrum.test.ts`, `beeNinja.test.ts` (los tres comprueban que su guardián ya no está en `guardianGames`). `MuestraInterfaz.tsx` usa `GuardianMiniGame` con `triceratops-queen` en `?prueba=interfaz&ventana=guardian`.

## 5. Huecos y dudas para la decisión

1. Aurora Celeste es una lechuza con corona de luna, no un unicornio; el mapa y el título de #349 dicen «unicornio». Hay que decidir si se rehace el personaje o se corrige el texto del mapa (los únicos unicornios son enemigos, `sky-unicorn`).
2. No hay semilla reproducible en el sorteo actual (solo `crypto`); la lógica de rondas no está extraída a módulo puro.
3. Ninguna de las dos guardianas tiene arte de movimiento ni fondo/escena propia del duelo ni documento en `docs/art/`; el arte se entrega como prompts a mano.
4. Música: ninguno de los dos duelos tiene canción propia; si la llevan, hay que añadir su excepción en App (`playing`), como las otras tres.
5. El duelo actual no tiene práctica, ni cuenta de pausa, ni `levelCompleted`; tampoco guarda mejor marca.
6. Faltan `boss-theme-*` de CSS para estas dos guardianas (solo si el duelo sigue usando el estilo `boss-battle`).
