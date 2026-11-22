# Cómo partir el estado de App.tsx y CasaGatitos.tsx

Investigación de [#298](https://github.com/Mocheto/super-noa/issues/298), hija del mapa [#282](https://github.com/Mocheto/super-noa/issues/282). Medido sobre `main` en `078683b` (2026-11-22). No cambia código: propone los cortes y su orden.

| Archivo | Líneas | `useState` | `useRef` | `useEffect` | `useLayoutEffect` | `useCallback` | `useMemo` |
|---|---|---|---|---|---|---|---|
| `src/App.tsx` | 1190 | 42 | 12 | 15 | 0 | 22 | 1 |
| `src/game/CasaGatitos.tsx` | 1392 | 43 | 21 | 28 | 1 | 3 | 2 |

(Llamadas reales; la issue contaba también la línea del `import`.)

## Conclusión

- **App** tiene siete zonas con poco cruce: ajustes, sonido y música, pausa y mando, progreso, ventanas, tablón (ranking más el alta) y partida. Las cuatro primeras se sacan casi sin riesgo. El tablón es el bloque más grande (21 piezas de estado) y solo toca a las demás por tres puntos: cerrar ventanas, poner la pausa y mandar al mapa. La partida (`screen`, `activeIndex`, `levelRun`, `lives`, `snapshot`…) tiene que ir **en un solo reducer**, porque cada acción («empezar pantalla», «reintentar», «salida secreta») cambia cinco o seis piezas a la vez.
- **Casa** tiene un centro que lo ata todo: `andantes` (dónde está y qué hace cada gatito) lo escriben 12 sitios y `respuestas` (los bocadillos de respuesta), 6. Lo demás (sonido, hojas pintadas, vista y medidas, reloj y hora de dormir, visitante, jardín, quién está en casa, decoración, fotos) se separa bien **si antes** existen dos interfaces pequeñas: `useAndantes` (órdenes para mover a los gatitos) y `useRespuestas` (bocadillo con su temporizador). Lo último en salir son el bucle de deambular y los manejadores del dedo.
- La regla del repositorio sigue valiendo: la lógica que se pueda va a un `.ts` puro con pruebas de `node --test`, como `mapCamera.ts` + `useMapCamera.ts` y `ritmoNucleo.ts` + `useMinijuegoRitmico.ts`. `test:logic` no carga `.tsx`, así que los hooks deben quedar finos y los reducers y las transiciones, en `.ts`.
- Hallazgo de paso: la casa lanza 24 `window.setTimeout` sueltos (respuestas, riego, destello, reacción, botes, salidas por la puerta…) que no se cancelan al salir. Hoy no se nota (React 18 ignora el `setState` tras desmontar), pero un `useTemporizadores()` común los cancela y quita el patrón `id = ++idRef.current; setX(...); setTimeout(() => setX(a => a?.id === id ? null : a))`, que se repite siete veces.

## App.tsx: estado por zona

«Lee» y «escribe» indican quién usa cada pieza dentro de App (efectos, manejadores y JSX).

### 1. Ajustes (para adultos)

| Estado | Lee | Escribe |
|---|---|---|
| `muted` | música, `playSound`, avioneta, casa, fiesta, duelos rítmicos, aviso de audio, botón de inicio y pausa | botón de sonido (inicio, pausa) |
| `musicVolume` | música, duelos, casa, fiesta, avioneta, ajustes | slider de ajustes, mando en menús (izquierda y derecha sobre el slider) |
| `effectsVolume` | `playSound`, duelos, casa, fiesta | slider, mando en menús |
| `reduceMotion` | `<main>`, mapa, casa, avioneta, fiesta, duelos, `GameCanvas` | casilla de ajustes |
| `touchControls` | `<main>` (clase) | radios de ajustes |
| efecto `writeStorage` ×2 | — | guarda los cinco en `localStorage` |

Escribir `${KEY}-configured` está repetido en el slider y en el mando: lo arregla un setter único.

### 2. Sonido y música

| Estado | Lee | Escribe |
|---|---|---|
| `musicRef`, `starMusicRef` | efecto de música, limpieza al desmontar | efecto de música (los crea una vez) |
| `effectsBusRef` | `playSound` | `playSound` (una vez) |
| `audioMessage` | aviso de audio | callbacks del reproductor |
| efecto de música | `screen`, `activeLevel.{boss,world,restStop}`, `shopActive`, `paused`, `muted`, `musicVolume`, `starActive` | reproductores |

Depende de la partida solo para **leer**; no escribe nada fuera de su zona.

### 3. Pausa automática y mando

| Efecto | Lee | Escribe |
|---|---|---|
| Escape alterna pausa | `screen` | `paused` |
| ocultar pestaña o perder el foco | `screen` | `paused` |
| botón Start del mando | `screen` | `paused` |
| mando en menús (foco y clic en el DOM) | `screen`, `paused`, `show*` (4) | `musicVolume`, `effectsVolume`, foco del DOM |

Los tres primeros son la misma idea («en pantalla con reloj, pausar»): un hook. El cuarto solo necesita saber si hay menú y cómo cambiar un volumen.

### 4. Progreso

| Estado | Lee | Escribe |
|---|---|---|
| `progress` | casi todo: mapa, álbum, inicio, ranking (sync), `isLevelUnlocked`, ventanas de resultado, casa | 12 manejadores con `setProgress((c) => …)`: pegatinas, manzanas, tienda, desvíos, saludos, completar, salida de agua o secreta, avioneta, casa, amistad, reto de jefe, borrar |
| `saveError` | avisos, inicio | efecto que guarda |

Es pura entrada y salida: un hook `useProgreso()` que lea, guarde y dé las acciones con nombre.

### 5. Ventanas (modales)

| Estado | Lee | Escribe |
|---|---|---|
| `showHelp`, `showCredits`, `showSettings`, `showAlbum` | JSX, mando en menús, recuperación del alta | botones, `requestAdventure` (los cierra todos), `replayBoss` (cierra el álbum), `finishBossReplay` (abre el álbum) |
| `showRanking` | JSX, recuperación del alta | `openRanking`, `requestAdventure`, `finishEnrollment` |
| `collectionTab`, `albumHints` | álbum | pestañas, pistas, `openCollection` |

Hoy son banderas sueltas que, en la práctica, nunca están dos abiertas a la vez, salvo el tablón sobre otra. Primero se agrupan **sin cambiar la forma** (`cerrarTodas()`, `abierta` derivada); pasar a una sola `ventana: "ayuda" | "album" | …` se deja para después, porque cambiaría qué se cierra sobre qué.

### 6. Tablón (ranking y alta)

| Estado | Lee | Escribe |
|---|---|---|
| `rankingDevice` | sync, alta, aviso, ventana del tablón | `requestAdventure`, `joinRanking`, sync (alias confirmado) |
| `rankingAlias`, `rankingPlayers`, `rankingMessage`, `rankingLoading`, `rankingJoining` + `rankingJoiningRef`, `rankingAliasRef` | ventana del tablón | `refreshRanking`, `joinRanking`, `requestAdventure` |
| `rankingSyncState`, `rankingSyncMessage`, `rankingRetry` | aviso de envío pendiente | efecto de sync, botón de reintentar, `refreshRanking` |
| `enrollmentRequired` + `Ref`, `enrollmentChecking`, `enrollmentDeferred`, `enrollmentMessage`, `enrollmentStorageBlocked`, `enrollmentBusyRef`, `enrollmentRetryAtRef`, `adventureActionRef` | avisos, ayuda (botón desactivado), ventana del tablón, efectos de recuperación y de comprobación | `requestAdventure`, `finishEnrollment`, `deferEnrollment`, `joinRanking` |

Contactos con fuera: lee `progress` (sync) y `screen` (momento seguro); escribe `showHelp/Album/Settings/Credits`, `paused` y `screen = "map"`. `requestAdventure` envuelve a **todas** las entradas a una aventura (jugar, empezar pantalla, repetir jefe, avioneta): es la interfaz que hay que conservar.

### 7. Partida y navegación

| Estado | Lee | Escribe |
|---|---|---|
| `screen` + `screenRef` | todo el JSX, música, pausa, mando, alta, precarga | ~35 sitios: `beginLevel`, `handleComplete`, `handleLoseLife`, salidas de agua y secreta, transición secreta, jefe, fiesta, avioneta, casa, ventanas de resultado, pausa («al mapa»), alta |
| `activeIndex` → `activeLevel` | música, `GameCanvas`, duelos, HUD, ventanas, `handleComplete` | `beginLevel`, `replayBoss`, `handleWaterExit`, transición secreta, `resetProgress` |
| `levelRun` | `key` de `GameCanvas` y duelos, `startingWorld` del mapa | los mismos más `restartBossLevel` |
| `lives` | HUD, medalla «sin caer», `handleComplete` | `handleLoseLife`, empezar y reintentar |
| `snapshot` (+ `starActive` derivado) | HUD, música, duelos (manzanas), ventanas | `handleSnapshot`, `spendBossApple`, empezar y reintentar |
| `paused` | `GameCanvas`, duelos, fiesta, avioneta, música, mando, transición secreta | pausa automática, botón, empezar, `requestAdventure` |
| `bossReplay`, `bossReplayReturn` | duelos, HUD, `GameCanvas` (no se monta) | `replayBoss`, `finishBossReplay`, `beginLevel`, `handleBossEncounter` |
| `activeDetour`, `shopActive` | HUD (`displayedLevel`), música | callbacks de `GameCanvas`, `restartCurrentLevel` |
| `avionetaGift`, `showCatPartyInvite`, `mapReturnWorld` | avioneta, ventana de completada, mapa | `handleComplete`, mapa, `leaveCatParty`, `beginLevel` |
| `secretTransitionRef`, `playScreenRef` | transición secreta, pantalla grande | `handleSecretExit` |

`beginLevel`, `replayBoss`, `handleWaterExit`, `restartCurrentLevel`, `restartBossLevel` y la transición secreta repiten la misma ráfaga: `setActiveIndex`, `setLevelRun(+1)`, `setLives(MAX)`, `setSnapshot(vacío)`, `setPaused(false)`, `setBossReplay`, `setScreen`. Es la señal de que piden un reducer.

## App.tsx: hooks y reducers propuestos

```ts
// src/game/useAjustes.ts
function useAjustes(): {
  muted: boolean; alternarSonido(): void;
  musicVolume: number; effectsVolume: number;
  ajustarVolumen(cual: "musica" | "efectos", valor: number): void; // escribe también «-configured»
  reduceMotion: boolean; setReduceMotion(v: boolean): void;
  touchControls: TouchControlsMode; setTouchControls(v: TouchControlsMode): void;
};

// src/game/useSonidoJuego.ts
function useEfectos(ajustes: { muted: boolean; effectsVolume: number }): (kind: SoundKind) => void; // playSound
function useMusicaDeFondo(entrada: {
  pista: string; volumen: number; sonando: boolean; estrella: boolean;
}): { audioMessage: string };
// La regla de «qué suena» queda pura y con prueba: src/game/musicaDePantalla.ts
function musicaDePantalla(screen, level, { shopActive, paused, muted, musicVolume, starActive }): { pista; volumen; sonando; estrella };

// src/game/usePausaAutomatica.ts
function usePausaAutomatica(activa: boolean, alternar: () => void, pausar: () => void): void; // Escape, blur/visibilidad, Start
function useMandoEnMenus(activo: boolean, screen: Screen, ajustarVolumen: Ajustes["ajustarVolumen"]): void;

// src/game/useProgreso.ts
function useProgreso(): { progress: Progress; saveError: boolean; acciones: AccionesProgreso };
// AccionesProgreso: funciones puras (Progress, ...) => Progress en progressAcciones.ts, con prueba;
// el hook solo las envuelve en setProgress estables.

// src/game/useVentanas.ts (primero sin cambiar la forma)
function useVentanas(): {
  ayuda, creditos, ajustes, album, tablon: boolean; abrir(v): void; cerrar(v): void;
  cerrarTodas(): void; algunaAbierta: boolean;
  pestana: CollectionTab; abrirColeccion(tab): void; pistas: string[]; alternarPista(id): void;
};

// src/game/useTablon.ts (+ el estado del alta como reducer puro en rankingAlta.ts)
function useTablon(entrada: {
  progress: Progress;
  screen: Screen; ventanaAbierta: boolean;
  prepararAlta(): void;          // cierra ventanas, quita la pausa
  llevarAlMapaSiNoEsSeguro(): void;
  abrirTablon(): void;
}): {
  requestAdventure(action?: () => void): Promise<void>;
  device; alias; setAlias; players; message; loading; joining; aliasRef;
  sync: { state; message; reintentar(): void };
  alta: { required; checking; message; storageBlocked };
  refresh(): Promise<void>; join(): Promise<void>;
};

// src/game/partidaEstado.ts (puro, con prueba) + usePartida en App
type Partida = {
  screen: Screen; activeIndex: number; levelRun: number; lives: number; snapshot: GameSnapshot; paused: boolean;
  bossReplay: boolean; bossReplayReturn: "home" | "map"; activeDetour: DetourId | null; shopActive: boolean;
  avionetaGift: boolean; showCatPartyInvite: boolean; mapReturnWorld?: WorldId; secretTransition: { target: number; remaining: number };
};
type AccionPartida =
  | { tipo: "empezar"; index: number; duelo?: boolean; vuelta?: "home" | "map" }   // beginLevel, replayBoss
  | { tipo: "reintentar" } | { tipo: "reiniciarDuelo" } | { tipo: "salirAgua"; index: number }
  | { tipo: "salidaSecreta"; index: number } | { tipo: "llegaSecreta" }
  | { tipo: "perderVida" } | { tipo: "foto"; snapshot: GameSnapshot } | { tipo: "gastarManzana" }
  | { tipo: "duelo" } | { tipo: "completar"; ... } | { tipo: "ir"; screen: Screen } | { tipo: "pausa"; valor?: boolean } | ...;
function partida(estado: Partida, accion: AccionPartida): Partida;
```

El progreso **no** entra en el reducer de la partida: `handleComplete` seguirá llamando a `acciones.completar(...)` y a `dispatch({ tipo: "completar" })` por separado, como hoy.

Además del estado, hay JSX que se puede mover sin tocar nada: `<HudEsquinas>`, `<DueloDelGuardian>` (el `switch` de seis duelos, que repite las mismas ocho props), `<VentanaAjustes>`, `<VentanaAlbum>`, `<VentanaTablon>` y `<PantallaInicio>`. Así App baja de 1190 a unas 450 líneas antes de tocar ningún estado.

## CasaGatitos.tsx: estado por zona

### A. Núcleo guardado y llegada

| Estado | Lee | Escribe |
|---|---|---|
| `casa` + `casaRef`, `guardar()` | todo | `guardar` desde ~20 sitios (cuidar, comer, botar, regar, visitar, arropar, decorar, vestir, foto, huellas, reloj, quién en casa, cambiar de estancia) |
| `inicial` (memo), `llegan`, `estreno` | deambular, aspectos, `seguir` | — (fijos durante la visita) |
| `fase` (`entrando` → `hola` → `casa`) | casi todos los efectos y manejadores | efecto de llegada, `seguir` |
| `brilla` | bandeja | `seguir` |

### B. Sonido

| Estado | Lee | Escribe |
|---|---|---|
| `sonidoRef`, `nanaRef` | 30 llamadas (`maullar`, `bote`, `toc`, `clic`, `golpeBano`, `ronronear`…) | efectos de montaje |
| efectos `ajustar` ×2, ronroneo, maullidos de pedir y canción | `muted`, `effectsVolume`, `musicVolume`, `bano`, `buenasNoches`, `noche`, `frotando`, `arrastre`, `andantes`, `casa` | `estadosRef` |

### C. Arte pintado

| Estado | Lee | Escribe |
|---|---|---|
| `hojas`, `poseArropado` (+ `variantes`, `claveVariantes`) | `hojaDe`, `arropadoHoja`, foto, baño, vestidor, ventana EN CASA | dos efectos con promesas |
| `fondo` | `<img>` del fondo | efecto de la pared (`decoracion.pared`) |
| `ahora` | `aspectos` (cuadro de la animación) | reloj de animación |

### D. Vista y medidas

| Estado | Lee | Escribe |
|---|---|---|
| `medidas` | escala, ancho visible, clases `is-vertical`/`is-lado`, `--objeto` | `useLayoutEffect` (ResizeObserver) |
| `vista` (→ `vistaX`, `anchoVisible`) | escena, avisos de borde, foto | centrar al entrar, deslizar con el dedo, autodeslizar al arrastrar, `cruzarPuerta`, teclado |
| `seccionRef`, `visorRef`, `escenaRef`, `autoRef`, `deslizRef` | `enEscena`, arrastre, dedo | — |

### E. Deambular (el centro)

| Estado | Lee | Escribe |
|---|---|---|
| `andantes` | `lista`, `sitios`, `aspectos`, maullidos, `seVan` | bucle de deambular, `pararGatito`, `cambiarDeEstancia`, `empezarABotar` (×2), oler al visitante, `empezarADormir`, `taparGatito`, `cerrarEleccion` (×3), `ponerVersion`, `soltarGatito` |
| `estadosRef`, `seVanRef`, `rapidosRef` | bucle, maullidos | bucle, dormir, `cerrarEleccion` |
| `gatitos` (derivado de `casa`, `estancia`, `esperando`, `saliendo`) | casi todo | — |

El bucle lee además `cogidoRef`, `botandoRef`, `frotandoRef`, `saliendoRef`, `bano`, `enJardin`, `noche` y `fase`: por eso esas cuatro piezas llevan un `ref` espejo.

### F. Bandeja y dedo

| Estado | Lee | Escribe |
|---|---|---|
| `arrastre` | autodeslizar, efecto de arrastre (sin dependencias: se vuelve a suscribir en cada render), ronroneo, aspectos, bandeja | `cogerObjeto`, soltar, `cambiarDecorar`, `cruzarPuerta` |
| `frotando` + `frotandoRef`, `froteRef`, `dedoRef`, `pendienteRef` | aspectos, ronroneo, bucle | dedo, esponja |
| `cogido` + `cogidoRef` | aspectos, bucle, oler, decorar | dedo (mantener 0,3 s), `soltarGatito` |
| `pelota` | dibujo | `lanzar` |
| `respuestas` | aspectos, bocadillos | `atender`, `atenderComida`, botar, mariposa, `taparGatito`, vestidor |
| `abanico` | bandeja | cuenco, soltar, `cruzarPuerta` |
| `idRef` | — | 9 sitios (ids de temporizador) |

### G. Hora de dormir y reloj

| Estado | Lee | Escribe |
|---|---|---|
| `nocheReloj`, `horaDeDormir`, `fechaCasa` (→ `noche`, `arropados`) | escena, bucle, bandeja, nana, foto, decorar | efecto de tiempo (cada `TIEMPO_CADA_MS`) |
| `acostando`, `lamparaApagada`, `buenasNoches` | escena, nana, bandeja, puerta | `empezarADormir`, `cambiarLampara`, `terminarDeDormir`, `taparGatito`, efecto de tiempo |

El efecto de tiempo mezcla dos cosas: huellas de barro (zona E) y reloj (zona G). Se parte en dos.

### H. Jardín

| Estado | Lee | Escribe |
|---|---|---|
| `estancia` (→ `enJardin`) | `gatitos`, bucle, escena, bandeja, foto | `cruzarPuerta`, `empezarADormir` |
| `botando` + `botandoRef` | bucle, oler, `cruzarPuerta` | `empezarABotar` |
| `posadas`, `toqueMariposa` + `toqueAtendidoRef` | mariposas | `tocarMariposa`, dedo |
| `riego` | maceteros | `regarMacetero` |
| `luzPuerta` | puerta | `cambiarDeEstancia`, `cruzarPuerta`, `cerrarEleccion` |

### I. Visitante

| Estado | Lee | Escribe |
|---|---|---|
| `visita` | escena, bandeja (plato), foto, `cruzarPuerta`, dedo | 4 efectos (llamar a los 4 s, toc cada 10 s, irse, despedirse), `cruzarPuerta`, `tocarVisitante`, `darleDeComer` |
| `reaccion`, `abanicoAmigos`, `visitaPensadaRef` | visitante, bandeja | `tocarVisitante`, `darleDeComer`, efectos |

Escribe en `andantes` solo para que los gatitos vayan a olerlo.

### J. Quién está en casa

| Estado | Lee | Escribe |
|---|---|---|
| `eligiendo`, `llena` | ventana EN CASA | `seguir`, botón del gato, `cambiarDeSitio`, `cerrarEleccion` |
| `saliendo` + `saliendoRef`, `esperando` | `gatitos`, bucle | `cerrarEleccion` (temporizadores) |

### K. Decoración, baño, vestidor y fotos

| Estado | Lee | Escribe |
|---|---|---|
| `decorando`, `elegido`, `destello` | escena, bandeja, dedo | `cambiarDecorar`, `ponerVersion`, `empezarADormir`, dedo |
| `bano` | bucle, nana, `<BanoGatito>`, decorar | `soltarGatito`, `terminarBano` |
| `vestidor` | `<VestidorGatito>` | `soltarGatito`, `salirDelVestidor` |
| `flash` | destello de la foto | `hacerFoto` |

## CasaGatitos.tsx: hooks propuestos

Todas las zonas comparten tres cosas; se pasan como un objeto normal (no un Context de React), creado una vez en el componente:

```ts
type CasaComun = {
  casaRef: RefObject<CasaProgress>;
  guardar(nueva: CasaProgress): void;
  sonido: RefObject<SonidoCasa | null>;
  reduceMotion: boolean;
  temporizador(ms: number, fn: () => void): void; // de useTemporizadores: se cancelan al desmontar
};
```

```ts
// Utilidades
function useTemporizadores(): { despues(ms, fn): number; cancelarTodos(): void };
function useEfimero<T>(ms: number): [T | null, (valor: T) => void]; // riego, reaccion, destello, pelota, brilla

// B. src/game/useSonidoCasa.ts
function useSonidoCasa(a: { muted; effectsVolume; musicVolume; bano: boolean; buenasNoches: boolean; noche: boolean }):
  { sonido: RefObject<SonidoCasa | null>; nana: RefObject<Nana | null>; despertar(): void };

// C. src/game/useArteCasa.ts
function useHojasGatitos(casa: CasaProgress): { variantes; hojaDe(mundo): string | undefined; arropadoHoja(mundo): string | undefined };
function useFondoPared(pared: Version): string;
function useRelojAnimacion(reduceMotion: boolean): number; // `ahora`

// D. src/game/useVistaCasa.ts (como useMapCamera)
function useVistaCasa(seccionRef): {
  medidas; vistaX; anchoVisible; centrarEn(x): void; irA(x): void;
  desliz: { empezar(clienteX, punto): void; mover(clienteX): boolean; acabar(): Desliz | null };
  autodeslizar(activo: boolean): void; autoRef;
};

// E. src/game/useAndantes.ts (el centro)
function useAndantes(c: CasaComun, a: { gatitos: number[]; llegan: number[]; fase; noche; enJardin; sitioDia; sitioNoche; quietos(mundo, indice): boolean }): {
  andantes: Record<number, Andante>;
  lista: Andante[];
  parar(indice): void;
  mandar(mundo, destino, pose, segundos, momento, opciones?: { rapido?: boolean; desdePuerta?: Estancia | Punto }): void;
  colocar(mundo, punto, pose, hasta): void;   // soltar, botar, arropar
  acercar(mundos: number[], destinos: Punto[], segundos): void; // oler visitante, oler mueble
  quitar(mundo): void;
  todosADormir(sitioNoche): void;
  seVaSolo: Set<number>; // los que van solos a la puerta
};
// La decisión de cada paso ya es pura (casaDeambular.ts: avanzarAndante, decidir, cambiaSolo);
// el hook solo lleva el intervalo y los refs.

// F. src/game/useRespuestas.ts
function useRespuestas(c: CasaComun): { respuestas: Respuesta[]; responder(indice, r: Omit<Respuesta, "id" | "gatito" | "desde">, duraMs?): void };
// y src/game/casaAtender.ts (puro): cuidar/darDeComer/botar/jugar → { casa, respuesta, sonido[] }

// G. src/game/useHoraDeDormir.ts
function useRelojCasa(c: CasaComun, activo: boolean): { nocheReloj; horaDeDormir; fechaCasa };
function useHoraDeDormir(c: CasaComun, reloj, andantes: Andantes): {
  noche; acostando; lamparaApagada; buenasNoches; arropados;
  empezar(): void; cambiarLampara(): void; terminar(): void; tapar(indice): void;
};
// La regla de «¡BUENAS NOCHES!» y de la lámpara por la mañana, a casaDormir.ts.

// H. src/game/useJardin.ts
function useJardin(c: CasaComun, andantes, respuestas): {
  estancia; enJardin; cruzarPuerta(): void; cambiarDeEstancia(mundo, momento): void;
  botando: number[]; botar(mundo, momento): void;
  mariposas(ms): MariposaVista[]; tocarMariposa(punto, ms): boolean;
  riego; regar(indice): void; luzPuerta: number;
};

// I. src/game/useVisitante.ts  (+ transiciones puras en casaVisitante.ts: llama → dentro → seva)
function useVisitante(c: CasaComun, a: { fase; enJardin; noche; levelStats; onAmistad; acercar: Andantes["acercar"] }): {
  visita; reaccion; abanicoAmigos; setAbanicoAmigos;
  abrir(): void; tocar(): void; darDeComer(comida): void; pies: Punto; sobre(punto): boolean;
};

// J. src/game/useQuienEnCasa.ts
function useQuienEnCasa(c: CasaComun, andantes): {
  eligiendo; llena; saliendo; esperando;
  abrir(orden?): void; cambiar(mundo): void; cerrar(): void;
};

// K. decoración
function useDecorar(c: CasaComun, andantes, noche): { decorando; elegido; destello; alternar(): void; elegir(mueble): void; poner(mueble, version, momento): void };
```

Y en JSX: `<BandejaCasa>` (≈ líneas 1257–1330), `<VentanaEnCasa>`, `<VisitanteJardin>`, `<GatitoCasa>` (cada gatito con su bocadillo y piezas) y `<JardinEscena>` (colchoneta, maceteros, mariposas, luciérnagas). El dedo (`empezarDedo`, `moverDedo`, `acabarDedo`, `soltarGatito` y el efecto de arrastre) queda en el componente hasta el final, porque es el que reparte a todas las zonas.

## Cortes ordenados

Cada corte es una `wayfinder:task` propia: un commit que no cambia nada visible, con `npm run lint`, `npm run test:logic` y `npm run build:pages` en verde, y lo jugado en el navegador y en móvil (375×812 y 740×340).

| # | Corte | Riesgo | Pruebas nuevas | Qué jugar |
|---|---|---|---|---|
| 1 | **App: sacar JSX** (`HudEsquinas`, `DueloDelGuardian`, `VentanaAjustes`, `VentanaAlbum`, `VentanaTablon`, `PantallaInicio`) | bajo: solo props | — | HUD en 1-1, una sala, un desvío y un paseo; los seis tipos de duelo (Santa, abeja, tambor, merienda, guardián, piedra-papel-tijera) y su revancha desde el álbum; ajustes, álbum con sus pestañas y pistas, tablón. Móvil: HUD de esquinas y ventanas en vertical y apaisado |
| 2 | **App: `useAjustes`** | bajo | lectura y escritura de las claves (con `storage` falso) | cambiar volumen con el ratón y con el mando, silencio en inicio y pausa, recargar y ver que se conserva; controles táctiles «siempre» |
| 3 | **App: `useEfectos` + `useMusicaDeFondo` + `musicaDePantalla()` puro** | bajo-medio | `musicaDePantalla`: calla en abeja, tambor y merienda, en la tienda y en pausa; estrella; paseo al 60 % | música del mundo, estrella, tienda secreta, paseo, los tres duelos rítmicos (sin música del mundo), pausa. **iOS**: volumen y silencio (#295) |
| 4 | **App: `usePausaAutomatica` + `useMandoEnMenus`** | bajo | — | Escape, cambiar de pestaña, perder el foco, Start del mando en partida, fiesta y avioneta; mando en el inicio, mapa y ventanas |
| 5 | **App: `useProgreso` + `progressAcciones.ts` puro** | medio: todas las escrituras del progreso | cada acción (pegatina, manzanas, tienda, desvío, saludo, completar, agua, secreto, avioneta, casa, amistad, reto) sobre un progreso de ejemplo, y migración intacta | completar una pantalla, una acuática, la ruta secreta, la avioneta, un paseo con saludos, la tienda; recargar y ver el progreso; «borrar progreso» |
| 6 | **App: `useVentanas`** (banderas agrupadas, misma forma) | bajo-medio | — | abrir y cerrar cada ventana, revancha de jefe que vuelve al álbum, «lista» de la ayuda que lleva al mapa |
| 7 | **Casa: `useTemporizadores` + `useEfimero` + `useRespuestas`** | bajo | — | cuidar con cada objeto, «ahora no», riego, decorar (destello), saludar y dar de comer al visitante; salir de la casa a media respuesta |
| 8 | **Casa: `useSonidoCasa` + `useHojasGatitos` + `useFondoPared` + `useRelojAnimacion`** | bajo | — | maullidos, ronroneo, nana (más baja en el baño y tras «¡BUENAS NOCHES!»), gatito sucio y mejor amigo con su lazo, pared cambiada, movimiento reducido |
| 9 | **Casa: `useVistaCasa`** | medio: maquetación | funciones de medida en `casaInteraccion.ts` (ya puras) | **móvil 375×812 (bandeja debajo) y 740×340 (bandeja al lado)**, girar el móvil, deslizar la habitación, autodeslizar al arrastrar al borde, avisos de borde |
| 10 | **App: `useTablon` + `rankingAlta.ts` puro** | medio-alto: red, temporizadores y alta obligatoria | transiciones del alta (pendiente, aplazada, almacenamiento bloqueado, validación) junto a `rankingOnboarding.test.ts` | con el servidor caído, con el alias pendiente, sin `localStorage`, el alta al pulsar «jugar», reintentar envío, volver a estar en línea |
| 11 | **Casa: `useRelojCasa` + `useHoraDeDormir`** | medio | regla de buenas noches y de la lámpara en `casaDormir.test.ts` | `?casaHora=20`: estrella, mantita a todos, lámpara, «¡BUENAS NOCHES!», salir y volver; de día la lámpara se enciende; jardín de noche |
| 12 | **Casa: `useAndantes`** (interfaz de órdenes; el bucle aún dentro) | alto: 12 escritores | — | todo lo que mueve gatitos: llegada por la puerta, coger y soltar, bañera, armario, colchoneta, dormir, oler mueble y visitante, quién en casa |
| 13 | **Casa: `useVisitante` + transiciones puras** | medio (tras el 12) | llama → dentro → seva, tiempos de irse, un corazón por visita | `?casaVisita=wolf`: toc toc, abrir por la puerta y tocándolo, saludo, plato con la favorita y otra, despedida, foto del jardín con visitante |
| 14 | **Casa: `useJardin`, `useQuienEnCasa`, `useDecorar`** | medio (tras el 12) | — | cruzar la puerta, botar, mariposas, regar los tres maceteros; EN CASA con seis o más rescatados (llena y huellas), salidas y entradas; decorar los cinco muebles |
| 15 | **App: reducer `partidaEstado.ts` + `usePartida`** | alto: ~35 `setScreen` | cada acción del reducer: empezar, reintentar con y sin manzanas, perder la última vida, salida de agua y secreta, revancha, completar con y sin avioneta y fiesta | las 45 pantallas no; sí 1-1 entera, perder las tres vidas, gameover y «otra vez», un jefe con reintento gastando manzana y reinicio sin manzanas, rendirse, ruta secreta por las copas, salida acuática, fiesta tras el bosque, avioneta regalada, desvío, paseo, revancha desde el álbum y desde el inicio |
| 16 | **Casa: bucle de deambular dentro de `useAndantes` y el dedo en `useDedoCasa`** | alto | — | como el 12, más frotar con dedo y esponja, el temblor de 24 px que no cuenta, escoba con huellas, teclado y lector de pantalla en la bandeja |

Por qué este orden: primero lo que no comparte estado (JSX, ajustes, sonido, pausa); luego las utilidades de la casa que quitan repeticiones; después las zonas con interfaz clara (vista, tablón, dormir), y al final los dos centros con muchos escritores (`andantes` y la partida), cuando ya hay menos código alrededor y las demás zonas hablan con ellos por funciones con nombre.

Lo que **no** se propone: un único `useReducer` para toda la casa (mezclaría animación a 60 ms con el guardado y haría que cada paso del bucle reconstruyera todo), ni un Context de React para la casa (el árbol es un solo componente con hijos directos; un objeto `CasaComun` basta), ni cambiar las ventanas a «una sola abierta» en el mismo corte que las agrupa.

## Comprobaciones comunes de cada corte

- `npm run lint`, `npm run test:logic`, `npm run build:pages`.
- `?prueba=casa`, `?prueba=1-1`, `?prueba=11-3&duelo` en desarrollo para llegar rápido.
- Móvil 375×812 y 740×340: HUD de esquinas, controles táctiles translúcidos, bandeja de la casa debajo o al lado, ventanas sin desbordar.
- Progreso guardado: recargar tras cada prueba y comprobar que nada se pierde (clave `super-noa-progress-v1`, `version: 2`).
