# Casa de los gatitos: decorar la pecera y la jaula

Dossier del arte nuevo del mapa [Decorar la pecera y la jaula de hámsters](https://github.com/Mocheto/super-noa/issues/428): cuatro adornos del fondo de la pecera y cuatro casitas. Ticket: [Prompts del arte del adorno de la pecera y la casita](https://github.com/Mocheto/super-noa/issues/431). Decisiones de partes y temas: [issue 429](https://github.com/Mocheto/super-noa/issues/429). Los colores (mueble, base, tejado y tubos) van por código y no tienen lámina.

La primera versión de cada parte es la de ahora y no se genera.

## Estado

- **Generadas** en [Generar las láminas](https://github.com/Mocheto/super-noa/issues/432). Las originales están en `../super-noa-arte-original/casa-decorar-pecera-v1/` (`dinosaurios`, `hielo`, `barcos`, `celeste` y `casitas`, en WebP).
- Con `quitar_verde` y `grupos(hueco=12)` de `casa-pecera-recorte.py` salen limpias: cinco piezas por adorno y cuatro casitas.
- **Montadas** (ver [Montaje](#montaje)).

## Qué se genera

| # | Lámina | Adjuntar | Original (nombre) | Se publica como |
|---|---|---|---|---|
| 1 | Adorno de dinosaurios | `public/assets/sprites/casa-pecera-fondo-v1.webp` | `dinosaurios` | `sprites/casa-pecera-adorno-dinosaurios-v1.webp` |
| 2 | Adorno de hielo | El fondo y la lámina 1 elegida | `hielo` | `sprites/casa-pecera-adorno-hielo-v1.webp` |
| 3 | Adorno de barcos | El fondo y la lámina 1 elegida | `barcos` | `sprites/casa-pecera-adorno-barcos-v1.webp` |
| 4 | Adorno celeste | El fondo y la lámina 1 elegida | `celeste` | `sprites/casa-pecera-adorno-celeste-v1.webp` |
| 5 | Las cuatro casitas | `public/assets/sprites/casa-jaula-objetos-v1.webp` | `casitas` | `sprites/casa-jaula-casitas-v1.webp` (4 celdas de 96 × 96) |

## Cómo trabajar

1. Copia el prompt entero; ya lleva el estilo dentro.
2. Adjunta lo que dice la tabla.
3. Formato horizontal muy ancho (por ejemplo 21:9), sobre **verde plano `#00FF00`**.
4. Comprueba antes de guardar: cinco piezas (o cuatro casitas) bien separadas, y la última pieza o cada casita con su hueco oscuro abajo, en el centro.
5. Si algo no sale tras tres intentos, cambia de modelo antes de insistir.
6. Guarda las originales fuera del repositorio, en `../super-noa-arte-original/casa-decorar-pecera-v1/`.

## 1. Dinosaurios

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet of aquarium decorations: exactly five separate items in one row, left to right, evenly spaced, all standing on the same invisible baseline, all at the same pixel scale, seen from the front, same drawing style and level of detail as the decorations inside the attached aquarium. 1. a tall prehistoric fern with curled dark-teal and olive fronds; 2. a small cute orange baby dinosaur with a long neck, sitting and smiling; 3. a few big cream-colored rib bones standing in a half arch; 4. a low pile of brown rocks with one spotted dinosaur egg; 5. a big friendly cream-colored fossil dinosaur skull resting on the ground, with a large round dark cave opening at its bottom center. Relative heights, taking item 5 as the full height: item 1 about four fifths, item 2 a little over half, item 3 a little over half, item 4 one third and wider than tall, item 5 full height and about as wide as it is tall. The items will sit in light blue water, so keep them clearly darker or warmer than pale blue, with strong outlines. Plain flat solid pure green background (#00FF00) behind and between all items, generous empty space between items, no floor, no sand, no water, no bubbles, no fish, no treasure chest, no cast shadow, no bright green in the items. No text, no letters, no numbers, no labels, no watermark.
```

## 2. Hielo

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet of aquarium decorations: exactly five separate items in one row, left to right, evenly spaced, all standing on the same invisible baseline, all at the same pixel scale, seen from the front, same drawing style and level of detail as the decorations inside the attached aquarium. 1. a tall cluster of pointed ice crystals in deep blue and violet; 2. a small ice stalagmite with a little red scarf tied around it; 3. a branching frosty coral in lilac and white; 4. a low group of rounded snowy rocks; 5. a rounded ice cave made of big blue-violet ice blocks with snow on top and a few short icicles, with a large round dark entrance at its bottom center. Relative heights, taking item 5 as the full height: item 1 about four fifths, item 2 a little over half, item 3 a little over half, item 4 one third and wider than tall, item 5 full height and about as wide as it is tall. The items will sit in light blue water, so keep them clearly darker or warmer than pale blue, with strong outlines. Plain flat solid pure green background (#00FF00) behind and between all items, generous empty space between items, no floor, no sand, no water, no bubbles, no fish, no treasure chest, no cast shadow, no bright green in the items. No text, no letters, no numbers, no labels, no watermark.
```

## 3. Barcos

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet of aquarium decorations: exactly five separate items in one row, left to right, evenly spaced, all standing on the same invisible baseline, all at the same pixel scale, seen from the front, same drawing style and level of detail as the decorations inside the attached aquarium. 1. a tall broken wooden mast with a torn cream sail and a strand of dark-teal seaweed wrapped around it; 2. a rusty dark-grey anchor leaning to one side; 3. an old wooden ship wheel standing half buried; 4. a low wooden barrel lying on its side next to two small stones; 5. the front half of a small sunken wooden sailing ship, resting upright, with a large round dark hole in the hull at its bottom center. Relative heights, taking item 5 as the full height: item 1 about four fifths, item 2 a little over half, item 3 a little over half, item 4 one third and wider than tall, item 5 full height and about as wide as it is tall. The items will sit in light blue water, so keep them clearly darker or warmer than pale blue, with strong outlines. Plain flat solid pure green background (#00FF00) behind and between all items, generous empty space between items, no floor, no sand, no water, no bubbles, no fish, no treasure chest, no cast shadow, no bright green in the items. No text, no letters, no numbers, no labels, no watermark.
```

## 4. Celeste

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet of aquarium decorations: exactly five separate items in one row, left to right, evenly spaced, all standing on the same invisible baseline, all at the same pixel scale, seen from the front, same drawing style and level of detail as the decorations inside the attached aquarium. 1. a tall wavy purple stem holding three golden five-pointed stars at different heights; 2. a small crescent moon in warm yellow with a sleepy smiling face, standing on a tiny cloud; 3. a white and lilac cloud shaped like a little tree, with a pink star on top; 4. a low flat pink-and-lilac cloud with three tiny golden stars on it; 5. a little dream castle made of puffy white and lilac clouds with a golden star on top, with a large round dark doorway at its bottom center. Relative heights, taking item 5 as the full height: item 1 about four fifths, item 2 a little over half, item 3 a little over half, item 4 one third and wider than tall, item 5 full height and about as wide as it is tall. The items will sit in light blue water, so keep them clearly darker or warmer than pale blue, with strong outlines. Plain flat solid pure green background (#00FF00) behind and between all items, generous empty space between items, no floor, no sand, no water, no bubbles, no fish, no treasure chest, no cast shadow, no bright green in the items. No text, no letters, no numbers, no labels, no watermark.
```

## 5. Las cuatro casitas

Orden de las celdas: huevo roto, iglú, barquito, nube con estrella.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly four separate tiny hamster houses in one row, evenly spaced, each centered in its own square cell, all the same height and width and at the same pixel scale, front view, flat bottom on the same baseline, same drawing style, size and level of detail as the little house in the attached sheet. Every house has ONE large, plain, very dark arched doorway in the middle of its front, touching the ground, about 40 percent of the house width and 45 percent of the house height, completely empty and unobstructed, because a hamster will peek out of it. 1. a big cracked cream-colored dinosaur eggshell with orange spots, its top broken in a zigzag, the doorway at the bottom; 2. a round igloo of pale blue-white ice blocks with visible dark-blue joints and a little snow on top; 3. a chubby little wooden boat house, a red-and-brown hull with a small white sail on a short mast above, the doorway in the hull; 4. a puffy white and lilac cloud house with one golden star on top. Plain flat solid pure green background (#00FF00) behind and between the houses, generous empty space between them, no floor, no cast shadow, no hamsters, no bright green in the houses. No text, no letters, no numbers, no labels, no watermark.
```

## Montaje

Hecho en [Montar el adorno de la pecera y las casitas](https://github.com/Mocheto/super-noa/issues/434) con:

```bash
uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-decorar-pecera-recorte.py --origen ../super-noa-arte-original/casa-decorar-pecera-v1
```

- **El adorno de siempre** se saca de `casa-pecera-fondo-v1.webp` (las láminas originales del mueble no están en el equipo): sale `casa-pecera-fondo-v2.webp`, con agua y arena, y `casa-pecera-adorno-castillo-v1.webp`. Juntos son iguales al `-v1` píxel a píxel. El `-v1` sigue publicado porque es la entrada del script; si `casa-pecera-recorte.py` lo regenera, hay que volver a ejecutar este.
- **Los temas:** cinco capas de 412 × 354. La pieza 2 va en x = 126 y no en 83, porque ahí la tapa el cofre. La 5 se centra por su hueco en x = 328; el script falla si el hueco no cubre el punto del payaso (328, 178), así que el punto es el mismo en todos.
- **Las casitas:** `casa-jaula-casitas-v1.webp`, cuatro celdas de 96 × 96 con la base en la fila 94. El centro de cada puerta está en `casaHamstersArte.ts` (`casitaDe`); si cambia una lámina, se copia el que imprime el script.
