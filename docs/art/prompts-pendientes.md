# Prompts de arte pendientes

Todos los prompts que faltan por generar, **completos**: cada bloque se copia y se pega tal cual, sin juntar trozos. Se generan a mano, sin servicios de pago.

## Cómo trabajar

1. Sigue el orden: el gato de referencia (1) va primero, porque las demás láminas del gato y de la casa lo llevan adjunto.
2. Adjunta lo que diga cada prompt, en el orden indicado: el texto habla de «the attached image» o de «the first/second attached image».
3. Pásame cada lámina tal cual salga, con la mayor resolución que dé el modelo. Yo las recorto, quito el verde `#00FF00`, ajusto los colores y las monto.
4. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir.
5. Guarda las originales fuera del repositorio, en `../super-noa-arte-original/`.

El detalle de cada pieza (tamaños, colores clave y paletas) está en [el gato base](casa-gato-base-v1.md), [la habitación](casa-habitacion-v1.md) y [la roca que asoma](laguna-roca-v1.md).

| # | Lámina | Para | Ticket |
|---|---|---|---|
| 1 | Gato base: referencia (lámina 0) | referencia del gato (no va al juego) | [Arte del gato base](https://github.com/Mocheto/super-noa/issues/181) |
| 2 | Gato base: andar y sentado (lámina 1) | `sprites/gato-casa-v1.webp`, filas 1–3 | [Arte del gato base](https://github.com/Mocheto/super-noa/issues/181) |
| 3 | Gato base: dormir y jugar solo (lámina 2) | `sprites/gato-casa-v1.webp`, filas 4–5 | [Arte del gato base](https://github.com/Mocheto/super-noa/issues/181) |
| 4 | Gato base: cantar, pedir y comer (lámina 3) | `sprites/gato-casa-v1.webp`, filas 6–8 | [Arte del gato base](https://github.com/Mocheto/super-noa/issues/181) |
| 5 | Gato base: mimos, baño y sacudirse (lámina 4) | `sprites/gato-casa-v1.webp`, filas 9–11 | [Arte del gato base](https://github.com/Mocheto/super-noa/issues/181) |
| 6 | Gato base: pelota y «ahora no» (lámina 5) | `sprites/gato-casa-v1.webp`, filas 12–13 | [Arte del gato base](https://github.com/Mocheto/super-noa/issues/181) |
| 7 | Habitación de día | `worlds/casa-habitacion-v1.webp` (1280 × 540) | [Arte de la habitación y de los objetos](https://github.com/Mocheto/super-noa/issues/183) |
| 8 | Ventana de noche | `sprites/casa-ventana-noche-v1.webp` | [Arte de la habitación y de los objetos](https://github.com/Mocheto/super-noa/issues/183) |
| 9 | Objetos de la bandeja | `sprites/casa-objetos-v1.webp` | [Arte de la habitación y de los objetos](https://github.com/Mocheto/super-noa/issues/183) |
| 10 | Roca que asoma | `sprites/roca-asoma-v1.webp` | [Arte de la roca que asoma](https://github.com/Mocheto/super-noa/issues/173) |

## 1. Gato base: referencia (lámina 0)

- **Adjuntar:** Ninguno. Genera varias y quédate con la que más te guste: será el adjunto de las siguientes cinco.
- **Formato:** Cuadrado o 4:3
- **Será:** referencia del gato (no va al juego)

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small short-haired kitten seen from the side in three-quarter view, facing right, with a big round head, big round eyes and a short fluffy tail. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C, tabby stripes #7C2D12 (three stripes on the back, two on the tail, a small M on the forehead), belly and muzzle #FFF1D6, inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight, a soft neckerchief tied at the neck #2563EB with shadow #1E3A8A, two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same stripes, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
A single large reference drawing of the kitten sitting calmly, side three-quarter view facing right, tail curled around its front paws, looking at the viewer with a gentle smile. Only this one pose, centered.
```

## 2. Gato base: andar y sentado (lámina 1)

- **Adjuntar:** La lámina 0 elegida.
- **Formato:** Horizontal (16:9)
- **Será:** `sprites/gato-casa-v1.webp`, filas 1–3

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small short-haired kitten seen from the side in three-quarter view, facing right, with a big round head, big round eyes and a short fluffy tail. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C, tabby stripes #7C2D12 (three stripes on the back, two on the tail, a small M on the forehead), belly and muzzle #FFF1D6, inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight, a soft neckerchief tied at the neck #2563EB with shadow #1E3A8A, two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same stripes, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with three rows, each frame the same size, frames evenly spaced:
Row 1 "walk": 4 frames of a cheerful walking cycle to the right, legs alternating, tail up with a soft curve.
Row 2 "sit and blink": 2 frames sitting like the reference; frame 1 eyes open, frame 2 eyes closed in a happy blink.
Row 3 "sit and wag": 1 frame sitting, looking forward, tail raised and swishing to one side with two tiny motion lines.
```

## 3. Gato base: dormir y jugar solo (lámina 2)

- **Adjuntar:** La lámina 0 elegida.
- **Formato:** Horizontal (16:9)
- **Será:** `sprites/gato-casa-v1.webp`, filas 4–5

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small short-haired kitten seen from the side in three-quarter view, facing right, with a big round head, big round eyes and a short fluffy tail. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C, tabby stripes #7C2D12 (three stripes on the back, two on the tail, a small M on the forehead), belly and muzzle #FFF1D6, inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight, a soft neckerchief tied at the neck #2563EB with shadow #1E3A8A, two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same stripes, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with two rows, each frame the same size:
Row 1 "sleep": 2 frames curled up asleep in a round ball, eyes closed, tail over the nose; frame 2 slightly rounder as it breathes in, with a tiny "z" shape made of pixels (not a letter, a small zigzag) above the head in frame 2 only.
Row 2 "play alone": 4 frames chasing its own tail, spinning in place: frame 1 looking back at the tail, frame 2 pouncing with front paws up, frame 3 turned around with the tail in front, frame 4 landing happily.
```

## 4. Gato base: cantar, pedir y comer (lámina 3)

- **Adjuntar:** La lámina 0 elegida.
- **Formato:** Horizontal (16:9)
- **Será:** `sprites/gato-casa-v1.webp`, filas 6–8

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small short-haired kitten seen from the side in three-quarter view, facing right, with a big round head, big round eyes and a short fluffy tail. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C, tabby stripes #7C2D12 (three stripes on the back, two on the tail, a small M on the forehead), belly and muzzle #FFF1D6, inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight, a soft neckerchief tied at the neck #2563EB with shadow #1E3A8A, two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same stripes, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with three rows, each frame the same size:
Row 1 "sing": 2 frames sitting tall with head tilted up and eyes closed happily, mouth open in a little round "meow"; frame 2 head tilted the other way. Two tiny pixel music notes float near the mouth.
Row 2 "ask": 2 frames sitting at the front, ears slightly down, big shiny pleading eyes, one front paw raised, mouth open in a small "mew"; frame 2 paw lower. Cute and gentle, never sad or crying tears.
Row 3 "eat": 3 frames eating from an invisible bowl on the ground: frame 1 head lowered, frame 2 head lowest with cheeks puffed, frame 3 head up licking its lips with a tiny pink tongue.
```

## 5. Gato base: mimos, baño y sacudirse (lámina 4)

- **Adjuntar:** La lámina 0 elegida.
- **Formato:** Horizontal (16:9)
- **Será:** `sprites/gato-casa-v1.webp`, filas 9–11

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small short-haired kitten seen from the side in three-quarter view, facing right, with a big round head, big round eyes and a short fluffy tail. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C, tabby stripes #7C2D12 (three stripes on the back, two on the tail, a small M on the forehead), belly and muzzle #FFF1D6, inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight, a soft neckerchief tied at the neck #2563EB with shadow #1E3A8A, two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same stripes, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with three rows, each frame the same size:
Row 1 "purr": 2 frames sitting with eyes closed in bliss, leaning its head into an invisible hand, tiny pink blush on the cheeks; frame 2 leaning a bit more, with two small pixel hearts above the head.
Row 2 "bath": 2 frames sitting covered in fluffy white and light-cyan soap foam bubbles (foam colors #FFFFFF and #BFEFFF only) on the back and head, eyes squeezed shut, smiling; frame 2 with the bubbles in different places.
Row 3 "shake": 3 frames shaking off water like a wet kitten: frame 1 starting to twist, frame 2 full shake with the fur puffed out and small water drops flying, frame 3 back to normal looking proud.
```

## 6. Gato base: pelota y «ahora no» (lámina 5)

- **Adjuntar:** La lámina 0 elegida.
- **Formato:** Horizontal (16:9)
- **Será:** `sprites/gato-casa-v1.webp`, filas 12–13

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small short-haired kitten seen from the side in three-quarter view, facing right, with a big round head, big round eyes and a short fluffy tail. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C, tabby stripes #7C2D12 (three stripes on the back, two on the tail, a small M on the forehead), belly and muzzle #FFF1D6, inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight, a soft neckerchief tied at the neck #2563EB with shadow #1E3A8A, two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same stripes, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with two rows, each frame the same size:
Row 1 "catch the ball": 4 frames: frame 1 running fast to the right, body stretched; frame 2 crouching low, ready to pounce, tail up; frame 3 leaping up with front paws reaching forward; frame 4 landing, sitting proudly with its front paws together as if holding something. Do not draw any ball.
Row 2 "not now": 2 frames sitting, politely turning the head away with eyes closed and nose up, as if saying "no, thank you"; frame 2 head turned further, one ear flicked. Friendly and calm, not angry.
```

## 7. Habitación de día

- **Adjuntar:** La lámina 0 del gato elegida (para que el estilo case).
- **Formato:** Lo más ancho posible (21:9). Si no sale tan ancha, genérala en dos mitades añadiendo al final «Draw only the LEFT half of the room» o «Draw only the RIGHT half of the room».
- **Será:** `worlds/casa-habitacion-v1.webp` (1280 × 540)

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing. A very wide side view of one cozy, sunny room of a little cat house, seen straight-on like a theater stage, no people and no animals in it. Cream wallpaper with soft vertical stripes, warm honey-wood floor planks along the bottom fifth of the image, the floor flat and completely empty in the bottom strip so characters can stand on it. From left to right: a rounded wooden front door with a heart-shaped window; a round, plump cat bed with a pink cushion on the floor; a big round soft rug in the middle of the floor; a small cat scratching post with a dangling pom-pom against the back wall; a large square window in the wall showing a blue day sky with two small clouds; a low shelf with a potted plant and a small framed picture of a paw print hanging above it; a small round white bathtub with little feet against the back wall on the right; a tall floor lamp with a round shade in the right corner. Everything original, simple and friendly, nothing copied from any game. No text, no letters, no numbers, no watermark.
```

## 8. Ventana de noche

- **Adjuntar:** La habitación de día elegida.
- **Formato:** Cuadrado
- **Será:** `sprites/casa-ventana-noche-v1.webp`

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors, crisp hard pixel edges, no blur, no anti-aliasing. The exact same square window as in the attached room, same frame and same size, but at night: a deep blue night sky with a smiling crescent moon and a few small twinkling stars. Only the window, front view, centered. Plain flat solid pure green background (#00FF00) around it, no shadow, no text, no letters, no watermark.
```

## 9. Objetos de la bandeja

- **Adjuntar:** La lámina 0 del gato elegida.
- **Formato:** Horizontal (16:9)
- **Será:** `sprites/casa-objetos-v1.webp`

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing. A sprite sheet of separate items in one row, each centered in its own cell, all at the same pixel scale, front view, generous empty space between items:
1. a round blue pet food bowl full of brown kibble;
2. the same blue bowl, empty;
3. a red ball with a small pink shine;
4. a yellow bath sponge with little holes;
5. a small broom with a wooden handle and golden straw;
6. a cute muddy cat paw print on the floor, brown;
7. a second muddy paw print, slightly smudged.
Plain flat solid pure green background (#00FF00) behind and between all items, no floor, no cast shadow, no bright green anywhere in the items, no text, no letters, no numbers, no watermark.
```

## 10. Roca que asoma

- **Adjuntar:** `public/assets/sprites/sea-reef-wall-v2.png` y `public/assets/worlds/world-8.webp`, en ese orden.
- **Formato:** Horizontal (16:9)
- **Será:** `sprites/roca-asoma-v1.webp`

```text
Chunky, readable pixel art in the style of a charming 16-bit platform game for young children: bold dark-plum outlines (#2f1d33), warm cel shading with two or three tones per color, saturated friendly colors, rounded cute shapes, a small white highlight on shiny surfaces. Crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Every item is drawn straight-on from the side, centered in its own cell, all at the same pixel scale.
A pixel-art sprite sheet with exactly two pieces of the same lagoon rock, stacked one above the other with generous empty space between them, both exactly the same width.
Piece 1 "top": the rounded top of a big friendly sea rock that sticks out of calm lagoon water, matching the stone finish of the reef in the first attached image (blue-grey and teal stone with soft purple shadows). The upper half is dry stone, slightly lighter, with one or two tiny shells and a small tuft of dark olive seaweed lying on top. Across the middle there is a clear, straight horizontal waterline: a band of white and pale-cyan foam with small bubbles hugging the rock on both sides. Below the foam the stone is wet, darker and more saturated, the same color as the water in the second attached image. The bottom edge of this piece is flat and continues straight down into piece 2.
Piece 2 "body": a rectangular section of the same underwater wet stone, darker teal and blue, with rounded cracks, a few small barnacles and pink coral bumps, designed to tile seamlessly vertically: the top edge and the bottom edge match exactly, and the left and right outlines are straight vertical lines.
Plain flat solid pure green background (#00FF00) behind and between all elements, no floor, no cast shadow, no bright green anywhere in the items (use only dark olive green for seaweed). No text, no letters, no numbers, no labels, no watermark.
```
