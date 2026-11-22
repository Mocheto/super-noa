import type { es } from "./es/index.ts";
import { base } from "./es/base.ts";
import { esPictograma, pictogramas, type Pictograma } from "./pictogramas.ts";

/** Plural por categorías de Intl.PluralRules; en español bastan `one` y `other`. */
export type Plural = { readonly zero?: string; readonly one?: string; readonly two?: string; readonly few?: string; readonly many?: string; readonly other: string };
type Hoja = string | Plural;

/** Forma que debe cumplir cualquier idioma: la misma del español, con cadenas en lugar de literales. */
type Forma<T> = { readonly [K in keyof T]: T[K] extends string ? string : T[K] extends Plural ? Plural : Forma<T[K]> };
export type Catalogo = Forma<typeof es>;

type Rutas<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends Hoja ? `${P}${K}` : Rutas<T[K], `${P}${K}.`>;
}[keyof T & string];

/** Clave de texto: ruta tipada hasta una hoja del catálogo. Una clave que no existe no compila. */
export type ClaveTexto = Rutas<typeof es>;
export type Variables = Readonly<Record<string, string | number>>;

type Nodo = { [clave: string]: Nodo | Hoja };
/**
 * Catálogo activo. Empieza con las zonas del bloque principal (`es/base.ts`); las zonas diferidas las añade
 * `registrarZona` cuando se evalúa el bloque de la pantalla que las usa (`src/textos/zonas/<ruta>.ts`).
 */
const actual: Nodo = { ...(base as unknown as Nodo), minijuegos: { ...(base.minijuegos as unknown as Nodo) } };
const reglas = new Intl.PluralRules("es");
const registradas = new Set<string>();

/**
 * Añade al catálogo activo una zona diferida (`duelos`) o una parte de una zona (`minijuegos.abeja`). La llaman solo los
 * módulos de `src/textos/zonas/`, que importa con `import` estático el módulo que usa sus claves: así, la zona queda
 * registrada antes de que se ejecute cualquier código de ese módulo, y `t()` puede seguir siendo síncrono.
 */
export function registrarZona(ruta: string, textos: object) {
  const partes = ruta.split(".");
  let nodo = actual;
  for (const parte of partes.slice(0, -1)) nodo = (nodo[parte] ??= {}) as Nodo;
  nodo[partes[partes.length - 1]] = textos as Nodo;
  registradas.add(ruta);
}

/** Zonas diferidas registradas hasta ahora, para las pruebas. */
export const zonasRegistradas = () => [...registradas];

const avisadas = new Set<string>();
let enSilencio = false;

/** En producción (lo llama `main.tsx`), una clave sin hoja no rompe la pantalla: se ve un hueco y se avisa en la consola. */
export function clavesSinHojaEnSilencio() {
  enSilencio = true;
}

function buscar(clave: string): Hoja | undefined {
  let nodo: unknown = actual;
  for (const parte of clave.split(".")) nodo = (nodo as Record<string, unknown> | undefined)?.[parte];
  if (typeof nodo === "string" || (nodo && typeof nodo === "object" && "other" in nodo)) return nodo as Hoja;
  return undefined;
}

/**
 * Hoja de una clave. Sin hoja, en desarrollo y en las pruebas falla en el acto; en producción devuelve una cadena
 * vacía y lo avisa una vez en la consola: Noa ve un hueco, nunca la clave ni una pantalla rota.
 */
function hojaDe(clave: string): Hoja {
  const hoja = buscar(clave);
  if (hoja !== undefined) return hoja;
  const mensaje = `Clave de texto sin hoja: ${clave} (¿falta importar su zona de src/textos/zonas/?)`;
  if (!enSilencio) throw new Error(mensaje);
  if (!avisadas.has(clave)) { avisadas.add(clave); console.error(mensaje); }
  return "";
}

/** Devuelve el texto con sus variables puestas. Los pictogramas quedan como `{pictograma:nombre}` para que los pinte quien lo muestra. */
export function t(clave: ClaveTexto, variables: Variables = {}): string {
  const hoja = hojaDe(clave);
  const plantilla = typeof hoja === "string" ? hoja : hoja[reglas.select(Number(variables.n ?? 0)) as keyof Plural] ?? hoja.other;
  return plantilla.replace(/\{(\w+)\}/g, (marca, nombre: string) => nombre in variables ? String(variables[nombre]) : marca);
}

export type Parte = { tipo: "texto"; valor: string } | { tipo: "pictograma"; nombre: Pictograma };

/** Parte un texto en trozos de texto y pictogramas, para pintarlos en React o en el lienzo. */
export function partes(texto: string): Parte[] {
  const resultado: Parte[] = [];
  let resto = 0;
  for (const marca of texto.matchAll(/\{pictograma:([\w-]+)\}/g)) {
    const inicio = marca.index ?? 0;
    if (inicio > resto) resultado.push({ tipo: "texto", valor: texto.slice(resto, inicio) });
    const nombre = marca[1];
    if (!esPictograma(nombre)) throw new Error(`Pictograma desconocido: ${nombre}`);
    resultado.push({ tipo: "pictograma", nombre });
    resto = inicio + marca[0].length;
  }
  if (resto < texto.length) resultado.push({ tipo: "texto", valor: texto.slice(resto) });
  return resultado;
}

/** Texto plano para el lienzo: cada pictograma se sustituye por su relleno provisional. */
export function textoLienzo(clave: ClaveTexto, variables?: Variables): string {
  return partes(t(clave, variables)).map((parte) => parte.tipo === "texto" ? parte.valor : pictogramas[parte.nombre]).join("");
}

/** Todas las hojas del catálogo activo con su clave, para las pruebas y la exportación a JSON. */
export function hojas(nodo: unknown = actual, prefijo = ""): Array<[string, Hoja]> {
  if (typeof nodo === "string" || (nodo && typeof nodo === "object" && "other" in nodo)) return [[prefijo, nodo as Hoja]];
  return Object.entries(nodo as Record<string, unknown>).flatMap(([clave, hijo]) => hojas(hijo, prefijo ? `${prefijo}.${clave}` : clave));
}

/** Puntos de avance para los rótulos: ●●○ es 2 de 3. Se cuentan con el dedo, a diferencia de una fracción. */
export function puntos(logrados: number, total: number): string {
  return "●".repeat(Math.max(0, Math.min(logrados, total))) + "○".repeat(Math.max(0, total - Math.max(0, logrados)));
}

/** Texto sin las marcas de pictograma, para etiquetas de lector de pantalla: «{pictograma:meta} META» → «META». */
export function sinPictogramas(texto: string): string {
  return texto.replace(/\{pictograma:[\w-]+\}/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Como `t`, pero con una clave construida en tiempo de ejecución a partir de un identificador
 * (`pantallas.${level.id}.titulo.rotulo`). La prueba de completitud garantiza que existe para cada dato.
 */
export function tClave(clave: string, variables: Variables = {}): string {
  return t(clave as ClaveTexto, variables);
}

/** Indica si una clave construida en tiempo de ejecución tiene hoja en el catálogo activo. */
export function existeClave(clave: string): boolean {
  return buscar(clave) !== undefined;
}

/**
 * Hace que un dato declarativo lea sus textos del catálogo por identificador: cada campo se resuelve al leerlo,
 * así que cambiar de idioma no obliga a reconstruir los datos.
 */
export function conTextos<T extends object>(dato: T, campos: Readonly<Record<string, string>>): T {
  for (const [campo, clave] of Object.entries(campos)) Object.defineProperty(dato, campo, { get: () => tClave(clave), enumerable: true, configurable: true });
  return dato;
}
