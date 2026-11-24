import "../textos/zonas/casa";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { aspectoDelGatito, banoNuevo, frotarBano, terminado, UTENSILIOS, utensilioQueToca, type Bano, type RespuestaBano, type Utensilio } from "./casaBano";
import { ANIMACIONES_GATO, cuadroDe, type AnimacionGato } from "./casaGatoArte";
import { Ventana } from "./Ventana";
import { useTemporizadores } from "./useTemporizadores";
import { cssAssetUrl } from "./assets";
import { t, tClave } from "../textos/index.ts";
import { Boton, BotonControl } from "../textos/Texto";

type Props = {
  nombre: string;
  /** Hoja del gato pintada con la paleta del gatito. */
  hoja: string | undefined;
  reduceMotion: boolean;
  onSalir: () => void;
  onTerminar: () => void;
  /** Avisos para el sonido del baño («nada» al soltar el utensilio). */
  onSonido?: (evento: RespuestaBano | "frotando", utensilio: Utensilio | null) => void;
};

/** Cuánto se ve la cara de «ese todavía no» y cuánto canta al acabar antes de la ventana. */
const TODAVIA_NO_MS = 900;
const CANTA_MS = 1600;
const PASO_ANIMACION_MS = 100;

/** Arte del baño (docs/art/casa-bano-v1.md): fondo, bañera en dos capas, utensilios y efectos. */
const ARTE_BANO = {
  "--fondo-bano": cssAssetUrl("./assets/worlds/casa-bano-v1.webp"),
  "--banera-atras": cssAssetUrl("./assets/sprites/casa-banera-atras-v1.webp"),
  "--banera-delante": cssAssetUrl("./assets/sprites/casa-banera-delante-v1.webp"),
  "--utensilios-bano": cssAssetUrl("./assets/sprites/casa-bano-utensilios-v1.webp"),
  "--efectos-bano": cssAssetUrl("./assets/sprites/casa-bano-efectos-v1.webp"),
} as CSSProperties;

/**
 * Pantalla de baño: el gatito en la bañera y la bandeja de utensilios. Se arrastra el utensilio que brilla sobre el
 * gatito y se frota; cada paso se ve (mojado, espuma, esponjoso, brillo) y al acabar el gatito canta y sale la
 * ventana común.
 */
export function BanoGatito({ nombre, hoja, reduceMotion, onSalir, onTerminar, onSonido }: Props) {
  const [bano, setBano] = useState<Bano>(banoNuevo);
  const [arrastre, setArrastre] = useState<{ utensilio: Utensilio; x: number; y: number } | null>(null);
  const [cara, setCara] = useState<{ animacion: AnimacionGato; desde: number; hasta: number } | null>(null);
  const [fin, setFin] = useState(false);
  // El final del canto se cancela si se cierra el baño antes (issue 309).
  const temporizadores = useTemporizadores();
  const [ahora, setAhora] = useState(() => performance.now());
  const gatitoRef = useRef<HTMLSpanElement>(null);
  const escenaRef = useRef<HTMLDivElement>(null);
  const banoRef = useRef(bano);
  const anteriorRef = useRef<number | null>(null);
  useEffect(() => { banoRef.current = bano; }, [bano]);

  useEffect(() => {
    if (reduceMotion) return;
    const reloj = window.setInterval(() => setAhora(performance.now()), PASO_ANIMACION_MS);
    return () => window.clearInterval(reloj);
  }, [reduceMotion]);

  // Arrastrar un utensilio: se sigue al dedo y, sobre el gatito, frota.
  useEffect(() => {
    if (!arrastre) return;
    const mover = (event: PointerEvent) => {
      const escena = escenaRef.current?.getBoundingClientRect();
      if (escena) setArrastre((actual) => actual && { ...actual, x: event.clientX - escena.left, y: event.clientY - escena.top });
      const caja = gatitoRef.current?.getBoundingClientRect();
      if (!caja || event.clientX < caja.left || event.clientX > caja.right || event.clientY < caja.top || event.clientY > caja.bottom) {
        anteriorRef.current = null;
        return;
      }
      const y = (event.clientY - caja.top) / caja.height;
      const dy = anteriorRef.current === null ? 0 : y - anteriorRef.current;
      anteriorRef.current = y;
      const momento = performance.now();
      const { bano: siguiente, respuesta } = frotarBano(banoRef.current, arrastre.utensilio, { x: (event.clientX - caja.left) / caja.width, y, dy }, momento);
      banoRef.current = siguiente;
      setBano(siguiente);
      if (respuesta === "todaviaNo") {
        if (!cara || momento > cara.hasta) { setCara({ animacion: "ahoraNo", desde: momento, hasta: momento + TODAVIA_NO_MS }); onSonido?.("todaviaNo", arrastre.utensilio); }
      } else if (respuesta === "avanza") onSonido?.("frotando", arrastre.utensilio);
      else if (respuesta === "pasoHecho") onSonido?.("pasoHecho", arrastre.utensilio);
      else if (respuesta === "terminado") {
        setArrastre(null);
        setCara({ animacion: "cantar", desde: momento, hasta: momento + CANTA_MS });
        onSonido?.("terminado", null);
        temporizadores.despues(reduceMotion ? 0 : CANTA_MS, () => setFin(true));
      }
    };
    const soltar = () => { setArrastre(null); anteriorRef.current = null; onSonido?.("nada", null); };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
    };
  });

  const coger = (utensilio: Utensilio) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (fin || terminado(bano) || event.button !== 0) return;
    event.preventDefault();
    anteriorRef.current = null;
    const escena = escenaRef.current?.getBoundingClientRect();
    setArrastre({ utensilio, x: event.clientX - (escena?.left ?? 0), y: event.clientY - (escena?.top ?? 0) });
  };

  const toca = utensilioQueToca(bano);
  const aspecto = aspectoDelGatito(bano);
  const animacion: AnimacionGato = cara && ahora < cara.hasta ? cara.animacion : terminado(bano) ? "cantar" : "sentado";
  const desde = cara?.desde ?? 0;
  const { fila } = ANIMACIONES_GATO[animacion];
  const cuadro = reduceMotion ? 0 : cuadroDe(animacion, (ahora - desde) / 1000);
  const efecto = arrastre && toca === arrastre.utensilio ? arrastre.utensilio : null;

  return <div className="casa-bano" style={ARTE_BANO} role="dialog" aria-label={t("casa.bano.titulo.oculto", { nombre })}>
    <BotonControl className="casa-bano-salir" pictograma="vuelve" etiqueta="casa.bano.salir.oculto" onClick={onSalir} disabled={fin} />
    <div className="casa-bano-escena" ref={escenaRef}>
      <span className="casa-bano-trasera" />
      <span ref={gatitoRef} className="casa-bano-gatito" style={{
        backgroundImage: hoja ? `url("${hoja}")` : undefined,
        backgroundPosition: `calc(var(--celda) * ${-cuadro}) calc(var(--celda) * ${-fila})`,
        filter: `brightness(${1 - aspecto.mojado * 0.22}) saturate(${1 + aspecto.mojado * 0.15})${aspecto.brillo ? ` drop-shadow(0 0 ${Math.round(aspecto.brillo * 10)}px #ffd76a)` : ""}`,
        transform: `translateX(-50%) scale(${1 + aspecto.esponjoso * 0.06})`,
      } as CSSProperties}>
        {bano.espuma.map((grumo, indice) => <i key={indice} className={`casa-bano-espuma is-${grumo.tam}`} style={{ left: `${grumo.x * 100}%`, top: `${grumo.y * 100}%` }} />)}
      </span>
      <span className="casa-bano-borde" />
      {efecto && <i className={`casa-bano-efecto is-${efecto}`} style={{ left: arrastre!.x, top: arrastre!.y }} />}
      {arrastre && <i className={`casa-bano-utensilio is-${arrastre.utensilio} casa-bano-arrastrado`} style={{ left: arrastre.x, top: arrastre.y }} />}
    </div>
    {!fin && <div className="casa-bano-bandeja" role="toolbar" aria-label={t("casa.bano.bandeja.oculto")}>
      {UTENSILIOS.map((utensilio) => <button key={utensilio} type="button" className={`casa-bano-boton${toca === utensilio ? " is-toca" : ""}${arrastre?.utensilio === utensilio ? " is-cogido" : ""}`}
        aria-label={tClave(`casa.bano.utensilio.${utensilio}.oculto`)} onPointerDown={coger(utensilio)}>
        <i className={`casa-bano-utensilio is-${utensilio}`} />
      </button>)}
    </div>}
    {fin && <Ventana id="casa-bano-fin" titulo="casa.bano.fin.titulo.rotulo" celebracion onClose={onTerminar}
      botones={<Boton tipo="seguir" clave="casa.bano.fin.sigue.rotulo" data-gamepad-default onClick={onTerminar} />}>
      <p className="juntos">{t("casa.bano.fin.frase.juntos", { nombre })}</p>
    </Ventana>}
  </div>;
}
