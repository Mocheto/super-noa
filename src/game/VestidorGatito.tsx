import "../textos/zonas/casa";
import { useEffect, useState, type CSSProperties } from "react";
import { ACCESORIOS, alternar, TIPOS_ACCESORIO, type Accesorio, type Ropa, type TipoAccesorio } from "./casaRopa";
import { hojaPintada, type VarianteGatito } from "./casaGatoArte";
import { ARMARIO_ABIERTO, BALDAS, cajaSobreElGatito, FILA_DE_PIEZAS, FONDO_VESTIDOR, fondoDePieza, HOJA_ACCESORIOS, HOJA_VESTIDOR } from "./casaVestidorArte";
import { cssAssetUrl } from "./assets";
import { t, tClave } from "../textos/index.ts";
import { Boton } from "../textos/Texto";

type Props = {
  nombre: string;
  mundo: number;
  variante: VarianteGatito;
  /** Lo que lleva al entrar. */
  ropa: Ropa;
  reduceMotion: boolean;
  /** Al pulsar «¡LISTO!»: lo que lleva puesto al salir. */
  onListo: (ropa: Ropa) => void;
  /** Aviso para el sonido al poner o quitar una pieza. */
  onToque?: (puesta: boolean) => void;
};

/** Cuánto se pone contento (ojos cerrados y sonrisa) al ponerle una pieza. */
const CONTENTO_MS = 900;

const ARTE_VESTIDOR = {
  "--fondo-vestidor": cssAssetUrl(FONDO_VESTIDOR),
  "--armario-abierto": cssAssetUrl(ARMARIO_ABIERTO),
  "--accesorios": cssAssetUrl(HOJA_ACCESORIOS),
} as CSSProperties;

/** Estilo de una pieza dibujada de su lámina, dentro de su caja. */
const estiloPieza = <T extends TipoAccesorio>(tipo: T, pieza: Accesorio<T>): CSSProperties => ({ backgroundPosition: fondoDePieza(tipo, pieza) });

/**
 * Vestidor (mapa «Ropa y accesorios para los gatitos»): el gatito grande sobre la alfombra y el armario abierto con una
 * balda de sombreros, una de gafas y una de bufandas. Tocar una pieza se la pone al momento (en lugar de la de su
 * tipo) y tocarla otra vez se la quita; lo que se ve al pulsar «¡LISTO!» es lo que lleva.
 */
export function VestidorGatito({ nombre, mundo, variante, ropa: inicial, reduceMotion, onListo, onToque }: Props) {
  const [ropa, setRopa] = useState<Ropa>(inicial);
  const [hoja, setHoja] = useState<string | undefined>();
  const [contento, setContento] = useState(0);

  useEffect(() => {
    let vivo = true;
    void hojaPintada(HOJA_VESTIDOR, mundo, variante).then((url) => { if (vivo) setHoja(url); });
    return () => { vivo = false; };
  }, [mundo, variante]);

  useEffect(() => {
    if (!contento) return;
    const reloj = window.setTimeout(() => setContento(0), CONTENTO_MS);
    return () => window.clearTimeout(reloj);
  }, [contento]);

  const tocar = <T extends TipoAccesorio>(tipo: T, pieza: Accesorio<T>) => {
    const puesta = ropa[tipo] !== pieza;
    setRopa(alternar(ropa, tipo, pieza));
    if (puesta) setContento((veces) => veces + 1);
    onToque?.(puesta);
  };

  return <div className="casa-vestidor" style={ARTE_VESTIDOR} role="dialog" aria-label={t("casa.vestidor.titulo.oculto", { nombre })}>
    <div className="casa-vestidor-escena"><div className="casa-vestidor-cuadro">
      <span className={`casa-vestidor-gatito${contento && !reduceMotion ? " is-contento" : ""}`}>
        <span className="casa-vestidor-cuerpo" style={{ backgroundImage: hoja ? `url("${hoja}")` : undefined, backgroundPositionX: contento ? "100%" : "0%" }} />
        {TIPOS_ACCESORIO.map((tipo) => {
          const pieza = ropa[tipo];
          if (!pieza) return null;
          const caja = cajaSobreElGatito(tipo);
          return <i key={tipo} className={`casa-vestidor-puesta is-${tipo}`} aria-hidden="true" style={{
            left: `${caja.left}%`, top: `${caja.top}%`, width: `${caja.width}%`, height: `${caja.height}%`,
            backgroundPosition: fondoDePieza(tipo, pieza),
          }} />;
        })}
      </span>
    </div></div>
    <div className="casa-vestidor-lado">
      <div className="casa-vestidor-armario" role="group" aria-label={t("casa.vestidor.armario.oculto")}>
        {TIPOS_ACCESORIO.map((tipo) => {
          const balda = BALDAS[tipo];
          return <div key={tipo} className={`casa-vestidor-balda is-${tipo}`} role="group" aria-label={tClave(`casa.vestidor.balda.${tipo}.oculto`)} style={{
            top: `${balda.arriba}%`, height: `${balda.abajo - balda.arriba}%`, left: `${FILA_DE_PIEZAS.izquierda}%`, width: `${FILA_DE_PIEZAS.derecha - FILA_DE_PIEZAS.izquierda}%`,
            "--apoyo": `${((balda.abajo - balda.apoyo) / (balda.abajo - balda.arriba)) * 100}%`,
          } as CSSProperties}>
            {(ACCESORIOS[tipo] as readonly Accesorio<typeof tipo>[]).map((pieza) => {
              const puesta = ropa[tipo] === pieza;
              return <button key={pieza} type="button" className={`casa-vestidor-pieza${puesta ? " is-puesta" : ""}`} aria-pressed={puesta}
                aria-label={tClave(`casa.vestidor.pieza.${pieza}.oculto`)} onClick={() => tocar(tipo, pieza)}>
                <i className={`casa-vestidor-dibujo is-${tipo}`} style={estiloPieza(tipo, pieza)} />
              </button>;
            })}
          </div>;
        })}
      </div>
      <Boton tipo="seguir" clave="casa.vestidor.listo.rotulo" className="casa-vestidor-listo" data-gamepad-default onClick={() => onListo(ropa)} />
    </div>
  </div>;
}
