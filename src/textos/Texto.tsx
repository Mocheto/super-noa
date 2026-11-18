import type { ButtonHTMLAttributes } from "react";
import { partes, t, type ClaveTexto, type Variables } from "./index.ts";
import { pictogramas, type Pictograma as NombrePictograma } from "./pictogramas.ts";

/** Un pictograma suelto. Es decorativo: la palabra o la etiqueta oculta ya lo dicen. */
export function Pictograma({ nombre, doble = false }: { nombre: NombrePictograma; doble?: boolean }) {
  return <span className={`pictograma pictograma-${nombre}${doble ? " pictograma-doble" : ""}`} aria-hidden="true">{pictogramas[nombre]}</span>;
}

/** Pinta un texto ya resuelto con sus pictogramas. */
export function Pictogramas({ texto }: { texto: string }) {
  const lista = partes(texto);
  // El espacio que sigue a un pictograma lo pone su margen: así no depende de la anchura del espacio de cada letra.
  return <>{lista.map((parte, indice) => parte.tipo === "texto"
    ? indice > 0 && lista[indice - 1].tipo !== "texto" ? parte.valor.replace(/^ /, "") : parte.valor
    : <Pictograma key={indice} nombre={parte.nombre} />)}</>;
}

/** Pinta un texto del catálogo con sus pictogramas. */
export function Texto({ clave, variables }: { clave: ClaveTexto; variables?: Variables }) {
  return <Pictogramas texto={t(clave, variables)} />;
}

/**
 * Palabra con dibujo partida en sus dos piezas: el pictograma y la palabra en un `<span className="palabra">`,
 * para poder ocultar la palabra donde no cabe (pestañas en móvil) sin perder el dibujo.
 */
export function PalabraConDibujo({ clave, variables }: { clave: ClaveTexto; variables?: Variables }) {
  const lista = partes(t(clave, variables));
  const dibujo = lista.find((parte) => parte.tipo === "pictograma");
  const palabra = lista.filter((parte) => parte.tipo === "texto").map((parte) => parte.valor).join("").trim();
  return <>{dibujo && dibujo.tipo === "pictograma" && <Pictograma nombre={dibujo.nombre} />}<span className="palabra">{palabra}</span></>;
}

type AtributosBoton = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type">;

/**
 * Botón con palabra para Noa. `seguir` es el principal verde, `jugar` el principal rojo de ¡A JUGAR! y
 * `secundario` el crema. El rótulo sale del catálogo con su pictograma a ×1.
 */
export function Boton({ clave, variables, tipo = "secundario", className, ...atributos }: AtributosBoton & { clave: ClaveTexto; variables?: Variables; tipo?: "seguir" | "jugar" | "secundario" }) {
  return <button type="button" {...atributos} className={`boton boton-${tipo}${className ? ` ${className}` : ""}`}><Texto clave={clave} variables={variables} /></button>;
}

/** Control redondo sin palabra (sonido, pantalla grande, cerrar, pausa). Su nombre va en la etiqueta oculta. */
export function BotonControl({ pictograma, etiqueta, variables, className, ...atributos }: AtributosBoton & { pictograma: NombrePictograma; etiqueta: ClaveTexto; variables?: Variables }) {
  return <button type="button" {...atributos} className={`boton-control${className ? ` ${className}` : ""}`} aria-label={t(etiqueta, variables)}><Pictograma nombre={pictograma} /></button>;
}
