# Cuenta de Google Play y política para apps infantiles

Investigación de la issue [#115](https://github.com/Mocheto/super-noa/issues/115), del mapa [#113](https://github.com/Mocheto/super-noa/issues/113). Consultado el 18-11-2026 en la ayuda oficial de Play Console. No es asesoramiento legal.

## Resumen

- **Cuenta personal**, no de organización: 25 USD una sola vez, sin número D-U-N-S. Exige verificar la identidad legal y comprobar con la app Play Console que se tiene un móvil Android.
- Una cuenta personal nueva necesita una **prueba cerrada con al menos 12 testers durante 14 días seguidos** antes de pedir acceso a producción. Encaja con el plan de empezar por la familia.
- Si el público objetivo es solo «5 años o menos» (o hasta 8), se aplica entera la **política de familias**. Super Noa no tiene anuncios ni compras, así que el programa de SDK de anuncios autocertificados no le afecta. Teacher Approved es opcional y no hace falta.
- **Seguridad de datos**: el ranking sí «recoge» datos según la definición de Google (salen del dispositivo y se guardan). Hay que declarar un identificador de usuario (alias), un identificador pseudónimo de dispositivo y la actividad en el juego. No se comparten con terceros y viajan cifrados por HTTPS.
- **Hueco importante**: el servidor no ofrece forma de borrar un perfil del ranking. Play pregunta por la eliminación de datos, y si se considera que el alias es una «cuenta», además obliga a borrarla desde la app y desde una web.
- **Política de privacidad obligatoria** en una URL pública, que no sea un PDF, y enlazada también dentro de la app. GitHub Pages sirve (por ejemplo, `https://mocheto.github.io/super-noa/privacidad.html`).
- **Clasificación IARC**: cuestionario gratuito en Play Console. En la UE la etiqueta es PEGI; lo esperable es PEGI 3, aunque el ranking puede añadir el aviso de interacción entre usuarios.

## 1. Tipo de cuenta

| | Personal | Organización |
|---|---|---|
| Para quién | Particulares | Empresas, asociaciones, administraciones |
| Cuota | 25 USD, pago único ([fuente](https://support.google.com/googleplay/android-developer/answer/6112435)) | La misma |
| D-U-N-S | No hace falta | Obligatorio: «You can't create an organization developer account without a valid D-U-N-S number» ([fuente](https://support.google.com/googleplay/android-developer/answer/13628312)) |
| Datos | Nombre del desarrollador, nombre y dirección legales (del perfil de pagos de Google), correo y teléfono de contacto, correo de desarrollador y estado de «comerciante» (obligatorio en el EEE) | Además: nombre, dirección, teléfono y web de la organización, y teléfono de desarrollador |
| Verificación | Código por correo y teléfono, identidad legal (puede pedir documento oficial y tarjeta a tu nombre) y **acceso a un dispositivo Android con la app Play Console** | Igual, salvo el dispositivo; además valida el D-U-N-S |
| Prueba cerrada previa | **Sí** (ver punto 2) | No |

Otros requisitos: tener 18 años o más. La tarjeta no puede ser prepago. Si la identidad no se valida, Google no devuelve la cuota.

**Qué se ve en público**: Google Play muestra el nombre legal, el país y el correo de desarrollador. La dirección completa solo aparece si la app se monetiza. Para no mostrar el correo personal conviene crear antes un correo específico, por ejemplo un alias para Super Noa.

**Estado de comerciante (DSA)**: una app gratuita sin ingresos hecha por un particular normalmente se declara «no comerciante». En ese caso Play avisa a los usuarios de la UE de que no tienen los derechos de consumidor frente al desarrollador. La decisión es de la persona titular.

**Recomendación**: cuenta personal. La de organización exige crear una entidad y conseguir un D-U-N-S, y lo único que ahorra es la prueba cerrada, que de todos modos se iba a hacer con la familia.

## 2. Prueba cerrada obligatoria (cuentas personales nuevas)

Fuente: [App testing requirements for new personal developer accounts](https://support.google.com/googleplay/android-developer/answer/14151465).

- Se aplica a las cuentas personales creadas después del 13-11-2023.
- Exige una **prueba cerrada con al menos 12 testers** que hayan estado **apuntados sin interrupción al menos 14 días**. Cuenta el número de testers apuntados en ese periodo, no cuántas veces juegan. Aun así, el formulario de acceso pregunta por su participación y por los comentarios recibidos.
- Después se pide en Panel → «Solicitar acceso a producción». El formulario tiene tres partes: la prueba cerrada, la app y lo preparada que está para producción. Google la revisa, normalmente en unos días.
- Los testers necesitan una cuenta de Google. Se apuntan con un enlace de inscripción, o se añaden por lista de correos o por un Grupo de Google. Conviene reunir 14 o 15 por si alguien se da de baja: si un tester sale y el número baja de 12, se puede romper la continuidad.
- El periodo empieza a contar cuando la versión de la prueba cerrada está publicada y aprobada en el canal. Esa versión también pasa revisión, y en las apps infantiles la revisión del público objetivo puede tardar 7 días o más.
- La prueba interna (hasta 100 testers, sin revisión) **no cuenta** para el requisito, aunque sirve para probar la instalación antes.

## 3. Política de familias

Fuentes: [Families Policy](https://support.google.com/googleplay/android-developer/answer/9893335) y [Target audience and content](https://support.google.com/googleplay/android-developer/answer/9867159).

### Declaración de público objetivo

En Política → Contenido de la app → «Público objetivo y contenido». Antes hay que haber declarado que no hay anuncios, haber explicado cómo acceder a la app y haber añadido la política de privacidad. Las franjas son: 5 o menos, 6-8, 9-12, 13-15, 16-17 y 18 o más.

- Para Super Noa encaja **«5 o menos» y quizá «6-8»**. Solo deben marcarse las franjas para las que la app esté de verdad pensada. Cualquier franja de menores de 13 activa la política de familias completa.
- Elegir solo adultos no es una salida: el arte y los personajes infantiles hacen que Google rechace esa declaración.
- Google revisa si la declaración es correcta (7 días o más). Si es falsa, puede retirar o suspender la app.

### Requisitos que afectan a Super Noa

| Requisito | Situación actual |
|---|---|
| Contenido apropiado para niños | Cumple por diseño (AGENTS.md). |
| Cumplir la COPPA, el RGPD y otras leyes aplicables | Ver «Puntos legales». |
| No transmitir AAID, número de serie de la SIM o del dispositivo, BSSID, MAC, SSID, IMEI ni IMSI | Cumple. El `deviceId` es un UUID aleatorio que genera la app (`crypto.randomUUID()`), no un identificador del hardware. |
| No pedir el permiso `AD_ID` (targetSdk 33 o más) | Hay que vigilarlo al generar el APK/AAB. Algunas plantillas de TWA o librerías lo añaden; debe quitarse del manifiesto. |
| No pedir ubicación ni transmitir la ubicación precisa | Cumple. |
| Solo APIs y SDK aprobados para servicios infantiles | Cumple: no hay analítica ni SDK de terceros. Al crear la TWA hay que revisar que no meta Firebase, analítica ni notificaciones. |
| La app no puede ser solo una vista web de una web ajena | La TWA muestra una web propia, así que lo permite la regla. Aun así, la app debe aportar contenido real y funcionar sin conexión (mapa #113). |
| Funciones sociales: aviso de seguridad, acción de un adulto antes de intercambiar información personal y control por parte de adultos | **Revisar.** El ranking publica un alias de texto libre (3-16 letras o números). Una niña podría escribir su nombre real. Ver propuestas abajo. |
| Anuncios | No hay. Se declara «sin anuncios» y el programa de SDK de anuncios autocertificados (que, según la ayuda de Google, no admite nuevos participantes) no se aplica. |
| Moneda virtual clara | Las manzanas no se compran con dinero; no hay compras. |
| Enlaces externos | `App.tsx` enlaza a opengameart.org en los créditos. La política no lo prohíbe expresamente; aun así, conviene ponerlo tras una puerta para adultos. |

**Teacher Approved**: es un programa opcional que se elige en «Presencia en la tienda». No hace falta y la inclusión no está garantizada.

**Insignia «Comprometido con la política de familias»**: se activa desde Seguridad de datos → Prácticas de seguridad.

### Propuestas para el ranking (decisión para otra issue)

1. Poner una **puerta para adultos** (por ejemplo, una operación o una pregunta que una niña de cinco años no sepa responder) antes de apuntarse al ranking, con un texto para la familia que diga qué se envía.
2. Sustituir el alias libre por un **alias de fantasía elegido de una lista** (animal + color, por ejemplo). Así no puede contener datos personales.
3. Añadir **«Borrar mi tarjeta del ranking»** en la app y un endpoint `DELETE` en el servidor. Ver el punto 4.

## 4. Formulario de seguridad de datos

Fuente: [Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469). Es obligatorio en los canales cerrado, abierto y de producción (no en el interno), aunque la app no recoja nada.

### Qué envía el código hoy

Según `src/game/ranking.ts` y `server/ranking-server.mjs`, todo va a `https://rankings.moche-home.es` por HTTPS y solo si la persona se apunta al ranking:

| Momento | Datos | ¿Se conserva? |
|---|---|---|
| `POST /v1/devices` (apuntarse) | `alias` (3-16 caracteres), `deviceId` (UUID v4 aleatorio), `deviceToken` (32 bytes aleatorios) | El servidor guarda id, alias, `alias_key` y el **hash HMAC** del token (no el token), además de `created_at`. |
| `POST /v1/progress` (sincronizar) | Cabeceras `X-Super-Noa-Device` y `X-Super-Noa-Token`. Cuerpo: `world`, `campaignWorld`, `completedLevels`, `stickers`, `bossChallenges`, `totalApples` y `achievedAt` (fecha ISO del último logro) | Se guardan los contadores, `achieved_at` y `updated_at`. |
| `GET /v1/leaderboard` | Nada | Devuelve **públicamente** alias, contadores y fechas de los 20 primeros. |
| `GET /health` | Nada | — |

- **Identificador persistente**: sí. El par `deviceId` + `deviceToken` se guarda en `localStorage` (`super-noa-ranking-device-v1`) y en el servidor, y no caduca. Es un identificador de la app (pseudónimo), no del hardware ni publicitario.
- El servidor **no guarda la IP** en la base de datos. No he podido comprobar si el proxy inverso o los registros del contenedor la guardan.
- **No hay borrado**: ningún endpoint elimina un perfil.
- No hay analítica, informes de errores ni SDK de terceros.

### Respuestas propuestas

- **¿Recoge datos?** Sí.
- **¿Comparte datos?** No. Solo los recibe el servidor propio y no se transfieren a terceros. Si el servidor está alojado en un proveedor, cuenta como «proveedor de servicios», que es una excepción.
- **¿Cifrado en tránsito?** Sí (HTTPS).
- **¿Se puede pedir el borrado?** Hoy, no. Hay que implementarlo (en la app, por correo o con un formulario) o borrar o anonimizar los datos automáticamente antes de 90 días.
- **Tipos de datos**:
  - Información personal → **ID de usuario**: el alias, que es un nombre visible elegido por la persona. Obligatoria para usar el ranking, que es opcional. Finalidad: funcionalidad de la app.
  - **Identificadores de dispositivo u otros**: el `deviceId`. Google dice que los identificadores pseudónimos que no se relacionan razonablemente con un dispositivo, navegador o app no hace falta declararlos, pero este identifica la instalación. Declararlo es lo prudente. Finalidad: funcionalidad de la app.
  - Actividad en la app → **Otras acciones** (progreso del juego: mundos, pantallas, pegatinas, duelos, manzanas y fecha del logro). Finalidad: funcionalidad de la app.
  - Todo es **opcional**, porque el juego funciona sin apuntarse.

Si el alias pasa a elegirse de una lista cerrada (propuesta 2), sigue siendo un identificador de usuario, pero deja de poder contener datos personales.

### Eliminación de cuenta

[Esta política](https://support.google.com/googleplay/android-developer/answer/13327111) obliga a las apps que permiten «crear una cuenta» a ofrecer el borrado desde la app y desde un enlace web. Define cuenta como «a unique user identity that developers provide as a user-facing feature», normalmente con usuario y autenticación. La «tarjeta del ranking» tiene alias, identificador y token, así que **es probable que cuente como cuenta**. Lo seguro es implementar «Borrar mi tarjeta» en la app y una página web (puede ir con la política de privacidad) que explique cómo pedir el borrado.

## 5. Política de privacidad

Fuente: [User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311).

- Es **obligatoria para todas las apps**, también las que no recogen datos, y hay que tenerla antes de completar el apartado de público objetivo.
- Debe estar en una URL **activa, pública, sin bloqueo por país, que no sea PDF y que no se pueda editar**. Va en el campo de Play Console y **también como enlace o texto dentro de la app**.
- Contenido mínimo: quién es el responsable y un contacto de privacidad; qué datos se recogen, para qué y con quién se comparten; cómo se protegen; cuánto se conservan y cómo se borran; que se titule claramente «Política de privacidad»; y que nombre la app o el desarrollador tal como aparece en Play.
- **Dónde alojarla**: una página estática en GitHub Pages dentro del mismo sitio (por ejemplo, `public/privacidad.html` → `https://mocheto.github.io/super-noa/privacidad.html`) cumple todo. También sirve en el dominio propio si se elige para la TWA. Debe ser una página aparte del juego, legible sin JavaScript, y no un modal. Un archivo Markdown en el repositorio de GitHub también se ve en público, pero cualquier cambio en el repositorio la modifica y no tiene buen aspecto; es mejor la página.
- Debe estar en español y ser comprensible para la familia. Los textos de la app siguen siendo para Noa; la política se dirige a la persona adulta.

## 6. Clasificación por edades (IARC)

Fuente: [Content ratings](https://support.google.com/googleplay/android-developer/answer/9859455).

- Es obligatoria y gratuita. Se rellena en Contenido de la app → «Clasificación de contenido». Pide un correo de contacto, la categoría (juego) y preguntas sobre violencia, miedo, lenguaje, apuestas, compras e interacción entre usuarios.
- Una app sin clasificar se muestra como «Sin clasificar» y puede retirarse de la tienda.
- IARC asigna la etiqueta de cada región: **PEGI** en Europa, ESRB en EE. UU., USK en Alemania, etc.
- Lo esperable para Super Noa es **PEGI 3**. Los «enemigos» son caricaturescos y se esquivan o se saltan sobre ellos, y los duelos son de piedra, papel o tijera y de ritmo.
- El ranking muestra alias de otros jugadores. Si se responde que hay interacción entre usuarios o que se comparte información, se añade un descriptor de interacción. Hay que responder con sinceridad.
- Si cambia el contenido (por ejemplo, se añaden compras o chat), hay que volver a rellenar el cuestionario.

## Puntos legales (orientativo, no es asesoramiento)

- **RGPD**: el alias junto con el `deviceId` y el progreso son **datos personales pseudónimos**, porque se refieren a una persona identificable a través de su instalación. Hacen falta una base legal (consentimiento, o interés legítimo para un servicio que la persona pide), minimización, información clara y derecho de supresión. Como responsable figura el particular que lo publica. La excepción doméstica no se aplica si el ranking está abierto al público.
- **Edad de consentimiento**: según el art. 8 del RGPD y el art. 7 de la LOPDGDD, por debajo de **14 años** el consentimiento para servicios de la sociedad de la información debe darlo quien tenga la patria potestad o tutela. Es otro motivo para la puerta para adultos antes de apuntarse.
- **COPPA (EE. UU.)**: solo se aplica si la app se distribuye en EE. UU. Restringir los países de distribución a España, o a la UE, reduce el alcance. La política de familias pide cumplir la COPPA allí donde aplique.
- **Ley de Servicios Digitales (DSA)**: la declaración de comerciante o no comerciante en Play (punto 1).
- Para una revisión legal formal conviene consultar a un profesional o la guía de la AEPD sobre menores.

## Pasos en orden

Leyenda: **[T]** solo puede hacerlo la persona titular de la cuenta (identidad, pago, consola). **[A]** puede prepararlo el agente en el repositorio.

1. **[A]** Implementar en el ranking la puerta para adultos, el borrado de la tarjeta (app y servidor) y, si se decide, el alias de una lista cerrada. Sale una issue de ejecución desde el mapa.
2. **[A]** Redactar y publicar `privacidad.html` en GitHub Pages: responsable, contacto, datos del ranking, conservación, borrado y página de solicitud de borrado. Enlazarla desde la app.
3. **[T]** Crear un correo de contacto específico para Super Noa, porque será público en Play.
4. **[T]** Crear la cuenta de Play Console de tipo **personal**: pagar 25 USD, verificar la identidad legal, el correo y el teléfono, declarar el estado de comerciante (probablemente «no comerciante») y verificar el dispositivo Android con la app Play Console.
5. **[A]** Generar el AAB (TWA u otra envoltura, según el mapa) sin el permiso `AD_ID`, sin ubicación y sin SDK de terceros, con la firma que elija la persona titular. **[T]** Guardar la clave de subida y aceptar la firma de apps de Play.
6. **[T]** Crear la app en Play Console: nombre, idioma predeterminado español, juego, gratuita.
7. **[T]** Rellenar Contenido de la app con los textos que prepare el agente **[A]**: política de privacidad (URL), anuncios = no, acceso a la app, público objetivo (5 o menos, quizá 6-8), seguridad de datos (punto 4), cuestionario IARC (punto 6) y, si procede, la insignia de la política de familias.
8. **[A]** Preparar la ficha (textos en español, icono, gráfico destacado, capturas) con arte original. **[T]** Subirla.
9. **[T]** Probar primero en el canal interno con la familia cercana.
10. **[T]** Crear la **prueba cerrada**, subir la versión y enviarla a revisión. Invitar a 14 o 15 testers con cuenta de Google y comprobar que siguen apuntados durante **14 días seguidos**.
11. **[T]** Al cumplir el plazo, «Solicitar acceso a producción» y contestar el formulario. **[A]** puede preparar las respuestas.
12. **[T]** Publicar en producción, quizá primero solo en España, y vigilar los avisos de política en Play Console.

## Lo que no he podido verificar

- El tiempo real de revisión del acceso a producción y de la declaración de público objetivo en cuentas nuevas. La ayuda solo da plazos orientativos.
- Si Google considera «cuenta» la tarjeta del ranking (sin contraseña) a efectos de la política de eliminación de cuentas.
- Si Google considera el ranking con alias una «función social» en el sentido de la política de familias. La recomendación prudente es tratarlo como tal.
- Si el proxy inverso o los registros de Docker de `rankings.moche-home.es` guardan direcciones IP y durante cuánto tiempo. Afecta a la política de privacidad y quizá al formulario.
- Si la cuota sigue siendo exactamente 25 USD al pagar desde España, con su conversión de moneda o impuestos. La consola lo muestra al pagar.
- El programa Families Self-Certified Ads SDK figuraba como cerrado a nuevos participantes, pero no afecta porque no hay anuncios.
- Las preguntas exactas del cuestionario IARC: solo se ven dentro de Play Console con la cuenta.
- La interpretación legal (RGPD, LOPDGDD, COPPA): lo anterior es orientativo.
