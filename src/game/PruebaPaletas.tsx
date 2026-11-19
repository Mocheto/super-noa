import { useEffect, useState, type CSSProperties } from "react";
import { ANIMACIONES_GATO, COLUMNAS_GATO, CUADRO_GATO, FILAS_GATO, hojaDeGatito, PALETAS_GATITOS } from "./casaGatoArte";
import { tClave } from "../textos/index.ts";
import "./casa.css";

const MUNDOS = Object.keys(PALETAS_GATITOS).map(Number).sort((a, b) => a - b);

/**
 * Solo en desarrollo (`?prueba=casa&paletas`): los gatitos de la casa, sentados y limpios, con su paleta y su
 * nombre, para revisar que se distinguen entre ellos.
 */
export function PruebaPaletas() {
  const [hojas, setHojas] = useState<Record<number, string>>({});
  useEffect(() => {
    let vivo = true;
    for (const mundo of MUNDOS) {
      void hojaDeGatito(mundo, { sucio: false, mejorAmigo: false }).then((url) => { if (vivo) setHojas((actuales) => ({ ...actuales, [mundo]: url })); });
    }
    return () => { vivo = false; };
  }, []);
  const { fila } = ANIMACIONES_GATO.sentado;
  return <section className="casa-prueba-paletas">
    {MUNDOS.map((mundo) => <figure key={mundo}>
      <span style={{
        backgroundImage: hojas[mundo] ? `url("${hojas[mundo]}")` : undefined,
        backgroundSize: `${COLUMNAS_GATO * CUADRO_GATO}px ${FILAS_GATO * CUADRO_GATO}px`,
        backgroundPosition: `0 ${-fila * CUADRO_GATO}px`,
      } as CSSProperties} />
      <figcaption className="texto-noa">{tClave(`mundos.${mundo}.gato.rotulo`)}</figcaption>
    </figure>)}
  </section>;
}
