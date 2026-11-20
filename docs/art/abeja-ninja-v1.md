# La abeja ninja: arte final

Dossier del arte de **La abeja ninja**, el duelo rítmico de la Reina Melisa. El arte se genera a mano con los prompts de este documento, sin servicios de pago integrados en la sesión. Sustituye el arte provisional (`noa-abeja-v0.png`, `tarro-miel-v0.png` y las flores y la mariquita dibujadas en SVG) sin tocar la lógica. Ticket: [Producir el arte y los sonidos finales de La abeja ninja](https://github.com/Mocheto/super-noa/issues/34).

## Estado

- **Hecho:** las cuatro láminas están generadas, recortadas a transparente y exportadas como WebP en `public/assets/sprites/` (ver [Archivos finales](#archivos-finales)). Los samples del «jardín ninja» están en `public/assets/audio/abeja-ninja/`.
- **Se reutilizan:**
  - la Reina Melisa, con sus poses de `public/assets/atlases/giant-valley-characters-v1.webp`;
  - el fondo del valle gigante, `public/assets/worlds/world-11.webp`.
- El arte provisional (`noa-abeja-v0.png`, `tarro-miel-v0.png`) se conserva solo para los prototipos.

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
| Noa-abeja, 4 poses | `noa-abeja-poses-base.png` | `public/assets/sprites/noa-rps-0.webp` y `public/assets/atlases/giant-valley-characters-v1.webp` (traje de abeja) | `sprites/noa-abeja-v1.webp` | 216 × 207 por pose |
| Flores enteras, partidas y pétalos | `flores-mariquita-base.png` (abajo) | `public/assets/worlds/world-11.webp` (flores del valle) | `sprites/flores-abeja-v1.webp` | flor 64 × 64, pétalo 16 × 20 |
| Mariquita, 2 poses | `flores-mariquita-base.png` (arriba a la derecha) | `public/assets/worlds/world-11.webp` (la mariquita del fondo) | `sprites/mariquita-v1.webp` | 64 × 64 por pose |
| Tarro de miel, 5 niveles | `tarro-niveles-base.png` | `public/assets/atlases/giant-valley-characters-v1.webp` (miel y dorados) | `sprites/tarro-miel-v1.webp` | 104 × 120 por nivel |

### 1. Noa-abeja

Adjunta `noa-abeja-poses-base.png` como imagen base de las poses, `noa-rps-0.webp` como referencia del personaje y `giant-valley-characters-v1.webp` como referencia del traje de abeja.

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

Adjunta `tarro-niveles-base.png` y `giant-valley-characters-v1.webp` como referencia de la miel y los dorados.

Prompt (ESTILO + este texto + FONDO, formato 21:9 o 16:9):

```text
A pixel-art sprite sheet with exactly five versions of the same small round glass honey jar, in one horizontal row, evenly spaced, same size and same position in every cell: clear pale-blue glass with a white highlight, a red-and-cream gingham cloth lid tied with a string, a small cream label with a tiny bee drawn on it, and a thin golden ribbon tied around the jar at 40% of its height from the bottom (the "goal line").
The only difference between the five versions is the golden honey level inside: 1 empty, 2 a thin layer at the bottom, 3 exactly up to the golden ribbon, 4 three quarters full, 5 full to the top with a little honey drip on the rim.
```

## Archivos finales

`python3 prototypes/tools/abeja-ninja-recorte.py CARPETA_CON_LAS_LAMINAS` vuelve a generar todo desde las láminas originales (fondo verde, cualquier extensión). Quita el verde conectado con el borde, separa y alinea las piezas y calcula la punta del aguijón. El script no guarda las láminas originales; consérvalas fuera del repositorio.

| Archivo | Contenido | Medidas del archivo | En pantalla |
|---|---|---|---|
| `sprites/noa-abeja-v1.webp` | Tira de 4 celdas mirando a la derecha: espera, alza, corta, celebra. El juego la refleja para mirar a Melisa. | 4 × 206 × 372; punta del aguijón en «corta» en (199,6; 216,1) | 0,6 × (124 × 223) |
| `sprites/flores-abeja-v1.webp` | Rejilla 4 × 4 de 128 × 128. Columnas: rosa, amarillo, azul, lila. Filas: entera, mitad izquierda, mitad derecha, pétalo. Las mitades juntas forman la flor. | 512 × 512 | 64 × 64 por celda |
| `sprites/mariquita-v1.webp` | Tira de 2 celdas mirando a la derecha: volando y saludando. | 2 × 146 × 125 | 73 × 62 |
| `sprites/tarro-miel-v1.webp` | Tira de 5 niveles; la cinta dorada pintada es la raya del mínimo. De la lámina se usó la fila de abajo, la completa. | 5 × 188 × 240 | 94 × 120 |

## Sonido

No hace falta arte sonoro manual. `python3 prototypes/tools/abeja-ninja-samples.py` sintetiza por código doce samples originales y los guarda como WAV mono de 16 bits a 32 kHz en `public/assets/audio/abeja-ninja/`:
- instrumentos: `koto-re5`, `flauta-bambu-la5`, `taiko`, `bajo-re3` y `zumbido` (los afinados se transportan cambiando la velocidad);
- efectos: `zum`, `zum-zum`, `bzz-tin`, `shing`, `toque-sordo`, `plof` y `fanfarria`.

El juego los carga al abrir el duelo. Si no cargan, suenan los osciladores de respaldo de la partitura.

Todo es original: nada se copia de Rhythm Heaven ni de otros juegos comerciales.
