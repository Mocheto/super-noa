import type { CSSProperties } from "react";
import { cssAssetUrl } from "./assets";
import { fondoDePieza, laminaDePieza, PIEZAS_MAGICAS, type CajaPorcentaje } from "./casaVestidorArte";
import type { TipoAccesorio } from "./casaRopa";

type Props = {
  tipo: TipoAccesorio;
  pieza: string;
  /** Dónde va, en % de la caja que la contiene (sobre el gatito); sin caja, la coloca el CSS del sitio donde se usa. */
  caja?: CajaPorcentaje;
  className?: string;
};

/**
 * Una pieza del armario (o el complemento de un gatito) dibujada de su lámina. Las alas son dos mitades, una por ala, para que cada una aletee desde su
 * hombro; las piezas mágicas (capa de Navidad, alas de unicornio) destellan. Las animaciones van en `casa.css` y se
 * paran con «movimiento tranquilo».
 */
export function PiezaAccesorio({ tipo, pieza, caja, className = "" }: Props) {
  const imagen = cssAssetUrl(laminaDePieza(tipo, pieza).imagen);
  const sitio: CSSProperties = caja ? { left: `${caja.left}%`, top: `${caja.top}%`, width: `${caja.width}%`, height: `${caja.height}%` } : {};
  const clase = `casa-pieza is-${tipo}${PIEZAS_MAGICAS.includes(pieza) ? " is-magica" : ""} ${className}`.trim();
  if (tipo === "alas") {
    return <i className={clase} aria-hidden="true" style={sitio}>
      <b className="casa-ala is-izquierda" style={{ backgroundImage: imagen, ...fondoDePieza(tipo, pieza, "izquierda") }} />
      <b className="casa-ala is-derecha" style={{ backgroundImage: imagen, ...fondoDePieza(tipo, pieza, "derecha") }} />
    </i>;
  }
  return <i className={clase} aria-hidden="true" style={{ ...sitio, backgroundImage: imagen, ...fondoDePieza(tipo, pieza) }} />;
}
