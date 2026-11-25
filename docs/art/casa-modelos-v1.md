# Casa de los gatitos: modelos nuevos (referencias)

Láminas de referencia de los tres modelos nuevos de los gatitos de la casa: **esmoquin**, **melena** y **nube**. El **atigrado** es la hoja de hoy (`sprites/gato-casa-v1.webp`, [dossier](casa-gato-base-v1.md)) y no cambia. Ticket: [Lámina de referencia de cada modelo y prueba de parecido](https://github.com/Mocheto/super-noa/issues/384), del mapa [Gatitos de la casa distintos: modelos, marcas y complemento de su mundo](https://github.com/Mocheto/super-noa/issues/378).

Decisiones de las que sale:

- [Cuántos modelos de gatito y quién va con cada uno](https://github.com/Mocheto/super-noa/issues/381).
- [Marcas del pelo de cada gatito y cómo se pintan](https://github.com/Mocheto/super-noa/issues/382).
- [El complemento de su mundo frente a los accesorios del armario](https://github.com/Mocheto/super-noa/issues/383).

## Estado

- **Hecho (25-11-2026):** las tres referencias están generadas (originales en `../super-noa-arte-original/casa-modelos-v1/`) y recortadas con `prototypes/tools/casa-modelos-recorte.py` en `sprites/gato-casa-referencias-v1.webp`: una fila de cuatro cuadros de 160 × 160 con el atigrado, el esmoquin, la melena y la nube. La prueba de parecido (`?prueba=casa&paletas`, en desarrollo) las pinta con la paleta y las marcas de cada gatito, junto a su dibujo del mundo.
- **Dadas por buenas** con la persona usuaria (25-11-2026), con un collar fino que se queda y la cola de nube blanca con la punta de color. **Pendiente:** las trece animaciones, el arropado y el gatito grande del vestidor de cada modelo.

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
