import "../textos/zonas/casa";
import { memo, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import {
  abrirPuerta, arrastrar, avanzar, CAMINOS, coger, COSAS, crearJaula, CUBOS, DIBUJO, ESCONDITES, fugadoEn, guardadoDe, NODOS, pista, PUERTA_JAULA,
  queHayEn, REJA, rellenar, REPISA, SITIO_JAULA, soltar, tocarCosa, tocarTubo,
  type ColorTubo, type Cosa, type EsconditeId, type Hamster, type HamsterId, type HamstersProgress, type Jaula, type Punto, type Salida, type SonidoJaula,
} from "./casaHamsters";
import { HABITACION_CASA } from "./casaHabitacion";
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
};

const TUBO: Readonly<Record<ColorTubo, string>> = { rojo: "#ef5b6b", azul: "#35a9e0", amarillo: "#f4c22b" };
const PELO: Readonly<Record<HamsterId, { color: string; claro: string; oreja: number; escala: number; cola: number }>> = {
  perla: { color: "#b8763b", claro: "#fff3e2", oreja: 7.5, escala: 1.18, cola: 5 },
  bolita: { color: "#9aa0aa", claro: "#f6f6f8", oreja: 4.5, escala: 0.98, cola: 3 },
};
const NOMBRE_MS = 1400;

const camino = (linea: readonly Punto[]) => linea.map((p) => `${p.x},${p.y}`).join(" ");

/** El hámster dibujado en el origen, mirando a la derecha (arte provisional hasta el de verdad). */
const Cuerpo = memo(function Cuerpo({ id }: { id: HamsterId }) {
  const { color, claro, oreja, escala, cola } = PELO[id];
  return <g transform={`scale(${escala})`} stroke="#2f1d33" strokeWidth="1">
    <circle cx="-23" cy="4" r={cola} fill={claro} />
    <ellipse cx="-12" cy="15" rx="6" ry="3.5" fill="#f0b4a4" />
    <ellipse cx="10" cy="15" rx="6" ry="3.5" fill="#f0b4a4" />
    <ellipse cx="-3" cy="2" rx="22" ry="15" fill={color} />
    <ellipse cx="0" cy="9" rx="16" ry="7.5" fill={claro} stroke="none" />
    {[11, 23].map((x) => <g key={x}><circle cx={x} cy="-15" r={oreja} fill={color} /><circle cx={x} cy="-15" r={oreja * 0.55} fill="#f2aea4" stroke="none" /></g>)}
    <circle cx="16" cy="-3" r="13" fill={color} />
    <ellipse cx="21" cy="3" rx="9" ry="6.5" fill={claro} stroke="none" />
    <circle cx="20" cy="-7" r="3" fill="#1c1815" />
    <circle cx="21" cy="-8" r="1.1" fill="#fff" stroke="none" />
    <circle cx="29" cy="0" r="2.2" fill="#e0707c" stroke="none" />
  </g>;
});

function Dibujado({ hamster, ahora, quieto }: { hamster: Hamster; ahora: number; quieto: boolean }) {
  const { x, y, angulo, hace, camino: tramo, fuera } = hamster;
  const izquierda = Math.cos(angulo * Math.PI / 180) < -0.01;
  const anda = tramo !== null || fuera?.fase === "corre" || hace === "rueda";
  const salto = quieto || !anda ? 0 : -Math.abs(Math.sin(ahora / 70)) * 3;
  let [px, py, giro] = [x, y, angulo];
  if (hace === "rueda") [py, giro] = [y - 8, 0];
  if (hace === "columpio") [py, giro] = [y - 8, 0];
  if (hace === "comida" || hace === "agua") [px, giro] = [x - 8, (hace === "comida" ? 10 : -12) + (quieto ? 0 : Math.sin(ahora / 110) * 7)];
  const escondida = hace === "casita" && hamster.hasta - ahora > 1500;
  return <g transform={`translate(${px},${py + salto})`} opacity={escondida ? 0 : 1}>
    <g transform={`rotate(${giro}) scale(1,${izquierda ? -1 : 1})`}><Cuerpo id={hamster.id} /></g>
  </g>;
}

/** Reja del fondo, bandeja, repisa y rampas: no cambian. */
const Detras = memo(function Detras() {
  const { x0, y0, x1, y1 } = REJA;
  const medio = (x0 + x1) / 2;
  return <g>
    <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0 - 30} fill="#eaf6fc" opacity="0.8" />
    {Array.from({ length: Math.floor((x1 - x0) / 16) + 1 }, (_, i) => <line key={`v${i}`} x1={x0 + i * 16} y1={y0} x2={x0 + i * 16} y2={y1 - 40} stroke="#8cc4e6" strokeWidth="1.5" />)}
    {Array.from({ length: 8 }, (_, i) => <line key={`h${i}`} x1={x0} y1={y0 + i * 40} x2={x1} y2={y0 + i * 40} stroke="#8cc4e6" strokeWidth="1.5" />)}
    {[[x0, medio], [medio, x1]].map(([a, b]) => <polyline key={a} points={`${a - 14},${y0 + 6} ${(a + b) / 2},${y0 - 34} ${b + 14},${y0 + 6}`} fill="none" stroke="#2f86c9" strokeWidth="7" strokeLinejoin="round" />)}
    <rect x={REPISA.x} y={REPISA.y} width={REPISA.ancho} height="11" rx="5" fill="#f59ac0" stroke="#d96c9a" strokeWidth="2" />
    {CAMINOS.filter((c) => c.tipo === "rampa").map((c) => <g key={`${c.a}${c.b}`}>
      <line x1={NODOS[c.a].x} y1={NODOS[c.a].y + 17} x2={NODOS[c.b].x} y2={NODOS[c.b].y + 17} stroke="#2f86c9" strokeWidth="9" strokeLinecap="round" />
      <line x1={NODOS[c.a].x} y1={NODOS[c.a].y + 17} x2={NODOS[c.b].x} y2={NODOS[c.b].y + 17} stroke="#a8dcf7" strokeWidth="9" strokeDasharray="3 14" />
    </g>)}
    <rect x={x0 - 8} y={y1 - 45} width={x1 - x0 + 16} height="45" rx="12" fill="#3d9be0" stroke="#2f1d33" strokeWidth="3" />
    <rect x={x0} y={y1 - 45} width={x1 - x0} height="10" fill="#e7cb8f" />
  </g>;
});

/** La reja de delante, los tubos y los cubos: se dibujan encima de los hámsters, que se ven a través. */
const Delante = memo(function Delante() {
  const { x0, y0, x1, y1 } = REJA;
  return <g>
    {Array.from({ length: Math.floor((x1 - x0) / 48) + 1 }, (_, i) => <line key={i} x1={x0 + i * 48} y1={y0} x2={x0 + i * 48} y2={y1 - 45} stroke="#2f86c9" strokeWidth="2" opacity="0.55" />)}
    <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0 - 45} fill="none" stroke="#2f86c9" strokeWidth="6" />
    {CAMINOS.filter((c) => c.tipo === "tubo").map((c, i) => {
      const color = TUBO[c.color ?? "rojo"];
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
      {[[-16, -41, 32, 10, TUBO.rojo], [-16, 31, 32, 10, TUBO.azul], [-41, -16, 10, 32, TUBO.amarillo], [31, -16, 10, 32, TUBO.azul]].map(([x, y, w, h, color]) =>
        <rect key={`${x},${y}`} x={x} y={y} width={w} height={h} rx="3" fill={String(color)} />)}
    </g>)}
  </g>;
});

const en = (cosa: Cosa) => NODOS[COSAS[cosa]];

/** Lo que hay dentro de la jaula y se mueve o se vacía. */
function Cosas({ jaula, ahora, quieto }: { jaula: Jaula; ahora: number; quieto: boolean }) {
  const usa = (cosa: Cosa) => jaula.hamsters.some((h) => !h.fuera && h.hace === cosa);
  const [rueda, columpio, comida, agua] = [en("rueda"), en("columpio"), en("comida"), en("agua")];
  const vueltas = usa("rueda") && !quieto ? -ahora / 3 % 360 : 0;
  const vaiven = usa("columpio") && !quieto ? Math.sin(ahora / 380) * 18 : 0;
  const alto = 52 * jaula.agua / 3;
  return <g stroke="#2f1d33" strokeWidth="1.5">
    <g transform={`translate(${rueda.x},${rueda.y})`}>
      <path d="M-20,17 L0,-20 L20,17" fill="none" stroke="#6f4fa8" strokeWidth="6" />
      <circle cy="-20" r="40" fill="#c9a9ee" fillOpacity="0.55" stroke="#8a62c9" strokeWidth="7" />
      <g transform={`rotate(${vueltas} 0 -20)`}>
        {Array.from({ length: 8 }, (_, a) => <line key={a} x1="0" y1="-20" x2={36 * Math.cos(a * Math.PI / 4)} y2={-20 + 36 * Math.sin(a * Math.PI / 4)} stroke="#8a62c9" strokeWidth="3" />)}
      </g>
    </g>
    <g transform={`translate(${columpio.x},${columpio.y})`}>
      <path d="M-36,18 L-28,-58 L28,-58 L36,18" fill="none" stroke="#a9753f" strokeWidth="5" />
      <g transform={`rotate(${vaiven} 0 -56)`}>
        <path d="M-20,15 L0,-56 L20,15" fill="none" stroke="#888" strokeWidth="2" />
        <rect x="-25" y="13" width="50" height="8" rx="4" fill="#f4c22b" />
      </g>
    </g>
    <g transform={`translate(${comida.x},${comida.y})`}>
      {Array.from({ length: jaula.comida * 4 }, (_, i) => <circle key={i} cx={-15 + (i % 6) * 6} cy={7 - Math.floor(i / 6) * 5} r="3.5" fill="#d9a441" />)}
      <path d="M-24,8 L24,8 L18,19 L-18,19 Z" fill="#ff8a4c" />
      {jaula.comida === 0 && <g transform="translate(0,-26)"><circle r="14" fill="#fff8e9" /><circle cx="-4" cy="2" r="4" fill="#d9a441" /><circle cx="4" cy="-3" r="4" fill="#d9a441" /></g>}
    </g>
    <g transform={`translate(${agua.x},${agua.y})`}>
      <rect x="12" y="-72" width="24" height="58" rx="8" fill="#fff" stroke="#2d9c6a" strokeWidth="3" />
      <rect x="15" y={-17 - alto} width="18" height={alto} rx="5" fill="#6cc4ee" stroke="none" />
      <path d="M24,-14 L24,-6 L12,0" fill="none" stroke="#8d99a6" strokeWidth="5" />
      {jaula.agua === 0 && <g transform="translate(24,-90)"><circle r="14" fill="#fff8e9" /><path d="M0,-9 C7,0 7,7 0,7 C-7,7 -7,0 0,-9 Z" fill="#6cc4ee" /></g>}
    </g>
  </g>;
}

/** La casita va delante de los hámsters, que se meten dentro. */
function Casita() {
  const { x, y } = en("casita");
  return <g transform={`translate(${x},${y})`} stroke="#2f1d33" strokeWidth="1.5">
    <rect x="-34" y="-18" width="68" height="35" fill="#fff" />
    <polygon points="-40,-16 -22,-42 22,-42 40,-16" fill="#2f86c9" />
    <path d="M-12,17 L-12,2 Q0,-12 12,2 L12,17 Z" fill="#5a3b25" />
  </g>;
}

/**
 * La jaula de hámsters de la habitación (`docs/casa/jaula-hamsters.md`): lleva el reloj, dibuja y obedece los mandos de
 * la casa; las reglas están en `casaHamsters.ts`. Fuera de la jaula, el hámster se dibuja en una capa por encima de la
 * habitación entera.
 */
export function JaulaHamsters({ ref, guardado, visible, reduceMotion, onGuardar, onSonido, onPista, onAviso }: Props) {
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
        avisosRef.current.onSonido("hamster");
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
  }), []);

  const dentro = jaula.hamsters.filter((h) => !h.fuera);
  const fuera = jaula.hamsters.filter((h) => h.fuera);
  const conNombre = nombrado && nombrado.hasta > ahora ? dentro.find((h) => h.id === nombrado.id) : undefined;
  const { ampliacion, ancho, alto } = HABITACION_CASA;

  return <>
    <svg className="casa-jaula" role="img" aria-label={tClave("casa.hamsters.jaula.oculto")} viewBox={`${DIBUJO.x} ${DIBUJO.y} ${DIBUJO.ancho} ${DIBUJO.alto}`}
      style={{ left: SITIO_JAULA.left, top: SITIO_JAULA.top, width: DIBUJO.ancho * SITIO_JAULA.escala, height: DIBUJO.alto * SITIO_JAULA.escala, display: visible ? undefined : "none" }}>
      <Detras />
      <Cosas jaula={jaula} ahora={ahora} quieto={reduceMotion} />
      {dentro.map((h) => <Dibujado key={h.id} hamster={h} ahora={ahora} quieto={reduceMotion} />)}
      <Casita />
      <Delante />
      <g transform={`translate(${PUERTA_JAULA.x},${PUERTA_JAULA.y + (jaula.puertaAbierta ? PUERTA_JAULA.alto : 0)}) scale(1,${jaula.puertaAbierta ? 0.55 : -1}) translate(0,${jaula.puertaAbierta ? 0 : -PUERTA_JAULA.alto})`}>
        <rect width={PUERTA_JAULA.ancho} height={PUERTA_JAULA.alto} rx="8" fill="#fff" fillOpacity="0.25" stroke="#ff8a3d" strokeWidth="6" />
        <circle cx={PUERTA_JAULA.ancho / 2} cy={PUERTA_JAULA.alto - 12} r="7" fill="#ff8a3d" />
      </g>
      {conNombre && <text x={conNombre.x} y={conNombre.y - 32} textAnchor="middle" className="casa-jaula-nombre">{tClave(`casa.hamsters.${conNombre.id}.rotulo`)}</text>}
    </svg>
    {visible && fuera.length > 0 && <svg className="casa-fugados" aria-hidden="true" viewBox={`${-ampliacion} 0 ${ampliacion + ancho} ${alto}`} style={{ left: -ampliacion, top: 0, width: ampliacion + ancho, height: alto }}>
      {fuera.map((h) => h.fuera!.fase === "escondido"
        // Escondido asoma las orejas y los ojos por donde está.
        ? <g key={h.id} transform={`translate(${ESCONDITES[h.fuera!.escondite].x},${ESCONDITES[h.fuera!.escondite].y - 12})`}>
            <clipPath id={`asoma-${h.id}`}><rect x="-40" y="-40" width="80" height="44" /></clipPath>
            <g clipPath={`url(#asoma-${h.id})`}><Cuerpo id={h.id} /></g>
          </g>
        : <g key={h.id} className={h.fuera!.fase === "cogido" ? "is-cogido" : undefined}>
            <Dibujado hamster={h.fuera!.fase === "cogido" ? { ...h, angulo: 0 } : h} ahora={ahora} quieto={reduceMotion} />
          </g>)}
    </svg>}
  </>;
}
