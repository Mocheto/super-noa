# La fiesta de los gatitos: arte y sonido finales

Dossier para el ticket [Producir el arte y los sonidos finales de La fiesta de los gatitos](https://github.com/Mocheto/super-noa/issues/24). El arte se genera a mano con los prompts de este documento (sin servicios de pago integrados en la sesión); los sonidos los sintetiza el repositorio.

## Estado

- **Arte: entregado e integrado.** Las nueve piezas se generaron con estos prompts y se recortaron con `prototypes/tools/gatitos-recorte.py`. Los archivos finales son WebP con transparencia real (los `.png` depositados eran JPEG con fondo verde): `noa-lenadora-v1`, `gatito-gris-empuja-v1`, `gatito-naranja-empuja-v1`, `tronco-pequeno-v1`, `tronco-mediano-v1`, `cinta-v1`, `tajo-v1`, `lena-v1`, `monton-lena-v1` y `hoguera-v1` en `public/assets/sprites/`, y `claro-fiesta-v1.webp` en `public/assets/worlds/`. Las medidas que usa el juego están en `src/game/catPartyArt.ts`.
- **Sonido: integrado.** La persona usuaria eligió los instrumentos nuevos; el juego los toca con respaldo a los osciladores (ver más abajo).

Las piezas sustituyen a las provisionales sin cambiar la lógica del minijuego (`src/game/catParty.ts` y `CatPartyGame.tsx`). El estilo y la lista de piezas salen de [Redibujar el aspecto: gata leñadora, troncos, cinta y gatitos](https://github.com/Mocheto/super-noa/issues/20).

## Cómo trabajar

1. Genera cada pieza con su prompt. Adjunta la imagen de referencia que se indica (están en el repositorio) para mantener a los personajes.
2. Las piezas sueltas van sobre **fondo verde plano `#00FF00`**: yo lo recorto a transparente, alineo las poses por los pies y las coloco en `public/assets/`. Basta con que me pases las imágenes tal cual salgan.
3. Si un modelo estropea una lámina con varias piezas, genera cada fila o cada pieza por separado con el mismo prompt, quitando de la lista lo que no toque.
4. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir con el prompt.

## Bloques comunes

Pégalos al principio (estilo) y al final (fondo) de cada prompt de personaje o de objeto. Los dos fondos de escenario no llevan el bloque de fondo verde.

**ESTILO**

> Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), warm cel shading with two or three tones per color, saturated friendly colors, big expressive eyes, slightly oversized heads. Crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes.

**FONDO**

> Plain flat solid pure green background (#00FF00) behind and between all elements, no floor, no cast shadow, no green anywhere in the subject. No text, no labels, no watermark.

## Piezas

| Pieza | Referencia que adjuntar | Archivo final | Tamaño en escena (960 × 540) |
|---|---|---|---|
| Noa leñadora, 4 poses | `public/assets/sprites/noa-cat-yarn-v2.webp` | `sprites/noa-lenadora-v1.webp` | 170 × 190 por pose |
| Gatito gris, 3 poses | `public/assets/sprites/world-cat-2-v1.webp` | `sprites/gatito-gris-empuja-v1.webp` | 110 × 110 por pose |
| Gatito naranja, 3 poses | `public/assets/sprites/world-cat-4-v1.webp` | `sprites/gatito-naranja-empuja-v1.webp` | 110 × 110 por pose |
| Troncos, mitades y grieta | `public/assets/sprites/gatitos-tronco.png` | `sprites/troncos-v1.png` | pequeño 118 × 33, mediano 200 × 56 |
| Cinta de troncos | ninguna | `sprites/cinta-v1.webp` | 600 × 34, más rodillos |
| Tajo | ninguna | `sprites/tajo-v1.webp` | 110 × 70 |
| Montón de leña | `public/assets/sprites/gatitos-tronco.png` | `sprites/lena-v1.webp` | leño 74 × 21; montón 220 × 120 |
| Hoguera, 4 imágenes | ninguna | `sprites/hoguera-v1.webp` | 120 × 110 |
| Fondo del claro | ninguna | `worlds/claro-fiesta-v1.webp` | 960 × 540 (genera a 1920 × 1080) |

### 1. Noa leñadora

Prompt (ESTILO + este texto + FONDO, formato 16:9):

```text
A pixel-art sprite sheet with exactly four poses of the same little girl dressed as a cat, in one horizontal row, evenly spaced, each pose the same size, full body, feet on the same baseline, all facing right. Use the attached image as the character reference: keep her face, brown wavy hair with a red apple hair clip, lilac cat ears, lilac cat tail, lilac dungarees, white socks and lilac sneakers exactly. In every pose she holds a cartoon woodcutter's axe with a long light-wood handle and a big, friendly rounded silver blade (chunky and toy-like, not sharp-looking).
Pose 1 "ready": standing, the axe resting on her shoulder, relaxed smile.
Pose 2 "raise": leaning slightly back, the axe lifted high over her head with both hands, determined happy face.
Pose 3 "chop": leaning forward, the axe swung down in front of her at waist height with small white motion lines, mouth open cheerfully.
Pose 4 "celebrate": jumping with joy, one arm raised holding the axe high, eyes closed in a big smile, a few small gold sparkles.
```

El hacha va incluida en cada pose: el juego dejará de superponer el hacha dibujada con código.

### 2. Gatito gris empujador

Prompt (ESTILO + este texto + FONDO, formato 16:9):

```text
A pixel-art sprite sheet with exactly three poses of the same fluffy grey kitten with big teal eyes and a purple collar with a small crystal charm, in one horizontal row, evenly spaced, each pose the same size, same baseline, all facing left. Use the attached image as the character reference: keep its fur, eyes, collar and proportions exactly.
Pose 1 "ready": sitting upright with its front paws together, attentive and cheerful.
Pose 2 "push": leaning forward on both front paws, pushing something heavy to the left, ears back, effort face, tail raised.
Pose 3 "meow": sitting upright, head slightly raised, mouth open in a cute meow, a tiny gold music note beside the mouth.
```

### 3. Gatito naranja empujador

Prompt (ESTILO + este texto + FONDO, formato 16:9):

```text
A pixel-art sprite sheet with exactly three poses of the same playful orange tabby kitten wearing a little acorn hat and a brown scarf with an acorn charm, in one horizontal row, evenly spaced, each pose the same size, same baseline, all facing left. Use the attached image as the character reference: keep its fur stripes, eyes, hat, scarf and proportions exactly.
Pose 1 "ready": crouching with both front paws on the ground, tail curled up, attentive and cheerful.
Pose 2 "push": stretched forward on both front paws, pushing something heavy to the left, ears back, effort face.
Pose 3 "meow": sitting upright, head slightly raised, mouth open in a cute meow, a tiny gold music note beside the mouth.
```

### 4. Troncos

Prompt (ESTILO + este texto + FONDO, formato 16:9):

```text
A pixel-art sheet of cartoon firewood logs in strict side view, in two rows with generous space between items. Every log has warm brown bark with a few darker grooves, a pale golden round end showing tree rings, and the same bold dark-plum outline, lit from the top left. Use the attached image as the style reference for the bark and the rings.
Row 1, the small log (long and thin, about 3.6 times longer than tall): (1) the whole log with its round end on the left; (2) its left half, bark on the left and a fresh flat pale split face on the right; (3) its right half, a fresh flat pale split face on the left.
Row 2, the medium log (same proportions, about 1.7 times bigger): (1) the whole log with its round end on the left; (2) the same log still in one piece with one bright zigzag crack running vertically across its middle; (3) its left half with a split face on the right; (4) its right half with a split face on the left.
```

Los círculos dorados de los golpes siguen siendo marcas que dibuja el juego: no los incluyas.

### 5. Cinta de troncos

Prompt (ESTILO + este texto + FONDO, 3:1 o lo más ancho posible):

```text
A pixel-art wooden conveyor belt seen in strict side view, long and low, horizontal. A flat wooden top surface made of identical plank slats of exactly the same width, evenly spaced and repeating, with a darker plum outline; under it, a row of small round grey metal rollers with bolts, evenly spaced. Both ends are plain, without caps, so the middle can repeat. Warm brown wood, friendly and toy-like.
```

Pide las tablillas idénticas: yo repito un tramo para llenar los 600 píxeles.

### 6. Tajo

Prompt (ESTILO + este texto + FONDO, cuadrado):

```text
A pixel-art chopping stump, a thick short tree trunk seen from the front and slightly from above, flat cut top showing pale golden tree rings with a few small axe marks, rough dark-brown bark sides with a couple of small roots at the base, a tiny green moss patch. Friendly toy-like look.
```

### 7. Leña y montón

Prompt (ESTILO + este texto + FONDO, formato 16:9):

```text
A pixel-art sheet with two items on the plain background. Left: a single small piece of split firewood in strict side view, long and thin (about 3.5 times longer than tall), bark on one side and a fresh pale split face on the other, warm brown. Right: a neat woodpile of about twelve split logs stacked in three layers, round and split ends facing the viewer, warm brown with golden rings, slightly wider than tall.
```

El juego construye el montón con el leño suelto, que va creciendo hasta 18; el montón completo queda para el final de la canción.

### 8. Hoguera

Prompt (ESTILO + este texto + FONDO, formato 16:9):

```text
A pixel-art campfire animation sheet with exactly four images in one horizontal row, evenly spaced, same size and baseline. A small ring of grey stones around crossed logs. Image 1: unlit, only dark logs and a little black ash. Images 2, 3 and 4: the same campfire lit with three different flame shapes of a flickering fire, orange outer flames, yellow inner flames, a few small floating orange sparks, a warm glow on the nearest stones.
```

### 9. Fondo del claro (sin ESTILO verde)

Prompt (genera a 1920 × 1080; no lleva el bloque de fondo verde):

```text
Use case: illustration-story. Asset type: wide 16:9 background for a side-scrolling 2D game, original forest clearing at dusk prepared for a cats' party. Beautiful hand-painted pixel-art-friendly children's storybook look with bold readable shapes and dark-plum contours: a soft sky from deep violet at the top through pink and orange to golden near the horizon, a big low sun on the right, layers of rounded purple hills and dark green pine trees, strings of small triangular party flags in pink, yellow, blue and green hanging across the top, a few paper lanterns. The lower quarter is a calm grassy clearing with a soft dirt path, empty and uncluttered. Keep the center of the top edge and the whole middle band quiet and low-contrast so game elements stay readable. No characters, no animals, no campfire, no conveyor belt, no stump, no logs, no text, no interface. Fill the entire landscape image.
```

## Sonido

Hechos por código en este repositorio, sin grabaciones ni servicios externos:

- `prototypes/tools/gatitos-samples.py` renderiza diez WAV mono a 32 kHz en `public/assets/audio/gatitos/`: marimba, flauta, pizzicato, cascabeles, madera, hachazo, golpe sordo, plop del ovillo y dos maullidos de gatito. Los instrumentos afinados se guardan en una sola nota base y el juego los transporta cambiando la velocidad de reproducción. También escribe una copia incrustada en `prototypes/assets/gatitos-samples/samples.js` para la página de audición.
- `prototypes/gatitos-samples.html` permite oírlos uno a uno y compararlos con el sonido anterior; funciona abierta como archivo y tiene un pitido de prueba y un medidor de nivel.
- En el juego, cada nota de `musicForEighth` lleva su `sample` (pizzicato en el bajo, madera en los pulsos 2 y 4, cascabeles entre pulsos, flauta al empezar los compases pares, maullidos y plop en los empujes, marimba en la escala final); el golpe de la jugadora toca hachazo y marimba en la nota del acorde, y los fallos, el golpe sordo. Los campos del oscilador quedan como respaldo: suenan mientras se cargan los samples o si falla la carga (`src/game/catPartySamples.ts`). La cuenta de entrada conserva sus pitidos.

## Cómo se recortó

`python3 prototypes/tools/gatitos-recorte.py CARPETA_CON_LAS_LAMINAS` vuelve a generar todo desde las láminas originales (con cualquier extensión). Quita el verde conectado con el borde, conserva el verde de las hojas y el musgo, separa y alinea las poses por los pies, refleja al gatito gris para que mire a la izquierda y repara dos defectos del generador: una banda oscura en el fondo del claro y manchas de polvo en los troncos y la hoguera. El script no guarda las láminas originales; consérvalas fuera del repositorio.

Las mitades de los troncos se muestran a escala 0,6 y se juntan en el tajo; el juego usa el tronco mediano con grieta tras el primer golpe. El montón completo de leña sustituye al montón de leños sueltos al terminar la canción, y la hoguera se enciende con tres llamas que se alternan.
