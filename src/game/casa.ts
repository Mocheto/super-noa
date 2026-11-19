/**
 * Motor de la casa de los gatitos (decisión «Cómo es por dentro un gatito de la casa»). Solo lógica: sin interfaz,
 * sin arte y sin leer el reloj por su cuenta, para poder probarla con cualquier hora.
 *
 * Cada gatito de la casa tiene cuatro necesidades que suben con el tiempo despierto (de las 8 h a las 21 h, hora del
 * dispositivo) hasta llegar a «pide», y se quedan ahí sin empeorar. Atender una necesidad que se notaba o pedía da un
 * corazón de amistad (dos al día como mucho); cuidar lo que no hace falta nunca es un error, solo «ahora no».
 */

import { DECORACION_DE_SIEMPRE, esDeSiempre, normalizeDecoracion, type Decoracion } from "./casaDecoracion.ts";
import { normalizeFotos, type FotoCasa } from "./casaFoto.ts";
import { normalizeRopaCasa, type Ropa } from "./casaRopa.ts";

export type NecesidadId = "comer" | "mimos" | "bano" | "jugar";
export type EstadoNecesidad = "bien" | "seNota" | "pide";
export type Cuidado = "comer" | "frotar" | "esponja" | "pelota";

/** Orden de urgencia: si pide varias cosas, el bocadillo enseña la primera. */
export const NECESIDADES: readonly NecesidadId[] = ["comer", "mimos", "bano", "jugar"];
/** Horas despierto hasta que una necesidad pasa de «bien» a «pide». «Se nota» llega a la mitad. */
export const HORAS_HASTA_PIDE: Readonly<Record<NecesidadId, number>> = { comer: 6, mimos: 8, jugar: 10, bano: 12 };
export const SE_NOTA_DESDE = 0.5;
export const CORAZONES_MEJOR_AMIGO = 5;
export const CORAZONES_AL_DIA = 2;
export const LANZAMIENTOS_PARA_JUGAR = 3;
export const MAX_HUELLAS = 6;
/** Tope del tiempo que se cuenta entre dos cálculos: tras una semana sin entrar, cuenta como dos días. */
export const TOPE_HORAS = 48;
export const NOCHE_DESDE = 21;
export const NOCHE_HASTA = 8;
/** Ancho de la habitación, en el que se colocan las huellas. */
export const ANCHO_CASA = 960;

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
};

/** Como mucho, estos gatitos en casa a la vez (mapa «Más gatitos en la casa»); los demás están de paseo. */
export const MAX_EN_CASA = 5;

const porMundo = (a: number, b: number) => a - b;

/** Gatitos en casa, por orden de mundo: los elegidos o, si nunca se eligió, los primeros cinco. */
export function enCasaDe(casa: CasaProgress): number[] {
  const todos = Object.keys(casa.gatitos).map(Number).sort(porMundo);
  if (!casa.enCasa) return todos.slice(0, MAX_EN_CASA);
  return casa.enCasa.filter((mundo) => casa.gatitos[mundo]).sort(porMundo).slice(0, MAX_EN_CASA);
}

/** Gatitos de paseo, por orden de mundo. */
export const dePaseoDe = (casa: CasaProgress): number[] => {
  const dentro = enCasaDe(casa);
  return Object.keys(casa.gatitos).map(Number).filter((mundo) => !dentro.includes(mundo)).sort(porMundo);
};

export const estaEnCasa = (casa: CasaProgress, mundo: number) => enCasaDe(casa).includes(mundo);

/** Manda de paseo a un gatito que estaba en casa. */
export const mandarDePaseo = (casa: CasaProgress, mundo: number): CasaProgress =>
  estaEnCasa(casa, mundo) ? { ...casa, enCasa: enCasaDe(casa).filter((otro) => otro !== mundo) } : casa;

/** Trae a casa a un gatito de paseo, si hay sitio; si la casa está llena, todo se queda igual. */
export function traerACasa(casa: CasaProgress, mundo: number): CasaProgress {
  const dentro = enCasaDe(casa);
  if (!casa.gatitos[mundo] || dentro.includes(mundo) || dentro.length >= MAX_EN_CASA) return casa;
  return { ...casa, enCasa: [...dentro, mundo].sort(porMundo) };
}

const HORA_MS = 3_600_000;

export const fechaLocal = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

export const esDeNoche = (fecha: Date) => fecha.getHours() >= NOCHE_DESDE || fecha.getHours() < NOCHE_HASTA;

export const casaVacia = (ahora: Date): CasaProgress => ({ gatitos: {}, huellas: [], calculadoEn: ahora.toISOString(), presentados: [] });

export const gatitoNuevo = (ahora: Date): GatitoCasa => ({
  necesidades: { comer: 0, mimos: 0, bano: 0, jugar: 0 }, corazones: 0, corazonesHoy: 0, dia: fechaLocal(ahora), lanzamientos: 0,
});

export const estadoDe = (valor: number): EstadoNecesidad => valor >= 1 ? "pide" : valor >= SE_NOTA_DESDE ? "seNota" : "bien";

/** Siguiente cambio entre el día y la noche después de `fecha` (las 8 h o las 21 h). */
function siguienteCambio(fecha: Date): Date {
  const cambio = new Date(fecha);
  cambio.setMinutes(0, 0, 0);
  const hora = fecha.getHours();
  if (hora < NOCHE_HASTA) cambio.setHours(NOCHE_HASTA);
  else if (hora < NOCHE_DESDE) cambio.setHours(NOCHE_DESDE);
  else { cambio.setDate(cambio.getDate() + 1); cambio.setHours(NOCHE_HASTA); }
  return cambio;
}

/** Horas despierto (fuera de la noche) entre dos momentos. */
export function horasDespierto(desde: Date, hasta: Date): number {
  let total = 0;
  let cursor = new Date(desde);
  while (cursor < hasta) {
    const cambio = siguienteCambio(cursor);
    const fin = cambio < hasta ? cambio : hasta;
    if (!esDeNoche(cursor)) total += (fin.getTime() - cursor.getTime()) / HORA_MS;
    cursor = fin;
  }
  return total;
}

/**
 * Hace pasar el tiempo hasta `ahora`: suben las necesidades con las horas despierto, con un tope de 48 h; si la hora
 * del dispositivo va hacia atrás, no pasa nada. También empieza el día nuevo de corazones.
 */
export function avanzar(casa: CasaProgress, ahora: Date): CasaProgress {
  const antes = Date.parse(casa.calculadoEn);
  const transcurrido = Number.isFinite(antes) ? Math.min(TOPE_HORAS * HORA_MS, Math.max(0, ahora.getTime() - antes)) : 0;
  const horas = transcurrido > 0 ? horasDespierto(new Date(ahora.getTime() - transcurrido), ahora) : 0;
  const hoy = fechaLocal(ahora);
  // De paseo, las necesidades se quedan como estaban.
  const dentro = enCasaDe(casa);
  const gatitos = Object.fromEntries(Object.entries(casa.gatitos).map(([mundo, gatito]) => [mundo, {
    ...gatito,
    necesidades: dentro.includes(Number(mundo))
      ? Object.fromEntries(NECESIDADES.map((id) => [id, Math.min(1, gatito.necesidades[id] + horas / HORAS_HASTA_PIDE[id])])) as Record<NecesidadId, number>
      : gatito.necesidades,
    ...(gatito.dia === hoy ? {} : { dia: hoy, corazonesHoy: 0 }),
  }]));
  // Si el reloj va hacia atrás, el cálculo se queda donde estaba para no regalar horas al volver a la hora buena.
  const calculadoEn = Number.isFinite(antes) && ahora.getTime() < antes ? casa.calculadoEn : ahora.toISOString();
  return { ...casa, gatitos, calculadoEn };
}

/** Gatitos que están en la casa pero cuya llegada aún no se ha visto, en orden de mundo. */
export const llegadasPendientes = (casa: CasaProgress): number[] =>
  Object.keys(casa.gatitos).map(Number).filter((mundo) => !casa.presentados.includes(mundo)).sort((a, b) => a - b);

/** Recién llegados que no cupieron en casa y se han quedado de paseo: tras su «¡HOLA!», Noa elige quién está en casa. */
export const llegadasDePaseo = (casa: CasaProgress, llegan: readonly number[]): number[] =>
  llegan.filter((mundo) => casa.gatitos[mundo] && !estaEnCasa(casa, mundo));

/** Tras ver la llegada, esos gatitos quedan presentados. */
export const presentar = (casa: CasaProgress, mundos: readonly number[]): CasaProgress =>
  ({ ...casa, presentados: [...new Set([...casa.presentados, ...mundos])].sort((a, b) => a - b) });

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

export const estadosDe = (gatito: GatitoCasa) =>
  Object.fromEntries(NECESIDADES.map((id) => [id, estadoDe(gatito.necesidades[id])])) as Record<NecesidadId, EstadoNecesidad>;

/** Lo que enseña el bocadillo: la necesidad más urgente que pide, o nada. */
export const bocadilloDe = (gatito: GatitoCasa): NecesidadId | null => NECESIDADES.find((id) => estadoDe(gatito.necesidades[id]) === "pide") ?? null;

/** Necesidades que se notan (pista en el dibujo, sin lloro). */
export const pistasDe = (gatito: GatitoCasa): NecesidadId[] => NECESIDADES.filter((id) => estadoDe(gatito.necesidades[id]) === "seNota");

export const esMejorAmigo = (gatito: GatitoCasa) => gatito.corazones >= CORAZONES_MEJOR_AMIGO;

const necesidadDe: Record<Cuidado, NecesidadId> = { comer: "comer", frotar: "mimos", esponja: "bano", pelota: "jugar" };

/**
 * Cómo responde el gatito a un cuidado:
 * - `gracias`: atendió una necesidad que se notaba o pedía;
 * - `ronronea`: lo frotaste sin que le hicieran falta mimos (siempre le gusta);
 * - `ahoraNo`: el cuenco o la esponja cuando no hace falta (lo huele y gira la cabeza, o se sacude y se va);
 * - `sigueJugando`: atrapó la pelota y aún quiere más;
 * - `juegaIgual`: atrapó la pelota sin tener ganas de jugar.
 */
export type RespuestaCuidado = "gracias" | "ronronea" | "ahoraNo" | "sigueJugando" | "juegaIgual";
export type ResultadoCuidado = { casa: CasaProgress; respuesta: RespuestaCuidado; corazon: boolean };

/** Noa cuida al gatito del mundo dado. En la pelota cuenta un lanzamiento atrapado. */
export function cuidar(casa: CasaProgress, mundo: number, cuidado: Cuidado, ahora: Date): ResultadoCuidado {
  const actual = casa.gatitos[mundo];
  if (!actual) return { casa, respuesta: "ahoraNo", corazon: false };
  const hoy = fechaLocal(ahora);
  const gatito: GatitoCasa = actual.dia === hoy ? { ...actual } : { ...actual, dia: hoy, corazonesHoy: 0 };
  const necesidad = necesidadDe[cuidado];
  const haciaFalta = estadoDe(gatito.necesidades[necesidad]) !== "bien";
  const guardar = (respuesta: RespuestaCuidado, corazon: boolean): ResultadoCuidado =>
    ({ casa: { ...casa, gatitos: { ...casa.gatitos, [mundo]: gatito } }, respuesta, corazon });

  if (!haciaFalta) {
    if (cuidado === "pelota") return guardar("juegaIgual", false);
    return guardar(cuidado === "frotar" ? "ronronea" : "ahoraNo", false);
  }
  if (cuidado === "pelota" && gatito.lanzamientos + 1 < LANZAMIENTOS_PARA_JUGAR) {
    gatito.lanzamientos += 1;
    return guardar("sigueJugando", false);
  }
  gatito.necesidades = { ...gatito.necesidades, [necesidad]: 0 };
  if (cuidado === "pelota") gatito.lanzamientos = 0;
  const corazon = gatito.corazones < CORAZONES_MEJOR_AMIGO && gatito.corazonesHoy < CORAZONES_AL_DIA;
  if (corazon) { gatito.corazones += 1; gatito.corazonesHoy += 1; }
  return guardar("gracias", corazon);
}

/** Un gatito con el baño en «se nota» o «pide» deja una huella al andar, hasta seis en la casa. */
export function dejarHuella(casa: CasaProgress, mundo: number, x: number): CasaProgress {
  const gatito = casa.gatitos[mundo];
  if (!gatito || !estaEnCasa(casa, mundo) || estadoDe(gatito.necesidades.bano) === "bien" || casa.huellas.length >= MAX_HUELLAS) return casa;
  return { ...casa, huellas: [...casa.huellas, { x: Math.max(0, Math.min(ANCHO_CASA, Math.round(x))), mundo }] };
}

/** La escoba barre una huella. Barrer no da corazón. */
export const barrer = (casa: CasaProgress, indice: number): CasaProgress =>
  indice < 0 || indice >= casa.huellas.length ? casa : { ...casa, huellas: casa.huellas.filter((_, i) => i !== indice) };

export const casaLimpia = (casa: CasaProgress) => casa.huellas.length === 0;

export type EstadoVida = "andar" | "sentarse" | "dormir" | "jugarSolo" | "cantar" | "pedir";
export type EleccionVida = { estado: EstadoVida; segundos: number };

const PESOS: ReadonlyArray<[Exclude<EstadoVida, "pedir">, number]> = [["andar", 3], ["sentarse", 3], ["dormir", 2], ["jugarSolo", 2], ["cantar", 1]];
const PESO_CANTAR_CONTENTO = 3;

/**
 * Vida propia: cada 4–10 s el gatito elige qué hacer. Si algo pide, lloriquea; de noche, duerme. Con la casa limpia y
 * nadie pidiendo, canta más. `azar` devuelve números en [0, 1).
 */
export function elegirVida(gatito: GatitoCasa, contexto: { noche: boolean; casaLimpia: boolean; alguienPide: boolean }, azar: () => number): EleccionVida {
  const segundos = 4 + Math.floor(azar() * 7);
  if (bocadilloDe(gatito)) return { estado: "pedir", segundos };
  if (contexto.noche) return { estado: "dormir", segundos };
  const contento = contexto.casaLimpia && !contexto.alguienPide;
  const pesos = PESOS.map(([estado, peso]): [EstadoVida, number] => [estado, estado === "cantar" && contento ? PESO_CANTAR_CONTENTO : peso]);
  const total = pesos.reduce((suma, [, peso]) => suma + peso, 0);
  let tirada = azar() * total;
  for (const [estado, peso] of pesos) {
    if (tirada < peso) return { estado, segundos };
    tirada -= peso;
  }
  return { estado: "sentarse", segundos };
}

/** Al entrar Noa, el mejor amigo canta para saludarla. */
export const saludoAlEntrar = (gatito: GatitoCasa): EstadoVida | null => esMejorAmigo(gatito) ? "cantar" : null;

const esRegistro = (valor: unknown): valor is Record<string, unknown> => Boolean(valor) && typeof valor === "object" && !Array.isArray(valor);
const entero = (valor: unknown, minimo: number, maximo: number) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.max(minimo, Math.min(maximo, Math.floor(numero))) : minimo;
};
const fraccion = (valor: unknown) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.max(0, Math.min(1, numero)) : 0;
};

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
      dia: typeof valor.dia === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor.dia) ? valor.dia : fecha.slice(0, 10),
      lanzamientos: entero(valor.lanzamientos, 0, LANZAMIENTOS_PARA_JUGAR - 1),
    };
  }
  const huellas = (Array.isArray(raw.huellas) ? raw.huellas : [])
    .filter((huella): huella is Record<string, unknown> => esRegistro(huella) && Boolean(gatitos[String(huella.mundo)]) && Number.isFinite(Number(huella.x)))
    .slice(0, MAX_HUELLAS)
    .map((huella) => ({ x: Math.max(0, Math.min(ANCHO_CASA, Math.round(Number(huella.x)))), mundo: Number(huella.mundo) }));
  const presentados = [...new Set((Array.isArray(raw.presentados) ? raw.presentados : []).map(Number).filter((mundo) => Boolean(gatitos[mundo])))].sort((a, b) => a - b);
  const decoracion = raw.decoracion === undefined ? undefined : normalizeDecoracion(raw.decoracion);
  const enCasa = Array.isArray(raw.enCasa)
    ? [...new Set(raw.enCasa.map(Number).filter((mundo) => Boolean(gatitos[mundo])))].sort(porMundo).slice(0, MAX_EN_CASA)
    : undefined;
  const dormir = esRegistro(raw.dormir) && typeof raw.dormir.noche === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.dormir.noche)
    ? { noche: raw.dormir.noche, arropados: [...new Set((Array.isArray(raw.dormir.arropados) ? raw.dormir.arropados : []).map(Number).filter((mundo) => Boolean(gatitos[mundo])))].sort(porMundo) }
    : undefined;
  const ropa = normalizeRopaCasa(raw.ropa, (mundo) => Boolean(gatitos[mundo]));
  return {
    gatitos, huellas, calculadoEn: fecha, presentados,
    ...(decoracion && !esDeSiempre(decoracion) ? { decoracion } : {}), ...(enCasa ? { enCasa } : {}), ...(dormir ? { dormir } : {}),
    ...(normalizeFotos(raw.fotos).length ? { fotos: normalizeFotos(raw.fotos) } : {}),
    ...(ropa ? { ropa } : {}),
  };
}

/** La decoración de la casa: la guardada o, si no hay, la de siempre. */
export const decoracionDe = (casa: CasaProgress | undefined): Decoracion => casa?.decoracion ?? DECORACION_DE_SIEMPRE;
