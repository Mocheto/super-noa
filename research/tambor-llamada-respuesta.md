# Llamada y respuesta con tambor en juegos rítmicos

Investigación para [#36](https://github.com/Mocheto/super-noa/issues/36), dentro del mapa [#35 «El tambor de Armonía»](https://github.com/Mocheto/super-noa/issues/35). Alimenta las decisiones de [#38](https://github.com/Mocheto/super-noa/issues/38) (canción, tempo y alternancia) y [#39](https://github.com/Mocheto/super-noa/issues/39) (patrones, fases y ayuda visual).

Se recogen solo **ideas generales** de diseño. No se copian música, personajes, voces, gráficos ni secuencias de ningún juego. Se usa el vocabulario de `GLOSSARY.md`: **Pulso**, **Compás**, **Golpe**, **Llamada** y **Respuesta**.

## Resumen

- La llamada y respuesta es la estructura más común de los juegos rítmicos para principiantes. Primero se demuestra y después se repite. La dificultad está en ejecutar al compás, no en descifrar qué hay que hacer.
- La unidad habitual es **un compás de cuatro pulsos por turno**. Es lo que hace Patapon (cuatro pulsos de la jugadora y cuatro de respuesta del ejército). También es la recomendación de la didáctica musical infantil: los ecos más fáciles son de cuatro pulsos.
- El cambio de turno se marca **con el cuerpo y con un sonido fijo**, no solo con texto. En el aula, la maestra se gira o se inclina hacia la clase y usa un cencerro. En los videojuegos, el personaje que llama queda quieto o «espera» mientras le toca a la jugadora.
- La progresión infantil más citada es esta: cuatro golpes en los cuatro pulsos, después tres golpes y un silencio en el cuarto pulso, y por último ritmos con más silencios o golpes seguidos. Los medios pulsos llegan mucho más tarde. En nuestro caso no llegan, porque todos los golpes caen en pulsos enteros.
- La ayuda visual eficaz **representa el patrón entero mientras se responde**: la tira de símbolos de PaRappa, el marco que late al pulso en Patapon y las formas distintas por tipo de golpe de Rhythm Doctor. Las huellas luminosas ya decididas en el mapa encajan con esta idea.
- El golpe de la jugadora **suena siempre como un instrumento** y forma parte de la música. El acierto se distingue con brillo o con un acento, no con un pitido aparte. Los juegos más amables para principiantes evitan los sonidos de castigo y toleran el juego «suelto».
- Ajustar la dificultad sobre la marcha (PaRappa 2 simplifica las llamadas si la jugadora falla) es una buena idea para una niña de cinco años.

## Juegos y fuentes revisados

### Lecciones de tambor de Rhythm Tengoku (GBA)

- Contra lo que dice el ticket, las lecciones de tambor no están en *Rhythm Heaven Fever*. Son una sección extra del *Rhythm Tengoku* original, con 19 lecciones que se desbloquean con medallas. En *Fever* las sustituyeron por lecciones de guitarra. ([Rhythm Heaven Wiki: Drum Lesson](https://rhythmheaven.fandom.com/wiki/Drum_Lesson), resumen obtenido por búsqueda; la página devolvió 402 al leerla directamente.)
- El maestro toca un patrón de demostración y la jugadora lo repite. Mientras ella no toca, el maestro sigue esperando: el turno no caduca.
- Para «subir de nivel» hay que copiar bien el patrón **varias veces seguidas**. Un fallo hace retroceder el contador, y el maestro se encoge de hombros, que es una respuesta suave y sin daño.
- Arriba hay un indicador de precisión que destella con cada golpe.
- **Demasiado cerca para copiar:** el maestro tamborilero samurái, el contador de «subir de nivel» con su número concreto de repeticiones, el indicador de precisión con su aspecto y las secuencias de cada lección.

### Rhythm Heaven / Rhythm Tengoku en general

- Casi todos los minijuegos son un bucle de llamada y respuesta. La música lleva el tiempo: el audio guía y lo visual acompaña. ([guía de aficionados](https://rhythm-heaven-groove.pages.dev/how-it-works), fuente secundaria; [Wikipedia](https://en.wikipedia.org/wiki/Rhythm_Heaven_Fever))
- Cada minijuego enseña una sola mecánica, con una demostración muy guiada que se puede saltar, y los controles son mínimos. ([GameRevolution](https://www.gamerevolution.com/review/54549-rhythm-heaven-fever-review), [GamesRadar](https://www.gamesradar.com/uk/rhythm-heaven-fever-preview-robots-monkeys-and-luchador))
- **Demasiado cerca para copiar:** las voces o palabras de aviso de cada minijuego, sus personajes y sus canciones.

### PaRappa the Rapper

- El maestro canta una línea mientras arriba aparece una tira de símbolos que muestra qué botón va en cada momento. Después la jugadora la repite al compás, «como Simón dice». ([Wikipedia](https://en.wikipedia.org/wiki/PaRappa_the_Rapper))
- Un medidor con cuatro niveles valora la actuación. Mantenerse al compás basta para quedarse en el nivel «bien». Si se sale del ritmo, el maestro vuelve a enseñar.
- Es tolerante: premia tocar con soltura más que acertar cada nota. ([PlayStation Blog](https://blog.playstation.com/archive/2017/04/03/extended-play-how-parappa-the-rapper-ushered-in-a-music-game-revolution))
- Un inconveniente señalado: la mitad del tiempo se pasa mirando la demostración. Por eso conviene que la llamada sea corta y también musical.
- En la secuela, las llamadas se **simplifican si la jugadora tiene dificultades** y se complican si lo hace bien. ([Wikipedia: PaRappa 2](https://wikipedia.com/wiki/PaRappa_the_Rapper_2))
- **Demasiado cerca para copiar:** el maestro con forma de animal que rapea, la tira de símbolos con su forma concreta, el medidor con sus cuatro nombres y las letras.

### Patapon

- Cada botón es un tambor distinto. La jugadora toca una orden de **cuatro pulsos** y el ejército responde durante los cuatro siguientes, siempre en compás de 4/4. Un marco que **late en el borde de la pantalla** marca el pulso. ([Wikipedia](https://en.wikipedia.org/wiki/Patapon), [Destructoid](https://www.destructoid.com/review-patapon-remastered/))
- Encadenar órdenes a tiempo crea una racha que lleva a un estado de «fiebre». Un golpe a destiempo la rompe.
- Es el modelo inverso al nuestro (la jugadora llama y el juego responde), pero confirma que **un compás por turno** se entiende y suena bien.
- **Demasiado cerca para copiar:** las sílabas de cada tambor, las órdenes concretas, el estado de «fiebre» con ese nombre y su estética.

### Taiko no Tatsujin

- Hay dos golpes de tambor (centro y borde) y varios niveles de dificultad. En los niveles bajos no hay golpes rápidos superpuestos. ([Wikipedia](https://en.wikipedia.org/wiki/Taiko_no_Tatsujin), [TheGamer](https://www.thegamer.com/taiko-no-tatsujin-the-drum-master-beginner-tips/))
- La guía de partituras para principiantes de osu!taiko, un clon de aficionados, exige al menos **medio pulso entre golpes**. Por debajo de eso se considera demasiado para principiantes. ([osu! wiki](https://osu.ppy.sh/wiki/Taiko_Ranking_Criteria))
- No es un juego de llamada y respuesta. Sirve como referencia de un tambor que suena de verdad con cada golpe.
- **Demasiado cerca para copiar:** el tambor con cara, los dos colores asociados a los dos golpes, los nombres de los golpes y las notas que avanzan por una cinta.

### Rhythm Doctor

- Se juega con un solo botón. Cada mecánica se enseña con una canción que presenta una idea rítmica en varias variantes, como un ejercicio de instrumento. Las ideas difíciles se retrasan y antes se añaden niveles que preparan. ([Game Developer](https://www.gamedeveloper.com/design/using-medical-stories-and-heart-conditions-to-create-musical-challenges-in-rhythm-doctor))
- Hay un nivel de llamada y respuesta en el que la voz de una enfermera anuncia lo que viene. Los golpes múltiples se avisan por voz. ([PC Gamer](https://pcgamer.com/rhythm-doctor-has-the-best-distraction-mechanics-ive-seen-in-any-rhythm-game))
- Cada tipo de golpe tiene un dibujo distinto, y los pulsos que no se tocan se marcan explícitamente. El objetivo es que la jugadora **interiorice** el ritmo y que el juego se pueda jugar también solo de oído.
- **Demasiado cerca para copiar:** la línea de electrocardiograma, el «séptimo pulso» y la enfermera que avisa.

### Didáctica musical infantil (ecos y «Simón dice»)

- Los ecos más fáciles son de **cuatro pulsos**. La maestra da palmas con un patrón corto y la clase lo repite. ([Wee Sing](https://weesing.com/t/13), [Music in Bloom](https://journal.childrensmusic.org/pass-it-on/columns/tapping-into-musical-power.aspx))
- El turno se señala **girando el cuerpo**: la maestra se aparta cuando toca ella y se inclina hacia la clase cuando le toca responder. Se usa un instrumento fijo como aviso, por ejemplo un cencerro. Hay que enseñar expresamente a **esperar el turno**. ([Music Rhapsody](https://musicrhapsody.com/echo-patterns-how-to-begin/))
- La progresión recomendada es: cuatro golpes en los cuatro pulsos, después tres golpes con el cuarto pulso en silencio, y más tarde una síncopa sencilla. La voz se va retirando: primero se dice y se toca, luego solo se toca. El error más citado es empezar demasiado difícil.
- Hay variantes de «Simón dice» con un ritmo prohibido que no hay que repetir, para niños de 5 a 11 años. ([Teaching Ideas](https://www.teachingideas.co.uk/?p=3800))

### Legibilidad de las señales

- Hay que enseñar cada señal antes de examinarla, darle siempre el mismo significado y evitar las señales ambiguas o engañosas. La dificultad debe estar en ejecutar, no en descifrar. ([Pixel Poppers](https://pixelpoppers.com/2019/06/rhythm-and-readability/))

## Respuestas a las preguntas del ticket

| Pregunta | Lo que hacen los juegos | Idea para el tambor de Armonía |
|---|---|---|
| Duración de la llamada | Un compás de cuatro pulsos (Patapon, ecos infantiles). PaRappa usa una frase entera, de uno a dos compases. | Un compás de llamada y un compás de respuesta. |
| Cambio de turno | Gesto corporal y sonido fijo (aula), personaje que espera (Tengoku), voz que anuncia (Rhythm Doctor). | Gesto de Armonía y sonido fijo en el cuarto pulso, siempre iguales. No usar solo texto. |
| Patrones y dificultad | Cuatro golpes, después silencios y golpes seguidos, más tarde síncopas. Cada idea en varias variantes. Adaptación sobre la marcha (PaRappa 2). | Solo pulsos enteros. Una idea nueva por fase, repetida con variantes. |
| Ayuda visual en la respuesta | Tira de símbolos (PaRappa), marco que late (Patapon), dibujo por tipo y silencio marcado (Rhythm Doctor). | Huellas luminosas en cada pulso del compás y silencios visibles. |
| Acierto y fallo | El instrumento suena siempre. Acierto con destello o indicador. Fallo suave (encogimiento de hombros, retroceso del contador). | Tambor de Noa siempre audible. Acierto con brillo y acento. Fallo sin sonido de daño. |
| Tempo | En los juegos de iniciación, tempo medio y estable. No se encontró una cifra oficial fiable. | 100 ppm dentro del rango confirmado de 96 a 104. |
| La entrada como música | En Rhythm Doctor la canción es el nivel. En Taiko y Patapon el golpe es el sonido del tambor. | La respuesta de Noa completa la frase musical que deja abierta la llamada. |

## Recomendaciones

### Para #38: canción, tempo y alternancia

1. **Tempo de 100 ppm**, igual que los gatitos leñadores (`PARTY_BPM = 100`). Así cada pulso dura 0,6 s, cada compás 2,4 s y cada pareja de llamada y respuesta 4,8 s.
2. **Alternancia estricta de un compás de llamada y un compás de respuesta.** En una canción de unos 55 s caben unos 23 compases: un compás de cuenta de entrada, diez parejas (20 compases) y dos compases de cierre. Son unos 55,2 s.
3. **Señal de turno fija en el cuarto pulso de la llamada.** Recomendado: un sonido de aviso distinto de ambos tambores (por ejemplo, un cascabel o un «¡tú!» de Armonía) y un gesto de Armonía, que gira y señala a Noa con la baqueta. Al final de la respuesta, el gesto contrario («me toca»). Para que el aviso no choque con los golpes, en las fases 1 y 2 los patrones **dejan libre el cuarto pulso** de la llamada, igual que el eco de «tres golpes y silencio» de la didáctica.
4. **Pregunta y respuesta en la canción.** El acompañamiento hace una frase que queda «abierta» en la llamada y se «cierra» en la respuesta. Así, los golpes de Noa completan la música aunque falle alguno. El acompañamiento no se detiene nunca.
5. **Dos timbres de tambor bien distintos:** grave y redondo para Armonía, más agudo o con cascabeles para Noa. Así se oye quién toca aunque no se mire, siguiendo la idea de Rhythm Doctor de que se pueda jugar de oído.

### Para #39: patrones, fases y ayuda visual

1. **Solo golpes en pulsos enteros**, como exige el glosario. Nunca hay menos de un pulso entre golpes. La guía de principiantes de osu!taiko pide medio pulso como mínimo, y nosotros nos quedamos muy por encima.
2. **Fases sugeridas**, cada una con una idea nueva y varias variantes:
   - **Fase 1:** uno o dos golpes sueltos en los pulsos 1 a 3, con el cuarto pulso libre para el aviso.
   - **Fase 2:** tres golpes con un silencio dentro, por ejemplo en los pulsos 1, 2 y 3, o en los pulsos 1 y 3 con el 2 en silencio.
   - **Fase 3:** golpes seguidos y patrones que usan también el cuarto pulso. Para entonces, el gesto basta como aviso de turno.
3. **Sin distractor en la primera versión.** El «ritmo prohibido» de la didáctica es una idea válida para más adelante, pero añade la necesidad de descifrar, y la prioridad es que se entienda qué hacer. Queda como pregunta abierta.
4. **Huellas luminosas durante toda la canción**, también en la última fase. Hay que marcar visiblemente los pulsos de silencio, como hace Rhythm Doctor, para que «no tocar» también se vea. Cada huella se enciende en su pulso.
5. **Margen de acierto:** reutilizar el de la abeja y los gatitos, medio pulso (unos ±300 ms a 100 ppm).
6. **Un golpe de más o a destiempo suena, pero no resta.** Es la tolerancia de PaRappa. La respuesta se valora por las huellas acertadas.
7. **Dificultad adaptativa suave**, opcional: si una respuesta falla, repetir la misma llamada en la siguiente pareja en lugar de avanzar. Es la idea de PaRappa 2. Así no hay castigo, pero sí aprendizaje.
8. **Práctica:** una demostración breve de una o dos parejas en la que Armonía llama, una Noa «fantasma» responde sola y se enseñan el gesto y el sonido de turno. Después, una pareja con red. Hay que enseñar cada señal antes de examinarla.

## Preguntas abiertas

- ¿El aviso de turno es una palabra hablada («¡Tú!», «¡Ahora tú!») o un sonido instrumental? Una palabra ayuda a quien aún no lee, pero exige grabar voz original.
- ¿Se repite la llamada fallada (adaptativo) o la canción sigue fija para mantener los 50-60 s exactos? Repetirla alarga la canción o exige quitar parejas después.
- ¿Debe Armonía tocar también en el compás de respuesta (por ejemplo, un pulso suave de acompañamiento) o callar del todo?
- ¿Hace falta un «ritmo prohibido» o distractor en la última fase, o basta con la dificultad de los golpes seguidos?
- En pantallas pequeñas, ¿cómo se ve a la vez quién toca y las huellas? Depende del boceto (#35, «No especificado todavía»).
- No se encontraron cifras oficiales de tempo ni de margen de acierto en los juegos comerciales. Las cifras propuestas salen del propio proyecto.

## Qué evitar por estar demasiado cerca de otros juegos

- Un maestro tamborilero samurái, un contador de «subir de nivel» tras repetir el patrón varias veces seguidas, o cualquier lección o secuencia concreta de Rhythm Tengoku.
- La tira de símbolos con el aspecto de PaRappa, su medidor con cuatro nombres y cualquier maestro con forma de animal que rapea.
- Sílabas de tambor tipo onomatopeya asociadas a órdenes (Patapon), el estado de «fiebre» y el marco latiente con su estética concreta.
- Un tambor con cara, el par de colores rojo y azul para dos golpes, o notas que avanzan por una cinta hacia un círculo (Taiko).
- Los avisos hablados, voces y canciones de cualquiera de estos juegos.

Las ideas genéricas no pertenecen a ningún juego: alternar compases, avisar con un gesto y un sonido, marcar los pulsos con luces y hacer que el golpe suene como un tambor.
