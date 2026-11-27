/**
 * La pecera de la casa (mapa «Pecera en la casa»): un mueble con una pecera grande al fondo de la ampliación de la
 * izquierda de la habitación. Cuatro peces nadan, y Noa puede llamarlos tocando el agua, darles de comer con el bote
 * de la tapa, tocar a cada pez para ver su gracia (el naranja salta fuera, el azul gira y suelta corazones, el payaso
 * se esconde en el castillo y vuelve a asomar, el globo se infla), apagar y encender su luz (con la luz apagada
 * duermen) y, si un gatito se sienta a mirarlos, se juntan a curiosear. Solo lógica: sin dibujo ni tiempo propio; el
 * componente `PeceraCasa.tsx` pasa el reloj y el azar y pinta lo que sale de aquí.
 *
 * Todas las medidas de dentro de la pecera (`x`, `y`) van en px de su dibujo (412 × 354, de
 * `prototypes/tools/casa-pecera-recorte.py`); `PECERA.left`/`top` lo colocan en la escena.
 */

export const PECERA = {
  /** El mueble con la pecera, solo con agua y arena. */
  fondo: "./assets/sprites/casa-pecera-fondo-v2.webp",
  /**
   * El adorno del fondo, una capa del tamaño del dibujo por versión (castillo, dinosaurios, hielo, barcos y celeste), de
   * `prototypes/tools/casa-decorar-pecera-recorte.py`. Todos tienen su hueco sobre `castillo`, donde se esconde el payaso.
   */
  adornos: ["castillo", "dinosaurios", "hielo", "barcos", "celeste"].map((tema) => `./assets/sprites/casa-pecera-adorno-${tema}-v1.webp`),
  cristal: "./assets/sprites/casa-pecera-cristal-v1.webp",
  peces: "./assets/sprites/casa-peces-v1.webp",
  objetos: "./assets/sprites/casa-pecera-objetos-v1.webp",
  /** El caballito: cinco cuadros de 96 × 96 en una fila (mismas poses que los peces), que se muestran a `mostrar` px. */
  caballito: { hoja: "./assets/sprites/casa-pez-caballito-v1.webp", cuadro: 96, mostrar: 56 },
  /** El cofre del fondo: dos cuadros de 64 × 64 (cerrado y abierto), en el suelo de arena. */
  cofre: { hoja: "./assets/sprites/casa-pecera-cofre-v1.webp", mostrar: 56, izquierda: 52, arriba: 126 },
  /** Dónde está el dibujo en la escena (px): delante de la pared de la ampliación, apoyado en el suelo. */
  left: -416,
  top: 56,
  ancho: 412,
  alto: 354,
  /** El agua: de la superficie a la arena, entre los cristales. */
  agua: { izquierda: 24, derecha: 388, superficie: 76, arena: 174 },
  /** Bote de comida sobre la tapa, interruptor de la luz y puerta del castillo (para esconderse). */
  bote: { izquierda: 296, derecha: 346, arriba: 8, abajo: 52 },
  interruptor: { izquierda: 356, derecha: 390, arriba: 34, abajo: 78 },
  castillo: { x: 328, y: 178 },
  /** Cuadro de un pez en su hoja (5 cuadros por especie, una fila por especie) y de un objeto (6 cuadros en fila). */
  cuadroPez: { ancho: 96, alto: 72 },
  cuadroObjeto: 48,
} as const;

export const ESPECIES = ["naranja", "azul", "payaso", "globo", "caballito"] as const;
export type Especie = 0 | 1 | 2 | 3 | 4;
/** Cuadros de la hoja de peces. */
export const CUADRO = { nadaA: 0, nadaB: 1, nam: 2, susto: 3, dormido: 4 } as const;
/** Objetos de la hoja de objetos. */
export const OBJETO = { burbuja: 0, corazon: 1, copo: 2, brillo: 3, zeta: 4, gota: 5 } as const;
export type TipoEfecto = keyof typeof OBJETO;

export type Accion = "nada" | "salta" | "gira" | "hincha" | "baila" | "esconde" | "dentro" | "asoma" | "susto" | "duerme";

export type Pez = {
  especie: Especie;
  /** Centro del pez en el dibujo de la pecera. */
  x: number;
  y: number;
  /** 1: mira a la derecha; -1: a la izquierda. */
  mira: 1 | -1;
  accion: Accion;
  /** Momento (ms) en que empezó la acción y en que acaba (las acciones sin fin llevan `Infinity`). */
  desde: number;
  hasta: number;
  /** Adónde nada ahora y cuándo elige otro sitio. */
  destino: { x: number; y: number };
  cambiaEn: number;
  /** Copos que lleva comidos (con dos está lleno y pasa de comer) y cuándo se le pasa. */
  comidos: number;
  llenoHasta: number;
  /** Hasta cuándo tiene la boca abierta de comer. */
  comeHasta: number;
  /** El copo que persigue. */
  copo: number | null;
  /** Salto en curso: desde dónde, a qué velocidad y a qué altura vuelve a caer. */
  salto: { x0: number; y0: number; vx: number; vy: number } | null;
  /** Para el vaivén de nadar. */
  fase: number;
};

export type Copo = { id: number; x: number; y: number; nace: number; /** Cuándo se lo comieron (o `null`). */ comidoEn: number | null; llegaEn: number | null };
export type Efecto = { id: number; tipo: TipoEfecto; x: number; y: number; nace: number; dura: number; /** Deriva horizontal al subir (px). */ dx: number };

export type SonidoPecera = "toc" | "copos" | "nam" | "chapoteo" | "hincha" | "desinfla" | "beso" | "luz" | "asoma" | "zzz";

export type Pecera = {
  peces: Pez[];
  copos: Copo[];
  efectos: Efecto[];
  /** La luz de la pecera: con ella apagada duermen. */
  luz: boolean;
  siguienteId: number;
  ultimo: number;
  /** Para que no se junten dos travesuras seguidas. */
  proximaTravesura: number;
};

export type Entorno = {
  /** Número en [0, 1), como `Math.random`. */
  azar: () => number;
  /** Con «movimiento tranquilo» no hay saltos ni volteretas: solo burbujas y corazones. */
  suave?: boolean;
  /** Dónde está, en x del dibujo, el gatito que mira la pecera sentado delante (o `null`). */
  gatoMirando?: number | null;
};

export type Salida = { pecera: Pecera; sonidos: SonidoPecera[] };

// --- Medidas del movimiento -----------------------------------------------------------------------------------------

/** Cuánto se acerca a los cristales un pez (su centro) y a la superficie y la arena. */
const MARGEN_X = 34;
const MARGEN_ARRIBA = 16;
const MARGEN_ABAJO = 14;
const VELOCIDAD: Readonly<Record<Especie, number>> = { 0: 42, 1: 52, 2: 34, 3: 24, 4: 30 };
const GRAVEDAD = 900;
const COPOS_A_LA_VEZ = 12;
const COPOS_POR_PUÑADO = 6;
const BAJADA_COPO = 26;
const COPO_EN_ARENA_MS = 5000;
const LLENO_CON = 2;
const LLENO_MS = 25000;
const COMER_MS = 420;
const GIRO_MS = 800;
const HINCHA_MS = 2600;
const BAILA_MS = 900;
const SUSTO_MS = 900;
const DENTRO_MS = 1400;
const ASOMA_MS = 700;
const RADIO_TOQUE = { x: 32, y: 24 };
const PASO_MAXIMO_MS = 80;

const limites = () => ({
  izquierda: PECERA.agua.izquierda + MARGEN_X,
  derecha: PECERA.agua.derecha - MARGEN_X,
  arriba: PECERA.agua.superficie + MARGEN_ARRIBA,
  abajo: PECERA.agua.arena - MARGEN_ABAJO,
});

const entre = (valor: number, minimo: number, maximo: number) => Math.max(minimo, Math.min(maximo, valor));

function sitioLibre(azar: () => number, alrededorDe?: { x: number; y: number }, radio = 0) {
  const l = limites();
  if (alrededorDe && radio > 0) {
    return {
      x: entre(alrededorDe.x + (azar() * 2 - 1) * radio, l.izquierda, l.derecha),
      y: entre(alrededorDe.y + (azar() * 2 - 1) * radio * 0.6, l.arriba, l.abajo),
    };
  }
  return { x: l.izquierda + azar() * (l.derecha - l.izquierda), y: l.arriba + azar() * (l.abajo - l.arriba) };
}

/** Los cinco peces (los cuatro de siempre y el caballito), repartidos por el agua. */
export function crearPecera(ahora: number, azar: () => number = Math.random): Pecera {
  const l = limites();
  const huecos = [0.2, 0.42, 0.64, 0.84, 0.3];
  const peces: Pez[] = ([0, 1, 2, 3, 4] as const).map((especie, i) => {
    const x = l.izquierda + huecos[i] * (l.derecha - l.izquierda);
    const y = l.arriba + (especie === 4 ? 0.4 : especie === 3 ? 0.55 : especie === 2 ? 0.75 : 0.25 + 0.2 * i) * (l.abajo - l.arriba);
    return {
      especie, x, y, mira: i % 2 === 0 ? 1 : -1, accion: "nada", desde: ahora, hasta: Infinity,
      destino: sitioLibre(azar), cambiaEn: ahora + 500 + azar() * 2500, comidos: 0, llenoHasta: 0, comeHasta: 0, copo: null, salto: null, fase: azar() * 6,
    };
  });
  return { peces, copos: [], efectos: [], luz: true, siguienteId: 1, ultimo: ahora, proximaTravesura: ahora + 6000 + azar() * 6000 };
}

// --- Efectos -------------------------------------------------------------------------------------------------------

const DURACION_EFECTO: Readonly<Record<TipoEfecto, number>> = { burbuja: 1800, corazon: 1500, copo: 600, brillo: 700, zeta: 2200, gota: 600 };

function conEfecto(p: Pecera, tipo: TipoEfecto, x: number, y: number, ahora: number, dx = 0): Pecera {
  return { ...p, siguienteId: p.siguienteId + 1, efectos: [...p.efectos, { id: p.siguienteId, tipo, x, y, nace: ahora, dura: DURACION_EFECTO[tipo], dx }].slice(-40) };
}

function conEfectos(p: Pecera, tipo: TipoEfecto, x: number, y: number, cuantos: number, ahora: number, azar: () => number): Pecera {
  let resultado = p;
  for (let i = 0; i < cuantos; i++) resultado = conEfecto(resultado, tipo, x + (azar() * 2 - 1) * 18, y + (azar() * 2 - 1) * 8, ahora + i * 90, (azar() * 2 - 1) * 14);
  return resultado;
}

const cambiarPez = (p: Pecera, indice: number, cambios: Partial<Pez>): Pecera =>
  ({ ...p, peces: p.peces.map((pez, i) => (i === indice ? { ...pez, ...cambios } : pez)) });

// --- Posición ------------------------------------------------------------------------------------------------------

/** Dónde está el pez en el salto en el momento `ahora` (y cuánto de su salto ha pasado, en s). */
export function posicionDeSalto(salto: NonNullable<Pez["salto"]>, segundos: number) {
  return { x: salto.x0 + salto.vx * segundos, y: salto.y0 + salto.vy * segundos + 0.5 * GRAVEDAD * segundos * segundos };
}
/** Cuánto dura el salto: hasta volver a la altura de la que salió. */
export const duracionDeSalto = (salto: NonNullable<Pez["salto"]>) => (-2 * salto.vy) / GRAVEDAD;

/** Voltereta (en grados) y escala del pez según su acción, para dibujarlo. */
export function aspectoDe(pez: Pez, ahora: number): { giro: number; escala: number; cuadro: number; visible: boolean; sacude: number } {
  const t = ahora - pez.desde;
  const alterna = Math.floor(ahora / 160 + pez.fase) % 2 === 0 ? CUADRO.nadaA : CUADRO.nadaB;
  const comiendo = ahora < pez.comeHasta;
  switch (pez.accion) {
    case "salta": {
      const salto = pez.salto;
      if (!salto) return { giro: 0, escala: 1, cuadro: CUADRO.nadaA, visible: true, sacude: 0 };
      const s = Math.max(0, t / 1000);
      const vy = salto.vy + GRAVEDAD * s;
      return { giro: Math.atan2(vy, Math.abs(salto.vx) + 1) * (180 / Math.PI) * 0.5 * pez.mira, escala: 1, cuadro: s < duracionDeSalto(salto) * 0.5 ? CUADRO.susto : CUADRO.nam, visible: true, sacude: 0 };
    }
    case "gira": return { giro: (t / GIRO_MS) * 360 * pez.mira * -1, escala: 1, cuadro: CUADRO.susto, visible: true, sacude: 0 };
    case "hincha": {
      const inflado = t < HINCHA_MS - 700;
      const latido = inflado ? 1 + Math.sin(t / 90) * 0.03 : 1;
      return { giro: 0, escala: latido, cuadro: inflado ? CUADRO.susto : CUADRO.nadaB, visible: true, sacude: inflado ? Math.sin(t / 45) * 1.5 : 0 };
    }
    case "baila": return { giro: Math.sin(t / 60) * 14, escala: 1, cuadro: alterna, visible: true, sacude: Math.sin(t / 50) * 3 };
    case "dentro": return { giro: 0, escala: 1, cuadro: CUADRO.nadaA, visible: false, sacude: 0 };
    case "asoma": return { giro: 0, escala: 0.6 + 0.4 * Math.min(1, t / 250), cuadro: CUADRO.susto, visible: true, sacude: 0 };
    case "susto": return { giro: 0, escala: 1, cuadro: CUADRO.susto, visible: true, sacude: Math.sin(t / 35) * 2.5 };
    case "duerme": return { giro: 0, escala: 1, cuadro: CUADRO.dormido, visible: true, sacude: 0 };
    default: return { giro: 0, escala: 1, cuadro: comiendo ? CUADRO.nam : alterna, visible: true, sacude: 0 };
  }
}

/** Posición de dibujo del pez: la de nadar, más un vaivén suave, o la del salto. */
export function posicionDe(pez: Pez, ahora: number) {
  if (pez.accion === "salta" && pez.salto) return posicionDeSalto(pez.salto, Math.max(0, (ahora - pez.desde) / 1000));
  if (pez.accion === "duerme" || pez.accion === "dentro") return { x: pez.x, y: pez.y + Math.sin(ahora / 900 + pez.fase) * 1.5 };
  return { x: pez.x, y: pez.y + Math.sin(ahora / 420 + pez.fase) * 2.2 };
}

// --- Cosas que hace Noa ---------------------------------------------------------------------------------------------

const libre = (pez: Pez) => pez.accion === "nada" || pez.accion === "duerme";

/** Un puñado de copos desde la superficie; con la luz apagada se enciende y los peces se despiertan. */
export function soltarComida(p: Pecera, ahora: number, azar: () => number): Salida {
  const sonidos: SonidoPecera[] = ["copos"];
  let pecera: Pecera = p;
  if (!p.luz) {
    const encendida = encenderLuz(p, ahora);
    pecera = encendida.pecera;
    sonidos.push(...encendida.sonidos);
  }
  const l = limites();
  const centro = l.izquierda + azar() * (l.derecha - l.izquierda);
  const sitio = COPOS_A_LA_VEZ - pecera.copos.filter((copo) => copo.comidoEn === null).length;
  const nuevos: Copo[] = [];
  for (let i = 0; i < Math.min(COPOS_POR_PUÑADO, sitio); i++) {
    nuevos.push({ id: pecera.siguienteId + i, x: entre(centro + (azar() * 2 - 1) * 46, l.izquierda, l.derecha), y: PECERA.agua.superficie - 6 - azar() * 14, nace: ahora + i * 110, comidoEn: null, llegaEn: null });
  }
  pecera = { ...pecera, siguienteId: pecera.siguienteId + nuevos.length, copos: [...pecera.copos, ...nuevos] };
  // Con comida a la vista, a los peces se les pasa la «llenura» de antes para que no se queden sin probarla todos.
  return { pecera, sonidos };
}

/** Tocar el agua en (x, y): los peces despiertos van hacia allí a mirar y sale una burbuja. */
export function llamar(p: Pecera, x: number, y: number, ahora: number, azar: () => number): Salida {
  if (!p.luz) return { pecera: p, sonidos: [] };
  const punto = { x: entre(x, limites().izquierda, limites().derecha), y: entre(y, limites().arriba, limites().abajo) };
  const peces = p.peces.map((pez) => (pez.accion === "nada" ? { ...pez, copo: null, destino: sitioLibre(azar, punto, 34), cambiaEn: ahora + 2200 + azar() * 800 } : pez));
  return { pecera: conEfecto({ ...p, peces }, "burbuja", x, y, ahora), sonidos: ["toc"] };
}

/** El pez más cercano al punto, si está tocándolo (o -1). */
export function pezEn(p: Pecera, x: number, y: number, ahora: number): number {
  let mejor = -1;
  let distancia = Infinity;
  p.peces.forEach((pez, indice) => {
    if (pez.accion === "dentro") return;
    const centro = posicionDe(pez, ahora);
    const d = Math.hypot((x - centro.x) / RADIO_TOQUE.x, (y - centro.y) / RADIO_TOQUE.y);
    if (d <= 1 && d < distancia) { mejor = indice; distancia = d; }
  });
  return mejor;
}

/** La gracia de cada pez al tocarlo. */
export function tocarPez(p: Pecera, indice: number, ahora: number, entorno: Entorno): Salida {
  const pez = p.peces[indice];
  if (!pez) return { pecera: p, sonidos: [] };
  const { azar, suave } = entorno;
  const centro = posicionDe(pez, ahora);
  if (pez.accion === "duerme") {
    // Despierta de un susto y se vuelve a dormir si la luz sigue apagada.
    return { pecera: cambiarPez(p, indice, { accion: "susto", desde: ahora, hasta: ahora + SUSTO_MS, x: centro.x, y: centro.y }), sonidos: ["toc"] };
  }
  if (!libre(pez)) return { pecera: p, sonidos: [] };
  let pecera = cambiarPez(p, indice, { copo: null, x: centro.x, y: centro.y, comeHasta: 0 });
  const sonidos: SonidoPecera[] = [];
  if (suave) {
    // Sin movimiento brusco: un corazón y una burbuja.
    pecera = conEfecto(conEfecto(pecera, "corazon", centro.x, centro.y - 26, ahora), "burbuja", centro.x + 14 * pez.mira, centro.y - 10, ahora, 6);
    return { pecera, sonidos: ["beso"] };
  }
  switch (pez.especie) {
    case 0: {
      // El naranja salta fuera de la pecera, da una vuelta en el aire y vuelve a caer con salpicadura.
      const subeHasta = -34;
      const vy = -Math.sqrt(2 * GRAVEDAD * Math.max(40, centro.y - subeHasta));
      const mira = (centro.x > (PECERA.agua.izquierda + PECERA.agua.derecha) / 2 ? -1 : 1) as 1 | -1;
      const salto = { x0: centro.x, y0: centro.y, vx: 34 * mira, vy };
      pecera = cambiarPez(pecera, indice, { accion: "salta", desde: ahora, mira, hasta: ahora + duracionDeSalto(salto) * 1000, salto });
      // Al salir por la superficie salpica.
      const sube = (-vy - Math.sqrt(Math.max(0, vy * vy - 2 * GRAVEDAD * (centro.y - PECERA.agua.superficie)))) / GRAVEDAD;
      pecera = conEfectos(pecera, "gota", posicionDeSalto(salto, sube).x, PECERA.agua.superficie, 3, ahora + sube * 1000, azar);
      sonidos.push("chapoteo");
      break;
    }
    case 1: {
      // El azul gira como una peonza y suelta corazones.
      pecera = cambiarPez(pecera, indice, { accion: "gira", desde: ahora, hasta: ahora + GIRO_MS });
      pecera = conEfectos(pecera, "corazon", centro.x, centro.y - 20, 3, ahora, azar);
      sonidos.push("beso");
      break;
    }
    case 2: {
      // El payaso se mete corriendo en el castillo y asoma un momento después.
      pecera = cambiarPez(pecera, indice, { accion: "esconde", desde: ahora, hasta: Infinity, destino: { x: PECERA.castillo.x, y: PECERA.castillo.y }, cambiaEn: Infinity });
      sonidos.push("toc");
      break;
    }
    case 4: {
      // El caballito baila un momento y suelta una burbuja.
      pecera = cambiarPez(pecera, indice, { accion: "baila", desde: ahora, hasta: ahora + BAILA_MS });
      pecera = conEfecto(pecera, "burbuja", centro.x + 14 * pez.mira, centro.y - 10, ahora, 3 * pez.mira);
      sonidos.push("beso");
      break;
    }
    default: {
      // El globo se infla y se queda un rato redondo antes de soltar el aire.
      pecera = cambiarPez(pecera, indice, { accion: "hincha", desde: ahora, hasta: ahora + HINCHA_MS });
      pecera = conEfectos(pecera, "burbuja", centro.x, centro.y - 30, 2, ahora, azar);
      sonidos.push("hincha");
    }
  }
  return { pecera, sonidos };
}

/** Enciende o apaga la luz de la pecera: sin luz, a dormir; con luz, despiertan. */
export function encenderLuz(p: Pecera, ahora: number): Salida {
  if (p.luz) return { pecera: p, sonidos: [] };
  const peces = p.peces.map((pez) => (pez.accion === "duerme" ? { ...pez, accion: "nada" as const, desde: ahora, hasta: Infinity, cambiaEn: ahora + 400 } : pez));
  return { pecera: { ...p, luz: true, peces }, sonidos: ["luz"] };
}
export function apagarLuz(p: Pecera): Salida {
  if (!p.luz) return { pecera: p, sonidos: [] };
  return { pecera: { ...p, luz: false, peces: p.peces.map((pez) => ({ ...pez, copo: null })), copos: [] }, sonidos: ["luz"] };
}
export const cambiarLuz = (p: Pecera, ahora: number): Salida => (p.luz ? apagarLuz(p) : encenderLuz(p, ahora));

// --- El paso del tiempo ----------------------------------------------------------------------------------------------

/** ¿Está el punto (x, y) del dibujo sobre el bote de comida, el interruptor, el agua o fuera? */
export function zonaDe(x: number, y: number): "bote" | "interruptor" | "agua" | null {
  const dentro = (z: { izquierda: number; derecha: number; arriba: number; abajo: number }) => x >= z.izquierda && x <= z.derecha && y >= z.arriba && y <= z.abajo;
  if (dentro(PECERA.bote)) return "bote";
  if (dentro(PECERA.interruptor)) return "interruptor";
  const a = PECERA.agua;
  if (x >= a.izquierda && x <= a.derecha && y >= a.superficie - 28 && y <= a.arena + 20) return "agua";
  return null;
}

/** ¿Cae el punto de la escena dentro del dibujo de la pecera? Devuelve su punto en el dibujo. */
export function enLaPecera(xEscena: number, yEscena: number): { x: number; y: number } | null {
  const x = xEscena - PECERA.left;
  const y = yEscena - PECERA.top;
  return x >= 0 && x <= PECERA.ancho && y >= 0 && y <= PECERA.alto ? { x, y } : null;
}

function termina(p: Pecera, indice: number, ahora: number, azar: () => number, sonidos: SonidoPecera[]): Pecera {
  const pez = p.peces[indice];
  const reposo = { accion: "nada" as const, desde: ahora, hasta: Infinity, salto: null, copo: null, destino: sitioLibre(azar), cambiaEn: ahora + 600 + azar() * 1800 };
  switch (pez.accion) {
    case "salta": {
      const salto = pez.salto;
      const cae = salto ? posicionDeSalto(salto, duracionDeSalto(salto)) : { x: pez.x, y: pez.y };
      const l = limites();
      const x = entre(cae.x, l.izquierda, l.derecha);
      sonidos.push("chapoteo");
      return conEfectos(cambiarPez(p, indice, { ...reposo, x, y: entre(cae.y, l.arriba, l.abajo) }), "gota", x, PECERA.agua.superficie, 3, ahora, azar);
    }
    case "hincha": {
      sonidos.push("desinfla");
      return conEfectos(cambiarPez(p, indice, reposo), "burbuja", pez.x, pez.y, 4, ahora, azar);
    }
    case "esconde": return { ...cambiarPez(p, indice, { accion: "dentro", desde: ahora, hasta: ahora + DENTRO_MS, x: PECERA.castillo.x, y: PECERA.castillo.y }) };
    case "dentro": {
      sonidos.push("asoma");
      return conEfecto(cambiarPez(p, indice, { accion: "asoma", desde: ahora, hasta: ahora + ASOMA_MS }), "brillo", pez.x, pez.y - 18, ahora);
    }
    case "asoma": return conEfecto(cambiarPez(p, indice, { ...reposo, mira: -1, destino: sitioLibre(azar, { x: pez.x, y: pez.y }, 70) }), "corazon", pez.x, pez.y - 24, ahora);
    case "susto": return cambiarPez(p, indice, p.luz ? reposo : { accion: "duerme", desde: ahora, hasta: Infinity, destino: pez.destino });
    case "baila": return cambiarPez(p, indice, reposo);
    default: return cambiarPez(p, indice, reposo);
  }
}

/** La alegría de cada especie al llenarse: su gracia (salto, voltereta o inflarse) o un baile, o al menos un corazón. */
function alegriaDeComer(p: Pecera, indice: number, ahora: number, entorno: Entorno): Pecera {
  const pez = p.peces[indice];
  const corazon = conEfecto(p, "corazon", pez.x, pez.y - 24, ahora);
  if (entorno.suave || entorno.azar() < 0.3) return corazon;
  if (pez.especie === 2) return cambiarPez(corazon, indice, { accion: "baila", desde: ahora, hasta: ahora + BAILA_MS });
  return tocarPez(p, indice, ahora, entorno).pecera;
}

/**
 * Avanza la pecera hasta `ahora`: los peces nadan hacia su destino, los copos bajan y se los comen, las acciones
 * acaban, los efectos se van y, de vez en cuando, algún pez hace una travesura por su cuenta.
 */
export function avanzar(anterior: Pecera, ahora: number, entorno: Entorno): Salida {
  const dt = entre(ahora - anterior.ultimo, 0, PASO_MAXIMO_MS) / 1000;
  const { azar, suave = false } = entorno;
  const sonidos: SonidoPecera[] = [];
  let p: Pecera = { ...anterior, ultimo: ahora };
  const l = limites();

  // Copos: bajan, se posan en la arena un rato y desaparecen; los comidos se van enseguida.
  const copos = p.copos.flatMap((copo) => {
    if (copo.comidoEn !== null) return ahora - copo.comidoEn < 150 ? [copo] : [];
    if (ahora < copo.nace) return [copo];
    const y = Math.min(PECERA.agua.arena - 6, copo.y + BAJADA_COPO * dt);
    const llegaEn = y >= PECERA.agua.arena - 6 ? (copo.llegaEn ?? ahora) : null;
    if (llegaEn !== null && ahora - llegaEn > COPO_EN_ARENA_MS) return [];
    return [{ ...copo, x: copo.x + Math.sin(ahora / 700 + copo.id) * 3 * dt, y, llegaEn }];
  });
  p = { ...p, copos };

  // Efectos que ya acabaron.
  p = { ...p, efectos: p.efectos.filter((efecto) => ahora - efecto.nace < efecto.dura) };

  // Cada pez.
  for (let indice = 0; indice < p.peces.length; indice++) {
    let pez = p.peces[indice];

    if (pez.accion !== "nada" && pez.accion !== "duerme" && pez.accion !== "esconde" && ahora >= pez.hasta) {
      p = termina(p, indice, ahora, azar, sonidos);
      continue;
    }
    // Sin luz, a dormir (los que están libres).
    if (!p.luz && pez.accion === "nada") {
      pez = { ...pez, accion: "duerme", desde: ahora, hasta: Infinity, destino: { x: pez.x, y: Math.min(l.abajo, pez.y + 30) } };
      p = cambiarPez(p, indice, pez);
    }
    if (pez.accion === "duerme") {
      // Se posa despacio cerca de la arena y de vez en cuando suelta una zeta.
      const baja = Math.min(l.abajo, pez.y + 16 * dt);
      p = cambiarPez(p, indice, { y: baja });
      if (Math.floor(ahora / 2600 + pez.fase) !== Math.floor((ahora - dt * 1000) / 2600 + pez.fase)) {
        p = conEfecto(p, "zeta", pez.x + 14 * pez.mira, pez.y - 16, ahora, 8);
        sonidos.push("zzz");
      }
      continue;
    }
    if (pez.accion !== "nada" && pez.accion !== "esconde") continue;

    // Perseguir un copo (el más cercano que nadie ha reclamado) o ir al destino.
    const hambriento = pez.accion === "nada" && ahora >= pez.llenoHasta && p.luz;
    let destino = pez.destino;
    let copoActual = pez.copo !== null ? p.copos.find((copo) => copo.id === pez.copo && copo.comidoEn === null) : undefined;
    if (hambriento && !copoActual) {
      const reclamados = new Set(p.peces.filter((otro, i) => i !== indice && otro.copo !== null).map((otro) => otro.copo));
      let mejor: Copo | undefined;
      let distancia = Infinity;
      for (const copo of p.copos) {
        if (copo.comidoEn !== null || ahora < copo.nace || reclamados.has(copo.id) || copo.y < PECERA.agua.superficie) continue;
        const d = Math.hypot(copo.x - pez.x, copo.y - pez.y);
        if (d < distancia) { mejor = copo; distancia = d; }
      }
      copoActual = mejor;
    }
    if (copoActual && hambriento) destino = { x: copoActual.x, y: copoActual.y };
    else if (copoActual && !hambriento) copoActual = undefined;
    // Los curiosos: con un gatito mirando, se juntan frente a él.
    const curioso = pez.accion === "nada" && entorno.gatoMirando != null && !copoActual && p.luz;
    if (curioso) {
      // Frente al gatito, en abanico y a distintas alturas para no taparse (con el centro dentro de lo que cabe).
      const centro = entre(entorno.gatoMirando!, l.izquierda + 95, l.derecha - 95);
      const frente = { x: centro + (indice - 2) * 62, y: l.arriba + (l.abajo - l.arriba) * [0.25, 0.7, 0.35, 0.8, 0.5][indice] };
      destino = frente;
    } else if (!copoActual && pez.accion === "nada" && ahora >= pez.cambiaEn) {
      destino = sitioLibre(azar);
      pez = { ...pez, cambiaEn: ahora + 1800 + azar() * 3500 };
    }
    const dx = destino.x - pez.x;
    const dy = destino.y - pez.y;
    const d = Math.hypot(dx, dy);
    const velocidad = VELOCIDAD[pez.especie] * (suave ? 0.6 : 1) * (copoActual ? 1.9 : pez.accion === "esconde" ? 2.6 : 1);
    let x = pez.x;
    let y = pez.y;
    let mira = pez.mira;
    if (d > 2) {
      const paso = Math.min(d, velocidad * dt);
      x += (dx / d) * paso;
      y += (dy / d) * paso;
      if (Math.abs(dx) > 6) mira = dx > 0 ? 1 : -1;
    }
    // ¿Llegó? Si era un copo, se lo come; si era el castillo, entra.
    p = cambiarPez(p, indice, { x, y, mira, destino, cambiaEn: pez.cambiaEn, copo: copoActual ? copoActual.id : null });
    if (pez.accion === "esconde" && d <= 6) {
      p = termina(cambiarPez(p, indice, { x, y }), indice, ahora, azar, sonidos);
      continue;
    }
    if (copoActual && Math.hypot(copoActual.x - x, copoActual.y - y) < 20) {
      const comidos = pez.comidos + 1;
      const lleno = comidos >= LLENO_CON;
      p = { ...p, copos: p.copos.map((copo) => (copo.id === copoActual!.id ? { ...copo, comidoEn: ahora } : copo)) };
      p = cambiarPez(p, indice, { comidos: lleno ? 0 : comidos, llenoHasta: lleno ? ahora + LLENO_MS : pez.llenoHasta, comeHasta: ahora + COMER_MS, copo: null });
      sonidos.push("nam");
      p = conEfecto(p, "burbuja", x + 22 * mira, y - 6, ahora, 4 * mira);
      if (lleno) {
        p = alegriaDeComer(p, indice, ahora, entorno);
        // Si con este ya están todos llenos, fiesta: los demás bailan y salen corazones.
        if (p.peces.every((otro) => otro.llenoHasta > ahora)) {
          p = { ...p, peces: p.peces.map((otro, i) => (i !== indice && otro.accion === "nada" && !suave ? { ...otro, accion: "baila" as const, desde: ahora, hasta: ahora + BAILA_MS * 1.6 } : otro)) };
          p = conEfectos(p, "corazon", (PECERA.agua.izquierda + PECERA.agua.derecha) / 2, PECERA.agua.superficie + 50, 4, ahora, azar);
          sonidos.push("beso");
        }
      }
    }
  }

  // Travesuras por su cuenta: un pez al azar hace su gracia sin que nadie lo toque.
  if (p.luz && !suave && ahora >= p.proximaTravesura) {
    const candidatos = p.peces.map((pez, i) => ({ pez, i })).filter(({ pez }) => pez.accion === "nada" && ahora >= pez.llenoHasta - LLENO_MS + 1);
    p = { ...p, proximaTravesura: ahora + 9000 + azar() * 9000 };
    if (candidatos.length) {
      const elegido = candidatos[Math.floor(azar() * candidatos.length)];
      const hecho = tocarPez(p, elegido.i, ahora, entorno);
      p = hecho.pecera;
      sonidos.push(...hecho.sonidos);
    }
  } else if (p.luz && suave && ahora >= p.proximaTravesura) {
    p = { ...p, proximaTravesura: ahora + 7000 + azar() * 5000 };
    const elegido = p.peces[Math.floor(azar() * p.peces.length)];
    if (elegido && elegido.accion === "nada") p = conEfecto(p, "burbuja", elegido.x + 16 * elegido.mira, elegido.y - 10, ahora, 5);
  }

  return { pecera: p, sonidos };
}
