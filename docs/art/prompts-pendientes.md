# Prompts de arte pendientes

Todos los prompts que faltan por generar, **completos**: cada bloque se copia y se pega tal cual, sin juntar trozos. Se generan a mano, sin servicios de pago. Los ya generados (gato base, habitación, objetos y roca que asoma) siguen en sus dossiers.

## Cómo trabajar

1. Sigue el orden de la tabla.
2. Adjunta lo que diga cada prompt.
3. Pásame cada lámina tal cual salga, con la mayor resolución que dé el modelo. Yo las recorto, quito el verde `#00FF00` y las monto.
4. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir.
5. Guarda las originales fuera del repositorio, en `../super-noa-arte-original/`.

El detalle está en [la pantalla de baño](casa-bano-v1.md).

| # | Lámina | Para | Ticket |
|---|---|---|---|
| 1 | Fondo del baño | `worlds/casa-bano-v1.webp` (960 × 720) | [Generar las láminas del baño](https://github.com/Mocheto/super-noa/issues/195) |
| 2 | Bañera en dos piezas | `sprites/casa-banera-v1.webp` | [Generar las láminas del baño](https://github.com/Mocheto/super-noa/issues/195) |
| 3 | Utensilios del baño | `sprites/casa-bano-utensilios-v1.webp` (cuatro celdas) | [Generar las láminas del baño](https://github.com/Mocheto/super-noa/issues/195) |
| 4 | Espuma, gotas, aire y brillos | `sprites/casa-bano-efectos-v1.webp` (cuatro filas) | [Generar las láminas del baño](https://github.com/Mocheto/super-noa/issues/195) |

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
