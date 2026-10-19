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

### Música original del bosque y de las últimas tres aventuras

Las siguientes composiciones se han creado específicamente para Super Noa mediante `scripts/build-adventure-music.mjs`. Sus partituras, armonías, arreglos y sonidos son originales: no utilizan grabaciones, muestras, melodías ni personajes de juegos comerciales. La mención de CC0 anterior corresponde al paquete de Guy G. Gamerson; estas pistas no proceden de ese paquete ni alteran su atribución o licencia.

| Archivo en `public/assets/music/` | Título | Compás y tempo | Tonalidad y carácter | Duración decodificada | Tamaño |
| --- | --- | --- | --- | --- | --- |
| `volcan.mp3` | Dragones de caramelo | 4/4, 108 BPM | Do mayor / La menor; aventura cálida con voz de pulso suavizado, bajo redondo, toms melódicos y arpegios de brasas | 71,111 s | 695,9 KiB |
| `valle.mp3` | El vals de las flores gigantes | 3/4, 96 BPM | Fa mayor; marimba de triángulo, pequeños acordes de vals, pasos graves de gigantes amables y semillas tintineantes | 60,000 s | 587,3 KiB |
| `hielo.mp3` | Patines de cristal | 4/4, 90 BPM | Re mayor / Si menor; campanas redondeadas, celesta arpegiada y acordes sostenidos como nieve | 85,333 s | 834,6 KiB |
| `bosque-manzanos.mp3` | Brisa entre manzanos | 4/4, 84 BPM | Do mayor; paseo tranquilo entre manzanos, flauta senoidal de registro medio, arpa amortiguada y pad cálido, sin percusión | 91,429 s | 894,2 KiB |

- Composición y síntesis: originales de Super Noa, generadas localmente con Node.js; codificación con FFmpeg y `libmp3lame`. No se han empleado servicios externos ni recursos musicales ajenos.
- Cada pieza tiene su propia melodía y progresión, 32 compases y dos vueltas con pequeñas variaciones de arreglo. Las ondas contienen pocos armónicos, con ataques y salidas suaves, sin ruido explosivo ni efectos de susto.
- Formato: MP3 estéreo, 32 kHz, 80 kbit/s, menos de 1 MiB por pista, reproducible mediante HTMLAudio. Los metadatos ID3 incluyen título, proyecto, composición original, BPM, tonalidad, estilo y compás.
- Las colas y los ecos se mezclan circularmente, sin fundido general ni silencio añadido entre vueltas. La cabecera Xing/LAME conserva la compensación del retardo y del relleno del codificador; la continuidad exacta de la reproducción repetida depende también del navegador y su implementación de HTMLAudio.
- La validación sobre los tres MP3 de las últimas aventuras decodificados confirma cero muestras recortadas, picos de −3,79 dBFS y niveles RMS respectivos de −17,52, −17,54 y −16,20 dBFS. El salto máximo de muestra en la unión es inferior a 0,004 y el cambio de pendiente inferior a 0,006 (escala normalizada ±1). Se comprueba también que la unión conserva sonido y que su ataque energético es coherente con los otros inicios de compás.
- La nueva pieza del bosque usa una melodía propia entre Sol3 y La4, silencios y notas sostenidas sobre acordes mayores de Do, Fa y Sol. Sus sonidos se construyen con senos y unos pocos armónicos redondeados, sin ondas cuadradas o de sierra. El codificador limita además la banda a 3,2 kHz: la menor estridencia no depende solo de bajar el volumen. Su pico decodificado es −7,19 dBFS, su RMS −19,20 dBFS y tiene cero clipping; el salto de muestra del bucle es 0,00148 y el cambio de pendiente 0,00474.
- El generador mide la proporción de potencia por encima de 4 kHz mediante FFT local (espectro de Welch, ventanas Hann de 4096 muestras y 50 % de solape), decodificando ambos temas a mono y 32 kHz. La proporción es aproximadamente `1,160 × 10⁻⁸ %` en `bosque-manzanos.mp3`, frente al 1,8193 % de `manzanos.mp3`: una reducción espectral de 81,96 dB, independiente del nivel de reproducción. Es una medición de banda, no una medida de sonoridad percibida. La verificación exige menos de 0,1 % y al menos diez veces menos que la pista anterior.
- `bosque-manzanos.mp3` es un archivo nuevo para el primer mundo. Se conserva intacto `manzanos.mp3`, incluida su atribución CC0, para el mundo de los piratas. Las tres composiciones anteriores tampoco cambian.

Generación reproducible desde la raíz del repositorio (Node.js, `ffmpeg` con `libmp3lame` y `ffprobe` instalados):

```bash
node scripts/build-adventure-music.mjs
node scripts/build-adventure-music.mjs --check
node scripts/build-adventure-music.mjs --only=bosque-manzanos
node scripts/build-adventure-music.mjs --check --only=bosque-manzanos
```

El primer comando genera las cuatro pistas y las verifica; el segundo solo verifica los archivos existentes. `--only=nombre` permite generar o comprobar únicamente una de ellas, sin escribir las demás. Se comprueban formato, duración musical exacta tras compensar el retardo MP3, tamaño, metadatos de título, nivel medio, margen de pico, clipping y continuidad de la unión; el bosque incluye también la comparación espectral con el archivo anterior. Los errores terminan con código distinto de cero. Todo el PCM se procesa en memoria: no se guardan WAV ni archivos intermedios. Con las mismas versiones de Node.js, FFmpeg y `libmp3lame`, la generación es determinista.

## Recursos originales del proyecto

- Diseño de Noa: interpretación pixelada original creada para Super Noa a partir de referencias privadas. Las fotografías no se distribuyen ni forman parte del repositorio.
- Gestos de Noa para los duelos: cuatro sprites originales derivados únicamente de la hoja pixelada del personaje, sin reutilizar las fotografías privadas.
- Escenarios, objetos, enemigos e interfaz: creados específicamente para Super Noa.
- Lobos dormidos y despertando, flores y puentes de pétalos, corrientes ascendentes, ráfagas de hielo, chorros y superficie de lava, agua del valle y de la montaña de hielo, poza de entrada, barcos voladores, tablones aéreos y plataformas de niebla: doce hojas de sprites originales RGBA, dibujadas localmente mediante `scripts/build-mechanic-sprites.mjs`. No utilizan recursos ni servicios externos. `node scripts/build-mechanic-sprites.mjs --check` comprueba que los PNG corresponden al generador; sin opciones los regenera. Las señales, partículas y dibujos de emergencia permanecen en Canvas y no sustituyen los sprites cuando están cargados.
- Insignias troqueladas de los siete mundos, postales y gatitos de recuerdo, y coraza dorada de Noa: recursos pixel art originales generados para este proyecto. La coraza dorada se utiliza cuando Noa está protegida.
- Monstruos finales: Rey Zarzal, Condesa Niebla, Gran Lobo, Gran Jabalí, Capitán Celeste, Conde Vampiro y Reina Arcoíris son diseños pixelados originales generados para Super Noa. No copian personajes de Nintendo, Sega ni de otros juegos.
- Efectos de sonido: sintetizados en tiempo real mediante Web Audio API.
- Mundo acuático: fondos, terreno, peces, erizos, gatita Perla, pegatinas, gestos de nado de Noa y Don Aleta son recursos originales creados para Super Noa.
- El muro de arrecife transparente `sea-reef-wall-v2.png` es un recorte original generado para este proyecto a partir del atlas acuático propio; el proceso y el prompt están en `WATER_ART.md`.
- Las nuevas ilustraciones panorámicas del mapa para los mundos 1–5 son versiones originales de las escenas de Super Noa; sus descripciones de generación están en `MAP_ART.md`.
- El paisaje continuo `noa-adventure-map-v1.png` es una ilustración original generada para el mapa interactivo de Super Noa. Los caminos, marcadores y cuadros de mundo son interfaz del juego, no elementos copiados ni incrustados en la imagen. Su descripción de generación está en `MAP_ART.md`.
