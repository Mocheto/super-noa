# Casa de los gatitos: la pecera y la ampliación de la habitación

Dossier del arte del mapa «Pecera en la casa». **Actualización (26-11-2026):** el arte del mueble, el cristal, los peces y los objetos ya sale de láminas generadas, recortadas por `prototypes/tools/casa-pecera-recorte.py` (con las medidas de la tabla de abajo cambiadas: mueble y cristal de 412 × 354, ver `PECERA`; peces de 96 × 72 con el pez de unos 50 px; objetos igual). Los prompts están en el hilo del proyecto («Prompts de arte de la pecera»). `casa-pecera-arte.py` solo se usa ya para la habitación ampliada (`casa-habitacion-vacia-v2.webp`); no lo vuelvas a ejecutar para el resto, pisaría el arte nuevo.

Antes, el arte lo pintaba `prototypes/tools/casa-pecera-arte.py` por código, en una rejilla de «píxeles» de 4 px de escena (como el resto del arte de la casa) que se amplía sin suavizar. Si se quiere repintar a mano o con un modelo, basta con sustituir los cinco archivos que salen de abajo respetando sus medidas.

## Qué sale

| Archivo | Medidas | Qué es |
|---|---|---|
| `worlds/casa-habitacion-vacia-v2.webp` | 1700 × 540 | La habitación vacía de siempre con 420 px más a la izquierda: se repiten, sin costura, seis rayas de la pared (de x = 272 a 442 del fondo anterior) con su zócalo y su suelo. Su borde izquierdo es x = -420 de la escena. El fondo anterior (`-v1`) sigue publicado pero ya no se usa en la casa. |
| `sprites/casa-pecera-fondo-v1.webp` | 324 × 352 | El mueble de madera (con sus dos puertas), la tapa con su luz y su interruptor, el bote de comida, la pecera con el agua, la arena, las algas, el coral, las piedras y el castillo. Se coloca con la esquina arriba a la izquierda en (-372, 58) de la escena. |
| `sprites/casa-pecera-cristal-v1.webp` | 324 × 352 | Lo que va por delante de los peces: el borde del cristal, sus brillos y la línea de la superficie. |
| `sprites/casa-peces-v1.webp` | 480 × 288 | Cuatro peces (naranja, azul, payaso y globo; una fila cada uno) mirando a la derecha, en cinco cuadros de 96 × 72: nada A, nada B, ¡ñam! (boca abierta), susto (ojos grandes; el globo, inflado) y dormido. Se voltean por código al mirar a la izquierda. |
| `sprites/casa-pecera-objetos-v1.webp` | 288 × 48 | Seis cuadros de 48 × 48: burbuja, corazón, copo de comida, brillo, zeta y gota. |

El script imprime las medidas del agua, del bote, del interruptor y de la puerta del castillo que usa `src/game/casaPecera.ts` (`PECERA`).

## Cómo regenerarlo

```bash
uv run --with pillow --with numpy python prototypes/tools/casa-pecera-arte.py
```

Escribe los cinco WebP sin pérdida directamente en `public/assets/`. Si cambia el fondo de la habitación (`casa-habitacion-vacia-v1.webp`, que es la entrada de la ampliación), hay que volver a ejecutarlo.

## Lo que hace el código con él

- La luz de la pecera, la oscuridad cuando está apagada, el resplandor de noche, el vaivén de nadar, los saltos y los giros son de código (`PeceraCasa.tsx` y `casa.css`), no de arte.
- El LED del interruptor es verde en el dibujo y se pinta encima de rojo con la luz apagada.
- Los copos, las burbujas, los corazones, las zetas y las gotas salen de la hoja de objetos y suben o caen con animaciones CSS.
