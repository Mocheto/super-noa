/**
 * Lo que hace la página de revisión de alias sin React: hablar con las rutas `/v1/admin/aliases` del servidor del tablón y
 * guardar la clave en este navegador. La clave viaja solo en la cabecera `Authorization`, nunca en la dirección.
 */

export const estadosAlias = ["pending", "approved", "rejected", "hidden"] as const;
export type EstadoAlias = (typeof estadosAlias)[number];
export type AccionAlias = "approve" | "reject" | "hide";

export type AliasEnRevision = {
  id: string;
  alias: string;
  approvedAlias: string | null;
  aliasStatus: EstadoAlias;
  submittedAt: string | null;
  publicAlias: string;
};

/** Qué ha ido mal, para elegir el mensaje: clave mala, revisión apagada en el servidor, espera, sin conexión u otro fallo. */
export type FalloRevision =
  | { tipo: "clave" }
  | { tipo: "sinRevision" }
  | { tipo: "espera"; segundos: number }
  | { tipo: "conexion" }
  | { tipo: "fallo"; estado: number };

export class ErrorRevision extends Error {
  readonly fallo: FalloRevision;
  constructor(fallo: FalloRevision) {
    super(fallo.tipo);
    this.name = "ErrorRevision";
    this.fallo = fallo;
  }
}

/** Qué botones tiene cada ficha según su estado. Rechazar solo vale para un pendiente (como en el servidor). */
export const accionesDe: Record<EstadoAlias, readonly AccionAlias[]> = {
  pending: ["approve", "reject"],
  approved: ["hide"],
  rejected: ["approve"],
  hidden: ["approve"],
};

export const CLAVE_ALMACEN = "super-noa-revision-alias-clave";

type Almacen = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type Pedir = (url: string, init: RequestInit) => Promise<Response>;

export function leerClave(almacen: Almacen | null): string | null {
  try { return almacen?.getItem(CLAVE_ALMACEN) || null; } catch { return null; }
}

/** Guarda la clave (sin espacios alrededor) o la borra si queda vacía. Devuelve la que queda guardada. */
export function guardarClave(almacen: Almacen | null, clave: string | null): string | null {
  const limpia = clave?.trim() || null;
  try {
    if (limpia) almacen?.setItem(CLAVE_ALMACEN, limpia);
    else almacen?.removeItem(CLAVE_ALMACEN);
  } catch { /* Sin almacenamiento, la clave vale mientras la página esté abierta. */ }
  return limpia;
}

function segundosDeEspera(cabecera: string | null): number {
  const segundos = cabecera !== null && /^\s*\d+\s*$/.test(cabecera) ? Number(cabecera) : 60;
  return Math.max(1, segundos);
}

function esAlias(valor: unknown): valor is AliasEnRevision {
  if (!valor || typeof valor !== "object") return false;
  const fila = valor as Record<string, unknown>;
  return typeof fila.id === "string" && typeof fila.alias === "string" && typeof fila.publicAlias === "string"
    && estadosAlias.includes(fila.aliasStatus as EstadoAlias)
    && (fila.approvedAlias === null || typeof fila.approvedAlias === "string")
    && (fila.submittedAt === null || typeof fila.submittedAt === "string");
}

/** Cliente de la revisión para un servidor y una clave. `pedir` es `fetch` (en las pruebas, uno falso). */
export function clienteRevision(servidor: string, clave: string, pedir: Pedir = (url, init) => fetch(url, init)) {
  async function llamar(ruta: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
    let respuesta: Response;
    try {
      respuesta = await pedir(`${servidor}${ruta}`, {
        ...init,
        headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), Authorization: `Bearer ${clave}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new ErrorRevision({ tipo: "conexion" });
    }
    if (respuesta.status === 401) throw new ErrorRevision({ tipo: "clave" });
    if (respuesta.status === 404) throw new ErrorRevision({ tipo: "sinRevision" });
    if (respuesta.status === 429) throw new ErrorRevision({ tipo: "espera", segundos: segundosDeEspera(respuesta.headers.get("Retry-After")) });
    if (!respuesta.ok) throw new ErrorRevision({ tipo: "fallo", estado: respuesta.status });
    const cuerpo: unknown = await respuesta.json().catch(() => null);
    if (!cuerpo || typeof cuerpo !== "object") throw new ErrorRevision({ tipo: "fallo", estado: respuesta.status });
    return cuerpo as Record<string, unknown>;
  }

  const actualizados = (cuerpo: Record<string, unknown>) => typeof cuerpo.updated === "number" ? cuerpo.updated : 0;

  return {
    /** Los alias de un estado, del enviado hace más tiempo al más reciente. */
    async listar(estado: EstadoAlias): Promise<AliasEnRevision[]> {
      const cuerpo = await llamar(`/v1/admin/aliases?status=${estado}`);
      return Array.isArray(cuerpo.aliases) ? cuerpo.aliases.filter(esAlias) : [];
    },
    /** Aprueba, rechaza u oculta unas tarjetas. Devuelve cuántas han cambiado. */
    async actuar(accion: AccionAlias, ids: readonly string[]): Promise<number> {
      return actualizados(await llamar(`/v1/admin/aliases/${accion}`, { method: "POST", body: JSON.stringify({ ids }) }));
    },
    async aprobarTodos(): Promise<number> {
      return actualizados(await llamar("/v1/admin/aliases/approve-all", { method: "POST" }));
    },
  };
}
