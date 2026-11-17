# Auditoría de pantallas: esqueleto, longitud y uso de la mecánica

Investigación para [#56](https://github.com/Mocheto/super-noa/issues/56), hija del mapa [#55](https://github.com/Mocheto/super-noa/issues/55) («Variedad en la campaña»). Solo recoge hechos medidos en los datos; las decisiones de diseño quedan para la persona usuaria.

## Fuentes y método

- Datos leídos de `src/game/levels.ts` (`levels` y `waterLevels`) y `src/game/detours.ts` (`detourLevels`) en `main` (`14d4084`), importando los módulos con Node y midiendo cada nivel con un script. Reglas de mecánica según `src/game/worldMechanics.ts`, `src/game/gameplay.ts` y `src/game/GameCanvas.tsx`.
- **Las 45 pantallas** son las 15 tierras de campaña × 3 (mundos 1–6 y 9–17). Además se auditan las 3 acuáticas (A-1…A-3, mundo 8), el reino secreto de las nubes (S-1, mundo 7) y los 5 desvíos. **No existen pantallas laterales del desierto** en los datos: el mundo 14 solo tiene 14-1, 14-2 y 14-3.
- **Largo**: `goalX` (horizontal) o `height` (vertical). A 250 px/s de carrera, 1000 px ≈ 4 s de avance sin pararse.
- **Salientes**: plataformas que no son suelo (ramas, repisas, barcos, nubes…).
- **Huecos**: cortes entre tramos de suelo (`y ≥ 440`), con su ancho medio y el paso medio entre huecos. El salto simple cubre ≈ 190 px y el doble salto ≈ 310 px (`JUMP_SPEED` 625, `GRAVITY` 1650, 250 px/s). Todos los huecos de los mundos 1–3, 6 y 9–16 (90–170 px) se cruzan con un salto simple; los del mundo 4 (≈ 400–460 px) no se cruzan ni con doble salto.
- **Mecánica de mundo**: muelles (1), niebla (2), lobos dormidos (3), copas (4), barcos y tablones + cañones (5), perritos encadenados (6), corrientes de aire (7), agua (8), peces saltadores (9), chorros de lava (10), flor-puente + rocío (11), hielo + viento (12), regalo-muelle + cintas + ráfagas (13), géiseres de arena + remolinos (14), cintas de los vagones + vapor (15), plataformas al compás + ondas (16), ascensor + nube de rebote (17).
- **Densidad**: instancias de mecánica por cada 1000 px. **% sin mecánica**: parte del recorrido a más de 350 px de cualquier instancia (aproximado; el hielo del mundo 12 cubre todo el suelo y no entra en la cuenta).
- **Uso**: *estructural* = el recorrido está hecho de la mecánica; *en cada hueco* = la mecánica está dentro de los huecos del camino y obliga a esperar el momento; *opcional* = el camino principal se completa sin ella (huecos saltables o el subtítulo la presenta como alternativa); *puntual* = 2–3 apariciones aisladas.

### Esqueletos

| Código | Esqueleto | Pantallas |
| --- | --- | --- |
| P0 | Paseo sin huecos: suelo continuo con salientes encima | 1-1, 2-1 |
| P | Paseo con pocos huecos (2–3, sin peligro, separados ≥ 1400 px) | 1-2, 1-3, 3-1, 3-2, 3-3 |
| C | Cueva: paredes que cortan el paso y huecos cada ≈ 950 px | 2-2, 2-3 |
| V | Plataformas sobre el vacío o sobre huecos anchos que obligan a ir por arriba | 4-1…4-3, 5-1…5-3 |
| R | Huecos rítmicos: un hueco con peligro (pinchos, agua o lava) cada ≈ 920–1230 px y salientes encima | 6-x, 9-x, 10-x, 11-x, 12-x, 14-1, 15-1 |
| R+ | R con salientes en pares fijos (una baja a y≈300–315 y otra alta a y≈175–205), solo 2–3 alturas distintas en toda la pantalla | 13-x, 14-2, 14-3, 15-2, 15-3, 16-x |
| A | Ascenso vertical con vuelta lateral | 17-1…17-3 |
| S | Nubes con corrientes de aire, sin huecos de suelo | S-1 |
| N | Natación libre en toda la pantalla | A-1…A-3 |
| D | Desvío corto (2240–2540 px), sin enemigos, cajas ni checkpoints | 5 desvíos |

## Tabla por pantalla

Orden de los datos: campaña (1–6, 9–17), S-1, acuáticas y desvíos. «Rutas especiales» indica la posición x de la puerta.

| Pantalla | Formato | Largo (px) | Salientes | Huecos (ancho medio) | Paso entre huecos | Peligro | Mecánica (instancias) | 1.ª aparición x | Densidad /1000 px | % sin mecánica | Uso | Enemigos | Cajas | Checkp. | Peg. | Rutas especiales | Jefe | Esqueleto |
| --- | --- | ---: | ---: | --- | ---: | --- | --- | ---: | ---: | ---: | --- | --- | --- | ---: | ---: | --- | --- | --- |
| 1-1 | horiz. | 3440 | 12 | 0 | — | — | 2 muelle | 850 | 0.58 | 53 % | puntual, opcional | 3 babosa, 2 escarabajo | gato | 2 | 1 | desvío mill@1545 | — | P0 |
| 1-2 | horiz. | 5040 | 14 | 3 (~90) | 1465 | — | 2 muelle | 1325 | 0.4 | 68 % | puntual, opcional | 3 escarabajo, 2 babosa, 2 nube | gato+manzana | 3 | 1 | tienda@1570 | — | P |
| 1-3 | horiz. | 6320 | 16 | 3 (~113) | 1580 | — | 2 muelle | 1600 | 0.32 | 74 % | puntual, opcional | 3 escarabajo, 3 babosa, 2 nube | gato+manzana | 4 | 1 | — | bramble-king | P |
| 2-1 | horiz. | 3840 | 8 | 0 | — | — | 3 niebla | 1320 | 0.78 | 30 % | puntual | 2 babosa, 2 nube, 2 escarabajo | gato | 3 | 1 | desvío fireflies@1365 | — | P0 |
| 2-2 | horiz. | 5530 | 25 | 5 (~160) | 950 | — | — | — | 0 | 100 % | sin mecánica propia | 3 escarabajo, 5 murciélago, 2 babosa | gato+manzana | 4 | 1 | desvío mine@2970 | — | C |
| 2-3 | horiz. | 6630 | 33 | 6 (~170) | 934 | — | — | — | 0 | 100 % | sin mecánica propia | 3 babosa, 7 murciélago, 3 escarabajo | gato+manzana+gato | 5 | 1 | — | mist-countess | C |
| 3-1 | horiz. | 4330 | 7 | 2 (~95) | 1390 | — | 4 lobo dormido | 570 | 0.92 | 30 % | en el camino, con ramas alternativas | 4 lobo, 1 nube | gato | 3 | 1 | — | — | P |
| 3-2 | horiz. | 6030 | 9 | 3 (~107) | 1525 | — | 6 lobo dormido | 540 | 1 | 33 % | en el camino, con ramas alternativas | 6 lobo, 2 nube | gato+manzana | 4 | 1 | tienda@1710 | — | P |
| 3-3 | horiz. | 7030 | 13 | 3 (~133) | 1678 | — | 7 lobo dormido | 520 | 1 | 29 % | en el camino, con ramas alternativas | 7 lobo, 2 nube | gato+manzana | 5 | 1 | waterExit→A-1 (entrada@4655) | great-wolf | P |
| 4-1 | horiz. | 4820 | 17 | 5 (~398) | 833 | — | 17 copa | 250 | 3.53 | 0 % | estructural (obligatoria) | 6 jabalí | gato+manzana | 5 | 1 | — | — | V |
| 4-2 | horiz. | 6120 | 23 | 6 (~460) | 856 | — | 23 copa | 230 | 3.76 | 0 % | estructural (obligatoria) | 7 jabalí, 3 pájaro | gato+manzana+gato | 6 | 1 | — | — | V |
| 4-3 | horiz. | 7420 | 27 | 8 (~395) | 741 | — | 26 copa, 1 enredadera | 220 | 3.64 | 0 % | estructural + ruta secreta | 9 jabalí, 4 pájaro | gato+manzana+gato+enredadera | 8 | 1 | secretExit→S-1 | great-boar | V |
| 5-1 | horiz. | 5040 | 15 | sin suelo | — | — | 15 barco/tablón | 0 | 2.98 | 0 % | estructural (obligatoria) | 5 pirata, 3 loro | gato+manzana | 3 | 1 | — | — | V |
| 5-2 | horiz. | 6420 | 19 | sin suelo | — | — | 19 barco/tablón | 0 | 2.96 | 0 % | estructural (obligatoria) | 7 pirata, 5 loro | gato+manzana+gato | 4 | 1 | — | — | V |
| 5-3 | horiz. | 7820 | 23 | sin suelo | — | — | 23 barco/tablón, 5 cañón | 0 | 3.58 | 0 % | estructural + cañones | 8 pirata, 7 loro | gato+manzana+gato | 6 | 1 | — | sky-captain | V |
| 6-1 | horiz. | 5020 | 19 | 4 (~140) | 1103 | 4 pinchos | 2 perrito | 1120 | 0.4 | 69 % | puntual (ruta alta alternativa) | 2 esqueleto, 3 fantasma, 1 zombi | gato+manzana+gato | 4 | 1 | desvío library@1765 | — | R |
| 6-2 | horiz. | 5020 | 21 | 4 (~143) | 1110 | 4 pinchos | 2 perrito | 2260 | 0.4 | 69 % | puntual (ruta alta alternativa) | 2 zombi, 3 fantasma, 2 esqueleto | gato+manzana+gato | 4 | 1 | tienda@1628 | — | R |
| 6-3 | horiz. | 6320 | 26 | 5 (~136) | 1093 | 5 pinchos | 2 perrito | 2300 | 0.32 | 75 % | puntual (ruta alta alternativa) | 3 esqueleto, 4 fantasma, 2 zombi | gato+manzana+gato | 6 | 1 | — | vampire-count | R |
| 9-1 | horiz. | 4420 | 11 | 3 (~130) | 1190 | 3 agua mortal | — | — | 0 | 100 % | ninguna (solo agua) | 3 t-rex, 2 terodáctilo | gato+manzana | 3 | 1 | — | — | R |
| 9-2 | horiz. | 5120 | 15 | 4 (~143) | 1097 | 4 agua mortal | 4 saltador | 802 | 0.78 | 41 % | en cada hueco (temporizar) | 3 terodáctilo, 3 t-rex | gato+manzana+gato | 4 | 1 | — | — | R |
| 9-3 | horiz. | 6320 | 19 | 5 (~142) | 1063 | 5 agua mortal | 5 saltador | 862 | 0.79 | 41 % | en cada hueco (temporizar) | 4 t-rex, 4 terodáctilo | gato+manzana+gato | 6 | 1 | — | triceratops-queen | R |
| 10-1 | horiz. | 5420 | 13 | 4 (~143) | 1233 | 4 lava | 4 chorro lava | 943 | 0.74 | 44 % | en cada hueco (temporizar) | 3 dragoncito, 2 salamandra, 2 dragón volador | gato+manzana | 4 | 1 | — | — | R |
| 10-2 | horiz. | 6320 | 18 | 5 (~146) | 1135 | 5 lava | 5 chorro lava | 803 | 0.79 | 41 % | en cada hueco (temporizar) | 3 salamandra, 3 dragoncito, 3 dragón volador | gato+manzana+gato | 5 | 1 | tienda@1738 | — | R |
| 10-3 | horiz. | 7620 | 22 | 6 (~155) | 1136 | 6 lava | 6 chorro lava | 863 | 0.79 | 41 % | en cada hueco (temporizar) | 4 dragoncito, 3 salamandra, 4 dragón volador | gato+manzana+gato | 7 | 1 | — | ruby-dragon | R |
| 11-1 | horiz. | 5420 | 16 | 4 (~135) | 1223 | 4 agua mortal | 4 rocío, 1 flor-puente | 250 | 0.92 | 41 % | opcional (huecos saltables) | 2 hormiga, 1 caracol, 2 abeja | gato+manzana | 4 | 1 | desvío garden@1515 | — | R |
| 11-2 | horiz. | 6320 | 21 | 5 (~144) | 1130 | 5 agua mortal | 6 rocío, 3 flor-puente | 590 | 1.42 | 19 % | opcional (huecos saltables) | 3 abeja, 2 hormiga, 1 caracol | gato+manzana+gato | 5 | 1 | — | — | R |
| 11-3 | horiz. | 7620 | 25 | 6 (~148) | 1132 | 6 agua mortal | 7 rocío, 4 flor-puente | 650 | 1.44 | 20 % | opcional (huecos saltables) | 3 hormiga, 3 abeja, 1 caracol | gato+manzana+gato | 7 | 1 | — | queen-bee | R |
| 12-1 | horiz. | 5420 | 13 | 4 (~143) | 1227 | 4 agua mortal | 3 viento (+ hielo) | 720 | 0.55 | 11 % | constante (hielo en todo el suelo) | 2 pingüino, 2 zorro, 1 búho | gato+manzana | 4 | 1 | — | — | R |
| 12-2 | horiz. | 6320 | 18 | 5 (~146) | 1135 | 5 agua mortal | 4 viento (+ hielo) | 520 | 0.63 | 3 % | constante (hielo en todo el suelo) | 3 búho, 2 zorro, 1 pingüino | gato+manzana+gato | 5 | 1 | tienda@1738 | — | R |
| 12-3 | horiz. | 7620 | 22 | 6 (~145) | 1136 | 6 agua mortal | 5 viento (+ hielo) | 650 | 0.66 | 4 % | constante (hielo en todo el suelo) | 2 pingüino, 3 búho, 2 zorro | gato+manzana+gato | 7 | 1 | — | polar-bear | R |
| 13-1 | horiz. | 5420 | 18 | 5 (~128) | 973 | 5 agua mortal | 2 viento, 1 regalo-muelle | 800 | 0.55 | 58 % | escasa, opcional | 2 explorador, 1 reno, 1 petirrojo | gato+manzana | 5 | 1 | — | — | R+ |
| 13-2 | horiz. | 6320 | 21 | 6 (~127) | 988 | 6 agua mortal | 3 cinta | 280 | 0.47 | 60 % | escasa, opcional (cintas altas) | 2 pájaro juguete, 2 duende, 2 robot | gato+manzana | 6 | 1 | — | — | R+ |
| 13-3 | horiz. | 7100 | 25 | 7 (~126) | 937 | 7 agua mortal | 2 cinta, 1 regalo-muelle | 280 | 0.42 | 65 % | escasa, opcional | 2 caja regalo, 2 farolillo, 2 gnomo | gato+manzana | 7 | 1 | — | santa-claus | R+ |
| 14-1 | horiz. | 5710 | 12 | 5 (~132) | 973 | 5 agua mortal | 2 géiser, 2 viento | 610 | 0.7 | 33 % | opcional (géiser sobre suelo) | 2 escarabajo, 1 fénec, 1 rodador | gato+manzana | 5 | 1 | — | — | R |
| 14-2 | horiz. | 6310 | 14 | 4 (~133) | 1557 | 4 agua mortal | 3 géiser, 2 viento | 540 | 0.79 | 26 % | opcional (géiser sobre suelo) | 1 escarabajo, 2 fénec, 2 rodador | gato+manzana | 6 | 1 | — | — | R+ |
| 14-3 | horiz. | 7000 | 16 | 7 (~131) | 928 | 7 agua mortal | 3 géiser, 3 viento | 560 | 0.86 | 25 % | opcional (géiser sobre suelo) | 2 fénec, 2 rodador, 2 escarabajo | gato+manzana | 7 | 1 | — | siroco | R+ |
| 15-1 | horiz. | 5810 | 12 | 5 (~130) | 950 | 5 agua mortal | 6 cinta | 280 | 1.03 | 1 % | opcional (cintas en techos) | 2 maleta, 1 paloma, 1 ratón de cuerda | gato+manzana | 5 | 1 | — | — | R |
| 15-2 | horiz. | 6510 | 14 | 6 (~130) | 914 | 6 agua mortal | 7 cinta, 4 chorro vapor | 280 | 1.69 | 5 % | cintas opcionales + vapor en huecos | 2 maleta, 2 paloma, 1 ratón de cuerda | gato+manzana | 6 | 1 | — | — | R+ |
| 15-3 | horiz. | 7200 | 16 | 7 (~130) | 923 | 7 agua mortal | 8 cinta, 5 chorro vapor | 290 | 1.81 | 1 % | cintas opcionales + vapor en huecos | 2 maleta, 2 paloma, 2 ratón de cuerda | gato+manzana | 7 | 1 | — | don-silbato | R+ |
| 16-1 | horiz. | 5810 | 12 | 3 (~130) | 960 | 3 agua mortal | 3 compás, 3 onda | 855 | 1.03 | 21 % | en los huecos | 2 tambor, 1 pájaro nota, 1 ratón violín | gato+manzana | 5 | 1 | — | — | R+ |
| 16-2 | horiz. | 6510 | 14 | 5 (~130) | 1143 | 5 agua mortal | 4 compás, 3 onda | 765 | 1.08 | 25 % | en los huecos | 2 tambor, 2 pájaro nota, 1 ratón violín | gato+manzana | 6 | 1 | — | — | R+ |
| 16-3 | horiz. | 7200 | 16 | 5 (~130) | 920 | 5 agua mortal | 5 compás, 4 onda | 785 | 1.25 | 14 % | en los huecos | 2 tambor, 2 pájaro nota, 2 ratón violín | gato+manzana | 7 | 1 | — | maestra-armonia | R+ |
| 17-1 | vert. | 3500 | 28 | 0 | — | — | 1 ascensor, 3 nube-rebote | 40 | — | — | ascensor opcional | 4 nubecita | — | 3 | 1 | — | — | A |
| 17-2 | vert. | 3900 | 32 | 0 | — | — | 1 ascensor, 4 nube-rebote | 40 | — | — | ascensor opcional | 5 nubecita | — | 3 | 1 | — | — | A |
| 17-3 | vert. | 4300 | 35 | 0 | — | — | 1 ascensor, 4 nube-rebote | 40 | — | — | ascensor opcional | 6 nubecita | — | 4 | 1 | final | aurora-celeste | A |
| S-1 | horiz. | 5700 | 18 | 0 | — | — | 3 corriente | 835 | 0.53 | 54 % | puntual (3 columnas) | 4 pájaro, 4 unicornio | manzana+gato | 5 | 3 | — | rainbow-queen | S |
| A-1 | horiz. | 3080 | 7 | 0 | — | — | agua en toda la pantalla | 0 | — | — | constante (nadar) | 3 pez, 2 erizo | gato+manzana | 3 | 1 | — | — | N |
| A-2 | horiz. | 3980 | 8 | 0 | — | — | agua en toda la pantalla | 0 | — | — | constante (nadar) | 4 pez, 3 erizo | gato+manzana | 4 | 1 | — | — | N |
| A-3 | horiz. | 4880 | 10 | 0 | — | — | agua en toda la pantalla | 0 | — | — | constante (nadar) | 5 pez, 4 erizo | gato+manzana | 5 | 1 | — | shark-captain | N |
| D-fireflies | horiz. | 2260 | 6 | 0 | — | — | — | — | 0 | 100 % | sin mecanismo | — | — | 0 | 0 | — | — | D |
| D-mine | horiz. | 2540 | 4 | 0 | — | — | 1 vagoneta (recorre 1740 px) | 430 | — | — | estructural (vagoneta) | — | — | 0 | 0 | — | — | D |
| D-mill | horiz. | 2340 | 3 | 0 | — | — | 2 ruedas (8 tablas) + campana | 820 | — | 27 % | estructural (ruedas + campana) | — | — | 0 | 0 | — | — | D |
| D-library | horiz. | 2240 | 3 | 0 | — | — | 4 libros + interruptor | 590 | 1.79 | 23 % | estructural (libros + interruptor) | — | — | 0 | 0 | — | — | D |
| D-garden | horiz. | 2440 | 3 | 0 | — | — | 2 hojas, 1 enredadera + agua | 580 | 1.23 | 31 % | estructural (hojas + agua) | — | — | 0 | 0 | — | — | D |

## Síntesis

### Esqueleto común

42 de las 45 pantallas de campaña son horizontales y comparten la misma estructura (solo el mundo 17 es vertical):

- Empiezan en x≈80 y terminan en una bandera ≈ 160–200 px antes del borde derecho. No hay otro objetivo que llegar a la bandera.
- La longitud crece siempre dentro del mundo (salvo 6-1 = 6-2): pantalla 1 ≈ 3400–5800 px, pantalla 2 ≈ 5000–6500 px, pantalla 3 ≈ 6300–7800 px (≈ 25–30 s de carrera continua en una pantalla 3). También suben salientes, enemigos y checkpoints (1–2 más por pantalla).
- Hay **1 pegatina** por pantalla (S-1 tiene 3), **2 cajas** casi siempre (gato + manzana; solo gato en 1-1, 2-1 y 3-1; 3 en las pantallas 2–3 de los mundos 2, 4–6 y 9–12 y en 6-1), 4–15 enemigos patrullando (mediana 6) y un checkpoint cada ≈ 900–1500 px.
- El jefe está siempre en la pantalla 3. Tras él se pasa al mundo siguiente; no hay pantallas de otro tipo entre mundos.

### Tramo más repetitivo: mundos 9 a 16 (24 pantallas seguidas)

- Desde 9-1 hasta 16-3 **todas** las pantallas usan el esqueleto R/R+: un hueco de 126–160 px con agua o lava cada ≈ 920–1230 px, salientes por encima y bandera al final. El peligro cambia de color (agua, lava, agua helada, agua del desierto…), pero la forma del hueco no.
- **Pantallas prácticamente idénticas** (huecos a menos de 60 px y salientes a menos de 80 px en x y 40 px en y):
  - 10-2 = 12-2 y 10-3 = 12-3: 100 % de huecos y de salientes coinciden, con mismo ancho y mismos checkpoints. 10-1 y 12-1 comparten el 100 % de los salientes.
  - 15-2 = 16-2 (100 % de salientes, 83 % de huecos, mismos checkpoints) y 15-3 ≈ 16-3 (100 % de salientes, mismos checkpoints). 14-3 ≈ 15-3 (100 % de salientes, 86 % de huecos).
  - 9-2/9-3 coinciden en un 80 % con 10-2/10-3 y 12-2/12-3.
  - Checkpoints idénticos en 10-3, 11-3 y 12-3 (`980, 2040, 3120, 4180, 5260, 5890, 6690`), en 10-2/12-2, 11-1/12-1, 15-1/16-1, 15-2/16-2 y 15-3/16-3.
- En el código, los mundos 14–16 generan los salientes con la misma fórmula `[…].flatMap((x, i) => [repisa baja y≈300–315, repisa alta x+280/310 a y 175/205])`, por eso esas pantallas solo tienen **2–3 alturas de saliente distintas** (lo mismo en 13-x). En los mundos 1–12 hay entre 5 y 17 alturas.
- En esos mundos la mecánica suele ser **accesoria**: los huecos (≤ 160 px) se saltan sin ella. Flores-puente (11), géiseres (14), cintas (13, 15-1) y ascensor (17) son ayudas opcionales. Solo los saltadores (9-2, 9-3), los chorros de lava (10-x), el vapor (15-2, 15-3) y el compás (16-x) están dentro del hueco del camino y obligan a esperar, siempre con la misma forma: «espera a que baje y salta el hueco».
- 9-1 no tiene mecánica de mundo (solo agua mortal en los huecos). En 13-x hay 1–3 instancias por pantalla y el 58–65 % del recorrido está a más de 350 px de cualquier mecánica.

### Otras repeticiones

- **Mundo 6 (castillo)**: las tres pantallas usan un hueco con pinchos cada ≈ 1100 px y solo 2 perritos por pantalla (densidad 0.32–0.40; 69–75 % sin mecánica). 6-1 y 6-2 miden lo mismo (5020 px).
- **Mundo 1 y mundo 3**: solo 2 muelles por pantalla en el mundo 1 (53–74 % sin mecánica). El mundo 3 tiene siempre lobos dormidos en el suelo con ramas como alternativa: la mecánica está presente (≈ 1 lobo por 1000 px), pero la forma de la pantalla es la de un paseo con 2–3 huecos.
- **Mundo 2**: 2-2 y 2-3 no tienen mecánica propia (la niebla solo aparece en 2-1); son cuevas con paredes, murciélagos y huecos cada ≈ 950 px.
- Dentro de cada mundo, la pantalla 3 suele ser la pantalla 2 más larga, con 1 hueco, 1 checkpoint y 1–2 enemigos más; no cambia el formato ni la mecánica.

### Pantallas que ya rompen el patrón

- **17-1 a 17-3**: únicas verticales (960 px de ancho, 3500–4300 px de alto, vuelta lateral, ascensor con palanca, nubes de rebote, sin cajas).
- **A-1 a A-3**: natación libre en toda la pantalla, sin huecos; son las más cortas de la campaña (3080–4880 px). Opcionales desde 3-3.
- **4-1 a 4-3 y 5-1 a 5-3**: la mecánica es el suelo (copas sobre huecos de ≈ 400 px que no se cruzan sin ellas; barcos sobre el vacío). Densidad ≈ 3–3.8 por 1000 px, 0 % sin mecánica. 4-3 esconde la enredadera hacia S-1 y 5-3 añade cañones.
- **S-1**: nubes sin huecos de suelo, corrientes de aire y 3 pegatinas en vez de 1.
- **14-2**: la única con un tramo largo de suelo seguro (2640 px de isla entre x 1810 y 4450).
- **16-1**: sus primeros 1780 px no tienen huecos (el subtítulo lo presenta como «un paseo tranquilo»).
- **Desvíos**: cortos (2240–2540 px), sin enemigos, cajas, pegatinas ni checkpoints, y con mecanismos con interruptor (campana, libros, agua) o vagoneta. Son la única variante de «objetivo» distinta: activar un mecanismo para abrir el camino.

### Observaciones útiles para elegir palancas de variedad

- Todas las pantallas tienen un único objetivo (llegar a la bandera). En los datos (`Level`) no hay ningún campo para otro objetivo: rescate, recolección, persecución, contrarreloj, defensa o salida doble. Solo existen las rutas `secretExit` (4-3) y `waterExit` (3-3).
- Los formatos distintos del horizontal ya funcionan en el motor: vertical (`orientation: "vertical"`, mundo 17), natación (mundo 8) y desvíos con interruptores (`detourSwitches`, `mechanisms`). Ahora solo los usan el mundo 17, el 8 y los desvíos.
- Entre pantallas no hay nada: la tienda secreta (1-2, 3-2, 6-2, 10-2, 12-2) y los desvíos (1-1, 2-1, 2-2, 6-1, 11-1) son puertas *dentro* de una pantalla y solo hay 10 en 45 pantallas. Desde 13-1 hasta 17-3 (15 pantallas) no hay ninguna tienda, desvío ni ruta especial.
- No hay giros a mitad de pantalla: ninguna pantalla cambia de esqueleto o de mecánica por el camino (por ejemplo, de suelo a nadar o de horizontal a subida). La mecánica aparece con la misma forma desde la primera instancia hasta la última.
- La mecánica se presenta casi siempre en la pantalla 1 (pista en el Canvas al empezar en los mundos 3, 6, 10–16 y subtítulo). Las novedades a mitad de mundo son pocas: 9-2 (saltadores; 9-1 no tiene), 13-2 (cintas), 15-2 (vapor), 4-3 (enredadera) y 5-3 (cañones). 2-2 cambia a cueva pero deja atrás la niebla de 2-1.
- Por el reparto de datos, cambiar 10-x/12-x o 15-x/16-x afecta a pantallas que hoy son copias casi exactas; las constantes compartidas (`dinoFloor*`, `world10Floor*` a `world12Floor*`) y los generadores `flatMap` de 14–16 muestran dónde está la plantilla.
