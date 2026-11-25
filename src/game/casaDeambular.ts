/**
 * Deambular (mapa «La casa viva»): cada gatito de la casa anda por todo el suelo de la habitación, en cualquier
 * dirección y con profundidad, hacia un sitio cualquiera o hacia un sitio de interés, y al llegar hace lo que había
 * decidido (sentarse, cantar, jugar solo, dormir, pedir…). Solo lógica: el componente la llama en cada paso.
 */
import { bocadilloDe, elegirVida, type EstadoVida, type GatitoCasa } from "./casa.ts";
import { dentroDelSuelo, type SueloDeEstancia } from "./casaHabitacion.ts";
import { IR_A_LA_VENTANA } from "./casaClima.ts";

/** Velocidad al andar, en px de escena por segundo, en cualquier dirección. */
export const VELOCIDAD_GATITO = 70;
/** Distancia mínima entre el destino de un gatito y los demás gatitos (y sus destinos). */
export const SEPARACION = 100;
/** Con qué probabilidad un gatito va a propósito al sitio de interés de lo que quiere hacer. */
export const IR_AL_SITIO = 0.5;
/** El gatito que pide algo anda entre 2 y 4 s y luego se para a pedir entre 4 y 6 s. */
export const ANDAR_PIDIENDO_S = [2, 4] as const;
export const PEDIR_S = [4, 6] as const;
/** Al tocarlo, se queda quieto este tiempo. */
export const QUIETO_AL_TOCAR_MS = 2500;

export type Punto = { x: number; y: number };
export type Andante = Punto & {
  /** Hacia dónde va; `null` si está quieto haciendo su pose. */
  destino: Punto | null;
  /** Lo que hace al llegar (o lo que está haciendo si está quieto). */
  pose: EstadoVida;
  /** Hasta cuándo dura la pose (ms); al acabar, decide otra vez. */
  hasta: number;
  /** Desde cuándo hace lo que hace (ms), para la animación. */
  desde: number;
  mira: 1 | -1;
};

export const andando = (andante: Andante) => andante.destino !== null;

export function nuevoAndante(punto: Punto, ahora: number, pose: EstadoVida = "sentarse"): Andante {
  return { ...punto, destino: null, pose, hasta: ahora, desde: ahora, mira: 1 };
}

/** Manda al gatito hacia `destino`; al llegar hará `pose` durante `segundos`. */
export function ir(andante: Andante, destino: Punto, pose: EstadoVida, segundos: number, ahora: number): Andante {
  const mira: 1 | -1 = destino.x > andante.x ? 1 : destino.x < andante.x ? -1 : andante.mira;
  return { ...andante, destino, pose, hasta: segundos * 1000, desde: ahora, mira };
}

/** Pose en el sitio, sin andar. */
export const quedarse = (andante: Andante, pose: EstadoVida, segundos: number, ahora: number): Andante =>
  ({ ...andante, destino: null, pose, hasta: ahora + segundos * 1000, desde: ahora });

/** Avanza `ms` milisegundos: si anda, se acerca a su destino a velocidad constante; al llegar, empieza su pose. */
export function avanzarAndante(andante: Andante, ms: number, ahora: number): Andante {
  if (!andante.destino) return andante;
  const dx = andante.destino.x - andante.x;
  const dy = andante.destino.y - andante.y;
  const distancia = Math.hypot(dx, dy);
  const paso = (VELOCIDAD_GATITO * ms) / 1000;
  if (distancia <= paso) {
    // `hasta` guardaba la duración de la pose mientras andaba: ahora pasa a ser un momento.
    return { ...andante, x: andante.destino.x, y: andante.destino.y, destino: null, desde: ahora, hasta: ahora + andante.hasta };
  }
  return { ...andante, x: andante.x + (dx / distancia) * paso, y: andante.y + (dy / distancia) * paso };
}

/** ¿Está libre el punto? A más de `SEPARACION` de los otros gatitos y de adonde van. */
export function libre(punto: Punto, otros: readonly Andante[]) {
  return otros.every((otro) => Math.hypot(otro.x - punto.x, otro.y - punto.y) >= SEPARACION
    && (!otro.destino || Math.hypot(otro.destino.x - punto.x, otro.destino.y - punto.y) >= SEPARACION));
}

/** Un punto libre del suelo, cerca de `cerca` si se da (a como mucho `radio`). Si no encuentra, se queda donde está. */
export function puntoLibre(habitacion: SueloDeEstancia, desde: Punto, otros: readonly Andante[], azar: () => number, cerca?: { radio: number }): Punto {
  const { izquierda, derecha, fondo, delante } = habitacion.suelo;
  for (let intento = 0; intento < 24; intento++) {
    const punto = cerca
      ? (() => {
        const angulo = azar() * Math.PI * 2;
        const radio = cerca.radio * (0.5 + azar() * 0.5);
        return { x: desde.x + Math.cos(angulo) * radio, y: desde.y + Math.sin(angulo) * radio * 0.6 };
      })()
      : { x: izquierda + azar() * (derecha - izquierda), y: fondo + azar() * (delante - fondo) };
    const dentro = { x: Math.max(izquierda, Math.min(derecha, punto.x)), y: Math.max(fondo, Math.min(delante, punto.y)) };
    if (dentroDelSuelo(habitacion, dentro.x, dentro.y) && libre(dentro, otros)) return dentro;
  }
  return { x: desde.x, y: desde.y };
}

export type ContextoDecision = { habitacion: SueloDeEstancia; noche: boolean; casaLimpia: boolean; alguienPide: boolean; sitioNoche: Punto; azar: () => number; ahora: number; /** Llueve o nieva: van más a mirar por la ventana. */ miranFuera?: boolean };

/**
 * Decide qué hace un gatito que ha acabado lo que hacía:
 * - de noche, va a su sitio de la cama a dormir;
 * - si pide algo, alterna: tras pedir, anda 2–4 s y se para a pedir otra vez;
 * - si no, elige con la vida propia; al andar va a un punto libre del suelo, y para dormir, jugar solo, sentarse o
 *   cantar a veces va antes al sitio de interés de eso (cama, rascador, ventana, alfombra), si está libre;
 * - con lluvia o nieve (`miranFuera`), a veces va a sentarse a la ventana a mirar.
 */
export function decidir(andante: Andante, gatito: GatitoCasa, otros: readonly Andante[], contexto: ContextoDecision): Andante {
  const { habitacion, azar, ahora } = contexto;
  const entre = ([desde, hasta]: readonly [number, number]) => desde + azar() * (hasta - desde);
  if (contexto.noche) {
    const cerca = Math.hypot(andante.x - contexto.sitioNoche.x, andante.y - contexto.sitioNoche.y) < 4;
    return cerca ? quedarse(andante, "dormir", 10, ahora) : ir(andante, contexto.sitioNoche, "dormir", 10, ahora);
  }
  if (bocadilloDe(gatito)) {
    if (andante.pose !== "pedir") return quedarse(andante, "pedir", entre(PEDIR_S), ahora);
    const segundos = entre(ANDAR_PIDIENDO_S);
    const destino = puntoLibre(habitacion, andante, otros, azar, { radio: VELOCIDAD_GATITO * segundos });
    return ir(andante, destino, "pedir", entre(PEDIR_S), ahora);
  }
  const ventana = habitacion.sitios.ventana;
  if (contexto.miranFuera && ventana && azar() < IR_A_LA_VENTANA && libre(ventana, otros)) {
    return ir(andante, { x: ventana.x, y: ventana.y }, "sentarse", 6 + Math.floor(azar() * 6), ahora);
  }
  const eleccion = elegirVida(gatito, contexto, azar);
  if (eleccion.estado === "andar") {
    return ir(andante, puntoLibre(habitacion, andante, otros, azar), "sentarse", eleccion.segundos, ahora);
  }
  // Si hay varios sitios para lo mismo (la cama y el cojín para dormir), uno al azar.
  const sitios = Object.values(habitacion.sitios).filter((s) => s?.para === eleccion.estado);
  const sitio = sitios.length > 1 ? sitios[Math.floor(azar() * sitios.length)] : sitios[0];
  if (sitio && azar() < IR_AL_SITIO && libre(sitio, otros)) return ir(andante, { x: sitio.x, y: sitio.y }, eleccion.estado, eleccion.segundos, ahora);
  return quedarse(andante, eleccion.estado, eleccion.segundos, ahora);
}

/** Al tocarlo (con el dedo o soltándole algo encima), se para en el acto. */
export const parar = (andante: Andante, ahora: number): Andante =>
  andando(andante) ? { ...andante, destino: null, pose: andante.pose === "pedir" ? "pedir" : "sentarse", desde: ahora, hasta: ahora + QUIETO_AL_TOCAR_MS } : andante;

/** Índice del gatito bajo el punto, contando su cuerpo con la escala de profundidad (o -1). */
export function gatitoBajo(punto: Punto, andantes: readonly Andante[], escalaDe: (y: number) => number, toque: number, alto = 140): number {
  let mejor = -1;
  let distancia = Infinity;
  andantes.forEach((andante, indice) => {
    const escala = escalaDe(andante.y);
    const centro = { x: andante.x, y: andante.y - (alto * escala) / 2 };
    const dx = Math.abs(punto.x - centro.x);
    const dy = Math.abs(punto.y - centro.y);
    // El cuerpo, de la cabeza a los pies, con un margen de 20 px arriba y abajo.
    const dentroEnVertical = punto.y >= andante.y - alto * escala - 20 && punto.y <= andante.y + 20;
    if (dx <= toque * escala && dentroEnVertical) {
      const d = Math.hypot(dx, dy);
      // Si se tocan dos, gana el de delante (más abajo en la pantalla) y, a igualdad, el más cercano.
      if (mejor < 0 || andante.y > andantes[mejor].y + 1 || d < distancia) { mejor = indice; distancia = d; }
    }
  });
  return mejor;
}
