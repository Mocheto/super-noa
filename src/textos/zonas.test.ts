import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

/**
 * Zonas diferidas del catálogo: cada archivo de `src/textos/zonas/` registra la zona de su nombre (`duelos`,
 * `minijuegos.abeja`). `t()` es síncrono, así que una zona tiene que estar registrada antes de que se ejecute el código
 * que pide sus claves. Estas pruebas lo garantizan sin abrir el navegador, mirando solo las importaciones:
 *
 * 1. Todo módulo que escribe una clave de una zona diferida importa (directa o indirectamente, con `import` estático)
 *    el módulo de esa zona. Las importaciones estáticas se evalúan antes que el módulo, también dentro de un bloque
 *    diferido, así que la zona ya está cuando el módulo llama a `t()` o `conTextos()`.
 * 2. Ninguna zona diferida se alcanza con `import` estático desde `src/main.tsx`: así no vuelve al bloque principal.
 */
const raiz = new URL("../", import.meta.url);
const ruta = (url: URL) => url.pathname.slice(raiz.pathname.length - "src/".length);

function archivosDe(carpeta: URL): string[] {
  return readdirSync(carpeta, { withFileTypes: true }).flatMap((entrada) => {
    if (entrada.isDirectory()) return archivosDe(new URL(`${entrada.name}/`, carpeta));
    return /\.tsx?$/.test(entrada.name) && !/\.test\./.test(entrada.name) ? [ruta(new URL(entrada.name, carpeta))] : [];
  });
}

const archivos = archivosDe(raiz);
const fuentes = new Map(archivos.map((archivo) => [archivo, ts.createSourceFile(archivo, readFileSync(new URL(archivo.slice(4), raiz), "utf8"), ts.ScriptTarget.Latest, true)]));
const zonas = readdirSync(new URL("textos/zonas/", raiz)).filter((nombre) => nombre.endsWith(".ts")).map((nombre) => nombre.replace(/\.ts$/, ""));
const moduloDeZona = (zona: string) => `src/textos/zonas/${zona}.ts`;

function resolver(desde: string, especificador: string): string | undefined {
  if (!especificador.startsWith(".")) return undefined;
  const base = new URL(especificador, new URL(desde.slice(4), raiz));
  for (const candidato of [base.pathname, `${base.pathname}.ts`, `${base.pathname}.tsx`, `${base.pathname}/index.ts`]) {
    if (/\.tsx?$/.test(candidato) && existsSync(candidato)) return ruta(new URL(`file://${candidato}`));
  }
  return undefined;
}

/** Importaciones estáticas que se evalúan (no `import type`, no `import()`). */
const importaciones = new Map(archivos.map((archivo) => {
  const fuente = fuentes.get(archivo)!;
  const destinos = fuente.statements.flatMap((sentencia) => {
    if (ts.isImportDeclaration(sentencia)) {
      if (sentencia.importClause?.isTypeOnly) return [];
      const enlaces = sentencia.importClause?.namedBindings;
      if (sentencia.importClause && !sentencia.importClause.name && enlaces && ts.isNamedImports(enlaces) && enlaces.elements.length > 0 && enlaces.elements.every((e) => e.isTypeOnly)) return [];
      return [resolver(archivo, (sentencia.moduleSpecifier as ts.StringLiteral).text)];
    }
    if (ts.isExportDeclaration(sentencia) && sentencia.moduleSpecifier && !sentencia.isTypeOnly) return [resolver(archivo, (sentencia.moduleSpecifier as ts.StringLiteral).text)];
    return [];
  }).filter((destino): destino is string => Boolean(destino));
  return [archivo, destinos];
}));

function cierre(inicio: string): Set<string> {
  const vistos = new Set<string>();
  const pendientes = [inicio];
  while (pendientes.length) {
    const actual = pendientes.pop()!;
    if (vistos.has(actual)) continue;
    vistos.add(actual);
    pendientes.push(...(importaciones.get(actual) ?? []));
  }
  return vistos;
}

/** Comienzos de clave escritos en el código: cadenas y la parte fija de las plantillas (`juegos.${id}.titulo` → `juegos.`). Los comentarios no cuentan. */
function clavesDe(fuente: ts.SourceFile): Array<{ clave: string; linea: number }> {
  const resultado: Array<{ clave: string; linea: number }> = [];
  const visitar = (nodo: ts.Node) => {
    if (ts.isImportDeclaration(nodo) || ts.isExportDeclaration(nodo)) return;
    const texto = ts.isStringLiteral(nodo) || ts.isNoSubstitutionTemplateLiteral(nodo) ? nodo.text : ts.isTemplateExpression(nodo) ? nodo.head.text : undefined;
    if (texto !== undefined && /^[a-z][\w-]*\.[\w.${}-]*$/i.test(texto)) resultado.push({ clave: texto, linea: fuente.getLineAndCharacterOfPosition(nodo.getStart(fuente)).line + 1 });
    ts.forEachChild(nodo, visitar);
  };
  visitar(fuente);
  return resultado;
}

/** Zona diferida a la que pertenece un comienzo de clave, o `"ambigua"` si se queda a medio camino (`minijuegos.${juego}`). */
function zonaDe(clave: string): string | undefined {
  const propia = zonas.filter((zona) => clave.startsWith(`${zona}.`)).sort((a, b) => b.length - a.length)[0];
  if (propia) return propia;
  return zonas.some((zona) => zona.startsWith(clave)) && clave.endsWith(".") ? "ambigua" : undefined;
}

test("cada módulo que usa una zona diferida la importa", () => {
  const faltan: string[] = [];
  for (const [archivo, fuente] of fuentes) {
    if (archivo.startsWith("src/textos/")) continue;
    const alcance = cierre(archivo);
    for (const { clave, linea } of clavesDe(fuente)) {
      const zona = zonaDe(clave);
      if (zona === "ambigua") faltan.push(`${archivo}:${linea} «${clave}…» no dice de qué zona diferida es: escribe la clave entera`);
      else if (zona && !alcance.has(moduloDeZona(zona))) faltan.push(`${archivo}:${linea} usa «${clave}»: añade import "${moduloDeZona(zona)}"`);
    }
  }
  // Una línea por archivo y zona: la primera clave basta para saber qué importar.
  const vistos = new Set<string>();
  faltan.splice(0, faltan.length, ...faltan.filter((linea) => { const id = linea.replace(/:\d+ .*import/, " import"); return !vistos.has(id) && Boolean(vistos.add(id)); }));
  assert.deepEqual(faltan, [], `Claves de zonas diferidas sin su zona:\n${faltan.join("\n")}`);
});

test("ninguna zona diferida vuelve al bloque principal", () => {
  const principal = cierre("src/main.tsx");
  const dentro = zonas.filter((zona) => principal.has(moduloDeZona(zona)) || principal.has(`src/textos/es/${zona.replace(".", "/")}.ts`));
  assert.deepEqual(dentro, [], "Zonas diferidas que se importan sin import() desde src/main.tsx: muévelas al módulo de la pantalla que las usa");
  for (const completo of ["src/textos/es/index.ts", "src/textos/es/minijuegos.ts", "src/textos/todo.ts"]) assert.ok(!principal.has(completo), `${completo} junta zonas diferidas: solo lo importan las pruebas y la exportación`);
});

test("cada zona diferida está registrada por su archivo y no está en la base", async () => {
  const { base } = await import("./es/base.ts");
  for (const zona of zonas) {
    const codigo = readFileSync(new URL(`zonas/${zona}.ts`, import.meta.url), "utf8");
    assert.match(codigo, new RegExp(`registrarZona\\("${zona.replace(".", "\\.")}"`), `${zona}.ts debe registrar la zona «${zona}»`);
    let nodo: unknown = base;
    for (const parte of zona.split(".")) nodo = (nodo as Record<string, unknown> | undefined)?.[parte];
    assert.equal(nodo, undefined, `«${zona}» es diferida: quítala de es/base.ts`);
  }
});

test("la base y las zonas diferidas forman el catálogo completo", async () => {
  const { es } = await import("./todo.ts");
  const { hojas } = await import("./index.ts");
  assert.equal(hojas().length, hojas(es).length);
});
