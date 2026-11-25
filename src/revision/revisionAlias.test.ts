import assert from "node:assert/strict";
import test from "node:test";
import { accionesDe, CLAVE_ALMACEN, clienteRevision, ErrorRevision, guardarClave, leerClave, type FalloRevision } from "./revisionAlias.ts";

const SERVIDOR = "https://tablon.example";
const CLAVE = "clave-de-prueba-muy-larga";
const fila = { id: "6f0c8f3e-2b1a-4c3d-9e8f-0a1b2c3d4e5f", alias: "Noa", approvedAlias: null, aliasStatus: "pending", submittedAt: "2026-11-24T10:00:00.000Z", publicAlias: "Koala 65" };

type Llamada = { url: string; init: RequestInit };
function servidorFalso(responder: (llamada: Llamada) => Response) {
  const llamadas: Llamada[] = [];
  const pedir = async (url: string, init: RequestInit) => {
    const llamada = { url, init };
    llamadas.push(llamada);
    return responder(llamada);
  };
  return { llamadas, pedir };
}
const json = (cuerpo: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(cuerpo), { status, headers });

async function falloDe(promesa: Promise<unknown>): Promise<FalloRevision> {
  try { await promesa; } catch (error) {
    assert.ok(error instanceof ErrorRevision);
    return error.fallo;
  }
  throw new Error("Debía fallar");
}

test("listar pide el estado con la clave en la cabecera, nunca en la dirección, y descarta filas raras", async () => {
  const { llamadas, pedir } = servidorFalso(() => json({ aliases: [fila, { id: 3 }] }));
  const lista = await clienteRevision(SERVIDOR, CLAVE, pedir).listar("pending");
  assert.deepEqual(lista, [fila]);
  assert.equal(llamadas[0].url, `${SERVIDOR}/v1/admin/aliases?status=pending`);
  assert.ok(!llamadas[0].url.includes(CLAVE));
  assert.equal((llamadas[0].init.headers as Record<string, string>).Authorization, `Bearer ${CLAVE}`);
});

test("aprobar, rechazar, ocultar y aprobar todos van a su ruta y devuelven cuántos cambian", async () => {
  const { llamadas, pedir } = servidorFalso(() => json({ updated: 2 }));
  const cliente = clienteRevision(SERVIDOR, CLAVE, pedir);
  assert.equal(await cliente.actuar("approve", [fila.id]), 2);
  await cliente.actuar("reject", [fila.id]);
  await cliente.actuar("hide", [fila.id]);
  assert.equal(await cliente.aprobarTodos(), 2);
  assert.deepEqual(llamadas.map((l) => l.url.slice(SERVIDOR.length)), ["/v1/admin/aliases/approve", "/v1/admin/aliases/reject", "/v1/admin/aliases/hide", "/v1/admin/aliases/approve-all"]);
  assert.ok(llamadas.every((l) => l.init.method === "POST"));
  assert.deepEqual(JSON.parse(String(llamadas[0].init.body)), { ids: [fila.id] });
});

test("cada fallo se distingue: clave mala, revisión apagada, espera, sin conexión y otro error", async () => {
  const con = (respuesta: () => Response) => clienteRevision(SERVIDOR, CLAVE, servidorFalso(respuesta).pedir).listar("pending");
  assert.deepEqual(await falloDe(con(() => json({ code: "admin_invalid" }, 401))), { tipo: "clave" });
  assert.deepEqual(await falloDe(con(() => json({}, 404))), { tipo: "sinRevision" });
  assert.deepEqual(await falloDe(con(() => json({}, 429, { "Retry-After": "17" }))), { tipo: "espera", segundos: 17 });
  assert.deepEqual(await falloDe(con(() => json({}, 429))), { tipo: "espera", segundos: 60 });
  assert.deepEqual(await falloDe(con(() => json({}, 503))), { tipo: "fallo", estado: 503 });
  assert.deepEqual(await falloDe(con(() => new Response("no es json"))), { tipo: "fallo", estado: 200 });
  const sinRed = clienteRevision(SERVIDOR, CLAVE, async () => { throw new TypeError("Failed to fetch"); });
  assert.deepEqual(await falloDe(sinRed.listar("approved")), { tipo: "conexion" });
});

test("la clave se guarda recortada, se borra vacía y no rompe sin almacenamiento", () => {
  const datos = new Map<string, string>();
  const almacen = { getItem: (k: string) => datos.get(k) ?? null, setItem: (k: string, v: string) => void datos.set(k, v), removeItem: (k: string) => void datos.delete(k) };
  assert.equal(guardarClave(almacen, `  ${CLAVE}\n`), CLAVE);
  assert.equal(datos.get(CLAVE_ALMACEN), CLAVE);
  assert.equal(leerClave(almacen), CLAVE);
  assert.equal(guardarClave(almacen, ""), null);
  assert.equal(leerClave(almacen), null);
  const roto = { getItem: () => { throw new Error("bloqueado"); }, setItem: () => { throw new Error("bloqueado"); }, removeItem: () => { throw new Error("bloqueado"); } };
  assert.equal(leerClave(roto), null);
  assert.equal(guardarClave(roto, CLAVE), CLAVE);
  assert.equal(leerClave(null), null);
});

test("rechazar solo se ofrece para un pendiente", () => {
  assert.deepEqual(Object.entries(accionesDe).filter(([, acciones]) => acciones.includes("reject")).map(([estado]) => estado), ["pending"]);
});
