# Qué depende de la forma del gato base y cuánto cuesta un modelo más

Investigación de la issue [#380](https://github.com/Mocheto/super-noa/issues/380), del mapa [Gatitos de la casa distintos: modelos, marcas y complemento de su mundo](https://github.com/Mocheto/super-noa/issues/378). Hecha sobre `main` en `b0faeb3` (25-11-2026). No cambia nada del juego.

## Resumen

- Hoy hay **tres hojas en los colores clave del gato base**: la hoja de la casa (`gato-casa-v1.webp`, 6 láminas generadas), la pose «arropado» (`gato-casa-arropado-v1.webp`, 1 lámina) y el gatito grande del vestidor (`gato-casa-vestidor-v1.webp`, 1 lámina). Todo lo demás (baño, fichas de «EN CASA», fotos, prueba de paletas, accesorios del armario) **reutiliza esas tres hojas** y no tiene arte propio del gato.
- **Un modelo más cuesta 8 láminas a mano** (referencia + 5 de animaciones + arropado + gatito grande), unas 16–24 generaciones contando reintentos, **unos 83 kB** de descarga y unas horas de recorte y ajuste (tabla de cuadros del recorte, anclas que se regeneran solas y medida de las anclas del vestidor). No hace falta arte nuevo para el baño, la espuma, las fichas, las fotos ni los accesorios.
- El **código pasa de una hoja a varias una sola vez** (un mapa `modelo → hojas` y `modeloDe(mundo)`), y es barato si cada modelo **respeta el mismo contrato que la hoja de hoy**: rejilla de 4 × 13 cuadros de 160 px, las mismas trece animaciones con el mismo número de cuadros, pies en la fila 152, los mismos colores clave, el lazo entre las orejas y una franja de collar en el cuello. Con ese contrato, la casa, el baño, las fichas y las fotos no cambian; solo se elige qué hoja pintar.
- **Por código, sin láminas**, se puede quitar el pañuelo (pintar sus claves del color del pelo, como ya se hace con el barro), poner el complemento de cada gatito encima con el sistema de anclas de los accesorios, y dibujar algunas marcas (antifaz, mancha en un ojo, frente o pecho de otro color, sin rayas) recoloreando solo los píxeles de pelo cerca de las anclas. **No** se puede cambiar la forma de la cabeza, las orejas, la cola ni el largo del pelo: eso es lo que de verdad piden los modelos.

## Qué depende de la hoja del gato base

### Las tres hojas en colores clave

| Hoja | Medidas | Peso | Láminas que costó | Quién la lee |
|---|---|---|---|---|
| `sprites/gato-casa-v1.webp` | 640 × 2080 (4 × 13 cuadros de 160) | 62,8 kB | 6: referencia + 5 de animaciones ([dossier](../docs/art/casa-gato-base-v1.md)) | `casaGatoArte.ts` (`HOJA_GATO`, `hojaDeGatito`), `CasaGatitos.tsx`, `BanoGatito.tsx`, `casaFotoArte.ts`, `PruebaPaletas.tsx`, fichas de «EN CASA», `casa-gato-anclas.py` |
| `sprites/gato-casa-arropado-v1.webp` | 320 × 160 (2 cuadros de 160) | 12,6 kB | 1 (lámina 2 de [casa-dormir-v1](../docs/art/casa-dormir-v1.md); la mantita se reutiliza) | `casaDormirArte.ts` (`HOJA_ARROPADO`, `arropadoDe`), `CasaGatitos.tsx`, `casaFotoArte.ts` |
| `sprites/gato-casa-vestidor-v1.webp` | 480 × 340 (2 cuadros de 240 × 340) | 7,3 kB | 1 (lámina 4 de [casa-vestidor-v1](../docs/art/casa-vestidor-v1.md)) | `casaVestidorArte.ts` (`HOJA_VESTIDOR`, `ANCLAS_VESTIDOR`), `VestidorGatito.tsx` (con `hojaPintada`) |

Las tres se pintan con la misma función (`recolorear` + `tablaDeColores` de `casaGatoArte.ts`) y la misma paleta (`PALETAS_GATITOS`). El arropado tiñe además la mantita violeta del color `collar` de la paleta.

### Pieza por pieza

| Pieza | De qué depende hoy | Qué haría falta para un modelo más |
|---|---|---|
| `casaGatoArte.ts` | `HOJA_GATO` (una ruta), `CUADRO_GATO = 160`, `COLUMNAS_GATO = 4`, `FILAS_GATO = 13` (de `ANIMACIONES_GATO`), `CLAVES_GATO`, `PALETAS_GATITOS`, caché de `hojaPintada` por `src#mundo-variante`. | Una vez: `MODELOS` (hoja de la casa, arropado y vestidor por modelo) y `modeloDe(mundo)`; `hojaDeGatito(mundo)` elige la hoja de su modelo. La caché ya incluye `src`, así que vale tal cual. Si se respeta el contrato, cuadro, columnas y filas siguen siendo constantes comunes. |
| `casaProgreso.ts` (`ANIMACIONES_GATO`) | Fila, cuadros y fps de las trece animaciones; las fotos guardan `animacion` y `cuadro`. | Nada, **si todos los modelos tienen las mismas filas y el mismo número de cuadros**. Si un modelo tuviera otros cuadros, habría que llevar la tabla por modelo y las fotos antiguas podrían apuntar a un cuadro que no existe. Recomendación: misma tabla para todos. |
| `casaDormirArte.ts` (arropado) | `HOJA_ARROPADO` única, `CUADROS_ARROPADO = 2`, una sola promesa de imagen (`hojaArropado`). | 1 lámina por modelo. Código: la promesa única pasa a un mapa por modelo (la caché de pintadas ya va por mundo). `teñirMantita` no cambia. |
| `casaVestidorArte.ts` + `VestidorGatito.tsx` | `HOJA_VESTIDOR`, `CUADRO_VESTIDOR` (240 × 340), `ANCLAS_VESTIDOR` (medidas a mano, impresas por el recorte), `ESCALA_EN_CASA = 64 / 146` (distancia lazo–pañuelo en la casa y en el vestidor), `ENCAJE` y `CAPA_VISIBLE` afinados a ojo sobre este gato. | 1 lámina por modelo. Código: `ANCLAS_VESTIDOR`, `ESCALA_EN_CASA` y quizá `CAPA_VISIBLE` y un factor de `ENCAJE` por modelo (un gato más gordo o de cabeza más grande necesita la capa y las alas más anchas y el sombrero más grande). `piezasEnCuadro` recibe el modelo. Comprobación visual de las cinco clases de pieza (sombrero, gafas, bufanda, capa, alas) en el vestidor y en la casa. |
| `casaGatoAnclas.ts` + `prototypes/tools/casa-gato-anclas.py` | Generado: lee la hoja, busca el **lazo** `#FFD700` (cabeza), la **mancha azul del pañuelo** (cuello) y los **ojos** azules; `ESPALDA` marca a mano el cuadro de espaldas. | Sin arte. El script recorre todos los modelos y escribe `ANCLAS_GATO[modelo][animacion]`; `ESPALDA` y las excepciones pasan a ser por modelo. **Ojo:** si el pañuelo desaparece de la lámina, el script pierde el cuello. Hay que seguir dibujando una franja de collar en las claves azules (el juego la puede borrar por código, ver más abajo) o calcular el cuello de otra forma. |
| `casaFotoArte.ts` | `hojaDeGatito`, `arropadoDe`, `CUADRO_GATO`, `PIES_GATITO = 152`, `piezasEnCuadro`. Las fotos guardan `mundo`, `animacion` y `cuadro`, no la hoja. | Nada de arte. Pasar el modelo a `piezasEnCuadro`. Como el modelo sale del mundo, **las fotos antiguas se redibujan solas con el modelo nuevo**, sin cambiar el formato del progreso. |
| `BanoGatito.tsx` / `casaBano.ts` | La hoja de la casa (filas `sentado`, `bano`, `sacudirse`, `cantar`); el CSS fija `background-size: calc(var(--celda) * 4) calc(var(--celda) * 13)`. La espuma son grumos donde se frota (`casaBano.ts` no sabe nada de la forma del gato). | Nada, si se respeta la rejilla. La espuma de la fila `bano` está dibujada en la propia hoja de cada modelo (blanco y celeste, sin clave). |
| `CasaGatitos.tsx` | `hojaDeGatito`, `arropadoDe`, `COLUMNAS_GATO`, `FILAS_GATO`, `CUADRO_GATO`, `piezasEnCuadro`; `.casa-gatito` mide 160 × 160 con el origen en los pies (`casa.css`). | Nada de arte. Pasar el modelo a `piezasEnCuadro`. Si un modelo se dibuja más grande o más pequeño dentro del mismo cuadro, todo sigue cuadrando (las anclas son por cuadro). |
| Fichas de «EN CASA» (en `CasaGatitos.tsx`) | Cuadro 0 de `sentado` de la hoja pintada, por porcentajes (`.casa-ficha-dibujo`, 80 px y 64 px en móvil). | Nada. La ventana de llegada ya usa el dibujo del mundo (`world-cat-N`), no la hoja. Hoy no hay un «tablero con caras» que lea la hoja: si se hace (mapa [#365](https://github.com/Mocheto/super-noa/issues/365)), saldría del mismo cuadro sin arte nuevo. |
| `PruebaPaletas.tsx` (`?prueba=casa&paletas`) | Una fila por mundo con `hojaDeGatito`. | Nada de arte; elige la hoja de cada modelo sola. Útil añadir el `world-cat-N` al lado para comprobar el parecido. |
| `PiezaAccesorio.tsx` | Solo las láminas de accesorios y la caja que le da `piezasEnCuadro`. | Nada. |
| `prototypes/tools/casa-recorte.py` | `LAMINAS_GATO` con nombres fijos de las cinco láminas, cuántas poses dio cada fila y cuántas se quedan, `DESCARTES`, el calibre de tamaño (`SENTADO`) y la regla especial de «pelota» y «ahora no»; escribe `gato-casa-v1.webp`. | Una vez: recibir el modelo (carpeta y nombre de salida). Por modelo: su propia tabla de poses y descartes, porque cada generación sale distinta. Es el trabajo más manual del recorte. **Las originales del gato base no están en `../super-noa-arte-original/casa-v1/`**: la referencia de un modelo nuevo tendría que adjuntar la hoja publicada. |
| `prototypes/tools/casa-dormir-recorte.py` | Importa `casa-recorte.py`, `ANCHO_ARROPADO = 144`, escribe `gato-casa-arropado-v1.webp`. | Parámetro de modelo para entrada y salida; quizá `ANCHO_ARROPADO` por modelo. |
| `prototypes/tools/casa-vestidor-recorte.py` | Detecta lazo y azules para imprimir las anclas; escribe `gato-casa-vestidor-v1.webp`. | Parámetro de modelo; las anclas impresas se copian a la tabla por modelo. |
| Pruebas | `casaGatoArte.test.ts` (existe `gato-casa-v1.webp`, 13 filas, recoloreado, diecisiete paletas distintas por pelo, collar y ojos), `casaGatoAnclas.test.ts` (anclas dentro del cuadro y una por cuadro), `casaVestidorArte.test.ts` (encaje sobre `ANCLAS_VESTIDOR`, `piezasEnCuadro`), `casaDormirArte.test.ts` (existen las hojas), `casaFotoArte.test.ts` (pies en 152), `assets.test.ts` (sin PNG). | Una vez: recorrer todos los modelos (existe cada hoja, anclas de cada modelo, encaje con las anclas de cada vestidor, todo mundo tiene modelo). La firma de «no hay dos iguales» puede incluir el modelo y las marcas. Por modelo, nada nuevo que escribir. |
| `partidaHuella` | Juega las pantallas de campaña; no toca la casa. | Nada: la huella no cambia. |
| Textos | La hoja no tiene texto. | Nada (los nombres de modelo, si se ven, irían al catálogo; no deberían verse). |

## Coste de un modelo más

### Láminas a mano

| Lámina | Cuántas | Notas |
|---|---|---|
| Referencia del modelo (sentado) | 1 | Se elige la mejor; todas las demás la adjuntan. |
| Animaciones de la casa | 5 | Las mismas cinco del [dossier](../docs/art/casa-gato-base-v1.md): andar y sentado; dormir y jugar solo; cantar, pedir y comer; mimos, baño y sacudirse; pelota y «ahora no». El prompt común cambia solo la descripción del cuerpo y la cabeza; se mantienen los colores clave, el lazo y la franja de collar. |
| Pose «arropado» | 1 | Adjunta la hoja del modelo y la mantita de siempre. |
| Gatito grande del vestidor | 1 | Adjunta la hoja del modelo. |
| **Total** | **8** | Con la experiencia de la v1 (una fila salió casi negra, el baño y el «ahora no» dieron cuadros de más), cuenta con 2–3 intentos por lámina: **16–24 generaciones**. |

Nada más necesita arte: baño (bañera, utensilios, espuma), mantita, armario y accesorios, fichas, fotos y prueba de paletas reutilizan lo que hay. El complemento de cada gatito tampoco depende del número de modelos (ver más abajo).

### Trabajo de código y recorte

| Qué | Una vez (pasar de una hoja a varias) | Por cada modelo |
|---|---|---|
| Hojas y elección | `MODELOS` y `modeloDe(mundo)` en `casaGatoArte.ts`; mapa de promesas en `casaDormirArte.ts`; `HOJA_VESTIDOR` por modelo. | Una entrada en `MODELOS` y los mundos que lo usan. |
| Anclas | `ANCLAS_GATO` por modelo; `piezasEnCuadro(ropa, modelo, animacion, cuadro)`; script de anclas para todos los modelos. | Volver a ejecutar el script; revisar `ESPALDA` y los cuadros dudosos con `--ver`. |
| Vestidor | `ANCLAS_VESTIDOR`, `ESCALA_EN_CASA`, `CAPA_VISIBLE` y un factor de encaje por modelo. | Medir (lo imprime el recorte) y mirar las cinco clases de pieza puestas. |
| Recorte | Parámetro de modelo en los tres scripts. | Tabla de poses y descartes de sus cinco láminas; calibre de tamaño. |
| Pruebas | Recorrer los modelos en las cinco pruebas. | Nada. |
| Revisión | — | `?prueba=casa&gatitos=17` y `?prueba=casa&paletas` en 800 × 1280, 375 × 812 y 740 × 340: andar, dormir y arropado, baño, vestidor, fotos. |

### Peso de descarga

- **Por modelo: unos 83 kB** (62,8 + 12,6 + 7,3 kB, WebP sin pérdida). Cuatro modelos en total añadirían unos 250 kB.
- Para comparar: cada dibujo del mundo `world-cat-N` pesa 600–850 kB y la lámina de accesorios, 284 kB. Todo el arte de la casa suma hoy unos 1,7 MB.
- La [guía de estilo visual](../docs/interfaz/guia-estilo-visual.md) **no tiene presupuesto de descarga**, solo de tiempo: la casa en el DOM puede costar como mucho 1 ms más por cuadro. Un modelo más no añade trabajo por cuadro: el recoloreado se hace una vez por gatito y variante, igual que hoy. Lo que sí crece es la memoria: cada modelo cargado es otra imagen de 640 × 2080 descodificada (unos 5 MB). Con cinco gatitos en casa se cargan como mucho cuatro modelos.
- Las hojas se piden al abrir la casa y solo las de los modelos de los gatitos que están en casa (las de paseo no se pintan), así que el coste solo lo paga quien abre la casa.

## Lo que se puede hacer por código, sin láminas nuevas

| Qué | Cómo | Límites |
|---|---|---|
| **Quitar el pañuelo común** | Pintar `collar` y `collarSombra` del color del pelo, como ya se hace con el barro limpio (`tablaDeColores`). | Queda un bulto donde estaba el nudo; en la v1 no se nota mucho porque el pañuelo es pequeño. Si se mantiene la franja de collar en los modelos nuevos, el script de anclas sigue encontrando el cuello. |
| **Complemento de su mundo** | Con el sistema de accesorios: una pieza de frente por gatito colocada en el ancla de la cabeza, los ojos o el cuello, escalada con `ESCALA_EN_CASA`, también en el vestidor y las fotos. 17 piezas caben en 1–2 láminas, **independientes del número de modelos**. | Igual que los accesorios: van de frente sobre un gato de lado, no giran con la cabeza y en los cuadros sin ancla (dormido, de espaldas) no se ven. Hay que decidir cómo convive con los accesorios del mismo sitio (un sombrero y una gorra de su mundo). |
| **Marcas con las claves de hoy** | Jugar con las zonas que ya existen: `rayas` del color del pelo (sin rayas, ya se hace en Bruma), `barriga` muy distinta del pelo (bicolor), `peloClaro` u `orejas` en otro tono. | Las zonas tienen la forma que les dio el dibujo: no hay calcetines, antifaz ni manchas propias. Un esmoquin de verdad (pecho blanco y patas blancas) no sale con estas zonas. |
| **Marcas con máscaras desde las anclas** | Recolorear solo los píxeles de pelo (`pelo`, `peloClaro`, `peloOscuro`) dentro de una forma colocada en las anclas de cada cuadro: antifaz o mancha en un ojo alrededor de `ojos`, frente blanca bajo `cabeza`, babero bajo `cuello`. Como solo cambia el pelo, nunca se sale del gatito. | Solo marcas de la cabeza y el pecho, donde hay anclas. En los cuadros sin ojos (dormido, de espaldas) hay que deducirlas o quitarlas. Patas, cola y lomo no tienen ancla: calcetines o punta de la cola por código son frágiles (las patas cambian mucho entre andar, saltar y dormir). |
| **Máscaras de marcas por cuadro** | Una hoja de máscaras de 4 × 13 por marca, generada por un script (por ejemplo, la mitad baja de las patas por la fila de los pies) o retocada a mano en un editor, que el juego usa como otra clave. | Retocar 41 cuadros a mano por marca es casi tan caro como una lámina, y por script solo salen formas simples. Mejor dibujar las marcas en las láminas de cada modelo con claves nuevas (por ejemplo, «marca» y «marca clara»). |
| **Tamaño** | `--escala` del gatito en la casa (ya existe por profundidad) multiplicada por un factor por gatito: gatitos algo más pequeños o más grandes. | Solo pequeñas diferencias (±10 %): el pixel art escalado a factores no enteros se emborrona y todos siguen teniendo la misma forma. Las anclas escalan solas porque van en el cuadro. |
| **Estirar** (más gordo, más bajito) | `scaleX` / `scaleY` distintos. | Se nota enseguida en pixel art y deforma los accesorios. No recomendado. |
| **Orejas o cola superpuestas** | Dibujar encima orejas caídas o una cola de pompón en el ancla de la cabeza o en un ancla nueva de la cola. | Las orejas de la hoja siguen debajo y habría que taparlas; la cola cambia de sitio y de forma en cada animación (jugar solo, dormir), sin ancla fiable. Sale caro y se ve pegado. |
| **Pelo largo** | Engordar el contorno con un borde dentado (dilatar la silueta uno o dos píxeles). | Da un aire esponjoso, no un gato de pelo largo; tampoco cambia la cabeza. |

**Conclusión:** de lo que más iguala a los gatitos según la persona usuaria, **el pañuelo y las manchas tienen arreglo por código** (quitar el pañuelo, complemento encima y marcas de cabeza con máscaras), pero **la cabeza no**: cabeza, orejas, cola y pelo piden modelos dibujados. Por eso compensa que los modelos nuevos traigan ya **claves de marca** pintadas (para que cada gatito active o no la suya) y conserven el lazo y la franja de collar para las anclas.

## Recomendaciones para las issues siguientes

1. Fijar el **contrato de modelo**: rejilla de 4 × 13 cuadros de 160 px, las trece animaciones con los mismos cuadros de `ANIMACIONES_GATO`, pies en la fila 152, mirando a la derecha, colores clave de hoy más una o dos claves de marca, lazo entre las orejas y franja de collar en el cuello (borrada por código). Con él, el código que cambia es pequeño y no hay que tocar el formato del progreso ni las fotos.
2. Hacer el paso de una hoja a varias **antes** de generar arte, usando la hoja actual como «modelo 1», para que cada modelo nuevo sea solo arte, recorte y una entrada en una tabla.
3. El complemento de cada gatito, aparte de los modelos, con el sistema de anclas de los accesorios (1–2 láminas para los diecisiete).
4. Guardar las originales de cada modelo en `../super-noa-arte-original/casa-modelos-v1/` (las del gato base de la v1 no están en `casa-v1/`).
