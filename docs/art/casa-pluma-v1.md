# Casa de los gatitos: la caña de pluma

Dossier del arte del juego de la pluma. Ticket: [Prompt del arte de la caña de pluma](https://github.com/Mocheto/super-noa/issues/339), del mapa [Idea: juego de la pluma](https://github.com/Mocheto/super-noa/issues/213). Mismo estilo que los [objetos de la bandeja](casa-habitacion-v1.md).

## Estado

- **Montada** en [Montar el arte de la caña de pluma](https://github.com/Mocheto/super-noa/issues/343). La original está en `../super-noa-arte-original/casa-pluma-v1/casa-pluma.png`.
- `prototypes/tools/casa-pluma-recorte.py` la recorta en `sprites/casa-pluma-v1.webp`: tres celdas de 128 × 128 (la caña entera, el palo solo y la pluma sola), las tres a la misma escala. Cada pieza es todo lo que hay en su tercio de la lámina, y el hilo de la caña entera, que el recorte del verde se come, se vuelve a trazar. El script imprime las anclas que usa `src/game/casaPlumaArte.tsx`: mango (19, 106) y punta (107, 19) del palo, y bolita de la pluma.
- En la escena, el palo va del dedo (mango) a la punta, arriba a la derecha como en el dibujo; la pluma, a 0,8, cuelga del hilo que traza el juego.

## Qué hace falta

- **La caña entera** para el botón de la bandeja: un palito de madera con un hilo y una pluma colgando.
- **El palo solo**, que se ve en la mano de Noa mientras arrastra; el hilo lo dibuja el juego, para que la pluma se balancee.
- **La pluma sola**, que cuelga del hilo, la persiguen los gatitos y la atrapan.
- Los gatitos no llevan arte nuevo: corren con `andar` y saltan con `pelota`.

| # | Lámina | Adjuntar | Archivo final |
|---|---|---|---|
| 1 | Caña, palo y pluma | Los objetos de la bandeja (`public/assets/sprites/casa-objetos-v1.webp`). | `sprites/casa-pluma-v1.webp` (tres celdas) |

## Cómo trabajar

1. Copia el prompt entero; ya lleva el estilo dentro.
2. Adjunta los objetos de la bandeja, para que el trazo y el tamaño sean los mismos.
3. Va sobre **verde plano `#00FF00`**. Yo la recorto y la monto.
4. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir.
5. Guarda la original fuera del repositorio, en `../super-noa-arte-original/casa-pluma-v1/`.

## 1. Caña, palo y pluma

- **Adjuntar:** los objetos de la bandeja.
- **Formato:** horizontal 16:9.
- **Será:** `sprites/casa-pluma-v1.webp` (tres celdas).

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly three separate items in one row, each centered in its own cell, all at the same pixel scale as the objects in the attached image: 1. a complete cat teaser wand: a short light-brown wooden stick held diagonally, with a thin dark string hanging from its tip and a fluffy feather tied at the end of the string; the feather is soft pink with a yellow tip and a tiny round red bead where it is tied; 2. the SAME wooden stick alone, diagonal, with no string and no feather; 3. the SAME feather alone, hanging straight down, with its tiny red bead at the top and no string. The feather in items 1 and 3 must be identical in shape, colors and size. Plain flat solid pure green background (#00FF00) behind and between all items, generous empty space between items, no floor, no cast shadow, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```
