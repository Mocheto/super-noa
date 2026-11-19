import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { llegadasPendientes, presentar, type CasaProgress } from "./casa";
import { MUNDOS_CASA, prepararCasa } from "./casaRescate";
import { Ventana } from "./Ventana";
import { worldCatalog } from "./worldMapData";
import { t, tClave } from "../textos/index.ts";
import { Boton, BotonControl } from "../textos/Texto";
import "./casa.css";

type Props = {
  casa: CasaProgress | undefined;
  levelStats: Record<string, { completed?: boolean } | undefined>;
  reduceMotion: boolean;
  /** Guarda la casa en el progreso: al ver una llegada y al salir. */
  onGuardar: (casa: CasaProgress) => void;
  onSalir: () => void;
};

/** Medidas de la escena, en las coordenadas de la habitación de 960 × 540. */
const ESCENA = { ancho: 960, alto: 540, suelo: 470, puerta: 120 } as const;
/** Sitio de cada gatito en la habitación, por su orden en `MUNDOS_CASA`. */
const SITIOS = [330, 560, 790];
/** Duración de la llegada: la puerta se abre y los gatitos entran hasta su sitio. */
const LLEGADA_MS = 2000;

const porcentajeX = (x: number) => `${(x / ESCENA.ancho) * 100}%`;
const nombreDe = (mundo: number) => tClave(`mundos.${mundo}.gato.rotulo`);

/** «MIEL», «MIEL y BRUMA» o «MIEL, BRUMA y PINO». */
function nombresJuntos(mundos: readonly number[]): string {
  const nombres = mundos.map(nombreDe);
  if (nombres.length < 2) return nombres[0] ?? "";
  return t("casa.llegada.union.juntos", { primeros: nombres.slice(0, -1).join(", "), ultimo: nombres[nombres.length - 1] });
}

/**
 * La casa de los gatitos. Esta primera versión monta la entrada, la habitación provisional y la llegada de los gatitos
 * rescatados (decisión «Llegar a la casa y llegar un gatito nuevo»); los cuidados y la vida propia llegan después.
 */
export function CasaGatitos({ casa: guardada, levelStats, reduceMotion, onGuardar, onSalir }: Props) {
  const inicial = useMemo(() => prepararCasa(guardada, levelStats, new Date()), [guardada, levelStats]);
  const [casa, setCasa] = useState(inicial);
  const [llegan] = useState(() => llegadasPendientes(inicial));
  const [fase, setFase] = useState<"entrando" | "hola" | "casa">(llegan.length ? "entrando" : "casa");
  const casaRef = useRef(casa);
  useEffect(() => { casaRef.current = casa; }, [casa]);

  useEffect(() => {
    if (fase !== "entrando") return;
    const espera = window.setTimeout(() => setFase("hola"), reduceMotion ? 0 : LLEGADA_MS);
    return () => window.clearTimeout(espera);
  }, [fase, reduceMotion]);

  useEffect(() => {
    // El «atrás» (Escape en el teclado) vuelve al mapa guardando la casa, salvo con la ventana de llegada abierta.
    const alPulsar = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || fase === "hola") return;
      onGuardar(casaRef.current);
      onSalir();
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [fase, onGuardar, onSalir]);

  const seguir = () => {
    const presentada = presentar(casa, llegan);
    setCasa(presentada);
    onGuardar(presentada);
    setFase("casa");
  };
  const salir = () => {
    onGuardar(casa);
    onSalir();
  };

  const gatitos = MUNDOS_CASA.filter((mundo) => casa.gatitos[mundo]);
  const puertaAbierta = fase === "entrando";

  return <section className={`casa-gatitos${reduceMotion ? " is-quieta" : ""}`} aria-label={t("casa.titulo.oculto")}>
    <BotonControl className="casa-salir" pictograma="mapa" etiqueta="casa.salir.oculto" onClick={salir} disabled={fase === "hola"} />
    <div className="casa-escena">
      <div className="casa-pared" />
      <div className="casa-ventana" />
      <div className="casa-suelo" style={{ top: `${(ESCENA.suelo / ESCENA.alto) * 100}%` }} />
      <div className={`casa-puerta${puertaAbierta ? " is-abierta" : ""}`} style={{ left: porcentajeX(ESCENA.puerta - 70) }} />
      {gatitos.map((mundo) => {
        const llegando = llegan.includes(mundo) && fase === "entrando";
        const sitio = SITIOS[MUNDOS_CASA.indexOf(mundo)] ?? SITIOS[0];
        const gato = worldCatalog.find((world) => world.id === mundo);
        return <img key={mundo} className={`casa-gatito${llegando ? " is-llegando" : ""}`} src={gato?.catAsset} alt={t("casa.gatito.oculto", { nombre: nombreDe(mundo) })}
          style={{ "--desde": porcentajeX(ESCENA.puerta), left: porcentajeX(sitio) } as CSSProperties} />;
      })}
    </div>
    {fase === "hola" && <Ventana id="casa-llegada" titulo="casa.llegada.titulo.rotulo" celebracion onClose={seguir}
      botones={<Boton tipo="seguir" clave="casa.llegada.sigue.rotulo" data-gamepad-default onClick={seguir} />}>
      <div className="ventana-dibujo casa-llegada-dibujo">{llegan.map((mundo) => <img key={mundo} src={worldCatalog.find((world) => world.id === mundo)?.catAsset} alt="" />)}</div>
      <p className="juntos">{llegan.length === 1 ? t("casa.llegada.uno.juntos", { nombre: nombreDe(llegan[0]) }) : t("casa.llegada.varios.juntos", { nombres: nombresJuntos(llegan) })}</p>
    </Ventana>}
  </section>;
}
