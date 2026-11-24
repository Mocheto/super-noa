import "./todo.ts";
import { hojas, type Plural } from "./index.ts";

const categorias = ["zero", "one", "two", "few", "many", "other"] as const;

/** Convierte una hoja del catálogo a un mensaje ICU: las cadenas quedan igual y los plurales pasan a `{n, plural, one {…} other {…}}`. */
export function aIcu(hoja: string | Plural): string {
  if (typeof hoja === "string") return hoja;
  const formas = categorias.filter((categoria) => typeof hoja[categoria] === "string").map((categoria) => `${categoria} {${hoja[categoria]}}`);
  return `{n, plural, ${formas.join(" ")}}`;
}

/** Todo el catálogo activo como un objeto plano `clave → mensaje`, listo para herramientas de traducción. */
export function exportarJson(): Record<string, string> {
  return Object.fromEntries(hojas().map(([clave, hoja]) => [clave, aIcu(hoja)]));
}
