# Laguna: la roca que asoma

Arte de la **roca que asoma** de las pantallas acuáticas A-1, A-2 y A-3. Ticket: [Arte de la roca que asoma](https://github.com/Mocheto/super-noa/issues/173), del mapa [Nadar y pulsar no bastan](https://github.com/Mocheto/super-noa/issues/158). Decisión: [Cómo obligar a bajar en las pantallas acuáticas](https://github.com/Mocheto/super-noa/issues/159).

## Estado

- **Provisional (19-11-2026):** el juego dibuja la roca con el arrecife `sprites/sea-reef-wall-v2.png` estirado hacia arriba, con sus algas fuera del agua.
- **Hecho (19-11-2026):** recortada con `prototypes/tools/casa-recorte.py` en `sprites/roca-asoma-v1.webp` (180 de ancho: cima de 135 con la espuma a 86 y cuerpo de 127). La cima es más alta que lo pedido: se dibuja con la espuma en la línea del agua y asoma más que la colisión.

## Qué hace falta

Una lámina con **dos piezas** de la misma roca, para que la línea del agua quede siempre a la misma altura aunque cada roca tenga un alto distinto (de 140 a 200 px en escena):

| Pieza | Qué es | Tamaño en escena |
|---|---|---|
| Cima | Parte seca de la roca, la espuma donde corta el agua y un poco de roca mojada debajo | 180 × 60; la espuma, a 30 px del borde de arriba |
| Cuerpo | Roca sumergida que se repite hacia abajo sin costura | 180 × 70, se repite en vertical |

Archivo final: `sprites/roca-asoma-v1.webp` (cima arriba, cuerpo debajo), con fondo transparente. El recorte se registra en `rendering.ts`, y la roca se dibuja con la cima a su altura fija y el cuerpo repetido hasta el fondo.

## Cómo trabajar

1. Copia el prompt entero.
2. Adjunta `public/assets/sprites/sea-reef-wall-v2.png` (acabado de la piedra del arrecife) y `public/assets/worlds/world-8.webp` (fondo de la laguna, para el color del agua).
3. La lámina va sobre **verde plano `#00FF00`**. Yo la recorto a transparente, la alineo y la exporto.
4. Si tras tres intentos no sale bien, cambia de modelo antes de insistir con el prompt.
5. Guarda la original fuera del repositorio, en `../super-noa-arte-original/laguna-v1/`.

## Prompt

Formato 16:9, listo para copiar:

```text
Chunky, readable pixel art in the style of a charming 16-bit platform game for young children: bold dark-plum outlines (#2f1d33), warm cel shading with two or three tones per color, saturated friendly colors, rounded cute shapes, a small white highlight on shiny surfaces. Crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Every item is drawn straight-on from the side, centered in its own cell, all at the same pixel scale.
A pixel-art sprite sheet with exactly two pieces of the same lagoon rock, stacked one above the other with generous empty space between them, both exactly the same width.
Piece 1 "top": the rounded top of a big friendly sea rock that sticks out of calm lagoon water, matching the stone finish of the reef in the first attached image (blue-grey and teal stone with soft purple shadows). The upper half is dry stone, slightly lighter, with one or two tiny shells and a small tuft of dark olive seaweed lying on top. Across the middle there is a clear, straight horizontal waterline: a band of white and pale-cyan foam with small bubbles hugging the rock on both sides. Below the foam the stone is wet, darker and more saturated, the same color as the water in the second attached image. The bottom edge of this piece is flat and continues straight down into piece 2.
Piece 2 "body": a rectangular section of the same underwater wet stone, darker teal and blue, with rounded cracks, a few small barnacles and pink coral bumps, designed to tile seamlessly vertically: the top edge and the bottom edge match exactly, and the left and right outlines are straight vertical lines.
Plain flat solid pure green background (#00FF00) behind and between all elements, no floor, no cast shadow, no bright green anywhere in the items (use only dark olive green for seaweed). No text, no letters, no numbers, no labels, no watermark.
```
