# Duelos de memoria: el vuelo de Aurora y el nido de la Reina

Dossier del arte de los dos duelos de memoria con movimiento. Ticket: [Prompts del arte de los duelos de memoria](https://github.com/Mocheto/super-noa/issues/358), del mapa [Mejorar los duelos de memoria](https://github.com/Mocheto/super-noa/issues/349). Las piezas salen de [Aurora Celeste: escena y movimiento](https://github.com/Mocheto/super-noa/issues/352) y [La Reina Tricera: escena y movimiento](https://github.com/Mocheto/super-noa/issues/353).

## Estado

- **Pendiente de generar** en [Generar el arte de los duelos de memoria](https://github.com/Mocheto/super-noa/issues/359). Mientras tanto, los dos juegos se juegan con formas provisionales.
- Se recortará con `prototypes/tools/duelos-memoria-recorte.py` en hojas de casillas cuadradas, todas las poses de un personaje a la misma escala y con los pies (o el apoyo) en la misma fila, como las hojas nuevas de Siroco y Don Silbato.

## Qué hace falta

| # | Lámina | Adjuntar | Archivo final |
|---|---|---|---|
| 1 | Aurora: seis poses | `public/assets/atlases/sky-kingdom-characters-v1.webp` (para el personaje) y `public/assets/sprites/boss-siroco-sheet-v2.webp` (para el pixel art) | `sprites/vuelo-aurora-v1.webp` |
| 2 | La nubecita: cuatro poses | Los mismos dos | `sprites/vuelo-nubecita-v1.webp` |
| 3 | Cielo de Aurora: nube, luna y fondo | `public/assets/worlds/sky-kingdom-background-v1.webp` y la hoja de Siroco | `sprites/vuelo-piezas-v1.webp` y `worlds/vuelo-aurora-fondo-v1.webp` |
| 4 | La Reina Tricera: siete poses | `public/assets/sprites/boss-reina-tricera-0.webp` (para el personaje) y la hoja de Siroco | `sprites/nido-reina-v1.webp` |
| 5 | La cría: seis poses | La misma Reina y la hoja de Siroco | `sprites/nido-cria-v1.webp` |
| 6 | Selva de la Reina: arbusto, nido y fondo | La hoja de Siroco | `sprites/nido-piezas-v1.webp` y `worlds/nido-reina-fondo-v1.webp` |

Lo que se hace por código no lleva arte: la aurora, las estrellas y la constelación del cielo de Aurora; los pétalos, el humo del volcán, las mariposas y el terodáctilo de la selva; el color de cada nubecita y de las flores de cada arbusto (por eso esas dos piezas van en blanco).

## Cómo trabajar

1. Copia el prompt entero; ya lleva el estilo dentro.
2. Adjunta lo que dice su tabla: el dibujo de hoy del personaje, para que sea el mismo, y la hoja de Siroco, para que el pixel art sea igual.
3. Va sobre **verde plano `#00FF00`**, salvo los fondos (láminas 3 y 6, que van aparte y enteros). Yo lo recorto y lo monto.
4. Lo más delicado: **todas las poses del mismo tamaño, separadas, sin tocarse y sin nada suelto alrededor** (ni estelas, ni rayas de movimiento, ni chispas). Si una pose toca a otra o se sale, repite.
5. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir.
6. Guarda las originales fuera del repositorio, en `../super-noa-arte-original/duelos-memoria-v1/`, con los nombres del título de cada sección (`aurora-poses`, `nubecita-poses`, `aurora-piezas`, `aurora-fondo`, `reina-poses`, `cria-poses`, `selva-piezas`, `selva-fondo`; cualquier extensión).

## 1. Aurora: seis poses (`aurora-poses`)

- **Formato:** horizontal 16:9.

```text
Chunky, readable pixel art in the same style and pixel size as the attached pixel-art fox sprite sheet, for a charming 16-bit game for young children: bold dark outlines, flat colors with at most two shading tones, crisp hard pixel edges, no blur, no anti-aliasing, no gradients, no painterly brush strokes. Everything original, nothing copied from any game. The character is the SAME gentle owl queen as in the attached character sheet (bottom row), redrawn as pixel art and keeping her design: round fluffy lavender and white body, soft blue and golden wing tips, golden crescent-moon crown on her head, big kind eyes, small golden beak and golden feet. A sprite sheet with exactly SIX poses of her in TWO rows of three, evenly spaced, each one fully separate with generous empty space around it, all at exactly the same size and pixel scale: TOP ROW, three flying frames in side view facing RIGHT, wings fully up, wings level, wings fully down; BOTTOM ROW, front view standing perched: 4. perched calm and smiling, wings folded; 5. perched with her head turned to her left, looking left; 6. perched with her head turned to her right, looking right. Nothing else around her: no trails, no motion lines, no sparkles, no moon behind her. Plain flat solid pure green background (#00FF00) behind and between all poses, no floor, no cast shadows, no bright green anywhere in the character. No text, no letters, no numbers, no labels, no watermark.
```

## 2. La nubecita: cuatro poses (`nubecita-poses`)

- **Formato:** horizontal 16:9.

```text
Chunky, readable pixel art in the same style and pixel size as the attached pixel-art fox sprite sheet, for a charming 16-bit game for young children: bold dark outlines, flat colors with at most two shading tones, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Everything original, nothing copied from any game. The character is the SAME little round cloud bird as in the attached character sheet (top row), redrawn as pixel art: a small round puffy cloud body with a curly tuft on top, tiny golden wings, small beak and tiny feet. Draw its body PURE WHITE with only light grey shading (the game will tint it pink, yellow or blue), keeping the outline, eyes, beak, wings and feet in their own colors. A sprite sheet with exactly FOUR poses in ONE row, evenly spaced, each one fully separate with generous empty space around it, all at exactly the same size and pixel scale, front view, sitting: 1. asleep, eyes closed, calm; 2. asleep with ONE eye peeking open; 3. awake and singing happily, beak open, wings a little raised; 4. yawning sleepily, beak wide open, eyes closed. No musical notes, no zzz, no sparkles around it. Plain flat solid pure green background (#00FF00) behind and between all poses, no floor, no cast shadows, no bright green anywhere in the character. No text, no letters, no numbers, no labels, no watermark.
```

## 3. Cielo de Aurora: nube, luna y fondo

Dos imágenes: las piezas (`aurora-piezas`) sobre verde, y el fondo (`aurora-fondo`) entero.

### Piezas (`aurora-piezas`)

- **Formato:** horizontal 16:9.

```text
Chunky, readable pixel art in the same style and pixel size as the attached pixel-art fox sprite sheet, for a charming 16-bit game for young children: bold dark outlines, flat colors with at most two shading tones, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Everything original, nothing copied from any game. A sprite sheet with exactly TWO separate items side by side, each fully isolated with generous empty space around it: 1. LEFT: one big soft fluffy white cloud seen from the side, wider than tall, with a flat-ish top where a small bird can sit, soft lilac shading underneath; 2. RIGHT: a big friendly golden crescent moon shaped like a cozy seat, its inner curve facing up and right so an owl can sit inside it, with a calm sleeping face drawn on its outer curve and soft cream highlights. Plain flat solid pure green background (#00FF00) behind and between the items, no stars, no sky, no floor, no cast shadows, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```

### Fondo (`aurora-fondo`)

- **Adjuntar:** el fondo de hoy del reino del cielo y la hoja de Siroco.
- **Formato:** horizontal 16:9.

```text
Chunky, readable pixel art background in the same style and pixel size as the attached pixel-art sprite sheet, for a charming 16-bit game for young children, original and inspired by the attached sky kingdom only in mood: a calm deep night sky from dark indigo at the top to soft violet near the bottom, with a few far-away low clouds softly lit by moonlight along the bottom edge. Leave the whole sky EMPTY and calm: NO stars, NO moon, NO aurora, NO birds, NO characters, NO platforms, NO buildings, NO bright spots, because the game draws stars and a moving aurora on top. Flat pixel-art color bands, crisp edges, no blur, no gradients smoother than pixel dithering. Full-bleed landscape image. No text, no letters, no numbers, no labels, no watermark.
```

## 4. La Reina Tricera: siete poses (`reina-poses`)

- **Formato:** horizontal 16:9.

```text
Chunky, readable pixel art in the same style and pixel size as the attached pixel-art fox sprite sheet, for a charming 16-bit game for young children: bold dark outlines, flat colors with at most two shading tones, crisp hard pixel edges, no blur, no anti-aliasing, no gradients, no painterly brush strokes. Everything original, nothing copied from any game. The character is the SAME friendly triceratops queen as in the attached character image, redrawn as pixel art and keeping her design: teal skin with a cream belly, a big rounded frill with coral and teal petals and cream spikes, three cream horns, a small golden leaf crown, a necklace and skirt of green leaves and coral flowers, warm orange eyes. A sprite sheet with exactly SEVEN poses of her in TWO rows (four on top, three below), evenly spaced, each one fully separate with generous empty space around it, all at exactly the same size and pixel scale, standing on the same invisible baseline: TOP ROW, four trotting frames in side view facing RIGHT, a cheerful trot cycle on her four legs; BOTTOM ROW, side view facing RIGHT: 5. a gentle head-bump, head lowered and nose horn forward, smiling, eyes closed; 6. a happy stomp, one front foot raised high, tail up, big smile; 7. a funny sneeze, eyes squeezed shut, head tilted back, mouth open. Nothing else around her: no dust, no petals, no motion lines, no sparkles. Plain flat solid pure green background (#00FF00) behind and between all poses, no floor, no cast shadows, no bright green anywhere in the character. No text, no letters, no numbers, no labels, no watermark.
```

## 5. La cría: seis poses (`cria-poses`)

- **Formato:** horizontal 16:9.

```text
Chunky, readable pixel art in the same style and pixel size as the attached pixel-art fox sprite sheet, for a charming 16-bit game for young children: bold dark outlines, flat colors with at most two shading tones, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Everything original, nothing copied from any game. A tiny baby triceratops, the daughter of the attached triceratops queen: same teal skin and cream belly, a small rounded frill with a few coral petals, three tiny horn buds, big happy eyes, no crown and no leaf skirt. A sprite sheet with exactly SIX items in TWO rows of three, evenly spaced, each one fully separate with generous empty space around it, all at the same pixel scale, standing on the same invisible baseline: TOP ROW: 1. a cream egg with soft teal spots, whole; 2. the same egg cracking open, with the baby's head and tiny horns peeking out of the top; 3. the baby trotting in side view facing RIGHT, legs apart; BOTTOM ROW: 4. the baby trotting in side view facing RIGHT, legs together; 5. the baby dancing, front view, one arm up, big smile; 6. the baby dancing, front view, the other arm up, big smile. No eggshell pieces flying, no motion lines, no sparkles. Plain flat solid pure green background (#00FF00) behind and between all items, no floor, no cast shadows, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```

## 6. Selva de la Reina: arbusto, nido y fondo

Dos imágenes: las piezas (`selva-piezas`) sobre verde, y el fondo (`selva-fondo`) entero.

### Piezas (`selva-piezas`)

- **Formato:** horizontal 16:9.

```text
Chunky, readable pixel art in the same style and pixel size as the attached pixel-art fox sprite sheet, for a charming 16-bit game for young children: bold dark outlines, flat colors with at most two shading tones, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Everything original, nothing copied from any game. A sprite sheet with exactly TWO separate items side by side, each fully isolated with generous empty space around it, side view: 1. LEFT: a big round leafy jungle bush with dark green leaves, covered in large simple five-petal flowers drawn PURE WHITE with light grey shading (the game will tint them red, yellow or purple), standing on the ground line; 2. RIGHT: a big cozy round nest of woven twigs, leaves and soft moss, seen from the side and slightly above, EMPTY inside with room for five eggs, no eggs in it. Plain flat solid pure green background (#00FF00) behind and between the items, no floor, no cast shadows, no bright green anywhere in the items (the leaves are a darker forest green, never #00FF00). No text, no letters, no numbers, no labels, no watermark.
```

### Fondo (`selva-fondo`)

- **Formato:** horizontal 16:9.

```text
Chunky, readable pixel art background in the same style and pixel size as the attached pixel-art sprite sheet, for a charming 16-bit game for young children, original: a sunny prehistoric jungle clearing by day, bright sky with a few soft clouds, a gentle green volcano far away on the left with NO smoke (the game draws it), tall palm trees and big ferns framing the left and right edges, and a wide flat open grassy clearing across the bottom third where characters walk. Keep the middle and the bottom third open and calm, NO characters, NO dinosaurs, NO birds, NO butterflies, NO nests, NO bushes in the clearing, NO platforms. Flat pixel-art colors, crisp edges, no blur. Full-bleed landscape image. No text, no letters, no numbers, no labels, no watermark.
```
