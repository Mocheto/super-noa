# La jaula de hámsters de la casa

Especificación del mapa [«Jaula de hamsters en la casa de los gatitos» (#402)](https://github.com/Mocheto/super-noa/issues/402). Las decisiones y su porqué están en sus issues (#401, #403–#408 y #411); aquí queda lo que hay que construir. El boceto está en la rama `proto/jaula-hamsters-407` (`prototypes/jaula-hamsters-prototype.html`, recorrido B).

## Los hámsters

| Nombre | Color | Rasgos |
|---|---|---|
| Perla | marrón y blanco | orejas redondas y un poco grandes |
| Bolita | gris y blanco, como un hámster ruso | un poco más pequeño, orejas cortas |

Son mascotas aparte de los gatitos: no cuentan en «cinco en casa» ni tienen necesidades por horas.

## La jaula

- Recorrido **B, «Gran laberinto»**: una jaula grande con todo dentro (rueda, columpio, casita, comedero, bebedero, repisa y rampas) y tubos transparentes que salen, recorren por fuera y vuelven a entrar, con tres cubos de unión.
- Los tubos son de **tres colores** (rojo, azul y amarillo) en varios tramos.
- Los hámsters se ven a través de los tubos.
- La jaula está desde que existe la casa.

## Sitio en la habitación

- 720 px nuevos a la izquierda de la pecera: de x = -1140 a x = -420. `ampliacion` pasa de 420 a 1140 y el fondo de 1700 a 2420 px de ancho.
- El laberinto del boceto se dibuja al **80 %** (unos 700 px), así se ve entero en la tableta vertical (720 px de escena).
- Los gatitos no entran: su suelo no cambia.

## Comportamiento

- Los hámsters se mueven solos por tubos, rampas y objetos, eligiendo al azar. Con hambre o sed van primero al comedero o al bebedero.
- Noa toca un tubo, la rueda, el columpio o la casita y un hámster va allí: pasa por el tubo, hace girar la rueda, se balancea o se esconde un momento y asoma. No hace falta arrastrar nada.
- Noa toca un hámster dentro de la jaula: sale su nombre, chilla y hace una de tres gracias, por turnos: de pie con un corazón, dos saltitos con dos corazones y una voltereta con tres estrellas. Se queda 1,5 s quieto y sigue con lo suyo. Dentro de un tubo o de la casita no cabe de pie y solo le sale el corazón. No se guarda ni cuenta para nada. Escapado, tocarlo es cogerlo.
- Cada cosa tiene un sonido corto propio, por el bus de `casaSonido.ts`.

## Comida y agua

- Caben tres raciones de cada una. Solo se gastan cuando un hámster come o bebe con la casa abierta; nunca por el tiempo fuera.
- Se rellenan desde la bandeja (saco de semillas y jarra). Vacíos, el comedero y el bebedero avisan con su dibujo.

## La escapada

- Noa abre la puerta de la jaula y un hámster sale a la habitación.
- Se esconde en la **cama**, el **rascador** o el **cojín**.
- Noa lo toca para cogerlo y lo arrastra; al soltarlo a 150 px o menos de la jaula, entra. La puerta se cierra sola.
- Si lleva 20 s escondido, una flecha señala hacia él, sin voz.
- No se pierde nada y no hay tiempo límite.

## Bandeja

- Un botón de hámster lleva la vista directa a la jaula (y de vuelta). A la jaula también se llega deslizando.
- Mirando la jaula, la bandeja ofrece lo de los hámsters.

## Progreso

- Campo opcional `casa.hamsters = { comida, agua }`, raciones de 0 a 3. Sin el campo, las dos llenas.
- La escapada no se guarda: al volver, los dos están en la jaula y la puerta cerrada.

## Fotos

Si la foto se hace mirando la jaula, salen la jaula y los dos hámsters en una posición fija, sin guardar nada más.
