# Super Noa

Juego infantil de plataformas en 2D creado para navegador. Incluye diez mundos de campaña con tres pantallas cada uno, un desvío acuático de tres pantallas y un reino secreto desbloqueable en las nubes. Hay doble salto, tres vidas, rutas elevadas, 36 insignias coleccionables, puntos de control, cajas de recompensa, precipicios y doce duelos contra guardianes. La aventura continúa tras el castillo por una isla jurásica, un volcán de dragones, un valle de flores gigantes y una montaña de hielo.

Al terminar una pantalla normal, Noa toca un banderín elevado —también puede hacerlo al saltar—, se coloca junto al gatito y aparece una breve celebración antes de continuar.

El mapa de la aventura es un paisaje ilustrado continuo: los caminos dorados muestran los mundos abiertos y la laguna y el reino de las nubes aparecen como desvíos. Toca un lugar para abrir su resumen, consultar medallas y pegatinas, y elegir una pantalla. En móvil, desliza el mapa horizontalmente.

Cada pantalla abierta muestra sus objetivos pendientes: llegar a la meta, encontrar cada pegatina, completarla sin perder vidas y, cuando hay un guardián, conseguir su reto de amistad. «Mostrar pista» ofrece una ayuda para el siguiente objetivo pendiente; las pantallas cerradas no revelan sus pistas. El álbum también indica dónde falta cada pegatina.

En el bosque de los lobos, las señales `ZZZ` indican que puedes pasar sin recibir daño; antes de despertar, cada lobo avisa y después vuelve a patrullar. El valle tiene puentes de pétalos que se abren y avisan antes de cerrarse: siguen siendo transitables durante el aviso y siempre hay una alternativa mediante los saltos originales. En el reino secreto, las columnas de aire señaladas con flechas elevan suavemente a Noa solo dentro de su zona; no permiten volar libremente. Estos ciclos se detienen con la pausa y las reapariciones usan apoyos permanentes.

## Desarrollo

```bash
npm install
npm run dev
```

## Verificación y GitHub Pages

```bash
npm test
npm run preview:pages
```

La compilación estática se genera en `dist-pages/`. El workflow `.github/workflows/super-noa-pages.yml` la publica en GitHub Pages después de cada push a `main`.

La comprobación `npm test` ejecuta lint, pruebas de lógica y compilación con comprobación estricta de TypeScript. También puedes ejecutar `npm run typecheck` por separado. Las pruebas cubren reglas de movimiento, estructura de niveles y del mapa, checkpoints seguros, objetivos, recursos pendientes, recogidas al terminar, transiciones pausables, guardados antiguos, entrada del mando y recuperación del ranking.

## Controles

- Movimiento: flechas o `A`/`D`.
- Salto y doble salto: pulsa una o dos veces espacio, `W` o flecha arriba.
- Cajas con huella: se abren saltando y golpeándolas desde abajo.
- Bola de lana: `X` o `K`, después de recoger el potenciador de gato de una caja.
- Pausa: `Esc` o el botón del HUD. El juego se pausa automáticamente al ocultar la pestaña, bloquear el dispositivo o perder el foco; al volver, pulsa «Seguir jugando».
- Los cuadros de ajustes, ayuda y colección mantienen el foco dentro, se cierran con `Esc` y devuelven el foco al botón que los abrió. Rendirse en un duelo pide confirmación tanto con mando como con los botones de pantalla.
- Monstruos finales: gana dos rondas de piedra, papel o tijera. Cada derrota puede repetirse gastando una manzana; sin manzanas se reinicia la pantalla, pero no se pierde una vida. También puedes rendirte y volver al mapa.
- Rutas especiales: ramas elásticas en el mundo 1, plataformas de niebla en el mundo 2, aullidos de aviso en el mundo 3, copas altas en el mundo 4, barcos voladores con cañones en el mundo 5 y pasillos con trampas de pinchos en el mundo 6. En el mundo de los jabalíes hay un bloque secreto elevado que crea una enredadera hacia el Reino Secreto de las Nubes: golpéalo desde abajo y toca la enredadera para elegir ese camino.
- Álbum: hay una pegatina opcional por pantalla de campaña, tres en la laguna y tres en el reino secreto.
- En móvil o tableta aparecen controles táctiles grandes, etiquetados con `IZQ.`, `DER.`, `LANA` y `SALTAR`. Mantén una dirección con un dedo y toca `SALTAR` con otro para hacer el doble salto.
- También se admite un mando mediante Gamepad API. Usa la cruceta o palanca izquierda para caminar y recorrer los menús, `A` para saltar o confirmar, `X`/`B` para lanzar lana, `B` para volver en menús y duelos, y `Start` para pausar o reanudar. En los duelos, la cruceta o palanca elige el gesto y `A` confirma, avanza de ronda, reintenta o continúa.

El progreso y las pegatinas se guardan únicamente en el navegador con la clave `super-noa-progress-v1`. El formato actual es la versión 2 y conserva la lectura de guardados anteriores. Si el navegador bloquea el almacenamiento, el juego sigue funcionando y muestra un aviso de que el progreso podría perderse. Las 36 insignias tienen sprites troquelados propios agrupados por mundo en `public/assets/stickers/`; el mismo dibujo aparece en la pantalla y en el álbum. El estado «Protegida» se reconoce por una burbuja psíquica dibujada alrededor de Noa en todas sus poses. La coraza alternativa queda guardada en `public/assets/alternatives/noa-armor-v1.png`, pero no está activa.

El tablón ordena por pantallas de campaña completadas, no por los identificadores del agua o del reino secreto. La tarjeta del alias se guarda antes de registrarla para poder reintentar una respuesta perdida sin reservar otro alias. Si el navegador no puede guardarla, no se inicia el registro. Los fallos de envío se muestran como pendientes y se reintentan al recuperar la conexión; nunca impiden leer el tablón ni seguir jugando.

El contenedor del tablón debe ejecutar `node server/ranking-supervisor.mjs`. El supervisor comprueba `main` cada cinco minutos (`RANKING_UPDATE_INTERVAL_MS`), valida una versión antes de activarla y conserva la anterior si falla. Los cambios del propio supervisor requieren actualizar su archivo y reiniciar su proceso Node; no se recrea el contenedor ni se modifican los volúmenes o PostgreSQL.

Los gráficos de partida se cargan por mundo y los poderes se solicitan cuando hacen falta. Los recursos iniciales optimizados conservan los píxeles y la transparencia con WebP sin pérdida; los PNG originales siguen disponibles. Mientras llega un atlas de enemigos, su silueta permanece visible.

El bosque de manzanos, el volcán, el valle de flores gigantes y la montaña de hielo tienen composiciones originales propias. El bosque usa una melodía cálida y tranquila, independiente de la pista que conservan los piratas. La música conserva su posición al pausar, silenciar o ajustar el volumen. Para regenerar estos temas se necesita FFmpeg:

```bash
node scripts/build-adventure-music.mjs
node scripts/build-adventure-music.mjs --check
```

Los cañones, sus bolas, los puntos de control y los banderines usan sprites propios en `public/assets/sprites/`.

## Organización del código

- `src/App.tsx` coordina pantallas, HUD, música y pausa automática; `src/game/progress.ts` lee, valida y guarda el progreso y `storage.ts` protege todo acceso al almacenamiento local.
- `src/game/GameCanvas.tsx` coordina la partida. `rendering.ts` dibuja los mundos, `assets.ts` carga y reutiliza los recursos de cada mundo, `input.ts` gestiona teclado y tacto, y `gameLoop.ts` ejecuta la física en pasos constantes de 60 Hz.
- `src/game/levels.ts` mantiene los niveles y sus rutas especiales de forma declarativa; `routes.ts` resuelve el avance de campaña. `WorldMap.tsx` dibuja la interfaz interactiva sobre la ilustración original `public/assets/worlds/noa-adventure-map-v1.png`; `worldMapData.ts` define lugares y caminos. `gamepad.ts`, `menuGamepad.ts` y `duelGamepad.ts` interpretan el mando durante la partida, los menús y los duelos.

## Licencias

El personaje, los doce monstruos finales, los gatitos de recuerdo, los escenarios, el código y los efectos sintetizados se crearon para este proyecto. La música reutilizada de los primeros mundos procede de “Platformer Chiptunes”, de Guy G. Gamerson, publicada bajo CC0; las pistas originales conservan su atribución. Consulta [CREDITS.md](CREDITS.md).
