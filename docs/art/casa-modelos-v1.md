# Casa de los gatitos: modelos nuevos (referencias)

Láminas de referencia de los tres modelos nuevos de los gatitos de la casa: **esmoquin**, **melena** y **nube**. El **atigrado** es la hoja de hoy (`sprites/gato-casa-v1.webp`, [dossier](casa-gato-base-v1.md)) y no cambia. Ticket: [Lámina de referencia de cada modelo y prueba de parecido](https://github.com/Mocheto/super-noa/issues/384), del mapa [Gatitos de la casa distintos: modelos, marcas y complemento de su mundo](https://github.com/Mocheto/super-noa/issues/378).

Decisiones de las que sale:

- [Cuántos modelos de gatito y quién va con cada uno](https://github.com/Mocheto/super-noa/issues/381).
- [Marcas del pelo de cada gatito y cómo se pintan](https://github.com/Mocheto/super-noa/issues/382).
- [El complemento de su mundo frente a los accesorios del armario](https://github.com/Mocheto/super-noa/issues/383).

## Estado

- **Hecho (25-11-2026):** las tres referencias están generadas (originales en `../super-noa-arte-original/casa-modelos-v1/`) y recortadas con `prototypes/tools/casa-modelos-recorte.py` en `sprites/gato-casa-referencias-v1.webp`: una fila de cuatro cuadros de 160 × 160 con el atigrado, el esmoquin, la melena y la nube. La prueba de parecido (`?prueba=casa&paletas`, en desarrollo) las pinta con la paleta y las marcas de cada gatito, junto a su dibujo del mundo.
- **Dadas por buenas** con la persona usuaria (25-11-2026), con un collar fino que se queda y la cola de nube blanca con la punta de color.
- **Los tres modelos, hechos (25-11-2026):** sus siete láminas, recortadas con `prototypes/tools/casa-modelo-recorte.py <modelo> <carpeta>` en `sprites/gato-casa-<modelo>-v1.webp`, `gato-casa-arropado-<modelo>-v1.webp` y `gato-casa-vestidor-<modelo>-v1.webp`. El script elige qué cuadros salen cuando el generador da de más o los reparte en otras filas, pasa el pelo claro a pelo en la melena (el cuerpo salió claro) y lleva a su clave los ojos, que salieron del azul marino del collar. Las anclas salen de `casa-gato-anclas.py`; en los modelos nuevos la cabeza se centra sobre los ojos, porque el lazo no siempre va en medio, y donde el pelo tapa el lazo se pone respecto al collar.
- **Detalles que quedan:**
  - En «comer» de la nube se ve el cuenco que dibujó el generador.
  - En algunos cuadros pequeños del esmoquin (jugar solo, pedir) el sombrero queda un poco alto.

## Cómo funciona

- **Cada referencia** es una sola pose grande: el gatito sentado, de lado en tres cuartos y mirando a la derecha, con las mismas proporciones y el mismo tamaño que el atigrado. Así las trece animaciones de cada modelo encajan después en la misma rejilla de 4 × 13 cuadros de 160 px, con los pies en la misma línea.
- **Colores clave:** los mismos del gato base, con dos cambios:
  - en vez del pañuelo, una **franja de collar** fina y lisa en las claves del collar (sirve para que las anclas encuentren el cuello y se queda como collar fino del color del collar de cada gatito, con el complemento encima);
  - dos claves nuevas: **puntas** `#A21CAF` y **manchas** `#00E5FF`.
- **El lazo y el barro** van como en el gato base: el lazo entre las orejas y dos manchitas de barro.
- **Ningún complemento:** los complementos son piezas aparte, en otra lámina.
- **Marcas de cada modelo:**

  | Modelo | Marcas dibujadas | Gatitos |
  |---|---|---|
  | esmoquin | V clara en la cara, pecho, calcetines y punta de la cola en la clave de **barriga**; rayas finas en el lomo y anillos en la cola | Nube, Botón, Estrella, Vía |
  | melena | **puntas** en la punta de las orejas, el mechón de la frente, la punta de la cola y los calcetines; rayas suaves en el lomo | Bruma, Luna, Perla, Ámbar, Copito |
  | nube | **puntas** como en melena y **manchas** en forma de nubecita en el lomo y el costado | Iris, Tempo, Celeste |

| Clave | Color en la lámina |
|---|---|
| Pelo | `#FF8A00` |
| Pelo claro | `#FFC266` |
| Pelo oscuro (sombra) | `#C2410C` |
| Rayas | `#7C2D12` |
| Barriga, hocico y zonas claras | `#FFF1D6` |
| Interior de orejas y nariz | `#F9A8D4` |
| Ojos | `#1D4ED8` |
| Collar (franja) | `#2563EB` |
| Collar, sombra | `#1E3A8A` |
| Barro | `#8B5A2B` |
| Lazo | `#FFD700` |
| **Puntas** (nueva) | `#A21CAF` |
| **Manchas** (nueva) | `#00E5FF` |
| Contorno | `#2F1D33` |

## Cómo trabajar

1. **Adjunta dos imágenes a cada prompt:**
   - el atigrado sentado, para las proporciones y el tamaño: `../super-noa-arte-original/casa-modelos-v1/atigrado-sentado.png`;
   - el dibujo del mundo que se indica en cada prompt, solo para la forma de la cabeza y el pelo, no para sus colores.
2. Las tres van sobre **verde plano `#00FF00`**.
3. Genera varias de cada una y quédate con la que mejor se parezca a sus gatitos. Guárdalas en `../super-noa-arte-original/casa-modelos-v1/` con estos nombres:
   - `esmoquin-referencia`
   - `melena-referencia`
   - `nube-referencia`
4. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir.

## Esmoquin

Adjunta `atigrado-sentado.png` y `public/assets/sprites/world-cat-5-v1.webp` (Nube).

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Match the size, proportions, pose and drawing style of the first attached kitten exactly, but draw a different kitten: a short-haired TUXEDO kitten, with a round head, slightly bigger upright ears than the first kitten, big round eyes and a thin tail. Use the second attached image only as a guide for the tuxedo look and the head, never for its colors or clothes. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; the tuxedo areas in #FFF1D6: a clear inverted V on the face from the forehead down around the muzzle, the whole chest and belly, all four paws as white socks, and the tip of the tail; thin stripes #7C2D12 (three short thin stripes on the back and three rings on the tail); inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, with no knot, no bell and no hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B; a small bow on top of the head between the ears #FFD700. Plain flat solid pure green background (#00FF00) behind the kitten, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
A single large reference drawing of the kitten sitting calmly, side three-quarter view facing right, tail curled around its front paws, looking at the viewer with a gentle smile. Only this one pose, centered.
```

## Melena

Adjunta `atigrado-sentado.png` y `public/assets/sprites/world-cat-2-v1.webp` (Bruma).

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Match the size, proportions, pose and drawing style of the first attached kitten exactly, but draw a different kitten: a LONG-HAIRED fluffy kitten, with a round head framed by fluffy cheek tufts, a soft fluffy mane around the neck and chest, tufts of fur inside the ears, a small fluffy tuft on the forehead, big round eyes and a big plumed fluffy tail; the fluffy outline is made of soft rounded tufts, not spikes. Use the second attached image only as a guide for the fluffy fur and the head, never for its colors or clothes. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; belly, muzzle and the front of the mane #FFF1D6; color points #A21CAF on the tips of both ears, on the forehead tuft, on the tip of the tail and on all four paws as socks; soft stripes #7C2D12 (three short soft stripes on the back only); inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, half hidden in the mane, with no knot, no bell and no hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B; a small bow on top of the head between the ears #FFD700. Plain flat solid pure green background (#00FF00) behind the kitten, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
A single large reference drawing of the kitten sitting calmly, side three-quarter view facing right, the big fluffy tail curled around its front paws, looking at the viewer with a gentle smile. Only this one pose, centered, the whole fluffy kitten no taller than the first attached kitten plus its fur.
```

## Nube

Adjunta `atigrado-sentado.png` y `public/assets/sprites/world-cat-7-v1.webp` (Iris).

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Match the size, proportions, pose and drawing style of the first attached kitten exactly, but draw a different kitten: a CLOUD-LIKE extra fluffy kitten, softer and rounder than a long-haired cat, with a big puffy quiff on top of the head like a small cloud, round cloud-puff cheeks, big ears full of fluff, big round eyes, a puffy collar of fur like a cloud ruff and a huge round cloud-shaped tail made of soft bulging puffs. Use the second attached image only as a guide for the cloud fur, the quiff and the tail, never for its colors or clothes. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; belly, muzzle and the cloud ruff #FFF1D6; color points #A21CAF on the tips of both ears, on the quiff, on the tip of the tail and on all four paws as socks; three or four small cloud-shaped patches #00E5FF on the back and on the side; inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, half hidden in the ruff, with no knot, no bell and no hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B; a small bow on top of the head between the ears #FFD700. Plain flat solid pure green background (#00FF00) behind the kitten, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
A single large reference drawing of the kitten sitting calmly, side three-quarter view facing right, the huge cloud tail curled around its front paws, looking at the viewer with a gentle smile. Only this one pose, centered, the whole fluffy kitten no taller than the first attached kitten plus its fur.
```

## Animaciones, arropado y vestidor

Siete láminas por modelo, 21 en total: [Animaciones de los modelos esmoquin, melena y nube en la casa](https://github.com/Mocheto/super-noa/issues/385). Son las mismas trece animaciones del [gato base](casa-gato-base-v1.md#láminas), la pose arropado y el gatito grande del vestidor. Cada prompt va completo: se copia entero.

- **Adjunta siempre la referencia aprobada del modelo**, de `../super-noa-arte-original/casa-modelos-v1/`.
  - Para el arropado, además, la mantita: `public/assets/sprites/casa-mantita-v1.webp`.
  - Para el vestidor, además, el gatito grande de hoy: `public/assets/sprites/gato-casa-vestidor-v1.webp`. Así sale la misma pose de frente y el mismo tamaño.
- **Formato:** cuadrado para las animaciones y horizontal 16:9 para el arropado y el vestidor. Todas sobre verde plano `#00FF00`.
- **Dónde se guardan:** una carpeta por modelo, `../super-noa-arte-original/casa-modelos-v1/<modelo>/`, con los nombres de cada apartado (cualquier extensión).
- **Arropado:** el gatito no lleva puntas, porque las puntas son violetas como la mantita y el recorte las confundiría. Las orejas y la punta de la cola van del color del pelo.
- **Si una lámina sale mal:** genera cada fila por separado con el mismo prompt, dejando solo esa fila. Si «jugar solo» sale de espaldas, repite: el cuadro de espaldas se descartó en el atigrado.

### Esmoquin

#### Esmoquin: andar y sentado (`gato-andar-sentado`)

Adjunta `esmoquin-referencia.jpg`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small short-haired TUXEDO kitten with a round head, slightly big upright ears, big round eyes and a thin tail, seen from the side in three-quarter view, facing right. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; the tuxedo areas in #FFF1D6: an inverted V on the face around the muzzle, the chest and belly, all four paws as white socks and the tip of the tail; thin stripes #7C2D12 (three short thin stripes on the back and three rings on the tail); inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, with no knot, no bell and no hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B; a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same tuxedo markings, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with three rows, each frame the same size, frames evenly spaced:
Row 1 "walk": 4 frames of a cheerful walking cycle to the right, legs alternating, tail up with a soft curve.
Row 2 "sit and blink": 2 frames sitting like the reference; frame 1 eyes open, frame 2 eyes closed in a happy blink.
Row 3 "sit and wag": 1 frame sitting, looking forward, tail raised and swishing to one side with two tiny motion lines.
```

#### Esmoquin: dormir y jugar solo (`gato-dormir-jugar`)

Adjunta `esmoquin-referencia.jpg`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small short-haired TUXEDO kitten with a round head, slightly big upright ears, big round eyes and a thin tail, seen from the side in three-quarter view, facing right. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; the tuxedo areas in #FFF1D6: an inverted V on the face around the muzzle, the chest and belly, all four paws as white socks and the tip of the tail; thin stripes #7C2D12 (three short thin stripes on the back and three rings on the tail); inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, with no knot, no bell and no hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B; a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same tuxedo markings, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with two rows, each frame the same size, frames evenly spaced:
Row 1 "sleep": 2 frames curled up asleep in a round ball, eyes closed, tail over the nose; frame 2 slightly rounder as it breathes in, with a tiny "z" shape made of pixels (not a letter, a small zigzag) above the head in frame 2 only.
Row 2 "play alone": 4 frames chasing its own tail, spinning in place: frame 1 looking back at the tail, frame 2 pouncing with front paws up, frame 3 seen from the side with the tail in front (never from behind), frame 4 landing happily.
```

#### Esmoquin: cantar, pedir y comer (`gato-cantar-pedir-comer`)

Adjunta `esmoquin-referencia.jpg`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small short-haired TUXEDO kitten with a round head, slightly big upright ears, big round eyes and a thin tail, seen from the side in three-quarter view, facing right. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; the tuxedo areas in #FFF1D6: an inverted V on the face around the muzzle, the chest and belly, all four paws as white socks and the tip of the tail; thin stripes #7C2D12 (three short thin stripes on the back and three rings on the tail); inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, with no knot, no bell and no hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B; a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same tuxedo markings, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with three rows, each frame the same size, frames evenly spaced:
Row 1 "sing": 2 frames sitting tall with head tilted up and eyes closed happily, mouth open in a little round "meow"; frame 2 head tilted the other way. Two tiny pixel music notes float near the mouth.
Row 2 "ask": 2 frames sitting at the front, ears slightly down, big shiny pleading eyes, one front paw raised, mouth open in a small "mew"; frame 2 paw lower. Cute and gentle, never sad or crying tears.
Row 3 "eat": 3 frames eating from an invisible bowl on the ground: frame 1 head lowered, frame 2 head lowest with cheeks puffed, frame 3 head up licking its lips with a tiny pink tongue.
```

#### Esmoquin: mimos, baño y sacudirse (`gato-mimos-bano-sacudirse`)

Adjunta `esmoquin-referencia.jpg`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small short-haired TUXEDO kitten with a round head, slightly big upright ears, big round eyes and a thin tail, seen from the side in three-quarter view, facing right. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; the tuxedo areas in #FFF1D6: an inverted V on the face around the muzzle, the chest and belly, all four paws as white socks and the tip of the tail; thin stripes #7C2D12 (three short thin stripes on the back and three rings on the tail); inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, with no knot, no bell and no hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B; a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same tuxedo markings, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with three rows, each frame the same size, frames evenly spaced:
Row 1 "purr": 2 frames sitting with eyes closed in bliss, leaning its head into an invisible hand, tiny pink blush on the cheeks; frame 2 leaning a bit more, with two small pixel hearts above the head.
Row 2 "bath": 2 frames sitting covered in fluffy white and light-cyan soap foam bubbles (foam colors #FFFFFF and #BFEFFF only) on the back and head, eyes squeezed shut, smiling; frame 2 with the bubbles in different places.
Row 3 "shake": 3 frames shaking off water like a wet kitten: frame 1 starting to twist, frame 2 full shake with the fur puffed out and small water drops flying, frame 3 back to normal looking proud.
```

#### Esmoquin: pelota y «ahora no» (`gato-pelota-ahora-no`)

Adjunta `esmoquin-referencia.jpg`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small short-haired TUXEDO kitten with a round head, slightly big upright ears, big round eyes and a thin tail, seen from the side in three-quarter view, facing right. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; the tuxedo areas in #FFF1D6: an inverted V on the face around the muzzle, the chest and belly, all four paws as white socks and the tip of the tail; thin stripes #7C2D12 (three short thin stripes on the back and three rings on the tail); inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, with no knot, no bell and no hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B; a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same tuxedo markings, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with two rows, each frame the same size, frames evenly spaced:
Row 1 "catch the ball": 4 frames: frame 1 running fast to the right, body stretched; frame 2 crouching low, ready to pounce, tail up; frame 3 leaping up with front paws reaching forward; frame 4 landing, sitting proudly with its front paws together as if holding something. Do not draw any ball.
Row 2 "not now": 2 frames sitting, politely turning the head away with eyes closed and nose up, as if saying "no, thank you"; frame 2 head turned further, one ear flicked. Friendly and calm, not angry.
```

#### Esmoquin: arropado (`gato-arropado`)

Adjunta `esmoquin-referencia.jpg` y `casa-mantita-v1.webp`. Formato horizontal 16:9.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. The same kitten as in the first attached image, a small short-haired TUXEDO kitten with a round head, slightly big upright ears, big round eyes and a thin tail, same size and same proportions, tucked in for the night under the same small blanket as in the second attached image. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; the tuxedo areas in #FFF1D6: an inverted V on the face around the muzzle and the tip of the tail; inner ears and nose #F9A8D4; a small bow on top of the head between the ears #FFD700; no violet anywhere on the kitten, the ear tips and the tail tip in plain fur. Paint the blanket ONLY with a solid bright violet (#B000FF), darker violet folds (#6A00A8) and a thin white stitched border with a few tiny white stars. A sprite sheet with exactly two frames side by side, each the same size, evenly spaced, the kitten lying on the floor on its side seen from the front in three-quarter view, facing right: the kitten's whole head is outside the blanket, resting sideways on its two little front paws like on a pillow, eyes peacefully closed as thin curved lines, a tiny content smile; the blanket covers the kitten's body from the neck down to the back paws, draped softly over the body with a wavy hem touching the floor; only the tip of the fluffy tail peeks out from under the blanket at the back, on the left. Frame 1: breathing in, the blanket slightly higher. Frame 2: breathing out, the blanket slightly lower, a tiny "z" floating above the head. Both frames with the head, the paws and the blanket in the same place, resting on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between both frames, generous empty space between them, no floor, no pillow, no cast shadow, no text, no letters, no numbers, no watermark.
```

#### Esmoquin: gatito grande del vestidor (`gato-vestidor`)

Adjunta `esmoquin-referencia.jpg` y `gato-casa-vestidor-v1.webp`. Formato horizontal 16:9.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Everything original, simple and friendly, nothing copied from any game. The same kitten as in the first attached image, a small short-haired TUXEDO kitten with a round head, slightly big upright ears, big round eyes and a thin tail, drawn bigger, in exactly the same pose and size as the kitten in the second attached image: sitting upright and looking straight at the viewer, seen fully from the front, ears up, front paws together, tail curled around the paws. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; the tuxedo areas in #FFF1D6: an inverted V on the face around the muzzle, the chest and belly, all four paws as white socks and the tip of the tail; thin stripes #7C2D12 (three short thin stripes on the back and three rings on the tail); inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, with no knot, no bell and no hanging cloth; a small bow on top of the head between the ears #FFD700. A sprite sheet with exactly two frames side by side, each the same size, evenly spaced: Frame 1 "still": calm, big open eyes, small smile. Frame 2 "happy": eyes closed as happy upward curves, a bigger open smile, cheeks a little puffed, the same pose. Both frames with the head, the body and the paws in exactly the same place, resting on the same invisible baseline, with empty space above the head for a hat. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between items, no floor, no cast shadow, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```

### Melena

#### Melena: andar y sentado (`gato-andar-sentado`)

Adjunta `melena-referencia.jpg`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small LONG-HAIRED fluffy kitten with a round head framed by fluffy cheek tufts, a soft fluffy mane around the neck and chest, tufts of fur inside the ears, a small fluffy tuft on the forehead, big round eyes and a big plumed fluffy tail; the fluffy outline is made of soft rounded tufts, not spikes, seen from the side in three-quarter view, facing right. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; belly, muzzle and the front of the mane #FFF1D6; color points #A21CAF on the tips of both ears, on the forehead tuft, on the tip of the tail and on all four paws as socks; soft stripes #7C2D12 (three short soft stripes on the back only); inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, with no knot, no bell and no hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B; a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same color points and the same soft stripes, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with three rows, each frame the same size, frames evenly spaced:
Row 1 "walk": 4 frames of a cheerful walking cycle to the right, legs alternating, tail up with a soft curve.
Row 2 "sit and blink": 2 frames sitting like the reference; frame 1 eyes open, frame 2 eyes closed in a happy blink.
Row 3 "sit and wag": 1 frame sitting, looking forward, tail raised and swishing to one side with two tiny motion lines.
```

#### Melena: dormir y jugar solo (`gato-dormir-jugar`)

Adjunta `melena-referencia.jpg`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small LONG-HAIRED fluffy kitten with a round head framed by fluffy cheek tufts, a soft fluffy mane around the neck and chest, tufts of fur inside the ears, a small fluffy tuft on the forehead, big round eyes and a big plumed fluffy tail; the fluffy outline is made of soft rounded tufts, not spikes, seen from the side in three-quarter view, facing right. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; belly, muzzle and the front of the mane #FFF1D6; color points #A21CAF on the tips of both ears, on the forehead tuft, on the tip of the tail and on all four paws as socks; soft stripes #7C2D12 (three short soft stripes on the back only); inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, with no knot, no bell and no hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B; a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same color points and the same soft stripes, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with two rows, each frame the same size, frames evenly spaced:
Row 1 "sleep": 2 frames curled up asleep in a round ball, eyes closed, tail over the nose; frame 2 slightly rounder as it breathes in, with a tiny "z" shape made of pixels (not a letter, a small zigzag) above the head in frame 2 only.
Row 2 "play alone": 4 frames chasing its own tail, spinning in place: frame 1 looking back at the tail, frame 2 pouncing with front paws up, frame 3 seen from the side with the tail in front (never from behind), frame 4 landing happily.
```

#### Melena: cantar, pedir y comer (`gato-cantar-pedir-comer`)

Adjunta `melena-referencia.jpg`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small LONG-HAIRED fluffy kitten with a round head framed by fluffy cheek tufts, a soft fluffy mane around the neck and chest, tufts of fur inside the ears, a small fluffy tuft on the forehead, big round eyes and a big plumed fluffy tail; the fluffy outline is made of soft rounded tufts, not spikes, seen from the side in three-quarter view, facing right. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; belly, muzzle and the front of the mane #FFF1D6; color points #A21CAF on the tips of both ears, on the forehead tuft, on the tip of the tail and on all four paws as socks; soft stripes #7C2D12 (three short soft stripes on the back only); inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, with no knot, no bell and no hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B; a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same color points and the same soft stripes, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with three rows, each frame the same size, frames evenly spaced:
Row 1 "sing": 2 frames sitting tall with head tilted up and eyes closed happily, mouth open in a little round "meow"; frame 2 head tilted the other way. Two tiny pixel music notes float near the mouth.
Row 2 "ask": 2 frames sitting at the front, ears slightly down, big shiny pleading eyes, one front paw raised, mouth open in a small "mew"; frame 2 paw lower. Cute and gentle, never sad or crying tears.
Row 3 "eat": 3 frames eating from an invisible bowl on the ground: frame 1 head lowered, frame 2 head lowest with cheeks puffed, frame 3 head up licking its lips with a tiny pink tongue.
```

#### Melena: mimos, baño y sacudirse (`gato-mimos-bano-sacudirse`)

Adjunta `melena-referencia.jpg`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small LONG-HAIRED fluffy kitten with a round head framed by fluffy cheek tufts, a soft fluffy mane around the neck and chest, tufts of fur inside the ears, a small fluffy tuft on the forehead, big round eyes and a big plumed fluffy tail; the fluffy outline is made of soft rounded tufts, not spikes, seen from the side in three-quarter view, facing right. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; belly, muzzle and the front of the mane #FFF1D6; color points #A21CAF on the tips of both ears, on the forehead tuft, on the tip of the tail and on all four paws as socks; soft stripes #7C2D12 (three short soft stripes on the back only); inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, with no knot, no bell and no hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B; a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same color points and the same soft stripes, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with three rows, each frame the same size, frames evenly spaced:
Row 1 "purr": 2 frames sitting with eyes closed in bliss, leaning its head into an invisible hand, tiny pink blush on the cheeks; frame 2 leaning a bit more, with two small pixel hearts above the head.
Row 2 "bath": 2 frames sitting covered in fluffy white and light-cyan soap foam bubbles (foam colors #FFFFFF and #BFEFFF only) on the back and head, eyes squeezed shut, smiling; frame 2 with the bubbles in different places.
Row 3 "shake": 3 frames shaking off water like a wet kitten: frame 1 starting to twist, frame 2 full shake with the fur puffed out and small water drops flying, frame 3 back to normal looking proud.
```

#### Melena: pelota y «ahora no» (`gato-pelota-ahora-no`)

Adjunta `melena-referencia.jpg`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small LONG-HAIRED fluffy kitten with a round head framed by fluffy cheek tufts, a soft fluffy mane around the neck and chest, tufts of fur inside the ears, a small fluffy tuft on the forehead, big round eyes and a big plumed fluffy tail; the fluffy outline is made of soft rounded tufts, not spikes, seen from the side in three-quarter view, facing right. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; belly, muzzle and the front of the mane #FFF1D6; color points #A21CAF on the tips of both ears, on the forehead tuft, on the tip of the tail and on all four paws as socks; soft stripes #7C2D12 (three short soft stripes on the back only); inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, with no knot, no bell and no hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B; a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same color points and the same soft stripes, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with two rows, each frame the same size, frames evenly spaced:
Row 1 "catch the ball": 4 frames: frame 1 running fast to the right, body stretched; frame 2 crouching low, ready to pounce, tail up; frame 3 leaping up with front paws reaching forward; frame 4 landing, sitting proudly with its front paws together as if holding something. Do not draw any ball.
Row 2 "not now": 2 frames sitting, politely turning the head away with eyes closed and nose up, as if saying "no, thank you"; frame 2 head turned further, one ear flicked. Friendly and calm, not angry.
```

#### Melena: arropado (`gato-arropado`)

Adjunta `melena-referencia.jpg` y `casa-mantita-v1.webp`. Formato horizontal 16:9.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. The same kitten as in the first attached image, a small LONG-HAIRED fluffy kitten with a round head framed by fluffy cheek tufts, a soft fluffy mane around the neck and chest, tufts of fur inside the ears, a small fluffy tuft on the forehead, big round eyes and a big plumed fluffy tail; the fluffy outline is made of soft rounded tufts, not spikes, same size and same proportions, tucked in for the night under the same small blanket as in the second attached image. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; muzzle and the front of the mane #FFF1D6; inner ears and nose #F9A8D4; a small bow on top of the head between the ears #FFD700; no violet anywhere on the kitten, the ear tips and the tail tip in plain fur. Paint the blanket ONLY with a solid bright violet (#B000FF), darker violet folds (#6A00A8) and a thin white stitched border with a few tiny white stars. A sprite sheet with exactly two frames side by side, each the same size, evenly spaced, the kitten lying on the floor on its side seen from the front in three-quarter view, facing right: the kitten's whole head is outside the blanket, resting sideways on its two little front paws like on a pillow, eyes peacefully closed as thin curved lines, a tiny content smile; the blanket covers the kitten's body from the neck down to the back paws, draped softly over the body with a wavy hem touching the floor; only the tip of the fluffy tail peeks out from under the blanket at the back, on the left. Frame 1: breathing in, the blanket slightly higher. Frame 2: breathing out, the blanket slightly lower, a tiny "z" floating above the head. Both frames with the head, the paws and the blanket in the same place, resting on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between both frames, generous empty space between them, no floor, no pillow, no cast shadow, no text, no letters, no numbers, no watermark.
```

#### Melena: gatito grande del vestidor (`gato-vestidor`)

Adjunta `melena-referencia.jpg` y `gato-casa-vestidor-v1.webp`. Formato horizontal 16:9.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Everything original, simple and friendly, nothing copied from any game. The same kitten as in the first attached image, a small LONG-HAIRED fluffy kitten with a round head framed by fluffy cheek tufts, a soft fluffy mane around the neck and chest, tufts of fur inside the ears, big round eyes and a big plumed fluffy tail, drawn bigger, in exactly the same pose and size as the kitten in the second attached image: sitting upright and looking straight at the viewer, seen fully from the front, ears up, front paws together, tail curled around the paws. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; belly, muzzle and the front of the mane #FFF1D6; color points #A21CAF on the tips of both ears, on the forehead tuft, on the tip of the tail and on all four paws as socks; soft stripes #7C2D12 (three short soft stripes on the back only); inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, with no knot, no bell and no hanging cloth; a small bow on top of the head between the ears #FFD700. A sprite sheet with exactly two frames side by side, each the same size, evenly spaced: Frame 1 "still": calm, big open eyes, small smile. Frame 2 "happy": eyes closed as happy upward curves, a bigger open smile, cheeks a little puffed, the same pose. Both frames with the head, the body and the paws in exactly the same place, resting on the same invisible baseline, with empty space above the head for a hat. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between items, no floor, no cast shadow, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```

### Nube

#### Nube: andar y sentado (`gato-andar-sentado`)

Adjunta `nube-referencia.jpg`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small CLOUD-LIKE extra fluffy kitten, softer and rounder than a long-haired cat, with a big puffy quiff on top of the head like a small cloud, round cloud-puff cheeks, big ears full of fluff, big round eyes, a puffy ruff of fur like a cloud around the neck and a huge round cloud-shaped tail made of soft bulging puffs, seen from the side in three-quarter view, facing right. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; belly, muzzle, the cloud ruff, the quiff and the cloud tail #FFF1D6; color points #A21CAF on the tips of both ears, on the tip of the tail and on all four paws as socks; three or four small cloud-shaped patches #00E5FF on the back and on the side; inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, with no knot, no bell and no hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B; a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same color points and the same cloud patches, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with three rows, each frame the same size, frames evenly spaced:
Row 1 "walk": 4 frames of a cheerful walking cycle to the right, legs alternating, tail up with a soft curve.
Row 2 "sit and blink": 2 frames sitting like the reference; frame 1 eyes open, frame 2 eyes closed in a happy blink.
Row 3 "sit and wag": 1 frame sitting, looking forward, tail raised and swishing to one side with two tiny motion lines.
```

#### Nube: dormir y jugar solo (`gato-dormir-jugar`)

Adjunta `nube-referencia.jpg`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small CLOUD-LIKE extra fluffy kitten, softer and rounder than a long-haired cat, with a big puffy quiff on top of the head like a small cloud, round cloud-puff cheeks, big ears full of fluff, big round eyes, a puffy ruff of fur like a cloud around the neck and a huge round cloud-shaped tail made of soft bulging puffs, seen from the side in three-quarter view, facing right. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; belly, muzzle, the cloud ruff, the quiff and the cloud tail #FFF1D6; color points #A21CAF on the tips of both ears, on the tip of the tail and on all four paws as socks; three or four small cloud-shaped patches #00E5FF on the back and on the side; inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, with no knot, no bell and no hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B; a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same color points and the same cloud patches, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with two rows, each frame the same size, frames evenly spaced:
Row 1 "sleep": 2 frames curled up asleep in a round ball, eyes closed, tail over the nose; frame 2 slightly rounder as it breathes in, with a tiny "z" shape made of pixels (not a letter, a small zigzag) above the head in frame 2 only.
Row 2 "play alone": 4 frames chasing its own tail, spinning in place: frame 1 looking back at the tail, frame 2 pouncing with front paws up, frame 3 seen from the side with the tail in front (never from behind), frame 4 landing happily.
```

#### Nube: cantar, pedir y comer (`gato-cantar-pedir-comer`)

Adjunta `nube-referencia.jpg`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small CLOUD-LIKE extra fluffy kitten, softer and rounder than a long-haired cat, with a big puffy quiff on top of the head like a small cloud, round cloud-puff cheeks, big ears full of fluff, big round eyes, a puffy ruff of fur like a cloud around the neck and a huge round cloud-shaped tail made of soft bulging puffs, seen from the side in three-quarter view, facing right. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; belly, muzzle, the cloud ruff, the quiff and the cloud tail #FFF1D6; color points #A21CAF on the tips of both ears, on the tip of the tail and on all four paws as socks; three or four small cloud-shaped patches #00E5FF on the back and on the side; inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, with no knot, no bell and no hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B; a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same color points and the same cloud patches, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with three rows, each frame the same size, frames evenly spaced:
Row 1 "sing": 2 frames sitting tall with head tilted up and eyes closed happily, mouth open in a little round "meow"; frame 2 head tilted the other way. Two tiny pixel music notes float near the mouth.
Row 2 "ask": 2 frames sitting at the front, ears slightly down, big shiny pleading eyes, one front paw raised, mouth open in a small "mew"; frame 2 paw lower. Cute and gentle, never sad or crying tears.
Row 3 "eat": 3 frames eating from an invisible bowl on the ground: frame 1 head lowered, frame 2 head lowest with cheeks puffed, frame 3 head up licking its lips with a tiny pink tongue.
```

#### Nube: mimos, baño y sacudirse (`gato-mimos-bano-sacudirse`)

Adjunta `nube-referencia.jpg`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small CLOUD-LIKE extra fluffy kitten, softer and rounder than a long-haired cat, with a big puffy quiff on top of the head like a small cloud, round cloud-puff cheeks, big ears full of fluff, big round eyes, a puffy ruff of fur like a cloud around the neck and a huge round cloud-shaped tail made of soft bulging puffs, seen from the side in three-quarter view, facing right. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; belly, muzzle, the cloud ruff, the quiff and the cloud tail #FFF1D6; color points #A21CAF on the tips of both ears, on the tip of the tail and on all four paws as socks; three or four small cloud-shaped patches #00E5FF on the back and on the side; inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, with no knot, no bell and no hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B; a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same color points and the same cloud patches, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with three rows, each frame the same size, frames evenly spaced:
Row 1 "purr": 2 frames sitting with eyes closed in bliss, leaning its head into an invisible hand, tiny pink blush on the cheeks; frame 2 leaning a bit more, with two small pixel hearts above the head.
Row 2 "bath": 2 frames sitting covered in fluffy white and light-cyan soap foam bubbles (foam colors #FFFFFF and #BFEFFF only) on the back and head, eyes squeezed shut, smiling; frame 2 with the bubbles in different places.
Row 3 "shake": 3 frames shaking off water like a wet kitten: frame 1 starting to twist, frame 2 full shake with the fur puffed out and small water drops flying, frame 3 back to normal looking proud.
```

#### Nube: pelota y «ahora no» (`gato-pelota-ahora-no`)

Adjunta `nube-referencia.jpg`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small CLOUD-LIKE extra fluffy kitten, softer and rounder than a long-haired cat, with a big puffy quiff on top of the head like a small cloud, round cloud-puff cheeks, big ears full of fluff, big round eyes, a puffy ruff of fur like a cloud around the neck and a huge round cloud-shaped tail made of soft bulging puffs, seen from the side in three-quarter view, facing right. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; belly, muzzle, the cloud ruff, the quiff and the cloud tail #FFF1D6; color points #A21CAF on the tips of both ears, on the tip of the tail and on all four paws as socks; three or four small cloud-shaped patches #00E5FF on the back and on the side; inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, with no knot, no bell and no hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B; a small bow on top of the head between the ears #FFD700. Keep the same proportions, the same color points and the same cloud patches, the same spots and the same bow in every frame, and the paws on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between frames, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
Match the kitten in the attached image exactly. A sprite sheet with two rows, each frame the same size, frames evenly spaced:
Row 1 "catch the ball": 4 frames: frame 1 running fast to the right, body stretched; frame 2 crouching low, ready to pounce, tail up; frame 3 leaping up with front paws reaching forward; frame 4 landing, sitting proudly with its front paws together as if holding something. Do not draw any ball.
Row 2 "not now": 2 frames sitting, politely turning the head away with eyes closed and nose up, as if saying "no, thank you"; frame 2 head turned further, one ear flicked. Friendly and calm, not angry.
```

#### Nube: arropado (`gato-arropado`)

Adjunta `nube-referencia.jpg` y `casa-mantita-v1.webp`. Formato horizontal 16:9.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. The same kitten as in the first attached image, a small CLOUD-LIKE extra fluffy kitten, softer and rounder than a long-haired cat, with a big puffy quiff on top of the head like a small cloud, round cloud-puff cheeks, big ears full of fluff, big round eyes, a puffy ruff of fur like a cloud around the neck and a huge round cloud-shaped tail made of soft bulging puffs, same size and same proportions, tucked in for the night under the same small blanket as in the second attached image. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; muzzle, the cloud ruff, the quiff and the cloud tail #FFF1D6; inner ears and nose #F9A8D4; a small bow on top of the head between the ears #FFD700; no violet anywhere on the kitten, the ear tips and the tail tip in plain fur. Paint the blanket ONLY with a solid bright violet (#B000FF), darker violet folds (#6A00A8) and a thin white stitched border with a few tiny white stars. A sprite sheet with exactly two frames side by side, each the same size, evenly spaced, the kitten lying on the floor on its side seen from the front in three-quarter view, facing right: the kitten's whole head is outside the blanket, resting sideways on its two little front paws like on a pillow, eyes peacefully closed as thin curved lines, a tiny content smile; the blanket covers the kitten's body from the neck down to the back paws, draped softly over the body with a wavy hem touching the floor; only the tip of the fluffy tail peeks out from under the blanket at the back, on the left. Frame 1: breathing in, the blanket slightly higher. Frame 2: breathing out, the blanket slightly lower, a tiny "z" floating above the head. Both frames with the head, the paws and the blanket in the same place, resting on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between both frames, generous empty space between them, no floor, no pillow, no cast shadow, no text, no letters, no numbers, no watermark.
```

#### Nube: gatito grande del vestidor (`gato-vestidor`)

Adjunta `nube-referencia.jpg` y `gato-casa-vestidor-v1.webp`. Formato horizontal 16:9.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Everything original, simple and friendly, nothing copied from any game. The same kitten as in the first attached image, a small CLOUD-LIKE extra fluffy kitten with a big puffy quiff on top of the head like a small cloud, round cloud-puff cheeks, big ears full of fluff, big round eyes, a puffy cloud ruff around the neck and a huge round cloud-shaped tail, drawn bigger, in exactly the same pose and size as the kitten in the second attached image: sitting upright and looking straight at the viewer, seen fully from the front, ears up, front paws together, tail curled around the paws. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; belly, muzzle, the cloud ruff, the quiff and the cloud tail #FFF1D6; color points #A21CAF on the tips of both ears, on the tip of the tail and on all four paws as socks; three or four small cloud-shaped patches #00E5FF on the back and on the side; inner ears and nose #F9A8D4; eyes #1D4ED8 with a white highlight; a thin plain collar band around the neck #2563EB with a shadow #1E3A8A, with no knot, no bell and no hanging cloth; a small bow on top of the head between the ears #FFD700. A sprite sheet with exactly two frames side by side, each the same size, evenly spaced: Frame 1 "still": calm, big open eyes, small smile. Frame 2 "happy": eyes closed as happy upward curves, a bigger open smile, cheeks a little puffed, the same pose. Both frames with the head, the body and the paws in exactly the same place, resting on the same invisible baseline, with empty space above the head for a hat. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between items, no floor, no cast shadow, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```
