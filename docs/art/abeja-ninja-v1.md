# La abeja ninja: arte final

Dossier del arte de **La abeja ninja**, el duelo rítmico de la Reina Melisa. El arte se genera a mano con los prompts de este documento, sin servicios de pago integrados en la sesión. Sustituye el arte provisional (`noa-abeja-v0.png`, `tarro-miel-v0.png` y las flores y la mariquita dibujadas en SVG) sin tocar la lógica. Ticket: [Producir el arte y los sonidos finales de La abeja ninja](https://github.com/Mocheto/super-noa/issues/34).

## Estado

- **Pendiente:** la persona usuaria genera las piezas. Después se recortan, se alinean y se colocan en `public/assets/`.
- **Se reutilizan:**
  - la Reina Melisa, con sus poses de `public/assets/atlases/giant-valley-characters-v1.png`;
  - el fondo del valle gigante, `public/assets/worlds/world-11.webp`.
- **Sonido:** no hace falta arte sonoro manual; se sintetiza por código (ver [Sonido](#sonido)).

## Cómo trabajar

1. Genera cada pieza con su prompt. Adjunta las imágenes que se indican:
   - la **imagen base** (en `docs/art/abeja-ninja-base/`) da la forma, la pose y la composición;
   - la **referencia de estilo** (en `public/assets/`) da el personaje y el acabado.
2. Todas las piezas van sobre **fondo verde plano `#00FF00`**. Yo las recorto a transparente, las alineo y las coloco en el juego. Pásamelas tal cual salgan.
3. Si un modelo estropea una lámina con varias poses, genera cada pose por separado con el mismo prompt, quitando de la lista lo que no toque.
4. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir con el prompt.

## Imágenes base

| Archivo | Qué muestra |
|---|---|
| `docs/art/abeja-ninja-base/escena-composicion.png` | La escena del juego (960 × 540): Melisa a la izquierda lanzando flores, Noa-abeja a la derecha con la varita, el tarro abajo a la derecha. Sirve para tamaños y posiciones. |
| `docs/art/abeja-ninja-base/noa-abeja-poses-base.png` | Las cuatro poses provisionales de Noa-abeja, en orden: espera, alza, corta y celebra. |
| `docs/art/abeja-ninja-base/flores-mariquita-base.png` | Arriba: las flores de cuatro colores y la mariquita volando y saludando. Abajo: cada flor partida en dos mitades y los pétalos sueltos. |
| `docs/art/abeja-ninja-base/tarro-niveles-base.png` | Los cinco niveles de llenado del tarro de miel. |

## Bloques comunes

Pega **ESTILO** al principio y **FONDO** al final de cada prompt.

**ESTILO**

> Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), warm cel shading with two or three tones per color, saturated friendly spring-garden colors, big expressive eyes, slightly oversized heads. Crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes.

**FONDO**

> Plain flat solid pure green background (#00FF00) behind and between all elements, no floor, no cast shadow, no bright green anywhere in the subject (use only dark olive green for stems and leaves). No text, no labels, no watermark.

## Piezas

| Pieza | Imagen base | Referencia de estilo | Archivo final | Tamaño en escena (960 × 540) |
|---|---|---|---|---|
| Noa-abeja, 4 poses | `noa-abeja-poses-base.png` | `public/assets/sprites/noa-rps-0.png` y `public/assets/atlases/giant-valley-characters-v1.png` (traje de abeja) | `sprites/noa-abeja-v1.webp` | 216 × 207 por pose |
| Flores enteras, partidas y pétalos | `flores-mariquita-base.png` (abajo) | `public/assets/worlds/world-11.webp` (flores del valle) | `sprites/flores-abeja-v1.webp` | flor 64 × 64, pétalo 16 × 20 |
| Mariquita, 2 poses | `flores-mariquita-base.png` (arriba a la derecha) | `public/assets/worlds/world-11.webp` (la mariquita del fondo) | `sprites/mariquita-v1.webp` | 64 × 64 por pose |
| Tarro de miel, 5 niveles | `tarro-niveles-base.png` | `public/assets/atlases/giant-valley-characters-v1.png` (miel y dorados) | `sprites/tarro-miel-v1.webp` | 104 × 120 por nivel |

### 1. Noa-abeja

Adjunta `noa-abeja-poses-base.png` como imagen base de las poses, `noa-rps-0.png` como referencia del personaje y `giant-valley-characters-v1.png` como referencia del traje de abeja.

Prompt (ESTILO + este texto + FONDO, formato 16:9 o 21:9):

```text
A pixel-art sprite sheet with exactly four poses of the same little girl dressed as a cute ninja bee, in one horizontal row, evenly spaced, each pose the same size, full body, feet on the same baseline, all facing right. Follow the first attached image for the four poses and their order. Use the second attached image as the character reference: keep her face, big brown eyes, brown wavy hair with a red apple hair clip, and her proportions exactly. Her bee costume: a yellow-and-dark-brown striped pinafore dress with two little buttons, a short honey-colored ninja sash tied at the waist with the ends fluttering, two black antennae with round yellow tips on a headband, small translucent pale-blue wings on her back, white socks and honey-yellow sneakers.
In every pose she holds the same "stinger wand" in her right hand: a short wooden stick with a shiny golden cone-shaped stinger at its end; the sharp tip of the golden cone must be clearly visible and pointed, with a tiny white glint on the tip.
Pose 1 "ready": standing, smiling, wand held diagonally in front of her, tip pointing up and to the right.
Pose 2 "raise": wand raised high above her head, ready to strike, cheerful open mouth.
Pose 3 "cut": a quick lunge forward to the right, arm stretched out, wand horizontal with the golden tip pointing straight to the right at chest height, a short white curved swoosh trail behind the tip.
Pose 4 "celebrate": jumping with joy, wand raised high, eyes happy, a few small gold sparkles near the tip.
```

### 2. Flores

Adjunta `flores-mariquita-base.png` (usa las filas de flores enteras y partidas) y `world-11.webp` como referencia de estilo de las flores del valle.

Prompt (ESTILO + este texto + FONDO, formato 16:9):

```text
A pixel-art item sheet in three rows, every item centered in its own equal cell, same scale, all flowers seen from the front:
Row 1: four whole daisy-like flowers with six rounded petals, a big round yellow center and a short dark olive-green stem: pink (#ef79a9), sunny yellow (#f2c230), sky blue (#5aa0dc) and lilac (#b98be0).
Row 2: the same four flowers each cut cleanly in two by a vertical slice through the middle, the left half and the right half drawn side by side with a small gap, slightly tilted apart, the cut edges clean and showing the yellow center; one pair per color, same order as row 1.
Row 3: four single loose petals, one of each color, same order, gently curved, each drawn alone.
```

### 3. Mariquita

Adjunta `flores-mariquita-base.png` (las dos mariquitas de arriba a la derecha) y `world-11.webp`.

Prompt (ESTILO + este texto + FONDO, formato 16:9):

```text
A pixel-art sprite sheet with exactly two poses of the same cute friendly ladybug, in one horizontal row, same size, both seen from the side and flying to the right: round glossy red shell with a black center line and four black spots, small black head with big shiny friendly eyes and a little smile, two thin antennae, two small translucent pale-blue wings fluttering above the shell.
Pose 1 "flying": legs tucked in, wings up, happy.
Pose 2 "hello": same flight pose but waving one tiny front leg towards the viewer, eyes closed in a big smile.
```

### 4. Tarro de miel

Adjunta `tarro-niveles-base.png` y `giant-valley-characters-v1.png` como referencia de la miel y los dorados.

Prompt (ESTILO + este texto + FONDO, formato 21:9 o 16:9):

```text
A pixel-art sprite sheet with exactly five versions of the same small round glass honey jar, in one horizontal row, evenly spaced, same size and same position in every cell: clear pale-blue glass with a white highlight, a red-and-cream gingham cloth lid tied with a string, a small cream label with a tiny bee drawn on it, and a thin golden ribbon tied around the jar at 40% of its height from the bottom (the "goal line").
The only difference between the five versions is the golden honey level inside: 1 empty, 2 a thin layer at the bottom, 3 exactly up to the golden ribbon, 4 three quarters full, 5 full to the top with a little honey drip on the rim.
```

## Sonido

No hace falta arte sonoro manual. Los samples del «jardín ninja» se sintetizan por código en un script de `prototypes/tools/`, como los de los gatitos, y se guardan en `public/assets/audio/abeja-ninja/`:
- instrumentos: koto, flauta de bambú, taiko, bajo y zumbido;
- efectos: «¡zum!», «¡zum-zum!», «¡bzz-tin!», «¡shing!», el toque sordo, el «plof» y la fanfarria.

Todo es original: nada se copia de Rhythm Heaven ni de otros juegos comerciales.
