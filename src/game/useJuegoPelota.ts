/**
 * El juego de la pelota dentro de la casa: lleva el reloj de `casaPelota.ts` en cada cuadro, mueve a su gatito y pinta
 * la pelota directamente en su capa (sin volver a pintar la casa por ella).
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { Andante, Punto } from "./casaDeambular";
import { atrapadaSinMoverse, limitesDe, nuevaBola, nuevoJuego, pasoJuego, sinGatito, type FaseJuego, type Juego, type Limites } from "./casaPelota";

/** Cada cuánto se lleva a la casa la posición del gatito que juega. */
const PASO_GATITO_MS = 30;

export type JuegoEnMarcha = { juego: Juego; mundo: number | null; gatito: Andante | null };
/** Lo que la casa necesita saber para dibujar: quién juega, en qué fase y desde cuándo. */
export type Jugada = { mundo: number | null; fase: FaseJuego; desde: number };

type Casa = {
  reduceMotion: boolean;
  /** ¿Se sigue viendo el juego? No, si se cambia de estancia, se decora, se va a dormir… */
  seSigue: () => boolean;
  /** ¿Puede seguir jugando? No, si lo han cogido, abierto su menú, mandado fuera… */
  puede: (mundo: number) => boolean;
  mover: (mundo: number, gatito: Andante) => void;
  atrapa: (mundo: number) => void;
  bote: () => void;
  escalaDe: (y: number) => number;
};

export type Lanzamiento = {
  punto: Punto;
  dedo: { vx: number; vy: number };
  suelo: Limites;
  vista: { x: number; ancho: number };
  /** El que iría a por ella si nadie está jugando ya. */
  mundo: number | null;
  andanteDe: (mundo: number) => Andante;
  /** Altura a la que la abraza ese gatito. */
  abrazoDe: (mundo: number) => number;
};

export function useJuegoPelota(capaRef: RefObject<HTMLDivElement | null>, casa: Casa) {
  const enMarchaRef = useRef<JuegoEnMarcha | null>(null);
  const [jugada, setJugada] = useState<Jugada | null>(null);
  const casaRef = useRef(casa);
  useEffect(() => { casaRef.current = casa; });

  const pintar = useCallback(() => {
    const capa = capaRef.current;
    const enMarcha = enMarchaRef.current;
    if (!capa || !enMarcha) return;
    const { x, y, z, giro } = enMarcha.juego.bola;
    capa.style.transform = `translate(${x}px, ${y}px) scale(${casaRef.current.escalaDe(y)})`;
    // Abrazada, queda detrás de sus patas.
    capa.style.zIndex = String(Math.round(y) + (enMarcha.juego.fase === "sujeta" ? -1 : 1));
    capa.style.setProperty("--alto", `${-z}px`);
    capa.style.setProperty("--giro", `${giro}deg`);
    capa.style.setProperty("--sombra", String(Math.max(0.4, 1 - z / 400)));
  }, [capaRef]);

  const anunciar = useCallback(() => {
    const enMarcha = enMarchaRef.current;
    setJugada(enMarcha && { mundo: enMarcha.mundo, fase: enMarcha.juego.fase, desde: performance.now() - enMarcha.juego.t });
  }, []);

  const lanzar = useCallback(({ punto, dedo, suelo, vista, mundo, andanteDe, abrazoDe }: Lanzamiento) => {
    const { reduceMotion, puede, mover, atrapa, bote } = casaRef.current;
    const antes = enMarchaRef.current;
    // Si uno ya va a por la anterior, sigue con esta.
    const sigue = antes?.mundo != null && antes.juego.fase !== "sujeta" && antes.juego.fase !== "empuja" && antes.juego.fase !== "sola" && puede(antes.mundo) ? antes : null;
    const quien = sigue ? sigue.mundo : mundo;
    const limites = limitesDe(suelo, vista);
    let bola = nuevaBola(punto, dedo, limites);
    if (reduceMotion) bola = { ...bola, z: 0, vx: 0, vz: 0 };
    let juego = nuevoJuego(bola, limites, quien !== null, quien === null ? undefined : abrazoDe(quien));
    let gatito = sigue ? sigue.gatito : quien === null ? null : andanteDe(quien);
    if (sigue && sigue.juego.fase !== "mira") juego = { ...juego, fase: "corre", velocidad: sigue.juego.velocidad };
    if (reduceMotion && quien !== null && gatito) {
      ({ juego, gatito } = atrapadaSinMoverse(juego, gatito, performance.now()));
      mover(quien, gatito);
    }
    enMarchaRef.current = { juego, mundo: quien, gatito };
    anunciar();
    pintar();
    bote();
    if (reduceMotion && quien !== null) atrapa(quien);
  }, [anunciar, pintar]);

  const activo = jugada !== null;
  useEffect(() => {
    if (!activo) return;
    let anterior = performance.now();
    let movido = 0;
    let fotograma = 0;
    const paso = () => {
      const momento = performance.now();
      const ms = Math.min(50, momento - anterior);
      anterior = momento;
      let enMarcha = enMarchaRef.current;
      const { reduceMotion, seSigue, puede, mover, atrapa, bote } = casaRef.current;
      if (!enMarcha || !seSigue()) { enMarchaRef.current = null; setJugada(null); return; }
      if (enMarcha.mundo !== null && !puede(enMarcha.mundo)) {
        enMarcha = { juego: sinGatito(enMarcha.juego), mundo: null, gatito: null };
        enMarchaRef.current = enMarcha;
        anunciar();
      }
      const antes = enMarcha.juego.fase;
      const hecho = pasoJuego(enMarcha.juego, enMarcha.gatito, ms, momento);
      // Con movimiento tranquilo no la empuja: se acaba al soltarla.
      if (hecho.acaba || (reduceMotion && hecho.juego.fase === "empuja")) { enMarchaRef.current = null; setJugada(null); return; }
      enMarchaRef.current = { juego: hecho.juego, mundo: enMarcha.mundo, gatito: hecho.gatito };
      pintar();
      const cambia = hecho.juego.fase !== antes;
      if (enMarcha.mundo !== null && hecho.gatito && (cambia || momento - movido >= PASO_GATITO_MS)) {
        movido = momento;
        mover(enMarcha.mundo, hecho.gatito);
      }
      if (cambia) anunciar();
      if (hecho.boto) bote();
      if (hecho.atrapa && enMarcha.mundo !== null) atrapa(enMarcha.mundo);
      fotograma = requestAnimationFrame(paso);
    };
    fotograma = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(fotograma);
  }, [activo, anunciar, pintar]);

  // La capa aparece con el primer lanzamiento: se pinta en cuanto está.
  useEffect(() => { if (activo) pintar(); }, [activo, pintar]);

  return { jugada, enMarchaRef, lanzar };
}
