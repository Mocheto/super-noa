# Regalo saltarín (`gift-spring`)

Hoja `public/assets/sprites/gift-spring-v1.webp`: 4 fotogramas de 192 × 144 px en una tira de 768 × 144 (fondo transparente, WebP sin pérdida). El juego la dibuja a la mitad (96 × 72) con `giftSpring` de `src/game/mechanicSprites.ts`.

| Fotograma | Pose |
|---|---|
| 0 | reposo |
| 1 | lazo inclinado a la izquierda, destello |
| 2 | lazo inclinado a la derecha, destello |
| 3 | aplastado (se usa unos 9 pasos tras pisarlo) |

En reposo se alterna 0, 1, 0, 2 cada 20 pasos. La **tapa** de la caja debe quedar a 60 px del borde superior del fotograma (en el aplastado, a 84 px) y la base pegada al borde inferior: así la tapa coincide con la superficie pisable de la plataforma de 84 × 42.

El v0 sale de `prototypes/tools/regalo-saltarin-arte.py`. Para el arte final, sustituye el archivo por otra tira con las mismas medidas.

## Prompt para el arte final

> Pixel art sprite sheet, 4 frames in a horizontal strip on a flat solid green background, each frame 192×144 px. A chunky red Christmas gift box with a thick gold ribbon and a big gold bow on top, a little snow on the lid, dark plum outline, soft highlights, cute and friendly for a five-year-old, side view. Frame 1: resting. Frame 2: bow tilted left with a small sparkle. Frame 3: bow tilted right with a small sparkle. Frame 4: squashed flat and wider, as if someone just jumped on it. Same box size and position in frames 1–3, base touching the bottom edge, lid 60 px from the top. No text, no shadow on the ground.
