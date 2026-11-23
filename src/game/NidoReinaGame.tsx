/**
 * «EL NIDO DE LA REINA» (issue 361; diseño en #353 y retoques del boceto en #354): la Reina Tricera trota por la selva
 * y da un topetazo a tres arbustos de flores en fila, que sueltan pétalos y suenan; Noa repite el recorrido tocando los
 * arbustos. Cada ronda ganada abre un huevo del nido y la cría se une a la fila que trota tras la Reina. Sobre el motor
 * común (`memoriaDuelo.ts`) y la base `useMemoriaDuelo`. Arte provisional: las poses de la Reina que ya hay (las crías,
 * ella en pequeño); selva, volcán, nido, huevos, arbustos y pétalos con CSS.
 */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { cssAssetUrl } from "./assets";
import { bossCatalog } from "./bosses";
import { Dialog } from "./Dialog";
import type { SoundKind } from "./GameCanvas";
import { RONDAS, sitioQueBrilla, type Sitio } from "./memoriaDuelo";
import { PantallaPrevia, ResultadoMinijuego } from "./minijuegoComun";
import { TOQUE_MS, useMemoriaDuelo } from "./useMemoriaDuelo";
import { Ventana } from "./Ventana";
import { t, type ClaveTexto } from "../textos/index.ts";
import { Boton, BotonControl, Texto } from "../textos/Texto";
import "./nidoReina.css";

type Props = {
  paused: boolean; muted: boolean; musicVolume: number; effectsVolume: number; reduceMotion: boolean; levelCompleted: boolean;
  onAbandon: () => void; onWin: (challengeCompleted: boolean) => void; playSound: (kind: SoundKind) => void; friendlyReplay?: boolean;
};

type Punto = { x: number; y: number };
type Disposicion = { ancho: number; alto: number; arbustos: [Punto, Punto, Punto]; nido: Punto; casa: Punto; escalaReina: number; escalaArbusto: number; /** El nido, sobre una loma (en vertical, arriba). */ loma: boolean };
/**
 * En la tableta vertical: el nido arriba y la fila de arbustos grandes abajo, de lado a lado. En apaisado: el nido a la
 * izquierda y los arbustos a la derecha. `casa` es donde espera la Reina, junto al nido; los pies van en `y`.
 */
const DISPOSICION: Record<"vertical" | "apaisado", Disposicion> = {
  vertical: { ancho: 720, alto: 1080, arbustos: [{ x: 130, y: 900 }, { x: 360, y: 900 }, { x: 590, y: 900 }], nido: { x: 250, y: 470 }, casa: { x: 470, y: 500 }, escalaReina: 1.15, escalaArbusto: 1.3, loma: true },
  apaisado: { ancho: 960, alto: 540, arbustos: [{ x: 470, y: 470 }, { x: 650, y: 470 }, { x: 830, y: 470 }], nido: { x: 120, y: 470 }, casa: { x: 270, y: 470 }, escalaReina: 0.9, escalaArbusto: 0.82, loma: false },
};
const ARBUSTOS = ["rojo", "amarillo", "morado"] as const;
/** Notas de marimba de madera: la, do y mi. */
const NOTAS: readonly [number, number, number] = [69, 72, 76];
const CLAVES_ARBUSTO = [
  { rotulo: "minijuegos.nido.practica.rojo.rotulo", juntos: "minijuegos.nido.practica.rojo.juntos", arbusto: "minijuegos.nido.arbusto.rojo.oculto" },
  { rotulo: "minijuegos.nido.practica.amarillo.rotulo", juntos: "minijuegos.nido.practica.amarillo.juntos", arbusto: "minijuegos.nido.arbusto.amarillo.oculto" },
  { rotulo: "minijuegos.nido.practica.morado.rotulo", juntos: "minijuegos.nido.practica.morado.juntos", arbusto: "minijuegos.nido.arbusto.morado.oculto" },
] as const satisfies readonly { rotulo: ClaveTexto; juntos: ClaveTexto; arbusto: ClaveTexto }[];
const PETALOS = Array.from({ length: 10 }, (_, i) => ({ angulo: -150 + i * 13, distancia: 50 + (i % 3) * 18 }));
/** Distancia entre las crías de la fila, en px de la escena. */
const HUECO_CRIA = 54;

/**
 * Arte de `prototypes/tools/duelos-memoria-recorte.py`: hojas de casillas de 256 px en una fila, de perfil mirando a la
 * derecha. La Reina: trota 1-4, topetazo, pisotón y estornudo. La cría: huevo, huevo que se abre, trota 1-2 y baila 1-2.
 */
const HOJA_REINA = "./assets/sprites/nido-reina-v1.webp";
const HOJA_CRIA = "./assets/sprites/nido-cria-v1.webp";
/** Arte que usa la hoja de estilos, con rutas relativas al sitio publicado. */
const ARTE_CSS = { "--arbusto": cssAssetUrl("./assets/sprites/nido-arbusto-v1.webp"), "--flores": cssAssetUrl("./assets/sprites/nido-arbusto-flores-v1.webp") } as CSSProperties;
const POSE = { quieta: 0, topetazo: 4, pisoton: 5, estornudo: 6 } as const;
const CRIA = { huevo: 0, seAbre: 1, trota: 2, quieta: 3, baila: 4 } as const;
const celda = (hoja: string, casillas: number, casilla: number): CSSProperties =>
  ({ backgroundImage: `url("${hoja}")`, backgroundSize: `${casillas * 100}% 100%`, backgroundPosition: `${casilla * 100 / (casillas - 1)}% 0` });

function trote(desde: Punto, hasta: Punto, t: number): Punto {
  const suave = Math.min(1, Math.max(0, t));
  return { x: desde.x + (hasta.x - desde.x) * suave, y: desde.y + (hasta.y - desde.y) * suave - Math.abs(Math.sin(suave * Math.PI * 4)) * 10 };
}

export function NidoReinaGame({ paused, muted, musicVolume, effectsVolume, reduceMotion, levelCompleted, onAbandon, onWin, playSound, friendlyReplay = false }: Props) {
  const boss = bossCatalog["triceratops-queen"];
  const juego = useMemoriaDuelo({ paused, muted, musicVolume, effectsVolume, notas: NOTAS, timbre: "marimba", estilo: "calipso" });
  const { modo, estado, ahora, momento, toque, visita, resultado, respuesta } = juego;

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

  // Dónde está la Reina y qué hace: en casa junto al nido, trotando hacia un arbusto o dándole el topetazo.
  const casa = disposicion.casa;
  const frenteA = (sitio: Sitio) => ({ x: disposicion.arbustos[sitio].x + (disposicion.arbustos[sitio].x >= casa.x ? -95 : 95), y: disposicion.arbustos[sitio].y });
  let reina: Punto = casa;
  let trotando = false;
  let golpeando: Sitio | null = null;
  const camino = visita && !visita.parada ? { desde: visita.sitio === 0 ? casa : frenteA((visita.sitio - 1) as Sitio), sitio: visita.sitio, t: (ahora - visita.desde) / 667 }
    : momento && !momento.terminada ? { desde: momento.indice === 0 ? casa : frenteA(estado!.recorrido[momento.indice - 1]), sitio: momento.sitio, t: momento.cantando ? 1 : momento.avance } : null;
  if (visita?.parada) { reina = frenteA(visita.sitio); golpeando = visita.sitio; }
  else if (camino) {
    reina = reduceMotion && camino.t < 1 ? frenteA(camino.sitio) : trote(camino.desde, frenteA(camino.sitio), camino.t);
    trotando = camino.t < 1;
    if (camino.t >= 1) golpeando = camino.sitio;
  }
  const destino = camino ? frenteA(camino.sitio) : visita ? frenteA(visita.sitio) : casa;
  const mira: 1 | -1 = camino ? (destino.x >= (camino.desde.x) ? 1 : -1) : golpeando !== null ? (disposicion.arbustos[golpeando].x >= reina.x ? 1 : -1) : 1;

  // Al tocar un arbusto, suelta pétalos y la Reina, desde casa, mueve la cola y da un pisotón de alegría.
  const tocando = toque && ahora - toque.desde < TOQUE_MS ? toque : null;
  const brilla = estado ? sitioQueBrilla(estado) : null;
  const casi = respuesta?.fase === "casi";
  const crias = Math.min(RONDAS, estado?.estrellas ?? 0);
  const final = respuesta?.fase === "final" || Boolean(resultado);
  const paso = reduceMotion ? 0 : Math.floor(ahora / 140);
  const pose = casi ? POSE.estornudo : golpeando !== null ? POSE.topetazo : trotando ? paso % 4
    : tocando?.acierto || (final && paso % 2) ? POSE.pisoton : POSE.quieta;
  // La cría recién salida se ve asomando del huevo mientras dura el «¡CRAC!».
  const saliendo = respuesta?.fase === "rondaGanada" || respuesta?.fase === "final" ? crias - 1 : -1;
  const enPrevia = !modo && !resultado;
  const leave = () => friendlyReplay && !modo ? onAbandon() : juego.setMostrarSalir(true);

  const rotulo: ClaveTexto | null = !modo ? null : casi ? "minijuegos.nido.compas.casi.rotulo"
    : respuesta?.fase === "rondaGanada" || respuesta?.fase === "final" ? "minijuegos.nido.compas.crac.rotulo"
      : estado?.fase === "repite" && !visita ? "minijuegos.nido.compas.tu.rotulo" : momento && !momento.terminada ? "minijuegos.nido.compas.mira.rotulo" : null;

  useEffect(() => { if (resultado) playSound("checkpoint"); }, [resultado, playSound]);

  const retrato = <span className="nido-retrato" style={celda(HOJA_REINA, 7, POSE.quieta)} />;
  // Las crías trotan en fila detrás de la Reina (y esperan detrás de ella cuando está quieta).
  const fila = Array.from({ length: crias }, (_, i) => ({ x: reina.x - mira * HUECO_CRIA * (i + 1.4), y: reina.y + (trotando && !reduceMotion ? (Math.floor(ahora / 160 + i) % 2) * -5 : 0) }));
  return <>
    <Dialog labelledBy="nido-titulo" backdropClassName="boss-backdrop" className="boss-battle nido-juego" gamepad={juego.detenido || !modo}>
      <h2 id="nido-titulo" className="sr-only"><Texto clave="minijuegos.nido.previa.nombre.rotulo" /></h2>
      <div className={`nido-marco${reduceMotion ? " is-quieto" : ""}${vertical ? " is-vertical" : ""}`} ref={marcoRef}>
        <div className="nido-escena" style={{ width: disposicion.ancho, height: disposicion.alto, transform: `translate(-50%, -50%) scale(${escala})`, ...ARTE_CSS }}>
          <div className="nido-selva" aria-hidden="true">
            <div className="nido-volcan"><i className="nido-humo" /><i className="nido-humo" /><i className="nido-humo" /></div>
            <i className="nido-helecho is-izquierda" /><i className="nido-helecho is-derecha" />
            <i className="nido-mariposa" /><i className="nido-mariposa is-otra" />
            <i className="nido-terodactilo" />
            <div className="nido-suelo" />
          </div>

          {disposicion.loma && <div className="nido-loma" aria-hidden="true" style={{ left: disposicion.nido.x + 110, top: disposicion.nido.y }} />}
          {/* El nido con sus cinco huevos: uno se abre en cada ronda ganada. */}
          <div className="nido-nido" role="img" aria-label={t("minijuegos.nido.nido.oculto", { n: crias, total: RONDAS })} style={{ left: disposicion.nido.x, top: disposicion.nido.y }}>
            {Array.from({ length: RONDAS }, (_, i) => (i >= crias || i === saliendo) && <i key={i} className="nido-huevo"
              style={{ left: 22 + i * 34, top: i % 2 ? 4 : 16, ...celda(HOJA_CRIA, 6, i === saliendo ? CRIA.seAbre : CRIA.huevo) }} />)}
            <img className="nido-nido-dibujo" src="./assets/sprites/nido-nido-v1.webp" alt="" draggable={false} />
          </div>

          {disposicion.arbustos.map((arbusto, i) => {
            const sitio = i as Sitio;
            const golpe = golpeando === sitio || (tocando?.sitio === sitio && tocando.acierto);
            return <button key={sitio} type="button" className={`nido-arbusto is-${ARBUSTOS[sitio]}${golpe ? " is-golpe" : ""}${brilla === sitio ? " is-brilla" : ""}`}
              style={{ left: arbusto.x, top: arbusto.y, "--escala": disposicion.escalaArbusto } as CSSProperties} aria-label={t(CLAVES_ARBUSTO[sitio].arbusto)}
              disabled={!modo || estado?.fase !== "repite" || juego.detenido || Boolean(respuesta) || Boolean(visita)}
              onPointerDown={(event) => { if (event.button === 0) juego.tocar(sitio); }} onClick={(event) => { if (event.detail === 0) juego.tocar(sitio); }}>
              <span className="nido-arbusto-hojas"><i className="nido-flores" /></span>
              {golpe && PETALOS.map((petalo, p) => <i key={p} className="nido-petalo" style={{ "--angulo": `${petalo.angulo}deg`, "--distancia": `${petalo.distancia}px` } as CSSProperties} />)}
            </button>;
          })}

          {fila.map((cria, i) => <span key={i} className="nido-cria" aria-hidden="true"
            style={{ left: cria.x, top: cria.y, transform: `translate(-50%, -97%) scaleX(${final ? 1 : mira})`,
              ...celda(HOJA_CRIA, 6, final ? CRIA.baila + ((paso + i) % 2) : trotando ? CRIA.trota + ((paso + i) % 2) : CRIA.quieta) }} />)}
          <span className="nido-reina" aria-hidden="true"
            style={{ left: reina.x, top: reina.y, transform: `translate(-50%, -97%) scale(${disposicion.escalaReina}) scaleX(${mira})`, ...celda(HOJA_REINA, 7, pose) }} />

          {rotulo && <span className={`nido-rotulo${casi ? " is-casi" : ""}`}><Texto clave={rotulo} /></span>}
        </div>
      </div>

      {modo && <div className="nido-controles">
        <BotonControl className="nido-pausa" pictograma="pausa" etiqueta="partida.hud.pausa.oculto" onClick={() => juego.setMostrarSalir(true)} />
        <BotonControl className="nido-mira" pictograma="busca" etiqueta="minijuegos.nido.mira.oculto" disabled={estado?.fase !== "repite" || Boolean(visita)} onClick={juego.mira} />
        {modo === "practica" && <Boton clave="minijuegos.nido.practica.termina.rotulo" onClick={juego.salirDelJuego} />}
      </div>}
    </Dialog>

    {enPrevia && !juego.mostrarSalir && <PantallaPrevia id="nido-previa" nombre="minijuegos.nido.previa.nombre.rotulo" guardian={retrato}
      regla={`${t("minijuegos.nido.previa.regla.juntos")} ${boss.challenge.label}`}
      ayudaAdultos={[t("adultos.minijuegos.memoria.controles")]}
      practicaPrimero={!levelCompleted && !friendlyReplay && !juego.practicado}
      onPracticar={() => juego.empezar("practica")} onJugar={() => juego.empezar("juego")} onSalir={leave} />}

    {visita?.parada && !paused && <Ventana id="nido-parada" titulo={CLAVES_ARBUSTO[visita.sitio].rotulo}
      botones={<Boton tipo="seguir" clave="minijuegos.nido.practica.sigue.rotulo" data-gamepad-default onClick={juego.seguirVisita} />}>
      <p className="juntos">{t(CLAVES_ARBUSTO[visita.sitio].juntos)}</p>
      {visita.sitio === 2 && <p className="juntos">{t("minijuegos.nido.practica.ahora.juntos")}</p>}
    </Ventana>}

    {resultado && !juego.mostrarSalir && <ResultadoMinijuego id="nido-resultado" titulo="minijuegos.nido.resultado.bravo.rotulo" gano onSalir={leave}
      dibujo={<span className="nido-resultado-dibujo">{retrato}{resultado.corona && <span className="nido-corona" role="img" aria-label={t("minijuegos.nido.resultado.corona.oculto")} />}</span>}
      frase={t(resultado.corona ? "minijuegos.nido.resultado.corona.juntos" : "minijuegos.nido.resultado.bravo.juntos")}
      botones={<>
        <Boton tipo="seguir" clave={friendlyReplay ? "minijuegos.nido.resultado.amigos.rotulo" : "minijuegos.nido.resultado.sigue.rotulo"} data-gamepad-default
          onClick={() => { playSound("goal"); onWin(resultado.corona); }} />
        <Boton clave="minijuegos.nido.resultado.otraVez.rotulo" onClick={() => juego.empezar("juego")} />
        <Boton clave="minijuegos.comun.previa.practica.rotulo" onClick={() => juego.empezar("practica")} />
      </>} />}

    {juego.mostrarSalir && <Ventana id="nido-salir" titulo={modo ? "partida.pausa.titulo.rotulo" : "minijuegos.nido.salir.titulo.rotulo"} onClose={() => juego.setMostrarSalir(false)}
      botones={<>
        <Boton tipo="seguir" clave="minijuegos.nido.salir.seguir.rotulo" data-gamepad-default data-gamepad-back onClick={() => juego.setMostrarSalir(false)} />
        <Boton clave={friendlyReplay ? "minijuegos.nido.resultado.amigos.rotulo" : "minijuegos.nido.resultado.mapa.rotulo"} onClick={onAbandon} />
      </>}>
      <p className="juntos">{t("minijuegos.nido.salir.juntos.juntos")}</p>
    </Ventana>}
  </>;
}
