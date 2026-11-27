# Trajes de Noa: dossier de arte

Mapa: [Trajes para los viajes de Noa](https://github.com/Mocheto/super-noa/issues/471). Cómo es cada traje: [decisión de los poderes](https://github.com/Mocheto/super-noa/issues/472). En curso: [prueba de arte](https://github.com/Mocheto/super-noa/issues/473), con la caballera (la más difícil: si sale ella, salen las demás).

## Qué se está probando

Si un traje sale igual en sus 18 dibujos: quieta, cuatro de correr, salto, cuatro de gata, cuatro de nadar y cuatro gestos del duelo. Receta a prueba: **primero se aprueba la caballera quieta** y todo lo demás se pide adjuntando ese dibujo (solo uno, ampliado sobre verde y con el formato de salida).

| Paso | Lámina | Adjuntar | Guardar como |
|---|---|---|---|
| 1 | Caballera quieta | `noa-quieta.png` | `caballera-quieta.png` |
| 2 | Corriendo | `caballera-16x9.png` | `caballera-correr.png` |
| 3 | Salto | `caballera-1x1.png` | `caballera-salto.png` |
| 4 | Con el poder de gata | `caballera-16x9.png` | `caballera-gata.png` |
| 5 | Nadando | `caballera-1x1.png` | `caballera-nadar.png` |
| 6 | Gestos del duelo | `caballera-16x9.png` | `caballera-gestos.png` |
| 7 | Solo las tijeras | `caballera-piedra.png` | `caballera-tijera.png` |

**Resultado (27-11-2026): la prueba sale.** Los 18 dibujos de la caballera son coherentes y están montados.

Receta que queda:
1. Generar y aprobar la quieta, adjuntando `noa-quieta.png`.
2. Pedir todo lo demás adjuntando solo esa quieta aprobada, recompuesta en el formato de salida.
3. Si un gesto sale hacia el otro lado, repetirlo solo, adjuntando otro gesto bueno y cambiando la mano.
4. El nado, sin las palabras «little girl», «16-bit game», «swim» ni «water»: el generador rechazó la petición.
5. En correr, las cuatro salen parecidas; las del peto también lo son, así que vale mientras cambien las piernas.
6. Recortar con `prototypes/tools/trajes-recorte.py` (cada dibujo ocupa el sitio del dibujo del peto) y apuntar el traje en `ARTE_TRAJES`.

**Montados los tres trajes y encendidos el 27-11-2026.** Exploradora y pirata salieron a la primera. Arreglos en el recorte: en la pirata, la tercera de correr (abierta de piernas en el aire) se cambia por la primera; las piezas de una lámina se reparten por su centro, y los dibujos que se tocan se separan por `CORTES`. La gata pirata al lanzar salió sin cola (se ve solo un instante).

Peso: 1830 KB los once archivos de la caballera (5302 KB los del peto). Se usaron `caballera-correr.png` (segundo intento) y `caballera-tijera` (aparte).

Los adjuntos y los originales van fuera del repositorio, en `../super-noa-arte-original/trajes-v1/` (adjuntos en `referencias/`). Un adjunto nuevo se prepara con `prototypes/tools/trajes-referencia.py`.

## 1. Caballera quieta

Adjunta `noa-quieta.png`. Formato vertical 3:4. Un solo dibujo.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two or three shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Redraw the little girl in the attached image wearing a new outfit. Keep her EXACTLY the same: same face, big brown eyes, rosy cheeks, loose wavy brown hair, the small red apple hair clip with a green leaf on the same side, same skin tone, same head-to-body proportions, same size, same standing pose, same three-quarter view facing right, same drawing style and outline thickness. Change only her clothes. New outfit: a friendly child knight with light SILVER armor (a rounded breastplate with a small blue heart in the center, two small rounded shoulder plates, chunky silver boots), over a short royal-blue skirt and short blue sleeves, bare arms and hands, a thin silver headband across her fringe. Silver colors: light #E8EEF7, mid #AEB9CC, shadow #6B7690; blue #2F5FD0 with shadow #1E3A8A. NO helmet, NO cape, NO sword, NO shield, NO gold or yellow anywhere on the armor. The hair, face and apple clip stay fully visible. Only one drawing, the whole body, large and centered. Plain flat solid pure green background (#00FF00), no floor, no cast shadow, no bright green on the character, no text, no letters, no numbers, no watermark.
```

**Para darla por buena:** es Noa (cara, pelo y manzana), la armadura es plateada sin nada dorado, no lleva casco ni capa y se distingue bien a tamaño pequeño.

## 2. Corriendo

Adjunta `caballera-16x9.png`. Formato horizontal 16:9. Cuatro poses de carrera, en una fila.

```text
Pixel art sprite sheet with thick dark-plum outlines (#2f1d33), flat colors, two or three shading tones, crisp hard pixel edges. Use the cartoon character from the attached image and keep the same face, hair, red apple hair clip, silver headband, silver chest piece with a small blue heart, royal-blue sleeves and skirt, silver boots, proportions and drawing style. A run cycle: exactly four drawings in one horizontal row, same size, side three-quarter view facing right. The legs must look clearly different from one drawing to the next: 1. LONG STRIDE: legs wide apart like an open pair of scissors, front boot touching the ground far ahead, back boot far behind; 2. LEGS TOGETHER: standing on one straight leg right under the body, the other knee bent with its boot raised high behind; 3. LONG STRIDE IN THE AIR: both boots off the ground, front knee raised high and forward, back leg stretched straight behind; 4. CROUCHED PASSING STEP: knees close together and bent, one knee coming forward. The arms swing opposite to the legs and change in every drawing. Plain flat solid pure green background (#00FF00), generous empty space between drawings, no scenery, no text, no watermark.
```

## 3. Salto

Adjunta `caballera-1x1.png`. Formato cuadrado. Un solo dibujo.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two or three shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. The little girl in the attached image. Match her EXACTLY in every drawing: same face, big brown eyes, rosy cheeks, loose wavy brown hair, small red apple hair clip with a green leaf, thin silver headband, light silver rounded breastplate with a small blue heart, two small silver shoulder plates, two small silver hip plates, short royal-blue skirt and short blue sleeves, bare arms and hands, chunky silver boots, same head-to-body proportions and drawing style. Silver colors: light #E8EEF7, mid #AEB9CC, shadow #6B7690; blue #2F5FD0 with shadow #1E3A8A. NO helmet, NO cape, NO sword, NO shield, NO gold or yellow on her clothes. Only ONE drawing, the whole body, large and centered, facing right: a happy jump in mid-air, both fists raised high on both sides of her head, one knee forward and the other leg kicked back, joyful open mouth, hair flying. Plain flat solid pure green background (#00FF00) behind and between all drawings, very generous empty space so none of them touch, no floor, no cast shadow, no motion lines, no bright green on the character, no text, no letters, no numbers, no labels, no grid lines, no watermark.
```

## 4. Con el poder de gata

Adjunta `caballera-16x9.png`. Formato horizontal 16:9. Cuatro poses de gata, en una fila.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two or three shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. The little girl in the attached image. Match her EXACTLY in every drawing: same face, big brown eyes, rosy cheeks, loose wavy brown hair, small red apple hair clip with a green leaf, thin silver headband, light silver rounded breastplate with a small blue heart, two small silver shoulder plates, two small silver hip plates, short royal-blue skirt and short blue sleeves, bare arms and hands, chunky silver boots, same head-to-body proportions and drawing style. Silver colors: light #E8EEF7, mid #AEB9CC, shadow #6B7690; blue #2F5FD0 with shadow #1E3A8A. NO helmet, NO cape, NO sword, NO shield, NO gold or yellow on her clothes. In every drawing she also wears cat ears and a cat tail: two pointed royal-blue ears (#2F5FD0) with light-blue insides (#9CC3FF) on top of her head, in front of the headband, and a long curled royal-blue tail with a lighter tip. Draw exactly four separate drawings of the SAME girl in one horizontal row, all at the same size, facing right: 1. standing still, hugging a big lilac ball of yarn (#B57BE0) against her chest with both arms, soft smile; 2. running, arms swinging, tail streaming behind; 3. jumping in mid-air with both fists raised and a joyful open mouth; 4. throwing: legs apart in a lunge, both arms stretched forward with open hands, and a small lilac ball of yarn flying just in front of her hands. Plain flat solid pure green background (#00FF00) behind and between all drawings, very generous empty space so none of them touch, no floor, no cast shadow, no motion lines, no bright green on the character, no text, no letters, no numbers, no labels, no grid lines, no watermark.
```

## 5. Nadando

Adjunta `caballera-1x1.png`. Formato cuadrado. Cuatro poses nadando, en dos filas de dos.

```text
Pixel art sprite sheet with thick dark-plum outlines (#2f1d33), flat colors, two or three shading tones, crisp hard pixel edges. Use the cartoon character from the attached image and keep the same face, hair, red apple hair clip, silver headband, silver chest piece with a small blue heart, royal-blue sleeves and skirt, silver boots, proportions and drawing style. Four drawings in two rows of two, all the same size. In each one the character is floating horizontally, seen from the side, head to the right and boots to the left, as if gliding forward, with a cheerful open smile and the hair flowing back. Top row: 1. both arms stretched forward; 2. one arm stretched forward, the other bent back beside the body. Bottom row: 3 and 4 repeat the two top poses, adding two pointed royal-blue cat ears with light-blue insides and a long curled royal-blue cat tail. Plain flat solid pure green background (#00FF00), generous empty space between drawings, no scenery, no text, no watermark.
```

## 6. Gestos del duelo

Adjunta `caballera-16x9.png`. Formato horizontal 16:9. Cuatro gestos, en una fila.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two or three shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. The little girl in the attached image. Match her EXACTLY in every drawing: same face, big brown eyes, rosy cheeks, loose wavy brown hair, small red apple hair clip with a green leaf, thin silver headband, light silver rounded breastplate with a small blue heart, two small silver shoulder plates, two small silver hip plates, short royal-blue skirt and short blue sleeves, bare arms and hands, chunky silver boots, same head-to-body proportions and drawing style. Silver colors: light #E8EEF7, mid #AEB9CC, shadow #6B7690; blue #2F5FD0 with shadow #1E3A8A. NO helmet, NO cape, NO sword, NO shield, NO gold or yellow on her clothes. Draw exactly four separate drawings of the SAME girl in one horizontal row, all at the same size, facing right: playing rock, paper, scissors, in three-quarter view, the playing hand big and very clear. 1. feet apart, one closed fist (rock) held forward, confident smile; 2. feet apart, one open hand with five fingers spread (paper) held forward, happy open mouth; 3. feet apart, scissors: index and middle finger making a V held forward, winking; 4. victory: jumping with both fists raised, eyes closed laughing, and two small yellow five-pointed stars beside her head. Drawings 1, 2 and 3 have exactly the same stance and differ only in the hand and face. Plain flat solid pure green background (#00FF00) behind and between all drawings, very generous empty space so none of them touch, no floor, no cast shadow, no motion lines, no bright green on the character, no text, no letters, no numbers, no labels, no grid lines, no watermark.
```

## 5 bis. Nadando, en dos tandas

Si el paso 5 se rechaza. Adjunta `caballera-1x1.png`. Formato horizontal 16:9. Primero sin gata; para las de gata, la misma petición añadiendo al final: `Both drawings add two pointed royal-blue cat ears and a long curled royal-blue cat tail.`

```text
Pixel art sprite sheet with thick dark-plum outlines (#2f1d33), flat colors, two or three shading tones, crisp hard pixel edges. Use the cartoon character from the attached image and keep the same face, hair, red apple hair clip, silver headband, silver chest piece with a small blue heart, royal-blue sleeves and skirt, silver boots, proportions and drawing style. Two drawings side by side, same size. In both the character is floating horizontally, seen from the side, head to the right and boots to the left, as if gliding forward, cheerful smile, hair flowing back. 1. both arms stretched forward; 2. one arm stretched forward, the other bent back beside the body. Plain flat solid pure green background (#00FF00), generous empty space between drawings, no scenery, no text, no watermark.
```

## 7. Solo las tijeras

Adjunta `caballera-piedra.png`. Formato vertical 3:4. Un solo dibujo.

```text
Pixel art sprite sheet with thick dark-plum outlines (#2f1d33), flat colors, two or three shading tones, crisp hard pixel edges. Use the cartoon character from the attached image and keep the same face, hair, red apple hair clip, silver headband, silver chest piece with a small blue heart, royal-blue sleeves and skirt, silver boots, proportions and drawing style. One single drawing, exactly the same pose, stance, view and size as the attached image. Change only two things: the raised hand on the right side of the picture now shows two fingers in a V shape (index and middle finger) instead of a closed fist, and one eye winks. Everything else stays identical and the character still faces right. Plain flat solid pure green background (#00FF00), generous empty space between drawings, no scenery, no text, no watermark.
```

---

# Traje: exploradora

Guarda cada lámina como `exploradora-<paso>` (el nombre de la columna) en `../super-noa-arte-original/trajes-v1/`. **Aprueba primero la quieta**: los adjuntos `exploradora-16x9.png` y `exploradora-1x1.png` se preparan a partir de ella.

## Exploradora 1. Quieta (`exploradora-quieta`)

Adjunta `noa-quieta.png`. Formato vertical 3:4. Un solo dibujo.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two or three shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Redraw the little girl in the attached image wearing a new outfit. Keep her EXACTLY the same: same face, big brown eyes, rosy cheeks, loose wavy brown hair, the small red apple hair clip with a green leaf on the same side, same skin tone, same head-to-body proportions, same size, same standing pose, same three-quarter view facing right, same drawing style and outline thickness. Change only her clothes. New outfit: a young explorer outfit: a sand-colored short-sleeved shirt, a green neckerchief tied at the neck, brown shorts, brown boots with short cream socks, a small brown backpack, and a wide-brimmed sand-colored explorer hat with a brown band, pushed back on her head so that her fringe, her face and the apple clip stay fully visible. Colors: sand #D9B779 with shadow #A8834A; green #3E9B52 with shadow #26663A; browns #8A5A34 and #5C3A22. NO weapons, NO binoculars, NO map in her hands. Only one drawing, the whole body, large and centered. Plain flat solid pure green background (#00FF00), no floor, no cast shadow, no bright green on the character, no text, no letters, no numbers, no watermark.
```

## Exploradora 2. Corriendo (`exploradora-correr`)

Adjunta `exploradora-16x9.png`. Formato horizontal 16:9.

```text
Pixel art sprite sheet with thick dark-plum outlines (#2f1d33), flat colors, two or three shading tones, crisp hard pixel edges. Use the cartoon character from the attached image and keep the same face, hair, red apple hair clip, wide-brimmed sand-colored explorer hat pushed back, sand-colored short-sleeved shirt, green neckerchief, brown shorts, brown boots with cream socks and a small brown backpack, proportions and drawing style. NO weapons, NO binoculars, NO map in her hands. A run cycle. Exactly four drawings of the SAME character in one horizontal row, all the same size, facing right: the legs must look clearly different from one drawing to the next: 1. long stride, legs wide apart, front boot touching the ground far ahead; 2. standing on one straight leg, the other knee bent with its boot raised high behind; 3. long stride in the air, both boots off the ground; 4. knees close together and bent, one knee coming forward. The arms swing opposite to the legs. Plain flat solid pure green background (#00FF00), generous empty space between drawings, no scenery, no text, no watermark.
```

## Exploradora 3. Salto (`exploradora-salto`)

Adjunta `exploradora-1x1.png`. Formato cuadrado. Un solo dibujo.

```text
Pixel art sprite sheet with thick dark-plum outlines (#2f1d33), flat colors, two or three shading tones, crisp hard pixel edges. Use the cartoon character from the attached image and keep the same face, hair, red apple hair clip, wide-brimmed sand-colored explorer hat pushed back, sand-colored short-sleeved shirt, green neckerchief, brown shorts, brown boots with cream socks and a small brown backpack, proportions and drawing style. NO weapons, NO binoculars, NO map in her hands. Only one drawing, large and centered, facing right: a happy jump in mid-air, both fists raised high beside the head, one knee forward and the other leg kicked back, joyful open mouth, hair flying. Plain flat solid pure green background (#00FF00), generous empty space between drawings, no scenery, no text, no watermark.
```

## Exploradora 4. Con el poder de gata (`exploradora-gata`)

Adjunta `exploradora-16x9.png`. Formato horizontal 16:9.

```text
Pixel art sprite sheet with thick dark-plum outlines (#2f1d33), flat colors, two or three shading tones, crisp hard pixel edges. Use the cartoon character from the attached image and keep the same face, hair, red apple hair clip, wide-brimmed sand-colored explorer hat pushed back, sand-colored short-sleeved shirt, green neckerchief, brown shorts, brown boots with cream socks and a small brown backpack, proportions and drawing style. NO weapons, NO binoculars, NO map in her hands. In every drawing the character also wears two pointed sand-colored (#D9B779) ears with cream insides (#F6E7C4), poking up beside the hat, and a long curled sand-colored (#D9B779) tail with a cream tip. Exactly four drawings of the SAME character in one horizontal row, all the same size, facing right: 1. standing still, hugging a big lilac ball of yarn (#B57BE0) with both arms; 2. running, tail streaming behind; 3. jumping with both fists raised and a joyful open mouth; 4. legs apart in a lunge, both arms stretched forward with open hands, a small lilac ball of yarn flying just in front of them. Plain flat solid pure green background (#00FF00), generous empty space between drawings, no scenery, no text, no watermark.
```

## Exploradora 5. Nadando (`exploradora-nadar`)

Adjunta `exploradora-1x1.png`. Formato cuadrado. Dos filas de dos.

```text
Pixel art sprite sheet with thick dark-plum outlines (#2f1d33), flat colors, two or three shading tones, crisp hard pixel edges. Use the cartoon character from the attached image and keep the same face, hair, red apple hair clip, wide-brimmed sand-colored explorer hat pushed back, sand-colored short-sleeved shirt, green neckerchief, brown shorts, brown boots with cream socks and a small brown backpack, proportions and drawing style. NO weapons, NO binoculars, NO map in her hands. Four drawings in two rows of two, all the same size. In each one the character is floating horizontally, seen from the side, head to the right and boots to the left, as if gliding forward, cheerful open smile, hair flowing back. Top row: 1. both arms stretched forward; 2. one arm stretched forward, the other bent back beside the body. Bottom row: 3 and 4 repeat the two top poses, adding two pointed sand-colored (#D9B779) ears with cream insides (#F6E7C4), poking up beside the hat, and a long curled sand-colored (#D9B779) tail with a cream tip. Plain flat solid pure green background (#00FF00), generous empty space between drawings, no scenery, no text, no watermark.
```

## Exploradora 6. Gestos del duelo (`exploradora-gestos`)

Adjunta `exploradora-16x9.png`. Formato horizontal 16:9.

```text
Pixel art sprite sheet with thick dark-plum outlines (#2f1d33), flat colors, two or three shading tones, crisp hard pixel edges. Use the cartoon character from the attached image and keep the same face, hair, red apple hair clip, wide-brimmed sand-colored explorer hat pushed back, sand-colored short-sleeved shirt, green neckerchief, brown shorts, brown boots with cream socks and a small brown backpack, proportions and drawing style. NO weapons, NO binoculars, NO map in her hands. Exactly four drawings of the SAME character in one horizontal row, all the same size, facing right: playing rock, paper, scissors, three-quarter view, the playing hand always on the RIGHT side of the drawing, big and very clear: 1. feet apart, a closed fist held out to the right, confident smile; 2. same stance, an open hand with five fingers spread held out to the right, happy open mouth; 3. same stance, two fingers in a V held out to the right, one eye winking; 4. victory: jumping with both fists raised, eyes closed laughing, two small yellow stars beside the head. Plain flat solid pure green background (#00FF00), generous empty space between drawings, no scenery, no text, no watermark.
```

---

# Traje: pirata

Guarda cada lámina como `pirata-<paso>` (el nombre de la columna) en `../super-noa-arte-original/trajes-v1/`. **Aprueba primero la quieta**: los adjuntos `pirata-16x9.png` y `pirata-1x1.png` se preparan a partir de ella.

## Pirata 1. Quieta (`pirata-quieta`)

Adjunta `noa-quieta.png`. Formato vertical 3:4. Un solo dibujo.

```text
Chunky, readable pixel art in the style of a charming 16-bit game for young children: bold dark-plum outlines (#2f1d33), flat colors with at most two or three shading tones, rounded cute shapes, crisp hard pixel edges, no blur, no anti-aliasing, no gradients. Redraw the little girl in the attached image wearing a new outfit. Keep her EXACTLY the same: same face, big brown eyes, rosy cheeks, loose wavy brown hair, the small red apple hair clip with a green leaf on the same side, same skin tone, same head-to-body proportions, same size, same standing pose, same three-quarter view facing right, same drawing style and outline thickness. Change only her clothes. New outfit: a friendly child pirate outfit: a short-sleeved shirt with red and white horizontal stripes, a dark open vest, a dark skirt with a wide brown belt, brown boots, and a red kerchief tied over the top of her head, so that her fringe, her face and the apple clip stay fully visible. Colors: red #D6383E with shadow #8E1F2C; white #FFF4E6; vest and skirt #3A3350 with shadow #241F36; browns #8A5A34 and #5C3A22. NO eye patch, NO sword, NO hook, NO skull, NO tricorn hat. Only one drawing, the whole body, large and centered. Plain flat solid pure green background (#00FF00), no floor, no cast shadow, no bright green on the character, no text, no letters, no numbers, no watermark.
```

## Pirata 2. Corriendo (`pirata-correr`)

Adjunta `pirata-16x9.png`. Formato horizontal 16:9.

```text
Pixel art sprite sheet with thick dark-plum outlines (#2f1d33), flat colors, two or three shading tones, crisp hard pixel edges. Use the cartoon character from the attached image and keep the same face, hair, red apple hair clip, red kerchief tied over her head, short-sleeved red-and-white striped shirt, dark open vest, dark skirt with a wide brown belt and brown boots, proportions and drawing style. NO eye patch, NO sword, NO hook, NO skull, NO tricorn hat. A run cycle. Exactly four drawings of the SAME character in one horizontal row, all the same size, facing right: the legs must look clearly different from one drawing to the next: 1. long stride, legs wide apart, front boot touching the ground far ahead; 2. standing on one straight leg, the other knee bent with its boot raised high behind; 3. long stride in the air, both boots off the ground; 4. knees close together and bent, one knee coming forward. The arms swing opposite to the legs. Plain flat solid pure green background (#00FF00), generous empty space between drawings, no scenery, no text, no watermark.
```

## Pirata 3. Salto (`pirata-salto`)

Adjunta `pirata-1x1.png`. Formato cuadrado. Un solo dibujo.

```text
Pixel art sprite sheet with thick dark-plum outlines (#2f1d33), flat colors, two or three shading tones, crisp hard pixel edges. Use the cartoon character from the attached image and keep the same face, hair, red apple hair clip, red kerchief tied over her head, short-sleeved red-and-white striped shirt, dark open vest, dark skirt with a wide brown belt and brown boots, proportions and drawing style. NO eye patch, NO sword, NO hook, NO skull, NO tricorn hat. Only one drawing, large and centered, facing right: a happy jump in mid-air, both fists raised high beside the head, one knee forward and the other leg kicked back, joyful open mouth, hair flying. Plain flat solid pure green background (#00FF00), generous empty space between drawings, no scenery, no text, no watermark.
```

## Pirata 4. Con el poder de gata (`pirata-gata`)

Adjunta `pirata-16x9.png`. Formato horizontal 16:9.

```text
Pixel art sprite sheet with thick dark-plum outlines (#2f1d33), flat colors, two or three shading tones, crisp hard pixel edges. Use the cartoon character from the attached image and keep the same face, hair, red apple hair clip, red kerchief tied over her head, short-sleeved red-and-white striped shirt, dark open vest, dark skirt with a wide brown belt and brown boots, proportions and drawing style. NO eye patch, NO sword, NO hook, NO skull, NO tricorn hat. In every drawing the character also wears two pointed red (#D6383E) ears with pink insides (#FF9AA2), poking up through the kerchief, and a long curled red (#D6383E) tail with a pink tip. Exactly four drawings of the SAME character in one horizontal row, all the same size, facing right: 1. standing still, hugging a big lilac ball of yarn (#B57BE0) with both arms; 2. running, tail streaming behind; 3. jumping with both fists raised and a joyful open mouth; 4. legs apart in a lunge, both arms stretched forward with open hands, a small lilac ball of yarn flying just in front of them. Plain flat solid pure green background (#00FF00), generous empty space between drawings, no scenery, no text, no watermark.
```

## Pirata 5. Nadando (`pirata-nadar`)

Adjunta `pirata-1x1.png`. Formato cuadrado. Dos filas de dos.

```text
Pixel art sprite sheet with thick dark-plum outlines (#2f1d33), flat colors, two or three shading tones, crisp hard pixel edges. Use the cartoon character from the attached image and keep the same face, hair, red apple hair clip, red kerchief tied over her head, short-sleeved red-and-white striped shirt, dark open vest, dark skirt with a wide brown belt and brown boots, proportions and drawing style. NO eye patch, NO sword, NO hook, NO skull, NO tricorn hat. Four drawings in two rows of two, all the same size. In each one the character is floating horizontally, seen from the side, head to the right and boots to the left, as if gliding forward, cheerful open smile, hair flowing back. Top row: 1. both arms stretched forward; 2. one arm stretched forward, the other bent back beside the body. Bottom row: 3 and 4 repeat the two top poses, adding two pointed red (#D6383E) ears with pink insides (#FF9AA2), poking up through the kerchief, and a long curled red (#D6383E) tail with a pink tip. Plain flat solid pure green background (#00FF00), generous empty space between drawings, no scenery, no text, no watermark.
```

## Pirata 6. Gestos del duelo (`pirata-gestos`)

Adjunta `pirata-16x9.png`. Formato horizontal 16:9.

```text
Pixel art sprite sheet with thick dark-plum outlines (#2f1d33), flat colors, two or three shading tones, crisp hard pixel edges. Use the cartoon character from the attached image and keep the same face, hair, red apple hair clip, red kerchief tied over her head, short-sleeved red-and-white striped shirt, dark open vest, dark skirt with a wide brown belt and brown boots, proportions and drawing style. NO eye patch, NO sword, NO hook, NO skull, NO tricorn hat. Exactly four drawings of the SAME character in one horizontal row, all the same size, facing right: playing rock, paper, scissors, three-quarter view, the playing hand always on the RIGHT side of the drawing, big and very clear: 1. feet apart, a closed fist held out to the right, confident smile; 2. same stance, an open hand with five fingers spread held out to the right, happy open mouth; 3. same stance, two fingers in a V held out to the right, one eye winking; 4. victory: jumping with both fists raised, eyes closed laughing, two small yellow stars beside the head. Plain flat solid pure green background (#00FF00), generous empty space between drawings, no scenery, no text, no watermark.
```
