# Casa de los gatitos: las comidas de los visitantes

Dossier del arte de los visitantes. Ticket: [Prompt de las comidas de los amigos](https://github.com/Mocheto/super-noa/issues/267), del mapa [Visitas de los amigos a la casa](https://github.com/Mocheto/super-noa/issues/217). Mismo estilo que los objetos de la bandeja y [las comidas de los gatitos](casa-comida-v1.md).

## Estado

- **Montada** en [Montar el arte de las comidas de los amigos](https://github.com/Mocheto/super-noa/issues/272): la original está en `../super-noa-arte-original/casa-visitante-v1/` y se recorta con `uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-visitante-recorte.py ../super-noa-arte-original/casa-visitante-v1`.
- `sprites/casa-comidas-amigos-v1.webp`: tres celdas de 128 × 128 (manzana, bellota y flor), a la misma escala y apoyadas en la misma fila.

## Qué hace falta

- **Una lámina con tres platos**, cada uno con la comida de los amigos: manzana, bellota y flor. Salen en el abanico de la bandeja del jardín cuando hay un visitante y se arrastran hasta él.
- **Los visitantes** no llevan arte nuevo: son sus dibujos de enemigos de siempre.
- **Colores:** la flor lleva un tallo verde, así que la lámina va sobre **magenta plano `#FF00FF`**, y la flor es amarilla y blanca para que no se confunda con el fondo.

| # | Lámina | Adjuntar | Archivo final |
|---|---|---|---|
| 1 | Tres comidas de los amigos | Las comidas de los gatitos (`public/assets/sprites/casa-comidas-v1.webp`). | `sprites/casa-comidas-amigos-v1.webp` (tres celdas de 128 × 128) |

## Cómo trabajar

1. Copia el prompt entero; ya lleva el estilo dentro.
2. Adjunta las comidas de los gatitos, para que el tamaño y el estilo sean los mismos.
3. Va sobre **magenta plano `#FF00FF`**. Yo la recorto y la monto.
4. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir.
5. Guarda la original fuera del repositorio, en `../super-noa-arte-original/casa-visitante-v1/`.

## 1. Tres comidas de los amigos

- **Adjuntar:** las comidas de los gatitos.
- **Formato:** horizontal 16:9.
- **Será:** `sprites/casa-comidas-amigos-v1.webp`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly three separate items in one row, each centered in its own cell, all at the same pixel scale and about the same size as the bowls in the attached image, front view, slightly from above: the SAME small round cream-colored plate with a thin honey-orange rim, three times, each with one food a small child recognizes at a glance: 1. one shiny round red apple with a small brown stem and one leaf; 2. two chubby brown acorns with textured caps; 3. one big cheerful daisy flower with white petals and a bright yellow center, lying on the plate with a short stem. Plain flat solid pure magenta background (#FF00FF) behind and between all items, generous empty space between items, no floor, no cast shadow, no magenta, pink or purple anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```
