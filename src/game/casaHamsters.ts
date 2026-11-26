/**
 * La jaula de hámsters de la casa (mapa «Jaula de hamsters en la casa de los gatitos», `docs/casa/jaula-hamsters.md`):
 * el laberinto como datos, cómo se mueven Perla y Bolita, lo que pasa al tocar, la comida y el agua y la escapada.
 * Solo lógica: sin dibujo ni tiempo propio; quien la usa pasa el reloj y el azar.
 *
 * Dentro de la jaula las medidas van en px del dibujo del laberinto (`DIBUJO`); un hámster fuera, y todo lo que
 * toca Noa al arrastrarlo, en px de la escena. `aEscena` y `aDibujo` pasan de unas a otras.
 */
import { HAMSTERS_LLENOS, RACIONES, type HamstersProgress } from "./casaProgreso.ts";

export { HAMSTERS_LLENOS, RACIONES, type HamstersProgress };

export type Punto = { x: number; y: number };

// --- El laberinto (recorrido B del boceto) ---------------------------------------------------------------------------

/** Trozo del dibujo del laberinto que se pinta. */
export const DIBUJO = { x: 30, y: 30, ancho: 896, alto: 495 } as const;
/** Dónde va en la escena: al 80 %, en los 720 px de x = -1140 a -420. */
export const SITIO_JAULA = { left: -1138, top: 54, escala: 0.8, zona: { desde: -1140, hasta: -420 } } as const;
export const JAULA_EN_ESCENA = {
  izquierda: SITIO_JAULA.left,
  derecha: SITIO_JAULA.left + DIBUJO.ancho * SITIO_JAULA.escala,
  arriba: SITIO_JAULA.top,
  abajo: SITIO_JAULA.top + DIBUJO.alto * SITIO_JAULA.escala,
} as const;

export const aEscena = (p: Punto): Punto => ({
  x: SITIO_JAULA.left + (p.x - DIBUJO.x) * SITIO_JAULA.escala,
  y: SITIO_JAULA.top + (p.y - DIBUJO.y) * SITIO_JAULA.escala,
});
export const aDibujo = (p: Punto): Punto => ({
  x: DIBUJO.x + (p.x - SITIO_JAULA.left) / SITIO_JAULA.escala,
  y: DIBUJO.y + (p.y - SITIO_JAULA.top) / SITIO_JAULA.escala,
});

/** La reja de la jaula, en el dibujo, y su puerta (delante, abajo). */
export const REJA = { x0: 390, y0: 190, x1: 760, y1: 520 } as const;
export const PUERTA_JAULA = { x: 545, y: 205, ancho: 76, alto: 62 } as const;
export const REPISA = { x: 400, y: 330, ancho: 350 } as const;

/** Nodos: dónde está el centro de un hámster. */
export const NODOS = {
  f1: { x: 430, y: 458 }, f2: { x: 525, y: 458 }, f3: { x: 625, y: 458 }, f4: { x: 720, y: 458 },
  p1: { x: 470, y: 313 }, p2: { x: 690, y: 313 },
  c1: { x: 200, y: 458 }, c2: { x: 210, y: 200 }, c3: { x: 840, y: 135 },
} as const satisfies Record<string, Punto>;
export type NodoId = keyof typeof NODOS;
/** Los nodos que son cubos de unión entre tubos. */
export const CUBOS: readonly NodoId[] = ["c1", "c2", "c3"];

export type ColorTubo = "rojo" | "azul" | "amarillo";
type Trazo = { a: NodoId; b: NodoId; tipo: "tubo" | "suelo" | "rampa"; color?: ColorTubo; via?: readonly (readonly [number, number])[] };

const TRAZOS: readonly Trazo[] = [
  { a: "f1", b: "c1", tipo: "tubo", color: "rojo" },
  { a: "c1", b: "c2", tipo: "tubo", color: "amarillo", via: [[60, 458], [60, 200]] },
  { a: "c2", b: "p1", tipo: "tubo", color: "azul", via: [[320, 200], [320, 313]] },
  { a: "p2", b: "c3", tipo: "tubo", color: "rojo", via: [[840, 313]] },
  { a: "c3", b: "c2", tipo: "tubo", color: "amarillo", via: [[840, 60], [210, 60]] },
  { a: "f4", b: "c3", tipo: "tubo", color: "azul", via: [[895, 458], [895, 135]] },
  { a: "c1", b: "c2", tipo: "tubo", color: "azul", via: [[200, 340], [320, 340], [320, 270], [130, 270], [130, 200]] },
  { a: "f1", b: "f2", tipo: "suelo" },
  { a: "f2", b: "f3", tipo: "suelo" },
  { a: "f3", b: "f4", tipo: "suelo" },
  { a: "p1", b: "p2", tipo: "suelo" },
  { a: "f2", b: "p1", tipo: "rampa" },
  { a: "f3", b: "p2", tipo: "rampa" },
];

const RADIO_CODO = 42;

const mezcla = (a: Punto, b: Punto, t: number): Punto => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const distancia = (a: Punto, b: Punto) => Math.hypot(b.x - a.x, b.y - a.y);

/** La línea de un camino con las esquinas redondeadas: los puntos por los que se anda y se dibuja. */
function trazar(puntos: readonly Punto[]): Punto[] {
  const linea: Punto[] = [puntos[0]];
  for (let i = 1; i < puntos.length - 1; i += 1) {
    const [a, b, c] = [puntos[i - 1], puntos[i], puntos[i + 1]];
    const hacia = (q: Punto) => mezcla(b, q, Math.min(RADIO_CODO, distancia(b, q) / 2) / distancia(b, q));
    const entra = hacia(a);
    const sale = hacia(c);
    for (let paso = 0; paso <= 8; paso += 1) {
      const t = paso / 8;
      linea.push(mezcla(mezcla(entra, b, t), mezcla(b, sale, t), t));
    }
  }
  linea.push(puntos[puntos.length - 1]);
  return linea;
}

export type Camino = Trazo & { linea: readonly Punto[]; largo: number };

export const CAMINOS: readonly Camino[] = TRAZOS.map((trazo) => {
  const linea = trazar([NODOS[trazo.a], ...(trazo.via ?? []).map(([x, y]) => ({ x, y })), NODOS[trazo.b]]);
  const largo = linea.reduce((total, punto, i) => (i ? total + distancia(linea[i - 1], punto) : 0), 0);
  return { ...trazo, linea, largo };
});

/** Punto del camino a `s` px de su principio y hacia dónde va ahí (grados). */
export function puntoDe(camino: Camino, s: number): Punto & { angulo: number } {
  let resto = Math.max(0, Math.min(camino.largo, s));
  for (let i = 1; i < camino.linea.length; i += 1) {
    const [a, b] = [camino.linea[i - 1], camino.linea[i]];
    const tramo = distancia(a, b);
    if (resto <= tramo || i === camino.linea.length - 1) {
      return { ...mezcla(a, b, tramo ? Math.min(1, resto / tramo) : 0), angulo: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
    }
    resto -= tramo;
  }
  return { ...camino.linea[0], angulo: 0 };
}

export type Cosa = "rueda" | "casita" | "columpio" | "comida" | "agua";
export const COSAS: Readonly<Record<Cosa, NodoId>> = { rueda: "p1", casita: "p2", columpio: "f3", comida: "f2", agua: "f4" };

const vecinos = (nodo: NodoId) => CAMINOS.flatMap((camino, i) => (camino.a === nodo || camino.b === nodo ? [i] : []));
const otroExtremo = (camino: Camino, nodo: NodoId) => (camino.a === nodo ? camino.b : camino.a);

/** El camino más corto en tramos, como índices de `CAMINOS`. */
export function ruta(desde: NodoId, hasta: NodoId): number[] {
  const vistos = new Set<NodoId>([desde]);
  const cola: [NodoId, number[]][] = [[desde, []]];
  while (cola.length) {
    const [nodo, pasos] = cola.shift()!;
    if (nodo === hasta) return pasos;
    for (const i of vecinos(nodo)) {
      const siguiente = otroExtremo(CAMINOS[i], nodo);
      if (!vistos.has(siguiente)) {
        vistos.add(siguiente);
        cola.push([siguiente, [...pasos, i]]);
      }
    }
  }
  return [];
}

// --- Los hámsters ----------------------------------------------------------------------------------------------------

export const NOMBRES_HAMSTER = ["perla", "bolita"] as const;
export type HamsterId = (typeof NOMBRES_HAMSTER)[number];

export type EsconditeId = "cama" | "rascador" | "cojin";
/** Dónde se esconde un hámster escapado: los sitios de la habitación (px de escena, con los pies en el suelo). */
export const ESCONDITES: Readonly<Record<EsconditeId, Punto>> = {
  cama: { x: 360, y: 430 },
  rascador: { x: 545, y: 425 },
  cojin: { x: 240, y: 500 },
};
const IDS_ESCONDITE = Object.keys(ESCONDITES) as EsconditeId[];

export const SUELO_FUERA = 505;
/** Al soltarlo a esta distancia de la jaula (px de escena) o menos, entra. */
export const RADIO_JAULA = 150;
export const PISTA_MS = 20000;
const PASEA_FUERA_MS = 3000;
const VELOCIDAD = { tubo: 90, suelo: 55, rampa: 55, fuera: 170 } as const;

export type Fuera = {
  fase: "corre" | "escondido" | "cogido";
  escondite: EsconditeId;
  /** Desde cuándo está en esta fase. */
  desde: number;
};

export type Hamster = {
  id: HamsterId;
  /** Centro y rumbo (grados): en el dibujo del laberinto o, fuera de la jaula, en la escena. */
  x: number;
  y: number;
  angulo: number;
  nodo: NodoId;
  /** El tramo que recorre (índice de `CAMINOS`), cuánto lleva y en qué sentido. */
  camino: number | null;
  s: number;
  sentido: 1 | -1;
  anterior: number | null;
  /** Los tramos que le quedan para llegar adonde va y qué hará al llegar. */
  plan: number[];
  meta: Cosa | null;
  hace: Cosa | null;
  hasta: number;
  /** Cuándo vuelve a tener hambre y sed. */
  hambreEn: number;
  sedEn: number;
  fuera: Fuera | null;
};

export type SonidoJaula = "tubo" | "rueda" | "columpio" | "casita" | "comida" | "agua" | "escapa" | "vuelve" | "hamster";

export type Jaula = {
  hamsters: Hamster[];
  comida: number;
  agua: number;
  puertaAbierta: boolean;
  ultimo: number;
};

export type Azar = () => number;
export type Salida = { jaula: Jaula; sonidos: SonidoJaula[] };

const entre = (azar: Azar, a: number, b: number) => a + azar() * (b - a);
const elige = <T,>(azar: Azar, lista: readonly T[]) => lista[Math.min(lista.length - 1, Math.floor(azar() * lista.length))];
const PASO_MAXIMO_MS = 60;

/** Lo que se guarda de la jaula: las raciones que quedan. */
export const guardadoDe = (jaula: Jaula): HamstersProgress => ({ comida: jaula.comida, agua: jaula.agua });

export function crearJaula(guardado: HamstersProgress | undefined, ahora: number, azar: Azar): Jaula {
  const inicio: Record<HamsterId, NodoId> = { perla: "f1", bolita: "p1" };
  const { comida, agua } = guardado ?? HAMSTERS_LLENOS;
  return {
    comida, agua, puertaAbierta: false, ultimo: ahora,
    hamsters: NOMBRES_HAMSTER.map((id): Hamster => ({
      id, ...NODOS[inicio[id]], angulo: 0, nodo: inicio[id], camino: null, s: 0, sentido: 1, anterior: null,
      plan: [], meta: null, hace: null, hasta: ahora + (id === "bolita" ? 1500 : 300),
      hambreEn: ahora + entre(azar, 10000, 40000), sedEn: ahora + entre(azar, 15000, 50000), fuera: null,
    })),
  };
}

const DURA: Readonly<Record<Cosa, readonly [number, number]>> = {
  rueda: [3000, 6000], columpio: [3000, 6000], casita: [4000, 4000], comida: [2500, 3500], agua: [2500, 3500],
};

/** Empieza a usar la cosa en la que está; `false` si está ocupada o vacía. */
function usar(jaula: Jaula, hamster: Hamster, cosa: Cosa, ahora: number, azar: Azar, sonidos: SonidoJaula[]): boolean {
  if (jaula.hamsters.some((otro) => otro !== hamster && !otro.fuera && otro.hace === cosa)) return false;
  if (cosa === "comida" || cosa === "agua") {
    if (jaula[cosa] <= 0) return false;
    jaula[cosa] -= 1;
    hamster[cosa === "comida" ? "hambreEn" : "sedEn"] = ahora + entre(azar, 40000, 80000);
  }
  hamster.hace = cosa;
  hamster.hasta = ahora + entre(azar, ...DURA[cosa]);
  hamster.meta = null;
  sonidos.push(cosa);
  return true;
}

function emprender(hamster: Hamster, indice: number) {
  hamster.camino = indice;
  hamster.s = 0;
  hamster.sentido = CAMINOS[indice].a === hamster.nodo ? 1 : -1;
}

/** Parado en un nodo: qué hace ahora. */
function decidir(jaula: Jaula, hamster: Hamster, ahora: number, azar: Azar, sonidos: SonidoJaula[]) {
  const falta: Cosa | null = ahora >= hamster.hambreEn && jaula.comida > 0 ? "comida" : ahora >= hamster.sedEn && jaula.agua > 0 ? "agua" : null;
  if (falta && !hamster.plan.length && !hamster.meta) {
    if (COSAS[falta] === hamster.nodo) {
      if (usar(jaula, hamster, falta, ahora, azar, sonidos)) return;
    } else hamster.plan = ruta(hamster.nodo, COSAS[falta]);
  }
  const siguiente = hamster.plan.shift();
  if (siguiente !== undefined) return emprender(hamster, siguiente);
  const meta = hamster.meta;
  hamster.meta = null;
  if (meta && COSAS[meta] === hamster.nodo && usar(jaula, hamster, meta, ahora, azar, sonidos)) return;
  const aqui = (Object.keys(COSAS) as Cosa[]).find((cosa) => COSAS[cosa] === hamster.nodo);
  if (aqui && aqui !== "comida" && aqui !== "agua" && azar() < 0.45 && usar(jaula, hamster, aqui, ahora, azar, sonidos)) return;
  if (azar() < 0.1) {
    hamster.hasta = ahora + entre(azar, 800, 2200);
    return;
  }
  const todos = vecinos(hamster.nodo);
  const nuevos = todos.filter((i) => i !== hamster.anterior);
  const opciones = nuevos.length ? nuevos : todos;
  const tubos = opciones.filter((i) => CAMINOS[i].tipo === "tubo");
  emprender(hamster, elige(azar, tubos.length && azar() < 0.55 ? tubos : opciones));
}

function andarDentro(jaula: Jaula, hamster: Hamster, ahora: number, dt: number, azar: Azar, sonidos: SonidoJaula[]) {
  if (hamster.camino === null) {
    if (ahora < hamster.hasta) return;
    hamster.hace = null;
    decidir(jaula, hamster, ahora, azar, sonidos);
    return;
  }
  const camino = CAMINOS[hamster.camino];
  hamster.s += VELOCIDAD[camino.tipo] * dt / 1000;
  const { x, y, angulo } = puntoDe(camino, hamster.sentido > 0 ? hamster.s : camino.largo - hamster.s);
  hamster.x = x;
  hamster.y = y;
  hamster.angulo = hamster.sentido > 0 ? angulo : angulo + 180;
  if (hamster.s < camino.largo) return;
  hamster.nodo = hamster.sentido > 0 ? camino.b : camino.a;
  hamster.anterior = hamster.camino;
  hamster.camino = null;
  Object.assign(hamster, NODOS[hamster.nodo]);
  hamster.angulo = Math.cos(hamster.angulo * Math.PI / 180) < 0 ? 180 : 0;
}

function correrFuera(hamster: Hamster, fuera: Fuera, ahora: number, dt: number) {
  if (fuera.fase !== "corre") return;
  const paseando = ahora - fuera.desde < PASEA_FUERA_MS;
  // Primero corretea un poco por la alfombra y luego va a esconderse.
  const meta = paseando ? { x: 300 + Math.sin(ahora / 450) * 220, y: SUELO_FUERA } : ESCONDITES[fuera.escondite];
  const dx = meta.x - hamster.x;
  const dy = meta.y - hamster.y;
  const queda = Math.hypot(dx, dy);
  const paso = Math.min(queda, VELOCIDAD.fuera * dt / 1000);
  if (queda > 0) {
    hamster.x += dx / queda * paso;
    hamster.y += dy / queda * paso;
  }
  hamster.angulo = dx < 0 ? 180 : 0;
  if (!paseando && queda - paso < 2) hamster.fuera = { fase: "escondido", escondite: fuera.escondite, desde: ahora };
}

/** Copia para poder cambiarla sin tocar la anterior. */
const copiar = (jaula: Jaula): Jaula => ({ ...jaula, hamsters: jaula.hamsters.map((h) => ({ ...h, plan: [...h.plan] })) });

export function avanzar(anterior: Jaula, ahora: number, azar: Azar): Salida {
  const jaula = copiar(anterior);
  const sonidos: SonidoJaula[] = [];
  const dt = Math.max(0, Math.min(PASO_MAXIMO_MS, ahora - jaula.ultimo));
  jaula.ultimo = ahora;
  for (const hamster of jaula.hamsters) {
    if (hamster.fuera) correrFuera(hamster, hamster.fuera, ahora, dt);
    else andarDentro(jaula, hamster, ahora, dt, azar, sonidos);
  }
  return { jaula, sonidos };
}

// --- Lo que hace Noa -------------------------------------------------------------------------------------------------

/** Un hámster que esté libre dentro de la jaula, si lo hay. */
function libre(jaula: Jaula, azar: Azar): Hamster | undefined {
  const dentro = jaula.hamsters.filter((h) => !h.fuera);
  const ociosos = dentro.filter((h) => !h.hace);
  const lista = ociosos.length ? ociosos : dentro;
  return lista.length ? elige(azar, lista) : undefined;
}

/** El nodo desde el que puede cambiar de rumbo: en el que está o el final del tramo que recorre. */
function desdeDe(hamster: Hamster): NodoId {
  if (hamster.camino === null) return hamster.nodo;
  const camino = CAMINOS[hamster.camino];
  return hamster.sentido > 0 ? camino.b : camino.a;
}

function mandar(hamster: Hamster, plan: number[], meta: Cosa | null, ahora: number) {
  hamster.plan = plan;
  hamster.meta = meta;
  hamster.hace = null;
  hamster.hasta = ahora;
}

/** Tocar la rueda, el columpio, la casita, el comedero o el bebedero: un hámster va para allá. */
export function tocarCosa(anterior: Jaula, cosa: Cosa, ahora: number, azar: Azar): Salida {
  const jaula = copiar(anterior);
  const ocupado = jaula.hamsters.some((h) => !h.fuera && (h.hace === cosa || h.meta === cosa));
  const hamster = ocupado ? undefined : libre(jaula, azar);
  if (hamster) mandar(hamster, ruta(desdeDe(hamster), COSAS[cosa]), cosa, ahora);
  return { jaula, sonidos: [cosa] };
}

/** Tocar un tubo: un hámster va hasta su boca más cercana y lo recorre. */
export function tocarTubo(anterior: Jaula, indice: number, ahora: number, azar: Azar): Salida {
  const jaula = copiar(anterior);
  const camino = CAMINOS[indice];
  const hamster = libre(jaula, azar);
  if (hamster && camino?.tipo === "tubo" && hamster.camino !== indice) {
    const desde = desdeDe(hamster);
    const ida = ruta(desde, camino.a);
    const vuelta = ruta(desde, camino.b);
    mandar(hamster, [...(ida.length <= vuelta.length ? ida : vuelta).filter((i) => i !== indice), indice], null, ahora);
  }
  return { jaula, sonidos: ["tubo"] };
}

/** Rellenar el comedero o el bebedero desde la bandeja. */
export function rellenar(anterior: Jaula, cual: "comida" | "agua"): Salida {
  if (anterior[cual] >= RACIONES) return { jaula: anterior, sonidos: [] };
  return { jaula: { ...copiar(anterior), [cual]: RACIONES }, sonidos: [cual] };
}

export const hayAlguienFuera = (jaula: Jaula) => jaula.hamsters.some((h) => h.fuera);

/** Abrir la puerta: un hámster sale a la habitación. Con uno ya fuera no pasa nada. */
export function abrirPuerta(anterior: Jaula, ahora: number, azar: Azar): Salida {
  if (hayAlguienFuera(anterior)) return { jaula: anterior, sonidos: [] };
  const jaula = copiar(anterior);
  const hamster = elige(azar, jaula.hamsters);
  jaula.puertaAbierta = true;
  Object.assign(hamster, aEscena({ x: PUERTA_JAULA.x + PUERTA_JAULA.ancho / 2, y: PUERTA_JAULA.y + PUERTA_JAULA.alto / 2 }));
  Object.assign(hamster, { camino: null, plan: [], meta: null, hace: null, angulo: 0 });
  hamster.fuera = { fase: "corre", escondite: elige(azar, IDS_ESCONDITE), desde: ahora };
  return { jaula, sonidos: ["escapa"] };
}

/** Noa coge a un hámster que está fuera (también si está escondido). */
export function coger(anterior: Jaula, id: HamsterId, ahora: number): Salida {
  const jaula = copiar(anterior);
  const hamster = jaula.hamsters.find((h) => h.id === id);
  if (!hamster?.fuera) return { jaula: anterior, sonidos: [] };
  hamster.fuera = { ...hamster.fuera, fase: "cogido", desde: ahora };
  return { jaula, sonidos: ["hamster"] };
}

/** Mueve al hámster cogido (px de escena). */
export function arrastrar(anterior: Jaula, id: HamsterId, punto: Punto): Jaula {
  const jaula = copiar(anterior);
  const hamster = jaula.hamsters.find((h) => h.id === id);
  if (hamster?.fuera?.fase !== "cogido") return anterior;
  Object.assign(hamster, { x: punto.x, y: punto.y, angulo: 0 });
  return jaula;
}

export function distanciaALaJaula({ x, y }: Punto): number {
  const { izquierda, derecha, arriba, abajo } = JAULA_EN_ESCENA;
  return Math.hypot(Math.max(izquierda - x, 0, x - derecha), Math.max(arriba - y, 0, y - abajo));
}

/** Soltarlo: cerca de la jaula entra y la puerta se cierra sola; lejos, sale corriendo a esconderse otra vez. */
export function soltar(anterior: Jaula, id: HamsterId, ahora: number, azar: Azar): Salida {
  const jaula = copiar(anterior);
  const hamster = jaula.hamsters.find((h) => h.id === id);
  if (hamster?.fuera?.fase !== "cogido") return { jaula: anterior, sonidos: [] };
  if (distanciaALaJaula(hamster) > RADIO_JAULA) {
    hamster.fuera = { fase: "corre", escondite: elige(azar, IDS_ESCONDITE), desde: ahora };
    return { jaula, sonidos: [] };
  }
  Object.assign(hamster, NODOS.f3, { fuera: null, nodo: "f3", camino: null, anterior: null, angulo: 0, hasta: ahora + 800 });
  jaula.puertaAbierta = hayAlguienFuera(jaula);
  return { jaula, sonidos: ["vuelve"] };
}

export type Tocado =
  | { tipo: "puerta" }
  | { tipo: "hamster"; id: HamsterId }
  | { tipo: "cosa"; cosa: Cosa }
  | { tipo: "tubo"; indice: number };

/** Centro de cada cosa respecto a su nodo, en el dibujo: hasta dónde llega el dedo. */
const TOQUE_COSA: Readonly<Record<Cosa, { dy: number; radio: number }>> = {
  rueda: { dy: -20, radio: 45 }, casita: { dy: -12, radio: 42 }, columpio: { dy: -20, radio: 38 }, comida: { dy: 8, radio: 32 }, agua: { dy: -38, radio: 34 },
};
const RADIO_HAMSTER = 32;
const RADIO_TUBO = 26;
/** El dedo coge a un hámster escapado a esta distancia (px de escena): los niños no apuntan fino. */
const RADIO_COGER = 70;

/** El hámster escapado (corriendo o escondido) que hay bajo el dedo (px de escena). */
export function fugadoEn(jaula: Jaula, punto: Punto): HamsterId | null {
  return jaula.hamsters.find((h) => h.fuera && distancia(h, punto) <= RADIO_COGER)?.id ?? null;
}

/** Qué hay en la jaula bajo un toque (px de escena). */
export function queHayEn(jaula: Jaula, punto: Punto): Tocado | null {
  const p = aDibujo(punto);
  if (p.x >= PUERTA_JAULA.x && p.x <= PUERTA_JAULA.x + PUERTA_JAULA.ancho && p.y >= PUERTA_JAULA.y && p.y <= PUERTA_JAULA.y + PUERTA_JAULA.alto) return { tipo: "puerta" };
  const hamster = jaula.hamsters.find((h) => !h.fuera && distancia(h, p) <= RADIO_HAMSTER);
  if (hamster) return { tipo: "hamster", id: hamster.id };
  const cosa = (Object.keys(COSAS) as Cosa[]).find((c) => distancia({ x: NODOS[COSAS[c]].x, y: NODOS[COSAS[c]].y + TOQUE_COSA[c].dy }, p) <= TOQUE_COSA[c].radio);
  if (cosa) return { tipo: "cosa", cosa };
  let mejor: { indice: number; lejos: number } | null = null;
  for (const [indice, camino] of CAMINOS.entries()) {
    if (camino.tipo !== "tubo") continue;
    for (let s = 0; s <= camino.largo; s += 12) {
      const lejos = distancia(puntoDe(camino, s), p);
      if (lejos <= RADIO_TUBO && (!mejor || lejos < mejor.lejos)) mejor = { indice, lejos };
    }
  }
  return mejor ? { tipo: "tubo", indice: mejor.indice } : null;
}

/** El escondite que señala la flecha: el de un hámster que lleva 20 s escondido. */
export function pista(jaula: Jaula, ahora: number): EsconditeId | null {
  const perdido = jaula.hamsters.find((h) => h.fuera?.fase === "escondido" && ahora - h.fuera.desde >= PISTA_MS);
  return perdido?.fuera?.escondite ?? null;
}
