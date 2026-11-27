import "../textos/zonas/casa";
import { memo, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import {
  abrirPuerta, arrastrar, asomoEnCasita, avanzar, CAMINOS, coger, COSAS, crearJaula, CUBOS, DIBUJO, ESCONDITES, estrenar, fugadoEn, GRACIA_MS, guardadoDe, NODOS, parado, pista, PUERTA_JAULA,
  queHayEn, RACIONES, rellenar, REPISA, SITIO_JAULA, soltar, tocarCosa, tocarHamster, tocarTubo,
  type Cosa, type EsconditeId, type Hamster, type HamsterId, type HamstersProgress, type Jaula, type Punto, type Salida, type SonidoJaula,
} from "./casaHamsters";
import {
  AGUA_EN_BOTELLA, ARTE_JAULA, ASOMADO, CAJA_JAULA, cajaDeHamster, CELDA_OBJETO, COLOCADOS, CUADRO_HAMSTER, EJE_COLUMPIO, EJE_RUEDA, FONDO_JAULA,
  OBJETOS_JAULA, POSES, casitaDe, type Colocado, type Pose,
} from "./casaHamstersArte";
import { HABITACION_CASA } from "./casaHabitacion";
import type { ColoresTubos, Version } from "./casaDecoracion";
import { tClave } from "../textos/index.ts";

/** Lo que la casa le pide a la jaula; los puntos van en px de escena. */
export type MandosJaula = {
  /** Un toque sin mover el dedo. */
  tocar: (punto: Punto) => void;
  /** Coge al hámster escapado que haya bajo el dedo; `false` si no hay ninguno. */
  coger: (punto: Punto) => boolean;
  mover: (punto: Punto) => void;
  soltar: () => void;
  rellenar: (cual: "comida" | "agua") => void;
  /** Se ha cambiado una parte al decorar: un hámster va a verla. */
  estrenar: (parte: "casita" | "baseJaula" | "tubos") => void;
};

type Props = {
  ref: Ref<MandosJaula>;
  guardado: HamstersProgress | undefined;
  /** Se ve (en la habitación); en el jardín la jaula sigue como estaba, parada. */
  visible: boolean;
  reduceMotion: boolean;
  onGuardar: (hamsters: HamstersProgress) => void;
  onSonido: (sonido: SonidoJaula) => void;
  /** El escondite que hay que señalar, tras un rato sin encontrarlo, o `null`. */
  onPista: (escondite: EsconditeId | null) => void;
  /** Un hámster se escapa o vuelve. */
  onAviso: (aviso: "escapa" | "vuelve") => void;
  /** El dibujo de la jaula (base y tejado) y el juego de tubos elegidos al decorar. */
  base: string;
  tubos: ColoresTubos;
  /** La casita elegida. */
  casita: Version;
};

const NOMBRE_MS = 1400;

const camino = (linea: readonly Punto[]) => linea.map((p) => `${p.x},${p.y}`).join(" ");

/** Un cuadro de la hoja de un hámster, con el centro del hámster en el origen y mirando a la derecha. */
function Cuerpo({ id, pose }: { id: HamsterId; pose: Pose }) {
  const caja = cajaDeHamster(id);
  return <svg x={caja.x} y={caja.y} width={caja.ancho} height={caja.alto} viewBox={`${POSES.indexOf(pose) * CUADRO_HAMSTER.ancho} 0 ${CUADRO_HAMSTER.ancho} ${CUADRO_HAMSTER.alto}`}>
    <image href={ARTE_JAULA.hamsters[id]} width={CUADRO_HAMSTER.ancho * POSES.length} height={CUADRO_HAMSTER.alto} />
  </svg>;
}

/** Qué cuadro toca según lo que hace. */
function poseDe({ hace, camino: tramo, fuera }: Hamster, ahora: number, quieto: boolean): Pose {
  if (fuera?.fase === "cogido") return "cogido";
  if (fuera?.fase === "escondido") return "asomado";
  if (hace === "comida") return "comiendo";
  if (hace === "agua") return "bebiendo";
  const anda = tramo !== null || fuera?.fase === "corre" || hace === "rueda";
  if (!anda) return "sentado";
  return !quieto && Math.floor(ahora / (hace === "rueda" ? 90 : 160)) % 2 ? "andarB" : "andarA";
}

/** El cuadro en el que cada uno está de pie sobre las patas de atrás. */
const DE_PIE: Readonly<Record<HamsterId, Pose>> = { perla: "cogido", bolita: "comiendo" };
/** El centro del cuadro «dormido» (hecho una bola), sobre el que da la voltereta, respecto al centro del hámster. */
const CENTRO_BOLA = -2;

/** Cuánto va de la gracia, de 0 a 1; con movimiento tranquilo, quieto en la mitad. */
const avance = (desde: number, ahora: number, quieto: boolean) => (quieto ? 0.5 : Math.min(1, Math.max(0, (ahora - desde) / GRACIA_MS)));

/** De pie, dando dos saltitos o una voltereta; mira a la derecha, con el centro del hámster en el origen. */
function EnGracia({ hamster, ahora, quieto }: { hamster: Hamster; ahora: number; quieto: boolean }) {
  const { tipo, desde } = hamster.gracia!;
  const t = avance(desde, ahora, quieto);
  if (tipo === "voltereta" && !quieto && t < 0.6) {
    const u = t / 0.6;
    return <g transform={`translate(0,${-Math.sin(u * Math.PI) * 34}) rotate(${u * 360} 0 ${CENTRO_BOLA})`}><Cuerpo id={hamster.id} pose="dormido" /></g>;
  }
  const salto = tipo === "salto" && !quieto && t < 0.6 ? Math.abs(Math.sin(t / 0.6 * 2 * Math.PI)) * 24 : 0;
  return <g transform={`translate(0,${-salto})`}><Cuerpo id={hamster.id} pose={DE_PIE[hamster.id]} /></g>;
}

/** Los corazones (o las estrellas de la voltereta) que suben desde el hámster, por delante de todo. */
function Efectos({ hamster, ahora, quieto }: { hamster: Hamster; ahora: number; quieto: boolean }) {
  const { tipo, desde } = hamster.gracia!;
  const t = avance(desde, ahora, quieto);
  const donde = tipo === "voltereta" ? [-30, 0, 30] : tipo === "salto" ? [-18, 18] : [0];
  return <g transform={`translate(${hamster.x},${hamster.y - 76 - t * 24})`} opacity={Math.min(1, (1 - t) * 3)} stroke="#2f1d33" strokeWidth="3" strokeLinejoin="round">
    {donde.map((x) => <g key={x} transform={`translate(${x},${x ? 6 : 0})`}>
      {tipo === "voltereta"
        ? <path d="M0,-13 L4,-4 L13,-3 L6,3 L8,12 L0,7 L-8,12 L-6,3 L-13,-3 L-4,-4 Z" fill="#ffd23f" />
        : <path d="M0,11 C-22,-4 -11,-19 0,-7 C11,-19 22,-4 0,11 Z" fill="#ff5c8a" />}
    </g>)}
  </g>;
}

function Dibujado({ hamster, ahora, quieto }: { hamster: Hamster; ahora: number; quieto: boolean }) {
  const { x, y, angulo, hace, fuera } = hamster;
  const izquierda = Math.cos(angulo * Math.PI / 180) < -0.01;
  let [px, py, giro, espejo] = [x, y, angulo, izquierda];
  if (hace === "rueda") [py, giro, espejo] = [y - 14, 0, false];
  if (hace === "columpio") [py, giro, espejo] = [y - 16, 0, false];
  if (hace === "comida") [px, giro, espejo] = [x - 28, 0, false];
  if (hace === "agua") [px, giro, espejo] = [x - 14, 0, false];
  if (fuera?.fase === "cogido") [giro, espejo] = [0, false];
  if (parado(hamster)) return <g transform={`translate(${px},${py}) scale(${espejo ? -1 : 1},1)`}><EnGracia hamster={hamster} ahora={ahora} quieto={quieto} /></g>;
  return <g transform={`translate(${px},${py})`}>
    <g transform={`rotate(${giro}) scale(1,${espejo ? -1 : 1})`}><Cuerpo id={hamster.id} pose={poseDe(hamster, ahora, quieto)} /></g>
  </g>;
}

/** Dentro de la casita: la cabeza y las manitas asoman por la puerta, subiendo desde el suelo. */
function EnLaCasita({ hamster, ahora, quieto, puerta }: { hamster: Hamster; ahora: number; quieto: boolean; puerta: { x: number; suelo: number } }) {
  const asomo = quieto ? 1 : asomoEnCasita(hamster.hasta - ahora);
  const escala = hamster.id === "perla" ? 0.74 : 0.68;
  const ancho = ASOMADO.ancho * escala;
  const alto = ASOMADO.alto * escala;
  const vaiven = quieto ? 0 : Math.sin(ahora / 260) * 1.5;
  // El recorte de este `svg` acaba en el suelo de la puerta: lo que aún no ha subido no se ve.
  return <svg x={puerta.x - ancho / 2 + vaiven} y={puerta.suelo - alto} width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`}>
    <svg y={alto * (1 - asomo)} width={ancho} height={alto}
      viewBox={`${POSES.indexOf("asomado") * CUADRO_HAMSTER.ancho + ASOMADO.x} ${ASOMADO.y} ${ASOMADO.ancho} ${ASOMADO.alto}`}>
      <image href={ARTE_JAULA.hamsters[hamster.id]} width={CUADRO_HAMSTER.ancho * POSES.length} height={CUADRO_HAMSTER.alto} />
    </svg>
  </svg>;
}

/** Una pieza de la hoja de objetos (o de otra hoja con celdas iguales). */
function Objeto({ de, hoja = ARTE_JAULA.objetos, celdas = OBJETOS_JAULA.length }: { de: Colocado; hoja?: string; celdas?: number }) {
  return <svg x={de.x} y={de.y} width={de.lado} height={de.lado} viewBox={`${de.celda * CELDA_OBJETO} 0 ${CELDA_OBJETO} ${CELDA_OBJETO}`}>
    <image href={hoja} width={CELDA_OBJETO * celdas} height={CELDA_OBJETO} />
  </svg>;
}

/** La jaula, con su base y su tejado en el color elegido, la repisa y las rampas. */
const Detras = memo(function Detras({ base }: { base: string }) {
  return <g>
    <rect x={FONDO_JAULA.x} y={FONDO_JAULA.y} width={FONDO_JAULA.ancho} height={FONDO_JAULA.alto} fill="#eaf6fc" opacity="0.65" />
    <image href={base} x={CAJA_JAULA.x} y={CAJA_JAULA.y} width={CAJA_JAULA.ancho} height={CAJA_JAULA.alto} preserveAspectRatio="none" />
    <rect x={REPISA.x} y={REPISA.y} width={REPISA.ancho} height="11" rx="5" fill="#f59ac0" stroke="#2f1d33" strokeWidth="2" />
    {CAMINOS.filter((c) => c.tipo === "rampa").map((c) => <g key={`${c.a}${c.b}`}>
      <line x1={NODOS[c.a].x} y1={NODOS[c.a].y + 17} x2={NODOS[c.b].x} y2={NODOS[c.b].y + 17} stroke="#2f1d33" strokeWidth="11" strokeLinecap="round" />
      <line x1={NODOS[c.a].x} y1={NODOS[c.a].y + 17} x2={NODOS[c.b].x} y2={NODOS[c.b].y + 17} stroke="#d99a55" strokeWidth="7" strokeLinecap="round" />
      <line x1={NODOS[c.a].x} y1={NODOS[c.a].y + 17} x2={NODOS[c.b].x} y2={NODOS[c.b].y + 17} stroke="#9a6430" strokeWidth="7" strokeDasharray="3 14" />
    </g>)}
  </g>;
});

/** Los tubos y los cubos: se dibujan encima de los hámsters, que se ven a través. */
const Delante = memo(function Delante({ tubos }: { tubos: ColoresTubos }) {
  return <g>
    {CAMINOS.filter((c) => c.tipo === "tubo").map((c, i) => {
      const color = tubos[c.color ?? "rojo"];
      const puntos = camino(c.linea);
      return <g key={i} fill="none" strokeLinejoin="round">
        <polyline points={puntos} stroke={color} strokeWidth="46" opacity="0.22" />
        <polyline points={puntos} stroke="#fff" strokeWidth="36" opacity="0.1" />
        <polyline points={puntos} stroke={color} strokeWidth="50" strokeDasharray="9 45" strokeDashoffset="-22" opacity="0.8" />
        <polyline points={puntos} stroke="#fff" strokeWidth="4" opacity="0.7" transform="translate(-9,-11)" />
        {[c.a, c.b].map((nodo) => <circle key={nodo} cx={NODOS[nodo].x} cy={NODOS[nodo].y} r="24" stroke={color} strokeWidth="6" />)}
      </g>;
    })}
    {CUBOS.map((id) => <g key={id} transform={`translate(${NODOS[id].x},${NODOS[id].y})`}>
      <rect x="-36" y="-36" width="72" height="72" rx="10" fill="#fff" fillOpacity="0.35" stroke="#8d9aa8" strokeWidth="3" />
      {[[-16, -41, 32, 10, tubos.rojo], [-16, 31, 32, 10, tubos.azul], [-41, -16, 10, 32, tubos.amarillo], [31, -16, 10, 32, tubos.azul]].map(([x, y, w, h, color]) =>
        <rect key={`${x},${y}`} x={x} y={y} width={w} height={h} rx="3" fill={String(color)} />)}
    </g>)}
  </g>;
});

/** Lo que hay dentro de la jaula y se mueve o se vacía. */
function Cosas({ jaula, ahora, quieto }: { jaula: Jaula; ahora: number; quieto: boolean }) {
  const usa = (cosa: Cosa) => jaula.hamsters.some((h) => !h.fuera && h.hace === cosa && !parado(h));
  const vueltas = usa("rueda") && !quieto ? -ahora / 3 % 360 : 0;
  const vaiven = usa("columpio") && !quieto ? Math.sin(ahora / 380) * 18 : 0;
  const alto = AGUA_EN_BOTELLA.alto * jaula.agua / RACIONES;
  const { botella } = COLOCADOS;
  const k = botella.lado / CELDA_OBJETO;
  const comida = NODOS[COSAS.comida];
  const agua = NODOS[COSAS.agua];
  return <g>
    <Objeto de={COLOCADOS.soporte} />
    <g transform={`rotate(${vueltas} ${EJE_RUEDA.x} ${EJE_RUEDA.y})`}><Objeto de={COLOCADOS.aro} /></g>
    <Objeto de={COLOCADOS.marco} />
    <g transform={`rotate(${vaiven} ${EJE_COLUMPIO.x} ${EJE_COLUMPIO.y})`}><Objeto de={COLOCADOS.asiento} /></g>
    <Objeto de={jaula.comida > 0 ? COLOCADOS.comidaLlena : COLOCADOS.comidaVacia} />
    <Objeto de={botella} />
    <rect x={botella.x + AGUA_EN_BOTELLA.x * k} y={botella.y + (AGUA_EN_BOTELLA.fondo - alto) * k} width={AGUA_EN_BOTELLA.ancho * k} height={alto * k} rx="4" fill="#4fb4e8" opacity="0.65" />
    {jaula.comida === 0 && <g transform={`translate(${comida.x},${comida.y - 20})`} stroke="#2f1d33" strokeWidth="1.5"><circle r="14" fill="#fff8e9" /><circle cx="-4" cy="2" r="4" fill="#d9a441" /><circle cx="4" cy="-3" r="4" fill="#d9a441" /></g>}
    {jaula.agua === 0 && <g transform={`translate(${agua.x + 30},${agua.y - 90})`} stroke="#2f1d33" strokeWidth="1.5"><circle r="14" fill="#fff8e9" /><path d="M0,-9 C7,0 7,7 0,7 C-7,7 -7,0 0,-9 Z" fill="#6cc4ee" /></g>}
  </g>;
}

/**
 * La jaula de hámsters de la habitación (`docs/casa/jaula-hamsters.md`): lleva el reloj, dibuja y obedece los mandos de
 * la casa; las reglas están en `casaHamsters.ts`. Fuera de la jaula, el hámster se dibuja en una capa por encima de la
 * habitación entera.
 */
export function JaulaHamsters({ ref, guardado, visible, reduceMotion, onGuardar, onSonido, onPista, onAviso, base, tubos, casita }: Props) {
  const [jaula, setJaula] = useState<Jaula>(() => crearJaula(guardado, performance.now(), Math.random));
  const [ahora, setAhora] = useState(() => performance.now());
  const [nombrado, setNombrado] = useState<{ id: HamsterId; hasta: number } | null>(null);
  const jaulaRef = useRef(jaula);
  const cogidoRef = useRef<HamsterId | null>(null);
  const pistaRef = useRef<EsconditeId | null>(null);
  const avisosRef = useRef({ onGuardar, onSonido, onPista, onAviso });
  useEffect(() => { avisosRef.current = { onGuardar, onSonido, onPista, onAviso }; });

  /** Da por buena la jaula nueva y cuenta fuera lo que ha pasado. */
  const meter = ({ jaula: nueva, sonidos }: Salida) => {
    const antes = jaulaRef.current;
    jaulaRef.current = nueva;
    setJaula(nueva);
    const avisos = avisosRef.current;
    for (const sonido of sonidos) {
      avisos.onSonido(sonido);
      if (sonido === "escapa" || sonido === "vuelve") avisos.onAviso(sonido);
    }
    if (nueva.comida !== antes.comida || nueva.agua !== antes.agua) avisos.onGuardar(guardadoDe(nueva));
    const senalado = pista(nueva, performance.now());
    if (senalado !== pistaRef.current) {
      pistaRef.current = senalado;
      avisos.onPista(senalado);
    }
  };
  const meterRef = useRef(meter);
  useEffect(() => { meterRef.current = meter; });

  // El reloj de la jaula: para en el jardín (y el navegador lo para con la pestaña oculta).
  useEffect(() => {
    if (!visible) return;
    let cuadro = 0;
    const paso = (momento: number) => {
      meterRef.current(avanzar(jaulaRef.current, momento, Math.random));
      setAhora(momento);
      cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [visible]);

  useImperativeHandle(ref, () => ({
    tocar: (punto) => {
      const momento = performance.now();
      const actual = jaulaRef.current;
      const tocado = queHayEn(actual, punto);
      if (!tocado) return;
      if (tocado.tipo === "puerta") meterRef.current(abrirPuerta(actual, momento, Math.random));
      else if (tocado.tipo === "cosa") meterRef.current(tocarCosa(actual, tocado.cosa, momento, Math.random));
      else if (tocado.tipo === "tubo") meterRef.current(tocarTubo(actual, tocado.indice, momento, Math.random));
      else {
        setNombrado({ id: tocado.id, hasta: momento + NOMBRE_MS });
        meterRef.current(tocarHamster(actual, tocado.id, momento));
      }
    },
    coger: (punto) => {
      const id = fugadoEn(jaulaRef.current, punto);
      if (!id) return false;
      cogidoRef.current = id;
      const cogido = coger(jaulaRef.current, id, performance.now());
      meterRef.current({ jaula: arrastrar(cogido.jaula, id, punto), sonidos: cogido.sonidos });
      return true;
    },
    mover: (punto) => {
      if (cogidoRef.current) meterRef.current({ jaula: arrastrar(jaulaRef.current, cogidoRef.current, punto), sonidos: [] });
    },
    soltar: () => {
      const id = cogidoRef.current;
      cogidoRef.current = null;
      if (id) meterRef.current(soltar(jaulaRef.current, id, performance.now(), Math.random));
    },
    rellenar: (cual) => meterRef.current(rellenar(jaulaRef.current, cual)),
    estrenar: (parte) => meterRef.current(estrenar(jaulaRef.current, parte, performance.now(), Math.random)),
  }), []);

  const laCasita = casitaDe(casita);
  const dentro = jaula.hamsters.filter((h) => !h.fuera);
  const fuera = jaula.hamsters.filter((h) => h.fuera);
  const conNombre = nombrado && nombrado.hasta > ahora ? dentro.find((h) => h.id === nombrado.id) : undefined;
  const { ampliacion, ancho, alto } = HABITACION_CASA;

  return <>
    <svg className="casa-jaula" role="img" aria-label={tClave("casa.hamsters.jaula.oculto")} viewBox={`${DIBUJO.x} ${DIBUJO.y} ${DIBUJO.ancho} ${DIBUJO.alto}`}
      style={{ left: SITIO_JAULA.left, top: SITIO_JAULA.top, width: DIBUJO.ancho * SITIO_JAULA.escala, height: DIBUJO.alto * SITIO_JAULA.escala, display: visible ? undefined : "none" }}>
      <Detras base={base} />
      <Cosas jaula={jaula} ahora={ahora} quieto={reduceMotion} />
      {dentro.filter((h) => h.hace !== "casita").map((h) => <Dibujado key={h.id} hamster={h} ahora={ahora} quieto={reduceMotion} />)}
      <Delante tubos={tubos} />
      {/* La casita, por delante de los tubos: si no, la boca del tubo rojo tapa la puerta. */}
      <Objeto de={laCasita.colocado} hoja={laCasita.hoja} celdas={laCasita.celdas} />
      {dentro.filter((h) => h.hace === "casita").map((h) => <EnLaCasita key={h.id} hamster={h} ahora={ahora} quieto={reduceMotion} puerta={laCasita.puerta} />)}
      <g transform={`translate(${PUERTA_JAULA.x},${PUERTA_JAULA.y + (jaula.puertaAbierta ? PUERTA_JAULA.alto : 0)}) scale(1,${jaula.puertaAbierta ? 0.55 : -1}) translate(0,${jaula.puertaAbierta ? 0 : -PUERTA_JAULA.alto})`}>
        <rect width={PUERTA_JAULA.ancho} height={PUERTA_JAULA.alto} rx="8" fill="#fff" fillOpacity="0.25" stroke="#ff8a3d" strokeWidth="6" />
        <circle cx={PUERTA_JAULA.ancho / 2} cy={PUERTA_JAULA.alto - 12} r="7" fill="#ff8a3d" />
      </g>
      {dentro.filter((h) => h.gracia).map((h) => <Efectos key={h.id} hamster={h} ahora={ahora} quieto={reduceMotion} />)}
      {conNombre && <text x={conNombre.x} y={conNombre.y - (conNombre.gracia ? 50 : 32)} textAnchor="middle" className="casa-jaula-nombre">{tClave(`casa.hamsters.${conNombre.id}.rotulo`)}</text>}
    </svg>
    {visible && fuera.length > 0 && <svg className="casa-fugados" aria-hidden="true" viewBox={`${-ampliacion} 0 ${ampliacion + ancho} ${alto}`} style={{ left: -ampliacion, top: 0, width: ampliacion + ancho, height: alto }}>
      {fuera.map((h) => h.fuera!.fase === "escondido"
        // Escondido asoma la cabeza y las manitas por donde está.
        ? <g key={h.id} transform={`translate(${ESCONDITES[h.fuera!.escondite].x},${ESCONDITES[h.fuera!.escondite].y - 16})`}><Cuerpo id={h.id} pose="asomado" /></g>
        : <g key={h.id} className={h.fuera!.fase === "cogido" ? "is-cogido" : undefined}>
            <Dibujado hamster={h} ahora={ahora} quieto={reduceMotion} />
          </g>)}
    </svg>}
  </>;
}
