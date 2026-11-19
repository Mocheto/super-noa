import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { avanzar, barrer, bocadilloDe, cuidar, dejarHuella, esDeNoche, estadoDe, llegadasPendientes, NECESIDADES, presentar, type CasaProgress, type Cuidado, type NecesidadId, type RespuestaCuidado } from "./casa";
import {
  aEscena, autodeslizar, centrarEn, CUIDADO_DE, ESCENA_CASA, escalaCasa, frotar, gatitoEn, gatitoMasCerca, HERRAMIENTAS, huellaEn, leerAjustesCasa, limitarVista,
  SITIOS_CASA, SITIOS_NOCHE, type Frote, type Herramienta,
} from "./casaInteraccion";
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
/** Velocidad con que se desliza sola la vista al llevar un objeto al borde, en px de escena por fotograma. */
const AUTODESLIZAR_PX = 9;
/** Un arrastre que empieza fuera de un gatito desliza la habitación a partir de este movimiento, en px de pantalla. */
const UMBRAL_DESLIZAR = 6;
/** Marco caramelo neutro de la casa, color miel. */
const ACENTO_CASA = { "--acento": "#e0a452", "--acento-oscuro": "#a8693a", "--acento-claro": "#f6d08f" };
/** Espacio de pantalla que no es habitación: botón de salir arriba, márgenes y marco. */
const MARGEN_ARRIBA = 64;
const MARGEN_LADOS = 32;
const MARCO_MOVIL = 16;
/** En el móvil vertical la bandeja va debajo de la habitación. */
const ALTO_BANDEJA_VERTICAL = 120;

/** Necesidad que enseña cada objeto en el bocadillo. */
const OBJETO_DE: Record<NecesidadId, Herramienta | "mano"> = { comer: "cuenco", mimos: "mano", bano: "esponja", jugar: "pelota" };

// Los ajustes de prueba también se leen en la web publicada, para probar la casa con Noa en su móvil.
const ajustes = leerAjustesCasa(window.location.search);

const porcentajeX = (x: number) => `${(x / ESCENA_CASA.ancho) * 100}%`;
const porcentajeY = (y: number) => `${(y / ESCENA_CASA.alto) * 100}%`;
const nombreDe = (mundo: number) => tClave(`mundos.${mundo}.gato.rotulo`);

/** «MIEL», «MIEL y BRUMA» o «MIEL, BRUMA y PINO». */
function nombresJuntos(mundos: readonly number[]): string {
  const nombres = mundos.map(nombreDe);
  if (nombres.length < 2) return nombres[0] ?? "";
  return t("casa.llegada.union.juntos", { primeros: nombres.slice(0, -1).join(", "), ultimo: nombres[nombres.length - 1] });
}

/** Con `?casaNecesidades=pide|senota`, los gatitos piden o dan pistas para probar los cuidados. */
function conNecesidadesDePrueba(casa: CasaProgress): CasaProgress {
  if (!ajustes.necesidades) return casa;
  const valor = ajustes.necesidades === "pide" ? 1 : 0.6;
  return { ...casa, gatitos: Object.fromEntries(Object.entries(casa.gatitos).map(([mundo, gatito]) =>
    [mundo, { ...gatito, necesidades: Object.fromEntries(NECESIDADES.map((id) => [id, valor])) as Record<NecesidadId, number> }])) };
}

type Arrastre = { herramienta: Herramienta; x: number; y: number };
type Respuesta = { gatito: number; tipo: RespuestaCuidado; corazon: boolean; id: number };
type Pelota = { x: number; y: number; gatito: number; id: number };
type Desliz = { clienteX: number; vista: number; moviendo: boolean };
type Medidas = { escala: number; anchoVisor: number; vertical: boolean; medido: boolean };

/**
 * La casa de los gatitos: la llegada de los gatitos rescatados y los cuidados con la bandeja (arrastrar el cuenco,
 * frotar al gatito o con la esponja, lanzar la pelota y barrer las huellas) en una habitación de 1280 × 540 que se
 * desliza con el dedo. La habitación, los objetos y los gatitos son provisionales hasta que llegue su arte.
 */
export function CasaGatitos({ casa: guardada, levelStats, reduceMotion, onGuardar, onSalir }: Props) {
  const inicial = useMemo(() => conNecesidadesDePrueba(prepararCasa(guardada, levelStats, new Date())), [guardada, levelStats]);
  const [casa, setCasa] = useState(inicial);
  const [llegan] = useState(() => llegadasPendientes(inicial));
  const [fase, setFase] = useState<"entrando" | "hola" | "casa">(llegan.length ? "entrando" : "casa");
  const [noche, setNoche] = useState(() => esDeNoche(new Date()));
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [pelota, setPelota] = useState<Pelota | null>(null);
  const [frotando, setFrotando] = useState<number | null>(null);
  const [medidas, setMedidas] = useState<Medidas>({ escala: 0.75, anchoVisor: 600, vertical: false, medido: false });
  const [vista, setVista] = useState<number | null>(null);
  const seccionRef = useRef<HTMLElement>(null);
  const visorRef = useRef<HTMLDivElement>(null);
  const escenaRef = useRef<HTMLDivElement>(null);
  const casaRef = useRef(casa);
  const froteRef = useRef<Frote | null>(null);
  const dedoRef = useRef(false);
  const deslizRef = useRef<Desliz | null>(null);
  const autoRef = useRef<-1 | 0 | 1>(0);
  const idRef = useRef(0);
  useEffect(() => { casaRef.current = casa; }, [casa]);

  const presentes = MUNDOS_CASA.filter((mundo) => casa.gatitos[mundo]).join(",");
  const gatitos = useMemo(() => presentes ? presentes.split(",").map(Number) : [], [presentes]);
  // De día, sobre la alfombra; de noche, juntos en la cama (salvo mientras llegan por la puerta).
  const sitios = useMemo(() => gatitos.map((mundo) => (noche && fase === "casa" ? SITIOS_NOCHE : SITIOS_CASA)[MUNDOS_CASA.indexOf(mundo)] ?? SITIOS_CASA[0]),
    [gatitos, noche, fase]);
  const anchoVisible = medidas.anchoVisor / medidas.escala;
  const vistaX = limitarVista(vista ?? 0, anchoVisible);

  // La habitación cabe a lo alto; en pantallas estrechas no baja de 0,75 y se desliza.
  useLayoutEffect(() => {
    const seccion = seccionRef.current;
    if (!seccion) return;
    const medir = () => {
      const vertical = window.matchMedia("(orientation: portrait) and (max-width: 600px)").matches;
      const ancho = seccion.clientWidth - MARGEN_LADOS - MARCO_MOVIL;
      // La sección crece con su contenido: el alto disponible es el de la ventana desde donde empieza.
      const alto = window.innerHeight - Math.max(0, seccion.getBoundingClientRect().top) - MARGEN_ARRIBA - MARCO_MOVIL - (vertical ? ALTO_BANDEJA_VERTICAL : 0);
      const escala = escalaCasa(ancho, alto);
      setMedidas({ escala, anchoVisor: Math.min(ancho, ESCENA_CASA.ancho * escala), vertical, medido: true });
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(seccion);
    window.addEventListener("resize", medir);
    return () => { observador.disconnect(); window.removeEventListener("resize", medir); };
  }, []);

  // Al entrar, la vista va al gatito que pide algo, o al centro de la alfombra.
  useEffect(() => {
    if (vista !== null || !medidas.medido) return;
    const pide = gatitos.findIndex((mundo) => bocadilloDe(casaRef.current.gatitos[mundo]));
    setVista(centrarEn(pide >= 0 ? sitios[pide] : SITIOS_CASA[1], anchoVisible));
  }, [vista, medidas, gatitos, sitios, anchoVisible]);

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

  // El tiempo sigue pasando con la casa abierta, un gatito sucio va dejando huellas y se nota si se hace de noche.
  useEffect(() => {
    if (fase !== "casa") return;
    const huellas = window.setInterval(() => {
      let siguiente = casaRef.current;
      gatitos.forEach((mundo, indice) => { siguiente = dejarHuella(siguiente, mundo, sitios[indice] + (Math.random() - 0.5) * 240); });
      if (siguiente !== casaRef.current) guardar(siguiente);
    }, HUELLA_CADA_MS);
    const reloj = window.setInterval(() => { guardar(avanzar(casaRef.current, new Date())); setNoche(esDeNoche(new Date())); }, TIEMPO_CADA_MS);
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

  // Con un objeto cerca del borde de la vista, la habitación se desliza sola hacia ese lado.
  const arrastrando = arrastre !== null;
  useEffect(() => {
    if (!arrastrando) return;
    let fotograma = 0;
    const paso = () => {
      if (autoRef.current) setVista((actual) => limitarVista((actual ?? 0) + autoRef.current * AUTODESLIZAR_PX, anchoVisible));
      fotograma = requestAnimationFrame(paso);
    };
    fotograma = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(fotograma);
  }, [arrastrando, anchoVisible]);

  // Arrastrar un objeto de la bandeja: se sigue al dedo por toda la pantalla, aunque salga de la escena.
  useEffect(() => {
    if (!arrastre) return;
    const mover = (event: PointerEvent) => {
      const caja = visorRef.current?.getBoundingClientRect();
      autoRef.current = caja ? autodeslizar(event.clientX, caja.left, caja.right) : 0;
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
      const caja = visorRef.current?.getBoundingClientRect();
      const dentro = Boolean(caja && event.clientX >= caja.left && event.clientX <= caja.right && event.clientY >= caja.top && event.clientY <= caja.bottom);
      froteRef.current = null;
      autoRef.current = 0;
      setFrotando(null);
      setArrastre(null);
      if (!punto || !dentro) return;
      if (arrastre.herramienta === "cuenco") {
        const indice = gatitoEn(punto.x, punto.y, sitios, ajustes.toque);
        if (indice >= 0) atender(indice, "comer");
      } else if (arrastre.herramienta === "pelota") {
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
    setVista(centrarEn(sitios[indice], anchoVisible));
    if (herramienta === "pelota") lanzar(sitios[indice], ESCENA_CASA.suelo - 40);
    else atender(indice, cuidado);
  };

  // Con el dedo y sin objeto: sobre un gatito, frotar; fuera de los gatitos, deslizar la habitación.
  const empezarDedo = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (fase !== "casa" || arrastre || event.button !== 0) return;
    const punto = enEscena(event);
    if (!punto) return;
    const indice = gatitoEn(punto.x, punto.y, sitios, ajustes.toque);
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* sin captura, el deslizar sigue funcionando dentro de la escena */ }
    if (indice < 0) {
      deslizRef.current = { clienteX: event.clientX, vista: vistaX, moviendo: false };
      return;
    }
    dedoRef.current = true;
    froteRef.current = frotar(null, indice, performance.now(), ajustes.frotarMs).frote;
    setFrotando(froteRef.current?.gatito ?? null);
  };
  const moverDedo = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (arrastre) return;
    const desliz = deslizRef.current;
    if (desliz) {
      const distancia = event.clientX - desliz.clienteX;
      if (desliz.moviendo || Math.abs(distancia) > UMBRAL_DESLIZAR) {
        desliz.moviendo = true;
        setVista(limitarVista(desliz.vista - distancia / medidas.escala, anchoVisible));
      }
      return;
    }
    if (!dedoRef.current) return;
    const punto = enEscena(event);
    if (!punto) return;
    const indice = gatitoEn(punto.x, punto.y, sitios, ajustes.toque);
    const { frote, listo } = frotar(froteRef.current, indice, performance.now(), ajustes.frotarMs);
    froteRef.current = frote;
    setFrotando(frote?.gatito ?? null);
    if (listo) { dedoRef.current = false; atender(indice, "frotar"); }
  };
  const acabarDedo = () => {
    dedoRef.current = false;
    deslizRef.current = null;
    if (!arrastre) { froteRef.current = null; setFrotando(null); }
  };

  const seguir = () => {
    guardar(presentar(casa, llegan));
    setFase("casa");
  };
  const salir = () => {
    onGuardar(casaRef.current);
    onSalir();
  };

  // Gatitos que piden algo pero quedan fuera de la vista: un bocadillo pequeño en ese borde.
  const fuera = fase === "casa" ? gatitos.map((mundo, indice) => {
    const pide = bocadilloDe(casa.gatitos[mundo]);
    if (!pide) return null;
    const lado = sitios[indice] < vistaX + 40 ? "izquierda" : sitios[indice] > vistaX + anchoVisible - 40 ? "derecha" : null;
    return lado ? { mundo, lado, objeto: OBJETO_DE[pide] } : null;
  }).filter((aviso): aviso is { mundo: number; lado: "izquierda" | "derecha"; objeto: Herramienta | "mano" } => aviso !== null) : [];
  const quedaIzquierda = vistaX > 1;
  const quedaDerecha = vistaX < ESCENA_CASA.ancho - anchoVisible - 1;

  const estiloMarco = { ...ACENTO_CASA, "--corazon": cssAssetUrl("./assets/sprites/ui-heart-v1.png"), "--objeto": `${Math.max(56, ajustes.objeto * medidas.escala)}px` } as CSSProperties;
  const estiloEscena = { "--objeto-escena": `${ajustes.objeto}px`, transform: `translateX(${-vistaX * medidas.escala}px) scale(${medidas.escala})` } as CSSProperties;

  return <section ref={seccionRef} className={`casa-gatitos${reduceMotion ? " is-quieta" : ""}${arrastre ? " is-arrastrando" : ""}${medidas.vertical ? " is-vertical" : ""}`} aria-label={t("casa.titulo.oculto")}>
    <BotonControl className="casa-salir" pictograma="mapa" etiqueta="casa.salir.oculto" onClick={salir} disabled={fase === "hola"} />
    <div className="casa-marco game-frame" style={estiloMarco}>
      <div className="casa-visor" ref={visorRef} style={{ width: medidas.anchoVisor, height: ESCENA_CASA.alto * medidas.escala }}>
        <div className={`casa-escena${noche ? " is-noche" : ""}`} ref={escenaRef} style={estiloEscena}
          onPointerDown={empezarDedo} onPointerMove={moverDedo} onPointerUp={acabarDedo} onPointerCancel={acabarDedo}>
          <div className="casa-pared" />
          <div className="casa-ventana" />
          <div className="casa-cuadro" />
          <div className="casa-estanteria" />
          <div className="casa-rascador" />
          <div className="casa-banera" />
          <div className="casa-lampara" />
          <div className="casa-suelo" style={{ top: porcentajeY(ESCENA_CASA.suelo) }} />
          <div className="casa-alfombra" />
          <div className="casa-cama" />
          <div className={`casa-puerta${fase === "entrando" ? " is-abierta" : ""}`} style={{ left: porcentajeX(PUERTA_X - 70) }} />
          {casa.huellas.map((huella, indice) => <i key={`${huella.x}-${indice}`} className="casa-huella" style={{ left: porcentajeX(huella.x), top: porcentajeY(ESCENA_CASA.suelo + 22 + (indice % 2) * 18) }} />)}
          {gatitos.map((mundo, indice) => {
            const llegando = llegan.includes(mundo) && fase === "entrando";
            const gatito = casa.gatitos[mundo];
            const pide = fase === "casa" ? bocadilloDe(gatito) : null;
            const respuesta = respuestas.find((r) => r.gatito === indice);
            const sucio = estadoDe(gatito.necesidades.bano) !== "bien";
            const dormido = noche && fase === "casa" && !respuesta && frotando !== indice;
            const gato = worldCatalog.find((world) => world.id === mundo);
            return <div key={mundo} className={`casa-gatito${llegando ? " is-llegando" : ""}${respuesta ? ` is-${respuesta.tipo}` : ""}${frotando === indice ? " is-frotado" : ""}${dormido ? " is-dormido" : ""}`}
              style={{ "--desde": porcentajeX(PUERTA_X), left: porcentajeX(sitios[indice]) } as CSSProperties}>
              <img src={gato?.catAsset} alt={t("casa.gatito.oculto", { nombre: nombreDe(mundo) })} draggable={false} />
              {sucio && <span className="casa-barro" aria-hidden="true" />}
              {pide && !respuesta && !dormido && <span className="casa-bocadillo" aria-hidden="true"><i className={`casa-objeto is-${OBJETO_DE[pide]}`} /></span>}
              {dormido && <span className="casa-zzz" aria-hidden="true" />}
              {respuesta?.corazon && <span className="casa-corazon" aria-hidden="true" />}
            </div>;
          })}
          <div className="casa-luz-noche" aria-hidden="true" />
          {pelota && <i key={pelota.id} className="casa-objeto is-pelota casa-pelota-lanzada" style={{ left: porcentajeX(pelota.x), top: porcentajeY(pelota.y), "--hasta": porcentajeX(sitios[pelota.gatito]) } as CSSProperties} />}
          {arrastre && <i className={`casa-objeto is-${arrastre.herramienta} casa-arrastrado`} style={{ left: porcentajeX(arrastre.x), top: porcentajeY(arrastre.y) }} />}
        </div>
        {quedaIzquierda && <span className="casa-borde is-izquierda" aria-hidden="true" />}
        {quedaDerecha && <span className="casa-borde is-derecha" aria-hidden="true" />}
        {fuera.map((aviso) => <span key={aviso.mundo} className={`casa-aviso is-${aviso.lado}`} aria-hidden="true"><i className={`casa-objeto is-${aviso.objeto}`} /></span>)}
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
