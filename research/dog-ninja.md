# Investigación: la dinámica de Dog Ninja (Rhythm Heaven)

Ticket: [#26](https://github.com/Mocheto/super-noa/issues/26) · Mapa: [#25](https://github.com/Mocheto/super-noa/issues/25) · Desbloquea: [#27](https://github.com/Mocheto/super-noa/issues/27)

Objetivo: entender, en líneas generales, cómo funciona el minijuego para inspirar un juego **original** de Super Noa. No se transcribe música, letras ni secuencias concretas.

> **Aviso sobre las fuentes.** Las wikis especializadas (rhythmheaven.fandom.com, rhwiki.net), StrategyWiki, GameFAQs y TV Tropes bloquearon la lectura automática durante esta investigación. Lo marcado como **confirmado** procede de fragmentos de esas páginas que devolvió el buscador y de Wikipedia. Lo marcado como **incierto** procede de recuerdos generales del juego o de una sola fuente débil, y conviene verificarlo viendo una partida antes de fijar números en el diseño.

## 1. Contexto

- **Confirmado.** Aparece en *Rhythm Heaven* (DS, 2008; *Rhythm Tengoku Gold* en Japón) como 23.º juego, tercero de la quinta fase, y vuelve en *Rhythm Heaven Megamix* (3DS) en la Torre Frondosa (29.º). En EE. UU. el subtítulo es "Tears of a Dog Ninja"; en Japón, 哀愁の犬忍者 ("el melancólico perro ninja").
- **Confirmado.** La premisa es humorística: un perro ninja sin trabajo acepta un empleo temporal cortando verduras y, si le pagan, también neumáticos, sartenes de hierro y huesos.
- **Confirmado.** Un águila con bufanda roja (Mister Eagle) entra volando al principio con un cartel que dice "¡Córtalo todo!". En la práctica, el ninja está en una habitación; en el juego real, al aire libre.

## 2. Bucle básico

- **Confirmado.** Los objetos entran en pantalla desde la izquierda, desde la derecha o desde **ambos lados a la vez**, y hay que cortarlos en el momento exacto. El ninja permanece en el centro y no se desplaza.
- **Confirmado.** Controles: en DS se mantiene el lápiz apoyado (postura de guardia) y se hace un *flick* para cortar; en Megamix se pulsa Ⓐ o se toca la pantalla. Hay **una sola acción** de corte.
- **Probable (incierto).** Un lanzamiento doble (uno por cada lado) se resuelve con **una sola** pulsación: el ninja corta los dos objetos con el mismo gesto. Lo que cambia es la lectura, no el control.

## 3. Pulsos entre lanzamiento y corte

- **Incierto.** No se encontró ninguna fuente que lo diga explícitamente. Según el recuerdo general del juego, el objeto vuela en arco y se corta **unos dos pulsos después** del sonido del lanzamiento, cuando llega a la altura del ninja. La distancia es fija para cada tipo de lanzamiento, así que el jugador aprende a contar "lanzan… y ¡corta!".
- Lo importante para el diseño: el aviso llega **siempre con la misma antelación**, y esa antelación es corta (unos dos pulsos), no ocho como en Disc Dog. (Disc Dog, otro minijuego de la serie, usa el patrón "lanzamiento y respuesta un pulso después del séptimo"; algunos resultados de búsqueda los confundían).

## 4. Tipos de objeto y lo que piden

| Tipo | Qué pide | Grado de certeza |
|---|---|---|
| Objeto suelto desde un lado (verduras, fruta) | Un corte a tiempo | Confirmado |
| Pareja desde ambos lados a la vez | Un corte que parte los dos | Confirmado que existen; incierto que baste una pulsación |
| Objetos "duros" (neumático, sartén de hierro, hueso) | Igual que los sueltos; son variedad visual y cómica, no un control nuevo | Confirmado que existen; incierto que no cambien la mecánica |
| Objeto especial o grande al final | No se pudo confirmar ninguno | Incierto |

No se encontró evidencia de objetos que pidan mantener pulsado, de cortes múltiples sobre un mismo objeto ni de objetos señuelo que no haya que cortar.

## 5. Avisos sonoros y visuales

- **Confirmado (general de la serie).** Rhythm Heaven está diseñado para jugarse escuchando: cada acción la anuncia un sonido propio que llega antes del momento de pulsar.
- **Probable (incierto).** Cada lanzamiento suena como un "zas" o golpe de lanzamiento que procede del lado del que viene el objeto, y el objeto aparece en ese mismo borde. El lanzamiento doble tendría un sonido distinguible del simple para que se pueda anticipar sin mirar.
- **Confirmado.** El cartel del águila al principio funciona como aviso de "empieza el juego", fuera del ritmo de los cortes.

## 6. Cómo se integra el corte en la música

- **Confirmado.** Los resultados se ven y se oyen: con **Perfect/Ace** el objeto queda partido limpiamente en dos; con **Early/Late** rebota en la hoja soltando humo; con **Miss** no se corta.
- **Inferencia razonable.** El sonido del corte cae sobre un pulso fuerte de la canción, de modo que un acierto "completa" la música (el chasquido funciona como un instrumento de percusión más) y un fallo deja un hueco o un ruido desafinado. Es el principio general de la serie, no un dato específico de este minijuego.

## 7. Tempo y estructura

- **Probable.** Dos listados de tempos de la serie (la wiki de Rhythm Heaven y una respuesta de GameFAQs) dan **104 BPM**: tempo medio y tranquilo.
- **Confirmado.** Tiene un tema musical propio. Es el único juego de la versión de DS cuya música de presentación no se comparte con otros minijuegos.
- **Incierto (estructura general).** Como en otros minijuegos de la serie: entrada (el águila con el cartel), bloques que alternan lanzamientos simples de un lado, del otro y dobles, con densidad creciente, y un cierre. No se reproduce ninguna secuencia concreta.

## 8. Margen de acierto y evaluación final

- **Confirmado.** Cada corte se juzga como Perfect/Ace, Early/Late o Miss, con la reacción visual descrita.
- **Incierto.** Los milisegundos exactos de la ventana no se publican en ninguna fuente consultada.
- **Confirmado (serie).** Al terminar no hay estadísticas detalladas: solo aparece un rango, **Try Again**, **OK** (o "Just OK") o **Superb**, con un comentario corto sobre lo que salió bien o mal. OK o más permite avanzar; Superb da una medalla; los juegos con Superb pueden salir al azar en un reto "Perfect" (sin ningún fallo, con tres intentos).
- **Incierto.** En Megamix el rango se asocia a una puntuación de 0 a 100. Los umbrales concretos (se citan a menudo 60 para OK y 80 para Superb) no pudieron verificarse.

## 9. Ideas que se pueden tomar sin copiar

Mecánicas genéricas (no protegibles) que sí sirven de inspiración:

1. **Una sola acción**, siempre la misma, y variedad en *qué* llega y *desde dónde*.
2. **Aviso sonoro con antelación fija** (unos dos pulsos) y lado reconocible, para que se pueda jugar de oído.
3. **Lanzamiento doble = un solo gesto**: mayor espectáculo sin más dificultad motriz, ideal para una niña de cinco años.
4. **Respuesta graduada**: acierto = el objeto se parte y suena dentro de la música; casi = rebota con una nube cómica; fallo = no pasa nada grave.
5. **Tempo medio** (alrededor de 100 BPM) y una evaluación final con tres niveles en palabras amables, sin números.
6. **Humor** en los objetos: cosas imposibles de cortar que se cortan igual.

Hay que evitar: personajes (perro ninja, águila con cartel), textos, música, efectos de sonido, arte y secuencias del original.

## Fuentes

- Wikipedia, *Rhythm Heaven (video game)*: estructura de juegos, rangos Try Again/OK/Superb, medallas y reto Perfect, controles táctiles. https://en.wikipedia.org/wiki/Rhythm_Heaven_(video_game)
- Rhythm Heaven Wiki (Fandom), *Dog Ninja* y *Dog Ninja!* (fragmentos de búsqueda: controles de DS, cartel del águila, práctica en interior, BPM). https://rhythmheaven.fandom.com/wiki/Dog_Ninja · https://rhythmheaven.fandom.com/wiki/Dog_Ninja!
- Rhythm Heaven Wiki (rhwiki.net), *Dog Ninja* y *Dog Ninja and Mister Eagle* (fragmentos de búsqueda: entrada desde ambos lados, juicio Perfect/Early/Late/Miss, controles de Megamix, objetos, título japonés). https://rhwiki.net/wiki/Dog_Ninja · https://rhwiki.net/wiki/Dog_Ninja_(character)
- Rhythm Heaven Wiki (Fandom), *Mister Eagle*. https://rhythmheaven.fandom.com/wiki/Mister_Eagle
- GameFAQs, pregunta sobre tempos de la serie (BPM de Dog Ninja). https://gamefaqs.gamespot.com/ds/946576-rhythm-heaven/answers/586665-how-fast-is-remix-8-ds
- Nintendo Life, reseña de *Rhythm Heaven* (DS). https://www.nintendolife.com/reviews/2009/04/rhythm_heaven_ds
- Plugged In, reseña de *Rhythm Heaven*. https://www.pluggedin.com/game-reviews/rhythmheaven/
- Rhythm Heaven Wiki (Fandom), *Disc Dog* (solo para descartar la confusión del "lanzamiento y respuesta"). https://rhythmheaven.fandom.com/wiki/Disc_Dog
- Guía no oficial *Ranks & Perfects* (fuente débil sobre la puntuación de 0 a 100 en Megamix). https://rhythm-heaven-groove.pages.dev/ranks-and-perfects

Pendiente de verificar viendo una partida (sin copiar nada): pulsos exactos entre lanzamiento y corte, si el doble se resuelve con un solo gesto, sonido distintivo del doble y si existe un objeto especial al final.
