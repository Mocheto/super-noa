# Variedad en la campaña: arte nuevo

Dossier del arte nuevo del plan de variedad: la sala-rompecabezas, la exploración, la avioneta de las nubes y el paseo de los amigos. El arte se genera a mano con los prompts de este documento, sin servicios de pago integrados en la sesión. Ticket: [Preparar los dossiers del arte nuevo](https://github.com/Mocheto/super-noa/issues/70), del mapa [Variedad en la campaña](https://github.com/Mocheto/super-noa/issues/55).

## Qué hace falta y qué no

| Cambio | Arte nuevo | Se reutiliza |
|---|---|---|
| Sala-rompecabezas ([decisión](https://github.com/Mocheto/super-noa/issues/67)) | 3 láminas del atlas `puzzle-pieces`: activadores, puertas y emblemas, cajón y plataformas de color | El suelo, las paredes y el fondo de cada mundo |
| Exploración ([decisión](https://github.com/Mocheto/super-noa/issues/66)) | 1 lámina: la puerta de los gatitos, cerrada y abierta | Los gatitos (`sprites/world-cat-*-v1.png`), el terreno y los enemigos de cada mundo |
| Persecución amable ([decisión](https://github.com/Mocheto/super-noa/issues/68)) | Ninguno | Los recortes de enemigos y `sprites/yarn-ball-v1.png` |
| Avioneta de las nubes ([decisión](https://github.com/Mocheto/super-noa/issues/61)) | 5 láminas: avioneta, pompa, nubarrón, arcoíris final y fondo de cielo | La estrella de `atlases/collectibles-v1.png`, `sprites/secret-star-aura-v1.png`, `sprites/enemy-bird-v2.png` y los unicornios |
| Paseo de los amigos ([decisión](https://github.com/Mocheto/super-noa/issues/64)) | 1 lámina: el bocadillo | El corazón: `sprites/ui-heart-v1.png` ya existe |
| Pestaña Amigos ([decisión](https://github.com/Mocheto/super-noa/issues/69)) | Ninguno | Los recortes de enemigos, la manzana, `bellota-v1` y `bloom-flower-v1` |

Total: **10 láminas**.

## Cómo trabajar

1. Genera cada lámina con su prompt. Pega **ESTILO** al principio y **FONDO** al final, salvo en el fondo de cielo (lámina 9), que tiene su propio cierre.
2. Adjunta las **referencias** que indica cada lámina, en el mismo orden: el prompt habla de la «primera imagen adjunta», la «segunda», etc.
3. Todas las piezas, salvo el cielo, van sobre **verde plano `#00FF00`**. Yo las recorto a transparente, las alineo, las corto en celdas y las exporto a WebP en la ruta indicada. Pásamelas tal cual salgan, con la mayor resolución que dé el modelo.
4. Si un modelo estropea una lámina con varias piezas, genera cada pieza por separado con el mismo prompt, dejando en la lista solo esa pieza.
5. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir con el prompt.
6. Guarda las láminas originales fuera del repositorio; al repositorio solo van los archivos finales.

## Bloques comunes

**ESTILO**

> Chunky, readable pixel art in the style of a charming 16-bit platform game for young children: bold dark-plum outlines (#2f1d33), warm cel shading with two or three tones per color, saturated friendly colors, rounded cute shapes, a small white highlight on shiny surfaces. Crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Every item is drawn straight-on from the front, centered in its own cell, all at the same pixel scale.

**FONDO**

> Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between items, no floor, no cast shadow, no bright green anywhere in the items (use only dark olive green if a plant is needed). No text, no letters, no numbers, no labels, no watermark.

## Piezas

| # | Lámina | Referencias que adjuntar | Archivo final | Tamaño en escena |
|---|---|---|---|---|
| 1 | Activadores de sala | `atlases/detour-switches-v1.png`, `atlases/platform-tiles-v1.png` | `atlases/puzzle-pieces-v1.webp` (fila 1–2) | botón 72 × 28, placa 104 × 20 |
| 2 | Puertas y emblemas | `atlases/platform-tiles-v1.png`, `atlases/detour-switches-v1.png` | `atlases/puzzle-pieces-v1.webp` (fila 3) | puerta 64 × 180, emblema 32 × 32 |
| 3 | Cajón y plataformas de color | `atlases/platform-tiles-v1.png` | `atlases/puzzle-pieces-v1.webp` (fila 4) | cajón 96 × 96, plataforma 24 de alto |
| 4 | Puerta de los gatitos | `atlases/platform-tiles-v1.png`, `sprites/world-cat-1-v1.png` | `sprites/kitten-gate-v1.webp` | 140 × 200 |
| 5 | Avioneta, 4 poses | `sprites/noa-rps-0.png`, `sprites/world-cat-1-v1.png` | `sprites/avioneta-v1.webp` | 200 × 150 por pose |
| 6 | Pompa | `atlases/collectibles-v1.png` | `sprites/pompa-v1.webp` | 40 × 40 |
| 7 | Nubarrón, 2 caras | `worlds/sky-kingdom-background-v1.webp` | `sprites/nubarron-v1.webp` | 128 × 96 |
| 8 | Arcoíris final | `worlds/sky-kingdom-background-v1.webp` | `sprites/arcoiris-final-v1.webp` | 1040 × 300 |
| 9 | Fondo de cielo vertical | `worlds/sky-kingdom-background-v1.webp` | `worlds/cielo-avioneta-v1.webp` | 960 × 1080, se repite en vertical |
| 10 | Bocadillo | `sprites/ui-heart-v1.png` | `sprites/bocadillo-v1.webp` | 9-slice, de 120 × 60 en adelante |

Todas las rutas son relativas a `public/assets/`.

### 1. Activadores de la sala-rompecabezas

La sala tiene tres activadores: el **botón de huella** (se pisa una vez y se queda hundido), la **placa** (abre solo mientras algo pesa encima) y los **botones de color** rosa y azul. Cada uno va en dos estados: arriba y abajo.

Adjunta `detour-switches-v1.png` (la placa con la huella del centro es el símbolo que queremos) y `platform-tiles-v1.png` (acabado de la piedra y la madera).

Prompt (ESTILO + este texto + FONDO, formato 16:9):

```text
A pixel-art item sheet for a children's puzzle room, in two rows of four cells, every item seen from the front at floor level, all sitting on the same invisible baseline.
Row 1, "up" state (not pressed):
1. Paw button: a low round stone pedestal with a big chunky golden button on top, the button raised and bulging, a dark-plum cat paw print (one big pad and four round toes) embossed on its face, like the paw sign in the first attached image.
2. Pressure plate: a long flat rectangular stone slab, slightly raised above the floor, with a simple carved square border and four small rivets at the corners, warm grey stone like the second attached image.
3. Pink button: the same round stone pedestal as item 1 with a raised glossy candy-pink (#ef79a9) button and a small white highlight.
4. Blue button: the same pedestal with a raised glossy sky-blue (#5aa0dc) button and a small white highlight.
Row 2, "down" state (pressed): the same four items in the same order and same size, each button pushed down almost flush with its pedestal and the pressure plate sunk flat into the floor, plus a small ring of tiny yellow sparkles around each one to show it is active.
```

### 2. Puertas y emblemas

Cada puerta comparte símbolo y color con su activador: **huella**, **estrella** o **luna**. El juego dibuja el emblema encima de la puerta, en su hueco redondo, así que la puerta va sin símbolo y los emblemas van sueltos.

Adjunta `platform-tiles-v1.png` y `detour-switches-v1.png`.

Prompt (ESTILO + este texto + FONDO, formato 16:9):

```text
A pixel-art item sheet for a children's puzzle room, in one row of five cells, same pixel scale.
1. Closed door: a tall narrow gate, about three times taller than wide, made of thick vertical wooden planks with two dark iron bands, set in a rounded grey stone frame. Near the top of the frame there is one empty round socket (a small circular hollow, plain and dark inside) where a symbol will be placed later. The planks reach the floor.
2. Open door: exactly the same stone frame and the same empty round socket, but the wooden planks are raised up into the top of the frame so the doorway is an open dark-warm arch you can walk through, with a few tiny sparkles at the bottom edge.
3. Paw emblem: a small round badge, golden-orange (#f4a640) with a dark-plum cat paw print in the middle, like the paw sign in the second attached image.
4. Star emblem: a small round badge, sunny yellow (#f2c230) with a fat five-pointed white star in the middle.
5. Moon emblem: a small round badge, lilac (#b98be0) with a white crescent moon in the middle.
The three emblems are the same size and each one fits exactly inside the round socket of the door.
```

### 3. Cajón y plataformas de color

El **cajón** se empuja y sirve de escalón. Las **plataformas de color** se vuelven sólidas o transparentes al pisar los botones de su color; la versión transparente se pinta como contorno y el juego le baja la opacidad.

Adjunta `platform-tiles-v1.png`.

Prompt (ESTILO + este texto + FONDO, formato 16:9):

```text
A pixel-art item sheet for a children's puzzle room, in four rows, same pixel scale as the first attached image.
Row 1: one big square wooden crate, perfectly square, sturdy light-brown planks with darker plank lines, a thick darker wooden frame around the edges and a diagonal brace, small iron corner caps. Front view, flat top so a child can stand on it.
Row 2: a thin horizontal floating platform in candy pink (#ef79a9), about six times wider than tall, drawn as three separate pieces side by side with a small gap: a rounded left end cap, a plain middle segment that can repeat seamlessly left to right, and a rounded right end cap. Glossy jelly-like top edge with a white highlight line, darker pink underside.
Row 3: the same three-piece platform in sky blue (#5aa0dc), same shapes and size.
Row 4: "ghost" versions of rows 2 and 3: the same pink three-piece platform and the same blue three-piece platform drawn only as a dashed outline in their color with a very pale tint inside, as if they were made of light and not solid yet.
```

### 4. Puerta de los gatitos

Meta de las pantallas de exploración (3-2 bosque, 9-2 isla y 14-2 desierto): tiene **tres huecos** donde se sientan los gatitos perdidos al encontrarlos. El juego dibuja cada gatito dentro de su hueco, así que los huecos van vacíos. La puerta debe quedar bien en los tres mundos: madera y piedra neutras, sin plantas propias de ningún bioma.

Adjunta `platform-tiles-v1.png` (piedra y madera) y `world-cat-1-v1.png` (para el tamaño de los gatitos que caben en los huecos).

Prompt (ESTILO + este texto + FONDO, formato 16:9):

```text
A pixel-art sprite sheet with exactly two versions of the same cute storybook gate, side by side, same size and same position in both cells, front view, standing on an invisible baseline.
The gate: a rounded arched doorway, a bit taller than wide, built from warm grey stones with a big wooden door with vertical planks and a heart-shaped iron knocker. Above the door, carved into the stone arch, there are three equal round niches in a row, each niche empty, dark-warm inside, with a cushion-like lighter rim, each one large enough for a small sitting kitten like the one in the second attached image. Under each niche there is a tiny carved paw print. A little wooden roof with rounded shingles tops the arch.
Version 1 "closed": the wooden door is shut and a soft wooden latch crosses it.
Version 2 "open": the wooden door swings inward and the doorway shows a warm golden light inside, with a few tiny sparkles around the arch and the paw prints glowing golden.
```

### 5. Avioneta

La avioneta sube por la pantalla vista **desde atrás y un poco desde arriba**: se ven la cola, las alas, el respaldo con Noa (gorro de aviadora y gafas) y el gatito copiloto. Cuatro poses: recta, inclinada a la izquierda, inclinada a la derecha y voltereta.

Adjunta `noa-rps-0.png` (Noa) y `world-cat-1-v1.png` (el gatito copiloto).

Prompt (ESTILO + este texto + FONDO, formato 21:9 o 16:9):

```text
A pixel-art sprite sheet with exactly four poses of the same small toy-like propeller airplane, in one horizontal row, evenly spaced, same size, all seen from behind and slightly above, as if the plane were flying away up into the sky.
The airplane: chubby and round, bright red (#d9403a) with cream-white trim, short wide wings with small yellow wing-tip lights, a rounded tail fin with a little yellow star, a spinning propeller visible at the front as a pale blurred circle beyond the nose. Two open seats: in the front seat a little girl, seen from behind with her face turned a bit to the side so her smile shows, wearing a brown leather aviator cap with ear flaps and round goggles pushed up on the cap, her brown wavy hair and red apple hair clip from the first attached image visible under the cap; in the back seat a small orange tabby kitten with a blue bandana, like the second attached image, also wearing tiny goggles, both paws on the seat edge.
Pose 1 "straight": level wings.
Pose 2 "lean left": the whole plane banked to the left, left wing lower, the girl leaning left and laughing.
Pose 3 "lean right": mirror of pose 2, banked to the right.
Pose 4 "loop": the plane rolled sideways halfway through a playful barrel roll, wings almost vertical, a short white swirl trail around it, the girl and the kitten holding on with surprised happy faces.
```

### 6. Pompa

Lo que lanza la avioneta: una pompa de arcoíris que limpia los nubarrones.

Adjunta `collectibles-v1.png` (acabado de los objetos brillantes).

Prompt (ESTILO + este texto + FONDO, formato 16:9):

```text
A pixel-art sprite sheet with exactly three frames of the same soap bubble, in one horizontal row, same size cells.
Frame 1: a perfectly round soap bubble with a thin dark-plum outline, a pale transparent-looking lilac-white inside, and a rainbow sheen band curving around its lower half (red, yellow, light blue, pink), plus one bright white highlight spot near the top left.
Frame 2: the same bubble slightly squashed sideways, as if wobbling.
Frame 3: the bubble popping: a ring of small rainbow-colored droplets and tiny white sparkles flying outward from the center, no bubble left.
```

### 7. Nubarrón

Los obstáculos de la avioneta: un **nubarrón gruñón** que, al recibir una pompa, se vuelve una **nubecita sonriente**.

Adjunta `sky-kingdom-background-v1.webp` (las nubes del reino de las nubes).

Prompt (ESTILO + este texto + FONDO, formato 16:9):

```text
A pixel-art sprite sheet with exactly two versions of the same puffy cartoon cloud, side by side, same size and same outline shape in both, front view.
The cloud: wide and round with three soft bumps on top and a flat-ish bottom, a little wider than tall.
Version 1 "grumpy": stormy blue-grey and violet (#8e8aa8 with darker #5b5677 shading), small frowning eyebrows, closed grumpy eyes, a pouting wavy mouth, a couple of tiny grey puffs around it. Cute and sulky, never scary.
Version 2 "happy": the same cloud now bright white with soft pale-blue shading, big round shiny happy eyes, a wide open smile, pink blush cheeks (#ff9fb5) and two tiny yellow sparkles.
```

### 8. Arcoíris final

Al final del vuelo baja un **gran arcoíris** y la avioneta lo cruza.

Adjunta `sky-kingdom-background-v1.webp`.

Prompt (ESTILO + este texto + FONDO, formato 21:9):

```text
A pixel-art wide rainbow arch filling the width of the image: a big half-circle rainbow with six thick clean bands from outside to inside: red (#ef5b5b), orange (#f4a640), yellow (#ffd76a), light green (#7fcf6b), sky blue (#5aa0dc) and lilac (#b98be0), each band outlined in dark plum. Both feet of the rainbow rest on fluffy white cartoon clouds with pale-blue shading. A few small yellow twinkling stars are scattered along the top of the arch. The space under the arch is empty, plain green background.
```

Aquí sí hay verde claro en una banda del arcoíris: el recorte quita solo el verde `#00FF00` conectado con el borde, así que la banda no se pierde. Si el modelo la pinta demasiado parecida al fondo, cambia `light green (#7fcf6b)` por `mint (#8fe3c4)`.

### 9. Fondo de cielo vertical

El cielo por el que sube la avioneta. Se repite en vertical, así que el borde de arriba debe casar con el de abajo. Si no casa del todo, yo lo empalmo por código con un fundido.

Adjunta `sky-kingdom-background-v1.webp` como referencia de colores y nubes.

Prompt (formato 9:16, **sin** el bloque FONDO; pega solo ESTILO al principio y este texto después):

```text
A tall vertical pixel-art sky background for a children's flying game, seen as if looking straight ahead while flying upward. A soft daytime sky with a gentle vertical gradient from warm light blue at the bottom to slightly deeper sky blue at the top, painted in flat pixel bands (no smooth gradient). Scattered small and medium fluffy white clouds with pale-blue shading on the left and right sides, a few tiny distant pastel clouds and small yellow twinkles, leaving the central vertical third mostly open sky so game objects stay readable. The image must tile seamlessly from top to bottom: the clouds and colors along the top edge continue exactly from the bottom edge. No characters, no airplanes, no birds, no ground, no sun, no text, no watermark.
```

### 10. Bocadillo

El bocadillo del paseo de los amigos («¡Aquí no muerde!») y de las visitas de la pestaña Amigos. El texto lo pone el juego; se estira como 9-slice, así que el centro debe ser liso.

Adjunta `ui-heart-v1.png` (mismo grosor de contorno y acabado).

Prompt (ESTILO + este texto + FONDO, formato 16:9):

```text
A pixel-art sprite sheet with exactly two empty speech bubbles, side by side, same height.
Bubble 1: a wide rounded-rectangle speech bubble, about twice as wide as tall, warm cream-white fill (#fff6e3), thick dark-plum outline the same weight as the attached heart, a very subtle one-pixel lighter highlight along the inner top edge, and a small triangular tail centered at the bottom pointing down. The inside is completely plain and flat, ready for text.
Bubble 2: the same bubble with its tail on the bottom left instead of the center.
Both bubbles are completely empty inside.
```

## Archivos finales

Cuando tenga las láminas, las paso a estos archivos (ancho y alto en píxeles del archivo; el juego los escala al tamaño en escena):

| Archivo | Contenido | Celdas |
|---|---|---|
| `atlases/puzzle-pieces-v1.webp` | Fila 1: botón de huella, placa, botón rosa y botón azul, arriba. Fila 2: lo mismo, abajo. Fila 3: puerta cerrada, puerta abierta y emblemas de huella, estrella y luna. Fila 4: cajón y piezas izquierda, centro y derecha de las plataformas rosa y azul, sólidas y transparentes. | rejilla de 128 × 128 (las puertas, 128 × 256) |
| `sprites/kitten-gate-v1.webp` | Tira de 2: cerrada, abierta, con la posición de los tres huecos medida para dibujar los gatitos. | 2 × 280 × 400 |
| `sprites/avioneta-v1.webp` | Tira de 4: recta, izquierda, derecha y voltereta. | 4 × 400 × 300 |
| `sprites/pompa-v1.webp` | Tira de 3: pompa, pompa aplastada y estallido. | 3 × 80 × 80 |
| `sprites/nubarron-v1.webp` | Tira de 2: gruñón y sonriente. | 2 × 256 × 192 |
| `sprites/arcoiris-final-v1.webp` | El arcoíris entero. | 1 × 2080 × 600 |
| `worlds/cielo-avioneta-v1.webp` | El cielo, con borde de arriba y de abajo empalmados. | 1 × 960 × 1080 |
| `sprites/bocadillo-v1.webp` | Tira de 2: cola centrada y cola a la izquierda, con los márgenes del 9-slice medidos. | 2 × 240 × 120 |

Las rutas en el código usan siempre `./assets/...`.
