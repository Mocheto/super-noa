import { useEffect, useRef, useState } from "react";
import { getImage } from "./assets";
import { firstConnectedGamepad, readGameplayPad } from "./gamepad";
import { createFlight, FLIGHT_SECONDS, PLANE_Y, SKY_HEIGHT, SKY_WIDTH, stepFlight, TOTAL_STARS, type Flight, type FlightEvent } from "./avioneta";
import "./avioneta.css";
import { t } from "../textos/index.ts";

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
  star: "./assets/atlases/collectibles-v1.png",
  aura: "./assets/sprites/secret-star-aura-v1.png",
  bird: "./assets/sprites/enemy-bird-v2.png",
  unicorn: "./assets/atlases/secret-sky-v1.png",
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
  useEffect(() => {
    if (!playing || volume <= 0 || typeof AudioContext === "undefined") return;
    const audio = new AudioContext();
    const gain = audio.createGain();
    gain.gain.value = .18 * volume;
    gain.connect(audio.destination);
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
    return () => { window.clearInterval(timer); void audio.close(); };
  }, [playing, volume]);
}

function drawFlight(context: CanvasRenderingContext2D, flight: Flight, scroll: number, gift: boolean) {
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
  context.fillStyle = "#ffd76a"; context.font = "bold 18px monospace";
  context.fillText(`★ ${flight.got} / ${TOTAL_STARS}`, 26, 39);
  const progress = Math.min(1, flight.t / FLIGHT_SECONDS);
  context.fillStyle = "rgba(255,246,227,.55)"; context.fillRect(220, 26, 520, 10);
  context.fillStyle = "#d9403a"; context.fillRect(220 + 520 * progress - 12, 22, 24, 18);
  if (flight.t < 4.5) {
    context.save();
    context.font = "bold 18px monospace"; context.textAlign = "center";
    const text = gift && flight.t < 2.2 ? t("minijuegos.avioneta.la-reina-arcoiris-te.juntos") : t("minijuegos.avioneta.lanza-pompas-a-los.juntos");
    context.fillStyle = "rgba(42,24,55,.88)"; context.fillRect(180, 250, 600, 46);
    context.fillStyle = "#fff6e3"; context.fillText(text, SKY_WIDTH / 2, 280);
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
  useEffect(() => { pausedRef.current = paused; soundRef.current = playSound; }, [paused, playSound]);
  useWaltz(!paused && !muted && result === null, musicVolume);

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
      drawFlight(context, flight, scroll, gift);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [gift]);

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

  return (
    <section className={`avioneta ${reduceMotion ? "is-calm" : ""}`} aria-label={t("minijuegos.avioneta.la-avioneta-de-las.oculto")}>
      <canvas ref={canvasRef} width={SKY_WIDTH} height={SKY_HEIGHT} aria-label={t("minijuegos.avioneta.cielo-de-la-avioneta.oculto")} />
      <button className="avioneta-leave" type="button" data-gamepad-back onClick={() => onExit(null)}>{t("minijuegos.avioneta.volver-al-mapa.rotulo")}</button>
      <div className="avioneta-controls">
        {pad("left", t("minijuegos.avioneta.mover-a-la-izquierda.rotulo"), "is-left")}
        {pad("fire", t("minijuegos.avioneta.lanzar-pompa.rotulo"), "is-fire")}
        {pad("right", t("minijuegos.avioneta.mover-a-la-derecha.rotulo"), "is-right")}
      </div>
      {result !== null && (
        <div className="avioneta-end" role="dialog" aria-labelledby="avioneta-end-title">
          <h2 id="avioneta-end-title">{result === TOTAL_STARS ? t("minijuegos.avioneta.todas-las-estrellas.rotulo") : t("minijuegos.avioneta.has-cruzado-el-arcoiris.rotulo")}</h2>
          <p>{t("minijuegos.avioneta.recogidas.juntos", { n: result, total: TOTAL_STARS })}{result > bestStars ? <> <b>{t("minijuegos.avioneta.nueva-marca.rotulo")}</b></> : ""}</p>
          <button className="pixel-button primary" type="button" data-gamepad-default onClick={() => onExit(result)}>{t("minijuegos.avioneta.volver-al-mapa.rotulo")}</button>
        </div>
      )}
    </section>
  );
}
