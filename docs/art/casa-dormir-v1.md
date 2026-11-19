# Casa de los gatitos: hora de dormir

Dossier del arte de la hora de dormir. Ticket: [Prompt de la mantita](https://github.com/Mocheto/super-noa/issues/225), del mapa [Hora de dormir en la casa](https://github.com/Mocheto/super-noa/issues/208). Mismo estilo que el [gato base](casa-gato-base-v1.md) y la [habitación](casa-habitacion-v1.md).

## Estado

- **Montado** ([Montar el arte de la mantita](https://github.com/Mocheto/super-noa/issues/229)): la original está en `../super-noa-arte-original/casa-dormir-v1/` y se recorta con `uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-dormir-recorte.py ../super-noa-arte-original/casa-dormir-v1`. El juego la tiñe del color del collar de cada gatito (`casaDormirArte.ts`).

## Qué hace falta

- **Una sola lámina con dos dibujos de la misma mantita**:
  - doblada, para la bandeja;
  - extendida, sola, con la forma que tendría tapando a un gatito hecho una bola. El juego la pone encima del gatito dormido y le deja la cabeza fuera.
- **Color clave:** la mantita va en violeta (`#B000FF`, pliegues `#6A00A8`) con un ribete blanco. El código cambia el violeta por el color del collar de cada gatito, así que no debe haber violeta en ningún otro sitio.

| # | Lámina | Adjuntar | Archivo final |
|---|---|---|---|
| 1 | Mantita doblada y extendida | La lámina del gato durmiendo (`gato-dormir-jugar`) elegida. | `sprites/casa-mantita-v1.webp` (dos celdas) |
| 2 | Pose «arropado» del gatito | La hoja del gato base y la mantita. | `sprites/gato-casa-arropado-v1.webp` (dos cuadros) |

## Cómo trabajar

1. Copia el prompt entero; ya lleva el estilo dentro.
2. Adjunta la lámina del gato durmiendo, para que el tamaño y el estilo casen.
3. Va sobre **verde plano `#00FF00`**. Yo la recorto, la cambio de color y la monto.
4. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir.
5. Guarda la original fuera del repositorio, en `../super-noa-arte-original/casa-dormir-v1/`.

## 1. Mantita doblada y extendida

- **Adjuntar:** la lámina del gato durmiendo elegida.
- **Formato:** horizontal 16:9.
- **Será:** `sprites/casa-mantita-v1.webp`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly two separate drawings of the same small, soft, cozy blanket for a kitten, side by side, each centered in its own half, same pixel scale as the sleeping kitten in the attached image. The blanket is a solid bright violet (#B000FF) with darker violet (#6A00A8) folds and a thin white stitched border with a few tiny white stars. Drawing 1 "folded": the blanket neatly folded into a small square pile, front view. Drawing 2 "draped": the blanket alone, spread out as if it were covering a kitten curled up asleep in a ball, shaped like a soft low rounded dome a bit wider than the sleeping kitten, open and lower on the left side where the kitten's head would peek out, with a wavy hem at the bottom; there is NO kitten, only the blanket. Plain flat solid pure green background (#00FF00) behind and between both drawings, generous empty space between them, no floor, no cast shadow, no bright green anywhere in the blanket. No text, no letters, no numbers, no labels, no watermark.
```

## 2. Pose «arropado» del gatito

- **Ticket:** [Prompt de la pose arropado](https://github.com/Mocheto/super-noa/issues/238), del mapa [Gatitos dormidos con la cabeza fuera de la mantita](https://github.com/Mocheto/super-noa/issues/231).
- **Adjuntar:** la hoja del gato base (`public/assets/sprites/gato-casa-v1.webp`) y la mantita (`public/assets/sprites/casa-mantita-v1.webp`), para que el gatito y la mantita casen.
- **Formato:** horizontal 16:9.
- **Será:** `sprites/gato-casa-arropado-v1.webp` (dos cuadros de 160 × 160).
- **Por qué:** la mantita encima del dibujo de dormir le tapaba la cara al gatito (que la tiene a la izquierda). Esta pose ya viene dibujada con la mantita.
- **Colores:** el gatito, solo con los colores clave del gato base (el juego pone los de cada gatito); la mantita, solo con el violeta clave (el juego la tiñe del color del collar). Que no haya violeta en el gatito ni naranja en la mantita.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. The same small short-haired kitten as in the attached sprite sheet, same size, same big round head and same proportions, tucked in for the night under the same small blanket as in the attached blanket image. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C, tabby stripes #7C2D12 (a small M on the forehead, two stripes on the tail tip), muzzle #FFF1D6, inner ears and nose #F9A8D4, a small bow on top of the head between the ears #FFD700. Paint the blanket ONLY with a solid bright violet (#B000FF), darker violet folds (#6A00A8) and a thin white stitched border with a few tiny white stars. A sprite sheet with exactly two frames side by side, each the same size, evenly spaced, the kitten lying on the floor on its side seen from the front in three-quarter view, facing right: the kitten's whole head is outside the blanket, resting sideways on its two little front paws like on a pillow, eyes peacefully closed as thin curved lines, a tiny content smile; the blanket covers the kitten's body from the neck down to the back paws, draped softly over the body with a wavy hem touching the floor; only the tip of the fluffy tail peeks out from under the blanket at the back, on the left. Frame 1: breathing in, the blanket slightly higher. Frame 2: breathing out, the blanket slightly lower, a tiny "z" floating above the head. Both frames with the head, the paws and the blanket in the same place, resting on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between both frames, generous empty space between them, no floor, no pillow, no cast shadow, no text, no letters, no numbers, no watermark.
```
