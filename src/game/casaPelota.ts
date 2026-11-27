/**
 * Jugar con la pelota (mapa «La pelota de la casa, a la vista», issue 454): la pelota sale de donde Noa la suelta con
 * el impulso del dedo, cae, bota y rueda sin salirse de lo que se ve; un gatito la mira, corre a por ella, se agazapa,
 * salta, la sujeta y la empuja. Solo lógica: el componente la llama en cada cuadro y dibuja.
 */
import type { Andante, Punto } from "./casaDeambular.ts";

/** Trozo de suelo por el que puede ir la pelota (`y` es la profundidad). */
export type Limites = { izquierda: number; derecha: number; fondo: number; delante: number };

/** `x`, `y`: su punto del suelo; `z`: altura sobre él; `giro` en grados. */
export type Bola = { x: number; y: number; z: number; vx: number; vz: number; giro: number };

export const RADIO = 32;
export const GRAVEDAD = 1800;
/** Parte de la velocidad que conserva al botar en el suelo y en un borde. */
export const BOTE = 0.62;
export const REBOTE_BORDE = 0.7;
/** Por debajo de esta velocidad de caída ya no bota. */
const BOTE_MINIMO = 120;
/** Cuánto tarda en frenarse rodando (constante de tiempo, ms). */
const ROCE_MS = 900;
const MAX_VX = 900;
const MAX_VZ = 700;
/** Soltada sin impulso, rueda un poco hacia el centro de lo que se ve, para que se la vea moverse. */
const VX_SIN_IMPULSO = 110;
/** Lo que se deja de margen a cada lado de la vista. */
const MARGEN_VISTA = 40;

const entre = (valor: number, desde: number, hasta: number) => Math.max(desde, Math.min(hasta, valor));

/** El suelo de la estancia recortado a lo que se ve; si no queda hueco, el suelo entero. */
export function limitesDe(suelo: Limites, vista: { x: number; ancho: number }): Limites {
  const izquierda = Math.max(suelo.izquierda, vista.x + MARGEN_VISTA);
  const derecha = Math.min(suelo.derecha, vista.x + vista.ancho - MARGEN_VISTA);
  return derecha - izquierda < RADIO * 4 ? suelo : { ...suelo, izquierda, derecha };
}

/** La pelota recién soltada en `punto`, con la velocidad del dedo (px de escena por segundo; hacia abajo, positiva). */
export function nuevaBola(punto: Punto, dedo: { vx: number; vy: number }, limites: Limites): Bola {
  const y = entre(punto.y, limites.fondo, limites.delante);
  const x = entre(punto.x, limites.izquierda, limites.derecha);
  const centro = (limites.izquierda + limites.derecha) / 2;
  const vx = Math.abs(dedo.vx) < VX_SIN_IMPULSO ? (x > centro ? -VX_SIN_IMPULSO : VX_SIN_IMPULSO) : entre(dedo.vx, -MAX_VX, MAX_VX);
  return { x, y, z: Math.max(0, y - punto.y), vx, vz: entre(-dedo.vy, -MAX_VZ, MAX_VZ), giro: 0 };
}

export const enElSuelo = (bola: Bola) => bola.z === 0 && bola.vz === 0;
export const quieta = (bola: Bola) => enElSuelo(bola) && bola.vx === 0;

/** Un paso de la pelota. `boto`: ha dado en el suelo con fuerza suficiente para que suene. */
export function avanzarBola(bola: Bola, ms: number, limites: Limites): { bola: Bola; boto: boolean } {
  const s = ms / 1000;
  let { x, z, vx, vz } = bola;
  let boto = false;
  if (z > 0 || vz !== 0) {
    vz -= GRAVEDAD * s;
    z += vz * s;
    if (z <= 0) {
      z = 0;
      boto = -vz > BOTE_MINIMO * 2;
      vz = -vz > BOTE_MINIMO ? -vz * BOTE : 0;
    }
  } else {
    vx *= Math.exp(-ms / ROCE_MS);
    if (Math.abs(vx) < 12) vx = 0;
  }
  x += vx * s;
  if (x < limites.izquierda) { x = limites.izquierda; vx = Math.abs(vx) * REBOTE_BORDE; }
  if (x > limites.derecha) { x = limites.derecha; vx = -Math.abs(vx) * REBOTE_BORDE; }
  const giro = bola.giro + ((x - bola.x) / RADIO) * (180 / Math.PI);
  return { bola: { x, y: bola.y, z, vx, vz, giro }, boto };
}

/** Quién va a por ella: de los despiertos, el más cercano con ganas de jugar; si ninguno tiene, el más cercano. */
export function quienJuega<Clave>(bola: Punto, candidatos: readonly { clave: Clave; pies: Punto; despierto: boolean; ganas: boolean }[]): Clave | null {
  const despiertos = candidatos.filter((candidato) => candidato.despierto);
  const conGanas = despiertos.filter((candidato) => candidato.ganas);
  let mejor: { clave: Clave; distancia: number } | null = null;
  for (const { clave, pies } of conGanas.length ? conGanas : despiertos) {
    const distancia = Math.hypot(pies.x - bola.x, pies.y - bola.y);
    if (!mejor || distancia < mejor.distancia) mejor = { clave, distancia };
  }
  return mejor?.clave ?? null;
}

/**
 * Las fases del juego: `mira` la ve caer, `corre` a por ella, se `agazapa`, `salta`, la `sujeta` entre las patas (ahí
 * cuenta como atrapada) y la `empuja`. Sin gatito, la pelota rueda `sola` hasta pararse.
 */
export type FaseJuego = "sola" | "mira" | "corre" | "agazapa" | "salta" | "sujeta" | "empuja";
export const DURACION = { mira: 300, agazapa: 450, salta: 350, sujeta: 1400, empuja: 900 } as const;
/** Sola, se queda parada este tiempo antes de irse. */
export const SOLA_PARADA_MS = 2000;
/** Velocidad mínima al correr, y lo más que tarda en llegar desde lejos. */
export const VELOCIDAD_CORRER = 260;
export const LLEGA_EN_MS = 1500;
/** Distancias del gatito a la pelota: al agazaparse, al caer sobre ella y la pelota entre sus patas. */
export const AL_ACECHO = 80;
export const AL_ALCANCE = 38;
const ALTO_PATAS = 6;

export type Juego = {
  bola: Bola;
  limites: Limites;
  fase: FaseJuego;
  /** Milisegundos en esta fase. */
  t: number;
  /** Velocidad a la que corre el gatito, fijada al salir. */
  velocidad: number;
  /** Desde dónde saltó. */
  desde: Punto;
};

export const nuevoJuego = (bola: Bola, limites: Limites, conGatito: boolean): Juego =>
  ({ bola, limites, fase: conGatito ? "mira" : "sola", t: 0, velocidad: VELOCIDAD_CORRER, desde: { x: bola.x, y: bola.y } });

/** El gatito deja de jugar (lo cogen, lo llaman…): la pelota sigue sola. */
export const sinGatito = (juego: Juego): Juego => ({ ...juego, fase: "sola", t: 0 });

export type Paso = { juego: Juego; gatito: Andante | null; atrapa: boolean; boto: boolean; acaba: boolean };

const mirando = (gatito: Andante, x: number): 1 | -1 => Math.abs(x - gatito.x) < 4 ? gatito.mira : x > gatito.x ? 1 : -1;
const sentado = (gatito: Andante, ahora: number): Andante => ({ ...gatito, destino: null, pose: "sentarse", hasta: ahora + 1500 });

/** Un paso del juego: mueve la pelota y, si juega alguno, a su gatito. */
export function pasoJuego(juego: Juego, gatito: Andante | null, ms: number, ahora: number): Paso {
  const t = juego.t + ms;
  const movida = avanzarBola(juego.bola, ms, juego.limites);
  let bola = movida.bola;
  const paso = (cambios: Partial<Juego>, quien: Andante | null, extra: Partial<Paso> = {}): Paso =>
    ({ juego: { ...juego, bola, t, ...cambios }, gatito: quien, atrapa: false, boto: movida.boto, acaba: false, ...extra });
  const pasar = (fase: FaseJuego, quien: Andante | null, cambios: Partial<Juego> = {}) => paso({ ...cambios, fase, t: 0 }, quien);

  if (!gatito || juego.fase === "sola") {
    // El tiempo solo cuenta parada.
    const parada = quieta(bola) ? t : 0;
    return paso({ fase: "sola", t: parada }, gatito, { acaba: parada >= SOLA_PARADA_MS });
  }
  const mira = mirando(gatito, bola.x);
  if (juego.fase === "mira") {
    const quien = { ...sentado(gatito, ahora), mira };
    if (t < DURACION.mira) return paso({}, quien);
    const distancia = Math.hypot(bola.x - gatito.x, bola.y - gatito.y);
    return pasar("corre", quien, { velocidad: Math.max(VELOCIDAD_CORRER, distancia / (LLEGA_EN_MS / 1000)) });
  }
  if (juego.fase === "corre") {
    const lado = gatito.x <= bola.x ? 1 : -1;
    const destino = { x: bola.x - lado * AL_ACECHO, y: bola.y };
    const dx = destino.x - gatito.x;
    const dy = destino.y - gatito.y;
    const distancia = Math.hypot(dx, dy);
    const avance = (juego.velocidad * ms) / 1000;
    if (distancia <= avance) {
      const quien = { ...sentado(gatito, ahora), ...destino, mira: lado as 1 | -1 };
      // Con la pelota aún en el aire, espera a que baje.
      return bola.z > RADIO * 2 ? paso({}, quien) : pasar("agazapa", quien);
    }
    return paso({}, { ...gatito, x: gatito.x + (dx / distancia) * avance, y: gatito.y + (dy / distancia) * avance, destino, mira, pose: "sentarse", hasta: 1500 });
  }
  if (juego.fase === "agazapa") {
    // La pelota se va parando delante de él.
    bola = { ...bola, vx: bola.vx * Math.exp(-ms / 120) };
    const quien = { ...sentado(gatito, ahora), mira };
    return t < DURACION.agazapa ? paso({}, quien) : pasar("salta", quien, { desde: { x: gatito.x, y: gatito.y } });
  }
  if (juego.fase === "salta") {
    bola = { ...bola, vx: 0, vz: 0, z: 0 };
    const hacia = juego.desde.x <= bola.x ? 1 : -1;
    const llega = { x: bola.x - hacia * AL_ALCANCE, y: bola.y };
    const tramo = Math.min(1, t / DURACION.salta);
    const quien = { ...sentado(gatito, ahora), x: juego.desde.x + (llega.x - juego.desde.x) * tramo, y: juego.desde.y + (llega.y - juego.desde.y) * tramo, mira: hacia as 1 | -1 };
    if (tramo < 1) return paso({}, quien);
    bola = { ...bola, z: ALTO_PATAS };
    return { ...pasar("sujeta", quien), atrapa: true };
  }
  if (juego.fase === "sujeta") {
    bola = { ...juego.bola, vx: 0, vz: 0 };
    const quien = sentado(gatito, ahora);
    if (t < DURACION.sujeta) return paso({}, quien);
    bola = { ...bola, vx: gatito.mira * 430, vz: 260 };
    return pasar("empuja", quien);
  }
  return paso({}, sentado(gatito, ahora), { acaba: t >= DURACION.empuja });
}

/** Con movimiento tranquilo: sin vuelo ni carrera, la pelota ya está entre las patas del gatito. */
export function atrapadaSinMoverse(juego: Juego, gatito: Andante, ahora: number): { juego: Juego; gatito: Andante } {
  const lado = gatito.x <= juego.bola.x ? 1 : -1;
  const bola = { ...juego.bola, z: ALTO_PATAS, vx: 0, vz: 0 };
  return {
    juego: { ...juego, bola, fase: "sujeta", t: 0 },
    gatito: { ...sentado(gatito, ahora), x: bola.x - lado * AL_ALCANCE, y: bola.y, mira: lado },
  };
}

/** Cuadro de la hoja del gato para cada fase (las poses de hoy; `null`: la que le toque). */
export function poseDeJuego(fase: FaseJuego, t: number): { animacion: "andar" | "pelota" | "sentado"; cuadro: number } | null {
  if (fase === "mira") return { animacion: "sentado", cuadro: 0 };
  if (fase === "corre") return { animacion: "andar", cuadro: Math.floor(t / 80) % 4 };
  if (fase === "agazapa") return { animacion: "pelota", cuadro: 1 };
  if (fase === "salta") return { animacion: "pelota", cuadro: 2 };
  if (fase === "sujeta") return { animacion: "pelota", cuadro: 3 };
  if (fase === "empuja") return { animacion: "pelota", cuadro: t < 250 ? 1 : 3 };
  return null;
}

/** Los demás despiertos se paran y miran hacia la pelota. */
export const mirarPelota = (andante: Andante, x: number, ahora: number): Andante => ({
  ...andante, destino: null, pose: andante.pose === "pedir" ? "pedir" : "sentarse", mira: mirando(andante, x),
  desde: andante.destino ? ahora : andante.desde, hasta: ahora + 800,
});
