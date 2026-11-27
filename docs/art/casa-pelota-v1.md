# Casa de los gatitos: jugar con la pelota

Dossier del arte de la pelota. Mapa: [La pelota de la casa, a la vista](https://github.com/Mocheto/super-noa/issues/454); generar en [Generar el arte de jugar con la pelota](https://github.com/Mocheto/super-noa/issues/458) y montar en [Montar el arte de jugar con la pelota](https://github.com/Mocheto/super-noa/issues/459). Mismo estilo y colores clave que el [gato base](casa-gato-base-v1.md) y los [modelos](casa-modelos-v1.md).

## Estado

- **Pendiente de generar** las nueve láminas.
- Mientras tanto el juego usa una pelota rayada dibujada en `src/game/casa.css` (SVG) y las poses de hoy: `andar` para correr y los cuadros de `pelota` para agazaparse, saltar y sujetar (`poseDeJuego` en `src/game/casaPelota.ts`).

## Cómo funciona en el juego

- La pelota cae, bota, rueda girando (el juego la gira por código, así que va **de frente y sin sombra**) y tiene su sombra por código.
- Un gatito la mira, galopa hacia ella, se agazapa, salta, la sujeta y la empuja. **La pelota no se dibuja con el gatito:** el juego la coloca entre sus patas.
- Las poses nuevas irán en una hoja aparte por modelo (`sprites/gato-casa-pelota-<modelo>-v1.webp`), sin tocar la de trece filas.

## Qué hace falta

| # | Lámina | Adjuntar | Original |
|---|---|---|---|
| 1 | Pelota | `casa-objetos-v1.webp` | `pelota.png` |
| 2 | Atigrado: carrera | `public/assets/sprites/gato-casa-v1.webp` | `atigrado-carrera.png` |
| 3 | Atigrado: juego | `public/assets/sprites/gato-casa-v1.webp` | `atigrado-juego.png` |
| 4 | Esmoquin: carrera | `public/assets/sprites/gato-casa-esmoquin-v1.webp` | `esmoquin-carrera.png` |
| 5 | Esmoquin: juego | `public/assets/sprites/gato-casa-esmoquin-v1.webp` | `esmoquin-juego.png` |
| 6 | Melena: carrera | `public/assets/sprites/gato-casa-melena-v1.webp` | `melena-carrera.png` |
| 7 | Melena: juego | `public/assets/sprites/gato-casa-melena-v1.webp` | `melena-juego.png` |
| 8 | Nube: carrera | `public/assets/sprites/gato-casa-nube-v1.webp` | `nube-carrera.png` |
| 9 | Nube: juego | `public/assets/sprites/gato-casa-nube-v1.webp` | `nube-juego.png` |

## Cómo trabajar

1. Cada prompt va completo, con el estilo y los colores dentro: copia solo ese bloque y adjunta lo que diga.
2. Todo va sobre **verde plano `#00FF00`**. No pidas rejillas ni medidas: el script de recorte separa cada dibujo, iguala la escala, alinea los pies y monta la hoja.
3. De la hoja adjunta interesa **el gatito sentado**, para tamaño, proporciones y trazo; no que copie su disposición.
4. Si salen más dibujos de la cuenta, no importa: el script elige. Si algo no sale tras tres intentos, cambia de modelo.
5. Guarda las originales fuera del repositorio, en `../super-noa-arte-original/casa-pelota-v1/`, con los nombres de la tabla.

## 1. Pelota

Adjunta `public/assets/sprites/casa-objetos-v1.webp`. Formato cuadrado.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A single toy ball for a kitten, seen straight from the front, perfectly round, in the same drawing style and outline thickness as the objects in the attached image. Bright red ball with one wide curved cream band and one wide curved blue band across it, and one chunky yellow five-pointed star, placed off-center so the rotation of the ball is clearly visible. One small white highlight near the top left. Only the ball, large and centered, filling most of the image. Plain flat solid pure green background (#00FF00), no floor, no cast shadow, no bright green anywhere in the ball, no text, no letters, no numbers, no watermark.
```

## 2. Atigrado: carrera

Adjunta `public/assets/sprites/gato-casa-v1.webp`. Formato horizontal 16:9. Cuatro poses de galope, en una fila.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small short-haired kitten with a big round head, big round eyes and a short fluffy tail. Match the kitten in the attached image exactly (same size, proportions, face and drawing style). Colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C, tabby stripes #7C2D12 (three stripes on the back, two on the tail, a small M on the forehead), belly and muzzle #FFF1D6, inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight, a soft neckerchief tied at the neck #2563EB with shadow #1E3A8A, two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep exactly the same proportions, markings, mud spots and bow in every drawing, and use ONLY these exact flat colors. Draw exactly four separate drawings of the SAME kitten in one horizontal row, all at the same size, side view facing right, a playful gallop chasing something low on the ground, eyes looking forward and slightly down: 1. gathering: back arched, all four paws close together under the body; 2. pushing off with the back legs, front paws lifting; 3. fully stretched in mid-air, front paws far forward and back paws far back; 4. landing on the front paws, back legs swinging forward. Plain flat solid pure green background (#00FF00) behind and between all elements, very generous empty space between drawings so none of them touch, no ball, no toy, no floor, no cast shadow, no motion lines, no text, no letters, no numbers, no labels, no grid lines, no watermark.
```

## 3. Atigrado: juego

Adjunta `public/assets/sprites/gato-casa-v1.webp`. Formato horizontal 16:9. Cuatro poses de juego, en una fila: dos zarpazos y dos abrazos tumbado.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A small short-haired kitten with a big round head, big round eyes and a short fluffy tail. Match the kitten in the attached image exactly (same size, proportions, face and drawing style). Colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C, tabby stripes #7C2D12 (three stripes on the back, two on the tail, a small M on the forehead), belly and muzzle #FFF1D6, inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight, a soft neckerchief tied at the neck #2563EB with shadow #1E3A8A, two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep exactly the same proportions, markings, mud spots and bow in every drawing, and use ONLY these exact flat colors. Draw exactly four separate drawings of the SAME kitten in one horizontal row, all at the same size, side three-quarter view facing right, playing with an invisible ball the size of its own head (do NOT draw the ball): 1. sitting low, one front paw raised high, ready to bat, eyes on a spot on the ground just ahead; 2. the same, with the paw swung down and forward after batting, happy open mouth; 3. rolled onto its back, head to the left, all four paws up in the air curved around an empty round space above its belly, eyes open and delighted; 4. the same lying on its back, eyes closed in a happy laugh, back paws kicking into the empty round space. The empty space between the paws must stay pure green. Plain flat solid pure green background (#00FF00) behind and between all elements, very generous empty space between drawings so none of them touch, no ball, no toy, no floor, no cast shadow, no motion lines, no text, no letters, no numbers, no labels, no grid lines, no watermark.
```

## 4. Esmoquin: carrera

Adjunta `public/assets/sprites/gato-casa-esmoquin-v1.webp`. Formato horizontal 16:9. Cuatro poses de galope, en una fila.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A short-haired TUXEDO kitten with a round head, upright ears, big round eyes and a thin tail. Match the kitten in the attached image exactly (same size, proportions, face and drawing style). Colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; tuxedo areas #FFF1D6 (an inverted V on the face from the forehead down around the muzzle, the whole chest and belly, all four paws as white socks, the tip of the tail); thin stripes #7C2D12 (three short stripes on the back and three rings on the tail); inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight; a thin plain collar band #2563EB with shadow #1E3A8A, with no knot, bell or hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep exactly the same proportions, markings, mud spots and bow in every drawing, and use ONLY these exact flat colors. Draw exactly four separate drawings of the SAME kitten in one horizontal row, all at the same size, side view facing right, a playful gallop chasing something low on the ground, eyes looking forward and slightly down: 1. gathering: back arched, all four paws close together under the body; 2. pushing off with the back legs, front paws lifting; 3. fully stretched in mid-air, front paws far forward and back paws far back; 4. landing on the front paws, back legs swinging forward. Plain flat solid pure green background (#00FF00) behind and between all elements, very generous empty space between drawings so none of them touch, no ball, no toy, no floor, no cast shadow, no motion lines, no text, no letters, no numbers, no labels, no grid lines, no watermark.
```

## 5. Esmoquin: juego

Adjunta `public/assets/sprites/gato-casa-esmoquin-v1.webp`. Formato horizontal 16:9. Cuatro poses de juego, en una fila: dos zarpazos y dos abrazos tumbado.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A short-haired TUXEDO kitten with a round head, upright ears, big round eyes and a thin tail. Match the kitten in the attached image exactly (same size, proportions, face and drawing style). Colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; tuxedo areas #FFF1D6 (an inverted V on the face from the forehead down around the muzzle, the whole chest and belly, all four paws as white socks, the tip of the tail); thin stripes #7C2D12 (three short stripes on the back and three rings on the tail); inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight; a thin plain collar band #2563EB with shadow #1E3A8A, with no knot, bell or hanging cloth; two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep exactly the same proportions, markings, mud spots and bow in every drawing, and use ONLY these exact flat colors. Draw exactly four separate drawings of the SAME kitten in one horizontal row, all at the same size, side three-quarter view facing right, playing with an invisible ball the size of its own head (do NOT draw the ball): 1. sitting low, one front paw raised high, ready to bat, eyes on a spot on the ground just ahead; 2. the same, with the paw swung down and forward after batting, happy open mouth; 3. rolled onto its back, head to the left, all four paws up in the air curved around an empty round space above its belly, eyes open and delighted; 4. the same lying on its back, eyes closed in a happy laugh, back paws kicking into the empty round space. The empty space between the paws must stay pure green. Plain flat solid pure green background (#00FF00) behind and between all elements, very generous empty space between drawings so none of them touch, no ball, no toy, no floor, no cast shadow, no motion lines, no text, no letters, no numbers, no labels, no grid lines, no watermark.
```

## 6. Melena: carrera

Adjunta `public/assets/sprites/gato-casa-melena-v1.webp`. Formato horizontal 16:9. Cuatro poses de galope, en una fila.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A LONG-HAIRED fluffy kitten with cheek tufts, a soft mane around neck and chest, a small tuft on the forehead, big round eyes and a big plumed tail. Match the kitten in the attached image exactly (same size, proportions, face and drawing style). Colors: fur #FF8A00, light fur #FFC266 (only small accents, never the whole body), fur shadow #C2410C; belly, muzzle and front of the mane #FFF1D6; color points #A21CAF on the tips of both ears, the forehead tuft, the tip of the tail and all four paws as socks; three short soft stripes #7C2D12 on the back; inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight; a thin plain collar band #2563EB with shadow #1E3A8A, half hidden in the mane; two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep exactly the same proportions, markings, mud spots and bow in every drawing, and use ONLY these exact flat colors. Draw exactly four separate drawings of the SAME kitten in one horizontal row, all at the same size, side view facing right, a playful gallop chasing something low on the ground, eyes looking forward and slightly down: 1. gathering: back arched, all four paws close together under the body; 2. pushing off with the back legs, front paws lifting; 3. fully stretched in mid-air, front paws far forward and back paws far back; 4. landing on the front paws, back legs swinging forward. Plain flat solid pure green background (#00FF00) behind and between all elements, very generous empty space between drawings so none of them touch, no ball, no toy, no floor, no cast shadow, no motion lines, no text, no letters, no numbers, no labels, no grid lines, no watermark.
```

## 7. Melena: juego

Adjunta `public/assets/sprites/gato-casa-melena-v1.webp`. Formato horizontal 16:9. Cuatro poses de juego, en una fila: dos zarpazos y dos abrazos tumbado.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A LONG-HAIRED fluffy kitten with cheek tufts, a soft mane around neck and chest, a small tuft on the forehead, big round eyes and a big plumed tail. Match the kitten in the attached image exactly (same size, proportions, face and drawing style). Colors: fur #FF8A00, light fur #FFC266 (only small accents, never the whole body), fur shadow #C2410C; belly, muzzle and front of the mane #FFF1D6; color points #A21CAF on the tips of both ears, the forehead tuft, the tip of the tail and all four paws as socks; three short soft stripes #7C2D12 on the back; inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight; a thin plain collar band #2563EB with shadow #1E3A8A, half hidden in the mane; two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep exactly the same proportions, markings, mud spots and bow in every drawing, and use ONLY these exact flat colors. Draw exactly four separate drawings of the SAME kitten in one horizontal row, all at the same size, side three-quarter view facing right, playing with an invisible ball the size of its own head (do NOT draw the ball): 1. sitting low, one front paw raised high, ready to bat, eyes on a spot on the ground just ahead; 2. the same, with the paw swung down and forward after batting, happy open mouth; 3. rolled onto its back, head to the left, all four paws up in the air curved around an empty round space above its belly, eyes open and delighted; 4. the same lying on its back, eyes closed in a happy laugh, back paws kicking into the empty round space. The empty space between the paws must stay pure green. Plain flat solid pure green background (#00FF00) behind and between all elements, very generous empty space between drawings so none of them touch, no ball, no toy, no floor, no cast shadow, no motion lines, no text, no letters, no numbers, no labels, no grid lines, no watermark.
```

## 8. Nube: carrera

Adjunta `public/assets/sprites/gato-casa-nube-v1.webp`. Formato horizontal 16:9. Cuatro poses de galope, en una fila.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A CLOUD-LIKE extra fluffy kitten with a big puffy quiff, round cloud-puff cheeks, a puffy ruff and a huge round cloud-shaped tail. Match the kitten in the attached image exactly (same size, proportions, face and drawing style). Colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; belly, muzzle and ruff #FFF1D6; color points #A21CAF on the tips of both ears, the quiff, the tip of the tail and all four paws as socks; three or four small cloud-shaped patches #00E5FF on the back and side; inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight; a thin plain collar band #2563EB with shadow #1E3A8A, half hidden in the ruff; two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep exactly the same proportions, markings, mud spots and bow in every drawing, and use ONLY these exact flat colors. Draw exactly four separate drawings of the SAME kitten in one horizontal row, all at the same size, side view facing right, a playful gallop chasing something low on the ground, eyes looking forward and slightly down: 1. gathering: back arched, all four paws close together under the body; 2. pushing off with the back legs, front paws lifting; 3. fully stretched in mid-air, front paws far forward and back paws far back; 4. landing on the front paws, back legs swinging forward. Plain flat solid pure green background (#00FF00) behind and between all elements, very generous empty space between drawings so none of them touch, no ball, no toy, no floor, no cast shadow, no motion lines, no text, no letters, no numbers, no labels, no grid lines, no watermark.
```

## 9. Nube: juego

Adjunta `public/assets/sprites/gato-casa-nube-v1.webp`. Formato horizontal 16:9. Cuatro poses de juego, en una fila: dos zarpazos y dos abrazos tumbado.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A CLOUD-LIKE extra fluffy kitten with a big puffy quiff, round cloud-puff cheeks, a puffy ruff and a huge round cloud-shaped tail. Match the kitten in the attached image exactly (same size, proportions, face and drawing style). Colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C; belly, muzzle and ruff #FFF1D6; color points #A21CAF on the tips of both ears, the quiff, the tip of the tail and all four paws as socks; three or four small cloud-shaped patches #00E5FF on the back and side; inner ears and nose #F9A8D4, eyes #1D4ED8 with a white highlight; a thin plain collar band #2563EB with shadow #1E3A8A, half hidden in the ruff; two small round mud spots on one front leg and on the side of the belly #8B5A2B, a small bow on top of the head between the ears #FFD700. Keep exactly the same proportions, markings, mud spots and bow in every drawing, and use ONLY these exact flat colors. Draw exactly four separate drawings of the SAME kitten in one horizontal row, all at the same size, side three-quarter view facing right, playing with an invisible ball the size of its own head (do NOT draw the ball): 1. sitting low, one front paw raised high, ready to bat, eyes on a spot on the ground just ahead; 2. the same, with the paw swung down and forward after batting, happy open mouth; 3. rolled onto its back, head to the left, all four paws up in the air curved around an empty round space above its belly, eyes open and delighted; 4. the same lying on its back, eyes closed in a happy laugh, back paws kicking into the empty round space. The empty space between the paws must stay pure green. Plain flat solid pure green background (#00FF00) behind and between all elements, very generous empty space between drawings so none of them touch, no ball, no toy, no floor, no cast shadow, no motion lines, no text, no letters, no numbers, no labels, no grid lines, no watermark.
```

## Montaje

- Script nuevo (`prototypes/tools/casa-pelota-recorte.py`) a partir de `casa-modelo-recorte.py`: recorta, ajusta a los colores clave, alinea los pies y monta una fila por animación en cuadros de 160 × 160; la pelota, a 64 × 64 (`sprites/casa-pelota-v1.webp`).
- Anclas de accesorios y complementos para las poses nuevas con `casa-gato-anclas.py` (de espaldas en el suelo, quizá solo sombrero y gafas, o ninguno).
- Fases: `corre` usa el galope; `sujeta`, el abrazo tumbado; `empuja`, el zarpazo.
