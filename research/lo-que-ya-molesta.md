# Lo que ya molesta

Resolución de [Lo que ya te molesta (#279)](https://github.com/Mocheto/super-noa/issues/279), del mapa [Mejoras y recomendaciones visuales (#274)](https://github.com/Mocheto/super-noa/issues/274). Interrogatorio con la persona usuaria, 22 de noviembre de 2026.

## Dónde juega Noa

- **Tableta en vertical: Xiaomi Pad 6** (11", 2880 × 1800). En Chrome, unos **800 × 1280 px CSS a ×2,25**; 1 px CSS ≈ 0,19 mm. La coge en vertical para tener los botones virtuales más a mano.
- El juego tiene que verse bien en todos los formatos. Tamaños de comprobación del mapa, por orden:
  1. tableta vertical 800 × 1280 (principal);
  2. tableta apaisada 1280 × 800;
  3. móvil vertical 375 × 812;
  4. móvil apaisado 740 × 340;
  5. escritorio.

## Lo que molesta

Cada punto con su captura en la Xiaomi Pad 6 (800 × 1280) o en la [auditoría de la campaña](https://github.com/Mocheto/super-noa/blob/research/auditoria-visual-campana/research/auditoria-visual-campana.md) (#275).

1. **Controles a media pantalla y pequeños en la tableta vertical.** En la Pad 6, las flechas miden unos 58 px (≈ 1,1 cm) y quedan a unos 370 px (≈ 7 cm) del borde inferior, lejos de los pulgares. Deben ir pegados al borde inferior, en las esquinas (flechas a la izquierda, salto a la derecha), y medir unos 2 cm (≈ 105 px). Captura: [1-1](lo-que-ya-molesta/1-1-pad6.webp).
2. **Bandas vacías arriba y abajo del escenario en la tableta vertical** (unos 430 px arriba y 370 abajo de 1280). Hay que aprovecharlas; cómo (escenario más alto, más zoom, HUD fuera del escenario) lo decide la [Guía de estilo visual (#280)](https://github.com/Mocheto/super-noa/issues/280). Captura: [1-1](lo-que-ya-molesta/1-1-pad6.webp). En el móvil vertical pasa lo mismo y peor (C1 de #275).
3. **Carteles de pista pequeños o que se tapan entre sí.** C2 y C3 de #275; issue de ejecución [#317](https://github.com/Mocheto/super-noa/issues/317). Captura: [14-1](lo-que-ya-molesta/14-1-pad6.webp), [3-2](lo-que-ya-molesta/3-2-pad6.webp).
4. **No se ve qué plataformas se pisan ni los enemigos pequeños antes de chocar.** Es lo que más le cuesta a Noa. Plataformas: 2-1, mundo 4 y cielo (17-x). Enemigos: el limo de 1-1, el muñeco de nieve de 13-1, el escarabajo de 14-1. C4, C5 y C8 de #275. Capturas: [2-1](lo-que-ya-molesta/2-1-pad6.webp), [4-1](lo-que-ya-molesta/4-1-pad6.webp), [17-1](lo-que-ya-molesta/17-1-pad6.webp), [14-1](lo-que-ya-molesta/14-1-pad6.webp).
5. **No se nota cuándo pierde un corazón** (corazón gris al 55 % sobre fondo oscuro). C6 de #275.
6. **En el mapa no destaca el mundo siguiente y sobran botones**; en la tableta y el móvil se ve poco mapa entre la cabecera, la ayuda y los botones. M1–M3 de #275. Captura: [mapa](lo-que-ya-molesta/mapa-inicio-pad6.webp).
7. **Falta respuesta visual al saltar y al recoger** (polvo, brillo, rebote). El movimiento que ya hay no sobra: no hay que quitar animación. C7 de #275.
8. **Minijuegos, duelos, ventanas y casa:** nada aparte de lo que recoge su auditoría ([#276](https://github.com/Mocheto/super-noa/issues/276)).
