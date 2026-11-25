/**
 * El campo opcional `casa` del progreso, sin el motor de la casa (issue «Sacar los normalizadores de la casa del
 * bloque principal»): sus tipos, los identificadores que se guardan, la lectura tolerante (`normalizeCasa`) y lo poco
 * que el mapa necesita para saber quién llega a la casa. Solo depende de datos; el resto de la casa (necesidades,
 * cuidados, jardín, fotos, dibujo…) va con `CasaGatitos`, en su propio bloque. Los módulos de la casa reexportan de
 * aquí lo que era suyo, así que se sigue importando desde ellos.
 */
import { friendData as friendCatalog } from "./friendData.ts";

// --- Gatitos y necesidades -------------------------------------------------------------------------------------------

export type NecesidadId = "comer" | "mimos" | "bano" | "jugar";

/** Orden de urgencia: si pide varias cosas, el bocadillo enseña la primera. */
export const NECESIDADES: readonly NecesidadId[] = ["comer", "mimos", "bano", "jugar"];
export const CORAZONES_MEJOR_AMIGO = 5;
export const CORAZONES_AL_DIA = 2;
export const LANZAMIENTOS_PARA_JUGAR = 3;
export const MAX_HUELLAS = 6;
/** Ancho de la habitación, en el que se colocan las huellas. */
export const ANCHO_CASA = 960;
/** Como mucho, estos gatitos en casa a la vez (mapa «Más gatitos en la casa»); los demás están de paseo. */
export const MAX_EN_CASA = 5;

export type GatitoCasa = {
  necesidades: Record<NecesidadId, number>;
  corazones: number;
  /** Corazones ganados el día `dia` (fecha local AAAA-MM-DD). */
  corazonesHoy: number;
  dia: string;
  /** Pelotas atrapadas mientras quiere jugar; con tres, se le pasan las ganas. */
  lanzamientos: number;
};
export type HuellaDeBarro = { x: number; mundo: number };
export type CasaProgress = {
  /** Gatitos de la casa por número de mundo. */
  gatitos: Record<string, GatitoCasa>;
  huellas: HuellaDeBarro[];
  /** Momento del último cálculo de las necesidades (ISO). */
  calculadoEn: string;
  /** Gatitos cuya llegada a la casa ya se ha visto. */
  presentados: number[];
  /** Versión elegida de cada mueble; si falta, la decoración de siempre (`decoracionDe`). */
  decoracion?: Decoracion;
  /** Gatitos en casa (cinco como mucho); los demás están de paseo. Si falta, los primeros cinco por mundo (`enCasaDe`). */
  enCasa?: number[];
  /** Hora de dormir: gatitos arropados en la noche `noche` (fecha local de la tarde en que empezó, AAAA-MM-DD). */
  dormir?: { noche: string; arropados: number[] };
  /** Fotos de la casa, la más nueva primero (doce como mucho). */
  fotos?: FotoCasa[];
  /** Accesorios que lleva cada gatito, por número de mundo; solo los que llevan algo (`ropaDe`). */
  ropa?: Record<string, Ropa>;
  /** Gatitos cuya comida favorita ya ha descubierto Noa (`favoritaDescubierta`). */
  favoritas?: number[];
  /** Gatitos en casa que están en el jardín; los demás, en la habitación (`estanciaDe`). */
  enJardin?: number[];
  /** Los maceteros del jardín; si falta, los tres con su semilla (`jardinDe`). */
  jardin?: JardinProgress;
  /** Última visita de un animal amigo (`tocaVisita`): como mucho una al día. */
  visitante?: VisitanteProgress;
};

const porMundo = (a: number, b: number) => a - b;

/** Gatitos en casa, por orden de mundo: los elegidos o, si nunca se eligió, los primeros cinco. */
export function enCasaDe(casa: CasaProgress): number[] {
  const todos = Object.keys(casa.gatitos).map(Number).sort(porMundo);
  if (!casa.enCasa) return todos.slice(0, MAX_EN_CASA);
  return casa.enCasa.filter((mundo) => casa.gatitos[mundo]).sort(porMundo).slice(0, MAX_EN_CASA);
}

export const fechaLocal = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

export const casaVacia = (ahora: Date): CasaProgress => ({ gatitos: {}, huellas: [], calculadoEn: ahora.toISOString(), presentados: [] });

export const gatitoNuevo = (ahora: Date): GatitoCasa => ({
  necesidades: { comer: 0, mimos: 0, bano: 0, jugar: 0 }, corazones: 0, corazonesHoy: 0, dia: fechaLocal(ahora), lanzamientos: 0,
});

/** Gatitos que están en la casa pero cuya llegada aún no se ha visto, en orden de mundo. */
export const llegadasPendientes = (casa: CasaProgress): number[] =>
  Object.keys(casa.gatitos).map(Number).filter((mundo) => !casa.presentados.includes(mundo)).sort(porMundo);

/**
 * Mete en la casa a los gatitos rescatados que aún no estaban, con todo «bien». Entran en casa mientras haya sitio;
 * los que no caben se quedan de paseo (la llegada deja elegir a quién mandar de paseo).
 */
export function asegurarGatitos(casa: CasaProgress, mundos: readonly number[], ahora: Date): CasaProgress {
  const faltan = mundos.filter((mundo) => !casa.gatitos[mundo]).sort(porMundo);
  if (!faltan.length) return casa;
  const dentro = enCasaDe(casa);
  const caben = faltan.slice(0, Math.max(0, MAX_EN_CASA - dentro.length));
  return {
    ...casa,
    gatitos: { ...casa.gatitos, ...Object.fromEntries(faltan.map((mundo) => [mundo, gatitoNuevo(ahora)])) },
    enCasa: [...dentro, ...caben].sort(porMundo),
  };
}

// --- Lectura tolerante: utilidades -----------------------------------------------------------------------------------

const esRegistro = (valor: unknown): valor is Record<string, unknown> => Boolean(valor) && typeof valor === "object" && !Array.isArray(valor);
const entero = (valor: unknown, minimo: number, maximo: number) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.max(minimo, Math.min(maximo, Math.floor(numero))) : minimo;
};
const fraccion = (valor: unknown) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.max(0, Math.min(1, numero)) : 0;
};
const entre = (valor: unknown, minimo: number, maximo: number) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.max(minimo, Math.min(maximo, numero)) : null;
};
const esDia = (valor: unknown): valor is string => typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor);

/** Mundos de la lista que son gatitos de la casa, sin repetir y en orden; sin ninguno, `undefined`. */
function mundosDeGatitos(raw: unknown, esGatito: (mundo: number) => boolean): number[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const mundos = [...new Set(raw.map(Number).filter((mundo) => Number.isInteger(mundo) && esGatito(mundo)))].sort(porMundo);
  return mundos.length ? mundos : undefined;
}

// --- Decoración (`casaDecoracion.ts`) --------------------------------------------------------------------------------

export type MuebleId = "cama" | "alfombra" | "cuadro" | "planta" | "pared" | "cortinas" | "estanteria" | "cojin";
export type Version = 0 | 1 | 2 | 3 | 4;
export type Decoracion = Record<MuebleId, Version>;

export const MUEBLES: readonly MuebleId[] = ["cama", "alfombra", "cuadro", "planta", "pared", "cortinas", "estanteria", "cojin"];
export const VERSIONES: readonly Version[] = [0, 1, 2, 3, 4];

export const DECORACION_DE_SIEMPRE: Decoracion = { cama: 0, alfombra: 0, cuadro: 0, planta: 0, pared: 0, cortinas: 0, estanteria: 0, cojin: 0 };

const esVersion = (valor: unknown): valor is Version => VERSIONES.includes(valor as Version);

/** Lectura tolerante: lo que falte o no valga sale como la decoración de siempre. */
export function normalizeDecoracion(raw: unknown): Decoracion {
  const datos = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  return Object.fromEntries(MUEBLES.map((id) => [id, esVersion(datos[id]) ? datos[id] : 0])) as Decoracion;
}

export const esDeSiempre = (decoracion: Decoracion) => MUEBLES.every((id) => decoracion[id] === 0);

// --- Ropa (`casaRopa.ts`) --------------------------------------------------------------------------------------------

export const TIPOS_ACCESORIO = ["sombrero", "gafas", "bufanda", "capa", "alas"] as const;
export type TipoAccesorio = (typeof TIPOS_ACCESORIO)[number];

/**
 * Las piezas de cada tipo, en el orden de su lámina (`casa-accesorios-v2.webp` para sombreros, gafas y bufandas, una
 * fila por tipo; `casa-capas-v1.webp` y `casa-alas-v1.webp`). Los identificadores son estables: se guardan en el
 * progreso, y no se repiten entre tipos (son también la clave de su texto).
 */
export const ACCESORIOS = {
  sombrero: ["paja", "gorro", "fiesta", "chistera", "maquinista", "pirata"],
  gafas: ["redondas", "estrella", "corazon", "buceo", "esqui", "aviador"],
  bufanda: ["rayas", "copos", "lunares", "flecos", "dinosaurio", "manzanas"],
  capa: ["caballero", "dragon", "navidad", "desierto", "musica", "bosque"],
  alas: ["mariposa", "murcielago", "buho", "pez", "mariquita", "unicornio"],
} as const satisfies Record<TipoAccesorio, readonly string[]>;
export type Accesorio<T extends TipoAccesorio = TipoAccesorio> = (typeof ACCESORIOS)[T][number];

/** Lo que lleva un gatito: como mucho una pieza de cada tipo. */
export type Ropa = { [T in TipoAccesorio]?: Accesorio<T> };

export const esAccesorio = <T extends TipoAccesorio>(tipo: T, valor: unknown): valor is Accesorio<T> =>
  (ACCESORIOS[tipo] as readonly unknown[]).includes(valor);

export const ropaVacia = (ropa: Ropa) => TIPOS_ACCESORIO.every((tipo) => ropa[tipo] === undefined);

/** Lectura tolerante de lo que lleva un gatito: las piezas que no se entienden se quitan; sin nada, `undefined`. */
export function normalizeRopa(raw: unknown): Ropa | undefined {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return undefined;
  const registro = raw as Record<string, unknown>;
  const ropa: Ropa = {};
  for (const tipo of TIPOS_ACCESORIO) {
    const pieza = registro[tipo];
    if (esAccesorio(tipo, pieza)) (ropa as Record<TipoAccesorio, string>)[tipo] = pieza;
  }
  return ropaVacia(ropa) ? undefined : ropa;
}

/** Lectura tolerante de la ropa de todos: solo gatitos de la casa y con algo puesto. */
export function normalizeRopaCasa(raw: unknown, esGatito: (mundo: number) => boolean): Record<string, Ropa> | undefined {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return undefined;
  const todas = Object.entries(raw as Record<string, unknown>).flatMap(([mundo, valor]): [string, Ropa][] => {
    const ropa = /^[1-9]\d?$/.test(mundo) && esGatito(Number(mundo)) ? normalizeRopa(valor) : undefined;
    return ropa ? [[mundo, ropa]] : [];
  });
  return todas.length ? Object.fromEntries(todas) : undefined;
}

// --- Comida favorita (`casaComida.ts`) -------------------------------------------------------------------------------

/** Lectura tolerante de las favoritas descubiertas: solo gatitos de la casa, sin repetir. */
export const normalizeFavoritas = mundosDeGatitos;

// --- Clima (`casaClima.ts`) ------------------------------------------------------------------------------------------

export type Clima = "sol" | "lluvia" | "nieve" | "arcoiris";
export const CLIMAS: readonly Clima[] = ["sol", "lluvia", "nieve", "arcoiris"];

export const esClima = (valor: unknown): valor is Clima => typeof valor === "string" && (CLIMAS as readonly string[]).includes(valor);

// --- Poses del gato (`casaGatoArte.ts`), que guardan las fotos -------------------------------------------------------

/** Filas de la hoja del gato base, en orden, con sus cuadros y su velocidad en cuadros por segundo. */
export const ANIMACIONES_GATO = {
  andar: { fila: 0, cuadros: 4, fps: 8 },
  sentado: { fila: 1, cuadros: 2, fps: 1.5 },
  cola: { fila: 2, cuadros: 1, fps: 1 },
  dormir: { fila: 3, cuadros: 2, fps: 1 },
  jugarSolo: { fila: 4, cuadros: 3, fps: 5 },
  cantar: { fila: 5, cuadros: 2, fps: 3 },
  pedir: { fila: 6, cuadros: 2, fps: 3 },
  comer: { fila: 7, cuadros: 3, fps: 4 },
  ronronear: { fila: 8, cuadros: 2, fps: 3 },
  bano: { fila: 9, cuadros: 2, fps: 3 },
  sacudirse: { fila: 10, cuadros: 3, fps: 6 },
  pelota: { fila: 11, cuadros: 4, fps: 8 },
  ahoraNo: { fila: 12, cuadros: 2, fps: 3 },
} as const;
export type AnimacionGato = keyof typeof ANIMACIONES_GATO;

// --- Jardín (`casaJardin.ts`) ----------------------------------------------------------------------------------------

export const ETAPAS = ["semilla", "brote", "capullo", "flor"] as const;
export type Etapa = (typeof ETAPAS)[number];
export const COLORES_FLOR = ["roja", "amarilla", "azul", "rosa"] as const;
export type ColorFlor = (typeof COLORES_FLOR)[number];
/** Celdas de la lámina de los maceteros: diez de 100 × 128 en fila (semilla, brote y, por color, capullo y flor). */
export const CELDAS_MACETEROS = 10;

/** Un macetero: su etapa y, desde que brota, el color de su flor (al azar, distinto de los otros si se puede). */
export type Macetero = { color?: ColorFlor; etapa: Etapa; /** Día local del último riego (AAAA-MM-DD). */ regado?: string };
export type JardinProgress = { maceteros: Macetero[] };

/** Si nunca se ha regado: los tres maceteros con su semilla. */
export const JARDIN_DE_SIEMPRE: JardinProgress = { maceteros: [{ etapa: "semilla" }, { etapa: "semilla" }, { etapa: "semilla" }] };

/** Lectura tolerante de los gatitos en el jardín: solo gatitos de la casa, sin repetir. */
export const normalizeEnJardin = mundosDeGatitos;

/** Lectura tolerante del jardín: tres maceteros con color y etapa conocidos; lo que no se entiende, como de siempre. */
export function normalizeJardin(raw: unknown): JardinProgress | undefined {
  if (typeof raw !== "object" || raw === null || !Array.isArray((raw as { maceteros?: unknown }).maceteros)) return undefined;
  const leidos = (raw as { maceteros: unknown[] }).maceteros;
  const maceteros = JARDIN_DE_SIEMPRE.maceteros.map((deSiempre, i): Macetero => {
    const m = leidos[i] as Partial<Record<keyof Macetero, unknown>> | undefined;
    if (!m || typeof m !== "object") return deSiempre;
    const color = (COLORES_FLOR as readonly unknown[]).includes(m.color) ? (m.color as ColorFlor) : undefined;
    const leida = (ETAPAS as readonly unknown[]).includes(m.etapa) ? (m.etapa as Etapa) : "semilla";
    // Sin color no puede haber brotado.
    const etapa = color ? leida : "semilla";
    const regado = esDia(m.regado) ? m.regado : undefined;
    return { ...(etapa !== "semilla" ? { color } : {}), etapa, ...(regado ? { regado } : {}) };
  });
  return maceteros.every((m) => m.etapa === "semilla" && !m.regado) ? undefined : { maceteros };
}

// --- Visitante (`casaVisitante.ts`) ----------------------------------------------------------------------------------

export type VisitanteProgress = { /** Día local de la última visita (AAAA-MM-DD). */ dia: string; /** Animal (tipo del catálogo de amigos). */ animal: string };

/** Lectura tolerante de la última visita: día válido y animal del catálogo. */
export function normalizeVisitante(raw: unknown): VisitanteProgress | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const { dia, animal } = raw as Record<string, unknown>;
  if (!esDia(dia) || typeof animal !== "string") return undefined;
  return friendCatalog.some((amigo) => amigo.kind === animal) ? { dia, animal } : undefined;
}

// --- Fotos (`casaFoto.ts`) -------------------------------------------------------------------------------------------

export const MAX_FOTOS = 12;
/** Medidas de la escena de la casa (px). */
const ANCHO_ESCENA = 1280;
const ALTO_ESCENA = 540;
const MACETEROS = 3;

export type GatitoEnFoto = {
  mundo: number;
  /** Pies del gatito en la escena. */
  x: number;
  y: number;
  animacion: AnimacionGato;
  cuadro: number;
  mira: 1 | -1;
  sucio: boolean;
  mejorAmigo: boolean;
  arropado: boolean;
  /** Accesorios que llevaba (si llevaba alguno y no estaba arropado). */
  ropa?: Ropa;
};

export type FotoCasa = {
  /** Momento en que se hizo (ISO). */
  hecha: string;
  /** Trozo de la habitación que se veía: desde `x`, `ancho` px de escena. */
  vista: { x: number; ancho: number };
  decoracion: Decoracion;
  noche: boolean;
  /** De noche, con la lámpara apagada. */
  apagada: boolean;
  gatitos: GatitoEnFoto[];
  /** El clima que se veía (mapa «Idea: clima en la ventana»); si falta, sol. */
  clima?: Clima;
  /** Hecha en el jardín (mapa «Jardín de la casa»): la celda de cada macetero tal como estaba. Si falta, en la habitación. */
  jardin?: { maceteros: number[]; /** El visitante que había (mapa «Visitas de los amigos a la casa»): su animal y sus pies. */ visitante?: { animal: string; x: number; y: number } };
};

function normalizeJardinEnFoto(raw: unknown): FotoCasa["jardin"] | undefined {
  if (!esRegistro(raw) || !Array.isArray(raw.maceteros)) return undefined;
  const leidos: unknown[] = raw.maceteros;
  const maceteros = Array.from({ length: MACETEROS }, (_, i) => Math.floor(entre(leidos[i], 0, CELDAS_MACETEROS - 1) ?? 0));
  const visitante = esRegistro(raw.visitante) && typeof raw.visitante.animal === "string" && /^[a-z-]{2,40}$/.test(raw.visitante.animal)
    ? { animal: raw.visitante.animal, x: entre(raw.visitante.x, 0, ANCHO_ESCENA), y: entre(raw.visitante.y, 0, ALTO_ESCENA) }
    : null;
  return { maceteros, ...(visitante && visitante.x !== null && visitante.y !== null ? { visitante: { animal: visitante.animal, x: visitante.x, y: visitante.y } } : {}) };
}

function normalizeGatitoEnFoto(raw: unknown): GatitoEnFoto | null {
  if (!esRegistro(raw)) return null;
  const mundo = Number(raw.mundo);
  const x = entre(raw.x, 0, ANCHO_ESCENA);
  const y = entre(raw.y, 0, ALTO_ESCENA);
  if (!Number.isInteger(mundo) || mundo < 1 || mundo > 17 || x === null || y === null) return null;
  const animacion = typeof raw.animacion === "string" && Object.hasOwn(ANIMACIONES_GATO, raw.animacion) ? raw.animacion as AnimacionGato : "sentado";
  const cuadro = Math.floor(entre(raw.cuadro, 0, ANIMACIONES_GATO[animacion].cuadros - 1) ?? 0);
  const ropa = normalizeRopa(raw.ropa);
  return { mundo, x, y, animacion, cuadro, mira: raw.mira === -1 ? -1 : 1, sucio: raw.sucio === true, mejorAmigo: raw.mejorAmigo === true, arropado: raw.arropado === true, ...(ropa ? { ropa } : {}) };
}

/** Lectura tolerante de las fotos guardadas: las que no se entienden se quitan. */
export function normalizeFotos(raw: unknown): FotoCasa[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((foto): FotoCasa[] => {
    if (!esRegistro(foto) || typeof foto.hecha !== "string" || !Number.isFinite(Date.parse(foto.hecha)) || !esRegistro(foto.vista)) return [];
    const ancho = entre(foto.vista.ancho, 100, ANCHO_ESCENA);
    const x = entre(foto.vista.x, 0, ANCHO_ESCENA);
    if (ancho === null || x === null) return [];
    const jardin = normalizeJardinEnFoto(foto.jardin);
    const gatitos = (Array.isArray(foto.gatitos) ? foto.gatitos : []).map(normalizeGatitoEnFoto).filter((g): g is GatitoEnFoto => g !== null).slice(0, MAX_EN_CASA);
    return [{
      hecha: new Date(foto.hecha).toISOString(),
      vista: { x: Math.min(x, ANCHO_ESCENA - ancho), ancho },
      decoracion: normalizeDecoracion(foto.decoracion),
      noche: foto.noche === true,
      apagada: foto.noche === true && foto.apagada === true,
      gatitos,
      ...(esClima(foto.clima) && foto.clima !== "sol" ? { clima: foto.clima } : {}),
      ...(jardin ? { jardin } : {}),
    }];
  }).slice(0, MAX_FOTOS);
}

// --- La casa entera --------------------------------------------------------------------------------------------------

/** Lectura tolerante del campo opcional `casa` del progreso. Lo que no se entiende se descarta; si no hay casa, `undefined`. */
export function normalizeCasa(raw: unknown): CasaProgress | undefined {
  if (!esRegistro(raw)) return undefined;
  const fecha = typeof raw.calculadoEn === "string" && Number.isFinite(Date.parse(raw.calculadoEn)) ? new Date(raw.calculadoEn).toISOString() : null;
  if (!fecha) return undefined;
  const gatitos: Record<string, GatitoCasa> = {};
  for (const [mundo, valor] of Object.entries(esRegistro(raw.gatitos) ? raw.gatitos : {})) {
    if (!/^[1-9]\d?$/.test(mundo) || !esRegistro(valor)) continue;
    const necesidades = esRegistro(valor.necesidades) ? valor.necesidades : {};
    gatitos[mundo] = {
      necesidades: Object.fromEntries(NECESIDADES.map((id) => [id, fraccion(necesidades[id])])) as Record<NecesidadId, number>,
      corazones: entero(valor.corazones, 0, CORAZONES_MEJOR_AMIGO),
      corazonesHoy: entero(valor.corazonesHoy, 0, CORAZONES_AL_DIA),
      dia: esDia(valor.dia) ? valor.dia : fecha.slice(0, 10),
      lanzamientos: entero(valor.lanzamientos, 0, LANZAMIENTOS_PARA_JUGAR - 1),
    };
  }
  const esGatito = (mundo: number) => Boolean(gatitos[mundo]);
  const huellas = (Array.isArray(raw.huellas) ? raw.huellas : [])
    .filter((huella): huella is Record<string, unknown> => esRegistro(huella) && Boolean(gatitos[String(huella.mundo)]) && Number.isFinite(Number(huella.x)))
    .slice(0, MAX_HUELLAS)
    .map((huella) => ({ x: Math.max(0, Math.min(ANCHO_CASA, Math.round(Number(huella.x)))), mundo: Number(huella.mundo) }));
  const presentados = [...new Set((Array.isArray(raw.presentados) ? raw.presentados : []).map(Number).filter(esGatito))].sort(porMundo);
  const decoracion = raw.decoracion === undefined ? undefined : normalizeDecoracion(raw.decoracion);
  const enCasa = Array.isArray(raw.enCasa)
    ? [...new Set(raw.enCasa.map(Number).filter(esGatito))].sort(porMundo).slice(0, MAX_EN_CASA)
    : undefined;
  const dormir = esRegistro(raw.dormir) && esDia(raw.dormir.noche)
    ? { noche: raw.dormir.noche, arropados: [...new Set((Array.isArray(raw.dormir.arropados) ? raw.dormir.arropados : []).map(Number).filter(esGatito))].sort(porMundo) }
    : undefined;
  const fotos = normalizeFotos(raw.fotos);
  const ropa = normalizeRopaCasa(raw.ropa, esGatito);
  const favoritas = normalizeFavoritas(raw.favoritas, esGatito);
  const enJardin = normalizeEnJardin(raw.enJardin, esGatito);
  const jardin = normalizeJardin(raw.jardin);
  const visitante = normalizeVisitante(raw.visitante);
  return {
    gatitos, huellas, calculadoEn: fecha, presentados,
    ...(decoracion && !esDeSiempre(decoracion) ? { decoracion } : {}), ...(enCasa ? { enCasa } : {}), ...(dormir ? { dormir } : {}),
    ...(fotos.length ? { fotos } : {}),
    ...(ropa ? { ropa } : {}), ...(favoritas ? { favoritas } : {}), ...(enJardin ? { enJardin } : {}), ...(jardin ? { jardin } : {}),
    ...(visitante ? { visitante } : {}),
  };
}
