import { partes, t, type ClaveTexto, type Variables } from "./index.ts";
import { pictogramas } from "./pictogramas.ts";

/** Pinta un texto ya resuelto con sus pictogramas. El pictograma es decorativo: la palabra ya lo dice. */
export function Pictogramas({ texto }: { texto: string }) {
  return <>{partes(texto).map((parte, indice) => parte.tipo === "texto"
    ? parte.valor
    : <span key={indice} className={`pictograma pictograma-${parte.nombre}`} aria-hidden="true">{pictogramas[parte.nombre]}</span>)}</>;
}

/** Pinta un texto del catálogo con sus pictogramas. */
export function Texto({ clave, variables }: { clave: ClaveTexto; variables?: Variables }) {
  return <Pictogramas texto={t(clave, variables)} />;
}
