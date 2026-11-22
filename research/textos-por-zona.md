# Cargar los textos por zona sin que Noa vea nunca una clave

Investigación de la issue [#301](https://github.com/Mocheto/super-noa/issues/301), hija del mapa [#282](https://github.com/Mocheto/super-noa/issues/282). Parte del reparto del bloque principal de [#287](https://github.com/Mocheto/super-noa/issues/287#issuecomment-7039671782), que estimaba un ahorro de −30 a −36 kB.

**Resultado:** el bloque principal baja de **419,99 kB (126,30 kB gzip)** a **387,32 kB (117,09 kB gzip)**: **−32,7 kB (−9,2 kB gzip)**. `t()` sigue siendo síncrono, y una prueba estática de importaciones impide que una pantalla pida un texto de una zona que aún no ha cargado. El prototipo está en esta rama, pasa `lint`, `typecheck` y `test:logic` (582 pruebas), y lo he revisado en la build de producción (inicio, álbum, mapa con el botón CASA y la casa con la ventana «¡HOLA!»).

## 1. Diseño

### Zonas base y zonas diferidas

- **Base** (`src/textos/es/base.ts`): las zonas que usan el inicio, el mapa, el álbum, la partida y las ventanas comunes: `coleccion`, `inicio`, `mapa`, `partida`, `adultos`, `guardianes`, `pegatinas`, `caminos`, `mundos`, `pantallas`, `temas`, `ventanas` y `minijuegos.tienda`. `src/textos/index.ts` arranca con ellas.
- **Diferidas**: un archivo por zona en `src/textos/zonas/<ruta>.ts`. Cada uno importa sus textos y llama a `registrarZona(ruta, textos)`:

| Zona diferida | Viaja en el bloque | Lo importan |
|---|---|---|
| `duelos` | `duelos-*.js`, compartido por los tres duelos | `BossBattle`, `GuardianMiniGame`, `SantaBossBattle`, `santaBattleRendering` |
| `juegos` | `GuardianMiniGame` | `guardianGames.ts` |
| `amigos` | `DibujoAmigo`, compartido por `FriendsTab`, `CasaGatitos` y `FotosCasa` | `friends.ts` |
| `paseos` | `restStopNiveles`, con la partida | `restStopNiveles.ts` |
| `casa` | `CasaGatitos` | `CasaGatitos`, `BanoGatito`, `VestidorGatito` |
| `minijuegos.comun` | `minijuegoComun` | `minijuegoComun.tsx` |
| `minijuegos.abeja` / `.tambor` / `.merienda` / `.gatitos` / `.avioneta` | el bloque de cada juego | el componente y su partitura (`beeNinja.ts`, `catParty.ts`…) |

Para `minijuegos` la unidad es la parte de cada juego (`minijuegos.abeja`), no la zona entera. Por eso `src/textos/es/minijuegos.ts` se parte en `es/minijuegos/<juego>.ts` y solo los junta. Rollup no puede repartir un módulo entre bloques: con un único archivo, los 11 kB volvían al principal en cuanto la base importaba `tienda`.

### Registro desde el bloque de quien la usa

El módulo que usa las claves importa su zona con un **`import` estático de efecto**, en la primera línea:

```ts
import "../textos/zonas/duelos";              // BossBattle.tsx
```

```ts
// src/textos/zonas/duelos.ts
import { duelos } from "../es/duelos.ts";
import { registrarZona } from "../index.ts";
registrarZona("duelos", duelos);
```

En ESM, las dependencias estáticas de un módulo se evalúan antes que el propio módulo. Por eso, cuando el `import()` de `App.tsx` carga `BossBattle`, la zona ya está registrada antes de que se ejecute cualquier línea suya, también los `t()` de nivel superior (`catParty.ts` los tiene) y los `conTextos()`. No hacen falta `await`, cargadores ni `Suspense` nuevos. Vite coloca la zona en el bloque de quien la importa, o en uno compartido si la importan varios bloques diferidos.

`registrarZona(ruta, textos)` cuelga la zona del catálogo activo. Acepta rutas con punto (`minijuegos.abeja`).

### Datos declarativos con `conTextos`

Un dato que declara sus claves (`friendCatalog`, `guardianGames`, `restStopCatalog`) obliga a importar la zona en el módulo que lo declara, y ese módulo estaba en el bloque principal porque lo usan el progreso o la navegación. La regla aplicada es separar los datos sin texto de los textos:

- `friendData.ts`: tipo, mundo y comida favorita, y `MAX_HEARTS`. Lo usan `friendProgress` y `casaVisitante`, en el principal. `friends.ts` importa la zona y añade los textos.
- `guardianGameIds.ts`: `isGuardianGameId` sin textos, para `App.tsx`. `guardianGames.ts` importa `juegos`.
- `restStops.ts` queda sin textos. `restStopNiveles.ts`, que ya se cargaba con la partida, añade lo que dicen los amigos y el guardián (`restStopConTextos`). `GameCanvas` lo pide ahí.

### Claves que cambian de zona

Hay dos textos de zonas diferidas que pinta el bloque principal o el mapa:

- `casa.boton.rotulo` → `mapa.casa.rotulo` (el botón CASA del mapa).
- `paseos.titulo` / `paseos.pista` → `mapa.pantallaPaseo.titulo` / `.pista` (los enseñan la tarjeta del mapa y la partida).

`guardianes` se queda en la base porque la pestaña JEFES del álbum (en `App.tsx`) y `levelObjectives.ts` leen nombres y retos. Se podrá diferir cuando el álbum salga de `App.tsx` (corte 4 de #287).

### Qué pasa si aun así falta una zona

`t()` ya fallaba con «Clave de texto sin hoja», y ahora indica qué importar. En desarrollo y en las pruebas sigue fallando en el acto. En producción, `main.tsx` llama a `clavesSinHojaEnSilencio()`: la clave sin hoja devuelve `""` y lo avisa una vez en la consola. **Noa nunca ve una clave**: en el peor caso ve un hueco, y la pantalla no se rompe. `existeClave()` ya no captura una excepción: comprueba directamente si la hoja existe.

## 2. Garantía en las pruebas: `src/textos/zonas.test.ts`

Prueba estática, sin navegador. Usa el compilador de TypeScript, como `extraerTextos.ts`:

1. **Cada módulo que usa una zona diferida la importa.** Recorre todos los `.ts`/`.tsx` de `src/` que no son pruebas. Toma las claves escritas en el código: cadenas y la parte fija de las plantillas (`` `juegos.${id}.titulo` `` → `juegos.`), sin contar los comentarios. Cada clave se asigna a su zona diferida, la de prefijo más largo. Después comprueba que `src/textos/zonas/<zona>.ts` está en el cierre de importaciones **estáticas** del módulo; no cuentan ni `import type` ni `import()`. Si una plantilla se queda a medio camino (`` `minijuegos.${juego}.…` ``), la prueba falla y pide escribir la clave entera. El mensaje dice qué hay que importar: `src/game/BossBattle.tsx:54 usa «duelos.gesto.piedra.rotulo»: añade import "src/textos/zonas/duelos.ts"`.
2. **Ninguna zona diferida vuelve al bloque principal.** El cierre estático de `src/main.tsx` no puede contener ni `zonas/*`, ni sus `es/<zona>.ts`, ni los agregados (`es/index.ts`, `es/minijuegos.ts`, `todo.ts`). Así se protege el ahorro.
3. Cada archivo de `zonas/` registra la zona de su nombre, y esa zona no está en `es/base.ts`.
4. La base más todas las zonas diferidas suman exactamente el catálogo completo.

Con esto, el mapa zona → bloques no se mantiene a mano: lo deducen las importaciones, y la prueba vigila los dos invariantes que importan.

Límite conocido: la prueba ve las claves escritas en el código. Una clave que viaja como dato, por ejemplo una prop de un módulo base a un componente diferido, se atribuye al módulo que la escribe. Eso es conservador: obliga a importar la zona ahí y la prueba 2 lo detecta si cae en el principal. Una clave compuesta del todo en ejecución (`tClave(variable)`) no se ve. Hoy no hay ninguna de una zona diferida.

## 3. `npm run textos:json` y `completitud.test.ts`

- `src/textos/todo.ts` registra el catálogo completo (`es/index.ts`, que sigue siendo el idioma de referencia y la fuente del tipo `ClaveTexto`). Lo importan `exportar.ts` (y por tanto `npm run textos:json`, que sigue dando sus 1699 textos), `completitud.test.ts` y `textos.test.ts`. El juego no lo importa nunca (prueba 2).
- `completitud.test.ts` solo cambia el import (`./todo.ts`), la comprobación de los paseos (lee `restStopTextos`) y la lista de sobrantes de `paseos` (sin `titulo`/`pista`).
- Una prueba de lógica que llama a `t()` con una zona diferida sin pasar por su módulo tiene que importarla, como `casaRescate.test.ts` con `import "../textos/zonas/casa.ts"`. Si no, falla con el mensaje claro de arriba.
- `ClaveTexto` sigue saliendo del catálogo entero: el tipo no distingue zonas, eso lo vigila la prueba 1.

## 4. Ahorro medido

Build con `vite build --config vite.github.config.ts` (más un plugin temporal que vuelca los módulos de cada bloque), antes y después, sobre `main` en 078683b:

| Bloque | Antes | Después |
|---|---|---|
| `index-*.js` (principal) | 419,99 kB / 126,30 kB gzip | **387,32 kB / 117,09 kB gzip** |
| `duelos-*.js` (nuevo, compartido) | — | 5,45 kB / 1,97 kB |
| `DibujoAmigo` (con `amigos`) | 1,50 kB | 9,39 kB |
| `CasaGatitos` | 59,23 kB | 63,65 kB |
| `GuardianMiniGame` | 6,88 kB | 9,25 kB |
| `BeeNinjaGame` / `ArmoniaDrumGame` / `MeriendaJabatosGame` | 18,98 / 17,16 / 17,97 kB | 20,94 / 19,14 / 19,94 kB |
| `AvionetaGame` | 7,72 kB | 8,58 kB |
| `restStopNiveles` (antes en `nivelCompleto`) | 1,12 kB | 5,62 kB |

**−32,7 kB (−7,8 %) y −9,2 kB gzip en el bloque principal.** Cada pantalla diferida crece justo lo que pesan sus textos (de 1 a 9 kB) y solo se descarga al abrirla. `FriendsTab`, con `amigos`, ya se precarga en reposo desde `App.tsx`.

## 5. Riesgos

| Riesgo | Mitigación |
|---|---|
| Un módulo nuevo usa una clave diferida sin importar su zona | Prueba 1 (falla en `test:logic` con la línea exacta); en producción, hueco en vez de clave. |
| Alguien importa una zona diferida desde el principal y se pierde el ahorro en silencio | Prueba 2. |
| Una clave compuesta del todo en ejecución (`tClave(variable)`) de una zona diferida | La prueba no la ve. Regla en la guía: las claves diferidas se escriben enteras o con prefijo literal de su zona. |
| Un dato con `conTextos` en un módulo del principal arrastra su zona | La prueba 1 lo detecta. La regla de diseño es separar datos y textos (`friendData` / `friends`). |
| `import "…/zonas/x"` sin enlaces y tree-shaking | Rollup conserva los imports con efectos (el proyecto no declara `sideEffects: false`). La prueba 2 y la build lo confirman. |
| Mutación del catálogo activo | `registrarZona` solo añade ramas. La base se copia al arrancar y no se modifica el objeto `as const`. |
| Otro idioma más adelante | `usarIdioma` se ha quitado: no tenía usos. Cuando llegue otro idioma, cada `zonas/<ruta>.ts` registrará la versión del idioma activo, o cargará los demás con `import()` al cambiar de idioma. El diseño de las zonas no cambia. |
| Pruebas del motor en una VM sin `structuredClone` | La copia de la base se hace con dispersión de objetos. |

## 6. Prototipo en esta rama

- `src/textos/index.ts`: `registrarZona`, `zonasRegistradas`, `clavesSinHojaEnSilencio`, el catálogo activo empieza en `base`, y `existeClave` sin `try`.
- `src/textos/es/base.ts`, `src/textos/es/minijuegos/<juego>.ts`, `src/textos/zonas/*.ts`, `src/textos/todo.ts` y `src/textos/zonas.test.ts`.
- `src/game/friendData.ts` y `src/game/guardianGameIds.ts`; `restStops.ts` / `restStopNiveles.ts` separan los datos de los textos.
- Imports de zona en los minijuegos, duelos, casa y `MuestraInterfaz`.
- Claves movidas: `mapa.casa.rotulo` y `mapa.pantallaPaseo.*`.

Para llevarlo a `main` falta actualizar `docs/interfaz/catalogo-textos.md` (zonas base/diferidas, cómo añadir una zona diferida, la nueva prueba) y `AGENTS.md`, y repasar visualmente los duelos, los cuatro minijuegos rítmicos, la avioneta, el paseo y la pestaña Amigos en la build de producción.
