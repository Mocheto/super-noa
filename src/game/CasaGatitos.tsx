import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { avanzar, barrer, bocadilloDe, casaLimpia, cuidar, dejarHuella, esDeNoche, esMejorAmigo, estadoDe, llegadasPendientes, NECESIDADES, presentar, type CasaProgress, type Cuidado, type EstadoVida, type NecesidadId, type RespuestaCuidado } from "./casa";
import {
  aEscena, autodeslizar, centrarEn, CUIDADO_DE, ESCENA_CASA, escalaCasa, frotar, HERRAMIENTAS, huellaEn, leerAjustesCasa, limitarVista,
  SITIOS_CASA, type Frote, type Herramienta,
} from "./casaInteraccion";
import { crearSonidoCasa, type SonidoCasa } from "./casaSonido";
import { crearNana, type Nana } from "./casaNana";
import { ANIMACIONES_GATO, COLUMNAS_GATO, CUADRO_GATO, cuadroDe, FILAS_GATO, hojaDeGatito, type AnimacionGato } from "./casaGatoArte";
import { MUNDOS_CASA, prepararCasa } from "./casaRescate";
import { andando, avanzarAndante, decidir, gatitoBajo, ir, nuevoAndante, parar, type Andante } from "./casaDeambular";
import { escalaEnSuelo, HABITACION_CASA } from "./casaHabitacion";
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
  /** Silencio del juego y volúmenes de efectos y de música (0–100). */
  muted: boolean;
  effectsVolume: number;
  musicVolume: number;
  /** Guarda la casa en el progreso: al ver una llegada, tras cada cuidado y al salir. */
  onGuardar: (casa: CasaProgress) => void;
  onSalir: () => void;
};

const HABITACION = HABITACION_CASA;
const PUERTA_X = HABITACION.sitios.puerta.x;
/** Ventana de la habitación dibujada, donde se pone la ventana de noche. */
const VENTANA = HABITACION.ventanaNoche;
/** Cada cuánto se redibujan las animaciones de los gatitos. */
const PASO_ANIMACION_MS = 100;
/** Fila de los pies dentro del cuadro de 160 × 160 de la hoja del gato. */
const PIES_GATITO = 152;
/** Cuánto brilla la bandeja tras la primera llegada. */
const BRILLO_BANDEJA_MS = 3000;
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
type Respuesta = { gatito: number; tipo: RespuestaCuidado; cuidado: Cuidado; corazon: boolean; id: number; desde: number };

/** Animación de la hoja para la respuesta a un cuidado. */
function animacionDeRespuesta(respuesta: Respuesta): AnimacionGato {
  if (respuesta.tipo === "ahoraNo") return respuesta.cuidado === "esponja" ? "sacudirse" : "ahoraNo";
  if (respuesta.cuidado === "comer") return "comer";
  if (respuesta.cuidado === "esponja") return "bano";
  if (respuesta.cuidado === "pelota") return "pelota";
  return "ronronear";
}

const ANIMACION_DE_VIDA: Record<EstadoVida, AnimacionGato> = { andar: "andar", sentarse: "sentado", dormir: "dormir", jugarSolo: "jugarSolo", cantar: "cantar", pedir: "pedir" };
type Pelota = { x: number; y: number; gatito: number; id: number };
type Desliz = { clienteX: number; vista: number; moviendo: boolean };
type Medidas = { escala: number; anchoVisor: number; vertical: boolean; medido: boolean };

/**
 * La casa de los gatitos: la llegada de los gatitos rescatados y los cuidados con la bandeja (arrastrar el cuenco,
 * frotar al gatito o con la esponja, lanzar la pelota y barrer las huellas) en una habitación de 1280 × 540 que se
 * desliza con el dedo. La habitación, los objetos y los gatitos son provisionales hasta que llegue su arte.
 */
export function CasaGatitos({ casa: guardada, levelStats, reduceMotion, muted, effectsVolume, musicVolume, onGuardar, onSalir }: Props) {
  const inicial = useMemo(() => conNecesidadesDePrueba(prepararCasa(guardada, levelStats, new Date())), [guardada, levelStats]);
  const [casa, setCasa] = useState(inicial);
  const [llegan] = useState(() => llegadasPendientes(inicial));
  // La primera llegada a la casa (nadie presentado aún): al cerrarla, la bandeja brilla una vez.
  const [estreno] = useState(() => inicial.presentados.length === 0 && llegadasPendientes(inicial).length > 0);
  const [brilla, setBrilla] = useState(false);
  const [fase, setFase] = useState<"entrando" | "hola" | "casa">(llegan.length ? "entrando" : "casa");
  const [noche, setNoche] = useState(() => esDeNoche(new Date()));
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [pelota, setPelota] = useState<Pelota | null>(null);
  const [frotando, setFrotando] = useState<number | null>(null);
  const frotandoRef = useRef<number | null>(null);
  useEffect(() => { frotandoRef.current = frotando; }, [frotando]);
  const [medidas, setMedidas] = useState<Medidas>({ escala: 0.75, anchoVisor: 600, vertical: false, medido: false });
  const [vista, setVista] = useState<number | null>(null);
  const [andantes, setAndantes] = useState<Record<number, Andante>>({});
  const [hojas, setHojas] = useState<Record<string, string>>({});
  const [ahora, setAhora] = useState(() => performance.now());
  const seccionRef = useRef<HTMLElement>(null);
  const visorRef = useRef<HTMLDivElement>(null);
  const escenaRef = useRef<HTMLDivElement>(null);
  const casaRef = useRef(casa);
  const froteRef = useRef<Frote | null>(null);
  const dedoRef = useRef(false);
  const deslizRef = useRef<Desliz | null>(null);
  const autoRef = useRef<-1 | 0 | 1>(0);
  const idRef = useRef(0);
  const sonidoRef = useRef<SonidoCasa | null>(null);
  const estadosRef = useRef<Record<number, EstadoVida>>({});
  useEffect(() => { casaRef.current = casa; }, [casa]);

  // Sonido: se crea al entrar, sigue el silencio y el volumen del juego y se cierra al salir.
  useEffect(() => {
    const sonido = crearSonidoCasa({ silencio: muted, volumen: effectsVolume / 100 });
    sonidoRef.current = sonido;
    return () => { sonido.cerrar(); sonidoRef.current = null; };
    // Solo al montar: los cambios de volumen van por `ajustar`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { sonidoRef.current?.ajustar({ silencio: muted, volumen: effectsVolume / 100 }); }, [muted, effectsVolume]);

  // Música de fondo: la nana de la casa, que empieza con el primer toque, sigue la noche y para al salir.
  const nanaRef = useRef<Nana | null>(null);
  useEffect(() => {
    const nana = crearNana({ silencio: muted, volumen: musicVolume / 100, noche: esDeNoche(new Date()) });
    nanaRef.current = nana;
    return () => { nana.cerrar(); nanaRef.current = null; };
    // Solo al montar: los cambios van por `ajustar`.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { nanaRef.current?.ajustar({ silencio: muted, volumen: musicVolume / 100, noche }); }, [muted, musicVolume, noche]);

  const presentes = MUNDOS_CASA.filter((mundo) => casa.gatitos[mundo]).join(",");
  const gatitos = useMemo(() => presentes ? presentes.split(",").map(Number) : [], [presentes]);
  // Dónde está cada gatito ahora (deambulan por todo el suelo); sin andante aún, en su sitio de día.
  const sitioDia = (mundo: number) => HABITACION.sitiosDia[MUNDOS_CASA.indexOf(mundo)] ?? HABITACION.sitiosDia[0];
  const sitioNoche = (mundo: number) => HABITACION.sitiosNoche[MUNDOS_CASA.indexOf(mundo)] ?? HABITACION.sitiosNoche[0];
  const lista = gatitos.map((mundo) => andantes[mundo] ?? nuevoAndante(llegan.includes(mundo) && fase === "entrando" ? HABITACION.sitios.puerta : sitioDia(mundo), 0));
  const sitios = lista.map((andante) => andante.x);
  const escalaDe = (y: number) => escalaEnSuelo(HABITACION, y);
  const tocar = (punto: { x: number; y: number }) => gatitoBajo(punto, lista, escalaDe, ajustes.toque);
  const pararGatito = useCallback((indice: number) => {
    const mundo = gatitos[indice];
    if (mundo === undefined) return;
    setAndantes((actuales) => actuales[mundo] && andando(actuales[mundo]) ? { ...actuales, [mundo]: parar(actuales[mundo], performance.now()) } : actuales);
  }, [gatitos]);
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
    pararGatito(indice);
    const resultado = cuidar(casaRef.current, mundo, cuidado, new Date());
    guardar(resultado.casa);
    const sonido = sonidoRef.current;
    if (resultado.respuesta === "gracias") sonido?.maullar(mundo, "gracias");
    else if (resultado.respuesta === "ahoraNo") sonido?.maullar(mundo, "ahoraNo");
    const id = ++idRef.current;
    setRespuestas((actuales) => [...actuales.filter((r) => r.gatito !== indice), { gatito: indice, tipo: resultado.respuesta, cuidado, corazon: resultado.corazon, id, desde: performance.now() }]);
    window.setTimeout(() => setRespuestas((actuales) => actuales.filter((r) => r.id !== id)), RESPUESTA_MS);
  }, [gatitos, guardar, pararGatito]);

  // Ronroneo mientras se frota con el dedo (con la esponja no ronronea).
  const ronronea = frotando !== null && arrastre?.herramienta !== "esponja";
  useEffect(() => { sonidoRef.current?.ronronear(ronronea); }, [ronronea]);

  // Maullido de pedir (cada gatito, como mucho uno cada pocos segundos) y canción al empezar a cantar.
  useEffect(() => {
    if (fase !== "casa") return;
    gatitos.forEach((mundo) => {
      const andante = andantes[mundo];
      const estado: EstadoVida | undefined = andante ? (andando(andante) ? "andar" : andante.pose) : undefined;
      if (estado === "pedir" || (estado !== "dormir" && bocadilloDe(casa.gatitos[mundo]) && !noche)) sonidoRef.current?.maullar(mundo, "pide");
      if (estado === "cantar" && estadosRef.current[mundo] !== "cantar") sonidoRef.current?.cantar(mundo);
      if (estado) estadosRef.current[mundo] = estado;
    });
  }, [andantes, fase, gatitos, casa, noche]);

  // Reloj de las animaciones de la hoja del gato.
  useEffect(() => {
    if (reduceMotion) return;
    const reloj = window.setInterval(() => setAhora(performance.now()), PASO_ANIMACION_MS);
    return () => window.clearInterval(reloj);
  }, [reduceMotion]);

  // Hoja pintada de cada gatito, con su barro y su lazo de mejor amigo.
  const variantes = gatitos.map((mundo) => {
    const gatito = casa.gatitos[mundo];
    return { mundo, sucio: estadoDe(gatito.necesidades.bano) !== "bien", mejorAmigo: esMejorAmigo(gatito) };
  });
  const claveVariantes = variantes.map((v) => `${v.mundo}-${v.sucio}-${v.mejorAmigo}`).join(",");
  useEffect(() => {
    let vivo = true;
    for (const clave of claveVariantes.split(",").filter(Boolean)) {
      const [mundo, sucio, mejorAmigo] = clave.split("-");
      void hojaDeGatito(Number(mundo), { sucio: sucio === "true", mejorAmigo: mejorAmigo === "true" })
        .then((url) => { if (vivo) setHojas((actuales) => actuales[clave] === url ? actuales : { ...actuales, [clave]: url }); });
    }
    return () => { vivo = false; };
  }, [claveVariantes]);

  // Deambular: cada paso, los gatitos que andan avanzan hacia su destino y los que acaban lo que hacían deciden otra
  // cosa (andar a un punto libre, ir a un sitio de interés, pedir…). Al llegar, los recién rescatados entran por la puerta.
  useEffect(() => {
    let anterior = performance.now();
    const paso = window.setInterval(() => {
      const momento = performance.now();
      const ms = reduceMotion ? 60_000 : momento - anterior;
      anterior = momento;
      const actual = casaRef.current;
      const alguienPide = gatitos.some((mundo) => bocadilloDe(actual.gatitos[mundo]));
      setAndantes((previos) => {
        const siguientes = { ...previos };
        gatitos.forEach((mundo, indice) => {
          let andante = siguientes[mundo];
          if (!andante) {
            // Primera vez: los recién rescatados entran por la puerta; los demás están en su sitio.
            andante = llegan.includes(mundo) && fase === "entrando"
              ? ir(nuevoAndante({ x: PUERTA_X, y: HABITACION.sitios.puerta.y }, momento), sitioDia(mundo), "sentarse", 2, momento)
              : nuevoAndante(noche ? sitioNoche(mundo) : sitioDia(mundo), momento, noche ? "dormir" : "sentarse");
          }
          andante = avanzarAndante(andante, ms, momento);
          if (fase === "casa" && !andando(andante) && momento >= andante.hasta && frotandoRef.current !== indice) {
            const otros = gatitos.filter((otro) => otro !== mundo).map((otro) => siguientes[otro]).filter((otro): otro is Andante => Boolean(otro));
            andante = decidir(andante, actual.gatitos[mundo], otros, {
              habitacion: HABITACION, noche, casaLimpia: casaLimpia(actual), alguienPide, sitioNoche: sitioNoche(mundo), azar: Math.random, ahora: momento,
            });
          }
          siguientes[mundo] = andante;
        });
        return siguientes;
      });
    }, PASO_ANIMACION_MS);
    return () => window.clearInterval(paso);
    // `sitioDia`, `sitioNoche` y `llegan` no cambian durante la visita.
  }, [fase, gatitos, noche, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const indice = lista.reduce((mejor, andante, i) => Math.hypot(andante.x - x, andante.y - y) < Math.hypot(lista[mejor].x - x, lista[mejor].y - y) ? i : mejor, 0);
    const id = ++idRef.current;
    setPelota({ x, y, gatito: indice, id });
    window.setTimeout(() => {
      setPelota((actual) => actual?.id === id ? null : actual);
      sonidoRef.current?.bote();
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
        const indice = tocar(punto);
        if (indice >= 0) pararGatito(indice);
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
        const indice = tocar(punto);
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
    if (herramienta === "pelota") lanzar(lista[indice].x, lista[indice].y - 40);
    else atender(indice, cuidado);
  };

  // Con el dedo y sin objeto: sobre un gatito, frotar; fuera de los gatitos, deslizar la habitación.
  const empezarDedo = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (fase !== "casa" || arrastre || event.button !== 0) return;
    const punto = enEscena(event);
    if (!punto) return;
    const indice = tocar(punto);
    if (indice >= 0) pararGatito(indice);
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
    const indice = tocar(punto);
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
    if (estreno) {
      setBrilla(true);
      window.setTimeout(() => setBrilla(false), BRILLO_BANDEJA_MS);
    }
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

  const estiloMarco = { ...ACENTO_CASA, "--corazon": cssAssetUrl("./assets/sprites/ui-heart-v1.png"), "--objetos": cssAssetUrl("./assets/sprites/casa-objetos-v1.webp"), "--objeto": `${Math.max(56, ajustes.objeto * medidas.escala)}px` } as CSSProperties;
  const estiloEscena = { "--objeto-escena": `${ajustes.objeto}px`, "--lampara": `${HABITACION.lampara.x}px ${HABITACION.lampara.y}px`, width: HABITACION.ancho, height: HABITACION.alto, transform: `translateX(${-vistaX * medidas.escala}px) scale(${medidas.escala})` } as CSSProperties;

  return <section ref={seccionRef} onPointerDownCapture={() => { sonidoRef.current?.despertar(); nanaRef.current?.empezar(); }} className={`casa-gatitos${reduceMotion ? " is-quieta" : ""}${arrastre ? " is-arrastrando" : ""}${medidas.vertical ? " is-vertical" : ""}`} aria-label={t("casa.titulo.oculto")}>
    <BotonControl className="casa-salir" pictograma="mapa" etiqueta="casa.salir.oculto" onClick={salir} disabled={fase === "hola"} />
    <div className="casa-marco game-frame" style={estiloMarco}>
      <div className="casa-visor" ref={visorRef} style={{ width: medidas.anchoVisor, height: ESCENA_CASA.alto * medidas.escala }}>
        <div className={`casa-escena${noche ? " is-noche" : ""}`} ref={escenaRef} style={estiloEscena}
          onPointerDown={empezarDedo} onPointerMove={moverDedo} onPointerUp={acabarDedo} onPointerCancel={acabarDedo}>
          <img className="casa-fondo" src={HABITACION.fondo} alt="" draggable={false} />
          <img className="casa-ventana-noche" src={VENTANA.imagen} alt="" draggable={false} style={{ left: VENTANA.left, top: VENTANA.top, width: VENTANA.width, height: VENTANA.height }} />
          {fase === "entrando" && <div className="casa-luz-puerta" style={{ left: porcentajeX(PUERTA_X) }} />}
          {casa.huellas.map((huella, indice) => <i key={`${huella.x}-${indice}`} className={`casa-objeto casa-huella is-${indice % 2 ? "huella-2" : "huella"}`} style={{ left: porcentajeX(huella.x), top: porcentajeY(ESCENA_CASA.suelo + 22 + (indice % 2) * 18) }} />)}
          {gatitos.map((mundo, indice) => {
            const andante = lista[indice];
            const llegando = llegan.includes(mundo) && fase === "entrando";
            const gatito = casa.gatitos[mundo];
            const pide = fase === "casa" ? bocadilloDe(gatito) : null;
            const respuesta = respuestas.find((r) => r.gatito === indice);
            const anda = andando(andante);
            const dormido = !anda && andante.pose === "dormir" && !respuesta && frotando !== indice;
            // Anda o hace su pose; si pide algo y está quieto, lloriquea. El bocadillo se ve también andando.
            const animacion: AnimacionGato = respuesta ? animacionDeRespuesta(respuesta)
              : frotando === indice ? (arrastre?.herramienta === "esponja" ? "bano" : "ronronear")
                : anda ? "andar" : dormido ? "dormir" : pide ? "pedir" : ANIMACION_DE_VIDA[andante.pose];
            const desde = respuesta?.desde ?? andante.desde;
            const { fila } = ANIMACIONES_GATO[animacion];
            const cuadro = reduceMotion ? 0 : cuadroDe(animacion, (ahora - desde) / 1000);
            const variante = variantes[indice];
            const hoja = hojas[`${variante.mundo}-${variante.sucio}-${variante.mejorAmigo}`];
            const mira = andante.mira;
            const escala = escalaDe(andante.y);
            return <div key={mundo} role="img" aria-label={t("casa.gatito.oculto", { nombre: nombreDe(mundo) })}
              className={`casa-gatito${llegando ? " is-llegando" : ""}${respuesta ? ` is-${respuesta.tipo}` : ""}${dormido ? " is-dormido" : ""}`}
              style={{ left: andante.x, top: andante.y - PIES_GATITO, zIndex: Math.round(andante.y), "--escala": escala } as CSSProperties}>
              <span className="casa-gatito-dibujo" style={{
                backgroundImage: hoja ? `url("${hoja}")` : undefined,
                backgroundSize: `${COLUMNAS_GATO * CUADRO_GATO}px ${FILAS_GATO * CUADRO_GATO}px`,
                backgroundPosition: `${-cuadro * CUADRO_GATO}px ${-fila * CUADRO_GATO}px`,
                transform: mira < 0 ? "scaleX(-1)" : undefined,
              }} />
              {pide && !respuesta && !dormido && <span className="casa-bocadillo" aria-hidden="true"><i className={`casa-objeto is-${OBJETO_DE[pide]}`} /></span>}
              {respuesta?.corazon && <span className="casa-corazon" aria-hidden="true" />}
            </div>;
          })}
          <div className="casa-luz-noche" aria-hidden="true" />
          {pelota && <i key={pelota.id} className="casa-objeto is-pelota casa-pelota-lanzada" style={{ left: porcentajeX(pelota.x), top: porcentajeY(pelota.y), "--hasta": porcentajeX(lista[pelota.gatito]?.x ?? pelota.x), "--hasta-y": porcentajeY((lista[pelota.gatito]?.y ?? pelota.y) - 30) } as CSSProperties} />}
          {arrastre && <i className={`casa-objeto is-${arrastre.herramienta} casa-arrastrado`} style={{ left: porcentajeX(arrastre.x), top: porcentajeY(arrastre.y) }} />}
        </div>
        {quedaIzquierda && <span className="casa-borde is-izquierda" aria-hidden="true" />}
        {quedaDerecha && <span className="casa-borde is-derecha" aria-hidden="true" />}
        {fuera.map((aviso) => <span key={aviso.mundo} className={`casa-aviso is-${aviso.lado}`} aria-hidden="true"><i className={`casa-objeto is-${aviso.objeto}`} /></span>)}
      </div>
      {fase === "casa" && <div className={`casa-bandeja${brilla ? " is-brilla" : ""}`} aria-label={t("casa.bandeja.oculto")} role="toolbar">
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
