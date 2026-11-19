# Casa de los gatitos: el armario y el vestidor

Dossier del arte del vestidor. Ticket: [Prompts del arte del vestidor](https://github.com/Mocheto/super-noa/issues/242), del mapa [Ropa y accesorios para los gatitos](https://github.com/Mocheto/super-noa/issues/212). Mismo estilo que el [gato base](casa-gato-base-v1.md), la [habitación](casa-habitacion-v1.md) y el [baño](casa-bano-v1.md).

## Estado

- **Montado** ([Montar el arte del vestidor](https://github.com/Mocheto/super-noa/issues/245)): las originales están en `../super-noa-arte-original/casa-vestidor-v1/` y se recortan con `uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-vestidor-recorte.py ../super-noa-arte-original/casa-vestidor-v1`, que imprime las medidas.
- **Armario cerrado** (`sprites/casa-armario-v1.webp`, 95 × 150, sin pérdida): salió con la habitación borrosa detrás en vez de verde limpio. Se recorta por el color de la madera dentro de su caja y lleva un contorno nuevo de un píxel, porque el de arriba se perdió. En la habitación cabe con los pies hacia (925, 400), bajo la balda de la planta, entre la ventana y la bañera.
- **Fondo** (`worlds/casa-vestidor-v1.webp`, 1280 × 692): salió apaisado y se deja así, sin el marco oscuro. El suelo empieza en la fila 373. El tercio de la derecha es pared lisa para el armario abierto en apaisado.
- **Armario abierto** (`sprites/casa-armario-abierto-v1.webp`, 615 × 488): a la mitad de la lámina, con tres baldas vacías.
- **Gatito grande** (`sprites/gato-casa-vestidor-v1.webp`): dos cuadros de 240 × 340, quieto y contento, pasados a los colores clave y sin pérdida. Los pies quedan a 6 px del borde de abajo. Anclas en px de su cuadro:
  - **cabeza**, en el lazo: (135, 35);
  - **ojos**: (137, 107), los mismos en el cuadro contento, que tiene los ojos cerrados;
  - **cuello**, en el pañuelo: (134, 181).
- **Piezas** (`sprites/casa-accesorios-v1.webp`): cuatro columnas y tres filas de celdas de 200 × 170, en el orden de `ACCESORIOS` de `casaRopa.ts` y a la misma escala que el gatito grande. Cada pieza va colocada en su celda según su tipo:
  - el sombrero, con el ala abajo del todo;
  - las gafas, en el centro;
  - la bufanda, arriba del todo.
- **Cómo encajan en el gatito grande** (probado pintándolas encima):
  - el ala del sombrero, 18 px por debajo del lazo;
  - las gafas, al 85 % y centradas en los ojos;
  - la bufanda, 14 px por encima del centro del pañuelo.
  
  El sombrero sobresale por arriba del cuadro del gatito: el vestidor debe dejarle sitio.

## Qué hace falta

- **El armario cerrado de la habitación**, aparte, para el hueco de la pared entre la ventana y la bañera, bajo la balda de la planta (unos 120 × 160 px de los 1280 × 540 de la habitación). Cabe justo ahí: no debe ser más alto que dos tercios de la puerta.
- **El fondo del vestidor**, a toda la imagen como el del baño, sin armario: el armario abierto va aparte para que el juego lo ponga al lado en apaisado y debajo en vertical.
- **El armario abierto**, con tres baldas vacías y anchas (sombreros, gafas y bufandas); el juego pone las piezas encima.
- **El gatito grande del vestidor**, sentado erguido y de frente, en los colores clave del gato base: el juego pone los de cada gatito. Dos cuadros: quieto y contento (cuando se le pone algo).
- **Las 12 piezas**, una vez y en grande: el juego las reduce para la casa y las pone encima de la cabeza o el cuello del gatito. Van de frente.
- **Colores:** las piezas no deben usar el verde clave ni los colores clave del gato (el naranja `#FF8A00`, los azules `#2563EB` y `#1D4ED8` y el dorado `#FFD700`), para que nunca se confundan al recortar.

| # | Lámina | Adjuntar | Archivo final |
|---|---|---|---|
| 1 | Armario de la habitación | La habitación vacía (`public/assets/worlds/casa-habitacion-vacia-v1.webp`). | `sprites/casa-armario-v1.webp` |
| 2 | Fondo del vestidor | La habitación vacía. | `worlds/casa-vestidor-v1.webp` (960 × 720) |
| 3 | Armario abierto | El armario de la habitación elegido. | `sprites/casa-armario-abierto-v1.webp` |
| 4 | Gatito grande del vestidor | La hoja del gato base (`public/assets/sprites/gato-casa-v1.webp`). | `sprites/gato-casa-vestidor-v1.webp` (dos cuadros) |
| 5 | Sombreros, gafas y bufandas | El gatito grande elegido. | `sprites/casa-accesorios-v1.webp` (4 × 3 celdas) |

## Cómo trabajar

1. Copia cada prompt entero; ya lleva el estilo dentro.
2. Adjunta lo que diga cada lámina.
3. La lámina 2 va a toda la imagen, sin fondo verde; las demás, sobre **verde plano `#00FF00`**. Yo las recorto y las monto.
4. Si algo no sale bien tras tres intentos, cambia de modelo antes de insistir.
5. Guarda las originales fuera del repositorio, en `../super-noa-arte-original/casa-vestidor-v1/`.

## 1. Armario de la habitación

- **Adjuntar:** la habitación vacía.
- **Formato:** vertical 3:4.
- **Será:** `sprites/casa-armario-v1.webp`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A single small, narrow wardrobe for a cat house, seen straight-on from the front like the furniture in the attached room, same pixel scale, same honey-wood colors and same plum outline as the door in the attached room. Two tall doors closed, a rounded arched top, two small round knobs, little rounded feet, and on the top a small carved wooden coat hanger shape as a sign. It is cute and a bit chubby, about two thirds as tall as the door in the attached room and a bit narrower than that door. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between items, no floor, no cast shadow, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```

## 2. Fondo del vestidor

- **Adjuntar:** la habitación vacía.
- **Formato:** horizontal 4:3.
- **Será:** `worlds/casa-vestidor-v1.webp` (960 × 720).

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A cozy little dressing room of a cat house, seen straight-on like a theater stage, in the same style and warm colors as the attached room, with no people, no animals, NO wardrobe and NO mirror. Soft lilac wallpaper with small cream polka dots, a wooden coat rack with two empty hooks high on the left wall, a small round window with a sunny sky high on the left, a string of little pastel bunting flags across the top, and a light honey-wood floor in the bottom fifth of the image with a round soft pink rug in the bottom center. Leave the center of the picture plain and empty, because a big kitten will sit there later on the rug, and keep the right third of the picture as plain wall and floor only, because an open wardrobe will be placed there later. No text, no letters, no numbers, no watermark.
```

## 3. Armario abierto

- **Adjuntar:** el armario de la habitación elegido.
- **Formato:** cuadrado 1:1.
- **Será:** `sprites/casa-armario-abierto-v1.webp`.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. The same wardrobe as in the attached image, drawn much bigger and wider, seen straight-on from the front, with both doors swung wide open to the left and right so the whole inside is visible. The inside is a slightly darker warm wood and has exactly three empty wooden shelves, evenly spaced one above the other, all the same size, each one wide and deep enough for four small items side by side. The shelves are completely EMPTY: no clothes, no hats, no objects. Keep the same arched top, the carved coat hanger sign on the top, the round knobs and the little rounded feet. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between items, no floor, no cast shadow, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```

## 4. Gatito grande del vestidor

- **Adjuntar:** la hoja del gato base.
- **Formato:** horizontal 16:9.
- **Será:** `sprites/gato-casa-vestidor-v1.webp` (dos cuadros).
- **Colores:** solo los colores clave del gato base; el juego pone los de cada gatito.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. The same small short-haired kitten as in the attached sprite sheet, same big round head and same proportions, drawn bigger, sitting upright and looking straight at the viewer, seen fully from the front, ears up, front paws together, tail curled around the paws. Paint the kitten ONLY with these exact flat colors: fur #FF8A00, light fur #FFC266, fur shadow #C2410C, tabby stripes #7C2D12 (a small M on the forehead, stripes on the tail), muzzle and tummy #FFF1D6, inner ears and nose #F9A8D4, eyes #1D4ED8, a simple collar #2563EB with shadow #1E3A8A clearly visible around the neck, and a small bow on top of the head between the ears #FFD700. A sprite sheet with exactly two frames side by side, each the same size, evenly spaced: Frame 1 "still": calm, big open eyes, small smile. Frame 2 "happy": eyes closed as happy upward curves, a bigger open smile, cheeks a little puffed, the same pose. Both frames with the head, the body and the paws in exactly the same place, resting on the same invisible baseline, with empty space above the head for a hat. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between items, no floor, no cast shadow, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```

## 5. Sombreros, gafas y bufandas

- **Adjuntar:** el gatito grande elegido.
- **Formato:** horizontal 4:3.
- **Será:** `sprites/casa-accesorios-v1.webp` (cuatro columnas y tres filas).
- **Colores:** sin naranja, sin azul fuerte ni dorado (son los colores clave del gato).

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet of kitten accessories in exactly three rows of four, each item centered in its own cell, all at the same pixel scale so they would fit the big kitten in the attached image, all seen from the front, with NO kitten. Row 1, hats: 1. a little straw sun hat with a pink flower; 2. a red knitted beanie with a white pompom and two small holes for cat ears; 3. a small striped party cone hat in pink and white with a tiny pompom; 4. a tiny black top hat with a red ribbon. Row 2, glasses: 1. round pink glasses; 2. star-shaped purple sunglasses; 3. heart-shaped red sunglasses; 4. big round teal swimming goggles. Row 3, scarves, each one shaped as if wrapped around an invisible kitten neck, a curved soft band with two short ends hanging down in front: 1. a red and white striped knitted scarf; 2. a lilac scarf with white snowflakes; 3. a pink scarf with white polka dots; 4. a teal and cream striped scarf with little fringes. No orange, no strong blue and no gold in any item. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between items, no floor, no cast shadow, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```
