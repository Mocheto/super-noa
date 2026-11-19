# Prompts de arte pendientes

Todos los prompts que faltan por generar, **completos**: cada bloque se copia y se pega tal cual, sin juntar trozos. Se generan a mano, sin servicios de pago. Los ya generados (gato base, habitación, objetos, roca que asoma y baño) siguen en sus dossiers.

## Cómo trabajar

1. Sigue el orden de la tabla.
2. Adjunta lo que diga cada prompt.
3. Pásame cada lámina tal cual salga, con la mayor resolución que dé el modelo. Yo las recorto, quito el verde `#00FF00` y las monto.
4. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir.
5. Guarda las originales fuera del repositorio, en `../super-noa-arte-original/`.

El detalle está en [decorar la casa](casa-decorar-v1.md).

| # | Lámina | Para | Ticket |
|---|---|---|---|
| 1 | Habitación vacía | `worlds/casa-habitacion-vacia-v1.webp` (1280 × 540) | [Generar las láminas de decorar](https://github.com/Mocheto/super-noa/issues/202) |
| 2 | Camas | `sprites/casa-muebles-v1.webp` | [Generar las láminas de decorar](https://github.com/Mocheto/super-noa/issues/202) |
| 3 | Alfombras | `sprites/casa-muebles-v1.webp` | [Generar las láminas de decorar](https://github.com/Mocheto/super-noa/issues/202) |
| 4 | Cuadros | `sprites/casa-muebles-v1.webp` | [Generar las láminas de decorar](https://github.com/Mocheto/super-noa/issues/202) |
| 5 | Plantas | `sprites/casa-muebles-v1.webp` | [Generar las láminas de decorar](https://github.com/Mocheto/super-noa/issues/202) |

## 1. Habitación vacía

- **Adjuntar:** la habitación de ahora.
- **Formato:** el mismo de la imagen adjunta (muy ancho, 1280 × 540).
- **Será:** `worlds/casa-habitacion-vacia-v1.webp`

```text
Edit the attached image. Keep the exact same room, same size, same framing, same pixel art style, same colors and every other object in exactly the same place: the wooden door with the heart window, the cat scratching post, the big window, the empty wooden wall shelf, the white bathtub with little feet, the floor lamp, the striped cream wallpaper and the honey-wood floor. Remove only these four things and fill the space they leave with the wallpaper or the wood floor around them, continuing the stripes and the floor planks seamlessly: 1. the round cat bed with the pink cushion on the left of the floor; 2. the big round rug in the middle of the floor; 3. the potted plant standing on the wall shelf (keep the shelf itself, now empty); 4. the small framed paw picture hanging on the wall above the shelf. Chunky, readable pixel art for young children: bold dark-plum outlines (#2f1d33), flat warm colors, crisp hard pixel edges, no blur, no anti-aliasing. No people, no animals, no text, no letters, no numbers, no watermark.
```

## 2. Camas

- **Adjuntar:** la habitación de ahora.
- **Formato:** horizontal 16:9.
- **Será:** fila de la cama en `sprites/casa-muebles-v1.webp`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly four separate cat beds in one row, each centered in its own quarter, all the same size, the same pixel scale and the same front view, slightly from above, as the round cat bed with the pink cushion in the attached room, so they can replace it on the floor: 1. a cozy round basket bed woven in light honey wicker with a soft mint-green cushion; 2. a plump lilac velvet cat bed shaped like a little cloud with a pale-yellow star-patterned cushion; 3. a round cat bed shaped like a slice of watermelon, red inside with little black seeds and a green rim; 4. a small wooden cat bed shaped like a little boat with a sky-blue cushion and a tiny white sail. Plain flat solid pure green background (#00FF00) behind and between all the beds, generous empty space between them, no floor, no cast shadow, no bright green anywhere in the beds (the watermelon rim is a dark leafy green, never bright green). No text, no letters, no numbers, no labels, no watermark.
```

## 3. Alfombras

- **Adjuntar:** la habitación de ahora.
- **Formato:** horizontal 16:9.
- **Será:** fila de la alfombra en `sprites/casa-muebles-v1.webp`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly four separate floor rugs in a two-by-two grid, each centered in its own quarter, all the same size, the same pixel scale and the same flat oval shape seen from the front and slightly from above, exactly like the big round cream rug in the middle of the floor of the attached room, so they can replace it: 1. a soft sky-blue oval rug with a ring of little white clouds around its edge; 2. a warm coral-pink oval rug with a border of small yellow paw prints; 3. a sunny yellow oval rug with a big smiling orange sun in the middle; 4. a rainbow oval rug made of soft pastel stripes (pink, orange, yellow, light blue and lilac). All four rugs very wide and flat, about three and a half times wider than tall. Plain flat solid pure green background (#00FF00) behind and between all the rugs, generous empty space between them, no floor, no cast shadow, no green at all in the rugs. No text, no letters, no numbers, no labels, no watermark.
```

## 4. Cuadros

- **Adjuntar:** la habitación de ahora.
- **Formato:** horizontal 16:9.
- **Será:** fila del cuadro en `sprites/casa-muebles-v1.webp`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly four separate small framed pictures in one row, each centered in its own quarter, all the same size, the same pixel scale and the same tall rectangular shape with a little hanging string on top as the small framed paw picture on the wall of the attached room, so they can replace it: 1. a light wooden frame with a picture of a smiling yellow fish on a pale-blue background; 2. a pink frame with a picture of a red ball of yarn on a cream background; 3. a blue frame with a picture of a little red house under a smiling sun on a pale-yellow background; 4. a golden frame with a picture of a big white moon and three stars on a dark-blue night background. Plain flat solid pure green background (#00FF00) behind and between all the pictures, generous empty space between them, no wall, no cast shadow, no bright green anywhere in the pictures. No text, no letters, no numbers, no labels, no watermark.
```

## 5. Plantas

- **Adjuntar:** la habitación de ahora.
- **Formato:** horizontal 16:9.
- **Será:** fila de la planta en `sprites/casa-muebles-v1.webp`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly four separate small potted plants in one row, each centered in its own quarter, all the same size, the same pixel scale and the same front view as the little potted plant standing on the wall shelf in the attached room, so they can replace it on that shelf, each with a flat pot bottom: 1. a round little cactus with a pink flower on top in a light-blue pot; 2. a small bunch of three yellow tulips in a white pot with a red heart; 3. one small sunflower with a big yellow head in an orange clay pot; 4. a tiny round tree with pink blossoms in a lilac pot. Plain flat solid pure green background (#00FF00) behind and between all the plants, generous empty space between them, no shelf, no floor, no cast shadow, no bright green anywhere in the plants (leaves in a darker, softer green). No text, no letters, no numbers, no labels, no watermark.
```
