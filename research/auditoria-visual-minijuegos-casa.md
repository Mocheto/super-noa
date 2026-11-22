# Auditoría visual de minijuegos, duelos, ventanas y casa

Issue: [Auditoría visual de minijuegos, duelos, ventanas y casa (#276)](https://github.com/Mocheto/super-noa/issues/276), del mapa [Mejoras y recomendaciones visuales (#274)](https://github.com/Mocheto/super-noa/issues/274).
Fecha: 22 de noviembre de 2026, sobre `main` en `ce738d5`. Continúa la [auditoría de la campaña, el HUD y el mapa (#275)](https://github.com/Mocheto/super-noa/blob/research/auditoria-visual-campana/research/auditoria-visual-campana.md), con el mismo método y la misma vara de medir.

## Método

- Servidor de desarrollo y Chromium sin interfaz (Playwright), tres tamaños: **móvil vertical** 375 × 812 (×2, táctil), **móvil apaisado** 740 × 340 (×2, táctil) y **escritorio** 1280 × 800.
- Minijuegos y duelos, con `?prueba=interfaz&ventana=<juego>` (`abeja`, `tambor`, `merienda`, `gatitos`, `avioneta`, `duelo`, `guardian`, `saltos`): se captura la pantalla previa, la primera pieza de la práctica (PRACTICA), el juego tras «¡A JUGAR!» y unos segundos después tras pulsar seis veces. Para ver el duelo dentro de la partida, `?prueba=1-3&duelo` (piedra, papel o tijera), `?prueba=4-3&duelo` (merienda) y `?prueba=13-3&duelo` (Papá Noel).
- Ventanas comunes: `?prueba=interfaz&ventana=resultado`, `&ventana=previa`, la muestra de `?prueba=interfaz` y la pausa de verdad en `?prueba=1-1`.
- Casa: `?prueba=casa&casaHora=11` con la campaña completa (17 gatitos rescatados): ventana «¡HOLA!», habitación, habitación deslizada a la derecha, abanico de comidas, decorar, «EN CASA», foto, jardín y álbum (pestaña FOTOS y una foto en grande); `casaHora=20` para la hora de dormir; `casaVisita=wolf` para la visita; `casaNecesidades=pide` y arrastrar un gatito (mantener 0,6 s) a la bañera o al armario para el baño y el vestidor.
- Medidas con el DOM: botones visibles de menos de 48 px, letra más pequeña y alto de la página frente al de la pantalla.
- Vara de medir: prioridades del mapa (1. claridad para Noa, 2. sensación de juego, 3. coherencia) y la lista de comprobación de [Buenas prácticas visuales para niños de 4 a 6 años (#278)](https://github.com/Mocheto/super-noa/blob/research/buenas-practicas-visuales-ninos/research/buenas-practicas-visuales-ninos.md).
- **Ruido y límites:** sin audio en el navegador sin interfaz, los rítmicos usan el reloj de fotogramas y enseñan su icono de «sin sonido»; eso sale en todas las capturas, pero revela un problema real (R2) porque pasa igual con el móvil en silencio o con el audio bloqueado. La hora real de la sesión era de noche, por eso se fijó `casaHora=11`. La pausa de los minijuegos no se ve en la muestra de interfaz (su `paused` es fijo); se revisó la pausa común en la campaña. En vertical, el baño no llegó a abrirse de forma automática (ver CA3) y decorar no se capturó.

## Capturas

Todas en [`capturas/`](auditoria-visual-minijuegos-casa/capturas/) con el nombre `<escena>-<momento>-<tamaño>.webp` (`movil`, `apaisado`, `escritorio`). Hojas de contacto:

| Zona | Vertical 375 × 812 | Apaisado 740 × 340 | Escritorio |
| --- | --- | --- | --- |
| Rítmicos (abeja, tambor, merienda, fiesta) | [hoja](auditoria-visual-minijuegos-casa/hojas/ritmo-movil.webp) | [hoja](auditoria-visual-minijuegos-casa/hojas/ritmo-apaisado.webp) | [hoja](auditoria-visual-minijuegos-casa/hojas/ritmo-escritorio.webp) |
| Duelos (piedra, papel o tijera, guardianes, saltos) | [hoja](auditoria-visual-minijuegos-casa/hojas/duelos-movil.webp) | [hoja](auditoria-visual-minijuegos-casa/hojas/duelos-apaisado.webp) | [hoja](auditoria-visual-minijuegos-casa/hojas/duelos-escritorio.webp) |
| Avioneta y ventanas comunes | [hoja](auditoria-visual-minijuegos-casa/hojas/ventanas-movil.webp) | [hoja](auditoria-visual-minijuegos-casa/hojas/ventanas-apaisado.webp) | [hoja](auditoria-visual-minijuegos-casa/hojas/ventanas-escritorio.webp) |
| Casa (habitación, jardín, noche, baño, vestidor, fotos) | [hoja](auditoria-visual-minijuegos-casa/hojas/casa-movil.webp) | [hoja](auditoria-visual-minijuegos-casa/hojas/casa-apaisado.webp) | [hoja](auditoria-visual-minijuegos-casa/hojas/casa-escritorio.webp) |

## Resumen

Lo que más pesa, en orden:

1. **Cosas cortadas o fuera de la pantalla**: la ventana «¡HOLA!» de la casa en vertical (CA1), el duelo de piedra, papel o tijera en escritorio, con «MAPA» por debajo del borde (D1), y la foto en grande del álbum en apaisado (V4).
2. **Escenarios pequeños en vertical**, igual que en la campaña (C1 de la #275): rítmicos, avioneta, saltos y casa usan un tercio de la altura y dejan el resto vacío (R1, CA3).
3. **Texto pequeño o largo para Noa**: rótulos de 9–11 px en los duelos (D2) y reglas de seis a ocho líneas en las pantallas previas (V1).
4. **Iconos y menús que tapan lo importante**: el «sin sonido» sobre la cara de Noa (R2) y el abanico de comidas sobre los botones de la bandeja (CA2).
5. **Cada juego con su propio estilo**: la fiesta, los duelos y la avioneta no usan el marco ni los botones comunes (R4, D4, V2).

## Inventario

Cada problema lleva su zona, dónde se ve, por qué importa y una idea de arreglo con su coste: **código** (CSS, lienzo o componente; barato), **datos** (textos, partituras) o **arte** (dibujo nuevo, más caro; sin Gemini de pago, con prompt). Los marcados con **⚑** son fallos claros que no dependen de la guía de estilo.

### Prioridad 1: claridad y lectura para Noa

**CA1. ⚑ La ventana «¡HOLA!» de la casa sale recortada en vertical.** Casa, llegada de gatitos, 375 × 812. Los cinco dibujos (96 px de alto) van en una fila sin salto (`.casa-llegada-dibujo`, `display: flex` sin `flex-wrap`) que es más ancha que la ventana: se cortan el título («¡HO…»), la frase y el botón «SIG…». Es la primera pantalla de la casa. Ver [casa-hola-movil](auditoria-visual-minijuegos-casa/capturas/casa-hola-movil.webp); en apaisado y escritorio se ve bien ([casa-hola-apaisado](auditoria-visual-minijuegos-casa/capturas/casa-hola-apaisado.webp)).
*Idea:* `flex-wrap: wrap` y dibujos de 64 px en pantallas estrechas, o solo los tres primeros con «+2». *Coste:* código, bajo.

**D1. ⚑ El duelo de piedra, papel o tijera no cabe en escritorio ni en apaisado.** Duelos de guardián, dentro de la partida (`?prueba=1-3&duelo`). La página mide 831 px en una pantalla de 800 y el botón «MAPA» queda en y = 853, fuera de la vista; el cuadro «¡PUNTO PARA NOA!» sale cortado. En apaisado, 371 px en 340. Además, el dibujo del Rey Zarzal se corta en vertical por un lado (recorte de su celda del atlas). Ver [ppt-en-partida-escritorio](auditoria-visual-minijuegos-casa/capturas/ppt-en-partida-escritorio.webp), [ppt-ronda-escritorio](auditoria-visual-minijuegos-casa/capturas/ppt-ronda-escritorio.webp).
*Idea:* el duelo dentro del marco de la partida con alto máximo `100dvh`, el resultado de la ronda como cartel superpuesto (no debajo) y revisar el recorte del sprite. *Coste:* código, bajo.

**R1. Escenario diminuto en vertical en los minijuegos.** Rítmicos, avioneta y batalla de saltos, 375 × 812. La escena 16:9 mide unos 343 × 190 px y deja vacía la mitad de abajo; la flor de la abeja mide ~12 px, el avión ~20 px. Ver [abeja-juego-movil](auditoria-visual-minijuegos-casa/capturas/abeja-juego-movil.webp), [avioneta-vuelo-movil](auditoria-visual-minijuegos-casa/capturas/avioneta-vuelo-movil.webp), [santa-juego-movil](auditoria-visual-minijuegos-casa/capturas/santa-juego-movil.webp). Mismo problema que C1 de la #275.
*Idea:* los rítmicos son escenas fijas: en vertical, recortar la escena a 4:3 o apilar guardián arriba y Noa abajo, y dejar crecer el botón de acción hacia abajo, en la zona del pulgar. La avioneta pide un recorrido vertical. Decidirlo en la guía junto con C1. *Coste:* código medio; arte si hace falta un recorte vertical del fondo.

**R2. ⚑ El icono de «sin sonido» tapa la cara de Noa.** Rítmicos, todos los tamaños, cuando no hay audio (móvil en silencio, reproducción bloqueada). En la abeja se pinta en `CUT_POINT` + (40, −70), justo sobre la cabeza de Noa; en la merienda y la fiesta, un círculo a media escena junto al jabalí o el tajo. Ver [abeja-juego-escritorio](auditoria-visual-minijuegos-casa/capturas/abeja-juego-escritorio.webp), [merienda-juego2-apaisado](auditoria-visual-minijuegos-casa/capturas/merienda-juego2-apaisado.webp), [fiesta-juego-escritorio](auditoria-visual-minijuegos-casa/capturas/fiesta-juego-escritorio.webp).
*Idea:* llevarlo al HUD de la esquina, junto a la pausa (la fiesta ya tiene ahí un botón de sonido). *Coste:* código, bajo.

**R3. El objeto que marca el ritmo se pierde en el fondo.** Abeja y merienda. La flor que vuela hacia la varita es pequeña (~30 px en escritorio) y del mismo color que las flores pintadas del fondo; la bellota, igual en el bosque de otoño. Ver [abeja-juego-escritorio](auditoria-visual-minijuegos-casa/capturas/abeja-juego-escritorio.webp), [merienda-juego-escritorio](auditoria-visual-minijuegos-casa/capturas/merienda-juego-escritorio.webp). El tambor (teatro oscuro y liso) y la fiesta (cielo suave) se leen mejor.
*Idea:* el velo del fondo de C4/C8 de la #275 y un contorno claro con halo en el objeto rítmico, un 50 % más grande. *Coste:* código, bajo.

**D2. Texto diminuto y pictogramas pequeños en los duelos.** Piedra, papel o tijera y juegos de guardián, sobre todo en móvil. Rótulos de 9–11 px («LISTA», «ESPERA», «RONDA 1/5», «CESTA IZQUIERDA», la leyenda «GANA A» de abajo); la piedra, el papel y la tijera ocupan ~25 px dentro de botones de 200 px. Noa elige por el dibujo, no por la palabra. Ver [ppt-elige-movil](auditoria-visual-minijuegos-casa/capturas/ppt-elige-movil.webp), [ppt-elige-apaisado](auditoria-visual-minijuegos-casa/capturas/ppt-elige-apaisado.webp), [guardian-juego-movil](auditoria-visual-minijuegos-casa/capturas/guardian-juego-movil.webp).
*Idea:* el dibujo llena el botón (×3) y el rótulo queda en una palabra de 14 px o más; «LISTA/ESPERA» como un pictograma; la leyenda «GANA A» solo en la práctica o con dibujos grandes. *Coste:* código, bajo.

**D3. «MAPA» en la esquina inferior izquierda de los duelos.** Juegos de guardián y piedra, papel o tijera en vertical: el botón de salir está abajo a la izquierda, donde apoya la mano (la #278 pide que nada salga ni rinda desde las esquinas inferiores). Ver [guardian-juego-movil](auditoria-visual-minijuegos-casa/capturas/guardian-juego-movil.webp), [ppt-elige-movil](auditoria-visual-minijuegos-casa/capturas/ppt-elige-movil.webp). En apaisado ya va arriba a la derecha.
*Idea:* salir siempre desde la pausa común (arriba a la derecha), como en los rítmicos. *Coste:* código, bajo.

**V1. Pantallas previas con párrafos largos.** Pantalla previa de los cuatro rítmicos, la avioneta, los duelos y los saltos. La regla «para leer juntos» ocupa de cinco a ocho líneas («La Reina Melisa te lanza flores. ¡Córtalas con tu varita cuando lleguen a la punta…»), y debajo van dos líneas de ayuda para adultos casi del mismo tamaño (13 px). En vertical empujan los botones a la mitad de abajo. El dibujo del guardián es pequeño en algunas (~40 px en piedra, papel o tijera y en «Salva el huevo»). Ver [abeja-previa-movil](auditoria-visual-minijuegos-casa/capturas/abeja-previa-movil.webp), [merienda-previa-movil](auditoria-visual-minijuegos-casa/capturas/merienda-previa-movil.webp), [ppt-inicio-escritorio](auditoria-visual-minijuegos-casa/capturas/ppt-inicio-escritorio.webp).
*Idea:* una frase para leer juntos y tres pictogramas grandes (qué hacer, qué no tocar, qué se gana); la ayuda para adultos detrás de un botón «?»; el guardián a ×2. *Coste:* datos (textos) y código, bajo; encaja con la guía de escritura.

**V2. Botones por debajo de 48 px.** Ventanas, previas y casa en móvil (medido): PRACTICA, ¡A JUGAR!, SIGUE y MAPA miden 44 px de alto; los de control (sonido, pantalla grande, pausa, cerrar, salir de la casa) 40 px; los redondos de la bandeja de la casa (decorar, foto, EN CASA) 44 px. La #278 pide 48 px, y 64 en lo que se toca a menudo. Ver [ventanas-resultado-movil](auditoria-visual-minijuegos-casa/capturas/ventanas-resultado-movil.webp), [casa-habitacion-movil](auditoria-visual-minijuegos-casa/capturas/casa-habitacion-movil.webp).
*Idea:* subir las medidas de móvil de `interfaz.css` a 48/56 px y los redondos de la bandeja a 56 px. *Coste:* código, bajo; decidir los números en la guía.

**CA2. ⚑ El abanico de comidas tapa los botones de la bandeja.** Casa, apaisado (y escritorio). Al tocar el cuenco, las cuatro comidas salen hacia arriba, fuera de la bandeja, sobre los botones redondos de decorar y foto; mientras está abierto, «EN CASA» no se abrió en la prueba. Ver [casa-abanico-apaisado](auditoria-visual-minijuegos-casa/capturas/casa-abanico-apaisado.webp).
*Idea:* en la bandeja lateral, abrirlo hacia la habitación (a la izquierda) y cerrarlo al tocar fuera o al pulsar otro botón. *Coste:* código, bajo.

**CA3. En vertical la casa enseña un tercio de la habitación.** Casa, 375 × 812. La vista muestra ~420 de los 1280 px de la habitación: la bañera y el armario suelen quedar fuera de donde están los gatitos, y para llevar uno hay que arrastrarlo al borde y esperar a que la habitación se deslice sola (en las pruebas automáticas no se llegó a abrir el baño). El jardín empieza en la puerta y no se ve ningún gatito. Mientras tanto, la mitad de abajo de la pantalla queda vacía. Ver [casa-habitacion-movil](auditoria-visual-minijuegos-casa/capturas/casa-habitacion-movil.webp), [casa-jardin-movil](auditoria-visual-minijuegos-casa/capturas/casa-jardin-movil.webp).
*Idea:* usar el alto libre (escena mayor o la bandeja más grande debajo), centrar la vista al entrar en el gatito que pide o en los del jardín, y al coger un gatito hacer brillar una flecha en el borde hacia la bañera y el armario. *Coste:* código, medio.

**CA4. Piezas del vestidor pequeñas en móvil.** Vestidor. Las prendas son botones del tamaño de su dibujo: unos 25 × 20 px en vertical y 45 × 30 px en apaisado, con poco hueco entre las gafas. Ver [vestidor-vestidor-movil](auditoria-visual-minijuegos-casa/capturas/vestidor-vestidor-movil.webp), [vestidor-vestidor-puesto-apaisado](auditoria-visual-minijuegos-casa/capturas/vestidor-vestidor-puesto-apaisado.webp). En escritorio, bien.
*Idea:* área de toque de 56 px por prenda aunque el dibujo sea menor, o, en móvil, el armario más grande y el gatito más pequeño. *Coste:* código, bajo.

### Prioridad 2: sensación de juego

**CA5. Las fotos en vertical solo guardan lo que se ve.** Casa y álbum. En vertical la foto del jardín es una puerta y un trozo de hierba, sin gatitos; en el álbum se ve igual de vacía. Ver [album-foto-grande-movil](auditoria-visual-minijuegos-casa/capturas/album-foto-grande-movil.webp), frente a [album-foto-grande-escritorio](auditoria-visual-minijuegos-casa/capturas/album-foto-grande-escritorio.webp).
*Idea:* encuadrar la foto en los gatitos (o guardar la estancia entera) y no solo la vista; `casaFoto.ts` ya guarda la foto como datos. *Coste:* código, medio.

**AV1. La avioneta se juega en una franja pequeña.** Avioneta, todos los tamaños. En escritorio el cielo ocupa ~300 de 800 px; las flechas y la pompa van debajo, en círculos de 40 px; el contador de estrellas («0/42») y el botón «MAPA» del lienzo son diminutos. Ver [avioneta-vuelo-escritorio](auditoria-visual-minijuegos-casa/capturas/avioneta-vuelo-escritorio.webp), [avioneta-vuelo-movil](auditoria-visual-minijuegos-casa/capturas/avioneta-vuelo-movil.webp).
*Idea:* escenario a todo lo alto, contador como chip del HUD común, pausa común en lugar de «MAPA», y controles con las medidas táctiles de la partida. *Coste:* código, medio.

**R5. El botón de acción tapa la escena en apaisado.** Rítmicos, 740 × 340. «¡CORTA!», «¡GOLPEA!» y «¡DALE!» se superponen a la esquina inferior izquierda de la escena, sobre la cesta y el tarro, y en la merienda casi sobre Noa. Ver [merienda-juego2-apaisado](auditoria-visual-minijuegos-casa/capturas/merienda-juego2-apaisado.webp), [abeja-juego-apaisado](auditoria-visual-minijuegos-casa/capturas/abeja-juego-apaisado.webp). Como toda la escena se puede tocar, el botón es una ayuda.
*Idea:* botón translúcido como los controles táctiles, o en una franja lateral. *Coste:* código, bajo.

**V4. Contenido que no cabe en las ventanas en apaisado.** Álbum y casa, 740 × 340. La foto en grande se sale de la ventana por abajo; en «EN CASA», la segunda fila de gatitos queda cortada sin indicar que se puede desplazar; la casa mide 348 px en 340 y la página se mueve 8 px. Ver [album-foto-grande-apaisado](auditoria-visual-minijuegos-casa/capturas/album-foto-grande-apaisado.webp), [casa-encasa-apaisado](auditoria-visual-minijuegos-casa/capturas/casa-encasa-apaisado.webp).
*Idea:* la foto con `max-height` del alto libre; en «EN CASA», fichas más pequeñas en una fila desplazable con flecha; revisar el margen de la casa. *Coste:* código, bajo.

### Prioridad 3: coherencia y pulido

**R4. Cada rítmico con su propia plantilla.** Abeja, tambor y merienda van sobre papel crema con marco y botón de acción amarillo; la fiesta, sin marco, con sonido y pausa fuera de la escena arriba a la izquierda y botón verde plano; el tambor añade en vertical un contador 1-2-3-4 que los otros no tienen. Ver [fiesta-juego-escritorio](auditoria-visual-minijuegos-casa/capturas/fiesta-juego-escritorio.webp) frente a [tambor-juego-escritorio](auditoria-visual-minijuegos-casa/capturas/tambor-juego-escritorio.webp), [tambor-juego2-movil](auditoria-visual-minijuegos-casa/capturas/tambor-juego2-movil.webp).
*Idea:* llevar la fiesta al esqueleto común de los duelos rítmicos (`minijuegoComun`), con el mismo marco, HUD y botón. *Coste:* código, medio.

**D4. Los duelos y la batalla de saltos no se parecen al resto.** Piedra, papel o tijera y juegos de guardián usan una letra monoespaciada con remates y cajas blancas de línea fina, no Press Start 2P ni el papel y la cinta de `<Ventana>`; detrás de Noa asoman dos rectángulos grises. La batalla de saltos de Siroco y Don Silbato usa el suelo nevado con guirnaldas y los copos de Papá Noel en el desierto, dentro de un marco verde navideño. Ver [ppt-elige-apaisado](auditoria-visual-minijuegos-casa/capturas/ppt-elige-apaisado.webp), [guardian-juego-escritorio](auditoria-visual-minijuegos-casa/capturas/guardian-juego-escritorio.webp), [santa-juego-escritorio](auditoria-visual-minijuegos-casa/capturas/santa-juego-escritorio.webp).
*Idea:* letra y colores de `interfaz.css` en los duelos; marco caramelo con el acento del mundo; suelo, partículas y marco por guardián en `santaBattleAssets.ts`. *Coste:* código bajo; arte si hacen falta suelos propios para el desierto y el tren.

**V3. Dos estilos de botón principal en la pantalla previa.** Los rítmicos destacan PRACTICA (verde) y dejan «¡A JUGAR!» en blanco; avioneta, duelos y saltos ponen «¡A JUGAR!» en rojo. Ver [abeja-previa-escritorio](auditoria-visual-minijuegos-casa/capturas/abeja-previa-escritorio.webp), [santa-inicio-escritorio](auditoria-visual-minijuegos-casa/capturas/santa-inicio-escritorio.webp).
*Idea:* un único botón principal por pantalla con el mismo color en todas; decidirlo en la guía. *Coste:* código, bajo.

**V5. Títulos que se parten en dos o tres líneas.** Pantallas previas en vertical: «RETO CON REY ZARZAL», «SALVA EL HUEVO», «JUEGA CON SIROCO» y «ABEJA NINJA» se parten y se acercan a la X de cerrar. Ver [ppt-inicio-movil](auditoria-visual-minijuegos-casa/capturas/ppt-inicio-movil.webp).
*Idea:* rótulos de dos palabras («REY ZARZAL») o un tamaño menor solo en la cinta de vertical, reservando el sitio de la X. *Coste:* datos o código, bajo.

## Sin problemas destacables

- La ventana común (pausa y resultado) se lee bien en los tres tamaños; en apaisado reparte los botones en fila o columna sin salirse ([ventanas-pausa-apaisado](auditoria-visual-minijuegos-casa/capturas/ventanas-pausa-apaisado.webp), [ventanas-resultado-apaisado](auditoria-visual-minijuegos-casa/capturas/ventanas-resultado-apaisado.webp)).
- Baño y vestidor en apaisado y escritorio: dibujo grande, bandeja clara y «¡LISTO!» visible ([bano-bano-alcachofa-escritorio](auditoria-visual-minijuegos-casa/capturas/bano-bano-alcachofa-escritorio.webp), [vestidor-vestidor-puesto-escritorio](auditoria-visual-minijuegos-casa/capturas/vestidor-vestidor-puesto-escritorio.webp)).
- La casa en apaisado y escritorio: bocadillos de necesidad con dibujo, bandeja con objetos grandes, decorar y noche legibles ([casa-decorar-apaisado](auditoria-visual-minijuegos-casa/capturas/casa-decorar-apaisado.webp), [noche-dormir-escritorio](auditoria-visual-minijuegos-casa/capturas/noche-dormir-escritorio.webp)).
- El tambor y la fiesta tienen fondos tranquilos detrás de la acción; los carteles al compás son de una palabra con dibujo, como pide la regla de los minijuegos.
- No hubo errores de página (excepciones) en ninguna captura.

## Pendiente fuera de esta auditoría

- Pausa de cada minijuego dentro de la partida (la muestra de interfaz no la abre) y la práctica completa; conviene mirarlas jugando con Noa.
- Baño y decorar en vertical (ver CA3), y `reduceMotion` en minijuegos y casa (lo pide la #278).
- Rendimiento en móvil: [#277](https://github.com/Mocheto/super-noa/issues/277).
