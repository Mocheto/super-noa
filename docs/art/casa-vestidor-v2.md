# Casa de los gatitos: capas, alas y piezas nuevas del armario

Dossier del arte nuevo del armario. Ticket: [Arte y código de la capa, las alas y las piezas nuevas del armario](https://github.com/Mocheto/super-noa/issues/375), del mapa [Más decoraciones y accesorios para la casa](https://github.com/Mocheto/super-noa/issues/371). Mismo estilo que el [vestidor](casa-vestidor-v1.md) y el [gato base](casa-gato-base-v1.md). Los temas se decidieron en [Temas, piezas animadas y reacciones del gatito](https://github.com/Mocheto/super-noa/issues/373).

## Estado

- **Montado.** Las originales están en `../super-noa-arte-original/casa-vestidor-v2/` con los nombres `casa-capas`, `casa-alas` y `casa-piezas-nuevas` (cualquier extensión), y se recortan con `uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-vestidor-v2-recorte.py ../super-noa-arte-original/casa-vestidor-v2`.
- **Alas:** la fila de abajo no salió como segundo cuadro (mezcla piezas y falta la mariposa), así que solo se usan los seis pares de arriba y **el aleteo va por código**: cada par se dibuja en dos mitades que giran desde el hombro.
- **Capas:** salieron largas, hasta el suelo de pie, y con la silueta de unas patas dentro. Puestas, se cortan a la altura de las patas del gatito (`CAPA_VISIBLE`, el 68 % de arriba).
- **Bufandas nuevas:** salieron como un aro grueso, no como una banda con las puntas; se ven más grandes que las de antes.

## Qué hace falta

- **Seis capas**, de frente, como si las llevara el gatito grande sentado: el broche arriba en el centro (quedará detrás del cuello) y la capa abriéndose a los dos lados y cayendo hasta el suelo. Van **detrás** del gatito, así que solo se ve lo que asoma por los lados y por abajo: dibújala entera, sin hueco.
- **Seis pares de alas en dos cuadros** para que aleteen: arriba, abiertas hacia arriba; abajo, las mismas un poco bajadas. Van **detrás** del gatito, a la altura de los hombros: un par simétrico, con un hueco en medio del ancho del cuerpo del gatito.
- **Seis piezas más** para los tipos de siempre: dos sombreros, dos gafas y dos bufandas, del mismo tamaño y colocación que las del [vestidor](casa-vestidor-v1.md).
- **Colores:** como en el vestidor, nada de verde chillón ni de los colores exactos del gato (naranja vivo, azul fuerte y dorado puro). Los tonos suaves sí valen.

| # | Lámina | Adjuntar | Archivo final |
|---|---|---|---|
| 1 | Capas | El gatito grande (`public/assets/sprites/gato-casa-vestidor-v1.webp`). | fila 4 de `sprites/casa-accesorios-v2.webp` |
| 2 | Alas (dos cuadros) | El gatito grande. | filas 5 y 6 de `sprites/casa-accesorios-v2.webp` |
| 3 | Dos sombreros, dos gafas y dos bufandas | El gatito grande y la lámina de piezas de ahora (`public/assets/sprites/casa-accesorios-v1.webp`). | columnas 5 y 6 de las filas 1 a 3 |

## Cómo trabajar

1. Copia cada prompt entero; ya lleva el estilo dentro.
2. Adjunta lo que diga cada lámina, para que el tamaño case con el gatito grande.
3. Las tres van sobre **verde plano `#00FF00`**, con las piezas en el orden del prompt y separadas.
4. Comprueba que salen **exactamente** las piezas pedidas: 6 capas, 12 alas (6 arriba y las mismas 6 abajo) y 6 piezas.
5. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir.

## 1. Capas

- **Adjuntar:** el gatito grande.
- **Formato:** horizontal 16:9.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly six separate capes for the kitten in the attached image, arranged in two rows of three, each centered in its own space, all the same size and the same pixel scale as that kitten, with NO kitten. Each cape is seen from the front as if worn by the sitting kitten: a small round clasp at the top center, then the cape spreading out to both sides like a bell and falling down to the floor, about one and a half times as wide as the kitten's body and as tall as from the kitten's neck to its paws. Draw each cape complete and solid, with no hole in the middle. 1. a lilac knight's cape with a small cream shield with a heart on it; 2. a dark-red dragon cape covered in little scales, with a row of small cream spikes along its edges; 3. a red winter cape with a fluffy white fur trim and a white pompom clasp; 4. a sandy cream explorer's cape with a big soft yellow sun on it; 5. a deep-purple theater cape with little white music notes; 6. a brown forest cape made of overlapping leaves with two little acorns as the clasp. No bright orange, no strong blue and no pure gold in any cape. Plain flat solid pure green background (#00FF00) behind and between all the capes, generous empty space between them, no floor, no cast shadow, no bright green anywhere in the capes. No text, no letters, no numbers, no labels, no watermark.
```

## 2. Alas

- **Adjuntar:** el gatito grande.
- **Formato:** horizontal 16:9.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet of little wings for the kitten in the attached image, in exactly two rows of six, all at the same pixel scale as that kitten, with NO kitten. Each item is one symmetrical pair of small wings seen from the front, a left wing and a right wing with an empty gap between them as wide as the kitten's body, so they look like they grow from behind its shoulders; each pair is about twice as wide as the kitten's body. The top row shows the six pairs open and raised up; the bottom row shows the very same six pairs, in the same order, a little lowered, like the next moment of a flap. In order: 1. pink and lilac butterfly wings with round spots; 2. dark-purple bat wings with soft pointed tips; 3. soft brown owl wings with cream feather tips; 4. turquoise flying-fish fins, see-through looking, with thin white lines; 5. red ladybug wings with round black dots; 6. pastel rainbow wings of a winged unicorn, with white feathers and tiny sparkles. No bright orange, no strong blue and no pure gold in any wings. Plain flat solid pure green background (#00FF00) behind, between and inside the gap of all the wings, generous empty space between pairs, no floor, no cast shadow, no bright green anywhere in the wings. No text, no letters, no numbers, no labels, no watermark.
```

## 3. Dos sombreros, dos gafas y dos bufandas

- **Adjuntar:** el gatito grande y la lámina de piezas de ahora.
- **Formato:** horizontal 4:3.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet of six more kitten accessories in exactly three rows of two, each item centered in its own cell, at the same pixel scale and the same size as the accessories in the attached sheet so they would fit the big kitten in the attached image, all seen from the front, with NO kitten. Row 1, hats: 1. a little train driver's cap with red and white stripes and a short peak; 2. a small black pirate hat with a round white badge with a little red heart and a red feather. Row 2, glasses: 1. pink ski goggles with a wide strap and a lilac lens; 2. brown leather aviator goggles with two round amber-pink lenses. Row 3, scarves, each one shaped as if wrapped around an invisible kitten neck, a curved soft band with two short ends hanging down in front: 1. a dark leafy-green scarf with little cream dinosaur footprints; 2. a cream scarf with small red apples. No bright orange, no strong blue and no pure gold in any item. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between items, no floor, no cast shadow, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```

## 4. Bufandas nuevas, otra vez

Las de la lámina 3 salieron como un aro grueso. Esta lámina las sustituye: si existe `casa-bufandas-nuevas`, el recorte toma de ella las dos bufandas y deja lo demás de la lámina 3.

- **Adjuntar:** la lámina de piezas de ahora (`public/assets/sprites/casa-accesorios-v1.webp`): sus bufandas son la forma que hay que copiar.
- **Formato:** horizontal 16:9.
- **Será:** columnas 5 y 6 de la fila 3 de `sprites/casa-accesorios-v2.webp`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly two separate kitten scarves side by side, each centered in its own half, with NO kitten, drawn with exactly the same shape, size, thickness and pixel scale as the four scarves in the bottom row of the attached sheet: a thin soft knitted band gently curved like a smile, as if wrapped around an invisible kitten neck seen from the front, with two short flat ends hanging down in front on one side. It is a curved band, NOT a closed ring, NOT a donut and NOT a tube: there is no hole and no inner rim visible. 1. a dark leafy-green scarf with small cream dinosaur footprints; 2. a cream scarf with small red apples with tiny green leaves. No bright orange, no strong blue and no pure gold. Plain flat solid pure green background (#00FF00) behind and between both scarves, generous empty space between them, no floor, no cast shadow, no bright green anywhere in the scarves. No text, no letters, no numbers, no labels, no watermark.
```
