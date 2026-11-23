/**
 * Base común de los duelos de memoria con movimiento (issue 360): lleva el motor (`memoriaDuelo.ts`) en el tiempo
 * (reloj por fotograma que se para con la pausa), la práctica (visita a los tres sitios con paradas y ronda guiada),
 * los tiempos de «CASI», ronda ganada y final, el teclado (flechas izquierda, arriba y derecha, o 1, 2 y 3) y el sonido.
 * Cada juego pone la escena: dónde están los sitios y cómo se mueve la guardiana.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  conCorona, crearMemoria, crearRondaGuiada, empiezaARepetir, mira as mirarOtraVez, momentoEnsenanza, MS_POR_PULSO, PULSOS_POR_SITIO,
  SITIOS, tocar as tocarSitio, vuelveAEnsenar, type EstadoMemoria, type MomentoEnsenanza, type Sitio,
} from "./memoriaDuelo";
import { crearSonidoMemoria, type EstiloCancion, type SonidoMemoria, type Timbre } from "./memoriaSonido";

export type ModoMemoria = "practica" | "juego";
/** Lo que dura cada respuesta antes de seguir (ms de juego, parados en la pausa). */
export const CASI_MS = 1400;
export const RONDA_MS = 1600;
export const FINAL_MS = 2200;
/** Lo que dura el destello de un toque. */
export const TOQUE_MS = 600;

export type Toque = { sitio: Sitio; desde: number; acierto: boolean };
export type VisitaPractica = { sitio: Sitio; desde: number; parada: boolean };

type Opciones = {
  paused: boolean;
  muted: boolean;
  musicVolume: number;
  effectsVolume: number;
  notas: readonly [number, number, number];
  timbre: Timbre;
  estilo: EstiloCancion;
  /** Semilla del recorrido (por defecto, al azar). */
  semilla?: () => number;
};

export function useMemoriaDuelo({ paused, muted, musicVolume, effectsVolume, notas, timbre, estilo, semilla = () => Math.floor(Math.random() * 2 ** 31) }: Opciones) {
  const [modo, setModo] = useState<ModoMemoria | null>(null);
  const [estado, setEstado] = useState<EstadoMemoria | null>(null);
  /** Tiempo de juego en ms (no avanza en la pausa). */
  const [ahora, setAhora] = useState(0);
  const [ensenaDesde, setEnsenaDesde] = useState(0);
  /** Hasta cuándo dura la respuesta en curso («CASI», ronda ganada o final). */
  const [esperaHasta, setEsperaHasta] = useState(0);
  const [toque, setToque] = useState<Toque | null>(null);
  /** Práctica: la visita a los tres sitios antes de la ronda guiada. */
  const [visita, setVisita] = useState<VisitaPractica | null>(null);
  const [resultado, setResultado] = useState<{ corona: boolean } | null>(null);
  const [practicado, setPracticado] = useState(false);
  const [mostrarSalir, setMostrarSalir] = useState(false);
  const detenido = paused || mostrarSalir || (visita?.parada ?? false);

  const sonidoRef = useRef<SonidoMemoria | null>(null);
  useEffect(() => {
    const sonido = crearSonidoMemoria({ notas, timbre, estilo }, { silencio: muted, musica: musicVolume / 100, efectos: effectsVolume / 100 });
    sonidoRef.current = sonido;
    return () => { sonido.cerrar(); sonidoRef.current = null; };
    // El sonido se crea una vez; los volúmenes van por `ajustar`.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { sonidoRef.current?.ajustar({ silencio: muted, musica: musicVolume / 100, efectos: effectsVolume / 100 }); }, [muted, musicVolume, effectsVolume]);

  // Reloj de juego: avanza por fotograma solo mientras hay juego y no está detenido.
  const ahoraRef = useRef(0);
  useEffect(() => {
    if (!modo || detenido) return;
    let anterior = performance.now();
    let fotograma = requestAnimationFrame(function paso(momento) {
      ahoraRef.current += Math.min(100, momento - anterior);
      anterior = momento;
      setAhora(ahoraRef.current);
      fotograma = requestAnimationFrame(paso);
    });
    return () => cancelAnimationFrame(fotograma);
  }, [modo, detenido]);

  // Al volver de la pausa mientras la guardiana enseñaba, lo enseña entero de nuevo.
  const fueDetenido = useRef(false);
  useEffect(() => {
    if (detenido) { fueDetenido.current = true; return; }
    if (!fueDetenido.current) return;
    fueDetenido.current = false;
    if (estado?.fase === "ensena") setEnsenaDesde(ahoraRef.current);
  }, [detenido, estado?.fase]);

  const momento: MomentoEnsenanza | null = estado?.fase === "ensena" && !visita ? momentoEnsenanza(estado, ahora - ensenaDesde) : null;

  // La canción suena solo mientras enseña.
  const ensenando = Boolean(momento && !momento.terminada && !detenido) || Boolean(visita && !visita.parada && !detenido);
  useEffect(() => {
    if (ensenando) sonidoRef.current?.empezarCancion();
    else sonidoRef.current?.pararCancion();
  }, [ensenando]);

  // La nota de cada sitio suena al empezar a cantar en él; al acabar el recorrido le toca a Noa.
  const cantadoRef = useRef(-1);
  const indiceCantando = momento && !momento.terminada && momento.cantando ? momento.indice : -1;
  useEffect(() => {
    if (indiceCantando < 0 || !momento || momento.terminada) { if (!momento) cantadoRef.current = -1; return; }
    if (cantadoRef.current === indiceCantando) return;
    cantadoRef.current = indiceCantando;
    sonidoRef.current?.nota(momento.sitio);
  }, [indiceCantando]); // eslint-disable-line react-hooks/exhaustive-deps
  const terminado = Boolean(momento?.terminada);
  useEffect(() => {
    if (!terminado) return;
    cantadoRef.current = -1;
    setEstado((actual) => actual && empiezaARepetir(actual));
  }, [terminado]);

  // Práctica: la guardiana va a cada sitio (un pulso), canta (otro) y se para hasta SIGUE.
  useEffect(() => {
    if (!visita || visita.parada) return;
    if (ahora - visita.desde >= PULSOS_POR_SITIO * MS_POR_PULSO) setVisita({ ...visita, parada: true });
    else if (ahora - visita.desde >= MS_POR_PULSO && cantadoRef.current !== 10 + visita.sitio) {
      cantadoRef.current = 10 + visita.sitio;
      sonidoRef.current?.nota(visita.sitio);
    }
  }, [ahora, visita]);

  // Tras «CASI», ronda ganada o final, sigue cuando pasa su tiempo.
  useEffect(() => {
    if (!estado || !esperaHasta || ahora < esperaHasta) return;
    setEsperaHasta(0);
    if (estado.fase === "final") {
      if (modo === "practica") { setPracticado(true); setModo(null); setEstado(null); }
      else setResultado({ corona: conCorona(estado) });
      return;
    }
    setEstado(vuelveAEnsenar(estado));
    setEnsenaDesde(ahoraRef.current);
  }, [ahora, esperaHasta, estado, modo]);

  const empezar = useCallback((nuevo: ModoMemoria) => {
    sonidoRef.current?.despertar();
    ahoraRef.current = 0;
    setAhora(0);
    setResultado(null);
    setToque(null);
    setEsperaHasta(0);
    setModo(nuevo);
    setEnsenaDesde(0);
    if (nuevo === "practica") {
      setEstado(crearRondaGuiada(semilla()));
      setVisita({ sitio: 0, desde: 0, parada: false });
    } else {
      setEstado(crearMemoria(semilla()));
      setVisita(null);
    }
  }, [semilla]);

  /** SIGUE en una parada de la práctica: el siguiente sitio o, tras el tercero, la ronda guiada. */
  const seguirVisita = useCallback(() => {
    if (!visita) return;
    const siguiente = visita.sitio + 1;
    if (siguiente < SITIOS.length) setVisita({ sitio: siguiente as Sitio, desde: ahoraRef.current, parada: false });
    else { setVisita(null); setEnsenaDesde(ahoraRef.current); cantadoRef.current = -1; }
  }, [visita]);

  const tocar = useCallback((sitio: Sitio) => {
    if (!estado || detenido || esperaHasta) return;
    const { estado: siguiente, evento } = tocarSitio(estado, sitio);
    if (evento === "ignorado") return;
    setEstado(siguiente);
    setToque({ sitio, desde: ahoraRef.current, acierto: evento !== "casi" });
    const sonido = sonidoRef.current;
    if (evento === "casi") { sonido?.casi(); setEsperaHasta(ahoraRef.current + CASI_MS); return; }
    sonido?.nota(sitio);
    if (evento === "rondaGanada") { window.setTimeout(() => sonidoRef.current?.ronda(), 250); setEsperaHasta(ahoraRef.current + RONDA_MS); }
    if (evento === "final") { window.setTimeout(() => sonidoRef.current?.ronda(), 250); setEsperaHasta(ahoraRef.current + FINAL_MS); }
  }, [estado, detenido, esperaHasta]);

  const mira = useCallback(() => {
    if (!estado || estado.fase !== "repite" || detenido) return;
    setEstado(mirarOtraVez(estado));
    setEnsenaDesde(ahoraRef.current);
    cantadoRef.current = -1;
  }, [estado, detenido]);

  // Teclado: flechas izquierda, arriba y derecha, o 1, 2 y 3.
  useEffect(() => {
    if (!modo) return;
    const alPulsar = (event: KeyboardEvent) => {
      const sitio = ({ ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, "1": 0, "2": 1, "3": 2 } as Record<string, Sitio | undefined>)[event.key];
      if (sitio === undefined || event.repeat) return;
      event.preventDefault();
      tocar(sitio);
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [modo, tocar]);

  const salirDelJuego = useCallback(() => { setModo(null); setEstado(null); setVisita(null); setResultado(null); }, []);

  return {
    modo, estado, ahora, momento, toque, visita, resultado, practicado, detenido, ensenando,
    /** Respuesta en curso: «CASI», ronda ganada o final, con su avance de 0 a 1. */
    respuesta: estado && esperaHasta ? { fase: estado.fase, avance: 1 - (esperaHasta - ahora) / (estado.fase === "casi" ? CASI_MS : estado.fase === "final" ? FINAL_MS : RONDA_MS) } : null,
    mostrarSalir, setMostrarSalir, empezar, seguirVisita, tocar, mira, salirDelJuego,
  };
}
