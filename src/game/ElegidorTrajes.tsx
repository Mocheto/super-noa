import "../textos/zonas/trajes";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { t } from "../textos";
import { Boton, Texto } from "../textos/Texto";
import { dibujoDeNoa, trajesDisponibles, type TrajeId } from "./trajes";
import { Ventana } from "./Ventana";
import "./elegidorTrajes.css";

/** Noa quieta con un traje (la primera celda de su hoja) o, al saltar, con su pose de salto. */
function NoaConTraje({ traje, salta = false }: { traje: TrajeId; salta?: boolean }) {
  const { src } = dibujoDeNoa(traje, salta ? "salto" : "hoja");
  return <span className={`traje-noa${salta ? " salta" : ""}`} style={{ backgroundImage: `url("${src}")` }} aria-hidden="true" />;
}

type Props = {
  puesto: TrajeId;
  /** Se guarda al tocar cada traje; «¡LISTO!» solo cierra. */
  onPoner: (traje: TrajeId) => void;
  onClose: () => void;
  reduceMotion: boolean;
};

/** El elegidor de trajes del mapa (boceto B): Noa grande ante el espejo y los trajes debajo, como botones de opción. */
export function ElegidorTrajes({ puesto, onPoner, onClose, reduceMotion }: Props) {
  const [salto, setSalto] = useState(0);
  const opciones = useRef<HTMLDivElement>(null);
  const disponibles = trajesDisponibles();

  useEffect(() => {
    if (!salto) return;
    const id = window.setTimeout(() => setSalto(0), 550);
    return () => window.clearTimeout(id);
  }, [salto]);

  const poner = (traje: TrajeId) => {
    onPoner(traje);
    if (!reduceMotion) setSalto((n) => n + 1);
  };

  const conFlechas = (event: KeyboardEvent) => {
    const paso = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!paso) return;
    event.preventDefault();
    const indice = (disponibles.indexOf(puesto) + paso + disponibles.length) % disponibles.length;
    poner(disponibles[indice]);
    opciones.current?.querySelectorAll<HTMLButtonElement>("button")[indice]?.focus();
  };

  return <Ventana id="trajes-titulo" titulo="trajes.titulo.rotulo" className="ventana-trajes" onClose={onClose}
    botones={<Boton tipo="seguir" clave="trajes.listo.rotulo" onClick={onClose} />}>
    <p className="juntos">{t("trajes.titulo.juntos")}</p>
    <div className="trajes-cuerpo">
      <div className="trajes-espejo"><NoaConTraje key={salto} traje={puesto} salta={salto > 0} /></div>
      <div className="trajes-opciones" role="radiogroup" tabIndex={-1} aria-label={t("trajes.elegir.oculto")} ref={opciones} onKeyDown={conFlechas}>
        {disponibles.map((traje) => <button key={traje} type="button" role="radio" className="traje-opcion" aria-checked={traje === puesto}
          tabIndex={traje === puesto ? 0 : -1} data-gamepad-default={traje === puesto || undefined} onClick={() => poner(traje)}>
          <NoaConTraje traje={traje} />
          <span className="texto-noa pequeno"><Texto clave={`trajes.${traje}.rotulo`} /></span>
          <span className="traje-puesto texto-noa pequeno"><Texto clave="trajes.puesto.rotulo" /></span>
        </button>)}
      </div>
    </div>
  </Ventana>;
}
