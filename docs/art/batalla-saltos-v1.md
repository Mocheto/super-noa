# Batalla de saltos: Siroco y Don Silbato

Dossier del arte propio de las batallas de saltos de Siroco (desierto) y Don Silbato (estación del tren). Ticket: [Arte propio para la batalla de saltos de Siroco y Don Silbato](https://github.com/Mocheto/super-noa/issues/355), salido del mapa [Mejoras y recomendaciones visuales](https://github.com/Mocheto/super-noa/issues/274).

## Estado

- **Pendiente de generar.** Hoy las dos batallas usan su propio fondo (`worlds/desert-boss-arena-v1.webp` y `worlds/train-boss-arena-v1.webp`) y su propio personaje, pero el suelo y la repisa nevados de Papá Noel (`atlases/santa-boss-terrain-v1.webp`), los copos que caen y unos proyectiles dibujados con formas (un círculo y un rectángulo).
- Se recortará con `prototypes/tools/batalla-saltos-recorte.py` en un atlas por guardián, `atlases/siroco-boss-terrain-v1.webp` y `atlases/don-silbato-boss-terrain-v1.webp`, con el suelo, la repisa y el proyectil, y sus recortes en `santaBattleAssets.ts`.

## Qué hace falta

Una lámina por guardián con tres piezas:

1. **Suelo:** un tramo largo que se repite a lo ancho de la arena; su borde de arriba es donde pisa Noa y tiene que ser **recto y plano**.
2. **Repisa flotante:** una plataforma más fina con el borde de arriba también recto y plano; se estira a 115–145 px de ancho.
3. **Proyectil:** lo que lanza el guardián. Siroco, una bola de arena; Don Silbato, una maleta.

Las partículas que caen no llevan arte: se dibujan por código (granitos de arena que vuelan de lado para Siroco, y bocanadas de vapor que suben para Don Silbato).

| # | Lámina | Adjuntar | Archivo final |
|---|---|---|---|
| 1 | Siroco: suelo, repisa y bola de arena | El fondo `public/assets/worlds/desert-boss-arena-v1.webp`. | `atlases/siroco-boss-terrain-v1.webp` |
| 2 | Don Silbato: suelo, repisa y maleta | El fondo `public/assets/worlds/train-boss-arena-v1.webp`. | `atlases/don-silbato-boss-terrain-v1.webp` |

## Cómo trabajar

1. Copia el prompt entero; ya lleva el estilo dentro.
2. Adjunta el fondo de su arena, para que la paleta y el pixel art sean los mismos.
3. Va sobre **verde plano `#00FF00`**. Yo la recorto y la monto.
4. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir. Lo más delicado es que el borde de arriba del suelo y de la repisa sea recto: si sale ondulado o con cosas encima, repite.
5. Guarda las originales fuera del repositorio, en `../super-noa-arte-original/batalla-saltos-v1/`, con los nombres `siroco-terreno` y `don-silbato-terreno` (cualquier extensión).

## 1. Siroco: suelo, repisa y bola de arena

- **Adjuntar:** el fondo del desierto.
- **Formato:** horizontal 16:9.
- **Será:** `atlases/siroco-boss-terrain-v1.webp`.

```text
Chunky, readable pixel art in the same style, palette and pixel size as the attached desert ruins background of a charming 16-bit game for young children: warm sandstone, golden sand, soft terracotta, small turquoise accents, bold dark outlines, flat colors with at most two shading tones, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Everything original, nothing copied from any game. A sprite sheet with exactly three separate items, strict side view, each fully isolated with generous empty space around it: 1. TOP, spanning about 90% of the image width and about 25% of its height: a long sturdy desert floor segment made of big carved sandstone blocks, with an absolutely straight, flat, horizontal top edge of packed golden sand as its highest visible line, a thin turquoise tile stripe on the front face and rounded sandstone blocks below; nothing sticks up above the top edge, no plants, no rocks on top, the left and right ends cut straight so it can repeat side by side. 2. BOTTOM LEFT, about 55% of the image width and 12% of its height: a floating sandstone ledge, a thin carved slab with the same straight, flat, horizontal sandy top edge, a small turquoise sun emblem in the middle of its front face and two short carved brackets hanging below; nothing on top. 3. BOTTOM RIGHT, small, about 12% of the image width: one round ball of packed golden sand with a few darker grains and a tiny swirl of wind around it, no face. Plain flat solid pure green background (#00FF00) behind and between all items, no floor under them, no cast shadows, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```

## 2. Don Silbato: suelo, repisa y maleta

- **Adjuntar:** el fondo de la estación.
- **Formato:** horizontal 16:9.
- **Será:** `atlases/don-silbato-boss-terrain-v1.webp`.

```text
Chunky, readable pixel art in the same style, palette and pixel size as the attached railway station background at dusk of a charming 16-bit game for young children: dark blue-grey iron, warm brick red, polished wood, brass and golden lamp light, bold dark outlines, flat colors with at most two shading tones, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Everything original, nothing copied from any game. A sprite sheet with exactly three separate items, strict side view, each fully isolated with generous empty space around it: 1. TOP, spanning about 90% of the image width and about 25% of its height: a long sturdy station platform floor segment, with an absolutely straight, flat, horizontal top edge of light stone paving with a thin yellow safety line as its highest visible line, dark iron beams with round rivets on the front face and red brick below; nothing sticks up above the top edge, no luggage, no lamps, no railings on top, the left and right ends cut straight so it can repeat side by side. 2. BOTTOM LEFT, about 55% of the image width and 12% of its height: a floating luggage rack shelf, a thin plank of polished wood with the same straight, flat, horizontal top edge, brass end caps and two curly iron brackets hanging below; nothing on top. 3. BOTTOM RIGHT, small, about 12% of the image width: one closed old-fashioned brown leather suitcase with two buckled straps, brass corners and a little handle on top, side view, no face, no stickers with writing. Plain flat solid pure green background (#00FF00) behind and between all items, no floor under them, no cast shadows, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```
