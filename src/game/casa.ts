/**
 * Motor de la casa de los gatitos (decisión «Cómo es por dentro un gatito de la casa»). Solo lógica: sin interfaz,
 * sin arte y sin leer el reloj por su cuenta, para poder probarla con cualquier hora.
 *
 * Cada gatito de la casa tiene cuatro necesidades que suben con el tiempo despierto (de las 8 h a las 21 h, hora del
 * dispositivo) hasta llegar a «pide», y se quedan ahí sin empeorar. Atender una necesidad que se notaba o pedía da un
 * corazón de amistad (dos al día como mucho); cuidar lo que no hace falta nunca es un error, solo «ahora no».
 */

import {
  ANCHO_CASA, asegurarGatitos, casaVacia, CORAZONES_AL_DIA, CORAZONES_MEJOR_AMIGO, DECORACION_DE_SIEMPRE, enCasaDe, fechaLocal,
  gatitoNuevo, LANZAMIENTOS_PARA_JUGAR, llegadasPendientes, MAX_EN_CASA, MAX_HUELLAS, NECESIDADES, normalizeCasa,
  type CasaProgress, type Decoracion, type GatitoCasa, type HuellaDeBarro, type NecesidadId,
} from "./casaProgreso.ts";
import { gatitosRescatados } from "./casaRescate.ts";

// El progreso de la casa (tipos y lectura) vive en `casaProgreso.ts`, fuera del bloque de la casa.
export {
  ANCHO_CASA, asegurarGatitos, casaVacia, CORAZONES_AL_DIA, CORAZONES_MEJOR_AMIGO, enCasaDe, fechaLocal, gatitoNuevo,
  LANZAMIENTOS_PARA_JUGAR, llegadasPendientes, MAX_EN_CASA, MAX_HUELLAS, NECESIDADES, normalizeCasa,
};
export type { CasaProgress, GatitoCasa, HuellaDeBarro, NecesidadId };

export type EstadoNecesidad = "bien" | "seNota" | "pide";
export type Cuidado = "comer" | "frotar" | "esponja" | "pelota";

/** Horas despierto hasta que una necesidad pasa de «bien» a «pide». «Se nota» llega a la mitad. */
export const HORAS_HASTA_PIDE: Readonly<Record<NecesidadId, number>> = { comer: 6, mimos: 8, jugar: 10, bano: 12 };
export const SE_NOTA_DESDE = 0.5;
/** Tope del tiempo que se cuenta entre dos cálculos: tras una semana sin entrar, cuenta como dos días. */
export const TOPE_HORAS = 48;
export const NOCHE_DESDE = 21;
export const NOCHE_HASTA = 8;

const porMundo = (a: number, b: number) => a - b;

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
  // Vuelve de paseo por la puerta: entra en la habitación.
  const enJardin = casa.enJardin?.filter((otro) => otro !== mundo);
  const resto = { ...casa };
  delete resto.enJardin;
  return { ...resto, ...(enJardin?.length ? { enJardin } : {}), enCasa: [...dentro, mundo].sort(porMundo) };
}

const HORA_MS = 3_600_000;

export const esDeNoche = (fecha: Date) => fecha.getHours() >= NOCHE_DESDE || fecha.getHours() < NOCHE_HASTA;

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

/** Recién llegados que no cupieron en casa y se han quedado de paseo: tras su «¡HOLA!», Noa elige quién está en casa. */
export const llegadasDePaseo = (casa: CasaProgress, llegan: readonly number[]): number[] =>
  llegan.filter((mundo) => casa.gatitos[mundo] && !estaEnCasa(casa, mundo));

/** Tras ver la llegada, esos gatitos quedan presentados. */
export const presentar = (casa: CasaProgress, mundos: readonly number[]): CasaProgress =>
  ({ ...casa, presentados: [...new Set([...casa.presentados, ...mundos])].sort((a, b) => a - b) });

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

/** La decoración de la casa: la guardada o, si no hay, la de siempre. */
export const decoracionDe = (casa: CasaProgress | undefined): Decoracion => casa?.decoracion ?? DECORACION_DE_SIEMPRE;

/** Pone la casa al día: hace pasar el tiempo y mete a los gatitos rescatados que aún no estaban. */
export const prepararCasa = (casa: CasaProgress | undefined, levelStats: Parameters<typeof gatitosRescatados>[0], ahora: Date): CasaProgress =>
  asegurarGatitos(avanzar(casa ?? casaVacia(ahora), ahora), gatitosRescatados(levelStats), ahora);
