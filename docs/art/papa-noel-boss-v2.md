# Papá Noel: rediseño del jefe

Creado con el generador integrado de imágenes. Los PNG conservan transparencia y el fondo se distribuye como WebP, calidad 88. Arte original sin fotografías privadas.

## Recursos guardados

- `public/assets/sprites/boss-papa-noel-sheet-v2.png`: cinco poses y el regalo, en una cuadrícula de tres columnas por dos filas.
- `public/assets/worlds/santa-boss-courtyard-v1.webp`: patio nevado del taller de regalos.
- `public/assets/atlases/santa-boss-terrain-v1.png`: suelo y repisas propios de la arena.

Los recortes y los anclajes a las botas están registrados en `src/game/santaBattleAssets.ts`. El cuerpo mantiene la misma altura al aturdirse; las estrellas se dibujan encima sin encoger al personaje. La nieve empieza en la superficie de colisión y las repisas dejan sitio para dibujar a Noa completa debajo.

## Prompts utilizados

### boss

Use case: stylized-concept. Asset type: production transparent sprite atlas for an ORIGINAL child-friendly 2D platform game boss Santa Claus, redesigned to be readable beside a pixel-art girl hero. Composition: exact THREE columns by TWO rows, six equal square cells, landscape canvas 3:2. Each sprite fully isolated with generous transparent gutters, no cell borders or labels. Same friendly stocky Santa in five poses with identical proportions, red wool coat with cream trim, dark jade belt pouch, burgundy hat with a gold bell, big white beard, chunky black boots. Crisp chunky storybook pixel-art styling with simple readable shading, warm reds, cream, jade and gold, no photoreal textures. Each Santa fills 75% cell height, feet aligned at 90% of each cell height, complete silhouette and consistent body scale. TOP LEFT: standing idle facing left. TOP MIDDLE: winds up, holding a small wrapped parcel close beside his chest, facing left, elbows inside own cell. TOP RIGHT: finishing a throw with an empty outstretched hand facing left; NO flying gift, no projectile drawn outside character. BOTTOM LEFT: surprised after a gentle head stomp, still standing upright, small gold stars over hat, no sitting or shrinking. BOTTOM MIDDLE: happy victory smile, standing upright waving, same full height. BOTTOM RIGHT: ONE isolated square red wrapped gift with golden ribbon and small bow, centered in cell, no face, side view; fills 50% cell width. No background, no shadows on ground, no text, no watermarks, no commercial game characters. Genuine RGBA transparency.

### background

Use case: illustration-story. Asset type: original landscape 16:9 background for the final Santa Claus boss arena in a child-friendly side-scrolling 2D platform game. A magical snowy courtyard directly outside the Christmas gift depot, blue twilight and warm golden light, huge elegant timber-and-stone arched workshop facade in the distance, central red double doors decorated with a wreath, softly glowing windows, evergreen garlands, lanterns and snow-covered fir trees framing the outer edges, gentle snow and tiny stars. Beautiful cohesive hand-painted storybook game art, warm cranberry jade amber against deep winter blue. Broad open quiet central space for gameplay characters, soft atmospheric depth and subdued contrast. Buildings and decorations stay far in the background. NO people, NO Santa, NO protagonist, NO interface, NO text, NO foreground floor, NO floating shelves or walkable platforms, NO strong horizontal lines that could be mistaken for collision terrain, NO ice spikes or crystals. Full-bleed landscape image; bottom quarter softly shaded distant snow and wall, with foreground floor to be drawn separately by the game.

### terrain

Use case: stylized-concept. Asset type: genuine transparent RGBA terrain atlas for the final Santa Claus arena in an original children's 2D platform game. Square canvas, EXACTLY TWO separate long horizontal terrain sprites stacked, each entirely inside its own half with generous transparent gutters, no labels. TOP HALF: a long sturdy stone-and-timber courtyard floor segment with an absolutely straight FLAT snow cap as its highest visible edge, thick warm grey rounded stone foundation below, small red and jade ribbon trim on front face. BOTTOM HALF: a long floating wooden platform, straight FLAT thin cream snow cap at the topmost visible edge, warm wood front wrapped with a burgundy ribbon and gold clasp, short carved support brackets below. Nothing rises above either walking surface, no gifts on top, no piles, no grass, no characters. Each sprite occupies 90 percent image width and 25 percent image height, fully inside its half, with empty genuine transparent surroundings. Strict side elevation, crisp chunky storybook game art with bold readable silhouettes and simple shading, same red jade cream gold palette as Santa. No ground shadows, no background, no text, no ice spikes, no crystals.

