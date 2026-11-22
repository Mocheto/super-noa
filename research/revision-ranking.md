# Revisión del servidor del ranking

Issue: [Revisar el servidor del ranking](https://github.com/Mocheto/super-noa/issues/302), hija del mapa [#282](https://github.com/Mocheto/super-noa/issues/282).

Alcance: `server/ranking-server.mjs`, `server/ranking-domain.mjs`, `server/ranking-supervisor.mjs`, sus pruebas y el cliente `src/game/ranking.ts` / `rankingOnboarding.ts`, en el commit `078683b`. Todo se ha probado en local, sin red externa, sin el servidor real y sin PostgreSQL de producción.

- `node --test server/*.test.mjs`: 29 pruebas, 28 pasan y 1 se salta (`ranking-postgres.test.mjs`, que necesita `TEST_RANKING_DATABASE_URL`).
- Experimentos propios, con un `pool` simulado y el arnés de pruebas del supervisor, para confirmar los hallazgos marcados como «confirmado».

## Resumen

| # | Gravedad | Hallazgo | Estado |
|---|----------|----------|--------|
| 1 | Alta | Cualquiera puede poner un alias sin moderar en lo más alto del tablón | Confirmado |
| 2 | Media | No hay límite de frecuencia: registros y envíos ilimitados | Confirmado |
| 3 | Media | Un `main` roto deja el ranking caído unos 15 s cada 5 minutos, indefinidamente | Confirmado |
| 4 | Media | Cada commit a `main`, aunque no toque `server/`, reinicia el backend y repite la migración | Confirmado |
| 5 | Media | El supervisor ejecuta lo que haya en `main` sin más control que la sintaxis | Confirmado (diseño) |
| 6 | Baja | Un alias válido con «İ» falla con 503 «reintentable» | Confirmado |
| 7 | Baja | Un carácter multibyte partido entre trozos TCP rompe el alias | Confirmado |
| 8 | Baja | La migración endurece restricciones en cada arranque; un retroceso puede no arrancar | Confirmado por lectura |
| 9 | Baja | Alias con letras de otros alfabetos permiten suplantar | Confirmado |
| 10 | Baja | Sin tiempo máximo de consulta ni de conexión a PostgreSQL | Confirmado por lectura |
| 11 | Baja | Sin espera creciente cuando el backend no arranca (GitHub cada 5 s) | Confirmado por lectura |
| 12 | Baja | Faltan cabeceras defensivas (`nosniff`) | Confirmado |
| 13 | Baja | `releases/` crece sin límite | Confirmado por lectura |
| D1–D4 | — | Dudas (orígenes CORS, textos del cliente, `node --check`, pimienta) | Dudoso |

Lo que está bien: todas las consultas usan parámetros (`$1…$10`), así que no hay inyección SQL; la migración va en una sola llamada `query` con varias sentencias, que PostgreSQL ejecuta como una transacción implícita; los errores 5xx no filtran detalles (mensaje genérico y el error solo al log); el token se guarda como HMAC con pimienta; el registro es idempotente y resiste reintentos simultáneos; CORS rechaza con 403 cualquier origen no permitido, también en peticiones simples; el cuerpo tiene un tope de 10 000 caracteres; el supervisor descarga por SHA inmutable, valida en un directorio provisional, confirma la versión solo tras `/health` con la versión esperada y vuelve a la anterior si falla, con pruebas para cada caso.

## Hallazgos confirmados

### 1. Alta: cualquiera puede poner un alias sin moderar en lo más alto del tablón

- Archivos: `server/ranking-domain.mjs:5-11` (alias), `server/ranking-domain.mjs:19-40` (progreso), `server/ranking-server.mjs:160-173`, `server/ranking-server.mjs:47-51` (orden).
- Escenario: el progreso lo declara el propio cliente y el servidor solo comprueba que cada número esté dentro de su máximo. Cualquiera puede registrarse y enviar el progreso máximo; para ganar los desempates basta con declarar las manzanas máximas y una fecha `achievedAt` muy antigua (el primer envío la acepta tal cual: `GREATEST(NULL, $9)` es `$9`). El alias solo se valida por forma (3–16 letras, números, espacio, `_`, `-`), sin lista de palabras ni revisión. El resultado es un nombre elegido por un desconocido, quizá ofensivo, en el primer puesto del tablón que ve una niña de cinco años. También se aceptan combinaciones imposibles (45 pantallas completadas con `world: 0`) y fechas futuras (`9999-12-31`).
- Por qué alta: el público es infantil y no hay ninguna barrera, ni moderación ni forma de ocultar a alguien sin tocar la base de datos a mano.
- Mejora propuesta, de menor a mayor esfuerzo:
  1. Columna `hidden BOOLEAN NOT NULL DEFAULT false` (migración aditiva) que el `leaderboardQuery` filtre, y un procedimiento documentado para ocultar un alias.
  2. Lista de palabras no permitidas en `normalizeAlias` (comparando sin tildes ni mayúsculas) o, mejor para niños, alias elegidos de una lista cerrada (adjetivo + animal) en lugar de texto libre.
  3. Reglas de verosimilitud en `validateProgress`: `completedLevels` coherente con `world`, `bossChallenges ≤ world`, `achievedAt` no futura (con margen) y no anterior a la publicación del juego; manzanas con un tope realista.
  4. Si se quiere más, que los nuevos alias no salgan en el tablón hasta tener cierta antigüedad o hasta aprobarlos.

### 2. Media: no hay límite de frecuencia

- Archivos: `server/ranking-server.mjs:123-181` (no hay limitador en ninguna ruta).
- Escenario: en local, 200 registros seguidos desde el mismo cliente entran todos (201). Un script puede ocupar todos los alias cortos, llenar la tabla (cada fila son unos cientos de bytes; millones de filas son posibles) y saturar el pool de PostgreSQL (10 conexiones por defecto) con `/v1/progress` o `/health`, que consulta la base de datos en cada llamada.
- Mejora propuesta: un limitador por IP en memoria (cubeta de fichas; por ejemplo 5 registros por hora y 60 envíos de progreso por minuto) que responda 429 con `retryable: true` (el cliente ya trata 429 como reintentable, `src/game/ranking.ts:77`). Si hay un proxy delante, leer la IP de `X-Forwarded-For` solo desde el proxy de confianza. Opcionalmente, un tope global de registros por día y que `/health` no consulte la base de datos en cada petición (cachear el resultado 5 s).

### 3. Media: un `main` roto deja el ranking caído ~15 s cada 5 minutos

- Archivos: `server/ranking-supervisor.mjs:172-200` (`activate`), `:208-213` (`checkForUpdates`), `:251-256` (bucle).
- Escenario: llega a `main` un backend con sintaxis válida que no arranca (por ejemplo, importa un módulo que no está entre los dos archivos descargados, una dependencia npm nueva que no está en la imagen, o una migración que falla con los datos reales). En cada comprobación, el supervisor para la versión buena (`stopServer` antes de arrancar la nueva), espera hasta 15 s la salud de la candidata, falla y vuelve a arrancar la anterior. Como no recuerda que ese SHA ya falló, lo repite en cada comprobación. Reproducido con el arnés de pruebas del supervisor: tres comprobaciones dan los arranques `a,b,a,b,a,b,a` y 45 s simulados sin servicio. Con el intervalo de 5 minutos eso es un 5 % del tiempo caído hasta que alguien arregle `main`, y nadie se entera salvo por el log.
- Mejora propuesta: guardar el SHA que falló (en memoria y en `ranking-release.json`) y no reintentarlo hasta que `main` apunte a otro commit, o reintentarlo con espera creciente (5 min, 10, 20… hasta 6 h). Mejor aún: arrancar la candidata en otro puerto, comprobar su salud con la versión esperada y solo entonces parar la anterior y cambiar el puerto (o poner un proxy local delante); así ni las actualizaciones buenas ni las malas cortan el servicio.

### 4. Media: cada commit a `main` reinicia el backend

- Archivos: `server/ranking-supervisor.mjs:47-52` y `:208-213`.
- Escenario: el supervisor compara el SHA del último commit de `main`, no el contenido de `server/`. Cualquier commit (arte, textos, niveles, documentación) descarga una «versión nueva» idéntica, para el proceso, lo vuelve a arrancar y repite la migración completa (incluido `DROP/ADD CONSTRAINT`, que valida toda la tabla con bloqueo exclusivo). Con los agentes publicando varias veces al día, son muchos cortes de varios segundos sin motivo; un jugador que envía en ese momento ve «El ranking está descansando».
- Mejora propuesta: consultar `GET /repos/{repo}/commits?sha=main&path=server&per_page=1` (último commit que tocó `server/`) o comparar un hash SHA-256 del contenido de los dos archivos descargados con el de la versión activa y, si coincide, actualizar solo el SHA guardado sin reiniciar. Combinado con el arranque en otro puerto del punto 3, el corte desaparece.

### 5. Media: el supervisor ejecuta lo que haya en `main` sin más control que la sintaxis

- Archivos: `server/ranking-supervisor.mjs:54-89` y `:114-118` (el hijo recibe todo el entorno, con `DATABASE_URL` y `RANKING_TOKEN_PEPPER`).
- Escenario: quien pueda escribir en `main` (personas, agentes o una cuenta o token de GitHub comprometidos) ejecuta código en el contenedor del ranking con acceso total a su base de datos en menos de 5 minutos, sin revisión. Es el diseño elegido y la descarga por SHA y HTTPS evita la manipulación en tránsito, pero conviene saberlo: las protecciones de la rama `main` son, en la práctica, las del servidor.
- Mejora propuesta: proteger `main` (revisión obligatoria o al menos comprobaciones verdes para cambios en `server/`, con un `CODEOWNERS` para esa carpeta), o hacer que el supervisor solo despliegue commits con una etiqueta firmada o que hayan pasado el flujo de CI (consultando `GET /repos/{repo}/commits/{sha}/check-runs`). Dar al hijo un usuario de PostgreSQL con solo los permisos necesarios sobre la tabla (y uno distinto, con `ALTER`, para la migración) limita el daño.

### 6. Baja: un alias válido con «İ» falla con 503 «reintentable»

- Archivos: `server/ranking-server.mjs:95` (`alias_key`), `server/ranking-server.mjs:10` (`VARCHAR(16)`), `server/ranking-server.mjs:176-179`.
- Escenario: `normalizeAlias` acepta «İ» (letra), pero `"İ".toLocaleLowerCase("es")` da dos caracteres («i» + punto combinante). Un alias de 16 «İ» produce una clave de 32 caracteres; PostgreSQL rechaza el `INSERT` (valor demasiado largo para `VARCHAR(16)`), y el servidor responde 503 `server_unavailable` con `retryable: true`. El cliente insiste para siempre con un alias que nunca va a entrar. Lo mismo pasa con alias más cortos si la expansión supera 16.
- Mejora propuesta: calcular `alias_key` en `normalizeAlias` (con `normalize("NFKC")` y la minúscula) y rechazar con 400 `invalid_alias` si la clave no cumple el patrón o pasa de 16 caracteres; o restringir el patrón a letras latinas (ver punto 9).

### 7. Baja: un carácter multibyte partido entre trozos rompe el alias

- Archivo: `server/ranking-server.mjs:80-91` (`body += chunk`).
- Escenario: cada trozo (`Buffer`) se convierte a texto por separado; si una «ñ» (dos bytes en UTF-8) queda partida entre dos trozos TCP, se convierte en caracteres de sustitución. Reproducido en local enviando «Ñoñoñoñoñoñoñoño» en dos trozos: 400 `invalid_alias` para un alias válido. Es raro con cuerpos tan pequeños, pero posible en redes móviles.
- Mejora propuesta: `request.setEncoding("utf8")` antes de leer (el decodificador conserva los bytes partidos), o acumular `Buffer`s, contar bytes (`chunk.length`) para el límite y hacer `Buffer.concat(chunks).toString("utf8")` al final. Comprobar también `Content-Length` antes de leer para rechazar pronto cuerpos grandes.

### 8. Baja: la migración endurece restricciones en cada arranque

- Archivo: `server/ranking-server.mjs:25-38`.
- Escenario: cada arranque borra y vuelve a crear las restricciones `CHECK` con los máximos de esa versión. Si una versión amplía un máximo (un mundo 18, más pegatinas) y entran datos con el valor nuevo, cualquier vuelta a una versión anterior (un `git revert` en `main`) falla al recrear la restricción más estrecha y no arranca; con el punto 3, eso además provoca un corte cada 5 minutos. Ahora mismo no pasa porque los máximos solo crecen.
- Mejora propuesta: no estrechar nunca restricciones en la migración automática: crear la restricción solo si no existe o si la nueva es más amplia (por ejemplo, con un número de versión del esquema en una tabla `super_noa_ranking_schema` y migraciones numeradas que solo avanzan), o validar los máximos en `validateProgress` y dejar en la base de datos solo límites amplios.

### 9. Baja: letras de otros alfabetos permiten suplantar

- Archivo: `server/ranking-domain.mjs:5`.
- Escenario: `\p{L}` admite cualquier alfabeto. «Noа» con «а» cirílica es un alias distinto de «Noa» y se ve igual, así que alguien puede aparecer en el tablón con el nombre de otro jugador.
- Mejora propuesta: limitar el patrón a letras latinas (`\p{Script=Latin}`) y números ASCII, y comparar la clave sin tildes (NFKD sin marcas) para que «Noá» y «Noa» cuenten como el mismo alias.

### 10. Baja: sin tiempos máximos hacia PostgreSQL

- Archivo: `server/ranking-server.mjs:188`.
- Escenario: el `Pool` se crea sin `connectionTimeoutMillis`, `statement_timeout` ni `query_timeout`. Si la base de datos se cuelga (bloqueo de la migración de otro proceso, disco lleno), cada petición se queda esperando una conexión indefinidamente; el cliente corta a los 7 s, pero el servidor acumula peticiones pendientes. `/health` también se queda colgado, y el supervisor no lo nota porque solo vigila la salud al arrancar.
- Mejora propuesta: `new Pool({ connectionString, max: 10, connectionTimeoutMillis: 3_000, statement_timeout: 5_000, query_timeout: 6_000 })`, y que el supervisor compruebe `/health` periódicamente (no solo al arrancar) y reinicie el hijo tras varios fallos seguidos.

### 11. Baja: sin espera creciente cuando el backend no arranca

- Archivo: `server/ranking-supervisor.mjs:251-256`.
- Escenario: si PostgreSQL no está disponible, el hijo sale al fallar la migración y el bucle vuelve cada 5 s: intenta arrancar la versión guardada, consulta GitHub y la vuelve a intentar. La API anónima de GitHub permite 60 consultas por hora, así que a los 5 minutos queda bloqueada y el log se llena del mismo error. Se recupera solo cuando vuelve la base de datos (bien), pero hace mucho ruido.
- Mejora propuesta: espera creciente (5 s, 10, 20… hasta 5 min) mientras no haya un hijo sano, y consultar GitHub como mucho al ritmo de `RANKING_UPDATE_INTERVAL_MS` aunque no haya hijo.

### 12. Baja: faltan cabeceras defensivas

- Archivo: `server/ranking-server.mjs:113-121`.
- Escenario: las respuestas llevan solo `Content-Type`, `Cache-Control` y CORS. No hay riesgo directo porque todo es JSON, pero `X-Content-Type-Options: nosniff` y `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` son gratis. Tampoco se responde 405 a un método no permitido (sale 404).
- Mejora propuesta: añadir esas dos cabeceras en `sendJson` y en la respuesta 204 del preflight.

### 13. Baja: `releases/` crece sin límite

- Archivo: `server/ranking-supervisor.mjs:59-89`.
- Escenario: cada SHA descargado deja su directorio y nunca se borra; con el punto 4, eso es uno por commit de `main`. Son unos 20 kB cada uno, así que tarda mucho en notarse.
- Mejora propuesta: tras confirmar una versión, borrar las de `releases/` que no sean la activa ni la anterior.

## Dudas (sin confirmar)

- D1. Orígenes CORS: por defecto solo se permite `https://mocheto.github.io` (`server/ranking-server.mjs:112` y `:198`). AGENTS.md menciona un dominio propio; si el juego se sirve también desde ahí, `RANKING_ALLOWED_ORIGINS` debe incluirlo en el contenedor. No he podido comprobar la configuración real.
- D2. Textos del cliente: `src/game/ranking.ts` tiene mensajes de error escritos en el código (por ejemplo, líneas 45, 84, 103, 117) en lugar de pedirlos al catálogo `adultos.ranking.…`, y muestra el `error` que devuelve el servidor (línea 76). Las pruebas del catálogo no fallan, así que quizá están exentos a propósito; si no, convendría moverlos al catálogo y mostrar los textos por `code` en lugar del texto del servidor.
- D3. `node --check` solo valida la sintaxis (`server/ranking-supervisor.mjs:54-57`): no detecta importaciones que faltan ni errores al cargar. Eso lo recoge la salud al arrancar, así que no es un fallo por sí mismo, pero agrava el punto 3. Una comprobación previa más fuerte sería importar los módulos en un proceso aparte (`node -e "await import(...)"`) sin conectarse a la base de datos.
- D4. Pimienta: si `RANKING_TOKEN_PEPPER` cambia, todas las tarjetas dejan de valer (`server/ranking-domain.mjs:75-77`) y nadie puede volver a enviar progreso con su alias. No hay rotación prevista; conviene documentar que no se cambie o admitir una pimienta anterior durante un tiempo.
- La comparación del hash del token con `!==` (`server/ranking-server.mjs:107`) y en `WHERE token_hash = $2` no es de tiempo constante, pero compara HMAC con pimienta secreta, así que no permite deducir el token. No lo considero un hallazgo.
- Las respuestas 401 frente a 409 en `/v1/devices` revelan si un `deviceId` existe, pero los identificadores son UUID aleatorios; y 409 `alias_taken` revela que un alias existe, algo que el propio tablón ya enseña. Sin impacto práctico.

## Pruebas que faltan

- Alias que cambian de longitud al pasar a minúsculas (punto 6) y cuerpos partidos en varios trozos (punto 7).
- Supervisor: un SHA que falla no se reintenta en cada comprobación (punto 3) y un commit que no toca `server/` no reinicia (punto 4).
- Límite de frecuencia y alias no permitidos, cuando se añadan.
- Ejecutar `ranking-postgres.test.mjs` en CI con un PostgreSQL de servicio, porque ahora se salta siempre y es la única prueba de la migración real.
