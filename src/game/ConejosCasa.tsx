/**
 * Canela y Algodón en la casa: lleva el reloj de `casaConejos.ts` mientras se ve el jardín, los dibuja arriba y bajo
 * tierra (dibujo provisional, por código, hasta que llegue su arte) y atiende lo que la casa le pide: tocar y dar la
 * zanahoria. Los botones son para el teclado; con el dedo los toques llegan por la escena.
 */
import "../textos/zonas/casa";
import { memo, useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import {
  acariciar, avanzar, conejoCercano, conejoEn, crearMadriguera, CUEVAS, darZanahoria, mirar, NODOS_TUNEL, ponerNoche, tocarCueva,
  type Conejo, type ConejoId, type CuevaId, type Madriguera, type Nivel, type Punto, type Salida,
} from "./casaConejos";
import { tClave } from "../textos/index.ts";
import { Texto } from "../textos/Texto";

/** Lo que la casa les pide; los puntos van en px de la escena del jardín. */
export type MandosConejos = {
  /** Un toque sin mover el dedo: acaricia al conejo o, bajo tierra, llama a la cueva. `false` si ahí no hay nada. */
  tocar: (punto: Punto) => boolean;
  /** La zanahoria soltada en un punto. */
  zanahoria: (punto: Punto) => void;
  /** Con teclado, la zanahoria va al conejo más cercano a `x`. */
  zanahoriaAlCercano: (x: number) => void;
};

type Props = {
  ref: Ref<MandosConejos>;
  /** Se ve el jardín; si no, los conejos esperan como estaban. */
  visible: boolean;
  vista: Nivel;
  noche: boolean;
};

/** El dedo apunta al cuerpo del conejo y la lógica mide desde sus pies. */
const A_LOS_PIES = 35;
const enLosPies = (p: Punto): Punto => ({ x: p.x, y: p.y + A_LOS_PIES });
/** La boca de cada cueva, para tocarla. */
export const CAJA_CUEVA = { ancho: 216, alto: 136 } as const;
const cuevaEn = (p: Punto): CuevaId | undefined => CUEVAS.find((cueva) =>
  ((p.x - NODOS_TUNEL[cueva].x) / (CAJA_CUEVA.ancho / 2)) ** 2 + ((p.y - NODOS_TUNEL[cueva].y) / (CAJA_CUEVA.alto / 2)) ** 2 <= 1);

const COLORES: Readonly<Record<ConejoId, { pelo: string; oreja: string }>> = {
  canela: { pelo: "#c08a58", oreja: "#e8a99a" },
  algodon: { pelo: "#fdf8f0", oreja: "#f2b8c0" },
};
const TINTA = "#2f1d33";

/** Un conejo de 90 × 100 con los pies abajo en el centro, mirando a la derecha. */
function Dibujo({ id, ojosCerrados }: { id: ConejoId; ojosCerrados: boolean }) {
  const { pelo, oreja } = COLORES[id];
  const trazo = { stroke: TINTA, strokeWidth: 3 };
  return <svg viewBox="0 0 90 100" width="90" height="100" aria-hidden="true">
    <g className="casa-conejo-cuerpo">
      <circle cx="14" cy="76" r="9" fill="#fff" {...trazo} />
      <ellipse cx="40" cy="77" rx="28" ry="21" fill={pelo} {...trazo} />
      <g className="casa-conejo-cabeza">
        {/* Canela, las dos tiesas; Algodón, una caída. */}
        <ellipse cx="54" cy="22" rx="7" ry="21" fill={pelo} {...trazo} /><ellipse cx="54" cy="23" rx="3" ry="14" fill={oreja} />
        {id === "canela"
          ? <><ellipse cx="70" cy="23" rx="7" ry="21" fill={pelo} {...trazo} /><ellipse cx="70" cy="24" rx="3" ry="14" fill={oreja} /></>
          : <><ellipse cx="78" cy="42" rx="7" ry="19" transform="rotate(-62 78 42)" fill={pelo} {...trazo} /><ellipse cx="80" cy="43" rx="3" ry="12" transform="rotate(-62 80 43)" fill={oreja} /></>}
        <circle cx="62" cy="55" r="20" fill={pelo} {...trazo} />
        {ojosCerrados
          ? <path d="M64 51q4 4 8 0" fill="none" {...trazo} strokeLinecap="round" />
          : <circle cx="69" cy="50" r="3.5" fill={TINTA} />}
        <circle className="casa-conejo-nariz" cx="81" cy="58" r="3.5" fill="#e8849a" />
      </g>
      <ellipse cx="30" cy="95" rx="15" ry="5" fill={pelo} {...trazo} />
      <ellipse className="casa-conejo-patita" cx="62" cy="94" rx="9" ry="5" fill={pelo} {...trazo} />
    </g>
  </svg>;
}

const DibujoConejo = ({ conejo, enVista, onAcariciar }: { conejo: Conejo; enVista: boolean; onAcariciar: () => void }) => {
  const { id, x, y, mira, nivel, hace, gesto } = conejo;
  const nombre = tClave(`casa.madriguera.nombre.${id}.rotulo`);
  const pose = gesto?.tipo ?? hace;
  return <button type="button" className={`casa-conejo is-${nivel} is-${pose}`} style={{ left: x, top: y }} tabIndex={enVista ? undefined : -1} aria-hidden={enVista ? undefined : true}
    aria-label={tClave("casa.madriguera.conejo.oculto", { nombre })} onClick={(event) => { if (event.detail === 0) onAcariciar(); }}>
    <span className="casa-conejo-dibujo" style={{ scale: `${mira} 1` }}><Dibujo id={id} ojosCerrados={gesto?.tipo === "caricia" || hace === "duerme"} /></span>
    {/* Arriba mordisquea la hierba; la zanahoria es la de Noa o la de la despensa. */}
    {(pose === "come" || (pose === "mordisquea" && nivel === "abajo")) && <i className="casa-objeto is-zanahoria casa-conejo-zanahoria" style={{ left: mira > 0 ? 68 : -14 }} />}
    {pose === "duerme" && <svg className="casa-conejo-sueno" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4h12L4 16h12" fill="none" stroke="#fff8e9" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" /></svg>}
    {gesto && <i key={gesto.desde} className="casa-corazon casa-conejo-corazon" />}
    {gesto?.tipo === "come" && <span key={`nam-${gesto.desde}`} className="casa-nam"><Texto clave="casa.comida.nam.rotulo" /></span>}
    {gesto?.tipo === "caricia" && <span className="casa-conejo-nombre texto-noa pequeno" role="status">{nombre}</span>}
  </button>;
};

export const ConejosCasa = memo(function ConejosCasa({ ref, visible, vista, noche }: Props) {
  const [madriguera, setMadriguera] = useState<Madriguera>(() => crearMadriguera(noche, performance.now(), Math.random));
  const actualRef = useRef(madriguera);
  const poner = useCallback((nueva: Madriguera) => {
    actualRef.current = nueva;
    setMadriguera(nueva);
  }, []);
  /** Aplica lo que hace Noa; `true` si ha pasado algo. */
  const aplicar = useCallback((salida: Salida) => {
    if (salida.madriguera === actualRef.current) return false;
    poner(salida.madriguera);
    return true;
  }, [poner]);

  useEffect(() => { aplicar(mirar(actualRef.current, vista, performance.now(), Math.random)); }, [vista, aplicar]);
  useEffect(() => { poner(ponerNoche(actualRef.current, noche, performance.now(), Math.random)); }, [noche, poner]);
  useEffect(() => {
    if (!visible) return;
    let fotograma = requestAnimationFrame(function paso() {
      poner(avanzar(actualRef.current, performance.now(), Math.random).madriguera);
      fotograma = requestAnimationFrame(paso);
    });
    return () => cancelAnimationFrame(fotograma);
  }, [visible, poner]);

  const caricia = useCallback((id: ConejoId) => aplicar(acariciar(actualRef.current, id, performance.now())), [aplicar]);
  const llamar = (cueva: CuevaId) => aplicar(tocarCueva(actualRef.current, cueva, Math.random));
  const dar = (id: ConejoId | null) => { if (id) aplicar(darZanahoria(actualRef.current, id, performance.now())); };

  useImperativeHandle(ref, () => ({
    tocar: (punto) => {
      const id = conejoEn(actualRef.current, enLosPies(punto));
      if (id) return caricia(id);
      const cueva = actualRef.current.vista === "abajo" ? cuevaEn(punto) : undefined;
      if (!cueva) return false;
      aplicar(tocarCueva(actualRef.current, cueva, Math.random));
      return true;
    },
    zanahoria: (punto) => dar(conejoEn(actualRef.current, enLosPies(punto))),
    zanahoriaAlCercano: (x) => dar(conejoCercano(actualRef.current, { x, y: 500 })),
  }));

  if (!visible) return null;
  return <>
    {vista === "abajo" && CUEVAS.map((cueva) => <button key={cueva} type="button" className="casa-cueva" aria-label={tClave(`casa.madriguera.cueva.${cueva}.oculto`)}
      style={{ left: NODOS_TUNEL[cueva].x - CAJA_CUEVA.ancho / 2, top: NODOS_TUNEL[cueva].y - CAJA_CUEVA.alto / 2, width: CAJA_CUEVA.ancho, height: CAJA_CUEVA.alto }}
      onClick={(event) => { if (event.detail === 0) llamar(cueva); }} />)}
    {madriguera.conejos.map((conejo) => <DibujoConejo key={conejo.id} conejo={conejo} enVista={conejo.nivel === vista} onAcariciar={() => caricia(conejo.id)} />)}
  </>;
});
