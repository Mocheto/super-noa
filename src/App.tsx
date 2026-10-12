import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BossBattle } from "./game/BossBattle";
import { bossCatalog } from "./game/bosses";
import { GameAssetIcon } from "./game/GameAssetIcon";
import { PixelIcon } from "./game/PixelIcon";
import { GameCanvas, type SoundKind } from "./game/GameCanvas";
import { levels, themeNames } from "./game/levels";
import { getStickerSprite, stickerCatalog } from "./game/stickers";
import type { GameSnapshot } from "./game/types";

const STORAGE_KEY = "super-noa-progress-v1";

type LevelStats = Record<string, { completed: boolean; bestApples: number; flawless?: boolean }>;
type Progress = { unlocked: number; levelStats: LevelStats; stickers: string[]; secretUnlocked: boolean; waterUnlocked: boolean; bossChallenges: Record<string, boolean> };
type Screen = "home" | "map" | "game" | "boss" | "complete" | "gameover" | "finished" | "secret-transition";
type CollectionTab = "stickers" | "bosses" | "memories";
type TouchControlsMode = "auto" | "always";

const emptyProgress: Progress = { unlocked: 0, levelStats: {}, stickers: [], secretUnlocked: false, waterUnlocked: false, bossChallenges: {} };
const emptySnapshot: GameSnapshot = { apples: 0, stickers: [], power: "normal", checkpoint: 0, paused: false };
const MAX_LIVES = 3;
const secretLevelIndex = levels.findIndex((level) => level.world === 7);
// Los índices del guardado siguen refiriéndose a la campaña original de 18 pantallas.
const campaignLevels = levels.filter((level) => level.world !== 7 && level.world !== 8);
const campaignLevelCount = campaignLevels.length;
const waterLevelIndex = levels.findIndex((level) => level.id === "A-1");
const forestLevelIndex = campaignLevels.findIndex((level) => level.id === "3-1");
const bossLevels = levels.flatMap((level, index) => level.boss ? [{ level, index, boss: bossCatalog[level.boss] }] : []);
const worldCatalog = [
  { id: 1, name: "El Prado de las Manzanas", description: "Sol, ramas anchas y manzanas crujientes.", cat: "Miel", catAsset: "./assets/sprites/world-cat-1-v1.png" },
  { id: 2, name: "El Bosque de los Gatitos", description: "Luciérnagas, cristales, murciélagos y una cueva de lava.", cat: "Bruma", catAsset: "./assets/sprites/world-cat-2-v1.png" },
  { id: 8, name: "La Laguna de los Corales", description: "Un desvío bajo la cueva: peces traviesos, erizos y el palacio de Don Aleta.", cat: "Perla", catAsset: "./assets/sprites/world-cat-8-v1.png" },
  { id: 3, name: "El Bosque de los Lobos", description: "Pinos, luna llena y lobos enfadados.", cat: "Pino", catAsset: "./assets/sprites/world-cat-3-v1.png" },
  { id: 4, name: "El Bosque de los Jabalíes", description: "Bellotas, copas altas y jabalíes salvajes.", cat: "Bellota", catAsset: "./assets/sprites/world-cat-4-v1.png" },
  { id: 5, name: "La Flota de las Nubes", description: "Barcos voladores, piratas, loros y cañones.", cat: "Nube", catAsset: "./assets/sprites/world-cat-5-v1.png" },
  { id: 6, name: "El Castillo Encantado", description: "Un laberinto de piedra, trampas con pinchos y fantasmas traviesos.", cat: "Luna", catAsset: "./assets/sprites/world-cat-6-v1.png" },
  { id: 7, name: "El Reino Secreto", description: "Nubes mágicas, pájaros y unicornios en lo más alto del cielo.", cat: "Iris", catAsset: "./assets/sprites/world-cat-7-v1.png" },
] as const;

function readProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress;
    const saved = JSON.parse(raw) as Partial<Progress>;
    const levelStats = saved.levelStats && typeof saved.levelStats === "object" ? saved.levelStats : {};
    const savedUnlocked = Math.max(0, Number(saved.unlocked) || 0);
    const hasNewLevelStats = ["1-3", "2-3", "3-3"].some((id) => Object.hasOwn(levelStats, id));
    const legacyIndexMap = [0, 1, 3, 4, 6, 7];
    let unlocked = hasNewLevelStats
      ? Math.min(campaignLevelCount - 1, savedUnlocked)
      : legacyIndexMap[Math.min(legacyIndexMap.length - 1, savedUnlocked)];
    campaignLevels.forEach((level, index) => {
      if (levelStats[level.id]?.completed) unlocked = Math.max(unlocked, Math.min(campaignLevelCount - 1, index + 1));
    });
    if (levelStats["A-3"]?.completed) unlocked = Math.max(unlocked, forestLevelIndex);
    return {
      unlocked,
      levelStats,
      stickers: Array.isArray(saved.stickers) ? saved.stickers.filter((id): id is string => typeof id === "string") : [],
      secretUnlocked: saved.secretUnlocked === true || Boolean(levelStats["S-1"]),
      waterUnlocked: saved.waterUnlocked === true || ["A-1", "A-2", "A-3"].some((id) => Boolean(levelStats[id])),
      bossChallenges: saved.bossChallenges && typeof saved.bossChallenges === "object"
        ? Object.fromEntries(Object.entries(saved.bossChallenges).filter(([, completed]) => completed === true))
        : {},
    };
  } catch {
    return emptyProgress;
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function createAudioContext() {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  return AudioContextClass ? new AudioContextClass() : null;
}

function readSavedPercentage(key: string, fallback: number) {
  const saved = localStorage.getItem(key);
  const value = saved === null ? fallback : Number(saved);
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : fallback;
}

export default function App() {
  const [progress, setProgress] = useState<Progress>(readProgress);
  const [screen, setScreen] = useState<Screen>("home");
  const [activeIndex, setActiveIndex] = useState(0);
  const [levelRun, setLevelRun] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(() => localStorage.getItem("super-noa-muted") === "true");
  const [showHelp, setShowHelp] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showAlbum, setShowAlbum] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [collectionTab, setCollectionTab] = useState<CollectionTab>("stickers");
  const [musicVolume, setMusicVolume] = useState(() => readSavedPercentage("super-noa-music-volume", 60));
  const [effectsVolume, setEffectsVolume] = useState(() => readSavedPercentage("super-noa-effects-volume", 70));
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem("super-noa-reduce-motion") === "true");
  const [touchControls, setTouchControls] = useState<TouchControlsMode>(() => localStorage.getItem("super-noa-touch-controls") === "always" ? "always" : "auto");
  const [bossReplay, setBossReplay] = useState(false);
  const [bossReplayReturn, setBossReplayReturn] = useState<"home" | "map">("map");
  const [snapshot, setSnapshot] = useState<GameSnapshot>(emptySnapshot);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playScreenRef = useRef<HTMLElement | null>(null);
  const activeLevel = levels[activeIndex];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem("super-noa-muted", String(muted));
  }, [muted]);

  useEffect(() => {
    localStorage.setItem("super-noa-music-volume", String(musicVolume));
    localStorage.setItem("super-noa-effects-volume", String(effectsVolume));
    localStorage.setItem("super-noa-reduce-motion", String(reduceMotion));
    localStorage.setItem("super-noa-touch-controls", touchControls);
  }, [effectsVolume, musicVolume, reduceMotion, touchControls]);

  useEffect(() => {
    const tracks = {
      1: "./assets/music/manzanos.mp3",
      2: "./assets/music/gatitos.mp3",
      3: "./assets/music/lobos.mp3",
      4: "./assets/music/lobos.mp3",
      5: "./assets/music/manzanos.mp3",
      6: "./assets/music/castillo.wav",
      7: "./assets/music/gatitos.mp3",
      8: "./assets/music/laguna.wav",
    } as const;
    const audio = new Audio(tracks[activeLevel.world]);
    audio.loop = true;
    audio.volume = Math.min(1, Math.max(0, musicVolume / 100)) * 0.38;
    musicRef.current?.pause();
    musicRef.current = audio;
    if ((screen === "game" || screen === "boss") && !paused && !muted) void audio.play().catch(() => undefined);
    return () => audio.pause();
  }, [activeLevel.world, musicVolume, muted, paused, screen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Escape" && screen === "game") setPaused((value) => !value);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen]);

  const playSound = useCallback((kind: SoundKind) => {
    if (muted || effectsVolume === 0) return;
    const audioContext = audioContextRef.current ?? createAudioContext();
    if (!audioContext) return;
    audioContextRef.current = audioContext;
    if (audioContext.state === "suspended") void audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    const notes: Record<SoundKind, [number, number, OscillatorType]> = {
      apple: [660, 0.11, "square"], block: [410, 0.12, "square"], cat: [523, 0.28, "triangle"], jump: [360, 0.12, "square"],
      hurt: [145, 0.22, "sawtooth"], stomp: [210, 0.09, "square"], yarn: [760, 0.08, "triangle"],
      checkpoint: [880, 0.18, "triangle"], goal: [1046, 0.42, "square"], sticker: [1174, 0.32, "triangle"],
      howl: [196, 0.48, "sawtooth"], snort: [110, 0.22, "square"], countdown: [330, 0.08, "square"],
      cannon: [92, 0.3, "sawtooth"],
    };
    const [frequency, duration, type] = notes[kind];
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(kind === "hurt" || kind === "howl" || kind === "snort" ? 70 : frequency * 1.35, now + duration);
    gain.gain.setValueAtTime(0.075 * Math.min(1, Math.max(0, effectsVolume / 100)), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }, [effectsVolume, muted]);

  const totalApples = useMemo(
    () => Object.values(progress.levelStats).reduce((total, stat) => total + (Number(stat.bestApples) || 0), 0),
    [progress.levelStats],
  );
  const albumStickers = stickerCatalog.filter((sticker) => (sticker.world !== 7 || progress.secretUnlocked) && (sticker.world !== 8 || progress.waterUnlocked));
  const knownBosses = bossLevels.filter(({ level }) => progress.levelStats[level.id]?.completed).length;
  const completedLevels = campaignLevels.filter((level) => progress.levelStats[level.id]?.completed).length;
  const worldProgress = useMemo(() => Object.fromEntries(worldCatalog.map((world) => {
    const worldLevels = levels.filter((level) => level.world === world.id);
    const complete = worldLevels.filter((level) => progress.levelStats[level.id]?.completed).length;
    const stickers = stickerCatalog.filter((sticker) => sticker.world === world.id && progress.stickers.includes(sticker.id)).length;
    const flawless = worldLevels.filter((level) => progress.levelStats[level.id]?.flawless).length;
    const bossLevel = worldLevels.find((level) => level.boss);
    const bossFriend = bossLevel ? Boolean(progress.levelStats[bossLevel.id]?.completed) : false;
    const remembered = complete === worldLevels.length && worldLevels.length > 0;
    return [world.id, { complete, total: worldLevels.length, stickers, stickerTotal: stickerCatalog.filter((sticker) => sticker.world === world.id).length, flawless, bossFriend, remembered }];
  })), [progress.levelStats, progress.stickers]);

  const openCollection = (tab: CollectionTab) => {
    setCollectionTab(tab);
    setShowAlbum(true);
  };

  const isLevelUnlocked = (index: number) => {
    const level = levels[index];
    if (level.world === 7) return progress.secretUnlocked;
    if (level.world === 8) return progress.waterUnlocked && (level.screen === 1 || Boolean(progress.levelStats[`A-${level.screen - 1}`]?.completed));
    return campaignLevels.findIndex((entry) => entry.id === level.id) <= progress.unlocked;
  };

  const replayBoss = (index: number) => {
    const level = levels[index];
    if (!level.boss || !progress.levelStats[level.id]?.completed) return;
    setBossReplayReturn(screen === "home" ? "home" : "map");
    setActiveIndex(index);
    setLevelRun((current) => current + 1);
    setLives(MAX_LIVES);
    setSnapshot(emptySnapshot);
    setPaused(false);
    setShowAlbum(false);
    setBossReplay(true);
    setScreen("boss");
  };

  const finishBossReplay = (challengeCompleted = false) => {
    if (challengeCompleted && activeLevel.boss) setProgress((current) => ({ ...current, bossChallenges: { ...current.bossChallenges, [activeLevel.boss!]: true } }));
    setBossReplay(false);
    openCollection("bosses");
    setScreen(bossReplayReturn);
  };

  const beginLevel = (index: number) => {
    if (!isLevelUnlocked(index)) return;
    setActiveIndex(index);
    setLevelRun((current) => current + 1);
    setLives(MAX_LIVES);
    setSnapshot(emptySnapshot);
    setPaused(false);
    setBossReplay(false);
    setScreen("game");
  };

  const handleLoseLife = useCallback(() => {
    setLives((current) => {
      if (current <= 1) {
        window.setTimeout(() => setScreen("gameover"), 0);
        return 0;
      }
      return current - 1;
    });
  }, []);

  const handleSnapshot = useCallback((next: GameSnapshot) => {
    setSnapshot(next);
    if (next.stickers.length === 0) return;
    setProgress((current) => {
      const newStickers = next.stickers.filter((id) => !current.stickers.includes(id));
      return newStickers.length > 0 ? { ...current, stickers: [...current.stickers, ...newStickers] } : current;
    });
  }, []);

  const handleComplete = useCallback((challengeCompleted = false) => {
    setProgress((current) => {
      const previous = current.levelStats[activeLevel.id];
      return {
        ...current,
        unlocked: activeLevel.id === "A-3" ? Math.max(current.unlocked, forestLevelIndex)
          : activeLevel.world === 7 || activeLevel.world === 8 ? current.unlocked
            : Math.max(current.unlocked, Math.min(campaignLevelCount - 1, campaignLevels.findIndex((level) => level.id === activeLevel.id) + 1)),
        levelStats: {
          ...current.levelStats,
          [activeLevel.id]: { completed: true, bestApples: Math.max(previous?.bestApples ?? 0, snapshot.apples), flawless: previous?.flawless || lives === MAX_LIVES },
        },
        bossChallenges: activeLevel.boss && challengeCompleted ? { ...current.bossChallenges, [activeLevel.boss]: true } : current.bossChallenges,
      };
    });
    setScreen(activeLevel.id === "6-3" ? "finished" : "complete");
  }, [activeLevel.boss, activeLevel.id, activeLevel.world, lives, snapshot.apples]);

  const handleWaterExit = useCallback(() => {
    setProgress((current) => ({ ...current, waterUnlocked: true }));
    setActiveIndex(waterLevelIndex);
    setLevelRun((current) => current + 1);
    setLives(MAX_LIVES);
    setSnapshot(emptySnapshot);
    setPaused(false);
    setScreen("game");
  }, []);

  const handleBossEncounter = useCallback(() => {
    setPaused(false);
    setBossReplay(false);
    setScreen("boss");
  }, []);

  const handleSecretExit = useCallback(() => {
    setProgress((current) => ({ ...current, secretUnlocked: true }));
    setPaused(false);
    setScreen("secret-transition");
    window.setTimeout(() => {
      setActiveIndex(secretLevelIndex);
      setLevelRun((current) => current + 1);
      setLives(MAX_LIVES);
      setSnapshot(emptySnapshot);
      setScreen("game");
    }, 1800);
  }, []);

  const spendBossApple = useCallback(() => {
    setSnapshot((current) => {
      const apples = Math.max(0, current.apples - 1);
      return { ...current, apples, power: apples === 0 && current.power === "apple" ? "normal" : current.power };
    });
  }, []);

  const restartBossLevel = useCallback(() => {
    setLevelRun((current) => current + 1);
    setSnapshot(emptySnapshot);
    setPaused(false);
    setScreen("game");
  }, []);

  const abandonBossBattle = useCallback(() => {
    setPaused(false);
    setScreen("map");
  }, []);

  const nextLevel = () => {
    const nextIndex = activeLevel.id === "2-3" || activeLevel.id === "A-3"
      ? levels.findIndex((level) => level.id === "3-1") : Math.min(levels.length - 1, activeIndex + 1);
    setActiveIndex(nextIndex);
    setLevelRun((current) => current + 1);
    setLives(MAX_LIVES);
    setSnapshot(emptySnapshot);
    setPaused(false);
    setScreen("game");
  };

  const resetProgress = () => {
    if (!window.confirm("¿Empezar de nuevo? Se borrarán las pantallas, las manzanas, las pegatinas y los jefes amigos guardados.")) return;
    setProgress(emptyProgress);
    setActiveIndex(0);
    setLives(MAX_LIVES);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void (playScreenRef.current ?? document.documentElement).requestFullscreen?.().catch(() => undefined);
  };

  return (
    <main className={`app-shell ${reduceMotion ? "reduce-motion" : ""} ${touchControls === "always" ? "touch-controls-always" : ""}`}>
      {screen === "home" && (
        <section className="home-screen" aria-labelledby="game-title">
          <div className="home-copy">
            <p className="eyebrow home-eyebrow"><PixelIcon kind="sparkle" /> Una aventura pixel art</p>
            <h1 id="game-title"><span>SUPER</span> NOA</h1>
            <p className="home-lead">Corre, salta y explora mundos de manzanos, barcos voladores y castillos encantados. ¡Los gatitos te esperan!</p>
            <p className="home-invite"><PixelIcon kind="heart" /> Una gran aventura para pequeñas heroínas</p>
            <div className="home-actions">
              <button className="pixel-button primary home-play" type="button" onClick={() => setScreen("map")}>▶ ¡Jugar ahora!</button>
              <button className="pixel-button" type="button" onClick={() => setShowHelp(true)}>¿Cómo se juega?</button>
            </div>
            {progress.unlocked > 0 && <p className="save-note">Partida guardada · {completedLevels}/{campaignLevelCount}{progress.secretUnlocked ? " + secreto" : ""}</p>}
          </div>
          <div className="hero-scene" aria-hidden="true">
            <img className="hero-backdrop" src="./assets/home-adventure-v3.png" alt="" />
          </div>
          <nav className="home-footer" aria-label="Opciones">
            <button type="button" onClick={() => setMuted((value) => !value)}><PixelIcon kind={muted ? "mute" : "sound"} /> {muted ? "Activar sonido" : "Sonido"}</button>
            <button type="button" onClick={() => openCollection("stickers")}>Álbum {progress.stickers.filter((id) => albumStickers.some((sticker) => sticker.id === id)).length}/{albumStickers.length}</button>
            <button type="button" onClick={() => openCollection("bosses")}>Jefes amigos {knownBosses}/{bossLevels.length}</button>
            <button type="button" onClick={() => setShowSettings(true)}>⚙ Ajustes</button>
            <button type="button" onClick={() => setShowCredits(true)}>Créditos</button>
          </nav>
        </section>
      )}

      {screen === "map" && (
        <section className="map-screen">
          <header className="map-header">
            <div><p className="eyebrow">Elige una pantalla</p><h2>El mapa de Noa</h2></div>
            <div className="map-actions">
              <span className="apple-total"><GameAssetIcon kind="apple" /> {totalApples}</span>
              <button className="album-button" type="button" onClick={() => openCollection("stickers")} aria-label="Abrir álbum de pegatinas"><PixelIcon kind="sparkle" /> {progress.stickers.filter((id) => albumStickers.some((sticker) => sticker.id === id)).length}/{albumStickers.length}</button>
              <button className="album-button" type="button" onClick={() => openCollection("bosses")} aria-label="Abrir jefes amigos">★ {knownBosses}/{bossLevels.length}</button>
              <button className="icon-button" type="button" onClick={() => setShowSettings(true)} aria-label="Abrir ajustes">⚙</button>
              <button className="icon-button" type="button" onClick={() => setScreen("home")} aria-label="Volver al inicio">⌂</button>
            </div>
          </header>
          <div className="world-list">
            {worldCatalog.filter((world) => world.id !== 7 || progress.secretUnlocked).map((world) => (
              <article className={`world-card world-${world.id}`} key={world.id}>
                <img className="world-art" src={`./assets/worlds/world-${world.id}.png`} alt="" aria-hidden="true" />
                <div className="world-heading">
                  <span className="world-number">{world.id === 7 ? "Mundo secreto" : world.id === 8 ? "Mundo del agua" : `Mundo ${world.id}`}</span>
                  <h3>{world.name}</h3>
                  <p>{world.description}</p>
                </div>
                <div className="world-summary" aria-label={`Progreso de ${world.name}`}>
                  <div className="world-summary-top"><strong>{worldProgress[world.id].complete}/{worldProgress[world.id].total} pantallas</strong><span>{worldProgress[world.id].remembered ? "✉ Postal lista" : "✉ Busca su recuerdo"}</span></div>
                  <div className="world-progress-bar" aria-hidden="true"><span style={{ width: `${worldProgress[world.id].complete / worldProgress[world.id].total * 100}%` }} /></div>
                  <small><PixelIcon kind="sparkle" /> {worldProgress[world.id].stickers}/{worldProgress[world.id].stickerTotal} · ★ {worldProgress[world.id].flawless}/{worldProgress[world.id].total} sin perder vidas{worldProgress[world.id].bossFriend ? " · Amigo" : ""}</small>
                </div>
                <div className="level-row">
                  {levels.map((level, index) => {
                    if (level.world !== world.id) return null;
                    const unlocked = isLevelUnlocked(index);
                    const stats = progress.levelStats[level.id];
                    return (
                      <button className={`level-card ${stats?.completed ? "is-complete" : ""}`} type="button" disabled={!unlocked} onClick={() => beginLevel(index)} key={level.id}>
                        <span className="level-id">{unlocked ? level.id : <PixelIcon kind="lock" />}</span>
                        <strong>{level.title}</strong>
                        <small>{stats?.completed ? <><span>✓ Completada · <GameAssetIcon kind="apple" /> {stats.bestApples}</span><span className="level-medals" aria-label={`${1 + Number(progress.stickers.includes(level.items.find((item) => item.kind === "sticker")?.id ?? "")) + Number(Boolean(stats.flawless))} de 3 medallas`}>{[true, progress.stickers.includes(level.items.find((item) => item.kind === "sticker")?.id ?? ""), Boolean(stats.flawless)].map((earned, medal) => <i className={earned ? "is-earned" : ""} key={medal}>★</i>)}</span></> : unlocked ? "Lista para jugar" : level.world === 8 && !progress.waterUnlocked ? "Busca la poza azul en 2-3" : "Completa la anterior"}</small>
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
          <button className="text-button reset-button" type="button" onClick={resetProgress}>Borrar progreso</button>
        </section>
      )}

      {screen === "secret-transition" && (
        <section className="secret-transition" aria-live="polite">
          <img className="secret-vine-rise" src="./assets/sprites/secret-vine-transition-v1.png" alt="" aria-hidden="true" />
          <p className="eyebrow">¡Pasadizo secreto!</p>
          <h2>Subiendo al Reino de las Nubes…</h2>
          <p>La enredadera mágica lleva a Noa por encima del bosque.</p>
          <div className="transition-clouds" aria-hidden="true">☁ ☁ ☁</div>
        </section>
      )}

      {(screen === "game" || screen === "boss" || screen === "complete" || screen === "gameover" || screen === "finished") && (
        <section className="play-screen" ref={playScreenRef}>
          {!bossReplay && <header className="game-hud">
            <div className="hud-level"><span>{activeLevel.id}</span><strong>{activeLevel.title}</strong></div>
            <div className="hud-stats">
              <span aria-label={`${lives} vidas`}><GameAssetIcon kind="heart" /> × {lives}</span>
              <span aria-label={`${snapshot.apples} manzanas`}><GameAssetIcon kind="apple" /> × {snapshot.apples}</span>
              <span aria-label={`${snapshot.stickers.length} pegatinas encontradas`}><PixelIcon kind="sparkle" /> × {snapshot.stickers.length}</span>
              <span className={`power-chip power-${snapshot.power}`}>{snapshot.power === "cat" ? <><PixelIcon kind="yarn" /> Gato</> : snapshot.power === "apple" ? <><GameAssetIcon kind="apple" /> Protegida</> : "Noa"}</span>
            </div>
            <div className="hud-actions">
              <button type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? "Activar sonido" : "Silenciar"}><PixelIcon kind={muted ? "mute" : "sound"} /></button>
              <button type="button" onClick={toggleFullscreen} aria-label="Pantalla completa">⛶</button>
              {screen === "game" && <button type="button" onClick={() => setPaused((value) => !value)} aria-label="Pausa">Ⅱ</button>}
            </div>
          </header>}
          {!bossReplay && <GameCanvas key={`game-${activeLevel.id}-${levelRun}`} level={activeLevel} running={screen === "game" && !paused} onLoseLife={handleLoseLife} onComplete={handleComplete} onBossEncounter={handleBossEncounter} onSecretExit={handleSecretExit} onWaterExit={handleWaterExit} onSnapshot={handleSnapshot} playSound={playSound} />}
          {!bossReplay && <div className="level-caption"><span>{themeNames[activeLevel.theme]}</span><span>Bandera {snapshot.checkpoint}/{activeLevel.checkpoints.length}</span></div>}

          {screen === "boss" && activeLevel.boss && (
            <BossBattle
              key={`boss-${activeLevel.id}-${levelRun}`}
              bossId={activeLevel.boss}
              apples={bossReplay ? 0 : snapshot.apples}
              protectedByApple={!bossReplay && snapshot.power === "apple"}
              onSpendApple={spendBossApple}
              onRestartLevel={restartBossLevel}
              onAbandon={bossReplay ? finishBossReplay : abandonBossBattle}
              onWin={bossReplay ? finishBossReplay : handleComplete}
              playSound={playSound}
              friendlyReplay={bossReplay}
            />
          )}

          {paused && screen === "game" && (
            <div className="modal-backdrop"><div className="game-modal compact">
              <p className="eyebrow">Descanso</p><h2>Juego en pausa</h2>
              <button className="pixel-button primary" type="button" onClick={() => setPaused(false)}>Seguir jugando</button>
              <button className="pixel-button" type="button" onClick={() => { setPaused(false); setScreen("map"); }}>Volver al mapa</button>
            </div></div>
          )}

          {screen === "complete" && (
            <div className="modal-backdrop celebration"><div className="game-modal">
              <div className="big-icon">{activeLevel.boss ? <img className="completion-trophy" src="./assets/sprites/completion-trophy-v1.png" alt="Trofeo dorado con una huella de gato" /> : <img className="completion-cat" src={worldCatalog.find((world) => world.id === activeLevel.world)?.catAsset ?? "./assets/sprites/completion-cat-v1.png"} alt="Gatito feliz rescatado" />}</div><p className="eyebrow">{activeLevel.boss ? "¡Duelo ganado!" : "¡Gatito encontrado!"}</p>
              <h2>Pantalla {activeLevel.id} completada</h2>
              <p>Noa ha recogido {snapshot.apples} {snapshot.apples === 1 ? "manzana" : "manzanas"}. {activeLevel.world === 7 ? "La Reina Arcoíris guarda para siempre las insignias encontradas." : activeLevel.boss ? "El monstruo guardián ha dejado libre el camino." : "La siguiente aventura ya está abierta."}</p>
              <div className="completion-medals" aria-label="Medallas de esta pantalla"><span className="is-earned">★ Pantalla</span><span className={snapshot.stickers.length > 0 || progress.stickers.includes(activeLevel.items.find((item) => item.kind === "sticker")?.id ?? "") ? "is-earned" : ""}>★ Pegatina</span><span className={lives === MAX_LIVES ? "is-earned" : ""}>★ Sin perder vida</span></div>
              {snapshot.stickers.length > 0 && <p className="sticker-found"><PixelIcon kind="sparkle" /> {snapshot.stickers.length === 1 ? "Insignia guardada" : `${snapshot.stickers.length} insignias guardadas`} en el álbum.</p>}
              {activeLevel.world !== 7 && <button className="pixel-button primary" type="button" onClick={nextLevel}>{activeLevel.id === "A-3" ? "Seguir al bosque ▶" : "Siguiente pantalla ▶"}</button>}
              {activeLevel.world === 7 && <button className="pixel-button primary" type="button" onClick={() => setScreen("map")}>Volver al mapa secreto</button>}
              {activeLevel.world !== 7 && <button className="pixel-button" type="button" onClick={() => setScreen("map")}>Volver al mapa</button>}
            </div></div>
          )}

          {screen === "gameover" && (
            <div className="modal-backdrop"><div className="game-modal">
              <div className="big-icon"><GameAssetIcon kind="apple" /></div><p className="eyebrow">Casi, casi…</p><h2>¡Otra oportunidad!</h2>
              <p>Las tres vidas vuelven a estar listas. El camino ya te lo sabes.</p>
              <button className="pixel-button primary" type="button" onClick={() => beginLevel(activeIndex)}>Reintentar</button>
              <button className="pixel-button" type="button" onClick={() => setScreen("map")}>Volver al mapa</button>
            </div></div>
          )}

          {screen === "finished" && (
            <div className="modal-backdrop celebration"><div className="game-modal finale">
              <div className="cat-party" aria-hidden="true"><PixelIcon kind="cat" /><GameAssetIcon kind="apple" /><PixelIcon kind="cat" /><PixelIcon kind="yarn" /><PixelIcon kind="cat" /></div><p className="eyebrow">Aventura completada</p>
              <h2>¡Bravo, Super Noa!</h2><p>Los guardianes son ahora amigos de Noa. Los gatitos y la tripulación celebran una fiesta en el castillo. Fin… por ahora.</p>
              <button className="pixel-button primary" type="button" onClick={() => setScreen("map")}>Ver el mapa</button>
              <button className="pixel-button" type="button" onClick={() => setScreen("home")}>Ir al inicio</button>
            </div></div>
          )}
        </section>
      )}

      {showSettings && (
        <div className="modal-backdrop"><div className="game-modal settings-modal">
          <button className="modal-close" type="button" onClick={() => setShowSettings(false)} aria-label="Cerrar">×</button>
          <p className="eyebrow">A tu manera</p><h2>Ajustes de juego</h2>
          <p>Estos ajustes se guardan en este dispositivo.</p>
          <div className="settings-group">
            <label htmlFor="music-volume">Música <output>{Math.round(musicVolume)}%</output></label>
            <input id="music-volume" type="range" min="0" max="100" value={musicVolume} onChange={(event) => setMusicVolume(Number(event.target.value))} />
            <label htmlFor="effects-volume">Efectos <output>{Math.round(effectsVolume)}%</output></label>
            <input id="effects-volume" type="range" min="0" max="100" value={effectsVolume} onChange={(event) => setEffectsVolume(Number(event.target.value))} />
          </div>
          <div className="settings-toggle"><input id="reduce-motion" type="checkbox" checked={reduceMotion} onChange={(event) => setReduceMotion(event.target.checked)} /><label htmlFor="reduce-motion"><strong>Movimiento tranquilo</strong><small>Reduce destellos y animaciones rápidas.</small></label></div>
          <fieldset className="settings-controls"><legend>Controles táctiles</legend>
            <label><input type="radio" name="touch-controls" checked={touchControls === "auto"} onChange={() => setTouchControls("auto")} /> Automáticos en móvil</label>
            <label><input type="radio" name="touch-controls" checked={touchControls === "always"} onChange={() => setTouchControls("always")} /> Siempre visibles</label>
          </fieldset>
          <p className="settings-help"><strong>Teclado:</strong> flechas o A/D para caminar, espacio para saltar y X/K para lanzar lana. También puedes usar un mando.</p>
          <button className="pixel-button primary" type="button" onClick={() => setShowSettings(false)}>Listo</button>
        </div></div>
      )}

      {showHelp && (
        <div className="modal-backdrop"><div className="game-modal help-modal">
          <button className="modal-close" type="button" onClick={() => setShowHelp(false)} aria-label="Cerrar">×</button>
          <p className="eyebrow">Ayuda a Noa</p><h2>¿Cómo se juega?</h2>
          <p className="help-intro">¡Camina, salta y busca caminos secretos!</p>
          <div className="help-first-steps">
            <div><b>1</b><span className="help-control-icon">◀ ▶</span><strong>Camina</strong><small>Mantén pulsada una flecha.</small></div>
            <div className="help-double-jump"><b>2</b><span className="help-control-icon">↑ + ↑</span><strong>Haz un doble salto</strong><small>Toca <em>SALTAR</em>. En el aire, ¡tócalo otra vez!</small></div>
            <div><b>3</b><span className="help-control-icon">▣</span><strong>Abre las cajas</strong><small>Salta y golpea la caja por debajo.</small></div>
          </div>
          <p className="help-mobile-tip"><strong>En móvil:</strong> puedes mantener una flecha con un dedo y tocar <b>SALTAR</b> con el otro.</p>
          <div className="help-grid">
            <div><span><PixelIcon kind="yarn" /></span><strong>Bola de lana</strong><small>Cuando Noa tenga orejas de gato, toca <b>LANA</b>.</small></div>
            <div><span><GameAssetIcon kind="apple" /></span><strong>Manzana escudo</strong><small>La manzana salva a Noa de un golpe.</small></div>
            <div><span className="help-rps"><PixelIcon kind="rock" /><PixelIcon kind="paper" /><PixelIcon kind="scissors" /></span><strong>Duelo final</strong><small>Gana dos rondas de piedra, papel o tijera.</small></div>
            <div><span><PixelIcon kind="sparkle" /></span><strong>Mira arriba</strong><small>Las pegatinas se esconden en caminos altos.</small></div>
          </div>
          <p className="help-note">Con teclado: A/D o flechas para caminar, espacio para saltar y X/K para lanzar lana. También puedes usar un mando. En el agua, SALTAR da una brazada hacia arriba; al soltarlo, Noa baja despacito y puede caminar por la arena. ¡Los erizos pinchan!</p>
          <button className="pixel-button primary" type="button" onClick={() => { setShowHelp(false); setScreen("map"); }}>¡Lista para jugar!</button>
        </div></div>
      )}

      {showCredits && (
        <div className="modal-backdrop"><div className="game-modal credits-modal">
          <button className="modal-close" type="button" onClick={() => setShowCredits(false)} aria-label="Cerrar">×</button>
          <p className="eyebrow">Hecho con cariño</p><h2>Créditos</h2>
          <p><strong>Super Noa</strong> es un juego original inspirado en los plataformas familiares de 8 bits.</p>
          <p>Personaje creado para este proyecto a partir de referencias privadas. Las fotografías originales no forman parte de la web.</p>
          <p>Música de los primeros cinco mundos: <a href="https://opengameart.org/content/platformer-chiptunes" target="_blank" rel="noreferrer">Platformer Chiptunes</a>, de Guy G. Gamerson, publicada bajo licencia CC0. La música del castillo y de la laguna son composiciones originales sintetizadas para Super Noa.</p>
          <p>Los guardianes finales y las miniaturas pixel art de los mundos son diseños originales generados para este proyecto. Efectos de sonido generados en el navegador; escenarios jugables, interfaz y código creados para Super Noa.</p>
          <button className="pixel-button primary" type="button" onClick={() => setShowCredits(false)}>Cerrar</button>
        </div></div>
      )}

      {showAlbum && (
        <div className="modal-backdrop"><div className="game-modal album-modal">
          <button className="modal-close" type="button" onClick={() => setShowAlbum(false)} aria-label="Cerrar">×</button>
          <p className="eyebrow">Colección de Noa</p><h2>{collectionTab === "stickers" ? "Álbum de pegatinas" : collectionTab === "bosses" ? "Jefes amigos" : "Postales de viaje"}</h2>
          <div className="collection-tabs" aria-label="Ver colección">
            <button className={collectionTab === "stickers" ? "is-active" : ""} type="button" aria-pressed={collectionTab === "stickers"} onClick={() => setCollectionTab("stickers")}>Pegatinas</button>
            <button className={collectionTab === "bosses" ? "is-active" : ""} type="button" aria-pressed={collectionTab === "bosses"} onClick={() => setCollectionTab("bosses")}>Jefes amigos</button>
            <button className={collectionTab === "memories" ? "is-active" : ""} type="button" aria-pressed={collectionTab === "memories"} onClick={() => setCollectionTab("memories")}>Recuerdos</button>
          </div>
          {collectionTab === "stickers" ? <>
            <p>{progress.secretUnlocked ? "Hay una pegatina por pantalla y tres insignias en el reino secreto." : "Hay una pegatina escondida en la ruta elevada de cada pantalla."}</p>
            <div className="sticker-grid">
              {albumStickers.map((sticker) => {
                const found = progress.stickers.includes(sticker.id);
                const sprite = getStickerSprite(sticker.id);
                return (
                  <article className={`sticker-card ${found ? "is-found" : "is-locked"}`} key={sticker.id}>
                    <span className="sticker-frame" aria-hidden="true">{found && sprite ? <span className="sticker-sprite" style={{ backgroundImage: `url(${sprite.src})`, backgroundPosition: `${sprite.column * 50}% center` }} /> : "?"}</span>
                    <strong>{found ? sticker.name : `Mundo ${sticker.world}`}</strong>
                    <small>{found ? "¡Encontrada!" : sticker.hint}</small>
                  </article>
                );
              })}
            </div>
            <p className="album-progress"><PixelIcon kind="sparkle" /> {progress.stickers.filter((id) => albumStickers.some((sticker) => sticker.id === id)).length} de {albumStickers.length}</p>
          </> : collectionTab === "bosses" ? <>
            <p>Gana un duelo para hacerte amiga de cada guardián. Después podréis jugar otra vez.</p>
            <div className="boss-friends-grid">
              {bossLevels.map(({ level, index, boss }) => {
                const known = Boolean(progress.levelStats[level.id]?.completed);
                const challengeDone = Boolean(progress.bossChallenges[level.boss ?? ""]);
                return (
                  <article className={`boss-friend-card ${known ? "is-friend" : "is-mystery"} ${challengeDone ? "has-challenge-frame" : ""}`} key={level.id}>
                    <span className="boss-friend-world">{level.world === 7 ? (progress.secretUnlocked ? "Mundo secreto" : "Mundo misterioso") : level.world === 8 ? "Mundo del agua" : `Mundo ${level.world}`}</span>
                    <div className="boss-friend-portrait" aria-hidden="true">
                      {known ? <img src={`${boss.assetPrefix}-0.png`} alt="" /> : <span className="boss-mystery-shape">?</span>}
                    </div>
                    <strong>{known ? boss.name : "Amigo por descubrir"}</strong>
                    {known ? <>{challengeDone && <small className="challenge-frame-label">★ Marco especial conseguido</small>}<button type="button" onClick={() => replayBoss(index)}>Jugar otra vez</button></> : <small>Gana su duelo para conocerlo.</small>}
                  </article>
                );
              })}
            </div>
            <p className="album-progress">★ {knownBosses} de {bossLevels.length} amigos</p>
          </> : <>
            <p>Termina todas las pantallas de un mundo para guardar una postal con el gatito que conociste allí.</p>
            <div className="memory-grid">
              {worldCatalog.map((world) => {
                const memory = worldProgress[world.id];
                return (
                  <article className={`memory-card world-${world.id} ${memory.remembered ? "is-remembered" : "is-locked"}`} key={world.id}>
                    <img className="memory-world-art" src={`./assets/worlds/world-${world.id}.png`} alt="" aria-hidden="true" />
                    <div className="memory-content">
                      <span>{world.id === 7 ? "Mundo secreto" : world.id === 8 ? "Mundo del agua" : `Mundo ${world.id}`}</span>
                      {memory.remembered ? <><img className="memory-cat" src={world.catAsset} alt={`${world.cat}, el gatito amigo de ${world.name}`} /><strong>{world.cat}</strong><small>{world.name}</small><em>★ {memory.complete + memory.stickers + memory.flawless} medallas de aventura</em></> : <><b className="memory-lock">?</b><strong>Postal por descubrir</strong><small>{memory.complete}/{memory.total} pantallas completadas</small></>}
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="album-progress">✉ {Object.values(worldProgress).filter((world) => world.remembered).length} de {worldCatalog.length} postales guardadas</p>
          </>}
          <button className="pixel-button primary" type="button" onClick={() => setShowAlbum(false)}>Seguir explorando</button>
        </div></div>
      )}
    </main>
  );
}
