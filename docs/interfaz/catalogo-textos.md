# Catálogo de textos

Todo texto visible de Super Noa vive en `src/textos/es/` y se pide por **clave**. Esta guía explica cómo nombrar claves, cómo añadir textos y qué comprueban las pruebas. Es el resultado del mapa [Textos centralizados: un catálogo en español listo para otros idiomas](https://github.com/Mocheto/super-noa/issues/109). La redacción de los textos para Noa sigue la [guía de escritura](guia-texto-noa.md) y los pictogramas, [pictogramas.md](pictogramas.md).

## Dónde está cada cosa

| Pieza | Para qué sirve |
|---|---|
| `src/textos/es/<zona>.ts` | Los textos en español, una zona por archivo. `es/index.ts` las une. |
| `src/textos/index.ts` | `t()`, `tClave()`, `partes()`, `textoLienzo()`, `sinPictogramas()`, `puntos()`, `conTextos()`, `existeClave()` y `hojas()`. |
| `src/textos/Texto.tsx` | `<Texto clave="…" />` y `<Pictogramas texto="…" />` para pintar un texto con sus pictogramas en React; `<Pictograma nombre="…" />` suelto, `<Boton clave="…" tipo="seguir" />` y `<BotonControl pictograma="…" etiqueta="….oculto" />`. Sus estilos están en `src/interfaz.css`. |
| `src/textos/pictogramas.ts` | Los 51 nombres de pictograma y su emoji provisional. |
| `src/textos/exportar.ts` | Exportación a JSON con plurales ICU; la usa `npm run textos:json`. |

Zonas actuales: `partida`, `ventanas`, `inicio`, `mapa`, `coleccion`, `duelos`, `minijuegos`, `adultos` (textos de la interfaz) y `pantallas`, `temas`, `mundos`, `caminos`, `paseos`, `pegatinas`, `amigos`, `guardianes`, `juegos` (textos de los datos).

## Claves

Una clave es la ruta hasta una hoja: `zona.elemento.capa`, con nombres en español y `camelCase` o `kebab-case` (`partida.pausa.seguir.rotulo`, `pantallas.1-2.titulo.rotulo`). La clave **no cambia** aunque cambie la redacción. Una clave que no existe no compila: el tipo `ClaveTexto` sale del propio catálogo.

### Las tres capas

| Hoja | Para quién | Reglas |
|---|---|---|
| `rotulo` | Noa | MAYÚSCULAS sin tildes ni diéresis (la Ñ y ¡ ¿ se mantienen), de una a cuatro palabras, sin dos puntos, puntos medios ni puntos suspensivos. |
| `juntos` | La persona adulta que lee en voz alta | Frase normal, con tildes. Va debajo del rótulo y no sale en botones, HUD ni durante la partida. |
| `oculto` | Lector de pantalla (`aria-label`, `alt`) | Frase normal y breve. |

Cualquier hoja **sin capa** es texto para adultos (`adultos.app.ajustes`) y mantiene la redacción normal. La prueba `textos.test.ts` aplica las reglas del `rotulo` a todos los rótulos.

### Variables, plurales y pictogramas

- **Variables**: `{nombre}` en el texto y `t(clave, { nombre: "Noa" })`.
- **Plurales**: un objeto con las categorías de `Intl.PluralRules`: `{ one: "{n} vida", other: "{n} vidas" }`; la variable `n` elige la forma.
- **Pictogramas**: `{pictograma:manzana} MANZANA`. En React lo pinta `<Texto>`; en el lienzo, `textoLienzo(clave)`; para una etiqueta oculta, `sinPictogramas(texto)`. El nombre debe existir en `pictogramas.ts`.
- **Puntos de avance**: `puntos(2, 3)` devuelve `●●○`; se pasa como variable `{puntos}` (`{pictograma:bandera} {puntos}`).

## Cómo pedir un texto

```tsx
import { t } from "../textos";
import { Texto } from "../textos/Texto";

<h2 className="rotulo"><Texto clave="partida.pausa.titulo.rotulo" /></h2>   // con pictograma
<p className="juntos">{t("ventanas.completada.reina.juntos")}</p>            // texto plano
<button aria-label={t("partida.hud.pausa.oculto")}>Ⅱ</button>                // lector de pantalla
context.fillText(textoLienzo("partida.lienzo.dobleSalto.rotulo"), x, y);     // lienzo
```

Para claves construidas con un identificador usa `tClave(\`pantallas.${level.id}.titulo.rotulo\`)`; la prueba de completitud garantiza que existen.

## Textos de los datos

Los datos declarativos **no llevan texto**: tienen un identificador y leen su texto del catálogo con `conTextos()`, que define propiedades que se resuelven al leerlas.

| Dato | Identificador | Claves |
|---|---|---|
| Pantalla (`levels.ts`) | `1-2`, `A-1`, `S-1` | `pantallas.<id>.titulo`, `.pista`, `.siguiente.juntos`, `.habla.paradaN.rotulo` |
| Decorado (`themeNames`) | `orchard-day` | `temas.<tema>.rotulo` / `.juntos` |
| Mundo (`worldMapData.ts`) | `1`…`17` | `mundos.<n>.nombre`, `.gato.rotulo` |
| Camino secreto (`detours.ts`) | `fireflies` | `caminos.<id>.titulo`, `.pista.juntos` |
| Paseo (`restStops.ts`) | número de mundo | `paseos.<mundo>.amigos.<tipo>`, `.despedida`; `paseos.titulo` y `.pista` son comunes |
| Pegatina (`stickers.ts`) | `sticker-1-1` | `pegatinas.<id>.nombre`, `.pista.juntos` |
| Amigo (`friends.ts`) | `slime` | `amigos.<tipo>.nombre`, `.muerde.juntos`, `.consejo.juntos`; `amigos.comida.*` |
| Guardián (`bosses.ts`) | `shark-captain` | `guardianes.<id>.nombre`, `.presentacion.juntos`, `.reto.juntos` |
| Juego de guardián (`guardianGames.ts`) | `sky-captain` | `juegos.<id>.titulo`, `.instruccion.juntos`, `.pista`, `.exito`, `.opciones.<opción>.rotulo` |

El `rotulo` de un nombre es la palabra corta («ERIZOS»); su `juntos` conserva el título largo («El jardín de los erizos»).

### Añadir un mundo nuevo

1. Escribe en las zonas anteriores los textos de sus tres pantallas (`pantallas.<id>`), su tema (`temas.<tema>`), el mundo (`mundos.<n>`), su paseo (`paseos.<n>`), sus pegatinas (`pegatinas.<id>`), los amigos que no existan (`amigos.<tipo>`) y su guardián (`guardianes.<id>`, y `juegos.<id>` si lleva juego propio).
2. Sigue la guía de escritura: rótulos de una a cuatro palabras y el título largo en `juntos`.
3. Ejecuta `npm run test:logic`: `completitud.test.ts` falla si a un dato le falta un texto o si sobra uno sin dato.

## Qué comprueban las pruebas

| Prueba | Falla si… |
|---|---|
| `textos.test.ts` | un `rotulo` incumple las reglas de la guía (mayúsculas, tildes, palabras, signos) o usa un pictograma que no existe. |
| `completitud.test.ts` | a una pantalla, mundo, camino, paseo, pegatina, amigo, guardián o juego le falta un texto, sobra uno sin dato, o una clave de `minijuegos` no la usa ningún archivo. |
| `textoSuelto.test.ts` | aparece texto visible escrito en el código fuera del catálogo. Detecta textos en JSX, atributos, cadenas y plantillas, con sus excepciones fijas en `extraerTextos.ts`. |
| `exportar.test.ts` | la exportación a JSON no incluye todas las hojas. |

Si `textoSuelto.test.ts` marca un texto que no es visible (una clave interna, un selector), arréglalo con el detector (`src/textos/extraerTextos.ts`) y no con una excepción por archivo.

## Exportar para traducir

```bash
npm run textos:json
```

Genera `dist-textos/es.json`, un objeto plano `clave → mensaje`, sin guardarlo en el repositorio (`/dist-textos/` está ignorado). Los plurales salen como mensajes ICU: `{n, plural, one {…} other {…}}`. Las marcas `{pictograma:nombre}` se exportan tal cual: una herramienta de traducción estricta con ICU puede exigir cambiarles el nombre al importar.

## Límites conocidos

- Hay un solo idioma (`es`). `usarIdioma()` existe, pero los textos de nivel de módulo (leyendas y resultados de los minijuegos, nombres de fase) se leen al cargar el módulo, así que cambiar de idioma en caliente no los refrescaría; los datos declarativos sí se resuelven al leerlos. Eso queda para el mapa del idioma.
- El catálogo entero va en el paquete principal: unos 15 kB más comprimidos (158 kB frente a 144 kB). Si importa, se puede partir por zona con `import()` dinámico, que de todos modos hará falta para cargar un idioma bajo demanda.
- Las claves antiguas de `minijuegos` salen del propio texto. Las nuevas siguen `minijuegos.<juego>.<momento>.<elemento>.<capa>`, con el momento `previa`, `practica`, `compas` (una palabra, dura un pulso), `fase` (hasta dos palabras con dibujo, dura un compás) o `resultado`; `textos.test.ts` vigila las reglas de compás y fase. Las piezas comunes están en `minijuegos.comun`. Cada minijuego pasa a las claves nuevas al adoptar la guía en su propia issue.
- Algunas frases de los ajustes y los créditos están partidas en varios fragmentos; conviene unirlas antes de traducir.
- Los rótulos de los minijuegos, los ajustes y algunas ventanas van sin pictograma hasta que se ejecute el rediseño visual de la interfaz.
