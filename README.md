# Super Noa

Juego infantil de plataformas en 2D creado para navegador. Incluye diez mundos de campaña con tres pantallas cada uno, un desvío acuático de tres pantallas y un reino secreto desbloqueable en las nubes. Hay doble salto, tres vidas, rutas elevadas, 36 insignias coleccionables, puntos de control, cajas de recompensa, precipicios y doce duelos contra guardianes. La aventura continúa tras el castillo por una isla jurásica, un volcán de dragones, un valle de flores gigantes y una montaña de hielo.

Al terminar una pantalla normal, Noa toca un banderín elevado —también puede hacerlo al saltar—, se coloca junto al gatito y aparece una breve celebración antes de continuar.

El mapa de la aventura es un paisaje ilustrado continuo: los caminos dorados muestran los mundos abiertos y la laguna y el reino de las nubes aparecen como desvíos. Toca un lugar para abrir su resumen, consultar medallas y pegatinas, y elegir una pantalla. En móvil, desliza el mapa horizontalmente.

Los objetivos y las pistas del selector de pantallas están ocultos por defecto. Aparecen al mantener el ratón sobre una pantalla durante 0,9 segundos o al pulsar sus estrellas con ratón, pantalla táctil, teclado o mando; pulsar la tarjeta sigue iniciando la partida. Solo se abre una ayuda a la vez. La ayuda incluye llegar a la meta, encontrar cada pegatina, completar la pantalla sin perder vidas y, cuando hay un guardián, conseguir su reto de amistad, junto con una pista del siguiente objetivo pendiente. Las pantallas cerradas no revelan sus pistas. El álbum también indica dónde falta cada pegatina.

Las mecánicas cuentan con sprites originales de sueño y despertar del lobo, flor cerrada/abriéndose/abierta/avisando, puente de pétalos, aire ascendente, viento, lava, agua del valle y del hielo, poza de entrada, barcos voladores, tablones aéreos y niebla. Se cargan solo donde hacen falta y conservan un dibujo provisional visible si la imagen tarda o falla. Los recortes del puente, los tablones y la cubierta del barco mantienen la superficie transitable original; no cambian colisiones, rutas ni tiempos. `node scripts/build-mechanic-sprites.mjs` regenera sus doce PNG transparentes sin dependencias externas; añade `--check` para verificar los archivos existentes o `--contact-sheet` para generar una vista conjunta.

Los enemigos del volcán, el valle y el hielo usan recortes individuales de su silueta, no mitades iguales de sus atlas compartidos con los jefes. Las hormigas y los caracoles apoyan sus patas en la base de colisión; los dragones terrestres y las salamandras tienen la altura necesaria para llegar al suelo. El volcán incorpora dos, tres y cuatro dragones voladores respectivamente: sus patrullas se declaran en cada pantalla, oscilan suavemente, se detienen con la pausa y dejan libre el camino bajo sus alas. Su sprite original de cuatro poses se genera con `node scripts/build-flying-dragon.mjs` y se comprueba añadiendo `--check`.

En el bosque de los lobos, las señales `ZZZ` indican que puedes pasar sin recibir daño; antes de despertar, cada lobo avisa y después vuelve a patrullar. El valle tiene puentes de pétalos que se abren y avisan antes de cerrarse: siguen siendo transitables durante el aviso y siempre hay una alternativa mediante los saltos originales. En el reino secreto, las columnas de aire señaladas con flechas elevan suavemente a Noa solo dentro de su zona; no permiten volar libremente. Estos ciclos se detienen con la pausa y las reapariciones usan apoyos permanentes.

La primera pantalla del castillo mide 5.200 unidades, un 30 % más que antes, con una cuarta zona de pinchos, más plataformas, manzanas y un cuarto checkpoint. Cada pantalla del mundo tiene dos perritos mecánicos de cobre sujetos a un poste: patrullan, paran y muestran un aviso antes de lanzarse a morder, sin superar el alcance declarado de su cadena. No se derrotan con pisotones ni con lana; hay plataformas para pasar por arriba y checkpoints fuera de su alcance. El ciclo se congela al pausar. Perro, poste y eslabones son sprites originales que se regeneran con `node scripts/build-castle-hound.mjs`; añade `--check` para verificar sus tres PNG.

### Rincones secretos de gatitos

Las pantallas `1-2`, `3-2`, `6-2`, `10-2` y `12-2` esconden una puerta en una plataforma secundaria segura, aproximadamente entre el 27 % y el 32 % del recorrido, fuera de la cámara inicial. De pie delante de ella, pulsa arriba en teclado o mando, o toca «↑ Entrar». Fuera de la puerta, arriba conserva su salto habitual de teclado. Dentro, detén las orejas, la cara y las patitas para formar uno de los tres gatitos del juego: cada tienda usa su propio grupo, siempre con el gatito de su mundo. Las bandas cambian de gatito cada 850 ms, frente a los dos segundos iniciales, y encajan en la figura más cercana al parar. No hay apuestas, coste, límite de tiempo ni pérdida de vidas. Solo hay una partida por recorrido: salir, morir o reaparecer en un checkpoint no recupera la oportunidad; reiniciar la pantalla sí.

Tres partes iguales conceden **Noa Estelar durante 12 segundos** y marcan la tienda como superada; dos iguales conceden **5 segundos**, sin marcarla superada. El resto forma un gatito divertido, sin premio ni castigo. La protección empieza al volver, se congela con la pausa y evita el daño de enemigos y proyectiles, pero no los fosos, el agua mortal ni el suelo de lava. No hay burbuja: pequeñas estrellas doradas, violetas y blancas rodean a Noa, mientras su figura alterna destellos de luz y su color original. Son pulsos locales suaves de 1,5 Hz, sin iluminar toda la pantalla; con movimiento reducido la luz permanece fija. Al terminar conserva el potenciador que Noa ya tenía; perder una vida cancela las estrellas.

La aventura exterior queda congelada durante la visita. El mapa y las tarjetas muestran una puerta pendiente, visitada o superada, sin permitir entrar desde el mapa ni cambiar las medallas, pegatinas o el ranking. Estas marcas se guardan localmente y se borran al reiniciar la campaña. Las explicaciones siguen dentro de las ayudas que se abren al interactuar, no desplegadas permanentemente.

`node scripts/build-secret-shop-art.mjs` regenera el arte original de la tienda; `node scripts/build-shop-world-cats.mjs` prepara las cinco hojas pequeñas a partir de los retratos originales de los doce mundos, sin deformarlos ni cortar sus siluetas. Añade `--check` para verificar los archivos. `node scripts/build-star-music.mjs` compone «Brillo de Noa»: 12 segundos originales a 160 BPM, con notas agudas, corcheas y semicorcheas para transmitir que la invencibilidad es breve, sin subir excesivamente el volumen. Requiere Node.js y FFmpeg; `--check` compara la composición reproducible con el MP3. Suena solo durante las estrellas y la música del mundo continúa desde su posición anterior al terminar. En la cueva de hielo, la primera ráfaga termina antes del nuevo rincón de la tienda para que el viento no empuje a Noa al entrar o salir.

## Desarrollo

```bash
npm install
npm run dev
```

## Verificación y GitHub Pages

```bash
npm test
npm run preview:pages
```

La compilación estática se genera en `dist-pages/`. El workflow `.github/workflows/super-noa-pages.yml` la publica en GitHub Pages después de cada push a `main`.

La comprobación `npm test` ejecuta lint, pruebas de lógica y compilación con comprobación estricta de TypeScript. También puedes ejecutar `npm run typecheck` por separado. Las pruebas cubren reglas de movimiento, estructura de niveles y del mapa, checkpoints seguros, objetivos, recursos pendientes, recogidas al terminar, transiciones pausables, guardados antiguos, entrada del mando y recuperación del ranking.

## Controles

- Movimiento: flechas o `A`/`D`.
- Salto y doble salto: pulsa una o dos veces espacio, `W` o flecha arriba.
- Cajas con huella: se abren saltando y golpeándolas desde abajo.
- Bola de lana: `X` o `K`, después de recoger el potenciador de gato de una caja.
- Pausa: `Esc` o el botón del HUD. El juego se pausa automáticamente al ocultar la pestaña, bloquear el dispositivo o perder el foco; al volver, pulsa «Seguir jugando».
- Los cuadros de ajustes, ayuda y colección mantienen el foco dentro, se cierran con `Esc` y devuelven el foco al botón que los abrió. Rendirse en un duelo pide confirmación tanto con mando como con los botones de pantalla.
- Monstruos finales: gana dos rondas de piedra, papel o tijera. Cada derrota puede repetirse gastando una manzana; sin manzanas se reinicia la pantalla, pero no se pierde una vida. También puedes rendirte y volver al mapa.
- Rutas especiales: ramas elásticas en el mundo 1, plataformas de niebla en el mundo 2, aullidos de aviso en el mundo 3, copas altas en el mundo 4, barcos voladores con cañones en el mundo 5 y pasillos con pinchos y perritos encadenados en el mundo 6. En el mundo de los jabalíes hay un bloque secreto elevado que crea una enredadera hacia el Reino Secreto de las Nubes: golpéalo desde abajo y toca la enredadera para elegir ese camino.
- Álbum: hay una pegatina opcional por pantalla de campaña, tres en la laguna y tres en el reino secreto.
- En móvil o tableta aparecen controles táctiles grandes, etiquetados con `IZQ.`, `DER.`, `LANA` y `SALTAR`. Mantén una dirección con un dedo y toca `SALTAR` con otro para hacer el doble salto.
- También se admite un mando mediante Gamepad API. Usa la cruceta o palanca izquierda para caminar y recorrer los menús, `A` para saltar o confirmar, `X`/`B` para lanzar lana, `B` para volver en menús y duelos, y `Start` para pausar o reanudar. En los duelos, la cruceta o palanca elige el gesto y `A` confirma, avanza de ronda, reintenta o continúa.

El progreso y las pegatinas se guardan únicamente en el navegador con la clave `super-noa-progress-v1`. El formato actual es la versión 2 y conserva la lectura de guardados anteriores. Si el navegador bloquea el almacenamiento, el juego sigue funcionando y muestra un aviso de que el progreso podría perderse. Las 36 insignias tienen sprites troquelados propios agrupados por mundo en `public/assets/stickers/`; el mismo dibujo aparece en la pantalla y en el álbum. El estado «Protegida» se reconoce por una burbuja psíquica dibujada alrededor de Noa en todas sus poses. La coraza alternativa queda guardada en `public/assets/alternatives/noa-armor-v1.png`, pero no está activa.

El tablón ordena por pantallas de campaña completadas, no por los identificadores del agua o del reino secreto. La tarjeta del alias se guarda antes de registrarla para poder reintentar una respuesta perdida sin reservar otro alias. Si el navegador no puede guardarla, no se inicia el registro. Los fallos de envío se muestran como pendientes y se reintentan al recuperar la conexión; nunca impiden leer el tablón ni seguir jugando.

Al empezar una aventura sin tarjeta, se pide un alias si el servicio está disponible. Si está caído, se permite jugar y se aplaza la petición hasta recuperar el servicio en un menú seguro, sin interrumpir una pantalla o un duelo. El tablón muestra todas las manzanas recogidas, incluidas las de cajas, reintentos y repeticiones; gastar una manzana no reduce este total histórico. «Borrar progreso» reinicia la campaña y la colección, pero conserva las manzanas históricas del alias para seguir sumando; el ranking mantiene sus mejores logros. En guardados anteriores solo se puede recuperar la suma de los mejores resultados conservados, no las recogidas antiguas que nunca se guardaron. También muestra la fecha del último progreso conseguido, no la del último envío: abrir el tablón o sincronizar de nuevo no cambia la fecha. Los registros históricos sin fecha conocida la muestran como desconocida.

La API migra de forma aditiva las columnas `total_apples` y `achieved_at`, admite clientes anteriores y combina contadores sin permitir que un envío antiguo los reduzca. Ordena por pantallas, pegatinas, retos y manzanas; los empates favorecen la fecha de logro anterior conocida. `/health` solo indica disponibilidad cuando responde PostgreSQL con el esquema necesario. La prueba opcional de integración con PostgreSQL utiliza `TEST_RANKING_DATABASE_URL` y crea un esquema de prueba aislado.

El contenedor del tablón debe ejecutar `node server/ranking-supervisor.mjs`. El supervisor comprueba `main` cada cinco minutos (`RANKING_UPDATE_INTERVAL_MS`), valida una versión antes de activarla y conserva la anterior si falla. Los cambios del propio supervisor requieren actualizar su archivo y reiniciar su proceso Node; no se recrea el contenedor ni se modifican los volúmenes o PostgreSQL.

Los gráficos de partida se cargan por mundo y los poderes se solicitan cuando hacen falta. Los recursos iniciales optimizados conservan los píxeles y la transparencia con WebP sin pérdida; los PNG originales siguen disponibles. Mientras llega un atlas de enemigos, su silueta permanece visible.

El bosque de manzanos, el volcán, el valle de flores gigantes y la montaña de hielo tienen composiciones originales propias. El bosque usa una melodía cálida y tranquila, independiente de la pista que conservan los piratas. La música conserva su posición al pausar, silenciar o ajustar el volumen. Para regenerar estos temas se necesita FFmpeg:

```bash
node scripts/build-adventure-music.mjs
node scripts/build-adventure-music.mjs --check
```

Los cañones, sus bolas, los puntos de control y los banderines usan sprites propios en `public/assets/sprites/`.

## Organización del código

- `src/App.tsx` coordina pantallas, HUD, música y pausa automática; `src/game/progress.ts` lee, valida y guarda el progreso y `storage.ts` protege todo acceso al almacenamiento local.
- `src/game/GameCanvas.tsx` coordina la partida. `rendering.ts` dibuja los mundos, `assets.ts` carga y reutiliza los recursos de cada mundo, `input.ts` gestiona teclado y tacto, y `gameLoop.ts` ejecuta la física en pasos constantes de 60 Hz.
- `src/game/levels.ts` mantiene los niveles y sus rutas especiales de forma declarativa; `routes.ts` resuelve el avance de campaña. `WorldMap.tsx` dibuja la interfaz interactiva sobre la ilustración original `public/assets/worlds/noa-adventure-map-v1.png`; `worldMapData.ts` define lugares y caminos. `gamepad.ts`, `menuGamepad.ts` y `duelGamepad.ts` interpretan el mando durante la partida, los menús y los duelos.

## Licencias

El personaje, los doce monstruos finales, los gatitos de recuerdo, los escenarios, el código y los efectos sintetizados se crearon para este proyecto. La música reutilizada de los primeros mundos procede de “Platformer Chiptunes”, de Guy G. Gamerson, publicada bajo CC0; las pistas originales conservan su atribución. Consulta [CREDITS.md](CREDITS.md).
