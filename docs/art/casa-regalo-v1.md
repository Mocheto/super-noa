# Casa de los gatitos: el regalo

Dossier del arte de los regalos. Mapa: [Ganar decoraciones de la casa](https://github.com/Mocheto/super-noa/issues/210); generar en [Generar el arte del regalo](https://github.com/Mocheto/super-noa/issues/468) y montar en [Montar el arte del regalo](https://github.com/Mocheto/super-noa/issues/469). Boceto elegido: `prototypes/regalo-boceto.html` (variante A, con la tarjeta de la B).

## Estado

- **Montado** el 27-11-2026. Originales en `../super-noa-arte-original/casa-regalo-v1/`.

## Qué hace falta

| # | Lámina | Adjuntar | Original |
|---|---|---|---|
| 1 | Caja de regalo | `cuenco.png` | `caja.png` |
| 2 | Lazo | `cuenco.png` | `lazo.png` |

La caja se usa en la habitación (110 × 110) y en el aviso «¡REGALO!»; el lazo, en el botón CASA del mapa y en las siluetas por ganar. El confeti, la silueta y la tarjeta se hacen por código.

## Cómo trabajar

1. Adjunta `../super-noa-arte-original/casa-regalo-v1/referencias/cuenco.png`: es un solo objeto de la casa en un lienzo cuadrado, para el estilo y para que la imagen salga cuadrada. No adjuntes láminas enteras: el generador copia su forma.
2. Cada prompt va completo: copia solo ese bloque.
3. Guarda los resultados fuera del repositorio, en `../super-noa-arte-original/casa-regalo-v1/`, con los nombres de la tabla (cualquier extensión).

## 1. Caja de regalo

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Use the attached image ONLY as a reference for the drawing style and outline thickness; do not draw the bowl. A single closed gift box, seen from the front and very slightly from above: a chunky square box in sky blue (#5aa9e6) with a slightly wider lid in a lighter blue (#7cc0f2), a wide golden yellow ribbon (#ffd76a) running vertically down the middle of lid and box, and a big plump red bow (#e5484d) on top with two rounded loops and a round knot. Only the box, large and centered, filling most of the image, standing upright. Plain flat solid pure green background (#00FF00), no floor, no cast shadow, no bright green anywhere in the box, no sparkles, no text, no letters, no numbers, no watermark.
```

## 2. Lazo

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Use the attached image ONLY as a reference for the drawing style and outline thickness; do not draw the bowl. A single decorative gift bow seen straight from the front: two big plump rounded red loops (#e5484d) with a darker red shade, a round knot in the middle and two short ribbon tails hanging down with notched ends. Very simple shape that stays readable when drawn tiny. Only the bow, large and centered, filling most of the image. Plain flat solid pure green background (#00FF00), no floor, no cast shadow, no box, no text, no letters, no numbers, no watermark.
```

## Montaje

- `prototypes/tools/casa-regalo-recorte.py` saca `sprites/casa-regalo-v1.webp` y `sprites/casa-lazo-v1.webp`; `src/game/regaloArte.ts` las pone como `--regalo` y `--lazo`.
