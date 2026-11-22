# Guía de estilo visual

Reglas visuales de Super Noa para pantallas nuevas y para las mejoras del mapa [Mejoras y recomendaciones visuales (#274)](https://github.com/Mocheto/super-noa/issues/274). Decidida en [Guía de estilo visual (#280)](https://github.com/Mocheto/super-noa/issues/280) a partir de:
- las auditorías de la [campaña, el HUD y el mapa (#275)](https://github.com/Mocheto/super-noa/blob/research/auditoria-visual-campana/research/auditoria-visual-campana.md) y de los [minijuegos, duelos, ventanas y casa (#276)](https://github.com/Mocheto/super-noa/blob/research/auditoria-visual-minijuegos-casa/research/auditoria-visual-minijuegos-casa.md);
- el [rendimiento medido en móvil (#277)](https://github.com/Mocheto/super-noa/blob/research/rendimiento-movil/research/rendimiento-movil.md);
- las [buenas prácticas para niños de 4 a 6 años (#278)](https://github.com/Mocheto/super-noa/blob/research/buenas-practicas-visuales-ninos/research/buenas-practicas-visuales-ninos.md);
- [lo que ya molesta (#279)](https://github.com/Mocheto/super-noa/blob/research/lo-que-ya-molesta/research/lo-que-ya-molesta.md).

El texto se rige por la [guía de escritura para Noa](guia-texto-noa.md).

Prioridades, por orden: **1)** que Noa entienda qué se toca, qué se pisa y qué hace daño; **2)** que el juego responda al jugar; **3)** coherencia y pulido.

## Tamaños

Noa juega en una **Xiaomi Pad 6 en vertical** (unos 800 × 1280 px CSS a ×2,25; 1 px ≈ 0,19 mm), cogida con las dos manos por abajo. Toda pantalla se comprueba, por orden, en:

1. tableta vertical 800 × 1280 (principal);
2. tableta apaisada 1280 × 800;
3. móvil vertical 375 × 812;
4. móvil apaisado 740 × 340;
5. escritorio.

## Composición

**En vertical** (tableta y móvil), de arriba abajo:

1. **Relleno**: el marco caramelo con el fondo del mundo difuminado. Es solo decoración: nada se toca y no lleva texto.
2. **HUD**: en una franja fuera del escenario, justo encima de él.
3. **Escenario en 4:3**: la cámara se acerca y enseña 720 × 540 unidades del mundo (en la Pad 6, a 800 × 600 px). El lienzo no crece: no cambia el coste.
4. **Controles**: opacos, de unos **2 cm** (≈ 105 px en la tableta), pegados al borde inferior y fuera del escenario; las flechas a la izquierda y el salto a la derecha.

El bloque formado por HUD, escenario y controles va pegado abajo, al alcance de los pulgares.

**En apaisado y escritorio**: escenario en 16:9 con el HUD en sus esquinas, como hoy. En el móvil apaisado, los controles van encima del escenario al 60 % de opacidad y miden 64 px o más.

**Minijuegos y casa en vertical**:
- las escenas con cámara (casa, jardín, avioneta) se acercan a 4:3 como la partida;
- los rítmicos y los duelos se ordenan en columna: la escena arriba y los botones grandes (≈ 2 cm) abajo.

**Mapa**:
- va a pantalla completa, con los botones flotando en sus esquinas;
- para Noa, grandes: los mundos, NOA y CASA;
- para adultos, en el menú de ajustes: Tablón, LISTA, zoom y la frase de ayuda (acercar y alejar con dos dedos sigue funcionando);
- el siguiente mundo brilla; los bloqueados se ven apagados y sin nombre.

**Tocar**:
- lo que se toca mide 2 cm en la tableta y 48 px o más en el móvil (64 px si se toca a menudo), con el área activa mayor que el dibujo;
- nada que salga, pause o rinda va en las esquinas inferiores.

## Letra

- **Press Start 2P** (`--letra-noa`) para todo lo que lee o toca Noa, también en el mapa, los duelos y el lienzo (`letraLienzo`).
- **Letra del sistema** (`--letra-adultos`) solo para el texto de adultos: ajustes, ayudas, tablón y avisos.
- **Mínimo, 14 px reales en pantalla.** Los carteles del lienzo escalan con la inversa de la escala del escenario: cuando el escenario se ve pequeño, el cartel crece.
- Escala de la interfaz: la de `interfaz.css` (`--rotulo-titulo`, `--rotulo`, `--rotulo-pequeno`).

## Paleta

Una sola paleta de interfaz, la de `interfaz.css`:

| Uso | Token |
| --- | --- |
| Fondo de ventanas y carteles | `--crema`, `--papel` |
| Texto, contornos y sombras | `--ciruela` |
| Cintas, destacados y lo que brilla | `--dorado` |
| Controles y pausa | `--lila-control` |
| Seguir y aceptar | `--verde-boton` |
| Jugar y empezar | `--rojo-boton` |

El color de cada mundo (`acento` en `worldMapData.ts`) va **solo en el marco caramelo**. Ningún minijuego, duelo ni ventana inventa colores para sus botones.

## Marcos, ventanas y botones

- Todo minijuego, duelo y la avioneta usan `<Ventana>` (pausa, resultado), `<PantallaPrevia>`, los botones comunes (`<Boton>`, `<BotonControl>`) y el marco caramelo.
- El estilo propio de cada juego se queda dentro de su escena.

## Qué se pisa y qué hace daño

Lo interactivo tiene que destacar sobre el decorado. La prueba: en escala de grises se distinguen el suelo, los peligros y los objetos.

- **Velo sobre el fondo**: un solo `fillRect` semitransparente del color del tema entre el fondo y el juego; baja el contraste del decorado. Uno, nunca varios apilados.
- **Contorno oscuro en plataformas y suelo**: generado una vez por un script a partir de los atlas de terreno (sin dibujo nuevo y sin trazarlo cada cuadro).
- **Halo en lo que hace daño**: resplandor rojizo suave y constante en enemigos y peligros, pintado una vez en un lienzo aparte y copiado como sprite. Así lo dañino se reconoce por la forma y no solo por el color.

## Respuesta al jugar

Cada acción responde al momento, con dibujo y sonido:

- polvo al aterrizar;
- destello al recoger, además de la palabra con dibujo;
- latido del HUD al perder un corazón, con un corazón vacío que se vea (no gris al 55 %);
- lluvia breve de estrellas al ganar.

Con **reducir movimiento** (`reduceMotion`) se quitan las sacudidas, los destellos y el paralaje, y se dejan los fundidos. También en el lienzo de la partida. Como mucho tres destellos por segundo.

## Carteles e iconos

- Durante el juego, **como mucho dos carteles a la vez**, más la palabra de recoger. Una sola pista a la vez (`carteles.ts`).
- Los carteles se dibujan encima de todo y por debajo del HUD.
- Los **iconos de estado** (sin sonido, avisos) van siempre en el HUD, nunca sobre la acción ni sobre Noa.
- Los avisos se superponen y se van solos: nunca empujan la partida.
- Cada rótulo lleva su pictograma ([pictogramas](pictogramas.md)).

## Rendimiento

Presupuesto medido en la #277 (CPU ×6, 60 fps):

- **Todos los efectos nuevos juntos**: unos 2 ms por cuadro de media y como mucho 3 ms en el percentil 95.
- **Cada efecto**: ≤ 0,5 ms con el lienzo por GPU y ≤ 1,5 ms por software. Cada mejora declara su coste y cómo se midió.
- **Casa (DOM)**: ≤ 1 ms más.
- **Nada de `shadowBlur` ni `filter` en cada cuadro**: los halos y las sombras se pintan una vez y se copian como sprite.
- **Primero, predecodificar las imágenes** (`img.decode()` o `createImageBitmap`) al cargar el mundo: hoy es lo único que da tirones que se notan.
- Si un cambio agranda el lienzo, se mide otra vez con los scripts de la #277.

## Lista de comprobación

Antes de dar por buena una pantalla o una mejora:

- [ ] Se ha comprobado en los cinco tamaños, empezando por la tableta vertical.
- [ ] En vertical: HUD encima, escenario en 4:3 y controles de unos 2 cm abajo.
- [ ] Lo tocable mide lo indicado y no hay nada que salga, pause o rinda en las esquinas inferiores.
- [ ] Toda la letra de Noa es Press Start 2P y mide 14 px reales o más.
- [ ] Solo se usan colores de la paleta; el del mundo, solo en el marco.
- [ ] Usa `<Ventana>`, los botones comunes y el marco caramelo.
- [ ] En escala de grises se distinguen el suelo, los peligros y los objetos.
- [ ] Cada toque y cada acción responde al momento.
- [ ] Como mucho dos carteles a la vez; los iconos de estado, en el HUD.
- [ ] Con reducir movimiento no hay sacudidas ni destellos.
- [ ] Declara su coste en ms y cabe en el presupuesto.
