# Un AudioContext para todo el juego o uno por pantalla

Investigación de la issue [#286](https://github.com/Mocheto/super-noa/issues/286), hija del mapa [#282](https://github.com/Mocheto/super-noa/issues/282). Fecha: 2026-11-20. Empaquetado de referencia: TWA con Bubblewrap ([#114](https://github.com/Mocheto/super-noa/issues/114)), es decir, el juego corre dentro de Chrome en Android, no en una WebView propia.

## Qué hay hoy en el código

| Dónde | Cómo crea el contexto | Cuándo lo cierra | Pausa / oculto |
| --- | --- | --- | --- |
| `App.tsx` `createAudioContext()` (efectos de la partida) | Perezoso en el primer `playSound`, con respaldo `webkitAudioContext` | Nunca | No lo suspende; solo `resume()` si está `suspended` |
| `music.ts` (música de los mundos) | No usa Web Audio: `HTMLAudioElement` con `audio.volume` | Pausa el elemento | Lo pausa App |
| `casaSonido.ts` | Perezoso al primer toque, con respaldo webkit | `cerrar()` al salir de la casa | No |
| `casaNana.ts` | Perezoso en `empezar()` (toque), con respaldo webkit | `cerrar()` al salir de la casa | No |
| `AvionetaGame.tsx` `useWaltz` | `new AudioContext()` sin respaldo, en un `useEffect` | Al desmontar **y cada vez que cambia `volume`** (dependencia del efecto) | No |
| `BeeNinjaGame`, `ArmoniaDrumGame`, `MeriendaJabatosGame`, `CatPartyGame` | `new AudioContext()` sin respaldo en `ensureAudio()`, tras el gesto; espera `resume()` hasta 400 ms | Al desmontar | `suspend()` / `resume()` en la pausa, con cuenta de cuatro sobre `currentTime` |
| `rhythmEngine.ts` `outputLatencySeconds` | Suma `outputLatency + baseLatency`, limitado a 0–250 ms | — | — |

Consecuencias observadas en el código:

- **Contextos vivos a la vez**: el de `App.tsx` no se cierra nunca, así que dentro de la casa conviven tres (`App` + `casaSonido` + `casaNana`) y en un minijuego dos (`App` + el del minijuego). Seis distintos a lo largo de una sesión.
- Los samples (`beeNinjaSamples.ts`, `catPartySamples.ts`) se decodifican con un `OfflineAudioContext` aparte; un `AudioBuffer` no pertenece a ningún contexto, así que sirven igual en uno compartido.
- La avioneta abre y cierra un contexto nuevo cada vez que se mueve el volumen.
- La música usa `HTMLAudioElement.volume`, que **en iOS no hace nada** (ver abajo): el control de volumen de música no funciona en iPhone/iPad.

## Hechos con fuentes

### Número de contextos

- **Chrome / Chrome Android / WebView**: antes de Chrome 66 había un tope de 6 contextos por pestaña y el séptimo lanzaba `DOMException`; desde 66 no hay tope documentado ([MDN BCD, `AudioContext()`](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext), datos de compatibilidad 8.1.10). La especificación no fija máximo ni mínimo y deja el límite al navegador ([W3C public-audio, 2014](https://lists.w3.org/Archives/Public/public-audio/2014JulSep/0143.html)).
- **Safari iOS**: el límite histórico de 4 contextos por página ([WebKit 95757](https://bugs.webkit.org/show_bug.cgi?id=95757), cerrado) ya no está documentado como vigente; se repite en blogs sin fuente oficial ([bugnet.io](https://bugnet.io/blog/fix-web-audio-multiple-context-error-safari-ios)). **No verificado** en iOS 18/26. Sí hay casos de agotar recursos al crear muchos contextos sin liberarlos ([WebKit 198964](https://bugs.webkit.org/show_bug.cgi?id=198964), `OfflineAudioContext` no recogidos).
- `close()` libera los recursos del sistema que impedirían crear más contextos y su promesa se resuelve cuando ya están libres; un contexto cerrado no se puede reabrir ([MDN `close()`](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/close)).
- Recomendación general de Chrome y MDN: **un contexto por página**, con todos los nodos colgando de él; varios contextos cuestan rendimiento ([Chrome Web Audio FAQ](https://developer.chrome.com/blog/web-audio-faq), [MDN AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext)). Cada contexto tiene su propio reloj `currentTime` y su propio hilo de render.

Conclusión: con 2–3 contextos vivos no se choca con ningún límite documentado hoy, pero es justo la zona donde el límite viejo de iOS (4) haría daño, y el contexto de `App.tsx` que nunca se cierra suma siempre uno.

### Desbloqueo por gesto

- Chrome (71+): un contexto creado antes de un gesto nace `suspended`; se arranca con `resume()` (o `start()` de un nodo) dentro de un gesto. Se puede crear antes y reanudar después ([Chrome autoplay policy](https://developer.chrome.com/blog/autoplay)).
- Safari (macOS 14.1+, iOS 14.5+): los contextos nuevos están suspendidos hasta `resume()` en una acción de la persona ([MDN BCD](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext)).
- La TWA es Chrome: misma política que Chrome Android (no hay `setMediaPlaybackRequiresUserGesture` como en una WebView propia).
- Con un contexto por pantalla, **cada contexto nuevo hay que desbloquearlo otra vez** con un gesto. Hoy funciona porque los minijuegos crean el suyo al pulsar PRACTICA / ¡A JUGAR!, pero la espera de 400 ms de `ensureAudio()` existe precisamente porque ese `resume()` puede tardar o no resolverse. Un contexto compartido desbloqueado una vez (primer toque en el juego) sigue `running` en las pantallas siguientes.

### Pestaña oculta, `suspend` / `resume`, estado `interrupted`

- Safari iOS añade el estado no estándar `interrupted` (llamada, Siri, otra app con audio, pantalla bloqueada); se sale con `resume()` ([MDN `state`](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state)). WebKit reconoce que no debería exponerlo ([WebKit 276016](https://bugs.webkit.org/show_bug.cgi?id=276016)).
- Fallos abiertos en iOS 17–18: al volver de segundo plano el contexto a veces no se reanuda, o dice `running` con `currentTime` parado ([WebKit 263627](https://bugs.webkit.org/show_bug.cgi?id=263627), abierto); `resume()` puede no resolverse nunca tras pasar a segundo plano ([WebKit 281566](https://bugs.webkit.org/show_bug.cgi?id=281566)); cerrar otra pestaña con audio deja muda la primera ([WebKit 276687](https://bugs.webkit.org/show_bug.cgi?id=276687), abierto, reproducido en iOS 18 beta). El remedio común en esos informes es **`suspend()` al ocultarse y `resume()` al volver** (en `visibilitychange`), a veces con un retraso de ~300 ms ([WebKit 202846](https://bugs.webkit.org/show_bug.cgi?id=202846)).
- Chrome Android no suspende solo el contexto de una pestaña oculta (indicio indirecto, [foro PlayCanvas](https://forum.playcanvas.com/t/ios-audio-context-suspended-on-visibility-change/20524)); un contexto `running` mantiene activo el backend de audio aunque esté en silencio, con coste de batería ([Mozilla 1427937](https://bugzilla.mozilla.org/show_bug.cgi?id=1427937)). Por eso conviene suspender al ocultar también en Android.
- Hoy solo los minijuegos rítmicos suspenden (y lo hacen por la pausa de App, que sí escucha `visibilitychange` y `blur`); el contexto de `App.tsx`, los de la casa y el de la avioneta no se suspenden nunca. Varios contextos significan varios sitios donde repetir (y equivocarse en) esta lógica de recuperación.

### Latencia de salida

- `AudioContext.outputLatency`: Chrome / Chrome Android / WebView 102+, **Safari e iOS 18.4+** (Baseline 2025); `baseLatency`: Chrome 58+, Safari 14.1 / iOS 14.5+ ([MDN BCD](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/outputLatency)). En iOS < 18.4 `outputLatency` es `undefined` y `outputLatencySeconds` cae a solo `baseLatency` (el `|| 0` ya lo cubre).
- La latencia depende del dispositivo y de la salida (los auriculares Bluetooth la suben mucho) y puede cambiar mientras el contexto vive; con un contexto compartido hay un único valor que leer y que se estabiliza, en vez de uno nuevo por minijuego.

### Otras piezas del audio en iOS

- `HTMLMediaElement.volume` en iOS devuelve 1 y escribirlo no cambia nada ([MDN BCD `volume`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/volume)). La música de `music.ts` solo puede bajarse en iPhone si pasa por Web Audio (`createMediaElementSource` → `GainNode`).
- `navigator.audioSession.type` (Safari / iOS 16.4+, experimental) elige `ambient` (se mezcla con otras apps) o `playback` (exclusivo) ([MDN AudioSession.type](https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type)); se aplica a la página entera, no a un contexto.
- `new AudioContext()` sin prefijo existe desde Safari 14.1 / iOS 14.5 ([MDN BCD](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext)): la falta de respaldo `webkitAudioContext` en los minijuegos solo deja mudos iOS < 14.5, pero es incoherente con App y la casa.

### Coste de cerrar y crear

- Crear un contexto abre un flujo de salida con el sistema y un hilo de render; cerrarlo es asíncrono y libera esos recursos al resolverse ([MDN `close()`](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/close)). Los minijuegos hacen `void close()` sin esperar, y la avioneta encadena cerrar/crear al mover el volumen: si se crea el siguiente antes de liberar el anterior se acumulan.
- No encontré mediciones publicadas del tiempo de crear/cerrar en móvil. **No verificado**.

## Recomendación para Super Noa

**Un único `AudioContext` compartido para todo el juego, con un bus (`GainNode`) por zona**, en lugar de uno por pantalla. Razones: un solo desbloqueo por gesto, un solo lugar para `suspend`/`resume`/`interrupted` (donde están los fallos abiertos de iOS), un único reloj y una única `outputLatency`, ningún riesgo de topes de contextos, y permite arreglar el volumen de música en iOS. Los minijuegos ya están casi preparados: todos montan `music`/`segment`/`cue` sobre su contexto; solo cambia de dónde sale el contexto y que al salir se desconecta el bus en vez de cerrar el contexto.

Pasos propuestos (cada uno, una tarea):

1. **Módulo `src/game/audio.ts`** con `contextoAudio()` perezoso (con respaldo `webkitAudioContext`), un bus maestro y buses `musica`, `efectos` y `zona` (`abrirZona()` devuelve un `GainNode` nuevo colgado del maestro; `cerrarZona()` lo baja con una rampa corta y lo desconecta). Sin `close()` salvo al descargar la página.
2. **Desbloqueo único**: en el primer `pointerdown`/`keydown` del juego, `resume()` del contexto compartido; `ensureAudio()` de los minijuegos solo comprueba `state === "running"` (mantener el tope de 400 ms como red).
3. **Ciclo de vida central**: en `App.tsx`, `visibilitychange` oculto → `suspend()`; visible → `resume()` con ~300 ms de retraso y, si sigue `interrupted` o `currentTime` no avanza, `suspend()` + `resume()` otra vez; también `statechange`. Los minijuegos conservan su pausa propia (`suspend` + cuenta de cuatro), pero sobre el contexto compartido y sabiendo que App puede haberlo suspendido antes.
4. **Migrar uno a uno**: efectos de `App.tsx` → bus `efectos`; `casaSonido` y `casaNana` → dos buses de zona de la casa; avioneta → bus de zona, y sacar `volume` de las dependencias del efecto (ajustar la ganancia en otro efecto); los cuatro rítmicos → `ensureAudio()` pide el contexto compartido y crea sus buses dentro de un bus de zona.
5. **Música por Web Audio** (opcional, arregla iOS): `createMediaElementSource(audio)` al bus `musica` y volumen por ganancia; mantener `HTMLAudioElement` para el streaming de los mp3 grandes.
6. **`navigator.audioSession.type = "ambient"`** donde exista, para que el juego se mezcle con otro audio del dispositivo (decisión de producto: también hace que el interruptor de silencio lo calle).
7. **Prueba en dispositivo** (iPhone con iOS 18 y Android con la TWA): pasar de partida a casa, a minijuego y a avioneta; bloquear la pantalla en medio de un minijuego y volver; recibir una notificación con sonido; auriculares Bluetooth (latencia). Anotar `outputLatency` y `baseLatency` con `ritmoInforme`.

Mientras tanto, si se mantiene uno por pantalla, lo mínimo sería: cerrar el de `App.tsx` al entrar en la casa o en un minijuego (o suspenderlo), añadir el respaldo webkit a los minijuegos y la avioneta, esperar el `close()` antes de crear otro, y quitar `volume` de las dependencias de `useWaltz`.
