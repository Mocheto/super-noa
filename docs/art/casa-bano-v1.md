# Casa de los gatitos: la pantalla de baño

Dossier del arte de la pantalla de baño. Ticket: [Prompts del arte del baño](https://github.com/Mocheto/super-noa/issues/194), del mapa [El baño de la casa de los gatitos](https://github.com/Mocheto/super-noa/issues/192). Mismo estilo que el [gato base](casa-gato-base-v1.md) y la [habitación](casa-habitacion-v1.md).

## Estado

- **Montado** ([Montar el arte del baño](https://github.com/Mocheto/super-noa/issues/198)): las originales están en `../super-noa-arte-original/casa-bano-v1/` y se recortan con `uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-bano-recorte.py ../super-noa-arte-original/casa-bano-v1`.
- El fondo salió 16:9: el recorte quita cinco columnas de azulejos para dejarlo en 4:3 con la balda, la ventana y el espejo.
- La bañera es una sola lámina (la de dos piezas salió con borde doble y se descartó): el recorte la exporta en dos capas del mismo tamaño, entera (`casa-banera-atras-v1.webp`) y de dentro del agua para abajo (`casa-banera-delante-v1.webp`), con el gatito en medio.

## Qué hace falta

- **El gatito no se dibuja de nuevo:** se usa la hoja del gato base (sentado, en el baño, sacudirse y cantar) con su paleta, metido en la bañera.
- **La bañera va en dos piezas:** la de atrás (con el agua) va detrás del gatito y el borde delantero va delante, tapando la mitad de abajo.
- **La espuma va en grumos sueltos:** el juego los pone donde se frota, de pequeño a grande, hasta cubrir al gatito. Las gotas, el aire del secador y los brillos son animaciones cortas.
- **El utensilio que toca** lo ilumina el juego con un brillo, sin láminas aparte.

| # | Lámina | Adjuntar | Archivo final |
|---|---|---|---|
| 1 | Fondo del baño | La lámina 0 del gato elegida (para que el estilo case). | `worlds/casa-bano-v1.webp` (960 × 720) |
| 2 | Bañera en dos piezas | El fondo del baño elegido. | `sprites/casa-banera-atras-v1.webp` y `casa-banera-delante-v1.webp` |
| 3 | Utensilios del baño | La lámina 0 del gato elegida. | `sprites/casa-bano-utensilios-v1.webp` (cuatro celdas) |
| 4 | Espuma, gotas, aire y brillos | Los utensilios elegidos. | `sprites/casa-bano-efectos-v1.webp` (cuatro filas) |

## Cómo trabajar

1. Copia cada prompt entero; ya lleva el estilo dentro.
2. Adjunta lo que diga cada lámina.
3. La lámina 1 va a toda la imagen, sin fondo verde; las demás, sobre **verde plano `#00FF00`**. Yo las recorto y las monto.
4. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir.
5. Guarda las originales fuera del repositorio, en `../super-noa-arte-original/casa-bano-v1/`.

## 1. Fondo del baño

- **Adjuntar:** La lámina 0 del gato elegida (para que el estilo case).
- **Formato:** Horizontal 4:3
- **Será:** `worlds/casa-bano-v1.webp` (960 × 720)

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A cozy little bathroom of a cat house, seen straight-on like a theater stage, with no people, no animals and NO bathtub. Pale aqua square wall tiles with one row of small fish-shaped tiles, a small round window showing a sunny sky with one cloud, a wooden shelf on the left with two folded towels (pink and yellow) and a little potted plant, a round mirror on the right wall, and a light honey-wood floor in the bottom fifth of the image. Leave the center and the bottom middle of the picture plain and empty, because a big bathtub will be placed there later. No text, no letters, no numbers, no watermark.
```

## 2. Bañera en dos piezas

- **Adjuntar:** El fondo del baño elegido.
- **Formato:** Horizontal 16:9
- **Será:** `sprites/casa-banera-v1.webp`

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. Two separate pieces of the same big, round, white clawfoot bathtub seen from the front, stacked one above the other, both exactly the same width. Piece 1 "back": the back rim and the inside of the bathtub seen slightly from above, filled two thirds with calm light-blue water with a few small highlights. Piece 2 "front": only the front wall of the bathtub, the part closest to the viewer, with its thick rounded top rim and four little golden feet, drawn as a separate piece that can cover the lower half of a kitten sitting inside the water. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between items, no floor, no cast shadow, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```

## 3. Utensilios del baño

- **Adjuntar:** La lámina 0 del gato elegida.
- **Formato:** Horizontal 16:9
- **Será:** `sprites/casa-bano-utensilios-v1.webp` (cuatro celdas)

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly four separate bath tools in one row, each centered in its own cell, same pixel scale, front view: 1. a cute handheld shower head with a short coiled hose, pale blue, with three tiny water drops coming out; 2. a round pink soap bottle with a pump and two little bubbles floating; 3. a friendly yellow hair dryer with a round nozzle; 4. a small orange wide-tooth comb. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between items, no floor, no cast shadow, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```

## 4. Espuma, gotas, aire y brillos

- **Adjuntar:** Los utensilios elegidos.
- **Formato:** Horizontal 16:9
- **Será:** `sprites/casa-bano-efectos-v1.webp` (cuatro filas)

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with four rows of small effects, each item centered in its own cell, same pixel scale: Row 1 "foam": four fluffy soap foam clumps of different sizes, made of round bubbles, white and light cyan only (#FFFFFF and #BFEFFF), from a small clump to a big one. Row 2 "water": three frames of a little cluster of light-blue water drops falling down. Row 3 "warm air": three frames of a soft swirl of warm air (pale yellow and white curved lines) blowing to the right. Row 4 "sparkles": three frames of a twinkling golden star sparkle growing and shrinking. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between items, no floor, no cast shadow, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```
