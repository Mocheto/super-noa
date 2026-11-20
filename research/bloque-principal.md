# Qué hay en el bloque principal de 574 kB y qué puede cargarse después

Investigación de la issue [#287](https://github.com/Mocheto/super-noa/issues/287), hija del mapa [#282](https://github.com/Mocheto/super-noa/issues/282).

## Cómo se midió

- Build de producción sobre `main` (`a88a9ad`): `npx vite build --config vite.github.config.ts --outDir <temporal> --sourcemap`.
- Reparto por módulo con `npx source-map-explorer@2.5.3 --json` (sin instalarlo) y un script propio que recorta del bloque los trozos de cada fuente según el sourcemap y los comprime con gzip uno a uno. El gzip por módulo es orientativo: comprimidos sueltos suman algo más que el bloque entero.
- Los cortes 1 y 6 se **midieron** con builds de prueba (cambio temporal en `App.tsx`, deshecho después). El resto son **estimaciones** a partir del reparto.
- No se añadió ninguna dependencia a `package.json` ni se cambió código de `src/`.

Bloque de partida: `index-*.js` **574,5 kB (174,6 kB gzip)**. El CSS principal aparte: 91,7 kB (20,8 kB gzip).

## Reparto del bloque por módulo

| Módulo / grupo | kB | kB gzip | Por qué está en el bloque |
| --- | ---: | ---: | --- |
| React + ReactDOM + scheduler (`node_modules`) | 189,9 | 60,5 | Imprescindible para arrancar. |
| `src/game/levels.ts` | 76,9 | 20,1 | `App.tsx`, `progress.ts`, `routes.ts`, `restStops.ts`, `casaRescate.ts` y `FriendsTab` lo importan de forma directa. Lleva toda la geometría de las pantallas, aunque fuera de `GameCanvas` solo se usan `id`, `world`, `screen` y los objetos. |
| `src/game/rendering.ts` | 61,6 | 18,0 | **Entra solo por `FriendsTab` → `DibujoAmigo.tsx`**, que usa `drawEnemy` para dibujar la ficha de cada amigo. `GameCanvas` ya es `lazy()`, pero comparte este módulo y Rollup lo deja en el bloque principal. |
| `src/App.tsx` | 50,8 | 12,6 | Navegación, HUD, pausa, álbum, ranking, ajustes y todos los modales en un único componente. |
| Catálogo `src/textos` (23 archivos) | 85,9 | 31,6 | `t()` es síncrono e importa todas las zonas. Las más grandes: `pantallas` 11,2/3,6; `minijuegos` 9,4/2,7; `amigos` 7,5/2,3; `pegatinas` 6,9/2,2; `adultos` 6,0/2,5; `partida` 5,5/2,0; `duelos` 5,4/1,9; `paseos` 4,5/1,9; `casa` 4,1/1,5; `guardianes` 4,1/1,4. |
| Casa (`casa*.ts`, `FotosCasa.tsx`) | 32,2 (sin textos) | 14,4 | `progress.ts` → `normalizeCasa` en `casa.ts`, que arrastra `casaFoto`, `casaGatoArte`, `casaJardin`, `casaDecoracion`, `casaRopa`, `casaComida` y `casaVisitante`; y `FotosCasa` → `casaFotoArte` y todo el arte de fotos. |
| `src/game/catParty.ts` | 5,8 | 2,2 | `App.tsx` solo quiere la constante `CAT_PARTY_LEVEL_ID = "2-3"`, pero trae el módulo entero, sus partituras y `rhythmEngine`/`pulsacionVacia`. |
| Amigos (`FriendsTab`, `friends`, `DibujoAmigo`, `friendProgress`) | 8,1 | 3,0 | Pestaña del álbum importada de forma directa. |
| Desvíos y paseos (`detours`, `restStops` y sus progresos) | 7,6 | 3,0 | Navegación y progreso. |
| `assets.ts` | 6,7 | 1,9 | `optimizedAssetSource` y el registro de arte. |
| Ranking (`ranking`, `rankingOnboarding`) | 6,2 | 2,6 | Alta del dispositivo al arrancar. |
| `avioneta.ts` | 4,9 | 1,9 | `progress.ts` (`normalizeAvioneta`) y `App.tsx` (`recordFlight`); trae también el recorrido `FLIGHT_ROUTE`. |
| `worldMapData.ts` | 4,7 | 1,6 | Catálogo de mundos y arte del mapa. |
| `progress.ts`, `stickers`, `worldMechanics`, `bosses`, `Dialog`, `Ventana`, `main.tsx` y otros pequeños | ~35 | ~12 | Necesarios para arrancar y para la navegación. |

Ya se cargan aparte con `lazy()`: `WorldMap`, `GameCanvas`, `BossBattle`, `GuardianMiniGame`, `SantaBossBattle`, los cuatro minijuegos rítmicos, `CatPartyGame`, `AvionetaGame`, `CasaGatitos` y `PruebaPaletas`.

### Pantallas solo de desarrollo

No pesan en producción:

- `testScreens.ts`: deja 0,14 kB. Como `import.meta.env.DEV` es falso en producción, `devTestName` vale `""` y Rollup descarta las pantallas de prueba.
- `?prueba=interfaz` (`MuestraInterfaz`, en `main.tsx`): el `lazy()` está detrás de `import.meta.env.DEV` y en producción ni siquiera se emite su bloque.
- `PruebaPaletas`: es un bloque aparte de 0,8 kB que la build publica pero el juego nunca descarga.

No hay nada que ganar aquí.

## Cortes ordenados por ahorro

«Espera para Noa» quiere decir lo que ella notaría: un «CARGANDO» o un hueco antes de que aparezca algo.

| # | Corte | Ahorro en el bloque principal | Espera para Noa | Esfuerzo |
| --- | --- | --- | --- | --- |
| 1 | **`FriendsTab` y `FotosCasa` con `lazy()`** en `App.tsx`. Al sacar `FriendsTab`, `rendering.ts` deja el bloque principal y pasa a un bloque compartido `rendering-*.js` (67 kB / 21 kB gzip) que se descarga junto con `GameCanvas`. | **Medido: −84,4 kB (−26,7 kB gzip)** → 490,1 kB / 147,9 kB gzip. El CSS de amigos (2,1 kB) también sale del CSS principal. | **Baja.** Al abrir AMIGOS o FOTOS en el álbum se descargan 1,6 y 2,0 kB gzip, más `rendering` si aún no se ha jugado. La primera pantalla descarga `rendering` a la vez que `GameCanvas`, en paralelo y sin un salto más. Para que no haya espera, conviene precargar con `import()` en `requestIdleCallback` cuando se muestra el mapa. | Pequeño: dos `lazy()` y un `<Suspense>` con el «CARGANDO» habitual. |
| 2 | **Separar datos de pantalla en metadatos y geometría**: `levels.ts` con `id`, `world`, `screen`, rutas y objetos, y la geometría (plataformas, enemigos, cajas, peligros) en un módulo que solo importen `GameCanvas` y las pruebas. | Estimado: −50 a −60 kB (−13 a −16 kB gzip). | **Baja.** La geometría viaja en el bloque de `GameCanvas`, que ya se carga con `lazy()` al entrar a la pantalla: no se añade ningún salto nuevo. | Medio-alto: reorganiza `levels.ts` y sus importadores (`WorldMap`, tarjetas del selector, `levelObjectives`, `FriendsTab`, `restStops`, pruebas). Los datos siguen siendo declarativos, como pide AGENTS.md. |
| 3 | **Catálogo de textos por zonas diferidas**: `minijuegos`, `duelos`, `guardianes` y `juegos` (20,0 / 6,5), `amigos` (7,5 / 2,3), `paseos` (4,5 / 1,9) y `casa` (4,1 / 1,5) se registran desde el bloque de quien los usa, y `t()` sigue siendo síncrono. | Estimado: −30 a −36 kB (−10 a −12 kB gzip). | **Media.** Si una zona no está cargada, `t()` devolvería la clave y Noa vería un texto raro. Hay que cargar cada zona con el mismo `import()` de su pantalla y comprobarlo en `completitud.test.ts`. No añade espera si va en el mismo bloque. | Medio: toca `src/textos/index.ts`, `npm run textos:json` y las pruebas del catálogo. |
| 4 | **Sacar `App.tsx` en trozos**: álbum o colección, tablón, ajustes para adultos y créditos como componentes con `lazy()`. | Estimado: −15 a −25 kB (−4 a −6 kB gzip), más lo que se lleven consigo (`stickers`, `ranking` de la vista). | **Baja-media.** Fracción de segundo al abrir el álbum la primera vez; se evita precargándolo en reposo desde el mapa. El HUD y la pausa no deben moverse, porque tienen que salir al instante. | Medio. |
| 5 | **Normalizadores de la casa en un módulo ligero** (por ejemplo `casaProgreso.ts`, con `normalizeCasa` y los nombres de las animaciones como lista, sin `casaJardin`, `casaGatoArte` ni el arte de fotos), para que `progress.ts` no arrastre la casa entera. | Estimado: −15 a −20 kB (−5 a −7 kB gzip). Tras el corte 1 quedan 25,3 kB / 10,9 kB gzip de la casa en el bloque, contando sus textos. | **Ninguna.** `CasaGatitos` ya es `lazy()`; la casa cargaría el resto con su bloque. | Medio: cuidar la migración y validación del progreso (`super-noa-progress-v1`, `version: 2`). |
| 6 | **`CAT_PARTY_LEVEL_ID` fuera de `catParty.ts`** (a `levels`, `routes` o un módulo de constantes). | **Medido (sobre el corte 1): −6,7 kB (−2,4 kB gzip)** → 483,4 kB / 145,5 kB gzip. | **Ninguna.** | Trivial. |
| 7 | **`avioneta.ts` en dos**: `normalizeAvioneta` y `recordFlight` aparte del recorrido `FLIGHT_ROUTE`. | Estimado: −3 a −4 kB (−1,2 a −1,5 kB gzip). | **Ninguna.** | Pequeño. |

**Juntos:** los cortes 1 y 6, ya medidos, dejan el bloque en **483 kB (145 kB gzip)**, por debajo del aviso de 500 kB de Vite. Con los siete cortes, la estimación queda en torno a **330–360 kB (100–110 kB gzip)**.

### Descartado

- **Cambiar React por Preact (`preact/compat`)**: ahorraría unos 150 kB (unos 45 kB gzip), pero el proyecto usa React 19.2 y el riesgo de comportamientos distintos (Suspense, StrictMode, eventos táctiles) es alto para lo que se gana. No se recomienda.
- **Subir `chunkSizeWarningLimit`**: solo esconde el aviso.

## Recomendación

1. Hacer primero los cortes **1 y 6** juntos: son pequeños, están medidos (−91 kB, −29 kB gzip) y quitan el aviso. Añadir la precarga en reposo de `rendering`/`GameCanvas` y del álbum cuando aparece el mapa, para que el primer «CARGANDO» de la partida no se alargue.
2. Después, el corte **2** (geometría de pantallas), que es el mayor de los que quedan y no añade esperas.
3. Los cortes **3, 4 y 5** cuando se toquen esas zonas. El 3 es el que más cuidado necesita por el riesgo de que se vean claves en lugar de textos.
