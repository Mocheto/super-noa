# Casa de los gatitos: cortinas, estantería y cojín

Dossier del arte de los tres muebles nuevos de la habitación. Ticket: [Arte y código de las cortinas, la estantería y el cojín](https://github.com/Mocheto/super-noa/issues/374), del mapa [Más decoraciones y accesorios para la casa](https://github.com/Mocheto/super-noa/issues/371). Mismo estilo que [decorar](casa-decorar-v1.md), la [habitación](casa-habitacion-v1.md) y el [gato base](casa-gato-base-v1.md).

## Estado

- **Por generar.** Las originales van a `../super-noa-arte-original/casa-decorar-v2/` y se recortan con `uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-decorar-v2-recorte.py ../super-noa-arte-original/casa-decorar-v2`.

## Qué hace falta

Cada mueble tiene **cinco versiones**. La 0 es la de siempre, lisa, porque estos muebles no estaban en la habitación. Las versiones 1 a 4 forman las **habitaciones con tema**: la misma versión de los tres muebles es del mismo mundo del juego.

| Versión | Cortinas | Balda con juguetes | Cojín |
|---|---|---|---|
| 0 · de siempre | lisas, melocotón, recogidas con un lazo | balda de madera con un ovillo y un ratoncito de juguete | redondo, lila, mullido |
| 1 · DINOSAURIOS | hojas de palmera | dinosaurios de juguete y un volcancito | huevo de dinosaurio moteado |
| 2 · HIELO | azul hielo con copos | muñeco de nieve y pingüino | bola de nieve, como un iglú |
| 3 · BARCOS | lona de vela con cuerda | barquito, catalejo y cofre | salvavidas |
| 4 · CELESTE | nubes con estrellas | luna, estrellas y un cohete | nube |

**Dónde va cada mueble** (escena de 1280 × 540; cada versión se escala para ocupar su caja):

| Mueble | Caja (x, y, ancho, alto) | Apoyo |
|---|---|---|
| Cortinas | 596, 22, 286, 262 | alrededor de la ventana: una a cada lado y la barra arriba; **el centro queda vacío** para que se vea el cristal |
| Estantería | 282, 150, 160, 82 | colgada en la pared, sobre la cama |
| Cojín | 165, 455, 150, 72 | en el suelo, delante a la izquierda |

| # | Lámina | Adjuntar | Archivo final |
|---|---|---|---|
| 1 | Cortinas | La habitación de ahora (`public/assets/worlds/casa-habitacion-v1.webp`). | `sprites/casa-mueble-cortinas-v1.webp` |
| 2 | Estanterías | La habitación de ahora. | `sprites/casa-mueble-estanteria-v1.webp` |
| 3 | Cojines | La habitación de ahora. | `sprites/casa-mueble-cojin-v1.webp` |

## Cómo trabajar

1. Copia cada prompt entero; ya lleva el estilo dentro.
2. Adjunta la habitación de ahora en las tres, para que el estilo y el tamaño casen.
3. Las tres van sobre **verde plano `#00FF00`**, en **formato horizontal 16:9**, con las cinco piezas en **dos filas: tres arriba y dos abajo**, en el orden del prompt. Yo las recorto y las monto.
4. Comprueba que hay **exactamente cinco piezas separadas** y que nada lleva verde chillón. En las cortinas, el hueco de en medio tiene que ser verde (sin ventana dibujada).
5. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir.
6. Guarda las originales fuera del repositorio, en `../super-noa-arte-original/casa-decorar-v2/`, con los nombres `casa-cortinas`, `casa-estanterias` y `casa-cojines` (cualquier extensión).

## 1. Cortinas

- **Adjuntar:** la habitación de ahora.
- **Formato:** horizontal 16:9.
- **Será:** `sprites/casa-mueble-cortinas-v1.webp`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly five separate curtain sets arranged in two rows, three on the top row and two on the bottom row, each centered in its own space, all the same size, the same pixel scale and the same front view, made to hang around the big square window of the attached room. Each curtain set is one piece: a straight curtain rod across the top with two curtains hanging from it, one on the far left and one on the far right, each gathered back at the middle with a tie, and NOTHING between the two curtains: the middle is completely empty, plain green background, no window, no glass, no wall. Each set is a little wider than tall. 1. plain soft peach curtains with a little cream bow tie on each side and a simple wooden rod; 2. jungle curtains made of big dark-leafy palm leaves in warm olive and teal greens with a bamboo rod and a tiny orange dinosaur footprint on each tie; 3. icy light-blue curtains with white snowflakes, a frosty white rod with little icicles hanging from it; 4. cream sailcloth curtains with a rope tie on each side, a wooden ship mast as the rod and a tiny red flag at one end; 5. dark-blue night curtains covered in soft white clouds and little yellow stars, with a golden rod ending in a crescent moon. Plain flat solid pure green background (#00FF00) behind, between and inside all the curtain sets, generous empty space between them, no window, no wall, no floor, no cast shadow, no bright green anywhere in the curtains (palm leaves in a darker, softer green). No text, no letters, no numbers, no labels, no watermark.
```

## 2. Estanterías

- **Adjuntar:** la habitación de ahora.
- **Formato:** horizontal 16:9.
- **Será:** `sprites/casa-mueble-estanteria-v1.webp`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly five separate small wall shelves with toys on them, arranged in two rows, three on the top row and two on the bottom row, each centered in its own space, all the same size, the same pixel scale and the same front view as the wooden wall shelf holding the plant in the attached room, so they can hang on the wall above the cat bed. Each one is a single short floating shelf, about twice as wide as it is tall including the toys standing on top, with two little brackets underneath. 1. a plain honey-wood shelf with a red ball of yarn and a small grey toy mouse; 2. a bamboo shelf with three little toy dinosaurs (a green-blue long-neck, an orange t-rex and a yellow triceratops) and a tiny toy volcano with a puff of smoke; 3. a frosty white shelf with a small smiling snowman wearing a red scarf and a little penguin; 4. a wooden ship-plank shelf with a little toy sailboat, a golden telescope and a tiny treasure chest; 5. a dark-blue shelf with a smiling crescent moon, two little yellow stars and a small red-and-white toy rocket. Plain flat solid pure green background (#00FF00) behind and between all the shelves, generous empty space between them, no wall, no cast shadow, no bright green anywhere in the shelves or toys. No text, no letters, no numbers, no labels, no watermark.
```

## 3. Cojines

- **Adjuntar:** la habitación de ahora.
- **Formato:** horizontal 16:9.
- **Será:** `sprites/casa-mueble-cojin-v1.webp`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly five separate big soft floor cushions for cats, arranged in two rows, three on the top row and two on the bottom row, each centered in its own space, all the same size, the same pixel scale and the same front view, slightly from above, as the round cat bed on the floor of the attached room, so a cat can sit on them. Each cushion is low and plump, about twice as wide as it is tall, with a flat bottom. 1. a plain round lilac plush cushion with a little button in the middle; 2. a cushion shaped like a big cream dinosaur egg lying on its side, with soft orange and teal spots; 3. a round white snowball cushion with blue shading like a little igloo with snow bricks; 4. a red-and-white striped life ring cushion with a rope around it and a soft cream middle; 5. a fluffy white cloud cushion with a few tiny yellow stars sewn on. Plain flat solid pure green background (#00FF00) behind and between all the cushions, generous empty space between them, no floor, no cast shadow, no green at all in the cushions. No text, no letters, no numbers, no labels, no watermark.
```
