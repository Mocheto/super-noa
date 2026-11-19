# Prompts de arte pendientes

Todos los prompts que faltan por generar, **completos**: cada bloque se copia y se pega tal cual, sin juntar trozos. Se generan a mano, sin servicios de pago. Los ya generados siguen en sus dossiers.

## Cómo trabajar

1. Adjunta lo que diga el prompt.
2. Pásame la lámina tal cual salga, con la mayor resolución que dé el modelo. Yo la recorto, quito el verde `#00FF00` y la monto.
3. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir.
4. Guarda las originales fuera del repositorio, en `../super-noa-arte-original/`.

El detalle está en [la hora de dormir](casa-dormir-v1.md).

| # | Lámina | Para | Ticket |
|---|---|---|---|
| 1 | Pose «arropado» del gatito | `sprites/gato-casa-arropado-v1.webp` (dos cuadros) | [Generar la lámina de la pose arropado](https://github.com/Mocheto/super-noa/issues/239) |

## 1. Pose «arropado» del gatito

- **Ticket:** [Prompt de la pose arropado](https://github.com/Mocheto/super-noa/issues/238), del mapa [Gatitos dormidos con la cabeza fuera de la mantita](https://github.com/Mocheto/super-noa/issues/231).
- **Adjuntar:** la hoja del gato base (`public/assets/sprites/gato-casa-v1.webp`) y la mantita (`public/assets/sprites/casa-mantita-v1.webp`), para que el gatito y la mantita casen.
- **Formato:** horizontal 16:9.
- **Será:** `sprites/gato-casa-arropado-v1.webp` (dos cuadros de 160 × 160).
- **Por qué:** la mantita encima del dibujo de dormir le tapaba la cara al gatito (que la tiene a la izquierda). Esta pose ya viene dibujada con la mantita.
- **Colores:** el gatito, solo con los colores clave del gato base (el juego pone los de cada gatito); la mantita, solo con el violeta clave (el juego la tiñe del color del collar). Que no haya violeta en el gatito ni naranja en la mantita.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. The same small short-haired kitten as in the attached sprite sheet, same size, same big round head and same proportions, tucked in for the night under the same small blanket as in the attached blanket image. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C, tabby stripes #7C2D12 (a small M on the forehead, two stripes on the tail tip), muzzle #FFF1D6, inner ears and nose #F9A8D4, a small bow on top of the head between the ears #FFD700. Paint the blanket ONLY with a solid bright violet (#B000FF), darker violet folds (#6A00A8) and a thin white stitched border with a few tiny white stars. A sprite sheet with exactly two frames side by side, each the same size, evenly spaced, the kitten lying on the floor on its side seen from the front in three-quarter view, facing right: the kitten's whole head is outside the blanket, resting sideways on its two little front paws like on a pillow, eyes peacefully closed as thin curved lines, a tiny content smile; the blanket covers the kitten's body from the neck down to the back paws, draped softly over the body with a wavy hem touching the floor; only the tip of the fluffy tail peeks out from under the blanket at the back, on the left. Frame 1: breathing in, the blanket slightly higher. Frame 2: breathing out, the blanket slightly lower, a tiny "z" floating above the head. Both frames with the head, the paws and the blanket in the same place, resting on the same invisible baseline. Plain flat solid pure green background (#00FF00) behind and between both frames, generous empty space between them, no floor, no pillow, no cast shadow, no text, no letters, no numbers, no watermark.
```
