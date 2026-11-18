# Empaquetar Super Noa para Google Play: TWA o Capacitor

Investigación para [#114](https://github.com/Mocheto/super-noa/issues/114), dentro del mapa [#113](https://github.com/Mocheto/super-noa/issues/113). Fecha: 18-11-2026. Fuentes primarias enlazadas en cada apartado; al final se separa lo que no se ha podido verificar.

## Recomendación

**Trusted Web Activity generada con Bubblewrap**, verificando el origen `https://mocheto.github.io` con un repositorio de usuario `Mocheto/Mocheto.github.io` que solo publique `/.well-known/assetlinks.json`. El juego sigue sirviéndose desde `https://mocheto.github.io/super-noa/`, así que **no cambia el origen** y el progreso guardado en `localStorage` (`super-noa-progress-v1`) y el CORS del ranking siguen valiendo.

Motivos para este juego:

1. El mapa pide primero una PWA instalable y sin conexión. Una TWA es exactamente esa PWA dentro de Chrome: el manifiesto, el service worker y la caché por mundos que haga falta para la PWA son el mismo trabajo que necesita la TWA. Capacitor duplicaría la entrega.
2. Las actualizaciones siguen el flujo de AGENTS.md (commit a `main` → GitHub Pages). La app de Play solo se vuelve a subir cuando cambia el envoltorio (icono, versión de API objetivo, orientación).
3. El paquete es diminuto (sin los 176 MB): no hay que pensar en límites de descarga ni en Play Asset Delivery.
4. No hay proyecto nativo que mantener a mano: `twa-manifest.json` regenera el proyecto Android con `bubblewrap update`.

Capacitor queda como **camino para iOS (App Store)** en el mapa posterior y como plan B en Android si la TWA no sirviera (por ejemplo, si la política de familias o un dispositivo sin Chrome lo exigieran). Nada de lo que se haga para la TWA lo cierra: la base web es la misma.

## Comparativa rápida

| Tema | TWA (Bubblewrap / PWABuilder) | Capacitor 8 |
| --- | --- | --- |
| Qué ejecuta el juego | El navegador del usuario (Chrome) a pantalla completa | WebView del sistema con los archivos dentro del APK, servidos en `https://localhost` |
| Origen web | `https://mocheto.github.io` (el mismo de la web) | `https://localhost` en Android, `capacitor://localhost` en iOS: origen nuevo |
| Progreso de la web | Se conserva (mismo origen; ver «no verificado») | No se comparte con la web; habría que migrar o empezar de cero |
| Ranking (CORS) | Sin cambios | Añadir los orígenes de Capacitor a `allowedOrigins` en `server/ranking-server.mjs` |
| Peso en Play | Pocos cientos de KB | ~176 MB + runtime, salvo descarga diferida propia |
| Sin conexión | Service worker (el mismo de la PWA) | De serie para lo que va empaquetado |
| Actualizaciones | En vivo desde Pages | Nueva versión en Play (o un servicio de «live updates») |
| Botón «atrás» | Historial del navegador (`history`/`popstate`) | Plugin `App` con evento `backButton` y `exitApp()` |
| Orientación | `orientation: landscape` en el manifiesto / `twa-manifest.json` | Manifiesto Android + plugin Screen Orientation |
| iOS | No existe TWA en iOS; solo PWA en Safari | Mismo proyecto con plataforma iOS (Xcode 26+, iOS 15+) |
| Mantenimiento | Bajo: subir API objetivo una vez al año | Medio: Gradle, AGP, Android Studio, plugins, API objetivo, y luego Xcode |

## Requisitos actuales de Google Play

- **AAB obligatorio** para apps nuevas desde agosto de 2021 ([Android App Bundle](https://developer.android.com/guide/app-bundle)). Bubblewrap genera `app-release-bundle.aab` ([README de Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap/blob/main/packages/cli/README.md)); Capacitor genera el AAB desde Android Studio/Gradle.
- **API objetivo**: desde el 31-08-2026, las apps nuevas y las actualizaciones deben apuntar a **Android 16 (API 36)**; prórroga posible hasta el 01-11-2026 ([target SDK](https://developer.android.com/google/play/requirements/target-sdk)). Capacitor 8 ya trae `targetSdkVersion = 36`, `compileSdkVersion = 36`, `minSdkVersion = 24` y AGP 8.13 ([actualizar a 8.0](https://capacitorjs.com/docs/updating/8-0)). El README de Bubblewrap no dice qué API objetivo usa la versión actual: hay que comprobarlo al generar (ver «no verificado»).
- **Páginas de 16 KB**: obligatorio solo para apps con código nativo (`.so`); las que solo usan Java/Kotlin ya cumplen. Desde el **01-02-2027** no se podrán publicar actualizaciones que no lo soporten ([page sizes](https://developer.android.com/guide/practices/page-sizes)). Una TWA no lleva `.so`. Capacitor tampoco en su núcleo, pero cada plugin con código nativo habría que revisarlo con el APK Analyzer.
- **Firma**: las apps nuevas se inscriben automáticamente en Play App Signing; Google guarda la clave de firma y nosotros solo la clave de subida. Desde la consola se copian las huellas SHA-256 de la clave de firma de la app ([Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)). **Para la TWA, `assetlinks.json` debe incluir la huella de la clave de firma de Play**, no solo la de subida; si no, la app abre con barra de direcciones.
- **Cuenta personal nueva**: prueba cerrada con **al menos 12 personas durante 14 días seguidos** antes de pedir acceso a producción ([requisitos de prueba](https://support.google.com/googleplay/android-developer/answer/14151465)). Encaja con la «prueba cerrada para la familia» del mapa, pero hacen falta doce cuentas de Google.

## Verificación del dominio con la subruta `/super-noa/`

- Chrome solo busca `assetlinks.json` en `https://<origen>/.well-known/assetlinks.json`, y la verificación es por origen (esquema + host), no por ruta ([guía de integración](https://developer.chrome.com/docs/android/trusted-web-activity/integration-guide), [varios orígenes](https://developer.chrome.com/docs/android/trusted-web-activity/multi-origin)). Si no se verifica, la app abre como Custom Tab con barra de direcciones.
- GitHub Pages sirve un sitio de usuario desde el repositorio `<owner>.github.io` en la raíz `https://<owner>.github.io`, y los de proyecto en `/<repositorio>` ([tipos de sitio](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)).

Opciones:

1. **Repositorio `Mocheto/Mocheto.github.io` (recomendada)**: solo contiene `.well-known/assetlinks.json` (y quizá una página que redirija a `/super-noa/`). El origen sigue siendo `https://mocheto.github.io`: no se pierde progreso ni hay que tocar CORS. Hay que incluir `.nojekyll` (o desplegar con Actions) para que Pages publique la carpeta que empieza por punto. Contrapartida: cualquier otro sitio de proyecto bajo `mocheto.github.io` queda dentro del mismo origen de confianza.
2. **Dominio propio** (por ejemplo, un subdominio de un dominio que ya se tenga): `assetlinks.json` va en la raíz del propio sitio. Pero **cambia el origen**: el progreso de quien ya juega en `mocheto.github.io` no pasa solo al nuevo dominio, y hay que añadir el origen al ranking. Solo compensa si se quiere el dominio por otros motivos.
3. **Capacitor**: no necesita `assetlinks.json` (no hay verificación de origen), pero cambia el origen igualmente (`https://localhost`).

## Sin conexión y peso (176 MB)

- Límites de Play por tamaño de descarga comprimida: módulo base 500 MB, cada asset pack 1,5 GB, install-time combinados 4 GB, fast-follow + on-demand 30 GB ([límites de tamaño](https://support.google.com/googleplay/android-developer/answer/9859372)). La página del App Bundle sigue mencionando «apps de más de 200 MB» con Play Asset Delivery, así que la cifra de 500 MB del módulo base conviene confirmarla en la consola al subir.
- **Play Asset Delivery** sirve packs `install-time`, `fast-follow` y `on-demand` sin CDN; los dos últimos se descomprimen en el almacenamiento interno y se localizan con la librería de PAD ([PAD](https://developer.android.com/guide/playcore/asset-delivery)). No menciona contenido web ni TWA.
  - **TWA**: PAD no aplica. Chrome no lee assets del APK; todo llega desde Pages y lo guarda el service worker. Es justo lo que pide el mapa: descargar cada mundo al jugarlo y guardarlo.
  - **Capacitor**: 176 MB caben en el módulo base según esa tabla, pero la descarga inicial sería grande para una app infantil. Usar `fast-follow`/`on-demand` exigiría código nativo que pase los ficheros a la WebView: posible, pero sin guía oficial. Alternativa razonable: empaquetar código y primeros mundos y descargar el resto desde Pages, que vuelve al mismo diseño que la TWA.
- **Calidad de la TWA**: desde Chrome 86, Chrome anunció que trataría como fallo de la app un 404/5xx, no responder 200 a un recurso sin conexión o no verificar Digital Asset Links ([novedades de Web in Play](https://developer.chrome.com/docs/android/trusted-web-activity/whats-new)). Con un service worker que devuelva una pantalla sin conexión queda cubierto.
- GitHub Pages: sitio publicado ≤ 1 GB y ancho de banda blando de 100 GB/mes ([límites de Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)). Con 176 MB por jugador que lo descargue todo, 100 GB dan para unas 570 descargas completas al mes; para la familia sobra, pero si la app se abriera al público habría que vigilarlo.

## Audio, pantalla completa, orientación, mando, «atrás» y teclado

- **Audio y autoplay**: en la TWA rigen las reglas de Chrome, igual que en la web; el juego ya crea el `AudioContext` tras un gesto (`src/App.tsx`), así que no cambia nada. En Capacitor la WebView de Android permite configurar `setMediaPlaybackRequiresUserGesture`; la página de configuración de Capacitor no documenta una opción para ello, de modo que conviene mantener el arranque tras gesto también allí.
- **Pantalla completa**: la TWA verificada ya va sin barra de direcciones; `display: fullscreen` o `fullscreen-sticky` (modo inmersivo) en `twa-manifest.json` ([README de Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap/blob/main/packages/cli/README.md)). En Capacitor, la Activity se configura inmersiva en código nativo o con un plugin. El botón de pantalla completa actual (`requestFullscreen` en `src/App.tsx`) funciona en Chrome Android ([caniuse](https://caniuse.com/fullscreen)).
- **Orientación**: TWA con `orientation: landscape`; Capacitor con su plugin `lock()` ([Screen Orientation](https://capacitorjs.com/docs/apis/screen-orientation)). Ojo en los dos: con API objetivo 36, Android 16 ignora el bloqueo de orientación en pantallas grandes (tabletas); el juego debe verse bien también en vertical o con proporciones raras en tableta. `screen.orientation.lock()` funciona en Chrome Android, no en Safari iOS ([caniuse](https://caniuse.com/mdn-api_screenorientation_lock)).
- **Mando**: el juego usa la Gamepad API (`src/game/gamepad.ts`). En la TWA es Chrome, así que funciona como en la web. En la WebView de Android los datos de compatibilidad dicen que sí, pero hay informes de `getGamepads()` vacío; hay que probarlo en un dispositivo si se elige Capacitor.
- **Botón «atrás»**: en la TWA, «atrás» recorre el historial del navegador y cierra la app cuando no queda historial. Hoy el juego no usa `history`, así que **«atrás» cerraría la app desde cualquier pantalla**: hay que añadir entradas de historial al abrir nivel, modal o duelo y escuchar `popstate` (trabajo web, que además mejora la PWA). En Capacitor, el plugin `App` emite `backButton` con `canGoBack` y permite `exitApp()` ([App](https://capacitorjs.com/docs/apis/app)). En ambos casos debe llevar a la pausa, no cerrar la partida.
- **Teclado**: igual que en la web en los dos casos; teclado físico o Bluetooth llega como eventos normales.

## Cómo llegan las actualizaciones

- **TWA**: la web es la app. Cada push a `main` que despliega Pages llega a la app la próxima vez que se abra (cuando el service worker se actualice). Solo hace falta nueva versión en Play para cambiar el envoltorio o subir la API objetivo.
- **Capacitor**: los archivos van dentro del AAB; cada cambio del juego exige versión nueva, revisión de Play y esperar a que se instale. `server.url` para cargar la web en vivo está documentado como «no pensado para producción» ([configuración](https://capacitorjs.com/docs/config)). Las «live updates» dependen de servicios de terceros (Appflow, Capawesome u otros); no se ha verificado su coste ni su estado actual.

## Reutilización para iOS

- **No existe TWA en iOS.** Lo que sí sirve de la opción TWA es todo el trabajo de PWA (manifiesto, service worker, «atrás» con historial, sin conexión).
- **PWA en iOS** (Safari / pantalla de inicio), limitaciones relevantes:
  - Sin `screen.orientation.lock()` ([caniuse](https://caniuse.com/mdn-api_screenorientation_lock)): hay que mostrar «gira el móvil» en vertical.
  - Fullscreen API solo parcial en Safari iOS ([caniuse](https://caniuse.com/fullscreen)); en iPhone, la app de pantalla de inicio en `standalone` es lo más parecido.
  - Almacenamiento: cuotas por origen (15 % del disco para apps que no son navegador, 60 % para navegadores) y **desalojo por origen, el menos usado primero**, por presión de almacenamiento o por falta de uso bajo ITP; `navigator.storage.persist()` lo puede conceder WebKit con heurísticas, por ejemplo si es app de pantalla de inicio ([política de almacenamiento de WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/)). El progreso podría perderse: conviene pedir `persist()` y no depender solo de `localStorage` a largo plazo.
  - No hay tienda: Safari no publica PWAs en la App Store.
- **Capacitor iOS**: el mismo proyecto Capacitor añadiría la plataforma iOS (Xcode 26+, iOS 15+). Si Android usa TWA, para iOS se crearía el proyecto Capacitor desde cero, pero sobre la misma base web; el único coste extra es entonces el origen `capacitor://localhost` (CORS del ranking y progreso aparte). En iPad hay que poner `UIRequiresFullScreen` para poder bloquear la orientación ([Screen Orientation](https://capacitorjs.com/docs/apis/screen-orientation)).

## Mantenimiento y coste

- **Común**: cuenta de Google Play Console (pago único de registro, lo hace la persona usuaria), prueba cerrada de 12 personas × 14 días, ficha, clasificación y formulario de seguridad de datos.
- **TWA**: Bubblewrap pide Node 18+, JDK 17 y las herramientas de línea de comandos de Android; puede instalarlas él mismo. Una vez al año: `bubblewrap update`, subir API objetivo, compilar AAB y subirlo. Advertencias: «This is not a Google product» y algunos comandos marcados como experimentales; no editar el proyecto Android generado a mano porque `update` lo sobrescribe. PWABuilder genera un paquete equivalente desde la web, útil si no se quiere instalar nada (su documentación no se pudo cargar).
- **Capacitor**: Node 22+, Android Studio, Gradle/AGP, plugins (`@capacitor/app`, `@capacitor/screen-orientation`, quizá `status-bar`), una versión mayor al año aproximadamente con guía de migración, revisión de 16 KB de cada plugin nativo y una versión en Play por cada cambio del juego, que choca con el flujo «cada cambio validado se publica» de AGENTS.md.

## Pasos que implica la recomendación (para las issues de ejecución)

1. PWA: manifiesto con `orientation: landscape`, `display: fullscreen`, iconos; service worker con caché por mundo y pantalla sin conexión (mapa #113, issues hermanas).
2. Historial: entradas al entrar en nivel/modal/duelo y `popstate` → pausa o volver al mapa.
3. Repositorio `Mocheto.github.io` con `.nojekyll` y `.well-known/assetlinks.json` (huellas SHA-256 de la clave de subida y de la clave de firma de Play).
4. `bubblewrap init --manifest https://mocheto.github.io/super-noa/manifest.webmanifest`, comprobar `targetSdkVersion` ≥ 36, `fallbackType: customtabs`, orientación horizontal y `display: fullscreen-sticky`.
5. La persona usuaria crea la app en Play Console, sube el AAB a prueba cerrada y copia la huella de Play App Signing al `assetlinks.json`.

## Lo que no se ha podido verificar

- Qué `targetSdkVersion` genera hoy la última Bubblewrap (el README no lo dice). Si fuera menor de 36, se puede subir en `twa-manifest.json` o en el proyecto, pero hay que comprobarlo antes de la primera subida.
- Que una TWA comparta el almacenamiento (`localStorage`, caché del service worker) con Chrome para el mismo origen. La documentación oficial solo dice que la app nativa no accede al estado web; que Chrome lo comparta es la conducta conocida, pero no está escrita en las fuentes consultadas.
- Si las tres huellas de la firma híbrida «quantum-ready» que ahora muestra Play cambian lo que hay que poner en `assetlinks.json` (la documentación de TWA solo habla de una huella SHA-256).
- Si Chrome llegó a aplicar como fallos de la app los criterios de calidad de Chrome 86, o se aplazaron.
- La cifra exacta del módulo base (500 MB en la ayuda de Play frente a la mención de 200 MB en la página del App Bundle).
- Si la política de Familias de Play acepta una TWA sin requisitos extra (la página de políticas consultada no cubre Familias ni «webview spam»; un artículo de 2020 del blog de Android dice que se retiran apps webview cuyo fin es llevar tráfico, lo que no es el caso de un juego completo). Debe revisarlo la issue de ficha y política.
- Gamepad API dentro de la WebView de Android (solo relevante si se usara Capacitor).
- Que GitHub Pages sirva `/.well-known/` en un sitio de usuario con `.nojekyll` (conducta conocida, no leída en la documentación).
- La documentación de PWABuilder para Android (no cargó) y el coste de las «live updates» de Capacitor.
- Precio actual del registro en Play Console.
