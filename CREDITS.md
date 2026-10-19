# Créditos y licencias

## Música

Las pistas `manzanos.mp3`, `gatitos.mp3` y `lobos.mp3` proceden del paquete [Platformer Chiptunes](https://opengameart.org/content/platformer-chiptunes), de Guy G. Gamerson.

- Licencia declarada por el autor: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).
- Archivos originales: `stage1.mp3`, `stage2.mp3` y `stage3.mp3`.
- El cuarto mundo reutiliza `lobos.mp3` y el quinto reutiliza `manzanos.mp3`; no incorporan pistas con otra licencia.
- Descargados el 3 de octubre de 2026.

La pista `castillo.wav` del sexto mundo es una composición original sintetizada para Super Noa mediante `scripts/build-castle-music.mjs`; no emplea muestras ni melodías de terceros.

La pista `laguna.wav` del mundo acuático es una composición original sintetizada para Super Noa mediante `scripts/build-water-music.mjs`; no emplea muestras ni melodías de terceros.

La pista `jurasico.wav` de la isla de los dinosaurios es una composición original sintetizada para Super Noa mediante `scripts/build-dinosaur-music.mjs`; no emplea muestras ni melodías de terceros.

La atribución no es obligatoria bajo CC0, pero se conserva por cortesía y trazabilidad.

### Música original de las últimas tres aventuras

Las siguientes composiciones se han creado específicamente para Super Noa mediante `scripts/build-adventure-music.mjs`. Sus partituras, armonías, arreglos y sonidos son originales: no utilizan grabaciones, muestras, melodías ni personajes de juegos comerciales. La mención de CC0 anterior corresponde al paquete de Guy G. Gamerson; estas pistas no proceden de ese paquete ni alteran su atribución o licencia.

| Archivo en `public/assets/music/` | Título | Compás y tempo | Tonalidad y carácter | Duración decodificada | Tamaño |
| --- | --- | --- | --- | --- | --- |
| `volcan.mp3` | Dragones de caramelo | 4/4, 108 BPM | Do mayor / La menor; aventura cálida con voz de pulso suavizado, bajo redondo, toms melódicos y arpegios de brasas | 71,111 s | 695,9 KiB |
| `valle.mp3` | El vals de las flores gigantes | 3/4, 96 BPM | Fa mayor; marimba de triángulo, pequeños acordes de vals, pasos graves de gigantes amables y semillas tintineantes | 60,000 s | 587,3 KiB |
| `hielo.mp3` | Patines de cristal | 4/4, 90 BPM | Re mayor / Si menor; campanas redondeadas, celesta arpegiada y acordes sostenidos como nieve | 85,333 s | 834,6 KiB |

- Composición y síntesis: originales de Super Noa, generadas localmente con Node.js; codificación con FFmpeg y `libmp3lame`. No se han empleado servicios externos ni recursos musicales ajenos.
- Cada pieza tiene su propia melodía y progresión, 32 compases y dos vueltas con pequeñas variaciones de arreglo. Las ondas contienen pocos armónicos, con ataques y salidas suaves, sin ruido explosivo ni efectos de susto.
- Formato: MP3 estéreo, 32 kHz, 80 kbit/s, menos de 1 MiB por pista, reproducible mediante HTMLAudio. Los metadatos ID3 incluyen título, proyecto, composición original, BPM, tonalidad, estilo y compás.
- Las colas y los ecos se mezclan circularmente, sin fundido general ni silencio añadido entre vueltas. La cabecera Xing/LAME conserva la compensación del retardo y del relleno del codificador; la continuidad exacta de la reproducción repetida depende también del navegador y su implementación de HTMLAudio.
- La validación sobre los MP3 decodificados confirma cero muestras recortadas, picos de −3,79 dBFS y niveles RMS respectivos de −17,52, −17,54 y −16,20 dBFS. El salto máximo de muestra en la unión es inferior a 0,004 y el cambio de pendiente inferior a 0,006 (escala normalizada ±1). Se comprueba también que la unión conserva sonido y que su ataque energético es coherente con los otros inicios de compás.

Generación reproducible desde la raíz del repositorio (Node.js, `ffmpeg` con `libmp3lame` y `ffprobe` instalados):

```bash
node scripts/build-adventure-music.mjs
node scripts/build-adventure-music.mjs --check
```

El primer comando genera las tres pistas y las verifica; el segundo solo verifica los archivos existentes. Ambos comprueban formato, duración musical exacta tras compensar el retardo MP3, tamaño, metadatos de título, nivel medio, margen de pico, clipping y continuidad de la unión. Los errores terminan con código distinto de cero. Todo el PCM se procesa en memoria: no se guardan WAV ni archivos intermedios. Con las mismas versiones de Node.js, FFmpeg y `libmp3lame`, la generación es determinista.

## Recursos originales del proyecto

- Diseño de Noa: interpretación pixelada original creada para Super Noa a partir de referencias privadas. Las fotografías no se distribuyen ni forman parte del repositorio.
- Gestos de Noa para los duelos: cuatro sprites originales derivados únicamente de la hoja pixelada del personaje, sin reutilizar las fotografías privadas.
- Escenarios, objetos, enemigos e interfaz: creados específicamente para Super Noa.
- Insignias troqueladas de los siete mundos, postales y gatitos de recuerdo, y coraza dorada de Noa: recursos pixel art originales generados para este proyecto. La coraza dorada se utiliza cuando Noa está protegida.
- Monstruos finales: Rey Zarzal, Condesa Niebla, Gran Lobo, Gran Jabalí, Capitán Celeste, Conde Vampiro y Reina Arcoíris son diseños pixelados originales generados para Super Noa. No copian personajes de Nintendo, Sega ni de otros juegos.
- Efectos de sonido: sintetizados en tiempo real mediante Web Audio API.
- Mundo acuático: fondos, terreno, peces, erizos, gatita Perla, pegatinas, gestos de nado de Noa y Don Aleta son recursos originales creados para Super Noa.
- El muro de arrecife transparente `sea-reef-wall-v2.png` es un recorte original generado para este proyecto a partir del atlas acuático propio; el proceso y el prompt están en `WATER_ART.md`.
- Las nuevas ilustraciones panorámicas del mapa para los mundos 1–5 son versiones originales de las escenas de Super Noa; sus descripciones de generación están en `MAP_ART.md`.
- El paisaje continuo `noa-adventure-map-v1.png` es una ilustración original generada para el mapa interactivo de Super Noa. Los caminos, marcadores y cuadros de mundo son interfaz del juego, no elementos copiados ni incrustados en la imagen. Su descripción de generación está en `MAP_ART.md`.
