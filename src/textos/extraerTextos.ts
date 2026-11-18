import { readdirSync, readFileSync } from "node:fs";
import ts from "typescript";

/** Texto visible que sigue escrito en el código en lugar de venir del catálogo. */
export type TextoSuelto = { archivo: string; linea: number; texto: string };

/** Atributos JSX y propiedades de objeto cuyo valor es técnico (clases, rutas, identificadores), no texto visible. */
const atributosTecnicos = /^(className|key|id|type|role|href|src|rel|htmlFor|labelledBy|kind|data-.*|aria-labelledby|aria-describedby|aria-controls|viewBox|d|fill|stroke|style|name|loading|decoding|inputMode|autoComplete|lang|method|target|value)$/;
const propiedadesTecnicas = /^(id|kind|theme|world|type|src|path|key|className|track|music|asset|image|sprite|atlas|color|fill|stroke|font|mode|power|orientation|shape|variant|pose|easing|direction|face|mood|tone|cue|sound|instrument|sfx|from|to|next|route|backgroundPosition|backgroundSize|backgroundImage|transform|left|top|width|height|method|--.*)$/;
const llamadasTecnicas = /^(console\.|new Error|Error|querySelector|document\.|classList|addEventListener|localStorage|setAttribute|fetch|require)|(querySelector|getItem|setItem|addEventListener|startsWith|endsWith|includes|split|replace|match|test|classList\.\w+)$/;

/** Archivos que nunca llevan texto visible para la niña: pruebas, arnés, utilidades y entrada de teclas. */
export const excepcionesFijas = [
  "pngTestUtils.ts", "engineTestHarness.ts", "levelBeats.ts", "input.ts", "Dialog.tsx", "GameAssetIcon.tsx", "PixelIcon.tsx",
  "catPartyArt.ts", "testScreens.ts", "progress.ts", "useMapCamera.ts",
] as const;

/** Archivos de partituras: sus cadenas sin propiedad son mensajes de validación, no texto visible. */
const archivosDePartitura = /(beeNinja|catParty|armoniaDrum|meriendaJabatos)\.ts$/;

function esTextoVisible(texto: string): boolean {
  const limpio = texto.trim();
  if (!limpio || !/[A-Za-zÁÉÍÓÚÑáéíóúñ¡¿]/.test(limpio)) return false;
  if (!(/[ áéíóúñÁÉÍÓÚÑ¡¿!?…]/.test(limpio) || /^[A-ZÁÉÍÓÚÑ¡¿]/.test(limpio))) return false;
  if (/^[\w./-]+\.(png|webp|mp3|ogg|svg|css|json)$/.test(limpio)) return false;
  if (/^(\.|#|--|var\(|rgba?\(|\/)/i.test(limpio) || /^#[0-9a-f]{3,6}$/i.test(limpio)) return false;
  if (/^[a-z][\w-]*( [a-z][\w-]*)*$/.test(limpio)) return false;
  if (/^(bold |italic )*\d+px /.test(limpio) || /^\(/.test(limpio)) return false;
  if (/:not\(|a\[href|`/.test(limpio)) return false;
  const sinVariables = limpio.replace(/\$\{[^}]*\}/g, "");
  return !(/^[a-z0-9 _:.%()\-+*/,]*$/i.test(sinVariables) && !/[A-ZÁÉÍÓÚÑ¡¿]/.test(sinVariables.trim()[0] ?? ""));
}

/** Busca los textos visibles de un archivo recorriendo su árbol sintáctico. */
export function textosSueltos(archivo: string, codigo: string): TextoSuelto[] {
  const fuente = ts.createSourceFile(archivo, codigo, ts.ScriptTarget.Latest, true, archivo.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const encontrados: TextoSuelto[] = [];
  const visitar = (nodo: ts.Node): void => {
    if (ts.isImportDeclaration(nodo) || ts.isExportDeclaration(nodo)) return;
    if (ts.isCallExpression(nodo) && llamadasTecnicas.test(nodo.expression.getText(fuente))) return;
    if (ts.isNewExpression(nodo) && /Error/.test(nodo.expression.getText(fuente))) return;
    let texto: string | undefined;
    if (ts.isJsxText(nodo)) texto = nodo.getText(fuente).replace(/\s+/g, " ").trim();
    else if (ts.isStringLiteral(nodo) || ts.isNoSubstitutionTemplateLiteral(nodo)) texto = nodo.text;
    else if (ts.isTemplateExpression(nodo)) texto = nodo.getText(fuente).slice(1, -1);
    if (texto === undefined) {
      ts.forEachChild(nodo, visitar);
      return;
    }
    const padre = nodo.parent;
    let contexto = "";
    if (ts.isJsxAttribute(padre)) {
      const atributo = padre.name.getText(fuente);
      if (atributosTecnicos.test(atributo)) return;
      contexto = atributo;
    }
    if (ts.isPropertyAssignment(padre)) {
      if (padre.name === nodo) return;
      const clave = padre.name.getText(fuente).replace(/["']/g, "");
      if (propiedadesTecnicas.test(clave)) return;
      contexto = clave;
    }
    if (ts.isLiteralTypeNode(padre) || ts.isCaseClause(padre) || ts.isElementAccessExpression(padre)) return;
    if (ts.isBinaryExpression(padre) && /[=!]==?/.test(padre.operatorToken.getText(fuente))) return;
    if (archivosDePartitura.test(archivo) && !contexto) return;
    if (!esTextoVisible(texto)) return;
    encontrados.push({ archivo, linea: fuente.getLineAndCharacterOfPosition(nodo.getStart(fuente)).line + 1, texto });
  };
  visitar(fuente);
  return encontrados;
}

/** Recorre `src/App.tsx` y los archivos de `src/game/` que no son pruebas, y agrupa los textos sueltos por archivo. */
export function textosSueltosPorArchivo(raiz: URL): Map<string, TextoSuelto[]> {
  const archivos = ["App.tsx", ...readdirSync(new URL("game/", raiz)).filter((nombre) => /\.tsx?$/.test(nombre) && !/\.test\./.test(nombre)).map((nombre) => `game/${nombre}`)];
  const resultado = new Map<string, TextoSuelto[]>();
  for (const archivo of archivos) {
    const nombre = archivo.split("/").pop() ?? archivo;
    if ((excepcionesFijas as readonly string[]).includes(nombre)) continue;
    const sueltos = textosSueltos(`src/${archivo}`, readFileSync(new URL(archivo, raiz), "utf8"));
    if (sueltos.length > 0) resultado.set(`src/${archivo}`, sueltos);
  }
  return resultado;
}
