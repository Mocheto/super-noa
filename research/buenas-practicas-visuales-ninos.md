# Buenas prácticas visuales para niños de 4 a 6 años

Investigación para [#278](https://github.com/Mocheto/super-noa/issues/278). Pregunta: ¿qué dicen las guías y los estudios sobre el diseño visual de juegos para niños de 4 a 6 años? Se revisan la legibilidad, cómo señalar lo que se toca o se pisa, la respuesta al acierto y al fallo, el contraste, la densidad de elementos, el tamaño de las zonas táctiles y el movimiento que distrae o marea. Cada apartado termina con lo que conviene hacer en Super Noa.

## Resumen

1. **Zonas táctiles grandes y con margen invisible.** A esta edad se falla mucho más que de adulto. Las referencias van de 44–48 px (mínimo para adultos) a unos 2 cm (recomendación para niños pequeños). Conviene que el área activa sea mayor que el dibujo y no poner nada tocable en las esquinas de abajo.
2. **Lo interactivo tiene que distinguirse del decorado.** Debe ser más grande, tener contorno o sombra, usar colores más vivos que el fondo y moverse o sonar para invitar a tocarlo. El fondo puede ser bonito, pero no debe competir con lo que se juega.
3. **Respuesta inmediata y redundante.** Cada toque debe dar a la vez sonido, dibujo y animación, al apoyar el dedo y no al levantarlo. El fallo se señala con una pista amable (flecha, brillo, pulso) y se vuelve a intentar enseguida. Nunca con un texto de error.
4. **Menos es más en pantalla.** En un estudio, un aula muy decorada distrajo más a niños de infantil y aprendieron menos. Conviene quitar lo que no sirve a la tarea del momento.
5. **El movimiento debe tener una función.** Hay que evitar destellos rápidos, sacudidas de pantalla y paralaje solo decorativo, y respetar «reducir movimiento». Super Noa ya tiene ese ajuste; falta comprobar que cubre también el lienzo de la partida.

## 1. Tamaño de las zonas táctiles y gestos

**Qué dicen las fuentes**

- Nielsen Norman Group recomienda zonas táctiles de **al menos 2 × 2 cm para niños pequeños**, cuatro veces la superficie de 1 × 1 cm que aconseja para adultos. Además, los menores de 5 años deben tener interacciones muy simples, y arrastrar con precisión les cuesta incluso en pantalla táctil, así que conviene ofrecer también la opción de tocar ([NN/g, *Physical Development and UX for Kids*](https://www.nngroup.com/articles/children-ux-physical-development/)).
- Las plataformas fijan mínimos para adultos: **44 × 44 pt** en Apple y **48 × 48 dp** en Material (unos 7 y 9 mm). WCAG 2.2 pide **44 × 44 px CSS** en el nivel AAA (2.5.5) y 24 × 24 en el nivel AA (2.5.8). Recomienda zonas más grandes para los controles de uso frecuente, los que están junto al borde y los que son difíciles de deshacer ([W3C, *Target Size (Enhanced)*](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html)). Para niños, estos números son un **suelo**, no una meta.
- Google (*Building for Kids*) aconseja zonas grandes y gestos simples: deslizar, arrastrar y dibujar. Pide evitar **varios dedos, doble toque, pellizco y gestos combinados**, salvo en apps para niños mayores ([Google, *Designing engaging apps*](https://developers.google.com/building-for-kids/designing-engaging-apps)).
- Sesame Workshop, a partir de más de 50 estudios con preescolares, señala lo siguiente ([Joan Ganz Cooney Center, resumen de la guía de Sesame](https://joanganzcooneycenter.org/?p=19607); [Licensing International](https://licensinginternational.org/news/sesame-workshop-shares-tips-for-creating-touch-screen-content-for-preschoolers)):
  - Tocar es el gesto más intuitivo. Pellizcar y deslizar rápido les cuesta.
  - Apoyan la muñeca en el borde inferior de la tableta, así que lo que hay en las **esquinas de abajo** se activa sin querer.
  - Juegan sobre todo en horizontal.
- Estudios de laboratorio de Anthony y colaboradores, con niños de 7 a 17 años y adultos, aportan tres datos ([Anthony et al., 2013, *Pers. Ubiquitous Comput.*](https://lisa-anthony.com/wp-content/uploads/2013/04/anthony-et-al-jpuc2013.pdf)):
  - Los niños fallan muchos más objetivos que los adultos, sobre todo los pequeños. Los más jóvenes de la muestra (7 a 10 años) fallan de media alrededor del 30 %.
  - Aparecen **toques residuales** (*holdovers*): toques en el sitio del objetivo anterior, justo después de que la pantalla cambie.
  - Los fallos en objetivos separados 10 px del borde caen casi todos entre el objetivo y el borde.

  Sus recomendaciones: ampliar el área activa más allá del dibujo, pegar los objetivos al borde o contar los toques en el borde, e ignorar los toques que caen donde estaba el botón anterior justo después de un cambio. Con 4 a 6 años la precisión es todavía menor. Vatavu y colaboradores midieron que mejora mucho entre los 3 y los 6 años y que depende de la destreza fina ([Vatavu, Cramariuc y Schipor, 2015, *IJHCS*](https://doi.org/10.1016/j.ijhcs.2014.10.007)).
- Las Game Accessibility Guidelines piden no exigir precisión de tiempo, evitar machacar botones y dejar unos 0,5 s de enfriamiento entre entradas ([gameaccessibilityguidelines.com](https://gameaccessibilityguidelines.com/full-list/)).

**Qué hacer en Super Noa**

- En un móvil, 1 px CSS mide unos 0,16 mm, así que 2 cm son unos 125 px CSS. Esa medida no cabe en todo con 340 px de alto, así que conviene repartir por importancia:
  - Lo que se toca a menudo (botones de seguir y jugar, marcadores del mapa, objetos de la bandeja de la casa) debería acercarse a 2 cm en tableta y a 64 px o más en móvil, contando el área invisible.
  - Ningún control debería bajar de 48 px.
  - Los controles de `MEDIDAS_TACTILES` en apaisado (flecha 56, salta 68, lana 50 px y área extra de 6 px) están en el límite. Conviene medir si se escapan pulsaciones de la lana.
- El área activa debe ser mayor que el dibujo, sobre todo hacia el borde de la pantalla, porque los fallos caen ahí. Lo mejor es pegar los botones al borde en lugar de dejar un hueco que no responde.
- No hay que poner botones con efecto (salir, pausa, rendirse) en las **esquinas inferiores**. Los controles táctiles de la partida sí deben estar ahí, porque es donde descansan los pulgares, pero el «salir» y el «rendirse» deben quedar lejos.
- Durante unos 300 ms después de cada cambio de pantalla o de ventana conviene ignorar los toques que caen donde estaba el botón anterior. Así se evita que un «¡A JUGAR!» pulsado dos veces se salte la práctica. La espera de 0,5 s de `Dialog esperaMs` ya va en esa línea.
- Allí donde se arrastra (cuenco, mantita, gatitos en la casa) debe haber una alternativa de tocar y tocar: tocar el objeto y luego el destino. Si el niño levanta el dedo a medias, el objeto debe volver suave a su sitio y no castigar.

## 2. Señalar lo que se toca o se pisa

**Qué dicen las fuentes**

- UXmatters recomienda hacer los elementos tocables **más grandes** que los decorativos y separarlos con sombra, contorno, sombreado oscuro o un foco de luz. Lo interactivo debe tener una paleta más fuerte que el fondo, y los niños deben poder distinguir siempre dónde tocar, aunque el arte sea inmersivo ([Mason, *Effective use of color and graphics… toddlers and preschoolers*](https://www.uxmatters.com/mt/archives/2011/10/effective-use-of-color-and-graphics-in-applications-for-children-part-i-toddlers-and-preschoolers.php)).
- Las Game Accessibility Guidelines piden indicar claramente que los elementos interactivos lo son, y que la información esencial no dependa solo del color ([gameaccessibilityguidelines.com](https://gameaccessibilityguidelines.com/full-list/)).
- Google aconseja señalar la respuesta correcta con flechas, brillos o pulsos, y usar iconos conocidos (casa, jugar, pausa) en botones que no sean solo texto ([Google](https://developers.google.com/building-for-kids/designing-engaging-apps)).
- Hiniker y colaboradores (IDC 2015) probaron con niños de 2 a 5 años cómo aprenden gestos nuevos: con voz, con texto, con una mano animada o con una animación del propio objeto. Según el resumen de Chen et al. (ICMI 2020), las pistas de vídeo o animación funcionan mejor hacia los 5 años que a los 2 ([Hiniker et al., 2015](https://depts.washington.edu/chilllab/?p=186)). El símbolo de la mano animada no siempre se entiende: los preescolares tienden a leer los símbolos al pie de la letra ([Hiniker et al., *Hidden symbols*, 2016](https://faculty.washington.edu/alexisr/HiddenSymbols.pdf)).

**Qué hacer en Super Noa**

- **Lo que se pisa** (suelo y plataformas) debe tener siempre un borde superior claro y continuo: césped, roca o hielo con un perfil más claro arriba y una sombra debajo. Ya lo pide AGENTS.md para los atlas de terreno («superficie transitable en el borde visual superior»). Conviene comprobar en cada mundo que el fondo ilustrado no tenga formas parecidas a plataformas con el mismo contraste, como nubes, ramas o tejados.
- **Lo que hace daño** (pinchos, lava, agua mortal) debe tener una forma y un color propios y constantes en toda la campaña, con un patrón y no solo un color, por ejemplo dientes o picos. Tiene que distinguirse de las plataformas también en escala de grises.
- **Lo que se recoge o se toca** (manzana, pegatina, gato, cajas, botón de huella) debe tener un contorno oscuro y un leve vaivén o brillo que lo separe del decorado estático.
- En las salas-rompecabezas y en la casa, el brillo que ya existe (`is-brilla`) es el patrón correcto, y conviene usarlo de forma uniforme: lo que brilla se puede tocar o usar ahora. Con «reducir movimiento» se mantiene como contorno fijo, como ya hace el CSS.
- Para enseñar un gesto nuevo es mejor animar el propio objeto (por ejemplo, el cuenco que se desliza solo hacia el gatito) que poner una mano dibujada.

## 3. Respuesta al acierto y al fallo

**Qué dicen las fuentes**

- Sesame: los niños esperan una respuesta **inmediata** al toque, y el sonido es un buen modo de confirmarlo. Ante un error, la respuesta visual y sonora debe animar y ayudar poco a poco ([resumen de la guía de Sesame](https://licensinginternational.org/news/sesame-workshop-shares-tips-for-creating-touch-screen-content-for-preschoolers)). Se recomienda registrar el toque al apoyar el dedo, no al levantarlo.
- Google: hay que combinar sonido, dibujo y texto en cada acción, porque la mayoría de los menores de 5 años no leen y puede que no sepan subir el volumen. Ante un error, la respuesta debe ser positiva y llevar de vuelta a la actividad enseguida, nunca con mensajes de error en texto ([Google](https://developers.google.com/building-for-kids/designing-engaging-apps)).
- Cimpian, Arce, Markman y Dweck (2007) hicieron un experimento con niños de 4 años. Los que oyeron elogios sobre la persona («eres una buena dibujante») se valoraron peor y persistieron menos tras un fallo que los que oyeron elogios sobre lo hecho («lo has dibujado muy bien») ([*Psychological Science* 18(4)](https://doi.org/10.1111/j.1467-9280.2007.01896.x); resumen en [BPS Research Digest](https://bps.org.uk/research-digest/how-praise-children)).
- Las Game Accessibility Guidelines piden que nada esencial llegue solo por sonido ni solo por texto ([gameaccessibilityguidelines.com](https://gameaccessibilityguidelines.com/full-list/)).

**Qué hacer en Super Noa**

- Cada toque debe responder en el mismo fotograma con un cambio visual (el botón se hunde, el objeto salta) y un sonido corto. Los controles usan `onPointerDown`, que es lo correcto, y conviene mantener ese criterio en las ventanas y en la casa.
- Los rótulos de resultado deberían elogiar **lo hecho** («¡LO HAS LOGRADO!», «¡QUÉ SALTO!») más que a la persona. «¡BRAVO, NOA!» está bien como celebración, pero no debería ser lo único que se dice.
- El fallo debe ser corto y sin culpa. Al perder una vida conviene volver a jugar en menos de unos 2 s y señalar el peligro con una pista, sin un rótulo de «has fallado». «¡CASI!» va en esa línea. En los minijuegos rítmicos, la pulsación vacía que «baja la raya» debería verse como algo leve, no como un castigo rojo.
- La información esencial siempre debe ir doble o triple (dibujo + sonido + rótulo con pictograma), también con el sonido apagado.

## 4. Legibilidad del texto

**Qué dicen las fuentes**

- Google y NN/g: no hay que depender del texto. Cada texto va con un icono y un sonido, y no se usan botones solo de texto ([Google](https://developers.google.com/building-for-kids/designing-engaging-apps)).
- Las Game Accessibility Guidelines piden un tamaño de letra legible por defecto y un formato simple y claro ([gameaccessibilityguidelines.com](https://gameaccessibilityguidelines.com/full-list/)).
- En la lectura temprana, las mayúsculas suelen aprenderse antes que las minúsculas. En un estudio con 461 niños de 3 a 5 años, saber la mayúscula hacía mucho más probable saber su minúscula, aunque la ventaja no se replica en todos los estudios ([Treiman y Kessler, *The case of case*](https://www.cambridge.org/core/journals/applied-psycholinguistics/article/case-of-case-childrens-knowledge-and-use-of-upper-and-lowercase-letters/C808D87B5395F79780051959F95020C7); [The Reading League, revisión](https://thereadingleague.org/wp-content/uploads/2025/01/Brick-by-Brick-Insights-on-Alphabet-Instruction-From-Research.pdf)).
- WCAG pide un contraste de 4,5 : 1 para el texto normal y de 3 : 1 para el texto grande y los componentes que no son texto (criterios 1.4.3 y 1.4.11).

**Qué hacer en Super Noa**

- Los rótulos en MAYÚSCULAS, de una a cuatro palabras y con pictograma ([guía de texto para Noa](../docs/interfaz/guia-texto-noa.md)) encajan con la evidencia. Hay que mantener la regla.
- Press Start 2P es una letra pixelada de trazo cuadrado. A 12 px en el móvil vertical algunas letras se confunden (la O con la D, la B con el 8, la Ñ si la tilde se pierde). Conviene comprobar en pantalla real la Ñ, la Ü y los signos ¡ ¿ a 12 y 16 px, y reservar 12 px para lo que se lee junto a un adulto, nunca para rótulos de Noa.
- Todo texto sobre el lienzo (carteles de `drawCartel`, palabras al recoger) debe ir en una caja de fondo sólido con contraste de 4,5 : 1 o más, nunca directamente sobre la ilustración.

## 5. Contraste y color

**Qué dicen las fuentes**

- Hacia los 2 o 3 años los niños prefieren colores primarios y alto contraste. Hacia los 5 toleran paletas más amplias y más profundidad. El fondo puede ser colorido, pero lo interactivo debe tener un color más fuerte ([UXmatters](https://www.uxmatters.com/mt/archives/2011/10/effective-use-of-color-and-graphics-in-applications-for-children-part-i-toddlers-and-preschoolers.php)).
- WCAG 1.4.11 pide un contraste de 3 : 1 para los componentes de interfaz y los gráficos que transmiten información. Las Game Accessibility Guidelines piden alto contraste entre interfaz y fondo, y no transmitir nada solo con el color ([gameaccessibilityguidelines.com](https://gameaccessibilityguidelines.com/full-list/)).

**Qué hacer en Super Noa**

- Conviene tener una **jerarquía de tres planos** en cada mundo:
  1. un fondo ilustrado algo más apagado o desaturado;
  2. un plano de juego (suelo, plataformas, enemigos) con contorno y saturación media o alta;
  3. los objetos y botones con el color más vivo y contorno oscuro.
- Es útil una prueba rápida por mundo: capturar la pantalla, pasarla a escala de grises y comprobar que se distinguen el suelo, los peligros y los objetos.
- Los controles táctiles al 60 % de opacidad deben mantener 3 : 1 sobre los fondos más claros (nieve, nubes, playa). Si no lo cumplen, se puede añadir un contorno oscuro fijo en lugar de subir la opacidad.

## 6. Densidad de elementos

**Qué dicen las fuentes**

- Fisher, Godwin y Seltman (2014) dieron seis lecciones de ciencias a niños de infantil en un aula de laboratorio. Con las paredes muy decoradas estuvieron más distraídos, pasaron más tiempo fuera de la tarea y aprendieron menos que con las paredes vacías ([*Psychological Science* 25(7)](https://pubmed.ncbi.nlm.nih.gov/24855019/)). Un comentario posterior apunta a que parte del efecto se debe a la novedad, que se atenúa con la costumbre ([Imuta y Scarf, 2014](https://pmc.ncbi.nlm.nih.gov/articles/PMC4274873)).
- UXmatters aconseja diseños lo más limpios posible, porque los fondos detallados compiten con la navegación, y pensarse dos veces cada logo, menú o elemento secundario ([UXmatters](https://www.uxmatters.com/mt/archives/2011/10/effective-use-of-color-and-graphics-in-applications-for-children-part-i-toddlers-and-preschoolers.php)). Google: solo los visuales y los sonidos esenciales ([Google](https://developers.google.com/building-for-kids/designing-engaging-apps)).
- Las Game Accessibility Guidelines proponen la opción de ocultar el movimiento de fondo y los elementos no interactivos ([gameaccessibilityguidelines.com](https://gameaccessibilityguidelines.com/full-list/)).

**Qué hacer en Super Noa**

- En la partida, el HUD de esquinas debe ser lo único fijo sobre el escenario. Durante el juego no debería haber más de dos o tres carteles o rótulos a la vez. La regla de AGENTS.md para los minijuegos (una palabra al compás, como mucho dos carteles de fase) es buena y vale también para la campaña.
- Hay que tener cuidado con la casa: bandeja, cinco gatitos, bocadillos, mariposas, visitante y muebles brillantes pueden juntarse. Conviene que solo haya un bocadillo de necesidad visible a la vez (el más urgente, como ya hace el motor) y que los brillos no coincidan con los bocadillos.
- Que las novedades lleguen poco a poco: una sola cosa nueva por pantalla (ya es regla para las mecánicas) y también para los elementos de interfaz.

## 7. Movimiento que distrae o marea

**Qué dicen las fuentes**

- WCAG 2.3.3 (AAA) pide que la animación provocada por la interacción se pueda desactivar si no es esencial, porque puede causar mareo, náuseas y distracción. Cita como ejemplos el paralaje y los elementos decorativos que entran deslizándose. Una técnica suficiente es `prefers-reduced-motion` o un ajuste propio ([W3C, *Animation from Interactions*](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)).
- WCAG 2.3.1 (A): no más de **tres destellos por segundo**, o destellos por debajo de los umbrales de luminancia y de rojo saturado, en un área pequeña: unos 341 × 256 px CSS ([W3C, *Three Flashes*](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html)).
- Las Game Accessibility Guidelines recomiendan cuatro cosas ([gameaccessibilityguidelines.com](https://gameaccessibilityguidelines.com/full-list/)):
  - evitar parpadeos y patrones repetitivos;
  - evitar movimientos súbitos inesperados;
  - evitar que la cámara se mueva distinto del mando;
  - poder apagar el movimiento de fondo.

**Qué hacer en Super Noa**

- Super Noa ya tiene el ajuste «reducir movimiento» (`reduceMotion`), que usan varios minijuegos, la casa y los efectos de protección, y muchas reglas `prefers-reduced-motion` en el CSS. Falta comprobar que también afecta al lienzo de la partida (`GameCanvas.tsx` y `rendering.ts`): paralaje del fondo, deslizamiento de cámara entre salas (unos 0,4 s), el círculo de transición de 1,2 s y cualquier sacudida o parpadeo al recibir daño. Con el ajuste activado, el parpadeo de invulnerabilidad debería pasar a transparencia fija y el paralaje a fondo quieto.
- La cámara debe seguir a Noa con suavidad y una zona muerta: que no se mueva por cada pequeño paso y que no haga saltos bruscos en vertical. En las pantallas verticales y de exploración, el seguimiento en dos ejes es lo que más puede marear.
- Hay que comprobar con WCAG 2.3.1 los destellos de pantalla completa (el flash blanco de la foto en la casa, golpes, la raya dorada). Uno solo y corto está bien. Las repeticiones rápidas de más de tres por segundo, o el rojo saturado en zonas grandes, no.
- Las animaciones de invitación (brillos, pulsos) deben ser lentas, de más de 1 s por ciclo, y solo en lo que se puede usar ahora.

## Lista de comprobación propuesta

Antes de dar por buena una pantalla o ventana nueva:

- [ ] Todo lo tocable mide 48 px o más (64 o más si se toca a menudo) y el área activa es mayor que el dibujo.
- [ ] No hay nada que salga, pause o rinda en las esquinas inferiores.
- [ ] En escala de grises se distinguen el suelo, los peligros y los objetos.
- [ ] Lo tocable tiene contorno o brillo y el decorado no.
- [ ] Cada toque da a la vez respuesta visual y sonido al apoyar el dedo.
- [ ] El fallo se resuelve con una pista y una vuelta rápida al juego, sin texto de error.
- [ ] El texto sobre el lienzo va sobre una caja con contraste de 4,5 : 1 o más.
- [ ] No hay más de dos o tres rótulos o carteles a la vez durante el juego.
- [ ] Con «reducir movimiento» desaparecen el paralaje, las sacudidas y los parpadeos.
- [ ] No hay destellos de más de tres por segundo.
- [ ] Comprobado en 375 × 812 y 740 × 340.

## Límites de esta investigación

- No encontré una guía pública de PBS KIDS con medidas concretas. La guía de Sesame Workshop (2012) se consultó a través de resúmenes, porque el PDF original no estaba disponible.
- Los datos de fallos y de toques residuales de Anthony et al. son de niños de 7 años en adelante. Para 4 a 6 años, Vatavu et al. confirman que la precisión es menor y mejora con la edad, pero no he contrastado sus cifras exactas.
- La cifra de 2 cm de NN/g procede de pruebas de usabilidad, no de un experimento controlado. Conviene tomarla como orientación y comprobarla jugando con Noa.
