# Super Noa

Juego infantil de plataformas en 2D creado para navegador. Incluye diez mundos de campaña con tres pantallas cada uno, un desvío acuático de tres pantallas y un reino secreto desbloqueable en las nubes. Hay doble salto, tres vidas, rutas elevadas, 36 insignias coleccionables, puntos de control, cajas de recompensa, precipicios y doce duelos contra guardianes. La aventura continúa tras el castillo por una isla jurásica, un volcán de dragones, un valle de flores gigantes y una montaña de hielo.

Al terminar una pantalla normal, Noa toca un banderín elevado —también puede hacerlo al saltar—, se coloca junto al gatito y aparece una breve celebración antes de continuar.

El mapa de la aventura es un paisaje ilustrado continuo: los caminos dorados muestran los mundos abiertos y la laguna y el reino de las nubes aparecen como desvíos. Toca un lugar para abrir su resumen, consultar medallas y pegatinas, y elegir una pantalla. En móvil, desliza el mapa horizontalmente.

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

La comprobación `npm test` ejecuta lint, pruebas de lógica y compilación. Las pruebas cubren reglas de movimiento, estructura de niveles y del mapa, rutas de recursos, guardados antiguos, bucle de juego y entrada del mando.

## Controles

- Movimiento: flechas o `A`/`D`.
- Salto y doble salto: pulsa una o dos veces espacio, `W` o flecha arriba.
- Cajas con huella: se abren saltando y golpeándolas desde abajo.
- Bola de lana: `X` o `K`, después de recoger el potenciador de gato de una caja.
- Pausa: `Esc` o el botón del HUD. El juego se pausa automáticamente al ocultar la pestaña, bloquear el dispositivo o perder el foco; al volver, pulsa «Seguir jugando».
- Monstruos finales: gana dos rondas de piedra, papel o tijera. Cada derrota puede repetirse gastando una manzana; sin manzanas se reinicia la pantalla, pero no se pierde una vida. También puedes rendirte y volver al mapa.
- Rutas especiales: ramas elásticas en el mundo 1, plataformas de niebla en el mundo 2, aullidos de aviso en el mundo 3, copas altas en el mundo 4, barcos voladores con cañones en el mundo 5 y pasillos con trampas de pinchos en el mundo 6. En el mundo de los jabalíes hay un bloque secreto elevado que crea una enredadera hacia el Reino Secreto de las Nubes: golpéalo desde abajo y toca la enredadera para elegir ese camino.
- Álbum: hay una pegatina opcional por pantalla de campaña, tres en la laguna y tres en el reino secreto.
- En móvil o tableta aparecen controles táctiles grandes, etiquetados con `IZQ.`, `DER.`, `LANA` y `SALTAR`. Mantén una dirección con un dedo y toca `SALTAR` con otro para hacer el doble salto.
- También se admite un mando mediante Gamepad API. Usa la cruceta o palanca izquierda para caminar y recorrer los menús, `A` para saltar o confirmar, `X`/`B` para lanzar lana, `B` para volver en menús y duelos, y `Start` para pausar o reanudar. En los duelos, la cruceta o palanca elige el gesto y `A` confirma, avanza de ronda, reintenta o continúa.

El progreso y las pegatinas se guardan únicamente en el navegador con la clave `super-noa-progress-v1`. El formato actual es la versión 2 y conserva la lectura de guardados anteriores. Si el navegador bloquea el almacenamiento, el juego sigue funcionando y muestra un aviso de que el progreso podría perderse. Las 24 insignias tienen sprites troquelados propios agrupados por mundo en `public/assets/stickers/`; el mismo dibujo aparece en la pantalla y en el álbum. El estado «Protegida» se reconoce por una burbuja psíquica dibujada alrededor de Noa en todas sus poses. La coraza alternativa queda guardada en `public/assets/alternatives/noa-armor-v1.png`, pero no está activa.

Los cañones, sus bolas, los puntos de control y los banderines usan sprites propios en `public/assets/sprites/`.

## Organización del código

- `src/App.tsx` coordina pantallas, HUD, música y pausa automática; `src/game/progress.ts` lee, valida y guarda el progreso y `storage.ts` protege todo acceso al almacenamiento local.
- `src/game/GameCanvas.tsx` coordina la partida. `rendering.ts` dibuja los mundos, `assets.ts` carga y reutiliza los recursos de cada mundo, `input.ts` gestiona teclado y tacto, y `gameLoop.ts` ejecuta la física en pasos constantes de 60 Hz.
- `src/game/levels.ts` mantiene los niveles y sus rutas especiales de forma declarativa; `routes.ts` resuelve el avance de campaña. `WorldMap.tsx` dibuja la interfaz interactiva sobre la ilustración original `public/assets/worlds/noa-adventure-map-v1.png`; `worldMapData.ts` define lugares y caminos. `gamepad.ts`, `menuGamepad.ts` y `duelGamepad.ts` interpretan el mando durante la partida, los menús y los duelos.

## Licencias

El personaje, los doce monstruos finales, los gatitos de recuerdo, los escenarios, el código y los efectos sintetizados se crearon para este proyecto. La música reutilizada de los primeros mundos procede de “Platformer Chiptunes”, de Guy G. Gamerson, publicada bajo CC0; las pistas originales conservan su atribución. Consulta [CREDITS.md](CREDITS.md).
