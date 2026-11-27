# Casa de los gatitos: la jaula de hámsters

Dossier del arte de la jaula. Tickets: [Prompts del arte](https://github.com/Mocheto/super-noa/issues/414) y [Generar el arte](https://github.com/Mocheto/super-noa/issues/415), del mapa [Jaula de hamsters](https://github.com/Mocheto/super-noa/issues/402). Especificación: [jaula-hamsters.md](../casa/jaula-hamsters.md). Mismo estilo que los [objetos de la bandeja](casa-habitacion-v1.md).

## Estado

- **Montada** en [Montar el arte](https://github.com/Mocheto/super-noa/issues/417). Las originales están en `../super-noa-arte-original/casa-hamsters-v1/` (`jaula`, `objetos`, `perla` y `bolita`, en WebP).
- `prototypes/tools/casa-hamsters-recorte.py` las recorta. La jaula generada era más ancha que la reja del juego: el tejado se escala sin deformar, los barrotes se estiran a lo alto y la bandeja se encaja abajo (772 × 748, al doble del dibujo).
- El pitorro que traía la pose de beber de Perla se borra al recortar.
- Dónde va cada pieza: `src/game/casaHamstersArte.ts`.

## Qué se genera y qué no

| # | Lámina | Adjuntar | Se publica como | Rejilla final |
|---|---|---|---|---|
| 1 | La jaula vacía | La habitación (`worlds/casa-habitacion-vacia-v2.webp`) y el boceto (recorrido B). | `sprites/casa-jaula-v1.webp` | una pieza de 772 × 748 |
| 2 | Cosas de la jaula | La lámina 1. | `sprites/casa-jaula-objetos-v1.webp` | 8 celdas de 96 × 96 en una fila |
| 3 | Perla | Los objetos de la bandeja (`sprites/casa-objetos-v1.webp`). | `sprites/casa-hamster-perla-v1.webp` | 8 celdas de 96 × 72 en una fila |
| 4 | Bolita | La lámina 3. | `sprites/casa-hamster-bolita-v1.webp` | 8 celdas de 96 × 72 en una fila |

No se generan:
- **El fondo de la habitación** (de 1700 a 2420 px): lo alarga un script repitiendo la pared, como la ampliación de la pecera.
- **Los tubos, los cubos, la repisa y las rampas:** los dibuja el juego, porque tienen que seguir exactamente el recorrido por el que andan los hámsters.
- **La puerta abierta y cerrada, la botella que se vacía y los efectos:** por código.

## Cómo trabajar

1. Copia el prompt entero; ya lleva el estilo dentro.
2. Adjunta lo que dice la tabla.
3. Todo va sobre **verde plano `#00FF00`**.
4. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir.
5. Guarda las originales fuera del repositorio, en `../super-noa-arte-original/casa-hamsters-v1/`. El recorte y el montaje son el ticket [Montar el arte](https://github.com/Mocheto/super-noa/issues/417).

## 1. La jaula vacía

- **Formato:** casi cuadrado (por ejemplo 4:3).

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A large empty hamster cage seen straight from the front, filling the image: a deep bright-blue plastic tray at the bottom with a thin layer of light wood shavings, thin light-blue wire bars with wide gaps, and a roof made of two small blue gables. Completely empty inside: no hamsters, no toys, no tubes, no shelves, no ladders, no door. Plain flat solid pure green background (#00FF00) around the cage and visible between all the bars. No floor, no cast shadow, no bright green in the cage. No text, no letters, no numbers, no watermark.
```

## 2. Cosas de la jaula

- **Formato:** horizontal muy ancho (por ejemplo 21:9).
- **Orden de las celdas:** rueda (soporte), rueda (aro), columpio (marco), columpio (asiento colgando), casita, comedero lleno, comedero vacío, botella de agua vacía.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly eight separate items in one row, evenly spaced, each centered in its own square cell, all at the same pixel scale, front view, same style as the attached cage: 1. the small A-shaped purple stand of a hamster wheel, alone, without the wheel; 2. the round purple hamster wheel alone, seen from the front, perfectly circular, with eight spokes, without any stand; 3. the wooden A-frame of a tiny swing, alone, without seat or ropes; 4. only the swing seat: a yellow plank hanging from two thin strings; 5. a tiny white hamster house with a blue pointed roof and a round dark doorway; 6. a small orange food bowl full of seeds; 7. the same orange bowl completely empty; 8. an empty clear water bottle with a green holder and a small metal spout pointing down-left. Plain flat solid pure green background (#00FF00) behind and between all items, generous empty space between items, no floor, no cast shadow, no bright green in the items. No text, no letters, no numbers, no labels, no watermark.
```

## 3. Perla

- **Formato:** horizontal muy ancho (por ejemplo 21:9).
- **Orden de las celdas:** andar A, andar B, sentada mirando, comiendo, bebiendo, dormida hecha una bola, asomada (solo cabeza y manitas), cogida en el aire.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet of ONE hamster character in exactly eight poses in one row, evenly spaced, each in its own cell, all at the same scale, side view facing RIGHT, feet on the same baseline. The character: a chubby brown-and-white hamster with a warm cinnamon-brown back, white muzzle, cheeks and belly, round ears that are a bit big with pink inside, black shiny eyes, tiny pink nose and paws, very short tail. Poses: 1. walking, legs apart; 2. walking, legs together; 3. sitting up on its hind legs, looking at the viewer; 4. head down, nibbling a seed held in its paws; 5. stretching its nose up to drink from a spout above (do not draw the spout); 6. asleep curled into a round ball; 7. only the head and two front paws, peeking out; 8. held in the air, body hanging, legs dangling, surprised but happy. Identical proportions and colors in every pose. Plain flat solid pure green background (#00FF00), generous empty space between poses, no floor, no cast shadow. No text, no letters, no numbers, no labels, no watermark.
```

## 4. Bolita

- **Adjuntar:** la lámina 3 ya elegida.
- **Formato y orden:** los de Perla.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet matching EXACTLY the layout, the eight poses and the drawing style of the attached hamster sheet, but with a different character: a Russian dwarf hamster, a little smaller and rounder than the attached one, soft grey back with a darker stripe, white belly, muzzle and cheeks, SHORT small ears, black shiny eyes, tiny pink nose and paws, very short tail. Side view facing RIGHT, feet on the same baseline. Plain flat solid pure green background (#00FF00), generous empty space between poses, no floor, no cast shadow. No text, no letters, no numbers, no labels, no watermark.
```

## 5. Botones de la bandeja (comida y agua)

Pendiente de generar: hoy los dos botones son dibujos provisionales en `CasaGatitos.tsx`.

- **Adjuntar:** `sprites/casa-objetos-v1.webp` y `sprites/casa-jaula-objetos-v1.webp`.
- **Formato:** horizontal (2:1).
- **Orden de las celdas:** saco de comida, jarrita de agua.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly two separate items in one row, evenly spaced, each centered in its own square cell, both at the same size, front view, same drawing style as the attached objects, big and simple enough to read as small buttons: 1. a plump open burlap sack of hamster food, brimming with seeds and a few yellow corn kernels, with a small orange scoop stuck in it; 2. a chubby light-blue water jug with a wide handle and a spout, clear enough to see it is full of water, with one big water drop beside the spout. Plain flat solid pure green background (#00FF00) behind and between the items, generous empty space between them, no floor, no cast shadow, no bright green in the items. No text, no letters, no numbers, no labels, no watermark.
```

