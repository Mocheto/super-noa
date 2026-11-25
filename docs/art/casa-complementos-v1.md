# Casa de los gatitos: los complementos de cada gatito

Dossier de los diecisiete complementos: cada gatito de la casa lleva una prenda fija de su mundo. Ticket: [Los diecisiete complementos en la casa](https://github.com/Mocheto/super-noa/issues/386), del mapa [Gatitos de la casa distintos: modelos, marcas y complemento de su mundo](https://github.com/Mocheto/super-noa/issues/378). Qué lleva cada uno y cómo convive con el armario se decidió en [El complemento de su mundo frente a los accesorios del armario](https://github.com/Mocheto/super-noa/issues/383). Mismo estilo que los accesorios del [vestidor](casa-vestidor-v1.md) y sus [piezas nuevas](casa-vestidor-v2.md).

## Estado

- **Hecho (25-11-2026):** las tres láminas están en `../super-noa-arte-original/casa-complementos-v1/` y se recortan con `uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-complementos-recorte.py ../super-noa-arte-original/casa-complementos-v1`, que deja `sprites/casa-complementos-v1.webp` (quince celdas de 200 × 170 en fila) y `sprites/casa-complementos-capas-v1.webp` (dos celdas de 260 × 240).
- **Cambios al recortar:**
  - Collares y bufandas salieron como aros vistos desde arriba: el recorte los abre por código (`abrir_aro`).
  - Encima de las capas quedaron dos manchas borrosas: se toman solo las dos piezas más grandes.
- **Chispa:** su complemento salió como gorro de aviador con las gafas en la frente, así que va en la cabeza, en el sitio del sombrero, y no en los ojos. Quedan 5 en la cabeza, 10 al cuello y 2 a la espalda.
- **En el juego:** `src/game/casaComplementos.ts`. El pañuelo del atigrado se borra al pintar su hoja y toma el color de la barriga.
- **Repaso del encaje (25-11-2026):**
  - **Prendas del cuello:** pañuelos y bufandas salieron con el interior del aro o del tubo pintado, no hueco, así que `abrir_aro` no lo veía. Ahora el recorte corta la parte de atrás (`CORTE`) y encoge pañuelos, collares y lazos (`ANCHO`).
  - **Gorros:** los cinco de cabeza bajan más que un sombrero del armario (`hundir`), y con algo en la cabeza no se pinta el lazo de mejor amigo.
  - **Tamaño por modelo:** las piezas encogen con la cabeza del modelo (`TAMANO_VESTIDOR`: la melena, al 80 %).
  - **Anclas:** los cuadros sueltos sin cuello toman el de su animación, y el esmoquin al pedir y la nube en el salto y al comer tienen anclas puestas a mano.

## Cómo funciona

- **Pieza aparte:** cada complemento es una pieza aparte, como un accesorio del armario. Se pone en el sitio de un tipo: cabeza = sombrero, ojos = gafas, cuello = bufanda y espalda = capa. Se dibuja sobre las mismas anclas y en celdas del mismo tamaño que las piezas del armario (`casa-accesorios-v2.webp` y `casa-capas-v1.webp`), así que encaja en los cuatro modelos sin código nuevo de colocación.
- **Colores fijos:** el juego no los cambia, a diferencia del gatito. Como en el armario, nada de verde chillón ni de los colores exactos del gato (naranja vivo, azul fuerte y dorado puro); los tonos suaves sí valen.
- **Reparto:** 4 en la cabeza, 1 en los ojos, 10 al cuello y 2 a la espalda. En la decisión ponía 11 al cuello por una cuenta mal hecha: son 10.

| Lámina | Piezas, en este orden | Archivo final |
|---|---|---|
| `casa-complementos-cabeza` | Bellota, Nube, Botón, Vía (cabeza) y Chispa (ojos) | `sprites/casa-complementos-v1.webp`, fila 1 |
| `casa-complementos-cuello` | Miel, Bruma, Pino, Iris, Perla, Ámbar, Copito, Estrella, Duna y Tempo | `sprites/casa-complementos-v1.webp`, filas 2 y 3 |
| `casa-complementos-espalda` | Luna y Celeste | `sprites/casa-complementos-capas-v1.webp` |

## Cómo trabajar

1. **Adjunta siempre dos imágenes**, para que el tamaño case:
   - el gatito grande del vestidor, `public/assets/sprites/gato-casa-vestidor-v1.webp`;
   - la lámina de piezas del armario, `public/assets/sprites/casa-accesorios-v2.webp`.
   Para la espalda, adjunta las capas, `public/assets/sprites/casa-capas-v1.webp`, en lugar de la lámina de piezas.
2. **Fondo y orden:** las tres van sobre **verde plano `#00FF00`**, con las piezas en el orden del prompt y separadas.
3. **Comprueba el número:** tienen que salir **exactamente** 5, 10 y 2 piezas.
4. **Bufandas y pañuelos:** que salgan como **banda curvada abierta**, no como un aro cerrado. Si salen como un aro, el recorte puede abrirlo, como con las bufandas del armario.
5. **Dónde guardarlas:** en `../super-noa-arte-original/casa-complementos-v1/`, con los nombres de la tabla (cualquier extensión).
6. **Si falla:** si algo no sale bien tras tres intentos, cambia de modelo antes de insistir.

## 1. Cabeza y ojos

- **Adjuntar:** el gatito grande y la lámina de piezas del armario.
- **Formato:** horizontal 16:9.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly five separate kitten accessories in one row, each centered in its own space, at the same pixel scale and the same size as the hats and glasses in the attached sheet so they would fit the big kitten in the attached image, all seen from the front, with NO kitten. The first four sit on top of the head, drawn with their bottom edge flat where they rest on the head: 1. a little acorn-cap hat, brown and scaly like a real acorn cup, with a tiny stem on top and one small green oak leaf; 2. a red pirate bandana tied on the head, with small white dots and a short knot with two little tails on one side; 3. a pink tulip flower worn as a hat, upside down like a little bell with two small green leaves; 4. a train conductor's cap in soft red with a short black peak and a thin pale-yellow band around it. The fifth goes over the eyes: 5. brown leather aviator goggles with two round green-tinted lenses and a soft strap. No bright orange, no strong blue and no pure gold in any item. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between items, no floor, no cast shadow, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```

## 2. Cuello

- **Adjuntar:** el gatito grande y la lámina de piezas del armario: sus bufandas, en la fila de abajo, son la forma y el tamaño que hay que copiar.
- **Formato:** horizontal 16:9.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly ten separate kitten neck accessories in two rows of five, each centered in its own space, at the same pixel scale and the same size as the scarves in the bottom row of the attached sheet so they would fit around the neck of the big kitten in the attached image, all seen from the front, with NO kitten. Each one is shaped as if worn around an invisible kitten neck: a soft band gently curved like a smile, open at the back, NOT a closed ring, NOT a donut and NOT a tube, with no hole and no inner rim visible. Row 1: 1. a soft sky-blue neckerchief tied with a small knot, its point hanging down in front, with one little white daisy on it; 2. a purple leather collar with tiny studs and a small violet amethyst gem hanging in front; 3. a green knitted scarf with small cream stars and a tiny moon, two short ends hanging on one side; 4. a big pastel rainbow bow tied at the front of a thin collar, with a small yellow star in its middle; 5. a coral neckerchief with thin white stripes and a little pink seashell in front. Row 2: 6. a necklace of green tropical leaves with a small cream spiral seashell in front; 7. a soft lilac knitted scarf with short fringes on both ends; 8. a green knitted scarf with one big white snowflake, two short ends hanging on one side; 9. a turquoise neckerchief with tiny white patterns and a small pale-yellow sun charm in front; 10. a small turquoise bow tie on a thin collar. No bright orange, no strong blue and no pure gold in any item. Plain flat solid pure green background (#00FF00) behind and between all elements, generous empty space between items, no floor, no cast shadow, no bright green anywhere in the items. No text, no letters, no numbers, no labels, no watermark.
```

## 3. Espalda

- **Adjuntar:** el gatito grande y las capas del armario (`public/assets/sprites/casa-capas-v1.webp`): son la forma y el tamaño que hay que copiar.
- **Formato:** horizontal 16:9.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat warm colors with at most two shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients inside shapes. Everything original, simple and friendly, nothing copied from any game. A sprite sheet with exactly two separate capes side by side, each centered in its own half, with NO kitten, with the same shape, size and pixel scale as the capes in the attached sheet: seen from the front as if worn by the sitting kitten in the attached image, a small round clasp at the top center, then the cape spreading out to both sides like a bell and falling down, drawn complete and solid with no hole in the middle. 1. a short deep-maroon cape with small pale-yellow stars and a little crescent-moon clasp with a lilac gem; 2. a soft pale-yellow capelet shaped like two little folded wings, with white feather edges and a round light-blue gem with a tiny star as the clasp. No bright orange, no strong blue and no pure gold. Plain flat solid pure green background (#00FF00) behind and between both capes, generous empty space between them, no floor, no cast shadow, no bright green anywhere in the capes. No text, no letters, no numbers, no labels, no watermark.
```
