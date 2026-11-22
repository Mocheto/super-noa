# Auditoría visual de la campaña, el HUD y el mapa

Issue: [Auditoría visual de la campaña, el HUD y el mapa (#275)](https://github.com/Mocheto/super-noa/issues/275), del mapa [Mejoras y recomendaciones visuales (#274)](https://github.com/Mocheto/super-noa/issues/274).
Fecha: 22 de noviembre de 2026, sobre `main` en `ce738d5`.

## Método

- Servidor de desarrollo y Chromium sin interfaz (Playwright). Cada pantalla se abre con `?prueba=<id>`; tras 2,5 s se mantiene la flecha derecha 1,6 s y se captura. El mapa se captura con el progreso vacío (`mapa-inicio`) y con la campaña completa (`mapa-lleno`).
- Tres tamaños: **móvil vertical** 375 × 812 (×2, táctil), **móvil apaisado** 740 × 340 (×2, táctil) y **escritorio** 1280 × 800.
- Pantallas: la 1 y la 2 de cada mundo (la 1 es horizontal; la 2, el formato nuevo), la acuática A-1, el cielo 17-1 y el reino secreto S-1. Así sale **una de cada mundo y de cada formato**: horizontal (1-1…16-1), persecución (1-2, 5-2, 11-2, 15-2), sala-rompecabezas (2-2, 6-2, 12-2, 16-2), exploración (3-2, 9-2, 14-2), vertical (4-2, 10-2, 13-2, 17-1) y acuática (A-1).
- Vara de medir: las prioridades del mapa (1. claridad para Noa, 2. sensación de juego, 3. coherencia) y la lista de comprobación de [Buenas prácticas visuales para niños de 4 a 6 años (#278)](https://github.com/Mocheto/super-noa/blob/research/buenas-practicas-visuales-ninos/research/buenas-practicas-visuales-ninos.md).
- **Ruido de las capturas:** el aviso «La música no ha podido sonar» y el de «No puedo conectar con el ranking» salen porque el navegador sin interfaz no reproduce audio y no hay servidor del tablón en local. No son problemas en sí, pero sí revelan uno (A3).

## Capturas

Todas en [`capturas/`](auditoria-visual-campana/capturas/) con el nombre `<pantalla>-<tamaño>.webp` (`movil`, `apaisado`, `escritorio`) y `mapa-inicio-*` / `mapa-lleno-*`. Hojas de contacto para mirarlas de un vistazo:

| Tamaño | Hojas |
| --- | --- |
| Escritorio | [1-1 a 4-1](auditoria-visual-campana/hojas/escritorio-0.webp) · [4-2 a 10-1](auditoria-visual-campana/hojas/escritorio-8.webp) · [10-2 a 14-1](auditoria-visual-campana/hojas/escritorio-16.webp) · [14-2 a S-1](auditoria-visual-campana/hojas/escritorio-24.webp) |
| Apaisado 740 × 340 | [1-1 a 4-1](auditoria-visual-campana/hojas/apaisado-0.webp) · [4-2 a 10-1](auditoria-visual-campana/hojas/apaisado-8.webp) · [10-2 a 14-1](auditoria-visual-campana/hojas/apaisado-16.webp) · [14-2 a S-1](auditoria-visual-campana/hojas/apaisado-24.webp) |
| Vertical 375 × 812 | [1-1 a 5-1](auditoria-visual-campana/hojas/movil-0.webp) · [5-2 a 12-1](auditoria-visual-campana/hojas/movil-10.webp) · [12-2 a 17-1](auditoria-visual-campana/hojas/movil-20.webp) · [S-1](auditoria-visual-campana/hojas/movil-30.webp) |
| Mapa | [escritorio y apaisado](auditoria-visual-campana/hojas/mapa.webp) · [vertical](auditoria-visual-campana/hojas/mapa-movil.webp) |

## Resumen

Lo que más pesa, en orden:

1. **El mapa en el móvil apaisado no enseña el mapa** (M1): la cabecera, los contadores, la ayuda y nueve botones ocupan los 340 px de alto.
2. **El escenario en el móvil vertical mide 187 px de alto** y deja libre más de la mitad de la pantalla (C1); con eso, los carteles del lienzo quedan a unos 6 px (C2).
3. **Carteles que se pisan entre sí, con el HUD y con el decorado** (C3, H2), y botones que se tapan (H1: «OTRA VEZ» bajo la pausa).
4. **Plataformas y enemigos que se confunden con el fondo pintado** (C4, C5): el fondo tiene la misma saturación y detalle que lo que se pisa o hace daño.
5. **Avisos que empujan la partida** fuera de la pantalla en apaisado (A3).

## Inventario

Cada problema lleva su zona, dónde se ve, por qué importa y una idea de arreglo con su coste: **código** (CSS o lienzo, barato), **datos** (niveles) o **arte** (nuevo dibujo, más caro; sin Gemini de pago, con prompt).

### Prioridad 1: claridad y lectura para Noa

**C1. Escenario diminuto en el móvil vertical.** Campaña, todas las pantallas, 375 × 812. El lienzo 16:9 ocupa 343 × 187 px; los controles debajo, unos 150 px; el resto (≈ 430 px, más de la mitad) queda vacío. Noa mide ~25 px y los enemigos pequeños, ~10 px. Ver [1-1-movil](auditoria-visual-campana/capturas/1-1-movil.webp) y cualquier hoja vertical.
*Idea:* en vertical, un escenario más alto (recorte 4:3 o 1:1 de la cámara) o un aviso amable de «gira el móvil»; los controles pueden crecer hacia abajo. Las pantallas verticales (4-2, 10-2, 13-2, 17-x) son las que más ganarían con un escenario alto. *Coste:* código (cámara y CSS), medio; hay que medir los 60 fps.

**C2. Carteles del lienzo ilegibles en el móvil.** Campaña, 375 × 812 y, menos, 740 × 340. `drawCartel` dibuja a 16 px sobre un lienzo de 960 px que se ve a 343 px: el rótulo queda a ~6 px de alto en vertical y ~10 px en apaisado (en escritorio, ~22 px, bien). Ver [3-2-movil](auditoria-visual-campana/capturas/3-2-movil.webp), [17-1-movil](auditoria-visual-campana/capturas/17-1-movil.webp).
*Idea:* escalar el cartel con la inversa de la escala del lienzo (mínimo 14 px reales, como `--rotulo-pequeno`) o sacarlo a una capa DOM sobre el escenario. *Coste:* código, bajo.

**C3. Carteles que se pisan.** Campaña, todos los tamaños.
- 14-1 y 16-1: dos carteles de pista uno encima de otro; el de debajo asoma cortado («AN… »). Ver [14-1-escritorio](auditoria-visual-campana/capturas/14-1-escritorio.webp), [16-1-escritorio](auditoria-visual-campana/capturas/16-1-escritorio.webp).
- 3-2 y 9-2: hasta tres carteles a la vez («ZZZ PASA AHORA», «SALTA DEBAJO», «ZZZ»), por encima de las dos o tres que recomienda #278; una plataforma tapa el borde de uno y una manzana se dibuja encima del otro. Ver [3-2-escritorio](auditoria-visual-campana/capturas/3-2-escritorio.webp).
- 1-1 en vertical: la pista «¡DOBLE SALTO!» se monta sobre el «1-1» del HUD y sobre el sol.
*Idea:* una cola de carteles en `palabrasRecoger`/`drawCartel` (uno de pista a la vez, los de objeto debajo) y dibujarlos en la última capa del lienzo, después de plataformas y objetos; reservar la franja del HUD. *Coste:* código, bajo.

**C4. Plataformas que no se distinguen del fondo.** Campaña.
- 2-1: las plataformas flotantes son grises y semitransparentes sobre un bosque morado; casi no se ven ([2-1-escritorio](auditoria-visual-campana/capturas/2-1-escritorio.webp)).
- 4-1 y 4-2: plataformas marrones y verdes sobre un otoño marrón y verde ([4-2-escritorio](auditoria-visual-campana/capturas/4-2-escritorio.webp)).
- 17-1 y S-1: nubes blancas sobre un cielo de nubes rosas y blancas ([17-1-escritorio](auditoria-visual-campana/capturas/17-1-escritorio.webp), [S-1-escritorio](auditoria-visual-campana/capturas/S-1-escritorio.webp)).
- 3-2, 9-2, 14-2 (exploración): el suelo es una banda de piedra translúcida a media altura que se lee como un efecto, no como suelo ([3-2-escritorio](auditoria-visual-campana/capturas/3-2-escritorio.webp)).
*Idea:* contorno oscuro de 2–3 px y una sombra bajo cada plataforma; bajar saturación y contraste del fondo lejano (velo de color del tema o desenfoque precalculado) para que lo interactivo destaque. Comprobar en escala de grises (#278). *Coste:* código, bajo (contorno y velo); arte solo si un atlas no admite contorno.

**C5. Enemigos y peligros pequeños o camuflados.** Campaña. El limo azul de 1-1 (~20 px en escritorio, ~8 px en vertical), el esqueleto de 6-1, el dinosaurio de 9-1 y el escarabajo de 14-1 se pierden en fondos con mucho detalle. En 13-1 y 14-1, solo con correr a la derecha 1,6 s Noa ya pierde una vida: el enemigo está a pocos pasos del inicio y casi no se ve antes de tocarlo ([13-1-escritorio](auditoria-visual-campana/capturas/13-1-escritorio.webp)).
*Idea:* contorno claro o halo rojo suave constante en lo que hace daño (forma, no solo color), y un tramo de presentación sin enemigos en los primeros ~300 px. *Coste:* código (halo) y datos (posiciones), bajo.

**H1. «OTRA VEZ» de las salas tapado por la pausa.** HUD, salas-rompecabezas (2-2, 6-2, 12-2, 16-2), todos los tamaños; en móvil se lee «OTRA VE». `.room-restart` está en `top: 10px; right: 10px; z-index: 3` y la pausa del HUD, en el mismo rincón con `z-index: 4`. Ver [2-2-apaisado](auditoria-visual-campana/capturas/2-2-apaisado.webp), [12-2-movil](auditoria-visual-campana/capturas/12-2-movil.webp).
*Idea:* llevarlo al HUD de esquinas, a la izquierda de la pausa y como `.boton-control` redondo con pictograma. *Coste:* código, bajo.

**H2. Contador de gatitos de la exploración encima del HUD.** HUD, 3-2, 9-2, 14-2. Los tres círculos de gatitos se dibujan en el lienzo debajo de las vidas y asoman bajo los chips del HUD, a medias ([3-2-escritorio](auditoria-visual-campana/capturas/3-2-escritorio.webp)).
*Idea:* pasarlo a un chip del HUD (como las banderas en el centro). *Coste:* código, bajo.

**M1. En apaisado no se ve el mapa.** Mapa, 740 × 340. Título, contadores, frase de ayuda y dos filas de botones llenan la pantalla; la ilustración empieza por debajo del borde ([mapa-inicio-apaisado](auditoria-visual-campana/capturas/mapa-inicio-apaisado.webp)). En vertical, el mapa empieza a media pantalla ([mapa-inicio-movil](auditoria-visual-campana/capturas/mapa-inicio-movil.webp)).
*Idea:* mapa a pantalla completa con los botones flotando en sus esquinas (como el HUD de la partida); la frase de ayuda, solo la primera vez o en el botón de ayuda. *Coste:* código (CSS), medio.

**M2. Demasiados botones y texto de adulto en el mapa.** Mapa, todos los tamaños. Nueve botones (contadores, Tablón, ajustes, casa, MAPA/LISTA, −, +, TODO, NOA, CASA) y una frase larga en minúsculas («MUEVE EL MAPA Arrastra el mapa con un dedo…») que Noa no lee. Ver [mapa-inicio-escritorio](auditoria-visual-campana/capturas/mapa-inicio-escritorio.webp).
*Idea:* dejar para Noa lo que se toca a menudo (mundos, NOA, CASA) y agrupar lo de adulto (Tablón, ajustes, LISTA, zoom) en un menú. *Coste:* código, medio; decidir con la guía de estilo (#280).

**M3. El mundo siguiente no destaca.** Mapa. Los marcadores bloqueados y el siguiente por jugar tienen el mismo aspecto (solo cambia un candado pequeño) y el camino hasta él es una raya fina. Noa tapa a medias el nombre de su marcador. Ver [mapa-inicio-escritorio](auditoria-visual-campana/capturas/mapa-inicio-escritorio.webp), [mapa-lleno-movil](auditoria-visual-campana/capturas/mapa-lleno-movil.webp).
*Idea:* el siguiente mundo con brillo y latido suave; los bloqueados, apagados y sin nombre; Noa encima del marcador, no sobre el texto. *Coste:* código, bajo.

### Prioridad 2: sensación de juego

**C6. Corazón perdido poco visible.** HUD. La vida perdida es un corazón gris al 55 % sobre fondo oscuro: no se nota el cambio ([13-1-escritorio](auditoria-visual-campana/capturas/13-1-escritorio.webp)). *Idea:* corazón vacío con contorno y un pequeño salto/latido del HUD al perderla. *Coste:* código, bajo.

**C7. Sin respuesta visible al avanzar.** Campaña, todas. Las capturas solo muestran a Noa corriendo: no hay polvo al aterrizar ni estela, y la recogida se apoya en la palabra con dibujo (5-1, «MANZANA», que tapa a Noa en vertical). *Idea:* lo dejará concreto el prototipo de «jugo al saltar, al recoger y al ganar» que el mapa tiene sin especificar. *Coste:* código, medio.

**C8. Fondos muy cargados.** Campaña: 9-2, 10-1, 10-2, 11-x, 16-x y S-1 tienen detalle y brillo por toda la imagen, sin zona de descanso detrás de la acción. Refuerza C4 y C5. *Idea:* el velo de C4; a largo plazo, fondos con capas (lejos más plano). *Coste:* código (velo), arte (capas).

### Prioridad 3: coherencia y pulido para adultos

**A1. Emblema del marco cortado en escritorio.** Marco caramelo, 1280 × 800. El emblema del mundo sale a `bottom: -22px` y, con el marco pegado al borde inferior, queda cortado ([1-1-escritorio](auditoria-visual-campana/capturas/1-1-escritorio.webp)). En la acuática el emblema es «-» y en S-1 «✦», menos claros que un número. *Idea:* reservar su margen bajo el marco o meterlo dentro; dibujo propio para A y S. *Coste:* código, bajo.

**A2. Tipografías mezcladas en el mapa.** El título «MAPA» usa Courier New y los botones (MAPA, LISTA, zoom) la letra del sistema; la partida y las ventanas usan Press Start 2P. *Idea:* aplicar `--letra-noa` y la escala de `interfaz.css` al mapa. *Coste:* código, bajo.

**A3. Los avisos empujan la partida.** HUD y diálogo, 740 × 340. Cualquier aviso arriba (música, tablón) se suma a la altura y el marco con los controles táctiles se sale por abajo: los botones de mover y saltar quedan medio fuera ([2-2-apaisado](auditoria-visual-campana/capturas/2-2-apaisado.webp)). Sin aviso, cabe justo (comprobado). El aviso del tablón ocupa cuatro líneas en vertical ([mapa-inicio-movil](auditoria-visual-campana/capturas/mapa-inicio-movil.webp)). *Idea:* avisos superpuestos y que se van solos, o dentro de la pausa; nunca en el flujo de la página. *Coste:* código, bajo.

**A4. Controles táctiles sobre la acción en apaisado.** Al 60 % de opacidad tapan el suelo y a Noa al saltar en las esquinas inferiores; en 2-2 el botón de salto cubre la puerta de la sala ([2-2-apaisado](auditoria-visual-campana/capturas/2-2-apaisado.webp)). Es lo esperado con la medida actual, pero merece revisar si la cámara deja a Noa más arriba en apaisado. *Coste:* código, medio.

**A5. Formato vertical poco vertical.** 4-2, 10-2 y 13-2 se ven igual que una horizontal en las capturas (cámara 16:9 y fondo panorámico); solo el cielo (17-x) se nota distinto. Enlaza con C1. *Coste:* código/arte; para la guía de estilo.

## Sin problemas destacables

- El marco caramelo distingue bien cada mundo por su acento en los tres tamaños.
- En escritorio el HUD de esquinas se lee bien y deja libre el centro.
- En 740 × 340, sin avisos, escenario y controles caben sin desplazar la página.
- No hubo errores de página (excepciones) en ninguna de las 31 pantallas ni en el mapa.

## Pendiente fuera de esta auditoría

- Minijuegos, duelos, ventanas y casa: [#276](https://github.com/Mocheto/super-noa/issues/276).
- Rendimiento en móvil (para el coste de C1, C4 y C8): [#277](https://github.com/Mocheto/super-noa/issues/277).
- Comprobar `reduceMotion` en el lienzo de la partida (lo pide #278); no se ha medido aquí.
