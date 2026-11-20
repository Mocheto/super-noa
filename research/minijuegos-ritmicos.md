# Lo que repiten los cuatro minijuegos rítmicos

Investigación de la issue [Inventariar lo que repiten los cuatro minijuegos rítmicos](https://github.com/Mocheto/super-noa/issues/285), hija del mapa [#282](https://github.com/Mocheto/super-noa/issues/282). Rama de investigación: no se fusiona.

Comparado sobre `main` en `ba43380`. Los rangos de líneas son de ese commit. Los diffs se hicieron normalizando los nombres de tipo (`BeeNote`/`DrumNote`/`MeriendaNote`/`PartyNote` → `NOTE`, `BeeMode`/… → `MODE`).

Abreviaturas: **Abeja** = `BeeNinjaGame.tsx` + `beeNinja.ts`; **Tambor** = `ArmoniaDrumGame.tsx` + `armoniaDrum.ts`; **Merienda** = `MeriendaJabatosGame.tsx` + `meriendaJabatos.ts`; **Fiesta** = `CatPartyGame.tsx` + `catParty.ts`.

## Respuesta corta

- Abeja, Tambor y Merienda son **el mismo componente copiado tres veces**: ~200 líneas cada uno (rig de audio, `freshSegment`, `ensureAudio`, `playCue`, `pulseNow`, pausa con cuenta de cuatro, bucle de `requestAnimationFrame`, teclado/mando, `begin`, `finish`, ventanas de parada y de salir) son idénticas o difieren en un identificador. Lo que cambia de verdad es `react`, `snapshot` y el escenario.
- La Fiesta es **una versión anterior** del mismo esqueleto: no tiene bus de tramo, no cuenta cuatro al seguir tras una pausa (solo suspende el `AudioContext`), su reloj de fotogramas va en línea y no usa `Dialog`/`friendlyReplay`.
- `playNote` es el único bloque donde las diferencias **cambian el sonido**: tiempos de ataque, filtros de ruido, vibrato y largo del búfer de ruido. Un núcleo común solo es fiel si recibe esas diferencias como datos (un «perfil de síntesis» por juego), no si las unifica.
- En los módulos lógicos, `practiceFirst`, `risingEdge`, `audioPulse`, `songStartAfterPause` y `advanceFrameClock` están copiados tal cual en tres archivos (y `audioPulse` en el cuarto); solo cambian las constantes del módulo (`PULSE_MS`, `RESUME_COUNT_PULSES`). `beeNinjaSamples.ts` y `catPartySamples.ts` son idénticos salvo el import y el texto del aviso.
- Propuesta: `ritmoNucleo.ts` (puro, con pruebas de nodo), `ritmoAudio.ts` (Web Audio sin React: rig, tramo, `tocarNota` con perfil) y `useMinijuegoRitmico` (hook con reloj, pausa, bucle y entrada). Los juegos se quedan con su partitura, `react`, `snapshot` y su escenario.

## Tabla de bloques repetidos

Estado: **=** idéntico, **≈** idéntico salvo identificadores, textos o un detalle, **≠** misma función con lógica distinta, **—** no existe.

### Componentes (`*Game.tsx`)

| Bloque | Abeja | Tambor | Merienda | Fiesta | Estado |
|---|---|---|---|---|---|
| `Props` | 21–32 | 20–31 | 20–31 | 26–34 | = en los tres; Fiesta ≠ (`onPause`, `onExit`, sin `onWin`, `levelCompleted`, `playSound`, `friendlyReplay`) |
| Campos comunes de `Session` (`run`, `clock`, `songStart`, `frameMs`, `countMs`, `countUntil`, `pausedAt`, `frozenPulse`, `lastPulse`, `nextEighth`, `feedback`, `gotaUntil`, `demoVacia`, `ended`) | 35–59 | 33–53 | 33–55 | 37–54 | ≈; Fiesta sin `countMs`/`countUntil`/`pausedAt`/`frozenPulse` |
| `type AudioRig` | 60 | 54 | 56 | 137 (en línea, sin `segment`) | = en los tres; Fiesta ≠ |
| `START_DELAY_S = 0.15`, `STAGE_WIDTH = 960` | 80–81 | 74–75 | 75–76 | 20–21 | = |
| Estado React (`sessionRef`, `informe`, `audioRef`, `frameRef`, `scale`, `mode`, `finished`, `attempted`, `clockKind`, `view`, `showLeave`, `parada`, `practicaRef`, `interactionPaused`, `wasPausedRef`) | 145–160 | 144–159 (+`got`) | 150–165 (+`got`) | 135–152 (`resultado`, `celebrating`, `silent`, `jugado`, `detenido`) | ≈ / Fiesta ≠ |
| Escala con `ResizeObserver` | 163–171 | 162–170 | 168–176 | 154–162 | = |
| Carga de samples | 173–178 | — | — | 164–169 | = (Abeja/Fiesta) |
| Cerrar el contexto al desmontar | 180–183 | 172–175 | 178–181 | 171–174 | = |
| Volúmenes `music`/`cue` | 185–190 | 177–182 | 183–188 | 176–181 | =; Fiesta usa `soundOff = muted \|\| silent` |
| `freshSegment` | 193–199 | 185–191 | 191–197 | — | = |
| `ensureAudio` | 201–225 | 193–217 | 199–223 | 183–202 | ≈ (búfer de ruido 0,25 / 1,2 / 1,2 / 0,2 s); Fiesta: sin `segment`, sin ganancia inicial, el `muted` se mira en `begin` |
| `playNote` | 227–280 | 219–249 | 225–273 | 204–247 | ≠ (ver diferencias de sonido) |
| `playCue` | 282–286 | 251–255 | 275–279 | `playNow` 249–253 + `playSamplesNow` 256–261 | = en los tres; Fiesta ≠ |
| `pulseNow` | 288–296 | 257–265 | 281–289 | 263–270 | = en los tres; Fiesta sin congelar en la cuenta ni en la pausa |
| `react` | 298–322 | 268–285 | 292–309 | 272–297 | ≠ (propio de cada juego) |
| `finish` | 324–333 | 287–296 | 311–320 | 299–307 | ≈ (cambia el cálculo de `informeRitmo`); Fiesta sin `freshSegment` ni `playSound` |
| `strike` / `feed` | 335–341 | 298–303 | 322–327 | 309–316 | ≈ (ver diferencias de comportamiento) |
| `begin` | 343–363 | 305–326 | 329–350 | 318–338 | ≈ (campos propios de la sesión; `setGot(0)` en Tambor/Merienda) |
| Pausa con cuenta de cuatro al seguir | 365–395 | 328–358 | 352–382 | 340–345 (solo `suspend`/`resume`) | ≈ (solo cambia el sonido de la cuenta: `COUNT_TICK`, `BATON`, `hoof`); Fiesta ≠ |
| Bucle `requestAnimationFrame` (reloj, cuenta, programación de corcheas, parada de práctica, demo, fallos, mando, fin) | 397–473 | 360–430 | 384–464 | 347–414 | ≈; cambian la demo, los fallos y la firma de `snapshot`; Fiesta ≠ (reloj en línea, sin cuenta) |
| Espacio en teclado (`onKey`) | 461–467 | 418–424 | 452–458 | 402–408 | ≈ (solo la clase del botón) |
| `confirmWin`, `leave`, `practiceFirst(...)` | 475–480 | 432–437 | 466–471 | — | = |
| `PantallaPrevia` | 530–534 | 492–496 | 528–532 | 474–478 | ≈ (claves de texto) |
| Ventana de parada de práctica | 536–539 | 498–501 | 534–537 | 480–483 | ≈ (claves) |
| `ResultadoMinijuego` + botones | 541–551 | 503–516 | 539–554 | 485–491 | ≈ salvo `dibujo` |
| Ventana de salir/pausa | 553–559 | 518–524 | 556–562 | — | ≈ (claves) |

En Abeja, Tambor y Merienda, entre el 40 % y el 45 % del componente (unas 220 líneas) es código común.

### Módulos lógicos (`*.ts`)

| Bloque | `beeNinja.ts` | `armoniaDrum.ts` | `meriendaJabatos.ts` | `catParty.ts` | Estado |
|---|---|---|---|---|---|
| Reexportar `outputLatencySeconds` de `rhythmEngine.ts` | 1, 5 | 1, 5 | 1, 5 | 1, 5 | = |
| `PULSE_MS`, `PULSES_PER_BAR = 4`, `COUNT_PULSES`, `HIT_WINDOW_PULSES = ajustesRitmo.margen`, `RESUME_COUNT_PULSES = 4` | 10–17 | 11–17 | 11–16 | 10–15 (sin `RESUME`) | ≈ (104 ppm en Abeja; 100 en los demás) |
| `type …Mode = "demo" \| "practice" \| "song"` | 21 | 19 | 18 | 19 | = |
| `barOfPulse`, `scoreLength` (por compases) | 73–74 | 45 (por `barsOf`) | 58 (por `barsOf`) | 69–70 | ≈ |
| `type Outcome` | 204 | 162 | 196 | 184 (sin `challengeCompleted`) | = / Fiesta ≈ |
| `practiceFirst` | 218 | 172 | 206 | — | = |
| `risingEdge` | 221 | 175 | 209 | — (en línea en el componente, 390–392) | = |
| `audioPulse` | 226–227 | 180–181 | 214–215 | 299–300 | = (depende de `PULSE_MS` del módulo) |
| `songStartAfterPause` | 233–234 | 187–188 | 221–222 | — | = (depende de `PULSE_MS` y `RESUME_COUNT_PULSES`) |
| `advanceFrameClock` | 237–245 | 191–199 | 225–233 | — | = |
| Tipo de nota | `BeeNote` 306–317 | `DrumNote` 202–211 | `MeriendaNote` 236–250 | `PartyNote` 238 | ≠ (ver abajo) |
| Tipo de sample + `sample()` + `pitched()` + `SAMPLE_PITCH` | 296–300 | — | — | 227–231 | = |
| `SAMPLE_IDS`, `sampleUrl` | 293–295 | — | — | 223–225 | ≈ (carpeta y lista) |
| Filtros del ruido | en `playNote` del componente | `NOISE_FILTERS` 311–317 | `filter` en cada nota | en `playNote` del componente | ≠ |

### Carga de samples

`beeNinjaSamples.ts` (1–28) y `catPartySamples.ts` (1–28) son idénticos salvo la línea 1 (de dónde importa `SAMPLE_IDS`/`sampleUrl`), el nombre de la función (`loadBeeSamples`/`loadPartySamples`), el comentario y el texto de `console.warn`. Los dos usan `OfflineAudioContext(1, 1, 32000)`, la misma promesa memorizada y el mismo reintento si falla (`loading = null`). Tambor y Merienda no tienen samples: suenan solo con osciladores.

### Lo que ya es común

- `rhythmEngine.ts`: solo se usa `outputLatencySeconds`. `beatTimeMs` y `nearestRhythmTarget` no los importa nadie.
- `pulsacionVacia.ts` (raya, rebote, pulsación vacía, ajustes por la dirección), `practicaPausas.ts` (paradas de la práctica) y `minijuegoComun.tsx` (`PantallaPrevia`, `ResultadoMinijuego`, `informeRitmo`) ya los comparten los cuatro.

## Diferencias que cambian el sonido (`playNote`)

| Aspecto | Abeja | Tambor | Merienda | Fiesta |
|---|---|---|---|---|
| Bus de música | `segment` (tramo) → `music` | `segment` → `music` | `segment` → `music` | `music` directo |
| Dónde se suma `note.offset` | dentro (`start = when + offset`) | dentro | dentro | fuera, en el bucle (`playNote(note, when + note.offset)`, 369) |
| Samples | sí (`sample`, `null` = sustituido, `volume 0` = solo sample) | no | no | sí (igual que Abeja) |
| Ruido | `noise: "high" \| "low" \| "band"` → 6000 Hz paso alto / 900 Hz paso bajo / 3000 Hz paso banda | `noise: high \| low \| band \| clap \| brush` → 5500 / 900 / 3200 / 1400 / 2500 Hz (`NOISE_FILTERS`) | `noise: true` + `filter` en la nota | `noise: true` → siempre paso alto a 6000 Hz |
| Cola del ruido (`stop`) | +0,02 s | +0,02 s | +0,02 s | +0,01 s |
| Búfer de ruido | 0,25 s | 1,2 s | 1,2 s | 0,2 s |
| Filtro sobre el oscilador | no | no | sí (`filter` vale para los dos) | no |
| Ataque del oscilador | 0,006 s (0,06 con vibrato) | 0,006 s | `note.attack ?? 0,006` | 0,008 s |
| Vibrato | `vibrato`: 5,5 Hz, profundidad 1,2 % de la frecuencia, LFO hasta +0,05 s | — | `breath`: 5,2 Hz, 0,6 %, LFO hasta +0,03 s, y la nota se sostiene hasta el 70 % de su duración antes de caer | — |
| Envolvente del ruido | `setValueAtTime(volume)` y caída exponencial a 0,0001 | igual | igual | igual |
| Parada del oscilador | +0,03 s | +0,03 s | +0,03 s | +0,03 s |

La topología es la misma en todos: `fuente → [filtro] → ganancia → bus`. Así que una sola función con estos números como datos suena igual que las cuatro.

## Diferencias de comportamiento (no de sonido)

1. **Pausa.** Abeja, Tambor y Merienda guardan `frozenPulse`, cortan el tramo (`freshSegment`), suspenden el contexto y, al seguir, tocan una cuenta de cuatro pulsos y mueven `songStart` (`songStartAfterPause`). La Fiesta solo hace `suspend()`/`resume()`: no hay cuenta, y las notas ya programadas siguen en la cola. Esto también afecta a las paradas de la práctica: en los tres primeros, SIGUE va seguido de la cuenta de cuatro; en la Fiesta, no.
2. **Cuándo se puede pulsar.** Abeja y Fiesta bloquean con `run.mode === "demo"`; Tambor y Merienda con `run.score.auto` (la partitura dice si es automática). Abeja y Fiesta descartan `pulse < 0`; Tambor y Merienda no. Tambor, Merienda y Abeja bloquean también durante la cuenta de reanudación.
3. **Sonido en la demo.** Tambor y Merienda pasan `automatic = true` a `react` y no tocan la pulsación, porque la partitura de la demo ya lleva el golpe. Abeja y Fiesta sí la tocan.
4. **Pulsación vacía en la demo.** Se llama de otra forma en cada juego: `{ kind: "empty" }` (Abeja, Fiesta), `"uy"` (Tambor) y `"fsss"` (Merienda). `DEMO_VACIA_PULSO` = 15,5 (Abeja), `responseStart(0) + 1` (Tambor), `COUNT_PULSES + 3` (Merienda) y 16 (Fiesta).
5. **Fallos por pulso.** Abeja: `collectFalls` → «¡PLOF!»; Merienda: `missesAt` → «¡AY!» y comida lanzada; Fiesta: `collectMisses` → «rueda»; Tambor no tiene fallos que se escapen.
6. **Reloj de fotogramas.** Tres juegos usan `advanceFrameClock` (que se para durante la cuenta). La Fiesta suma `Math.min(100, delta)` en línea.
7. **Fin.** Tres juegos llaman a `freshSegment()` (cortan la música programada) y a `playSound(checkpoint|hurt)`. La Fiesta no.
8. **Silencio.** La Fiesta tiene su propio botón de sonido (`silent`); las demás obedecen solo a `muted`.
9. **Contenedor.** Los tres duelos usan `Dialog` con `gamepad`; la Fiesta es una `<section data-gamepad-managed>`.

Los puntos 1, 2 y 7 parecen restos de cuando la Fiesta era el primer juego, no decisiones de diseño. Habría que decidir al unificar si la Fiesta gana la cuenta de cuatro, o si el núcleo la deja como opción.

## Propuesta de núcleo común

Tres piezas, de más pura a menos. Ninguna cambia la partitura ni el reloj de audio. El núcleo programa y mide igual que ahora: `songStart + corchea × PULSE_MS / 2000`, con un horizonte de 0,25 s y `outputLatencySeconds`.

### 1. `src/game/ritmoNucleo.ts` (puro, probado con `node:test`)

```ts
export type ModoRitmo = "demo" | "practice" | "song";
export type ResultadoRitmo = { result: "casi" | "bien" | "perfecto"; won: boolean; challengeCompleted: boolean };

/** Tempo de un juego: lo único que hoy cambia entre las copias de los relojes. */
export type Tempo = { pulsoMs: number; pulsosCuenta: number /* RESUME_COUNT_PULSES */ };

export const practicaPrimero = (nivelCompletado: boolean, amistoso: boolean, intentado: boolean) => …; // practiceFirst
export const flanco = (antes: boolean, ahora: boolean) => ahora && !antes;                              // risingEdge
export const pulsoDeAudio = (tempo: Tempo, ahora: number, inicio: number, latencia: number) => …;     // audioPulse
export const inicioTrasPausa = (tempo: Tempo, inicio: number, pausadoEn: number, cuentaEn: number) => …; // songStartAfterPause
export function avanzarRelojFotogramas(reloj: { frameMs: number; countMs: number }, deltaMs: number) {…} // advanceFrameClock

/** Corcheas que tocan antes del horizonte: devuelve [corchea, cuándo] y el siguiente índice. Sustituye el `while` del bucle. */
export function corcheasPendientes(tempo: Tempo, inicio: number, siguiente: number, total: number, ahora: number, horizonte = 0.25):
  { pendientes: { corchea: number; cuando: number }[]; siguiente: number };

/** Pulso que se ve en la cuenta de reanudación (0 si no hay cuenta). */
export function pulsoDeCuenta(tempo: Tempo, quedaSegundos: number | null, quedaMs: number): number;

// Notas y samples
export type Muestra<Id extends string> = { id: Id; gain: number; rate?: number };
export const muestra = …; export const afinada = (tonos: Record<string, number>) => …; // sample(), pitched()
export type NotaRitmo<Id extends string = never> = {
  offset: number; frequency: number; duration: number; wave: OscillatorType; volume: number; bus: "music" | "cue";
  glideTo?: number;
  attack?: number;                                        // si falta, el del perfil
  noise?: string | boolean;                               // nombre del ruido, lo traduce el perfil
  filter?: { type: BiquadFilterType; frequency: number }; // filtro explícito (Merienda), también sobre el oscilador
  vibrato?: boolean; breath?: boolean;                    // los traduce el perfil
  sample?: Muestra<Id> | null;
};
```

`BeeNote`, `DrumNote`, `MeriendaNote` y `PartyNote` pasan a ser alias o subtipos de `NotaRitmo`. Así sus partituras no cambian una línea y las pruebas actuales de `musicForEighth` siguen valiendo. `beeNinja.ts`, `armoniaDrum.ts`, `meriendaJabatos.ts` y `catParty.ts` dejan de copiar los relojes y llaman a los de arriba con su `Tempo`; pueden seguir reexportando `audioPulse` & cía. ya ligados a su tempo para no tocar sus pruebas.

### 2. `src/game/ritmoAudio.ts` (Web Audio, sin React)

```ts
/** Lo que hoy distingue los cuatro `playNote`: números, no lógica. */
export type PerfilSintesis = {
  ataque: number;                         // 0.006 (Abeja, Tambor, Merienda) · 0.008 (Fiesta)
  colaRuido: number;                      // 0.02 · 0.01 (Fiesta)
  segundosRuido: number;                  // 0.25 · 1.2 · 1.2 · 0.2
  filtrosRuido: Record<string, { type: BiquadFilterType; frequency: number }>; // true → clave "true" en Merienda y Fiesta
  vibrato?: { hz: number; profundidad: number; ataque: number; cola: number };  // Abeja: 5.5 · 0.012 · 0.06 · 0.05
  aliento?: { hz: number; profundidad: number; cola: number; sostener: number }; // Merienda: 5.2 · 0.006 · 0.03 · 0.7
  conTramo: boolean;                      // false solo en la Fiesta, hasta decidir el punto 1
};

export type EquipoAudio = { context: AudioContext; music: GainNode; segment: GainNode; cue: GainNode; noise: AudioBuffer };
export function crearEquipoAudio(perfil: PerfilSintesis, volumenes: { musica: number; efectos: number }): EquipoAudio;
export function tramoNuevo(equipo: EquipoAudio): void;                 // freshSegment
export async function despertar(equipo: EquipoAudio): Promise<boolean>; // resume con la carrera de 400 ms
export function tocarNota<Id extends string>(equipo: EquipoAudio, perfil: PerfilSintesis, nota: NotaRitmo<Id>,
  cuando: number, banco: Record<Id, AudioBuffer> | null): void;        // un solo playNote: fuente → [filtro] → ganancia → bus
export function tocarYa(equipo, perfil, notas, banco): void;           // playCue: bus "cue", currentTime + 0.003

/** Sustituye a beeNinjaSamples.ts y catPartySamples.ts. */
export function cargadorMuestras<Id extends string>(ids: readonly Id[], url: (id: Id) => string, aviso: string):
  () => Promise<Record<Id, AudioBuffer> | null>;
```

Una prueba de equivalencia, con un `AudioContext` falso que anote las llamadas (`setValueAtTime`, `exponentialRampToValueAtTime`, `start`, `stop`, `type` y `frequency` del filtro), puede comparar los grafos de cada juego antes y después con todas las notas de sus partituras. Así se comprueba sin oídos que suenan igual.

### 3. `src/game/useMinijuegoRitmico.ts` (hook)

```ts
type SesionBase<Run> = {
  run: Run; clock: "audio" | "frame"; songStart: number; frameMs: number; countMs: number; countUntil: number | null;
  pausedAt: number | null; frozenPulse: number; lastPulse: number; nextEighth: number; ended: boolean;
};

export function useMinijuegoRitmico<Run extends { mode: ModoRitmo }, Extra, Nota extends NotaRitmo<any>>(opciones: {
  tempo: Tempo; perfil: PerfilSintesis; anchoEscena?: number;            // 960
  muestras?: () => Promise<Record<string, AudioBuffer> | null>;
  silencio: boolean; volumenMusica: number; volumenEfectos: number;
  detenido: boolean;                                                     // pausa de App + ventana de salir + parada de práctica
  cuentaAlSeguir: Nota[] | ((primera: boolean) => Nota[]) | null;        // COUNT_TICK / BATON / hoof; null = Fiesta de hoy
  crearRun: (modo: ModoRitmo) => Run; sesionExtra: () => Extra;
  largo: (run: Run) => number;                                           // scoreLength
  musicaDeCorchea: (run: Run, corchea: number) => Nota[];
  sePuedePulsar: (sesion: SesionBase<Run> & Extra, pulso: number) => boolean; // demo/auto, pulso < 0
  alPulsar: (sesion, pulso: number) => void;                             // pressAt + react del juego
  alFotograma: (sesion, pulso: number, cuenta: number) => "sigue" | "fin" | "parada"; // demo, fallos, práctica
  alTerminar: (sesion) => void;
  claseBotonGolpe: string;                                               // Espacio solo vale sobre ese botón
}): {
  frameRef: RefObject<HTMLDivElement>; escala: number; reloj: "audio" | "frame" | null;
  sesion: RefObject<(SesionBase<Run> & Extra) | null>;
  empezar: (modo: ModoRitmo) => Promise<void>; pulsar: () => void; terminar: () => void;
  tocarYa: (notas: Nota[]) => void;                                       // para react
};
```

El hook se queda con todo lo que hoy es idéntico: escala con `ResizeObserver`, carga de samples, cierre al desmontar, volúmenes, `ensureAudio`, `freshSegment`, `pulseNow`, el efecto de pausa con la cuenta, el bucle de `requestAnimationFrame` (reloj, `corcheasPendientes`, mando por flanco, fin de la partitura) y el Espacio del teclado. El juego conserva `react`, `snapshot`, `View`, sus campos de sesión (`Extra`) y todo el escenario.

Para la interfaz, en `minijuegoComun.tsx` cabrían dos piezas más: `<VentanaParada>` (rótulo, «para leer juntos» y SIGUE) y `<VentanaSalir>` (pausa o salida con SEGUIR y MAPA/AMIGOS). Las dos se repiten al pie de la letra en los tres duelos y solo cambian las claves.

### Orden sugerido

1. `ritmoNucleo.ts` con los relojes y `NotaRitmo`; los cuatro módulos lógicos lo usan. Sin riesgo: las pruebas de lógica actuales lo cubren.
2. `ritmoAudio.ts` con la prueba de equivalencia de grafos; los cuatro `playNote` pasan a `tocarNota` con su perfil.
3. `useMinijuegoRitmico` en Abeja, Tambor y Merienda, que comparten el comportamiento.
4. Fiesta: decidir antes si gana la cuenta de cuatro, el bus de tramo y el corte al terminar (diferencias 1, 2 y 7). Si no, `cuentaAlSeguir: null` y `conTramo: false` conservan lo de hoy.
5. Quitar `beatTimeMs` y `nearestRhythmTarget` de `rhythmEngine.ts`, o moverlos al núcleo, porque no se usan.

Ahorro estimado: unas 200 líneas por duelo, unas 120 en la Fiesta, unas 25 en cada módulo lógico y un archivo de samples. En total, entre 700 y 800 líneas, sin tocar partituras ni arte.
