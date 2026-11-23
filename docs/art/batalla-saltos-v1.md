# Batalla de saltos: Siroco y Don Silbato

Dossier del arte propio de las batallas de saltos de Siroco (desierto) y Don Silbato (estación del tren). Ticket: [Arte propio para la batalla de saltos de Siroco y Don Silbato](https://github.com/Mocheto/super-noa/issues/355), salido del mapa [Mejoras y recomendaciones visuales](https://github.com/Mocheto/super-noa/issues/274).

## Estado

- **Montada** en el mismo ticket. Las originales están en `../super-noa-arte-original/batalla-saltos-v1/` (`siroco-terreno.jpg` y `don-silbato-terreno.jpg`).
- `prototypes/tools/batalla-saltos-recorte.py` las recorta en `atlases/siroco-boss-terrain-v1.webp` y `atlases/don-silbato-boss-terrain-v1.webp`: el suelo a 1152 px de ancho, la repisa a 768 y el proyectil en un cuadrado de 128, apilados. Imprime los recortes para `bossTerrains` de `src/game/santaBattleAssets.ts`.
- El suelo se repite en tramos con su proporción, sin los extremos (los bloques de Siroco y las esquinas biseladas del andén), para que empalme sin juntas. La bola de arena rueda; la maleta va derecha.
- Las partículas se dibujan por código en `santaBattleRendering.ts`: granitos de arena de lado (Siroco) y vapor que sube (Don Silbato). Papá Noel sigue con su nieve.
- **Montados los dos jefes** (láminas 3 y 4), originales `siroco-poses.jpg` y `don-silbato-poses.jpg`. Sustituyen a las hojas pintadas de la v1 (borradas), que no eran pixel art, tenían cada pose de un tamaño, metían el proyectil en la pose de lanzar y venían en una sola fila, por lo que los duelos y el álbum las recortaban mal. `prototypes/tools/batalla-saltos-recorte.py` las deja en `sprites/boss-siroco-sheet-v2.webp` y `sprites/boss-don-silbato-sheet-v2.webp` con la cuadrícula común de los jefes (5 × 2 casillas de 256 px, poses abajo y fila de arriba vacía), a la misma escala, con los pies a 248 px y centrados. Quita las manchas casi verdes del fondo y pasa a marrón la cartera de Don Silbato, que salió morada en dos poses. En la arena se dibujan sin deformar (`bossPoseSheets`, `BOSS_POSE_DRAWN`); en la previa, el resultado y el álbum, con la cuadrícula.

## Qué hace falta

Del terreno (láminas 1 y 2), una lámina por guardián con tres piezas:

1. **Suelo:** un tramo largo que se repite a lo ancho de la arena; su borde de arriba es donde pisa Noa y tiene que ser **recto y plano**.
2. **Repisa flotante:** una plataforma más fina con el borde de arriba también recto y plano; se estira a 115–145 px de ancho.
3. **Proyectil:** lo que lanza el guardián. Siroco, una bola de arena; Don Silbato, una maleta.

Las partículas que caen no llevan arte: se dibujan por código (granitos de arena que vuelan de lado para Siroco, y bocanadas de vapor que suben para Don Silbato).

| # | Lámina | Adjuntar | Archivo final |
|---|---|---|---|
| 1 | Siroco: suelo, repisa y bola de arena | El fondo `public/assets/worlds/desert-boss-arena-v1.webp`. | `atlases/siroco-boss-terrain-v1.webp` |
| 2 | Don Silbato: suelo, repisa y maleta | El fondo `public/assets/worlds/train-boss-arena-v1.webp`. | `atlases/don-silbato-boss-terrain-v1.webp` |
| 3 | Siroco: cinco poses | La hoja de hoy `public/assets/sprites/boss-siroco-sheet-v1.webp` (para el personaje) y el fondo del desierto (para el estilo). | `sprites/boss-siroco-sheet-v2.webp` |
| 4 | Don Silbato: cinco poses | La hoja de hoy `public/assets/sprites/boss-don-silbato-sheet-v1.webp` y el fondo de la estación. | `sprites/boss-don-silbato-sheet-v2.webp` |

## Cómo trabajar

1. Copia el prompt entero; ya lleva el estilo dentro.
2. Adjunta el fondo de su arena, para que la paleta y el pixel art sean los mismos.
3. Va sobre **verde plano `#00FF00`**. Yo la recorto y la monto.
4. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir. Lo más delicado es que el borde de arriba del suelo y de la repisa sea recto: si sale ondulado o con cosas encima, repite.
5. Guarda las originales fuera del repositorio, en `../super-noa-arte-original/batalla-saltos-v1/`, con los nombres `siroco-terreno`, `don-silbato-terreno`, `siroco-poses` y `don-silbato-poses` (cualquier extensión).
6. En las poses, lo más delicado es que salgan **las cinco del mismo tamaño, separadas y sin nada lanzado**: ni bola, ni maleta, ni estelas fuera del cuerpo. Si una pose se sale de su sitio o toca a otra, repite.

## 1. Siroco: suelo, repisa y bola de arena

- **Adjuntar:** el fondo del desierto.
- **Formato:** horizontal 16:9.
- **Será:** `atlases/siroco-boss-terrain-v1.webp`.

```text
Chunky, readable pixel art in the same style, palette and pixel size as the attached desert ruins background of a charming 16-bit game for young children: warm sandstone, golden sand, soft terracotta, small turquoise accents, bold dark outlines, flat colors with at most two shading tones, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Everything original, nothing copied from any game. A sprite sheet with exactly three separate items, strict side view, each fully isolated with generous empty space around it: 1. TOP, spanning about 90% of the image width and about 25% of its height: a long sturdy desert floor segment made of big carved sandstone blocks, with an absolutely straight, flat, horizontal top edge of packed golden sand as its highest visible line, a thin turquoise tile stripe on the front face and rounded sandstone blocks below; nothing sticks up above the top edge, no plants, no rocks on top, the left and right ends cut straight so it can repeat side by side. 2. BOTTOM LEFT, about 55% of the image width and 12% of its height: a floating sandstone ledge, a thin carved slab with the same straight, flat, horizontal sandy top edge, a small turquoise sun emblem in the middle of its front face and two short carved brackets hanging below; nothing on top. 3. BOTTOM RIGHT, small, about 12% of the image width: one round ball of packed golden sand with a few darker grains and a tiny swirl of wind around it, no face. Plain flat solid pure green background (#00FF00) behind and between all items, no floor under them, no cast shadows, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```

## 2. Don Silbato: suelo, repisa y maleta

- **Adjuntar:** el fondo de la estación.
- **Formato:** horizontal 16:9.
- **Será:** `atlases/don-silbato-boss-terrain-v1.webp`.

```text
Chunky, readable pixel art in the same style, palette and pixel size as the attached railway station background at dusk of a charming 16-bit game for young children: dark blue-grey iron, warm brick red, polished wood, brass and golden lamp light, bold dark outlines, flat colors with at most two shading tones, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Everything original, nothing copied from any game. A sprite sheet with exactly three separate items, strict side view, each fully isolated with generous empty space around it: 1. TOP, spanning about 90% of the image width and about 25% of its height: a long sturdy station platform floor segment, with an absolutely straight, flat, horizontal top edge of light stone paving with a thin yellow safety line as its highest visible line, dark iron beams with round rivets on the front face and red brick below; nothing sticks up above the top edge, no luggage, no lamps, no railings on top, the left and right ends cut straight so it can repeat side by side. 2. BOTTOM LEFT, about 55% of the image width and 12% of its height: a floating luggage rack shelf, a thin plank of polished wood with the same straight, flat, horizontal top edge, brass end caps and two curly iron brackets hanging below; nothing on top. 3. BOTTOM RIGHT, small, about 12% of the image width: one closed old-fashioned brown leather suitcase with two buckled straps, brass corners and a little handle on top, side view, no face, no stickers with writing. Plain flat solid pure green background (#00FF00) behind and between all items, no floor under them, no cast shadows, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```

## Las cinco poses de los jefes

El juego usa siempre estas cinco, en este orden, de izquierda a derecha:

1. **Quieto**, mirando a la izquierda (también es su retrato).
2. **Prepara el lanzamiento**: sujeta su proyectil junto al pecho.
3. **Lanza**: el brazo estirado y la mano **vacía** (el proyectil lo dibuja el juego aparte).
4. **Aturdido** tras el saltito de Noa en su cabeza: sigue de pie, con estrellitas pegadas a la cabeza.
5. **Contento**: ha perdido, pero sonríe y saluda.

## 3. Siroco: cinco poses

- **Adjuntar:** la hoja de hoy de Siroco y el fondo del desierto.
- **Formato:** horizontal 16:9.
- **Será:** `sprites/boss-siroco-sheet-v2.webp`.

```text
Chunky, readable pixel art in the same style, palette and pixel size as the attached desert ruins background of a charming 16-bit game for young children: bold dark outlines, flat warm colors with at most two shading tones, crisp hard pixel edges, no blur, no anti-aliasing, no gradients, no painterly brush strokes. Everything original, nothing copied from any game. The character is the SAME friendly fennec fox guardian as in the attached character sheet, redrawn as pixel art and keeping his design: big pointy ears, golden tiara with a turquoise gem, red scarf that flutters behind, sandy orange fur with a cream belly and a fluffy white-tipped tail, an ornate cream and turquoise desert tunic with golden bracelets. A sprite sheet with exactly FIVE poses of him in ONE row, evenly spaced, each one fully separate with generous empty space between them, all at exactly the same size and the same pixel scale, standing on the same invisible baseline (feet at the same height), full body, side view facing LEFT: 1. standing calm and friendly; 2. winding up, holding a small ball of sand close to his chest with both paws; 3. throwing, one arm stretched forward with an EMPTY open paw, nothing in the air; 4. dizzy after a gentle bump on the head, still standing upright, eyes in little spirals, three small yellow stars touching his head; 5. happy and waving with a big smile. Each pose about as tall as it is wide, the tail and the scarf kept close to the body so nothing reaches the next pose. Nothing thrown, no sand trails, no motion lines, no effects outside the body except the three small stars in pose 4. Plain flat solid pure green background (#00FF00) behind and between all poses, no floor, no cast shadows, no bright green anywhere in the character. No text, no letters, no numbers, no labels, no watermark.
```

## 4. Don Silbato: cinco poses

- **Adjuntar:** la hoja de hoy de Don Silbato y el fondo de la estación.
- **Formato:** horizontal 16:9.
- **Será:** `sprites/boss-don-silbato-sheet-v2.webp`.

```text
Chunky, readable pixel art in the same style, palette and pixel size as the attached railway station background of a charming 16-bit game for young children: bold dark outlines, flat colors with at most two shading tones, crisp hard pixel edges, no blur, no anti-aliasing, no gradients, no painterly brush strokes. Everything original, nothing copied from any game. The character is the SAME friendly mole train conductor guardian as in the attached character sheet, redrawn as pixel art and keeping his design: dark brown fur, long pink nose, small kind eyes, red conductor cap with a golden badge, navy blue jacket with golden buttons, a small red tie, a brown leather satchel on a strap across his body, big pink paws. A sprite sheet with exactly FIVE poses of him in ONE row, evenly spaced, each one fully separate with generous empty space between them, all at exactly the same size and the same pixel scale, standing on the same invisible baseline (feet at the same height), full body, side view facing LEFT: 1. standing calm and friendly; 2. winding up, lifting a small brown suitcase above his shoulder with both paws, the suitcase kept inside the pose; 3. throwing, one arm stretched forward with an EMPTY open paw, nothing in the air; 4. dizzy after a gentle bump on his cap, still standing upright, eyes in little spirals, three small yellow stars touching his cap; 5. happy, waving his cap with a big smile. Each pose about as tall as it is wide, arms kept close so nothing reaches the next pose. Nothing thrown, no motion lines, no steam, no effects outside the body except the three small stars in pose 4. Plain flat solid pure green background (#00FF00) behind and between all poses, no floor, no cast shadows, no bright green anywhere in the character. No text, no letters, no numbers, no labels, no watermark.
```
