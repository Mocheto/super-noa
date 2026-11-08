# Propuesta de composición del mapa

La [composición de referencia aprobada](https://github.com/Mocheto/super-noa/issues/5) se conserva aquí. El juego usa la [ilustración final en WebP](../../../public/assets/worlds/noa-adventure-map-v2.webp), una edición generada con la herramienta integrada de ImageGen a 1536 × 1024 píxeles nativos. Mantiene la escena 3:2, las posiciones de los hitos y los claros del prototipo. Las rutas, los marcadores y el avatar se dibujan sobre la imagen.

## Archivos

- [Ilustración conceptual](concepto-v1.png), creada con la herramienta integrada imagegen: 1536 × 1024 píxeles, proporción 3:2.
- [Prototipo visual](propuesta.html): abrir en un navegador; permite alternar la capa independiente de rutas y marcadores. Incluye recortes de móvil de Gatitos y Celeste. No implementa la navegación del producto.
- [Posiciones propuestas](posiciones-v1.json): porcentajes en una referencia de 3000 × 2000 unidades. Se ajustan a los claros del arte generado; no son todavía datos de producción.
- Capturas de revisión: `revision-escritorio.png`, `revision-movil.png` y `revision-celeste.png`.

## Dirección artística

Cuento luminoso con paisaje continuo de islas escalonadas, acantilados, ríos y nubes. Tres franjas de cinco mundos de campaña siguiendo la S ascendente acordada. Mantener siluetas distintivas y claros tranquilos al pie de cada hito, evitando amontonar el borde inferior.

Franja superior: Navidad, desierto, tren de las estaciones, música y palacio estrellado celeste. Franja central, de izquierda a derecha: hielo, flores gigantes, volcán de dragones, dinosaurios tropicales y castillo encantado. Franja inferior: manzanos, casas de gatitos, pinos con luna y lobos, robles otoñales con jabalíes y barcos voladores.

La laguna coralina ocupa el corredor entre las franjas central e inferior; el reino secreto es un islote rosa con arcoíris y unicornio junto a Jabalíes, separado del palacio azul estrellado final. Molino, luciérnagas, mina de cristales, biblioteca y jardín tienen hitos propios.

Transiciones: nieve de Hielo a Navidad, deshielo hacia dunas, selva hacia roca volcánica, ceniza hacia pradera de flores, vapor y nubes entre tren, música y Celeste. Las transiciones no modifican el grafo de progreso.

## Reservas y revisión

Las reservas de esta propuesta son 264 × 96 unidades para cada mundo y 234 × 96 para cada desvío. A 1500 píxeles de ancho equivalen a un alto de 48 px y texto de 14 px. El producto debe mantener esos mínimos en la vista cercana mediante la escala de cámara acordada; reducir todo el lienzo a una pantalla móvil no es la vista de selección.

Las 22 reservas están dentro del lienzo y no se superponen, también ampliándolas a 300 × 128 y 270 × 128 unidades como margen para el halo. Se ha revisado la capa de trazados en escritorio y los recortes cercanos de Gatitos y Celeste. Las reservas aún no incorporan las dimensiones definitivas del avatar ni las insignias reales: la integración debe verificar sus rectángulos completos y añadir margen o separar posiciones cuando haga falta. Las capturas prueban composición, no interacción ni accesibilidad del juego.

El túnel violeta representa un recorrido subterráneo, no un camino de superficie por encima de la laguna. La futura presentación distinguirá entradas y altura visual sin crear conexiones nuevas.

## Propuesta para validar el arte definitivo

Usar esta ilustración como referencia compositiva y de estilo, conservar el contrato de posiciones y superponer siempre las rutas y marcadores mediante código. Revisar los 17 biomas y cinco hitos, rutas, reservas completas y recortes de móvil antes de integrar. Si una región se desplaza u omite, editar esa región con imagegen preservando las otras; no comprimir marcadores para encajar un fallo artístico. Si los ajustes alteran la distribución acordada, volver a revisión humana. La propuesta no incorpora fotografías privadas ni recursos comerciales.

Resolución recomendada para arte definitivo: 3072 × 2048 si la generación lo permite; validar nitidez en el máximo zoom útil y servir una versión WebP optimizada. No ampliar artificialmente esta miniatura como sustituto de una revisión a escala cercana.
