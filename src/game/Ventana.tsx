import type { ReactNode } from "react";
import type { ClaveTexto, Variables } from "../textos";
import { Texto } from "../textos/Texto";
import { Dialog } from "./Dialog";

type VentanaProps = {
  /** Identificador del título, para `aria-labelledby`. */
  id: string;
  /** Rótulo de la cinta dorada, con su pictograma a ×2. */
  titulo: ClaveTexto;
  tituloVariables?: Variables;
  /** Contenido: dibujo central, medallas, rótulos y su frase para leer juntos. */
  children?: ReactNode;
  /** Botones; en móvil apaisado van en columna a la derecha. */
  botones: ReactNode;
  onClose?: () => void;
  /** Milisegundos sin aceptar toques al abrirse (0,5 s en las ventanas de resultado). */
  esperaMs?: number;
  celebracion?: boolean;
  className?: string;
};

/**
 * Ventana común de la interfaz (decisión «Inicio, mapa y ventanas con rótulos y pictogramas»): papel crema,
 * cinta dorada con el título y la frase para leer juntos siempre debajo de su rótulo.
 */
export function Ventana({ id, titulo, tituloVariables, children, botones, onClose, esperaMs = 0, celebracion = false, className = "" }: VentanaProps) {
  return <Dialog labelledBy={id} className={`ventana ${className}`.trim()} backdropClassName={celebracion ? "celebration" : ""} esperaMs={esperaMs} onClose={onClose}>
    <h2 id={id} className="ventana-cinta texto-noa titulo pictograma-doble"><Texto clave={titulo} variables={tituloVariables} /></h2>
    <div className="ventana-cuerpo">
      {children && <div className="ventana-contenido">{children}</div>}
      <div className="ventana-botones">{botones}</div>
    </div>
  </Dialog>;
}

/** Medalla de la pantalla de resultado: dibujo grande y su palabra a 16 px debajo. */
export function Medalla({ clave, conseguida }: { clave: ClaveTexto; conseguida: boolean }) {
  return <span className={`medalla texto-noa pequeno${conseguida ? " conseguida" : ""}`}><Texto clave={clave} /></span>;
}
