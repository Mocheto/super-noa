# Casa de los gatitos: el escondite del mueble de la pecera

Dossier del arte final del escondite ([Arte final del escondite del mueble de la pecera](https://github.com/Mocheto/super-noa/issues/437)), que sustituye al provisional por código de [la issue 436](https://github.com/Mocheto/super-noa/issues/436): el interior del mueble, las puertas abiertas y la cola que asoma con las puertas cerradas.

## Estado

- **Generadas, recortadas e integradas** ([issue 437](https://github.com/Mocheto/super-noa/issues/437)). Las originales están en `../super-noa-arte-original/casa-escondite-v1/` (`dentro`, `puerta` y `colas`, en WebP de 2000 × 496).
- El generador añadió dos puertas oscuras a los lados del interior (se recortan), un trozo de mueble a la derecha de la puerta (se recorta), pintó la puerta más ancha que alta (se lleva a su sitio con una transformación de perspectiva) y la cola de la melena con el pelo claro (pasa a pelo, como en sus hojas).

## Qué se genera

| # | Lámina | Adjuntar | Original (nombre) | Se publicará como |
|---|---|---|---|---|
| 1 | Interior del mueble: fondo, botes de comida y red | `mueble.png` | `dentro` | `sprites/casa-escondite-dentro-v1.webp` |
| 2 | Una puerta abierta (la izquierda) | `mueble.png` | `puerta` | `sprites/casa-escondite-puerta-v1.webp` |
| 3 | Las cuatro colas, una por modelo | `cuatro-modelos.png` | `colas` | `sprites/casa-escondite-colas-v1.webp` |

La puerta derecha es la izquierda en espejo: no se genera.

Las dos imágenes para adjuntar están en `../super-noa-arte-original/casa-escondite-v1/`:

- `mueble.png`: el mueble de ahora (`casa-pecera-fondo-v2.webp` sin la pecera), ampliado × 4 sobre verde.
- `cuatro-modelos.png`: atigrado, esmoquin, melena y nube sentados (`gato-casa-referencias-v1.webp`), ampliados × 4 sobre verde.

## Cómo trabajar

1. Copia el prompt entero; ya lleva el estilo dentro.
2. Adjunta lo que dice la tabla.
3. Fondo **verde plano `#00FF00`**. Formato: lámina 1, el más ancho que haya (21:9); lámina 2, vertical (3:4); lámina 3, horizontal (16:9).
4. Genera varias de cada una y comprueba antes de guardar:
   - **1:** un rectángulo mucho más ancho que alto, sin marco ni puertas, con el centro despejado;
   - **2:** la puerta se ve abierta en perspectiva, con el borde de las bisagras a la **derecha** y más corto que el otro, y del mismo color de madera que el mueble;
   - **3:** cuatro colas separadas, en el orden de los gatos, todas cortadas rectas por arriba y colgando hacia abajo, sin gato.
5. Si algo no sale tras tres intentos, cambia de modelo antes de insistir.
6. Guarda las originales en `../super-noa-arte-original/casa-escondite-v1/` con el nombre de la tabla.

## 1. Interior del mueble

El hueco mide 320 × 84 px del dibujo (casi cuatro veces más ancho que alto). Va aparte de las puertas porque **no cambia de color** al decorar.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Everything original, simple and friendly. Draw ONLY the inside of the cupboard of the attached wooden cabinet, as seen from the front when both doors are open: one single flat wide rectangle, about four times wider than it is tall, same pixel size and drawing style as the attached cabinet. No cabinet frame around it, no doors, no tabletop, no legs, no middle post: just the inside of the cupboard filling the whole rectangle edge to edge. The inside is a deep, shady, dark plum-brown wooden back wall (#4a2a3c), a darker shadow strip along the top (#2f1d33) and a slightly lighter wooden floor board along the bottom. On the floor of the left third stand three small cans and jars of fish food of different heights, red, green and blue, with golden lids and a tiny simple fish picture on each, in the same style as the red fish food can on top of an aquarium. On the right, one small aquarium hand net with a short wooden handle and a round white mesh leans against the back wall. The whole middle third is completely empty, because a kitten jumps out from there. All items are small, no taller than two thirds of the cupboard. Plain flat solid pure green background (#00FF00) around the rectangle. No cat, no fish, no water, no text, no letters, no numbers, no labels, no watermark.
```

## 2. Puerta abierta

La madera se recolorea por código con la misma regla que el mueble (`REGLAS.mueblePecera` en `casaDecoracion.ts`), así que tiene que salir en sus naranjas; las bisagras grises y el pomo dorado se quedan como están.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Draw ONLY one single door of the attached wooden cabinet, the LEFT door, shown wide open. It is hinged on its RIGHT edge and swung out towards the viewer and to the left, seen in strong perspective, so it looks narrow: about half as wide as it is tall. The right edge (the hinge side, farther away) is a vertical line, shorter; the left edge (the free side, closer to the viewer) is a vertical line, a little taller; the top and bottom edges are slightly slanted, making a gentle trapezoid. We see the inner face of the door: a plain wooden board with the same simple inset rectangular panel as the cabinet doors, with two small grey metal hinges on the right edge, and a little golden knob peeking at the left edge. Use exactly the same wood colors as the attached cabinet: wood #CD7549, light edge #E8955A, shadow #A24A44, and the same pixel size and outline thickness. Only the door, centered, large, on a plain flat solid pure green background (#00FF00). No cabinet, no second door, no inside of the cupboard, no cat, no floor, no cast shadow, no text, no letters, no numbers, no watermark.
```

## 3. Las cuatro colas

Orden: atigrado, esmoquin, melena, nube. Van en los **colores clave** del gato base (ver [modelos nuevos](casa-modelos-v1.md)), así sirven para cualquier gatito: el código las pinta con su paleta, sus marcas y su barro.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. A sprite sheet with exactly four separate cat TAILS and nothing else, in one row, left to right, evenly spaced, all at the same pixel scale. Each tail matches the tail of the kitten in the same position in the attached image, from left to right, with the same drawing style. Every tail has the same pose: it hangs straight DOWN out of a closed cupboard door and curls up at the end towards the right, like the letter J. The top of every tail, where it comes out of the cupboard, is cut perfectly flat and horizontal, with all four flat cuts on the same invisible line. There is no cat, no body, no paws, no head: only the four tails. Paint them ONLY with these exact flat colors. 1. short-haired tabby tail, medium thickness: fur #FF8A00, fur shadow #C2410C, three rings #7C2D12, rounded tip #FFF1D6. 2. short-haired tuxedo tail, a little thinner: fur #FF8A00, fur shadow #C2410C, two rings #7C2D12, a longer tip #FFF1D6. 3. long-haired plumed fluffy tail, much wider, with soft rounded tufts: fur #FF8A00, light fur #FFC266, fur shadow #C2410C, the whole end of the tail #A21CAF. 4. cloud tail made of soft bulging round puffs, the widest of the four, like the fourth kitten: cloud puffs #FFF1D6, with one round puff at the very end in #A21CAF. Each tail also has one small round mud spot #8B5A2B halfway down. Plain flat solid pure green background (#00FF00), generous empty space between the tails, no floor, no door, no cast shadow, no text, no letters, no numbers, no labels, no watermark.
```

## Montaje

```bash
uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-escondite-recorte.py --origen ../super-noa-arte-original/casa-escondite-v1
```

- `casa-escondite-dentro-v1.webp`: el interior, 320 × 84. No cambia de color.
- `casa-escondite-puertas-v1.webp`: capa de 412 × 354 con las dos puertas abiertas en su sitio (la derecha, en espejo). Pasa por `useDibujoDeColor` como el mueble.
- `casa-escondite-colas-v1.webp`: cuatro celdas de 60 × 48 en colores clave; `PeceraCasa.tsx` pinta con `hojaPintada` la del modelo del gatito y la mece (quieta con movimiento tranquilo). La de nube va sin la manchita de barro: caía sobre una bola de barriga y en un gatito limpio se veía como un lunar.
