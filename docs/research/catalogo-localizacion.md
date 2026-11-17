# Catálogo propio o librería de localización

Investigación de la issue [#110](https://github.com/Mocheto/super-noa/issues/110), del mapa [Textos centralizados: un catálogo en español listo para otros idiomas](https://github.com/Mocheto/super-noa/issues/109). Datos consultados el 18 de noviembre de 2026. No se ha instalado ni ejecutado ningún paquete.

## Pregunta

¿Conviene un catálogo propio tipado en TypeScript, sin dependencias, o una librería (i18next, FormatJS/react-intl, Lingui u otra)? Criterios: React 19 + Vite y uso fuera de React (lienzo), peso, plurales y variables, carga diferida por idioma, claves ausentes detectadas al compilar, exportación a JSON, mantenimiento y licencia.

## Recomendación

**Catálogo propio tipado en TypeScript, sin dependencias**, con un formato de mensajes compatible con ICU (`{nombre}` y plurales por categoría de `Intl.PluralRules`) para que el día de la traducción se pueda exportar a JSON o pasar a i18next o FormatJS sin reescribir textos.

Motivos, por orden de peso para este juego:

1. **Funciona igual en React, en el lienzo, en los datos declarativos y en las pruebas.** `npm run test:logic` ejecuta los `.ts` con `node --experimental-strip-types`, sin Vite ni Babel. Un módulo `textos/es.ts` normal se importa desde `rendering.ts`, `levels.ts`, `App.tsx` y desde las pruebas sin más. Lingui (macros) y Paraglide (compilador que genera `paraglide/messages.js`) exigen un paso de compilación que las pruebas de lógica hoy no tienen.
2. **Las claves ausentes fallan en `npm run typecheck`** sin configuración extra: el tipo del catálogo se deriva del objeto español y cualquier otro idioma futuro se declara con `satisfies Catalogo`, de modo que una clave que falte o sobre es un error de TypeScript.
3. **Peso casi nulo** (estimado por debajo de 1 kB gzip para `t()` y plurales) frente a 12–26 kB gzip de i18next o react-intl, en un juego que solo depende de React.
4. **No necesitamos nada de lo que aportan las librerías todavía**: solo hay un idioma, los textos son cortos, los plurales en español son de dos formas (`one`, `other`) y fechas y números ya usan `Intl` directamente (`toLocaleString("es-ES")` en el tablón).
5. **Salida fácil si algún día hace falta**: si las cadenas siguen la sintaxis ICU, un script puede volcar el catálogo a JSON plano (formato i18next o ICU) para herramientas de traducción, y migrar a una librería sería sustituir `t()`.

Contras asumidos:

- Hay que escribir y mantener unas 40–80 líneas: tipo de rutas de clave, `t(clave, variables)`, elección de plural y el script de exportación a JSON.
- Sin ecosistema: no hay extracción automática, ni editor visual, ni integración directa con plataformas de traducción; habrá que exportar a JSON con un script propio.
- Si en el futuro se necesitan géneros, `select` u ordinales complejos en muchos idiomas, el formato propio se queda corto y conviene migrar a FormatJS o i18next con ICU.

## Cómo se usan hoy los textos en el repositorio

- `src/App.tsx`: JSX con texto literal, `aria-label`, plurales a mano (`snapshot.apples === 1 ? "manzana" : "manzanas"`) y fechas y números con `toLocaleString("es-ES")`.
- `src/game/levels.ts`: textos dentro de datos declarativos (`title`, `subtitle`, `route.nextLabel` como «Seguir con los jabalíes ▶»). El catálogo debe poder indexarse por el identificador estable de pantalla (`"A-1"`) para que los datos sigan siendo declarativos y el progreso no dependa de la redacción.
- `src/game/rendering.ts`: carteles dibujados con `context.fillText` fuera de React («¡OINK!», «¡GATITO RESCATADO!», «DUELO»). Necesitan una función normal, no un *hook*.
- El inventario ([docs/interfaz/inventario-textos.md](../interfaz/inventario-textos.md)) cuenta 1423 textos en unos 40 archivos.

## Comparación

| | Catálogo propio | i18next + react-i18next | FormatJS (react-intl / @formatjs/intl) | Lingui | Paraglide JS | typesafe-i18n |
|---|---|---|---|---|---|---|
| Versión y fecha (npm) | — | 27.1.5 (17-11-2026) / 18.0.2 (16-11-2026) | react-intl 12.1.8, @formatjs/intl 6.1.6 (17-11-2026) | 6.12.0 (03-11-2026) | 3.2.2 (10-11-2026) | 5.27.1 (11-02-2026) |
| Licencia | Propia del repo | MIT / MIT | BSD-3-Clause (react-intl, intl-messageformat), MIT (@formatjs/intl) | MIT | MIT | MIT |
| Peso gzip (bundlephobia) | < 1 kB (estimado) | 15,5 kB + 10,5 kB | react-intl 15,1 kB; @formatjs/intl 13,3 kB; intl-messageformat 10,0 kB | core 2,5 kB + react 1,8 kB | Sin dato en bundlephobia; genera una función por mensaje y elimina las no usadas | 1,3 kB |
| Fuera de React (lienzo) | Sí, función normal | Sí, `i18next.t` | Sí, `createIntl` de @formatjs/intl | Sí, `i18n._` / `i18n.t` del core | Sí, `m.clave()` en JS puro | Sí |
| Funciona en `test:logic` sin compilador | Sí | Sí | Sí | No sin las macros (necesita plugin de Vite, Babel o SWC) | No: hay que generar antes `paraglide/` | Necesita generador para los tipos |
| Plurales y variables | `{var}` y plurales con `Intl.PluralRules` (a mano) | `{{var}}` y sufijos `_one`/`_other`; ICU con plugin `i18next-icu` | ICU completo | ICU completo | Variantes con `Intl.PluralRules`; ICU con plugin | Sí, sintaxis propia |
| Carga diferida por idioma | `import()` dinámico | Sí (backends o `addResourceBundle`) | Sí (cargar mensajes y pasarlos al proveedor) | Sí (`i18n.load` + `activate`) | Por defecto incluye todos los idiomas de cada mensaje; compilación por idioma experimental | Sí, carga asíncrona de idiomas |
| Clave ausente al compilar | Sí, nativo | Sí, aumentando `CustomTypeOptions.resources` (mejor con `.ts` y `as const`); en catálogos grandes la propia doc advierte de lentitud y propone `enableSelector: "optimize"` | Sí, aumentando `FormatjsIntl.Message` con `keyof typeof messages` | Sí, aumentando `Register.messageIds` (opcional) | Sí, nativo | Sí, con el generador |
| Exportar a JSON | Script propio | JSON nativo | JSON nativo (ICU) | PO por defecto; otros formatos | JSON (formato inlang) y plugins | Exportadores propios |
| Mantenimiento | Nuestro | Muy activo (commits del 17-11-2026) | Muy activo (17-11-2026) | Activo (17-11-2026) | Activo (17-11-2026) | Último push 22-03-2026; ver dudas |
| Dependencias añadidas | 0 | 2 (+ `html-parse-stringify`) | 4–5 paquetes @formatjs | core + react + plugin de compilación | SDK de inlang, unplugin, valibot… (en desarrollo) | 0 en ejecución |

Notas:

- **i18next** es la opción más madura y la mejor salida futura: JSON nativo, `t()` fuera de React y tipos de claves y variables. Su coste: unos 26 kB gzip con react-i18next, sintaxis `{{var}}` distinta de ICU salvo plugin, y avisos en su propia documentación sobre el coste de los tipos con muchas claves.
- **FormatJS** es la referencia ICU (plurales, `select`, formatos). Más pesado que el resto si se incluye el analizador; su documentación ofrece precompilar mensajes para quitarlo, pero no lo hemos verificado en esta sesión.
- **Lingui** es ligero en ejecución, pero su ventaja depende de macros y de un flujo de extracción y compilación de catálogos (PO por defecto). Encaja peor con datos declarativos indexados por identificador y con las pruebas sin compilador.
- **Paraglide JS** da tipos perfectos y elimina mensajes no usados, pero añade un compilador y un SDK. Su documentación desaconseja la carga diferida de catálogos. Excesivo para un solo idioma.
- **typesafe-i18n** es pequeño y tipado, pero su actividad ha bajado (último push 22-03-2026) y la portada atribuye el proyecto a «Ivan Hofer (1995-2023)», lo que hace dudar de su mantenimiento a largo plazo. No recomendable.
- **rosetta** (1.1.0, MIT, último release en 2020) quedó descartado por estar sin actividad.

## Forma propuesta del catálogo (orientativa, la decide la issue de ejecución)

```ts
// src/textos/es.ts
export const es = {
  mapa: { volverInicio: "Volver al inicio" },
  ventanaCompletada: {
    manzanas: { one: "Noa ha recogido {n} manzana.", other: "Noa ha recogido {n} manzanas." },
  },
  lienzo: { gatitoRescatado: "¡GATITO RESCATADO!" },
  pantallas: { "A-1": { titulo: "La laguna de Perla", subtitulo: "Toca SALTAR para nadar hacia arriba." } },
} as const;

// src/textos/index.ts: tipo Catalogo derivado de `es`, rutas de clave tipadas
// y t(clave, variables) que sustituye {var} y elige one/other con Intl.PluralRules("es").
// Un idioma futuro: export const en = { … } satisfies Catalogo; se carga con import().
```

Reglas que hacen fácil exportar y migrar:

- Solo cadenas y objetos de plural (`zero`/`one`/`two`/`few`/`many`/`other`) en el catálogo; nada de funciones, para que `JSON.stringify` sea la exportación.
- Variables con `{nombre}` (compatible con ICU y con Paraglide; i18next necesitaría el plugin ICU o un cambio de delimitador en la exportación).
- Datos declarativos guardan identificadores (`"A-1"`) y el catálogo se indexa por ellos.

## Lo que no se ha podido verificar

- Pesos reales tras el *tree shaking* de Vite: los de bundlephobia son del paquete completo minificado y comprimido, sin las dependencias *peer*. El peso del catálogo propio es una estimación.
- Peso de Paraglide en ejecución: bundlephobia no aplica a un compilador; solo hay afirmaciones de su documentación y un testimonio no controlado.
- La precompilación de mensajes de FormatJS para quitar el analizador ICU no aparece en la página de react-intl consultada.
- Si las macros de Lingui o Paraglide podrían ejecutarse con `node --experimental-strip-types` mediante algún cargador: no se ha probado.
- El estado real de mantenimiento de typesafe-i18n: la nota «1995-2023» de la portada es ambigua.

## Fuentes

- Registro de npm (`registry.npmjs.org/<paquete>`) para versión, fecha, licencia y dependencias.
- Bundlephobia (`bundlephobia.com/api/size?package=<paquete>`) para tamaños.
- API de GitHub para la fecha del último push de cada repositorio.
- [i18next: TypeScript](https://www.i18next.com/overview/typescript)
- [Lingui: instalación](https://lingui.dev/installation) y [Typed message IDs](https://lingui.dev/guides/typed-message-ids)
- [react-intl](https://formatjs.github.io/docs/react-intl/)
- [Paraglide JS](https://paraglidejs.com/)
- [typesafe-i18n](https://github.com/ivanhofer/typesafe-i18n)
