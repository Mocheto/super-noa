# Casa de los gatitos: el gato base

Dossier del gato base de la casa: un solo gato con todas las animaciones, que el juego pinta con la paleta de cada gatito. Ticket: [La hoja del gato base](https://github.com/Mocheto/super-noa/issues/169), del mapa [La casa de los gatitos](https://github.com/Mocheto/super-noa/issues/166). Las animaciones salen de [Cómo es por dentro un gatito de la casa](https://github.com/Mocheto/super-noa/issues/167).

## Estado

- Todos los prompts pendientes, completos y en orden, están también en [prompts-pendientes.md](prompts-pendientes.md).
- **Hecho (19-11-2026):** las seis láminas están generadas y recortadas con `prototypes/tools/casa-recorte.py` en `sprites/gato-casa-v1.webp` (sin pérdida). Cambios: «jugar solo» se queda en 3 cuadros (el de espaldas salió casi negro), del baño y del «ahora no» se usan 2 de los 3 que dio el generador, y las rayas de suelo se borran al recortar.

## Cómo funciona

- **Cuadro:** 160 × 160 px en la escena de 960 × 540, con el gato sentado de unos 140 px de alto. Vista de lado (tres cuartos) mirando a la derecha; la izquierda sale en espejo por código.
- **Colores clave:** el gato se pinta con los colores planos de la tabla. Al recortar, yo ajusto cada píxel al color clave más cercano, y el juego los sustituye por la paleta de cada gatito al cargar.
- **Pelo corto y rayas de atigrado para todos.** Los complementos de cada gatito se convierten en un mismo collar-pañuelo; la flor, la gema, las estrellas y la hoja no entran en la v1.
- **Barro y lazo dentro de la base:** las manchas de barro y el lazo de mejor amigo llevan su propio color clave. Limpio, el barro se pinta del color del pelo; sin cinco corazones, el lazo es transparente.
- **Espuma:** solo en los cuadros del baño, en blanco y celeste, sin cambio de paleta.
- **Hoja final:** `sprites/gato-casa-v1.webp`, 4 columnas × 13 filas de 160 × 160 px (640 × 2080), con fondo transparente.

| Clave | Color en la lámina | Miel | Bruma | Pino |
|---|---|---|---|---|
| Pelo | `#FF8A00` naranja | `#F2973A` | `#4A4A5C` | `#F4F1EC` |
| Pelo claro | `#FFC266` | `#FFC27A` | `#6B6B80` | `#FFFFFF` |
| Pelo oscuro (sombra) | `#C2410C` | `#C76A1E` | `#2E2E3D` | `#C9C4BC` |
| Rayas | `#7C2D12` granate | `#B4561A` | `#4A4A5C` (no se ven) | `#8C8C96` |
| Barriga y hocico | `#FFF1D6` crema | `#FFE6C2` | `#8A8AA0` | `#FFFFFF` |
| Interior de orejas y nariz | `#F9A8D4` rosa | `#F7A1B5` | `#D99AC8` | `#F7A9C0` |
| Ojos | `#1D4ED8` azul | `#3B82F6` | `#22C5C5` | `#3FA34D` |
| Collar-pañuelo | `#2563EB` azul fuerte | `#3D8BE0` | `#8B5CF6` | `#2F7A3B` |
| Collar, sombra | `#1E3A8A` | `#2563A8` | `#5B3BA8` | `#1E5428` |
| Barro | `#8B5A2B` marrón | marrón si está sucio; si no, el pelo | ídem | ídem |
| Lazo | `#FFD700` amarillo | dorado si es mejor amigo; si no, transparente | ídem | ídem |
| Contorno | `#2F1D33` ciruela | igual | igual | igual |

## Láminas

| # | Lámina | Animaciones (cuadros) | Filas de la hoja |
|---|---|---|---|
| 0 | Referencia | Sentado de lado, una sola pose grande | — |
| 1 | Andar y sentado | Andar (4), sentado con parpadeo (2), sentado moviendo la cola (1) | 1–3 |
| 2 | Dormir y jugar solo | Dormir respirando (2), jugar solo persiguiendo la cola (4) | 4–5 |
| 3 | Cantar, pedir y comer | Cantar (2), pedir lloriqueando (2), comer (3) | 6–8 |
| 4 | Mimos, baño y sacudirse | Ronronear al frotarlo (2), en el baño con espuma (2), sacudirse (3) | 9–11 |
| 5 | Pelota y «ahora no» | Correr y atrapar la pelota (4), girar la cabeza diciendo «ahora no» (2) | 12–13 |

Velocidad: andar y correr a 8 cuadros por segundo; lo demás, a 4–6.

## Cómo trabajar

1. Genera primero la **lámina 0** y elige la que más te guste: será la referencia de todas las demás.
2. Para las láminas 1–5, copia su prompt entero (ya lleva el estilo y los colores) y adjunta la lámina 0 elegida.
3. Todas van sobre **verde plano `#00FF00`**. Yo las recorto a transparente, ajusto los colores clave, alineo los pies en la misma línea y monto la hoja.
4. Si un modelo estropea una lámina, genera cada animación por separado con el mismo prompt, dejando solo esa fila.
5. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir.
6. Guarda las originales fuera del repositorio, en `../super-noa-arte-original/casa-v1/`.

## Lámina 0: referencia

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small short-haired kitten seen from the side in three-quarter view, facing right, with a big round head, big round eyes and a short fluffy tail. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C, tabby stripes #7C2D12 (three stripes on the back, two on the tail, a small M on the forehead), belly and muzzle #FFF1D6, inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight, a soft neckerchief tied at the neck #2563EB with shadow #1E3A8A, two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same stripes, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
A single large reference drawing of the kitten sitting calmly, side three-quarter view facing right, tail curled around its front paws, looking at the viewer with a gentle smile. Only this one pose, centered.
```

## Lámina 1: andar y sentado

Adjunta la lámina 0 elegida.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small short-haired kitten seen from the side in three-quarter view, facing right, with a big round head, big round eyes and a short fluffy tail. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C, tabby stripes #7C2D12 (three stripes on the back, two on the tail, a small M on the forehead), belly and muzzle #FFF1D6, inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight, a soft neckerchief tied at the neck #2563EB with shadow #1E3A8A, two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same stripes, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with three rows, each frame the same size, frames evenly spaced:
Row 1 "walk": 4 frames of a cheerful walking cycle to the right, legs alternating, tail up with a soft curve.
Row 2 "sit and blink": 2 frames sitting like the reference; frame 1 eyes open, frame 2 eyes closed in a happy blink.
Row 3 "sit and wag": 1 frame sitting, looking forward, tail raised and swishing to one side with two tiny motion lines.
```

## Lámina 2: dormir y jugar solo

Adjunta la lámina 0 elegida.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small short-haired kitten seen from the side in three-quarter view, facing right, with a big round head, big round eyes and a short fluffy tail. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C, tabby stripes #7C2D12 (three stripes on the back, two on the tail, a small M on the forehead), belly and muzzle #FFF1D6, inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight, a soft neckerchief tied at the neck #2563EB with shadow #1E3A8A, two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same stripes, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with two rows, each frame the same size:
Row 1 "sleep": 2 frames curled up asleep in a round ball, eyes closed, tail over the nose; frame 2 slightly rounder as it breathes in, with a tiny "z" shape made of pixels (not a letter, a small zigzag) above the head in frame 2 only.
Row 2 "play alone": 4 frames chasing its own tail, spinning in place: frame 1 looking back at the tail, frame 2 pouncing with front paws up, frame 3 turned around with the tail in front, frame 4 landing happily.
```

## Lámina 3: cantar, pedir y comer

Adjunta la lámina 0 elegida.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small short-haired kitten seen from the side in three-quarter view, facing right, with a big round head, big round eyes and a short fluffy tail. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C, tabby stripes #7C2D12 (three stripes on the back, two on the tail, a small M on the forehead), belly and muzzle #FFF1D6, inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight, a soft neckerchief tied at the neck #2563EB with shadow #1E3A8A, two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same stripes, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with three rows, each frame the same size:
Row 1 "sing": 2 frames sitting tall with head tilted up and eyes closed happily, mouth open in a little round "meow"; frame 2 head tilted the other way. Two tiny pixel music notes float near the mouth.
Row 2 "ask": 2 frames sitting at the front, ears slightly down, big shiny pleading eyes, one front paw raised, mouth open in a small "mew"; frame 2 paw lower. Cute and gentle, never sad or crying tears.
Row 3 "eat": 3 frames eating from an invisible bowl on the ground: frame 1 head lowered, frame 2 head lowest with cheeks puffed, frame 3 head up licking its lips with a tiny pink tongue.
```

## Lámina 4: mimos, baño y sacudirse

Adjunta la lámina 0 elegida.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small short-haired kitten seen from the side in three-quarter view, facing right, with a big round head, big round eyes and a short fluffy tail. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C, tabby stripes #7C2D12 (three stripes on the back, two on the tail, a small M on the forehead), belly and muzzle #FFF1D6, inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight, a soft neckerchief tied at the neck #2563EB with shadow #1E3A8A, two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same stripes, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with three rows, each frame the same size:
Row 1 "purr": 2 frames sitting with eyes closed in bliss, leaning its head into an invisible hand, tiny pink blush on the cheeks; frame 2 leaning a bit more, with two small pixel hearts above the head.
Row 2 "bath": 2 frames sitting covered in fluffy white and light-cyan soap foam bubbles (foam colors #FFFFFF and #BFEFFF only) on the back and head, eyes squeezed shut, smiling; frame 2 with the bubbles in different places.
Row 3 "shake": 3 frames shaking off water like a wet kitten: frame 1 starting to twist, frame 2 full shake with the fur puffed out and small water drops flying, frame 3 back to normal looking proud.
```

## Lámina 5: pelota y «ahora no»

Adjunta la lámina 0 elegida.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small short-haired kitten seen from the side in three-quarter view, facing right, with a big round head, big round eyes and a short fluffy tail. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C, tabby stripes #7C2D12 (three stripes on the back, two on the tail, a small M on the forehead), belly and muzzle #FFF1D6, inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight, a soft neckerchief tied at the neck #2563EB with shadow #1E3A8A, two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same stripes, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with two rows, each frame the same size:
Row 1 "catch the ball": 4 frames: frame 1 running fast to the right, body stretched; frame 2 crouching low, ready to pounce, tail up; frame 3 leaping up with front paws reaching forward; frame 4 landing, sitting proudly with its front paws together as if holding something. Do not draw any ball.
Row 2 "not now": 2 frames sitting, politely turning the head away with eyes closed and nose up, as if saying "no, thank you"; frame 2 head turned further, one ear flicked. Friendly and calm, not angry.
```
