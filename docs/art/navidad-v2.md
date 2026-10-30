# Arte original de Navidad, revisión 2

Generado con la herramienta integrada de imágenes. Sin fotografías privadas ni referencias a juegos comerciales. Los fondos se distribuyen como WebP (calidad 88); los atlas conservan el canal alfa del PNG generado.

## Recursos

- `public/assets/worlds/winter-village-background-v1.webp`: pueblo nevado, separado del mundo de hielo.
- `public/assets/worlds/toy-factory-background-v2.webp`: taller de madera con ventanas y juguetes.
- `public/assets/worlds/gift-warehouse-background-v2.webp`: almacén con estanterías, regalos y luces cálidas.
- `public/assets/atlases/winter-village-terrain-v1.png`: suelo de tierra nevada y tronco flotante, en dos zonas separadas.
- `public/assets/atlases/winter-village-enemies-v1.png`: muñeco de nieve, reno mecánico y petirrojo, tres celdas horizontales.

## Prompts

### Taller

Use case: illustration-story. Asset type: wide 16:9 side-scrolling 2D game background, original Christmas toy workshop. Cozy richly painted children's storybook art, wooden beams, arched frosty windows with blue night outside, warm amber pendant lights, distant workbenches with toy trains and wooden animals, evergreen garlands, burgundy teal gold palette. Side elevation, broad open composition, softly muted contrast so foreground game platforms remain legible. Decorative objects only in distant background; no characters, no interface, no text, no platforms projecting toward viewer, no foreground floor, bottom quarter a softly shaded open workshop wall. Fill entire landscape image. Beautiful hand-painted cohesive production game art, no commercial game references.

### Almacén

Use case: illustration-story. Asset type: wide 16:9 side-scrolling 2D game background, original magical Christmas gift depot interior. Beautiful hand-painted children's storybook art, tall timber rafters with warm fairy lights, deep rows of softly detailed shelves filled with wrapped parcels in red jade teal gold, snow visible through high arched skylights, distant big crimson double doors. Cozy nighttime wonder, strong depth but side elevation, soft muted background contrast. Open quiet midground for clearly readable gameplay. No characters, no text, no UI, no foreground platforms, no foreground floor; bottom quarter is shaded distant wall. Landscape full bleed.

### Aldea

Use case: illustration-story. Asset type: wide 16:9 side-scrolling 2D game background for original Santa Claus snowy village trail, distinct from icy mountains. Beautiful hand-painted children's storybook art, rounded firs laden with fluffy snow, small distant timber chalets with glowing windows, golden lantern strings, wooden fences far away, soft blue twilight sky and scattered warm stars. Teal navy cream cranberry gold palette. Broad uncluttered middle, softly muted contrast and atmospheric depth for foreground gameplay. No characters, no text, no UI, no foreground platforms, no icy cliffs or crystals, no mountains, no foreground floor. Bottom quarter softly shaded distant snowy woodland. Full bleed landscape.

### Terreno transparente

Use case: stylized-concept. Asset type: original transparent RGBA sprite atlas for a child-friendly 2D side-view Christmas village platform game. Square atlas with EXACTLY TWO wide horizontal isolated terrain sprites stacked vertically, one entirely within upper half and one entirely within lower half. Upper half: straight horizontal snow-capped packed earth ground section, warm brown soil and rounded stones below, a crisp FLAT horizontal white walking surface above, small red-green holly trim on front face, no ice, no crystals, no icicles. Lower half: a floating wooden log ledge, straight FLAT white snow cap walking surface on top, warm timber below with short rope ends and a tiny subtle holly trim on front. Both silhouettes long and low, each fills 90 percent image width but only 25 percent image height, centered within its half; at least 10 percent empty transparent margins all around. Snow surface is topmost visible part, no objects rising above walking surface. Strict side view, original beautifully hand-painted storybook game art. No floor shadow, no backdrop, no text, no characters, no labels. Actual transparency.

### Criaturas transparentes

Use case: stylized-concept. Asset type: original transparent RGBA three-sprite horizontal atlas for a child-friendly 2D Santa village platform game. Wide landscape THREE EQUAL SQUARE CELLS in a SINGLE ROW, separated by generous transparent gutters; one complete isolated character centered in each cell with equal scale and baseline. LEFT: mischievous round snowman with carrot nose, burgundy wool hat and teal scarf, twig arms and tiny brown boots, facing right. MIDDLE: small wind-up wooden reindeer toy, little gold key at back, jade harness and golden bells, gentle funny expression, four little wheels or stubby hooves, facing right. RIGHT: cute round winter robin with red chest, brown wings spread in flight, tiny gold bell on neck, facing right. Beautiful cohesive hand-painted storybook game sprites, clear bold silhouette readable at 64px. No ice mountain animals, no penguins or foxes, no background, no floor, no shadows, no text, no frame, no extra characters. Genuine transparent background.

## Integración y geometría

Los recortes viven en `rendering.ts`; no se modifica el dibujo para añadir colisiones. Los fondos usan carga diferida por pantalla y paneles reflejados para evitar cortes al desplazarse. El encuadre interior deja los horizontes decorativos por debajo del suelo jugable.

Las repisas y cintas se declaran dentro de un único tramo de suelo, con margen respecto a los precipicios. Las cajas dejan 162 píxeles entre su cara inferior física y el apoyo; esto permite dibujar a Noa completa y alcanzarlas con un salto. Las pruebas de geometría comprueban también solapamientos parciales, y las pruebas de motor golpean las seis cajas con un salto real.
