# Ilustraciones del mapa, mundos 1–5

Generadas con la herramienta integrada de imágenes a partir de cada ilustración anterior como objetivo de edición y de `world-6.png` como referencia de detalle. Son panorámicas opacas de 1536 × 1024 píxeles. Las ilustraciones anteriores se conservan.

Prompt común: «Redibujar la escena original de Super Noa como paisaje pixel art horizontal de aproximadamente 3:2. Mantener sus motivos, paleta e identidad; igualar la nitidez y riqueza de píxel de la imagen HD del castillo. Abrir el encuadre para que árboles, luna, barcos y otros elementos no queden cortados. Debe funcionar como franja horizontal del mapa y como postal completa. Sin personajes, texto, interfaz, marcas de agua ni elementos de otros juegos».

| Archivo final | Escena específica del prompt |
| --- | --- |
| `public/assets/worlds/world-1-hd-v1.png` | Manzanar alegre de día, manzanas rojas, sendero, lago, montañas, flores blancas y sol sonriente. |
| `public/assets/worlds/world-2-hd-v1.png` | Bosque violeta al atardecer, flores, luciérnagas, arroyo entre piedras, pinos lejanos y luna creciente sonriente. |
| `public/assets/worlds/world-3-hd-v1.png` | Bosque nocturno de pinos, camino con huellas, lago y montañas azules, estrellas y luna llena sonriente. |
| `public/assets/worlds/world-4-hd-v1.png` | Copas de robles dorados con bellotas, senderos elevados, valle y río bajo nubes de tormenta vespertina. |
| `public/assets/worlds/world-5-hd-v1.png` | Flota de barcos originales de madera con velas claras y banderines, islas flotantes verdes y puentes entre nubes. |

## Paisaje continuo del mapa interactivo

`public/assets/worlds/noa-adventure-map-v1.png` (1672 × 941 píxeles) se generó con la herramienta integrada de imágenes como un fondo original y opaco, sin textos ni controles. `WorldMap.tsx` superpone caminos SVG y botones accesibles; `worldMapData.ts` declara sus coordenadas y estados. La imagen de referencia de otro juego se utilizó solo para debatir la idea general de un mapa navegable, no como objetivo de edición ni recurso visual.

Prompt final: «Crear un mapa de una única tierra fantástica en pixel art, visto desde arriba en perspectiva suave y formato 16:9. Distribuir hitos reconocibles y separados: manzanar soleado a la izquierda abajo; casas de gatitos entre árboles al centro-izquierda; pinar nocturno con lobo en la zona superior central; copas doradas de jabalíes a la derecha arriba; barcos voladores en nubes a la derecha; castillo violeta abajo a la derecha; laguna turquesa de corales en la parte inferior central; pequeño reino arcoíris sobre nubes arriba a la derecha, conectado al bosque por una enredadera. Unir el territorio de forma coherente, con ríos y algunos puentes. Dejar espacio visual alrededor de cada lugar para colocar botones y caminos interactivos después. Sin texto, interfaz, avatar, círculos de nivel, caminos de progreso dibujados, marcas de agua ni motivos de juegos comerciales».
