import { useEffect, useState, type CSSProperties } from "react";
import { CUADRO_GATO, HOJA_REFERENCIAS, hojaPintada, MODELO_DE_GATITO, MODELOS_GATITO, PALETAS_GATITOS } from "./casaGatoArte";
import { tClave } from "../textos/index.ts";
import "./casa.css";

const MUNDOS = Object.keys(PALETAS_GATITOS).map(Number).sort((a, b) => a - b);

/**
 * Solo en desarrollo (`?prueba=casa&paletas`): prueba de parecido. Cada gatito de la casa, sentado y limpio, con la
 * referencia de su modelo (`gato-casa-referencias-v1.webp`), su paleta, sus marcas y su nombre, junto a su dibujo del
 * mundo y en una fila por modelo, para revisar que se distinguen entre ellos y que se reconoce a cada uno.
 */
export function PruebaPaletas() {
  const [hojas, setHojas] = useState<Record<number, string>>({});
  useEffect(() => {
    let vivo = true;
    for (const mundo of MUNDOS) {
      void hojaPintada(HOJA_REFERENCIAS, mundo, { sucio: false, mejorAmigo: false }).then((url) => { if (vivo) setHojas((actuales) => ({ ...actuales, [mundo]: url })); });
    }
    return () => { vivo = false; };
  }, []);
  return <section className="casa-prueba-paletas">
    {MODELOS_GATITO.map((modelo, columna) => <div key={modelo} className="casa-prueba-modelo" data-modelo={modelo}>
      {MUNDOS.filter((mundo) => MODELO_DE_GATITO[mundo] === modelo).map((mundo) => <figure key={mundo}>
        <div className="casa-prueba-pareja">
          <span style={{
            backgroundImage: hojas[mundo] ? `url("${hojas[mundo]}")` : undefined,
            backgroundSize: `${MODELOS_GATITO.length * CUADRO_GATO}px ${CUADRO_GATO}px`,
            backgroundPosition: `${-columna * CUADRO_GATO}px 0`,
          } as CSSProperties} />
          <img src={`./assets/sprites/world-cat-${mundo}-v1.webp`} alt="" />
        </div>
        <figcaption className="texto-noa">{tClave(`mundos.${mundo}.gato.rotulo`)}</figcaption>
      </figure>)}
    </div>)}
  </section>;
}
