# Casa de los gatitos: la habitación y los objetos

Dossier del fondo de la casa y de los objetos de la bandeja. Ticket: [La habitación de la casa](https://github.com/Mocheto/super-noa/issues/170), del mapa [La casa de los gatitos](https://github.com/Mocheto/super-noa/issues/166). Mismo estilo que el [gato base](casa-gato-base-v1.md).

## Estado

- **Hecho (19-11-2026):** recortadas con `prototypes/tools/casa-recorte.py`. La habitación salió en 16:9 y se recorta por arriba y por la banda oscura de abajo hasta 1280 × 540; la ventana de noche se coloca en x = 619, y = 39 (239 × 234).

## Qué hace falta

| # | Lámina | Archivo final | Tamaño en escena |
|---|---|---|---|
| 1 | Habitación de día | `worlds/casa-habitacion-v1.webp` | 1280 × 540 |
| 2 | Ventana de noche | `sprites/casa-ventana-noche-v1.webp` | lo que mida la ventana de la lámina 1 |
| 3 | Objetos | `sprites/casa-objetos-v1.webp` | cada objeto, unos 96 × 96 |

- **La habitación** mide 1280 × 540 y se desliza con el dedo. De izquierda a derecha lleva:
  - la puerta;
  - la cama redonda de gatitos en el suelo;
  - la alfombra redonda en el centro, donde se sientan los gatitos;
  - el rascador pequeño al fondo;
  - la ventana en la pared;
  - la estantería baja con una planta y un cuadro;
  - la bañera al fondo a la derecha (por ahora es solo decorado; su pantalla de baño llegará más adelante);
  - la lámpara de pie en la esquina derecha.
- **La noche** la pone el juego: un tono azul encima, la lámpara con un halo de luz y la ventana nocturna recortada en su sitio. Por eso la habitación se dibuja una sola vez, de día.
- **El suelo** queda libre y llano en la franja de abajo (de y = 440 a 540): ahí andan y se sientan los gatitos y se ven las huellas de barro.

## Cómo trabajar

1. Copia el prompt entero.
2. Adjunta la lámina de referencia del gato base, para que el estilo case.
3. La lámina 1 va a toda la imagen, sin fondo verde. Las láminas 2 y 3 van sobre **verde plano `#00FF00`**. Yo las recorto, ajusto la habitación a 1280 × 540 y coloco la ventana de noche.
4. Si el modelo no da un formato tan ancho, genera la habitación en dos mitades (izquierda y derecha) con el mismo prompt, diciendo qué mitad es; yo las uno.
5. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir.
6. Guarda las originales fuera del repositorio, en `../super-noa-arte-original/casa-v1/`.

## Lámina 1: habitación de día

Formato muy ancho (21:9 o el más ancho posible):

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing. A very wide side view of one cozy, sunny room of a little cat house, seen straight-on like a theater stage, no people and no animals in it. Cream wallpaper with soft vertical stripes, warm honey-wood floor planks along the bottom fifth of the image, the floor flat and completely empty in the bottom strip so characters can stand on it. From left to right: a rounded wooden front door with a heart-shaped window; a round, plump cat bed with a pink cushion on the floor; a big round soft rug in the middle of the floor; a small cat scratching post with a dangling pom-pom against the back wall; a large square window in the wall showing a blue day sky with two small clouds; a low shelf with a potted plant and a small framed picture of a paw print hanging above it; a small round white bathtub with little feet against the back wall on the right; a tall floor lamp with a round shade in the right corner. Everything original, simple and friendly, nothing copied from any game. No text, no letters, no numbers, no watermark.
```

## Lámina 2: ventana de noche

Adjunta la lámina 1 elegida.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors, crisp hard pixel edges, no blur, no anti-aliasing. The exact same square window as in the attached room, same frame and same size, but at night: a deep blue night sky with a smiling crescent moon and a few small twinkling stars. Only the window, front view, centered. Plain flat solid pure green background (#00FF00) around it, no shadow, no text, no letters, no watermark.
```

## Lámina 3: objetos

Adjunta la lámina de referencia del gato base.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing. A sprite sheet of separate items in one row, each centered in its own cell, all at the same pixel scale, front view, generous empty space between items:
1. a round blue pet food bowl full of brown kibble;
2. the same blue bowl, empty;
3. a red ball with a small pink shine;
4. a yellow bath sponge with little holes;
5. a small broom with a wooden handle and golden straw;
6. a cute muddy cat paw print on the floor, brown;
7. a second muddy paw print, slightly smudged.
Plain flat solid pure green background (#00FF00) behind and between all items, no floor, no cast shadow, no bright green anywhere in the items, no text, no letters, no numbers, no watermark.
```
