import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { avanzar, barrer, bocadilloDe, cuidar, dejarHuella, estadoDe, llegadasPendientes, NECESIDADES, presentar, type CasaProgress, type Cuidado, type NecesidadId, type RespuestaCuidado } from "./casa";
import { aEscena, CUIDADO_DE, ESCENA_CASA, frotar, gatitoEn, gatitoMasCerca, HERRAMIENTAS, huellaEn, leerAjustesCasa, SITIOS_CASA, type Frote, type Herramienta } from "./casaInteraccion";
import { MUNDOS_CASA, prepararCasa } from "./casaRescate";
import { cssAssetUrl } from "./assets";
import { Ventana } from "./Ventana";
import { worldCatalog } from "./worldMapData";
import { t, tClave } from "../textos/index.ts";
import { Boton, BotonControl } from "../textos/Texto";
import "./casa.css";

type Props = {
  casa: CasaProgress | undefined;
  levelStats: Record<string, { completed?: boolean } | undefined>;
  reduceMotion: boolean;
  /** Guarda la casa en el progreso: al ver una llegada, tras cada cuidado y al salir. */
  onGuardar: (casa: CasaProgress) => void;
  onSalir: () => void;
};

const PUERTA_X = 120;
/** Duración de la llegada: la puerta se abre y los gatitos entran hasta su sitio. */
const LLEGADA_MS = 2000;
/** Lo que tarda el gatito en atrapar la pelota tras soltarla. */
const ATRAPAR_MS = 700;
/** Cada cuánto deja huella un gatito sucio y cada cuánto pasa el tiempo de la casa. */
const HUELLA_CADA_MS = 6000;
const TIEMPO_CADA_MS = 60_000;
/** Cuánto se ve la respuesta del gatito a un cuidado. */
const RESPUESTA_MS = 1400;

/** Necesidad que enseña cada objeto en el bocadillo. */
const OBJETO_DE: Record<NecesidadId, Herramienta | "mano"> = { comer: "cuenco", mimos: "mano", bano: "esponja", jugar: "pelota" };

const ajustes = leerAjustesCasa(import.meta.env.DEV ? window.location.search : null);

const porcentajeX = (x: number) => `${(x / ESCENA_CASA.ancho) * 100}%`;
const porcentajeY = (y: number) => `${(y / ESCENA_CASA.alto) * 100}%`;
const nombreDe = (mundo: number) => tClave(`mundos.${mundo}.gato.rotulo`);

/** «MIEL», «MIEL y BRUMA» o «MIEL, BRUMA y PINO». */
function nombresJuntos(mundos: readonly number[]): string {
  const nombres = mundos.map(nombreDe);
  if (nombres.length < 2) return nombres[0] ?? "";
  return t("casa.llegada.union.juntos", { primeros: nombres.slice(0, -1).join(", "), ultimo: nombres[nombres.length - 1] });
}

/** En desarrollo, `?casaNecesidades=pide|senota` pone a los gatitos pidiendo o con pistas para probar los cuidados. */
function conNecesidadesDePrueba(casa: CasaProgress): CasaProgress {
  if (!ajustes.necesidades) return casa;
  const valor = ajustes.necesidades === "pide" ? 1 : 0.6;
  return { ...casa, gatitos: Object.fromEntries(Object.entries(casa.gatitos).map(([mundo, gatito]) =>
    [mundo, { ...gatito, necesidades: Object.fromEntries(NECESIDADES.map((id) => [id, valor])) as Record<NecesidadId, number> }])) };
}

type Arrastre = { herramienta: Herramienta; x: number; y: number };
type Respuesta = { gatito: number; tipo: RespuestaCuidado; corazon: boolean; id: number };
type Pelota = { x: number; y: number; gatito: number; id: number };

/**
 * La casa de los gatitos: la llegada de los gatitos rescatados y, como prototipo, los cuidados con la bandeja
 * (arrastrar el cuenco, frotar al gatito o con la esponja, lanzar la pelota y barrer las huellas). La habitación y
 * los gatitos son provisionales hasta que llegue su arte.
 */
export function CasaGatitos({ casa: guardada, levelStats, reduceMotion, onGuardar, onSalir }: Props) {
  const inicial = useMemo(() => conNecesidadesDePrueba(prepararCasa(guardada, levelStats, new Date())), [guardada, levelStats]);
  const [casa, setCasa] = useState(inicial);
  const [llegan] = useState(() => llegadasPendientes(inicial));
  const [fase, setFase] = useState<"entrando" | "hola" | "casa">(llegan.length ? "entrando" : "casa");
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [pelota, setPelota] = useState<Pelota | null>(null);
  const [frotando, setFrotando] = useState<number | null>(null);
  const casaRef = useRef(casa);
  const escenaRef = useRef<HTMLDivElement>(null);
  const froteRef = useRef<Frote | null>(null);
  const dedoRef = useRef(false);
  const idRef = useRef(0);
  useEffect(() => { casaRef.current = casa; }, [casa]);

  const presentes = MUNDOS_CASA.filter((mundo) => casa.gatitos[mundo]).join(",");
  const gatitos = useMemo(() => presentes ? presentes.split(",").map(Number) : [], [presentes]);
  const sitios = useMemo(() => gatitos.map((mundo) => SITIOS_CASA[MUNDOS_CASA.indexOf(mundo)] ?? SITIOS_CASA[0]), [gatitos]);

  const guardar = useCallback((nueva: CasaProgress) => {
    casaRef.current = nueva;
    setCasa(nueva);
    onGuardar(nueva);
  }, [onGuardar]);

  const atender = useCallback((indice: number, cuidado: Cuidado) => {
    const mundo = gatitos[indice];
    if (mundo === undefined) return;
    const resultado = cuidar(casaRef.current, mundo, cuidado, new Date());
    guardar(resultado.casa);
    const id = ++idRef.current;
    setRespuestas((actuales) => [...actuales.filter((r) => r.gatito !== indice), { gatito: indice, tipo: resultado.respuesta, corazon: resultado.corazon, id }]);
    window.setTimeout(() => setRespuestas((actuales) => actuales.filter((r) => r.id !== id)), RESPUESTA_MS);
  }, [gatitos, guardar]);

  useEffect(() => {
    if (fase !== "entrando") return;
    const espera = window.setTimeout(() => setFase("hola"), reduceMotion ? 0 : LLEGADA_MS);
    return () => window.clearTimeout(espera);
  }, [fase, reduceMotion]);

  // El tiempo sigue pasando con la casa abierta, y un gatito sucio va dejando huellas cerca de su sitio.
  useEffect(() => {
    if (fase !== "casa") return;
    const huellas = window.setInterval(() => {
      let siguiente = casaRef.current;
      gatitos.forEach((mundo, indice) => { siguiente = dejarHuella(siguiente, mundo, sitios[indice] + (Math.random() - 0.5) * 240); });
      if (siguiente !== casaRef.current) guardar(siguiente);
    }, HUELLA_CADA_MS);
    const reloj = window.setInterval(() => guardar(avanzar(casaRef.current, new Date())), TIEMPO_CADA_MS);
    return () => { window.clearInterval(huellas); window.clearInterval(reloj); };
  }, [fase, gatitos, sitios, guardar]);

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

  const enEscena = (event: { clientX: number; clientY: number }) => {
    const caja = escenaRef.current?.getBoundingClientRect();
    return caja ? aEscena(event.clientX, event.clientY, caja) : null;
  };

  /** La pelota cae donde se suelta y corre a por ella el gatito más cercano. */
  const lanzar = (x: number, y: number) => {
    const indice = gatitoMasCerca(x, sitios);
    const id = ++idRef.current;
    setPelota({ x, y, gatito: indice, id });
    window.setTimeout(() => {
      setPelota((actual) => actual?.id === id ? null : actual);
      atender(indice, "pelota");
    }, reduceMotion ? 0 : ATRAPAR_MS);
  };

  // Arrastrar un objeto de la bandeja: se sigue al dedo por toda la pantalla, aunque salga de la escena.
  useEffect(() => {
    if (!arrastre) return;
    const mover = (event: PointerEvent) => {
      const punto = enEscena(event);
      if (!punto) return;
      setArrastre((actual) => actual && { ...actual, ...punto });
      if (arrastre.herramienta === "esponja") {
        const indice = gatitoEn(punto.x, punto.y, sitios, ajustes.toque);
        const { frote, listo } = frotar(froteRef.current, indice, performance.now(), ajustes.frotarMs);
        froteRef.current = frote;
        setFrotando(frote?.gatito ?? null);
        if (listo) atender(indice, "esponja");
      } else if (arrastre.herramienta === "escoba") {
        const huella = huellaEn(punto.x, punto.y, casaRef.current.huellas);
        if (huella >= 0) guardar(barrer(casaRef.current, huella));
      }
    };
    const soltar = (event: PointerEvent) => {
      const punto = enEscena(event);
      froteRef.current = null;
      setFrotando(null);
      setArrastre(null);
      if (!punto) return;
      if (arrastre.herramienta === "cuenco") {
        const indice = gatitoEn(punto.x, punto.y, sitios, ajustes.toque);
        if (indice >= 0) atender(indice, "comer");
      } else if (arrastre.herramienta === "pelota" && punto.x >= 0 && punto.x <= ESCENA_CASA.ancho && punto.y >= 0 && punto.y <= ESCENA_CASA.alto) {
        lanzar(punto.x, punto.y);
      }
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
    };
  });

  const cogerObjeto = (herramienta: Herramienta) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (fase !== "casa" || event.button !== 0) return;
    event.preventDefault();
    const punto = enEscena(event) ?? { x: 0, y: 0 };
    froteRef.current = null;
    setArrastre({ herramienta, ...punto });
  };

  /** Con el teclado (o un lector de pantalla), el objeto va al gatito que lo pide, o al primero. */
  const usarConTeclado = (herramienta: Herramienta) => {
    if (fase !== "casa" || !gatitos.length) return;
    if (herramienta === "escoba") { if (casaRef.current.huellas.length) guardar(barrer(casaRef.current, 0)); return; }
    const cuidado = CUIDADO_DE[herramienta];
    const necesidad = NECESIDADES.find((id) => OBJETO_DE[id] === herramienta)!;
    const indice = Math.max(0, gatitos.findIndex((mundo) => estadoDe(casaRef.current.gatitos[mundo].necesidades[necesidad]) !== "bien"));
    if (herramienta === "pelota") lanzar(sitios[indice], ESCENA_CASA.suelo - 40);
    else atender(indice, cuidado);
  };

  // Frotar con el dedo, sin objeto: se empieza sobre un gatito y cuenta mientras el dedo se mueve encima.
  const empezarMimo = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (fase !== "casa" || arrastre) return;
    const punto = enEscena(event);
    if (!punto || gatitoEn(punto.x, punto.y, sitios, ajustes.toque) < 0) return;
    dedoRef.current = true;
    froteRef.current = frotar(null, gatitoEn(punto.x, punto.y, sitios, ajustes.toque), performance.now(), ajustes.frotarMs).frote;
    setFrotando(froteRef.current?.gatito ?? null);
  };
  const moverMimo = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dedoRef.current || arrastre) return;
    const punto = enEscena(event);
    if (!punto) return;
    const indice = gatitoEn(punto.x, punto.y, sitios, ajustes.toque);
    const { frote, listo } = frotar(froteRef.current, indice, performance.now(), ajustes.frotarMs);
    froteRef.current = frote;
    setFrotando(frote?.gatito ?? null);
    if (listo) { dedoRef.current = false; atender(indice, "frotar"); }
  };
  const acabarMimo = () => {
    dedoRef.current = false;
    if (!arrastre) { froteRef.current = null; setFrotando(null); }
  };

  const seguir = () => {
    const presentada = presentar(casa, llegan);
    guardar(presentada);
    setFase("casa");
  };
  const salir = () => {
    onGuardar(casaRef.current);
    onSalir();
  };

  const tamanoObjeto = { "--objeto": `${(ajustes.objeto / ESCENA_CASA.ancho) * 100}cqw`, "--corazon": cssAssetUrl("./assets/sprites/ui-heart-v1.png") } as CSSProperties;

  return <section className={`casa-gatitos${reduceMotion ? " is-quieta" : ""}${arrastre ? " is-arrastrando" : ""}`} aria-label={t("casa.titulo.oculto")}>
    <BotonControl className="casa-salir" pictograma="mapa" etiqueta="casa.salir.oculto" onClick={salir} disabled={fase === "hola"} />
    <div className="casa-marco" style={tamanoObjeto}>
      <div className="casa-escena" ref={escenaRef} onPointerDown={empezarMimo} onPointerMove={moverMimo} onPointerUp={acabarMimo} onPointerLeave={acabarMimo} onPointerCancel={acabarMimo}>
        <div className="casa-pared" />
        <div className="casa-ventana" />
        <div className="casa-suelo" style={{ top: porcentajeY(ESCENA_CASA.suelo) }} />
        <div className={`casa-puerta${fase === "entrando" ? " is-abierta" : ""}`} style={{ left: porcentajeX(PUERTA_X - 70) }} />
        {casa.huellas.map((huella, indice) => <i key={`${huella.x}-${indice}`} className="casa-huella" style={{ left: porcentajeX(huella.x), top: porcentajeY(ESCENA_CASA.suelo + 22 + (indice % 2) * 18) }} />)}
        {gatitos.map((mundo, indice) => {
          const llegando = llegan.includes(mundo) && fase === "entrando";
          const gatito = casa.gatitos[mundo];
          const pide = fase === "casa" ? bocadilloDe(gatito) : null;
          const respuesta = respuestas.find((r) => r.gatito === indice);
          const sucio = estadoDe(gatito.necesidades.bano) !== "bien";
          const gato = worldCatalog.find((world) => world.id === mundo);
          return <div key={mundo} className={`casa-gatito${llegando ? " is-llegando" : ""}${respuesta ? ` is-${respuesta.tipo}` : ""}${frotando === indice ? " is-frotado" : ""}`}
            style={{ "--desde": porcentajeX(PUERTA_X), left: porcentajeX(sitios[indice]) } as CSSProperties}>
            <img src={gato?.catAsset} alt={t("casa.gatito.oculto", { nombre: nombreDe(mundo) })} draggable={false} />
            {sucio && <span className="casa-barro" aria-hidden="true" />}
            {pide && !respuesta && <span className="casa-bocadillo" aria-hidden="true"><i className={`casa-objeto is-${OBJETO_DE[pide]}`} /></span>}
            {respuesta?.corazon && <span className="casa-corazon" aria-hidden="true" />}
          </div>;
        })}
        {pelota && <i key={pelota.id} className="casa-objeto is-pelota casa-pelota-lanzada" style={{ left: porcentajeX(pelota.x), top: porcentajeY(pelota.y), "--hasta": porcentajeX(sitios[pelota.gatito]) } as CSSProperties} />}
        {arrastre && <i className={`casa-objeto is-${arrastre.herramienta} casa-arrastrado`} style={{ left: porcentajeX(arrastre.x), top: porcentajeY(arrastre.y) }} />}
      </div>
      {fase === "casa" && <div className="casa-bandeja" aria-label={t("casa.bandeja.oculto")} role="toolbar">
        {HERRAMIENTAS.map((herramienta) => <button key={herramienta} type="button" className={`casa-bandeja-objeto${arrastre?.herramienta === herramienta ? " is-cogido" : ""}`}
          aria-label={tClave(`casa.objeto.${herramienta}.oculto`)} onPointerDown={cogerObjeto(herramienta)} onClick={(event) => { if (event.detail === 0) usarConTeclado(herramienta); }}>
          <i className={`casa-objeto is-${herramienta}`} />
        </button>)}
      </div>}
    </div>
    {fase === "hola" && <Ventana id="casa-llegada" titulo="casa.llegada.titulo.rotulo" celebracion onClose={seguir}
      botones={<Boton tipo="seguir" clave="casa.llegada.sigue.rotulo" data-gamepad-default onClick={seguir} />}>
      <div className="ventana-dibujo casa-llegada-dibujo">{llegan.map((mundo) => <img key={mundo} src={worldCatalog.find((world) => world.id === mundo)?.catAsset} alt="" />)}</div>
      <p className="juntos">{llegan.length === 1 ? t("casa.llegada.uno.juntos", { nombre: nombreDe(llegan[0]) }) : t("casa.llegada.varios.juntos", { nombres: nombresJuntos(llegan) })}</p>
    </Ventana>}
  </section>;
}
