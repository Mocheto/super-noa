# Casa de los gatitos: el jardín

Dossier del arte del jardín. Ticket: [Prompts del arte del jardín](https://github.com/Mocheto/super-noa/issues/257), del mapa [Jardín de la casa](https://github.com/Mocheto/super-noa/issues/211). Mismo estilo que la [habitación](casa-habitacion-v1.md) y los objetos de la bandeja.

## Estado

- **Recortadas** (20-11-2026): las originales están en `../super-noa-arte-original/casa-jardin-v1/` y se recortan con `uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-jardin-recorte.py ../super-noa-arte-original/casa-jardin-v1`, que imprime las medidas. Se terminan de montar en [Montar el arte del jardín](https://github.com/Mocheto/super-noa/issues/264) cuando estén los maceteros y la regadera en el juego.
- **Jardín** (`worlds/casa-jardin-v1.webp`, 1280 × 540): salió en 16:9 con marco oscuro; sin el marco, a 1280 de ancho y desde la fila 30. La puerta va de (65, 93) a (278, 445), la hierba empieza en la fila 428 y la jardinera de la valla va de x = 996 al borde, filas 423–487: los maceteros van encima.
- **Colchoneta** (`sprites/casa-colchoneta-v1.webp`): 200 × 96.
- **Maceteros** (`sprites/casa-maceteros-v1.webp`): diez celdas de 100 × 128 en fila: semilla, brote y, por color (roja, amarilla, azul y rosa), capullo y flor, a la misma escala y apoyados abajo. El rosa de las flores está cerca del magenta: el recorte solo quita el magenta saturado.
- **Regadera** (`sprites/casa-regadera-v1.webp`): en una celda de 128 × 128, como los objetos de la bandeja.
- **Mariposa** (`sprites/casa-mariposa-v1.webp`): cuatro cuadros de 64 × 64. El generador dejó copias borrosas encima de la fila buena; solo se usa la de abajo.

## Qué hace falta

- **El jardín**, 1280 × 540 y se desliza con el dedo, como la habitación. De izquierda a derecha:
  - la pared trasera de la casa con la **misma puerta del corazón** que la habitación;
  - hierba abierta en el centro, donde va la colchoneta (aparte);
  - un árbol al fondo, a la derecha del centro;
  - una valla baja de madera a la derecha, delante de la cual van los maceteros (aparte).
  
  El suelo de hierba ocupa la banda de abajo, de la fila 405 a la 540, como el suelo de la habitación.
- **La colchoneta**, aparte, para soltar encima a un gatito y que bote.
- **Los maceteros**: el mismo macetero en cuatro etapas (semilla, brote, capullo y flor) y la flor en cuatro colores (roja, amarilla, azul y rosa).
- **La regadera** de la bandeja, como el cuenco o la pelota.
- **La mariposa**, en cuatro poses de aleteo. El juego pinta la segunda de otro color.
- **De noche** no hace falta arte: el juego oscurece el jardín con la capa de noche y dibuja las luciérnagas.
- **Colores:** las láminas 2, 4 y 5 van sobre verde plano `#00FF00`. La lámina 3 lleva tallos y hojas verdes, así que va sobre **magenta plano `#FF00FF`**.

| # | Lámina | Adjuntar | Archivo final |
|---|---|---|---|
| 1 | Jardín de día | La habitación vacía (`public/assets/worlds/casa-habitacion-vacia-v1.webp`). | `worlds/casa-jardin-v1.webp` (1280 × 540) |
| 2 | Colchoneta | El jardín elegido. | `sprites/casa-colchoneta-v1.webp` |
| 3 | Maceteros y flores | El jardín elegido. | `sprites/casa-maceteros-v1.webp` |
| 4 | Regadera | Los objetos de la bandeja (`public/assets/sprites/casa-objetos-v1.webp`). | `sprites/casa-regadera-v1.webp` |
| 5 | Mariposa | El jardín elegido. | `sprites/casa-mariposa-v1.webp` (cuatro cuadros) |

## Cómo trabajar

1. Copia cada prompt entero; ya lleva el estilo dentro.
2. Adjunta lo que diga cada lámina.
3. La lámina 1 va a toda la imagen, sin fondo de color. Yo las recorto y las monto.
4. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir.
5. Guarda las originales fuera del repositorio, en `../super-noa-arte-original/casa-jardin-v1/`.

## 1. Jardín de día

- **Adjuntar:** la habitación vacía.
- **Formato:** muy ancho (21:9 o el más ancho posible).
- **Será:** `worlds/casa-jardin-v1.webp`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A very wide side-view background of the small sunny back garden of the cat house in the attached image, same pixel scale, same straight-on front view and same camera height as the attached room, so it reads as the outside of the same house. From left to right: at the far left, the back wall of the house painted in the same warm cream with the SAME arched wooden door with the little heart window as in the attached room, at the same size and height; then an open soft lawn in the middle with nothing on it (a toy will be placed there later); a single round friendly tree with a thick trunk standing at the back, a bit right of the middle; at the right, a low white wooden picket fence along the back with empty space in front of it (flower pots will be placed there later). Above, a light blue sky with two or three small puffy clouds and a few tiny distant bushes. The walkable lawn fills the bottom quarter of the image as a flat band, seen slightly from above, with a few tiny daisies drawn flat into the grass but no big objects on it. No cats, no characters, no flower pots, no toys, no butterflies. No text, no letters, no numbers, no labels, no watermark.
```

## 2. Colchoneta

- **Adjuntar:** el jardín elegido.
- **Formato:** cuadrado.
- **Será:** `sprites/casa-colchoneta-v1.webp`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A single soft, puffy, round bouncy cushion for cats to jump on in the attached garden, seen from the front and slightly from above so its top is visible as a wide oval, same pixel scale as the door in the attached garden: about as wide as that door is tall, low and chubby, light coral pink with cream stitched stripes around its side, a little paw print in the middle of its top. Plain flat solid pure green background (#00FF00) all around it, no floor, no cast shadow, no bright green anywhere in the item. No text, no letters, no numbers, no labels, no watermark.
```

## 3. Maceteros y flores

- **Adjuntar:** el jardín elegido.
- **Formato:** vertical 3:4.
- **Será:** `sprites/casa-maceteros-v1.webp`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet of ten separate items in five rows of two, every item the SAME round terracotta flower pot, same size, front view, all at the same pixel scale as the fence in the attached garden, each item standing alone with empty space around it. Row 1: left, the pot filled with dark soil and a tiny seed mark, nothing growing; right, the pot with a tiny green sprout of two round leaves. Rows 2 to 5, one flower color per row (row 2 red, row 3 yellow, row 4 blue, row 5 pink): left, a taller green stem with leaves and a closed round flower bud showing a little of its color; right, the same plant fully open as a big round cheerful flower of that color with a golden center. All four open flowers have the same shape and size. Plain flat solid pure magenta background (#FF00FF) behind and between all items, generous empty space between items, no floor, no cast shadow, no magenta or purple anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```

## 4. Regadera

- **Adjuntar:** los objetos de la bandeja.
- **Formato:** cuadrado.
- **Será:** `sprites/casa-regadera-v1.webp`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A single small, chubby watering can as a toy-like object for a cat care tray, same pixel scale and the same size as the bowl in the attached image, seen from the side with the spout pointing to the right and the round handle on top: sunny yellow with a little orange heart painted on its side and a round sprinkler head. Plain flat solid pure green background (#00FF00) all around it, no floor, no cast shadow, no water drops, no bright green anywhere in the item. No text, no letters, no numbers, no labels, no watermark.
```

## 5. Mariposa

- **Adjuntar:** el jardín elegido.
- **Formato:** horizontal 16:9.
- **Será:** `sprites/casa-mariposa-v1.webp` (cuatro cuadros).

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly four frames in one row of the SAME small cute butterfly flying, seen from the front, for a flapping animation, all at the same pixel scale and the same body size, each centered in its own cell: 1. wings fully open and wide; 2. wings half raised; 3. wings almost closed, pointing up; 4. wings half raised again. Round wings in sky blue with lilac spots, a small round dark body with two curly antennae and a tiny happy face. The butterfly is small: about as big as the heart window of the door in the attached garden. Plain flat solid pure green background (#00FF00) behind and between all frames, generous empty space between frames, no floor, no cast shadow, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```
