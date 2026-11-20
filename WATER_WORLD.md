# Mundo acuático: La Laguna de los Corales

El desvío A-1 → A-2 → A-3 se descubre al caer en la poza de la primera sima de 2-3. Después del duelo con Don Aleta se abre 3-1. Los identificadores antiguos y el formato de progreso `super-noa-progress-v1` siguen vigentes.

Dentro del agua, SALTAR impulsa hacia arriba. Al soltarlo, Noa se hunde lentamente y puede caminar sobre el fondo. Los peces patrullan a media altura; los erizos del lecho hacen daño al contacto. Las plataformas de coral y los arcos permiten alternar la ruta superior y la submarina.

## Recursos generados

Los recursos siguientes se generaron con la herramienta de imágenes integrada, con fondo transparente donde corresponde. Los atlas de gestos se recortaron en celdas sin modificar la ilustración; los fondos e insignias finales pueden conservarse optimizados en WebP. Se emplearon los sprites existentes de Noa como referencia de identidad; ninguna fotografía privada se incorporó al repositorio.

| Archivo | Brief visual final |
| --- | --- |
| `public/assets/sprites/noa-swim-v1.webp` | Hoja 2 × 3 de Noa nadando en pixel art: dos brazadas normal, dos con la coraza dorada y dos en modo gatita. Mantener pelo castaño, clip de manzana, vestido morado, zapatos y silueta de la versión existente; celdas separadas, cuerpo entero, transparencia. |
| `public/assets/sprites/boss-don-aleta-0.webp` a `-4.webp` | Tiburón humanoide original, amistoso y reconocible, azul, con chaleco de capitán marino. Cinco gestos sueltos: reposo, piedra, papel, tijera y derrota respetuosa; fondo transparente. El atlas original de seis gestos (`boss-don-aleta-v1.png`) y el saludo (`-5.png`) se retiraron porque el juego no los usa; quedan en el historial de git. |
| `public/assets/atlases/water-enemies-v1.webp` | Dos enemigos originales y separados: pez naranja con aletas turquesa y erizo de mar morado de púas claras; pixel art colorido, transparencia. |
| `public/assets/atlases/water-terrain-v1.webp` | Atlas de arena marina, plataforma de coral, pared de arrecife y puerta palaciega de conchas; motivos separados para componer niveles de plataformas. |
| `public/assets/stickers/world-8-v1.webp` | Tres pegatinas coleccionables troqueladas: concha de Perla, pez aventurero y corona de coral de Don Aleta, una por cada columna, bordes completos y fondo transparente. |
| `public/assets/sprites/world-cat-8-v1.webp` | Perla, gatita crema con detalles turquesa y pequeño amuleto de concha, sentada y completa, pixel art y fondo transparente. |
| `public/assets/worlds/world-8.webp` | Escenario pixel art original: laguna soleada en la franja superior y ruinas, corales, cuevas y arena bajo el agua; sin personajes ni texto, utilizable como fondo panorámico. |

`public/assets/music/laguna.wav` es una composición sintetizada original reproducible con `node scripts/build-water-music.mjs`. Su atribución consta en `CREDITS.md`.
