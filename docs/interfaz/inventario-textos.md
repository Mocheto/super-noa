# Inventario de textos de la interfaz

Tarea [Inventario de textos de la interfaz](https://github.com/Mocheto/super-noa/issues/102) del mapa [Una interfaz para aprender a leer: HUD, menús, marcos y textos para Noa](https://github.com/Mocheto/super-noa/issues/99). Fotografía del código del 18 de noviembre de 2026 (commit `ae7f5c4`). No cambia código: sirve de entrada para la [Guía de escritura del texto para Noa](https://github.com/Mocheto/super-noa/issues/103).

## Cómo se ha hecho

- Se recorre el árbol sintáctico de TypeScript de `src/App.tsx` y `src/game/*.ts(x)` (sin pruebas) y se recogen los textos JSX y las cadenas con letras.
- Se descartan clases CSS, rutas de archivo, fuentes de dibujo del lienzo (`bold 18px monospace`), claves internas, mensajes de validación de las partituras, utilidades de prueba y las pantallas de prueba de `testScreens.ts` (solo se abren en desarrollo).
- Las partes que el código rellena al jugar se muestran como `{…}`. Un mismo texto partido por etiquetas (`Toca <b>SALTAR</b>`) aparece en varias filas.
- **Público**:
  - **Noa**: lo que lee la niña. Por defecto, cualquier texto que no sea de adultos.
  - **Adultos**: ajustes, créditos, tablón mundial, avisos de guardado, conexión o sonido, y ayuda de teclado y mando.
  - **Oculto**: solo lo lee un lector de pantalla (`aria-label`, `alt` y los avisos `sr-only` de la partida, detectados por línea: algún aviso que ocupe varias líneas puede figurar como Noa). No se ve, pero también conviene simplificarlo.
- La clasificación es automática y está revisada a mano en `App.tsx`. Algún caso dudoso puede estar mal colocado; la guía de escritura lo corregirá.
- **Palabras** cuenta cada `{…}` como una palabra. El objetivo del texto para Noa es de una a cuatro.

## Resumen

Hay **1423** textos: **1281** para Noa (**501** con más de cuatro palabras), **77** para adultos y **65** ocultos.

| Superficie | Noa | Noa con más de 4 palabras | Adultos | Ocultos |
|---|---:|---:|---:|---:|
| [Inicio](#inicio) | 13 | 3 | 4 | 1 |
| [Mapa](#mapa) | 32 | 6 | 2 | 12 |
| [Mapa (mundos)](#mapa-mundos) | 69 | 30 | 0 | 0 |
| [Tarjetas de pantalla](#tarjetas-de-pantalla) | 9 | 1 | 0 | 0 |
| [Tarjetas de pantalla (objetivos)](#tarjetas-de-pantalla-objetivos) | 9 | 4 | 0 | 0 |
| [HUD y partida](#hud-y-partida) | 12 | 0 | 0 | 2 |
| [Controles táctiles](#controles-tactiles) | 8 | 1 | 0 | 1 |
| [Dentro de la pantalla (lienzo)](#dentro-de-la-pantalla-lienzo) | 53 | 19 | 0 | 27 |
| [Pantallas (títulos y pistas)](#pantallas-titulos-y-pistas) | 180 | 107 | 0 | 0 |
| [Caminos secretos](#caminos-secretos) | 20 | 15 | 0 | 0 |
| [Subida al reino secreto](#subida-al-reino-secreto) | 3 | 2 | 0 | 0 |
| [Paseo de los amigos](#paseo-de-los-amigos) | 57 | 22 | 0 | 0 |
| [Ventana: pantalla completada](#ventana-pantalla-completada) | 18 | 4 | 0 | 3 |
| [Ventana: otra oportunidad](#ventana-otra-oportunidad) | 5 | 1 | 0 | 0 |
| [Ventana: pausa](#ventana-pausa) | 6 | 0 | 0 | 0 |
| [Ventana: final](#ventana-final) | 5 | 1 | 0 | 0 |
| [Ayuda](#ayuda) | 22 | 6 | 1 | 1 |
| [Colección](#coleccion) | 34 | 6 | 0 | 2 |
| [Colección: pegatinas](#coleccion-pegatinas) | 102 | 51 | 0 | 0 |
| [Colección: amigos](#coleccion-amigos) | 150 | 51 | 0 | 1 |
| [Tienda secreta](#tienda-secreta) | 17 | 5 | 0 | 1 |
| [Duelos: guardianes](#duelos-guardianes) | 51 | 34 | 0 | 0 |
| [Duelos: piedra, papel o tijera](#duelos-piedra-papel-o-tijera) | 56 | 19 | 1 | 2 |
| [Duelos: juegos de guardián](#duelos-juegos-de-guardian) | 56 | 17 | 0 | 0 |
| [Duelos: Papá Noel y Siroco](#duelos-papa-noel-y-siroco) | 19 | 7 | 0 | 3 |
| [Duelos: Papá Noel y Siroco (lienzo)](#duelos-papa-noel-y-siroco-lienzo) | 4 | 0 | 0 | 0 |
| [Minijuego: abeja ninja](#minijuego-abeja-ninja) | 73 | 23 | 1 | 1 |
| [Minijuego: tambor de Armonía](#minijuego-tambor-de-armonia) | 65 | 21 | 1 | 1 |
| [Minijuego: merienda de los jabatos](#minijuego-merienda-de-los-jabatos) | 66 | 24 | 1 | 1 |
| [Minijuego: fiesta de los gatitos](#minijuego-fiesta-de-los-gatitos) | 53 | 19 | 0 | 1 |
| [Fiesta de los gatitos](#fiesta-de-los-gatitos) | 1 | 0 | 0 | 0 |
| [Minijuego: avioneta](#minijuego-avioneta) | 12 | 2 | 0 | 2 |
| [Avioneta](#avioneta) | 1 | 0 | 0 | 0 |
| [Ajustes](#ajustes) | 0 | 0 | 13 | 1 |
| [Créditos](#creditos) | 0 | 0 | 9 | 1 |
| [Tablón mundial](#tablon-mundial) | 0 | 0 | 29 | 1 |
| [Avisos generales](#avisos-generales) | 0 | 0 | 15 | 0 |

## Iconos sueltos

Símbolos de texto y dibujos que hoy hacen de icono. Son candidatos a pictograma del atlas.

| Icono | Significado | Dónde |
|---|---|---|
| ▶ | Jugar, seguir, siguiente | Inicio, ventanas, botones «siguiente» de `levels.ts` (`nextLabel`), duelos y minijuegos |
| ◀ ▶ | Caminar a izquierda y derecha | Controles táctiles, ayuda, avioneta |
| ↑ | Saltar, subir | Controles táctiles, ayuda, carteles del lienzo («¡SUBE!») |
| Ⅱ | Pausa | HUD |
| ⛶ | Pantalla completa | HUD |
| ⌂ | Volver al inicio | Mapa |
| ⚙ | Ajustes | Inicio, mapa |
| 🌍 | Tablón mundial | Inicio, mapa, tablón |
| × | Cerrar ventana; también «× 3» como contador | Ventanas, HUD, mapa, duelos |
| ★ | Medalla, estrella, marco especial, contador de jefes amigos | Ventana de pantalla completada, colección, mapa, duelos, minijuegos |
| ✦ | Camino secreto o desvío | HUD (en lugar del número de pantalla), mapa |
| ✓ | Pantalla completada | Mapa, tarjetas de pantalla |
| ♥ | Vida, corazón de amistad | Amigos, duelos |
| 🐾 | Paseo de los amigos | Ventana de pantalla completada, mapa |
| ▣ | Caja | Ayuda |
| `GameAssetIcon` apple / heart | Manzana y vida, con arte del juego | HUD, ayuda, ventanas |
| `PixelIcon` | Iconos en CSS: sparkle (pegatina), yarn (lana), heart, lock, sound, mute, rock, paper, scissors, cat, paw, crown, gem, moon, tree, pine, wolf, parrot, bee, acorn, apple, tooth, wheel | Inicio, HUD, ayuda, mapa, colección, duelos |

## Textos por superficie

### Inicio

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [App.tsx:767](../../src/App.tsx#L767) | Noa | 4 | Una aventura pixel art |
| [App.tsx:768](../../src/App.tsx#L768) | Noa | 1 | SUPER |
| [App.tsx:768](../../src/App.tsx#L768) | Noa | 1 | NOA |
| [App.tsx:769](../../src/App.tsx#L769) | Noa | 20 | Corre, salta y explora castillos, volcanes, flores gigantes, trenes, música y un cielo lleno de nubes. ¡Los gatitos te esperan! |
| [App.tsx:770](../../src/App.tsx#L770) | Noa | 6 | Una gran aventura para pequeñas heroínas |
| [App.tsx:771](../../src/App.tsx#L771) | Noa | 2 | Nuevas aventuras: |
| [App.tsx:771](../../src/App.tsx#L771) | Noa | 13 | El Tren de las Estaciones · El Reino de la Música · El Reino Celeste |
| [App.tsx:773](../../src/App.tsx#L773) | Noa | 2 | ▶ ¡Jugar ahora! |
| [App.tsx:774](../../src/App.tsx#L774) | Noa | 3 | ¿Cómo se juega? |
| [App.tsx:776](../../src/App.tsx#L776) | Adultos | 2 | Partida guardada · |
| [App.tsx:781](../../src/App.tsx#L781) | Oculto | 1 | Opciones |
| [App.tsx:782](../../src/App.tsx#L782) | Noa | 2 | Activar sonido |
| [App.tsx:782](../../src/App.tsx#L782) | Noa | 1 | Sonido |
| [App.tsx:783](../../src/App.tsx#L783) | Noa | 1 | Álbum |
| [App.tsx:784](../../src/App.tsx#L784) | Noa | 2 | Jefes amigos |
| [App.tsx:785](../../src/App.tsx#L785) | Adultos | 2 | 🌍 Tablón mundial |
| [App.tsx:786](../../src/App.tsx#L786) | Adultos | 1 | ⚙ Ajustes |
| [App.tsx:787](../../src/App.tsx#L787) | Adultos | 1 | Créditos |

### Mapa

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [WorldMap.tsx:181](../../src/game/WorldMap.tsx#L181) | Noa | 21 | Arrastra el mapa para explorar. Junta o separa dos dedos para alejar o acercar. Toca un mundo para ver sus pantallas. |
| [WorldMap.tsx:183](../../src/game/WorldMap.tsx#L183) | Oculto | 3 | Explorar el mapa |
| [WorldMap.tsx:185](../../src/game/WorldMap.tsx#L185) | Noa | 1 | Mapa |
| [WorldMap.tsx:186](../../src/game/WorldMap.tsx#L186) | Noa | 1 | Lista |
| [WorldMap.tsx:189](../../src/game/WorldMap.tsx#L189) | Oculto | 2 | Alejar mapa |
| [WorldMap.tsx:190](../../src/game/WorldMap.tsx#L190) | Oculto | 2 | Acercar mapa |
| [WorldMap.tsx:191](../../src/game/WorldMap.tsx#L191) | Noa | 2 | Ver todo |
| [WorldMap.tsx:192](../../src/game/WorldMap.tsx#L192) | Noa | 3 | Volver a Noa |
| [WorldMap.tsx:195](../../src/game/WorldMap.tsx#L195) | Oculto | 7 | Mapa ilustrado de los mundos de Noa |
| [WorldMap.tsx:209](../../src/game/WorldMap.tsx#L209) | Oculto | 3 | Senderos secretos descubiertos |
| [WorldMap.tsx:212](../../src/game/WorldMap.tsx#L212) | Noa | 2 | Explorar {…} |
| [WorldMap.tsx:219](../../src/game/WorldMap.tsx#L219) | Noa | 4 | Noa está en {…} |
| [WorldMap.tsx:257](../../src/game/WorldMap.tsx#L257) | Noa | 11 | La avioneta de las nubes: mejor marca {…} de {…} estrellas |
| [WorldMap.tsx:268](../../src/game/WorldMap.tsx#L268) | Noa | 7 | Paseo de los amigos de {…}{…} |
| [WorldMap.tsx:269](../../src/game/WorldMap.tsx#L269) | Noa | 1 | Paseo |
| [WorldMap.tsx:274](../../src/game/WorldMap.tsx#L274) | Oculto | 3 | Mundos de Noa |
| [WorldMap.tsx:284](../../src/game/WorldMap.tsx#L284) | Noa | 2 | Mundo secreto |
| [WorldMap.tsx:284](../../src/game/WorldMap.tsx#L284) | Noa | 3 | Mundo del agua |
| [WorldMap.tsx:284](../../src/game/WorldMap.tsx#L284) | Noa | 2 | Mundo {…} |
| [WorldMap.tsx:287](../../src/game/WorldMap.tsx#L287) | Noa | 2 | Todavía cerrado |
| [WorldMap.tsx:289](../../src/game/WorldMap.tsx#L289) | Noa | 3 | Noa está aquí |
| [WorldMap.tsx:294](../../src/game/WorldMap.tsx#L294) | Noa | 4 | Noa va de camino… |
| [WorldMap.tsx:294](../../src/game/WorldMap.tsx#L294) | Noa | 3 | Noa está en |
| [WorldMap.tsx:295](../../src/game/WorldMap.tsx#L295) | Noa | 3 | ¡Un camino nuevo! |
| [WorldMap.tsx:300](../../src/game/WorldMap.tsx#L300) | Oculto | 2 | Cerrar mundo |
| [WorldMap.tsx:304](../../src/game/WorldMap.tsx#L304) | Noa | 2 | Mundo secreto |
| [WorldMap.tsx:304](../../src/game/WorldMap.tsx#L304) | Noa | 3 | Mundo del agua |
| [WorldMap.tsx:304](../../src/game/WorldMap.tsx#L304) | Noa | 2 | Mundo {…} |
| [WorldMap.tsx:309](../../src/game/WorldMap.tsx#L309) | Noa | 3 | Progreso de {…} |
| [WorldMap.tsx:310](../../src/game/WorldMap.tsx#L310) | Noa | 2 | ✉ Postal lista |
| [WorldMap.tsx:310](../../src/game/WorldMap.tsx#L310) | Noa | 3 | ✉ Busca su recuerdo |
| [WorldMap.tsx:312](../../src/game/WorldMap.tsx#L312) | Noa | 1 | · Amigo |
| [WorldMap.tsx:314](../../src/game/WorldMap.tsx#L314) | Noa | 6 | Sigue explorando. ¡Hay sorpresas por descubrir! |
| [WorldMap.tsx:314](../../src/game/WorldMap.tsx#L314) | Noa | 10 | Busca la poza azul en el bosque de los lobos. |
| [WorldMap.tsx:314](../../src/game/WorldMap.tsx#L314) | Noa | 8 | Completa las pantallas anteriores para llegar hasta aquí. |
| [WorldMap.tsx:324](../../src/game/WorldMap.tsx#L324) | Noa | 4 | Jugar a la fiesta |
| [WorldMap.tsx:325](../../src/game/WorldMap.tsx#L325) | Oculto | 2 | Desvíos descubiertos |
| [App.tsx:795](../../src/App.tsx#L795) | Noa | 3 | Elige una pantalla |
| [App.tsx:795](../../src/App.tsx#L795) | Noa | 4 | El mapa de Noa |
| [App.tsx:798](../../src/App.tsx#L798) | Oculto | 4 | Abrir álbum de pegatinas |
| [App.tsx:799](../../src/App.tsx#L799) | Oculto | 3 | Abrir jefes amigos |
| [App.tsx:800](../../src/App.tsx#L800) | Adultos | 1 | 🌍 Tablón |
| [App.tsx:801](../../src/App.tsx#L801) | Oculto | 2 | Abrir ajustes |
| [App.tsx:802](../../src/App.tsx#L802) | Oculto | 3 | Volver al inicio |
| [App.tsx:805](../../src/App.tsx#L805) | Noa | 3 | Preparando el mapa… |
| [App.tsx:808](../../src/App.tsx#L808) | Adultos | 2 | Borrar progreso |

### Mapa (mundos)

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [worldMapData.ts:22](../../src/game/worldMapData.ts#L22) | Noa | 5 | El Prado de las Manzanas |
| [worldMapData.ts:22](../../src/game/worldMapData.ts#L22) | Noa | 1 | Manzanos |
| [worldMapData.ts:22](../../src/game/worldMapData.ts#L22) | Noa | 6 | Sol, ramas anchas y manzanas crujientes. |
| [worldMapData.ts:22](../../src/game/worldMapData.ts#L22) | Noa | 1 | Miel |
| [worldMapData.ts:23](../../src/game/worldMapData.ts#L23) | Noa | 5 | El Bosque de los Gatitos |
| [worldMapData.ts:23](../../src/game/worldMapData.ts#L23) | Noa | 1 | Gatitos |
| [worldMapData.ts:23](../../src/game/worldMapData.ts#L23) | Noa | 8 | Luciérnagas, cristales, murciélagos y una cueva de lava. |
| [worldMapData.ts:23](../../src/game/worldMapData.ts#L23) | Noa | 1 | Bruma |
| [worldMapData.ts:24](../../src/game/worldMapData.ts#L24) | Noa | 5 | El Bosque de los Lobos |
| [worldMapData.ts:24](../../src/game/worldMapData.ts#L24) | Noa | 1 | Lobos |
| [worldMapData.ts:24](../../src/game/worldMapData.ts#L24) | Noa | 11 | Pinos, luna llena y lobos dormilones que avisan antes de despertar. |
| [worldMapData.ts:24](../../src/game/worldMapData.ts#L24) | Noa | 1 | Pino |
| [worldMapData.ts:25](../../src/game/worldMapData.ts#L25) | Noa | 5 | La Laguna de los Corales |
| [worldMapData.ts:25](../../src/game/worldMapData.ts#L25) | Noa | 1 | Laguna |
| [worldMapData.ts:25](../../src/game/worldMapData.ts#L25) | Noa | 14 | Una poza entre los bosques: peces traviesos, erizos y el palacio de Don Aleta. |
| [worldMapData.ts:25](../../src/game/worldMapData.ts#L25) | Noa | 1 | Perla |
| [worldMapData.ts:26](../../src/game/worldMapData.ts#L26) | Noa | 5 | El Bosque de los Jabalíes |
| [worldMapData.ts:26](../../src/game/worldMapData.ts#L26) | Noa | 1 | Jabalíes |
| [worldMapData.ts:26](../../src/game/worldMapData.ts#L26) | Noa | 6 | Bellotas, copas altas y jabalíes salvajes. |
| [worldMapData.ts:26](../../src/game/worldMapData.ts#L26) | Noa | 1 | Bellota |
| [worldMapData.ts:27](../../src/game/worldMapData.ts#L27) | Noa | 5 | La Flota de las Nubes |
| [worldMapData.ts:27](../../src/game/worldMapData.ts#L27) | Noa | 1 | Barcos |
| [worldMapData.ts:27](../../src/game/worldMapData.ts#L27) | Noa | 6 | Barcos voladores, piratas, loros y cañones. |
| [worldMapData.ts:27](../../src/game/worldMapData.ts#L27) | Noa | 1 | Nube |
| [worldMapData.ts:28](../../src/game/worldMapData.ts#L28) | Noa | 3 | El Castillo Encantado |
| [worldMapData.ts:28](../../src/game/worldMapData.ts#L28) | Noa | 1 | Castillo |
| [worldMapData.ts:28](../../src/game/worldMapData.ts#L28) | Noa | 10 | Perritos de cobre encadenados, trampas con pinchos y fantasmas traviesos. |
| [worldMapData.ts:28](../../src/game/worldMapData.ts#L28) | Noa | 1 | Luna |
| [worldMapData.ts:29](../../src/game/worldMapData.ts#L29) | Noa | 5 | La Isla de los Dinosaurios |
| [worldMapData.ts:29](../../src/game/worldMapData.ts#L29) | Noa | 1 | Dinosaurios |
| [worldMapData.ts:29](../../src/game/worldMapData.ts#L29) | Noa | 9 | Selva tropical, agua peligrosa, pequeños t-rex y terodáctilos juguetones. |
| [worldMapData.ts:29](../../src/game/worldMapData.ts#L29) | Noa | 1 | Ámbar |
| [worldMapData.ts:30](../../src/game/worldMapData.ts#L30) | Noa | 5 | El Volcán de los Dragones |
| [worldMapData.ts:30](../../src/game/worldMapData.ts#L30) | Noa | 1 | Dragones |
| [worldMapData.ts:30](../../src/game/worldMapData.ts#L30) | Noa | 8 | Lava brillante, cristales rojos y pequeños dragones valientes. |
| [worldMapData.ts:30](../../src/game/worldMapData.ts#L30) | Noa | 1 | Chispa |
| [worldMapData.ts:31](../../src/game/worldMapData.ts#L31) | Noa | 5 | El Valle de los Gigantes |
| [worldMapData.ts:31](../../src/game/worldMapData.ts#L31) | Noa | 1 | Gigantes |
| [worldMapData.ts:31](../../src/game/worldMapData.ts#L31) | Noa | 12 | Flores que abren puentes de pétalos, gotas de rocío y bichitos gigantes. |
| [worldMapData.ts:31](../../src/game/worldMapData.ts#L31) | Noa | 1 | Botón |
| [worldMapData.ts:32](../../src/game/worldMapData.ts#L32) | Noa | 4 | La Montaña de Hielo |
| [worldMapData.ts:32](../../src/game/worldMapData.ts#L32) | Noa | 1 | Hielo |
| [worldMapData.ts:32](../../src/game/worldMapData.ts#L32) | Noa | 8 | Nieve suave, cuevas azules y caminos muy resbaladizos. |
| [worldMapData.ts:32](../../src/game/worldMapData.ts#L32) | Noa | 1 | Copito |
| [worldMapData.ts:33](../../src/game/worldMapData.ts#L33) | Noa | 5 | El Mundo de Papá Noel |
| [worldMapData.ts:33](../../src/game/worldMapData.ts#L33) | Noa | 1 | Navidad |
| [worldMapData.ts:33](../../src/game/worldMapData.ts#L33) | Noa | 7 | Nieve, duendes, juguetes y regalos para repartir. |
| [worldMapData.ts:33](../../src/game/worldMapData.ts#L33) | Noa | 1 | Estrella |
| [worldMapData.ts:34](../../src/game/worldMapData.ts#L34) | Noa | 5 | El Desierto de los Espejismos |
| [worldMapData.ts:34](../../src/game/worldMapData.ts#L34) | Noa | 1 | Desierto |
| [worldMapData.ts:34](../../src/game/worldMapData.ts#L34) | Noa | 8 | Dunas, oasis, géiseres de arena y ruinas doradas. |
| [worldMapData.ts:34](../../src/game/worldMapData.ts#L34) | Noa | 1 | Duna |
| [worldMapData.ts:35](../../src/game/worldMapData.ts#L35) | Noa | 5 | El Tren de las Estaciones |
| [worldMapData.ts:35](../../src/game/worldMapData.ts#L35) | Noa | 1 | Tren |
| [worldMapData.ts:35](../../src/game/worldMapData.ts#L35) | Noa | 8 | Andenes, vagones veloces, vapor y una locomotora alegre. |
| [worldMapData.ts:35](../../src/game/worldMapData.ts#L35) | Noa | 1 | Vía |
| [worldMapData.ts:36](../../src/game/worldMapData.ts#L36) | Noa | 5 | El Reino de la Música |
| [worldMapData.ts:36](../../src/game/worldMapData.ts#L36) | Noa | 1 | Música |
| [worldMapData.ts:36](../../src/game/worldMapData.ts#L36) | Noa | 9 | Tambores, campanas, ondas musicales y un gran teatro brillante. |
| [worldMapData.ts:36](../../src/game/worldMapData.ts#L36) | Noa | 1 | Tempo |
| [worldMapData.ts:37](../../src/game/worldMapData.ts#L37) | Noa | 3 | El Reino Celeste |
| [worldMapData.ts:37](../../src/game/worldMapData.ts#L37) | Noa | 1 | Celeste |
| [worldMapData.ts:37](../../src/game/worldMapData.ts#L37) | Noa | 12 | Un ascenso vertical por nubes mágicas hasta la puerta de las estrellas. |
| [worldMapData.ts:37](../../src/game/worldMapData.ts#L37) | Noa | 1 | Celeste |
| [worldMapData.ts:38](../../src/game/worldMapData.ts#L38) | Noa | 3 | El Reino Secreto |
| [worldMapData.ts:38](../../src/game/worldMapData.ts#L38) | Noa | 1 | Secreto |
| [worldMapData.ts:38](../../src/game/worldMapData.ts#L38) | Noa | 13 | Nubes mágicas y columnas de aire para subir junto a pájaros y unicornios. |
| [worldMapData.ts:38](../../src/game/worldMapData.ts#L38) | Noa | 1 | Iris |
| [worldMapData.ts:60](../../src/game/worldMapData.ts#L60) | Noa | 1 | A-3 |

### Tarjetas de pantalla

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [LevelSelectCard.tsx:81](../../src/game/LevelSelectCard.tsx#L81) | Noa | 4 | Una sorpresa te espera |
| [LevelSelectCard.tsx:82](../../src/game/LevelSelectCard.tsx#L82) | Noa | 1 | ✓ Completada · |
| [LevelSelectCard.tsx:83](../../src/game/LevelSelectCard.tsx#L83) | Noa | 3 | Lista para jugar |
| [LevelSelectCard.tsx:83](../../src/game/LevelSelectCard.tsx#L83) | Noa | 6 | Busca la poza azul en 3-3 |
| [LevelSelectCard.tsx:83](../../src/game/LevelSelectCard.tsx#L83) | Noa | 3 | Completa la anterior |
| [LevelSelectCard.tsx:97](../../src/game/LevelSelectCard.tsx#L97) | Noa | 2 | Falta 1 |
| [LevelSelectCard.tsx:97](../../src/game/LevelSelectCard.tsx#L97) | Noa | 2 | Faltan {…} |
| [LevelSelectCard.tsx:97](../../src/game/LevelSelectCard.tsx#L97) | Noa | 2 | ¡Todo conseguido! |
| [LevelSelectCard.tsx:98](../../src/game/LevelSelectCard.tsx#L98) | Noa | 3 | Objetivos de {…} |

### Tarjetas de pantalla (objetivos)

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [levelObjectives.ts:30](../../src/game/levelObjectives.ts#L30) | Noa | 3 | Llegar al final |
| [levelObjectives.ts:31](../../src/game/levelObjectives.ts#L31) | Noa | 20 | El perrito avisa antes de correr. Su cadena tiene un límite: espera lejos o pasa por las plataformas de arriba. |
| [levelObjectives.ts:31](../../src/game/levelObjectives.ts#L31) | Noa | 6 | Sigue el camino hasta la meta. |
| [levelObjectives.ts:35](../../src/game/levelObjectives.ts#L35) | Noa | 2 | Pegatina {…} |
| [levelObjectives.ts:35](../../src/game/levelObjectives.ts#L35) | Noa | 1 | Pegatina |
| [levelObjectives.ts:37](../../src/game/levelObjectives.ts#L37) | Noa | 6 | Explora las plataformas de esta pantalla. |
| [levelObjectives.ts:40](../../src/game/levelObjectives.ts#L40) | Noa | 3 | Sin perder vidas |
| [levelObjectives.ts:40](../../src/game/levelObjectives.ts#L40) | Noa | 12 | Llega a la meta sin perder ninguna vida. Puedes intentarlo otra vez. |
| [levelObjectives.ts:42](../../src/game/levelObjectives.ts#L42) | Noa | 3 | Reto del guardián |

### HUD y partida

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [App.tsx:847](../../src/App.tsx#L847) | Noa | 1 | ★ Estelar |
| [App.tsx:847](../../src/App.tsx#L847) | Noa | 1 | Gato |
| [App.tsx:847](../../src/App.tsx#L847) | Noa | 1 | Protegida |
| [App.tsx:847](../../src/App.tsx#L847) | Noa | 1 | Noa |
| [App.tsx:850](../../src/App.tsx#L850) | Noa | 2 | Activar sonido |
| [App.tsx:850](../../src/App.tsx#L850) | Noa | 1 | Silenciar |
| [App.tsx:851](../../src/App.tsx#L851) | Oculto | 2 | Pantalla completa |
| [App.tsx:852](../../src/App.tsx#L852) | Oculto | 1 | Pausa |
| [App.tsx:855](../../src/App.tsx#L855) | Noa | 3 | Preparando la aventura… |
| [App.tsx:858](../../src/App.tsx#L858) | Noa | 2 | Camino opcional |
| [App.tsx:858](../../src/App.tsx#L858) | Noa | 4 | Paseo de los amigos |
| [App.tsx:858](../../src/App.tsx#L858) | Noa | 3 | Sala {…}/{…} |
| [App.tsx:858](../../src/App.tsx#L858) | Noa | 3 | Bandera {…}/{…} |
| [App.tsx:860](../../src/App.tsx#L860) | Noa | 3 | Preparando al guardián… |

### Controles táctiles

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [TouchControls.tsx:29](../../src/game/TouchControls.tsx#L29) | Oculto | 2 | Controles táctiles |
| [TouchControls.tsx:31](../../src/game/TouchControls.tsx#L31) | Noa | 4 | Mover a la izquierda |
| [TouchControls.tsx:31](../../src/game/TouchControls.tsx#L31) | Noa | 1 | IZQ. |
| [TouchControls.tsx:32](../../src/game/TouchControls.tsx#L32) | Noa | 4 | Mover a la derecha |
| [TouchControls.tsx:32](../../src/game/TouchControls.tsx#L32) | Noa | 1 | DER. |
| [TouchControls.tsx:35](../../src/game/TouchControls.tsx#L35) | Noa | 4 | Lanzar bola de lana |
| [TouchControls.tsx:35](../../src/game/TouchControls.tsx#L35) | Noa | 1 | LANA |
| [TouchControls.tsx:36](../../src/game/TouchControls.tsx#L36) | Noa | 8 | Saltar; vuelve a tocar para hacer doble salto |
| [TouchControls.tsx:36](../../src/game/TouchControls.tsx#L36) | Noa | 1 | SALTAR |

### Dentro de la pantalla (lienzo)

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [GameCanvas.tsx:106](../../src/game/GameCanvas.tsx#L106) | Noa | 4 | ¡PRUEBA EL DOBLE SALTO! |
| [GameCanvas.tsx:109](../../src/game/GameCanvas.tsx#L109) | Noa | 8 | TOCA SALTAR  ↑   Y EN EL AIRE  ↑  OTRA VEZ |
| [GameCanvas.tsx:119](../../src/game/GameCanvas.tsx#L119) | Noa | 1 | Entrar |
| [GameCanvas.tsx:231](../../src/game/GameCanvas.tsx#L231) | Oculto | 13 | ¡Noa Estelar! Las estrellas te protegen de los enemigos. Sigue saltando los fosos. |
| [GameCanvas.tsx:231](../../src/game/GameCanvas.tsx#L231) | Oculto | 6 | ¡Hasta pronto, gatito! La aventura continúa. |
| [GameCanvas.tsx:259](../../src/game/GameCanvas.tsx#L259) | Oculto | 12 | ¡Uy! Noa vuelve a la entrada de la sala, sin perder vidas. |
| [GameCanvas.tsx:259](../../src/game/GameCanvas.tsx#L259) | Oculto | 5 | La sala vuelve a empezar. |
| [GameCanvas.tsx:293](../../src/game/GameCanvas.tsx#L293) | Oculto | 7 | ¡Una nube cercana ha recogido a Noa! |
| [GameCanvas.tsx:332](../../src/game/GameCanvas.tsx#L332) | Noa | 1 | Explorar |
| [GameCanvas.tsx:332](../../src/game/GameCanvas.tsx#L332) | Noa | 1 | Subir |
| [GameCanvas.tsx:332](../../src/game/GameCanvas.tsx#L332) | Noa | 1 | Activar |
| [GameCanvas.tsx:332](../../src/game/GameCanvas.tsx#L332) | Noa | 1 | Entrar |
| [GameCanvas.tsx:360](../../src/game/GameCanvas.tsx#L360) | Oculto | 5 | La rueda cambia de dirección. |
| [GameCanvas.tsx:360](../../src/game/GameCanvas.tsx#L360) | Oculto | 5 | Los libros cambian el camino. |
| [GameCanvas.tsx:360](../../src/game/GameCanvas.tsx#L360) | Oculto | 5 | El agua despierta la planta. |
| [GameCanvas.tsx:367](../../src/game/GameCanvas.tsx#L367) | Oculto | 11 | ¡Ascensor despierto! La nube sube, espera arriba y vuelve a bajar. |
| [GameCanvas.tsx:517](../../src/game/GameCanvas.tsx#L517) | Oculto | 10 | ¡Nube esponjosa! Noa sale disparada hacia otra parte del cielo. |
| [GameCanvas.tsx:549](../../src/game/GameCanvas.tsx#L549) | Oculto | 5 | ¡Clic! Se abre una puerta. |
| [GameCanvas.tsx:549](../../src/game/GameCanvas.tsx#L549) | Oculto | 5 | Las plataformas cambian de color. |
| [GameCanvas.tsx:549](../../src/game/GameCanvas.tsx#L549) | Oculto | 4 | Botón de huella pulsado. |
| [GameCanvas.tsx:554](../../src/game/GameCanvas.tsx#L554) | Oculto | 7 | Sala {…}. La puerta se cierra detrás. |
| [GameCanvas.tsx:629](../../src/game/GameCanvas.tsx#L629) | Oculto | 2 | Manzana conseguida. |
| [GameCanvas.tsx:633](../../src/game/GameCanvas.tsx#L633) | Oculto | 10 | ¡Noa se ha convertido en gata! Ya puede lanzar lana. |
| [GameCanvas.tsx:637](../../src/game/GameCanvas.tsx#L637) | Oculto | 2 | Insignia encontrada. |
| [GameCanvas.tsx:654](../../src/game/GameCanvas.tsx#L654) | Noa | 4 | ¡Aquí no muerde! {…} |
| [GameCanvas.tsx:657](../../src/game/GameCanvas.tsx#L657) | Oculto | 6 | Has saludado a un amigo: {…} |
| [GameCanvas.tsx:702](../../src/game/GameCanvas.tsx#L702) | Oculto | 12 | ¡El perrito avisa! Salta por arriba o espera lejos de su cadena. |
| [GameCanvas.tsx:803](../../src/game/GameCanvas.tsx#L803) | Oculto | 3 | Bandera {…} conseguida. |
| [GameCanvas.tsx:816](../../src/game/GameCanvas.tsx#L816) | Oculto | 4 | Nube segura {…} conseguida. |
| [GameCanvas.tsx:831](../../src/game/GameCanvas.tsx#L831) | Oculto | 11 | Noa trepa por la enredadera al Reino Secreto de las Nubes. |
| [GameCanvas.tsx:843](../../src/game/GameCanvas.tsx#L843) | Oculto | 9 | ¡Has pillado al animal travieso! Te devuelve el ovillo. |
| [GameCanvas.tsx:857](../../src/game/GameCanvas.tsx#L857) | Oculto | 6 | ¡Gatito encontrado! Llevas {…} de {…}. |
| [GameCanvas.tsx:861](../../src/game/GameCanvas.tsx#L861) | Oculto | 10 | ¡Los tres gatitos! La puerta de los gatitos está abierta. |
| [GameCanvas.tsx:866](../../src/game/GameCanvas.tsx#L866) | Oculto | 7 | ¡Los gatitos vuelven a casa! Pantalla superada. |
| [GameCanvas.tsx:884](../../src/game/GameCanvas.tsx#L884) | Oculto | 4 | ¡Banderín tocado! Pantalla superada. |
| [GameCanvas.tsx:1029](../../src/game/GameCanvas.tsx#L1029) | Noa | 6 | ¡MIRA EL RITMO DE LA LAVA! |
| [GameCanvas.tsx:1029](../../src/game/GameCanvas.tsx#L1029) | Noa | 6 | ¡CAE SOBRE EL ROCÍO PARA REBOTAR! |
| [GameCanvas.tsx:1029](../../src/game/GameCanvas.tsx#L1029) | Noa | 7 | ¡SALTA SOBRE EL REGALO DE LA FLECHA! |
| [GameCanvas.tsx:1029](../../src/game/GameCanvas.tsx#L1029) | Noa | 6 | ¡LA ARENA TE AYUDA A SUBIR! |
| [GameCanvas.tsx:1029](../../src/game/GameCanvas.tsx#L1029) | Noa | 4 | ¡LOS VAGONES TE LLEVAN! |
| [GameCanvas.tsx:1029](../../src/game/GameCanvas.tsx#L1029) | Noa | 6 | ¡SIGUE LAS ONDAS DE LA MÚSICA! |
| [GameCanvas.tsx:1029](../../src/game/GameCanvas.tsx#L1029) | Noa | 7 | ¡EL HIELO RESBALA Y EL VIENTO EMPUJA! |
| [GameCanvas.tsx:1035](../../src/game/GameCanvas.tsx#L1035) | Noa | 5 | ZZZ: PASA · ¡OJO AL DESPERTAR! |
| [GameCanvas.tsx:1036](../../src/game/GameCanvas.tsx#L1036) | Noa | 6 | PÉTALOS ROSAS: PASA · AMARILLOS: ¡SE CIERRA! |
| [GameCanvas.tsx:1037](../../src/game/GameCanvas.tsx#L1037) | Noa | 6 | ¡EL PERRITO AVISA! PASA POR ARRIBA |
| [GameCanvas.tsx:1038](../../src/game/GameCanvas.tsx#L1038) | Noa | 6 | ¡SALTA CUANDO EL COMPÁS SE ILUMINE! |
| [GameCanvas.tsx:1039](../../src/game/GameCanvas.tsx#L1039) | Noa | 6 | ↑ EL AIRE TE AYUDA A SUBIR ↑ |
| [GameCanvas.tsx:1108](../../src/game/GameCanvas.tsx#L1108) | Noa | 4 | ¿QUÉ ESCONDE ESTE BLOQUE? |
| [GameCanvas.tsx:1108](../../src/game/GameCanvas.tsx#L1108) | Noa | 4 | ¡SALTA BAJO EL GATITO! |
| [GameCanvas.tsx:1116](../../src/game/GameCanvas.tsx#L1116) | Noa | 3 | ¡TOCA LA ENREDADERA! |
| [GameCanvas.tsx:1248](../../src/game/GameCanvas.tsx#L1248) | Noa | 6 | ¡SUBE! LOS DOS BORDES ESTÁN CONECTADOS |
| [GameCanvas.tsx:1249](../../src/game/GameCanvas.tsx#L1249) | Noa | 9 | Sal por un lado y entrarás por el otro. |
| [GameCanvas.tsx:1250](../../src/game/GameCanvas.tsx#L1250) | Noa | 4 | NUBE ROSA ↑? = ¡SUPERSALTO SORPRESA! |
| [GameCanvas.tsx:1258](../../src/game/GameCanvas.tsx#L1258) | Noa | 5 | SALTAR: NADA ARRIBA · SUELTA: BAJA |
| [GameCanvas.tsx:1259](../../src/game/GameCanvas.tsx#L1259) | Noa | 8 | Puedes caminar por la arena. ¡Evita los erizos! |
| [GameCanvas.tsx:1299](../../src/game/GameCanvas.tsx#L1299) | Noa | 3 | Pantalla {…}: {…} |
| [GameCanvas.tsx:1301](../../src/game/GameCanvas.tsx#L1301) | Noa | 5 | Entrar en la tienda secreta |
| [GameCanvas.tsx:1301](../../src/game/GameCanvas.tsx#L1301) | Noa | 4 | Explorar el desvío secreto |
| [GameCanvas.tsx:1301](../../src/game/GameCanvas.tsx#L1301) | Noa | 5 | Activar el ascensor de nubes |
| [GameCanvas.tsx:1301](../../src/game/GameCanvas.tsx#L1301) | Noa | 2 | Activar mecanismo |
| [GameCanvas.tsx:1302](../../src/game/GameCanvas.tsx#L1302) | Noa | 3 | ↺ Empezar la sala |
| [GameCanvas.tsx:1303](../../src/game/GameCanvas.tsx#L1303) | Noa | 3 | ↩ Volver al camino |
| [chase.ts:65](../../src/game/chase.ts#L65) | Noa | 3 | ¡Toma tu ovillo! |
| [exploreRendering.ts:65](../../src/game/exploreRendering.ts#L65) | Noa | 1 | ¡Miau! |
| [exploreRendering.ts:80](../../src/game/exploreRendering.ts#L80) | Noa | 1 | Gatitos: |
| [rendering.ts:1445](../../src/game/rendering.ts#L1445) | Noa | 1 | ¡OINK! |
| [rendering.ts:1445](../../src/game/rendering.ts#L1445) | Noa | 1 | ¡AUUU! |
| [rendering.ts:1511](../../src/game/rendering.ts#L1511) | Noa | 1 | ¡DESPIERTA! |
| [rendering.ts:1511](../../src/game/rendering.ts#L1511) | Noa | 1 | ZZZ |
| [rendering.ts:1892](../../src/game/rendering.ts#L1892) | Noa | 1 | ¡OINK! |
| [rendering.ts:1925](../../src/game/rendering.ts#L1925) | Noa | 1 | ¡AUUU! |
| [rendering.ts:2093](../../src/game/rendering.ts#L2093) | Noa | 2 | ¡SE CIERRA! |
| [rendering.ts:2093](../../src/game/rendering.ts#L2093) | Noa | 1 | ¡PASA! |
| [rendering.ts:2093](../../src/game/rendering.ts#L2093) | Noa | 2 | ¡SE ABRE! |
| [rendering.ts:2093](../../src/game/rendering.ts#L2093) | Noa | 3 | ESPERA LA FLOR |
| [rendering.ts:2142](../../src/game/rendering.ts#L2142) | Noa | 2 | ¡AIRE ARRIBA! |
| [rendering.ts:2167](../../src/game/rendering.ts#L2167) | Noa | 1 | ↓ ¡AGUA! ↓ |
| [rendering.ts:2328](../../src/game/rendering.ts#L2328) | Noa | 2 | ¡GATITO RESCATADO! |
| [rendering.ts:2331](../../src/game/rendering.ts#L2331) | Noa | 5 | NOA HA ENCONTRADO UN AMIGO |
| [rendering.ts:2353](../../src/game/rendering.ts#L2353) | Noa | 1 | DUELO |

### Pantallas (títulos y pistas)

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [levels.ts:104](../../src/game/levels.ts#L104) | Noa | 3 | Mañana entre manzanos |
| [levels.ts:105](../../src/game/levels.ts#L105) | Noa | 3 | Tarde de manzanas |
| [levels.ts:106](../../src/game/levels.ts#L106) | Noa | 4 | Bosque de los bigotes |
| [levels.ts:107](../../src/game/levels.ts#L107) | Noa | 4 | Claro de la luna |
| [levels.ts:108](../../src/game/levels.ts#L108) | Noa | 5 | Grutas de cristal y lava |
| [levels.ts:109](../../src/game/levels.ts#L109) | Noa | 4 | Pinar de las huellas |
| [levels.ts:110](../../src/game/levels.ts#L110) | Noa | 4 | Bosque de los lobos |
| [levels.ts:111](../../src/game/levels.ts#L111) | Noa | 4 | Copas de los jabalíes |
| [levels.ts:112](../../src/game/levels.ts#L112) | Noa | 3 | Tormenta de bellotas |
| [levels.ts:113](../../src/game/levels.ts#L113) | Noa | 5 | La flota de las nubes |
| [levels.ts:114](../../src/game/levels.ts#L114) | Noa | 5 | La tormenta del Capitán Celeste |
| [levels.ts:115](../../src/game/levels.ts#L115) | Noa | 6 | El castillo de los sustos divertidos |
| [levels.ts:116](../../src/game/levels.ts#L116) | Noa | 6 | El reino secreto de las nubes |
| [levels.ts:117](../../src/game/levels.ts#L117) | Noa | 5 | La laguna de los corales |
| [levels.ts:118](../../src/game/levels.ts#L118) | Noa | 6 | La isla tropical de los dinosaurios |
| [levels.ts:119](../../src/game/levels.ts#L119) | Noa | 5 | El volcán de los dragones |
| [levels.ts:120](../../src/game/levels.ts#L120) | Noa | 5 | El valle de los gigantes |
| [levels.ts:121](../../src/game/levels.ts#L121) | Noa | 4 | La montaña de hielo |
| [levels.ts:122](../../src/game/levels.ts#L122) | Noa | 5 | La senda de la nieve |
| [levels.ts:123](../../src/game/levels.ts#L123) | Noa | 4 | La fábrica de juguetes |
| [levels.ts:124](../../src/game/levels.ts#L124) | Noa | 4 | El almacén de regalos |
| [levels.ts:125](../../src/game/levels.ts#L125) | Noa | 4 | Las dunas que cantan |
| [levels.ts:126](../../src/game/levels.ts#L126) | Noa | 5 | El oasis de los espejos |
| [levels.ts:127](../../src/game/levels.ts#L127) | Noa | 4 | Las ruinas de Siroco |
| [levels.ts:128](../../src/game/levels.ts#L128) | Noa | 5 | El andén de las maletas |
| [levels.ts:129](../../src/game/levels.ts#L129) | Noa | 4 | El puente del silbido |
| [levels.ts:130](../../src/game/levels.ts#L130) | Noa | 5 | La locomotora de Don Silbato |
| [levels.ts:131](../../src/game/levels.ts#L131) | Noa | 5 | El jardín de los tambores |
| [levels.ts:132](../../src/game/levels.ts#L132) | Noa | 5 | El bosque de las campanas |
| [levels.ts:133](../../src/game/levels.ts#L133) | Noa | 5 | El gran teatro de Armonía |
| [levels.ts:134](../../src/game/levels.ts#L134) | Noa | 4 | Las nubes del amanecer |
| [levels.ts:135](../../src/game/levels.ts#L135) | Noa | 4 | La escalera del cielo |
| [levels.ts:136](../../src/game/levels.ts#L136) | Noa | 5 | La puerta de las estrellas |
| [levels.ts:172](../../src/game/levels.ts#L172) | Noa | 4 | La laguna de Perla |
| [levels.ts:173](../../src/game/levels.ts#L173) | Noa | 10 | Toca SALTAR para nadar hacia arriba. Suelta para bajar despacito. |
| [levels.ts:182](../../src/game/levels.ts#L182) | Noa | 5 | El jardín de los erizos |
| [levels.ts:183](../../src/game/levels.ts#L183) | Noa | 13 | Nada entre los corales o camina por la arena. ¡Cuidado con los erizos! |
| [levels.ts:189](../../src/game/levels.ts#L189) | Noa | 1 | A-1 |
| [levels.ts:192](../../src/game/levels.ts#L192) | Noa | 5 | El palacio de Don Aleta |
| [levels.ts:193](../../src/game/levels.ts#L193) | Noa | 11 | Cruza las grutas del arrecife y conoce al guardián del mar. |
| [levels.ts:200](../../src/game/levels.ts#L200) | Noa | 1 | A-2 |
| [levels.ts:200](../../src/game/levels.ts#L200) | Noa | 4 | Seguir con los jabalíes ▶ |
| [levels.ts:222](../../src/game/levels.ts#L222) | Noa | 5 | El sendero de las manzanas |
| [levels.ts:223](../../src/game/levels.ts#L223) | Noa | 9 | Aprende a saltar y descubre la caja con huella. |
| [levels.ts:259](../../src/game/levels.ts#L259) | Noa | 6 | La gran fiesta de las copas |
| [levels.ts:260](../../src/game/levels.ts#L260) | Noa | 11 | ¡Un escarabajo se ha llevado el ovillo! Síguelo por el huerto. |
| [levels.ts:277](../../src/game/levels.ts#L277) | Noa | 5 | ¡Ji, ji! ¡No me pillas! |
| [levels.ts:278](../../src/game/levels.ts#L278) | Noa | 2 | ¡Por aquí! |
| [levels.ts:279](../../src/game/levels.ts#L279) | Noa | 3 | ¡Salta el hueco! |
| [levels.ts:280](../../src/game/levels.ts#L280) | Noa | 1 | ¡Arriba! |
| [levels.ts:281](../../src/game/levels.ts#L281) | Noa | 4 | ¡Bota en el muelle! |
| [levels.ts:282](../../src/game/levels.ts#L282) | Noa | 2 | ¡Qué alto! |
| [levels.ts:283](../../src/game/levels.ts#L283) | Noa | 2 | ¡Casi, casi! |
| [levels.ts:284](../../src/game/levels.ts#L284) | Noa | 4 | ¡Ay! ¡No hay salida! |
| [levels.ts:306](../../src/game/levels.ts#L306) | Noa | 5 | La fortaleza de las raíces |
| [levels.ts:307](../../src/game/levels.ts#L307) | Noa | 12 | Un camino largo con tres saltos antes del duelo del Rey Zarzal. |
| [levels.ts:349](../../src/game/levels.ts#L349) | Noa | 5 | El bosque de los bigotes |
| [levels.ts:350](../../src/game/levels.ts#L350) | Noa | 8 | Las luciérnagas marcan un camino algo más largo. |
| [levels.ts:383](../../src/game/levels.ts#L383) | Noa | 5 | La gruta de los murciélagos |
| [levels.ts:384](../../src/game/levels.ts#L384) | Noa | 14 | Abre las puertas de cristal. En la niebla, las repisas casi no se ven. |
| [levels.ts:445](../../src/game/levels.ts#L445) | Noa | 5 | El corazón de la cueva |
| [levels.ts:446](../../src/game/levels.ts#L446) | Noa | 12 | Busca la salida entre la lava y reta a la Condesa Niebla. |
| [levels.ts:497](../../src/game/levels.ts#L497) | Noa | 5 | El pinar de las huellas |
| [levels.ts:498](../../src/game/levels.ts#L498) | Noa | 11 | Los lobos duermen: pasa al ver ZZZ. ¡Avisan antes de despertar! |
| [levels.ts:529](../../src/game/levels.ts#L529) | Noa | 7 | El corazón del bosque de los lobos |
| [levels.ts:530](../../src/game/levels.ts#L530) | Noa | 16 | ¡Tres gatitos perdidos! Búscalos en el árbol y en el túnel sin despertar a los lobos. |
| [levels.ts:568](../../src/game/levels.ts#L568) | Noa | 1 | A-1 |
| [levels.ts:571](../../src/game/levels.ts#L571) | Noa | 5 | La guarida del Gran Lobo |
| [levels.ts:572](../../src/game/levels.ts#L572) | Noa | 12 | Pasa junto a los lobos dormidos y salta hasta el Gran Lobo. |
| [levels.ts:613](../../src/game/levels.ts#L613) | Noa | 5 | Las copas de las bellotas |
| [levels.ts:614](../../src/game/levels.ts#L614) | Noa | 10 | Arriba hay un camino seguro; abajo, manzanas entre los jabalíes. |
| [levels.ts:644](../../src/game/levels.ts#L644) | Noa | 6 | El gran árbol de las copas |
| [levels.ts:645](../../src/game/levels.ts#L645) | Noa | 14 | ¡Sube por las copas hasta lo más alto! Los jabalíes pasean por las ramas. |
| [levels.ts:676](../../src/game/levels.ts#L676) | Noa | 1 | S-1 |
| [levels.ts:679](../../src/game/levels.ts#L679) | Noa | 5 | La fortaleza del Gran Jabalí |
| [levels.ts:680](../../src/game/levels.ts#L680) | Noa | 11 | Busca la gran plataforma de madera para alcanzar la enredadera secreta. |
| [levels.ts:726](../../src/game/levels.ts#L726) | Noa | 5 | La flota de las nubes |
| [levels.ts:727](../../src/game/levels.ts#L727) | Noa | 10 | Salta entre barcos voladores y vigila a los primeros piratas. |
| [levels.ts:758](../../src/game/levels.ts#L758) | Noa | 5 | El baile de las velas |
| [levels.ts:759](../../src/game/levels.ts#L759) | Noa | 12 | ¡Un loro se ha llevado el ovillo! Síguelo de barco en barco. |
| [levels.ts:777](../../src/game/levels.ts#L777) | Noa | 4 | ¡Cra, cra! ¡Mi ovillo! |
| [levels.ts:778](../../src/game/levels.ts#L778) | Noa | 3 | ¡Al otro barco! |
| [levels.ts:779](../../src/game/levels.ts#L779) | Noa | 2 | ¡Vuela, vuela! |
| [levels.ts:780](../../src/game/levels.ts#L780) | Noa | 2 | ¡Cuidado, pirata! |
| [levels.ts:781](../../src/game/levels.ts#L781) | Noa | 3 | ¡Por la tabla! |
| [levels.ts:782](../../src/game/levels.ts#L782) | Noa | 2 | ¡Qué viento! |
| [levels.ts:783](../../src/game/levels.ts#L783) | Noa | 2 | ¡Casi, casi! |
| [levels.ts:784](../../src/game/levels.ts#L784) | Noa | 3 | ¡Uf, qué lejos! |
| [levels.ts:785](../../src/game/levels.ts#L785) | Noa | 4 | ¡Ay! ¡No hay salida! |
| [levels.ts:803](../../src/game/levels.ts#L803) | Noa | 5 | La tormenta del Capitán Celeste |
| [levels.ts:804](../../src/game/levels.ts#L804) | Noa | 12 | Cruza la gran flota, salta los cañonazos y reta al capitán pirata. |
| [levels.ts:845](../../src/game/levels.ts#L845) | Noa | 4 | Las puertas del castillo |
| [levels.ts:845](../../src/game/levels.ts#L845) | Noa | 13 | Los perritos de cobre avisan antes de morder. ¡Busca el camino de arriba! |
| [levels.ts:868](../../src/game/levels.ts#L868) | Noa | 5 | El laberinto de las torres |
| [levels.ts:868](../../src/game/levels.ts#L868) | Noa | 12 | Abre las puertas de las torres. Los perritos avisan: ¡pasa por arriba! |
| [levels.ts:929](../../src/game/levels.ts#L929) | Noa | 7 | Viajar a la isla de los dinosaurios ▶ |
| [levels.ts:930](../../src/game/levels.ts#L930) | Noa | 5 | El salón del Conde Vampiro |
| [levels.ts:930](../../src/game/levels.ts#L930) | Noa | 8 | Una última ruta entre fantasmas, pinchos y pasadizos. |
| [levels.ts:954](../../src/game/levels.ts#L954) | Noa | 5 | La costa de las huellas |
| [levels.ts:954](../../src/game/levels.ts#L954) | Noa | 13 | Salta sobre el agua y conoce a los pequeños t-rex de la isla. |
| [levels.ts:973](../../src/game/levels.ts#L973) | Noa | 5 | El vuelo de los terodáctilos |
| [levels.ts:973](../../src/game/levels.ts#L973) | Noa | 15 | ¡Tres gatitos se han perdido en la isla! Búscalos en los acantilados y la laguna. |
| [levels.ts:1002](../../src/game/levels.ts#L1002) | Noa | 6 | Viajar al volcán de los dragones ▶ |
| [levels.ts:1003](../../src/game/levels.ts#L1003) | Noa | 6 | El nido de la Reina Tricera |
| [levels.ts:1003](../../src/game/levels.ts#L1003) | Noa | 12 | Cruza la gran isla y juega con su guardiana de tres cuernos. |
| [levels.ts:1024](../../src/game/levels.ts#L1024) | Noa | 3 | Las laderas humeantes |
| [levels.ts:1024](../../src/game/levels.ts#L1024) | Noa | 12 | Observa el ritmo de los chorros de lava y salta cuando bajen. |
| [levels.ts:1045](../../src/game/levels.ts#L1045) | Noa | 4 | La chimenea del volcán |
| [levels.ts:1045](../../src/game/levels.ts#L1045) | Noa | 13 | Sube por la chimenea: los chorros de lava suben y bajan al compás. |
| [levels.ts:1068](../../src/game/levels.ts#L1068) | Noa | 6 | Bajar al valle de los gigantes ▶ |
| [levels.ts:1069](../../src/game/levels.ts#L1069) | Noa | 4 | El corazón del volcán |
| [levels.ts:1069](../../src/game/levels.ts#L1069) | Noa | 10 | Llega hasta Dragona Rubí y demuéstrale lo valiente que eres. |
| [levels.ts:1091](../../src/game/levels.ts#L1091) | Noa | 6 | El sendero de las flores gigantes |
| [levels.ts:1091](../../src/game/levels.ts#L1091) | Noa | 14 | La flor abierta es un puente. Si avisa, ¡salta! También hay gotas de rocío. |
| [levels.ts:1111](../../src/game/levels.ts#L1111) | Noa | 5 | El jardín de las gotas |
| [levels.ts:1111](../../src/game/levels.ts#L1111) | Noa | 11 | ¡Una abeja se ha llevado el ovillo! Síguela por las flores. |
| [levels.ts:1130](../../src/game/levels.ts#L1130) | Noa | 3 | ¡Bzz! ¡Mi ovillo! |
| [levels.ts:1131](../../src/game/levels.ts#L1131) | Noa | 2 | ¡Ven, ven! |
| [levels.ts:1132](../../src/game/levels.ts#L1132) | Noa | 3 | ¡Salta el agua! |
| [levels.ts:1133](../../src/game/levels.ts#L1133) | Noa | 3 | ¡Por la flor! |
| [levels.ts:1134](../../src/game/levels.ts#L1134) | Noa | 4 | ¡Bota en el rocío! |
| [levels.ts:1135](../../src/game/levels.ts#L1135) | Noa | 3 | ¡Qué alto vuelo! |
| [levels.ts:1136](../../src/game/levels.ts#L1136) | Noa | 3 | ¡Uy, otra flor! |
| [levels.ts:1137](../../src/game/levels.ts#L1137) | Noa | 2 | ¡Casi, casi! |
| [levels.ts:1138](../../src/game/levels.ts#L1138) | Noa | 4 | ¡Ay! ¡No hay salida! |
| [levels.ts:1148](../../src/game/levels.ts#L1148) | Noa | 6 | Subir a la montaña de hielo ▶ |
| [levels.ts:1149](../../src/game/levels.ts#L1149) | Noa | 4 | La colmena de Melisa |
| [levels.ts:1149](../../src/game/levels.ts#L1149) | Noa | 14 | Flores y gotas te ayudan. Salta cuando la flor avise y busca a Melisa. |
| [levels.ts:1173](../../src/game/levels.ts#L1173) | Noa | 5 | La senda de la nieve |
| [levels.ts:1173](../../src/game/levels.ts#L1173) | Noa | 11 | El hielo resbala y las ráfagas empujan: avanza mirando el viento. |
| [levels.ts:1192](../../src/game/levels.ts#L1192) | Noa | 4 | Las cuevas de hielo |
| [levels.ts:1192](../../src/game/levels.ts#L1192) | Noa | 9 | Empuja los cajones: en el hielo resbalan hasta chocar. |
| [levels.ts:1257](../../src/game/levels.ts#L1257) | Noa | 4 | Seguir a Papá Noel ▶ |
| [levels.ts:1258](../../src/game/levels.ts#L1258) | Noa | 5 | La cima de la aurora |
| [levels.ts:1258](../../src/game/levels.ts#L1258) | Noa | 13 | Domina el hielo y el viento para llegar hasta la gran Osa Boreal. |
| [levels.ts:1277](../../src/game/levels.ts#L1277) | Noa | 5 | El camino de los regalos |
| [levels.ts:1277](../../src/game/levels.ts#L1277) | Noa | 10 | ¡Salta sobre el regalo saltarín para subir hasta los pinos! |
| [levels.ts:1311](../../src/game/levels.ts#L1311) | Noa | 6 | El gran árbol de la fábrica |
| [levels.ts:1311](../../src/game/levels.ts#L1311) | Noa | 14 | ¡Sube hasta la estrella! Las cintas te llevan y los regalos saltarines te impulsan. |
| [levels.ts:1349](../../src/game/levels.ts#L1349) | Noa | 4 | Seguir hacia el desierto ▶ |
| [levels.ts:1350](../../src/game/levels.ts#L1350) | Noa | 4 | El almacén de regalos |
| [levels.ts:1350](../../src/game/levels.ts#L1350) | Noa | 12 | ¡Combina las cintas y el regalo saltarín para llegar hasta Papá Noel! |
| [levels.ts:1382](../../src/game/levels.ts#L1382) | Noa | 4 | Las dunas que cantan |
| [levels.ts:1382](../../src/game/levels.ts#L1382) | Noa | 12 | Entra en el géiser de arena para subir. Los remolinos empujan despacito. |
| [levels.ts:1403](../../src/game/levels.ts#L1403) | Noa | 5 | El oasis de los espejos |
| [levels.ts:1403](../../src/game/levels.ts#L1403) | Noa | 13 | ¡Tres gatitos se han perdido en el oasis! Búscalos arriba, abajo y lejos. |
| [levels.ts:1430](../../src/game/levels.ts#L1430) | Noa | 3 | Subir al tren ▶ |
| [levels.ts:1431](../../src/game/levels.ts#L1431) | Noa | 4 | Las ruinas de Siroco |
| [levels.ts:1431](../../src/game/levels.ts#L1431) | Noa | 11 | Cruza las columnas de arena y visita al guardián del desierto. |
| [levels.ts:1452](../../src/game/levels.ts#L1452) | Noa | 5 | El andén de las maletas |
| [levels.ts:1452](../../src/game/levels.ts#L1452) | Noa | 14 | Monta en los techos largos del tren: puedes caminar o dejar que te lleven. |
| [levels.ts:1470](../../src/game/levels.ts#L1470) | Noa | 4 | El puente del silbido |
| [levels.ts:1470](../../src/game/levels.ts#L1470) | Noa | 13 | ¡El ratón de cuerda se ha llevado el ovillo! Síguelo por los vagones. |
| [levels.ts:1484](../../src/game/levels.ts#L1484) | Noa | 4 | ¡Cric, cric! ¡Mi ovillo! |
| [levels.ts:1485](../../src/game/levels.ts#L1485) | Noa | 2 | ¡Al tren! |
| [levels.ts:1486](../../src/game/levels.ts#L1486) | Noa | 3 | ¡Sube al vagón! |
| [levels.ts:1487](../../src/game/levels.ts#L1487) | Noa | 2 | ¡Cuidado, vapor! |
| [levels.ts:1488](../../src/game/levels.ts#L1488) | Noa | 4 | ¡La cinta me lleva! |
| [levels.ts:1489](../../src/game/levels.ts#L1489) | Noa | 2 | ¡Qué alto! |
| [levels.ts:1490](../../src/game/levels.ts#L1490) | Noa | 2 | ¡Casi, casi! |
| [levels.ts:1491](../../src/game/levels.ts#L1491) | Noa | 4 | ¡Ya no corro más! |
| [levels.ts:1492](../../src/game/levels.ts#L1492) | Noa | 4 | ¡Ay! ¡No hay salida! |
| [levels.ts:1500](../../src/game/levels.ts#L1500) | Noa | 3 | Seguir la melodía ▶ |
| [levels.ts:1501](../../src/game/levels.ts#L1501) | Noa | 5 | La locomotora de Don Silbato |
| [levels.ts:1501](../../src/game/levels.ts#L1501) | Noa | 11 | Combina los vagones y el vapor para llegar hasta el maquinista. |
| [levels.ts:1520](../../src/game/levels.ts#L1520) | Noa | 5 | El jardín de los tambores |
| [levels.ts:1520](../../src/game/levels.ts#L1520) | Noa | 12 | Empieza con un paseo tranquilo y cruza los puentes siguiendo la música. |
| [levels.ts:1547](../../src/game/levels.ts#L1547) | Noa | 5 | El bosque de las campanas |
| [levels.ts:1547](../../src/game/levels.ts#L1547) | Noa | 11 | Las plataformas cambian de color al compás: salta cuando se enciendan. |
| [levels.ts:1607](../../src/game/levels.ts#L1607) | Noa | 4 | Subir al Reino Celeste |
| [levels.ts:1608](../../src/game/levels.ts#L1608) | Noa | 5 | El gran teatro de Armonía |
| [levels.ts:1608](../../src/game/levels.ts#L1608) | Noa | 15 | Sigue la música entre los tambores y llega al gran escenario para saludar a Armonía. |
| [levels.ts:1635](../../src/game/levels.ts#L1635) | Noa | 4 | Las nubes del amanecer |
| [levels.ts:1635](../../src/game/levels.ts#L1635) | Noa | 14 | Sube de nube en nube o tira de la palanca para tomar el ascensor. |
| [levels.ts:1650](../../src/game/levels.ts#L1650) | Noa | 4 | La escalera del cielo |
| [levels.ts:1650](../../src/game/levels.ts#L1650) | Noa | 15 | El camino sigue por el centro. La palanca abre un camino más fácil en ascensor. |
| [levels.ts:1665](../../src/game/levels.ts#L1665) | Noa | 5 | La puerta de las estrellas |
| [levels.ts:1665](../../src/game/levels.ts#L1665) | Noa | 17 | Alcanza la luna o tira de la palanca para subir en ascensor y conocer a Aurora Celeste. |
| [levels.ts:1682](../../src/game/levels.ts#L1682) | Noa | 6 | El reino secreto de las nubes |
| [levels.ts:1683](../../src/game/levels.ts#L1683) | Noa | 14 | Entra en las columnas de aire: suben suave. Sal a un lado para bajar. |

### Caminos secretos

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [detours.ts:9](../../src/game/detours.ts#L9) | Noa | 5 | El sendero de las luciérnagas |
| [detours.ts:9](../../src/game/detours.ts#L9) | Noa | 1 | Luciérnagas |
| [detours.ts:12](../../src/game/detours.ts#L12) | Noa | 5 | El túnel del gatito minero |
| [detours.ts:12](../../src/game/detours.ts#L12) | Noa | 2 | Túnel minero |
| [detours.ts:15](../../src/game/detours.ts#L15) | Noa | 5 | El molino de las manzanas |
| [detours.ts:15](../../src/game/detours.ts#L15) | Noa | 1 | Molino |
| [detours.ts:17](../../src/game/detours.ts#L17) | Noa | 5 | La biblioteca de las patitas |
| [detours.ts:17](../../src/game/detours.ts#L17) | Noa | 1 | Biblioteca |
| [detours.ts:19](../../src/game/detours.ts#L19) | Noa | 5 | El jardín de los gigantes |
| [detours.ts:19](../../src/game/detours.ts#L19) | Noa | 1 | Jardín |
| [detours.ts:30](../../src/game/detours.ts#L30) | Noa | 5 | El sendero de las luciérnagas |
| [detours.ts:30](../../src/game/detours.ts#L30) | Noa | 10 | Sigue las luces. Siempre puedes volver por donde has venido. |
| [detours.ts:40](../../src/game/detours.ts#L40) | Noa | 5 | El túnel del gatito minero |
| [detours.ts:40](../../src/game/detours.ts#L40) | Noa | 9 | Sube a la vagoneta y salta entre los cristales. |
| [detours.ts:50](../../src/game/detours.ts#L50) | Noa | 5 | El molino de las manzanas |
| [detours.ts:50](../../src/game/detours.ts#L50) | Noa | 8 | La campana cambia el giro de las ruedas. |
| [detours.ts:63](../../src/game/detours.ts#L63) | Noa | 5 | La biblioteca de las patitas |
| [detours.ts:63](../../src/game/detours.ts#L63) | Noa | 9 | Las patitas abren los libros y dibujan un puente. |
| [detours.ts:75](../../src/game/detours.ts#L75) | Noa | 5 | El jardín de los gigantes |
| [detours.ts:75](../../src/game/detours.ts#L75) | Noa | 11 | Las hojas bajan con tu peso. El agua despierta la planta. |

### Subida al reino secreto

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [App.tsx:832](../../src/App.tsx#L832) | Noa | 2 | ¡Pasadizo secreto! |
| [App.tsx:833](../../src/App.tsx#L833) | Noa | 6 | Subiendo al Reino de las Nubes… |
| [App.tsx:834](../../src/App.tsx#L834) | Noa | 10 | La enredadera mágica lleva a Noa por encima del bosque. |

### Paseo de los amigos

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [restStops.ts:18](../../src/game/restStops.ts#L18) | Noa | 4 | ¡Soy blandita y saltarina! |
| [restStops.ts:19](../../src/game/restStops.ts#L19) | Noa | 5 | ¡Me encanta brillar al sol! |
| [restStops.ts:20](../../src/game/restStops.ts#L20) | Noa | 4 | ¡Floto como un algodón! |
| [restStops.ts:22](../../src/game/restStops.ts#L22) | Noa | 5 | ¡Gracias por la visita, Noa! |
| [restStops.ts:27](../../src/game/restStops.ts#L27) | Noa | 5 | ¡En la cueva estoy fresquita! |
| [restStops.ts:28](../../src/game/restStops.ts#L28) | Noa | 6 | ¡Mis alas brillan en la niebla! |
| [restStops.ts:29](../../src/game/restStops.ts#L29) | Noa | 5 | ¡Duermo boca abajo, ji, ji! |
| [restStops.ts:30](../../src/game/restStops.ts#L30) | Noa | 6 | ¡La niebla y yo somos primas! |
| [restStops.ts:32](../../src/game/restStops.ts#L32) | Noa | 5 | ¡Vuelve pronto a la gruta! |
| [restStops.ts:37](../../src/game/restStops.ts#L37) | Noa | 6 | ¡Ya me he echado la siesta! |
| [restStops.ts:38](../../src/game/restStops.ts#L38) | Noa | 6 | ¡Soy la nube de la luna! |
| [restStops.ts:40](../../src/game/restStops.ts#L40) | Noa | 4 | ¡Auuu! ¡Hasta pronto, Noa! |
| [restStops.ts:45](../../src/game/restStops.ts#L45) | Noa | 4 | ¡Me encantan las bellotas! |
| [restStops.ts:46](../../src/game/restStops.ts#L46) | Noa | 5 | ¡Pío, pío, qué bien saltas! |
| [restStops.ts:48](../../src/game/restStops.ts#L48) | Noa | 5 | ¡Ven a merendar otro día! |
| [restStops.ts:53](../../src/game/restStops.ts#L53) | Noa | 5 | ¡Ahoy! ¡Soy un pirata bueno! |
| [restStops.ts:54](../../src/game/restStops.ts#L54) | Noa | 4 | ¡Cra, cra, hola, Noa! |
| [restStops.ts:56](../../src/game/restStops.ts#L56) | Noa | 3 | ¡Buen viento, marinera! |
| [restStops.ts:61](../../src/game/restStops.ts#L61) | Noa | 5 | ¡Mis huesos hacen clac, clac! |
| [restStops.ts:62](../../src/game/restStops.ts#L62) | Noa | 4 | ¡Buuu! ¿Te he asustado? |
| [restStops.ts:63](../../src/game/restStops.ts#L63) | Noa | 4 | ¡Solo quiero un abrazo! |
| [restStops.ts:65](../../src/game/restStops.ts#L65) | Noa | 4 | ¡Vuelve a mi castillo! |
| [restStops.ts:70](../../src/game/restStops.ts#L70) | Noa | 4 | ¡Mis bracitos son cortitos! |
| [restStops.ts:71](../../src/game/restStops.ts#L71) | Noa | 4 | ¡Vuelo sobre la isla! |
| [restStops.ts:73](../../src/game/restStops.ts#L73) | Noa | 3 | ¡Hasta pronto, pequeña! |
| [restStops.ts:78](../../src/game/restStops.ts#L78) | Noa | 4 | ¡Echo humito, no fuego! |
| [restStops.ts:79](../../src/game/restStops.ts#L79) | Noa | 5 | ¡La lava me da calorcito! |
| [restStops.ts:80](../../src/game/restStops.ts#L80) | Noa | 4 | ¡Me encanta volar alto! |
| [restStops.ts:82](../../src/game/restStops.ts#L82) | Noa | 4 | ¡Vuelve a mi volcán! |
| [restStops.ts:87](../../src/game/restStops.ts#L87) | Noa | 4 | ¡Llevo hojas muy grandes! |
| [restStops.ts:88](../../src/game/restStops.ts#L88) | Noa | 3 | ¡Voy despacito, despacito! |
| [restStops.ts:89](../../src/game/restStops.ts#L89) | Noa | 4 | ¡Bzz! ¡Hago miel dulce! |
| [restStops.ts:91](../../src/game/restStops.ts#L91) | Noa | 4 | ¡Gracias por tu visita! |
| [restStops.ts:96](../../src/game/restStops.ts#L96) | Noa | 5 | ¡Me deslizo con la tripa! |
| [restStops.ts:97](../../src/game/restStops.ts#L97) | Noa | 5 | ¡Mi cola es muy calentita! |
| [restStops.ts:98](../../src/game/restStops.ts#L98) | Noa | 5 | ¡Uh, uh! ¡Veo de noche! |
| [restStops.ts:100](../../src/game/restStops.ts#L100) | Noa | 3 | ¡Abrígate bien, Noa! |
| [restStops.ts:105](../../src/game/restStops.ts#L105) | Noa | 4 | ¡Hago muñecos de nieve! |
| [restStops.ts:106](../../src/game/restStops.ts#L106) | Noa | 3 | ¡Tiro del trineo! |
| [restStops.ts:107](../../src/game/restStops.ts#L107) | Noa | 3 | ¡Envuelvo los regalos! |
| [restStops.ts:108](../../src/game/restStops.ts#L108) | Noa | 5 | ¡Bip, bip, soy tu amigo! |
| [restStops.ts:109](../../src/game/restStops.ts#L109) | Noa | 3 | ¡Guardo los regalos! |
| [restStops.ts:111](../../src/game/restStops.ts#L111) | Noa | 3 | ¡Feliz Navidad, Noa! |
| [restStops.ts:116](../../src/game/restStops.ts#L116) | Noa | 4 | ¡Ruedo bolitas de arena! |
| [restStops.ts:117](../../src/game/restStops.ts#L117) | Noa | 5 | ¡Mis orejas lo oyen todo! |
| [restStops.ts:118](../../src/game/restStops.ts#L118) | Noa | 4 | ¡Ruedo con el viento! |
| [restStops.ts:120](../../src/game/restStops.ts#L120) | Noa | 5 | ¡Que el viento te acompañe! |
| [restStops.ts:125](../../src/game/restStops.ts#L125) | Noa | 3 | ¡Llevo calcetines dentro! |
| [restStops.ts:126](../../src/game/restStops.ts#L126) | Noa | 3 | ¡Pasajeros, al tren! |
| [restStops.ts:127](../../src/game/restStops.ts#L127) | Noa | 4 | ¡Cric, cric, tengo cuerda! |
| [restStops.ts:129](../../src/game/restStops.ts#L129) | Noa | 3 | ¡Buen viaje, Noa! |
| [restStops.ts:134](../../src/game/restStops.ts#L134) | Noa | 3 | ¡Pom, pom, pom! |
| [restStops.ts:135](../../src/game/restStops.ts#L135) | Noa | 4 | ¡Canto todas las notas! |
| [restStops.ts:136](../../src/game/restStops.ts#L136) | Noa | 3 | ¡Toco el violín! |
| [restStops.ts:138](../../src/game/restStops.ts#L138) | Noa | 3 | ¡Bravo, bravo, Noa! |
| [restStops.ts:163](../../src/game/restStops.ts#L163) | Noa | 5 | El paseo de los amigos |
| [restStops.ts:163](../../src/game/restStops.ts#L163) | Noa | 9 | Saluda a los amigos del mundo: aquí nadie muerde. |

### Ventana: pantalla completada

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [App.tsx:932](../../src/App.tsx#L932) | Oculto | 7 | Trofeo dorado con una huella de gato |
| [App.tsx:932](../../src/App.tsx#L932) | Oculto | 3 | Gatito feliz rescatado |
| [App.tsx:932](../../src/App.tsx#L932) | Noa | 2 | ¡Juego ganado! |
| [App.tsx:932](../../src/App.tsx#L932) | Noa | 2 | ¡Gatito encontrado! |
| [App.tsx:933](../../src/App.tsx#L933) | Noa | 1 | Pantalla |
| [App.tsx:934](../../src/App.tsx#L934) | Noa | 3 | Noa ha recogido |
| [App.tsx:934](../../src/App.tsx#L934) | Noa | 9 | La Reina Arcoíris guarda para siempre las insignias encontradas. |
| [App.tsx:934](../../src/App.tsx#L934) | Noa | 8 | El monstruo guardián ha dejado libre el camino. |
| [App.tsx:934](../../src/App.tsx#L934) | Noa | 6 | La siguiente aventura ya está abierta. |
| [App.tsx:935](../../src/App.tsx#L935) | Oculto | 4 | Medallas de esta pantalla |
| [App.tsx:935](../../src/App.tsx#L935) | Noa | 1 | ★ Pantalla |
| [App.tsx:935](../../src/App.tsx#L935) | Noa | 1 | ★ Pegatina |
| [App.tsx:935](../../src/App.tsx#L935) | Noa | 3 | ★ Sin perder vida |
| [App.tsx:936](../../src/App.tsx#L936) | Noa | 2 | Insignia guardada |
| [App.tsx:936](../../src/App.tsx#L936) | Noa | 3 | en el álbum. |
| [App.tsx:937](../../src/App.tsx#L937) | Noa | 13 | Bruma te invita a preparar la leña para la fiesta. ¿Vamos al claro? |
| [App.tsx:937](../../src/App.tsx#L937) | Noa | 4 | Ir a la fiesta |
| [App.tsx:938](../../src/App.tsx#L938) | Noa | 2 | Siguiente pantalla ▶ |
| [App.tsx:939](../../src/App.tsx#L939) | Noa | 4 | 🐾 Visitar a los amigos |
| [App.tsx:940](../../src/App.tsx#L940) | Noa | 4 | Volver al mapa secreto |
| [App.tsx:941](../../src/App.tsx#L941) | Noa | 3 | Volver al mapa |

### Ventana: otra oportunidad

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [App.tsx:947](../../src/App.tsx#L947) | Noa | 2 | Casi, casi… |
| [App.tsx:947](../../src/App.tsx#L947) | Noa | 2 | ¡Otra oportunidad! |
| [App.tsx:948](../../src/App.tsx#L948) | Noa | 13 | Las tres vidas vuelven a estar listas. El camino ya te lo sabes. |
| [App.tsx:949](../../src/App.tsx#L949) | Noa | 1 | Reintentar |
| [App.tsx:950](../../src/App.tsx#L950) | Noa | 3 | Volver al mapa |

### Ventana: pausa

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [App.tsx:973](../../src/App.tsx#L973) | Noa | 1 | Descanso |
| [App.tsx:973](../../src/App.tsx#L973) | Noa | 3 | Juego en pausa |
| [App.tsx:974](../../src/App.tsx#L974) | Noa | 1 | Continuar |
| [App.tsx:974](../../src/App.tsx#L974) | Noa | 2 | Seguir jugando |
| [App.tsx:975](../../src/App.tsx#L975) | Noa | 2 | Reiniciar pantalla |
| [App.tsx:976](../../src/App.tsx#L976) | Noa | 3 | Volver al mapa |

### Ventana: final

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [App.tsx:962](../../src/App.tsx#L962) | Noa | 2 | Aventura completada |
| [App.tsx:963](../../src/App.tsx#L963) | Noa | 3 | ¡Bravo, Super Noa! |
| [App.tsx:963](../../src/App.tsx#L963) | Noa | 21 | Los guardianes son ahora amigos de Noa. Los gatitos y la tripulación celebran una fiesta en el castillo. Fin… por ahora. |
| [App.tsx:964](../../src/App.tsx#L964) | Noa | 3 | Ver el mapa |
| [App.tsx:965](../../src/App.tsx#L965) | Noa | 3 | Ir al inicio |

### Ayuda

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [App.tsx:1003](../../src/App.tsx#L1003) | Oculto | 1 | Cerrar |
| [App.tsx:1004](../../src/App.tsx#L1004) | Noa | 3 | Ayuda a Noa |
| [App.tsx:1004](../../src/App.tsx#L1004) | Noa | 3 | ¿Cómo se juega? |
| [App.tsx:1005](../../src/App.tsx#L1005) | Noa | 6 | ¡Camina, salta y busca caminos secretos! |
| [App.tsx:1007](../../src/App.tsx#L1007) | Noa | 1 | Camina |
| [App.tsx:1007](../../src/App.tsx#L1007) | Noa | 4 | Mantén pulsada una flecha. |
| [App.tsx:1008](../../src/App.tsx#L1008) | Noa | 4 | Haz un doble salto |
| [App.tsx:1008](../../src/App.tsx#L1008) | Noa | 1 | Toca |
| [App.tsx:1008](../../src/App.tsx#L1008) | Noa | 1 | SALTAR |
| [App.tsx:1009](../../src/App.tsx#L1009) | Noa | 3 | Abre las cajas |
| [App.tsx:1009](../../src/App.tsx#L1009) | Noa | 7 | Salta y golpea la caja por debajo. |
| [App.tsx:1011](../../src/App.tsx#L1011) | Noa | 2 | En móvil: |
| [App.tsx:1011](../../src/App.tsx#L1011) | Noa | 1 | SALTAR |
| [App.tsx:1013](../../src/App.tsx#L1013) | Noa | 3 | Bola de lana |
| [App.tsx:1013](../../src/App.tsx#L1013) | Noa | 7 | Cuando Noa tenga orejas de gato, toca |
| [App.tsx:1013](../../src/App.tsx#L1013) | Noa | 1 | LANA |
| [App.tsx:1014](../../src/App.tsx#L1014) | Noa | 2 | Manzana escudo |
| [App.tsx:1014](../../src/App.tsx#L1014) | Noa | 8 | La manzana salva a Noa de un golpe. |
| [App.tsx:1015](../../src/App.tsx#L1015) | Noa | 2 | Juego final |
| [App.tsx:1015](../../src/App.tsx#L1015) | Noa | 13 | Cada guardián propone un juego sencillo. Mira su explicación y completa tres rondas. |
| [App.tsx:1016](../../src/App.tsx#L1016) | Noa | 2 | Mira arriba |
| [App.tsx:1016](../../src/App.tsx#L1016) | Noa | 7 | Las pegatinas se esconden en caminos altos. |
| [App.tsx:1018](../../src/App.tsx#L1018) | Adultos | 54 | Con teclado: A/D o flechas para caminar, espacio para saltar y X/K para lanzar lana. Con mando, usa la cruceta o palanca, A para saltar o elegir y B para volver. En el agua, SALTAR da una brazada hacia arriba; al soltarlo, Noa baja despacito y puede caminar por la arena. ¡Los erizos pinchan! |
| [App.tsx:1019](../../src/App.tsx#L1019) | Noa | 3 | ¡Lista para jugar! |

### Colección

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [App.tsx:1037](../../src/App.tsx#L1037) | Oculto | 1 | Cerrar |
| [App.tsx:1038](../../src/App.tsx#L1038) | Noa | 3 | Colección de Noa |
| [App.tsx:1038](../../src/App.tsx#L1038) | Noa | 3 | Álbum de pegatinas |
| [App.tsx:1038](../../src/App.tsx#L1038) | Noa | 2 | Jefes amigos |
| [App.tsx:1038](../../src/App.tsx#L1038) | Noa | 1 | Amigos |
| [App.tsx:1038](../../src/App.tsx#L1038) | Noa | 3 | Postales de viaje |
| [App.tsx:1039](../../src/App.tsx#L1039) | Oculto | 2 | Ver colección |
| [App.tsx:1040](../../src/App.tsx#L1040) | Noa | 1 | Pegatinas |
| [App.tsx:1041](../../src/App.tsx#L1041) | Noa | 2 | Jefes amigos |
| [App.tsx:1042](../../src/App.tsx#L1042) | Noa | 1 | Amigos |
| [App.tsx:1043](../../src/App.tsx#L1043) | Noa | 1 | Recuerdos |
| [App.tsx:1046](../../src/App.tsx#L1046) | Noa | 12 | Hay una pegatina por pantalla y tres insignias en el reino secreto. |
| [App.tsx:1046](../../src/App.tsx#L1046) | Noa | 11 | Hay una pegatina escondida en la ruta elevada de cada pantalla. |
| [App.tsx:1057](../../src/App.tsx#L1057) | Noa | 2 | Mundo {…} |
| [App.tsx:1058](../../src/App.tsx#L1058) | Noa | 2 | Pantalla {…} |
| [App.tsx:1058](../../src/App.tsx#L1058) | Noa | 1 | ¡Encontrada! |
| [App.tsx:1058](../../src/App.tsx#L1058) | Noa | 2 | Pegatina pendiente |
| [App.tsx:1059](../../src/App.tsx#L1059) | Noa | 2 | Ocultar pista |
| [App.tsx:1059](../../src/App.tsx#L1059) | Noa | 2 | Mostrar pista |
| [App.tsx:1060](../../src/App.tsx#L1060) | Noa | 7 | Abre esta pantalla para ver su pista. |
| [App.tsx:1067](../../src/App.tsx#L1067) | Noa | 15 | Completa el juego de cada guardián para hacerte su amiga. Después podréis jugar otra vez. |
| [App.tsx:1074](../../src/App.tsx#L1074) | Noa | 2 | Mundo secreto |
| [App.tsx:1074](../../src/App.tsx#L1074) | Noa | 2 | Mundo misterioso |
| [App.tsx:1074](../../src/App.tsx#L1074) | Noa | 3 | Mundo del agua |
| [App.tsx:1074](../../src/App.tsx#L1074) | Noa | 2 | Mundo {…} |
| [App.tsx:1081](../../src/App.tsx#L1081) | Noa | 3 | Amigo por descubrir |
| [App.tsx:1082](../../src/App.tsx#L1082) | Noa | 3 | ★ Marco especial conseguido |
| [App.tsx:1082](../../src/App.tsx#L1082) | Noa | 2 | ★ Reto pendiente: |
| [App.tsx:1082](../../src/App.tsx#L1082) | Noa | 3 | Jugar otra vez |
| [App.tsx:1082](../../src/App.tsx#L1082) | Noa | 5 | Completa su juego para conocerlo. |
| [App.tsx:1089](../../src/App.tsx#L1089) | Noa | 17 | Termina todas las pantallas de un mundo para guardar una postal con el gatito que conociste allí. |
| [App.tsx:1097](../../src/App.tsx#L1097) | Noa | 2 | Mundo secreto |
| [App.tsx:1097](../../src/App.tsx#L1097) | Noa | 3 | Mundo del agua |
| [App.tsx:1097](../../src/App.tsx#L1097) | Noa | 2 | Mundo {…} |
| [App.tsx:1098](../../src/App.tsx#L1098) | Noa | 3 | Postal por descubrir |
| [App.tsx:1106](../../src/App.tsx#L1106) | Noa | 2 | Seguir explorando |

### Colección: pegatinas

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [stickers.ts:12](../../src/game/stickers.ts#L12) | Noa | 2 | Manzana feliz |
| [stickers.ts:12](../../src/game/stickers.ts#L12) | Noa | 5 | Busca sobre las ramas altas. |
| [stickers.ts:13](../../src/game/stickers.ts#L13) | Noa | 3 | Abeja del prado |
| [stickers.ts:13](../../src/game/stickers.ts#L13) | Noa | 5 | Sube hacia el cielo naranja. |
| [stickers.ts:14](../../src/game/stickers.ts#L14) | Noa | 4 | Rey de las raíces |
| [stickers.ts:14](../../src/game/stickers.ts#L14) | Noa | 6 | Explora el camino hacia la fortaleza. |
| [stickers.ts:15](../../src/game/stickers.ts#L15) | Noa | 2 | Huella brillante |
| [stickers.ts:15](../../src/game/stickers.ts#L15) | Noa | 6 | Confía en una plataforma de niebla. |
| [stickers.ts:16](../../src/game/stickers.ts#L16) | Noa | 2 | Luna violeta |
| [stickers.ts:16](../../src/game/stickers.ts#L16) | Noa | 6 | Mira por encima del sendero nocturno. |
| [stickers.ts:17](../../src/game/stickers.ts#L17) | Noa | 2 | Bigotes mágicos |
| [stickers.ts:17](../../src/game/stickers.ts#L17) | Noa | 6 | La niebla esconde un camino elevado. |
| [stickers.ts:18](../../src/game/stickers.ts#L18) | Noa | 3 | Concha de Perla |
| [stickers.ts:18](../../src/game/stickers.ts#L18) | Noa | 8 | Sumérgete bajo la última isla de la laguna. |
| [stickers.ts:19](../../src/game/stickers.ts#L19) | Noa | 2 | Pez aventurero |
| [stickers.ts:19](../../src/game/stickers.ts#L19) | Noa | 9 | Busca por debajo de la segunda pared del arrecife. |
| [stickers.ts:20](../../src/game/stickers.ts#L20) | Noa | 4 | Corona de las mareas |
| [stickers.ts:20](../../src/game/stickers.ts#L20) | Noa | 8 | Nada bajo el último arco antes del palacio. |
| [stickers.ts:21](../../src/game/stickers.ts#L21) | Noa | 2 | Pino valiente |
| [stickers.ts:21](../../src/game/stickers.ts#L21) | Noa | 12 | Pasa cuando el lobo tenga ZZZ y sube a la rama alta. |
| [stickers.ts:22](../../src/game/stickers.ts#L22) | Noa | 2 | Lobo amigo |
| [stickers.ts:22](../../src/game/stickers.ts#L22) | Noa | 12 | Espera a que el lobo duerma y busca sobre las ramas altas. |
| [stickers.ts:23](../../src/game/stickers.ts#L23) | Noa | 3 | Corona del bosque |
| [stickers.ts:23](../../src/game/stickers.ts#L23) | Noa | 9 | Está en la ruta más alta de la guarida. |
| [stickers.ts:24](../../src/game/stickers.ts#L24) | Noa | 2 | Bellota dorada |
| [stickers.ts:24](../../src/game/stickers.ts#L24) | Noa | 6 | Busca entre las primeras copas altas. |
| [stickers.ts:25](../../src/game/stickers.ts#L25) | Noa | 2 | Colmillo valiente |
| [stickers.ts:25](../../src/game/stickers.ts#L25) | Noa | 8 | Cruza el gran vacío sin bajar al suelo. |
| [stickers.ts:26](../../src/game/stickers.ts#L26) | Noa | 4 | Rey de las bellotas |
| [stickers.ts:26](../../src/game/stickers.ts#L26) | Noa | 9 | Está antes del último duelo, casi en las nubes. |
| [stickers.ts:27](../../src/game/stickers.ts#L27) | Noa | 2 | Timón sonriente |
| [stickers.ts:27](../../src/game/stickers.ts#L27) | Noa | 9 | Busca en la plataforma más alta entre los barcos. |
| [stickers.ts:28](../../src/game/stickers.ts#L28) | Noa | 2 | Loro aventurero |
| [stickers.ts:28](../../src/game/stickers.ts#L28) | Noa | 9 | Sigue a los loros por encima de las velas. |
| [stickers.ts:29](../../src/game/stickers.ts#L29) | Noa | 3 | Tesoro del cielo |
| [stickers.ts:29](../../src/game/stickers.ts#L29) | Noa | 8 | Está entre los últimos cañones, antes del capitán. |
| [stickers.ts:30](../../src/game/stickers.ts#L30) | Noa | 3 | Llave de plata |
| [stickers.ts:30](../../src/game/stickers.ts#L30) | Noa | 7 | Busca entre las almenas del primer pasillo. |
| [stickers.ts:31](../../src/game/stickers.ts#L31) | Noa | 2 | Fantasma amigo |
| [stickers.ts:31](../../src/game/stickers.ts#L31) | Noa | 6 | Sigue los destellos por el laberinto. |
| [stickers.ts:32](../../src/game/stickers.ts#L32) | Noa | 2 | Corona nocturna |
| [stickers.ts:32](../../src/game/stickers.ts#L32) | Noa | 7 | Está cerca de la sala del conde. |
| [stickers.ts:33](../../src/game/stickers.ts#L33) | Noa | 2 | Huella fósil |
| [stickers.ts:33](../../src/game/stickers.ts#L33) | Noa | 8 | Busca sobre el primer risco de la isla. |
| [stickers.ts:34](../../src/game/stickers.ts#L34) | Noa | 2 | Ala tropical |
| [stickers.ts:34](../../src/game/stickers.ts#L34) | Noa | 8 | Sigue a los terodáctilos por las repisas altas. |
| [stickers.ts:35](../../src/game/stickers.ts#L35) | Noa | 3 | Corona de Tricera |
| [stickers.ts:35](../../src/game/stickers.ts#L35) | Noa | 7 | Está cerca del nido de la guardiana. |
| [stickers.ts:36](../../src/game/stickers.ts#L36) | Noa | 3 | Cristal de rubí |
| [stickers.ts:36](../../src/game/stickers.ts#L36) | Noa | 8 | Brilla sobre una roca de la primera ladera. |
| [stickers.ts:37](../../src/game/stickers.ts#L37) | Noa | 3 | Ala de dragón |
| [stickers.ts:37](../../src/game/stickers.ts#L37) | Noa | 9 | Busca en lo alto de la cueva de cristales. |
| [stickers.ts:38](../../src/game/stickers.ts#L38) | Noa | 3 | Corona de Rubí |
| [stickers.ts:38](../../src/game/stickers.ts#L38) | Noa | 6 | Está cerca del corazón del volcán. |
| [stickers.ts:39](../../src/game/stickers.ts#L39) | Noa | 2 | Gota gigante |
| [stickers.ts:39](../../src/game/stickers.ts#L39) | Noa | 10 | Cruza la primera flor abierta y sube por las hojas. |
| [stickers.ts:40](../../src/game/stickers.ts#L40) | Noa | 2 | Mariquita feliz |
| [stickers.ts:40](../../src/game/stickers.ts#L40) | Noa | 8 | Rebota en el rocío para llegar muy alto. |
| [stickers.ts:41](../../src/game/stickers.ts#L41) | Noa | 3 | Corona de Melisa |
| [stickers.ts:41](../../src/game/stickers.ts#L41) | Noa | 6 | Está antes de la gran colmena. |
| [stickers.ts:42](../../src/game/stickers.ts#L42) | Noa | 2 | Copo brillante |
| [stickers.ts:42](../../src/game/stickers.ts#L42) | Noa | 7 | Busca sobre el primer bloque de hielo. |
| [stickers.ts:43](../../src/game/stickers.ts#L43) | Noa | 2 | Bufanda pingüina |
| [stickers.ts:43](../../src/game/stickers.ts#L43) | Noa | 6 | Deslízate por la cueva hasta encontrarla. |
| [stickers.ts:44](../../src/game/stickers.ts#L44) | Noa | 3 | Corona de aurora |
| [stickers.ts:44](../../src/game/stickers.ts#L44) | Noa | 6 | Brilla cerca de la cima nevada. |
| [stickers.ts:45](../../src/game/stickers.ts#L45) | Noa | 3 | Campana de nieve |
| [stickers.ts:45](../../src/game/stickers.ts#L45) | Noa | 7 | Sube a los troncos del segundo camino. |
| [stickers.ts:46](../../src/game/stickers.ts#L46) | Noa | 3 | Muñeco de juguete |
| [stickers.ts:46](../../src/game/stickers.ts#L46) | Noa | 6 | Sube al estante alto del taller. |
| [stickers.ts:47](../../src/game/stickers.ts#L47) | Noa | 3 | Estrella del regalo |
| [stickers.ts:47](../../src/game/stickers.ts#L47) | Noa | 7 | Usa el regalo saltarín y mira arriba. |
| [stickers.ts:48](../../src/game/stickers.ts#L48) | Noa | 2 | Oasis brillante |
| [stickers.ts:48](../../src/game/stickers.ts#L48) | Noa | 7 | Sube con el primer géiser de arena. |
| [stickers.ts:49](../../src/game/stickers.ts#L49) | Noa | 2 | Escarabajo dorado |
| [stickers.ts:49](../../src/game/stickers.ts#L49) | Noa | 8 | Busca sobre el arco más alto del oasis. |
| [stickers.ts:50](../../src/game/stickers.ts#L50) | Noa | 3 | Sol de Siroco |
| [stickers.ts:50](../../src/game/stickers.ts#L50) | Noa | 7 | Cruza los remolinos antes de las ruinas. |
| [stickers.ts:51](../../src/game/stickers.ts#L51) | Noa | 2 | Billete rojo |
| [stickers.ts:51](../../src/game/stickers.ts#L51) | Noa | 7 | Salta sobre el primer vagón en marcha. |
| [stickers.ts:52](../../src/game/stickers.ts#L52) | Noa | 2 | Campana dorada |
| [stickers.ts:52](../../src/game/stickers.ts#L52) | Noa | 8 | Espera al vapor y sube al techo alto. |
| [stickers.ts:53](../../src/game/stickers.ts#L53) | Noa | 2 | Locomotora feliz |
| [stickers.ts:53](../../src/game/stickers.ts#L53) | Noa | 5 | Busca encima del último vagón. |
| [stickers.ts:54](../../src/game/stickers.ts#L54) | Noa | 2 | Tambor sonriente |
| [stickers.ts:54](../../src/game/stickers.ts#L54) | Noa | 8 | Sigue la primera onda hasta la plataforma alta. |
| [stickers.ts:55](../../src/game/stickers.ts#L55) | Noa | 2 | Campana dorada |
| [stickers.ts:55](../../src/game/stickers.ts#L55) | Noa | 9 | Cambia de lado con la onda entre las campanas. |
| [stickers.ts:56](../../src/game/stickers.ts#L56) | Noa | 3 | Clave de Armonía |
| [stickers.ts:56](../../src/game/stickers.ts#L56) | Noa | 9 | Está sobre el último escenario antes de la maestra. |
| [stickers.ts:57](../../src/game/stickers.ts#L57) | Noa | 3 | Pluma de nube |
| [stickers.ts:57](../../src/game/stickers.ts#L57) | Noa | 7 | Sigue subiendo por las nubes del amanecer. |
| [stickers.ts:58](../../src/game/stickers.ts#L58) | Noa | 3 | Puerta de luna |
| [stickers.ts:58](../../src/game/stickers.ts#L58) | Noa | 8 | Mira en la mitad de la escalera celeste. |
| [stickers.ts:59](../../src/game/stickers.ts#L59) | Noa | 3 | Corona de Aurora |
| [stickers.ts:59](../../src/game/stickers.ts#L59) | Noa | 8 | Brilla antes de la puerta de las estrellas. |
| [stickers.ts:60](../../src/game/stickers.ts#L60) | Noa | 2 | Pluma celeste |
| [stickers.ts:60](../../src/game/stickers.ts#L60) | Noa | 15 | Sube con la primera columna de aire y salta a la nube de la derecha. |
| [stickers.ts:61](../../src/game/stickers.ts#L61) | Noa | 2 | Herradura arcoíris |
| [stickers.ts:61](../../src/game/stickers.ts#L61) | Noa | 13 | La segunda columna de aire te ayuda a subir a la nube alta. |
| [stickers.ts:62](../../src/game/stickers.ts#L62) | Noa | 2 | Estrella secreta |
| [stickers.ts:62](../../src/game/stickers.ts#L62) | Noa | 12 | Sube con la última columna de aire hasta la nube más alta. |

### Colección: amigos

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [FriendsTab.tsx:74](../../src/game/FriendsTab.tsx#L74) | Noa | 3 | Visita a {…} |
| [FriendsTab.tsx:82](../../src/game/FriendsTab.tsx#L82) | Noa | 2 | ¡Mejor amigo! |
| [FriendsTab.tsx:85](../../src/game/FriendsTab.tsx#L85) | Noa | 2 | ¡Le encanta! ♥ |
| [FriendsTab.tsx:85](../../src/game/FriendsTab.tsx#L85) | Noa | 1 | Acariciar |
| [FriendsTab.tsx:88](../../src/game/FriendsTab.tsx#L88) | Noa | 6 | ¡Su comida favorita! Baila de alegría. |
| [FriendsTab.tsx:88](../../src/game/FriendsTab.tsx#L88) | Noa | 1 | ¡Ñam! |
| [FriendsTab.tsx:93](../../src/game/FriendsTab.tsx#L93) | Noa | 1 | ¿Muerde? |
| [FriendsTab.tsx:96](../../src/game/FriendsTab.tsx#L96) | Noa | 4 | Volver a los amigos |
| [FriendsTab.tsx:104](../../src/game/FriendsTab.tsx#L104) | Noa | 19 | Saluda a los animales en el paseo de los amigos y luego visítalos aquí: acarícialos y dales de comer. |
| [FriendsTab.tsx:113](../../src/game/FriendsTab.tsx#L113) | Noa | 2 | Nuevo amigo |
| [FriendsTab.tsx:116](../../src/game/FriendsTab.tsx#L116) | Oculto | 3 | Amigo por descubrir |
| [FriendsTab.tsx:118](../../src/game/FriendsTab.tsx#L118) | Noa | 2 | ¿Quién será? |
| [FriendsTab.tsx:118](../../src/game/FriendsTab.tsx#L118) | Noa | 2 | Mundo {…} |
| [friends.ts:10](../../src/game/friends.ts#L10) | Noa | 2 | Babosa saltarina |
| [friends.ts:10](../../src/game/friends.ts#L10) | Noa | 5 | No muerde: ¡solo hace cosquillas! |
| [friends.ts:10](../../src/game/friends.ts#L10) | Noa | 7 | En su mundo pasea: ¡salta por encima! |
| [friends.ts:11](../../src/game/friends.ts#L11) | Noa | 2 | Escarabajo brillante |
| [friends.ts:11](../../src/game/friends.ts#L11) | Noa | 6 | No muerde, pero empuja un poco. |
| [friends.ts:11](../../src/game/friends.ts#L11) | Noa | 8 | Camina de lado a lado: espera y salta. |
| [friends.ts:12](../../src/game/friends.ts#L12) | Noa | 2 | Nube viajera |
| [friends.ts:12](../../src/game/friends.ts#L12) | Noa | 5 | No muerde: ¡es de algodón! |
| [friends.ts:12](../../src/game/friends.ts#L12) | Noa | 5 | Flota alta: pasa por debajo. |
| [friends.ts:13](../../src/game/friends.ts#L13) | Noa | 2 | Murciélago dormilón |
| [friends.ts:13](../../src/game/friends.ts#L13) | Noa | 5 | No muerde: ¡le da vergüenza! |
| [friends.ts:13](../../src/game/friends.ts#L13) | Noa | 7 | Vuela en la cueva: agáchate y pasa. |
| [friends.ts:14](../../src/game/friends.ts#L14) | Noa | 2 | Lobo dormilón |
| [friends.ts:14](../../src/game/friends.ts#L14) | Noa | 6 | Dormido no muerde. ¡Mira los ZZZ! |
| [friends.ts:14](../../src/game/friends.ts#L14) | Noa | 3 | Pasa mientras duerme. |
| [friends.ts:15](../../src/game/friends.ts#L15) | Noa | 3 | Pececito de coral |
| [friends.ts:15](../../src/game/friends.ts#L15) | Noa | 5 | No muerde: ¡solo hace burbujas! |
| [friends.ts:15](../../src/game/friends.ts#L15) | Noa | 5 | Nada en la laguna: rodéalo. |
| [friends.ts:16](../../src/game/friends.ts#L16) | Noa | 3 | Erizo de mar |
| [friends.ts:16](../../src/game/friends.ts#L16) | Noa | 4 | No muerde, pero pincha. |
| [friends.ts:16](../../src/game/friends.ts#L16) | Noa | 6 | No lo toques: nada por encima. |
| [friends.ts:17](../../src/game/friends.ts#L17) | Noa | 2 | Jabalí glotón |
| [friends.ts:17](../../src/game/friends.ts#L17) | Noa | 5 | No muerde: ¡solo quiere bellotas! |
| [friends.ts:17](../../src/game/friends.ts#L17) | Noa | 8 | Corre si te ve: salta a las copas. |
| [friends.ts:18](../../src/game/friends.ts#L18) | Noa | 4 | Pajarito de las copas |
| [friends.ts:18](../../src/game/friends.ts#L18) | Noa | 5 | No muerde: ¡canta muy bonito! |
| [friends.ts:18](../../src/game/friends.ts#L18) | Noa | 5 | Vuela entre las ramas: espera. |
| [friends.ts:19](../../src/game/friends.ts#L19) | Noa | 2 | Pirata simpático |
| [friends.ts:19](../../src/game/friends.ts#L19) | Noa | 6 | No muerde: ¡es un pirata bueno! |
| [friends.ts:19](../../src/game/friends.ts#L19) | Noa | 6 | Patrulla el barco: salta sobre él. |
| [friends.ts:20](../../src/game/friends.ts#L20) | Noa | 2 | Loro charlatán |
| [friends.ts:20](../../src/game/friends.ts#L20) | Noa | 5 | No muerde: ¡solo habla mucho! |
| [friends.ts:20](../../src/game/friends.ts#L20) | Noa | 5 | Cruza volando: pasa por debajo. |
| [friends.ts:21](../../src/game/friends.ts#L21) | Noa | 2 | Esqueleto bailarín |
| [friends.ts:21](../../src/game/friends.ts#L21) | Noa | 5 | No muerde: ¡no tiene dientes! |
| [friends.ts:21](../../src/game/friends.ts#L21) | Noa | 5 | Camina despacio: salta sobre él. |
| [friends.ts:22](../../src/game/friends.ts#L22) | Noa | 2 | Fantasma tímido |
| [friends.ts:22](../../src/game/friends.ts#L22) | Noa | 5 | No muerde: ¡solo dice buuu! |
| [friends.ts:22](../../src/game/friends.ts#L22) | Noa | 5 | Flota: pasa cuando se aleje. |
| [friends.ts:23](../../src/game/friends.ts#L23) | Noa | 2 | Zombi dormilón |
| [friends.ts:23](../../src/game/friends.ts#L23) | Noa | 4 | No muerde: ¡quiere abrazos! |
| [friends.ts:23](../../src/game/friends.ts#L23) | Noa | 4 | Es lento: adelántalo saltando. |
| [friends.ts:24](../../src/game/friends.ts#L24) | Noa | 2 | Pequeño t-rex |
| [friends.ts:24](../../src/game/friends.ts#L24) | Noa | 5 | No muerde: ¡tiene bracitos cortos! |
| [friends.ts:24](../../src/game/friends.ts#L24) | Noa | 4 | Corretea: salta sobre él. |
| [friends.ts:25](../../src/game/friends.ts#L25) | Noa | 1 | Terodáctilo |
| [friends.ts:25](../../src/game/friends.ts#L25) | Noa | 5 | No muerde: ¡vuela muy alto! |
| [friends.ts:25](../../src/game/friends.ts#L25) | Noa | 5 | Planea: espera a que pase. |
| [friends.ts:26](../../src/game/friends.ts#L26) | Noa | 1 | Dragoncito |
| [friends.ts:26](../../src/game/friends.ts#L26) | Noa | 4 | No muerde: ¡echa humito! |
| [friends.ts:26](../../src/game/friends.ts#L26) | Noa | 4 | Pasea: salta sobre él. |
| [friends.ts:27](../../src/game/friends.ts#L27) | Noa | 3 | Salamandra de fuego |
| [friends.ts:27](../../src/game/friends.ts#L27) | Noa | 5 | No muerde, pero está calentita. |
| [friends.ts:27](../../src/game/friends.ts#L27) | Noa | 5 | Corre por el suelo: salta. |
| [friends.ts:28](../../src/game/friends.ts#L28) | Noa | 2 | Dragón volador |
| [friends.ts:28](../../src/game/friends.ts#L28) | Noa | 5 | No muerde: ¡le gusta volar! |
| [friends.ts:28](../../src/game/friends.ts#L28) | Noa | 5 | Vuela alto: pasa por debajo. |
| [friends.ts:29](../../src/game/friends.ts#L29) | Noa | 2 | Hormiga gigante |
| [friends.ts:29](../../src/game/friends.ts#L29) | Noa | 4 | No muerde: ¡lleva hojas! |
| [friends.ts:29](../../src/game/friends.ts#L29) | Noa | 3 | Camina despacio: salta. |
| [friends.ts:30](../../src/game/friends.ts#L30) | Noa | 2 | Caracol gigante |
| [friends.ts:30](../../src/game/friends.ts#L30) | Noa | 4 | No muerde: ¡va despacito! |
| [friends.ts:30](../../src/game/friends.ts#L30) | Noa | 3 | Es lentísimo: adelántalo. |
| [friends.ts:31](../../src/game/friends.ts#L31) | Noa | 2 | Abeja gigante |
| [friends.ts:31](../../src/game/friends.ts#L31) | Noa | 4 | No pica: ¡hace miel! |
| [friends.ts:31](../../src/game/friends.ts#L31) | Noa | 5 | Zumba en el aire: espera. |
| [friends.ts:32](../../src/game/friends.ts#L32) | Noa | 2 | Pingüino deslizón |
| [friends.ts:32](../../src/game/friends.ts#L32) | Noa | 4 | No muerde: ¡se desliza! |
| [friends.ts:32](../../src/game/friends.ts#L32) | Noa | 5 | Resbala por el hielo: salta. |
| [friends.ts:33](../../src/game/friends.ts#L33) | Noa | 3 | Zorro de nieve |
| [friends.ts:33](../../src/game/friends.ts#L33) | Noa | 5 | No muerde: ¡tiene cola calentita! |
| [friends.ts:33](../../src/game/friends.ts#L33) | Noa | 4 | Corretea: salta sobre él. |
| [friends.ts:34](../../src/game/friends.ts#L34) | Noa | 2 | Búho nival |
| [friends.ts:34](../../src/game/friends.ts#L34) | Noa | 5 | No muerde: ¡ve de noche! |
| [friends.ts:34](../../src/game/friends.ts#L34) | Noa | 3 | Vuela bajito: espera. |
| [friends.ts:35](../../src/game/friends.ts#L35) | Noa | 3 | Explorador de nieve |
| [friends.ts:35](../../src/game/friends.ts#L35) | Noa | 4 | No muerde: ¡hace muñecos! |
| [friends.ts:35](../../src/game/friends.ts#L35) | Noa | 4 | Pasea: salta sobre él. |
| [friends.ts:36](../../src/game/friends.ts#L36) | Noa | 3 | Reno de juguete |
| [friends.ts:36](../../src/game/friends.ts#L36) | Noa | 5 | No muerde: ¡tira del trineo! |
| [friends.ts:36](../../src/game/friends.ts#L36) | Noa | 4 | Trota: salta a tiempo. |
| [friends.ts:37](../../src/game/friends.ts#L37) | Noa | 1 | Petirrojo |
| [friends.ts:37](../../src/game/friends.ts#L37) | Noa | 4 | No muerde: ¡canta villancicos! |
| [friends.ts:37](../../src/game/friends.ts#L37) | Noa | 4 | Vuela: pasa por debajo. |
| [friends.ts:38](../../src/game/friends.ts#L38) | Noa | 3 | Pájaro de juguete |
| [friends.ts:38](../../src/game/friends.ts#L38) | Noa | 4 | No muerde: ¡tiene cuerda! |
| [friends.ts:38](../../src/game/friends.ts#L38) | Noa | 5 | Vuela en la fábrica: espera. |
| [friends.ts:39](../../src/game/friends.ts#L39) | Noa | 2 | Duende juguetero |
| [friends.ts:39](../../src/game/friends.ts#L39) | Noa | 4 | No muerde: ¡envuelve regalos! |
| [friends.ts:39](../../src/game/friends.ts#L39) | Noa | 4 | Corretea: salta sobre él. |
| [friends.ts:40](../../src/game/friends.ts#L40) | Noa | 3 | Robot de juguete |
| [friends.ts:40](../../src/game/friends.ts#L40) | Noa | 5 | No muerde: ¡hace bip, bip! |
| [friends.ts:40](../../src/game/friends.ts#L40) | Noa | 3 | Camina recto: salta. |
| [friends.ts:41](../../src/game/friends.ts#L41) | Noa | 3 | Caja de regalo |
| [friends.ts:41](../../src/game/friends.ts#L41) | Noa | 4 | No muerde: ¡tiene sorpresa! |
| [friends.ts:41](../../src/game/friends.ts#L41) | Noa | 3 | Da saltitos: espera. |
| [friends.ts:42](../../src/game/friends.ts#L42) | Noa | 2 | Farolillo estrella |
| [friends.ts:42](../../src/game/friends.ts#L42) | Noa | 4 | No muerde: ¡da luz! |
| [friends.ts:42](../../src/game/friends.ts#L42) | Noa | 4 | Flota: pasa por debajo. |
| [friends.ts:43](../../src/game/friends.ts#L43) | Noa | 4 | Gnomo de los regalos |
| [friends.ts:43](../../src/game/friends.ts#L43) | Noa | 4 | No muerde: ¡guarda regalos! |
| [friends.ts:43](../../src/game/friends.ts#L43) | Noa | 4 | Pasea: salta sobre él. |
| [friends.ts:44](../../src/game/friends.ts#L44) | Noa | 3 | Escarabajo del desierto |
| [friends.ts:44](../../src/game/friends.ts#L44) | Noa | 4 | No muerde: ¡rueda arena! |
| [friends.ts:44](../../src/game/friends.ts#L44) | Noa | 4 | Camina: salta sobre él. |
| [friends.ts:45](../../src/game/friends.ts#L45) | Noa | 2 | Fénec orejudo |
| [friends.ts:45](../../src/game/friends.ts#L45) | Noa | 5 | No muerde: ¡lo oye todo! |
| [friends.ts:45](../../src/game/friends.ts#L45) | Noa | 5 | Corre rápido: espera y salta. |
| [friends.ts:46](../../src/game/friends.ts#L46) | Noa | 2 | Planta rodadora |
| [friends.ts:46](../../src/game/friends.ts#L46) | Noa | 6 | No muerde: ¡rueda con el viento! |
| [friends.ts:46](../../src/game/friends.ts#L46) | Noa | 4 | Rueda: salta cuando llegue. |
| [friends.ts:47](../../src/game/friends.ts#L47) | Noa | 3 | Maleta con ruedas |
| [friends.ts:47](../../src/game/friends.ts#L47) | Noa | 4 | No muerde: ¡lleva calcetines! |
| [friends.ts:47](../../src/game/friends.ts#L47) | Noa | 5 | Rueda por el andén: salta. |
| [friends.ts:48](../../src/game/friends.ts#L48) | Noa | 2 | Paloma revisora |
| [friends.ts:48](../../src/game/friends.ts#L48) | Noa | 5 | No muerde: ¡pide los billetes! |
| [friends.ts:48](../../src/game/friends.ts#L48) | Noa | 4 | Vuela: pasa por debajo. |
| [friends.ts:49](../../src/game/friends.ts#L49) | Noa | 3 | Ratón de cuerda |
| [friends.ts:49](../../src/game/friends.ts#L49) | Noa | 4 | No muerde: ¡tiene cuerda! |
| [friends.ts:49](../../src/game/friends.ts#L49) | Noa | 5 | Corre recto: salta sobre él. |
| [friends.ts:50](../../src/game/friends.ts#L50) | Noa | 2 | Tambor andarín |
| [friends.ts:50](../../src/game/friends.ts#L50) | Noa | 5 | No muerde: ¡hace pom, pom! |
| [friends.ts:50](../../src/game/friends.ts#L50) | Noa | 4 | Camina al compás: salta. |
| [friends.ts:51](../../src/game/friends.ts#L51) | Noa | 2 | Pájaro nota |
| [friends.ts:51](../../src/game/friends.ts#L51) | Noa | 4 | No muerde: ¡canta notas! |
| [friends.ts:51](../../src/game/friends.ts#L51) | Noa | 4 | Vuela: espera y pasa. |
| [friends.ts:52](../../src/game/friends.ts#L52) | Noa | 2 | Ratón violinista |
| [friends.ts:52](../../src/game/friends.ts#L52) | Noa | 5 | No muerde: ¡toca el violín! |
| [friends.ts:52](../../src/game/friends.ts#L52) | Noa | 4 | Pasea: salta sobre él. |
| [friends.ts:53](../../src/game/friends.ts#L53) | Noa | 1 | Nubecita |
| [friends.ts:53](../../src/game/friends.ts#L53) | Noa | 5 | No muerde: ¡es muy suave! |
| [friends.ts:53](../../src/game/friends.ts#L53) | Noa | 5 | Flota: pasa por un lado. |
| [friends.ts:54](../../src/game/friends.ts#L54) | Noa | 3 | Unicornio del cielo |
| [friends.ts:54](../../src/game/friends.ts#L54) | Noa | 4 | No muerde: ¡tiene arcoíris! |
| [friends.ts:54](../../src/game/friends.ts#L54) | Noa | 5 | Galopa en las nubes: espera. |
| [friends.ts:57](../../src/game/friends.ts#L57) | Noa | 1 | Manzana |
| [friends.ts:57](../../src/game/friends.ts#L57) | Noa | 1 | Bellota |
| [friends.ts:57](../../src/game/friends.ts#L57) | Noa | 1 | Flor |

### Tienda secreta

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [SecretShop.tsx:28](../../src/game/SecretShop.tsx#L28) | Noa | 3 | ¡Para las orejas! |
| [SecretShop.tsx:28](../../src/game/SecretShop.tsx#L28) | Noa | 3 | ¡Para la carita! |
| [SecretShop.tsx:28](../../src/game/SecretShop.tsx#L28) | Noa | 3 | ¡Para las patitas! |
| [SecretShop.tsx:129](../../src/game/SecretShop.tsx#L129) | Noa | 5 | El rincón de los gatitos |
| [SecretShop.tsx:130](../../src/game/SecretShop.tsx#L130) | Noa | 7 | ¡Junta las tres partes del mismo gatito! |
| [SecretShop.tsx:133](../../src/game/SecretShop.tsx#L133) | Oculto | 3 | Retrato del gatito |
| [SecretShop.tsx:173](../../src/game/SecretShop.tsx#L173) | Noa | 6 | ¡{…} segundos de estrellas al salir! |
| [SecretShop.tsx:173](../../src/game/SecretShop.tsx#L173) | Noa | 4 | ¡Qué gatito tan divertido! |
| [SecretShop.tsx:174](../../src/game/SecretShop.tsx#L174) | Noa | 3 | Descansamos un poquito. |
| [SecretShop.tsx:184](../../src/game/SecretShop.tsx#L184) | Noa | 1 | ¡Parar! |
| [SecretShop.tsx:184](../../src/game/SecretShop.tsx#L184) | Noa | 4 | Volver a jugar fuera |
| [SecretShop.tsx:186](../../src/game/SecretShop.tsx#L186) | Noa | 1 | Seguir |
| [SecretShop.tsx:186](../../src/game/SecretShop.tsx#L186) | Noa | 1 | Pausa |
| [SecretShop.tsx:189](../../src/game/SecretShop.tsx#L189) | Noa | 8 | 3 iguales: ★ 12 s · 2 iguales: ★ 5 s |
| [SecretShop.tsx:190](../../src/game/SecretShop.tsx#L190) | Noa | 10 | El dibujo no ha llegado. ¡Jugamos con gatitos de colores! |
| [secretShopProgress.ts:37](../../src/game/secretShopProgress.ts#L37) | Noa | 4 | Tienda secreta: reto conseguido |
| [secretShopProgress.ts:37](../../src/game/secretShopProgress.ts#L37) | Noa | 3 | Tienda secreta: visitada |
| [secretShopProgress.ts:37](../../src/game/secretShopProgress.ts#L37) | Noa | 4 | Tienda secreta: por descubrir |

### Duelos: guardianes

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [bosses.ts:8](../../src/game/bosses.ts#L8) | Noa | 2 | Don Aleta |
| [bosses.ts:8](../../src/game/bosses.ts#L8) | Noa | 12 | El guardián del mar quiere jugar contigo antes de abrir su palacio. |
| [bosses.ts:8](../../src/game/bosses.ts#L8) | Noa | 9 | Termina con papel para conseguir su marco de conchas. |
| [bosses.ts:9](../../src/game/bosses.ts#L9) | Noa | 2 | Rey Zarzal |
| [bosses.ts:9](../../src/game/bosses.ts#L9) | Noa | 10 | El guardián de las raíces te reta a un duelo. |
| [bosses.ts:9](../../src/game/bosses.ts#L9) | Noa | 8 | Gana 2–0 para conseguir su marco de raíces. |
| [bosses.ts:10](../../src/game/bosses.ts#L10) | Noa | 2 | Condesa Niebla |
| [bosses.ts:10](../../src/game/bosses.ts#L10) | Noa | 9 | La guardiana de las grutas quiere probar tu ingenio. |
| [bosses.ts:10](../../src/game/bosses.ts#L10) | Noa | 11 | Gana sin gastar una manzana para conseguir su marco de niebla. |
| [bosses.ts:11](../../src/game/bosses.ts#L11) | Noa | 2 | Gran Lobo |
| [bosses.ts:11](../../src/game/bosses.ts#L11) | Noa | 11 | El rey de las huellas te espera para el último duelo. |
| [bosses.ts:11](../../src/game/bosses.ts#L11) | Noa | 9 | Termina con piedra para conseguir su marco de luna. |
| [bosses.ts:12](../../src/game/bosses.ts#L12) | Noa | 2 | Gran Jabalí |
| [bosses.ts:12](../../src/game/bosses.ts#L12) | Noa | 10 | El guardián de las bellotas protege las copas del bosque. |
| [bosses.ts:12](../../src/game/bosses.ts#L12) | Noa | 20 | Dale de comer a todos los jabatos sin que ninguno se quede con hambre para conseguir su marco de bellotas. |
| [bosses.ts:13](../../src/game/bosses.ts#L13) | Noa | 2 | Capitán Celeste |
| [bosses.ts:13](../../src/game/bosses.ts#L13) | Noa | 13 | El capitán de la flota te reta por el tesoro de las nubes. |
| [bosses.ts:13](../../src/game/bosses.ts#L13) | Noa | 12 | Despeja las cinco nubes sin equivocarte para conseguir su marco de nubes. |
| [bosses.ts:14](../../src/game/bosses.ts#L14) | Noa | 2 | Conde Vampiro |
| [bosses.ts:14](../../src/game/bosses.ts#L14) | Noa | 11 | El conde del castillo te reta a un duelo de ingenio. |
| [bosses.ts:14](../../src/game/bosses.ts#L14) | Noa | 7 | Gana 2–0 para conseguir su marco lunar. |
| [bosses.ts:15](../../src/game/bosses.ts#L15) | Noa | 2 | Reina Arcoíris |
| [bosses.ts:15](../../src/game/bosses.ts#L15) | Noa | 8 | La guardiana del cielo quiere comprobar tu magia. |
| [bosses.ts:15](../../src/game/bosses.ts#L15) | Noa | 10 | Pinta el arcoíris sin equivocarte para conseguir su marco arcoíris. |
| [bosses.ts:16](../../src/game/bosses.ts#L16) | Noa | 2 | Reina Tricera |
| [bosses.ts:16](../../src/game/bosses.ts#L16) | Noa | 14 | La guardiana de la isla quiere jugar antes de enseñarte su nido de flores. |
| [bosses.ts:16](../../src/game/bosses.ts#L16) | Noa | 11 | Protege los cinco huevos sin equivocarte para conseguir su marco tropical. |
| [bosses.ts:17](../../src/game/bosses.ts#L17) | Noa | 2 | Dragona Rubí |
| [bosses.ts:17](../../src/game/bosses.ts#L17) | Noa | 13 | La guardiana del volcán quiere comprobar tu valor antes de calmar la lava. |
| [bosses.ts:17](../../src/game/bosses.ts#L17) | Noa | 9 | Termina con piedra para conseguir su marco de rubíes. |
| [bosses.ts:18](../../src/game/bosses.ts#L18) | Noa | 2 | Reina Melisa |
| [bosses.ts:18](../../src/game/bosses.ts#L18) | Noa | 13 | La guardiana de las flores te invita a un juego lleno de zumbidos. |
| [bosses.ts:18](../../src/game/bosses.ts#L18) | Noa | 14 | Corta todas las flores sin dejar caer ninguna para conseguir su marco de flores. |
| [bosses.ts:19](../../src/game/bosses.ts#L19) | Noa | 2 | Osa Boreal |
| [bosses.ts:19](../../src/game/bosses.ts#L19) | Noa | 10 | La guardiana de la cima quiere jugar bajo la aurora. |
| [bosses.ts:19](../../src/game/bosses.ts#L19) | Noa | 8 | Gana 2–0 para conseguir su marco de copos. |
| [bosses.ts:20](../../src/game/bosses.ts#L20) | Noa | 2 | Papá Noel |
| [bosses.ts:20](../../src/game/bosses.ts#L20) | Noa | 18 | Papá Noel ha perdido el ritmo de los regalos. Esquiva sus paquetes y ayúdale con tres saltitos suaves. |
| [bosses.ts:20](../../src/game/bosses.ts#L20) | Noa | 10 | No pierdas ninguna vida para conseguir su marco de estrella. |
| [bosses.ts:21](../../src/game/bosses.ts#L21) | Noa | 1 | Siroco |
| [bosses.ts:21](../../src/game/bosses.ts#L21) | Noa | 17 | Siroco juega con la arena del desierto. Esquiva sus bolas y salta suavemente sobre él tres veces. |
| [bosses.ts:21](../../src/game/bosses.ts#L21) | Noa | 10 | No pierdas ninguna vida para conseguir su marco de oasis. |
| [bosses.ts:22](../../src/game/bosses.ts#L22) | Noa | 2 | Don Silbato |
| [bosses.ts:22](../../src/game/bosses.ts#L22) | Noa | 16 | Don Silbato necesita ordenar el equipaje. Esquiva las maletas y salta sobre su gorra tres veces. |
| [bosses.ts:22](../../src/game/bosses.ts#L22) | Noa | 10 | No pierdas ninguna vida para conseguir su marco de locomotora. |
| [bosses.ts:23](../../src/game/bosses.ts#L23) | Noa | 2 | Maestra Armonía |
| [bosses.ts:23](../../src/game/bosses.ts#L23) | Noa | 11 | La directora del gran teatro quiere compartir contigo su juego musical. |
| [bosses.ts:23](../../src/game/bosses.ts#L23) | Noa | 17 | Repite todos los golpes de Armonía sin que se escape ninguno para conseguir su marco de notas. |
| [bosses.ts:24](../../src/game/bosses.ts#L24) | Noa | 2 | Aurora Celeste |
| [bosses.ts:24](../../src/game/bosses.ts#L24) | Noa | 11 | La guardiana de las nubes celebra que hayas llegado tan alto. |
| [bosses.ts:24](../../src/game/bosses.ts#L24) | Noa | 11 | Enciende las constelaciones sin equivocarte para conseguir su marco de estrellas. |

### Duelos: piedra, papel o tijera

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [BossBattle.tsx:40](../../src/game/BossBattle.tsx#L40) | Noa | 1 | Piedra |
| [BossBattle.tsx:41](../../src/game/BossBattle.tsx#L41) | Noa | 1 | Papel |
| [BossBattle.tsx:42](../../src/game/BossBattle.tsx#L42) | Noa | 1 | Tijera |
| [BossBattle.tsx:62](../../src/game/BossBattle.tsx#L62) | Noa | 5 | Los dos han elegido {…}. |
| [BossBattle.tsx:64](../../src/game/BossBattle.tsx#L64) | Noa | 5 | La piedra rompe las tijeras. |
| [BossBattle.tsx:65](../../src/game/BossBattle.tsx#L65) | Noa | 5 | El papel envuelve la piedra. |
| [BossBattle.tsx:66](../../src/game/BossBattle.tsx#L66) | Noa | 5 | Las tijeras cortan el papel. |
| [BossBattle.tsx:86](../../src/game/BossBattle.tsx#L86) | Noa | 6 | Noa hace el gesto de {…} |
| [BossBattle.tsx:155](../../src/game/BossBattle.tsx#L155) | Noa | 10 | Elige un gesto. El primero que gane dos rondas vence. |
| [BossBattle.tsx:219](../../src/game/BossBattle.tsx#L219) | Noa | 2 | Duelo amistoso |
| [BossBattle.tsx:219](../../src/game/BossBattle.tsx#L219) | Noa | 2 | Monstruo final |
| [BossBattle.tsx:219](../../src/game/BossBattle.tsx#L219) | Noa | 1 | · Ronda |
| [BossBattle.tsx:220](../../src/game/BossBattle.tsx#L220) | Noa | 3 | Juega con {…} |
| [BossBattle.tsx:220](../../src/game/BossBattle.tsx#L220) | Noa | 3 | Duelo contra {…} |
| [BossBattle.tsx:222](../../src/game/BossBattle.tsx#L222) | Noa | 3 | ★ Reto de amistad: |
| [BossBattle.tsx:225](../../src/game/BossBattle.tsx#L225) | Noa | 5 | Marcador: Noa {…}, {…} {…} |
| [BossBattle.tsx:226](../../src/game/BossBattle.tsx#L226) | Noa | 1 | NOA |
| [BossBattle.tsx:226](../../src/game/BossBattle.tsx#L226) | Noa | 1 | JEFE |
| [BossBattle.tsx:235](../../src/game/BossBattle.tsx#L235) | Oculto | 3 | Historial de rondas |
| [BossBattle.tsx:238](../../src/game/BossBattle.tsx#L238) | Noa | 1 | R |
| [BossBattle.tsx:245](../../src/game/BossBattle.tsx#L245) | Noa | 1 | ¡YA! |
| [BossBattle.tsx:248](../../src/game/BossBattle.tsx#L248) | Noa | 1 | NOA |
| [BossBattle.tsx:251](../../src/game/BossBattle.tsx#L251) | Noa | 1 | Pensando… |
| [BossBattle.tsx:251](../../src/game/BossBattle.tsx#L251) | Noa | 1 | Preparada |
| [BossBattle.tsx:254](../../src/game/BossBattle.tsx#L254) | Noa | 1 | VS |
| [BossBattle.tsx:260](../../src/game/BossBattle.tsx#L260) | Noa | 1 | Pensando… |
| [BossBattle.tsx:260](../../src/game/BossBattle.tsx#L260) | Noa | 1 | Esperando |
| [BossBattle.tsx:266](../../src/game/BossBattle.tsx#L266) | Noa | 2 | Piedra, papel… |
| [BossBattle.tsx:266](../../src/game/BossBattle.tsx#L266) | Noa | 4 | ¡Noa gana el duelo! |
| [BossBattle.tsx:266](../../src/game/BossBattle.tsx#L266) | Noa | 4 | Esta vez gana {…} |
| [BossBattle.tsx:266](../../src/game/BossBattle.tsx#L266) | Noa | 3 | ¡Ronda para Noa! |
| [BossBattle.tsx:266](../../src/game/BossBattle.tsx#L266) | Noa | 3 | Ronda para {…} |
| [BossBattle.tsx:266](../../src/game/BossBattle.tsx#L266) | Noa | 1 | ¡Empate! |
| [BossBattle.tsx:266](../../src/game/BossBattle.tsx#L266) | Noa | 4 | Piedra, papel o tijera |
| [BossBattle.tsx:268](../../src/game/BossBattle.tsx#L268) | Noa | 7 | Noa elige {…} y {…} elige {…} |
| [BossBattle.tsx:269](../../src/game/BossBattle.tsx#L269) | Noa | 1 | NOA |
| [BossBattle.tsx:270](../../src/game/BossBattle.tsx#L270) | Noa | 1 | VS |
| [BossBattle.tsx:274](../../src/game/BossBattle.tsx#L274) | Noa | 7 | Los dos gestos aparecerán a la vez. |
| [BossBattle.tsx:274](../../src/game/BossBattle.tsx#L274) | Noa | 6 | La amistad con {…} sigue creciendo. |
| [BossBattle.tsx:274](../../src/game/BossBattle.tsx#L274) | Noa | 8 | ¡Reto logrado! {…} te regala un marco especial. |
| [BossBattle.tsx:274](../../src/game/BossBattle.tsx#L274) | Noa | 7 | {…} sonríe y deja libre el camino. |
| [BossBattle.tsx:274](../../src/game/BossBattle.tsx#L274) | Noa | 6 | ¡Puedes intentarlo otra vez cuando quieras! |
| [BossBattle.tsx:274](../../src/game/BossBattle.tsx#L274) | Noa | 8 | Puedes gastar una manzana para repetir el duelo. |
| [BossBattle.tsx:274](../../src/game/BossBattle.tsx#L274) | Noa | 9 | No quedan manzanas: toca recorrer de nuevo la pantalla. |
| [BossBattle.tsx:278](../../src/game/BossBattle.tsx#L278) | Oculto | 5 | Elige piedra, papel o tijera |
| [BossBattle.tsx:284](../../src/game/BossBattle.tsx#L284) | Adultos | 16 | Con mando: elige con la cruceta, pulsa A para confirmar o B para volver al mapa. |
| [BossBattle.tsx:287](../../src/game/BossBattle.tsx#L287) | Noa | 2 | Siguiente ronda ▶ |
| [BossBattle.tsx:288](../../src/game/BossBattle.tsx#L288) | Noa | 3 | ↺ Jugar otra vez |
| [BossBattle.tsx:289](../../src/game/BossBattle.tsx#L289) | Noa | 5 | Usar una manzana y repetir |
| [BossBattle.tsx:290](../../src/game/BossBattle.tsx#L290) | Noa | 5 | ↺ Volver a empezar la pantalla |
| [BossBattle.tsx:291](../../src/game/BossBattle.tsx#L291) | Noa | 4 | Volver a mis amigos |
| [BossBattle.tsx:291](../../src/game/BossBattle.tsx#L291) | Noa | 3 | Continuar la aventura ▶ |
| [BossBattle.tsx:292](../../src/game/BossBattle.tsx#L292) | Noa | 4 | Volver a mis amigos |
| [BossBattle.tsx:292](../../src/game/BossBattle.tsx#L292) | Noa | 5 | 🏳 Rendirse y volver al mapa |
| [BossBattle.tsx:298](../../src/game/BossBattle.tsx#L298) | Noa | 2 | Un momento |
| [BossBattle.tsx:299](../../src/game/BossBattle.tsx#L299) | Noa | 3 | ¿Volvemos al mapa? |
| [BossBattle.tsx:300](../../src/game/BossBattle.tsx#L300) | Noa | 12 | Este duelo empezará de nuevo cuando vuelvas. Tus pegatinas encontradas siguen guardadas. |
| [BossBattle.tsx:301](../../src/game/BossBattle.tsx#L301) | Noa | 4 | Seguir con el duelo |
| [BossBattle.tsx:302](../../src/game/BossBattle.tsx#L302) | Noa | 4 | Sí, volver al mapa |

### Duelos: juegos de guardián

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [GuardianMiniGame.tsx:58](../../src/game/GuardianMiniGame.tsx#L58) | Noa | 13 | No pasa nada. Ya sabes cómo se juega y puedes probar otra vez. |
| [GuardianMiniGame.tsx:60](../../src/game/GuardianMiniGame.tsx#L60) | Noa | 7 | Casi. Mira de nuevo la secuencia despacito. |
| [GuardianMiniGame.tsx:60](../../src/game/GuardianMiniGame.tsx#L60) | Noa | 8 | Casi. Mira la pista y prueba otra vez. |
| [GuardianMiniGame.tsx:83](../../src/game/GuardianMiniGame.tsx#L83) | Noa | 2 | Juego amistoso |
| [GuardianMiniGame.tsx:83](../../src/game/GuardianMiniGame.tsx#L83) | Noa | 3 | Juego del guardián |
| [GuardianMiniGame.tsx:83](../../src/game/GuardianMiniGame.tsx#L83) | Noa | 1 | · Ronda |
| [GuardianMiniGame.tsx:83](../../src/game/GuardianMiniGame.tsx#L83) | Noa | 9 | ★ Reto de amistad: completa las cinco rondas sin equivocarte. |
| [GuardianMiniGame.tsx:89](../../src/game/GuardianMiniGame.tsx#L89) | Noa | 2 | Ahora repítelo |
| [GuardianMiniGame.tsx:96](../../src/game/GuardianMiniGame.tsx#L96) | Noa | 7 | Toca los dibujos en el mismo orden. |
| [GuardianMiniGame.tsx:96](../../src/game/GuardianMiniGame.tsx#L96) | Noa | 3 | ¡Ya me acuerdo! ▶ |
| [GuardianMiniGame.tsx:98](../../src/game/GuardianMiniGame.tsx#L98) | Noa | 2 | Siguiente ronda ▶ |
| [GuardianMiniGame.tsx:99](../../src/game/GuardianMiniGame.tsx#L99) | Noa | 2 | ¡Juego completado! |
| [GuardianMiniGame.tsx:99](../../src/game/GuardianMiniGame.tsx#L99) | Noa | 8 | ¡Reto logrado! {…} te regala un marco especial. |
| [GuardianMiniGame.tsx:99](../../src/game/GuardianMiniGame.tsx#L99) | Noa | 6 | {…} sonríe y abre el camino. |
| [GuardianMiniGame.tsx:99](../../src/game/GuardianMiniGame.tsx#L99) | Noa | 4 | Volver a mis amigos |
| [GuardianMiniGame.tsx:99](../../src/game/GuardianMiniGame.tsx#L99) | Noa | 3 | Continuar la aventura ▶ |
| [GuardianMiniGame.tsx:100](../../src/game/GuardianMiniGame.tsx#L100) | Noa | 3 | ¡Vamos otra vez! |
| [GuardianMiniGame.tsx:100](../../src/game/GuardianMiniGame.tsx#L100) | Noa | 3 | Jugar otra vez |
| [GuardianMiniGame.tsx:100](../../src/game/GuardianMiniGame.tsx#L100) | Noa | 5 | Usar una manzana y repetir |
| [GuardianMiniGame.tsx:100](../../src/game/GuardianMiniGame.tsx#L100) | Noa | 5 | Volver a empezar la pantalla |
| [GuardianMiniGame.tsx:101](../../src/game/GuardianMiniGame.tsx#L101) | Noa | 4 | Volver a mis amigos |
| [GuardianMiniGame.tsx:101](../../src/game/GuardianMiniGame.tsx#L101) | Noa | 5 | 🏳 Rendirse y volver al mapa |
| [GuardianMiniGame.tsx:102](../../src/game/GuardianMiniGame.tsx#L102) | Noa | 10 | La armadura dorada de Noa sigue brillando durante el juego. |
| [GuardianMiniGame.tsx:104](../../src/game/GuardianMiniGame.tsx#L104) | Noa | 2 | Un momento |
| [GuardianMiniGame.tsx:104](../../src/game/GuardianMiniGame.tsx#L104) | Noa | 3 | ¿Volvemos al mapa? |
| [GuardianMiniGame.tsx:105](../../src/game/GuardianMiniGame.tsx#L105) | Noa | 12 | Este juego empezará de nuevo cuando vuelvas. Tus pegatinas encontradas siguen guardadas. |
| [GuardianMiniGame.tsx:106](../../src/game/GuardianMiniGame.tsx#L106) | Noa | 4 | Seguir con el juego |
| [GuardianMiniGame.tsx:107](../../src/game/GuardianMiniGame.tsx#L107) | Noa | 4 | Sí, volver al mapa |
| [guardianGames.ts:22](../../src/game/guardianGames.ts#L22) | Noa | 2 | Cesta izquierda |
| [guardianGames.ts:23](../../src/game/guardianGames.ts#L23) | Noa | 3 | Cesta del centro |
| [guardianGames.ts:24](../../src/game/guardianGames.ts#L24) | Noa | 2 | Cesta derecha |
| [guardianGames.ts:27](../../src/game/guardianGames.ts#L27) | Noa | 2 | Cañón rojo |
| [guardianGames.ts:28](../../src/game/guardianGames.ts#L28) | Noa | 2 | Cañón amarillo |
| [guardianGames.ts:29](../../src/game/guardianGames.ts#L29) | Noa | 2 | Cañón azul |
| [guardianGames.ts:32](../../src/game/guardianGames.ts#L32) | Noa | 1 | Luna |
| [guardianGames.ts:33](../../src/game/guardianGames.ts#L33) | Noa | 1 | Estrella |
| [guardianGames.ts:34](../../src/game/guardianGames.ts#L34) | Noa | 1 | Nube |
| [guardianGames.ts:37](../../src/game/guardianGames.ts#L37) | Noa | 1 | Rojo |
| [guardianGames.ts:38](../../src/game/guardianGames.ts#L38) | Noa | 1 | Amarillo |
| [guardianGames.ts:39](../../src/game/guardianGames.ts#L39) | Noa | 1 | Azul |
| [guardianGames.ts:43](../../src/game/guardianGames.ts#L43) | Noa | 3 | Protege los huevos |
| [guardianGames.ts:43](../../src/game/guardianGames.ts#L43) | Noa | 10 | Mira dónde cae el huevo y coloca allí la cesta. |
| [guardianGames.ts:43](../../src/game/guardianGames.ts#L43) | Noa | 4 | El huevo cae aquí |
| [guardianGames.ts:43](../../src/game/guardianGames.ts#L43) | Noa | 3 | ¡Huevo a salvo! |
| [guardianGames.ts:44](../../src/game/guardianGames.ts#L44) | Noa | 3 | Cañones de colores |
| [guardianGames.ts:44](../../src/game/guardianGames.ts#L44) | Noa | 10 | Mira la bandera y dispara el cañón del mismo color. |
| [guardianGames.ts:44](../../src/game/guardianGames.ts#L44) | Noa | 4 | La bandera del capitán |
| [guardianGames.ts:44](../../src/game/guardianGames.ts#L44) | Noa | 2 | ¡Nube despejada! |
| [guardianGames.ts:45](../../src/game/guardianGames.ts#L45) | Noa | 3 | Une las estrellas |
| [guardianGames.ts:45](../../src/game/guardianGames.ts#L45) | Noa | 13 | Mira el camino del cielo y toca los dibujos en el mismo orden. |
| [guardianGames.ts:45](../../src/game/guardianGames.ts#L45) | Noa | 3 | Camino de estrellas |
| [guardianGames.ts:45](../../src/game/guardianGames.ts#L45) | Noa | 2 | ¡Constelación encendida! |
| [guardianGames.ts:46](../../src/game/guardianGames.ts#L46) | Noa | 3 | Pinta el arcoíris |
| [guardianGames.ts:46](../../src/game/guardianGames.ts#L46) | Noa | 9 | Mira los colores y repítelos en el mismo orden. |
| [guardianGames.ts:46](../../src/game/guardianGames.ts#L46) | Noa | 3 | Colores del arcoíris |
| [guardianGames.ts:46](../../src/game/guardianGames.ts#L46) | Noa | 5 | ¡El arcoíris vuelve a brillar! |

### Duelos: Papá Noel y Siroco

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [SantaBossBattle.tsx:18](../../src/game/SantaBossBattle.tsx#L18) | Noa | 4 | Jefe final de Navidad |
| [SantaBossBattle.tsx:18](../../src/game/SantaBossBattle.tsx#L18) | Noa | 4 | Ayuda a Papá Noel |
| [SantaBossBattle.tsx:18](../../src/game/SantaBossBattle.tsx#L18) | Noa | 9 | Papá Noel sonríe: ahora los regalos saldrán a tiempo. |
| [SantaBossBattle.tsx:18](../../src/game/SantaBossBattle.tsx#L18) | Oculto | 11 | Noa y Papá Noel en el patio nevado de los regalos. |
| [SantaBossBattle.tsx:19](../../src/game/SantaBossBattle.tsx#L19) | Noa | 3 | Guardián del desierto |
| [SantaBossBattle.tsx:19](../../src/game/SantaBossBattle.tsx#L19) | Noa | 3 | Juega con Siroco |
| [SantaBossBattle.tsx:19](../../src/game/SantaBossBattle.tsx#L19) | Noa | 9 | Siroco sonríe y abre el camino entre las dunas. |
| [SantaBossBattle.tsx:19](../../src/game/SantaBossBattle.tsx#L19) | Oculto | 9 | Noa y Siroco en las ruinas doradas del desierto. |
| [SantaBossBattle.tsx:20](../../src/game/SantaBossBattle.tsx#L20) | Noa | 4 | Guardián de la locomotora |
| [SantaBossBattle.tsx:20](../../src/game/SantaBossBattle.tsx#L20) | Noa | 4 | Ayuda a Don Silbato |
| [SantaBossBattle.tsx:20](../../src/game/SantaBossBattle.tsx#L20) | Noa | 9 | Don Silbato toca su silbato: el tren puede continuar. |
| [SantaBossBattle.tsx:20](../../src/game/SantaBossBattle.tsx#L20) | Oculto | 9 | Noa y Don Silbato junto a la gran locomotora. |
| [SantaBossBattle.tsx:105](../../src/game/SantaBossBattle.tsx#L105) | Noa | 2 | Salta las |
| [SantaBossBattle.tsx:105](../../src/game/SantaBossBattle.tsx#L105) | Noa | 15 | y cae sobre su cabeza tres veces. ¡Atención, cada ronda va un poquito más rápido! |
| [SantaBossBattle.tsx:107](../../src/game/SantaBossBattle.tsx#L107) | Noa | 9 | {…} Muévete con las flechas y salta con espacio. |
| [SantaBossBattle.tsx:112](../../src/game/SantaBossBattle.tsx#L112) | Noa | 2 | ¡Lo conseguiste! |
| [SantaBossBattle.tsx:112](../../src/game/SantaBossBattle.tsx#L112) | Noa | 3 | Abrir el camino ▶ |
| [SantaBossBattle.tsx:112](../../src/game/SantaBossBattle.tsx#L112) | Noa | 3 | ¡Vamos otra vez! |
| [SantaBossBattle.tsx:112](../../src/game/SantaBossBattle.tsx#L112) | Noa | 12 | Usa las plataformas y el doble salto para caer sobre su cabeza. |
| [SantaBossBattle.tsx:112](../../src/game/SantaBossBattle.tsx#L112) | Noa | 5 | Usar una manzana y reintentar |
| [SantaBossBattle.tsx:112](../../src/game/SantaBossBattle.tsx#L112) | Noa | 4 | Volver a la pantalla |
| [SantaBossBattle.tsx:113](../../src/game/SantaBossBattle.tsx#L113) | Noa | 3 | Volver al mapa |

### Duelos: Papá Noel y Siroco (lienzo)

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [santaBattleRendering.ts:70](../../src/game/santaBattleRendering.ts#L70) | Noa | 3 | ¡Va la arena! |
| [santaBattleRendering.ts:70](../../src/game/santaBattleRendering.ts#L70) | Noa | 3 | ¡Va una maleta! |
| [santaBattleRendering.ts:70](../../src/game/santaBattleRendering.ts#L70) | Noa | 3 | ¡Va un regalo! |
| [santaBattleRendering.ts:88](../../src/game/santaBattleRendering.ts#L88) | Noa | 1 | {…} → |

### Minijuego: abeja ninja

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [BeeNinjaGame.tsx:76](../../src/game/BeeNinjaGame.tsx#L76) | Noa | 5 | Mira cómo lo hace Noa. |
| [BeeNinjaGame.tsx:76](../../src/game/BeeNinjaGame.tsx#L76) | Noa | 8 | Flor: un corte cuando llega a la varita. |
| [BeeNinjaGame.tsx:76](../../src/game/BeeNinjaGame.tsx#L76) | Noa | 6 | Dúo: dos flores, dos cortes seguidos. |
| [BeeNinjaGame.tsx:76](../../src/game/BeeNinjaGame.tsx#L76) | Noa | 7 | La mariquita no se corta: déjala pasar. |
| [BeeNinjaGame.tsx:77](../../src/game/BeeNinjaGame.tsx#L77) | Noa | 7 | ¡Ahora tú! Escucha la cuenta de Melisa. |
| [BeeNinjaGame.tsx:77](../../src/game/BeeNinjaGame.tsx#L77) | Noa | 8 | Corta cuando la flor llegue a la punta. |
| [BeeNinjaGame.tsx:77](../../src/game/BeeNinjaGame.tsx#L77) | Noa | 4 | ¡Zum-zum! Dos cortes seguidos. |
| [BeeNinjaGame.tsx:77](../../src/game/BeeNinjaGame.tsx#L77) | Noa | 4 | ¡A la mariquita no! |
| [BeeNinjaGame.tsx:78](../../src/game/BeeNinjaGame.tsx#L78) | Noa | 4 | ¡Que empiece el duelo! |
| [BeeNinjaGame.tsx:82](../../src/game/BeeNinjaGame.tsx#L82) | Noa | 1 | ¡Perfecto! |
| [BeeNinjaGame.tsx:82](../../src/game/BeeNinjaGame.tsx#L82) | Noa | 13 | ¡No ha caído ni una flor! Melisa te regala su marco de flores. |
| [BeeNinjaGame.tsx:83](../../src/game/BeeNinjaGame.tsx#L83) | Noa | 2 | ¡Bien hecho! |
| [BeeNinjaGame.tsx:83](../../src/game/BeeNinjaGame.tsx#L83) | Noa | 13 | El tarro de miel ha pasado la raya dorada. ¡Melisa está muy contenta! |
| [BeeNinjaGame.tsx:84](../../src/game/BeeNinjaGame.tsx#L84) | Noa | 1 | ¡Casi! |
| [BeeNinjaGame.tsx:84](../../src/game/BeeNinjaGame.tsx#L84) | Noa | 14 | El tarro aún no llega a la raya dorada. Melisa quiere jugar otra vez. |
| [BeeNinjaGame.tsx:119](../../src/game/BeeNinjaGame.tsx#L119) | Noa | 1 | ¡Bravo! |
| [BeeNinjaGame.tsx:119](../../src/game/BeeNinjaGame.tsx#L119) | Noa | 1 | ¡zum-zum! |
| [BeeNinjaGame.tsx:119](../../src/game/BeeNinjaGame.tsx#L119) | Noa | 1 | ¡zum! |
| [BeeNinjaGame.tsx:137](../../src/game/BeeNinjaGame.tsx#L137) | Noa | 15 | La Reina Melisa te lanza flores. ¡Córtalas con tu varita al ritmo de la música! |
| [BeeNinjaGame.tsx:281](../../src/game/BeeNinjaGame.tsx#L281) | Noa | 1 | ¡Zas! |
| [BeeNinjaGame.tsx:286](../../src/game/BeeNinjaGame.tsx#L286) | Noa | 12 | ¡El tarro ha pasado la raya dorada! Sigue cortando hasta el final. |
| [BeeNinjaGame.tsx:292](../../src/game/BeeNinjaGame.tsx#L292) | Noa | 9 | ¡A la mariquita no se la corta! Déjala pasar. |
| [BeeNinjaGame.tsx:295](../../src/game/BeeNinjaGame.tsx#L295) | Noa | 1 | ¡Uy! |
| [BeeNinjaGame.tsx:296](../../src/game/BeeNinjaGame.tsx#L296) | Noa | 12 | Espera a que la flor llegue a la punta de la varita. |
| [BeeNinjaGame.tsx:307](../../src/game/BeeNinjaGame.tsx#L307) | Noa | 11 | ¡Ya lo has visto! Ahora ensaya tú, o empieza el duelo. |
| [BeeNinjaGame.tsx:307](../../src/game/BeeNinjaGame.tsx#L307) | Noa | 10 | ¡Buen ensayo! Puedes ensayar otra vez o empezar el duelo. |
| [BeeNinjaGame.tsx:328](../../src/game/BeeNinjaGame.tsx#L328) | Noa | 5 | Mira cómo lo hace Noa. |
| [BeeNinjaGame.tsx:328](../../src/game/BeeNinjaGame.tsx#L328) | Noa | 14 | Escucha la cuenta de Melisa y corta cuando la flor llegue a la varita. |
| [BeeNinjaGame.tsx:412](../../src/game/BeeNinjaGame.tsx#L412) | Noa | 7 | No pasa nada. ¡Ya viene otra flor! |
| [BeeNinjaGame.tsx:456](../../src/game/BeeNinjaGame.tsx#L456) | Noa | 2 | Juego amistoso |
| [BeeNinjaGame.tsx:456](../../src/game/BeeNinjaGame.tsx#L456) | Noa | 3 | Juego del guardián |
| [BeeNinjaGame.tsx:457](../../src/game/BeeNinjaGame.tsx#L457) | Noa | 3 | La abeja ninja |
| [BeeNinjaGame.tsx:458](../../src/game/BeeNinjaGame.tsx#L458) | Noa | 12 | Melisa lanza flores. Córtalas cuando lleguen a la punta de tu varita. |
| [BeeNinjaGame.tsx:459](../../src/game/BeeNinjaGame.tsx#L459) | Noa | 3 | ★ Reto de amistad: |
| [BeeNinjaGame.tsx:472](../../src/game/BeeNinjaGame.tsx#L472) | Noa | 1 | ¡Ya! |
| [BeeNinjaGame.tsx:481](../../src/game/BeeNinjaGame.tsx#L481) | Noa | 1 | ¡Hola! |
| [BeeNinjaGame.tsx:484](../../src/game/BeeNinjaGame.tsx#L484) | Noa | 3 | ¡Seguimos! Melisa cuenta: |
| [BeeNinjaGame.tsx:489](../../src/game/BeeNinjaGame.tsx#L489) | Oculto | 4 | Avance de la canción |
| [BeeNinjaGame.tsx:494](../../src/game/BeeNinjaGame.tsx#L494) | Noa | 1 | ¡Corta! |
| [BeeNinjaGame.tsx:495](../../src/game/BeeNinjaGame.tsx#L495) | Noa | 2 | Terminar demostración |
| [BeeNinjaGame.tsx:496](../../src/game/BeeNinjaGame.tsx#L496) | Noa | 2 | Terminar ensayo |
| [BeeNinjaGame.tsx:498](../../src/game/BeeNinjaGame.tsx#L498) | Noa | 1 | Practicar |
| [BeeNinjaGame.tsx:499](../../src/game/BeeNinjaGame.tsx#L499) | Noa | 2 | ¡A jugar! |
| [BeeNinjaGame.tsx:502](../../src/game/BeeNinjaGame.tsx#L502) | Noa | 1 | Ensayar |
| [BeeNinjaGame.tsx:503](../../src/game/BeeNinjaGame.tsx#L503) | Noa | 2 | ¡A jugar! |
| [BeeNinjaGame.tsx:506](../../src/game/BeeNinjaGame.tsx#L506) | Noa | 2 | ¡A jugar! |
| [BeeNinjaGame.tsx:507](../../src/game/BeeNinjaGame.tsx#L507) | Noa | 3 | Ensayar otra vez |
| [BeeNinjaGame.tsx:510](../../src/game/BeeNinjaGame.tsx#L510) | Noa | 4 | Volver a mis amigos |
| [BeeNinjaGame.tsx:510](../../src/game/BeeNinjaGame.tsx#L510) | Noa | 3 | Continuar la aventura ▶ |
| [BeeNinjaGame.tsx:511](../../src/game/BeeNinjaGame.tsx#L511) | Noa | 3 | Jugar otra vez |
| [BeeNinjaGame.tsx:513](../../src/game/BeeNinjaGame.tsx#L513) | Noa | 16 | Si cortas todas las flores sin dejar caer ninguna, Melisa te dará su marco de flores. |
| [BeeNinjaGame.tsx:515](../../src/game/BeeNinjaGame.tsx#L515) | Noa | 3 | Intentar otra vez |
| [BeeNinjaGame.tsx:516](../../src/game/BeeNinjaGame.tsx#L516) | Noa | 1 | Practicar |
| [BeeNinjaGame.tsx:517](../../src/game/BeeNinjaGame.tsx#L517) | Noa | 4 | Volver a mis amigos |
| [BeeNinjaGame.tsx:517](../../src/game/BeeNinjaGame.tsx#L517) | Noa | 3 | Volver al mapa |
| [BeeNinjaGame.tsx:519](../../src/game/BeeNinjaGame.tsx#L519) | Noa | 9 | Sonido apagado: sigue el aro dorado y el panal. |
| [BeeNinjaGame.tsx:519](../../src/game/BeeNinjaGame.tsx#L519) | Noa | 9 | Sin sonido: sigue el aro dorado y el panal. |
| [BeeNinjaGame.tsx:520](../../src/game/BeeNinjaGame.tsx#L520) | Adultos | 10 | Teclado: Espacio · Mando: botón A · Toca la escena o «¡Corta!» |
| [BeeNinjaGame.tsx:521](../../src/game/BeeNinjaGame.tsx#L521) | Noa | 4 | Volver a mis amigos |
| [BeeNinjaGame.tsx:521](../../src/game/BeeNinjaGame.tsx#L521) | Noa | 3 | Volver al mapa |
| [BeeNinjaGame.tsx:526](../../src/game/BeeNinjaGame.tsx#L526) | Noa | 2 | Un momento |
| [BeeNinjaGame.tsx:526](../../src/game/BeeNinjaGame.tsx#L526) | Noa | 3 | ¿Volvemos al mapa? |
| [BeeNinjaGame.tsx:527](../../src/game/BeeNinjaGame.tsx#L527) | Noa | 13 | Podrás jugar con Melisa otra vez cuando quieras. Tus pegatinas guardadas seguirán contigo. |
| [BeeNinjaGame.tsx:528](../../src/game/BeeNinjaGame.tsx#L528) | Noa | 2 | Seguir jugando |
| [BeeNinjaGame.tsx:529](../../src/game/BeeNinjaGame.tsx#L529) | Noa | 4 | Sí, volver al mapa |
| [beeNinja.ts:40](../../src/game/beeNinja.ts#L40) | Noa | 1 | Cuenta |
| [beeNinja.ts:40](../../src/game/beeNinja.ts#L40) | Noa | 2 | Primera flor |
| [beeNinja.ts:40](../../src/game/beeNinja.ts#L40) | Noa | 1 | Tranquila |
| [beeNinja.ts:41](../../src/game/beeNinja.ts#L41) | Noa | 1 | Animada |
| [beeNinja.ts:41](../../src/game/beeNinja.ts#L41) | Noa | 4 | ¡Cuidado con las mariquitas! |
| [beeNinja.ts:41](../../src/game/beeNinja.ts#L41) | Noa | 1 | ¡Fanfarria! |
| [beeNinja.ts:54](../../src/game/beeNinja.ts#L54) | Noa | 1 | Cuenta |
| [beeNinja.ts:54](../../src/game/beeNinja.ts#L54) | Noa | 1 | Ensayo |
| [beeNinja.ts:61](../../src/game/beeNinja.ts#L61) | Noa | 1 | Cuenta |
| [beeNinja.ts:61](../../src/game/beeNinja.ts#L61) | Noa | 1 | Demostración |

### Minijuego: tambor de Armonía

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [ArmoniaDrumGame.tsx:71](../../src/game/ArmoniaDrumGame.tsx#L71) | Noa | 6 | Mira: Armonía toca y Noa repite. |
| [ArmoniaDrumGame.tsx:71](../../src/game/ArmoniaDrumGame.tsx#L71) | Noa | 6 | Escucha a Armonía… ¡tin! te avisa. |
| [ArmoniaDrumGame.tsx:71](../../src/game/ArmoniaDrumGame.tsx#L71) | Noa | 5 | Noa repite los mismos golpes. |
| [ArmoniaDrumGame.tsx:71](../../src/game/ArmoniaDrumGame.tsx#L71) | Noa | 4 | Ahora tres golpes seguidos. |
| [ArmoniaDrumGame.tsx:71](../../src/game/ArmoniaDrumGame.tsx#L71) | Noa | 4 | ¡Noa los repite igual! |
| [ArmoniaDrumGame.tsx:72](../../src/game/ArmoniaDrumGame.tsx#L72) | Noa | 7 | ¡Ahora tú! Escucha la cuenta de Armonía. |
| [ArmoniaDrumGame.tsx:72](../../src/game/ArmoniaDrumGame.tsx#L72) | Noa | 5 | Escucha y mira las huellas. |
| [ArmoniaDrumGame.tsx:72](../../src/game/ArmoniaDrumGame.tsx#L72) | Noa | 5 | ¡Tu turno! Golpea como Armonía. |
| [ArmoniaDrumGame.tsx:73](../../src/game/ArmoniaDrumGame.tsx#L73) | Noa | 4 | ¡Que empiece el concierto! |
| [ArmoniaDrumGame.tsx:77](../../src/game/ArmoniaDrumGame.tsx#L77) | Noa | 1 | ¡Perfecto! |
| [ArmoniaDrumGame.tsx:77](../../src/game/ArmoniaDrumGame.tsx#L77) | Noa | 14 | ¡No se ha escapado ni un golpe! Armonía te regala su marco de notas. |
| [ArmoniaDrumGame.tsx:78](../../src/game/ArmoniaDrumGame.tsx#L78) | Noa | 2 | ¡Bien hecho! |
| [ArmoniaDrumGame.tsx:78](../../src/game/ArmoniaDrumGame.tsx#L78) | Noa | 13 | Las notas del atril han pasado la raya dorada. ¡Armonía está muy contenta! |
| [ArmoniaDrumGame.tsx:79](../../src/game/ArmoniaDrumGame.tsx#L79) | Noa | 1 | ¡Casi! |
| [ArmoniaDrumGame.tsx:79](../../src/game/ArmoniaDrumGame.tsx#L79) | Noa | 15 | Las notas aún no llegan a la raya dorada. Armonía quiere tocar otra vez contigo. |
| [ArmoniaDrumGame.tsx:97](../../src/game/ArmoniaDrumGame.tsx#L97) | Noa | 1 | ¡Bravo! |
| [ArmoniaDrumGame.tsx:98](../../src/game/ArmoniaDrumGame.tsx#L98) | Noa | 1 | ¡Escucha! |
| [ArmoniaDrumGame.tsx:99](../../src/game/ArmoniaDrumGame.tsx#L99) | Noa | 1 | ¡tin! |
| [ArmoniaDrumGame.tsx:102](../../src/game/ArmoniaDrumGame.tsx#L102) | Noa | 1 | Cuenta |
| [ArmoniaDrumGame.tsx:102](../../src/game/ArmoniaDrumGame.tsx#L102) | Noa | 1 | ¡Fanfarria! |
| [ArmoniaDrumGame.tsx:108](../../src/game/ArmoniaDrumGame.tsx#L108) | Noa | 2 | ¡Tu turno! |
| [ArmoniaDrumGame.tsx:134](../../src/game/ArmoniaDrumGame.tsx#L134) | Noa | 14 | Armonía toca su tambor. ¡Escucha y repite sus golpes en el tambor de Noa! |
| [ArmoniaDrumGame.tsx:249](../../src/game/ArmoniaDrumGame.tsx#L249) | Noa | 1 | ¡Bien! |
| [ArmoniaDrumGame.tsx:254](../../src/game/ArmoniaDrumGame.tsx#L254) | Noa | 12 | ¡Las notas han pasado la raya dorada! Sigue tocando hasta el final. |
| [ArmoniaDrumGame.tsx:258](../../src/game/ArmoniaDrumGame.tsx#L258) | Noa | 1 | ¡Uy! |
| [ArmoniaDrumGame.tsx:259](../../src/game/ArmoniaDrumGame.tsx#L259) | Noa | 9 | Escucha a Armonía y golpea en las huellas doradas. |
| [ArmoniaDrumGame.tsx:270](../../src/game/ArmoniaDrumGame.tsx#L270) | Noa | 11 | ¡Ya lo has visto! Ahora ensaya tú, o empieza el concierto. |
| [ArmoniaDrumGame.tsx:270](../../src/game/ArmoniaDrumGame.tsx#L270) | Noa | 10 | ¡Buen ensayo! Puedes ensayar otra vez o empezar el concierto. |
| [ArmoniaDrumGame.tsx:291](../../src/game/ArmoniaDrumGame.tsx#L291) | Noa | 7 | Mira cómo lo hacen Armonía y Noa. |
| [ArmoniaDrumGame.tsx:291](../../src/game/ArmoniaDrumGame.tsx#L291) | Noa | 11 | Escucha a Armonía y repite sus golpes cuando sea tu turno. |
| [ArmoniaDrumGame.tsx:416](../../src/game/ArmoniaDrumGame.tsx#L416) | Noa | 2 | Juego amistoso |
| [ArmoniaDrumGame.tsx:416](../../src/game/ArmoniaDrumGame.tsx#L416) | Noa | 3 | Juego del guardián |
| [ArmoniaDrumGame.tsx:417](../../src/game/ArmoniaDrumGame.tsx#L417) | Noa | 4 | El tambor de Armonía |
| [ArmoniaDrumGame.tsx:418](../../src/game/ArmoniaDrumGame.tsx#L418) | Noa | 14 | Armonía toca su tambor. Escucha y repite sus golpes en el tambor de Noa. |
| [ArmoniaDrumGame.tsx:419](../../src/game/ArmoniaDrumGame.tsx#L419) | Noa | 3 | ★ Reto de amistad: |
| [ArmoniaDrumGame.tsx:444](../../src/game/ArmoniaDrumGame.tsx#L444) | Noa | 3 | ¡Seguimos! Armonía cuenta: |
| [ArmoniaDrumGame.tsx:449](../../src/game/ArmoniaDrumGame.tsx#L449) | Oculto | 4 | Avance de la canción |
| [ArmoniaDrumGame.tsx:457](../../src/game/ArmoniaDrumGame.tsx#L457) | Noa | 1 | ¡Golpea! |
| [ArmoniaDrumGame.tsx:458](../../src/game/ArmoniaDrumGame.tsx#L458) | Noa | 2 | Terminar demostración |
| [ArmoniaDrumGame.tsx:459](../../src/game/ArmoniaDrumGame.tsx#L459) | Noa | 2 | Terminar ensayo |
| [ArmoniaDrumGame.tsx:461](../../src/game/ArmoniaDrumGame.tsx#L461) | Noa | 1 | Practicar |
| [ArmoniaDrumGame.tsx:462](../../src/game/ArmoniaDrumGame.tsx#L462) | Noa | 2 | ¡A jugar! |
| [ArmoniaDrumGame.tsx:465](../../src/game/ArmoniaDrumGame.tsx#L465) | Noa | 1 | Ensayar |
| [ArmoniaDrumGame.tsx:466](../../src/game/ArmoniaDrumGame.tsx#L466) | Noa | 2 | ¡A jugar! |
| [ArmoniaDrumGame.tsx:469](../../src/game/ArmoniaDrumGame.tsx#L469) | Noa | 2 | ¡A jugar! |
| [ArmoniaDrumGame.tsx:470](../../src/game/ArmoniaDrumGame.tsx#L470) | Noa | 3 | Ensayar otra vez |
| [ArmoniaDrumGame.tsx:473](../../src/game/ArmoniaDrumGame.tsx#L473) | Noa | 4 | Volver a mis amigos |
| [ArmoniaDrumGame.tsx:473](../../src/game/ArmoniaDrumGame.tsx#L473) | Noa | 3 | Continuar la aventura ▶ |
| [ArmoniaDrumGame.tsx:474](../../src/game/ArmoniaDrumGame.tsx#L474) | Noa | 3 | Jugar otra vez |
| [ArmoniaDrumGame.tsx:476](../../src/game/ArmoniaDrumGame.tsx#L476) | Noa | 17 | Si repites todos los golpes sin que se escape ninguno, Armonía te dará su marco de notas. |
| [ArmoniaDrumGame.tsx:478](../../src/game/ArmoniaDrumGame.tsx#L478) | Noa | 3 | Intentar otra vez |
| [ArmoniaDrumGame.tsx:479](../../src/game/ArmoniaDrumGame.tsx#L479) | Noa | 1 | Practicar |
| [ArmoniaDrumGame.tsx:480](../../src/game/ArmoniaDrumGame.tsx#L480) | Noa | 4 | Volver a mis amigos |
| [ArmoniaDrumGame.tsx:480](../../src/game/ArmoniaDrumGame.tsx#L480) | Noa | 3 | Volver al mapa |
| [ArmoniaDrumGame.tsx:482](../../src/game/ArmoniaDrumGame.tsx#L482) | Noa | 10 | Sonido apagado: sigue las huellas, el foco y las luces. |
| [ArmoniaDrumGame.tsx:482](../../src/game/ArmoniaDrumGame.tsx#L482) | Noa | 10 | Sin sonido: sigue las huellas, el foco y las luces. |
| [ArmoniaDrumGame.tsx:483](../../src/game/ArmoniaDrumGame.tsx#L483) | Adultos | 10 | Teclado: Espacio · Mando: botón A · Toca la escena o «¡Golpea!» |
| [ArmoniaDrumGame.tsx:484](../../src/game/ArmoniaDrumGame.tsx#L484) | Noa | 4 | Volver a mis amigos |
| [ArmoniaDrumGame.tsx:484](../../src/game/ArmoniaDrumGame.tsx#L484) | Noa | 3 | Volver al mapa |
| [ArmoniaDrumGame.tsx:489](../../src/game/ArmoniaDrumGame.tsx#L489) | Noa | 2 | Un momento |
| [ArmoniaDrumGame.tsx:489](../../src/game/ArmoniaDrumGame.tsx#L489) | Noa | 3 | ¿Volvemos al mapa? |
| [ArmoniaDrumGame.tsx:490](../../src/game/ArmoniaDrumGame.tsx#L490) | Noa | 13 | Podrás tocar con Armonía otra vez cuando quieras. Tus pegatinas guardadas seguirán contigo. |
| [ArmoniaDrumGame.tsx:491](../../src/game/ArmoniaDrumGame.tsx#L491) | Noa | 2 | Seguir jugando |
| [ArmoniaDrumGame.tsx:492](../../src/game/ArmoniaDrumGame.tsx#L492) | Noa | 4 | Sí, volver al mapa |
| [armoniaDrum.ts:23](../../src/game/armoniaDrum.ts#L23) | Noa | 2 | Golpes sueltos |
| [armoniaDrum.ts:23](../../src/game/armoniaDrum.ts#L23) | Noa | 2 | Golpes seguidos |
| [armoniaDrum.ts:23](../../src/game/armoniaDrum.ts#L23) | Noa | 3 | ¡Todo el compás! |

### Minijuego: merienda de los jabatos

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [MeriendaJabatosGame.tsx:83](../../src/game/MeriendaJabatosGame.tsx#L83) | Noa | 8 | Mira: el Gran Jabalí llama a un jabato. |
| [MeriendaJabatosGame.tsx:83](../../src/game/MeriendaJabatosGame.tsx#L83) | Noa | 6 | ¡Gru! El jabato abre la boca… |
| [MeriendaJabatosGame.tsx:83](../../src/game/MeriendaJabatosGame.tsx#L83) | Noa | 6 | ¡Ahora! Noa le da su bellota. |
| [MeriendaJabatosGame.tsx:83](../../src/game/MeriendaJabatosGame.tsx#L83) | Noa | 5 | ¡GRUUUU! El grande tarda más… |
| [MeriendaJabatosGame.tsx:83](../../src/game/MeriendaJabatosGame.tsx#L83) | Noa | 4 | ¡Castaña para el grande! |
| [MeriendaJabatosGame.tsx:84](../../src/game/MeriendaJabatosGame.tsx#L84) | Noa | 8 | ¡Ahora tú! Escucha la cuenta del Gran Jabalí. |
| [MeriendaJabatosGame.tsx:84](../../src/game/MeriendaJabatosGame.tsx#L84) | Noa | 10 | Cuando la boca esté abierta del todo… ¡dale de comer! |
| [MeriendaJabatosGame.tsx:84](../../src/game/MeriendaJabatosGame.tsx#L84) | Noa | 5 | El grande espera cuatro puntos. |
| [MeriendaJabatosGame.tsx:85](../../src/game/MeriendaJabatosGame.tsx#L85) | Noa | 2 | ¡A merendar! |
| [MeriendaJabatosGame.tsx:89](../../src/game/MeriendaJabatosGame.tsx#L89) | Noa | 1 | ¡Perfecto! |
| [MeriendaJabatosGame.tsx:89](../../src/game/MeriendaJabatosGame.tsx#L89) | Noa | 16 | ¡Ningún jabato se ha quedado con hambre! El Gran Jabalí te regala su marco de bellotas. |
| [MeriendaJabatosGame.tsx:90](../../src/game/MeriendaJabatosGame.tsx#L90) | Noa | 2 | ¡Bien hecho! |
| [MeriendaJabatosGame.tsx:90](../../src/game/MeriendaJabatosGame.tsx#L90) | Noa | 14 | Las bellotas de la rama han pasado la raya dorada. ¡Los jabatos están contentos! |
| [MeriendaJabatosGame.tsx:91](../../src/game/MeriendaJabatosGame.tsx#L91) | Noa | 1 | ¡Casi! |
| [MeriendaJabatosGame.tsx:91](../../src/game/MeriendaJabatosGame.tsx#L91) | Noa | 16 | Las bellotas aún no llegan a la raya dorada. Los jabatos quieren merendar otra vez contigo. |
| [MeriendaJabatosGame.tsx:104](../../src/game/MeriendaJabatosGame.tsx#L104) | Noa | 1 | Cuenta |
| [MeriendaJabatosGame.tsx:104](../../src/game/MeriendaJabatosGame.tsx#L104) | Noa | 1 | ¡Fanfarria! |
| [MeriendaJabatosGame.tsx:112](../../src/game/MeriendaJabatosGame.tsx#L112) | Noa | 2 | ¡Qué rico! |
| [MeriendaJabatosGame.tsx:140](../../src/game/MeriendaJabatosGame.tsx#L140) | Noa | 14 | Los jabatos tienen hambre. Cuando el Gran Jabalí gruña, ¡dales su bellota al compás! |
| [MeriendaJabatosGame.tsx:275](../../src/game/MeriendaJabatosGame.tsx#L275) | Noa | 1 | ¡ÑAM! |
| [MeriendaJabatosGame.tsx:275](../../src/game/MeriendaJabatosGame.tsx#L275) | Noa | 1 | ¡Ñam! |
| [MeriendaJabatosGame.tsx:280](../../src/game/MeriendaJabatosGame.tsx#L280) | Noa | 14 | ¡Las bellotas han pasado la raya dorada! Sigue dando de merendar hasta el final. |
| [MeriendaJabatosGame.tsx:292](../../src/game/MeriendaJabatosGame.tsx#L292) | Noa | 11 | ¡Ya lo has visto! Ahora ensaya tú, o empieza la merienda. |
| [MeriendaJabatosGame.tsx:292](../../src/game/MeriendaJabatosGame.tsx#L292) | Noa | 10 | ¡Buen ensayo! Puedes ensayar otra vez o empezar la merienda. |
| [MeriendaJabatosGame.tsx:313](../../src/game/MeriendaJabatosGame.tsx#L313) | Noa | 9 | Mira cómo Noa da de merendar a los jabatos. |
| [MeriendaJabatosGame.tsx:313](../../src/game/MeriendaJabatosGame.tsx#L313) | Noa | 11 | Cuando el jabato abra la boca del todo, ¡dale de comer! |
| [MeriendaJabatosGame.tsx:399](../../src/game/MeriendaJabatosGame.tsx#L399) | Noa | 1 | ¡Ay! |
| [MeriendaJabatosGame.tsx:401](../../src/game/MeriendaJabatosGame.tsx#L401) | Noa | 12 | Mira los puntos: cuando se encienda la bellota grande, ¡dale de comer! |
| [MeriendaJabatosGame.tsx:448](../../src/game/MeriendaJabatosGame.tsx#L448) | Noa | 2 | Juego amistoso |
| [MeriendaJabatosGame.tsx:448](../../src/game/MeriendaJabatosGame.tsx#L448) | Noa | 3 | Juego del guardián |
| [MeriendaJabatosGame.tsx:449](../../src/game/MeriendaJabatosGame.tsx#L449) | Noa | 5 | La merienda de los jabatos |
| [MeriendaJabatosGame.tsx:450](../../src/game/MeriendaJabatosGame.tsx#L450) | Noa | 19 | Cuando el Gran Jabalí gruña, un jabato asomará con hambre. ¡Dale su bocado cuando abra la boca del todo! |
| [MeriendaJabatosGame.tsx:451](../../src/game/MeriendaJabatosGame.tsx#L451) | Noa | 3 | ★ Reto de amistad: |
| [MeriendaJabatosGame.tsx:482](../../src/game/MeriendaJabatosGame.tsx#L482) | Noa | 5 | ¡Seguimos! El Gran Jabalí cuenta: |
| [MeriendaJabatosGame.tsx:487](../../src/game/MeriendaJabatosGame.tsx#L487) | Oculto | 4 | Avance de la merienda |
| [MeriendaJabatosGame.tsx:493](../../src/game/MeriendaJabatosGame.tsx#L493) | Noa | 3 | ¡Dale de comer! |
| [MeriendaJabatosGame.tsx:494](../../src/game/MeriendaJabatosGame.tsx#L494) | Noa | 2 | Terminar demostración |
| [MeriendaJabatosGame.tsx:495](../../src/game/MeriendaJabatosGame.tsx#L495) | Noa | 2 | Terminar ensayo |
| [MeriendaJabatosGame.tsx:497](../../src/game/MeriendaJabatosGame.tsx#L497) | Noa | 1 | Practicar |
| [MeriendaJabatosGame.tsx:498](../../src/game/MeriendaJabatosGame.tsx#L498) | Noa | 2 | ¡A jugar! |
| [MeriendaJabatosGame.tsx:501](../../src/game/MeriendaJabatosGame.tsx#L501) | Noa | 1 | Ensayar |
| [MeriendaJabatosGame.tsx:502](../../src/game/MeriendaJabatosGame.tsx#L502) | Noa | 2 | ¡A jugar! |
| [MeriendaJabatosGame.tsx:505](../../src/game/MeriendaJabatosGame.tsx#L505) | Noa | 2 | ¡A jugar! |
| [MeriendaJabatosGame.tsx:506](../../src/game/MeriendaJabatosGame.tsx#L506) | Noa | 3 | Ensayar otra vez |
| [MeriendaJabatosGame.tsx:509](../../src/game/MeriendaJabatosGame.tsx#L509) | Noa | 4 | Volver a mis amigos |
| [MeriendaJabatosGame.tsx:509](../../src/game/MeriendaJabatosGame.tsx#L509) | Noa | 3 | Continuar la aventura ▶ |
| [MeriendaJabatosGame.tsx:510](../../src/game/MeriendaJabatosGame.tsx#L510) | Noa | 3 | Jugar otra vez |
| [MeriendaJabatosGame.tsx:512](../../src/game/MeriendaJabatosGame.tsx#L512) | Noa | 24 | Si das de comer a todos los jabatos sin que ninguno se quede con hambre, el Gran Jabalí te dará su marco de bellotas. |
| [MeriendaJabatosGame.tsx:514](../../src/game/MeriendaJabatosGame.tsx#L514) | Noa | 3 | Intentar otra vez |
| [MeriendaJabatosGame.tsx:515](../../src/game/MeriendaJabatosGame.tsx#L515) | Noa | 1 | Practicar |
| [MeriendaJabatosGame.tsx:516](../../src/game/MeriendaJabatosGame.tsx#L516) | Noa | 4 | Volver a mis amigos |
| [MeriendaJabatosGame.tsx:516](../../src/game/MeriendaJabatosGame.tsx#L516) | Noa | 3 | Volver al mapa |
| [MeriendaJabatosGame.tsx:518](../../src/game/MeriendaJabatosGame.tsx#L518) | Noa | 10 | Sonido apagado: sigue los puntos y la boca del jabato. |
| [MeriendaJabatosGame.tsx:518](../../src/game/MeriendaJabatosGame.tsx#L518) | Noa | 10 | Sin sonido: sigue los puntos y la boca del jabato. |
| [MeriendaJabatosGame.tsx:519](../../src/game/MeriendaJabatosGame.tsx#L519) | Adultos | 12 | Teclado: Espacio · Mando: botón A · Toca la escena o «¡Dale de comer!» |
| [MeriendaJabatosGame.tsx:520](../../src/game/MeriendaJabatosGame.tsx#L520) | Noa | 4 | Volver a mis amigos |
| [MeriendaJabatosGame.tsx:520](../../src/game/MeriendaJabatosGame.tsx#L520) | Noa | 3 | Volver al mapa |
| [MeriendaJabatosGame.tsx:525](../../src/game/MeriendaJabatosGame.tsx#L525) | Noa | 2 | Un momento |
| [MeriendaJabatosGame.tsx:525](../../src/game/MeriendaJabatosGame.tsx#L525) | Noa | 3 | ¿Volvemos al mapa? |
| [MeriendaJabatosGame.tsx:526](../../src/game/MeriendaJabatosGame.tsx#L526) | Noa | 16 | Podrás volver a dar de merendar a los jabatos cuando quieras. Tus pegatinas guardadas seguirán contigo. |
| [MeriendaJabatosGame.tsx:527](../../src/game/MeriendaJabatosGame.tsx#L527) | Noa | 2 | Seguir jugando |
| [MeriendaJabatosGame.tsx:528](../../src/game/MeriendaJabatosGame.tsx#L528) | Noa | 4 | Sí, volver al mapa |
| [meriendaJabatos.ts:23](../../src/game/meriendaJabatos.ts#L23) | Noa | 1 | ¡Gru! |
| [meriendaJabatos.ts:24](../../src/game/meriendaJabatos.ts#L24) | Noa | 1 | ¡GRUUUU! |
| [meriendaJabatos.ts:25](../../src/game/meriendaJabatos.ts#L25) | Noa | 1 | ¡Gru-gru! |
| [meriendaJabatos.ts:28](../../src/game/meriendaJabatos.ts#L28) | Noa | 2 | Bellotas tranquilas |
| [meriendaJabatos.ts:28](../../src/game/meriendaJabatos.ts#L28) | Noa | 3 | ¡Llega el grande! |
| [meriendaJabatos.ts:28](../../src/game/meriendaJabatos.ts#L28) | Noa | 2 | ¡Merienda glotona! |

### Minijuego: fiesta de los gatitos

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [CatPartyGame.tsx:66](../../src/game/CatPartyGame.tsx#L66) | Noa | 5 | Mira cómo lo hace Noa. |
| [CatPartyGame.tsx:66](../../src/game/CatPartyGame.tsx#L66) | Noa | 4 | Tronco pequeño: un golpe. |
| [CatPartyGame.tsx:66](../../src/game/CatPartyGame.tsx#L66) | Noa | 5 | Tronco mediano: dos golpes seguidos. |
| [CatPartyGame.tsx:66](../../src/game/CatPartyGame.tsx#L66) | Noa | 7 | El ovillo no se corta: déjalo pasar. |
| [CatPartyGame.tsx:67](../../src/game/CatPartyGame.tsx#L67) | Noa | 4 | ¡Ensayamos! Escucha la cuenta. |
| [CatPartyGame.tsx:67](../../src/game/CatPartyGame.tsx#L67) | Noa | 7 | Golpea cuando el tronco llegue al tajo. |
| [CatPartyGame.tsx:68](../../src/game/CatPartyGame.tsx#L68) | Noa | 4 | ¡Que empiece la fiesta! |
| [CatPartyGame.tsx:86](../../src/game/CatPartyGame.tsx#L86) | Noa | 3 | ¡Es mi ovillo! |
| [CatPartyGame.tsx:87](../../src/game/CatPartyGame.tsx#L87) | Noa | 1 | ¡plop! |
| [CatPartyGame.tsx:87](../../src/game/CatPartyGame.tsx#L87) | Noa | 1 | ¡miau! |
| [CatPartyGame.tsx:101](../../src/game/CatPartyGame.tsx#L101) | Noa | 1 | ¡miau! |
| [CatPartyGame.tsx:118](../../src/game/CatPartyGame.tsx#L118) | Noa | 14 | Bruma y sus amigos necesitan leña para la fiesta. ¿Ayudas a Noa a cortarla? |
| [CatPartyGame.tsx:246](../../src/game/CatPartyGame.tsx#L246) | Noa | 1 | ¡Toc! |
| [CatPartyGame.tsx:252](../../src/game/CatPartyGame.tsx#L252) | Noa | 7 | ¡Toc! Un tronco más para la hoguera. |
| [CatPartyGame.tsx:252](../../src/game/CatPartyGame.tsx#L252) | Noa | 7 | ¡Toc, toc! El tronco mediano está listo. |
| [CatPartyGame.tsx:253](../../src/game/CatPartyGame.tsx#L253) | Noa | 4 | ¡Toc! Falta otro golpe. |
| [CatPartyGame.tsx:256](../../src/game/CatPartyGame.tsx#L256) | Noa | 1 | ¡Boing! |
| [CatPartyGame.tsx:258](../../src/game/CatPartyGame.tsx#L258) | Noa | 7 | Era el ovillo. ¡Déjalo pasar sin golpear! |
| [CatPartyGame.tsx:261](../../src/game/CatPartyGame.tsx#L261) | Noa | 1 | ¡Uy! |
| [CatPartyGame.tsx:262](../../src/game/CatPartyGame.tsx#L262) | Noa | 8 | Espera a que el tronco llegue al tajo. |
| [CatPartyGame.tsx:271](../../src/game/CatPartyGame.tsx#L271) | Noa | 8 | ¡La hoguera ya brilla! Gracias por la leña. |
| [CatPartyGame.tsx:272](../../src/game/CatPartyGame.tsx#L272) | Noa | 10 | ¡Ya lo has visto! Puedes ensayar o empezar la canción. |
| [CatPartyGame.tsx:272](../../src/game/CatPartyGame.tsx#L272) | Noa | 10 | ¡Buen ensayo! Puedes ensayar otra vez o empezar la canción. |
| [CatPartyGame.tsx:292](../../src/game/CatPartyGame.tsx#L292) | Noa | 5 | Mira cómo lo hace Noa. |
| [CatPartyGame.tsx:292](../../src/game/CatPartyGame.tsx#L292) | Noa | 11 | Escucha la cuenta y golpea cuando el tronco llegue al tajo. |
| [CatPartyGame.tsx:342](../../src/game/CatPartyGame.tsx#L342) | Noa | 3 | Se fue rodando |
| [CatPartyGame.tsx:343](../../src/game/CatPartyGame.tsx#L343) | Noa | 9 | Faltó el segundo golpe. ¡No pasa nada, viene otro! |
| [CatPartyGame.tsx:343](../../src/game/CatPartyGame.tsx#L343) | Noa | 7 | No pasa nada. ¡Ya viene otro tronco! |
| [CatPartyGame.tsx:377](../../src/game/CatPartyGame.tsx#L377) | Noa | 5 | El Bosque de los Gatitos |
| [CatPartyGame.tsx:377](../../src/game/CatPartyGame.tsx#L377) | Noa | 5 | La fiesta de los gatitos |
| [CatPartyGame.tsx:379](../../src/game/CatPartyGame.tsx#L379) | Noa | 2 | Sonido apagado |
| [CatPartyGame.tsx:379](../../src/game/CatPartyGame.tsx#L379) | Noa | 1 | Silenciar |
| [CatPartyGame.tsx:380](../../src/game/CatPartyGame.tsx#L380) | Noa | 1 | Pausa |
| [CatPartyGame.tsx:381](../../src/game/CatPartyGame.tsx#L381) | Noa | 3 | Volver al mapa |
| [CatPartyGame.tsx:396](../../src/game/CatPartyGame.tsx#L396) | Noa | 1 | ¡Ahora! |
| [CatPartyGame.tsx:417](../../src/game/CatPartyGame.tsx#L417) | Oculto | 4 | Avance de la canción |
| [CatPartyGame.tsx:420](../../src/game/CatPartyGame.tsx#L420) | Noa | 1 | ¡Golpea! |
| [CatPartyGame.tsx:421](../../src/game/CatPartyGame.tsx#L421) | Noa | 2 | Terminar demostración |
| [CatPartyGame.tsx:422](../../src/game/CatPartyGame.tsx#L422) | Noa | 2 | Terminar ensayo |
| [CatPartyGame.tsx:424](../../src/game/CatPartyGame.tsx#L424) | Noa | 3 | Jugar otra vez |
| [CatPartyGame.tsx:424](../../src/game/CatPartyGame.tsx#L424) | Noa | 3 | Empezar la canción |
| [CatPartyGame.tsx:425](../../src/game/CatPartyGame.tsx#L425) | Noa | 3 | Ver la demostración |
| [CatPartyGame.tsx:425](../../src/game/CatPartyGame.tsx#L425) | Noa | 1 | Ensayar |
| [CatPartyGame.tsx:428](../../src/game/CatPartyGame.tsx#L428) | Noa | 9 | Sin sonido: sigue los farolillos y el aro dorado. |
| [catParty.ts:37](../../src/game/catParty.ts#L37) | Noa | 1 | Cuenta |
| [catParty.ts:37](../../src/game/catParty.ts#L37) | Noa | 2 | Primeros troncos |
| [catParty.ts:37](../../src/game/catParty.ts#L37) | Noa | 2 | Troncos pequeños |
| [catParty.ts:38](../../src/game/catParty.ts#L38) | Noa | 2 | Troncos medianos |
| [catParty.ts:38](../../src/game/catParty.ts#L38) | Noa | 4 | Cuidado con los ovillos |
| [catParty.ts:38](../../src/game/catParty.ts#L38) | Noa | 1 | ¡Fiesta! |
| [catParty.ts:51](../../src/game/catParty.ts#L51) | Noa | 1 | Cuenta |
| [catParty.ts:51](../../src/game/catParty.ts#L51) | Noa | 1 | Ensayo |
| [catParty.ts:58](../../src/game/catParty.ts#L58) | Noa | 1 | Cuenta |
| [catParty.ts:58](../../src/game/catParty.ts#L58) | Noa | 1 | Demostración |

### Fiesta de los gatitos

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [App.tsx:824](../../src/App.tsx#L824) | Noa | 3 | Preparando la fiesta… |

### Minijuego: avioneta

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [AvionetaGame.tsx:149](../../src/game/AvionetaGame.tsx#L149) | Noa | 2 | ★ {…} / {…} |
| [AvionetaGame.tsx:156](../../src/game/AvionetaGame.tsx#L156) | Noa | 7 | ¡La Reina Arcoíris te regala su avioneta! |
| [AvionetaGame.tsx:156](../../src/game/AvionetaGame.tsx#L156) | Noa | 5 | ¡Lanza pompas a los nubarrones! |
| [AvionetaGame.tsx:230](../../src/game/AvionetaGame.tsx#L230) | Oculto | 5 | La avioneta de las nubes |
| [AvionetaGame.tsx:231](../../src/game/AvionetaGame.tsx#L231) | Oculto | 13 | Cielo de la avioneta: mueve la avioneta y lanza pompas a los nubarrones |
| [AvionetaGame.tsx:232](../../src/game/AvionetaGame.tsx#L232) | Noa | 3 | Volver al mapa |
| [AvionetaGame.tsx:234](../../src/game/AvionetaGame.tsx#L234) | Noa | 4 | Mover a la izquierda |
| [AvionetaGame.tsx:235](../../src/game/AvionetaGame.tsx#L235) | Noa | 2 | Lanzar pompa |
| [AvionetaGame.tsx:236](../../src/game/AvionetaGame.tsx#L236) | Noa | 4 | Mover a la derecha |
| [AvionetaGame.tsx:240](../../src/game/AvionetaGame.tsx#L240) | Noa | 3 | ¡Todas las estrellas! |
| [AvionetaGame.tsx:240](../../src/game/AvionetaGame.tsx#L240) | Noa | 4 | ¡Has cruzado el arcoíris! |
| [AvionetaGame.tsx:241](../../src/game/AvionetaGame.tsx#L241) | Noa | 2 | Has recogido |
| [AvionetaGame.tsx:241](../../src/game/AvionetaGame.tsx#L241) | Noa | 3 | ¡Nueva mejor marca! |
| [AvionetaGame.tsx:242](../../src/game/AvionetaGame.tsx#L242) | Noa | 3 | Volver al mapa |

### Avioneta

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [App.tsx:812](../../src/App.tsx#L812) | Noa | 3 | Preparando la avioneta… |

### Ajustes

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [App.tsx:982](../../src/App.tsx#L982) | Oculto | 1 | Cerrar |
| [App.tsx:983](../../src/App.tsx#L983) | Adultos | 3 | A tu manera |
| [App.tsx:983](../../src/App.tsx#L983) | Adultos | 3 | Ajustes de juego |
| [App.tsx:984](../../src/App.tsx#L984) | Adultos | 7 | Estos ajustes se guardan en este dispositivo. |
| [App.tsx:986](../../src/App.tsx#L986) | Adultos | 1 | Música |
| [App.tsx:988](../../src/App.tsx#L988) | Adultos | 1 | Efectos |
| [App.tsx:991](../../src/App.tsx#L991) | Adultos | 2 | Movimiento tranquilo |
| [App.tsx:991](../../src/App.tsx#L991) | Adultos | 5 | Reduce destellos y animaciones rápidas. |
| [App.tsx:992](../../src/App.tsx#L992) | Adultos | 2 | Controles táctiles |
| [App.tsx:993](../../src/App.tsx#L993) | Adultos | 3 | Automáticos en móvil |
| [App.tsx:994](../../src/App.tsx#L994) | Adultos | 2 | Siempre visibles |
| [App.tsx:996](../../src/App.tsx#L996) | Adultos | 1 | Teclado: |
| [App.tsx:996](../../src/App.tsx#L996) | Adultos | 1 | Mando: |
| [App.tsx:997](../../src/App.tsx#L997) | Adultos | 1 | Listo |

### Créditos

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [App.tsx:1025](../../src/App.tsx#L1025) | Oculto | 1 | Cerrar |
| [App.tsx:1026](../../src/App.tsx#L1026) | Adultos | 3 | Hecho con cariño |
| [App.tsx:1026](../../src/App.tsx#L1026) | Adultos | 1 | Créditos |
| [App.tsx:1027](../../src/App.tsx#L1027) | Adultos | 2 | Super Noa |
| [App.tsx:1028](../../src/App.tsx#L1028) | Adultos | 19 | Personaje creado para este proyecto a partir de referencias privadas. Las fotografías originales no forman parte de la web. |
| [App.tsx:1029](../../src/App.tsx#L1029) | Adultos | 11 | Todas las aventuras tienen una melodía diferente. Algunas pistas proceden de |
| [App.tsx:1029](../../src/App.tsx#L1029) | Adultos | 2 | Platformer Chiptunes |
| [App.tsx:1029](../../src/App.tsx#L1029) | Adultos | 16 | , de Guy G. Gamerson, publicado con licencia CC0; las demás son composiciones originales para Super Noa. |
| [App.tsx:1030](../../src/App.tsx#L1030) | Adultos | 34 | Los guardianes finales y las miniaturas pixel art de los mundos son diseños originales generados para este proyecto. Efectos de sonido generados en el navegador; escenarios jugables, interfaz y código creados para Super Noa. |
| [App.tsx:1031](../../src/App.tsx#L1031) | Adultos | 1 | Cerrar |

### Tablón mundial

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [ranking.ts:8](../../src/game/ranking.ts#L8) | Adultos | 15 | No puedo conectar con el ranking. Tu aventura sigue guardada aquí. Puedes volver a intentarlo. |
| [App.tsx:1111](../../src/App.tsx#L1111) | Oculto | 1 | Cerrar |
| [App.tsx:1114](../../src/App.tsx#L1114) | Adultos | 3 | Aventureras y aventureros |
| [App.tsx:1114](../../src/App.tsx#L1114) | Adultos | 5 | Tu alias para la aventura |
| [App.tsx:1114](../../src/App.tsx#L1114) | Adultos | 2 | Tablón mundial |
| [App.tsx:1116](../../src/App.tsx#L1116) | Adultos | 15 | Antes de jugar, elige un alias de fantasía para guardar tus logros en el tablón. |
| [App.tsx:1117](../../src/App.tsx#L1117) | Adultos | 4 | Tu alias de aventura |
| [App.tsx:1117](../../src/App.tsx#L1117) | Adultos | 3 | Por ejemplo, Moche |
| [App.tsx:1117](../../src/App.tsx#L1117) | Adultos | 3 | Preparando tu tarjeta… |
| [App.tsx:1117](../../src/App.tsx#L1117) | Adultos | 3 | Reintentar mi tarjeta |
| [App.tsx:1117](../../src/App.tsx#L1117) | Adultos | 4 | Guardar alias y jugar |
| [App.tsx:1117](../../src/App.tsx#L1117) | Adultos | 3 | ¡Salir al tablón! |
| [App.tsx:1117](../../src/App.tsx#L1117) | Adultos | 12 | Solo compartimos tu alias y tus logros. No pongas tu nombre real. |
| [App.tsx:1117](../../src/App.tsx#L1117) | Adultos | 8 | Recuperaremos tu tarjeta pendiente con el mismo alias. |
| [App.tsx:1117](../../src/App.tsx#L1117) | Adultos | 1 | ¡Hola, |
| [App.tsx:1117](../../src/App.tsx#L1117) | Adultos | 7 | Tus logros ya están en el tablón. |
| [App.tsx:1117](../../src/App.tsx#L1117) | Adultos | 3 | Envío pendiente. {…} |
| [App.tsx:1117](../../src/App.tsx#L1117) | Adultos | 3 | Enviando tus logros… |
| [App.tsx:1119](../../src/App.tsx#L1119) | Adultos | 22 | No podemos guardar tu tarjeta en este navegador. Puedes permitir el almacenamiento y reintentar, o jugar sin conexión al tablón por ahora. |
| [App.tsx:1119](../../src/App.tsx#L1119) | Adultos | 9 | El navegador no permite guardar tu tarjeta del ranking. |
| [App.tsx:1119](../../src/App.tsx#L1119) | Adultos | 4 | Jugar sin guardar tarjeta |
| [App.tsx:1124](../../src/App.tsx#L1124) | Adultos | 2 | Puesto {…} |
| [App.tsx:1126](../../src/App.tsx#L1126) | Adultos | 1 | Tú |
| [App.tsx:1127](../../src/App.tsx#L1127) | Adultos | 1 | 🌍 Etapa |
| [App.tsx:1127](../../src/App.tsx#L1127) | Adultos | 3 | Total sin datos |
| [App.tsx:1127](../../src/App.tsx#L1127) | Adultos | 5 | Fecha del progreso: sin datos |
| [App.tsx:1127](../../src/App.tsx#L1127) | Adultos | 4 | Progreso logrado el {…})} |
| [App.tsx:1131](../../src/App.tsx#L1131) | Adultos | 9 | Aún no hay nadie. ¡Puedes ser la primera aventurera! |
| [App.tsx:1132](../../src/App.tsx#L1132) | Adultos | 1 | Actualizando… |
| [App.tsx:1132](../../src/App.tsx#L1132) | Adultos | 2 | Actualizar tablón |

### Avisos generales

| Dónde | Público | Palabras | Texto |
|---|---|---:|---|
| [App.tsx:154](../../src/App.tsx#L154) | Adultos | 18 | {…} Puedes seguir jugando. Te pediremos un alias cuando vuelva el tablón, en el mapa o al inicio. |
| [App.tsx:197](../../src/App.tsx#L197) | Adultos | 5 | El tablón no está disponible. |
| [App.tsx:256](../../src/App.tsx#L256) | Adultos | 5 | El tablón no está disponible. |
| [App.tsx:290](../../src/App.tsx#L290) | Adultos | 5 | No pude enviar tus logros. |
| [App.tsx:320](../../src/App.tsx#L320) | Adultos | 13 | La música no ha podido sonar. Prueba a activar el sonido otra vez. |
| [App.tsx:505](../../src/App.tsx#L505) | Adultos | 5 | No pude actualizar el tablón. |
| [App.tsx:527](../../src/App.tsx#L527) | Adultos | 6 | ¡Hola, {…}! Tu tarjeta está lista. |
| [App.tsx:533](../../src/App.tsx#L533) | Adultos | 5 | No pude guardar ese alias. |
| [App.tsx:744](../../src/App.tsx#L744) | Adultos | 27 | ¿Empezar de nuevo? Se borrarán las pantallas, las pegatinas y los jefes amigos guardados. Tu alias, las manzanas de toda la aventura y su fecha se conservan. |
| [App.tsx:759](../../src/App.tsx#L759) | Adultos | 19 | No se pudo guardar la partida en este dispositivo. Puedes seguir jugando, pero el progreso podría perderse al cerrar. |
| [App.tsx:760](../../src/App.tsx#L760) | Adultos | 6 | Conectando el tablón en segundo plano… |
| [App.tsx:762](../../src/App.tsx#L762) | Adultos | 6 | Tus logros del tablón están pendientes. |
| [App.tsx:762](../../src/App.tsx#L762) | Adultos | 11 | Puedes seguir jugando, aunque este navegador no pudo guardar la partida. |
| [App.tsx:762](../../src/App.tsx#L762) | Adultos | 7 | Tu partida sigue guardada en este dispositivo. |
| [App.tsx:762](../../src/App.tsx#L762) | Adultos | 2 | Reintentar envío |
