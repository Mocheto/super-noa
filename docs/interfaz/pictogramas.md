# Pictogramas de Super Noa

Resolución de [Palabras con dibujo y estilo del atlas de pictogramas](https://github.com/Mocheto/super-noa/issues/104), en el mapa [Una interfaz para aprender a leer: HUD, menús, marcos y textos para Noa](https://github.com/Mocheto/super-noa/issues/99). Prototipo comparado: [Pictogramas de Super Noa](https://claude.ai/artifact/4ufjmy5f3TWyvdY5jxtu3x), con su fuente en `prototypes/pictogramas/index.html`.

## Estilo elegido: B, como el arte del juego

**Objetos a color**:
- Rejilla de **24 × 24** píxeles.
- **Contorno ciruela** (`#3d1430`) de 1 píxel.
- Tres tonos con la luz arriba a la izquierda y un brillo blanco de 2 × 2.
- Carita amable (ojos cerrados y felices, mejillas rosas) solo en lo que tiene vida: gato, manzana, estrella, nube, flor, animales.
- Es el estilo de la manzana, el gato y el corazón que ya hay en `collectibles-v1.png` y `ui-heart-v1.png`.

**Controles en un solo color**:
- Misma rejilla de 24 × 24, en blanco sobre transparente, sin contorno ni sombras.
- Se tiñen con el color del texto usando una máscara CSS.
- Así se distinguen de las cosas del juego.

**Mundos**: usan el icono que ya tienen en el mapa; no van en este atlas.

**Tamaño en pantalla**: siempre múltiplos enteros, con `image-rendering: pixelated`.

| Lugar | Escala | Tamaño final | Texto al lado |
|---|---|---|---|
| Palabra con dibujo | ×2 | 48 px | 24 px |
| HUD | ×1 | 24 px | 16 px |
| Botones | ×1 | 24 px | — |
| Colección y ventanas grandes | ×3 | 72 px | — |

El pictograma va **delante** de la palabra, centrado en vertical, con 8 px de separación.

## Lista de palabras con dibujo

51 en total: 36 objetos a color y 15 controles. Sale de la lista base de la [guía de escritura](guia-texto-noa.md). Una palabra nueva entra en la lista solo cuando tiene su dibujo en el atlas.

### Atlas a color: `public/assets/sprites/pictogramas-v1.png`

Seis columnas por seis filas. Cada celda mide 96 × 96 px en el archivo, es decir, la rejilla de 24 con cada píxel a 4 × 4. Fondo transparente. El orden es estable: el código recorta por posición.

| Fila | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| 1 | VIDAS (corazón) | MANZANA | PEGATINA (destello) | ESTRELLA | GATO | LANA |
| 2 | CAJA | BANDERA | META (bandera a cuadros) | SALA (puerta) | RETO (corona) | ¡BRAVO! (trofeo) |
| 3 | MARCO | NOA (cara de Noa) | AGUA (gota) | LAVA | HIELO | AIRE |
| 4 | FLOR | NUBE | ERIZO | PERRITO | MUSICA (nota) | REGALO |
| 5 | ENREDADERA | TREN (vagón) | MAPA | INICIO (casa) | ALBUM | AMIGOS (huella) |
| 6 | POSTAL (sobre) | FIESTA (confeti) | SECRETO (destello de cuatro puntas) | NO MUERDE (cara sonriente) | PISTA (bombilla) | CERRADO (candado) |

### Atlas de controles: `public/assets/sprites/pictogramas-controles-v1.png`

Cinco columnas por tres filas, con celdas de 96 × 96 px en blanco puro sobre transparente.

| Fila | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| 1 | JUGAR (triángulo ▶) | PAUSA (dos barras) | SONIDO (altavoz con ondas) | SIN SONIDO (altavoz con aspa) | OTRA VEZ (flecha circular ↺) |
| 2 | VUELVE (flecha curva ↩) | ¡SI! (marca ✓) | ¿? (interrogación) | AYUDA (interrogación en círculo) | ESPERA (reloj de arena) |
| 3 | PANTALLA GRANDE (cuatro esquinas) | CERRAR (aspa ✕) | SALTA (flecha arriba) | CAMINA (flechas ◀ ▶) | BUSCA (lupa) |

## Prompts para generar el arte

El arte se genera a mano con el generador de imágenes que se use. Conviene generarlo **fila a fila**, seis dibujos por imagen, recortarlo, reducirlo a la rejilla de 24 con el vecino más próximo, limpiar los píxeles sueltos y montarlo en el atlas. Nada de arte, personajes ni iconos de juegos comerciales.

### Prompt base, objetos a color

Se añade delante de cada fila:

```text
Pixel art game UI icon sheet, 6 icons in a single horizontal row, evenly spaced on a plain flat white background, each icon centered in its own square cell. Each icon is drawn on a strict 24x24 pixel grid, scaled up with crisp hard-edged square pixels, no anti-aliasing, no blur, no gradients, no dithering. Cute kawaii style for a 5-year-old girl's platform game: 1-pixel dark plum outline (#3d1430) around every shape, three flat shades per color with light coming from the top-left, one small 2x2 white highlight. Living things have a tiny happy face with closed curved eyes and pink cheeks. Bold, simple, instantly recognizable silhouettes, readable at 24 pixels. Saturated warm palette: red #e2313c, pink #f2264b, gold #ffd02e, lilac #a873d6, leaf green #5fb04f, sky blue #6aa0c8, cream #fff8e9. No text, no letters, no numbers, no shadows on the background, no frame.
```

### Filas

1. `Icons, left to right: a red heart; a red apple with a brown stem, a green leaf and a happy face; a sparkling sticker shaped like a four-point gold sparkle with a white border; a golden five-point star with a happy face; a lilac kitten head with a happy face; a pink ball of yarn with a loose thread.`
2. `Icons, left to right: a purple wooden crate with a small cat face on the front; a red triangular flag on a pole; a black-and-white checkered finish flag on a pole; a rounded wooden door with a golden knob; a golden crown with three points and lilac gems; a golden trophy cup with two handles.`
3. `Icons, left to right: a golden picture frame with a lilac star inside; the face of a smiling girl with short brown hair, a lilac hair bow and pink cheeks; a blue water drop with a happy face; a small orange-red lava blob with yellow bubbles; a pale blue ice cube with white shine; three curved white-and-sky-blue wind lines.`
4. `Icons, left to right: a pink five-petal flower with a yellow center and a happy face; a fluffy white cloud with a happy face; a small brown hedgehog with soft spikes and a happy face; a small beige puppy head with floppy ears and a happy face; a lilac double music note; a red gift box with a gold ribbon bow.`
5. `Icons, left to right: a curling green vine with three leaves; a small red train wagon with round windows; a folded treasure map in cream paper with a red dotted path and an X; a small house with a red roof and a round window; a closed lilac album book with a gold star on the cover; a lilac cat paw print.`
6. `Icons, left to right: a cream envelope with a red heart seal; colorful party confetti burst with streamers; a white four-point twinkle sparkle with a gold glow; a round yellow smiling face with pink cheeks; a yellow light bulb glowing; a golden padlock, closed.`

### Prompt base, controles

```text
Pixel art game UI control icon sheet, 5 icons in a single horizontal row, evenly spaced on a plain flat black background, each icon centered in its own square cell. Each icon is pure solid white, drawn on a strict 24x24 pixel grid, scaled up with crisp hard-edged square pixels, no anti-aliasing, no outline, no shading, no gradients. Thick 2-pixel strokes, bold and simple, readable at 24 pixels by a 5-year-old. No text, no letters, no numbers, no frame.
```

1. `Icons, left to right: a play triangle pointing right; a pause symbol with two vertical bars; a speaker with two sound waves; a speaker with a small X; a circular arrow turning counter-clockwise (replay).`
2. `Icons, left to right: a curved arrow pointing back to the left (return); a check mark; a question mark; a question mark inside a circle; an hourglass.`
3. `Icons, left to right: four corner brackets (fullscreen); an X (close); an arrow pointing up; two arrows pointing left and right; a magnifying glass.`

En los controles, el fondo negro se elimina después para dejar el blanco sobre transparente.

## Al ejecutar

- El atlas se completa poco a poco. `prototypes/tools/pictogramas-recorte.py` recorta cada lámina que sale del generador (una fila de dibujos, fondo blanco para los de color y negro para los controles), reduce cada dibujo a la rejilla de 24, lo amplía × 4 sin suavizar y lo pega en su celda; las demás celdas no se tocan. También escribe `src/textos/pictogramasDibujados.ts` con los nombres que ya tienen dibujo:

  ```bash
  uv run --with pillow --with numpy --with scipy python3 prototypes/tools/pictogramas-recorte.py --color LAMINA.jpg vidas,estrella,reto,flor,-,- --controles LAMINA.jpg salta,-,-,-,pausa
  ```

  Los nombres van en el orden de los dibujos de la lámina, y «-» salta un dibujo que no tiene casilla.
- `<Pictograma>` pinta la celda del atlas si el pictograma ya tiene dibujo y su emoji si todavía no. Los controles son una máscara blanca que toma el color del texto. En el lienzo (`textoLienzo`) siguen los emoji.
- El catálogo de textos expresa la palabra con dibujo como `{pictograma:manzana} MANZANA`. El nombre del pictograma coincide con la palabra de la lista, en minúsculas, sin tildes y con guiones (`no-muerde`, `sin-sonido`).
- Cada atlas nuevo lleva una prueba de recursos: tamaño 576 × 576 y 480 × 288, fondo transparente y celdas no vacías, como las de los demás atlas.
