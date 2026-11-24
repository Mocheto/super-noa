/**
 * «EL VUELO DE AURORA» (issue 360; diseño en #352 y retoques del boceto en #354): Aurora Celeste sale de su luna, vuela
 * en arco de nube en nube y despierta a tres nubecitas de color, que cantan su nota; Noa repite el recorrido tocando las
 * nubes. Sobre el motor común (`memoriaDuelo.ts`) y la base `useMemoriaDuelo`. Arte provisional: Aurora y las nubecitas
 * salen del atlas del reino del cielo; nubes, luna, aurora, estrellas y constelación se dibujan con CSS y SVG.
 */
import "../textos/zonas/minijuegos.vuelo";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { bossCatalog } from "./bosses";
import { Dialog } from "./Dialog";
import type { SoundKind } from "./GameCanvas";
import { RONDAS, sitioQueBrilla, type Sitio } from "./memoriaDuelo";
import { PantallaPrevia, ResultadoMinijuego } from "./minijuegoComun";
import { TOQUE_MS, useMemoriaDuelo } from "./useMemoriaDuelo";
import { Ventana } from "./Ventana";
import { t, type ClaveTexto } from "../textos/index.ts";
import { Boton, BotonControl, Texto } from "../textos/Texto";
import "./vueloAurora.css";

type Props = {
  paused: boolean; muted: boolean; musicVolume: number; effectsVolume: number; reduceMotion: boolean; levelCompleted: boolean;
  onAbandon: () => void; onWin: (challengeCompleted: boolean) => void; playSound: (kind: SoundKind) => void; friendlyReplay?: boolean;
};

type Punto = { x: number; y: number };
type Disposicion = { ancho: number; alto: number; nubes: [Punto, Punto, Punto]; luna: Punto; lunaEscala: number; escalaAurora: number; constelacion: Punto & { escala: number } };
/**
 * Dónde va cada cosa. En la tableta vertical: la constelación arriba, Aurora en su luna en medio y las nubes grandes abajo.
 * En apaisado: el mismo triángulo, la luna arriba y más pequeña (unos 28 % del alto) y la constelación a un lado.
 */
const DISPOSICION: Record<"vertical" | "apaisado", Disposicion> = {
  vertical: { ancho: 720, alto: 1080, nubes: [{ x: 170, y: 860 }, { x: 360, y: 640 }, { x: 550, y: 860 }], luna: { x: 360, y: 400 }, lunaEscala: 1, escalaAurora: 1, constelacion: { x: 360, y: 150, escala: 1.25 } },
  apaisado: { ancho: 960, alto: 540, nubes: [{ x: 250, y: 440 }, { x: 480, y: 300 }, { x: 710, y: 440 }], luna: { x: 480, y: 108 }, lunaEscala: 0.62, escalaAurora: 0.75, constelacion: { x: 830, y: 120, escala: 0.8 } },
};
/** Las tres nubecitas: rosa, amarilla y azul, con sus notas de celesta (sol, do y mi). */
const NUBECITAS = ["rosa", "amarilla", "azul"] as const;
const NOTAS: readonly [number, number, number] = [79, 84, 88];
/** Textos de cada nubecita: su parada en la práctica y el nombre de su nube para el lector de pantalla. */
const CLAVES_NUBECITA = [
  { rotulo: "minijuegos.vuelo.practica.rosa.rotulo", juntos: "minijuegos.vuelo.practica.rosa.juntos", nube: "minijuegos.vuelo.nube.rosa.oculto" },
  { rotulo: "minijuegos.vuelo.practica.amarilla.rotulo", juntos: "minijuegos.vuelo.practica.amarilla.juntos", nube: "minijuegos.vuelo.nube.amarilla.oculto" },
  { rotulo: "minijuegos.vuelo.practica.azul.rotulo", juntos: "minijuegos.vuelo.practica.azul.juntos", nube: "minijuegos.vuelo.nube.azul.oculto" },
] as const satisfies readonly { rotulo: ClaveTexto; juntos: ClaveTexto; nube: ClaveTexto }[];
/** La constelación del gatito: cinco estrellas (orejas, cabeza y barbilla) que se unen al encenderse. */
const CONSTELACION: Punto[] = [{ x: -60, y: -40 }, { x: -30, y: -90 }, { x: 0, y: -45 }, { x: 30, y: -90 }, { x: 60, y: -40 }];
const ESTRELLAS_FONDO = Array.from({ length: 34 }, (_, i) => ({ x: (i * 197 + 41) % 1000 / 10, y: (i * 89 + 13) % 600 / 10, retraso: (i % 7) * 0.4 }));
/**
 * Arte de `prototypes/tools/duelos-memoria-recorte.py`: hojas de casillas de 256 px en una fila. Aurora: vuela 1-3 (de
 * perfil, mirando a la derecha), posada, canta, mira a la izquierda y mira a la derecha. Nubecita: dormida, un ojo,
 * canta y bosteza, con su cuerpo blanco aparte (máscara) para teñirlo de su color.
 */
const HOJA_AURORA = "./assets/sprites/vuelo-aurora-v1.webp";
const HOJA_NUBECITA = "./assets/sprites/vuelo-nubecita-v1.webp";
const CUERPO_NUBECITA = "./assets/sprites/vuelo-nubecita-cuerpo-v1.webp";
const AURORA = { vuela: 0, posada: 3, canta: 4, izquierda: 5, derecha: 6 } as const;
const NUBECITA = { dormida: 0, ojo: 1, canta: 2, bosteza: 3 } as const;

/** Celda del atlas del reino del cielo (5 × 2): arriba las nubecitas, abajo Aurora. */
const celda = (hoja: string, casillas: number, casilla: number): CSSProperties =>
  ({ backgroundImage: `url("${hoja}")`, backgroundSize: `${casillas * 100}% 100%`, backgroundPosition: `${casilla * 100 / (casillas - 1)}% 0` });
const mascara = (hoja: string, casillas: number, casilla: number): CSSProperties =>
  ({ maskImage: `url("${hoja}")`, WebkitMaskImage: `url("${hoja}")`, maskSize: `${casillas * 100}% 100%`, WebkitMaskSize: `${casillas * 100}% 100%`,
    maskPosition: `${casilla * 100 / (casillas - 1)}% 0`, WebkitMaskPosition: `${casilla * 100 / (casillas - 1)}% 0` });

/** Aurora vuela en arco de un punto a otro (`t` de 0 a 1). */
function enArco(desde: Punto, hasta: Punto, t: number): Punto {
  const suave = t * t * (3 - 2 * t);
  return { x: desde.x + (hasta.x - desde.x) * suave, y: desde.y + (hasta.y - desde.y) * suave - Math.sin(Math.PI * suave) * 90 };
}

export function VueloAuroraGame({ paused, muted, musicVolume, effectsVolume, reduceMotion, levelCompleted, onAbandon, onWin, playSound, friendlyReplay = false }: Props) {
  const boss = bossCatalog["aurora-celeste"];
  const juego = useMemoriaDuelo({ paused, muted, musicVolume, effectsVolume, notas: NOTAS, timbre: "celesta", estilo: "cuna" });
  const { modo, estado, ahora, momento, toque, visita, resultado, respuesta } = juego;

  // La escena se dibuja a su tamaño y se escala a lo que cabe.
  const marcoRef = useRef<HTMLDivElement>(null);
  const [vertical, setVertical] = useState(() => typeof matchMedia === "function" && matchMedia("(orientation: portrait)").matches);
  const [escala, setEscala] = useState(1);
  const disposicion = DISPOSICION[vertical ? "vertical" : "apaisado"];
  useLayoutEffect(() => {
    const medir = () => {
      const enVertical = typeof matchMedia === "function" && matchMedia("(orientation: portrait)").matches;
      setVertical(enVertical);
      const caja = marcoRef.current?.getBoundingClientRect();
      const d = DISPOSICION[enVertical ? "vertical" : "apaisado"];
      if (caja) setEscala(Math.min(caja.width / d.ancho, caja.height / d.alto));
    };
    medir();
    const observador = typeof ResizeObserver === "function" ? new ResizeObserver(medir) : null;
    if (marcoRef.current) observador?.observe(marcoRef.current);
    window.addEventListener("resize", medir);
    return () => { observador?.disconnect(); window.removeEventListener("resize", medir); };
  }, []);

  // Dónde está Aurora y qué hace: en su luna, de camino a una nube o cantando en ella.
  // Aurora se sienta dentro del creciente (su hueco queda arriba a la izquierda del centro del dibujo).
  const luna = { x: disposicion.luna.x - 14 * disposicion.lunaEscala, y: disposicion.luna.y + 28 * disposicion.lunaEscala };
  const nubeDe = (sitio: Sitio) => ({ x: disposicion.nubes[sitio].x, y: disposicion.nubes[sitio].y - 70 });
  let aurora: Punto = luna;
  let volando = false;
  let cantando: Sitio | null = null;
  const camino = visita && !visita.parada ? { desde: visita.sitio === 0 ? luna : nubeDe((visita.sitio - 1) as Sitio), sitio: visita.sitio, t: (ahora - visita.desde) / 667 }
    : momento && !momento.terminada ? { desde: momento.indice === 0 ? luna : nubeDe(estado!.recorrido[momento.indice - 1]), sitio: momento.sitio, t: momento.cantando ? 1 : momento.avance } : null;
  if (visita?.parada) { aurora = nubeDe(visita.sitio); cantando = visita.sitio; }
  else if (camino) {
    aurora = reduceMotion && camino.t < 1 ? nubeDe(camino.sitio) : enArco(camino.desde, nubeDe(camino.sitio), Math.min(1, camino.t));
    volando = camino.t < 1;
    if (camino.t >= 1) cantando = camino.sitio;
  }
  // Al tocar una nube, Aurora gira la cabeza hacia ella desde la luna.
  const tocando = toque && ahora - toque.desde < TOQUE_MS ? toque : null;
  const mira: -1 | 0 | 1 = tocando ? (disposicion.nubes[tocando.sitio].x < luna.x ? -1 : disposicion.nubes[tocando.sitio].x > luna.x ? 1 : 0) : 0;
  const brilla = estado ? sitioQueBrilla(estado) : null;
  const casi = respuesta?.fase === "casi";
  const estrellas = estado?.estrellas ?? 0;
  const enPrevia = !modo && !resultado;
  const leave = () => friendlyReplay && !modo ? onAbandon() : juego.setMostrarSalir(true);

  // Rótulo al compás: «MIRA» mientras enseña y «¡TU!» cuando le toca a Noa.
  const rotulo: ClaveTexto | null = !modo ? null : casi ? "minijuegos.vuelo.compas.casi.rotulo"
    : respuesta?.fase === "rondaGanada" || respuesta?.fase === "final" ? "minijuegos.vuelo.compas.bien.rotulo"
      : estado?.fase === "repite" && !visita ? "minijuegos.vuelo.compas.tu.rotulo" : momento && !momento.terminada ? "minijuegos.vuelo.compas.mira.rotulo" : null;

  useEffect(() => { if (resultado) playSound("checkpoint"); }, [resultado, playSound]);

  const retrato = <span className="vuelo-retrato" style={celda(HOJA_AURORA, 7, AURORA.posada)} />;
  // Volando mira hacia donde va (el dibujo mira a la derecha); aletea con los tres cuadros.
  const haciaIzquierda = camino ? nubeDe(camino.sitio).x < camino.desde.x : false;
  const casillaAurora = volando ? (reduceMotion ? 1 : Math.floor(ahora / 110) % 3) : cantando !== null ? AURORA.canta
    : mira === -1 ? AURORA.izquierda : mira === 1 ? AURORA.derecha : AURORA.posada;
  return <>
    <Dialog labelledBy="vuelo-titulo" backdropClassName="boss-backdrop" className="boss-battle vuelo-juego" gamepad={juego.detenido || !modo}>
      <h2 id="vuelo-titulo" className="sr-only"><Texto clave="minijuegos.vuelo.previa.nombre.rotulo" /></h2>
      <div className={`vuelo-marco${reduceMotion ? " is-quieto" : ""}${vertical ? " is-vertical" : ""}`} ref={marcoRef}>
        <div className="vuelo-escena" style={{ width: disposicion.ancho, height: disposicion.alto, transform: `translate(-50%, -50%) scale(${escala})` }}>
          <div className="vuelo-cielo" aria-hidden="true">
            <div className="vuelo-aurora" />
            {ESTRELLAS_FONDO.map((estrella, i) => <i key={i} className="vuelo-estrella" style={{ left: `${estrella.x}%`, top: `${estrella.y}%`, animationDelay: `${estrella.retraso}s` }} />)}
          </div>

          {/* La constelación del gatito: una estrella por ronda ganada. */}
          <svg className="vuelo-constelacion" role="img" aria-label={t("minijuegos.vuelo.constelacion.oculto", { n: estrellas, total: RONDAS })}
            style={{ left: disposicion.constelacion.x, top: disposicion.constelacion.y, transform: `translate(-50%, -50%) scale(${disposicion.constelacion.escala})` }}
            viewBox="-80 -110 160 90" width={160} height={90}>
            <polyline points={CONSTELACION.slice(0, estrellas).map((p) => `${p.x},${p.y}`).join(" ")} className="vuelo-constelacion-linea" />
            {CONSTELACION.map((p, i) => <path key={i} className={`vuelo-constelacion-estrella${i < estrellas ? " is-encendida" : ""}${resultado && i < estrellas ? " is-final" : ""}`}
              d={`M${p.x} ${p.y - 9} L${p.x + 3} ${p.y - 3} L${p.x + 9} ${p.y - 2} L${p.x + 4} ${p.y + 3} L${p.x + 6} ${p.y + 9} L${p.x} ${p.y + 5} L${p.x - 6} ${p.y + 9} L${p.x - 4} ${p.y + 3} L${p.x - 9} ${p.y - 2} L${p.x - 3} ${p.y - 3} Z`} />)}
          </svg>

          <img className="vuelo-luna" src="./assets/sprites/vuelo-luna-v1.webp" alt="" style={{ left: disposicion.luna.x, top: disposicion.luna.y, transform: `translate(-50%, -50%) scale(${disposicion.lunaEscala})` }} draggable={false} />

          {disposicion.nubes.map((nube, i) => {
            const sitio = i as Sitio;
            const despierta = cantando === sitio || tocando?.sitio === sitio && tocando.acierto;
            const bosteza = casi && tocando?.sitio === sitio;
            const ojo = brilla === sitio;
            const pose = bosteza ? NUBECITA.bosteza : despierta ? NUBECITA.canta : ojo ? NUBECITA.ojo : NUBECITA.dormida;
            return <button key={sitio} type="button" className={`vuelo-nube is-${NUBECITAS[sitio]}${despierta ? " is-despierta" : ""}${bosteza ? " is-bosteza" : ""}${ojo ? " is-brilla" : ""}`}
              style={{ left: nube.x, top: nube.y }} aria-label={t(CLAVES_NUBECITA[sitio].nube)}
              disabled={!modo || estado?.fase !== "repite" || juego.detenido || Boolean(respuesta) || Boolean(visita)}
              onPointerDown={(event) => { if (event.button === 0) juego.tocar(sitio); }} onClick={(event) => { if (event.detail === 0) juego.tocar(sitio); }}>
              <img className="vuelo-nube-forma" src="./assets/sprites/vuelo-nube-v1.webp" alt="" draggable={false} />
              <span className="vuelo-nubecita" style={celda(HOJA_NUBECITA, 4, pose)}><i className="vuelo-nubecita-color" style={mascara(CUERPO_NUBECITA, 4, pose)} /></span>
            </button>;
          })}

          <span className={`vuelo-aurora-lechuza${volando ? " is-volando" : ""}${casi ? " is-ulula" : ""}`} aria-hidden="true"
            style={{ left: aurora.x, top: aurora.y, transform: `translate(-50%, -88%) scale(${disposicion.escalaAurora}) scaleX(${volando && haciaIzquierda ? -1 : 1})`, ...celda(HOJA_AURORA, 7, casillaAurora) }} />

          {rotulo && <span className={`vuelo-rotulo${casi ? " is-casi" : ""}`}><Texto clave={rotulo} /></span>}
        </div>
      </div>

      {modo && <div className="vuelo-controles">
        <BotonControl className="vuelo-pausa" pictograma="pausa" etiqueta="partida.hud.pausa.oculto" onClick={() => juego.setMostrarSalir(true)} />
        <BotonControl className="vuelo-mira" pictograma="busca" etiqueta="minijuegos.vuelo.mira.oculto" disabled={estado?.fase !== "repite" || Boolean(visita)} onClick={juego.mira} />
        {modo === "practica" && <Boton clave="minijuegos.vuelo.practica.termina.rotulo" onClick={juego.salirDelJuego} />}
      </div>}
    </Dialog>

    {enPrevia && !juego.mostrarSalir && <PantallaPrevia id="vuelo-previa" nombre="minijuegos.vuelo.previa.nombre.rotulo" guardian={retrato}
      regla={`${t("minijuegos.vuelo.previa.regla.juntos")} ${boss.challenge.label}`}
      ayudaAdultos={[t("adultos.minijuegos.memoria.controles")]}
      practicaPrimero={!levelCompleted && !friendlyReplay && !juego.practicado}
      onPracticar={() => juego.empezar("practica")} onJugar={() => juego.empezar("juego")} onSalir={leave} />}

    {visita?.parada && !paused && <Ventana id="vuelo-parada" titulo={CLAVES_NUBECITA[visita.sitio].rotulo}
      botones={<Boton tipo="seguir" clave="minijuegos.vuelo.practica.sigue.rotulo" data-gamepad-default onClick={juego.seguirVisita} />}>
      <p className="juntos">{t(CLAVES_NUBECITA[visita.sitio].juntos)}</p>
      {visita.sitio === 2 && <p className="juntos">{t("minijuegos.vuelo.practica.ahora.juntos")}</p>}
    </Ventana>}

    {resultado && !juego.mostrarSalir && <ResultadoMinijuego id="vuelo-resultado" titulo="minijuegos.vuelo.resultado.bravo.rotulo" gano onSalir={leave}
      dibujo={<span className="vuelo-resultado-dibujo">{retrato}{resultado.corona && <span className="vuelo-corona" role="img" aria-label={t("minijuegos.vuelo.resultado.corona.oculto")} />}</span>}
      frase={t(resultado.corona ? "minijuegos.vuelo.resultado.corona.juntos" : "minijuegos.vuelo.resultado.bravo.juntos")}
      botones={<>
        <Boton tipo="seguir" clave={friendlyReplay ? "minijuegos.vuelo.resultado.amigos.rotulo" : "minijuegos.vuelo.resultado.sigue.rotulo"} data-gamepad-default
          onClick={() => { playSound("goal"); onWin(resultado.corona); }} />
        <Boton clave="minijuegos.vuelo.resultado.otraVez.rotulo" onClick={() => juego.empezar("juego")} />
        <Boton clave="minijuegos.comun.previa.practica.rotulo" onClick={() => juego.empezar("practica")} />
      </>} />}

    {juego.mostrarSalir && <Ventana id="vuelo-salir" titulo={modo ? "partida.pausa.titulo.rotulo" : "minijuegos.vuelo.salir.titulo.rotulo"} onClose={() => juego.setMostrarSalir(false)}
      botones={<>
        <Boton tipo="seguir" clave="minijuegos.vuelo.salir.seguir.rotulo" data-gamepad-default data-gamepad-back onClick={() => juego.setMostrarSalir(false)} />
        <Boton clave={friendlyReplay ? "minijuegos.vuelo.resultado.amigos.rotulo" : "minijuegos.vuelo.resultado.mapa.rotulo"} onClick={onAbandon} />
      </>}>
      <p className="juntos">{t("minijuegos.vuelo.salir.juntos.juntos")}</p>
    </Ventana>}
  </>;
}
