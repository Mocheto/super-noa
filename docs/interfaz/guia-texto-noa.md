# Guía de escritura del texto para Noa

Resolución de [Guía de escritura del texto para Noa](https://github.com/Mocheto/super-noa/issues/103), en el mapa [Una interfaz para aprender a leer: HUD, menús, marcos y textos para Noa](https://github.com/Mocheto/super-noa/issues/99). Parte del [inventario de textos](inventario-textos.md).

Los emoji de esta guía marcan el pictograma que debe acompañar a la palabra. Son provisionales hasta que exista el atlas de pictogramas ([Palabras con dibujo y estilo del atlas de pictogramas](https://github.com/Mocheto/super-noa/issues/104)).

## Las dos capas

Cada texto de las pantallas de Noa tiene una o dos capas:

| Capa | Para quién | Cómo se escribe | Dónde aparece |
|---|---|---|---|
| **Rótulo** | Noa, que está aprendiendo a leer | MAYÚSCULAS sin tildes ni diéresis, de 1 a 4 palabras, con pictograma, fuente Press Start 2P | Siempre |
| **Para leer juntos** | La persona adulta que lee en voz alta | Frase normal con minúsculas y tildes, en letra del sistema, más pequeña y debajo del rótulo | Solo donde aporta algo |

- **Sin «para leer juntos»**: botones, HUD, carteles dibujados en el lienzo durante la partida y minijuegos mientras suena la música. En los duelos y minijuegos solo aparece en la explicación previa, antes de empezar.
- **Siempre visible**: «para leer juntos» no tiene ajuste para ocultarlo.
- **Otros textos para adultos** (ajustes, créditos, tablón, avisos de guardado o conexión, ayuda de teclado y mando) siguen como están. Esta guía no los toca.
- **Texto oculto para lector de pantalla** (`aria-label`, `alt`, avisos de la partida): frase normal y breve, con tildes. No es rótulo.

## Reglas del rótulo

1. **MAYÚSCULAS sin tildes ni diéresis**: COMO, CAMION, PINGUINO, ARMONIA. La Ñ y los signos ¡ ¿ se mantienen. El texto se escribe así en los datos; no se convierte a mayúsculas con CSS.
2. **De 1 a 4 palabras.** El pictograma no cuenta como palabra, y una cifra sí cuenta. Si no cabe, el resto pasa a «para leer juntos» o desaparece.
3. **Habla de tú a Noa**: imperativos (¡SALTA!, ¡SIGUE!, BUSCA) o exclamaciones (¡MUY BIEN!). Nada de narrador en tercera persona («Noa ha recogido»). Cuando hace falta género, femenino: ¡LISTA!
4. **Una idea por rótulo.** Sin dos puntos, puntos medios ni barras: «ZZZ: PASA · ¡OJO AL DESPERTAR!» se parte en dos rótulos o se queda en uno.
5. **Exclamaciones solo en elogios y avisos.** Los nombres, títulos y botones normales van sin ¡!
6. **Sin abreviaturas** (IZQ., DER.) **ni puntos suspensivos.**
7. **Pictograma delante de la palabra**: 🍎 MANZANA, ❤ 3. Una palabra de la lista base que tiene dibujo lo lleva siempre, y siempre el mismo.
8. **Nombres propios** sin tildes en el rótulo (ARMONIA, PAPA NOEL, REINA ARCOIRIS) y con tildes en «para leer juntos».

## Números y contadores

- **Contadores** (vidas, manzanas, pegatinas, estrellas): pictograma y cifra. ❤ 3, 🍎 1, ⭐ 12/51. La barra se admite solo en la colección, donde el total importa al adulto.
- **Avance pequeño (hasta 5)**: puntos, sin palabras. «Bandera 2/3» pasa a «🚩 ●●○», y «Sala 1/4» a «🚪 ●○○○».
- **Número de pantalla**: tal cual (1-2, S-1, A-1), junto al pictograma del mundo.
- **Cifras con dígitos**, nunca escritas con letras: 3 VECES, no TRES VECES.

## Títulos de mundo y pantalla

- **Mundo**: el nombre corto de `worldMapData` en mayúsculas sin tildes. Por ejemplo, «El Prado de las Manzanas» pasa a «🍎 MANZANOS». El nombre largo se convierte en «para leer juntos» en la tarjeta del mapa.
- **Pantalla**: número más pictograma del mundo más una o dos palabras sin artículos. Por ejemplo, «El jardín de los erizos» pasa a «🦔 1-2 ERIZOS». El título largo queda como «para leer juntos» en la tarjeta.
- **HUD**: solo pictograma y número (🌲 1-2), sin el nombre.

## Lista base de palabras

Lista cerrada. Una palabra nueva entra solo si llega con su pictograma, y entonces se añade aquí. Los nombres propios de personajes y mundos no ocupan sitio en la lista.

| Grupo | Palabras |
|---|---|
| Verbos (imperativo) | SALTA, CORRE, CAMINA, NADA, SUBE, BAJA, TOCA, MIRA, BUSCA, SIGUE, JUEGA, VUELVE, ESPERA, PASA, ENTRA, SAL, ABRE, LANZA, CORTA, DA, GOLPEA, ELIGE, GUARDA, EMPIEZA, PRUEBA, ESCUCHA, SALUDA, ACARICIA |
| Partida | VIDAS, MANZANA, GATO, GATITO, LANA, PEGATINA, ESTRELLA, CAJA, BANDERA, META, CAMINO, PUERTA, SALA, LLAVE, NUBE, AGUA, LAVA, HIELO, AIRE, FLOR, PINCHOS |
| Lugares y menús | MAPA, MUNDO, PANTALLA, INICIO, ALBUM, AMIGOS, JEFES, POSTAL, SECRETO, FIESTA, TIENDA, PASEO |
| Controles | JUGAR, PAUSA, SONIDO, SIN SONIDO, CERRAR, SEGUIR, OTRA VEZ, ATRAS, ARRIBA, ABAJO, IZQUIERDA, DERECHA |
| Elogios y avisos | ¡BIEN!, ¡MUY BIEN!, ¡BRAVO!, ¡GENIAL!, ¡CASI!, ¡OJO!, ¡CUIDADO!, ¡HOLA!, ¡ADIOS! |
| Pequeñas | SI, NO, MAS, OTRO, OTRA, TODO, NUEVO, NUEVA, CERRADO, LISTA, AQUI, YA, DE, Y, EN, AL, LA, EL, LOS, LAS, UN, UNA, TU, SU, CON, SIN, POR |
| Animales del juego | ABEJA, LOBO, JABALI, PERRITO, PEZ, ERIZO, LORO, DINO, DRAGON, PINGUINO |

## Reescritura de la interfaz

Formato de la columna nueva: **rótulo** · _para leer juntos_ (si lo hay). «—» significa que el texto desaparece o pasa a ser solo pictograma.

### Inicio

| Dónde | Ahora | Nuevo |
|---|---|---|
| App.tsx:767 | Una aventura pixel art | — |
| App.tsx:768 | SUPER NOA | **SUPER NOA** |
| App.tsx:769 | Corre, salta y explora castillos, volcanes… ¡Los gatitos te esperan! | **¡CORRE Y SALTA!** · _Explora castillos, volcanes, trenes y un cielo lleno de nubes. ¡Los gatitos te esperan!_ |
| App.tsx:770 | Una gran aventura para pequeñas heroínas | — |
| App.tsx:771 | Nuevas aventuras: El Tren de las Estaciones · … | **✨ MUNDOS NUEVOS** · _El Tren de las Estaciones, el Reino de la Música y el Reino Celeste._ |
| App.tsx:773 | ▶ ¡Jugar ahora! | **▶ ¡A JUGAR!** |
| App.tsx:774 | ¿Cómo se juega? | **❓ ¿COMO SE JUEGA?** |
| App.tsx:782 | Sonido / Activar sonido | **🔊 SONIDO** / **🔇 SIN SONIDO** |
| App.tsx:783 | Álbum | **📒 ALBUM** |
| App.tsx:784 | Jefes amigos | **👑 JEFES** |

### Mapa

| Dónde | Ahora | Nuevo |
|---|---|---|
| App.tsx:795 | Elige una pantalla / El mapa de Noa | **🗺 MAPA** · _Elige una pantalla._ |
| App.tsx:805 | Preparando el mapa… | **🗺 ESPERA** |
| WorldMap.tsx:181 | Arrastra el mapa para explorar. Junta o separa dos dedos… | **👆 MUEVE EL MAPA** · _Arrastra con un dedo. Junta o separa dos dedos para acercar o alejar. Toca un mundo._ |
| WorldMap.tsx:185 | Mapa | **🗺 MAPA** |
| WorldMap.tsx:186 | Lista | **📋 LISTA** |
| WorldMap.tsx:191 | Ver todo | **🔍 TODO** |
| WorldMap.tsx:192 | Volver a Noa | **👧 NOA** |
| WorldMap.tsx:212 | Explorar {mundo} | **▶ {MUNDO}** |
| WorldMap.tsx:219 | Noa está en {mundo} | **👧 {MUNDO}** |
| WorldMap.tsx:257 | La avioneta de las nubes: mejor marca {n} de {total} estrellas | **✈ ⭐ {n}** · _La avioneta de las nubes: mejor marca, {n} de {total} estrellas._ |
| WorldMap.tsx:268–269 | Paseo de los amigos de {mundo} / Paseo | **🐾 PASEO** |
| WorldMap.tsx:284 | Mundo secreto / Mundo del agua / Mundo {n} | **✨ SECRETO** / **💧 AGUA** / **MUNDO {n}** |
| WorldMap.tsx:287 | Todavía cerrado | **🔒 CERRADO** |
| WorldMap.tsx:289 | Noa está aquí | **👧 AQUI** |
| WorldMap.tsx:294 | Noa va de camino… / Noa está en | **👧 ➜** / **👧 AQUI** |
| WorldMap.tsx:295 | ¡Un camino nuevo! | **✨ ¡CAMINO NUEVO!** |
| WorldMap.tsx:309 | Progreso de {mundo} | **{MUNDO}** con puntos de avance |
| WorldMap.tsx:310 | ✉ Postal lista / ✉ Busca su recuerdo | **✉ ¡POSTAL!** / **✉ BUSCA LA POSTAL** |
| WorldMap.tsx:312 | · Amigo | **🐾 AMIGO** |
| WorldMap.tsx:314 | Sigue explorando. ¡Hay sorpresas por descubrir! | **🔍 ¡SIGUE BUSCANDO!** · _Hay sorpresas por descubrir._ |
| WorldMap.tsx:314 | Busca la poza azul en el bosque de los lobos. | **💧 BUSCA LA POZA** · _Busca la poza azul en el bosque de los lobos._ |
| WorldMap.tsx:314 | Completa las pantallas anteriores para llegar hasta aquí. | **🔒 JUEGA ANTES OTRAS** · _Completa las pantallas anteriores para llegar hasta aquí._ |
| WorldMap.tsx:324 | Jugar a la fiesta | **🎉 FIESTA** |

### Tarjetas de pantalla y objetivos

| Dónde | Ahora | Nuevo |
|---|---|---|
| LevelSelectCard.tsx:81 | Una sorpresa te espera | **🎁 ¡SORPRESA!** |
| LevelSelectCard.tsx:82 | ✓ Completada · | **✓** |
| LevelSelectCard.tsx:83 | Lista para jugar | **▶ JUGAR** |
| LevelSelectCard.tsx:83 | Busca la poza azul en 3-3 | **💧 POZA EN 3-3** |
| LevelSelectCard.tsx:83 | Completa la anterior | **🔒 JUEGA LA OTRA** |
| LevelSelectCard.tsx:97 | Falta 1 / Faltan {n} | puntos de objetivos (●●○) |
| LevelSelectCard.tsx:97 | ¡Todo conseguido! | **⭐ ¡TODO!** |
| LevelSelectCard.tsx:98 | Objetivos de {pantalla} | oculto: «Objetivos de {pantalla}» |
| levelObjectives.ts:30–31 | Llegar al final · Sigue el camino hasta la meta. | **🏁 META** · _Sigue el camino hasta la meta._ |
| levelObjectives.ts:31 | El perrito avisa antes de correr. Su cadena tiene un límite… | **🐶 META** · _El perrito avisa antes de correr. Su cadena no llega lejos: espera o pasa por arriba._ |
| levelObjectives.ts:35–37 | Pegatina · Explora las plataformas de esta pantalla. | **✨ PEGATINA** · _Mira en las plataformas de arriba._ |
| levelObjectives.ts:40 | Sin perder vidas · Llega a la meta sin perder ninguna vida… | **❤ SIN CAER** · _Llega a la meta sin perder ninguna vida. Puedes intentarlo otra vez._ |
| levelObjectives.ts:42 | Reto del guardián | **👑 RETO** |

### HUD y partida

| Dónde | Ahora | Nuevo |
|---|---|---|
| App.tsx:842 | {id} {título de pantalla} | **{pictograma del mundo} {id}** (sin título) |
| App.tsx:844–846 | ❤ × 3 · 🍎 × 1 · ✨ × 2 | **❤ 3** · **🍎 1** · **✨ 2** |
| App.tsx:847 | ★ Estelar / Gato / Protegida / Noa | **⭐** / **🐱** / **🍎** / — (solo pictograma del poder) |
| App.tsx:850 | Activar sonido / Silenciar | 🔊 / 🔇 (botón con pictograma; oculto: «Activar sonido», «Quitar sonido») |
| App.tsx:851–852 | ⛶ / Ⅱ | pictogramas de pantalla completa y pausa |
| App.tsx:855, 860 | Preparando la aventura… / Preparando al guardián… | **⏳ ESPERA** |
| App.tsx:858 | Camino opcional / Paseo de los amigos | **✦ SECRETO** / **🐾 PASEO** |
| App.tsx:858 | Sala {n}/{total} / Bandera {n}/{total} | **🚪 ●○○○** / **🚩 ●●○** |

### Controles táctiles

| Dónde | Ahora | Nuevo |
|---|---|---|
| TouchControls.tsx:31 | IZQ. | **◀** (solo pictograma) |
| TouchControls.tsx:32 | DER. | **▶** (solo pictograma) |
| TouchControls.tsx:35 | LANA | **🧶 LANA** |
| TouchControls.tsx:36 | SALTAR | **↑ SALTA** |

### Carteles del lienzo

| Dónde | Ahora | Nuevo |
|---|---|---|
| GameCanvas.tsx:106 | ¡PRUEBA EL DOBLE SALTO! | **↑↑ ¡DOBLE SALTO!** |
| GameCanvas.tsx:109 | TOCA SALTAR ↑ Y EN EL AIRE ↑ OTRA VEZ | **↑ Y OTRA VEZ ↑** |
| GameCanvas.tsx:119, 332 | Entrar / Explorar / Subir / Activar | **ENTRA** / **ENTRA** / **SUBE** / **TOCA** |
| GameCanvas.tsx:654 | ¡Aquí no muerde! {nombre} | **😊 ¡NO MUERDE!** |
| GameCanvas.tsx:1029 | ¡MIRA EL RITMO DE LA LAVA! | **🌋 ¡OJO, LAVA!** |
| GameCanvas.tsx:1029 | ¡CAE SOBRE EL ROCÍO PARA REBOTAR! | **💧 SALTA EN LA GOTA** |
| GameCanvas.tsx:1029 | ¡SALTA SOBRE EL REGALO DE LA FLECHA! | **🎁 SALTA EN EL REGALO** |
| GameCanvas.tsx:1029 | ¡LA ARENA TE AYUDA A SUBIR! | **⏫ LA ARENA SUBE** |
| GameCanvas.tsx:1029 | ¡LOS VAGONES TE LLEVAN! | **🚃 SUBE AL TREN** |
| GameCanvas.tsx:1029 | ¡SIGUE LAS ONDAS DE LA MÚSICA! | **🎵 SIGUE LA MUSICA** |
| GameCanvas.tsx:1029 | ¡EL HIELO RESBALA Y EL VIENTO EMPUJA! | **🧊 ¡CUIDADO, HIELO!** |
| GameCanvas.tsx:1035 | ZZZ: PASA · ¡OJO AL DESPERTAR! | **💤 PASA AHORA** |
| GameCanvas.tsx:1036 | PÉTALOS ROSAS: PASA · AMARILLOS: ¡SE CIERRA! | **🌸 ROSA: PASA** (el amarillo ya lo avisa ¡SE CIERRA!) |
| GameCanvas.tsx:1037 | ¡EL PERRITO AVISA! PASA POR ARRIBA | **🐶 PASA POR ARRIBA** |
| GameCanvas.tsx:1038 | ¡SALTA CUANDO EL COMPÁS SE ILUMINE! | **🎵 SALTA CON LA LUZ** |
| GameCanvas.tsx:1039 | ↑ EL AIRE TE AYUDA A SUBIR ↑ | **💨 ↑ AIRE ↑** |
| GameCanvas.tsx:1108 | ¿QUÉ ESCONDE ESTE BLOQUE? | **📦 ¿QUE HAY?** |
| GameCanvas.tsx:1108 | ¡SALTA BAJO EL GATITO! | **🐱 SALTA DEBAJO** |
| GameCanvas.tsx:1116 | ¡TOCA LA ENREDADERA! | **🌿 ¡TOCA!** |
| GameCanvas.tsx:1248–1249 | ¡SUBE! LOS DOS BORDES ESTÁN CONECTADOS · Sal por un lado… | **⬆ ¡SUBE!** y flechas ↔ en los bordes (sin texto) |
| GameCanvas.tsx:1250 | NUBE ROSA ↑? = ¡SUPERSALTO SORPRESA! | **☁ ¡SUPERSALTO!** |
| GameCanvas.tsx:1258 | SALTAR: NADA ARRIBA · SUELTA: BAJA | **↑ NADA** |
| GameCanvas.tsx:1259 | Puedes caminar por la arena. ¡Evita los erizos! | **🦔 ¡OJO, ERIZOS!** |
| GameCanvas.tsx:1302 | ↺ Empezar la sala | **↺ OTRA VEZ** |
| GameCanvas.tsx:1303 | ↩ Volver al camino | **↩ VUELVE** |
| chase.ts:65 | ¡Toma tu ovillo! | **🧶 ¡TU LANA!** |
| exploreRendering.ts:65 | ¡Miau! | **¡MIAU!** |
| exploreRendering.ts:80 | Gatitos: | **🐱 ●●○** |
| rendering.ts:1445 | ¡OINK! / ¡AUUU! | **¡OINK!** / **¡AUUU!** (sin cambios) |
| rendering.ts:1511 | ¡DESPIERTA! / ZZZ | **¡OJO!** / **ZZZ** |
| rendering.ts:2093 | ¡SE CIERRA! / ¡PASA! / ¡SE ABRE! / ESPERA LA FLOR | **¡CERRADO!** / **¡PASA!** / **¡ABIERTO!** / **🌸 ESPERA** |
| rendering.ts:2142 | ¡AIRE ARRIBA! | **💨 ¡AIRE!** |
| rendering.ts:2167 | ↓ ¡AGUA! ↓ | **↓ ¡AGUA! ↓** (sin cambios) |
| rendering.ts:2328 | ¡GATITO RESCATADO! | **🐱 ¡GATITO!** |
| rendering.ts:2331 | NOA HA ENCONTRADO UN AMIGO | **❤ ¡UN AMIGO!** |
| rendering.ts:2353 | DUELO | **👑 RETO** |

### Subida al reino secreto

| Dónde | Ahora | Nuevo |
|---|---|---|
| App.tsx:832 | ¡Pasadizo secreto! | **✨ ¡SECRETO!** |
| App.tsx:833–834 | Subiendo al Reino de las Nubes… · La enredadera mágica lleva a Noa… | **☁ ¡ARRIBA!** · _La enredadera mágica lleva a Noa al Reino de las Nubes._ |

### Ventana: pantalla completada

| Dónde | Ahora | Nuevo |
|---|---|---|
| App.tsx:932–933 | ¡Juego ganado! / ¡Gatito encontrado! / Pantalla {id} completada | **⭐ ¡MUY BIEN!** (título único) |
| App.tsx:934 | Noa ha recogido … · La Reina Arcoíris guarda… · El monstruo guardián… · La siguiente aventura ya está abierta. | _para leer juntos_: una sola frase según el caso, p. ej. _El guardián deja libre el camino. ¡La siguiente aventura ya está abierta!_ |
| App.tsx:935 | ★ Pantalla / ★ Pegatina / ★ Sin perder vida | **⭐ META** / **✨ PEGATINA** / **❤ SIN CAER** |
| App.tsx:936 | Insignia guardada en el álbum. | **📒 ¡AL ALBUM!** |
| App.tsx:937 | Bruma te invita a preparar la leña… ¿Vamos al claro? · Ir a la fiesta | **🎉 FIESTA** · _Bruma te invita a preparar la leña para la fiesta._ |
| App.tsx:938 | Siguiente pantalla ▶ | **▶ SIGUE** |
| App.tsx:939 | 🐾 Visitar a los amigos | **🐾 PASEO** |
| App.tsx:940–941 | Volver al mapa secreto / Volver al mapa | **🗺 MAPA** |

### Ventana: otra oportunidad

| Dónde | Ahora | Nuevo |
|---|---|---|
| App.tsx:947 | Casi, casi… · ¡Otra oportunidad! | **🍎 ¡CASI!** |
| App.tsx:948 | Las tres vidas vuelven a estar listas. El camino ya te lo sabes. | _Las tres vidas vuelven a estar listas._ |
| App.tsx:949 | Reintentar | **↺ OTRA VEZ** |
| App.tsx:950 | Volver al mapa | **🗺 MAPA** |

### Ventana: pausa

| Dónde | Ahora | Nuevo |
|---|---|---|
| App.tsx:973 | Descanso · Juego en pausa | **⏸ PAUSA** |
| App.tsx:974 | Continuar / Seguir jugando | **▶ SEGUIR** |
| App.tsx:975 | Reiniciar pantalla | **↺ OTRA VEZ** |
| App.tsx:976 | Volver al mapa | **🗺 MAPA** |

### Ventana: final

| Dónde | Ahora | Nuevo |
|---|---|---|
| App.tsx:962–963 | Aventura completada · ¡Bravo, Super Noa! | **🏆 ¡BRAVO, NOA!** |
| App.tsx:963 | Los guardianes son ahora amigos de Noa… Fin… por ahora. | _Los guardianes ya son amigos de Noa. Los gatitos celebran una fiesta en el castillo._ |
| App.tsx:964 | Ver el mapa | **🗺 MAPA** |
| App.tsx:965 | Ir al inicio | **🏠 INICIO** |

### Ayuda

| Dónde | Ahora | Nuevo |
|---|---|---|
| App.tsx:1004 | Ayuda a Noa · ¿Cómo se juega? | **❓ ¿COMO SE JUEGA?** |
| App.tsx:1005 | ¡Camina, salta y busca caminos secretos! | — |
| App.tsx:1007 | Camina · Mantén pulsada una flecha. | **◀ ▶ CAMINA** · _Mantén pulsada una flecha._ |
| App.tsx:1008 | Haz un doble salto · Toca SALTAR. En el aire, ¡tócalo otra vez! | **↑↑ DOBLE SALTO** · _Toca SALTA y, en el aire, otra vez._ |
| App.tsx:1009 | Abre las cajas · Salta y golpea la caja por debajo. | **📦 ABRE LA CAJA** · _Salta y golpéala desde abajo._ |
| App.tsx:1011 | En móvil: … | _En el móvil, mantén una flecha con un dedo y toca SALTA con otro._ |
| App.tsx:1013 | Bola de lana · Cuando Noa tenga orejas de gato, toca LANA. | **🧶 LANZA LANA** · _Cuando Noa tenga orejas de gato, toca LANA._ |
| App.tsx:1014 | Manzana escudo · La manzana salva a Noa de un golpe. | **🍎 MANZANA** · _La manzana salva a Noa de un golpe._ |
| App.tsx:1015 | Juego final · Cada guardián propone un juego sencillo… | **👑 RETO** · _Cada guardián te propone un juego. Mira cómo se juega y juega tres veces._ |
| App.tsx:1016 | Mira arriba · Las pegatinas se esconden en caminos altos. | **✨ MIRA ARRIBA** · _Las pegatinas se esconden en los caminos altos._ |
| App.tsx:1019 | ¡Lista para jugar! | **▶ ¡LISTA!** |

### Colección

| Dónde | Ahora | Nuevo |
|---|---|---|
| App.tsx:1038 | Colección de Noa / Álbum de pegatinas / Jefes amigos / Amigos / Postales de viaje | **📒 ALBUM** / **✨ PEGATINAS** / **👑 JEFES** / **🐾 AMIGOS** / **✉ POSTALES** |
| App.tsx:1040–1043 | Pegatinas / Jefes amigos / Amigos / Recuerdos | **✨ PEGATINAS** / **👑 JEFES** / **🐾 AMIGOS** / **✉ POSTALES** |
| App.tsx:1046 | Hay una pegatina escondida en la ruta elevada de cada pantalla. | _Hay una pegatina escondida en el camino alto de cada pantalla._ |
| App.tsx:1057–1058 | Mundo {n} / Pantalla {id} | **MUNDO {n}** / **{id}** |
| App.tsx:1058 | ¡Encontrada! / Pegatina pendiente | **✓ ¡SI!** / **❔** (silueta) |
| App.tsx:1059 | Ocultar pista / Mostrar pista | **💡 PISTA** (botón que abre y cierra) |
| App.tsx:1060 | Abre esta pantalla para ver su pista. | **🔒** · _Abre esta pantalla para ver su pista._ |
| App.tsx:1067 | Completa el juego de cada guardián para hacerte su amiga… | _Gana el juego de cada guardián y será tu amigo. Luego podéis jugar otra vez._ |
| App.tsx:1074 | Mundo secreto / misterioso / del agua | **✨ SECRETO** / **❔** / **💧 AGUA** |
| App.tsx:1081 | Amigo por descubrir | **❔** (silueta) |
| App.tsx:1082 | ★ Marco especial conseguido / ★ Reto pendiente: / Jugar otra vez | **🖼 ¡MARCO!** / **👑 RETO** / **↺ JUGAR** |
| App.tsx:1082 | Completa su juego para conocerlo. | _Gana su juego para conocerlo._ |
| App.tsx:1089 | Termina todas las pantallas de un mundo para guardar una postal… | _Termina un mundo entero y guarda una postal con su gatito._ |
| App.tsx:1098 | Postal por descubrir | **❔** (silueta) |
| App.tsx:1106 | Seguir explorando | **▶ SEGUIR** |

## Patrones para los datos

Los datos se reescriben al migrar cada superficie al catálogo de textos ([Textos centralizados: un catálogo en español listo para otros idiomas](https://github.com/Mocheto/super-noa/issues/109)), siguiendo estos patrones:

| Tipo | Rótulo | Para leer juntos | Ejemplos |
|---|---|---|---|
| Título de pantalla (`levels.ts` `title`) | 1–2 palabras sin artículo | el título largo actual | «La laguna de Perla» → **PERLA** · _La laguna de Perla_; «El jardín de los erizos» → **ERIZOS** · _El jardín de los erizos_ |
| Pista de pantalla (`subtitle`) | verbo y objeto | la pista en una frase corta | «Toca SALTAR para nadar hacia arriba. Suelta para bajar.» → **↑ NADA** · _Toca SALTA para nadar hacia arriba; suelta para bajar._ |
| Botón «siguiente» (`nextLabel`) | **▶ SIGUE** | el destino | «Viajar a la isla de los dinosaurios ▶» → **▶ SIGUE** · _A la isla de los dinosaurios_ |
| Mundo (`worldMapData`) | nombre corto | nombre largo y descripción | «El Prado de las Manzanas» → **🍎 MANZANOS** · _El Prado de las Manzanas. Sol, ramas anchas y manzanas crujientes._ |
| Pegatina (`stickers.ts`) | nombre en 1–2 palabras | la pista | «Manzana feliz» · «Busca sobre las ramas altas.» → **🍎 MANZANA FELIZ** · _Busca sobre las ramas altas._ |
| Amigo (`friends.ts`) | nombre y «¿muerde?» | consejo y comida | «No muerde: ¡solo hace cosquillas!» → **😊 NO MUERDE** · _¡Solo hace cosquillas!_ |
| Paseo de los amigos (`restStops.ts`) | saludo de 1–3 palabras | — (en partida, sin capa) | «¡Soy blandita y saltarina!» → **¡HOLA, NOA!**; despedida → **¡ADIOS!** |
| Guardián (`bosses.ts`) | nombre y **👑 RETO** | presentación y premio | «El guardián del mar quiere jugar contigo…» → **DON ALETA** · _El guardián del mar quiere jugar contigo._ |
| Juego de guardián (`guardianGames.ts`) | título e instrucción de 2–3 palabras | instrucción completa antes de empezar | «Protege los huevos» · «Mira dónde cae el huevo y coloca allí la cesta.» → **🥚 SALVA EL HUEVO** · _Mira dónde cae el huevo y pon allí la cesta._ |
| Minijuego rítmico (práctica, avisos) | orden de 1–2 palabras al compás | explicación antes de empezar | «Flor: un corte cuando llega a la varita.» → **🌸 ¡CORTA!** · _Corta la flor cuando llegue a la varita._ |
| Final de minijuego | **⭐ ¡PERFECTO!** / **¡MUY BIEN!** / **↺ OTRA VEZ** | premio en una frase | «¡No ha caído ni una flor! Melisa te regala su marco…» → **⭐ ¡PERFECTO!** · _Melisa te regala su marco._ |

## Fuera de esta guía

- Ajustes, créditos, tablón mundial y avisos generales: texto para adultos, sin cambios.
- Ayuda de teclado y mando en los duelos y minijuegos («Teclado: Espacio · Mando: botón A…»): texto para adultos, pequeño, en la pantalla previa.
- Arte de los pictogramas: lo decide [Palabras con dibujo y estilo del atlas de pictogramas](https://github.com/Mocheto/super-noa/issues/104), que parte de la lista base de esta guía.
