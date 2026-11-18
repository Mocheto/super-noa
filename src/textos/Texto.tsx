import { partes, t, type ClaveTexto, type Variables } from "./index.ts";
import { pictogramas } from "./pictogramas.ts";

/** Pinta un texto del catálogo con sus pictogramas. El pictograma es decorativo: la palabra ya lo dice. */
export function Texto({ clave, variables }: { clave: ClaveTexto; variables?: Variables }) {
  return <>{partes(t(clave, variables)).map((parte, indice) => parte.tipo === "texto"
    ? <span key={indice}>{parte.valor}</span>
    : <span key={indice} className={`pictograma pictograma-${parte.nombre}`} aria-hidden="true">{pictogramas[parte.nombre]}</span>)}</>;
}
