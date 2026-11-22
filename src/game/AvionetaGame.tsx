import { useEffect, useRef, useState } from "react";
import { getImage } from "./assets";
import { busDeZona, contextoAudio, soltarBus } from "./audio";
import { firstConnectedGamepad, readGameplayPad } from "./gamepad";
import { createFlight, FLIGHT_SECONDS, PLANE_Y, SKY_HEIGHT, SKY_WIDTH, stepFlight, TOTAL_STARS, type Flight, type FlightEvent } from "./avioneta";
import "./avioneta.css";
import { variablesTactiles } from "./TouchControls";
import { t, textoLienzo } from "../textos/index.ts";
import { Boton } from "../textos/Texto";
import { PantallaPrevia, ResultadoMinijuego } from "./minijuegoComun";

type SoundKind = "apple" | "block" | "cat" | "jump" | "hurt" | "stomp" | "yarn" | "checkpoint" | "goal" | "sticker" | "howl" | "snort" | "cannon" | "countdown";
type Props = {
  paused: boolean;
  muted: boolean;
  musicVolume: number;
  reduceMotion: boolean;
  /** Primera vez: la Reina Arcoíris acaba de regalar la avioneta. */
  gift: boolean;
  bestStars: number;
  /** Estrellas conseguidas al cruzar el arcoíris, o null si se vuelve al mapa antes (rendirse no pierde nada). */
  onExit: (stars: number | null) => void;
  playSound: (kind: SoundKind) => void;
};

const ART = {
  plane: "./assets/sprites/avioneta-v1.webp",
  pop: "./assets/sprites/pompa-v1.webp",
  cloud: "./assets/sprites/nubarron-v1.webp",
  rainbow: "./assets/sprites/arcoiris-final-v1.webp",
  sky: "./assets/worlds/cielo-avioneta-v1.webp",
  star: "./assets/atlases/collectibles-v1.webp",
  aura: "./assets/sprites/secret-star-aura-v1.webp",
  bird: "./assets/sprites/enemy-bird-v2.webp",
  unicorn: "./assets/atlases/secret-sky-v1.webp",
};
const SOUNDS: Partial<Record<FlightEvent, SoundKind>> = { pop: "yarn", clean: "apple", star: "sticker", bump: "hurt", "shield-lost": "block", bubble: "cat", end: "goal" };
const ready = (image: HTMLImageElement) => image.complete && image.naturalWidth > 0;

/** «Vals de la avioneta»: pieza original generada por código (compás de tres, do mayor), muy suave. */
const WALTZ = [
  [72, 76, 79], [77, 76, 74], [72, 74, 76], [79, 0, 0], [77, 81, 79], [77, 76, 74], [76, 74, 72], [72, 0, 0],
];
const BASS = [48, 53, 48, 55, 53, 53, 55, 48];
const midi = (note: number) => 440 * 2 ** ((note - 69) / 12);

function useWaltz(playing: boolean, volume: number) {
  const gainRef = useRef<GainNode | null>(null);
  const volumeRef = useRef(volume);
  const audible = volume > 0;
  // Cambiar el volumen solo mueve la ganancia: el vals sigue donde iba, sin crear otro contexto.
  useEffect(() => {
    volumeRef.current = volume;
    if (gainRef.current) gainRef.current.gain.value = .18 * volume;
  }, [volume]);
  useEffect(() => {
    if (!playing || !audible) return;
    const audio = contextoAudio();
    if (!audio) return;
    if (audio.state === "suspended") void audio.resume().catch(() => {});
    const gain = busDeZona(audio, .18 * volumeRef.current);
    gainRef.current = gain;
    const beat = .42;
    let next = audio.currentTime + .1;
    let step = 0;
    const note = (frequency: number, at: number, length: number, type: OscillatorType, level: number) => {
      const osc = audio.createOscillator();
      const env = audio.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      env.gain.setValueAtTime(level, at);
      env.gain.exponentialRampToValueAtTime(.0001, at + length);
      osc.connect(env).connect(gain);
      osc.start(at);
      osc.stop(at + length + .02);
    };
    const timer = window.setInterval(() => {
      while (next < audio.currentTime + .6) {
        const bar = Math.floor(step / 3) % WALTZ.length;
        const beatInBar = step % 3;
        const melody = WALTZ[bar][beatInBar];
        if (melody) note(midi(melody), next, beat * .9, "triangle", .5);
        if (beatInBar === 0) note(midi(BASS[bar]), next, beat * 1.4, "sine", .45);
        else note(midi(BASS[bar] + 12), next, beat * .4, "sine", .18);
        next += beat;
        step += 1;
      }
    }, 120);
    return () => { window.clearInterval(timer); soltarBus(gain); gainRef.current = null; };
  }, [audible, playing]);
}

function drawFlight(context: CanvasRenderingContext2D, flight: Flight, scroll: number) {
  const sky = context.createLinearGradient(0, 0, 0, SKY_HEIGHT);
  sky.addColorStop(0, "rgb(96,172,252)");
  sky.addColorStop(1, "rgb(140,207,251)");
  context.fillStyle = sky;
  context.fillRect(0, 0, SKY_WIDTH, SKY_HEIGHT);
  const layer = getImage(ART.sky);
  if (ready(layer)) {
    // Capa de nubes repetible: baja con el vuelo.
    const height = layer.naturalHeight * SKY_WIDTH / layer.naturalWidth;
    const offset = scroll % height;
    for (let y = offset - height; y < SKY_HEIGHT; y += height) context.drawImage(layer, 0, y, SKY_WIDTH, height);
  }
  const rainbow = getImage(ART.rainbow);
  if (flight.rainbow && ready(rainbow)) context.drawImage(rainbow, SKY_WIDTH / 2 - 520, flight.rainbow.y, 1040, 1040 * rainbow.naturalHeight / rainbow.naturalWidth);
  const star = getImage(ART.star);
  for (const item of flight.stars) if (ready(star)) context.drawImage(star, 2 * 192, 0, 192, 192, item.x - 17, item.y - 17, 34, 34);
  const pop = getImage(ART.pop);
  for (const bubble of flight.bubbles) {
    if (!ready(pop)) continue;
    const cell = pop.naturalWidth / 3;
    context.drawImage(pop, 0, 0, cell, pop.naturalHeight, bubble.x - 30, bubble.y - 30, 60, 60);
    context.fillStyle = "#fff3a5";
    context.fillRect(bubble.x + 18, bubble.y - 26, 6, 6);
  }
  const cloud = getImage(ART.cloud);
  for (const item of flight.clouds) {
    if (!ready(cloud)) continue;
    const cell = cloud.naturalWidth / 2;
    const width = item.r * 2.7;
    const height = width * cloud.naturalHeight / cell;
    context.save();
    if (item.happy > 1.6) context.globalAlpha = Math.max(0, 1 - (item.happy - 1.6) / .9);
    context.drawImage(cloud, item.happy > 0 ? cell : 0, 0, cell, cloud.naturalHeight, item.x - width / 2, item.y - height / 2, width, height);
    context.restore();
  }
  for (const item of flight.pops) {
    if (ready(pop)) context.drawImage(pop, 0, 0, pop.naturalWidth / 3, pop.naturalHeight, item.x - 18, item.y - 18, 36, 36);
  }
  const bird = getImage(ART.bird);
  const unicorn = getImage(ART.unicorn);
  for (const friend of flight.friends) {
    const image = friend.who === "unicorn" ? unicorn : bird;
    if (!ready(image)) continue;
    context.save();
    context.translate(friend.x, friend.y + Math.sin(friend.phase * 6) * 5);
    if (friend.vx < 0) context.scale(-1, 1);
    if (friend.who === "unicorn") context.drawImage(image, 0, 0, image.naturalWidth / 2, image.naturalHeight / 2, -50, -40, 100, 80);
    else context.drawImage(image, -38, -28, 76, 56);
    context.restore();
  }
  const plane = flight.plane;
  const aura = getImage(ART.aura);
  if (plane.bubble && ready(aura)) context.drawImage(aura, (Math.floor(flight.t * 4) % 3) * 128, 0, 128, 128, plane.x - 110, PLANE_Y - 110, 220, 220);
  const sprite = getImage(ART.plane);
  if (ready(sprite)) {
    context.save();
    if (plane.invuln > 0 && !plane.flip && Math.floor(plane.invuln * 10) % 2 === 0) context.globalAlpha = .55;
    context.translate(plane.x, PLANE_Y);
    // Inclinación por código según el movimiento, y voltereta encogiendo y volteando el dibujo.
    context.rotate((plane.vx / 430) * (12 * Math.PI / 180));
    if (plane.flip > 0) context.scale(Math.cos(((.7 - plane.flip) / .7) * Math.PI * 2), 1);
    const height = 150;
    const width = height * sprite.naturalWidth / sprite.naturalHeight;
    context.drawImage(sprite, -width / 2, -height / 2, width, height);
    context.restore();
  }
  context.fillStyle = "rgba(42,24,55,.82)";
  context.beginPath(); context.roundRect(12, 12, 170, 40, 10); context.fill();
  context.fillStyle = "#ffd76a"; context.font = '16px "Press Start 2P", monospace';
  context.fillText(`★ ${flight.got}/${TOTAL_STARS}`, 26, 40);
  const progress = Math.min(1, flight.t / FLIGHT_SECONDS);
  context.fillStyle = "rgba(255,246,227,.55)"; context.fillRect(220, 26, 520, 10);
  context.fillStyle = "#d9403a"; context.fillRect(220 + 520 * progress - 12, 22, 24, 18);
  // Cartel de los primeros segundos: dos palabras con dibujo (la frase completa está en la pantalla previa).
  if (flight.t < 3) {
    context.save();
    context.font = '24px "Press Start 2P", monospace'; context.textAlign = "center"; context.textBaseline = "middle";
    const text = textoLienzo("minijuegos.avioneta.cartel.rotulo");
    context.fillStyle = "#3d1430"; context.beginPath(); context.roundRect(SKY_WIDTH / 2 - 160, 246, 320, 56, 10); context.fill();
    context.fillStyle = "#fff8e9"; context.beginPath(); context.roundRect(SKY_WIDTH / 2 - 156, 250, 312, 48, 8); context.fill();
    context.fillStyle = "#3d1430"; context.fillText(text, SKY_WIDTH / 2, 276);
    context.restore();
  }
}

/** La avioneta de las nubes: minijuego vertical tras el reino secreto. */
export function AvionetaGame({ paused, muted, musicVolume, reduceMotion, gift, bestStars, onExit, playSound }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const input = useRef({ left: false, right: false, fire: false, firePressed: false });
  const pausedRef = useRef(paused);
  const soundRef = useRef(playSound);
  const [result, setResult] = useState<number | null>(null);
  const [empezado, setEmpezado] = useState(false);
  useEffect(() => { pausedRef.current = paused || !empezado; soundRef.current = playSound; }, [paused, empezado, playSound]);
  useWaltz(empezado && !paused && !muted && result === null, musicVolume);

  useEffect(() => {
    const keys: Record<string, "left" | "right" | "fire"> = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", Space: "fire", ArrowUp: "fire", KeyW: "fire" };
    const down = (event: KeyboardEvent) => {
      const key = keys[event.code];
      if (!key || event.repeat) return;
      event.preventDefault();
      if (key === "fire" && !input.current.fire) input.current.firePressed = true;
      input.current[key] = true;
    };
    const up = (event: KeyboardEvent) => { const key = keys[event.code]; if (key) input.current[key] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context) return;
    const flight = createFlight();
    let scroll = 0;
    let last = performance.now();
    let padFire = false;
    let frame = 0;
    const loop = (now: number) => {
      const dt = Math.min(.05, (now - last) / 1000);
      last = now;
      if (!pausedRef.current && !flight.ended) {
        const pad = readGameplayPad(firstConnectedGamepad());
        if (pad.jump && !padFire) input.current.firePressed = true;
        padFire = pad.jump;
        const events = stepFlight(flight, { left: input.current.left || pad.left, right: input.current.right || pad.right, firePressed: input.current.firePressed }, dt);
        input.current.firePressed = false;
        scroll += 120 * dt;
        for (const event of events) { const sound = SOUNDS[event]; if (sound) soundRef.current(sound); }
        if (flight.ended) setResult(flight.got);
      }
      drawFlight(context, flight, scroll);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const hold = (key: "left" | "right" | "fire", pressed: boolean) => {
    if (key === "fire" && pressed && !input.current.fire) input.current.firePressed = true;
    input.current[key] = pressed;
  };
  const pad = (key: "left" | "right" | "fire", label: string, className: string) => (
    <button type="button" className={`avioneta-touch ${className}`} aria-label={label}
      onPointerDown={(event) => { event.preventDefault(); hold(key, true); }} onPointerUp={() => hold(key, false)}
      onPointerCancel={() => hold(key, false)} onPointerLeave={() => hold(key, false)}>
      {key === "fire" ? <span className="avioneta-pop-icon" aria-hidden="true" style={{ backgroundImage: "url('./assets/sprites/pompa-v1.webp')" }} /> : key === "left" ? "◀" : "▶"}
    </button>
  );

  const avioneta = <img className="avioneta-retrato" src={ART.plane} alt={t("minijuegos.avioneta.resultado.avioneta.oculto")} />;
  return (
    <section className={`avioneta ${reduceMotion ? "is-calm" : ""}`} aria-label={t("minijuegos.avioneta.escena.oculto")}>
      <canvas ref={canvasRef} width={SKY_WIDTH} height={SKY_HEIGHT} aria-label={t("minijuegos.avioneta.cielo.oculto")} />
      <Boton className="avioneta-leave boton-pequeno" clave="minijuegos.avioneta.mapa.rotulo" data-gamepad-back onClick={() => onExit(null)} />
      <div className="avioneta-controls" style={variablesTactiles}>
        {pad("left", t("partida.controles.izquierda.oculto"), "is-left")}
        {pad("fire", t("minijuegos.avioneta.pompa.oculto"), "is-fire")}
        {pad("right", t("partida.controles.derecha.oculto"), "is-right")}
      </div>
      {!empezado && !paused && <PantallaPrevia id="avioneta-previa" nombre="minijuegos.avioneta.previa.nombre.rotulo" guardian={avioneta}
        regla={`${gift ? `${t("minijuegos.avioneta.previa.regalo.juntos")} ` : ""}${t("minijuegos.avioneta.previa.regla.juntos")}`}
        ayudaAdultos={[t("adultos.minijuegos.avioneta.controles")]} practicaPrimero={false} onJugar={() => setEmpezado(true)} onSalir={() => onExit(null)} />}
      {result !== null && !paused && <ResultadoMinijuego id="avioneta-resultado" titulo={result === TOTAL_STARS ? "minijuegos.avioneta.resultado.todas.rotulo" : "minijuegos.avioneta.resultado.arcoiris.rotulo"}
        gano onSalir={() => onExit(result)} dibujo={avioneta}
        frase={`${result === TOTAL_STARS ? t("minijuegos.avioneta.resultado.todas.juntos") : t("minijuegos.avioneta.resultado.arcoiris.juntos", { n: result, total: TOTAL_STARS })}${result > bestStars ? ` ${t("minijuegos.avioneta.resultado.marca.juntos")}` : ""}`}
        botones={<Boton tipo="seguir" clave="minijuegos.avioneta.resultado.mapa.rotulo" data-gamepad-default onClick={() => onExit(result)} />} />}
    </section>
  );
}
