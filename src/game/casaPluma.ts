/**
 * El juego de la pluma (mapa «Idea: juego de la pluma», issue 341): Noa arrastra la caña desde la bandeja y la pluma
 * cuelga de su hilo, siguiéndola con un poco de retraso. Los gatitos con ganas de jugar corren tras ella; con la pluma
 * quieta medio segundo al alcance de uno, salta y la atrapa, y cuenta como una pelota atrapada. Solo lógica: el
 * componente la llama en cada paso.
 */
import { cuidar, estadoDe, type CasaProgress, type GatitoCasa, type ResultadoCuidado } from "./casa.ts";
import type { Andante, Punto } from "./casaDeambular.ts";
import type { SueloDeEstancia } from "./casaHabitacion.ts";

/**
 * La punta de la caña respecto al dedo: Noa la coge por el mango y la punta queda arriba a la izquierda, para que el
 * dedo no tape la pluma.
 */
export const PUNTA_DESDE_DEDO: Punto = { x: -110, y: -90 };
export const puntaDeCana = (dedo: Punto): Punto => ({ x: dedo.x + PUNTA_DESDE_DEDO.x, y: dedo.y + PUNTA_DESDE_DEDO.y });

/** Largo del hilo: la pluma cuelga esto por debajo de la punta de la caña (px de escena). */
export const HILO = 80;
/** Retraso con que la pluma sigue a la caña (constante de tiempo, ms). */
export const RETRASO_MS = 140;
/** Lo que tiene que estar quieta la pluma para que un gatito salte y la atrape. */
export const QUIETA_MS = 500;
/** Un temblor del dedo de hasta esto no cuenta como mover la pluma. */
export const TEMBLOR = 14;
/** Velocidad al perseguirla (al deambular andan a 70). */
export const VELOCIDAD_PERSIGUE = 170;
/** Distancia horizontal desde los pies a la que la alcanza de un salto. */
export const ALCANCE = 80;
/** Cuánto por encima de sus pies llega al saltar; más arriba, la mira pero no la alcanza. */
export const ALTO_SALTO = 200;
/** Se para a esta distancia del punto bajo la pluma, para no pisarla. */
export const PARA_A = 30;
/** Tras atraparla, ese gatito descansa un poco antes de volver a perseguirla. */
export const DESCANSO_MS = 1500;

export type Pluma = Punto & {
  /** Dónde estaba al quedarse quieta, para no contar el temblor del dedo. */
  ancla: Punto;
  /** Desde cuándo está quieta (ms). */
  quietaDesde: number;
};

const colgando = (punta: Punto): Punto => ({ x: punta.x, y: punta.y + HILO });

export function nuevaPluma(punta: Punto, ahora: number): Pluma {
  const punto = colgando(punta);
  return { ...punto, ancla: punto, quietaDesde: ahora };
}

/** La pluma se acerca a donde cuelga de la caña; si se aleja de donde se quedó quieta más que un temblor, se mueve otra vez. */
export function moverPluma(pluma: Pluma, punta: Punto, ms: number, ahora: number): Pluma {
  const objetivo = colgando(punta);
  const tramo = 1 - Math.exp(-Math.max(0, ms) / RETRASO_MS);
  const x = pluma.x + (objetivo.x - pluma.x) * tramo;
  const y = pluma.y + (objetivo.y - pluma.y) * tramo;
  if (Math.hypot(x - pluma.ancla.x, y - pluma.ancla.y) > TEMBLOR) return { x, y, ancla: { x, y }, quietaDesde: ahora };
  return { ...pluma, x, y };
}

export const plumaQuieta = (pluma: Pluma, ahora: number) => ahora - pluma.quietaDesde >= QUIETA_MS;

/** Tras atraparla, hay que volver a dejarla quieta para la siguiente. */
export const plumaSoltada = (pluma: Pluma, ahora: number): Pluma => ({ ...pluma, ancla: { x: pluma.x, y: pluma.y }, quietaDesde: ahora });

/** La persigue el que tiene ganas de jugar («se nota» o «pide»); los demás solo la miran. */
export const quiereLaPluma = (gatito: GatitoCasa | undefined) => Boolean(gatito) && estadoDe(gatito!.necesidades.jugar) !== "bien";

/** Punto del suelo bajo la pluma (con un pequeño hueco por gatito, para que no se monten), adonde corren. */
export function bajoLaPluma(pluma: Punto, suelo: SueloDeEstancia["suelo"], hueco = 0): Punto {
  return {
    x: Math.max(suelo.izquierda, Math.min(suelo.derecha, pluma.x + hueco)),
    y: Math.max(suelo.fondo, Math.min(suelo.delante, pluma.y)),
  };
}

/** ¿La alcanza de un salto desde donde está? Cerca de lado y no más alta de lo que salta. */
export const alcanza = (pies: Punto, pluma: Punto) =>
  Math.abs(pies.x - pluma.x) <= ALCANCE && pluma.y >= pies.y - ALTO_SALTO && pluma.y <= pies.y + ALCANCE;

/**
 * Un paso de persecución: corre hacia el suelo bajo la pluma y, al llegar, se sienta mirándola. Mientras corre lleva
 * `destino` (el componente pinta «andar»); `hasta` guarda entonces la duración de la pose, como en `ir`.
 */
export function perseguir(andante: Andante, pluma: Punto, suelo: SueloDeEstancia["suelo"], ms: number, ahora: number, hueco = 0): Andante {
  const destino = bajoLaPluma(pluma, suelo, hueco);
  const dx = destino.x - andante.x;
  const dy = destino.y - andante.y;
  const distancia = Math.hypot(dx, dy);
  const mira: 1 | -1 = Math.abs(pluma.x - andante.x) < 4 ? andante.mira : pluma.x > andante.x ? 1 : -1;
  if (distancia <= PARA_A + 0.5) {
    return { ...andante, destino: null, pose: "sentarse", mira, desde: andante.destino ? ahora : andante.desde, hasta: ahora + 800 };
  }
  const paso = Math.min(distancia - PARA_A, (VELOCIDAD_PERSIGUE * ms) / 1000);
  return {
    ...andante, x: andante.x + (dx / distancia) * paso, y: andante.y + (dy / distancia) * paso,
    destino, pose: "sentarse", mira, hasta: 800, desde: andante.destino ? andante.desde : ahora,
  };
}

/** Con la pluma quieta medio segundo, la atrapa el que la alcanza y está más cerca; `null` si nadie. */
export function quienAtrapa<Clave>(pluma: Pluma, candidatos: readonly { clave: Clave; pies: Punto }[], ahora: number): Clave | null {
  if (!plumaQuieta(pluma, ahora)) return null;
  let mejor: { clave: Clave; distancia: number } | null = null;
  for (const { clave, pies } of candidatos) {
    if (!alcanza(pies, pluma)) continue;
    const distancia = Math.hypot(pies.x - pluma.x, pies.y - pluma.y);
    if (!mejor || distancia < mejor.distancia) mejor = { clave, distancia };
  }
  return mejor?.clave ?? null;
}

/** Atraparla cuenta como una pelota atrapada: a las tres se le pasan las ganas y puede dar corazón. */
export const atraparPluma = (casa: CasaProgress, mundo: number, ahora: Date): ResultadoCuidado => cuidar(casa, mundo, "pelota", ahora);
