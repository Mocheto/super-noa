import "../textos/zonas/casa";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  apagarLuz, aspectoDe, avanzar, cambiarLuz, crearPecera, encenderLuz, llamar, OBJETO, PECERA, pezEn, posicionDe, soltarComida, tocarPez, zonaDe,
  type Entorno, type Pecera, type SonidoPecera, type TipoEfecto,
} from "./casaPecera";
import { cssAssetUrl } from "./assets";
import { tClave } from "../textos/index.ts";
import { PALETAS_GATITOS } from "./casaGatoArte";

/** Un toque sobre la pecera, en px de su dibujo; `id` distingue dos toques seguidos en el mismo sitio. */
export type ToquePecera = { id: number; x: number; y: number };

type Props = {
  /** El último toque de Noa sobre la pecera (la casa decide si el toque cae en ella). */
  toque: ToquePecera | null;
  /** De noche la pecera se apaga sola (duermen); Noa puede encender su luz y se ve brillar. */
  noche: boolean;
  /** Movimiento tranquilo: sin saltos ni volteretas. */
  reduceMotion: boolean;
  /** Dónde está (x del dibujo) el gatito que mira la pecera sentado delante, o `null`. */
  gatoMirando: number | null;
  onSonido: (sonido: SonidoPecera) => void;
  /** El dibujo del mueble, en el color elegido al decorar. */
  fondo: string;
  /** La capa del adorno elegido, entre el fondo y el cofre. */
  adorno: string;
  /** Decorando no se juega con la pecera: tampoco con el teclado. */
  decorando: boolean;
  /** El escondite del mueble: puertas abiertas, gatito de dentro (por su mundo) y si brilla porque Noa lleva uno. */
  escondite: { abierto: boolean; gatito: number | null; brilla: boolean };
  /** Con el teclado: abrir o cerrar las puertas y esconder un gatito (a la hora de dormir no hay botón). */
  onPuertas: () => void;
  onEsconder: (() => void) | null;
  /** Al llegar el foco del teclado a los botones del mueble, para llevar allí la vista. */
  onFocoMueble: () => void;
};

/** Tamaño en pantalla de cada objeto de la hoja (la hoja es de 48 px por cuadro): burbujas, gotas y copos, a la mitad; el resto, a ¾. */
const LADO_EFECTO: Readonly<Record<TipoEfecto, number>> = { burbuja: 24, corazon: 36, copo: 24, brillo: 36, zeta: 36, gota: 24 };
const CUADROS_OBJETO = 6;

const objetoEn = (indice: number, lado: number): CSSProperties => ({
  width: lado, height: lado, backgroundImage: cssAssetUrl(PECERA.objetos), backgroundSize: `${lado * CUADROS_OBJETO}px ${lado}px`, backgroundPosition: `${-indice * lado}px 0`,
});

/**
 * La pecera de la habitación (mapa «Pecera en la casa»): el mueble con sus cuatro peces, que nadan solos, se comen los
 * copos del bote, hacen su gracia al tocarlos y duermen con la luz apagada. Solo dibuja y lleva el reloj; las reglas
 * están en `casaPecera.ts`. Cada pez y cada efecto es un elemento propio para que se muevan con `transform`.
 */
export function PeceraCasa({ toque, noche, reduceMotion, gatoMirando, onSonido, fondo, adorno, decorando, escondite, onPuertas, onEsconder, onFocoMueble }: Props) {
  const [pecera, setPecera] = useState<Pecera>(() => crearPecera(performance.now()));
  const [ahora, setAhora] = useState(() => performance.now());
  const ref = useRef(pecera);
  const entornoRef = useRef<Entorno>({ azar: Math.random });
  const sonidoRef = useRef(onSonido);
  // Lo que cambia con la casa (movimiento tranquilo, gatito mirando, sonido) lo ve el reloj sin reiniciarse.
  useEffect(() => {
    entornoRef.current = { azar: Math.random, suave: reduceMotion, gatoMirando };
    sonidoRef.current = onSonido;
  }, [reduceMotion, gatoMirando, onSonido]);
  const ultimoToque = useRef<number | null>(toque?.id ?? null);

  const meter = (salida: { pecera: Pecera; sonidos: SonidoPecera[] }) => {
    ref.current = salida.pecera;
    setPecera(salida.pecera);
    salida.sonidos.forEach((sonido) => sonidoRef.current(sonido));
  };

  // El reloj: un cuadro tras otro mientras la casa está abierta (el navegador lo para con la pestaña oculta).
  useEffect(() => {
    let cuadro = 0;
    const paso = (momento: number) => {
      const salida = avanzar(ref.current, momento, entornoRef.current);
      ref.current = salida.pecera;
      salida.sonidos.forEach((sonido) => sonidoRef.current(sonido));
      setPecera(salida.pecera);
      setAhora(momento);
      cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, []);

  // De noche se apaga sola (los peces duermen); de día, encendida.
  useEffect(() => {
    const momento = performance.now();
    meter(noche ? apagarLuz(ref.current) : encenderLuz(ref.current, momento));
  }, [noche]);

  // Un toque nuevo: el bote da comida, el interruptor cambia la luz, un pez hace su gracia y el agua llama a los peces.
  useEffect(() => {
    if (!toque || toque.id === ultimoToque.current) return;
    ultimoToque.current = toque.id;
    const momento = performance.now();
    const actual = ref.current;
    const zona = zonaDe(toque.x, toque.y);
    if (zona === "bote") { meter(soltarComida(actual, momento, Math.random)); return; }
    if (zona === "interruptor") { meter(cambiarLuz(actual, momento)); return; }
    if (zona !== "agua") return;
    const pez = pezEn(actual, toque.x, toque.y, momento);
    meter(pez >= 0 ? tocarPez(actual, pez, momento, entornoRef.current) : llamar(actual, toque.x, toque.y, momento, Math.random));
  }, [toque]);

  const abierto = pecera.luz && pecera.peces.every((pez) => pez.llenoHasta > ahora);
  const claseLuz = pecera.luz ? (noche ? " is-brilla" : "") : " is-apagada";
  return (
    <div className={`casa-pecera${claseLuz}`} style={{ left: PECERA.left, top: PECERA.top, width: PECERA.ancho, height: PECERA.alto }}>
      <img className="casa-pecera-fondo" src={fondo} alt="" draggable={false} />
      <MuebleEscondite fondo={fondo} escondite={escondite} />
      <img className="casa-pecera-adorno" src={adorno} alt="" draggable={false} />
      {pecera.copos.filter((copo) => copo.comidoEn === null && ahora >= copo.nace).map((copo) => (
        <i key={copo.id} className="casa-pecera-copo" style={{ left: copo.x, top: copo.y, ...objetoEn(OBJETO.copo, 24) }} />
      ))}
      {/* El cofre se abre cuando todos los peces están llenos (la fiesta de los copos). */}
      <i className={`casa-pecera-cofre${abierto ? " is-abierto" : ""}`} style={{
        left: PECERA.cofre.izquierda, top: PECERA.cofre.arriba, width: PECERA.cofre.mostrar, height: PECERA.cofre.mostrar,
        backgroundImage: cssAssetUrl(PECERA.cofre.hoja), backgroundSize: `${2 * PECERA.cofre.mostrar}px ${PECERA.cofre.mostrar}px`,
      }} />
      {pecera.peces.map((pez, indice) => {
        const sitio = posicionDe(pez, ahora);
        const aspecto = aspectoDe(pez, ahora);
        const caballito = pez.especie === 4;
        const lado = PECERA.caballito.mostrar;
        const hoja: CSSProperties = caballito
          ? { width: lado, height: lado, backgroundImage: cssAssetUrl(PECERA.caballito.hoja), backgroundSize: `${5 * lado}px ${lado}px`, backgroundPosition: `${-aspecto.cuadro * lado}px 0px` }
          : { width: PECERA.cuadroPez.ancho, height: PECERA.cuadroPez.alto, backgroundImage: cssAssetUrl(PECERA.peces), backgroundPosition: `${-aspecto.cuadro * PECERA.cuadroPez.ancho}px ${-pez.especie * PECERA.cuadroPez.alto}px` };
        return (
          <i key={indice} className={`casa-pez is-${pez.accion}`} style={{
            left: sitio.x + aspecto.sacude, top: sitio.y, ...hoja,
            visibility: aspecto.visible ? "visible" : "hidden",
            transform: `translate(-50%, -50%) scaleX(${pez.mira}) rotate(${aspecto.giro}deg) scale(${aspecto.escala})`,
          }} />
        );
      })}
      <div className="casa-pecera-oscuro" />
      <div className="casa-pecera-luz" />
      <img className="casa-pecera-cristal" src={PECERA.cristal} alt="" draggable={false} />
      <i className="casa-pecera-led" />
      {pecera.efectos.filter((efecto) => ahora >= efecto.nace).map((efecto) => (
        <i key={efecto.id} className={`casa-pecera-efecto is-${efecto.tipo}`}
          style={{ left: efecto.x, top: efecto.y, "--dx": `${efecto.dx}px`, animationDuration: `${efecto.dura}ms`, ...objetoEn(OBJETO[efecto.tipo], LADO_EFECTO[efecto.tipo]) } as CSSProperties} />
      ))}
      {!decorando && <>
        <button type="button" className="casa-pecera-zona is-puertas" aria-label={tClave("casa.escondite.puertas.oculto")} aria-pressed={escondite.abierto}
          style={{ left: PECERA.puertas.izquierda, top: PECERA.puertas.arriba, width: PECERA.puertas.derecha - PECERA.puertas.izquierda, height: PECERA.puertas.abajo - PECERA.puertas.arriba }}
          onFocus={onFocoMueble} onClick={(evento) => { if (evento.detail === 0) onPuertas(); }} />
        {onEsconder && <button type="button" className="casa-pecera-zona is-esconder" aria-disabled={escondite.gatito !== null} aria-label={tClave("casa.escondite.meter.oculto")}
          style={{ left: PECERA.puertas.izquierda, top: PECERA.alto - 24, width: PECERA.puertas.derecha - PECERA.puertas.izquierda, height: 24 }}
          onFocus={onFocoMueble} onClick={(evento) => { if (evento.detail === 0) onEsconder(); }} />}
        {/* Para el teclado y el lector de pantalla: los toques con el dedo los recoge la escena. */}
        <button type="button" className="casa-pecera-zona is-agua" aria-label={tClave("casa.pecera.agua.oculto")}
          style={{ left: PECERA.agua.izquierda, top: PECERA.agua.superficie, width: PECERA.agua.derecha - PECERA.agua.izquierda, height: PECERA.agua.arena - PECERA.agua.superficie }}
          onClick={(evento) => { if (evento.detail === 0) meter(llamar(ref.current, 150, 140, performance.now(), Math.random)); }} />
        <button type="button" className="casa-pecera-zona" aria-label={tClave("casa.pecera.comida.oculto")}
          style={{ left: PECERA.bote.izquierda, top: PECERA.bote.arriba, width: PECERA.bote.derecha - PECERA.bote.izquierda, height: PECERA.bote.abajo - PECERA.bote.arriba }}
          onClick={(evento) => { if (evento.detail === 0) meter(soltarComida(ref.current, performance.now(), Math.random)); }} />
        <button type="button" className="casa-pecera-zona" aria-label={tClave("casa.pecera.luz.oculto")}
          style={{ left: PECERA.interruptor.izquierda, top: PECERA.interruptor.arriba, width: PECERA.interruptor.derecha - PECERA.interruptor.izquierda, height: PECERA.interruptor.abajo - PECERA.interruptor.arriba }}
          onClick={(evento) => { if (evento.detail === 0) meter(cambiarLuz(ref.current, performance.now())); }} />
      </>}
    </div>
  );
}

const HUECO = { ancho: PECERA.puertas.derecha - PECERA.puertas.izquierda, alto: PECERA.puertas.abajo - PECERA.puertas.arriba };
/** Ancho de una puerta del dibujo (cada una, con su marco). */
const PUERTA_ANCHO = 148;

/** Botes de comida de los peces y la red que se ven dentro, de adorno (provisional hasta el arte final). */
function DentroDelMueble() {
  const bote = (x: number, ancho: number, alto: number, color: string) => <g key={x} transform={`translate(${x} ${76 - alto})`}>
    <rect width={ancho} height={alto} fill={color} stroke="#2f1d33" strokeWidth="3" />
    <rect x="-2" y="-7" width={ancho + 4} height="8" fill="#e8b93c" stroke="#2f1d33" strokeWidth="3" />
    <rect x="5" y={alto / 2 - 9} width={ancho - 10} height="18" fill="#ffe6c2" />
    <path d={`M${ancho / 2 - 8} ${alto / 2}q7 -9 14 0q-7 9 -14 0l-5 -6v12z`} fill="#e2463f" />
  </g>;
  return <svg width={HUECO.ancho} height={HUECO.alto} viewBox={`0 0 ${HUECO.ancho} ${HUECO.alto}`} shapeRendering="crispEdges" aria-hidden="true">
    <rect width={HUECO.ancho} height={HUECO.alto} fill="#4a2a3c" />
    <rect width={HUECO.ancho} height="12" fill="#2f1d33" />
    <rect y="76" width={HUECO.ancho} height="8" fill="#7a4a4a" />
    {bote(18, 36, 46, "#e2463f")}
    {bote(62, 30, 34, "#3f8f4a")}
    {bote(100, 34, 40, "#3d8be0")}
    <line x1="296" y1="8" x2="258" y2="48" stroke="#c98e5c" strokeWidth="6" />
    <path d="M224 46h48q-2 28 -24 28t-24 -28z" fill="#cfe9e455" stroke="#e8f4ff" strokeWidth="3" />
    <path d="M232 48l30 22M244 48l22 16M224 52l30 20M264 48l-30 22M252 48l-22 16M272 52l-30 20" stroke="#e8f4ff" strokeWidth="1.5" fill="none" />
    <rect x="222" y="43" width="52" height="6" fill="#e8b93c" stroke="#2f1d33" strokeWidth="2" />
  </svg>;
}

/**
 * Las puertas del mueble de la pecera, que esconden un gatito. Cerradas son las del propio dibujo; abiertas, el hueco
 * con las dos hojas hacia los lados, recortadas del mueble ya pintado (así respetan el color elegido al decorar). Con
 * alguien dentro y cerradas, le asoma la cola, de su color (provisional hasta el arte final).
 */
function MuebleEscondite({ fondo, escondite }: { fondo: string; escondite: Props["escondite"] }) {
  const { izquierda, arriba } = PECERA.puertas;
  const paleta = escondite.gatito !== null ? PALETAS_GATITOS[escondite.gatito] : null;
  const color = paleta ? `rgb(${paleta.pelo.join(" ")})` : "";
  const punta = paleta ? `rgb(${paleta.peloOscuro.join(" ")})` : "";
  const hoja = (x: number): CSSProperties => ({ width: PUERTA_ANCHO, height: HUECO.alto, backgroundImage: `url("${fondo}")`, backgroundSize: `${PECERA.ancho}px ${PECERA.alto}px`, backgroundPosition: `${-x}px ${-arriba}px` });
  return <>
    {escondite.brilla && <div className="casa-mueble-brillo" style={{ left: 0, top: 0, width: PECERA.ancho, height: PECERA.alto }}>
      <img src={fondo} alt="" draggable={false} />
    </div>}
    {escondite.abierto && <div className="casa-escondite" style={{ left: izquierda, top: arriba, width: HUECO.ancho, height: HUECO.alto }}>
      <DentroDelMueble />
      <i className="casa-puertecita is-izquierda" style={{ left: 0, ...hoja(izquierda) }} />
      <i className="casa-puertecita is-derecha" style={{ right: 0, ...hoja(PECERA.puertas.derecha - PUERTA_ANCHO) }} />
    </div>}
    {paleta && !escondite.abierto && <svg className="casa-cola" style={{ left: 280, top: PECERA.puertas.abajo - 12 }} width="64" height="56" viewBox="0 0 64 56" aria-hidden="true">
      <g fill="none" strokeLinecap="round">
        <path d="M12 6C10 30 18 44 34 44S52 34 48 24" stroke="#2f1d33" strokeWidth="19" />
        <path d="M12 6C10 30 18 44 34 44S52 34 48 24" stroke={color} strokeWidth="13" />
        <path d="M50 31Q50 28 48 24" stroke={punta} strokeWidth="13" />
      </g>
    </svg>}
  </>;
}
