# Cuándo se guarda el progreso y qué pasa con dos pestañas

Investigación de [Medir cuándo se guarda el progreso y qué pasa con dos pestañas](https://github.com/Mocheto/super-noa/issues/299), hija del mapa [#282](https://github.com/Mocheto/super-noa/issues/282). Código leído en `main` a partir de `078683b`.

## Cómo se guarda hoy

- `App.tsx` guarda en un efecto que depende de `progress`: `saveProgress(progress)` → `writeStorage("super-noa-progress-v1", serializeProgress(progress))`, síncrono, en cada confirmación de React que cambie la referencia de `progress`. Si `setProgress` devuelve el mismo objeto (por ejemplo `handleSnapshot` sin pegatinas nuevas), React no vuelve a pintar y no se escribe.
- Cada escritura serializa el progreso **entero** (con `version: 2` y los normalizadores).
- No hay oyente del evento `storage`, ni `BroadcastChannel`, ni `navigator.locks`. La única lectura de `localStorage` es la inicial (`useState(readProgress)`).
- No hay guardado en `visibilitychange`/`pagehide`, pero tampoco hace falta hoy: como cada cambio se escribe al momento, al cerrar la pestaña no queda nada sin guardar.
- El mismo efecto alimenta otro: con el tablón activado, **cada** cambio de `progress` lanza 250 ms después `syncRanking` (un `POST /v1/progress` y un `GET /health`), aunque lo que cambie sea solo la casa.

## Medidas

### Escrituras por minuto jugando una pantalla

Fuentes de `setProgress` durante una pantalla (`App.tsx`):

| Suceso | Escrituras |
| --- | --- |
| Cada manzana (`handleAppleCollected` → `collectLifetimeApples`) | 1 por manzana |
| Pegatina nueva (`handleSnapshot`) | 1 por pegatina |
| Tienda secreta, desvío, saludo a un amigo del paseo | 1 por suceso |
| Meta (`handleComplete`), duelo ganado | 1–2 |

Las 49 pantallas tienen entre 3 y 15 manzanas (media 7,3, mediana 7, contando `items` de tipo manzana y cajas que dan manzana). Una pantalla de 2–3 minutos da unas **10 escrituras**, es decir **3–5 por minuto**, en ráfagas de como mucho dos o tres por segundo al coger manzanas seguidas. Perder una vida no escribe.

### Escrituras por minuto en la casa

`CasaGatitos.guardar()` llama a `onGuardar`, y `App` hace `setProgress((c) => ({ ...c, casa }))` (siempre un objeto nuevo, siempre escribe). Hay 19 llamadas a `guardar`:

- **Reloj de la casa: 1 por minuto, siempre**, aunque nadie toque nada. `avanzar()` cambia `calculadoEn` cada vez (comprobado: devuelve otra referencia y otro `calculadoEn`).
- **Huellas de barro:** cada 6 s, si hay algún gatito sucio, hasta 6 huellas (`MAX_HUELLAS`): como mucho 6 escrituras en 36 s y luego paran.
- **Cada cuidado o juego:** dar de comer, frotar, pelota, colchoneta, mariposa, regar, barrer, decorar, foto, vestidor, elegir quién está en casa, visitante: 1 por acción terminada (el frote y el baño guardan al acabar, no durante el gesto).

Casa quieta: **1 por minuto**. Jugando en la casa: **5–15 por minuto** como estimación, con picos de 10–12 en el primer minuto si hay gatitos sucios. Este reloj **no se para con la pestaña oculta**: la pausa automática solo vale para pantallas con tiempo (`isTimedScreen`), y la casa no lo es. En Chrome, una pestaña oculta sigue ejecutando un intervalo de 60 s (el estrangulamiento lo deja en una vez por minuto como mucho); Safari en iOS congela la pestaña al poco de ocultarla.

### Peso del JSON

Medido con un script de Node sobre las funciones puras (`parseProgress` y `serializeProgress`) con un progreso máximo: 49 pantallas completadas, 51 pegatinas, todos los duelos, 5 tiendas, 45 amigos con cinco corazones y casa con 17 gatitos, ropa completa, favoritas, jardín, visitante, 6 huellas y 12 fotos (`MAX_FOTOS`).

| Progreso | Bytes |
| --- | --- |
| Vacío | 213 |
| Campaña completa sin casa | ≈ 5,5 KB |
| Campaña y casa sin fotos | ≈ 10,1 KB |
| Todo, con 12 fotos | **≈ 20,7 KB** (≈ 21–23 KB con todos los desvíos y paseos) |
| Una foto | 840 B (habitación) / 924 B (jardín) |

Las fotos son la mitad del peso. Las necesidades se guardan con todos sus decimales (por ejemplo `0.4567891234`). En `localStorage` (UTF-16, cuota típica de 5 M caracteres por origen) son unos 42 KB: menos del 1 % de la cuota.

`serializeProgress` del progreso máximo tarda 0,12 ms y `parseProgress` 0,19 ms en Node 22 sobre un Mac. En un móvil modesto pueden ser 1–2 ms por escritura, más el `setItem` síncrono de unos 21 KB. Con 5–15 escrituras por minuto es despreciable: **el coste no justifica agrupar**.

## Qué pasa con dos pestañas

Cada pestaña lee el progreso una vez al abrir y después solo escribe su copia en memoria, entera. La última que escribe gana y pisa todo lo que la otra haya guardado, aunque sean partes que no ha tocado (la casa pisa la campaña y al revés).

### Cuándo se pierde progreso de verdad

1. **Casa abierta en una pestaña olvidada (riesgo alto).** Pestaña A en la casa; Noa (o un adulto) abre el juego en la pestaña B, completa pantallas, gana pegatinas y cierra B. En menos de un minuto el reloj de la casa de A escribe su copia antigua: **lo conseguido en B desaparece** sin aviso. Como el reloj escribe aunque nadie toque A y aunque A esté oculta (en escritorio y Android), esto no necesita ninguna acción de nadie. Es el caso más probable con una niña que abre el juego desde un favorito o desde el historial.
2. **Dos pestañas jugando a la vez (riesgo medio).** Cualquier escritura de A (una manzana, una pegatina) después de que B haya avanzado deja guardada la copia de A. Si B sigue abierta, su siguiente escritura lo «arregla» (vuelve a ganar B), pero lo que A consiguió se pierde. El resultado final depende de quién escriba la última vez antes de cerrar.
3. **«Borrar progreso» en una pestaña (riesgo bajo, al revés).** Si un adulto borra en A y B sigue abierta, la siguiente escritura de B devuelve el progreso borrado. No pierde nada, pero confunde.
4. **Tablón.** Una pestaña antigua también envía al tablón su copia antigua; según cómo fusione el servidor, el tablón puede bajar de marca hasta que la otra pestaña vuelva a enviar.

### Lo que no hace perder progreso

- **Cerrar la pestaña o el navegador:** cada cambio ya está en `localStorage` en la misma confirmación de React. Las manzanas de una pantalla a medias ya están sumadas en `totalApples`; lo que no se guarda (pantalla a medias, vidas) no forma parte del progreso.
- **Cuota llena o almacenamiento bloqueado:** `writeStorage` devuelve `false` y `App` lo muestra (`saveError`); no corrompe lo anterior.
- **Migración:** `parseProgress` tolera campos ausentes y migra los guardados sin `version: 2`; nada de lo propuesto la toca.

## Recomendación

En orden de prioridad. Ninguna cambia la clave `super-noa-progress-v1`, el formato `version: 2` ni la migración: todo pasa por `parseProgress` y `serializeProgress`.

### 1. Escuchar el evento `storage` y adoptar lo que escriba otra pestaña

En `App.tsx`, un efecto con `window.addEventListener("storage", …)` filtrado por `event.key === STORAGE_KEY` (y `event.storageArea === localStorage`):

- `event.newValue === null` (borrado desde otra pestaña o desde las herramientas): adoptar `emptyProgress`.
- Si no, `setProgress(parseProgress(event.newValue))`. Así la copia en memoria de esta pestaña pasa a ser la última guardada, y su siguiente escritura parte de ella, no de una copia antigua.
- Para no reescribir lo mismo que se acaba de leer: guardar en un `ref` la última cadena escrita o leída y, en el efecto de guardado, no llamar a `writeStorage` si `serializeProgress(progress)` es igual. El evento `storage` no salta en la pestaña que escribe, así que no hay bucle.
- Como `setProgress` se usa siempre con funciones (`current => …`), lo que pase después en esta pestaña (otra manzana) se aplica encima del estado adoptado.

El hueco que queda (las dos pestañas escriben en el mismo instante, antes de recibir el evento de la otra) es de milisegundos. Si se quiere cerrar también, se puede fusionar en lugar de sustituir: `fusionarProgreso(local, remoto)` pura y probada en `progress.ts`, monótona para la campaña (`unlocked` y `bestApples` con el máximo, `completed`/`flawless`/pegatinas/duelos/tiendas/desvíos/paseos con la unión, `totalApples` con el máximo, amigos con el máximo de corazones) y, para `casa`, la de `calculadoEn` más reciente. No es imprescindible para el caso 1, que es el que pierde progreso de verdad.

### 2. La casa abierta debe recibir el cambio de la otra pestaña

`CasaGatitos` trabaja sobre su propio `casaRef` y no vuelve a leer la prop `casa`; si se adopta un progreso nuevo con la casa abierta, su siguiente `guardar` volvería a escribir la casa antigua (aunque ya no la campaña antigua, porque `onGuardar` solo cambia `casa`). Dos opciones, de más simple a más fina:

- **Simple:** si llega un evento `storage` con la pantalla `casa` abierta y la casa remota es distinta, volver al mapa con el progreso adoptado (`onSalir`). Noa vuelve a entrar y ve la casa al día.
- **Fina:** que `CasaGatitos` acepte una casa nueva por prop (por ejemplo con una `key` que cambie al adoptar un progreso remoto, lo que la vuelve a montar).

### 3. El reloj de la casa no escribe con la pestaña oculta

Parar los intervalos del reloj y de las huellas mientras `document.visibilityState === "hidden"` y, al volver a verse, hacer un `avanzar()` inmediato. `avanzar` calcula las necesidades a partir de `calculadoEn`, así que el resultado es el mismo y la pestaña olvidada deja de escribir sola cada minuto. Esto ya elimina por sí solo la mayor parte del caso 1, aunque se haga antes que el punto 1.

### 4. Releer al volver a la pestaña

En `visibilitychange` → `visible` y en `pageshow` con `event.persisted` (vuelta desde la caché de atrás y adelante, donde los eventos `storage` pueden no haberse entregado): comparar `readStorage(STORAGE_KEY)` con la última cadena conocida y, si es distinta, adoptarla como en el punto 1. Es barato (0,2 ms) y cubre Safari en iOS, que congela las pestañas ocultas.

### 5. No agrupar las escrituras (por ahora)

Con 3–5 escrituras por minuto jugando, 5–15 en la casa y unos 21 KB por escritura, el coste es de milisegundos por minuto. Agrupar (escribir como mucho cada 1–2 s) abriría una ventana para perder lo último al cerrar, y en iOS `pagehide`/`visibilitychange` no siempre llegan a ejecutarse antes de que el sistema mate la pestaña. Lo que sí conviene:

- **Saltar escrituras idénticas** (la cadena igual que la última escrita, ver punto 1).
- Si algún día se agrupa (por ejemplo, si las fotos pasan a guardar más datos), hacerlo con un temporizador corto de 1 s y vaciarlo siempre en `visibilitychange` → `hidden` y en `pagehide` (no en `beforeunload` ni en `unload`, que en móvil no son fiables y rompen la caché de atrás y adelante).
- Opcional: redondear las necesidades de la casa a tres decimales al serializar quitaría unos 1–2 KB sin cambiar el comportamiento.

### 6. No enviar al tablón lo que no le importa

Hacer que el efecto del tablón dependa de `JSON.stringify(rankingProgress(progress))` (memorizado) en lugar de `progress`. Hoy, con el tablón activado, la casa provoca un `POST` y un `GET /health` cada minuto y en cada cuidado, aunque el tablón no use nada de la casa.

### Pruebas que acompañarían el cambio

- `fusionarProgreso` (si se hace): monotonía de la campaña, casa más reciente, y que `parseProgress(serializeProgress(fusion))` sea estable.
- Prueba lógica del ciclo «leer → otra pestaña escribe → adoptar → escribir» con un `localStorage` falso, comprobando que no se pierde lo de la otra pestaña y que no se reescribe una cadena idéntica.
- Los guardados antiguos sin `version` siguen migrando igual (las pruebas actuales de `progress.test.ts` no deberían cambiar).
