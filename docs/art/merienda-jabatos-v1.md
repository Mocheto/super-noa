# La merienda de los jabatos: arte final

Dossier del arte de **La merienda de los jabatos**, el duelo rítmico del Gran Jabalí. El arte se genera a mano con los prompts de este documento, sin servicios de pago integrados en la sesión. La escena, las poses y la lista de piezas salen de [Dibujar el aspecto: Noa guarda del bosque, el Gran Jabalí y los jabatos](https://github.com/Mocheto/super-noa/issues/47). El prototipo jugable está en `prototypes/merienda-jabatos-prototipo.html`.

## Estado

- **Pendiente:** la persona usuaria genera las piezas. Después se recortan, se alinean y se colocan en `public/assets/`.
- **Se reutilizan:**
  - el Gran Jabalí, con sus cinco poses `public/assets/sprites/boss-gran-jabali-0..4.png`;
  - el fondo del bosque, `public/assets/worlds/world-4-hd-v1.webp`.

## Cómo trabajar

1. Genera cada pieza con su prompt. Adjunta las imágenes que se indican:
   - la **imagen base** (en `docs/art/merienda-jabatos-base/`) da la forma, la pose y la composición;
   - la **referencia de estilo** (en `public/assets/`) da el personaje y el acabado.
2. Las piezas sueltas van sobre **fondo verde plano `#00FF00`**. Yo las recorto a transparente, las alineo por la base y las coloco en el juego. Pásamelas tal cual salgan.
3. Si un modelo estropea una lámina con varias poses, genera cada pose por separado con el mismo prompt, quitando de la lista lo que no toque.
4. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir con el prompt.

## Imágenes base

| Archivo | Qué muestra |
|---|---|
| `docs/art/merienda-jabatos-base/escena-composicion.png` | La escena del prototipo: Noa a la izquierda con su cesta, el arbusto delante de su mano, el jabato grande asomando, el Gran Jabalí en su roca y la rama de bellotas. Sirve para tamaños y posiciones. |
| `docs/art/merienda-jabatos-base/jabato-poses-base.png` | Las cinco poses del jabato en orden: boca cerrada, entreabierta, abierta del todo, masticando y triste. |
| `docs/art/merienda-jabatos-base/objetos-base.png` | El arbusto, la cesta, la bellota y la castaña. |

## Bloques comunes

Pega **ESTILO** al principio y **FONDO** al final de cada prompt.

**ESTILO**

> Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), warm cel shading with two or three tones per color, saturated friendly autumn-forest colors, big expressive eyes, slightly oversized heads. Crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes.

**FONDO**

> Plain flat solid pure green background (#00FF00) behind and between all elements, no floor, no cast shadow, no green anywhere in the subject. No text, no labels, no watermark.

Las hojas verdes del arbusto chocan con el fondo `#00FF00`. Para esa lámina se usa el bloque **FONDO MAGENTA**:

> Plain flat solid pure magenta background (#FF00FF) behind and between all elements, no floor, no cast shadow, no magenta or pink anywhere in the subject. No text, no labels, no watermark.

## Piezas

| Pieza | Imagen base | Referencia de estilo | Archivo final | Tamaño en escena (960 × 540) |
|---|---|---|---|---|
| Noa guarda del bosque, 4 poses | `escena-composicion.png` | `public/assets/sprites/noa-rps-0.png` y `noa-lenadora-v1.webp` | `sprites/noa-guarda-v1.webp` | 186 × 257 por pose |
| Jabato pequeño, 5 poses | `jabato-poses-base.png` | `public/assets/sprites/enemy-boar-v2.png` | `sprites/jabato-pequeno-v1.webp` | 140 × 120 por pose |
| Jabato grande, 5 poses | `jabato-poses-base.png` | `public/assets/sprites/enemy-boar-v2.png` | `sprites/jabato-grande-v1.webp` | 190 × 160 por pose |
| Comida y cesta | `objetos-base.png` | `public/assets/sprites/boss-gran-jabali-0.png` (bellotas de su traje) | `sprites/merienda-objetos-v1.webp` | bellota 40 × 40, castaña 40 × 40, cesta 96 × 64 |
| Arbusto, roca y rama | `objetos-base.png` y `escena-composicion.png` | `public/assets/worlds/world-4-hd-v1.webp` | `sprites/merienda-escenario-v1.webp` | arbusto 210 × 82, roca 175 × 40, rama 230 × 40 |

### 1. Noa guarda del bosque

Adjunta `noa-rps-0.png` como referencia del personaje, `noa-lenadora-v1.webp` como referencia de lámina y `escena-composicion.png` para la escala.

Prompt (ESTILO + este texto + FONDO, formato 16:9):

```text
A pixel-art sprite sheet with exactly four poses of the same little girl dressed as a friendly forest ranger, in one horizontal row, evenly spaced, each pose the same size, full body, feet on the same baseline, all facing right. Use the first attached image as the character reference: keep her face, big brown eyes, brown wavy hair with a red apple hair clip (still visible under the hat), lilac top, white socks and lilac sneakers exactly. Her ranger outfit: a wide-brimmed moss-green felt hat with a small acorn pin, an olive-green short-sleeved shirt, a cream apron with thin brown stripes and one front pocket with an acorn peeking out, brown shorts.
Pose 1 "ready": standing, smiling, one hand holding a single acorn at chest height, the other hand on her apron pocket.
Pose 2 "feed": leaning forward to the right, arm stretched out at waist height offering an acorn with an open palm, gentle happy face.
Pose 3 "oops": a small surprised step back, hands near her cheeks, eyebrows raised, a little "o" mouth, still cute and calm, not scared.
Pose 4 "celebrate": jumping with joy, both arms raised, eyes closed in a big smile, a few small gold sparkles and two tiny acorns flying.
```

### 2. Jabato pequeño

Adjunta `jabato-poses-base.png` como imagen base de las poses y `enemy-boar-v2.png` como referencia de estilo del jabalí del mundo.

Prompt (ESTILO + este texto + FONDO, formato 21:9 o 16:9):

```text
A pixel-art sprite sheet with exactly five poses of the same baby wild boar piglet, in one horizontal row, evenly spaced, each pose the same size, same baseline, facing the viewer with the head turned very slightly to the left. Follow the first attached image for the five poses and their order; follow the second attached image for the boar's fur colors and outline style, but make it a round, chubby, adorable baby: warm brown fur with three or four cream horizontal stripes along its back and one cream stripe across its forehead, small pointed ears, big shiny dark eyes, a large pink snout with two nostrils, no tusks. Show only the head, shoulders and front of the round body, as if it were peeking up from behind a bush (the lower edge of the body can be cut flat).
Pose 1 "closed": mouth closed in a little smile, attentive.
Pose 2 "half open": mouth slightly open below the snout, hungry, eyes bright.
Pose 3 "open": mouth wide open, dark red inside with a small pink tongue, eyes sparkling, eager.
Pose 4 "munch": cheeks puffed, eyes closed happily, chewing, a few tiny crumbs.
Pose 5 "sad": eyes closed and curved down, a small frown, ears drooping, still cute.
```

### 3. Jabato grande

Mismas imágenes adjuntas que el pequeño. Si tienes ya el jabato pequeño bueno, adjúntalo también para que sean hermanos.

Prompt (ESTILO + este texto + FONDO, formato 21:9 o 16:9):

```text
A pixel-art sprite sheet with exactly five poses of the same big chubby young wild boar, the older sibling of the piglet in the attached image, in one horizontal row, evenly spaced, each pose the same size, same baseline, facing the viewer with the head turned very slightly to the left. Same poses and order as the first attached image. It is clearly bigger and rounder than the piglet: darker chestnut-brown fur, cream stripes along its back that are starting to fade, a fluffy tuft of hair on top of the head, two tiny rounded cream tusk nubs, big friendly eyes, a large pink snout. Show only the head, shoulders and front of the round body, as if it were peeking up from behind a bush (the lower edge can be cut flat).
Pose 1 "closed": mouth closed, calm and patient.
Pose 2 "half open": mouth slightly open, licking its lips.
Pose 3 "open": mouth very wide open, dark red inside with a pink tongue, delighted.
Pose 4 "munch": big puffed cheeks, eyes closed, chewing a chestnut happily.
Pose 5 "sad": eyes closed and curved down, a small frown, ears drooping.
```

### 4. Comida y cesta

Adjunta `objetos-base.png` (usa solo la cesta, la bellota y la castaña).

Prompt (ESTILO + este texto + FONDO, formato 16:9):

```text
A pixel-art item sheet with exactly four items in one horizontal row, evenly spaced, each centered in its own cell, same scale as described:
1. A single acorn: glossy warm-orange nut with a darker textured brown cap and a tiny stem, cute and round.
2. A single chestnut: shiny dark reddish-brown, wide teardrop shape with a pale cream base and a small highlight, slightly bigger than the acorn.
3. A woven wicker basket with a curved handle, light-brown wood with darker weave lines, filled to the top with acorns and two chestnuts.
4. A single acorn with tiny white sparkles around it (the "well done" reward version).
```

### 5. Arbusto, roca y rama de bellotas

Adjunta `objetos-base.png` (el arbusto) y `escena-composicion.png` (la roca y la rama de arriba a la derecha).

Prompt (ESTILO + este texto + FONDO MAGENTA, formato 16:9):

```text
A pixel-art prop sheet with exactly four props in one horizontal row, evenly spaced:
1. A wide, low, rounded forest bush made of layered autumn leaves in greens with a few yellow and orange leaves and two small acorns tucked in it; flat bottom edge; it must look like something a piglet can hide behind.
2. A flat grey-beige boulder with a mossy top, wide and low, for a big character to stand on; flat bottom edge.
3. A horizontal oak branch, long and thin, with small oak leaves at both ends and 23 empty little acorn-cap cups spaced evenly along it (the "empty" state of a score bar).
4. The same horizontal oak branch, with a golden notch mark halfway along it, and every acorn-cap cup filled with a glossy orange acorn (the "full" state).
```

La rama tiene que coincidir con el número de bocados de la canción final. Si cambia al afinar la partitura, se pide de nuevo, o bien se usa la rama vacía y se colocan las bellotas sueltas de la lámina 4.

## Sonido

No hace falta arte sonoro manual. Los samples del «merendero del bosque» se sintetizan por código en la ejecución, como los de los gatitos:
- contrabajo, punteo, madera y ocarina;
- kalimba para los bocados;
- gruñidos, frufrú, «tic», «ñam», «toc» y «fsss».
