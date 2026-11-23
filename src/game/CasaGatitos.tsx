import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { avanzar, barrer, bocadilloDe, casaLimpia, cuidar, decoracionDe, dejarHuella, dePaseoDe, enCasaDe, esDeNoche, llegadasDePaseo, mandarDePaseo, MAX_EN_CASA, traerACasa, esMejorAmigo, estadoDe, llegadasPendientes, NECESIDADES, presentar, type CasaProgress, type Cuidado, type EstadoVida, type NecesidadId, type RespuestaCuidado } from "./casa";
import {
  aEscena, ANCHO_VERTICAL_CASA, autodeslizar, centrarEn, CUIDADO_DE, ESCENA_CASA, escalaCasa, frotar, HERRAMIENTAS, huellaEn, leerAjustesCasa, limitarVista,
  MANTENER_PARA_COGER_MS, MOVER_PARA_FROTAR, relojCasa, SITIOS_CASA, type Frote, type Herramienta,
} from "./casaInteraccion";
import { crearSonidoCasa, sonidoDelBano, type SonidoCasa } from "./casaSonido";
import { crearNana, type Nana } from "./casaNana";
import { ANIMACIONES_GATO, COLUMNAS_GATO, CUADRO_GATO, cuadroDe, FILAS_GATO, hojaDeGatito, type AnimacionGato } from "./casaGatoArte";
import { prepararCasa } from "./casaRescate";
import { andando, avanzarAndante, decidir, gatitoBajo, ir, nuevoAndante, parar, VELOCIDAD_GATITO, type Andante } from "./casaDeambular";
import { aterrizar, escalaEnSuelo, HABITACION_CASA, sobreElArmario, sobreLaBanera } from "./casaHabitacion";
import { apuntarVisita, comidaFavoritaDe, OLER_TRAS_ENTRAR_MS, SITIOS_PARA_OLER, COMIDAS_AMIGOS, cuerpoDelVisitante, darDeComerAlVisitante, DESPEDIDA_MS, elegirVisitante, HOJA_COMIDAS_AMIGOS, LLAMA_A_LOS_MS, SE_VA_SIN_COMER_MS, SE_VA_TRAS_COMER_MS, TOC_CADA_MS, tocaVisita, TOQUE_VISITANTE, VISITANTE_ASOMA, VISITANTE_SITIO } from "./casaVisitante";
import { DibujoAmigo } from "./DibujoAmigo";
import { friendCatalog, type FriendFood } from "./friends";
import { BAJA_EN, BOTA_EN, botar, BOTAR_MS, BOTES, cambiaSolo, celdaDeMacetero, CELDAS_MACETEROS, HOJA_MACETEROS, jardinDe, LUCIERNAGAS, luciernagaEn, maceteroBajo, maceteroPorRegar, regar, REGADERA, dondeSePosa, estanciaDe, JARDIN, jugarDeUnaVez, llevarA, MARIPOSAS, mariposaBajo, masCercano, POSARSE_MS, posicionPosada, vueloDeMariposa, type Posada, sobreLaColchoneta, puertaDe, sobreLaPuerta, todosALaHabitacion, zonaPuertaDe, type Estancia } from "./casaJardin";
import { ropaDe, vestir, type Ropa } from "./casaRopa";
import { VestidorGatito } from "./VestidorGatito";
import { fondoDePieza, HOJA_ACCESORIOS, piezasEnCuadro } from "./casaVestidorArte";
import { arropadosDe, arropar, puedeDormir, todosArropados } from "./casaDormir";
import { arropadoDe, CUADROS_ARROPADO, HOJA_MANTITA } from "./casaDormirArte";
import { guardarFoto, type FotoCasa } from "./casaFoto";
import { cambiarMueble, muebleEn, MUEBLES_CASA, PARED_HASTA, TONOS_PARED, VERSIONES, type MuebleId, type Version } from "./casaDecoracion";
import { fondoConPared } from "./casaDecoracionArte";
import { cssAssetUrl } from "./assets";
import { Ventana } from "./Ventana";
import { BanoGatito } from "./BanoGatito";
import { worldCatalog } from "./worldMapData";
import { t, tClave } from "../textos/index.ts";
import { Boton, BotonControl, Texto } from "../textos/Texto";
import { COMIDAS, darDeComer, favoritaDescubierta, HOJA_COMIDAS, type Comida } from "./casaComida";
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
  /** Un visitante gana un corazón de amistad (en el progreso de amigos). */
  onAmistad?: (animal: string) => void;
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
/** Lo que dura el destello al cambiar un mueble, y lo que se queda el gatito oliéndolo. */
const DESTELLO_MS = 900;
const OLER_S = 4;
/** Al salir de paseo y volver: cada cuánto sale o entra uno, y cuánto más deprisa anda que al deambular. */
const PASO_PUERTA_MS = 900;
const RAPIDO_PUERTA = 3;
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
const ALTO_BANDEJA_VERTICAL = 130;
/** Con la ventana más baja que esto (móvil apaisado), la bandeja va al lado de la habitación, sin taparla. */
const ALTO_PARA_BANDEJA_DEBAJO = 500;
/** Ancho que ocupa la bandeja al lado de la habitación (dos columnas de botones y su margen). */
const ANCHO_BANDEJA_LADO = 150;

/** Necesidad que enseña cada objeto en el bocadillo. */
const OBJETO_DE: Record<NecesidadId, Herramienta | "mano"> = { comer: "cuenco", mimos: "mano", bano: "esponja", jugar: "pelota" };

// Los ajustes de prueba también se leen en la web publicada, para probar la casa con Noa en su móvil.
const ajustes = leerAjustesCasa(window.location.search);

const porcentajeX = (x: number) => `${(x / ESCENA_CASA.ancho) * 100}%`;
const porcentajeY = (y: number) => `${(y / ESCENA_CASA.alto) * 100}%`;
const nombreDe = (mundo: number) => tClave(`mundos.${mundo}.gato.rotulo`);
const nombreDeAmigo = (animal: string) => friendCatalog.find((amigo) => amigo.kind === animal)?.name ?? animal;

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

type Arrastre = { herramienta: Herramienta | "mantita" | "regadera" | "plato"; /** Con el plato: la comida de los amigos elegida. */ comidaAmigo?: FriendFood; x: number; y: number; /** Con el cuenco: la comida elegida en el abanico. */ comida?: Comida };
/** Gatito cogido con el dedo: cuelga del dedo (`x`, `y` en la escena) hasta que se suelta. */
type Cogido = { indice: number; x: number; y: number };
/** Distancia del dedo a los pies del gatito que cuelga. */
const COGIDO_PIES = 130;
type Respuesta = { gatito: number; tipo: RespuestaCuidado; cuidado: Cuidado; corazon: boolean; id: number; desde: number; dormido?: boolean; /** Comió su comida favorita: «¡ÑAM!». */ favorita?: boolean };

/** Animación de la hoja para la respuesta a un cuidado. */
function animacionDeRespuesta(respuesta: Respuesta): AnimacionGato {
  if (respuesta.dormido) return "dormir";
  if (respuesta.tipo === "ahoraNo") return respuesta.cuidado === "esponja" ? "sacudirse" : "ahoraNo";
  if (respuesta.cuidado === "comer") return "comer";
  if (respuesta.cuidado === "esponja") return "bano";
  if (respuesta.cuidado === "pelota") return "pelota";
  return "ronronear";
}

const ANIMACION_DE_VIDA: Record<EstadoVida, AnimacionGato> = { andar: "andar", sentarse: "sentado", dormir: "dormir", jugarSolo: "jugarSolo", cantar: "cantar", pedir: "pedir" };
type Pelota = { x: number; y: number; gatito: number; id: number };
type Desliz = { clienteX: number; vista: number; moviendo: boolean; punto?: { x: number; y: number } };
type Medidas = { escala: number; anchoVisor: number; vertical: boolean; medido: boolean };

/**
 * La casa de los gatitos: la llegada de los gatitos rescatados y los cuidados con la bandeja (arrastrar el cuenco,
 * frotar al gatito o con la esponja, lanzar la pelota y barrer las huellas) en una habitación de 1280 × 540 que se
 * desliza con el dedo. La habitación, los objetos y los gatitos son provisionales hasta que llegue su arte.
 */
export function CasaGatitos({ casa: guardada, levelStats, reduceMotion, muted, effectsVolume, musicVolume, onGuardar, onAmistad, onSalir }: Props) {
  const inicial = useMemo(() => conNecesidadesDePrueba(prepararCasa(guardada, levelStats, new Date())), [guardada, levelStats]);
  const [casa, setCasa] = useState(inicial);
  const [llegan] = useState(() => llegadasPendientes(inicial));
  // La primera llegada a la casa (nadie presentado aún): al cerrarla, la bandeja brilla una vez.
  const [estreno] = useState(() => inicial.presentados.length === 0 && llegadasPendientes(inicial).length > 0);
  const [brilla, setBrilla] = useState(false);
  const [fase, setFase] = useState<"entrando" | "hola" | "casa">(llegan.length ? "entrando" : "casa");
  const [nocheReloj, setNocheReloj] = useState(() => esDeNoche(relojCasa(ajustes)));
  // Hora de dormir: desde las 19 h la bandeja enseña la estrella; al pulsarla, la habitación se pone de noche, los
  // gatitos van a dormir y la bandeja da la mantita. La lámpara se apaga tocándola.
  const [horaDeDormir, setHoraDeDormir] = useState(() => puedeDormir(relojCasa(ajustes)));
  const [acostando, setAcostando] = useState(false);
  const [lamparaApagada, setLamparaApagada] = useState(false);
  const [buenasNoches, setBuenasNoches] = useState<"no" | "ventana" | "vista">("no");
  // Foto recién hecha: destello y miniatura que vuela a la bandeja.
  const [flash, setFlash] = useState(0);
  const noche = nocheReloj || acostando;
  const [fechaCasa, setFechaCasa] = useState(() => relojCasa(ajustes));
  const arropados = noche ? arropadosDe(casa, fechaCasa) : [];
  // Pose «arropado» de cada gatito, con su paleta y la mantita del color de su collar.
  const [poseArropado, setPoseArropado] = useState<Record<string, string>>({});
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [pelota, setPelota] = useState<Pelota | null>(null);
  const [frotando, setFrotando] = useState<number | null>(null);
  const [cogido, setCogido] = useState<Cogido | null>(null);
  const cogidoRef = useRef<Cogido | null>(null);
  useEffect(() => { cogidoRef.current = cogido; }, [cogido]);
  const pendienteRef = useRef<{ clienteX: number; clienteY: number; indice: number; temporizador: number } | null>(null);
  /** Gatito que está en la pantalla de baño, o `null`. */
  const [bano, setBano] = useState<number | null>(null);
  // Abanico de comidas sobre el cuenco de la bandeja (se abre al tocarlo).
  const [abanico, setAbanico] = useState(false);
  /** Estancia que se ve: la habitación o el jardín (mapa «Jardín de la casa»). */
  const [estancia, setEstancia] = useState<Estancia>("habitacion");
  const enJardin = estancia === "jardin";
  /** Gatitos que van solos hacia la puerta para cambiar de estancia. */
  const seVanRef = useRef(new Set<number>());
  /** Gatitos que botan en la colchoneta del jardín ahora mismo. */
  const [botando, setBotando] = useState<number[]>([]);
  const botandoRef = useRef<number[]>([]);
  /** Mariposas del jardín que Noa ha hecho posarse junto a un gatito. */
  /** El último riego: a qué macetero y qué ha pasado (crece, brillitos en flor, o ya regado hoy). */
  const [riego, setRiego] = useState<{ indice: number; id: number; efecto: "crece" | "brilla" | "espera" } | null>(null);
  /** El visitante de hoy (mapa «Visitas de los amigos a la casa»): llamando a la puerta o ya en el jardín. */
  const [visita, setVisita] = useState<{ animal: string; fase: "llama" | "dentro" | "seva"; llamadas: number; comio?: boolean; corazon?: boolean } | null>(null);
  /** Reacción del visitante: saludo (bocadillo con su comida favorita) o comida (con su favorita, «¡ÑAM!» y corazón). */
  const [reaccion, setReaccion] = useState<{ id: number; tipo: "saluda" | "come" | "favorita"; corazon: boolean } | null>(null);
  const [abanicoAmigos, setAbanicoAmigos] = useState(false);
  // El abanico abierto se cierra al tocar fuera de él o de su cuenco, por ejemplo otro botón de la bandeja (issue 330).
  useEffect(() => {
    if (!abanico && !abanicoAmigos) return;
    const cerrar = (event: PointerEvent) => {
      const tocado = event.target as Element | null;
      if (tocado?.closest?.(".casa-abanico, .casa-bandeja-objeto[aria-expanded]")) return;
      setAbanico(false);
      setAbanicoAmigos(false);
    };
    document.addEventListener("pointerdown", cerrar, true);
    return () => document.removeEventListener("pointerdown", cerrar, true);
  }, [abanico, abanicoAmigos]);
  const visitaPensadaRef = useRef(false);
  const [toqueMariposa, setToqueMariposa] = useState<{ punto: { x: number; y: number }; ms: number } | null>(null);
  const [posadas, setPosadas] = useState<(Posada | null)[]>(() => Array.from({ length: MARIPOSAS }, () => null));
  useEffect(() => { botandoRef.current = botando; }, [botando]);
  // Gatito en el vestidor (se le lleva al armario).
  const [vestidor, setVestidor] = useState<number | null>(null);
  const frotandoRef = useRef<number | null>(null);
  useEffect(() => { frotandoRef.current = frotando; }, [frotando]);
  const [medidas, setMedidas] = useState<Medidas>({ escala: 0.75, anchoVisor: 600, vertical: false, medido: false });
  const [vista, setVista] = useState<number | null>(null);
  const [andantes, setAndantes] = useState<Record<number, Andante>>({});
  const [hojas, setHojas] = useState<Record<string, string>>({});
  const [ahora, setAhora] = useState(() => performance.now());
  // Decorar: la bandeja cambia a los muebles; `elegido` es el mueble tocado, cuyas versiones salen en la bandeja.
  const [decorando, setDecorando] = useState(false);
  const [elegido, setElegido] = useState<MuebleId | null>(null);
  const [destello, setDestello] = useState<{ mueble: MuebleId; id: number } | null>(null);
  const [fondo, setFondo] = useState(HABITACION.fondo);
  // Ventana de quién está en casa, y el parpadeo de las huellas cuando ya no cabe nadie más.
  // Orden de las fichas, fijado al abrir (en casa primero, luego de paseo) para que no salten al tocarlas.
  const [eligiendo, setEligiendo] = useState<{ orden: number[]; antes: number[] } | null>(null);
  // Al cerrar la ventana: los que se van andan hasta la puerta y salen; los que vuelven esperan su turno y entran.
  const [saliendo, setSaliendo] = useState<number[]>([]);
  const [esperando, setEsperando] = useState<number[]>([]);
  const [luzPuerta, setLuzPuerta] = useState(0);
  const saliendoRef = useRef<number[]>([]);
  const rapidosRef = useRef(new Set<number>());
  useEffect(() => { saliendoRef.current = saliendo; }, [saliendo]);
  const [llena, setLlena] = useState(0);
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
  // Durante el baño, la nana suena a la mitad para que se oigan el agua y el secador.
  // Tras «¡BUENAS NOCHES!», más bajita todavía.
  useEffect(() => { nanaRef.current?.ajustar({ silencio: muted, volumen: (musicVolume / 100) * (bano !== null ? 0.5 : 1) * (buenasNoches !== "no" ? 0.4 : 1), noche }); }, [muted, musicVolume, noche, bano, buenasNoches]);

  // Las mariposas revolotean por el jardín de día; de noche, las luciérnagas.
  const mariposasVisibles = enJardin && !noche && fase === "casa";
  // Solo los gatitos en casa (cinco como mucho) que están en esta estancia; los de paseo no están.
  const presentes = [...new Set([...enCasaDe(casa).filter((mundo) => !esperando.includes(mundo) && estanciaDe(casa, mundo) === estancia), ...(enJardin ? [] : saliendo)])].sort((a, b) => a - b).join(",");
  const gatitos = useMemo(() => presentes ? presentes.split(",").map(Number) : [], [presentes]);
  // Dónde está cada gatito ahora (deambulan por todo el suelo); sin andante aún, en su sitio de día.
  // Cada gatito en casa tiene su sitio de día y de noche, por su orden entre los de casa.
  const ordenEnCasa = enCasaDe(casa);
  const sitioDia = (mundo: number, donde: Estancia = estanciaDe(casa, mundo)) => {
    const sitios = donde === "jardin" ? JARDIN.sitiosDia : HABITACION.sitiosDia;
    return sitios[Math.max(0, ordenEnCasa.indexOf(mundo)) % sitios.length];
  };
  // En el jardín (de noche, antes de la hora de dormir), duermen sobre la hierba, en su sitio de día.
  const sitioNocheEnCasa = (mundo: number) => HABITACION.sitiosNoche[Math.max(0, ordenEnCasa.indexOf(mundo)) % HABITACION.sitiosNoche.length];
  const sitioNoche = (mundo: number) => estanciaDe(casa, mundo) === "jardin" ? sitioDia(mundo, "jardin") : sitioNocheEnCasa(mundo);
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
      // La bandeja va debajo de la habitación, en fila, salvo en pantallas bajas (móvil apaisado): ahí, al lado.
      const vertical = window.innerHeight >= ALTO_PARA_BANDEJA_DEBAJO || window.matchMedia("(orientation: portrait)").matches;
      const ancho = seccion.clientWidth - MARGEN_LADOS - MARCO_MOVIL - (vertical ? 0 : ANCHO_BANDEJA_LADO);
      // La sección crece con su contenido: el alto disponible es el de la ventana desde donde empieza.
      const alto = window.innerHeight - Math.max(0, seccion.getBoundingClientRect().top) - MARGEN_ARRIBA - MARCO_MOVIL - (vertical ? ALTO_BANDEJA_VERTICAL : 0);
      const escala = escalaCasa(ancho, alto, window.matchMedia("(orientation: portrait)").matches);
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

  // La pared, con el tono elegido (pintado por código sobre el fondo).
  const decoracion = decoracionDe(casa);
  useEffect(() => {
    let vivo = true;
    void fondoConPared(HABITACION.fondo, decoracion.pared).then((url) => { if (vivo) setFondo(url); });
    return () => { vivo = false; };
  }, [decoracion.pared]);

  const cambiarDecorar = () => {
    setDecorando((antes) => !antes);
    setElegido(null);
    setArrastre(null);
  };
  /** En la ventana de quién está en casa: tocar a un gatito lo manda de paseo o lo trae, si cabe. */
  const cambiarDeSitio = (mundo: number) => {
    const actual = casaRef.current;
    if (enCasaDe(actual).includes(mundo)) { guardar(mandarDePaseo(actual, mundo)); return; }
    const traida = traerACasa(actual, mundo);
    if (traida === actual) { setLlena((veces) => veces + 1); return; }
    guardar(traida);
  };

  /** Lleva a un gatito a la otra estancia: allí entra por la puerta, con su luz, y va hacia su sitio. */
  const cambiarDeEstancia = (mundo: number, momento: number) => {
    const actual = casaRef.current;
    const otra: Estancia = estanciaDe(actual, mundo) === "jardin" ? "habitacion" : "jardin";
    guardar(llevarA(actual, mundo, otra));
    setAndantes((actuales) => ({ ...actuales, [mundo]: ir(nuevoAndante(puertaDe(otra, HABITACION), momento), sitioDia(mundo, otra), "sentarse", 2, momento) }));
    setLuzPuerta((veces) => veces + 1);
  };
  /**
   * Soltado en la colchoneta: da unos botes y baja de un salto a la hierba de al lado. Al bajar cuenta como jugar: con
   * ganas, contento y su corazón; sin ganas, ha botado igual.
   */
  const empezarABotar = (mundo: number, momento: number) => {
    setBotando((antes) => [...antes, mundo]);
    setAndantes((actuales) => ({ ...actuales, [mundo]: { ...(actuales[mundo] ?? nuevoAndante(BOTA_EN, momento)), ...BOTA_EN, destino: null, pose: "sentarse", desde: momento, hasta: momento + BOTAR_MS } }));
    const duracion = reduceMotion ? 400 : BOTAR_MS;
    Array.from({ length: BOTES }, (_, bote) => window.setTimeout(() => sonidoRef.current?.bote(), (duracion / BOTES) * (bote + 0.5)));
    window.setTimeout(() => {
      setBotando((antes) => antes.filter((otro) => otro !== mundo));
      const resultado = botar(casaRef.current, mundo, new Date());
      guardar(resultado.casa);
      if (resultado.respuesta === "gracias") sonidoRef.current?.maullar(mundo, "gracias");
      const ya = performance.now();
      setAndantes((actuales) => actuales[mundo] ? { ...actuales, [mundo]: ir({ ...actuales[mundo], ...BOTA_EN, destino: null }, BAJA_EN, "sentarse", 2, ya) } : actuales);
      const indice = gatitos.indexOf(mundo);
      if (indice < 0) return;
      const id = ++idRef.current;
      setRespuestas((actuales) => [...actuales.filter((r) => r.gatito !== indice), { gatito: indice, tipo: resultado.respuesta, cuidado: "pelota", corazon: resultado.corazon, id, desde: ya }]);
      window.setTimeout(() => setRespuestas((actuales) => actuales.filter((r) => r.id !== id)), RESPUESTA_MS);
    }, duracion);
  };
  /** Tocar la puerta del corazón: pasa a la otra estancia, con la vista junto a la puerta. */
  const cruzarPuerta = () => {
    // Mientras uno bota en la colchoneta, se espera a que baje.
    if (acostando || botando.length) return;
    // Si llamaba un visitante, al abrir pasa al jardín.
    if (!enJardin && visita?.fase === "llama") setVisita({ ...visita, fase: "dentro" });
    setEstancia(enJardin ? "habitacion" : "jardin");
    setVista(0);
    setAbanico(false);
    setArrastre(null);
    setLuzPuerta((veces) => veces + 1);
  };

  /** Dónde se ve cada mariposa a los `ms` (`activa`: posada o volviendo, no se puede tocar). */
  const mariposasEn = (ms: number) => Array.from({ length: MARIPOSAS }, (_, indice) => {
    const vuelo = vueloDeMariposa(indice, reduceMotion ? indice * 9000 : ms);
    const posada = posadas[indice];
    const posicion = posada ? posicionPosada(posada, ms, vuelo) : null;
    return posicion ? { ...posicion, activa: true } : { ...vuelo, quieta: false, activa: false };
  });
  /**
   * Tocar una mariposa: se posa junto al gatito más cercano. Con ganas de jugar, el gatito salta a por ella (nunca la
   * coge: se escapa) y cuenta como jugar; sin ganas, solo la mira. Devuelve si se ha tocado una.
   */
  const tocarMariposa = (punto: { x: number; y: number }, ms: number) => {
    const ahoraMismo = mariposasEn(ms);
    const indice = mariposaBajo(punto, ahoraMismo.map((m) => m.activa ? null : m));
    if (indice < 0) return false;
    const cercano = masCercano(ahoraMismo[indice], lista);
    if (cercano < 0) return true;
    const mundo = gatitos[cercano];
    pararGatito(cercano);
    setPosadas((antes) => antes.map((p, i) => i === indice ? { desde: ms, de: ahoraMismo[indice], a: dondeSePosa(lista[cercano]) } : p));
    window.setTimeout(() => {
      const gatito = casaRef.current.gatitos[mundo];
      if (!gatito || estadoDe(gatito.necesidades.jugar) === "bien") return;
      const resultado = jugarDeUnaVez(casaRef.current, mundo, new Date());
      guardar(resultado.casa);
      sonidoRef.current?.maullar(mundo, "gracias");
      const id = ++idRef.current;
      setRespuestas((actuales) => [...actuales.filter((r) => r.gatito !== cercano), { gatito: cercano, tipo: resultado.respuesta, cuidado: "pelota", corazon: resultado.corazon, id, desde: performance.now() }]);
      window.setTimeout(() => setRespuestas((actuales) => actuales.filter((r) => r.id !== id)), RESPUESTA_MS);
    }, reduceMotion ? 0 : POSARSE_MS);
    return true;
  };

  // El toque a una mariposa se atiende fuera del manejador del dedo.
  const toqueAtendidoRef = useRef(0);
  useEffect(() => {
    if (!toqueMariposa || toqueMariposa.ms === toqueAtendidoRef.current) return;
    toqueAtendidoRef.current = toqueMariposa.ms;
    tocarMariposa(toqueMariposa.punto, toqueMariposa.ms);
  }, [toqueMariposa]); // eslint-disable-line react-hooks/exhaustive-deps

  // Una vez por visita a la casa, a los pocos segundos: si toca, un amigo llama a la puerta (y queda apuntado hoy).
  useEffect(() => {
    if (fase !== "casa" || visitaPensadaRef.current) return;
    const espera = window.setTimeout(() => {
      // Solo se piensa una vez por visita a la casa (apuntado al vencer la espera, para que el modo estricto no la pierda).
      if (visitaPensadaRef.current) return;
      visitaPensadaRef.current = true;
      const actual = casaRef.current;
      const reloj = relojCasa(ajustes);
      const forzada = ajustes.visita && friendCatalog.some((amigo) => amigo.kind === ajustes.visita) ? ajustes.visita : null;
      if (!forzada && !tocaVisita(actual, reloj)) return;
      const animal = forzada ?? elegirVisitante(actual, levelStats);
      if (!animal) return;
      guardar(apuntarVisita(actual, animal, reloj));
      sonidoRef.current?.toc();
      setVisita({ animal, fase: "llama", llamadas: 1 });
    }, LLAMA_A_LOS_MS);
    return () => window.clearTimeout(espera);
  }, [fase]); // eslint-disable-line react-hooks/exhaustive-deps
  // Mientras espera, vuelve a llamar cada 10 s.
  const llamando = visita?.fase === "llama";
  useEffect(() => {
    if (!llamando) return;
    const reloj = window.setInterval(() => {
      sonidoRef.current?.toc();
      setVisita((actual) => actual?.fase === "llama" ? { ...actual, llamadas: actual.llamadas + 1 } : actual);
    }, TOC_CADA_MS);
    return () => window.clearInterval(reloj);
  }, [llamando]);
  // Cuando el visitante ha entrado en el jardín, los gatitos de allí se acercan a olerlo y luego siguen a lo suyo.
  const visitanteDentro = enJardin && visita?.fase === "dentro";
  useEffect(() => {
    if (!visitanteDentro || noche) return;
    const espera = window.setTimeout(() => {
      const momento = performance.now();
      setAndantes((actuales) => {
        const siguientes = { ...actuales };
        gatitos.filter((mundo, indice) => actuales[mundo] && cogidoRef.current?.indice !== indice && !botandoRef.current.includes(mundo))
          .slice(0, SITIOS_PARA_OLER.length)
          .forEach((mundo, orden) => { siguientes[mundo] = ir(actuales[mundo], SITIOS_PARA_OLER[orden], "sentarse", OLER_S, momento); });
        return siguientes;
      });
    }, reduceMotion ? 0 : OLER_TRAS_ENTRAR_MS);
    return () => window.clearTimeout(espera);
  }, [visitanteDentro]); // eslint-disable-line react-hooks/exhaustive-deps
  // Si nadie le abre o no come, a los 3 minutos se va (y vuelve otro día); 20 s después de comer, se despide.
  // Al despedirse dice adiós, vuelve andando a la valla y se va.
  useEffect(() => {
    if (!visita) return;
    if (visita.fase === "seva") {
      const reloj = window.setTimeout(() => { setVisita(null); setAbanicoAmigos(false); }, DESPEDIDA_MS);
      return () => window.clearTimeout(reloj);
    }
    const espera = visita.comio ? SE_VA_TRAS_COMER_MS : SE_VA_SIN_COMER_MS;
    const reloj = window.setTimeout(() => setVisita((actual) => actual && (actual.fase === "llama" ? null : { ...actual, fase: "seva" })), espera);
    return () => window.clearTimeout(reloj);
  }, [visita?.animal, visita?.fase, visita?.comio]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Con el teclado (o un lector de pantalla), la mariposa elegida se posa igual que al tocarla. */
  const mariposaConTeclado = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (event.detail !== 0) return;
    const mariposa = mariposasEn(event.timeStamp)[Number(event.currentTarget.dataset.indice)];
    if (mariposa) tocarMariposa(mariposa, event.timeStamp);
  };

  /** Regar un macetero: cae el agua y, una vez al día, crece; en flor, brillitos. */
  const regarMacetero = (indice: number) => {
    const resultado = regar(casaRef.current, indice, new Date());
    if (resultado.casa !== casaRef.current) guardar(resultado.casa);
    if (resultado.crecio || resultado.brillitos) sonidoRef.current?.golpeBano("campanita");
    const id = ++idRef.current;
    setRiego({ indice, id, efecto: resultado.crecio ? "crece" : resultado.brillitos ? "brilla" : "espera" });
    window.setTimeout(() => setRiego((actual) => actual?.id === id ? null : actual), 1400);
  };
  /** Con el teclado, la regadera riega el primer macetero que aún se puede regar hoy. */
  const regarConTeclado = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (event.detail !== 0) return;
    regarMacetero(maceteroPorRegar(casaRef.current, new Date()));
  };

  /** Dónde está el visitante en el jardín: asomando por la valla mientras llama, o dentro. */
  const piesVisitante = visita?.fase === "dentro" ? VISITANTE_SITIO : VISITANTE_ASOMA;
  const sobreVisitante = (punto: { x: number; y: number }) => {
    if (!visita || !enJardin) return false;
    const cuerpo = cuerpoDelVisitante(piesVisitante);
    return Math.hypot(punto.x - cuerpo.x, punto.y - cuerpo.y) <= TOQUE_VISITANTE;
  };
  /** Tocar al visitante: si llamaba desde la valla, entra. */
  const tocarVisitante = () => {
    if (visita?.fase === "llama") { setVisita({ ...visita, fase: "dentro" }); return; }
    if (visita?.fase !== "dentro") return;
    // Saludo: da un saltito y enseña su comida favorita.
    const id = ++idRef.current;
    setReaccion({ id, tipo: "saluda", corazon: false });
    window.setTimeout(() => setReaccion((actual) => actual?.id === id ? null : actual), 2200);
  };
  /** Darle una comida del plato: siempre se la come; con su favorita, «¡ÑAM!» y su corazón (uno por visita). */
  const darleDeComer = (comida: FriendFood) => {
    setAbanicoAmigos(false);
    if (!visita || visita.fase !== "dentro") return;
    const resultado = darDeComerAlVisitante(visita.animal, comida, Boolean(visita.corazon));
    if (resultado.corazon) onAmistad?.(visita.animal);
    if (resultado.favorita) sonidoRef.current?.golpeBano("campanita");
    else sonidoRef.current?.bote();
    setVisita({ ...visita, comio: true, corazon: visita.corazon || resultado.corazon });
    const id = ++idRef.current;
    setReaccion({ id, tipo: resultado.favorita ? "favorita" : "come", corazon: resultado.corazon });
    window.setTimeout(() => setReaccion((actual) => actual?.id === id ? null : actual), 2200);
  };
  const platoConTeclado = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (event.detail !== 0) return;
    darleDeComer(event.currentTarget.dataset.comida as FriendFood);
  };

  /** La estrella de la bandeja: empieza la hora de dormir y cada gatito en casa va a su sitio de noche a dormir. */
  const empezarADormir = () => {
    // A la hora de dormir, todos vuelven del jardín a la habitación.
    if (casaRef.current.enJardin) guardar(todosALaHabitacion(casaRef.current));
    seVanRef.current.clear();
    setEstancia("habitacion");
    setAcostando(true);
    setDecorando(false);
    setElegido(null);
    const momento = performance.now();
    setAndantes((actuales) => Object.fromEntries(Object.entries(actuales).map(([mundo, andante]) =>
      [mundo, ir({ ...andante, destino: null }, sitioNocheEnCasa(Number(mundo)), "dormir", 30, momento)])));
  };
  /** Con todos los de casa arropados y la lámpara apagada, una vez: «¡BUENAS NOCHES!». */
  const comprobarBuenasNoches = (actual: CasaProgress, apagada: boolean) => {
    if (acostando && apagada && buenasNoches === "no" && todosArropados(actual, relojCasa(ajustes))) setBuenasNoches("ventana");
  };
  const cambiarLampara = () => {
    const apagada = !lamparaApagada;
    setLamparaApagada(apagada);
    comprobarBuenasNoches(casaRef.current, apagada);
  };
  /**
   * Salir de la hora de dormir. Si por el reloj sigue siendo de noche, la lámpara se queda como estaba (apagada tras
   * «¡BUENAS NOCHES!») y la ventana no vuelve a salir esta vez; de día, la lámpara vuelve a estar encendida.
   */
  const terminarDeDormir = () => {
    setAcostando(false);
    if (!nocheReloj) setLamparaApagada(false);
    setBuenasNoches((actual) => actual === "no" ? "no" : "vista");
  };
  /** Soltar la mantita sobre un gatito: queda arropado esta noche y, si toca, gana su corazón. */
  const taparGatito = (indice: number) => {
    const mundo = gatitos[indice];
    if (mundo === undefined) return;
    const resultado = arropar(casaRef.current, mundo, relojCasa(ajustes));
    if (!resultado.arropado) return;
    pararGatito(indice);
    guardar(resultado.casa);
    sonidoRef.current?.golpeBano("campanita");
    comprobarBuenasNoches(resultado.casa, lamparaApagada);
    const momento = performance.now();
    setAndantes((actuales) => actuales[mundo] ? { ...actuales, [mundo]: { ...actuales[mundo], destino: null, pose: "dormir", desde: momento, hasta: momento + 60_000 } } : actuales);
    if (resultado.corazon) {
      const id = ++idRef.current;
      setRespuestas((actuales) => [...actuales.filter((r) => r.gatito !== indice), { gatito: indice, tipo: "gracias", cuidado: "frotar", corazon: true, id, desde: momento, dormido: true }]);
      window.setTimeout(() => setRespuestas((actuales) => actuales.filter((r) => r.id !== id)), RESPUESTA_MS);
    }
  };

  /**
   * Al cerrar la ventana de quién está en casa: los que se han ido de paseo andan hasta la puerta y salen, uno tras
   * otro; luego los que vuelven entran por la puerta, con su luz, y van a su sitio. Todo el camino lo hacen deprisa.
   */
  const cerrarEleccion = () => {
    const antes = eligiendo?.antes ?? [];
    setEligiendo(null);
    const ahoraEnCasa = enCasaDe(casaRef.current);
    const salen = antes.filter((mundo) => !ahoraEnCasa.includes(mundo));
    const entran = ahoraEnCasa.filter((mundo) => !antes.includes(mundo));
    if (!salen.length && !entran.length) return;
    const puerta = { x: PUERTA_X, y: HABITACION.sitios.puerta.y };
    const paso = reduceMotion ? 0 : PASO_PUERTA_MS;
    const recorrido = (desde: { x: number; y: number }, hasta: { x: number; y: number }) =>
      reduceMotion ? 0 : (Math.hypot(hasta.x - desde.x, hasta.y - desde.y) / (VELOCIDAD_GATITO * RAPIDO_PUERTA)) * 1000 + 300;
    setSaliendo((actuales) => [...actuales, ...salen]);
    setEsperando((actuales) => [...actuales, ...entran]);
    salen.forEach((mundo, orden) => window.setTimeout(() => {
      const desde = andantes[mundo] ?? puerta;
      rapidosRef.current.add(mundo);
      setAndantes((actuales) => actuales[mundo] ? { ...actuales, [mundo]: ir({ ...actuales[mundo], destino: null }, puerta, "sentarse", 0, performance.now()) } : actuales);
      window.setTimeout(() => {
        rapidosRef.current.delete(mundo);
        setSaliendo((actuales) => actuales.filter((otro) => otro !== mundo));
        setAndantes((actuales) => { const { [mundo]: _fuera, ...resto } = actuales; return resto; }); // eslint-disable-line @typescript-eslint/no-unused-vars
      }, recorrido(desde, puerta));
    }, orden * paso));
    const empieza = salen.length ? salen.length * paso + (reduceMotion ? 0 : 1200) : 0;
    entran.forEach((mundo, orden) => window.setTimeout(() => {
      const destino = noche ? sitioNoche(mundo) : sitioDia(mundo);
      rapidosRef.current.add(mundo);
      setAndantes((actuales) => ({ ...actuales, [mundo]: ir(nuevoAndante(puerta, performance.now()), destino, noche ? "dormir" : "sentarse", 2, performance.now()) }));
      setEsperando((actuales) => actuales.filter((otro) => otro !== mundo));
      setLuzPuerta((veces) => veces + 1);
      window.setTimeout(() => rapidosRef.current.delete(mundo), recorrido(puerta, destino));
    }, empieza + orden * paso));
  };

  /** Cambia el mueble elegido a `version` en el momento `momento` (el del toque): destello, campanita y, de día, el gatito más cercano va a olerlo. */
  const ponerVersion = (mueble: MuebleId, version: Version, momento: number) => {
    if (decoracionDe(casaRef.current)[mueble] === version) return;
    guardar({ ...casaRef.current, decoracion: cambiarMueble(decoracionDe(casaRef.current), mueble, version) });
    const id = ++idRef.current;
    setDestello({ mueble, id });
    window.setTimeout(() => setDestello((actual) => actual?.id === id ? null : actual), DESTELLO_MS);
    sonidoRef.current?.golpeBano("campanita");
    // De noche duermen (y los arropados llevan su mantita): nadie se levanta a olerlo.
    if (noche) return;
    const { oler } = MUEBLES_CASA[mueble];
    setAndantes((actuales) => {
      const libres = gatitos.filter((mundo, indice) => actuales[mundo] && cogidoRef.current?.indice !== indice && bano !== mundo);
      const cerca = libres.sort((a, b) => Math.hypot(actuales[a].x - oler.x, actuales[a].y - oler.y) - Math.hypot(actuales[b].x - oler.x, actuales[b].y - oler.y))[0];
      return cerca === undefined ? actuales : { ...actuales, [cerca]: ir(actuales[cerca], oler, "sentarse", OLER_S, momento) };
    });
  };

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

  /** Darle una comida del abanico: como el cuenco de siempre y, si es su favorita con hambre, «¡ÑAM!» (y queda descubierta). */
  const atenderComida = (indice: number, comida: Comida) => {
    const mundo = gatitos[indice];
    if (mundo === undefined) return;
    pararGatito(indice);
    const resultado = darDeComer(casaRef.current, mundo, comida, new Date());
    guardar(resultado.casa);
    const sonido = sonidoRef.current;
    if (resultado.respuesta === "gracias") sonido?.maullar(mundo, "gracias");
    else if (resultado.respuesta === "ahoraNo") sonido?.maullar(mundo, "ahoraNo");
    if (resultado.favorita) sonido?.golpeBano("campanita");
    const id = ++idRef.current;
    setRespuestas((actuales) => [...actuales.filter((r) => r.gatito !== indice),
      { gatito: indice, tipo: resultado.respuesta, cuidado: "comer", corazon: resultado.corazon, id, desde: performance.now(), favorita: resultado.favorita }]);
    window.setTimeout(() => setRespuestas((actuales) => actuales.filter((r) => r.id !== id)), RESPUESTA_MS);
  };

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
  // Hojas de todos los gatitos de la casa (también los de paseo, para la ventana de quién está en casa).
  const variantes = Object.keys(casa.gatitos).map(Number).sort((a, b) => a - b).map((mundo) => {
    const gatito = casa.gatitos[mundo];
    return { mundo, sucio: estadoDe(gatito.necesidades.bano) !== "bien", mejorAmigo: esMejorAmigo(gatito) };
  });
  const claveVariantes = variantes.map((v) => `${v.mundo}-${v.sucio}-${v.mejorAmigo}`).join(",");
  useEffect(() => {
    let vivo = true;
    for (const clave of claveVariantes.split(",").filter(Boolean)) {
      const [mundo, sucio, mejorAmigo] = clave.split("-");
      void arropadoDe(Number(mundo), { sucio: sucio === "true", mejorAmigo: mejorAmigo === "true" })
        .then((url) => { if (vivo) setPoseArropado((actuales) => actuales[clave] === url ? actuales : { ...actuales, [clave]: url }); });
    }
    return () => { vivo = false; };
  }, [claveVariantes]);
  const arropadoHoja = (mundo: number) => {
    const variante = variantes.find((v) => v.mundo === mundo);
    return variante && poseArropado[`${variante.mundo}-${variante.sucio}-${variante.mejorAmigo}`];
  };
  const hojaDe = (mundo: number) => {
    const variante = variantes.find((v) => v.mundo === mundo);
    return variante && hojas[`${variante.mundo}-${variante.sucio}-${variante.mejorAmigo}`];
  };
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
          if (cogidoRef.current?.indice === indice || bano === mundo || botandoRef.current.includes(mundo)) { siguientes[mundo] = andante; return; }
          andante = avanzarAndante(andante, rapidosRef.current.has(mundo) ? ms * RAPIDO_PUERTA : ms, momento);
          if (fase === "casa" && !andando(andante) && momento >= andante.hasta && frotandoRef.current !== indice && !saliendoRef.current.includes(mundo)) {
            const otros = gatitos.filter((otro) => otro !== mundo).map((otro) => siguientes[otro]).filter((otro): otro is Andante => Boolean(otro));
            // De vez en cuando, uno se va solo a la otra estancia: anda hasta la puerta y sale.
            if (!seVanRef.current.has(mundo) && cambiaSolo(Math.random, noche)) {
              seVanRef.current.add(mundo);
              siguientes[mundo] = ir(andante, puertaDe(enJardin ? "jardin" : "habitacion", HABITACION), "sentarse", 0.2, momento);
              return;
            }
            if (seVanRef.current.has(mundo)) { siguientes[mundo] = andante; return; }
            andante = decidir(andante, actual.gatitos[mundo], otros, {
              habitacion: enJardin ? JARDIN : HABITACION, noche, casaLimpia: casaLimpia(actual), alguienPide, sitioNoche: sitioNoche(mundo), azar: Math.random, ahora: momento,
            });
          }
          siguientes[mundo] = andante;
        });
        return siguientes;
      });
    }, PASO_ANIMACION_MS);
    return () => window.clearInterval(paso);
    // `sitioDia`, `sitioNoche` y `llegan` no cambian durante la visita.
  }, [fase, gatitos, noche, reduceMotion, bano, enJardin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Los que se iban solos, al llegar a la puerta, pasan a la otra estancia.
  useEffect(() => {
    for (const mundo of seVanRef.current) {
      const andante = andantes[mundo];
      if (!andante || andando(andante) || !gatitos.includes(mundo)) continue;
      seVanRef.current.delete(mundo);
      cambiarDeEstancia(mundo, performance.now());
    }
  }, [andantes, gatitos]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const reloj = window.setInterval(() => {
      guardar(avanzar(casaRef.current, new Date()));
      setNocheReloj(esDeNoche(relojCasa(ajustes)));
      setHoraDeDormir(puedeDormir(relojCasa(ajustes)));
      // Por la mañana la lámpara vuelve a estar encendida para la noche siguiente.
      if (!puedeDormir(relojCasa(ajustes))) setLamparaApagada(false);
      setFechaCasa(relojCasa(ajustes));
    }, TIEMPO_CADA_MS);
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
      if (arrastre.herramienta === "mantita") {
        const indice = tocar(punto);
        if (indice >= 0) taparGatito(indice);
      } else if (arrastre.herramienta === "cuenco") {
        setAbanico(false);
        const indice = tocar(punto);
        if (indice >= 0) {
          if (arrastre.comida) atenderComida(indice, arrastre.comida);
          else atender(indice, "comer");
        }
      } else if (arrastre.herramienta === "pelota") {
        lanzar(punto.x, punto.y);
      } else if (arrastre.herramienta === "plato") {
        setAbanicoAmigos(false);
        if (arrastre.comidaAmigo && sobreVisitante(punto)) darleDeComer(arrastre.comidaAmigo);
      } else if (arrastre.herramienta === "regadera") {
        const indice = maceteroBajo(punto.x, punto.y);
        if (indice !== null) regarMacetero(indice);
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

  const cogerObjeto = (herramienta: Herramienta | "mantita" | "regadera" | "plato", comida?: Comida, comidaAmigo?: FriendFood) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (fase !== "casa" || event.button !== 0) return;
    event.preventDefault();
    const punto = enEscena(event) ?? { x: 0, y: 0 };
    froteRef.current = null;
    setArrastre({ herramienta, ...punto, ...(comida ? { comida } : {}), ...(comidaAmigo ? { comidaAmigo } : {}) });
  };

  /** Con el teclado (o un lector de pantalla), el objeto va al gatito que lo pide, o al primero. */
  const usarConTeclado = (herramienta: Herramienta, comida?: Comida) => {
    if (fase !== "casa" || !gatitos.length) return;
    if (herramienta === "escoba") { if (casaRef.current.huellas.length) guardar(barrer(casaRef.current, 0)); return; }
    const cuidado = CUIDADO_DE[herramienta];
    const necesidad = NECESIDADES.find((id) => OBJETO_DE[id] === herramienta)!;
    const indice = Math.max(0, gatitos.findIndex((mundo) => estadoDe(casaRef.current.gatitos[mundo].necesidades[necesidad]) !== "bien"));
    setVista(centrarEn(sitios[indice], anchoVisible));
    if (herramienta === "pelota") lanzar(lista[indice].x, lista[indice].y - 40);
    else if (comida) { setAbanico(false); atenderComida(indice, comida); }
    else atender(indice, cuidado);
  };

  // Con el dedo y sin objeto: sobre un gatito, frotar; fuera de los gatitos, deslizar la habitación.
  const empezarDedo = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (fase !== "casa" || arrastre || event.button !== 0) return;
    const punto = enEscena(event);
    if (!punto) return;
    if (decorando) {
      // Decorando, el dedo no toca a los gatitos: desliza la habitación o, si no se mueve, elige el mueble.
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* sin captura, el toque sigue funcionando */ }
      deslizRef.current = { clienteX: event.clientX, vista: vistaX, moviendo: false, punto };
      return;
    }
    // Una mariposa delante de un gatito se toca antes que el gatito.
    const sobreMariposa = mariposasVisibles && mariposaBajo(punto, mariposasEn(event.timeStamp).map((m) => m.activa ? null : m)) >= 0;
    const indice = sobreMariposa || sobreVisitante(punto) ? -1 : tocar(punto);
    if (indice >= 0) pararGatito(indice);
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* sin captura, el deslizar sigue funcionando dentro de la escena */ }
    if (indice < 0) {
      deslizRef.current = { clienteX: event.clientX, vista: vistaX, moviendo: false, punto };
      return;
    }
    dedoRef.current = true;
    froteRef.current = frotar(null, indice, event.timeStamp, ajustes.frotarMs).frote;
    // Con el dedo casi quieto un momento (MANTENER_PARA_COGER_MS), se coge al gatito; si se mueve más, es frotar.
    const inicio = { clienteX: event.clientX, clienteY: event.clientY, indice, temporizador: 0 };
    inicio.temporizador = window.setTimeout(() => {
      if (pendienteRef.current !== inicio) return;
      pendienteRef.current = null;
      dedoRef.current = false;
      froteRef.current = null;
      setFrotando(null);
      setCogido({ indice, x: punto.x, y: punto.y });
    }, MANTENER_PARA_COGER_MS);
    pendienteRef.current = inicio;
  };
  const moverDedo = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (arrastre) return;
    if (cogidoRef.current) {
      const punto = enEscena(event);
      if (punto) setCogido((actual) => actual && { ...actual, ...punto });
      return;
    }
    const pendiente = pendienteRef.current;
    if (pendiente && Math.hypot(event.clientX - pendiente.clienteX, event.clientY - pendiente.clienteY) >= MOVER_PARA_FROTAR) {
      window.clearTimeout(pendiente.temporizador);
      pendienteRef.current = null;
    }
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
  const acabarDedo = (event: ReactPointerEvent<HTMLDivElement>) => {
    dedoRef.current = false;
    const tocado = deslizRef.current;
    if (decorando && tocado?.punto && !tocado.moviendo) setElegido(muebleEn(tocado.punto.x, tocado.punto.y));
    else if (noche && !enJardin && tocado?.punto && !tocado.moviendo && enLaLampara(tocado.punto)) cambiarLampara();
    else if (tocado?.punto && !tocado.moviendo && sobreVisitante(tocado.punto)) tocarVisitante();
    else if (mariposasVisibles && tocado?.punto && !tocado.moviendo && mariposaBajo(tocado.punto, mariposasEn(event.timeStamp).map((m) => m.activa ? null : m)) >= 0) setToqueMariposa({ punto: tocado.punto, ms: event.timeStamp });
    else if (tocado?.punto && !tocado.moviendo && sobreLaPuerta(estancia, tocado.punto.x, tocado.punto.y)) cruzarPuerta();
    deslizRef.current = null;
    if (pendienteRef.current) { window.clearTimeout(pendienteRef.current.temporizador); pendienteRef.current = null; }
    if (!arrastre) { froteRef.current = null; setFrotando(null); }
    const suelto = cogidoRef.current;
    if (suelto) soltarGatito(suelto, event.timeStamp);
  };

  /** Suelta al gatito cogido: en la bañera, si está sucio, se abre su baño; en el armario, el vestidor; si no, aterriza en el suelo. */
  const soltarGatito = (suelto: Cogido, momento: number) => {
    setCogido(null);
    const mundo = gatitos[suelto.indice];
    if (mundo === undefined) return;
    // Soltado en la puerta (y fuera de la hora de dormir): se va a la otra estancia.
    if (!acostando && sobreLaPuerta(estancia, suelto.x, suelto.y + COGIDO_PIES)) {
      cambiarDeEstancia(mundo, momento);
      return;
    }
    if (enJardin && sobreLaColchoneta(suelto.x, suelto.y + COGIDO_PIES)) { empezarABotar(mundo, momento); return; }
    const enBanera = !enJardin && sobreLaBanera(HABITACION, suelto.x, suelto.y + COGIDO_PIES);
    const enArmario = !enJardin && !enBanera && sobreElArmario(HABITACION, suelto.x, suelto.y + COGIDO_PIES);
    const sucio = estadoDe(casaRef.current.gatitos[mundo].necesidades.bano) !== "bien";
    const dondeCae = enBanera ? aterrizar(HABITACION, HABITACION.zonaBanera.izquierda - 40, HABITACION.suelo.delante - 20)
      : enArmario ? aterrizar(HABITACION, HABITACION.armario.left + HABITACION.armario.width / 2, HABITACION.suelo.fondo + 30)
        : aterrizar(enJardin ? JARDIN : HABITACION, suelto.x, suelto.y + COGIDO_PIES);
    setAndantes((actuales) => ({ ...actuales, [mundo]: { ...(actuales[mundo] ?? nuevoAndante(dondeCae, momento)), ...dondeCae, destino: null, pose: "sentarse", desde: momento, hasta: momento + 1500 } }));
    // En el armario, cualquiera (también sucio) va al vestidor.
    if (enArmario) { setVestidor(mundo); return; }
    if (!enBanera) return;
    if (sucio) setBano(mundo);
    // Limpio: hace su «ahora no», se sacude y salta fuera.
    else atender(suelto.indice, "esponja");
  };

  const seguir = () => {
    guardar(presentar(casa, llegan));
    setFase("casa");
    // Si alguno no cupo, se abre la ventana de elegir con los recién llegados delante de los demás de paseo.
    const fuera = llegadasDePaseo(casaRef.current, llegan);
    if (fuera.length) {
      const dentro = enCasaDe(casaRef.current);
      setEligiendo({ orden: [...dentro, ...fuera, ...dePaseoDe(casaRef.current).filter((mundo) => !fuera.includes(mundo))], antes: dentro });
    }
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

  // Cómo se ve cada gatito en casa ahora mismo: lo usan el dibujo y las fotos.
  const aspectos = gatitos.map((mundo, indice) => {
    const quieto = lista[indice];
    const enBrazos = cogido?.indice === indice;
    const andante = enBrazos ? { ...quieto, x: cogido!.x, y: cogido!.y + COGIDO_PIES, destino: null } : quieto;
    const llegando = llegan.includes(mundo) && fase === "entrando";
    const gatito = casa.gatitos[mundo];
    const pide = fase === "casa" ? bocadilloDe(gatito) : null;
    const respuesta = respuestas.find((r) => r.gatito === indice);
    const anda = andando(andante);
    const tapado = arropados.includes(mundo) && !enBrazos;
    const dormido = tapado || (!anda && andante.pose === "dormir" && !respuesta && frotando !== indice);
    // Anda o hace su pose; si pide algo y está quieto, lloriquea. El bocadillo se ve también andando.
    const animacion: AnimacionGato = respuesta ? animacionDeRespuesta(respuesta)
      : frotando === indice ? (arrastre?.herramienta === "esponja" ? "bano" : "ronronear")
        : anda ? "andar" : dormido ? "dormir" : pide ? "pedir" : ANIMACION_DE_VIDA[andante.pose];
    const desde = respuesta?.desde ?? andante.desde;
    const { fila } = ANIMACIONES_GATO[animacion];
    const cuadro = reduceMotion ? 0 : cuadroDe(animacion, (ahora - desde) / 1000);
    const hoja = hojaDe(mundo);
    const mira = andante.mira;
    const escala = escalaDe(andante.y);
    return { mundo, indice, enBrazos, andante, llegando, pide, respuesta, tapado, dormido, animacion, fila, cuadro, hoja, mira, escala };
  });

  /** El marco de la bandeja: guarda como foto lo que se ve ahora (el trozo de habitación y sus gatitos). */
  const hacerFoto = () => {
    const margen = 80;
    // La foto guarda al menos una ventana 4:3 de la habitación, centrada en lo que se ve: en una pantalla estrecha no sale
    // solo un trozo de puerta (issue 332).
    const anchoFoto = Math.min(ESCENA_CASA.ancho, Math.max(anchoVisible, ANCHO_VERTICAL_CASA));
    const xFoto = limitarVista(vistaX + anchoVisible / 2 - anchoFoto / 2, anchoFoto);
    const foto: FotoCasa = {
      hecha: new Date().toISOString(),
      vista: { x: Math.round(xFoto), ancho: Math.round(anchoFoto) },
      decoracion,
      noche,
      apagada: noche && lamparaApagada,
      gatitos: aspectos
        .filter(({ andante }) => andante.x >= xFoto - margen && andante.x <= xFoto + anchoFoto + margen)
        .map(({ mundo, andante, animacion, cuadro, mira, tapado }) => {
          const variante = variantes.find((v) => v.mundo === mundo);
          const ropa = ropaDe(casa, mundo);
          return { mundo, x: Math.round(andante.x), y: Math.round(andante.y), animacion, cuadro, mira, sucio: variante?.sucio ?? false, mejorAmigo: variante?.mejorAmigo ?? false, arropado: tapado,
            ...(!tapado && Object.keys(ropa).length ? { ropa } : {}) };
        }),
      // En el jardín, la foto guarda cómo estaba cada macetero.
      ...(enJardin ? { jardin: { maceteros: jardinDe(casa).maceteros.map(celdaDeMacetero), ...(visita ? { visitante: { animal: visita.animal, ...piesVisitante } } : {}) } } : {}),
    };
    guardar(guardarFoto(casaRef.current, foto));
    sonidoRef.current?.clic();
    setFlash((veces) => veces + 1);
  };

  const estiloMarco = { ...ACENTO_CASA, "--corazon": cssAssetUrl("./assets/sprites/ui-heart-v1.webp"), "--objetos": cssAssetUrl("./assets/sprites/casa-objetos-v1.webp"), "--comidas": cssAssetUrl(HOJA_COMIDAS), "--regadera": cssAssetUrl(REGADERA), "--comidas-amigos": cssAssetUrl(HOJA_COMIDAS_AMIGOS), "--hoja-mantita": cssAssetUrl(HOJA_MANTITA), "--objeto": `${Math.max(56, ajustes.objeto * medidas.escala)}px` } as CSSProperties;
  const estiloEscena = { "--objeto-escena": `${ajustes.objeto}px`, "--maceteros": cssAssetUrl(HOJA_MACETEROS), "--regadera": cssAssetUrl(REGADERA), "--comidas-amigos": cssAssetUrl(HOJA_COMIDAS_AMIGOS), "--mariposa": cssAssetUrl("./assets/sprites/casa-mariposa-v1.webp"), "--accesorios": cssAssetUrl(HOJA_ACCESORIOS), "--lampara": `${HABITACION.lampara.x}px ${HABITACION.lampara.y}px`, width: HABITACION.ancho, height: HABITACION.alto, transform: `translateX(${-vistaX * medidas.escala}px) scale(${medidas.escala})` } as CSSProperties;

  // Pantalla de baño: el gatito que se ha llevado a la bañera, con su hoja pintada. Al terminar, el baño cuenta como cuidado.
  const hojaBano = bano !== null ? hojaDe(bano) : undefined;
  /** Sonido del baño: bucle de agua o secador, golpes cortos y maullidos del gatito que se baña. */
  const sonarBano = (evento: Parameters<typeof sonidoDelBano>[0], utensilio: Parameters<typeof sonidoDelBano>[1]) => {
    const sonido = sonidoRef.current;
    if (!sonido || bano === null) return;
    const { bucle, golpe, maullido, cantar } = sonidoDelBano(evento, utensilio);
    if (bucle !== undefined) sonido.bucleBano(bucle);
    if (golpe) sonido.golpeBano(golpe);
    if (maullido) sonido.maullar(bano, maullido);
    if (cantar) sonido.cantar(bano);
  };
  /** «¡LISTO!» en el vestidor: se queda con lo que lleva y, de vuelta en la habitación, ronronea (sin corazón). */
  const salirDelVestidor = (ropa: Ropa) => {
    const mundo = vestidor;
    setVestidor(null);
    if (mundo === null) return;
    guardar(vestir(casaRef.current, mundo, ropa));
    const indice = gatitos.indexOf(mundo);
    if (indice < 0) return;
    const id = ++idRef.current;
    setRespuestas((actuales) => [...actuales.filter((r) => r.gatito !== indice), { gatito: indice, tipo: "gracias", cuidado: "frotar", corazon: false, id, desde: performance.now() }]);
  };
  const terminarBano = () => {
    const indice = bano === null ? -1 : gatitos.indexOf(bano);
    setBano(null);
    if (indice >= 0) atender(indice, "esponja");
  };

  return <section ref={seccionRef} onPointerDownCapture={() => { sonidoRef.current?.despertar(); nanaRef.current?.empezar(); }} className={`casa-gatitos${reduceMotion ? " is-quieta" : ""}${arrastre ? " is-arrastrando" : ""}${medidas.vertical ? " is-vertical" : " is-lado"}`} aria-label={t("casa.titulo.oculto")}>
    <BotonControl className="casa-salir" pictograma="mapa" etiqueta="casa.salir.oculto" onClick={salir} disabled={fase === "hola"} />
    <div className="casa-marco game-frame" style={estiloMarco}>
      <div className="casa-visor" ref={visorRef} style={{ width: medidas.anchoVisor, height: ESCENA_CASA.alto * medidas.escala }}>
        <div className={`casa-escena${noche ? " is-noche" : ""}${enJardin ? " is-jardin" : ""}${noche && lamparaApagada ? " is-apagada" : ""}`} ref={escenaRef} style={estiloEscena}
          onPointerDown={empezarDedo} onPointerMove={moverDedo} onPointerUp={acabarDedo} onPointerCancel={acabarDedo}>
          <img className="casa-fondo" src={enJardin ? JARDIN.fondo : fondo} alt="" draggable={false} />
          {/* Muebles, cada uno en la versión elegida, sobre la habitación vacía. */}
          {!enJardin && MUEBLES_DECORABLES.map((mueble) => {
            const dibujo = MUEBLES_CASA[mueble].dibujo!;
            return <i key={mueble} className="casa-mueble" aria-hidden="true"
              style={{ left: dibujo.x, top: dibujo.y, width: dibujo.ancho, height: dibujo.alto, ...celdaDeMueble(mueble, decoracion[mueble]) }} />;
          })}
          {decorando && <>
            <button type="button" className={`casa-mueble-zona is-pared${elegido === "pared" ? " is-elegido" : ""}`} style={{ left: 0, top: 0, width: HABITACION.ancho, height: PARED_HASTA }}
              aria-label={tClave("casa.decorar.mueble.pared.oculto")} onClick={(event) => { if (event.detail === 0) setElegido("pared"); }} />
            {MUEBLES_DECORABLES.map((mueble) => {
              const caja = MUEBLES_CASA[mueble].caja!;
              return <button key={mueble} type="button" className={`casa-mueble-zona${elegido === mueble ? " is-elegido" : ""}`} style={{ left: caja.x, top: caja.y, width: caja.ancho, height: caja.alto }}
                aria-label={tClave(`casa.decorar.mueble.${mueble}.oculto`)} onClick={(event) => { if (event.detail === 0) setElegido(mueble); }} />;
            })}
          </>}
          {destello && (() => {
            const caja = MUEBLES_CASA[destello.mueble].caja ?? { x: 0, y: 0, ancho: HABITACION.ancho, alto: PARED_HASTA };
            return <i key={destello.id} className="casa-destello" aria-hidden="true" style={{ left: caja.x + caja.ancho / 2, top: caja.y + caja.alto / 2 }} />;
          })()}
          {!enJardin && <><img className={`casa-armario${cogido ? " is-brilla" : ""}`} src={HABITACION.armario.imagen} alt="" draggable={false}
            style={{ left: HABITACION.armario.left, top: HABITACION.armario.top, width: HABITACION.armario.width, height: HABITACION.armario.height }} />
          <img className="casa-ventana-noche" src={VENTANA.imagen} alt="" draggable={false} style={{ left: VENTANA.left, top: VENTANA.top, width: VENTANA.width, height: VENTANA.height }} /></>}
          {/* La puerta del corazón lleva a la otra estancia; con el dedo se toca en la escena, aquí para el teclado. */}
          {fase === "casa" && !acostando && <button type="button" className={`casa-puerta${cogido || (llamando && !enJardin) ? " is-brilla" : ""}${llamando && !enJardin ? " is-llama" : ""}`} aria-label={tClave(enJardin ? "casa.puerta.casa.oculto" : "casa.puerta.jardin.oculto")}
            style={{ left: zonaPuertaDe(estancia).izquierda, top: zonaPuertaDe(estancia).arriba, width: zonaPuertaDe(estancia).derecha - zonaPuertaDe(estancia).izquierda, height: zonaPuertaDe(estancia).abajo - zonaPuertaDe(estancia).arriba }}
            onClick={(event) => { if (event.detail === 0) cruzarPuerta(); }} />}
          {(fase === "entrando" || luzPuerta > 0) && <div key={luzPuerta} className="casa-luz-puerta" style={{ left: porcentajeX(enJardin ? JARDIN.sitios.puerta.x : PUERTA_X) }} />}
          {enJardin && <img className={`casa-colchoneta${cogido ? " is-brilla" : ""}${botando.length ? " is-bota" : ""}`} src={JARDIN.colchoneta.imagen} alt="" draggable={false}
            style={{ left: JARDIN.colchoneta.left, top: JARDIN.colchoneta.top, width: JARDIN.colchoneta.width, height: JARDIN.colchoneta.height, "--bote": `${BOTAR_MS / BOTES}ms` } as CSSProperties} />}
          {enJardin && jardinDe(casa).maceteros.map((macetero, indice) => {
            const caja = JARDIN.maceteros[indice];
            return <i key={indice} role="img" aria-label={tClave(`casa.jardin.macetero.${macetero.etapa}.oculto`)}
              className={`casa-macetero${arrastre?.herramienta === "regadera" ? " is-brilla" : ""}`}
              style={{ left: caja.left, top: caja.top, width: caja.width, height: caja.height, backgroundPositionX: `${(celdaDeMacetero(macetero) / (CELDAS_MACETEROS - 1)) * 100}%` }}>
              {riego?.indice === indice && <i key={riego.id} className="casa-riego" aria-hidden="true" />}
            </i>;
          })}
          {enJardin && riego && riego.efecto !== "espera" && <i key={`destello-${riego.id}`} className="casa-destello" aria-hidden="true"
            style={{ left: JARDIN.maceteros[riego.indice].left + JARDIN.maceteros[riego.indice].width / 2, top: JARDIN.maceteros[riego.indice].top + 30 }} />}
          {/* El visitante: en el jardín, asomando por la valla o dentro; en la habitación, su bocadillo sobre la puerta. */}
          {enJardin && visita && <div className={`casa-visitante is-${visita.fase}${reaccion ? ` is-${reaccion.tipo}` : ""}${arrastre?.herramienta === "plato" ? " is-espera" : ""}`} role="img" aria-label={t(visita.fase === "llama" ? "casa.visitante.llama.oculto" : "casa.visitante.dentro.oculto", { nombre: nombreDeAmigo(visita.animal) })}
            style={{ left: piesVisitante.x, top: piesVisitante.y, zIndex: 900 }}>
            <DibujoAmigo animal={visita.animal} size={200} className="casa-visitante-dibujo" />
            {visita.fase === "llama" && <span key={visita.llamadas} className="casa-toc texto-noa" aria-hidden="true"><Texto clave="casa.visitante.toc.rotulo" /></span>}
            {reaccion?.tipo === "saluda" && <span key={reaccion.id} className="casa-bocadillo casa-bocadillo-visitante" aria-hidden="true"><i className={`casa-comida-amigo is-${comidaFavoritaDe(visita.animal)}`} /></span>}
            {reaccion?.tipo === "favorita" && <span key={reaccion.id} className="casa-nam texto-noa" aria-hidden="true"><Texto clave="casa.comida.nam.rotulo" /></span>}
            {reaccion?.corazon && <span key={`c${reaccion.id}`} className="casa-corazon" aria-hidden="true" />}
            {visita.fase === "seva" && <span className="casa-toc texto-noa" aria-hidden="true"><Texto clave="casa.visitante.adios.rotulo" /></span>}
          </div>}
          {!enJardin && visita?.fase === "llama" && <div key={visita.llamadas} className="casa-toc-puerta" role="img" aria-label={t("casa.visitante.llama.oculto", { nombre: nombreDeAmigo(visita.animal) })}
            style={{ left: zonaPuertaDe("habitacion").derecha + 90, top: zonaPuertaDe("habitacion").arriba + 30 }}>
            <DibujoAmigo animal={visita.animal} size={150} />
            <span className="casa-toc texto-noa"><Texto clave="casa.visitante.toc.rotulo" /></span>
          </div>}
          {/* De noche en el jardín, luciérnagas por encima de la capa de noche. */}
          {enJardin && noche && Array.from({ length: LUCIERNAGAS }, (_, indice) => {
            const { x, y } = luciernagaEn(indice, reduceMotion ? indice * 7000 : ahora);
            return <i key={indice} className="casa-luciernaga" aria-hidden="true" style={{ left: x, top: y, animationDelay: `${-indice * 0.37}s` }} />;
          })}
          {mariposasVisibles && mariposasEn(ahora).map((mariposa, indice) => <button key={indice} type="button" aria-label={t("casa.jardin.mariposa.oculto")}
            className={`casa-mariposa${mariposa.quieta ? " is-posada" : ""}${indice % 2 ? " is-otra" : ""}`} style={{ left: mariposa.x, top: mariposa.y }}
            data-indice={indice} onClick={mariposaConTeclado} />)}
          {!enJardin && casa.huellas.map((huella, indice) => <i key={`${huella.x}-${indice}`} className={`casa-objeto casa-huella is-${indice % 2 ? "huella-2" : "huella"}`} style={{ left: porcentajeX(huella.x), top: porcentajeY(ESCENA_CASA.suelo + 22 + (indice % 2) * 18) }} />)}
          {aspectos.map(({ mundo, enBrazos, andante, llegando, pide, respuesta, tapado, dormido, animacion, fila, cuadro, hoja, mira, escala }) => {
            // Arropado: su pose propia (cabeza fuera, mantita de su color); mientras se pinta, la de dormir.
            const arropado = tapado ? arropadoHoja(mundo) : undefined;
            const dibujo = arropado
              ? { backgroundImage: `url("${arropado}")`, backgroundSize: `${CUADROS_ARROPADO * CUADRO_GATO}px ${CUADRO_GATO}px`, backgroundPosition: `${-(cuadro % CUADROS_ARROPADO) * CUADRO_GATO}px 0` }
              : { backgroundImage: hoja ? `url("${hoja}")` : undefined, backgroundSize: `${COLUMNAS_GATO * CUADRO_GATO}px ${FILAS_GATO * CUADRO_GATO}px`, backgroundPosition: `${-cuadro * CUADRO_GATO}px ${-fila * CUADRO_GATO}px` };
            return <div key={mundo} role="img" aria-label={t("casa.gatito.oculto", { nombre: nombreDe(mundo) })}
              className={`casa-gatito${enBrazos ? " is-cogido" : ""}${llegando ? " is-llegando" : ""}${respuesta ? ` is-${respuesta.tipo}` : ""}${respuesta?.favorita ? " is-favorita" : ""}${dormido ? " is-dormido" : ""}${botando.includes(mundo) ? " is-botando" : ""}`}
              style={{ left: andante.x, top: andante.y - PIES_GATITO, zIndex: enBrazos ? 1500 : Math.round(andante.y), "--escala": escala, "--bote": `${BOTAR_MS / BOTES}ms` } as CSSProperties}>
              <span className="casa-gatito-dibujo" style={{ ...dibujo, transform: mira < 0 ? "scaleX(-1)" : undefined }}>
                {/* Sus accesorios, en su sitio en este cuadro; arropado, no se ven. */}
                {!tapado && piezasEnCuadro(ropaDe(casa, mundo), animacion, cuadro).map(({ tipo, pieza, caja }) =>
                  <i key={tipo} className="casa-gatito-pieza" style={{ left: `${caja.left}%`, top: `${caja.top}%`, width: `${caja.width}%`, height: `${caja.height}%`,
                    backgroundPosition: fondoDePieza(tipo, pieza) }} />)}
              </span>
              {pide && !respuesta && !dormido && <span className="casa-bocadillo" aria-hidden="true">{pide === "comer" && favoritaDescubierta(casa, mundo)
                ? <i className={`casa-comida is-${favoritaDescubierta(casa, mundo)}`} /> : <i className={`casa-objeto is-${OBJETO_DE[pide]}`} />}</span>}
              {respuesta?.favorita && <span className="casa-nam texto-noa" aria-hidden="true"><Texto clave="casa.comida.nam.rotulo" /></span>}
              {respuesta?.corazon && <span className="casa-corazon" aria-hidden="true" />}
            </div>;
          })}
          <div className="casa-luz-noche" aria-hidden="true" />
          {noche && !enJardin && <button type="button" className={`casa-lampara${lamparaApagada ? " is-apagada" : ""}`} aria-pressed={!lamparaApagada}
            aria-label={t("casa.dormir.lampara.oculto")} style={{ left: LAMPARA.x, top: LAMPARA.y, width: LAMPARA.ancho, height: LAMPARA.alto }}
            onClick={(event) => { if (event.detail === 0) cambiarLampara(); }} />}
          {pelota && <i key={pelota.id} className="casa-objeto is-pelota casa-pelota-lanzada" style={{ left: porcentajeX(pelota.x), top: porcentajeY(pelota.y), "--hasta": porcentajeX(lista[pelota.gatito]?.x ?? pelota.x), "--hasta-y": porcentajeY((lista[pelota.gatito]?.y ?? pelota.y) - 30) } as CSSProperties} />}
          {arrastre && <i className={`${arrastre.comidaAmigo ? `casa-comida-amigo is-${arrastre.comidaAmigo}` : arrastre.comida ? `casa-comida is-${arrastre.comida}` : `casa-objeto is-${arrastre.herramienta}`} casa-arrastrado`} style={{ left: porcentajeX(arrastre.x), top: porcentajeY(arrastre.y) }} />}
        </div>
        {quedaIzquierda && <span className="casa-borde is-izquierda" aria-hidden="true" />}
        {quedaDerecha && <span className="casa-borde is-derecha" aria-hidden="true" />}
        {llamando && visita && (enJardin ? VISITANTE_ASOMA.x > vistaX + anchoVisible - 40 : zonaPuertaDe("habitacion").derecha < vistaX + 20) &&
          <button type="button" key={`visita-${visita.llamadas}`} className={`casa-aviso casa-aviso-visita is-${enJardin ? "derecha" : "izquierda"}`}
            aria-label={t("casa.visitante.llama.oculto", { nombre: nombreDeAmigo(visita.animal) })}
            onClick={() => setVista(enJardin ? centrarEn(VISITANTE_ASOMA.x, anchoVisible) : 0)}><DibujoAmigo animal={visita.animal} size={64} /></button>}
        {fuera.map((aviso) => <span key={aviso.mundo} className={`casa-aviso is-${aviso.lado}`} aria-hidden="true"><i className={`casa-objeto is-${aviso.objeto}`} /></span>)}
        {flash > 0 && <span key={flash} className="casa-flash" aria-hidden="true"><i className="casa-foto-vuela" /></span>}
      </div>
      {fase === "casa" && bano === null && decorando && <div className="casa-bandeja is-decorar" aria-label={t("casa.decorar.bandeja.oculto")} role="toolbar">
        <BotonControl className="casa-bandeja-modo" pictograma="vuelve" etiqueta="casa.decorar.cuidar.oculto" onClick={cambiarDecorar} />
        {elegido && VERSIONES.map((version) => <button key={version} type="button" className={`casa-bandeja-objeto casa-version${decoracion[elegido] === version ? " is-puesta" : ""}`}
          aria-label={t("casa.decorar.version.oculto", { mueble: tClave(`casa.decorar.mueble.${elegido}.oculto`), numero: version + 1 })} aria-pressed={decoracion[elegido] === version}
          onClick={(event) => ponerVersion(elegido, version, event.timeStamp)}>
          <Muestra mueble={elegido} version={version} />
        </button>)}
      </div>}
      {fase === "casa" && bano === null && !decorando && acostando && <div className="casa-bandeja" aria-label={t("casa.dormir.bandeja.oculto")} role="toolbar">
        <span className="casa-bandeja-modos">
          <BotonControl className="casa-bandeja-modo" pictograma="vuelve" etiqueta="casa.dormir.salir.oculto" onClick={terminarDeDormir} />
          <BotonControl className="casa-bandeja-modo" pictograma="marco" etiqueta="casa.foto.boton.oculto" onClick={hacerFoto} />
        </span>
        <button type="button" className={`casa-bandeja-objeto${arrastre?.herramienta === "mantita" ? " is-cogido" : ""}`} aria-label={t("casa.dormir.mantita.oculto")}
          onPointerDown={(event) => cogerObjeto("mantita")(event)} onClick={(event) => {
            if (event.detail !== 0) return;
            const indice = gatitos.findIndex((mundo) => !arropados.includes(mundo));
            if (indice >= 0) taparGatito(indice);
          }}>
          <i className="casa-objeto is-mantita" />
        </button>
        {/* La lámpara también en la bandeja: en apaisado la bandeja tapa la de la habitación. */}
        <button type="button" className="casa-bandeja-objeto" aria-label={t("casa.dormir.lampara.oculto")} aria-pressed={!lamparaApagada} onClick={cambiarLampara}>
          <i className={`casa-objeto is-lampara${lamparaApagada ? " is-apagada" : ""}`} />
        </button>
      </div>}
      {fase === "casa" && bano === null && !decorando && !acostando && <div className={`casa-bandeja${brilla ? " is-brilla" : ""}`} aria-label={t("casa.bandeja.oculto")} role="toolbar">
        <span className="casa-bandeja-modos">
          {horaDeDormir && <BotonControl className="casa-bandeja-modo casa-dormir" pictograma="estrella" etiqueta="casa.dormir.empezar.oculto" onClick={empezarADormir} />}
          {/* Decorar, solo en la habitación. */}
          {!enJardin && <BotonControl className="casa-bandeja-modo" pictograma="flor" etiqueta="casa.decorar.boton.oculto" onClick={cambiarDecorar} />}
          <BotonControl className="casa-bandeja-modo" pictograma="marco" etiqueta="casa.foto.boton.oculto" onClick={hacerFoto} />
          <BotonControl className="casa-bandeja-modo" pictograma="gato" etiqueta="casa.enCasa.boton.oculto" onClick={() => setEligiendo({ orden: [...enCasaDe(casaRef.current), ...dePaseoDe(casaRef.current)], antes: enCasaDe(casaRef.current) })} />
        </span>
        {HERRAMIENTAS.filter((herramienta) => !enJardin || (herramienta !== "escoba" && !(herramienta === "pelota" && visita?.fase === "dentro"))).map((herramienta) => herramienta === "cuenco"
          // El cuenco: al tocarlo se abre encima el abanico de las cuatro comidas, y se arrastra la elegida.
          ? <span key={herramienta} className="casa-cuenco-sitio">
            {abanico && <span className="casa-abanico" role="group" aria-label={t("casa.comida.abanico.oculto")}>
              {COMIDAS.map((comida, orden) => <button key={comida} type="button" className={`casa-abanico-comida${arrastre?.comida === comida ? " is-cogido" : ""}`}
                style={{ "--orden": orden } as CSSProperties} aria-label={tClave(`casa.comida.${comida}.oculto`)}
                onPointerDown={cogerObjeto("cuenco", comida)} onClick={(event) => { if (event.detail === 0) usarConTeclado("cuenco", comida); }}>
                <i className={`casa-comida is-${comida}`} />
              </button>)}
            </span>}
            <button type="button" className={`casa-bandeja-objeto${abanico ? " is-abierto" : ""}`} aria-expanded={abanico}
              aria-label={tClave("casa.objeto.cuenco.oculto")} onClick={() => setAbanico((abierto) => !abierto)}>
              <i className="casa-objeto is-cuenco" />
            </button>
          </span>
          : <button key={herramienta} type="button" className={`casa-bandeja-objeto${arrastre?.herramienta === herramienta ? " is-cogido" : ""}`}
            aria-label={tClave(`casa.objeto.${herramienta}.oculto`)} onPointerDown={cogerObjeto(herramienta)} onClick={(event) => { if (event.detail === 0) usarConTeclado(herramienta); }}>
            <i className={`casa-objeto is-${herramienta}`} />
          </button>)}
        {/* Con un visitante en el jardín, el plato (en lugar de la pelota, para que quepa): al tocarlo salen sus tres comidas para arrastrar una. */}
        {enJardin && visita?.fase === "dentro" && <span className="casa-cuenco-sitio">
          {abanicoAmigos && <span className="casa-abanico is-plato" role="group" aria-label={t("casa.visitante.plato.abanico.oculto")}>
            {COMIDAS_AMIGOS.map((comida, orden) => <button key={comida} type="button" className={`casa-abanico-comida${arrastre?.comidaAmigo === comida ? " is-cogido" : ""}`}
              style={{ "--orden": orden } as CSSProperties} aria-label={tClave(`casa.visitante.comida.${comida}.oculto`)} data-comida={comida}
              onPointerDown={cogerObjeto("plato", undefined, comida)} onClick={platoConTeclado}>
              <i className={`casa-comida-amigo is-${comida}`} />
            </button>)}
          </span>}
          <button type="button" className={`casa-bandeja-objeto casa-plato${abanicoAmigos ? " is-abierto" : ""}`} aria-expanded={abanicoAmigos}
            aria-label={tClave("casa.visitante.plato.oculto")} onClick={() => setAbanicoAmigos((abierto) => !abierto)}>
            <i className="casa-comida-amigo is-apple" />
          </button>
        </span>}
        {/* En el jardín, la regadera para los maceteros. */}
        {enJardin && <button type="button" className={`casa-bandeja-objeto${arrastre?.herramienta === "regadera" ? " is-cogido" : ""}`}
          aria-label={tClave("casa.objeto.regadera.oculto")} onPointerDown={cogerObjeto("regadera")} onClick={regarConTeclado}>
          <i className="casa-objeto is-regadera" />
        </button>}
      </div>}
    </div>
    {vestidor !== null && <VestidorGatito nombre={nombreDe(vestidor)} mundo={vestidor} reduceMotion={reduceMotion} ropa={ropaDe(casa, vestidor)}
      variante={variantes.find((v) => v.mundo === vestidor) ?? { sucio: false, mejorAmigo: false }}
      onToque={() => sonidoRef.current?.golpeBano("campanita")} onListo={salirDelVestidor} />}
    {bano !== null && <BanoGatito nombre={nombreDe(bano)} hoja={hojaBano} reduceMotion={reduceMotion} onSalir={() => { sonidoRef.current?.bucleBano(null); setBano(null); }} onTerminar={terminarBano} onSonido={sonarBano} />}
    {buenasNoches === "ventana" && <Ventana id="casa-buenas-noches" titulo="casa.dormir.fin.titulo.rotulo" onClose={() => setBuenasNoches("vista")}
      botones={<Boton tipo="seguir" clave="casa.dormir.fin.sigue.rotulo" data-gamepad-default onClick={() => setBuenasNoches("vista")} />}>
      <p className="juntos">{t("casa.dormir.fin.frase.juntos")}</p>
    </Ventana>}
    {eligiendo && <Ventana id="casa-en-casa" titulo="casa.enCasa.titulo.rotulo" className="casa-eligiendo" onClose={cerrarEleccion}
      botones={<Boton tipo="seguir" clave="casa.enCasa.sigue.rotulo" data-gamepad-default onClick={cerrarEleccion} />}>
      <p key={llena} className={`casa-huellas-en-casa${llena ? " is-llena" : ""}`} style={{ "--objetos": cssAssetUrl("./assets/sprites/casa-objetos-v1.webp") } as CSSProperties} role="img" aria-label={t("casa.enCasa.cuantos.oculto", { cuantos: enCasaDe(casa).length, maximo: MAX_EN_CASA })}>
        {Array.from({ length: MAX_EN_CASA }, (_, indice) => <i key={indice} className={`casa-objeto is-huella${indice < enCasaDe(casa).length ? "" : " is-vacia"}`} />)}
      </p>
      <div className="casa-fichas" style={{ "--comidas": cssAssetUrl(HOJA_COMIDAS) } as CSSProperties}>
        {eligiendo.orden.map((mundo) => {
          const dentro = enCasaDe(casa).includes(mundo);
          return <button key={mundo} type="button" className={`casa-ficha${dentro ? "" : " is-de-paseo"}`} aria-pressed={dentro}
            aria-label={t(dentro ? "casa.enCasa.ficha.dentro.oculto" : "casa.enCasa.ficha.paseo.oculto", { nombre: nombreDe(mundo) })} onClick={() => cambiarDeSitio(mundo)}>
            <span className="casa-ficha-dibujo" style={{ backgroundImage: hojaDe(mundo) ? `url("${hojaDe(mundo)}")` : undefined, backgroundSize: `${COLUMNAS_GATO * 100}% ${FILAS_GATO * 100}%`, backgroundPosition: `0 ${(ANIMACIONES_GATO.sentado.fila / (FILAS_GATO - 1)) * 100}%` }} />
            {favoritaDescubierta(casa, mundo) && <i className={`casa-comida casa-ficha-comida is-${favoritaDescubierta(casa, mundo)}`} role="img"
              aria-label={t("casa.comida.favorita.oculto", { comida: tClave(`casa.comida.${favoritaDescubierta(casa, mundo)}.oculto`) })} />}
            {!dentro && <i className="casa-mochila" aria-hidden="true" />}
            <span className="texto-noa pequeno">{nombreDe(mundo)}</span>
          </button>;
        })}
      </div>
      <p className="juntos">{t("casa.enCasa.frase.juntos", { maximo: MAX_EN_CASA })}</p>
    </Ventana>}
    {fase === "hola" && <Ventana id="casa-llegada" titulo="casa.llegada.titulo.rotulo" celebracion onClose={seguir}
      botones={<Boton tipo="seguir" clave="casa.llegada.sigue.rotulo" data-gamepad-default onClick={seguir} />}>
      <div className="ventana-dibujo casa-llegada-dibujo">{llegan.slice(0, MAX_EN_CASA).map((mundo) => <img key={mundo} src={worldCatalog.find((world) => world.id === mundo)?.catAsset} alt="" />)}</div>
      <p className="juntos">{llegan.length === 1 ? t("casa.llegada.uno.juntos", { nombre: nombreDe(llegan[0]) })
        : llegan.length > MAX_EN_CASA ? t("casa.llegada.muchos.juntos", { cuantos: llegan.length })
          : t("casa.llegada.varios.juntos", { nombres: nombresJuntos(llegan) })}</p>
    </Ventana>}
  </section>;
}

const MUEBLES_DECORABLES = (Object.keys(MUEBLES_CASA) as MuebleId[]).filter((mueble) => MUEBLES_CASA[mueble].caja !== null);
const LADO_MUESTRA = 48;

/** Fondo de la celda de la versión `version` en la lámina del mueble (cinco celdas en fila). */
function celdaDeMueble(mueble: MuebleId, version: Version): CSSProperties {
  const dibujo = MUEBLES_CASA[mueble].dibujo!;
  return { backgroundImage: `url("${dibujo.imagen}")`, backgroundSize: `${VERSIONES.length * 100}% 100%`, backgroundPosition: `${(version / (VERSIONES.length - 1)) * 100}% 0` };
}

/** Muestra de una versión en la bandeja: el mueble en esa versión, o las rayas de la pared. */
function Muestra({ mueble, version }: { mueble: MuebleId; version: Version }) {
  const dibujo = MUEBLES_CASA[mueble].dibujo;
  if (!dibujo) {
    const [claro, oscuro] = TONOS_PARED[version];
    return <i className="casa-muestra is-pared" style={{ background: `repeating-linear-gradient(90deg, ${claro} 0 8px, ${oscuro} 8px 16px)` }} />;
  }
  const escala = LADO_MUESTRA / Math.max(dibujo.ancho, dibujo.alto);
  return <i className="casa-muestra" style={{ width: dibujo.ancho * escala, height: dibujo.alto * escala, ...celdaDeMueble(mueble, version) }} />;
}

/** La lámpara de pie, para tocarla de noche (en px de la escena, alrededor de su luz y su pie). */
const LAMPARA = { x: HABITACION.lampara.x - 50, y: HABITACION.lampara.y - 50, ancho: 100, alto: 250 };
const enLaLampara = (punto: { x: number; y: number }) =>
  punto.x >= LAMPARA.x && punto.x <= LAMPARA.x + LAMPARA.ancho && punto.y >= LAMPARA.y && punto.y <= LAMPARA.y + LAMPARA.alto;
