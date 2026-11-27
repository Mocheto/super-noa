# Casa de los gatitos: la madriguera de los conejos

Dossier del arte de la madriguera. Tickets: [Prompts del arte](https://github.com/Mocheto/super-noa/issues/450), [Generar el arte](https://github.com/Mocheto/super-noa/issues/451) y [Montar el arte](https://github.com/Mocheto/super-noa/issues/452), del mapa [La madriguera de los conejos](https://github.com/Mocheto/super-noa/issues/439). Especificación: [madriguera.md](../casa/madriguera.md). Mismo estilo que el [jardín](casa-jardin-v1.md).

## Estado

- **Montada** en [Montar el arte](https://github.com/Mocheto/super-noa/issues/452). Las originales están en `../super-noa-arte-original/casa-madriguera-v1/` y `prototypes/tools/casa-madriguera-recorte.py` las recorta.
- El **corte** generado no respetó la guía: el script toma de él la hierba, las piedras, las raíces y las tres cuevas, las coloca donde andan los conejos y dibuja los túneles.
- La **pradera** se compone: cielo, tapia, hierba y nubes salen del jardín para que continúen sin salto; del arte, el montículo y la bajante.
- En **Algodón** la oreja caída solo salió en la pose de asomar y, a medias, en alguna más: se distingue sobre todo por el color.

## Qué se genera

| # | Lámina | Adjuntar | Se publica como | Medida final |
|---|---|---|---|---|
| 1 | Pradera con el montículo | `public/assets/worlds/casa-jardin-v1.webp` | `worlds/casa-jardin-madriguera-v1.webp` | 480 × 540 |
| 2 | Corte de tierra | [`guias/casa-madriguera-corte.png`](guias/casa-madriguera-corte.png) y la lámina 1 | `worlds/casa-madriguera-corte-v1.webp` | 1280 × 540 |
| 3 | Los seis escondites | La lámina 2 | `sprites/casa-conejo-escondites-v1.webp` | 6 celdas de 200 × 140 en una fila |
| 4 | Zanahoria y botón | `public/assets/sprites/casa-objetos-v1.webp` | `sprites/casa-zanahoria-v1.webp` | 2 celdas de 128 × 128 |
| 5 | Canela | La lámina de cosas (`sprites/casa-objetos-v1.webp`) y la lámina 1 | `sprites/casa-conejo-canela-v1.webp` | 5 × 2 celdas de 180 × 200 |
| 6 | Algodón | La lámina 5 | `sprites/casa-conejo-algodon-v1.webp` | 5 × 2 celdas de 180 × 200 |

No se generan: las flechas, los corazones, la zeta del sueño, las luciérnagas, la luz de noche, la lluvia y la nieve, y los rótulos. Siguen por código.

## Cómo trabajar

1. Copia el prompt entero; ya lleva el estilo dentro. Adjunta lo que dice la tabla.
2. Las láminas 3 a 6 van sobre **verde plano `#00FF00`**. Las láminas 1 y 2 son fondos completos.
3. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir.
4. Guarda las originales fuera del repositorio, en `../super-noa-arte-original/casa-madriguera-v1/`, con los nombres `pradera`, `corte`, `escondites`, `zanahoria`, `canela` y `algodon`. El recorte y el montaje son el ticket [Montar el arte](https://github.com/Mocheto/super-noa/issues/452).

La guía del corte sale de las medidas del juego (`node --experimental-strip-types prototypes/tools/casa-madriguera-guia.mjs`): hay que volver a generarla si cambian los túneles.

## 1. Pradera con el montículo

- **Formato:** casi cuadrado, un poco más alto que ancho (8:9).
- **Qué mirar:** las franjas de cielo, tapia y hierba tienen que continuar las del jardín adjunto, y el agujero queda en el centro, abajo.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: flat warm colors with at most two shading tones, crisp hard pixel edges, no blur, no anti-aliasing, no soft gradients. Everything original, simple and friendly, nothing copied from any game. A background that continues the attached garden to its LEFT: exactly the same style, colors, pixel size and heights of the horizontal bands. From top to bottom: light blue sky with one or two small white clouds down to about half of the height; a plain cream garden wall from about 49% to 81% of the height; flat green grass from about 81% to the bottom. Along the very right edge, a thin darker vertical line from the top down to the grass: the corner of the house that begins there. In the middle of the image, resting on the grass, one low rounded rabbit burrow mound of earth covered in grass, about 60% of the image width, its top at about 76% of the height, with ONE round dark entrance hole facing the viewer, centered horizontally at about 48% of the width and 87% of the height, ringed with a little brown soil. Nothing else: no rabbits, no animals, no carrots, no signs, no fence posts, no trees. No text, no letters, no numbers, no watermark. Portrait aspect ratio 8:9.
```

## 2. Corte de tierra

- **Formato:** horizontal muy ancho (21:9).
- **Qué mirar:** los túneles, las tres cuevas y los dos círculos de puntos tienen que quedar donde en la guía. Los conejos andan por ahí.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, crisp hard pixel edges, no blur, no anti-aliasing, no soft gradients. Everything original, simple and friendly, nothing copied from any game. Repaint the attached layout guide as a cheerful cross-section of a rabbit burrow seen from the side, keeping EXACTLY the same position, size and shape of every element: a thin strip of green grass along the top; warm brown earth with a few small pebbles and thin roots; the connected tunnels as wide, smooth, darker corridors with a soft rim; the three large oval chambers as cozy hollows, slightly lighter than the tunnels; the two dashed ovals as faint dotted outlines of places not dug yet. The upper-left chamber is a bedroom: a little hanging lantern and roots on its ceiling. The right chamber is a pantry: a small wooden shelf with jars at its back wall. The lower chamber is a playroom: a tiny string of colored flags on its back wall. Keep the lower half of each chamber and every tunnel EMPTY and uncluttered, because characters and objects are added on top. No rabbits, no animals, no straw, no carrots, no balls, no boxes, no baskets, no blankets, no arrows. No text, no letters, no numbers, no watermark. Aspect ratio 21:9.
```

## 3. Los seis escondites

- **Formato:** horizontal muy ancho (21:9).
- **Orden de las celdas:** montón de paja, mantita, montón de zanahorias, cesta, caja, pelota grande.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly six separate items in one row, evenly spaced, each centered in its own cell, all at the same pixel scale, front view, all resting on the same baseline, each wide and tall enough for a small rabbit to hide behind: 1. a round heap of golden straw; 2. a folded, puffy light-blue checkered blanket standing in a mound; 3. a heap of orange carrots with dark olive-green leaves; 4. a round wicker basket with an arched handle; 5. an open cardboard box with its flaps out; 6. a big red ball with a cream stripe. Plain flat solid pure green background (#00FF00) behind and between all items, generous empty space between items, no floor, no cast shadow, no bright green in the items. No rabbits. No text, no letters, no numbers, no labels, no watermark.
```

## 4. Zanahoria y botón

- **Formato:** horizontal (2:1).
- **Orden de las celdas:** zanahoria, cabeza de conejo (para el botón de la bandeja).

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly two separate items in one row, evenly spaced, each centered in its own square cell, both at the same size, same drawing style as the attached objects, big and simple enough to read as small buttons: 1. one plump orange carrot lying diagonally, tip pointing down-left, with a tuft of dark olive-green leaves; 2. the head of a white rabbit seen from the front, two upright ears with pink inside, black shiny eyes, tiny pink nose. Plain flat solid pure green background (#00FF00) behind and between the items, generous empty space between them, no floor, no cast shadow, no bright green in the items. No text, no letters, no numbers, no labels, no watermark.
```

## 5. Canela

- **Formato:** horizontal (por ejemplo 16:7).
- **Orden, fila de arriba:** sentada, saltando encogida, saltando estirada, comiendo con la cabeza baja, erguida.
- **Orden, fila de abajo:** lavándose, acurrucada despierta, dormida, contenta con los ojos cerrados, asomando (solo orejas y coronilla).

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet of ONE rabbit character in exactly ten poses, in two rows of five, evenly spaced, each in its own cell, all at the same scale, side view facing RIGHT, feet on the same baseline in each row. The character: a small chubby light-brown cinnamon rabbit with a cream muzzle, chest and fluffy round tail, two long UPRIGHT ears with pink inside, black shiny eyes, tiny pink nose. Top row: 1. sitting, looking ahead; 2. hopping, crouched about to jump; 3. hopping, stretched in mid-air; 4. head down, nibbling something on the ground (draw no food); 5. standing up on its hind legs, nose in the air. Bottom row: 6. washing its face with both front paws; 7. curled up low and comfortable, eyes open; 8. asleep curled up, eyes closed, ears resting back; 9. sitting happily with eyes closed and nose raised, being petted (draw no hand); 10. ONLY the two ears and the top of the head with the eyes, peeking up from below, cut flat at the bottom. Identical proportions and colors in every pose. Plain flat solid pure green background (#00FF00), generous empty space between poses, no floor, no cast shadow. No text, no letters, no numbers, no labels, no watermark.
```

## 6. Algodón

- **Adjuntar:** la lámina 5 ya elegida.
- **Formato y orden:** los de Canela.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet matching EXACTLY the layout, the ten poses and the drawing style of the attached rabbit sheet, but with a different character: a white rabbit, a little rounder and chubbier than the attached one, soft cream shading, ONE ear upright and the other ear FLOPPED down sideways (the same ear flopped in every pose, including the peeking one), pink inside the ears, black shiny eyes, tiny pink nose, fluffy round tail. Side view facing RIGHT, feet on the same baseline in each row. Plain flat solid pure green background (#00FF00), generous empty space between poses, no floor, no cast shadow. No text, no letters, no numbers, no labels, no watermark.
```
