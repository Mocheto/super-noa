# Fuentes pixel libres legibles para quien aprende a leer

Investigación para la issue [#100](https://github.com/Mocheto/super-noa/issues/100), dentro del mapa [#99](https://github.com/Mocheto/super-noa/issues/99). Alimenta el prototipo «La tipografía de la interfaz» ([#101](https://github.com/Mocheto/super-noa/issues/101)).

Fecha: 2026-11-18.

## Pregunta

¿Qué fuentes pixel o bitmap con licencia libre (OFL o similar, compatible con GitHub Pages) tienen mayúsculas muy claras para una niña de cinco años, incluyen Á É Í Ó Ú Ü Ñ ¡ ¿ y cifras, y se leen bien a 24–48 px?

## Cómo se ha verificado

- **Licencia y autoría**: `METADATA.pb` (campo `license`) y la primera línea de `OFL.txt` de cada familia en el repositorio oficial [google/fonts](https://github.com/google/fonts/tree/main/ofl), más la página o README del proyecto original.
- **Peso del archivo**: tamaño del `.ttf` publicado en `google/fonts`, leído con la API de GitHub (sin descargar el archivo). Google Fonts sirve WOFF2 recortado por subconjunto, que pesa bastante menos; si se incluye en el repositorio conviene recortarlo a Latin básico + Latin-1 (con `pyftsubset` o similar) en el ticket de prototipo.
- **Glifos del español**: se han combinado tres fuentes:
  1. El subconjunto declarado en `METADATA.pb` (`latin`, `latin-ext`).
  2. La política de Google Fonts: el glyphset [GF_Latin_Core](https://github.com/googlefonts/glyphsets/blob/main/GLYPHSETS.md) es «el conjunto mínimo exigido a toda familia que se incorpora a Google Fonts», incluye Á É Í Ó Ú Ü Ñ y ¡ ¿, y lista el español (`es_Latn`).
  3. Búsqueda de nombres de glifo (`Aacute`, `Udieresis`, `Ntilde`, `exclamdown`, `questiondown`) en el código fuente `.glyphs` del proyecto original cuando GitHub lo indexa.
- **Formas de las letras (A/G/O/Q, I/1, M/N, O/0)**: **no se han inspeccionado glifo a glifo**. No se han descargado ni abierto archivos de fuente y la vista de glifos de Google Fonts no se puede leer sin JavaScript. Las notas de ambigüedad salen del diseño conocido de cada familia y deben confirmarse en #101 dibujando la muestra «¡A JUGAR! MANZANA 3 VIDAS» y la tabla de pares confusos.

## Candidatas

| | Press Start 2P | Pixelify Sans | Silkscreen | Jersey 10 |
|---|---|---|---|---|
| Licencia | OFL 1.1 (Reserved Font Name «Press Start 2P») | OFL 1.1 | OFL 1.1 | OFL 1.1 |
| Autoría | Cody «CodeMan38» Boisclair, 2012 | Stefie Justprince, 2021 | Jason Kottke, 1999–2001 | Sarah Cadigan-Fried, 2023 |
| Subconjuntos declarados | latin, latin-ext, greek, cyrillic | latin, latin-ext, cyrillic | latin | latin, latin-ext |
| Á É Í Ó Ú Ü Ñ ¡ ¿ | Muy probable (ver nota) | Sí, por política GF_Latin_Core | **Sí, verificado en el código fuente** | Sí, por política GF_Latin_Core |
| Cifras | Sí | Sí | Sí | Sí |
| Rejilla / tamaño base | 8 × 8 px; «mejor a 8, 16 y múltiplos de 8» → 24, 32, 40, 48 px | No declarada; comprobar en #101 | Pensada para 8 px; usar múltiplos | Mayúsculas de 10 px de alto (el número del nombre); escalar en múltiplos enteros |
| Pesos | Regular | Variable 400–700 | Regular y Bold | Regular |
| `.ttf` en google/fonts | 118 KB | 79 KB (variable) | 32 KB (Regular), 31 KB (Bold) | 78 KB |
| Minúsculas | Sí | Sí | No (versalitas) | Sí |

### Press Start 2P

- Fuentes: [METADATA y OFL en google/fonts](https://github.com/google/fonts/tree/main/ofl/pressstart2p), [página del autor](https://www.zone38.net/font/).
- Glifos: la página del autor dice que incluye todo el bloque Latin Extended-A, además de griego y cirílico; la descripción de Google Fonts habla de soporte paneuropeo. Es anterior a la política GF_Latin_Core y no hay código fuente en texto que consultar, así que **Á É Í Ó Ú Ü Ñ ¡ ¿ no se han verificado glifo a glifo**, aunque una fuente con Latin Extended-A y subconjunto `latin` casi siempre trae Latin-1.
- Legibilidad: mayúsculas de trazo doble, muy gruesas y cuadradas, estilo recreativa. Es la más «de juego» y la que más se ve a 24 px. Es ancha (monoespaciada de 8 px): «MANZANA» ocupa mucho, así que los rótulos largos necesitan 24–32 px.
- Pares confusos: O es un cuadrado redondeado y Q lleva cola visible; G tiene espolón. I lleva remates arriba y abajo, mientras que 1 tiene bandera y base, así que se distinguen. M y N se separan bien gracias a la anchura de 8 px. **O y 0 son el riesgo**: hay que comprobar si el cero lleva barra o punto.
- Reserved Font Name: si se recorta o modifica el archivo, la fuente derivada no puede llamarse «Press Start 2P». Usarla tal cual no tiene problema.

### Pixelify Sans

- Fuentes: [METADATA y OFL en google/fonts](https://github.com/google/fonts/tree/main/ofl/pixelifysans), [repositorio original](https://github.com/eifetx/Pixelify-Sans) (OFL 1.1).
- Glifos: entró en Google Fonts en 2023 con `latin` y `latin-ext`, así que pasó la exigencia de GF_Latin_Core. El `.glyphs` original pesa 1 MB y GitHub no lo indexa, por eso no se ha podido comprobar el nombre de cada glifo.
- Legibilidad: pixel de proporciones «humanistas», más cercano a las letras que Noa ve en los libros que una fuente de recreativa. El eje de peso 400–700 permite un HUD en 600–700 y textos largos en 400–500 con un solo archivo.
- Pares confusos: es proporcional, lo que ayuda a separar M (ancha) de N. A, G, O y Q tienen formas convencionales, pero en pixel la cola de la Q y el espolón de la G pueden quedarse en un solo píxel: comprobar a 24 px. I y 1: comprobar si la I mayúscula lleva remates.

### Silkscreen

- Fuentes: [METADATA y OFL en google/fonts](https://github.com/google/fonts/tree/main/ofl/silkscreen), [repositorio original](https://github.com/googlefonts/silkscreen).
- Glifos: **verificado** en `sources/Silkscreen.glyphs`: existen `Aacute`, `Udieresis`, `Ntilde`, `exclamdown` y `questiondown` (las otras vocales acentuadas no se buscaron una a una por el límite de la API, pero el subconjunto `latin` y la presencia de Á y Ü lo hacen muy probable).
- Legibilidad: solo mayúsculas (las minúsculas son versalitas), lo que encaja con una niña que empieza por las mayúsculas. Es la más ligera (≈32 KB) y tiene Bold. Su rejilla es muy pequeña (mayúsculas de unos 5 px), así que a 24 px cada píxel mide unos 5 px y las letras se ven «de bloques»: gruesas, pero con poco detalle.
- Pares confusos: con tan pocos píxeles, **O, Q y 0** y **G/O** son el mayor riesgo; la cola de la Q y el espolón de la G son de un píxel. I/1 y M/N deben comprobarse en #101.

### Jersey 10

- Fuentes: [METADATA y OFL en google/fonts](https://github.com/google/fonts/tree/main/ofl/jersey10), [repositorio original](https://github.com/scfried/soft-type-jersey). El repositorio incluye el filtro `CustomFilter_GF_Latin_All.plist`, que indica que se diseñó para el conjunto latino de Google.
- Glifos: entró en Google Fonts en 2023 con `latin` y `latin-ext`, así que cumple GF_Latin_Core. No se ha comprobado glifo a glifo.
- Legibilidad: sans deportiva y algo estrecha, con mayúsculas de 10 px, más detalle que Silkscreen. Cabe más texto por línea, lo que viene bien para diálogos cortos.
- Pares confusos: al ser estrecha, **O y 0** y **M/N** pueden parecerse más. Comprobar a 24 px.

## Descartadas

- **VT323** (OFL): de terminal, con trazo fino y píxeles «manchados» a propósito. Su autor avisa de que el juego de caracteres es limitado. No es buena para una primera lectora.
- **Sixtyfour** (OFL): estilo Commodore 64; su descripción avisa de que solo cubre «un juego de glifos limitado».
- **Tiny5** (OFL): variable con cinco ejes, 433 KB; demasiado pesada y pequeña para lo que aporta.
- **Micro 5** (OFL): mayúsculas de 5 px; mismo problema de detalle que Silkscreen, sin sus ventajas.
- **monogram** (CC0, [datagoblin](https://datagoblin.itch.io/monogram)): licencia ideal y muy ligera (10 KB; 57 KB la versión extendida), y su página dice que admite español. Pero está pensada para texto en minúscula a 5 px de ancho y no se ha podido verificar que la versión básica traiga acentos (un comentario lo pone en duda). Sirve de reserva si se busca CC0.

## Muestra

La muestra «¡A JUGAR! MANZANA 3 VIDAS» y la tabla de pares confusos (A G O Q 0, I 1, M N, Á É Í Ó Ú Ü Ñ ¡ ¿) **no se han renderizado aquí**, porque eso exige cargar los archivos de fuente. Se dejan para #101: dibujarlas a 24, 32 y 48 px en el Canvas y en el HUD, sobre fondo claro y sobre la ilustración de un mundo.

## Recomendación para #101

1. **Press Start 2P**: la más clara y gruesa a 24 px, con la rejilla de 8 px que encaja con 24/32/40/48. Riesgos: anchura y O/0.
2. **Pixelify Sans**: la más parecida a la letra de los libros, con mayúsculas y minúsculas, peso variable en un solo archivo y glifos del español garantizados por la política de Google Fonts.
3. **Silkscreen (Bold)** como tercera opción ligera y solo en mayúsculas, con los glifos del español verificados en su código fuente; descartarla si en el prototipo la Q, la G y el 0 no se distinguen.

Pendiente de verificar en #101: los acentos de Press Start 2P glifo a glifo, la forma del 0 en las tres, la rejilla real de Pixelify Sans y el peso final tras recortar cada fuente a Latin + Latin-1.
