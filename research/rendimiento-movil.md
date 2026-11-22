# Rendimiento actual en móvil

Issue: [Rendimiento actual en móvil](https://github.com/Mocheto/super-noa/issues/277), del mapa [Mejoras y recomendaciones visuales](https://github.com/Mocheto/super-noa/issues/274).
Medido el 22-11-2026 sobre `main` en `ce738d5`.

## Resumen

- **Hoy el juego aguanta 60 fps en todas las pantallas medidas**, también con la CPU ×6: los cuadros perdidos se quedan entre el 0 y el 3 %.
- **Con el lienzo por GPU** (lo normal en Chrome para Android, en Safari y en la Xiaomi Pad 6), el hilo principal usa de 2 a 4,6 ms por cuadro de media y de 3,4 a 7,7 ms en el percentil 95. En las pantallas de juego quedan **por lo menos 9 ms libres** por cuadro en el p95. En la casa con cinco gatitos quedan 3 ms en la tableta, porque es DOM y lo que pesa es el pintado y el estilo, no el lienzo.
- **Con el lienzo por software** (caso pesimista: un móvil que no acelera el lienzo), volcar el lienzo de 960 × 540 cuesta 5,5–8,5 ms por cuadro y el p95 del hilo principal llega a 12–18 ms. En niebla (2-3) y exploración (9-2) **no queda margen**.
- **Los tirones de verdad no vienen del dibujo**, sino de **decodificar imágenes en el hilo principal** cuando entra arte nuevo en pantalla: cuadros sueltos de 45 a 180 ms, sobre todo en 9-2 (exploración, 1 ms por cuadro de media solo en decodificar), 5-3 y 10-3. Antes que cualquier efecto, conviene predecodificar con `img.decode()` o `createImageBitmap` al cargar el mundo.
- **Coste de los efectos que propone la auditoría** (prueba en 5-3, Pad 6, ×6, lienzo por GPU): velo a pantalla completa +0,5 ms, 20 contornos de plataforma +0,1 ms, 8 halos con `shadowBlur` +0,5 ms (y +0,8 ms en el proceso de la GPU), 8 halos como sprite +0,3 ms; los tres juntos, +1,6 ms. Por software: velo ≈0, contornos +1,6 ms, halos +3 a +5 ms.

### Presupuesto propuesto para efectos visuales

| | Hilo principal, por cuadro, CPU ×6 |
|---|---|
| Objetivo | 16,7 ms (60 fps) |
| Ocupado hoy, peor p95 de una pantalla de juego (5-3, 375×812, GPU) | 7,7 ms |
| Margen de seguridad para el navegador, el sistema y los tirones | 4 ms |
| **Presupuesto para todos los efectos nuevos juntos** | **≈ 2 ms de media y ≤ 3 ms en el p95** |
| Por efecto, para declararlo en cada mejora | ≤ 0,5 ms con lienzo por GPU, y que no pase de +1,5 ms por software |
| Casa (DOM) | ≤ 1 ms: en la tableta ya llega a 13,6 ms en el p95 |

Reglas que salen de las medidas:

1. Nada de `shadowBlur` ni `filter` por cuadro sobre el lienzo. Los halos se pintan una vez en un lienzo aparte y luego se copian como sprite: cuestan lo mismo en el hilo principal, pero no cargan la GPU.
2. Un velo a pantalla completa con `fillRect` semitransparente es barato: uno sí, varios apilados no.
3. Los contornos con `strokeRect` o `stroke` son baratos con GPU, pero por software cuestan unos 0,08 ms cada uno. Mejor que vayan dentro del atlas de terreno que trazarlos cada cuadro.
4. Un escenario más alto en vertical, como propone la auditoría [#275](https://github.com/Mocheto/super-noa/issues/275), agranda el lienzo. **No lo he medido**: con GPU debería notarse poco, pero por software el volcado crece con los píxeles (960 × 1200 serían unos 2,2 × los 5,5–8,5 ms de ahora) y se saldría del presupuesto. Si se hace, hay que medirlo con estos mismos scripts.
5. Antes de añadir efectos, quitar la decodificación del hilo principal: es lo único que hoy pierde cuadros que se notan.

## Método

- **Compilación:** de producción (`vite build`, React en modo producción, minificada), con la única diferencia de `define: { "import.meta.env.DEV": "true" }` para que funcionen los ganchos `?prueba=<pantalla>` y `?prueba=casa`. Fuera de esos ganchos, `import.meta.env.DEV` no cambia nada. La configuración está en [`rendimiento-movil/vite.medir.config.ts`](rendimiento-movil/vite.medir.config.ts). El código del juego no se ha tocado.
- **Navegador:** Chrome for Testing 1223 de Playwright 1.62, sin ventana (`--headless`), en un MacBook Pro M3 Pro. Se sirve con un servidor estático propio en el puerto 4417.
- **Móvil emulado:** `isMobile` y `hasTouch` activados, y tres tamaños: **375 × 812 a ×2** (móvil vertical), **740 × 340 a ×2** (móvil apaisado) y **800 × 1280 a ×2,25** (Xiaomi Pad 6 en vertical, la tableta de Noa y el caso principal del mapa). La CPU se limita con `Emulation.setCPUThrottlingRate` ×4 y ×6 por CDP.
- **Dos rutas de dibujo del lienzo:** la normal, por GPU, y otra por software (`--disable-accelerated-2d-canvas`). La segunda es la cota pesimista para un móvil modesto: el volcado del lienzo cae en el hilo principal y la limitación de CPU lo frena.
- **60 Hz:** la pantalla del Mac va a 120 Hz. Un guion inyectado desde fuera (`addInitScript`) envuelve `requestAnimationFrame`, junta los callbacks y los sirve cada dos vsync, como en un móvil de 60 Hz. También mide el tiempo de los callbacks (el «JS del juego»: física y llamadas de dibujo) y el intervalo entre cuadros, y pone `performance.mark("cuadro")` en cada uno.
- **Partida:** Noa avanza con → y salta con espacio cada 0,7 s durante 10 s, después de 3 s de carga y 1,5 s de reposo. A veces se cae o reaparece, y eso cuenta como juego normal. En la casa, con los mundos 1–5 completos y a las 12 h (`casaHora=12`), están los cinco gatitos y un visitante que llama; el dedo arrastra la habitación cada 0,9 s.
- **Cuadros perdidos:** en cada intervalo, `round(intervalo / 16,67) − 1`.
- **Tiempo del hilo principal y desglose:** una segunda pasada con traza de CDP (`devtools.timeline`, `toplevel`, `cc`, `gpu`, `blink.user_timing`…). Se suman las tareas de primer nivel (`ThreadControllerImpl::RunTask`) del hilo principal de la página entre dos marcas `cuadro`. El desglose reparte el tiempo propio de cada evento según su antepasado conocido más cercano: JS, volcado del lienzo (`ProduceCanvasResource` y `RasterCHROMIUM`), decodificar imágenes, pintado DOM, estilo, commit y GC. La traza suma su propio coste (≈10–30 %), así que esos números van algo por encima de los de la primera pasada.
- **Pantallas:** 5-3 (cañones y barcos), 10-3 (siete chorros de lava), 2-3 (niebla, murciélagos y cristales de la cueva), 9-2 (exploración de 3200 × 1300) y la casa.
- **Efectos de prueba:** al final de cada cuadro, otro guion inyectado dibuja sobre el lienzo del juego un velo (`fillRect` rgba a 960 × 540), 20 contornos (`strokeRect` de 3 px), 8 halos con `shadowBlur` 12 y 8 halos como sprite (degradado radial ya pintado aparte). Solo en 5-3, en la tableta y a ×6.

### Límites

- La limitación de CPU solo frena el proceso del renderizador. **La GPU del M3 no se limita**, así que el tiempo del proceso de la GPU (columna «GPU proc.») no representa la de un móvil. Además, el lienzo mide 960 × 540 fijo (`constants.ts`), sin multiplicar por el `devicePixelRatio`, y solo el compositor lo escala, que con GPU sale barato.
- La carga dentro de cada pantalla varía de una pasada a otra (dónde se cae Noa, qué arte entra en pantalla), con unos ±1 ms de ruido en las medias. Para los efectos, solo las diferencias de más de 1 ms son fiables.
- No se ha medido ningún aparato real. Para confirmarlo, el siguiente paso es la Pad 6 con `chrome://inspect` y una traza de rendimiento en 9-2 y en la casa.

## Resultados

Columnas: fps e intervalo, de la pasada sin traza. «JS del juego» es el tiempo de los callbacks de `requestAnimationFrame`. «Hilo principal» es el tiempo ocupado por cuadro según la traza, solo a ×6 (a ×4 no se trazó la tableta). «Libre a p95» es 16,7 ms menos el p95 del hilo principal.

### Lienzo por GPU

| Pantalla | Tamaño | CPU | fps | Intervalo media / p95 (ms) | Cuadros perdidos | JS del juego media / p95 (ms) | Hilo principal media / p95 (ms) | Libre a p95 (ms) |
|---|---|---|---|---|---|---|---|---|
| 5-3 cañones | 375×812 | ×4 | 59.5 | 16.8 / 17.5 | 6 (0.9 %) | 0.42 / 1.00 | 2.3 / 3.9 | 12.8 |
| 5-3 cañones | 375×812 | ×6 | 60.0 | 16.7 / 17.5 | 1 (0.2 %) | 0.41 / 1.20 | 4.5 / 7.7 | 9.0 |
| 10-3 lava | 375×812 | ×4 | 59.6 | 16.8 / 17.5 | 4 (0.6 %) | 0.56 / 1.40 | 2.3 / 3.6 | 13.1 |
| 10-3 lava | 375×812 | ×6 | 59.9 | 16.7 / 17.5 | 1 (0.2 %) | 0.80 / 1.60 | 3.2 / 5.5 | 11.2 |
| 2-3 niebla | 375×812 | ×4 | 59.4 | 16.8 / 17.5 | 7 (1.1 %) | 0.68 / 1.20 | 2.2 / 3.7 | 13.0 |
| 2-3 niebla | 375×812 | ×6 | 59.8 | 16.7 / 17.5 | 3 (0.5 %) | 0.94 / 1.60 | 3.3 / 5.9 | 10.8 |
| 9-2 exploración | 375×812 | ×4 | 58.2 | 17.2 / 17.5 | 19 (3.0 %) | 0.67 / 1.20 | 2.4 / 3.8 | 12.9 |
| 9-2 exploración | 375×812 | ×6 | 60.0 | 16.7 / 17.5 | 1 (0.2 %) | 0.75 / 1.70 | 2.3 / 4.9 | 11.8 |
| casa (5 gatitos) | 375×812 | ×4 | 60.0 | 16.7 / 17.5 | 0 (0.0 %) | 0.05 / 0.30 | 3.3 / 6.4 | 10.3 |
| casa (5 gatitos) | 375×812 | ×6 | 60.0 | 16.7 / 17.5 | 0 (0.0 %) | 0.09 / 0.70 | 3.8 / 9.1 | 7.6 |
| 5-3 cañones | 740×340 | ×4 | 59.5 | 16.8 / 17.5 | 7 (1.1 %) | 0.49 / 1.10 | 2.0 / 3.7 | 13.0 |
| 5-3 cañones | 740×340 | ×6 | 60.0 | 16.7 / 17.5 | 0 (0.0 %) | 0.46 / 1.30 | 3.0 / 5.6 | 11.1 |
| 10-3 lava | 740×340 | ×4 | 59.7 | 16.8 / 17.5 | 4 (0.6 %) | 0.37 / 1.00 | 2.0 / 3.4 | 13.3 |
| 10-3 lava | 740×340 | ×6 | 60.0 | 16.7 / 17.5 | 0 (0.0 %) | 0.41 / 1.20 | 2.0 / 4.3 | 12.4 |
| 2-3 niebla | 740×340 | ×4 | 59.4 | 16.8 / 17.5 | 7 (1.1 %) | 0.61 / 1.10 | 1.7 / 3.1 | 13.6 |
| 2-3 niebla | 740×340 | ×6 | 60.0 | 16.7 / 17.5 | 0 (0.0 %) | 0.32 / 1.10 | 1.5 / 3.4 | 13.3 |
| 9-2 exploración | 740×340 | ×4 | 59.2 | 16.9 / 17.5 | 9 (1.4 %) | 0.40 / 1.00 | 1.8 / 3.2 | 13.5 |
| 9-2 exploración | 740×340 | ×6 | 59.3 | 16.9 / 17.5 | 7 (1.1 %) | 0.88 / 1.60 | 1.8 / 3.6 | 13.1 |
| casa (5 gatitos) | 740×340 | ×4 | 60.1 | 16.6 / 17.5 | 0 (0.0 %) | 0.10 / 0.60 | 1.9 / 4.9 | 11.8 |
| casa (5 gatitos) | 740×340 | ×6 | 60.1 | 16.6 / 17.5 | 0 (0.0 %) | 0.13 / 0.80 | 2.7 / 7.4 | 9.3 |
| 5-3 cañones | 800×1280 | ×4 | 59.2 | 16.9 / 17.5 | 8 (1.3 %) | 0.56 / 1.10 | — | — |
| 5-3 cañones | 800×1280 | ×6 | 59.9 | 16.7 / 17.5 | 1 (0.2 %) | 0.79 / 1.60 | 1.9 / 4.3 | 12.4 |
| 10-3 lava | 800×1280 | ×4 | 59.2 | 16.9 / 17.5 | 8 (1.3 %) | 0.69 / 1.20 | — | — |
| 10-3 lava | 800×1280 | ×6 | 60.0 | 16.7 / 17.5 | 1 (0.2 %) | 0.76 / 1.50 | 2.1 / 4.1 | 12.6 |
| 2-3 niebla | 800×1280 | ×4 | 59.3 | 16.9 / 17.5 | 7 (1.1 %) | 0.50 / 1.00 | — | — |
| 2-3 niebla | 800×1280 | ×6 | 59.9 | 16.7 / 17.5 | 1 (0.2 %) | 0.57 / 1.40 | 2.1 / 4.2 | 12.5 |
| 9-2 exploración | 800×1280 | ×4 | 59.0 | 16.9 / 17.5 | 12 (1.9 %) | 0.57 / 1.00 | — | — |
| 9-2 exploración | 800×1280 | ×6 | 59.1 | 16.9 / 17.5 | 9 (1.4 %) | 1.19 / 2.10 | 4.4 / 6.6 | 10.1 |
| casa (5 gatitos) | 800×1280 | ×4 | 60.0 | 16.7 / 17.5 | 0 (0.0 %) | 0.06 / 0.40 | — | — |
| casa (5 gatitos) | 800×1280 | ×6 | 60.0 | 16.7 / 17.5 | 0 (0.0 %) | 0.11 / 0.70 | 4.6 / 13.6 | 3.1 |

### Lienzo por software

| Pantalla | Tamaño | CPU | fps | Intervalo media / p95 (ms) | Cuadros perdidos | JS del juego media / p95 (ms) | Hilo principal media / p95 (ms) | Libre a p95 (ms) |
|---|---|---|---|---|---|---|---|---|
| 5-3 cañones | 375×812 | ×4 | 59.4 | 16.8 / 17.5 | 6 (0.9 %) | 0.50 / 1.20 | — | — |
| 5-3 cañones | 375×812 | ×6 | 60.0 | 16.7 / 17.5 | 0 (0.0 %) | 0.65 / 1.60 | 8.3 / 13.3 | 3.4 |
| 10-3 lava | 375×812 | ×4 | 59.3 | 16.9 / 17.5 | 9 (1.4 %) | 0.56 / 1.20 | — | — |
| 10-3 lava | 375×812 | ×6 | 60.0 | 16.7 / 17.5 | 1 (0.2 %) | 0.65 / 1.70 | 11.6 / 15.4 | 1.3 |
| 2-3 niebla | 375×812 | ×4 | 59.5 | 16.8 / 17.5 | 6 (0.9 %) | 0.61 / 1.10 | — | — |
| 2-3 niebla | 375×812 | ×6 | 59.8 | 16.7 / 17.5 | 2 (0.3 %) | 0.35 / 1.20 | 12.4 / 16.7 | 0.0 |
| 9-2 exploración | 375×812 | ×4 | 58.5 | 17.1 / 17.5 | 16 (2.5 %) | 1.66 / 5.50 | — | — |
| 9-2 exploración | 375×812 | ×6 | 59.9 | 16.7 / 17.5 | 4 (0.6 %) | 3.95 / 10.00 | 12.5 / 18.1 | -1.4 |
| casa (5 gatitos) | 375×812 | ×4 | 60.0 | 16.7 / 17.5 | 0 (0.0 %) | 0.09 / 0.60 | — | — |
| casa (5 gatitos) | 375×812 | ×6 | 60.0 | 16.7 / 17.5 | 0 (0.0 %) | 0.12 / 0.90 | 5.4 / 11.3 | 5.4 |
| 5-3 cañones | 740×340 | ×4 | 59.3 | 16.9 / 17.5 | 8 (1.3 %) | 0.50 / 1.20 | — | — |
| 5-3 cañones | 740×340 | ×6 | 60.0 | 16.7 / 17.5 | 0 (0.0 %) | 0.43 / 1.30 | 9.7 / 13.5 | 3.2 |
| 10-3 lava | 740×340 | ×4 | 59.2 | 16.9 / 17.5 | 7 (1.1 %) | 0.58 / 1.20 | — | — |
| 10-3 lava | 740×340 | ×6 | 59.8 | 16.7 / 17.6 | 2 (0.3 %) | 0.49 / 1.30 | 10.0 / 13.2 | 3.5 |
| 2-3 niebla | 740×340 | ×4 | 59.7 | 16.8 / 17.5 | 4 (0.6 %) | 0.48 / 1.10 | — | — |
| 2-3 niebla | 740×340 | ×6 | 59.8 | 16.7 / 17.5 | 2 (0.3 %) | 0.49 / 1.40 | 11.5 / 15.0 | 1.7 |
| 9-2 exploración | 740×340 | ×4 | 58.9 | 17.0 / 17.5 | 12 (1.9 %) | 1.27 / 4.40 | — | — |
| 9-2 exploración | 740×340 | ×6 | 59.0 | 16.9 / 17.5 | 12 (1.9 %) | 3.37 / 8.80 | 11.8 / 16.1 | 0.6 |
| casa (5 gatitos) | 740×340 | ×4 | 60.0 | 16.7 / 17.5 | 0 (0.0 %) | 0.20 / 0.80 | — | — |
| casa (5 gatitos) | 740×340 | ×6 | 59.8 | 16.7 / 17.5 | 3 (0.5 %) | 0.20 / 1.20 | 5.0 / 11.2 | 5.5 |
| 5-3 cañones | 800×1280 | ×4 | 59.4 | 16.8 / 17.5 | 7 (1.1 %) | 0.36 / 0.90 | — | — |
| 5-3 cañones | 800×1280 | ×6 | 59.9 | 16.7 / 17.5 | 1 (0.2 %) | 0.66 / 1.60 | 8.2 / 12.3 | 4.4 |
| 10-3 lava | 800×1280 | ×4 | 59.7 | 16.7 / 17.5 | 3 (0.5 %) | 0.47 / 1.00 | — | — |
| 10-3 lava | 800×1280 | ×6 | 60.0 | 16.7 / 17.5 | 0 (0.0 %) | 0.46 / 1.20 | 7.8 / 12.0 | 4.7 |
| 2-3 niebla | 800×1280 | ×4 | 59.7 | 16.8 / 17.5 | 3 (0.5 %) | 0.30 / 0.90 | — | — |
| 2-3 niebla | 800×1280 | ×6 | 60.1 | 16.6 / 17.5 | 1 (0.2 %) | 0.41 / 1.20 | 10.0 / 14.7 | 2.0 |
| 9-2 exploración | 800×1280 | ×4 | 58.6 | 17.1 / 17.5 | 15 (2.4 %) | 1.75 / 5.80 | — | — |
| 9-2 exploración | 800×1280 | ×6 | 60.0 | 16.7 / 17.5 | 0 (0.0 %) | 2.80 / 7.20 | 11.1 / 15.2 | 1.5 |
| casa (5 gatitos) | 800×1280 | ×4 | 60.0 | 16.7 / 17.5 | 0 (0.0 %) | 0.06 / 0.40 | — | — |
| casa (5 gatitos) | 800×1280 | ×6 | 60.0 | 16.7 / 17.5 | 0 (0.0 %) | 0.07 / 0.60 | 4.3 / 12.4 | 4.3 |

### Desglose del hilo principal a ×6 (ms por cuadro, media)

| Pantalla | Tamaño | Lienzo | Total | JS | Volcado del lienzo | Decodificar imágenes | Pintado DOM | Estilo | Commit | GC | Otros | Peor cuadro (ms) | GPU proc. media |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5-3 cañones | 375×812 | GPU | 4.5 | 2.10 | 0.42 | 0.00 | 0.56 | 0.02 | 0.55 | 0.03 | 1.01 | 18 | 0.7 |
| 10-3 lava | 375×812 | GPU | 3.2 | 1.42 | 0.29 | 0.00 | 0.44 | 0.02 | 0.39 | 0.03 | 0.79 | 47 | 0.6 |
| 2-3 niebla | 375×812 | GPU | 3.3 | 1.47 | 0.44 | 0.00 | 0.36 | 0.01 | 0.38 | 0.05 | 0.75 | 18 | 0.5 |
| 9-2 exploración | 375×812 | GPU | 2.3 | 1.14 | 0.29 | 0.00 | 0.23 | 0.01 | 0.26 | 0.03 | 0.52 | 18 | 0.4 |
| casa (5 gatitos) | 375×812 | GPU | 3.8 | 1.04 | 0.00 | 0.00 | 1.01 | 0.45 | 0.41 | 0.04 | 0.97 | 17 | 0.6 |
| 5-3 cañones | 740×340 | GPU | 3.0 | 1.36 | 0.35 | 0.00 | 0.36 | 0.02 | 0.34 | 0.03 | 0.69 | 16 | 0.4 |
| 10-3 lava | 740×340 | GPU | 2.0 | 0.70 | 0.25 | 0.34 | 0.17 | 0.01 | 0.18 | 0.03 | 0.38 | 114 | 0.3 |
| 2-3 niebla | 740×340 | GPU | 1.5 | 0.60 | 0.23 | 0.00 | 0.15 | 0.01 | 0.15 | 0.04 | 0.39 | 15 | 0.3 |
| 9-2 exploración | 740×340 | GPU | 1.8 | 0.72 | 0.23 | 0.00 | 0.23 | 0.06 | 0.21 | 0.02 | 0.44 | 43 | 0.3 |
| casa (5 gatitos) | 740×340 | GPU | 2.7 | 0.74 | 0.01 | 0.00 | 0.64 | 0.28 | 0.33 | 0.04 | 0.77 | 17 | 0.7 |
| 5-3 cañones | 800×1280 | GPU | 1.9 | 0.64 | 0.24 | 0.41 | 0.12 | 0.02 | 0.15 | 0.04 | 0.36 | 144 | 0.3 |
| 10-3 lava | 800×1280 | GPU | 2.1 | 0.71 | 0.30 | 0.40 | 0.15 | 0.02 | 0.20 | 0.03 | 0.45 | 112 | 0.3 |
| 2-3 niebla | 800×1280 | GPU | 2.1 | 0.76 | 0.33 | 0.14 | 0.15 | 0.02 | 0.21 | 0.04 | 0.51 | 83 | 0.3 |
| 9-2 exploración | 800×1280 | GPU | 4.4 | 1.66 | 0.45 | 1.04 | 0.32 | 0.02 | 0.30 | 0.04 | 0.68 | 179 | 0.8 |
| casa (5 gatitos) | 800×1280 | GPU | 4.6 | 1.46 | 0.01 | 0.00 | 1.10 | 0.55 | 0.48 | 0.04 | 1.13 | 18 | 0.8 |
| 5-3 cañones | 375×812 | software | 8.3 | 1.15 | 5.62 | 0.41 | 0.25 | 0.03 | 0.27 | 0.03 | 0.68 | 127 | 0.3 |
| 10-3 lava | 375×812 | software | 11.6 | 2.07 | 7.28 | 0.19 | 0.44 | 0.03 | 0.54 | 0.05 | 1.20 | 110 | 0.5 |
| 2-3 niebla | 375×812 | software | 12.4 | 1.85 | 8.48 | 0.15 | 0.40 | 0.03 | 0.47 | 0.05 | 1.15 | 99 | 0.4 |
| 9-2 exploración | 375×812 | software | 12.5 | 3.47 | 6.43 | 1.01 | 0.37 | 0.02 | 0.49 | 0.04 | 1.06 | 166 | 0.4 |
| casa (5 gatitos) | 375×812 | software | 5.4 | 1.50 | 0.02 | 0.00 | 1.41 | 0.78 | 0.51 | 0.03 | 1.30 | 17 | 0.9 |
| 5-3 cañones | 740×340 | software | 9.7 | 1.66 | 5.68 | 0.44 | 0.43 | 0.06 | 0.52 | 0.04 | 1.02 | 138 | 0.4 |
| 10-3 lava | 740×340 | software | 10.0 | 1.67 | 6.58 | 0.04 | 0.37 | 0.03 | 0.49 | 0.04 | 1.00 | 53 | 0.4 |
| 2-3 niebla | 740×340 | software | 11.5 | 1.63 | 7.98 | 0.14 | 0.34 | 0.02 | 0.46 | 0.05 | 1.03 | 95 | 0.4 |
| 9-2 exploración | 740×340 | software | 11.8 | 3.17 | 6.04 | 1.02 | 0.37 | 0.02 | 0.46 | 0.04 | 0.98 | 180 | 0.4 |
| casa (5 gatitos) | 740×340 | software | 5.0 | 1.34 | 0.03 | 0.00 | 1.31 | 0.62 | 0.55 | 0.03 | 1.27 | 21 | 0.9 |
| 5-3 cañones | 800×1280 | software | 8.2 | 1.15 | 5.49 | 0.40 | 0.26 | 0.03 | 0.33 | 0.03 | 0.65 | 131 | 0.3 |
| 10-3 lava | 800×1280 | software | 7.8 | 1.01 | 5.52 | 0.04 | 0.26 | 0.02 | 0.29 | 0.03 | 0.73 | 45 | 0.2 |
| 2-3 niebla | 800×1280 | software | 10.0 | 1.28 | 7.22 | 0.13 | 0.28 | 0.02 | 0.35 | 0.04 | 0.78 | 100 | 0.3 |
| 9-2 exploración | 800×1280 | software | 11.1 | 3.03 | 5.64 | 0.95 | 0.33 | 0.02 | 0.37 | 0.04 | 0.94 | 163 | 0.3 |
| casa (5 gatitos) | 800×1280 | software | 4.3 | 1.36 | 0.02 | 0.00 | 1.04 | 0.52 | 0.41 | 0.04 | 1.06 | 20 | 0.8 |

### Efectos de prueba en 5-3, 800×1280, ×6

| Efecto | Lienzo | Hilo principal media / p95 (ms) | Volcado del lienzo (ms) | Coste extra sobre «ninguno» (media, ms) | GPU proc. media (ms) |
|---|---|---|---|---|---|
| ninguno | GPU | 2.9 / 5.2 | 0.36 | +0.0 | 0.4 |
| velo | GPU | 3.4 / 5.7 | 0.42 | +0.5 | 0.4 |
| contornos | GPU | 3.0 / 5.0 | 0.36 | +0.1 | 0.4 |
| halos | GPU | 3.4 / 5.8 | 0.45 | +0.5 | 1.2 |
| halos-sprite | GPU | 3.2 / 5.5 | 0.30 | +0.3 | 0.5 |
| velo,contornos,halos-sprite | GPU | 4.5 / 7.3 | 0.54 | +1.6 | 0.5 |
| ninguno | software | 8.7 / 11.5 | 5.64 | +0.0 | 0.3 |
| velo | software | 8.7 / 11.3 | 5.79 | +0.0 | 0.3 |
| contornos | software | 10.3 / 13.6 | 6.40 | +1.6 | 0.3 |
| halos | software | 11.7 / 15.0 | 8.46 | +3.0 | 0.3 |
| halos-sprite | software | 14.1 / 17.9 | 8.37 | +5.4 | 0.6 |
| velo,contornos,halos-sprite | software | 12.1 / 16.8 | 7.49 | +3.5 | 0.4 |

### Qué se lleva el tiempo

- **Pantallas de juego con GPU:** la mitad es JS (física, colisiones y las 20–90 llamadas de dibujo por cuadro). El resto se reparte en partes parecidas entre commit, volcado del lienzo, pintado del HUD en DOM y «otros» (planificación de tareas, mensajes y temporizadores). En la media, nada pasa de 2,1 ms.
- **Pantallas de juego por software:** el volcado del lienzo (5,5–8,5 ms) es el 60–70 % del cuadro. La niebla (2-3) es la más cara por sus capas semitransparentes, y la exploración (9-2) suma además 3 ms de JS (mundo grande en dos ejes) y 1 ms de decodificar.
- **Casa:** no usa lienzo. Se va en JS de React (≈1,5 ms), pintado (≈1,1 ms) y estilo (≈0,5 ms) de los gatitos animados en DOM, y en la tableta tiene el p95 más alto de todo lo medido (13,6 ms).
- **Picos:** los peores cuadros, de 45 a 180 ms, coinciden con `Decode Image` en el hilo principal cuando entran fondos o atlas en pantalla.

## Cómo repetirlo

```bash
# en la raíz del repositorio (necesita Playwright 1.62 en la caché de npx y Chrome for Testing 1223)
cp research/rendimiento-movil/vite.medir.config.ts . && OUT_DIR=/ruta/dist-medir npx vite build --config vite.medir.config.ts && rm vite.medir.config.ts
cd research/rendimiento-movil && mkdir -p r
node medir.mjs /ruta/dist-medir r/gpu --rates=4,6 --seconds=10                 # fps y JS del juego
node medir.mjs /ruta/dist-medir r/gpu-traza --rates=6 --seconds=8 --trace=1    # trazas para el desglose
node medir.mjs /ruta/dist-medir r/tab-sw --viewports=800x1280 --dpr=2.25 --sw=1 # tableta, lienzo por software
python3 tabla.py
```

`todo.sh` y `todo2.sh` tienen las órdenes exactas de esta medición. Las rutas de Playwright y de Chrome de `medir.mjs` son las de esta máquina. Los datos crudos están en [`rendimiento-movil/datos/`](rendimiento-movil/datos/). Las trazas (≈50 MB cada una) no se guardan; su resumen está en `trazas-resumen.json`.
