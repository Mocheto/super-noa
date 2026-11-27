/**
 * Los regalos de la casa (mapa «Ganar decoraciones de la casa», issue 461): las versiones de lo que se decora se ganan
 * una a una. Al terminar una pantalla llega un regalo, como mucho uno al día y nunca con otro sin abrir; al abrirlo
 * sale al azar una versión que faltaba. Solo datos y reglas: va en el bloque principal, con el progreso.
 */
import { fechaLocal, MUEBLES, VERSIONES, type Decoracion, type MuebleId, type Version } from "./casaProgreso.ts";

/** Campo opcional `regalos` del progreso. Los dos contadores solo suben: así dos pestañas se fusionan sin repetir. */
export type RegalosProgress = {
  /** Versiones ganadas, como `cama:2`. La 0, la de siempre, se tiene sin apuntarla. */
  ganados: string[];
  recibidos: number;
  abiertos: number;
  /** Día local (AAAA-MM-DD) del último regalo recibido. */
  dia?: string;
};

export type Premio = { mueble: MuebleId; version: Version };

const clave = ({ mueble, version }: Premio) => `${mueble}:${version}`;
/** Todo lo que se puede ganar. */
export const PREMIOS: readonly Premio[] = MUEBLES.flatMap((mueble) => VERSIONES.filter((version) => version > 0).map((version) => ({ mueble, version })));
const CLAVES = new Set(PREMIOS.map(clave));

/**
 * Los regalos de quien juega. Si aún no hay nada guardado, tiene lo que lleve puesto en la casa; hay que guardarlo antes
 * de dejarle cambiar de versión, o perdería la que quite.
 */
export function regalosDe(regalos: RegalosProgress | undefined, decoracion: Decoracion): RegalosProgress {
  return regalos ?? { ganados: PREMIOS.filter((premio) => decoracion[premio.mueble] === premio.version).map(clave), recibidos: 0, abiertos: 0 };
}

export const tieneVersion = (regalos: RegalosProgress, mueble: MuebleId, version: Version) =>
  version === 0 || regalos.ganados.includes(clave({ mueble, version }));

export const porGanar = (regalos: RegalosProgress): Premio[] => PREMIOS.filter((premio) => !regalos.ganados.includes(clave(premio)));

export const regaloEsperando = (regalos: RegalosProgress | undefined) => Boolean(regalos && regalos.recibidos > regalos.abiertos);

/** Tras terminar una pantalla con la casa abierta. Si no toca regalo, devuelve lo mismo que recibe. */
export function ganarRegalo(regalos: RegalosProgress | undefined, decoracion: Decoracion, ahora: Date): RegalosProgress | undefined {
  const actuales = regalosDe(regalos, decoracion);
  const hoy = fechaLocal(ahora);
  if (regaloEsperando(actuales) || actuales.dia === hoy || !porGanar(actuales).length) return regalos;
  return { ...actuales, recibidos: actuales.recibidos + 1, dia: hoy };
}

/** Abre el regalo que espera; `azar` va de 0 a 1. Sin regalo, `null`. */
export function abrirRegalo(regalos: RegalosProgress, azar: number): { regalos: RegalosProgress; premio: Premio } | null {
  const faltan = porGanar(regalos);
  if (!regaloEsperando(regalos) || !faltan.length) return null;
  const premio = faltan[Math.max(0, Math.min(faltan.length - 1, Math.floor(azar * faltan.length)))];
  return { premio, regalos: { ...regalos, ganados: [...regalos.ganados, clave(premio)], abiertos: regalos.abiertos + 1 } };
}

const contador = (valor: unknown) => (typeof valor === "number" && Number.isSafeInteger(valor) && valor > 0 ? valor : 0);

/** Lectura tolerante: lo que no se entiende se descarta; si el campo no es un registro, `undefined`. */
export function normalizeRegalos(raw: unknown): RegalosProgress | undefined {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return undefined;
  const datos = raw as Record<string, unknown>;
  const ganados = [...new Set((Array.isArray(datos.ganados) ? datos.ganados : []).filter((valor): valor is string => typeof valor === "string" && CLAVES.has(valor)))];
  const recibidos = contador(datos.recibidos);
  const dia = typeof datos.dia === "string" && /^\d{4}-\d{2}-\d{2}$/.test(datos.dia) ? datos.dia : undefined;
  return { ganados, recibidos, abiertos: Math.min(recibidos, contador(datos.abiertos)), ...(dia ? { dia } : {}) };
}
