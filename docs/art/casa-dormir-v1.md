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
