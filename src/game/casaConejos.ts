/**
 * La madriguera de los conejos (mapa «La madriguera de los conejos», `docs/casa/madriguera.md`): la madriguera como
 * datos, la vida de Canela y Algodón arriba y bajo tierra, la zanahoria, las caricias, las cuevas, «Buscar a los
 * conejos» y el sueño de noche. Solo lógica: sin dibujo ni tiempo propio; quien la usa pasa el reloj y el azar. No se
 * guarda nada.
 *
 * Las medidas van en px de la escena del jardín: la ampliación son x negativas y bajo tierra, y de 540 a 1080.
 */

export type Punto = { x: number; y: number };
export type Azar = () => number;

// --- La madriguera como datos (recorrido A, «Pozo central») ----------------------------------------------------------

export const AMPLIACION_JARDIN = 480;
/** El trozo de tierra en corte que se ve al bajar. */
export const CORTE = { x: -480, y: 540, ancho: 720, alto: 540 } as const;
export const AGUJERO = { x: -250, y: 470 } as const;
/** Por dónde andan arriba: la hierba a los dos lados del montículo. */
export const PRADERA = { izquierda: [-440, -340], derecha: [-160, -50], fondo: 495, delante: 525 } as const;

export const NODOS_TUNEL = {
  boca: { x: -250, y: 540 },
  alto: { x: -120, y: 660 },
  medio: { x: -120, y: 800 },
  bajo: { x: -120, y: 880 },
  dormitorio: { x: -320, y: 750 },
  despensa: { x: 80, y: 800 },
  juegos: { x: -220, y: 970 },
  libre1: { x: 100, y: 970 },
  libre2: { x: -380, y: 890 },
} as const satisfies Record<string, Punto>;
export type NodoTunel = keyof typeof NODOS_TUNEL;

/** Los tramos excavados: el pozo y sus ramales. */
export const TUNELES: readonly (readonly [NodoTunel, NodoTunel])[] = [
  ["boca", "alto"], ["alto", "medio"], ["medio", "bajo"], ["bajo", "juegos"],
  ["alto", "dormitorio"], ["medio", "despensa"], ["bajo", "libre1"], ["bajo", "libre2"],
];

export const CUEVAS = ["dormitorio", "despensa", "juegos"] as const;
export type CuevaId = (typeof CUEVAS)[number];
/** Los sitios sin excavar: quedan previstos y los conejos no entran. */
export const SIN_EXCAVAR = ["libre1", "libre2"] as const;

export const ESCONDITES_CONEJO = {
  paja: { cueva: "dormitorio", x: -375, y: 765 },
  manta: { cueva: "dormitorio", x: -265, y: 765 },
  zanahorias: { cueva: "despensa", x: 30, y: 815 },
  cesta: { cueva: "despensa", x: 140, y: 815 },
  caja: { cueva: "juegos", x: -275, y: 985 },
  pelota: { cueva: "juegos", x: -165, y: 985 },
} as const satisfies Record<string, Punto & { cueva: CuevaId }>;
export type SitioConejo = keyof typeof ESCONDITES_CONEJO;
const SITIOS = Object.keys(ESCONDITES_CONEJO) as SitioConejo[];

// --- Los conejos -----------------------------------------------------------------------------------------------------

export const CONEJOS = ["canela", "algodon"] as const;
export type ConejoId = (typeof CONEJOS)[number];
export type Nivel = "arriba" | "abajo";

/** Lo que hace cada uno por su cuenta. */
export type Hace = "quieto" | "anda" | "mordisquea" | "yergue" | "lava" | "acurruca" | "juega" | "duerme";
/** La respuesta a Noa, que lo tiene quieto: la zanahoria o una caricia. */
export type Gesto = "come" | "caricia";
export const GESTO_MS: Readonly<Record<Gesto, number>> = { come: 2000, caricia: 1500 };

export type Conejo = Punto & {
  id: ConejoId;
  nivel: Nivel;
  /** Hacia dónde mira: -1 a la izquierda, 1 a la derecha. */
  mira: 1 | -1;
  hace: Hace;
  /** Hasta cuándo sigue con lo que hace estando parado. */
  hasta: number;
  /** Los puntos por los que le queda pasar. */
  ruta: Punto[];
  /** Bajo tierra: el nodo en el que está o al que va. */
  nodo: NodoTunel;
  /** Va al agujero para cambiar de nivel al llegar. */
  cambia: boolean;
  gesto: { tipo: Gesto; desde: number } | null;
};

export const BUSCAR_ENTRAN_MS = 1200;
export const BUSCAR_CELEBRAN_MS = 2500;
export const PISTA_MS = 20_000;
/** Cuánto se mueve un escondite vacío al tocarlo. */
export const MOVIDO_MS = 600;

export type Busqueda = {
  fase: "entran" | "buscan" | "celebran";
  desde: number;
  sitios: Record<ConejoId, SitioConejo>;
  encontrados: ConejoId[];
};

export type Madriguera = {
  conejos: Conejo[];
  /** Lo que está mirando Noa. */
  vista: Nivel;
  noche: boolean;
  busqueda: Busqueda | null;
  movido: { sitio: SitioConejo; desde: number } | null;
  ultimo: number;
};

export type SonidoConejos = "baja" | "sube" | "zanahoria" | "caricia" | "juega" | "cucu" | "vacio" | "bravo";
export type Salida = { madriguera: Madriguera; sonidos: SonidoConejos[] };

const VELOCIDAD: Readonly<Record<Nivel, number>> = { arriba: 90, abajo: 150 };
/** Canela es inquieto y Algodón tranquilo: lo que descansa cada uno entre una cosa y otra. */
const DESCANSO: Readonly<Record<ConejoId, readonly [number, number]>> = { canela: [900, 2200], algodon: [2000, 4200] };
/** Al decidir, la probabilidad de cambiar de nivel o, bajo tierra, de ir a otra cueva. */
const CAMBIA_DE_NIVEL = 0.12;
const CAMBIA_DE_CUEVA = 0.45;
/** El dedo alcanza a un conejo a esta distancia: los niños no apuntan fino. */
export const RADIO_CONEJO = 80;
/** A qué distancia se queda el que mira comer. */
const AL_LADO = 90;
const PASO_MAXIMO_MS = 60;

const entre = (azar: Azar, [a, b]: readonly [number, number]) => a + azar() * (b - a);
const elige = <T,>(azar: Azar, lista: readonly T[]) => lista[Math.min(lista.length - 1, Math.floor(azar() * lista.length))];
const distancia = (a: Punto, b: Punto) => Math.hypot(b.x - a.x, b.y - a.y);

const HACE_EN: Readonly<Record<CuevaId, Hace>> = { dormitorio: "acurruca", despensa: "mordisquea", juegos: "juega" };
const esCueva = (nodo: NodoTunel): nodo is CuevaId => (CUEVAS as readonly string[]).includes(nodo);

/** Dónde se pone cada uno dentro de una cueva, para no taparse. */
export const puestoEnCueva = (cueva: CuevaId, id: ConejoId): Punto =>
  ({ x: NODOS_TUNEL[cueva].x + (id === "canela" ? -22 : 22), y: NODOS_TUNEL[cueva].y + 30 });

/** Por qué nodos se va de uno a otro (sin el de salida): la madriguera es un árbol y hay un solo camino. */
export function rutaTunel(desde: NodoTunel, hasta: NodoTunel): NodoTunel[] {
  const cola: NodoTunel[][] = [[desde]];
  const vistos = new Set<NodoTunel>([desde]);
  while (cola.length) {
    const camino = cola.shift()!;
    const fin = camino[camino.length - 1];
    if (fin === hasta) return camino.slice(1);
    for (const [a, b] of TUNELES) {
      const sigue = a === fin ? b : b === fin ? a : null;
      if (sigue && !vistos.has(sigue)) {
        vistos.add(sigue);
        cola.push([...camino, sigue]);
      }
    }
  }
  return [];
}

/** Un punto de la hierba, a un lado del montículo. */
function enLaPradera(azar: Azar, lado: "izquierda" | "derecha"): Punto {
  return { x: entre(azar, PRADERA[lado]), y: entre(azar, [PRADERA.fondo, PRADERA.delante]) };
}
const ladoDe = (id: ConejoId) => (id === "canela" ? "izquierda" : "derecha");

const parar = (conejo: Conejo, hace: Hace, hasta: number) => Object.assign(conejo, { hace, hasta, ruta: [], cambia: false, gesto: null });

/** Ponerlo de golpe arriba, en su lado. */
function arriba(conejo: Conejo, ahora: number, azar: Azar) {
  Object.assign(conejo, enLaPradera(azar, ladoDe(conejo.id)), { nivel: "arriba", nodo: "boca" });
  parar(conejo, "quieto", ahora + entre(azar, DESCANSO[conejo.id]));
}

/** Ponerlo de golpe en una cueva. */
function enCueva(conejo: Conejo, cueva: CuevaId, hace: Hace, hasta: number) {
  Object.assign(conejo, puestoEnCueva(cueva, conejo.id), { nivel: "abajo", nodo: cueva });
  parar(conejo, hace, hasta);
}

/** Sale por el agujero y salta a su lado de la hierba. */
function salir(conejo: Conejo, azar: Azar) {
  Object.assign(conejo, AGUJERO, { nivel: "arriba", nodo: "boca" });
  parar(conejo, "anda", 0);
  conejo.ruta = [enLaPradera(azar, ladoDe(conejo.id))];
}

/**
 * Los puntos por los que se va, bajo tierra, hasta un nodo. A medio túnel sigue primero hasta donde iba (el nodo que
 * tenía delante o, en el último tramo, la cueva a la que llegaba) y desde ahí cambia de rumbo.
 */
function porTuneles(conejo: Conejo, destino: NodoTunel): Punto[] {
  const delante = conejo.hace === "anda" ? conejo.ruta[0] : undefined;
  const desde = (Object.keys(NODOS_TUNEL) as NodoTunel[]).find((n) => NODOS_TUNEL[n].x === delante?.x && NODOS_TUNEL[n].y === delante?.y) ?? conejo.nodo;
  const puntos: Punto[] = rutaTunel(desde, destino).map((n) => ({ ...NODOS_TUNEL[n] }));
  return delante ? [{ ...NODOS_TUNEL[desde] }, ...puntos] : puntos;
}

/** Va por los túneles hasta la cueva; si está arriba, aparece primero en la boca del pozo. */
function irACueva(conejo: Conejo, cueva: CuevaId) {
  if (conejo.nivel === "arriba") {
    parar(conejo, "quieto", 0);
    Object.assign(conejo, NODOS_TUNEL.boca, { nivel: "abajo", nodo: "boca" });
  }
  // El último punto no es el centro de la cueva sino su puesto en ella.
  const puntos = porTuneles(conejo, cueva).slice(0, -1);
  parar(conejo, "anda", 0);
  conejo.ruta = [...puntos, puestoEnCueva(cueva, conejo.id)];
  conejo.nodo = cueva;
}

export function crearMadriguera(noche: boolean, ahora: number, azar: Azar): Madriguera {
  const conejos = CONEJOS.map((id): Conejo => ({
    id, x: 0, y: 0, nivel: "arriba", mira: id === "canela" ? 1 : -1, hace: "quieto", hasta: 0, ruta: [], nodo: "boca", cambia: false, gesto: null,
  }));
  for (const conejo of conejos) {
    if (noche) enCueva(conejo, "dormitorio", "duerme", ahora);
    else arriba(conejo, ahora, azar);
  }
  return { conejos, vista: "arriba", noche, busqueda: null, movido: null, ultimo: ahora };
}

/** Copia para poder cambiarla sin tocar la anterior. */
const copiar = (m: Madriguera): Madriguera => ({
  ...m,
  conejos: m.conejos.map((c) => ({ ...c, ruta: [...c.ruta] })),
  busqueda: m.busqueda && { ...m.busqueda, encontrados: [...m.busqueda.encontrados] },
});
const nada = (madriguera: Madriguera): Salida => ({ madriguera, sonidos: [] });

/** Parado y sin nada que hacer: elige lo siguiente. */
function decidir(m: Madriguera, conejo: Conejo, ahora: number, azar: Azar) {
  const otro = m.conejos.find((c) => c !== conejo)!;
  // Puede venir adonde Noa mira; irse, solo si el otro se queda: lo que se ve nunca se vacía por su cuenta.
  const puedeCambiar = conejo.nivel !== m.vista || (otro.nivel === m.vista && !otro.cambia);
  if (puedeCambiar && azar() < CAMBIA_DE_NIVEL) {
    if (conejo.nivel === "arriba") {
      parar(conejo, "anda", 0);
      conejo.ruta = [{ ...AGUJERO }];
    } else {
      const ruta = porTuneles(conejo, "boca");
      parar(conejo, "anda", 0);
      Object.assign(conejo, { ruta, nodo: "boca" });
    }
    conejo.cambia = true;
    return;
  }
  const hasta = ahora + entre(azar, DESCANSO[conejo.id]);
  if (conejo.nivel === "abajo") {
    if (azar() < CAMBIA_DE_CUEVA || !esCueva(conejo.nodo)) irACueva(conejo, elige(azar, CUEVAS.filter((c) => c !== conejo.nodo)));
    else parar(conejo, HACE_EN[conejo.nodo], hasta);
    return;
  }
  const que = elige(azar, ["salta", "salta", "mordisquea", "yergue", "lava"] as const);
  if (que !== "salta") return parar(conejo, que, hasta);
  // Casi siempre salta por su lado; a veces cruza al otro.
  const aqui = conejo.x < AGUJERO.x ? "izquierda" : "derecha";
  const lado = azar() < 0.2 ? (aqui === "izquierda" ? "derecha" : "izquierda") : aqui;
  parar(conejo, "anda", 0);
  conejo.ruta = [enLaPradera(azar, lado)];
}

function andar(conejo: Conejo, ahora: number, dt: number, azar: Azar) {
  let queda = VELOCIDAD[conejo.nivel] * dt / 1000;
  while (queda > 0 && conejo.ruta.length) {
    const meta = conejo.ruta[0];
    const lejos = distancia(conejo, meta);
    if (meta.x !== conejo.x) conejo.mira = meta.x < conejo.x ? -1 : 1;
    if (lejos <= queda) {
      Object.assign(conejo, { x: meta.x, y: meta.y });
      conejo.ruta.shift();
      queda -= lejos;
    } else {
      conejo.x += (meta.x - conejo.x) / lejos * queda;
      conejo.y += (meta.y - conejo.y) / lejos * queda;
      queda = 0;
    }
  }
  if (conejo.ruta.length) return;
  if (conejo.cambia) {
    if (conejo.nivel === "abajo") return salir(conejo, azar);
    irACueva(conejo, elige(azar, CUEVAS));
    return;
  }
  const hace = conejo.nivel === "abajo" && esCueva(conejo.nodo) ? HACE_EN[conejo.nodo] : "quieto";
  parar(conejo, hace, ahora + entre(azar, DESCANSO[conejo.id]));
}

/** Los dos ya dentro: cada uno a un escondite y la vista baja con ellos. */
function esconderse(m: Madriguera, ahora: number, sonidos: SonidoConejos[]) {
  const busqueda = m.busqueda!;
  for (const conejo of m.conejos) {
    const { x, y, cueva } = ESCONDITES_CONEJO[busqueda.sitios[conejo.id]];
    Object.assign(conejo, { x, y, nivel: "abajo", nodo: cueva });
    parar(conejo, "quieto", ahora);
  }
  m.busqueda = { ...busqueda, fase: "buscan", desde: ahora };
  m.vista = "abajo";
  sonidos.push("baja");
}

export function avanzar(anterior: Madriguera, ahora: number, azar: Azar): Salida {
  const m = copiar(anterior);
  const sonidos: SonidoConejos[] = [];
  const dt = Math.max(0, Math.min(PASO_MAXIMO_MS, ahora - m.ultimo));
  m.ultimo = ahora;
  if (m.movido && ahora - m.movido.desde >= MOVIDO_MS) m.movido = null;
  const busqueda = m.busqueda;
  if (busqueda?.fase === "entran") {
    for (const conejo of m.conejos) andar(conejo, ahora, dt, azar);
    if (ahora - busqueda.desde >= BUSCAR_ENTRAN_MS) esconderse(m, ahora, sonidos);
    return { madriguera: m, sonidos };
  }
  if (busqueda?.fase === "celebran" && ahora - busqueda.desde >= BUSCAR_CELEBRAN_MS) {
    for (const conejo of m.conejos) {
      const { cueva } = ESCONDITES_CONEJO[busqueda.sitios[conejo.id]];
      enCueva(conejo, cueva, HACE_EN[cueva], ahora + entre(azar, DESCANSO[conejo.id]));
    }
    m.busqueda = null;
  }
  for (const conejo of m.conejos) {
    if (conejo.gesto && ahora - conejo.gesto.desde >= GESTO_MS[conejo.gesto.tipo]) conejo.gesto = null;
    // De noche duermen y buscando esperan a Noa; con un gesto a medias no se mueven.
    if (m.noche || m.busqueda || conejo.gesto) continue;
    if (conejo.hace === "anda") andar(conejo, ahora, dt, azar);
    else if (ahora >= conejo.hasta) decidir(m, conejo, ahora, azar);
  }
  return { madriguera: m, sonidos };
}

// --- Lo que hace Noa -------------------------------------------------------------------------------------------------

/**
 * Bajar o subir. Donde Noa llega a mirar siempre hay al menos un conejo (salvo arriba de noche) y subir a medias de
 * «Buscar a los conejos» lo acaba sin más.
 */
export function mirar(anterior: Madriguera, vista: Nivel, ahora: number, azar: Azar): Salida {
  if (anterior.vista === vista || anterior.busqueda?.fase === "entran") return nada(anterior);
  const m = copiar(anterior);
  m.vista = vista;
  m.movido = null;
  // El que se estaba yendo de lo que Noa pasa a mirar, se queda.
  for (const conejo of m.conejos) if (conejo.nivel === vista) conejo.cambia = false;
  if (m.busqueda) {
    m.busqueda = null;
    for (const conejo of m.conejos) arriba(conejo, ahora, azar);
  } else if (!m.noche && !m.conejos.some((c) => c.nivel === vista)) {
    const conejo = elige(azar, m.conejos);
    if (vista === "arriba") salir(conejo, azar);
    else {
      const cueva = elige(azar, CUEVAS);
      enCueva(conejo, cueva, HACE_EN[cueva], ahora + entre(azar, DESCANSO[conejo.id]));
    }
  }
  return { madriguera: m, sonidos: [vista === "abajo" ? "baja" : "sube"] };
}

/** Anochece o amanece con la casa abierta. */
export function ponerNoche(anterior: Madriguera, noche: boolean, ahora: number, azar: Azar): Madriguera {
  if (anterior.noche === noche) return anterior;
  const m = copiar(anterior);
  Object.assign(m, { noche, busqueda: null, movido: null });
  for (const conejo of m.conejos) {
    if (noche) enCueva(conejo, "dormitorio", "duerme", ahora);
    else if (m.vista === "arriba") arriba(conejo, ahora, azar);
    else enCueva(conejo, "dormitorio", "acurruca", ahora + entre(azar, DESCANSO[conejo.id]));
  }
  return m;
}

/** El conejo que está a la vista más cerca de un punto (para la zanahoria con teclado). */
export function conejoCercano(m: Madriguera, punto: Punto): ConejoId | null {
  const aLaVista = m.conejos.filter((c) => c.nivel === m.vista);
  return [...aLaVista].sort((a, b) => distancia(a, punto) - distancia(b, punto))[0]?.id ?? null;
}

/** El conejo que hay bajo el dedo. Escondidos no: entonces se toca el escondite. */
export function conejoEn(m: Madriguera, punto: Punto): ConejoId | null {
  const id = conejoCercano(m, punto);
  const conejo = m.conejos.find((c) => c.id === id);
  if (!conejo || distancia(conejo, punto) > RADIO_CONEJO) return null;
  return m.busqueda && !m.busqueda.encontrados.includes(conejo.id) ? null : conejo.id;
}

/** Dar la zanahoria: solo arriba y de día. La mordisquea y el otro, si está arriba, se acerca a mirar. */
export function darZanahoria(anterior: Madriguera, id: ConejoId, ahora: number): Salida {
  if (anterior.noche || anterior.busqueda || anterior.vista !== "arriba") return nada(anterior);
  const m = copiar(anterior);
  const conejo = m.conejos.find((c) => c.id === id)!;
  if (conejo.nivel !== "arriba") return nada(anterior);
  parar(conejo, "quieto", ahora);
  conejo.gesto = { tipo: "come", desde: ahora };
  const otro = m.conejos.find((c) => c !== conejo)!;
  if (otro.nivel === "arriba") {
    // Se pone a su lado, por donde venía; si ahí se sale de la hierba, por el otro.
    const lado = otro.x < conejo.x ? -1 : 1;
    const cabe = (x: number) => x >= PRADERA.izquierda[0] && x <= PRADERA.derecha[1];
    const x = cabe(conejo.x + lado * AL_LADO) ? conejo.x + lado * AL_LADO : conejo.x - lado * AL_LADO;
    parar(otro, "anda", 0);
    otro.ruta = [{ x, y: conejo.y }];
  }
  return { madriguera: m, sonidos: ["zanahoria"] };
}

/** Acariciar, arriba o abajo. Dormido recibe el corazón y sigue dormido. */
export function acariciar(anterior: Madriguera, id: ConejoId, ahora: number): Salida {
  const m = copiar(anterior);
  const conejo = m.conejos.find((c) => c.id === id)!;
  const escondido = m.busqueda && !m.busqueda.encontrados.includes(id);
  if (conejo.nivel !== m.vista || escondido) return nada(anterior);
  conejo.gesto = { tipo: "caricia", desde: ahora };
  return { madriguera: m, sonidos: ["caricia"] };
}

/** Tocar una cueva: un conejo va por los túneles. Si ya hay uno allí o yendo, no se llama al otro. */
export function tocarCueva(anterior: Madriguera, cueva: CuevaId, azar: Azar): Salida {
  if (anterior.noche || anterior.busqueda || anterior.vista !== "abajo") return nada(anterior);
  const m = copiar(anterior);
  const alli = m.conejos.find((c) => c.nivel === "abajo" && c.nodo === cueva && !c.cambia);
  if (alli) {
    if (alli.hace !== "anda") parar(alli, HACE_EN[cueva], alli.hasta + 1000);
  } else {
    const abajo = m.conejos.filter((c) => c.nivel === "abajo");
    const conejo = elige(azar, abajo.length ? abajo : m.conejos);
    irACueva(conejo, cueva);
  }
  return { madriguera: m, sonidos: cueva === "juegos" ? ["juega"] : [] };
}

/** Tocar el agujero empieza «Buscar a los conejos»: se meten los dos, cada uno a un escondite distinto. */
export function tocarAgujero(anterior: Madriguera, ahora: number, azar: Azar): Salida {
  if (anterior.noche || anterior.busqueda || anterior.vista !== "arriba") return nada(anterior);
  const m = copiar(anterior);
  const primero = elige(azar, SITIOS);
  const segundo = elige(azar, SITIOS.filter((s) => s !== primero));
  m.busqueda = { fase: "entran", desde: ahora, sitios: { canela: primero, algodon: segundo }, encontrados: [] };
  for (const conejo of m.conejos) {
    // El que estaba abajo ya está dentro.
    if (conejo.nivel === "abajo") continue;
    parar(conejo, "anda", 0);
    conejo.ruta = [{ ...AGUJERO }];
  }
  return { madriguera: m, sonidos: [] };
}

/** Tocar un escondite buscando: con conejo, sale; vacío (o ya encontrado), se mueve un poco. */
export function tocarEscondite(anterior: Madriguera, sitio: SitioConejo, ahora: number): Salida {
  if (anterior.busqueda?.fase !== "buscan") return nada(anterior);
  const m = copiar(anterior);
  const busqueda = m.busqueda!;
  const id = CONEJOS.find((c) => busqueda.sitios[c] === sitio && !busqueda.encontrados.includes(c));
  if (!id) {
    m.movido = { sitio, desde: ahora };
    return { madriguera: m, sonidos: ["vacio"] };
  }
  busqueda.encontrados.push(id);
  if (busqueda.encontrados.length < CONEJOS.length) return { madriguera: m, sonidos: ["cucu"] };
  Object.assign(busqueda, { fase: "celebran", desde: ahora });
  return { madriguera: m, sonidos: ["cucu", "bravo"] };
}

/** El escondite que señala la flecha: a los 20 s sin haber encontrado a ninguno. */
export function pista({ busqueda }: Madriguera, ahora: number): SitioConejo | null {
  if (busqueda?.fase !== "buscan" || busqueda.encontrados.length || ahora - busqueda.desde < PISTA_MS) return null;
  return busqueda.sitios.canela;
}
