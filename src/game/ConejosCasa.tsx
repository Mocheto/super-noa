/**
 * Canela y Algodón en la casa: lleva el reloj de `casaConejos.ts` mientras se ve el jardín, los dibuja arriba y bajo
 * tierra (dibujo provisional, por código, hasta que llegue su arte) y atiende lo que la casa le pide: tocar y dar la
 * zanahoria. Los botones son para el teclado; con el dedo los toques llegan por la escena.
 */
import "../textos/zonas/casa";
import { memo, useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import {
  abandonar, acariciar, AGUJERO, CONEJOS, CORTE, avanzar, conejoCercano, conejoEn, crearMadriguera, CUEVAS, darZanahoria, ESCONDITES_CONEJO, mirar, NODOS_TUNEL, pista, ponerNoche,
  tocarAgujero, tocarCueva, tocarEscondite,
  type Conejo, type ConejoId, type CuevaId, type Madriguera, type Nivel, type Punto, type Salida, type SitioConejo,
} from "./casaConejos";
import { tClave } from "../textos/index.ts";
import { Texto } from "../textos/Texto";

/** Lo que la casa les pide; los puntos van en px de la escena del jardín. */
export type MandosConejos = {
  /** Un toque sin mover el dedo: conejo, agujero, cueva o escondite. `false` si ahí no hay nada. */
  tocar: (punto: Punto) => boolean;
  /** La zanahoria soltada en un punto. */
  zanahoria: (punto: Punto) => void;
  /** Con teclado, la zanahoria va al conejo más cercano a `x`. */
  zanahoriaAlCercano: (x: number) => void;
  /** Mientras se meten para jugar, la vista no se cambia a mano: bajará sola. */
  entrando: () => boolean;
};

type Props = {
  ref: Ref<MandosConejos>;
  /** Se ve el jardín; si no, los conejos esperan como estaban. */
  visible: boolean;
  vista: Nivel;
  noche: boolean;
  /** Los dos ya se han escondido: la vista baja sola. */
  onBaja: () => void;
};

/** El dedo apunta al cuerpo del conejo y la lógica mide desde sus pies. */
const A_LOS_PIES = 35;
const enLosPies = (p: Punto): Punto => ({ x: p.x, y: p.y + A_LOS_PIES });
/** La boca de cada cueva, para tocarla. */
export const CAJA_CUEVA = { ancho: 216, alto: 136 } as const;
const cuevaEn = (p: Punto): CuevaId | undefined => CUEVAS.find((cueva) =>
  ((p.x - NODOS_TUNEL[cueva].x) / (CAJA_CUEVA.ancho / 2)) ** 2 + ((p.y - NODOS_TUNEL[cueva].y) / (CAJA_CUEVA.alto / 2)) ** 2 <= 1);

/** El dedo coge el agujero o un escondite a esta distancia: los niños no apuntan fino. */
const RADIO_SITIO = 55;
const cerca = (a: Punto, b: Punto) => Math.hypot(a.x - b.x, a.y - b.y) <= RADIO_SITIO;
const SITIOS = Object.keys(ESCONDITES_CONEJO) as SitioConejo[];

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

/** Lo que asoma de un conejo escondido: sus orejas (a Algodón, una caída). */
function Orejas({ id }: { id: ConejoId }) {
  const { pelo, oreja } = COLORES[id];
  const trazo = { stroke: TINTA, strokeWidth: 3 };
  return <svg className="casa-escondite-orejas" viewBox="0 0 50 46" aria-hidden="true">
    <ellipse cx="16" cy="25" rx="7" ry="22" fill={pelo} {...trazo} /><ellipse cx="16" cy="26" rx="3" ry="15" fill={oreja} />
    {id === "canela"
      ? <><ellipse cx="34" cy="25" rx="7" ry="22" fill={pelo} {...trazo} /><ellipse cx="34" cy="26" rx="3" ry="15" fill={oreja} /></>
      : <><ellipse cx="37" cy="35" rx="7" ry="19" transform="rotate(66 37 35)" fill={pelo} {...trazo} /><ellipse cx="38" cy="35" rx="3" ry="12" transform="rotate(66 38 35)" fill={oreja} /></>}
  </svg>;
}

/** Cada escondite, en 100 × 70 con la base abajo (provisional, por código). */
const DIBUJO_SITIO: Readonly<Record<SitioConejo, React.ReactNode>> = {
  paja: <><path d="M6 68Q12 24 50 26T94 68z" fill="#e8c15a" /><path d="M22 66l10-28M44 66l6-34M62 66l-4-34M80 66L68 40" fill="none" stroke="#fbe49a" /></>,
  manta: <><path d="M8 68V40q0-12 14-12h56q14 0 14 12v28z" fill="#7fb4e8" /><path d="M8 46h84M34 28v40M66 28v40" fill="none" stroke="#fff8e9" /></>,
  zanahorias: <><path d="M10 40l40 28-6-38zM40 32l12 36 16-36zM90 40L52 68l8-38z" fill="#f08a2c" /><path d="M22 36l-8-14M54 32V14M78 36l10-14" fill="none" stroke="#5fa14a" /></>,
  cesta: <><path d="M14 34h72L76 68H24z" fill="#c68a4a" /><path d="M20 46h60M24 58h52" fill="none" stroke="#8a5a2c" /><path d="M26 34q24-30 48 0" fill="none" stroke="#c68a4a" /></>,
  caja: <><path d="M14 30h72v38H14z" fill="#d9a066" /><path d="M14 30l-8 14h30l14-14 14 14h30l-8-14" fill="#e8b87e" /></>,
  pelota: <><circle cx="50" cy="44" r="25" fill="#e8545a" /><path d="M26 40q24 14 48 0" fill="none" stroke="#fff8e9" /></>,
};

const DibujoConejo = ({ conejo, enVista, encontrado, celebra, onAcariciar }: { conejo: Conejo; enVista: boolean; encontrado: boolean; celebra: boolean; onAcariciar: () => void }) => {
  const { id, x, y, mira, nivel, hace, gesto } = conejo;
  const nombre = tClave(`casa.madriguera.nombre.${id}.rotulo`);
  const pose = gesto?.tipo ?? (celebra ? "juega" : hace);
  return <button type="button" className={`casa-conejo is-${nivel} is-${pose}`} style={{ left: x, top: y }} tabIndex={enVista ? undefined : -1} aria-hidden={enVista ? undefined : true}
    aria-label={tClave("casa.madriguera.conejo.oculto", { nombre })} onClick={(event) => { if (event.detail === 0) onAcariciar(); }}>
    <span className="casa-conejo-dibujo" style={{ scale: `${mira} 1` }}><Dibujo id={id} ojosCerrados={gesto?.tipo === "caricia" || hace === "duerme"} /></span>
    {/* Arriba mordisquea la hierba; la zanahoria es la de Noa o la de la despensa. */}
    {(pose === "come" || (pose === "mordisquea" && nivel === "abajo")) && <i className="casa-objeto is-zanahoria casa-conejo-zanahoria" style={{ left: mira > 0 ? 68 : -14 }} />}
    {pose === "duerme" && <svg className="casa-conejo-sueno" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4h12L4 16h12" fill="none" stroke="#fff8e9" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" /></svg>}
    {gesto && <i key={gesto.desde} className="casa-corazon casa-conejo-corazon" />}
    {celebra && <i className="casa-corazon casa-conejo-corazon" />}
    {encontrado && !celebra && !gesto && <span className="casa-conejo-nombre texto-noa pequeno" role="status"><Texto clave="casa.madriguera.cucu.rotulo" /></span>}
    {gesto?.tipo === "come" && <span key={`nam-${gesto.desde}`} className="casa-nam"><Texto clave="casa.comida.nam.rotulo" /></span>}
    {gesto?.tipo === "caricia" && <span className="casa-conejo-nombre texto-noa pequeno" role="status">{nombre}</span>}
  </button>;
};

export const ConejosCasa = memo(function ConejosCasa({ ref, visible, vista, noche, onBaja }: Props) {
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
    // Fuera del jardín, el juego se acaba sin más.
    if (!visible) { poner(abandonar(actualRef.current, performance.now(), Math.random)); return; }
    let fotograma = requestAnimationFrame(function paso() {
      const antes = actualRef.current.vista;
      const { madriguera: nueva } = avanzar(actualRef.current, performance.now(), Math.random);
      poner(nueva);
      if (antes === "arriba" && nueva.vista === "abajo") onBaja();
      fotograma = requestAnimationFrame(paso);
    });
    return () => cancelAnimationFrame(fotograma);
  }, [visible, poner, onBaja]);

  const caricia = useCallback((id: ConejoId) => aplicar(acariciar(actualRef.current, id, performance.now())), [aplicar]);
  const llamar = (cueva: CuevaId) => aplicar(tocarCueva(actualRef.current, cueva, Math.random));
  const jugar = () => aplicar(tocarAgujero(actualRef.current, performance.now(), Math.random));
  const buscarEn = (sitio: SitioConejo) => aplicar(tocarEscondite(actualRef.current, sitio, performance.now()));
  const dar = (id: ConejoId | null) => { if (id) aplicar(darZanahoria(actualRef.current, id, performance.now())); };

  useImperativeHandle(ref, () => ({
    tocar: (punto) => {
      const id = conejoEn(actualRef.current, enLosPies(punto));
      if (id) return caricia(id);
      const actual = actualRef.current;
      if (actual.busqueda?.fase === "buscan") {
        const sitio = SITIOS.find((s) => cerca(ESCONDITES_CONEJO[s], punto));
        return sitio ? buscarEn(sitio) : false;
      }
      if (actual.vista === "arriba") return cerca(AGUJERO, punto) && jugar();
      const cueva = cuevaEn(punto);
      if (!cueva) return false;
      aplicar(tocarCueva(actualRef.current, cueva, Math.random));
      return true;
    },
    zanahoria: (punto) => dar(conejoEn(actualRef.current, enLosPies(punto))),
    zanahoriaAlCercano: (x) => dar(conejoCercano(actualRef.current, { x, y: 500 })),
    entrando: () => actualRef.current.busqueda?.fase === "entran",
  }));

  if (!visible) return null;
  const { busqueda, movido } = madriguera;
  const buscando = busqueda?.fase === "buscan";
  const escondido = (id: ConejoId) => busqueda !== null && busqueda.fase !== "entran" && !busqueda.encontrados.includes(id);
  const senalado = pista(madriguera, madriguera.ultimo);
  return <>
    {vista === "arriba" && !noche && !busqueda && <button type="button" className="casa-agujero" aria-label={tClave("casa.madriguera.agujero.oculto")}
      style={{ left: AGUJERO.x, top: AGUJERO.y }} onClick={(event) => { if (event.detail === 0) jugar(); }} />}
    {/* Los escondites: las orejas del escondido asoman por detrás. */}
    {SITIOS.map((sitio) => {
      const { x, y } = ESCONDITES_CONEJO[sitio];
      const dentro = busqueda && CONEJOS.find((id) => busqueda.sitios[id] === sitio && escondido(id));
      const clase = `casa-escondite${movido?.sitio === sitio ? " is-movido" : ""}`;
      const dibujo = <>{dentro && <Orejas id={dentro} />}<svg className="casa-escondite-dibujo" viewBox="0 0 100 70" stroke={TINTA} strokeWidth="3" strokeLinejoin="round" aria-hidden="true">{DIBUJO_SITIO[sitio]}</svg></>;
      return buscando
        ? <button key={sitio} type="button" className={clase} style={{ left: x, top: y }} aria-label={tClave(`casa.madriguera.escondite.${sitio}.oculto`)}
          onClick={(event) => { if (event.detail === 0) buscarEn(sitio); }}>{dibujo}</button>
        : <span key={sitio} className={clase} style={{ left: x, top: y }} aria-hidden="true">{dibujo}</span>;
    })}
    {senalado && <svg className="casa-pista-conejo" viewBox="0 0 40 40" role="img" aria-label={tClave("casa.madriguera.pista.oculto")}
      style={{ left: ESCONDITES_CONEJO[senalado].x, top: ESCONDITES_CONEJO[senalado].y - 90 }}><path d="M13 4h14v16h9L20 37 4 20h9z" fill="#ffd76a" stroke={TINTA} strokeWidth="3" /></svg>}
    {vista === "abajo" && !busqueda && CUEVAS.map((cueva) => <button key={cueva} type="button" className="casa-cueva" aria-label={tClave(`casa.madriguera.cueva.${cueva}.oculto`)}
      style={{ left: NODOS_TUNEL[cueva].x - CAJA_CUEVA.ancho / 2, top: NODOS_TUNEL[cueva].y - CAJA_CUEVA.alto / 2, width: CAJA_CUEVA.ancho, height: CAJA_CUEVA.alto }}
      onClick={(event) => { if (event.detail === 0) llamar(cueva); }} />)}
    {madriguera.conejos.filter((conejo) => !escondido(conejo.id)).map((conejo) => <DibujoConejo key={conejo.id} conejo={conejo} enVista={conejo.nivel === vista}
      encontrado={busqueda?.encontrados.includes(conejo.id) ?? false} celebra={busqueda?.fase === "celebran"} onAcariciar={() => caricia(conejo.id)} />)}
    {busqueda?.fase === "celebran" && <p className="casa-conejos-bravo texto-noa" role="status" style={{ left: CORTE.x + CORTE.ancho / 2, top: CORTE.y + 330 }}><Texto clave="casa.madriguera.bravo.rotulo" /></p>}
  </>;
});
