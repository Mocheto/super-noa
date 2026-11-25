import "../textos/zonas/casa";
import { useEffect, useState, type CSSProperties } from "react";
import { ACCESORIOS, alternar, TIPOS_ACCESORIO, type Accesorio, type Ropa, type TipoAccesorio } from "./casaRopa";
import { hojaPintada, modeloDibujado, type VarianteGatito } from "./casaGatoArte";
import { anclasVestidorDe, ARMARIO_ABIERTO, cajaSobreElGatito, DETRAS, FILA_DE_PIEZAS, FILAS_ARMARIO, FONDO_VESTIDOR, HOJA_VESTIDOR, HOJAS_VESTIDOR, LAMINAS, ORDEN_DE_DIBUJO, PIEZAS_POR_FILA } from "./casaVestidorArte";
import { cssAssetUrl } from "./assets";
import { PiezaAccesorio } from "./PiezaAccesorio";
import { conComplemento } from "./casaComplementos";
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

/** Cuánto dura la reacción del gatito al ponerle una pieza (ojos cerrados y sonrisa, y su movimiento). */
const CONTENTO_MS = 900;

/**
 * Cómo reacciona al ponerle una pieza, por tipo (mapa «Más decoraciones y accesorios para la casa»): un saltito con
 * sombrero, gafas o bufanda; una vuelta para lucir la capa; un salto alto aleteando con alas.
 */
const REACCION: Record<TipoAccesorio, "contento" | "vuelta" | "vuelo"> = {
  sombrero: "contento", gafas: "contento", bufanda: "contento", capa: "vuelta", alas: "vuelo",
};

const ARTE_VESTIDOR = {
  "--fondo-vestidor": cssAssetUrl(FONDO_VESTIDOR),
  "--armario-abierto": cssAssetUrl(ARMARIO_ABIERTO),
} as CSSProperties;

/**
 * Vestidor: el gatito grande sobre la alfombra y el armario abierto. Arriba, una pestaña por tipo (sombreros, gafas,
 * bufandas, capas y alas) con su primera pieza de dibujo; el armario enseña las seis piezas del tipo elegido, dos por
 * fila. Tocar una pieza se la pone al momento (en lugar de la de su tipo) y tocarla otra vez se la quita; lo que se ve al
 * pulsar «¡LISTO!» es lo que lleva.
 */
export function VestidorGatito({ nombre, mundo, variante, ropa: inicial, reduceMotion, onListo, onToque }: Props) {
  const [ropa, setRopa] = useState<Ropa>(inicial);
  const [hoja, setHoja] = useState<string | undefined>();
  const [tipoElegido, setTipoElegido] = useState<TipoAccesorio>("sombrero");
  const [reaccion, setReaccion] = useState<{ veces: number; como: (typeof REACCION)[TipoAccesorio] } | null>(null);

  useEffect(() => {
    let vivo = true;
    void hojaPintada(HOJAS_VESTIDOR[modeloDibujado(mundo)] ?? HOJA_VESTIDOR, mundo, variante).then((url) => { if (vivo) setHoja(url); });
    return () => { vivo = false; };
  }, [mundo, variante]);

  useEffect(() => {
    if (!reaccion) return;
    const reloj = window.setTimeout(() => setReaccion(null), CONTENTO_MS);
    return () => window.clearTimeout(reloj);
  }, [reaccion]);

  const tocar = <T extends TipoAccesorio>(tipo: T, pieza: Accesorio<T>) => {
    const puesta = ropa[tipo] !== pieza;
    setRopa(alternar(ropa, tipo, pieza));
    if (puesta) setReaccion((antes) => ({ veces: (antes?.veces ?? 0) + 1, como: REACCION[tipo] }));
    onToque?.(puesta);
  };

  // Lo que lleva, con su complemento donde no hay accesorio (lo tapa el que se ponga en su sitio).
  const conSuComplemento = conComplemento(ropa, mundo);
  const puestas = ORDEN_DE_DIBUJO.flatMap((tipo) => {
    const pieza = conSuComplemento[tipo];
    return pieza ? [{ tipo, pieza }] : [];
  });
  const pintarPuesta = ({ tipo, pieza }: { tipo: TipoAccesorio; pieza: string }) =>
    <PiezaAccesorio key={tipo} tipo={tipo} pieza={pieza} caja={cajaSobreElGatito(tipo, anclasVestidorDe(modeloDibujado(mundo)))} className="casa-vestidor-puesta" />;
  const piezas = ACCESORIOS[tipoElegido] as readonly string[];
  const movimiento = reaccion && !reduceMotion ? ` is-${reaccion.como}` : "";

  return <div className={`casa-vestidor${reduceMotion ? " is-quieta" : ""}`} style={ARTE_VESTIDOR} role="dialog" aria-label={t("casa.vestidor.titulo.oculto", { nombre })}>
    <div className="casa-vestidor-escena"><div className="casa-vestidor-cuadro">
      <span key={reaccion?.veces ?? 0} className={`casa-vestidor-gatito${movimiento}`}>
        {puestas.filter(({ tipo }) => DETRAS.includes(tipo)).map(pintarPuesta)}
        <span className="casa-vestidor-cuerpo" style={{ backgroundImage: hoja ? `url("${hoja}")` : undefined, backgroundPositionX: reaccion ? "100%" : "0%" }} />
        {puestas.filter(({ tipo }) => !DETRAS.includes(tipo)).map(pintarPuesta)}
      </span>
    </div></div>
    <div className="casa-vestidor-lado">
      <div className="casa-vestidor-pestanas" role="group" aria-label={t("casa.vestidor.armario.oculto")}>
        {TIPOS_ACCESORIO.map((tipo) => <button key={tipo} type="button" className="casa-vestidor-pestana" aria-pressed={tipo === tipoElegido}
          aria-label={tClave(`casa.vestidor.balda.${tipo}.oculto`)} onClick={() => setTipoElegido(tipo)}>
          <span className={`casa-vestidor-icono is-${tipo}`} style={{ aspectRatio: `${LAMINAS[tipo].celda.ancho} / ${LAMINAS[tipo].celda.alto}` }}>
            <PiezaAccesorio tipo={tipo} pieza={ACCESORIOS[tipo][0]} className="is-icono" />
          </span>
        </button>)}
      </div>
      <div className="casa-vestidor-armario" role="group" aria-label={tClave(`casa.vestidor.balda.${tipoElegido}.oculto`)}>
        {FILAS_ARMARIO.map((fila, indice) => <div key={indice} className="casa-vestidor-balda" style={{
          top: `${fila.arriba}%`, height: `${fila.abajo - fila.arriba}%`, left: `${FILA_DE_PIEZAS.izquierda}%`, width: `${FILA_DE_PIEZAS.derecha - FILA_DE_PIEZAS.izquierda}%`,
          "--apoyo": `${((fila.abajo - fila.apoyo) / (fila.abajo - fila.arriba)) * 100}%`,
        } as CSSProperties}>
          {piezas.slice(indice * PIEZAS_POR_FILA, (indice + 1) * PIEZAS_POR_FILA).map((pieza) => {
            const puesta = ropa[tipoElegido] === pieza;
            return <button key={pieza} type="button" className={`casa-vestidor-pieza${puesta ? " is-puesta" : ""}`} aria-pressed={puesta}
              aria-label={tClave(`casa.vestidor.pieza.${pieza}.oculto`)} onClick={() => tocar(tipoElegido, pieza as Accesorio)}>
              <span className={`casa-vestidor-dibujo is-${tipoElegido}`} style={{ "--aspecto": LAMINAS[tipoElegido].celda.ancho / LAMINAS[tipoElegido].celda.alto } as CSSProperties}>
                <PiezaAccesorio tipo={tipoElegido} pieza={pieza} className="is-en-balda" />
              </span>
            </button>;
          })}
        </div>)}
      </div>
      <Boton tipo="seguir" clave="casa.vestidor.listo.rotulo" className="casa-vestidor-listo" data-gamepad-default onClick={() => onListo(ropa)} />
    </div>
  </div>;
}
